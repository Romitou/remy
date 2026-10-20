import { Restaurant } from '../typings/restaurants';
import { normalizeText } from '../core/utils';

/**
 * Filter restaurants whose name contains every word of the query, ignoring case and accents
 */
export function searchRestaurants(restaurants: Restaurant[], query: string): Restaurant[] {
  const words = normalizeText(query).split(/\s+/).filter(Boolean);
  return restaurants.filter((restaurant) => {
    const name = normalizeText(restaurant.name);
    return words.every((word) => name.includes(word));
  });
}
