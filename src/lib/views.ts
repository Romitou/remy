import {
  ActionRowBuilder,
  APIActionRowComponent,
  APIComponentInMessageActionRow,
  APIEmbed,
  ButtonBuilder,
  ButtonStyle,
  LabelBuilder,
  ModalBuilder,
  StringSelectMenuBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { Restaurant } from '../typings/restaurants';
import { RestaurantAlert } from '../typings/bookAlerts';
import { COLORS, EMOJIS, LIMITS, MESSAGES } from '../constants';
import {
  formatPartyMix,
  frenchMealPeriod,
  MEAL_PERIODS,
  MealPeriod,
  mealPeriodEmoji,
} from '../core/utils';
import { exampleVisitDate, formatApiDate } from './dates';
import type { AlertDraft } from './alertDraft';
import { buildCustomId, CUSTOM_IDS } from './customId';

/**
 * Content of an ephemeral message of the bot
 */
export interface View {
  embeds: APIEmbed[];
  components: APIActionRowComponent<APIComponentInMessageActionRow>[];
}

/**
 * What an alert is about, as shown to users
 */
export interface AlertSummary {
  restaurantName: string;
  imageUrl?: string | null;
  date: string;
  mealPeriod: string;
  partyMix: number;
}

const UNKNOWN_RESTAURANT = 'Restaurant inconnu';

function button(
  customId: string,
  label: string,
  style: ButtonStyle,
  emoji?: string,
  disabled = false,
): ButtonBuilder {
  const builder = new ButtonBuilder()
    .setCustomId(customId)
    .setLabel(label)
    .setStyle(style)
    .setDisabled(disabled);
  return emoji ? builder.setEmoji(emoji) : builder;
}

function buttonRow(...buttons: ButtonBuilder[]): View['components'][number] {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(buttons).toJSON();
}

function alertFields(summary: AlertSummary): NonNullable<APIEmbed['fields']> {
  return [
    { name: `${EMOJIS.RESTAURANT} Restaurant`, value: summary.restaurantName },
    { name: `${EMOJIS.CALENDAR} Date`, value: formatApiDate(summary.date), inline: true },
    {
      name: `${mealPeriodEmoji(summary.mealPeriod)} Repas`,
      value: frenchMealPeriod(summary.mealPeriod),
      inline: true,
    },
    { name: `${EMOJIS.PARTY} Convives`, value: formatPartyMix(summary.partyMix), inline: true },
  ];
}

/**
 * Summary of an alert returned by the API
 */
export function summarizeAlert(alert: RestaurantAlert, restaurant?: Restaurant): AlertSummary {
  return {
    restaurantName: restaurant?.name ?? UNKNOWN_RESTAURANT,
    imageUrl: restaurant?.imageUrl,
    date: alert.date,
    mealPeriod: alert.mealPeriod,
    partyMix: alert.partyMix,
  };
}

/**
 * Restaurant of an alert (alerts currently watch a single restaurant)
 */
export function alertRestaurantId(alert: RestaurantAlert): number | undefined {
  return alert.checks[0]?.restaurantId;
}

/* ------------------------------------------------------------------------------------------ */
/* Alert creation                                                                              */
/* ------------------------------------------------------------------------------------------ */

/**
 * Step 1: pick a restaurant, by browsing pages or searching by name
 */
export function restaurantPickerView(
  restaurants: Restaurant[],
  options: { page?: number; query?: string } = {},
): View {
  const { query } = options;
  const perPage = LIMITS.RESTAURANTS_PER_PAGE;
  const totalPages = Math.max(1, Math.ceil(restaurants.length / perPage));
  const page = query ? 1 : Math.min(Math.max(options.page ?? 1, 1), totalPages);
  const pageRestaurants = restaurants.slice((page - 1) * perPage, page * perPage);

  let description =
    "Choisissez le restaurant à surveiller : je vous enverrai un message privé dès qu'une table s'y libère.";
  if (query && restaurants.length === 0) {
    description = `Aucun restaurant ne correspond à « ${query} ». Vérifiez l'orthographe ou essayez avec un seul mot.`;
  } else if (query) {
    description = `**${restaurants.length}** restaurant(s) correspondant à « ${query} ».`;
    if (restaurants.length > perPage) {
      description += ` Seuls les ${perPage} premiers sont affichés : précisez votre recherche.`;
    }
  } else {
    description += `\n\n${EMOJIS.SEARCH} Utilisez **Rechercher** pour trouver un restaurant par son nom.`;
  }

  const components: View['components'] = [];

  if (pageRestaurants.length > 0) {
    const select = new StringSelectMenuBuilder()
      .setCustomId(CUSTOM_IDS.PICK_RESTAURANT)
      .setPlaceholder(`${EMOJIS.RESTAURANT} Choisissez un restaurant`)
      .addOptions(
        pageRestaurants.map((restaurant) => ({
          label: restaurant.name.slice(0, 100),
          value: String(restaurant.id),
        })),
      );
    components.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select).toJSON());
  }

  const navigation: ButtonBuilder[] = [];
  if (!query && totalPages > 1) {
    navigation.push(
      button(
        buildCustomId(CUSTOM_IDS.RESTAURANT_PAGE, page - 1),
        'Précédent',
        ButtonStyle.Secondary,
        EMOJIS.PREVIOUS,
        page <= 1,
      ),
      button(
        buildCustomId(CUSTOM_IDS.RESTAURANT_PAGE, page + 1),
        'Suivant',
        ButtonStyle.Secondary,
        EMOJIS.NEXT,
        page >= totalPages,
      ),
    );
  }
  navigation.push(
    button(CUSTOM_IDS.SEARCH_RESTAURANT, 'Rechercher', ButtonStyle.Primary, EMOJIS.SEARCH),
  );
  if (query) {
    navigation.push(
      button(
        buildCustomId(CUSTOM_IDS.RESTAURANT_PAGE, 1),
        'Tous les restaurants',
        ButtonStyle.Secondary,
        EMOJIS.LIST,
      ),
    );
  }
  components.push(buttonRow(...navigation));

  return {
    embeds: [
      {
        title: `${EMOJIS.BELL} Nouvelle alerte · Étape 1/2`,
        description,
        color: COLORS.PRIMARY,
        footer: query
          ? undefined
          : { text: `Page ${page}/${totalPages} · ${restaurants.length} restaurants` },
      },
    ],
    components,
  };
}

/**
 * Modal to search a restaurant by name
 */
export function searchRestaurantModal(): ModalBuilder {
  return new ModalBuilder()
    .setCustomId(CUSTOM_IDS.SEARCH_RESTAURANT_FORM)
    .setTitle('Rechercher un restaurant')
    .addLabelComponents(
      new LabelBuilder()
        .setLabel('Nom du restaurant')
        .setDescription('Un mot suffit, sans se soucier des accents')
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId('query')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('Ex. : Ratatouille, Auberge, Steakhouse…')
            .setMinLength(2)
            .setMaxLength(50)
            .setRequired(true),
        ),
    );
}

/**
 * Step 2: date, party size and meal period, prefilled with the last values typed by the user.
 * replaceAlertId is set when editing an existing alert.
 */
export function alertFormModal(
  restaurant: Restaurant,
  draft: AlertDraft,
  replaceAlertId = 0,
): ModalBuilder {
  const title = `Étape 2/2 · ${restaurant.name}`;

  const dateInput = new TextInputBuilder()
    .setCustomId('date')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder(`Ex. : ${exampleVisitDate()}`)
    .setMinLength(3)
    .setMaxLength(10)
    .setRequired(true);
  if (draft.date) dateInput.setValue(draft.date);

  const partyMixInput = new TextInputBuilder()
    .setCustomId('partyMix')
    .setStyle(TextInputStyle.Short)
    .setPlaceholder('Ex. : 4')
    .setMinLength(1)
    .setMaxLength(2)
    .setRequired(true);
  if (draft.partyMix) partyMixInput.setValue(draft.partyMix);

  const mealPeriodSelect = new StringSelectMenuBuilder()
    .setCustomId('mealPeriod')
    .setPlaceholder('Choisissez un repas')
    .setRequired(true)
    .addOptions(
      MEAL_PERIODS.map((mealPeriod: MealPeriod) => ({
        label: frenchMealPeriod(mealPeriod),
        value: mealPeriod,
        emoji: mealPeriodEmoji(mealPeriod),
        default: draft.mealPeriod === mealPeriod,
      })),
    );

  return new ModalBuilder()
    .setCustomId(buildCustomId(CUSTOM_IDS.ALERT_FORM, restaurant.id, replaceAlertId))
    .setTitle(title.length > 45 ? `${title.slice(0, 44)}…` : title)
    .addLabelComponents(
      new LabelBuilder()
        .setLabel('Date de votre visite')
        .setDescription('Jour et mois suffisent : 24/12 ou 24/12/2026')
        .setTextInputComponent(dateInput),
      new LabelBuilder()
        .setLabel('Nombre de convives')
        .setDescription(`De ${LIMITS.PARTY_MIN} à ${LIMITS.PARTY_MAX} personnes`)
        .setTextInputComponent(partyMixInput),
      new LabelBuilder().setLabel('Repas').setStringSelectMenuComponent(mealPeriodSelect),
    );
}

function correctFormButton(restaurantId: number, replaceAlertId: number): ButtonBuilder {
  return button(
    buildCustomId(CUSTOM_IDS.OPEN_ALERT_FORM, restaurantId, replaceAlertId),
    'Corriger',
    ButtonStyle.Primary,
    EMOJIS.EDIT,
  );
}

/**
 * The alert form contains invalid values
 */
export function formErrorView(
  restaurant: Restaurant,
  errors: string[],
  replaceAlertId: number,
): View {
  return {
    embeds: [
      {
        title: `${EMOJIS.WARNING} Quelques informations sont à corriger`,
        description: `${errors.map((error) => `• ${error}`).join('\n')}\n\nVos réponses ont été conservées : il vous suffit de les corriger.`,
        color: COLORS.WARNING,
        footer: { text: restaurant.name },
      },
    ],
    components: [
      buttonRow(
        correctFormButton(restaurant.id, replaceAlertId),
        button(
          buildCustomId(CUSTOM_IDS.RESTAURANT_PAGE, 1),
          'Changer de restaurant',
          ButtonStyle.Secondary,
          EMOJIS.RESTAURANT,
        ),
      ),
    ],
  };
}

/**
 * The user already has an alert with the same criteria
 */
export function duplicateAlertView(restaurantId: number, replaceAlertId: number): View {
  return {
    embeds: [
      {
        title: `${EMOJIS.BELL} Cette alerte existe déjà`,
        description:
          'Vous avez déjà une alerte active pour ce restaurant, cette date, ce repas et ce nombre de convives : je la surveille déjà pour vous.',
        color: COLORS.WARNING,
      },
    ],
    components: [
      buttonRow(
        correctFormButton(restaurantId, replaceAlertId),
        button(CUSTOM_IDS.MY_ALERTS, 'Mes alertes', ButtonStyle.Secondary, EMOJIS.LIST),
      ),
    ],
  };
}

/**
 * The user reached the maximum number of active alerts
 */
export function tooManyAlertsView(): View {
  return {
    embeds: [
      {
        title: `${EMOJIS.WARNING} Limite d'alertes atteinte`,
        description: `Vous avez déjà **${LIMITS.MAX_ALERTS_PER_USER} alertes actives**, le maximum. Supprimez-en une pour en créer une nouvelle.`,
        color: COLORS.WARNING,
      },
    ],
    components: [
      buttonRow(button(CUSTOM_IDS.MY_ALERTS, 'Mes alertes', ButtonStyle.Primary, EMOJIS.LIST)),
    ],
  };
}

/**
 * The alert has been created or edited
 */
export function alertSavedView(
  alertId: number,
  summary: AlertSummary,
  options: { edited: boolean; dmOpen: boolean },
): View {
  const fields = alertFields(summary);
  if (!options.dmOpen) {
    fields.push({
      name: `${EMOJIS.WARNING} Vos messages privés sont fermés`,
      value:
        "Je n'ai pas pu vous écrire : sans messages privés, vous ne recevrez **aucune notification**. Activez-les dans les paramètres de confidentialité du serveur (« Messages privés »).",
    });
  }

  return {
    embeds: [
      {
        title: options.edited
          ? `${EMOJIS.SUCCESS} Alerte modifiée`
          : `${EMOJIS.SUCCESS} Alerte créée`,
        description: options.dmOpen
          ? "Je surveille les disponibilités et vous envoie un message privé dès qu'une table se libère."
          : 'Je surveille les disponibilités, mais je ne peux pas encore vous prévenir (voir ci-dessous).',
        color: options.dmOpen ? COLORS.SUCCESS : COLORS.WARNING,
        thumbnail: summary.imageUrl ? { url: summary.imageUrl } : undefined,
        fields,
        footer: { text: `Alerte n°${alertId}` },
      },
    ],
    components: [
      buttonRow(
        button(
          buildCustomId(CUSTOM_IDS.CANCEL_ALERT, alertId),
          options.edited ? "Supprimer l'alerte" : 'Annuler',
          ButtonStyle.Danger,
          EMOJIS.TRASH,
        ),
        button(CUSTOM_IDS.START_ALERT, 'Nouvelle alerte', ButtonStyle.Success, EMOJIS.ADD),
        button(CUSTOM_IDS.MY_ALERTS, 'Mes alertes', ButtonStyle.Secondary, EMOJIS.LIST),
      ),
    ],
  };
}

/**
 * Confirmation sent in DM when an alert is created: it also checks that DMs are open
 */
export function alertConfirmationDm(alertId: number, summary: AlertSummary): APIEmbed {
  return {
    title: `${EMOJIS.BELL} Alerte activée`,
    description:
      "C'est ici que je vous préviendrai dès qu'une table se libère. Gardez vos messages privés ouverts !",
    color: COLORS.PRIMARY,
    thumbnail: summary.imageUrl ? { url: summary.imageUrl } : undefined,
    fields: alertFields(summary),
    footer: { text: `Alerte n°${alertId} · Gérez vos alertes avec /mes-alertes` },
  };
}

/* ------------------------------------------------------------------------------------------ */
/* Alert management                                                                            */
/* ------------------------------------------------------------------------------------------ */

/**
 * List of the active alerts of a user, with an optional notice on top (e.g. "alert deleted")
 */
export function alertListView(
  alerts: RestaurantAlert[],
  restaurantsById: Map<number, Restaurant>,
  notice?: string,
): View {
  const prefix = notice ? `${notice}\n\n` : '';

  if (alerts.length === 0) {
    return {
      embeds: [
        {
          title: `${EMOJIS.BELL} Mes alertes`,
          description: `${prefix}Vous n'avez aucune alerte active. Créez-en une pour être prévenu dès qu'une table se libère !`,
          color: COLORS.PRIMARY,
        },
      ],
      components: [
        buttonRow(
          button(CUSTOM_IDS.START_ALERT, 'Créer une alerte', ButtonStyle.Success, EMOJIS.ADD),
        ),
      ],
    };
  }

  const sorted = [...alerts].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 25);
  const summaries = sorted.map((alert) => {
    const restaurantId = alertRestaurantId(alert);
    return summarizeAlert(alert, restaurantId ? restaurantsById.get(restaurantId) : undefined);
  });

  const select = new StringSelectMenuBuilder()
    .setCustomId(CUSTOM_IDS.MANAGE_ALERT)
    .setPlaceholder(`${EMOJIS.EDIT} Modifier ou supprimer une alerte`)
    .addOptions(
      sorted.map((alert, index) => ({
        label: summaries[index].restaurantName.slice(0, 100),
        description:
          `${formatApiDate(alert.date)} · ${frenchMealPeriod(alert.mealPeriod)} · ${formatPartyMix(alert.partyMix)}`.slice(
            0,
            100,
          ),
        value: String(alert.id),
        emoji: mealPeriodEmoji(alert.mealPeriod),
      })),
    );

  const atLimit = alerts.length >= LIMITS.MAX_ALERTS_PER_USER;

  return {
    embeds: [
      {
        title: `${EMOJIS.BELL} Mes alertes (${alerts.length}/${LIMITS.MAX_ALERTS_PER_USER})`,
        description: `${prefix}Je surveille ces restaurants pour vous. Sélectionnez une alerte pour la modifier ou la supprimer.`,
        color: COLORS.PRIMARY,
        fields: summaries.map((summary) => ({
          name: `${mealPeriodEmoji(summary.mealPeriod)} ${summary.restaurantName}`,
          value: `${formatApiDate(summary.date)}\n${frenchMealPeriod(summary.mealPeriod)} · ${formatPartyMix(summary.partyMix)}`,
        })),
      },
    ],
    components: [
      new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(select).toJSON(),
      buttonRow(
        button(
          CUSTOM_IDS.START_ALERT,
          'Créer une alerte',
          ButtonStyle.Success,
          EMOJIS.ADD,
          atLimit,
        ),
        button(CUSTOM_IDS.DELETE_ALL_ALERTS, 'Tout supprimer', ButtonStyle.Danger, EMOJIS.TRASH),
      ),
    ],
  };
}

/**
 * Details of an alert, with edit and delete actions
 */
export function alertDetailView(alert: RestaurantAlert, restaurant?: Restaurant): View {
  const summary = summarizeAlert(alert, restaurant);
  const restaurantId = alertRestaurantId(alert);
  const fields = alertFields(summary);
  fields.push({
    name: `${EMOJIS.CLOCK} Créée`,
    value: `<t:${Math.round(new Date(alert.createdAt).valueOf() / 1000)}:R>`,
    inline: true,
  });

  const actions: ButtonBuilder[] = [];
  if (restaurant && restaurantId) {
    actions.push(
      button(
        buildCustomId(CUSTOM_IDS.OPEN_ALERT_FORM, restaurantId, alert.id),
        'Modifier',
        ButtonStyle.Primary,
        EMOJIS.EDIT,
      ),
    );
  }
  actions.push(
    button(
      buildCustomId(CUSTOM_IDS.DELETE_ALERT, alert.id),
      'Supprimer',
      ButtonStyle.Danger,
      EMOJIS.TRASH,
    ),
    button(CUSTOM_IDS.MY_ALERTS, 'Retour', ButtonStyle.Secondary, EMOJIS.BACK),
  );

  return {
    embeds: [
      {
        title: `${mealPeriodEmoji(alert.mealPeriod)} ${summary.restaurantName}`,
        color: COLORS.PRIMARY,
        thumbnail: summary.imageUrl ? { url: summary.imageUrl } : undefined,
        fields,
        footer: { text: `Alerte n°${alert.id}` },
      },
    ],
    components: [buttonRow(...actions)],
  };
}

/**
 * Confirmation before deleting all the alerts of a user
 */
export function confirmDeleteAllView(count: number): View {
  return {
    embeds: [
      {
        title: `${EMOJIS.WARNING} Supprimer toutes vos alertes ?`,
        description: `Vos **${count} alerte(s)** seront supprimées et je ne vous préviendrai plus pour ces restaurants. Cette action est irréversible.`,
        color: COLORS.ERROR,
      },
    ],
    components: [
      buttonRow(
        button(
          CUSTOM_IDS.CONFIRM_DELETE_ALL_ALERTS,
          'Tout supprimer',
          ButtonStyle.Danger,
          EMOJIS.TRASH,
        ),
        button(CUSTOM_IDS.MY_ALERTS, 'Annuler', ButtonStyle.Secondary, EMOJIS.BACK),
      ),
    ],
  };
}

/**
 * An alert has just been cancelled right after its creation
 */
export function alertCancelledView(): View {
  return {
    embeds: [
      {
        title: `${EMOJIS.TRASH} Alerte supprimée`,
        description: 'Cette alerte a bien été supprimée.',
        color: COLORS.MUTED,
      },
    ],
    components: [
      buttonRow(
        button(CUSTOM_IDS.START_ALERT, 'Nouvelle alerte', ButtonStyle.Success, EMOJIS.ADD),
        button(CUSTOM_IDS.MY_ALERTS, 'Mes alertes', ButtonStyle.Secondary, EMOJIS.LIST),
      ),
    ],
  };
}

/**
 * The alert does not exist anymore or belongs to someone else
 */
export function alertNotFoundView(): View {
  return {
    embeds: [
      {
        title: MESSAGES.ALERT_NOT_FOUND.TITLE,
        description: MESSAGES.ALERT_NOT_FOUND.DESCRIPTION,
        color: COLORS.ERROR,
      },
    ],
    components: [
      buttonRow(button(CUSTOM_IDS.MY_ALERTS, 'Mes alertes', ButtonStyle.Primary, EMOJIS.LIST)),
    ],
  };
}

/**
 * A component of a message sent by a previous version of the bot was used
 */
export function expiredView(): View {
  return {
    embeds: [
      {
        title: MESSAGES.EXPIRED.TITLE,
        description: MESSAGES.EXPIRED.DESCRIPTION,
        color: COLORS.MUTED,
      },
    ],
    components: [
      buttonRow(
        button(CUSTOM_IDS.START_ALERT, 'Créer une alerte', ButtonStyle.Success, EMOJIS.ADD),
        button(CUSTOM_IDS.MY_ALERTS, 'Mes alertes', ButtonStyle.Secondary, EMOJIS.LIST),
      ),
    ],
  };
}

/**
 * Generic error, with a way to start over
 */
export function errorView(): View {
  return {
    embeds: [
      {
        title: MESSAGES.GENERIC_ERROR.TITLE,
        description: MESSAGES.GENERIC_ERROR.DESCRIPTION,
        color: COLORS.ERROR,
      },
    ],
    components: [
      buttonRow(
        button(CUSTOM_IDS.START_ALERT, 'Créer une alerte', ButtonStyle.Secondary, EMOJIS.ADD),
        button(CUSTOM_IDS.MY_ALERTS, 'Mes alertes', ButtonStyle.Secondary, EMOJIS.LIST),
      ),
    ],
  };
}
