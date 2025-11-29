import { AxiosResponse } from 'axios';
import { Restaurant, RestaurantAvailabilities } from '../typings/restaurants';
import { getAxiosClient } from './axios';
import { getLogger } from '../config/logger';

const logger = getLogger();

// Cache configuration
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

interface RestaurantCache {
  data: Restaurant[];
  timestamp: number;
}

let restaurantCache: RestaurantCache | null = null;

/**
 * Check if cache is still valid
 */
function isCacheValid(): boolean {
  if (!restaurantCache) {
    return false;
  }
  const cacheAge = Date.now() - restaurantCache.timestamp;
  return cacheAge < CACHE_TTL_MS;
}

/**
 * Fetch all restaurants with caching
 */
export async function fetchRestaurants(): Promise<Restaurant[]> {
  if (isCacheValid()) {
    logger.debug('Using cached restaurants data');
    return restaurantCache!.data;
  }

  try {
    logger.debug('Fetching restaurants from API');
    const response: AxiosResponse<Restaurant[]> =
      await getAxiosClient().get<Restaurant[]>('/restaurants');

    restaurantCache = {
      data: response.data,
      timestamp: Date.now(),
    };

    logger.info({ count: response.data.length }, 'Restaurants fetched and cached');
    return response.data;
  } catch (error) {
    logger.error({ error }, 'Failed to fetch restaurants');
    // Return cached data if available, even if expired
    if (restaurantCache) {
      logger.warn('Returning expired cache due to API error');
      return restaurantCache.data;
    }
    throw error;
  }
}

/**
 * Find restaurant by ID
 */
export async function fetchRestaurantById(id: number): Promise<Restaurant | undefined> {
  const restaurants = await fetchRestaurants();
  return restaurants.find((restaurant) => restaurant.id === id);
}

/**
 * Find restaurant by Disney ID
 */
export async function fetchRestaurantByDisneyId(disneyId: string): Promise<Restaurant | undefined> {
  const restaurants = await fetchRestaurants();
  return restaurants.find((restaurant) => restaurant.disneyId === disneyId);
}

/**
 * Find restaurant by name
 */
export async function fetchRestaurantByName(name: string): Promise<Restaurant | undefined> {
  const restaurants = await fetchRestaurants();
  return restaurants.find((restaurant) => restaurant.name === name);
}

/**
 * Fetch restaurant availabilities for a specific date and party size
 */
export async function fetchRestaurantAvailabilities(
  date: string,
  restaurantId: number,
  partyMix: number,
): Promise<RestaurantAvailabilities[]> {
  try {
    logger.debug({ date, restaurantId, partyMix }, 'Fetching restaurant availabilities');

    const response = await getAxiosClient().post<RestaurantAvailabilities[]>('/availabilities', {
      date,
      restaurantId,
      partyMix,
    });

    logger.debug(
      { count: response.data.length, restaurantId },
      'Restaurant availabilities fetched',
    );
    return response.data;
  } catch (error) {
    logger.error({ error, date, restaurantId, partyMix }, 'Failed to fetch availabilities');
    throw error;
  }
}

/**
 * Clear the restaurant cache
 */
export function clearRestaurantCache(): void {
  restaurantCache = null;
  logger.info('Restaurant cache cleared');
}


