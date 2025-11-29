import { z } from 'zod';

const environmentSchema = z.object({
  // Discord Configuration
  DISCORD_TOKEN: z.string().min(1, 'DISCORD_TOKEN is required'),

  // API Configuration
  BASE_API: z.string().url('BASE_API must be a valid URL'),
  WEBSERVER_TOKEN: z.string().min(1, 'WEBSERVER_TOKEN is required'),

  // Redis Configuration
  REDIS_URL: z.string().min(1, 'REDIS_URL is required'),
  REDIS_PASSWORD: z.string().optional(),

  // Sentry Configuration
  SENTRY_DSN: z.string().url('SENTRY_DSN must be a valid URL').optional(),

  // Application Configuration
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export type Environment = z.infer<typeof environmentSchema>;

let envCache: Environment | null = null;

/**
 * Validate and parse environment variables
 * @throws {Error} If validation fails
 */
export function validateEnvironment(): Environment {
  if (envCache) {
    return envCache;
  }

  try {
    envCache = environmentSchema.parse(process.env);
    return envCache;
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors
        .map((err) => `${err.path.join('.')}: ${err.message}`)
        .join('\n');
      throw new Error(`Environment validation failed:\n${errorMessages}`);
    }
    throw error;
  }
}

/**
 * Get validated environment configuration
 * Automatically validates environment if not already done
 */
export function getEnvironment(): Environment {
  if (!envCache) {
    validateEnvironment();
  }
  return envCache!;
}

