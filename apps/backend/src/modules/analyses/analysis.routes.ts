import { Router, type Router as ExpressRouter } from 'express';

import { requireSession } from '../../middleware/require-session.js';
import {
  createAnalysisController,
  getAnalysisDetailsController,
  listAnalysesController,
} from './analysis.controller.js';

export const analysisRouter: ExpressRouter = Router();

analysisRouter.get('/', requireSession, listAnalysesController);
analysisRouter.post('/', requireSession, createAnalysisController);
analysisRouter.get('/:analysisId', requireSession, getAnalysisDetailsController);
