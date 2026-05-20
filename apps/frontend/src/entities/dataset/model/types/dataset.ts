import type { RequiredDatasetColumn } from '@/shared/config/datasetColumns';

export type DatasetStatus =
  | 'draft'
  | 'processing'
  | 'completed'
  | 'failed';

export type DatasetMapping = Record<
  RequiredDatasetColumn,
  string | null
>;

export interface IDatasetPreview {
  headers: string[];
  rows: string[][];
  missingRequiredColumns: RequiredDatasetColumn[];
}

export interface IDatasetListItem {
  id: string;
  filename: string;
  createdAt: string;
  status: DatasetStatus;
}

export interface IPreviewUploadPayload {
  file: File;
}

export interface ISaveDatasetDraftPayload {
  fileId: string;
  mapping: DatasetMapping;
  businessDescription: string;
}
