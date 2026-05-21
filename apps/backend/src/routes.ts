import type { Express } from 'express';

import { authRouter } from './modules/auth/auth.routes.js';
import { healthRouter } from './modules/health/health.routes.js';

export function registerRoutes(app: Express) {
  app.use('/api/auth', authRouter);
  app.use('/api/health', healthRouter);
}
