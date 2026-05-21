import Database from 'better-sqlite3';

import { paths } from '../config/paths.js';
import { SQLITE_SCHEMA_STATEMENTS, SQLITE_TABLE_NAMES } from './sqlite-schema.js';

let sqliteClient: Database.Database | null = null;

function createSqliteClient(): Database.Database {
  const client = new Database(paths.sqliteFile);

  client.pragma('journal_mode = WAL');
  client.pragma('foreign_keys = ON');

  return client;
}

function migrateUsersPasswordColumn(client: Database.Database) {
  const columns = client
    .prepare('PRAGMA table_info(users)')
    .all() as Array<{ name: string }>;
  const columnNames = new Set(columns.map((column) => column.name));

  if (columnNames.has('password') && !columnNames.has('password_hash')) {
    client.exec('ALTER TABLE users RENAME COLUMN password TO password_hash');
  }
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

  for (const statement of SQLITE_SCHEMA_STATEMENTS) {
    client.exec(statement);
  }
  migrateUsersPasswordColumn(client);

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
