import { getSqliteStatus } from '../../db/sqlite.js';
import { env } from '../../env.js';

export interface IHealthStatus {
  status: 'ok';
  environment: string;
  timestamp: string;
  uptimeSeconds: number;
  sqlite: {
    ready: boolean;
    filePath: string;
    tables: string[];
  };
}

export function getHealthStatus(): IHealthStatus {
  return {
    status: 'ok',
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    sqlite: getSqliteStatus(),
  };
}
