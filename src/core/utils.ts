import { format, parse } from 'date-fns';
import { fr } from 'date-fns/locale';
import { EMOJIS } from '../constants';

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
 * Normalize date from YYYY-MM-DD to DD/MM/YYYY
 */
export function normalizeDate(rawDate: string): string {
  try {
    const date = parse(rawDate, 'yyyy-MM-dd', new Date());
    return format(date, 'dd/MM/yyyy', { locale: fr });
  } catch {
    // Fallback to simple string manipulation if parsing fails
    const [year, month, day] = rawDate.split('-');
    return `${day}/${month}/${year}`;
  }
}

/**
 * Convert 12-hour time format to 24-hour format
 */
export function convertTime12to24(time12h: string): string {
  const [time, modifier] = time12h.split(' ');
  let [hours, minutes] = time.split(':');

  if (hours === '12') {
    hours = '00';
  }

  if (modifier?.toUpperCase() === 'PM') {
    hours = String(parseInt(hours, 10) + 12);
  }

  return `${hours}:${minutes}`;
}

/**
 * Format a date for display in French
 */
export function formatDateFr(date: Date): string {
  return format(date, 'PPP', { locale: fr });
}

/**
 * Parse a date string in DD/MM/YYYY format
 */
export function parseDateDDMMYYYY(dateStr: string): Date {
  return parse(dateStr, 'dd/MM/yyyy', new Date());
}

/**
 * Validate if a date string is in DD/MM/YYYY format
 */
export function isValidDateFormat(dateStr: string): boolean {
  const regex = /^\d{2}\/\d{2}\/\d{4}$/;
  if (!regex.test(dateStr)) {
    return false;
  }

  try {
    const date = parseDateDDMMYYYY(dateStr);
    return !isNaN(date.getTime());
  } catch {
    return false;
  }
}


