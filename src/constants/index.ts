export const COLORS = {
  PRIMARY: 0x5865f2,
  SUCCESS: 0x57f287,
  ERROR: 0xed4245,
  WARNING: 0xfee75c,
  MUTED: 0x99aab5,
  NAVY: 0x001489,
} as const;

export const EMOJIS = {
  RESTAURANT: '🍽️',
  CALENDAR: '📅',
  PARTY: '👥',
  BELL: '🔔',
  BELL_OFF: '🔕',
  SUCCESS: '✅',
  ERROR: '❌',
  WARNING: '⚠️',
  TRASH: '🗑️',
  EDIT: '✏️',
  BACK: '↩️',
  PREVIOUS: '◀️',
  NEXT: '▶️',
  SEARCH: '🔍',
  ADD: '➕',
  LIST: '📋',
  CLOCK: '🕒',
  BREAKFAST: '🥐',
  LUNCH: '🍔',
  DINNER: '🍝',
  SPARKLES: '✨',
} as const;

export const IMAGES = {
  ERROR: 'https://s3-01.romitou.fr/disneytables/error.png',
  WELCOME: 'https://s3-01.romitou.fr/disneytables/welcome.jpg',
} as const;

/**
 * Where users book once a table is available
 */
export const BOOKING_URL = 'https://www.disneylandparis.com/fr-fr/restaurants/';

export const LIMITS = {
  PARTY_MIN: 1,
  PARTY_MAX: 10,
  MAX_ALERTS_PER_USER: 10,
  // How far in the future a visit date can be, to catch typos in the year
  MAX_DAYS_AHEAD: 400,
  // Discord allows 25 options per select menu
  RESTAURANTS_PER_PAGE: 25,
} as const;

export const MESSAGES = {
  GENERIC_ERROR: {
    TITLE: '🛠️ Oups, quelque chose ne fonctionne pas',
    DESCRIPTION:
      "Une erreur technique m'empêche de répondre. Elle a été signalée et sera corrigée au plus vite : réessayez dans quelques instants.",
  },
  ALERT_NOT_FOUND: {
    TITLE: `${EMOJIS.ERROR} Alerte introuvable`,
    DESCRIPTION: "Cette alerte n'existe plus ou ne vous appartient pas.",
  },
  EXPIRED: {
    TITLE: '⌛ Ce message a expiré',
    DESCRIPTION: 'Rémy a été mis à jour depuis son envoi. Reprenez depuis les boutons ci-dessous.',
  },
} as const;
