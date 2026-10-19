import { createClient, RedisClientType } from 'redis';
import { BookNotification } from '../typings/bookAlerts';
import { container } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors, EmbedBuilder } from 'discord.js';
import { convertTime12to24, frenchMealPeriod, normalizeDate } from './utils';
import { getEnvironment } from '../config/environment';
import { getLogger } from '../config/logger';
import { captureException } from '@sentry/node';

let redisClient: RedisClientType | null = null;
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
 * Check if Redis is healthy
 */
export async function isRedisHealthy(): Promise<boolean> {
  try {
    if (!redisClient || !redisClient.isOpen) {
      return false;
    }
    await redisClient.ping();
    return true;
  } catch (error) {
    logger.error({ error }, 'Redis health check failed');
    return false;
  }
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
  await subscriber.connect();

  subscriber.on('error', (error) => {
    logger.error({ error }, 'Redis Subscriber Error');
    captureException(error, { tags: { component: 'redis-subscriber' } });
  });

  await subscriber.subscribe('restaurant-notifications', async (message) => {
    try {
      const bookNotification: BookNotification = JSON.parse(message) as BookNotification;

      logger.info(
        {
          userId: bookNotification.discordId,
          restaurant: bookNotification.restaurant.name,
          date: bookNotification.date,
        },
        'Processing book notification',
      );

      const user = await container.client.users.fetch(bookNotification.discordId);

      const embed = new EmbedBuilder()
        .setTitle('📬 Nouvelle notification de réservation')
        .setColor(Colors.Navy)
        .setImage(bookNotification.restaurant.imageUrl)
        .setFooter({
          text: `Alerte de disponibilité associée à votre notification n°${bookNotification.alertId}`,
        })
        .setDescription(
          "Hey, ici Rémy ! Une table est **actuellement disponible à la réservation** selon les critères que vous avez définis, sur l'application Disneyland Paris.",
        );

      embed.setFields([
        {
          name: '🏢 Restaurant',
          value: bookNotification.restaurant.name,
          inline: true,
        },
        {
          name: '📅 Date',
          value: normalizeDate(bookNotification.date),
          inline: true,
        },
        {
          name: '🕒 Heure(s)',
          value: bookNotification.hours.map(convertTime12to24).join(', '),
          inline: true,
        },
        {
          name: '🍽️ Nombre de couverts',
          value: `${bookNotification.partyMix} couverts`,
          inline: true,
        },
        {
          name: '😋 Période de repas',
          value: frenchMealPeriod(bookNotification.mealPeriod),
          inline: true,
        },
      ]);

      const componentRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`markNotificationSolved-${bookNotification.alertId}`)
          .setLabel('Marquer comme réservé')
          .setStyle(ButtonStyle.Success)
          .setEmoji('✅'),
      );

      await user.send({
        embeds: [embed],
        components: [componentRow],
      });

      logger.info(
        { userId: bookNotification.discordId, alertId: bookNotification.alertId },
        'Book notification sent successfully',
      );
    } catch (error) {
      logger.error({ error, message }, 'Failed to process book notification');
      captureException(error, {
        tags: { component: 'book-notification' },
        extra: { message },
      });
    }
  });

  logger.info('Subscribed to restaurant-notifications channel');
}

/**
 * Gracefully disconnect from Redis
 */
export async function disconnectRedis(): Promise<void> {
  if (redisClient && redisClient.isOpen) {
    try {
      await redisClient.quit();
      logger.info('Redis: Disconnected gracefully');
    } catch (error) {
      logger.error({ error }, 'Error disconnecting from Redis');
      await redisClient.disconnect();
    }
  }
}


