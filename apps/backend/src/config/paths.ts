import path from 'node:path';

const backendRoot = process.cwd();

export const paths = {
  backendRoot,
  storageRoot: path.resolve(backendRoot, 'storage'),
  sqliteRoot: path.resolve(backendRoot, 'storage', 'sqlite'),
  uploadsRoot: path.resolve(backendRoot, 'storage', 'uploads'),
  tempUploadsRoot: path.resolve(backendRoot, 'storage', 'uploads', 'temp'),
  cleanedDatasetsRoot: path.resolve(backendRoot, 'storage', 'datasets', 'cleaned'),
  sqliteFile: path.resolve(backendRoot, 'storage', 'sqlite', 'businesspulse.sqlite'),
} as const;
