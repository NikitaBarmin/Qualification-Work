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
