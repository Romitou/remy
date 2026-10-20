/**
 * Prefixes of the customIds of the bot components. Arguments are appended with dashes
 * (e.g. "openAlertForm-12-0").
 */
export const CUSTOM_IDS = {
  START_ALERT: 'startAlertBook',
  RESTAURANT_PAGE: 'restaurantPage',
  PICK_RESTAURANT: 'pickRestaurant',
  SEARCH_RESTAURANT: 'searchRestaurant',
  SEARCH_RESTAURANT_FORM: 'searchRestaurantForm',
  OPEN_ALERT_FORM: 'openAlertForm',
  ALERT_FORM: 'alertForm',
  MY_ALERTS: 'myAlerts',
  // Button of the onboarding message, kept for messages already sent
  MY_ALERTS_LEGACY: 'myNotifications',
  MANAGE_ALERT: 'manageAlert',
  DELETE_ALERT: 'deleteAlert',
  CANCEL_ALERT: 'cancelAlert',
  DELETE_ALL_ALERTS: 'deleteAllAlerts',
  CONFIRM_DELETE_ALL_ALERTS: 'confirmDeleteAllAlerts',
  // Buttons of the notifications sent in DM
  ALERT_SOLVED: 'markNotificationSolved',
  STOP_ALERT: 'stopAlert',
} as const;

/**
 * Build a customId from a prefix and its arguments
 */
export function buildCustomId(prefix: string, ...args: (string | number)[]): string {
  return [prefix, ...args].join('-');
}

/**
 * Get the prefix of a customId
 */
export function customIdPrefix(customId: string): string {
  return customId.split('-')[0];
}

/**
 * Split a customId into its dash-separated parts, without the leading prefix
 */
export function customIdArgs(customId: string): string[] {
  return customId.split('-').slice(1);
}

/**
 * Parse a strictly positive integer, returning null if the value is invalid
 */
export function parsePositiveInt(raw: string | undefined): number | null {
  if (raw === undefined || !/^\d+$/.test(raw)) {
    return null;
  }
  const value = Number.parseInt(raw, 10);
  return value > 0 ? value : null;
}
