import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { StringSelectMenuInteraction } from 'discord.js';
import { fetchRestaurantById } from '../core/restaurants';
import { getAlertDraft } from '../lib/alertDraft';
import { handleInteractionError } from '../lib/errorHandler';
import { showView } from '../lib/respond';
import { alertFormModal, expiredView } from '../lib/views';
import { CUSTOM_IDS, parsePositiveInt } from '../lib/customId';

/**
 * A restaurant was picked: opens the alert form (step 2) directly
 */
export class PickRestaurant extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext) {
    super(ctx, { interactionHandlerType: InteractionHandlerTypes.SelectMenu });
  }

  public async run(interaction: StringSelectMenuInteraction) {
    try {
      const restaurantId = parsePositiveInt(interaction.values[0]);
      const restaurant = restaurantId ? await fetchRestaurantById(restaurantId) : undefined;
      if (!restaurant) {
        await showView(interaction, expiredView());
        return;
      }

      const draft = await getAlertDraft(interaction.user.id);
      await interaction.showModal(alertFormModal(restaurant, draft));
    } catch (error) {
      await handleInteractionError(interaction, error, { customId: interaction.customId });
    }
  }

  public parse(interaction: StringSelectMenuInteraction) {
    if (interaction.customId !== CUSTOM_IDS.PICK_RESTAURANT) return this.none();
    return this.some();
  }
}
