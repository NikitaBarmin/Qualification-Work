import type { Express } from 'express';

import { healthRouter } from './modules/health/health.routes.js';

export function registerRoutes(app: Express) {
  app.use('/api/health', healthRouter);
}
