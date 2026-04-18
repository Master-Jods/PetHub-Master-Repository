import express from 'express';
import cors from 'cors';
import bookingsRouter from './routes/bookings.js';
import customersRouter from './routes/customers.js';
import ordersRouter from './routes/orders.js';
import reviewsRouter from './routes/reviews.js';
import ridersRouter from './routes/riders.js';
import inventoryRouter from './routes/inventory.js';
import analyticsRouter from './routes/analytics.js';
import settingsRouter from './routes/settings.js';
import dashboardRouter from './routes/dashboard.js';
import announcementsRouter from './routes/announcements.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/bookings', bookingsRouter);
app.use('/api/customers', customersRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/riders', ridersRouter);
app.use('/api/inventory', inventoryRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/announcements', announcementsRouter);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

const port = process.env.PORT || 4000;
const server = app.listen(port, () => {
  console.log(`Bookings API running on port ${port}`);
});
let isShuttingDown = false;

server.on('error', (error) => {
  console.error('Backend-Admin server failed:', error);
  process.exit(1);
});

const shutdown = () => {
  if (isShuttingDown) {
    return;
  }

  isShuttingDown = true;
  server.close(() => {
    process.exit(0);
  });
};

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);

// Keep the process attached in environments that aggressively exit after startup.
process.stdin.resume();
