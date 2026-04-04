import express from 'express';
import cors from 'cors';
import restaurantsRouter from './routes/restaurants';
import checklistsRouter from './routes/checklists';
import inspectionsRouter from './routes/inspections';
import correctiveActionsRouter from './routes/correctiveActions';
import alertsRouter from './routes/alerts';
import dashboardRouter from './routes/dashboard';

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'restaurant-guard-api', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/restaurants', restaurantsRouter);
app.use('/api/checklists', checklistsRouter);
app.use('/api/inspections', inspectionsRouter);
app.use('/api/corrective-actions', correctiveActionsRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/dashboard', dashboardRouter);

app.listen(PORT, () => {
  console.log(`RestaurantGuard API running on port ${PORT}`);
});
