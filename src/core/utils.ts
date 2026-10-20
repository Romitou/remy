import { EMOJIS } from '../constants';

export type MealPeriod = 'breakfast' | 'lunch' | 'dinner';

export const MEAL_PERIODS: readonly MealPeriod[] = ['breakfast', 'lunch', 'dinner'];

/**
 * Check whether a value is a known meal period (case-insensitive)
 */
export function isMealPeriod(value: string): value is MealPeriod {
  return (MEAL_PERIODS as readonly string[]).includes(value);
}

/**
 * Convert meal period to French
 */
export function frenchMealPeriod(mealPeriod: string): string {
  switch (mealPeriod.toLowerCase()) {
    case 'lunch':
      return 'Déjeuner';
    case 'dinner':
      return 'Dîner';
    case 'breakfast':
      return 'Petit-déjeuner';
    default:
      return mealPeriod;
  }
}

/**
 * Get the emoji matching a meal period
 */
export function mealPeriodEmoji(mealPeriod: string): string {
  switch (mealPeriod.toLowerCase()) {
    case 'breakfast':
      return EMOJIS.BREAKFAST;
    case 'lunch':
      return EMOJIS.LUNCH;
    default:
      return EMOJIS.DINNER;
  }
}

/**
 * "1 personne" / "4 personnes"
 */
export function formatPartyMix(partyMix: number): string {
  return `${partyMix} ${partyMix > 1 ? 'personnes' : 'personne'}`;
}

/**
 * Convert 12-hour time format to 24-hour format
 */
export function convertTime12to24(time12h: string): string {
  const [time, modifier] = time12h.trim().split(' ');
  const [rawHours, minutes] = time.split(':');
  let hours = parseInt(rawHours, 10) % 12;

  if (modifier?.toUpperCase() === 'PM') {
    hours += 12;
  } else if (modifier?.toUpperCase() !== 'AM') {
    // Already in 24-hour format
    hours = parseInt(rawHours, 10);
  }

  return `${String(hours).padStart(2, '0')}:${minutes}`;
}

/**
 * Lowercase and strip accents, to compare names regardless of how they are typed
 */
export function normalizeText(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}
