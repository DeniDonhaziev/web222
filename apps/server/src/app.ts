import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './lib/env.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { dronesRouter } from './modules/drones/drones.routes.js';
import { ordersRouter } from './modules/orders/orders.routes.js';
import { trackingRouter } from './modules/tracking/tracking.routes.js';
import { paymentsRouter } from './modules/payments/payments.routes.js';
import { adminRouter } from './modules/admin/admin.routes.js';
import { notificationsRouter } from './modules/notifications/notifications.routes.js';
import { complaintsRouter } from './modules/complaints/complaints.routes.js';

export function createApp() {
  const app = express();

  app.use(helmet());
  app.use(cors({ origin: env.clientOrigin, credentials: true }));
  app.use(express.json());
  app.use(morgan('dev'));

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  app.use('/api/auth', authRouter);
  app.use('/api/drones', dronesRouter);
  app.use('/api/orders', ordersRouter);
  app.use('/api/orders', trackingRouter);
  app.use('/api/payments', paymentsRouter);
  app.use('/api/admin', adminRouter);
  app.use('/api/notifications', notificationsRouter);
  app.use('/api/complaints', complaintsRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
