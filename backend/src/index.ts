import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import restaurantsRouter from './routes/restaurants';
import checklistsRouter from './routes/checklists';
import inspectionsRouter from './routes/inspections';
import correctiveActionsRouter from './routes/correctiveActions';
import alertsRouter from './routes/alerts';
import dashboardRouter from './routes/dashboard';
import reportsRouter from './routes/reports';
import { requestId, accessLog, errorHandler, logger } from './logger';

const app = express();
const PORT = process.env.PORT || 4000;

// Request ID + structured access log must run before anything that could error,
// so every entry in the logs is correlatable by requestId.
app.use(requestId);
app.use(accessLog);

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

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'restaurant-guard-api', timestamp: new Date().toISOString() });
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
