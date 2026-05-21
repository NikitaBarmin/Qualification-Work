export type AnalysisStatus = 'processing' | 'completed' | 'partial_success' | 'failed';

export type AnalysisMetricId =
  | 'drr'
  | 'romi'
  | 'ltv'
  | 'cac'
  | 'ltvCacRatio'
  | 'cpo'
  | 'cr'
  | 'retentionRate';

export interface IAnalysisMetricValue {
  id: AnalysisMetricId;
  value: number;
}

export interface IChartPoint {
  label: string;
  value: number;
}

export interface IAiRecommendation {
  title: string;
  description: string;
}

export interface IAnalysisSnapshot {
  id: string;
  datasetId: string;
  title: string;
  status: AnalysisStatus;
  createdAt: string;
  metrics: IAnalysisMetricValue[];
  charts: {
    revenueByDate: IChartPoint[];
    spendByChannel: IChartPoint[];
  };
  recommendations: IAiRecommendation[];
}

export interface IAnalysisListItem {
  id: string;
  datasetId: string;
  title: string;
  status: AnalysisStatus;
  createdAt: string;
}
