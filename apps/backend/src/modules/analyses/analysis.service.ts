import { AppError } from '../../lib/app-error.js';
import { findDatasetById, findDatasetVersionById } from '../datasets/dataset.repository.js';
import {
  createAnalysis,
  findAnalysisById,
  listAnalysesByUser,
  listAnalysisEvents,
} from './analysis.repository.js';

export function listUserAnalyses(userId: string) {
  return listAnalysesByUser(userId);
}

export function getUserAnalysisDetails(analysisId: string, userId: string) {
  const analysis = findAnalysisById(analysisId);

  if (!analysis || analysis.userId !== userId) {
    throw new AppError('Анализ не найден', 404);
  }

  return {
    ...analysis,
    events: listAnalysisEvents(analysis.id),
  };
}

export function createUserAnalysis(input: { userId: string; datasetVersionId: string }) {
  const datasetVersion = findDatasetVersionById(input.datasetVersionId);

  if (!datasetVersion || datasetVersion.userId !== input.userId) {
    throw new AppError('Версия датасета не найдена', 404);
  }

  const dataset = findDatasetById(datasetVersion.datasetId);

  if (!dataset || dataset.userId !== input.userId) {
    throw new AppError('Датасет не найден', 404);
  }

  return createAnalysis({
    userId: input.userId,
    datasetId: dataset.id,
    datasetVersionId: datasetVersion.id,
  });
}
