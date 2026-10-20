import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ModalSubmitInteraction } from 'discord.js';
import {
  completeBookAlert,
  createBookAlert,
  fetchActiveBookAlertsForUser,
} from '../core/bookAlerts';
import { sendAlertConfirmationDm } from '../core/bookNotifications';
import { fetchRestaurantById } from '../core/restaurants';
import { isMealPeriod } from '../core/utils';
import { saveAlertDraft } from '../lib/alertDraft';
import { exampleVisitDate, parseVisitDate, toApiDate } from '../lib/dates';
import { handleInteractionError } from '../lib/errorHandler';
import { deferView } from '../lib/respond';
import {
  alertRestaurantId,
  alertSavedView,
  duplicateAlertView,
  expiredView,
  formErrorView,
  tooManyAlertsView,
} from '../lib/views';
import { CUSTOM_IDS, customIdArgs, customIdPrefix, parsePositiveInt } from '../lib/customId';
import { LIMITS } from '../constants';
import { getLogger } from '../config/logger';

const logger = getLogger();

const DATE_ERRORS = {
  invalid: (input: string) =>
    `**Date** : « ${input} » n'est pas une date valide. Exemple : ${exampleVisitDate()}.`,
  past: (input: string) => `**Date** : le ${input} est déjà passé.`,
  too_far: (input: string) => `**Date** : le ${input} est trop lointain, vérifiez l'année.`,
};

/**
 * Submission of the alert form (step 2): validates it and creates or replaces the alert
 */
export class SubmitAlertForm extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext) {
    super(ctx, { interactionHandlerType: InteractionHandlerTypes.ModalSubmit });
  }

  public async run(interaction: ModalSubmitInteraction) {
    try {
      await deferView(interaction);
      const userId = interaction.user.id;

      const [rawRestaurantId, rawReplaceAlertId] = customIdArgs(interaction.customId);
      const restaurantId = parsePositiveInt(rawRestaurantId);
      const restaurant = restaurantId ? await fetchRestaurantById(restaurantId) : undefined;
      if (!restaurant) {
        await interaction.editReply(expiredView());
        return;
      }
      const replaceAlertId = parsePositiveInt(rawReplaceAlertId) ?? 0;

      const rawDate = interaction.fields.getTextInputValue('date').trim();
      const rawPartyMix = interaction.fields.getTextInputValue('partyMix').trim();
      const mealPeriod = interaction.fields.getStringSelectValues('mealPeriod')[0] ?? '';

      // Keep what was typed, to prefill the form when correcting it or creating another alert
      await saveAlertDraft(userId, {
        date: rawDate,
        partyMix: rawPartyMix,
        mealPeriod: isMealPeriod(mealPeriod) ? mealPeriod : undefined,
      });

      const errors: string[] = [];
      const visitDate = parseVisitDate(rawDate);
      if (!visitDate.ok) {
        errors.push(DATE_ERRORS[visitDate.reason](rawDate));
      }
      const partyMix = parsePositiveInt(rawPartyMix);
      if (partyMix === null || partyMix < LIMITS.PARTY_MIN || partyMix > LIMITS.PARTY_MAX) {
        errors.push(
          `**Convives** : indiquez un nombre entre ${LIMITS.PARTY_MIN} et ${LIMITS.PARTY_MAX}.`,
        );
      }
      if (!isMealPeriod(mealPeriod)) {
        errors.push('**Repas** : choisissez un repas.');
      }
      if (!visitDate.ok || partyMix === null || !isMealPeriod(mealPeriod) || errors.length > 0) {
        await interaction.editReply(formErrorView(restaurant, errors, replaceAlertId));
        return;
      }

      const date = toApiDate(visitDate.date);
      const activeAlerts = await fetchActiveBookAlertsForUser(userId);
      const replacedAlert = activeAlerts.find((alert) => alert.id === replaceAlertId);
      const otherAlerts = activeAlerts.filter((alert) => alert.id !== replaceAlertId);

      const duplicate = otherAlerts.some(
        (alert) =>
          alertRestaurantId(alert) === restaurant.id &&
          alert.date === date &&
          alert.mealPeriod.toLowerCase() === mealPeriod &&
          alert.partyMix === partyMix,
      );
      if (duplicate) {
        await interaction.editReply(duplicateAlertView(restaurant.id, replaceAlertId));
        return;
      }
      if (otherAlerts.length >= LIMITS.MAX_ALERTS_PER_USER) {
        await interaction.editReply(tooManyAlertsView());
        return;
      }

      const alert = await createBookAlert([restaurant.id], mealPeriod, date, partyMix, userId);
      if (replacedAlert) {
        await completeBookAlert(replacedAlert.id).catch((error) =>
          logger.error({ error, alertId: replacedAlert.id }, 'Failed to remove replaced alert'),
        );
      }

      const summary = {
        restaurantName: restaurant.name,
        imageUrl: restaurant.imageUrl,
        date,
        mealPeriod,
        partyMix,
      };
      const dmOpen = await sendAlertConfirmationDm(interaction.user, alert.id, summary);

      await interaction.editReply(
        alertSavedView(alert.id, summary, { edited: Boolean(replacedAlert), dmOpen }),
      );

      logger.info(
        {
          userId,
          alertId: alert.id,
          replacedAlertId: replacedAlert?.id,
          restaurantId: restaurant.id,
          date,
          partyMix,
          mealPeriod,
          dmOpen,
        },
        replacedAlert ? 'Book alert edited' : 'Book alert created',
      );
    } catch (error) {
      await handleInteractionError(interaction, error, { customId: interaction.customId });
    }
  }

  public parse(interaction: ModalSubmitInteraction) {
    if (customIdPrefix(interaction.customId) !== CUSTOM_IDS.ALERT_FORM) return this.none();
    return this.some();
  }
}
