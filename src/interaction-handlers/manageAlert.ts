import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { StringSelectMenuInteraction } from 'discord.js';
import { fetchBookAlertById } from '../core/bookAlerts';
import { fetchRestaurantById } from '../core/restaurants';
import { saveAlertDraft } from '../lib/alertDraft';
import { fromApiDate, toInputDate } from '../lib/dates';
import { handleInteractionError } from '../lib/errorHandler';
import { deferView } from '../lib/respond';
import { alertDetailView, alertNotFoundView, alertRestaurantId } from '../lib/views';
import { CUSTOM_IDS, parsePositiveInt } from '../lib/customId';
import { isMealPeriod } from '../core/utils';

/**
 * An alert was selected in "Mes alertes": shows its details with edit and delete actions
 */
export class ManageAlert extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext) {
    super(ctx, { interactionHandlerType: InteractionHandlerTypes.SelectMenu });
  }

  public async run(interaction: StringSelectMenuInteraction) {
    try {
      await deferView(interaction);

      const alertId = parsePositiveInt(interaction.values[0]);
      const alert = alertId ? await fetchBookAlertById(alertId) : null;
      if (!alert || alert.completed || alert.discordId !== interaction.user.id) {
        await interaction.editReply(alertNotFoundView());
        return;
      }

      const restaurantId = alertRestaurantId(alert);
      const restaurant = restaurantId ? await fetchRestaurantById(restaurantId) : undefined;

      // Prefill the form with the alert values if the user chooses to edit it
      const mealPeriod = alert.mealPeriod.toLowerCase();
      await saveAlertDraft(interaction.user.id, {
        date: toInputDate(fromApiDate(alert.date)),
        partyMix: String(alert.partyMix),
        mealPeriod: isMealPeriod(mealPeriod) ? mealPeriod : undefined,
      });

      await interaction.editReply(alertDetailView(alert, restaurant));
    } catch (error) {
      await handleInteractionError(interaction, error, { customId: interaction.customId });
    }
  }

  public parse(interaction: StringSelectMenuInteraction) {
    if (interaction.customId !== CUSTOM_IDS.MANAGE_ALERT) return this.none();
    return this.some();
  }
}
