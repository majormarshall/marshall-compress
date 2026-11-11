import { z } from 'zod';

export interface AppConfig {
  app: {
    env: string;
    port: number;
    corsOrigin: string;
    apiPrefix: string;
  };
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
    jwtSecret?: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  storage: {
    accountId: string;
    accessKeyId: string;
    secretAccessKey: string;
    bucketName: string;
    publicUrl: string;
  };
  ai: {
    openaiApiKey?: string;
    anthropicApiKey?: string;
    geminiApiKey?: string;
  };
}

/**
 * Zod v4 schema for environment variable validation
 */
export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  API_PORT: z.coerce.number().default(3001),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  NEXT_PUBLIC_API_URL: z.string().optional(),
  SUPABASE_URL: z.string().url().default('https://placeholder-project.supabase.co'),
  SUPABASE_ANON_KEY: z.string().min(1).default('placeholder-anon-key'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).default('placeholder-service-role-key'),
  SUPABASE_JWT_SECRET: z.string().optional(),
  REDIS_HOST: z.string().default('127.0.0.1'),
  REDIS_PORT: z.coerce.number().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  R2_ACCOUNT_ID: z.string().default('placeholder-account-id'),
  R2_ACCESS_KEY_ID: z.string().default('placeholder-access-key-id'),
  R2_SECRET_ACCESS_KEY: z.string().default('placeholder-secret-access-key'),
  R2_BUCKET_NAME: z.string().default('marshall-uploads'),
  R2_PUBLIC_URL: z.string().default('https://uploads.marshall.com'),
  OPENAI_API_KEY: z.string().optional(),
  ANTHROPIC_API_KEY: z.string().optional(),
  GEMINI_API_KEY: z.string().optional(),
});

// Compile schema for fast runtime validation in Zod v4 if compile is supported
const compiledEnvValidator = typeof (z as any).compile === 'function'
  ? (z as any).compile(envSchema)
  : envSchema;

/**
 * Validate raw environment records
 */
export function validateEnvironment(config: Record<string, unknown>): z.infer<typeof envSchema> {
  const result = (compiledEnvValidator.safeParse ? compiledEnvValidator.safeParse(config) : envSchema.safeParse(config));
  if (!result.success) {
    throw new Error(`Config validation error: ${JSON.stringify(result.error.format())}`);
  }
  return result.data;
}

/**
 * Typed configuration factory for NestJS ConfigModule
 */
export const configuration = (): AppConfig => {
  const env = validateEnvironment(process.env);

  return {
    app: {
      env: env.NODE_ENV,
      port: env.API_PORT,
      corsOrigin: env.NEXT_PUBLIC_API_URL || env.CORS_ORIGIN,
      apiPrefix: 'api/v1',
    },
    supabase: {
      url: env.SUPABASE_URL,
      anonKey: env.SUPABASE_ANON_KEY,
      serviceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY,
      jwtSecret: env.SUPABASE_JWT_SECRET,
    },
    redis: {
      host: env.REDIS_HOST,
      port: env.REDIS_PORT,
      password: env.REDIS_PASSWORD,
    },
    storage: {
      accountId: env.R2_ACCOUNT_ID,
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
      bucketName: env.R2_BUCKET_NAME,
      publicUrl: env.R2_PUBLIC_URL,
    },
    ai: {
      openaiApiKey: env.OPENAI_API_KEY,
      anthropicApiKey: env.ANTHROPIC_API_KEY,
      geminiApiKey: env.GEMINI_API_KEY,
    },
  };
};

export default configuration;
