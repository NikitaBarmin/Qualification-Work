export type AnalysisStatus = 'queued' | 'processing' | 'completed' | 'partial_success' | 'failed';
export type AnalysisEventLevel = 'info' | 'warning' | 'error';
export type AnalysisEventStage =
  | 'upload'
  | 'mapping'
  | 'etl'
  | 'duckdb'
  | 'diagnostics'
  | 'ai'
  | 'snapshot';

export interface IAnalysisRecord {
  id: string;
  datasetId: string;
  datasetVersionId: string;
  userId: string;
  status: AnalysisStatus;
  dataQuality: Record<string, unknown> | null;
  kpiMetrics: Record<string, unknown> | null;
  chartsData: Record<string, unknown> | null;
  diagnostics: Record<string, unknown> | null;
  segments: Record<string, unknown> | null;
  cohorts: Record<string, unknown> | null;
  anomalies: Record<string, unknown> | null;
  tradeoffs: Record<string, unknown> | null;
  swotResults: Record<string, unknown> | null;
  aiRecommendations: Record<string, unknown> | null;
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
}

export interface IAnalysisEventRecord {
  id: string;
  analysisId: string;
  level: AnalysisEventLevel;
  stage: AnalysisEventStage;
  message: string;
  payload: Record<string, unknown> | null;
  createdAt: string;
}
