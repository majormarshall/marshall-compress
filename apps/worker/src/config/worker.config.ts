import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env files if present
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../../.env') });

export interface WorkerConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  supabase: {
    url: string;
    serviceRoleKey: string;
  };
  r2: {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    endpoint: string;
  };
  workerConcurrency: number;
  tempDir: string;
}

export const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
export const REDIS_PORT = parseInt(process.env.REDIS_PORT || '6379', 10);
export const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

export const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://127.0.0.1:54321';
export const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID || '';
export const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID || '';
export const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY || '';
export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || 'marshall-storage';

export const WORKER_CONCURRENCY = parseInt(process.env.WORKER_CONCURRENCY || '4', 10);
export const TEMP_DIR = process.env.TEMP_DIR || '/tmp/marshall-worker';

export const workerConfig: WorkerConfig = {
  redis: {
    host: REDIS_HOST,
    port: REDIS_PORT,
    password: REDIS_PASSWORD,
  },
  supabase: {
    url: SUPABASE_URL,
    serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY,
  },
  r2: {
    accountId: R2_ACCOUNT_ID,
    accessKeyId: R2_ACCESS_KEY_ID,
    secretAccessKey: R2_SECRET_ACCESS_KEY,
    bucketName: R2_BUCKET_NAME,
    endpoint: R2_ACCOUNT_ID
      ? `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`
      : (process.env.R2_ENDPOINT || 'http://127.0.0.1:9000'),
  },
  workerConcurrency: WORKER_CONCURRENCY,
  tempDir: TEMP_DIR,
};

export default workerConfig;
