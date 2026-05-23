export type DatasetColumnKey =
  | 'date'
  | 'channel'
  | 'spend'
  | 'traffic_leads'
  | 'new_orders'
  | 'returning_orders'
  | 'revenue';

export type DatasetColumnType = 'date' | 'string' | 'number' | 'money' | 'unknown';
export type UploadSessionStatus = 'uploaded' | 'previewed' | 'mapped' | 'expired' | 'failed';

export interface IPreviewColumn {
  name: string;
  index: number;
  inferredType: DatasetColumnType;
  examples: unknown[];
}

export interface IUploadSessionRecord {
  id: string;
  userId: string;
  originalFilename: string;
  originalFilePath: string;
  mimeType: string | null;
  fileSize: number;
  status: UploadSessionStatus;
  previewRows: Record<string, unknown>[] | null;
  inferredColumns: IPreviewColumn[] | null;
  autoMapping: Partial<Record<DatasetColumnKey, string>> | null;
  errorMessage: string | null;
  createdAt: string;
  expiresAt: string | null;
}
