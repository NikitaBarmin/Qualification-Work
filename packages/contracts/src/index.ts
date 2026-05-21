export interface IUserSession {
  id: string;
  email: string;
  businessType?: string | null;
}

export interface IDatasetPreview {
  headers: string[];
  rows: string[][];
  missingRequiredColumns: string[];
}

export interface IAnalysisListItem {
  id: string;
  datasetId: string;
  title: string;
  status: 'processing' | 'completed' | 'partial_success' | 'failed';
  createdAt: string;
}
