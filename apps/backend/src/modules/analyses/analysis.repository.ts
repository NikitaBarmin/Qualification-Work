import { randomUUID } from 'node:crypto';

import { getSqliteClient } from '../../db/sqlite.js';
import type {
  AnalysisEventLevel,
  AnalysisEventStage,
  AnalysisStatus,
  IAnalysisEventRecord,
  IAnalysisRecord,
} from './analysis.types.js';

interface IAnalysisRow {
  id: string;
  dataset_id: string;
  dataset_version_id: string;
  user_id: string;
  status: AnalysisStatus;
  data_quality_json: string | null;
  kpi_metrics_json: string | null;
  charts_data_json: string | null;
  diagnostics_json: string | null;
  segments_json: string | null;
  cohorts_json: string | null;
  anomalies_json: string | null;
  tradeoffs_json: string | null;
  swot_results_json: string | null;
  ai_recommendations_json: string | null;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
  created_at: string;
}

interface IAnalysisEventRow {
  id: string;
  analysis_id: string;
  level: AnalysisEventLevel;
  stage: AnalysisEventStage;
  message: string;
  payload_json: string | null;
  created_at: string;
}

function parseJson(value: string | null): Record<string, unknown> | null {
  return value ? (JSON.parse(value) as Record<string, unknown>) : null;
}

function mapAnalysis(row: IAnalysisRow): IAnalysisRecord {
  return {
    id: row.id,
    datasetId: row.dataset_id,
    datasetVersionId: row.dataset_version_id,
    userId: row.user_id,
    status: row.status,
    dataQuality: parseJson(row.data_quality_json),
    kpiMetrics: parseJson(row.kpi_metrics_json),
    chartsData: parseJson(row.charts_data_json),
    diagnostics: parseJson(row.diagnostics_json),
    segments: parseJson(row.segments_json),
    cohorts: parseJson(row.cohorts_json),
    anomalies: parseJson(row.anomalies_json),
    tradeoffs: parseJson(row.tradeoffs_json),
    swotResults: parseJson(row.swot_results_json),
    aiRecommendations: parseJson(row.ai_recommendations_json),
    errorMessage: row.error_message,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    createdAt: row.created_at,
  };
}

function mapAnalysisEvent(row: IAnalysisEventRow): IAnalysisEventRecord {
  return {
    id: row.id,
    analysisId: row.analysis_id,
    level: row.level,
    stage: row.stage,
    message: row.message,
    payload: parseJson(row.payload_json),
    createdAt: row.created_at,
  };
}

export function createAnalysis(input: {
  userId: string;
  datasetId: string;
  datasetVersionId: string;
}): IAnalysisRecord {
  const analysisId = randomUUID();

  getSqliteClient()
    .prepare(
      `
        INSERT INTO analyses (
          id,
          dataset_id,
          dataset_version_id,
          user_id,
          status
        )
        VALUES (?, ?, ?, ?, 'queued')
      `,
    )
    .run(analysisId, input.datasetId, input.datasetVersionId, input.userId);

  createAnalysisEvent({
    analysisId,
    level: 'info',
    stage: 'snapshot',
    message: 'Analysis job created',
  });

  const createdAnalysis = findAnalysisById(analysisId);

  if (!createdAnalysis) {
    throw new Error('Created analysis was not found');
  }

  return createdAnalysis;
}

export function updateAnalysisStatus(input: {
  analysisId: string;
  status: AnalysisStatus;
  errorMessage?: string | null;
}): IAnalysisRecord {
  getSqliteClient()
    .prepare(
      `
        UPDATE analyses
        SET
          status = ?,
          error_message = ?,
          completed_at = CASE
            WHEN ? IN ('completed', 'partial_success', 'failed') THEN CURRENT_TIMESTAMP
            ELSE completed_at
          END
        WHERE id = ?
      `,
    )
    .run(input.status, input.errorMessage ?? null, input.status, input.analysisId);

  const updatedAnalysis = findAnalysisById(input.analysisId);

  if (!updatedAnalysis) {
    throw new Error('Updated analysis was not found');
  }

  return updatedAnalysis;
}

export function saveAnalysisSnapshot(input: {
  analysisId: string;
  status: AnalysisStatus;
  dataQuality: unknown;
  kpiMetrics: unknown;
  chartsData: unknown;
  diagnostics: unknown;
  segments: unknown;
  cohorts: unknown;
  anomalies: unknown;
  tradeoffs: unknown;
  swotResults: unknown;
  recommendations: unknown;
}): IAnalysisRecord {
  getSqliteClient()
    .prepare(
      `
        UPDATE analyses
        SET
          status = ?,
          data_quality_json = ?,
          kpi_metrics_json = ?,
          charts_data_json = ?,
          diagnostics_json = ?,
          segments_json = ?,
          cohorts_json = ?,
          anomalies_json = ?,
          tradeoffs_json = ?,
          swot_results_json = ?,
          ai_recommendations_json = ?,
          error_message = NULL,
          completed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `,
    )
    .run(
      input.status,
      JSON.stringify(input.dataQuality),
      JSON.stringify(input.kpiMetrics),
      JSON.stringify(input.chartsData),
      JSON.stringify(input.diagnostics),
      JSON.stringify(input.segments),
      JSON.stringify(input.cohorts),
      JSON.stringify(input.anomalies),
      JSON.stringify(input.tradeoffs),
      JSON.stringify(input.swotResults),
      JSON.stringify(input.recommendations),
      input.analysisId,
    );

  const updatedAnalysis = findAnalysisById(input.analysisId);

  if (!updatedAnalysis) {
    throw new Error('Updated analysis was not found');
  }

  return updatedAnalysis;
}

export function findAnalysisById(analysisId: string): IAnalysisRecord | null {
  const row = getSqliteClient()
    .prepare(
      `
        SELECT
          id,
          dataset_id,
          dataset_version_id,
          user_id,
          status,
          data_quality_json,
          kpi_metrics_json,
          charts_data_json,
          diagnostics_json,
          segments_json,
          cohorts_json,
          anomalies_json,
          tradeoffs_json,
          swot_results_json,
          ai_recommendations_json,
          error_message,
          started_at,
          completed_at,
          created_at
        FROM analyses
        WHERE id = ?
      `,
    )
    .get(analysisId) as IAnalysisRow | undefined;

  return row ? mapAnalysis(row) : null;
}

export function listAnalysesByUser(userId: string): IAnalysisRecord[] {
  const rows = getSqliteClient()
    .prepare(
      `
        SELECT
          id,
          dataset_id,
          dataset_version_id,
          user_id,
          status,
          data_quality_json,
          kpi_metrics_json,
          charts_data_json,
          diagnostics_json,
          segments_json,
          cohorts_json,
          anomalies_json,
          tradeoffs_json,
          swot_results_json,
          ai_recommendations_json,
          error_message,
          started_at,
          completed_at,
          created_at
        FROM analyses
        WHERE user_id = ?
        ORDER BY created_at DESC
      `,
    )
    .all(userId) as IAnalysisRow[];

  return rows.map(mapAnalysis);
}

export function findLatestAnalysisByDatasetVersionId(
  datasetVersionId: string,
): IAnalysisRecord | null {
  const row = getSqliteClient()
    .prepare(
      `
        SELECT
          id,
          dataset_id,
          dataset_version_id,
          user_id,
          status,
          data_quality_json,
          kpi_metrics_json,
          charts_data_json,
          diagnostics_json,
          segments_json,
          cohorts_json,
          anomalies_json,
          tradeoffs_json,
          swot_results_json,
          ai_recommendations_json,
          error_message,
          started_at,
          completed_at,
          created_at
        FROM analyses
        WHERE dataset_version_id = ?
          AND status IN ('completed', 'partial_success')
        ORDER BY created_at DESC
        LIMIT 1
      `,
    )
    .get(datasetVersionId) as IAnalysisRow | undefined;

  return row ? mapAnalysis(row) : null;
}

export function createAnalysisEvent(input: {
  analysisId: string;
  level: AnalysisEventLevel;
  stage: AnalysisEventStage;
  message: string;
  payload?: Record<string, unknown> | null;
}) {
  getSqliteClient()
    .prepare(
      `
        INSERT INTO analysis_events (
          id,
          analysis_id,
          level,
          stage,
          message,
          payload_json
        )
        VALUES (?, ?, ?, ?, ?, ?)
      `,
    )
    .run(
      randomUUID(),
      input.analysisId,
      input.level,
      input.stage,
      input.message,
      input.payload ? JSON.stringify(input.payload) : null,
    );
}

export function listAnalysisEvents(analysisId: string): IAnalysisEventRecord[] {
  const rows = getSqliteClient()
    .prepare(
      `
        SELECT id, analysis_id, level, stage, message, payload_json, created_at
        FROM analysis_events
        WHERE analysis_id = ?
        ORDER BY created_at ASC
      `,
    )
    .all(analysisId) as IAnalysisEventRow[];

  return rows.map(mapAnalysisEvent);
}
