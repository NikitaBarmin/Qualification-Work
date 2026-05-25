import dotenv from 'dotenv';

dotenv.config();

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  host: process.env.HOST ?? '127.0.0.1',
  port: Number(process.env.PORT ?? 3001),
  corsOrigin: process.env.CORS_ORIGIN ?? 'http://127.0.0.1:5173',
  jwtSecret: process.env.JWT_SECRET ?? 'businesspulse-development-secret',
  llmProvider: process.env.LLM_PROVIDER ?? 'openrouter',
  llmApiKey: process.env.LLM_API_KEY ?? '',
  llmModel: process.env.LLM_MODEL ?? 'nvidia/nemotron-3-nano-30b-a3b:free',
  llmFallbackModels: (process.env.LLM_FALLBACK_MODELS ?? 'openai/gpt-oss-20b:free')
    .split(',')
    .map((model) => model.trim())
    .filter(Boolean),
} as const;
