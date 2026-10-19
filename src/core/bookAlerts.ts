import { isAxiosError } from 'axios';
import { RestaurantAlert } from '../typings/bookAlerts';
import { getAxiosClient } from './axios';
import { getLogger } from '../config/logger';

const logger = getLogger();

/**
 * Create a new book alert
 */
export async function createBookAlert(
  restaurantIds: number[],
  mealPeriod: string,
  date: string,
  partyMix: number,
  discordId: string,
): Promise<RestaurantAlert> {
  try {
    logger.info({ discordId, restaurantIds, date, partyMix }, 'Creating book alert');

    const response = await getAxiosClient().post<RestaurantAlert>('/discord-alerts', {
      restaurantIds,
      discordId,
      mealPeriod: mealPeriod.toUpperCase(),
      date,
      partyMix,
    });

    logger.info({ alertId: response.data.id, discordId }, 'Book alert created successfully');
    return response.data;
  } catch (error) {
    logger.error({ error, discordId }, 'Failed to create book alert');
    throw error;
  }
}

/**
 * Fetch all book alerts
 */
export async function fetchBookAlerts(): Promise<RestaurantAlert[]> {
  try {
    const response = await getAxiosClient().get<RestaurantAlert[]>('/discord-alerts');
    logger.debug({ count: response.data.length }, 'Fetched all book alerts');
    return response.data;
  } catch (error) {
    logger.error({ error }, 'Failed to fetch book alerts');
    throw error;
  }
}

/**
 * Fetch active book alerts for a specific user
 */
export async function fetchActiveBookAlertsForUser(discordId: string): Promise<RestaurantAlert[]> {
  try {
    const response = await getAxiosClient().get<RestaurantAlert[]>('/discord-alerts', {
      params: { discordId },
    });
    logger.debug({ discordId, count: response.data.length }, 'Fetched user book alerts');
    return response.data;
  } catch (error) {
    logger.error({ error, discordId }, 'Failed to fetch user book alerts');
    throw error;
  }
}

/**
 * Fetch a specific book alert by ID, or null if it does not exist
 */
export async function fetchBookAlertById(id: number): Promise<RestaurantAlert | null> {
  try {
    const response = await getAxiosClient().get<RestaurantAlert>('/discord-alert', {
      params: { id },
    });
    logger.debug({ alertId: id }, 'Fetched book alert by ID');
    return response.data || null;
  } catch (error) {
    if (isAxiosError(error) && error.response?.status === 404) {
      return null;
    }
    logger.error({ error, alertId: id }, 'Failed to fetch book alert by ID');
    throw error;
  }
}

/**
 * Mark a book alert as complete
 */
export async function completeBookAlert(id: number): Promise<RestaurantAlert> {
  try {
    logger.info({ alertId: id }, 'Completing book alert');

    const response = await getAxiosClient().get<RestaurantAlert>('/complete-alert', {
      params: { id },
    });

    logger.info({ alertId: id }, 'Book alert completed successfully');
    return response.data;
  } catch (error) {
    logger.error({ error, alertId: id }, 'Failed to complete book alert');
    throw error;
  }
}

