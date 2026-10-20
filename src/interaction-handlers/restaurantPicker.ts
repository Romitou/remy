import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ButtonInteraction } from 'discord.js';
import { fetchSelectableRestaurants } from '../core/restaurants';
import { handleInteractionError } from '../lib/errorHandler';
import { showView } from '../lib/respond';
import { restaurantPickerView } from '../lib/views';
import { CUSTOM_IDS, customIdArgs, customIdPrefix, parsePositiveInt } from '../lib/customId';

/**
 * Step 1 of the alert creation: "Créer une alerte" button and restaurant pages
 */
export class RestaurantPicker extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext) {
    super(ctx, { interactionHandlerType: InteractionHandlerTypes.Button });
  }

  public async run(interaction: ButtonInteraction, page: number) {
    try {
      const restaurants = await fetchSelectableRestaurants();
      await showView(interaction, restaurantPickerView(restaurants, { page }));
    } catch (error) {
      await handleInteractionError(interaction, error, { customId: interaction.customId });
    }
  }

  public parse(interaction: ButtonInteraction) {
    if (interaction.customId === CUSTOM_IDS.START_ALERT) return this.some(1);
    if (customIdPrefix(interaction.customId) !== CUSTOM_IDS.RESTAURANT_PAGE) return this.none();
    return this.some(parsePositiveInt(customIdArgs(interaction.customId)[0]) ?? 1);
  }
}
