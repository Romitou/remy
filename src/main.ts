import './instrument';
import { IntentsBitField } from 'discord.js';
import { SapphireClient } from '@sapphire/framework';
import { captureException, close as closeSentry } from '@sentry/node';
import { schedule, ScheduledTask } from 'node-cron';
import { disconnectRedis, subscribeBookNotifications } from './core/redis';
import { createAxiosClient } from './core/axios';
import updatePresence from './tasks/updatePresence';
import sendDailyReport from './tasks/sendDailyReport';
import updateOnboarding from './tasks/updateOnboarding';
import { getEnvironment } from './config/environment';
import { getLogger } from './config/logger';
import { handleTaskError } from './lib/errorHandler';

const logger = getLogger();

let client: SapphireClient | null = null;
const scheduledTasks: ScheduledTask[] = [];
let shuttingDown = false;

/**
 * Run a task, reporting its errors instead of letting them crash the process
 */
function runTask(name: string, task: () => Promise<void>): void {
  task().catch((error) => handleTaskError(name, error));
}

/**
 * Initialize the application
 */
async function initialize(): Promise<void> {
  const env = getEnvironment();
  logger.info({ nodeEnv: env.NODE_ENV }, 'Starting Rémy Discord Bot');

  if (env.SENTRY_DSN) {
    logger.info('Sentry initialized');
  } else {
    logger.warn('Sentry DSN not provided, error tracking disabled');
  }

  // Create Discord client
  client = new SapphireClient({
    intents: [IntentsBitField.Flags.Guilds],
  });

  client.once('ready', () => {
    logger.info({ user: client?.user?.tag }, 'Discord bot is ready');
  });

  client.on('error', (error) => {
    logger.error({ error }, 'Discord client error');
    captureException(error, { tags: { component: 'discord' } });
  });

  // Initialize HTTP client
  createAxiosClient();

  // Login to Discord
  await client.login(env.DISCORD_TOKEN);
  logger.info('Discord client logged in');

  // Schedule tasks
  scheduledTasks.push(
    schedule('* * * * *', () => runTask('updatePresence', updatePresence)),
    schedule('0 0 * * *', () => runTask('sendDailyReport', sendDailyReport)),
    schedule('*/5 * * * *', () => runTask('updateOnboarding', updateOnboarding)),
  );
  runTask('updateOnboarding', updateOnboarding);
  logger.info('Scheduled tasks configured');

  // Subscribe to Redis notifications
  await subscribeBookNotifications();
  logger.info('Application initialization complete');
}

/**
 * Graceful shutdown handler
 */
async function shutdown(signal: string, exitCode = 0): Promise<void> {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  logger.info({ signal }, 'Received shutdown signal, starting graceful shutdown');

  try {
    scheduledTasks.forEach((task) => task.stop());

    if (client) {
      logger.info('Destroying Discord client...');
      await client.destroy();
    }

    logger.info('Disconnecting from Redis...');
    await disconnectRedis();

    logger.info('Closing Sentry...');
    await closeSentry(2000);

    logger.info('Graceful shutdown complete');
    process.exit(exitCode);
  } catch (error) {
    logger.error({ error }, 'Error during shutdown');
    process.exit(1);
  }
}

// The process state is unknown after an uncaught exception: report it and exit
process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught exception');
  captureException(error);
  void shutdown('uncaughtException', 1);
});

// A stray rejected promise should not take the whole bot down
process.on('unhandledRejection', (reason) => {
  logger.error({ reason }, 'Unhandled rejection');
  captureException(reason);
});

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

initialize().catch((error) => {
  logger.fatal({ error }, 'Failed to initialize application');
  captureException(error);
  void shutdown('initializationFailure', 1);
});
