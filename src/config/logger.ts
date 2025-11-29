import pino from 'pino';
import { getEnvironment } from './environment';

let loggerInstance: pino.Logger | null = null;

/**
 * Create and configure the logger instance
 */
export function createLogger(): pino.Logger {
  const env = getEnvironment();

  const logger = pino({
    level: env.LOG_LEVEL,
    formatters: {
      level: (label) => {
        return { level: label.toUpperCase() };
      },
    },
    timestamp: pino.stdTimeFunctions.isoTime,
    ...(env.NODE_ENV === 'development' && {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },
    }),
  });

  loggerInstance = logger;
  return logger;
}

/**
 * Get the logger instance
 * Automatically initializes the logger if not already done
 */
export function getLogger(): pino.Logger {
  if (!loggerInstance) {
    createLogger();
  }
  return loggerInstance!;
}

/**
 * Create a child logger with additional context
 */
export function createChildLogger(context: Record<string, unknown>): pino.Logger {
  return getLogger().child(context);
}

