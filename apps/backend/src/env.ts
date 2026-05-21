import dotenv from 'dotenv';

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  host: process.env.HOST ?? '127.0.0.1',
  port: Number(process.env.PORT ?? 3001),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://127.0.0.1:5173',
  jwtSecret: process.env.JWT_SECRET ?? 'businesspulse-development-secret',
} as const;
