import { addDays, differenceInCalendarDays, format, isValid, parse, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { LIMITS } from '../constants';

export type VisitDateResult =
  | { ok: true; date: Date }
  | { ok: false; reason: 'invalid' | 'past' | 'too_far' };

/**
 * Parse a visit date typed by a user. Accepts "24/12/2026", "24/12/26", "24/12", "24-12-2026",
 * "24.12" or "24 12 2026". Without a year, the next occurrence of the day is used.
 */
export function parseVisitDate(input: string, now: Date = new Date()): VisitDateResult {
  const match = input
    .trim()
    .match(/^(\d{1,2})\s*[/.\-\s]\s*(\d{1,2})(?:\s*[/.\-\s]\s*(\d{2}|\d{4}))?$/);
  if (!match) {
    return { ok: false, reason: 'invalid' };
  }

  const [, day, month, rawYear] = match;
  const today = startOfDay(now);

  const build = (year: number): Date | null => {
    const date = parse(`${day}/${month}/${year}`, 'd/M/yyyy', today);
    return isValid(date) ? date : null;
  };

  let date: Date | null;
  if (rawYear) {
    date = build(rawYear.length === 2 ? 2000 + Number(rawYear) : Number(rawYear));
  } else {
    date = build(today.getFullYear());
    if (date && date < today) {
      date = build(today.getFullYear() + 1);
    }
  }

  if (!date) {
    return { ok: false, reason: 'invalid' };
  }
  if (date < today) {
    return { ok: false, reason: 'past' };
  }
  if (differenceInCalendarDays(date, today) > LIMITS.MAX_DAYS_AHEAD) {
    return { ok: false, reason: 'too_far' };
  }
  return { ok: true, date };
}

/**
 * Format a date as expected by the DisneyTables API (2026-12-24)
 */
export function toApiDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Parse a date returned by the DisneyTables API (2026-12-24)
 */
export function fromApiDate(apiDate: string): Date {
  return parse(apiDate, 'yyyy-MM-dd', new Date());
}

/**
 * Format a date as typed in the alert form (24/12/2026)
 */
export function toInputDate(date: Date): string {
  return format(date, 'dd/MM/yyyy');
}

/**
 * Format a date for humans (mercredi 24 décembre 2026)
 */
export function formatLongDate(date: Date): string {
  return format(date, 'EEEE d MMMM yyyy', { locale: fr });
}

/**
 * Format an API date for humans, falling back to the raw value if it cannot be parsed
 */
export function formatApiDate(apiDate: string): string {
  const date = fromApiDate(apiDate);
  return isValid(date) ? formatLongDate(date) : apiDate;
}

/**
 * Example date shown in the alert form, always in the future
 */
export function exampleVisitDate(now: Date = new Date()): string {
  return toInputDate(addDays(now, 30));
}
