import { createApp } from './src/app.js';
import { ensureStorageStructure } from './src/config/storage.js';
import { initializeSqlite } from './src/db/sqlite.js';
import { env } from './src/env.js';

ensureStorageStructure();
initializeSqlite();

const app = createApp();

app.listen(env.port, env.host, () => {
  console.log(`Backend is running on http://${env.host}:${env.port}`);
});
