export type AnalysisStatus = 'queued' | 'processing' | 'completed' | 'partial_success' | 'failed';

export interface IAnalysisMetric {
  id: string;
  label: string;
  value: number | string;
  unit?: string;
}

export interface IAnalysisListItem {
  id: string;
  userId: string;
  datasetId: string;
  datasetVersionId: string;
  title: string;
  status: AnalysisStatus;
  createdAt: string;
  completedAt: string | null;
}

export interface IAnalysisDetails extends IAnalysisListItem {
  kpiMetrics: Record<string, unknown> | null;
  diagnostics: Record<string, unknown> | null;
  recommendations: Record<string, unknown> | null;
  swot: Record<string, unknown> | null;
  chartsConfig: Record<string, unknown> | null;
}

export interface ICreateAnalysisPayload {
  datasetId: string;
  datasetVersionId: string;
  title?: string;
}
