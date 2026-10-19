import { createClient, RedisClientType } from 'redis';
import { handleBookNotificationMessage } from './bookNotifications';
import { getEnvironment } from '../config/environment';
import { getLogger } from '../config/logger';
import { captureException } from '@sentry/node';

let redisClient: RedisClientType | null = null;
let subscriberClient: RedisClientType | null = null;
const logger = getLogger();

/**
 * Create and configure Redis client with automatic reconnection
 */
export async function createRedisClient(): Promise<void> {
  const env = getEnvironment();

  const client = createClient({
    url: env.REDIS_URL,
    password: env.REDIS_PASSWORD,
    socket: {
      // Never give up: a dead subscriber would silently stop all notifications
      reconnectStrategy: (retries) => {
        const delay = Math.min(retries * 100, 5000);
        logger.warn({ retries, delay }, 'Redis: Reconnecting...');
        return delay;
      },
    },
  });

  // Event handlers
  client.on('error', (error) => {
    logger.error({ error }, 'Redis Client Error');
    captureException(error, { tags: { component: 'redis' } });
  });

  client.on('connect', () => {
    logger.info('Redis: Connected');
  });

  client.on('ready', () => {
    logger.info('Redis: Ready to accept commands');
  });

  client.on('reconnecting', () => {
    logger.warn('Redis: Reconnecting...');
  });

  client.on('end', () => {
    logger.warn('Redis: Connection closed');
  });

  try {
    await client.connect();
    redisClient = client as RedisClientType;
  } catch (error) {
    logger.error({ error }, 'Failed to connect to Redis');
    if (env.NODE_ENV === 'production')
        throw error;
  }
}

/**
 * Get the Redis client instance
 */
export function getRedisClient(): RedisClientType {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call createRedisClient() first.');
  }
  return redisClient;
}

/**
 * Subscribe to book notifications from Redis pub/sub
 */
export async function subscribeBookNotifications(): Promise<void> {
  await createRedisClient();
  if (!redisClient) {
    logger.error('Redis client not initialized, cannot subscribe to book notifications');
    return;
  }

  // Create a duplicate client for pub/sub (Redis requirement)
  const subscriber = redisClient.duplicate();

  // Registered before connecting: an 'error' event without listener crashes the process
  subscriber.on('error', (error) => {
    logger.error({ error }, 'Redis Subscriber Error');
    captureException(error, { tags: { component: 'redis-subscriber' } });
  });

  await subscriber.connect();
  subscriberClient = subscriber;

  await subscriber.subscribe('restaurant-notifications', (message) => {
    void handleBookNotificationMessage(message);
  });

  logger.info('Subscribed to restaurant-notifications channel');
}

/**
 * Gracefully disconnect a Redis client
 */
async function closeClient(client: RedisClientType | null): Promise<void> {
  if (!client?.isOpen) {
    return;
  }
  try {
    await client.quit();
  } catch (error) {
    logger.error({ error }, 'Error disconnecting from Redis');
    await client.disconnect();
  }
}

/**
 * Gracefully disconnect from Redis
 */
export async function disconnectRedis(): Promise<void> {
  await closeClient(subscriberClient);
  await closeClient(redisClient);
  logger.info('Redis: Disconnected gracefully');
}
