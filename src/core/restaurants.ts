import { AxiosResponse } from 'axios';
import { Restaurant } from '../typings/restaurants';
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
 * Restaurants users can pick, sorted by name
 */
export async function fetchSelectableRestaurants(): Promise<Restaurant[]> {
  const restaurants = await fetchRestaurants();
  return restaurants
    .filter((restaurant) => restaurant.displayed !== false)
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
}
