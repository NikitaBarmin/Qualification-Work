export type DatasetColumnKey =
  | 'Date'
  | 'Channel'
  | 'Spend'
  | 'Traffic_Leads'
  | 'New_Orders'
  | 'Returning_Orders'
  | 'Revenue';

export type DatasetCellValue = string | number | null;

export type DatasetColumnMapping = Partial<Record<DatasetColumnKey, string>>;

export interface IDatasetPreview {
  headers: string[];
  rows: DatasetCellValue[][];
  missingRequiredColumns: DatasetColumnKey[];
  totalRowsPreviewed: number;
}

export interface ICreateDatasetPreviewRequest {
  fileName: string;
}

export interface IRunAnalysisRequest {
  fileName: string;
  businessDescription: string;
  mapping: DatasetColumnMapping;
}

export interface IDatasetListItem {
  id: string;
  title: string;
  createdAt: string;
  status: 'draft' | 'processing' | 'completed' | 'partial_success' | 'failed';
}
