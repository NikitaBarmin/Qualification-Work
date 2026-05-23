import { createApp } from '../src/app.js';
import { ensureStorageStructure } from '../src/config/storage.js';
import { getSqliteClient, initializeSqlite } from '../src/db/sqlite.js';

describe('backend app', () => {
  it('creates express application instance', () => {
    const app = createApp();

    expect(app).toBeDefined();
    expect(typeof app.listen).toBe('function');
  });

  it('initializes target sqlite schema', () => {
    ensureStorageStructure();
    const status = initializeSqlite();
    const rows = getSqliteClient()
      .prepare(
        `
          SELECT name
          FROM sqlite_master
          WHERE type = 'table'
        `,
      )
      .all() as Array<{ name: string }>;
    const tableNames = new Set(rows.map((row) => row.name));

    expect(status.tables).toEqual([
      'users',
      'upload_sessions',
      'datasets',
      'dataset_versions',
      'analyses',
      'analysis_events',
    ]);
    expect(tableNames.has('upload_sessions')).toBe(true);
    expect(tableNames.has('dataset_versions')).toBe(true);
    expect(tableNames.has('analysis_events')).toBe(true);
  });
});
