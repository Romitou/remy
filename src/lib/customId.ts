/**
 * Helpers to read values encoded in Discord component customIds
 * (e.g. "validateNotification-12-24/12/2025-4-lunch").
 */

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

/**
 * Parse a comma-separated list of ids, returning null if any of them is invalid
 */
export function parseIdList(raw: string | undefined): number[] | null {
  if (!raw) {
    return null;
  }
  const ids = raw.split(',').map(parsePositiveInt);
  if (ids.some((id) => id === null)) {
    return null;
  }
  return ids as number[];
}
