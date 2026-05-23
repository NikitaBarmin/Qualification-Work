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
export type DatasetVersionStatus = 'draft' | 'processing' | 'ready' | 'failed';

export interface IDatasetColumnMappingRule {
  source: string;
  required: boolean;
  type: DatasetColumnType;
}

export type DatasetColumnMapping = Partial<Record<DatasetColumnKey, IDatasetColumnMappingRule>>;
export type DatasetMapping = Record<string, string | null>;

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
  rowCount: number | null;
  columns: IDatasetPreviewColumn[];
  previewRows: Record<string, DatasetCellValue>[];
  autoMapping: Partial<Record<DatasetColumnKey, string>>;
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
  currentVersion: IDatasetVersion | null;
  createdAt: string;
  updatedAt: string;
}

export interface IDatasetDetails extends Omit<IDatasetListItem, 'currentVersion'> {
  versions: IDatasetVersion[];
}

export interface IPreviewUploadPayload {
  file: File;
}

export interface ICreateDatasetPayload {
  uploadId: string;
  name: string;
  mapping: DatasetColumnMapping;
}
