import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import {
  ButtonInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { fetchRestaurants } from '../core/restaurants';
import { handleInteractionError } from '../lib/errorHandler';
import { getLogger } from '../config/logger';
import { COLORS, EMOJIS, LIMITS, MESSAGES } from '../constants';
import { getCachedRestaurantSelection, clearCachedRestaurantSelection } from '../lib/restaurantSelection';
import { buildRestaurantSelectionMessage } from '../lib/buildRestaurantSelectionMessage';
import { customIdArgs, parsePositiveInt } from '../lib/customId';
import { captureException } from '@sentry/node';

const logger = getLogger();

export class SelectRestaurants extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext) {
    super(ctx, { interactionHandlerType: InteractionHandlerTypes.Button });
  }

  public async run(interaction: ButtonInteraction): Promise<void> {
    try {
      // Navigation edits the current message, starting fresh sends a new one
      const isNavigating = interaction.customId.startsWith('selectRestaurants-');

      if (isNavigating) {
        await interaction.deferUpdate();
      } else {
        await interaction.deferReply({ ephemeral: true });
      }

      // Clear any previous selection when starting fresh
      if (interaction.customId === 'startAlertBook') {
        await clearCachedRestaurantSelection(interaction.user.id);
      }

      // Parse page number from customId (e.g., "selectRestaurants-1")
      const page = (isNavigating && parsePositiveInt(customIdArgs(interaction.customId)[0])) || 1;

      // Fetch all restaurants
      let restaurants;
      try {
        restaurants = await fetchRestaurants();
      } catch (error) {
        logger.error({ error }, 'Failed to fetch restaurants');
        captureException(error);
        await interaction.followUp({
          embeds: [
            {
              title: MESSAGES.ERROR.GENERIC.TITLE,
              description: MESSAGES.ERROR.GENERIC.DESCRIPTION,
              color: COLORS.ERROR,
              thumbnail: {
                url: 'https://emojicdn.elk.sh/💔?style=google',
              },
            },
          ],
          components: [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setCustomId('startAlertBook')
                .setLabel('Réessayer')
                .setEmoji(EMOJIS.LOADING)
                .setStyle(ButtonStyle.Primary),
            ),
          ],
          ephemeral: true,
        });
        return;
      }

      // Sort restaurants alphabetically
      const sortedRestaurants = [...restaurants].sort((a, b) => a.name.localeCompare(b.name, 'fr'));

      // Pagination
      const totalRestaurants = sortedRestaurants.length;
      const totalPages = Math.ceil(totalRestaurants / LIMITS.RESTAURANTS_PER_PAGE);
      const currentPage = Math.max(1, Math.min(page, totalPages));

      // Get current selection
      const selectedIds = await getCachedRestaurantSelection(interaction.user.id);

      // Build message using helper
      const messagePayload = buildRestaurantSelectionMessage(
        sortedRestaurants,
        selectedIds,
        currentPage,
        totalPages,
      );

      // Update existing message if navigating, create new if starting fresh
      if (isNavigating) {
        await interaction.editReply(messagePayload);
      } else {
        await interaction.followUp({
          ...messagePayload,
          ephemeral: true,
        });
      }

      logger.info(
        {
          userId: interaction.user.id,
          page: currentPage,
          selectedCount: selectedIds.length,
        },
        'User viewing restaurant selection page',
      );
    } catch (error) {
      await handleInteractionError(interaction, error, {
        customId: interaction.customId,
      });
    }
  }

  public parse(interaction: ButtonInteraction) {
    if (
      interaction.customId === 'startAlertBook' ||
      interaction.customId.startsWith('selectRestaurants-')
    ) {
      return this.some();
    }
    return this.none();
  }
}

