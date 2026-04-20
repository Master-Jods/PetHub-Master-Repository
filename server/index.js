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

const app = express();

const allowedOrigins = (process.env.CORS_ORIGINS || [
  'https://pethub-customer.vercel.app',
  'https://pethub-admin-three.vercel.app',
  'https://pethub-lemon.vercel.app',
].join(','))
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }

    callback(new Error(`CORS blocked for origin: ${origin}`));
  },
}));
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

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`Bookings API running on port ${port}`);
});
