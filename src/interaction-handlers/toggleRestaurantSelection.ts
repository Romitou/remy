import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { StringSelectMenuInteraction } from 'discord.js';
import { handleInteractionError } from '../lib/errorHandler';
import { getLogger } from '../config/logger';
import { COLORS, EMOJIS, LIMITS } from '../constants';
import { cacheRestaurantSelection, getCachedRestaurantSelection } from '../lib/restaurantSelection';
import { buildRestaurantSelectionMessage } from '../lib/buildRestaurantSelectionMessage';
import { fetchRestaurants } from '../core/restaurants';

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

      // Refresh the message to show the "Continue" button
      try {
        const restaurants = await fetchRestaurants();
        const sortedRestaurants = [...restaurants].sort((a, b) => a.name.localeCompare(b.name, 'fr'));
        const totalPages = Math.ceil(sortedRestaurants.length / 20);

        // Extract current page from the message (look for "Page X/Y" in the button)
        let currentPage = 1;
        const messageComponents = interaction.message.components as any[];
        if (messageComponents && messageComponents.length > 1) {
          const navigationRow = messageComponents[1];
          if (navigationRow && navigationRow.components) {
            const pageButton = navigationRow.components.find(
              (c: any) => c.customId === 'pageIndicator'
            );
            if (pageButton && pageButton.label) {
              const match = pageButton.label.match(/Page (\d+)\//);
              if (match) {
                currentPage = parseInt(match[1], 10);
              }
            }
          }
        }

        // Rebuild the message with updated selection
        const messagePayload = buildRestaurantSelectionMessage(
          sortedRestaurants,
          selectedValues,
          currentPage,
          totalPages,
        );

        await interaction.editReply(messagePayload);
      } catch (error) {
        logger.error({ error: String(error) }, 'Failed to refresh selection message');
        // Continue anyway, user will see the update when navigating
      }
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

