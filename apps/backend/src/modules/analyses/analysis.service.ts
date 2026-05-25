import { AppError } from '../../lib/app-error.js';
import {
  findDatasetById,
  findDatasetVersionById,
  updateDatasetVersionStatus,
} from '../datasets/dataset.repository.js';
import { enhanceAnalysisSnapshotWithAi } from './analysis.ai.js';
import { buildAnalysisSnapshot } from './analysis.pipeline.js';
import {
  createAnalysis,
  createAnalysisEvent,
  findAnalysisById,
  listAnalysesByUser,
  listAnalysisEvents,
  saveAnalysisSnapshot,
  updateAnalysisStatus,
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

export async function createUserAnalysis(input: { userId: string; datasetVersionId: string }) {
  const datasetVersion = findDatasetVersionById(input.datasetVersionId);

  if (!datasetVersion || datasetVersion.userId !== input.userId) {
    throw new AppError('Версия датасета не найдена', 404);
  }

  const dataset = findDatasetById(datasetVersion.datasetId);

  if (!dataset || dataset.userId !== input.userId) {
    throw new AppError('Датасет не найден', 404);
  }

  const analysis = createAnalysis({
    userId: input.userId,
    datasetId: dataset.id,
    datasetVersionId: datasetVersion.id,
  });

  try {
    updateDatasetVersionStatus({
      datasetVersionId: datasetVersion.id,
      status: 'processing',
    });
    updateAnalysisStatus({
      analysisId: analysis.id,
      status: 'processing',
    });
    createAnalysisEvent({
      analysisId: analysis.id,
      level: 'info',
      stage: 'etl',
      message: 'ETL and analytics pipeline started',
    });

    const snapshot = await buildAnalysisSnapshot(datasetVersion);

    createAnalysisEvent({
      analysisId: analysis.id,
      level: snapshot.status === 'partial_success' ? 'warning' : 'info',
      stage: 'diagnostics',
      message: 'Rule-based diagnostics and recommendations generated',
      payload: {
        status: snapshot.status,
        acceptedRows: snapshot.dataQuality.acceptedRows,
        warnings: snapshot.dataQuality.warnings,
      },
    });

    const aiEnhancement = await enhanceAnalysisSnapshotWithAi(snapshot);

    createAnalysisEvent({
      analysisId: analysis.id,
      level: aiEnhancement.status === 'applied' ? 'info' : 'warning',
      stage: 'ai',
      message: aiEnhancement.message,
      payload: aiEnhancement.payload ?? null,
    });

    const completedAnalysis = saveAnalysisSnapshot({
      analysisId: analysis.id,
      ...aiEnhancement.snapshot,
    });

    updateDatasetVersionStatus({
      datasetVersionId: datasetVersion.id,
      status: 'ready',
      dataQuality: aiEnhancement.snapshot.dataQuality,
    });

    return completedAnalysis;
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown analysis error';

    createAnalysisEvent({
      analysisId: analysis.id,
      level: 'error',
      stage: 'snapshot',
      message,
    });

    updateDatasetVersionStatus({
      datasetVersionId: datasetVersion.id,
      status: 'failed',
    });

    return updateAnalysisStatus({
      analysisId: analysis.id,
      status: 'failed',
      errorMessage: message,
    });
  }
}
