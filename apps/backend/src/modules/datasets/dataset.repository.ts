import { randomUUID } from 'node:crypto';

import { getSqliteClient } from '../../db/sqlite.js';
import type {
  DatasetColumnMapping,
  DatasetVersionStatus,
  IDatasetRecord,
  IDatasetVersionRecord,
} from './dataset.types.js';

interface IDatasetRow {
  id: string;
  user_id: string;
  name: string;
  current_version_id: string | null;
  created_at: string;
  updated_at: string;
}

interface IDatasetVersionRow {
  id: string;
  dataset_id: string;
  user_id: string;
  upload_session_id: string | null;
  version_number: number;
  original_filename: string;
  original_file_path: string;
  cleaned_file_path: string | null;
  mapping_config_json: string;
  edit_patch_json: string | null;
  schema_json: string | null;
  data_quality_json: string | null;
  row_count: number | null;
  file_hash: string | null;
  status: DatasetVersionStatus;
  created_at: string;
  completed_at: string | null;
}

function parseJson<T>(value: string | null): T | null {
  return value ? (JSON.parse(value) as T) : null;
}

function mapDataset(row: IDatasetRow): IDatasetRecord {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    currentVersionId: row.current_version_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapDatasetVersion(row: IDatasetVersionRow): IDatasetVersionRecord {
  return {
    id: row.id,
    datasetId: row.dataset_id,
    userId: row.user_id,
    uploadSessionId: row.upload_session_id,
    versionNumber: row.version_number,
    originalFilename: row.original_filename,
    originalFilePath: row.original_file_path,
    cleanedFilePath: row.cleaned_file_path,
    mappingConfig: JSON.parse(row.mapping_config_json) as DatasetColumnMapping,
    editPatch: parseJson(row.edit_patch_json),
    schema: parseJson<Record<string, unknown>>(row.schema_json),
    dataQuality: parseJson<Record<string, unknown>>(row.data_quality_json),
    rowCount: row.row_count,
    fileHash: row.file_hash,
    status: row.status,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  };
}

export function listDatasetsByUser(userId: string): IDatasetRecord[] {
  const rows = getSqliteClient()
    .prepare(
      `
        SELECT id, user_id, name, current_version_id, created_at, updated_at
        FROM datasets
        WHERE user_id = ?
        ORDER BY created_at DESC
      `,
    )
    .all(userId) as IDatasetRow[];

  return rows.map(mapDataset);
}

export function findDatasetCurrentVersion(datasetId: string): IDatasetVersionRecord | null {
  const dataset = findDatasetById(datasetId);

  if (!dataset?.currentVersionId) {
    return null;
  }

  return findDatasetVersionById(dataset.currentVersionId);
}

export function findDatasetById(datasetId: string): IDatasetRecord | null {
  const row = getSqliteClient()
    .prepare(
      `
        SELECT id, user_id, name, current_version_id, created_at, updated_at
        FROM datasets
        WHERE id = ?
      `,
    )
    .get(datasetId) as IDatasetRow | undefined;

  return row ? mapDataset(row) : null;
}

export function findDatasetVersionById(datasetVersionId: string): IDatasetVersionRecord | null {
  const row = getSqliteClient()
    .prepare(
      `
        SELECT
          id,
          dataset_id,
          user_id,
          upload_session_id,
          version_number,
          original_filename,
          original_file_path,
          cleaned_file_path,
          mapping_config_json,
          edit_patch_json,
          schema_json,
          data_quality_json,
          row_count,
          file_hash,
          status,
          created_at,
          completed_at
        FROM dataset_versions
        WHERE id = ?
      `,
    )
    .get(datasetVersionId) as IDatasetVersionRow | undefined;

  return row ? mapDatasetVersion(row) : null;
}

export function listDatasetVersions(datasetId: string): IDatasetVersionRecord[] {
  const rows = getSqliteClient()
    .prepare(
      `
        SELECT
          id,
          dataset_id,
          user_id,
          upload_session_id,
          version_number,
          original_filename,
          original_file_path,
          cleaned_file_path,
          mapping_config_json,
          edit_patch_json,
          schema_json,
          data_quality_json,
          row_count,
          file_hash,
          status,
          created_at,
          completed_at
        FROM dataset_versions
        WHERE dataset_id = ?
        ORDER BY version_number DESC
      `,
    )
    .all(datasetId) as IDatasetVersionRow[];

  return rows.map(mapDatasetVersion);
}

export function getNextDatasetVersionNumber(datasetId: string): number {
  const row = getSqliteClient()
    .prepare(
      `
        SELECT COALESCE(MAX(version_number), 0) + 1 AS next_version
        FROM dataset_versions
        WHERE dataset_id = ?
      `,
    )
    .get(datasetId) as { next_version: number };

  return row.next_version;
}

export function createDatasetWithVersion(input: {
  userId: string;
  name: string;
  uploadSessionId: string;
  originalFilename: string;
  originalFilePath: string;
  rowCount: number | null;
  mappingConfig: DatasetColumnMapping;
}) {
  const datasetId = randomUUID();
  const versionId = randomUUID();
  const client = getSqliteClient();

  client.transaction(() => {
    client
      .prepare(
        `
            INSERT INTO datasets (id, user_id, name)
            VALUES (?, ?, ?)
          `,
      )
      .run(datasetId, input.userId, input.name);

    client
      .prepare(
        `
            INSERT INTO dataset_versions (
              id,
              dataset_id,
              user_id,
              upload_session_id,
              version_number,
              original_filename,
              original_file_path,
              row_count,
              mapping_config_json,
              status
            )
            VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, 'draft')
          `,
      )
      .run(
        versionId,
        datasetId,
        input.userId,
        input.uploadSessionId,
        input.originalFilename,
        input.originalFilePath,
        input.rowCount,
        JSON.stringify(input.mappingConfig),
      );

    client
      .prepare(
        `
            UPDATE datasets
            SET current_version_id = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `,
      )
      .run(versionId, datasetId);
  })();

  return {
    dataset: findDatasetById(datasetId),
    version: findDatasetVersionById(versionId),
  };
}

export function createDatasetVersion(input: {
  datasetId: string;
  userId: string;
  uploadSessionId: string;
  versionNumber: number;
  originalFilename: string;
  originalFilePath: string;
  rowCount: number | null;
  mappingConfig: DatasetColumnMapping;
}): IDatasetVersionRecord {
  const versionId = randomUUID();
  const client = getSqliteClient();

  client.transaction(() => {
    client
      .prepare(
        `
            INSERT INTO dataset_versions (
              id,
              dataset_id,
              user_id,
              upload_session_id,
              version_number,
              original_filename,
              original_file_path,
              row_count,
              mapping_config_json,
              status
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
          `,
      )
      .run(
        versionId,
        input.datasetId,
        input.userId,
        input.uploadSessionId,
        input.versionNumber,
        input.originalFilename,
        input.originalFilePath,
        input.rowCount,
        JSON.stringify(input.mappingConfig),
      );

    client
      .prepare(
        `
            UPDATE datasets
            SET current_version_id = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `,
      )
      .run(versionId, input.datasetId);
  })();

  const createdVersion = findDatasetVersionById(versionId);

  if (!createdVersion) {
    throw new Error('Created dataset version was not found');
  }

  return createdVersion;
}

export function deleteDatasetById(datasetId: string) {
  getSqliteClient()
    .prepare(
      `
        DELETE FROM datasets
        WHERE id = ?
      `,
    )
    .run(datasetId);
}

export function updateDatasetVersionDraft(input: {
  datasetVersionId: string;
  mappingConfig: DatasetColumnMapping;
  editPatch: Record<string, unknown> | null;
}): IDatasetVersionRecord {
  getSqliteClient()
    .prepare(
      `
        UPDATE dataset_versions
        SET
          mapping_config_json = ?,
          edit_patch_json = ?
        WHERE id = ?
      `,
    )
    .run(
      JSON.stringify(input.mappingConfig),
      input.editPatch ? JSON.stringify(input.editPatch) : null,
      input.datasetVersionId,
    );

  const updatedVersion = findDatasetVersionById(input.datasetVersionId);

  if (!updatedVersion) {
    throw new Error('Updated dataset version was not found');
  }

  return updatedVersion;
}
