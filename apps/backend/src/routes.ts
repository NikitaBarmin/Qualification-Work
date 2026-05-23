import type { Express } from 'express';

import { analysisRouter } from './modules/analyses/analysis.routes.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { datasetRouter } from './modules/datasets/dataset.routes.js';
import { healthRouter } from './modules/health/health.routes.js';
import { uploadRouter } from './modules/uploads/upload.routes.js';

export function registerRoutes(app: Express) {
  app.use('/api/auth', authRouter);
  app.use('/api/uploads', uploadRouter);
  app.use('/api/datasets', datasetRouter);
  app.use('/api/analyses', analysisRouter);
  app.use('/api/health', healthRouter);
}
