import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { StringSelectMenuInteraction } from 'discord.js';
import { handleInteractionError } from '../lib/errorHandler';
import { getLogger } from '../config/logger';
import { COLORS, EMOJIS, LIMITS } from '../constants';
import { cacheRestaurantSelection, getCachedRestaurantSelection } from '../lib/restaurantSelection';

const logger = getLogger();

export class ToggleRestaurantSelection extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext) {
    super(ctx, { interactionHandlerType: InteractionHandlerTypes.SelectMenu });
  }

  public async run(interaction: StringSelectMenuInteraction): Promise<void> {
    try {
      await interaction.deferUpdate();

      const selectedValues = interaction.values.map((v) => parseInt(v, 10));
      const currentSelection = await getCachedRestaurantSelection(interaction.user.id);

      // Check if trying to select more than allowed
      if (selectedValues.length > LIMITS.MAX_RESTAURANTS_PER_ALERT) {
        await interaction.followUp({
          embeds: [
            {
              title: `${EMOJIS.WARNING} Trop de restaurants sélectionnés`,
              description: `Vous ne pouvez sélectionner que **${LIMITS.MAX_RESTAURANTS_PER_ALERT} restaurants maximum**.\n\nVous avez essayé d'en sélectionner ${selectedValues.length}.`,
              color: COLORS.WARNING,
              thumbnail: {
                url: 'https://emojicdn.elk.sh/⚠️?style=google',
              },
            },
          ],
          ephemeral: true,
        });
        return;
      }

      // Update cache with new selection
      await cacheRestaurantSelection(interaction.user.id, selectedValues);

      logger.info(
        {
          userId: interaction.user.id,
          previousCount: currentSelection.length,
          newCount: selectedValues.length,
          restaurantIds: selectedValues,
        },
        'User updated restaurant selection',
      );

      // Refresh the page to show updated selection
      // Trigger the selectRestaurants handler to rebuild the message
      const currentPage = 1; // You might want to extract this from the message
      await this.container.client.emit('interactionCreate', {
        ...interaction,
        customId: `selectRestaurants-${currentPage}`,
      } as any);
    } catch (error) {
      await handleInteractionError(interaction, error, {
        customId: interaction.customId,
      });
    }
  }

  public parse(interaction: StringSelectMenuInteraction) {
    if (interaction.customId === 'toggleRestaurantSelection') {
      return this.some();
    }
    return this.none();
  }
}

