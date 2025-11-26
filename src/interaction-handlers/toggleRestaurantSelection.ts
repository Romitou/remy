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

      // Note: The selection is now cached. The user will see the updated selection
      // when they navigate to a new page or click "Continue"
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

