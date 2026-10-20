import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ButtonInteraction } from 'discord.js';
import { handleInteractionError } from '../lib/errorHandler';
import { searchRestaurantModal } from '../lib/views';
import { CUSTOM_IDS } from '../lib/customId';

/**
 * "Rechercher" button of the restaurant picker: opens the search modal
 */
export class SearchRestaurant extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext) {
    super(ctx, { interactionHandlerType: InteractionHandlerTypes.Button });
  }

  public async run(interaction: ButtonInteraction) {
    try {
      await interaction.showModal(searchRestaurantModal());
    } catch (error) {
      await handleInteractionError(interaction, error, { customId: interaction.customId });
    }
  }

  public parse(interaction: ButtonInteraction) {
    if (interaction.customId !== CUSTOM_IDS.SEARCH_RESTAURANT) return this.none();
    return this.some();
  }
}
