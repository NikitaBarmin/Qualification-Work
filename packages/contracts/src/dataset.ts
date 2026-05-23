export type DatasetColumnKey =
  | 'date'
  | 'channel'
  | 'spend'
  | 'traffic_leads'
  | 'new_orders'
  | 'returning_orders'
  | 'revenue';

export type DatasetColumnType = 'date' | 'string' | 'number' | 'money' | 'unknown';
export type DatasetCellValue = string | number | boolean | null;
export type UploadSessionStatus = 'uploaded' | 'previewed' | 'mapped' | 'expired' | 'failed';
export type DatasetVersionStatus = 'draft' | 'processing' | 'ready' | 'failed';

export interface IDatasetColumnMappingRule {
  source: string;
  required: boolean;
  type: DatasetColumnType;
}

export type DatasetColumnMapping = Partial<Record<DatasetColumnKey, IDatasetColumnMappingRule>>;

export interface IDatasetPreviewColumn {
  name: string;
  index: number;
  inferredType: DatasetColumnType;
  examples: DatasetCellValue[];
}

export interface IDatasetWarning {
  code: string;
  message: string;
  column?: string;
}

export interface IUploadPreviewResponse {
  uploadId: string;
  filename: string;
  fileSize: number;
  columns: IDatasetPreviewColumn[];
  previewRows: Record<string, DatasetCellValue>[];
  autoMapping: Partial<Record<DatasetColumnKey, string>>;
  warnings: IDatasetWarning[];
}

export interface ICreateDatasetRequest {
  uploadId: string;
  name: string;
  mapping: DatasetColumnMapping;
}

export interface ICreateDatasetVersionRequest {
  uploadId: string;
  mapping: DatasetColumnMapping;
}

export interface IDataQualityReport {
  totalRows: number;
  acceptedRows: number;
  rejectedRows: number;
  duplicateRows: number;
  missingRequiredColumns: DatasetColumnKey[];
  missingValueCounts: Partial<Record<DatasetColumnKey, number>>;
  invalidValueCounts: Partial<Record<DatasetColumnKey, number>>;
  warnings: IDatasetWarning[];
}

export interface IDatasetVersion {
  id: string;
  datasetId: string;
  uploadSessionId: string | null;
  versionNumber: number;
  originalFilename: string;
  status: DatasetVersionStatus;
  rowCount: number | null;
  createdAt: string;
  completedAt: string | null;
}

export interface IDatasetListItem {
  id: string;
  name: string;
  currentVersionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IDatasetDetails extends IDatasetListItem {
  versions: IDatasetVersion[];
}
