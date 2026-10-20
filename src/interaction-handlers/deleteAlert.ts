import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ButtonInteraction } from 'discord.js';
import {
  completeBookAlert,
  fetchActiveBookAlertsForUser,
  fetchBookAlertById,
} from '../core/bookAlerts';
import { fetchRestaurantById } from '../core/restaurants';
import { loadAlertListView } from '../lib/alertList';
import { formatApiDate } from '../lib/dates';
import { handleInteractionError } from '../lib/errorHandler';
import { deferView } from '../lib/respond';
import {
  alertCancelledView,
  alertNotFoundView,
  alertRestaurantId,
  confirmDeleteAllView,
} from '../lib/views';
import { CUSTOM_IDS, customIdArgs, customIdPrefix, parsePositiveInt } from '../lib/customId';
import { EMOJIS } from '../constants';
import { getLogger } from '../config/logger';

const logger = getLogger();

type DeleteAction =
  | { type: 'delete'; alertId: number | null }
  | { type: 'cancel'; alertId: number | null }
  | { type: 'deleteAll' }
  | { type: 'confirmDeleteAll' };

/**
 * Deletion of one alert (from its details or right after its creation) or of all alerts
 */
export class DeleteAlert extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext) {
    super(ctx, { interactionHandlerType: InteractionHandlerTypes.Button });
  }

  public async run(interaction: ButtonInteraction, action: DeleteAction) {
    try {
      await deferView(interaction);
      const userId = interaction.user.id;

      if (action.type === 'deleteAll') {
        const alerts = await fetchActiveBookAlertsForUser(userId);
        await interaction.editReply(
          alerts.length > 0 ? confirmDeleteAllView(alerts.length) : await loadAlertListView(userId),
        );
        return;
      }

      if (action.type === 'confirmDeleteAll') {
        const alerts = await fetchActiveBookAlertsForUser(userId);
        const results = await Promise.allSettled(
          alerts.map((alert) => completeBookAlert(alert.id)),
        );
        const deleted = results.filter((result) => result.status === 'fulfilled').length;
        logger.info({ userId, deleted, total: alerts.length }, 'Deleted all alerts of a user');

        const notice =
          deleted === alerts.length
            ? `${EMOJIS.SUCCESS} Toutes vos alertes ont été supprimées.`
            : `${EMOJIS.WARNING} ${deleted} alerte(s) sur ${alerts.length} supprimée(s), réessayez pour les autres.`;
        await interaction.editReply(await loadAlertListView(userId, notice));
        return;
      }

      const alert = action.alertId ? await fetchBookAlertById(action.alertId) : null;
      if (!alert || alert.discordId !== userId) {
        await interaction.editReply(alertNotFoundView());
        return;
      }

      await completeBookAlert(alert.id);
      logger.info({ userId, alertId: alert.id }, 'Book alert deleted');

      if (action.type === 'cancel') {
        await interaction.editReply(alertCancelledView());
        return;
      }

      const restaurantId = alertRestaurantId(alert);
      const restaurant = restaurantId ? await fetchRestaurantById(restaurantId) : undefined;
      const notice = `${EMOJIS.SUCCESS} Alerte supprimée : ${restaurant?.name ?? 'restaurant inconnu'}, ${formatApiDate(alert.date)}.`;
      await interaction.editReply(await loadAlertListView(userId, notice));
    } catch (error) {
      await handleInteractionError(interaction, error, { customId: interaction.customId });
    }
  }

  public parse(interaction: ButtonInteraction) {
    const { customId } = interaction;
    const alertId = parsePositiveInt(customIdArgs(customId)[0]);

    switch (customIdPrefix(customId)) {
      case CUSTOM_IDS.DELETE_ALERT:
        return this.some<DeleteAction>({ type: 'delete', alertId });
      case CUSTOM_IDS.CANCEL_ALERT:
        return this.some<DeleteAction>({ type: 'cancel', alertId });
      case CUSTOM_IDS.DELETE_ALL_ALERTS:
        return this.some<DeleteAction>({ type: 'deleteAll' });
      case CUSTOM_IDS.CONFIRM_DELETE_ALL_ALERTS:
        return this.some<DeleteAction>({ type: 'confirmDeleteAll' });
      default:
        return this.none();
    }
  }
}
