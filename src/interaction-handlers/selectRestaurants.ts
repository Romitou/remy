import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import {
  ButtonInteraction,
  ActionRowBuilder,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuOptionBuilder,
} from 'discord.js';
import { fetchRestaurants } from '../core/restaurants';
import { handleInteractionError } from '../lib/errorHandler';
import { getLogger } from '../config/logger';
import { COLORS, EMOJIS, IMAGES, MESSAGES, LIMITS } from '../constants';
import { getCachedRestaurantSelection, clearCachedRestaurantSelection } from '../lib/restaurantSelection';
import Sentry from '@sentry/node';

const logger = getLogger();

export class SelectRestaurants extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext) {
    super(ctx, { interactionHandlerType: InteractionHandlerTypes.Button });
  }

  public async run(interaction: ButtonInteraction): Promise<void> {
    try {
      await interaction.deferReply({ ephemeral: true });

      // Clear any previous selection when starting fresh
      if (interaction.customId === 'startAlertBook') {
        await clearCachedRestaurantSelection(interaction.user.id);
      }

      // Parse page number from customId (e.g., "selectRestaurants-1")
      const page = interaction.customId.startsWith('selectRestaurants-')
        ? parseInt(interaction.customId.split('-')[1], 10)
        : 1;

      // Fetch all restaurants
      let restaurants;
      try {
        restaurants = await fetchRestaurants();
      } catch (error) {
        logger.error({ error }, 'Failed to fetch restaurants');
        Sentry.captureException(error);
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
      const startIndex = (currentPage - 1) * LIMITS.RESTAURANTS_PER_PAGE;
      const endIndex = startIndex + LIMITS.RESTAURANTS_PER_PAGE;
      const pageRestaurants = sortedRestaurants.slice(startIndex, endIndex);

      // Get current selection
      const selectedIds = await getCachedRestaurantSelection(interaction.user.id);

      // Build select menu with restaurants on current page
      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('toggleRestaurantSelection')
        .setPlaceholder(
          selectedIds.length > 0
            ? `${selectedIds.length}/${LIMITS.MAX_RESTAURANTS_PER_ALERT} restaurant(s) sélectionné(s)`
            : `${EMOJIS.RESTAURANT} Choisissez vos restaurants`,
        )
        .setMinValues(0)
        .setMaxValues(Math.min(pageRestaurants.length, LIMITS.MAX_RESTAURANTS_PER_ALERT));

      // Add options
      for (const restaurant of pageRestaurants) {
        const isSelected = selectedIds.includes(restaurant.id);
        selectMenu.addOptions(
          new StringSelectMenuOptionBuilder()
            .setLabel(restaurant.name)
            .setValue(String(restaurant.id))
            .setDescription(restaurant.disneyId)
            .setEmoji(isSelected ? EMOJIS.SUCCESS : EMOJIS.RESTAURANT)
            .setDefault(isSelected),
        );
      }

      const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);

      // Build navigation buttons
      const navigationButtons: ButtonBuilder[] = [];

      // Previous page button
      if (currentPage > 1) {
        navigationButtons.push(
          new ButtonBuilder()
            .setCustomId(`selectRestaurants-${currentPage - 1}`)
            .setLabel('Page précédente')
            .setEmoji('◀️')
            .setStyle(ButtonStyle.Secondary),
        );
      }

      // Page indicator (disabled button)
      navigationButtons.push(
        new ButtonBuilder()
          .setCustomId('pageIndicator')
          .setLabel(`Page ${currentPage}/${totalPages}`)
          .setStyle(ButtonStyle.Secondary)
          .setDisabled(true),
      );

      // Next page button
      if (currentPage < totalPages) {
        navigationButtons.push(
          new ButtonBuilder()
            .setCustomId(`selectRestaurants-${currentPage + 1}`)
            .setLabel('Page suivante')
            .setEmoji('▶️')
            .setStyle(ButtonStyle.Secondary),
        );
      }

      const navigationRow = new ActionRowBuilder<ButtonBuilder>().addComponents(navigationButtons);

      // Build action buttons
      const actionButtons: ButtonBuilder[] = [];

      // Continue button (only if at least one restaurant selected)
      if (selectedIds.length > 0) {
        actionButtons.push(
          new ButtonBuilder()
            .setCustomId('continueToDateSelection')
            .setLabel(`Continuer avec ${selectedIds.length} restaurant(s)`)
            .setEmoji(EMOJIS.SPARKLES)
            .setStyle(ButtonStyle.Success),
        );
      }

      // Cancel button
      actionButtons.push(
        new ButtonBuilder()
          .setCustomId('cancelRestaurantSelection')
          .setLabel('Annuler')
          .setEmoji(EMOJIS.ERROR)
          .setStyle(ButtonStyle.Danger),
      );

      const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(actionButtons);

      // Build embed with selected restaurants
      const messageContent = MESSAGES.INFO.SELECT_RESTAURANTS(currentPage, totalPages, totalRestaurants);

      const embedFields: Array<{ name: string; value: string; inline?: boolean }> = [];

      if (selectedIds.length > 0) {
        const selectedRestaurants = sortedRestaurants.filter((r) => selectedIds.includes(r.id));
        embedFields.push({
          name: `${EMOJIS.SUCCESS} Restaurants sélectionnés (${selectedIds.length}/${LIMITS.MAX_RESTAURANTS_PER_ALERT})`,
          value: '```\n' + selectedRestaurants.map((r) => `• ${r.name}`).join('\n') + '\n```',
          inline: false,
        });
      }

      const components = [selectRow, navigationRow, actionRow];

      await interaction.followUp({
        embeds: [
          {
            title: messageContent.TITLE,
            description: messageContent.DESCRIPTION,
            color: COLORS.PRIMARY,
            thumbnail: {
              url: 'https://emojicdn.elk.sh/🍽️?style=google',
            },
            fields: embedFields,
            footer: {
              text: messageContent.FOOTER,
              icon_url: 'https://emojicdn.elk.sh/💡?style=google',
            },
            image: {
              url: IMAGES.DEFAULT_RESTAURANT,
            },
          },
        ],
        components,
        ephemeral: true,
      });

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

