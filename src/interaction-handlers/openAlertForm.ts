import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ButtonInteraction } from 'discord.js';
import { fetchRestaurantById } from '../core/restaurants';
import { getAlertDraft } from '../lib/alertDraft';
import { handleInteractionError } from '../lib/errorHandler';
import { showView } from '../lib/respond';
import { alertFormModal, expiredView } from '../lib/views';
import { CUSTOM_IDS, customIdArgs, customIdPrefix, parsePositiveInt } from '../lib/customId';

interface OpenAlertFormArgs {
  restaurantId: number | null;
  replaceAlertId: number;
}

/**
 * "Corriger" and "Modifier" buttons: reopen the alert form, prefilled with the last values
 */
export class OpenAlertForm extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext) {
    super(ctx, { interactionHandlerType: InteractionHandlerTypes.Button });
  }

  public async run(
    interaction: ButtonInteraction,
    { restaurantId, replaceAlertId }: OpenAlertFormArgs,
  ) {
    try {
      const restaurant = restaurantId ? await fetchRestaurantById(restaurantId) : undefined;
      if (!restaurant) {
        await showView(interaction, expiredView());
        return;
      }

      const draft = await getAlertDraft(interaction.user.id);
      await interaction.showModal(alertFormModal(restaurant, draft, replaceAlertId));
    } catch (error) {
      await handleInteractionError(interaction, error, { customId: interaction.customId });
    }
  }

  public parse(interaction: ButtonInteraction) {
    if (customIdPrefix(interaction.customId) !== CUSTOM_IDS.OPEN_ALERT_FORM) return this.none();
    const [restaurantId, replaceAlertId] = customIdArgs(interaction.customId);
    return this.some<OpenAlertFormArgs>({
      restaurantId: parsePositiveInt(restaurantId),
      replaceAlertId: parsePositiveInt(replaceAlertId) ?? 0,
    });
  }
}
