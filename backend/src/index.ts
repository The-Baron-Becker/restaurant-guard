import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import restaurantsRouter from './routes/restaurants';
import checklistsRouter from './routes/checklists';
import inspectionsRouter from './routes/inspections';
import correctiveActionsRouter from './routes/correctiveActions';
import alertsRouter from './routes/alerts';
import dashboardRouter from './routes/dashboard';

const app = express();
const PORT = process.env.PORT || 4000;

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

app.use(cors());
app.use(express.json());
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

app.listen(PORT, () => {
  console.log(`RestaurantGuard API running on port ${PORT}`);
});
