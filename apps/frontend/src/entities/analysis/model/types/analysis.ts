export type AnalysisStatus = 'queued' | 'processing' | 'completed' | 'partial_success' | 'failed';
export type AnalysisSeverity = 'low' | 'medium' | 'high';

export interface IAnalysisAggregate {
  revenue: number;
  spend: number;
  trafficLeads: number;
  newOrders: number;
  returningOrders: number;
  totalOrders: number;
  rowCount: number;
  roas: number;
  cac: number;
  aov: number;
  conversionRate: number;
  repeatOrderShare: number;
  profitProxy: number;
}

export interface IAnalysisDatePoint extends IAnalysisAggregate {
  date: string;
}

export interface IAnalysisChannelPoint extends IAnalysisAggregate {
  channel: string;
  revenueShare: number;
  spendShare: number;
}

export interface IDataQualityWarning {
  code: string;
  message: string;
}

export interface IDataQualityReport {
  totalRows: number;
  acceptedRows: number;
  rejectedRows: number;
  duplicateRows: number;
  missingRequiredColumns: string[];
  missingValueCounts: Record<string, number>;
  invalidValueCounts: Record<string, number>;
  warnings: IDataQualityWarning[];
}

export interface IAnalysisRecommendation {
  title: string;
  severity: AnalysisSeverity;
  category: 'growth' | 'efficiency' | 'risk' | 'retention' | 'data_quality';
  explanation: string;
  evidence: Record<string, unknown>;
  suggestedAction: string;
}

export interface IAnalysisRecommendations {
  items: IAnalysisRecommendation[];
  generatedBy: string;
}

export interface ISwotResults {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface IAnalysisDiagnostics {
  bestChannels: IAnalysisChannelPoint[];
  efficientChannels: IAnalysisChannelPoint[];
  inefficientChannels: IAnalysisChannelPoint[];
  concentrationRisk: {
    channel: string;
    revenueShare: number;
  } | null;
  summary: {
    totalChannels: number;
    averageRoas: number;
    averageCac: number;
  };
}

export interface IAnalysisAnomaly {
  date: string;
  revenue: number;
  spend: number;
  reason: string;
}

export interface IAnalysisAnomalies {
  items: IAnalysisAnomaly[];
  summary: string;
}

export interface IAnalysisChartsData {
  dateSeries: IAnalysisDatePoint[];
  channelSeries: IAnalysisChannelPoint[];
}

export interface IAnalysisEvent {
  id: string;
  analysisId: string;
  level: 'info' | 'warning' | 'error';
  stage: 'upload' | 'mapping' | 'etl' | 'duckdb' | 'diagnostics' | 'ai' | 'snapshot';
  message: string;
  payload: Record<string, unknown> | null;
  createdAt: string;
}

export interface IAnalysisListItem {
  id: string;
  userId: string;
  datasetId: string;
  datasetVersionId: string;
  status: AnalysisStatus;
  createdAt: string;
  completedAt: string | null;
}

export interface IAnalysisDetails extends IAnalysisListItem {
  dataQuality: IDataQualityReport | null;
  kpiMetrics: IAnalysisAggregate | null;
  chartsData: IAnalysisChartsData | null;
  diagnostics: IAnalysisDiagnostics | null;
  segments: Record<string, unknown> | null;
  cohorts: Record<string, unknown> | null;
  anomalies: IAnalysisAnomalies | null;
  tradeoffs: Record<string, unknown> | null;
  swotResults: ISwotResults | null;
  aiRecommendations: IAnalysisRecommendations | null;
  errorMessage: string | null;
  startedAt: string;
  events?: IAnalysisEvent[];
}

export interface ICreateAnalysisPayload {
  datasetVersionId: string;
}
