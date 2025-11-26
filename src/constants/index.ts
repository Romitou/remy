// Constantes pour améliorer la cohérence et la maintenance du bot

export const COLORS = {
  PRIMARY: 0x5865F2, // Discord Blurple
  SUCCESS: 0x57F287, // Vert Discord
  ERROR: 0xED4245, // Rouge Discord
  WARNING: 0xFEE75C, // Jaune Discord
  INFO: 0x5865F2, // Bleu Discord
  NAVY: 0x001489, // Bleu marine pour Disneyland
} as const;

export const EMOJIS = {
  RESTAURANT: '🍽️',
  CALENDAR: '📅',
  PARTY: '👥',
  BELL: '🔔',
  SUCCESS: '✅',
  ERROR: '❌',
  WARNING: '⚠️',
  TRASH: '🗑️',
  EDIT: '✏️',
  BACK: '◀️',
  BREAKFAST: '🥐',
  LUNCH: '🍔',
  DINNER: '🍝',
  LOADING: '⏳',
  CHEF: '👨‍🍳',
  SPARKLES: '✨',
} as const;

export const IMAGES = {
  ERROR: 'https://s3-01.romitou.fr/disneytables/error.png',
  NOTIFICATION_CREATED: 'https://s3-01.romitou.fr/disneytables/notificationCreated.jpg',
  DEFAULT_RESTAURANT: 'https://media.disneylandparis.com/d4th/fr-fr/images/n031922_2049jul09_world_food-the-lion-king-jungle-festival-buffet_5-1_tcm808-224702.jpg?w=1920',
} as const;

export const MESSAGES = {
  ERROR: {
    GENERIC: {
      TITLE: `${EMOJIS.ERROR} Oups, quelque chose s'est mal passé !`,
      DESCRIPTION: 'On dirait bien que quelque chose ne fonctionne pas comme prévu. Pas d\'inquiétude, cet incident technique a été remonté et sera corrigé le plus vite possible.\n\n💡 **Que faire ?** Réessayez dans quelques instants ou contactez un administrateur si le problème persiste.',
    },
    INVALID_DATE: {
      TITLE: `${EMOJIS.WARNING} Date invalide`,
      DESCRIPTION: 'La date que vous avez saisie n\'est pas valide.\n\n💡 **Format attendu :** JJ/MM/AAAA\n📌 **Exemple :** 24/12/2024\n\n✨ Veuillez réessayer avec le bon format.',
    },
    PAST_DATE: {
      TITLE: `${EMOJIS.WARNING} Date dans le passé`,
      DESCRIPTION: 'La date que vous avez saisie est déjà passée.\n\n💡 **Astuce :** Veuillez saisir une date actuelle ou future pour votre visite.\n\n✨ Réessayez avec une date à venir !',
    },
    INVALID_PARTY: {
      TITLE: `${EMOJIS.WARNING} Nombre de personnes invalide`,
      DESCRIPTION: 'Le nombre de couverts que vous avez saisi n\'est pas valide.\n\n💡 **Règles :**\n• Minimum : 1 personne\n• Maximum : 10 personnes\n• Format : nombre entier uniquement\n\n✨ Réessayez avec un nombre valide !',
    },
    RESTAURANT_NOT_FOUND: {
      TITLE: `${EMOJIS.ERROR} Restaurant introuvable`,
      DESCRIPTION: 'Le restaurant sélectionné n\'a pas pu être trouvé dans notre base de données.\n\n💡 **Suggestions :**\n• Vérifiez que le restaurant est toujours disponible\n• Réessayez en quelques instants\n• Contactez un administrateur si le problème persiste',
    },
  },
  SUCCESS: {
    NOTIFICATION_CREATED: (restaurantName: string, date: string, partyMix: number, mealPeriod: string) => ({
      TITLE: `${EMOJIS.SUCCESS} Notification enregistrée avec succès !`,
      DESCRIPTION: `${EMOJIS.SPARKLES} **Parfait !** Je surveillerai les disponibilités pour vous.\n\n${EMOJIS.RESTAURANT} **Restaurant :** ${restaurantName}\n${EMOJIS.CALENDAR} **Date :** ${date}\n${EMOJIS.PARTY} **Couverts :** ${partyMix} personne(s)\n${EMOJIS.BELL} **Période :** ${mealPeriod}\n\n${EMOJIS.CHEF} **Promis !** Dès qu'une table se libère, vous recevrez un message privé instantanément.\n\n💡 **Astuce :** Gérez vos notifications via le bouton "*Mes notifications*" dans le salon principal.`,
    }),
  },
} as const;

export const LIMITS = {
  DATE_MIN_LENGTH: 10,
  DATE_MAX_LENGTH: 10,
  PARTY_MIN: 1,
  PARTY_MAX: 10,
  PARTY_INPUT_MIN_LENGTH: 1,
  PARTY_INPUT_MAX_LENGTH: 2,
} as const;

