import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import restaurantsRouter from './routes/restaurants';
import checklistsRouter from './routes/checklists';
import inspectionsRouter from './routes/inspections';
import correctiveActionsRouter from './routes/correctiveActions';
import alertsRouter from './routes/alerts';
import dashboardRouter from './routes/dashboard';
import reportsRouter from './routes/reports';
import { requestId, accessLog, errorHandler, logger } from './logger';
import pool from './db';

const SERVICE_STARTED_AT = Date.now();

const app = express();
const PORT = process.env.PORT || 4000;

// Request ID + structured access log must run before anything that could error,
// so every entry in the logs is correlatable by requestId.
app.use(requestId);
app.use(accessLog);

// Security headers (XSS, clickjacking, MIME sniffing, etc.). CSP is off by
// default because the API is a JSON service — the browser surfaces are set
// on the Next.js side. crossOriginResourcePolicy relaxed to cross-origin so
// the SPA on a different port can consume responses.
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// Gzip all eligible responses. The dashboard payload is dominated by JSON
// arrays — compression cuts wire size by ~70% in local benchmarking.
app.use(compression());

// Expose request ID through CORS so the browser can read it and surface it
// in error toasts / support tickets.
app.use(
  cors({
    exposedHeaders: ['X-Request-Id'],
  })
);
app.use(express.json());

// Rate limiting — 300 requests per minute per IP for general API
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' },
});

// Stricter limit for write operations — 60 per minute per IP
const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many write requests, please slow down.' },
});

app.use('/api', apiLimiter);

// Health check — liveness + database readiness probe. Returns 503 if the
// DB is unreachable so orchestrators (Kubernetes, Render, Railway, etc.)
// can cut traffic until the dependency recovers.
app.get('/health', async (_req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - SERVICE_STARTED_AT) / 1000);
  const base = {
    service: 'restaurant-guard-api',
    version: process.env.APP_VERSION || '1.0.0',
    timestamp: new Date().toISOString(),
    uptime_seconds: uptimeSeconds,
  };

  try {
    const start = Date.now();
    await pool.query('SELECT 1');
    const dbLatencyMs = Date.now() - start;
    res.json({
      ...base,
      status: 'ok',
      database: { status: 'ok', latency_ms: dbLatencyMs },
    });
  } catch (err: any) {
    logger.error({ msg: 'health check: db unreachable', err: err?.message });
    res.status(503).json({
      ...base,
      status: 'degraded',
      database: { status: 'unreachable', error: err?.message || 'unknown' },
    });
  }
});

// Prometheus / OpenMetrics scrape endpoint. SafeGSA + WedgeOps parity —
// every Factory service emits a service-prefixed metric set so a single
// scrape config covers the whole portfolio. /metrics stays scrapeable even
// when the DB is degraded: the uptime gauge keeps reporting and DB-backed
// counters fall back to -1 (distinguishable from a real zero on the SOC
// dashboard).
app.get('/metrics', async (_req, res) => {
  const uptimeSeconds = Math.floor((Date.now() - SERVICE_STARTED_AT) / 1000);
  const version = process.env.APP_VERSION || '1.0.0';
  const escape = (v: string) =>
    v.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n');

  let restaurants = -1;
  let inspections = -1;
  let openActions = -1;
  let dbStatus = 0;
  let dbLatencyMs = -1;
  try {
    const start = Date.now();
    const result = await pool.query<{
      restaurants: string;
      inspections: string;
      open_actions: string;
    }>(
      `SELECT
         (SELECT COUNT(*)::bigint FROM restaurants)              AS restaurants,
         (SELECT COUNT(*)::bigint FROM inspections)              AS inspections,
         (SELECT COUNT(*)::bigint FROM corrective_actions
           WHERE status IS DISTINCT FROM 'closed')               AS open_actions`
    );
    const row = result.rows[0];
    restaurants = row ? Number(row.restaurants) : 0;
    inspections = row ? Number(row.inspections) : 0;
    openActions = row ? Number(row.open_actions) : 0;
    dbStatus = 1;
    dbLatencyMs = Date.now() - start;
  } catch (err: any) {
    logger.error({ msg: 'metrics: db query failed', err: err?.message });
  }

  const lines: string[] = [];
  lines.push('# HELP restaurantguard_info Build identity. version is the deploy SHA or tag.');
  lines.push('# TYPE restaurantguard_info gauge');
  lines.push(`restaurantguard_info{version="${escape(version)}"} 1`);
  lines.push('# HELP restaurantguard_uptime_seconds Process uptime in seconds.');
  lines.push('# TYPE restaurantguard_uptime_seconds gauge');
  lines.push(`restaurantguard_uptime_seconds ${uptimeSeconds}`);
  lines.push('# HELP restaurantguard_db_up 1 if the last DB probe succeeded.');
  lines.push('# TYPE restaurantguard_db_up gauge');
  lines.push(`restaurantguard_db_up ${dbStatus}`);
  lines.push('# HELP restaurantguard_db_latency_ms Last DB SELECT round-trip in ms.');
  lines.push('# TYPE restaurantguard_db_latency_ms gauge');
  lines.push(`restaurantguard_db_latency_ms ${dbLatencyMs}`);
  lines.push('# HELP restaurantguard_restaurants_total Total restaurants in inventory.');
  lines.push('# TYPE restaurantguard_restaurants_total gauge');
  lines.push(`restaurantguard_restaurants_total ${restaurants}`);
  lines.push('# HELP restaurantguard_inspections_total Total inspection records.');
  lines.push('# TYPE restaurantguard_inspections_total counter');
  lines.push(`restaurantguard_inspections_total ${inspections}`);
  lines.push('# HELP restaurantguard_open_corrective_actions Open or in-progress corrective actions.');
  lines.push('# TYPE restaurantguard_open_corrective_actions gauge');
  lines.push(`restaurantguard_open_corrective_actions ${openActions}`);
  lines.push('# EOF');

  res.set('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
  res.set('Cache-Control', 'no-store');
  res.send(lines.join('\n') + '\n');
});

// Routes (write limiter applied to all mutation-capable route groups)
app.use('/api/restaurants', writeLimiter, restaurantsRouter);
app.use('/api/checklists', writeLimiter, checklistsRouter);
app.use('/api/inspections', writeLimiter, inspectionsRouter);
app.use('/api/corrective-actions', writeLimiter, correctiveActionsRouter);
app.use('/api/alerts', writeLimiter, alertsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/reports', reportsRouter);

// Last-resort error handler — keeps stack traces out of responses, logs them
// with request ID so support can trace a reported failure.
app.use(errorHandler);

app.listen(PORT, () => {
  logger.info({ msg: 'restaurant-guard-api listening', port: PORT });
});
