export type AnalysisStatus =
  | 'processing'
  | 'completed'
  | 'partial_success'
  | 'failed';

export interface IAnalysisMetric {
  id: string;
  label: string;
  value: number | string;
  unit?: string;
}

export interface IAnalysisListItem {
  id: string;
  datasetId: string;
  title: string;
  status: AnalysisStatus;
  createdAt: string;
}

export interface IAnalysisDetails extends IAnalysisListItem {
  metrics: IAnalysisMetric[];
  swot?: string[];
  aiRecommendations?: string[];
}

export interface IRunAnalysisPayload {
  datasetId: string;
}
