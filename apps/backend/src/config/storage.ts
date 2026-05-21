import fs from 'node:fs';

import { paths } from './paths.js';

const requiredDirectories = [
  paths.storageRoot,
  paths.sqliteRoot,
  paths.uploadsRoot,
  paths.tempUploadsRoot,
  paths.cleanedDatasetsRoot,
];

export function ensureStorageStructure() {
  for (const directory of requiredDirectories) {
    fs.mkdirSync(directory, { recursive: true });
  }
}
