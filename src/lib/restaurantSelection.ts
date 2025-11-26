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
    const cacheKey = `restaurant_selection:${userId}`;
    const cached = await redis.get(cacheKey);

    if (!cached) {
      return [];
    }

    const data: RestaurantSelectionCache = JSON.parse(cached);
    return data.selectedRestaurantIds;
  } catch (error) {
    logger.error({ error, userId }, 'Failed to get cached restaurant selection');
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
    const cacheKey = `restaurant_selection:${userId}`;

    const data: RestaurantSelectionCache = {
      selectedRestaurantIds: restaurantIds,
      timestamp: Date.now(),
    };

    await redis.setEx(cacheKey, SELECTION_CACHE_TTL, JSON.stringify(data));
    logger.debug({ userId, count: restaurantIds.length }, 'Cached restaurant selection');
  } catch (error) {
    logger.error({ error, userId }, 'Failed to cache restaurant selection');
  }
}

/**
 * Clear cached restaurant selection for a user
 */
export async function clearCachedRestaurantSelection(userId: string): Promise<void> {
  try {
    const redis = getRedisClient();
    const cacheKey = `restaurant_selection:${userId}`;
    await redis.del(cacheKey);
    logger.debug({ userId }, 'Cleared cached restaurant selection');
  } catch (error) {
    logger.error({ error, userId }, 'Failed to clear cached restaurant selection');
  }
}

/**
 * Toggle restaurant selection (add if not present, remove if present)
 */
export async function toggleRestaurantSelection(
  userId: string,
  restaurantId: number,
): Promise<number[]> {
  const current = await getCachedRestaurantSelection(userId);
  const index = current.indexOf(restaurantId);

  let updated: number[];
  if (index > -1) {
    // Remove if already selected
    updated = current.filter((id) => id !== restaurantId);
  } else {
    // Add if not selected
    updated = [...current, restaurantId];
  }

  await cacheRestaurantSelection(userId, updated);
  return updated;
}

/**
 * Add multiple restaurants to selection
 */
export async function addRestaurantsToSelection(
  userId: string,
  restaurantIds: number[],
): Promise<number[]> {
  const current = await getCachedRestaurantSelection(userId);
  const updated = Array.from(new Set([...current, ...restaurantIds]));
  await cacheRestaurantSelection(userId, updated);
  return updated;
}

/**
 * Remove restaurant from selection
 */
export async function removeRestaurantFromSelection(
  userId: string,
  restaurantId: number,
): Promise<number[]> {
  const current = await getCachedRestaurantSelection(userId);
  const updated = current.filter((id) => id !== restaurantId);
  await cacheRestaurantSelection(userId, updated);
  return updated;
}

