import type { DatasetColumnKey, DatasetColumnType } from '../uploads/upload.types.js';

export type DatasetVersionStatus = 'draft' | 'processing' | 'ready' | 'failed';

export interface IDatasetColumnMappingRule {
  source: string;
  required: boolean;
  type: DatasetColumnType;
}

export type DatasetColumnMapping = Partial<Record<DatasetColumnKey, IDatasetColumnMappingRule>>;

export interface IDatasetRecord {
  id: string;
  userId: string;
  name: string;
  currentVersionId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface IDatasetVersionRecord {
  id: string;
  datasetId: string;
  userId: string;
  uploadSessionId: string | null;
  versionNumber: number;
  originalFilename: string;
  originalFilePath: string;
  cleanedFilePath: string | null;
  mappingConfig: DatasetColumnMapping;
  schema: Record<string, unknown> | null;
  dataQuality: Record<string, unknown> | null;
  rowCount: number | null;
  fileHash: string | null;
  status: DatasetVersionStatus;
  createdAt: string;
  completedAt: string | null;
}
