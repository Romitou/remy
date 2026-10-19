import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} from 'discord.js';
import { Restaurant } from '../typings/restaurants';
import { COLORS, EMOJIS, IMAGES, MESSAGES, LIMITS } from '../constants';

export interface RestaurantSelectionMessagePayload {
  embeds: any[];
  components: any[];
}

/**
 * Build the restaurant selection message with all components
 */
export function buildRestaurantSelectionMessage(
  sortedRestaurants: Restaurant[],
  selectedIds: number[],
  currentPage: number,
  totalPages: number,
): RestaurantSelectionMessagePayload {
  const totalRestaurants = sortedRestaurants.length;
  const startIndex = (currentPage - 1) * LIMITS.RESTAURANTS_PER_PAGE;
  const endIndex = startIndex + LIMITS.RESTAURANTS_PER_PAGE;
  const pageRestaurants = sortedRestaurants.slice(startIndex, endIndex);

  // Build select menu
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

  if (currentPage > 1) {
    navigationButtons.push(
      new ButtonBuilder()
        .setCustomId(`selectRestaurants-${currentPage - 1}`)
        .setLabel('Page précédente')
        .setEmoji('◀️')
        .setStyle(ButtonStyle.Secondary),
    );
  }

  navigationButtons.push(
    new ButtonBuilder()
      .setCustomId('pageIndicator')
      .setLabel(`Page ${currentPage}/${totalPages}`)
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),
  );

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

  // Continue button, shown as soon as at least one restaurant is selected
  if (selectedIds.length > 0) {
    actionButtons.push(
      new ButtonBuilder()
        .setCustomId('continueToDateSelection')
        .setLabel(`Continuer avec ${selectedIds.length} restaurant(s)`)
        .setEmoji(EMOJIS.SPARKLES)
        .setStyle(ButtonStyle.Success),
    );
  }

  // Build embed
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

  // Build components array - only include actionRow if it has buttons
  const components = [selectRow.toJSON(), navigationRow.toJSON()];
  if (actionButtons.length > 0) {
    const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(actionButtons);
    components.push(actionRow.toJSON());
  }

  return {
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
  };
}

