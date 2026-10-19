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

export const LIMITS = {
  DATE_MIN_LENGTH: 10,
  DATE_MAX_LENGTH: 10,
  PARTY_MIN: 1,
  PARTY_MAX: 10,
  PARTY_INPUT_MIN_LENGTH: 1,
  PARTY_INPUT_MAX_LENGTH: 2,
  MAX_RESTAURANTS_PER_ALERT: 1,
  MAX_ALERTS_PER_USER: 10,
  DATE_RANGE_DAYS: 90,
  RESTAURANTS_PER_PAGE: 20, // Discord limit is 25, we keep 20 for pagination buttons
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
      DESCRIPTION: 'La date que vous avez saisie est déjà passée. Veuillez saisir une date actuelle ou future pour votre visite.',
    },
    INVALID_PARTY: {
      TITLE: `${EMOJIS.WARNING} Nombre de personnes invalide`,
      DESCRIPTION: 'Le nombre de couverts que vous avez saisi n\'est pas valide.\n\n💡 **Règles :**\n• Minimum : 1 personne\n• Maximum : 10 personnes\n• Format : nombre entier uniquement\n\n✨ Réessayez avec un nombre valide !',
    },
    RESTAURANT_NOT_FOUND: {
      TITLE: `${EMOJIS.ERROR} Restaurant introuvable`,
      DESCRIPTION: 'Le restaurant sélectionné n\'a pas pu être trouvé dans notre base de données.\n\n💡 **Suggestions :**\n• Vérifiez que le restaurant est toujours disponible\n• Réessayez en quelques instants\n• Contactez un administrateur si le problème persiste',
    },
    MAX_RESTAURANTS_SELECTED: {
      TITLE: `${EMOJIS.WARNING} Limite de restaurants atteinte`,
      DESCRIPTION: `Vous ne pouvez sélectionner que ${LIMITS.MAX_RESTAURANTS_PER_ALERT} restaurants maximum par notification.\n\n💡 **Astuce :** Créez plusieurs notifications si vous souhaitez surveiller plus de restaurants !`,
    },
    MAX_ALERTS_REACHED: {
      TITLE: `${EMOJIS.WARNING} Limite de notifications atteinte`,
      DESCRIPTION: `Vous avez atteint la limite de ${LIMITS.MAX_ALERTS_PER_USER} notifications actives.\n\n💡 **Solution :** Supprimez d'anciennes notifications via "*Mes notifications*" avant d'en créer de nouvelles.`,
    },
    DUPLICATE_ALERT: {
      TITLE: `${EMOJIS.WARNING} Notification déjà existante`,
      DESCRIPTION: 'Vous avez déjà une notification active avec ces mêmes critères.\n\n💡 **Astuce :** Consultez vos notifications existantes via le bouton "*Mes notifications*".',
    },
    ALERT_NOT_FOUND: {
      TITLE: `${EMOJIS.ERROR} Notification introuvable`,
      DESCRIPTION: 'Cette notification n\'existe plus ou ne vous appartient pas.\n\n💡 **Astuce :** Consultez vos notifications actives via le bouton "*Voir mes alertes*".',
    },
    NO_RESTAURANTS_SELECTED: {
      TITLE: `${EMOJIS.WARNING} Aucun restaurant sélectionné`,
      DESCRIPTION: 'Vous devez sélectionner au moins un restaurant pour continuer.\n\n✨ Veuillez réessayer en choisissant un ou plusieurs restaurants.',
    },
  },
  SUCCESS: {
    NOTIFICATION_CREATED: (restaurantName: string, date: string, partyMix: number, mealPeriod: string) => ({
      TITLE: `${EMOJIS.SUCCESS} Notification enregistrée avec succès !`,
      DESCRIPTION: `${EMOJIS.SPARKLES} **Parfait !** Je surveillerai les disponibilités pour vous.\n\n${EMOJIS.RESTAURANT} **Restaurant :** ${restaurantName}\n${EMOJIS.CALENDAR} **Date :** ${date}\n${EMOJIS.PARTY} **Couverts :** ${partyMix} personne(s)\n${EMOJIS.BELL} **Période :** ${mealPeriod}\n\n${EMOJIS.CHEF} **Promis !** Dès qu'une table se libère, vous recevrez un message privé instantanément.\n\n💡 **Astuce :** Gérez vos notifications via le bouton "*Mes notifications*" dans le salon principal.`,
    }),
  },
  INFO: {
    SELECT_RESTAURANTS: (page: number, totalPages: number, totalRestaurants: number) => ({
      TITLE: `${EMOJIS.RESTAURANT} Sélectionnez vos restaurants favoris`,
      DESCRIPTION: `Choisissez jusqu'à **${LIMITS.MAX_RESTAURANTS_PER_ALERT} restaurants** pour lesquels vous souhaitez être notifié. Vous recevrez une alerte dès qu'une table se libère dans l'un d'entre eux !\n\n📊 **${totalRestaurants} restaurants disponibles** • Page ${page}/${totalPages}`,
      FOOTER: `Plus vous sélectionnez de restaurants, plus vous avez de chances d'obtenir une réservation !`,
    }),
    CONFIRM_NOTIFICATION: (restaurantNames: string[], _date: string, _partyMix: number, _mealPeriod: string) => ({
      TITLE: `${EMOJIS.SPARKLES} Récapitulatif de votre notification`,
      DESCRIPTION: `Vérifiez les informations ci-dessous avant de confirmer la création de votre notification.\n\n📋 **Vous serez alerté dès qu'une disponibilité apparaît pour ces critères.**`,
      RESTAURANTS_FIELD: restaurantNames.map(name => `• ${name}`).join('\n'),
    }),
  },
} as const;

