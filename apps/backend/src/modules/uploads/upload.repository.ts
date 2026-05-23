import { randomUUID } from 'node:crypto';

import { getSqliteClient } from '../../db/sqlite.js';
import type {
  DatasetColumnKey,
  IPreviewColumn,
  IUploadSessionRecord,
  UploadSessionStatus,
} from './upload.types.js';

interface IUploadSessionRow {
  id: string;
  user_id: string;
  original_filename: string;
  original_file_path: string;
  mime_type: string | null;
  file_size: number;
  status: UploadSessionStatus;
  preview_rows_json: string | null;
  inferred_columns_json: string | null;
  auto_mapping_json: string | null;
  error_message: string | null;
  created_at: string;
  expires_at: string | null;
}

function parseJson<T>(value: string | null): T | null {
  return value ? (JSON.parse(value) as T) : null;
}

function mapUploadSession(row: IUploadSessionRow): IUploadSessionRecord {
  return {
    id: row.id,
    userId: row.user_id,
    originalFilename: row.original_filename,
    originalFilePath: row.original_file_path,
    mimeType: row.mime_type,
    fileSize: row.file_size,
    status: row.status,
    previewRows: parseJson<Record<string, unknown>[]>(row.preview_rows_json),
    inferredColumns: parseJson<IPreviewColumn[]>(row.inferred_columns_json),
    autoMapping: parseJson<Partial<Record<DatasetColumnKey, string>>>(row.auto_mapping_json),
    errorMessage: row.error_message,
    createdAt: row.created_at,
    expiresAt: row.expires_at,
  };
}

export function createUploadSession(input: {
  userId: string;
  originalFilename: string;
  originalFilePath: string;
  mimeType?: string | null;
  fileSize: number;
  expiresAt?: string | null;
}): IUploadSessionRecord {
  const uploadSessionId = randomUUID();

  getSqliteClient()
    .prepare(
      `
        INSERT INTO upload_sessions (
          id,
          user_id,
          original_filename,
          original_file_path,
          mime_type,
          file_size,
          status,
          expires_at
        )
        VALUES (?, ?, ?, ?, ?, ?, 'uploaded', ?)
      `,
    )
    .run(
      uploadSessionId,
      input.userId,
      input.originalFilename,
      input.originalFilePath,
      input.mimeType ?? null,
      input.fileSize,
      input.expiresAt ?? null,
    );

  const createdSession = findUploadSessionById(uploadSessionId);

  if (!createdSession) {
    throw new Error('Created upload session was not found');
  }

  return createdSession;
}

export function findUploadSessionById(uploadSessionId: string): IUploadSessionRecord | null {
  const row = getSqliteClient()
    .prepare(
      `
        SELECT
          id,
          user_id,
          original_filename,
          original_file_path,
          mime_type,
          file_size,
          status,
          preview_rows_json,
          inferred_columns_json,
          auto_mapping_json,
          error_message,
          created_at,
          expires_at
        FROM upload_sessions
        WHERE id = ?
      `,
    )
    .get(uploadSessionId) as IUploadSessionRow | undefined;

  return row ? mapUploadSession(row) : null;
}

export function updateUploadSessionPreview(input: {
  uploadSessionId: string;
  previewRows: Record<string, unknown>[];
  inferredColumns: IPreviewColumn[];
  autoMapping: Partial<Record<DatasetColumnKey, string>>;
}): IUploadSessionRecord {
  getSqliteClient()
    .prepare(
      `
        UPDATE upload_sessions
        SET
          status = 'previewed',
          preview_rows_json = ?,
          inferred_columns_json = ?,
          auto_mapping_json = ?
        WHERE id = ?
      `,
    )
    .run(
      JSON.stringify(input.previewRows),
      JSON.stringify(input.inferredColumns),
      JSON.stringify(input.autoMapping),
      input.uploadSessionId,
    );

  const updatedSession = findUploadSessionById(input.uploadSessionId);

  if (!updatedSession) {
    throw new Error('Updated upload session was not found');
  }

  return updatedSession;
}

export function markUploadSessionMapped(uploadSessionId: string) {
  getSqliteClient()
    .prepare(
      `
        UPDATE upload_sessions
        SET status = 'mapped'
        WHERE id = ?
      `,
    )
    .run(uploadSessionId);
}
