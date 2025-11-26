import 'dotenv/config';
import { IntentsBitField } from 'discord.js';
import { SapphireClient } from '@sapphire/framework';
import { disconnectRedis } from './core/redis';
import { init as initSentry, close as closeSentry } from '@sentry/node';
import { schedule, ScheduledTask } from 'node-cron';
import updatePresence from './tasks/updatePresence';
import sendDailyReport from './tasks/sendDailyReport';
import { createAxiosClient } from './core/axios';
import updateOnboarding from './tasks/updateOnboarding';
import { validateEnvironment } from './config/environment';
import { createLogger, getLogger } from './config/logger';
import { handleTaskError } from './lib/errorHandler';

let client: SapphireClient | null = null;
let scheduledTasks: ScheduledTask[] = [];

/**
 * Initialize the application
 */
async function initialize(): Promise<void> {
    // Initialize logger
    createLogger();
    const logger = getLogger();

    logger.info({ nodeEnv: process.env.NODE_ENV }, 'Starting Rémy Discord Bot');

  // Validate environment variables first
  const env = validateEnvironment();


  // Initialize Sentry
  if (env.SENTRY_DSN) {
    initSentry({
      dsn: env.SENTRY_DSN,
      environment: env.NODE_ENV,
      tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
    });
    logger.info('Sentry initialized');
  } else {
    logger.warn('Sentry DSN not provided, error tracking disabled');
  }

  // Create Discord client
  client = new SapphireClient({
    intents: [IntentsBitField.Flags.Guilds],
    loadMessageCommandListeners: true,
  });

  // Discord client event handlers
  client.once('ready', () => {
    logger.info({ user: client!.user?.tag }, 'Discord bot is ready');
  });

  client.on('error', (error) => {
    logger.error({ error }, 'Discord client error');
  });

  // Login to Discord
  await client.login(env.DISCORD_TOKEN);
  logger.info('Discord client logged in');

  // Initialize HTTP client
  createAxiosClient();
  logger.info('Axios client initialized');

  // Schedule tasks with error handling
  scheduledTasks.push(
    schedule('* * * * *', () => {
      updatePresence().catch((error) => handleTaskError('updatePresence', error));
    }),
  );

  scheduledTasks.push(
    schedule('0 0 * * *', () => {
      sendDailyReport().catch((error) => handleTaskError('sendDailyReport', error));
    }),
  );

  scheduledTasks.push(
    schedule('*/5 * * * *', () => {
      updateOnboarding().catch((error) => handleTaskError('updateOnboarding', error));
    }),
  );

  updateOnboarding();

  logger.info('Scheduled tasks configured');

  // Subscribe to Redis notifications
  // await subscribeBookNotifications();
  logger.info('Application initialization complete');
}

/**
 * Graceful shutdown handler
 */
async function shutdown(signal: string): Promise<void> {
  const logger = getLogger();
  logger.info({ signal }, 'Received shutdown signal, starting graceful shutdown');

  try {
    // Stop scheduled tasks
    logger.info('Stopping scheduled tasks...');
    scheduledTasks.forEach((task) => task.stop());

    // Disconnect from Discord
    if (client) {
      logger.info('Destroying Discord client...');
      client.destroy();
    }

    // Disconnect from Redis
    logger.info('Disconnecting from Redis...');
    await disconnectRedis();

    // Close Sentry
    logger.info('Closing Sentry...');
    await closeSentry(2000);

    logger.info('Graceful shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Error during shutdown');
    process.exit(1);
  }
}

/**
 * Error handlers for uncaught errors
 */
process.on('uncaughtException', (error) => {
  const logger = getLogger();
  logger.fatal({ error }, 'Uncaught exception');
  shutdown('uncaughtException').catch(() => process.exit(1));
});

process.on('unhandledRejection', (reason, promise) => {
  const logger = getLogger();
  logger.fatal({ reason, promise }, 'Unhandled rejection');
  shutdown('unhandledRejection').catch(() => process.exit(1));
});

// Graceful shutdown signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start the application
void initialize().catch((error) => {
  console.error('Failed to initialize application:', error);
  process.exit(1);
});

