import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ModalSubmitInteraction } from 'discord.js';
import { fetchSelectableRestaurants } from '../core/restaurants';
import { handleInteractionError } from '../lib/errorHandler';
import { searchRestaurants } from '../lib/restaurantSearch';
import { showView } from '../lib/respond';
import { restaurantPickerView } from '../lib/views';
import { CUSTOM_IDS } from '../lib/customId';

/**
 * Submission of the restaurant search modal: shows the matching restaurants
 */
export class SearchRestaurantForm extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext) {
    super(ctx, { interactionHandlerType: InteractionHandlerTypes.ModalSubmit });
  }

  public async run(interaction: ModalSubmitInteraction) {
    try {
      const query = interaction.fields.getTextInputValue('query').trim();
      const restaurants = await fetchSelectableRestaurants();
      await showView(
        interaction,
        restaurantPickerView(searchRestaurants(restaurants, query), { query }),
      );
    } catch (error) {
      await handleInteractionError(interaction, error, { customId: interaction.customId });
    }
  }

  public parse(interaction: ModalSubmitInteraction) {
    if (interaction.customId !== CUSTOM_IDS.SEARCH_RESTAURANT_FORM) return this.none();
    return this.some();
  }
}
