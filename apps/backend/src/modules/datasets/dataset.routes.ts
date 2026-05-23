import { Router, type Router as ExpressRouter } from 'express';

import { requireSession } from '../../middleware/require-session.js';
import {
  createDatasetController,
  createDatasetVersionController,
  getDatasetDetailsController,
  listDatasetsController,
} from './dataset.controller.js';

export const datasetRouter: ExpressRouter = Router();

datasetRouter.get('/', requireSession, listDatasetsController);
datasetRouter.post('/', requireSession, createDatasetController);
datasetRouter.get('/:datasetId', requireSession, getDatasetDetailsController);
datasetRouter.post('/:datasetId/versions', requireSession, createDatasetVersionController);
