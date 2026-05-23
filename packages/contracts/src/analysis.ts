import type { IDataQualityReport } from './dataset';

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

export type AnalysisMetricId =
  | 'drr'
  | 'romi'
  | 'ltv'
  | 'cac'
  | 'ltvCacRatio'
  | 'cpo'
  | 'cr'
  | 'retentionRate';

export interface ICreateAnalysisRequest {
  datasetVersionId: string;
}

export interface IAnalysisMetricValue {
  id: AnalysisMetricId;
  value: number | null;
  unit: 'RUB' | 'percent' | 'ratio' | 'number';
}

export interface IChartPoint {
  label: string;
  value: number;
}

export interface IDiagnosticRecommendation {
  id: string;
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  evidence: Record<string, unknown>;
}

export interface IDiagnosticResult {
  summary: string[];
  recommendations: IDiagnosticRecommendation[];
  risks: Array<{
    id: string;
    title: string;
    description: string;
    evidence: Record<string, unknown>;
  }>;
}

export interface IAiRecommendation {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high';
}

export interface ISwotResult {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface IAnalysisEvent {
  id: string;
  analysisId: string;
  level: AnalysisEventLevel;
  stage: AnalysisEventStage;
  message: string;
  payload: Record<string, unknown> | null;
  createdAt: string;
}

export interface IAnalysisSnapshot {
  id: string;
  datasetId: string;
  datasetVersionId: string;
  status: AnalysisStatus;
  dataQuality: IDataQualityReport | null;
  metrics: IAnalysisMetricValue[];
  charts: Record<string, IChartPoint[]>;
  diagnostics: IDiagnosticResult | null;
  segments: Record<string, unknown> | null;
  cohorts: Record<string, unknown> | null;
  anomalies: Record<string, unknown> | null;
  tradeoffs: Record<string, unknown> | null;
  swot: ISwotResult | null;
  recommendations: IAiRecommendation[];
  errorMessage: string | null;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
}

export interface IAnalysisListItem {
  id: string;
  datasetId: string;
  datasetVersionId: string;
  status: AnalysisStatus;
  createdAt: string;
  completedAt: string | null;
}
