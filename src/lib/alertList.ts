import { fetchActiveBookAlertsForUser } from '../core/bookAlerts';
import { fetchRestaurants } from '../core/restaurants';
import { alertListView, View } from './views';

/**
 * Load the active alerts of a user and build the list view
 */
export async function loadAlertListView(userId: string, notice?: string): Promise<View> {
  const [alerts, restaurants] = await Promise.all([
    fetchActiveBookAlertsForUser(userId),
    fetchRestaurants(),
  ]);
  const restaurantsById = new Map(restaurants.map((restaurant) => [restaurant.id, restaurant]));
  return alertListView(alerts, restaurantsById, notice);
}
