import { Router, type Router as ExpressRouter } from 'express';

import { requireSession } from '../../middleware/require-session.js';
import {
  createDatasetController,
  createDatasetVersionController,
  deleteDatasetController,
  downloadDatasetController,
  getDatasetDetailsController,
  listDatasetsController,
  updateDatasetDraftController,
} from './dataset.controller.js';

export const datasetRouter: ExpressRouter = Router();

datasetRouter.get('/', requireSession, listDatasetsController);
datasetRouter.post('/', requireSession, createDatasetController);
datasetRouter.get('/:datasetId/download', requireSession, downloadDatasetController);
datasetRouter.get('/:datasetId', requireSession, getDatasetDetailsController);
datasetRouter.delete('/:datasetId', requireSession, deleteDatasetController);
datasetRouter.post('/:datasetId/versions', requireSession, createDatasetVersionController);
datasetRouter.patch(
  '/:datasetId/versions/:versionId/draft',
  requireSession,
  updateDatasetDraftController,
);
