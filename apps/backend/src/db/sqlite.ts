import Database from 'better-sqlite3';

import { paths } from '../config/paths.js';
import {
  CREATE_ANALYSES_TABLE_SQL,
  CREATE_ANALYSIS_EVENTS_TABLE_SQL,
  CREATE_DATASET_VERSIONS_TABLE_SQL,
  CREATE_DATASETS_TABLE_SQL,
  CREATE_UPLOAD_SESSIONS_TABLE_SQL,
  CREATE_USERS_TABLE_SQL,
  SQLITE_INDEX_STATEMENTS,
  SQLITE_TABLE_NAMES,
} from './sqlite-schema.js';

let sqliteClient: Database.Database | null = null;

function createSqliteClient(): Database.Database {
  const client = new Database(paths.sqliteFile);

  client.pragma('journal_mode = WAL');
  client.pragma('foreign_keys = ON');

  return client;
}

function tableExists(client: Database.Database, tableName: string) {
  const row = client
    .prepare(
      `
        SELECT name
        FROM sqlite_master
        WHERE type = 'table' AND name = ?
      `,
    )
    .get(tableName);

  return Boolean(row);
}

function getColumnNames(client: Database.Database, tableName: string) {
  const columns = client.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{
    name: string;
  }>;

  return new Set(columns.map((column) => column.name));
}

function migrateUsersPasswordColumn(client: Database.Database) {
  const columnNames = getColumnNames(client, 'users');

  if (columnNames.has('password') && !columnNames.has('password_hash')) {
    client.exec('ALTER TABLE users RENAME COLUMN password TO password_hash');
  }
}

function migrateUploadSessionsRowCount(client: Database.Database) {
  const columnNames = getColumnNames(client, 'upload_sessions');

  if (!columnNames.has('row_count')) {
    client.exec('ALTER TABLE upload_sessions ADD COLUMN row_count INTEGER');
  }
}

function migrateDatasetVersionsEditPatch(client: Database.Database) {
  const columnNames = getColumnNames(client, 'dataset_versions');

  if (!columnNames.has('edit_patch_json')) {
    client.exec('ALTER TABLE dataset_versions ADD COLUMN edit_patch_json TEXT');
  }
}

function migrateLegacyDatasetsTable(client: Database.Database) {
  if (!tableExists(client, 'datasets')) {
    return;
  }

  const columnNames = getColumnNames(client, 'datasets');
  const hasTargetShape =
    columnNames.has('name') &&
    columnNames.has('current_version_id') &&
    columnNames.has('updated_at') &&
    !columnNames.has('filename');

  if (hasTargetShape) {
    return;
  }

  client.pragma('foreign_keys = OFF');

  try {
    client.exec(`
      ALTER TABLE datasets RENAME TO datasets_legacy;

      ${CREATE_DATASETS_TABLE_SQL}

      INSERT INTO datasets (id, user_id, name, current_version_id, created_at, updated_at)
      SELECT
        id,
        user_id,
        COALESCE(filename, 'Dataset'),
        NULL,
        created_at,
        created_at
      FROM datasets_legacy;

      DROP TABLE datasets_legacy;
    `);
  } finally {
    client.pragma('foreign_keys = ON');
  }
}

function migrateLegacyAnalysesTable(client: Database.Database) {
  if (!tableExists(client, 'analyses')) {
    return;
  }

  const columnNames = getColumnNames(client, 'analyses');
  const hasTargetShape =
    columnNames.has('dataset_version_id') &&
    columnNames.has('kpi_metrics_json') &&
    columnNames.has('diagnostics_json');

  if (hasTargetShape) {
    return;
  }

  client.exec('DROP TABLE analyses');
}

export function getSqliteClient(): Database.Database {
  if (sqliteClient === null) {
    sqliteClient = createSqliteClient();
  }

  return sqliteClient;
}

export interface ISqliteStatus {
  ready: boolean;
  filePath: string;
  tables: string[];
}

export function initializeSqlite(): ISqliteStatus {
  const client = getSqliteClient();

  client.exec(CREATE_USERS_TABLE_SQL);
  migrateUsersPasswordColumn(client);
  client.exec(CREATE_UPLOAD_SESSIONS_TABLE_SQL);
  migrateUploadSessionsRowCount(client);
  migrateLegacyAnalysesTable(client);
  client.exec(CREATE_DATASETS_TABLE_SQL);
  migrateLegacyDatasetsTable(client);
  client.exec(CREATE_DATASET_VERSIONS_TABLE_SQL);
  migrateDatasetVersionsEditPatch(client);
  client.exec(CREATE_ANALYSES_TABLE_SQL);
  client.exec(CREATE_ANALYSIS_EVENTS_TABLE_SQL);

  for (const statement of SQLITE_INDEX_STATEMENTS) {
    client.exec(statement);
  }

  return {
    ready: true,
    filePath: paths.sqliteFile,
    tables: [...SQLITE_TABLE_NAMES],
  };
}

export function getSqliteStatus(): ISqliteStatus {
  return {
    ready: sqliteClient !== null,
    filePath: paths.sqliteFile,
    tables: [...SQLITE_TABLE_NAMES],
  };
}
