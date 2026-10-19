import { getRedisClient } from '../core/redis';
import { getLogger } from '../config/logger';

const logger = getLogger();

interface RestaurantSelectionCache {
  selectedRestaurantIds: number[];
  timestamp: number;
}

const SELECTION_CACHE_TTL = 900; // 15 minutes

/**
 * Get cached restaurant selection for a user
 */
export async function getCachedRestaurantSelection(userId: string): Promise<number[]> {
  try {
    const redis = getRedisClient();
    if (!redis.isOpen) {
      logger.warn({ userId }, 'Redis not connected, returning empty selection');
      return [];
    }

    const cacheKey = `restaurant_selection:${userId}`;
    const cached = await redis.get(cacheKey);

    if (!cached) {
      return [];
    }

    const data: RestaurantSelectionCache = JSON.parse(cached);
    return data.selectedRestaurantIds;
  } catch (error) {
    logger.error({ error: String(error), userId }, 'Failed to get cached restaurant selection');
    return [];
  }
}

/**
 * Cache restaurant selection for a user
 */
export async function cacheRestaurantSelection(
  userId: string,
  restaurantIds: number[],
): Promise<void> {
  try {
    const redis = getRedisClient();
    if (!redis.isOpen) {
      logger.warn({ userId }, 'Redis not connected, cannot cache selection');
      return;
    }

    const cacheKey = `restaurant_selection:${userId}`;

    const data: RestaurantSelectionCache = {
      selectedRestaurantIds: restaurantIds,
      timestamp: Date.now(),
    };

    await redis.setEx(cacheKey, SELECTION_CACHE_TTL, JSON.stringify(data));
    logger.debug({ userId, count: restaurantIds.length }, 'Cached restaurant selection');
  } catch (error) {
    logger.error({ error: String(error), userId }, 'Failed to cache restaurant selection');
  }
}

/**
 * Clear cached restaurant selection for a user
 */
export async function clearCachedRestaurantSelection(userId: string): Promise<void> {
  try {
    const redis = getRedisClient();
    if (!redis.isOpen) {
      logger.warn({ userId }, 'Redis not connected, cannot clear selection');
      return;
    }

    const cacheKey = `restaurant_selection:${userId}`;
    await redis.del(cacheKey);
    logger.debug({ userId }, 'Cleared cached restaurant selection');
  } catch (error) {
    logger.error({ error: String(error), userId }, 'Failed to clear cached restaurant selection');
  }
}
