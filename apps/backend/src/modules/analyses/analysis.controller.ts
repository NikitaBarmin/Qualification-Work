import type { RequestHandler } from 'express';

import { getAuthenticatedUser } from '../../middleware/require-session.js';
import { createAnalysisSchema } from './analysis.schemas.js';
import {
  createUserAnalysis,
  getUserAnalysisDetails,
  listUserAnalyses,
} from './analysis.service.js';

function getRouteParam(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] : (value ?? '');
}

export const listAnalysesController: RequestHandler = (request, response, next) => {
  try {
    const user = getAuthenticatedUser(request);

    response.status(200).json({ data: listUserAnalyses(user.id) });
  } catch (error) {
    next(error);
  }
};

export const createAnalysisController: RequestHandler = async (request, response, next) => {
  try {
    const user = getAuthenticatedUser(request);
    const payload = createAnalysisSchema.parse(request.body);

    response.status(201).json({
      data: await createUserAnalysis({
        userId: user.id,
        datasetVersionId: payload.datasetVersionId,
      }),
    });
  } catch (error) {
    next(error);
  }
};

export const getAnalysisDetailsController: RequestHandler = (request, response, next) => {
  try {
    const user = getAuthenticatedUser(request);

    response.status(200).json({
      data: getUserAnalysisDetails(getRouteParam(request.params.analysisId), user.id),
    });
  } catch (error) {
    next(error);
  }
};
