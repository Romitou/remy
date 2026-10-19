import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import {
  StringSelectMenuInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { fetchRestaurantById } from '../core/restaurants';
import { frenchMealPeriod, isMealPeriod } from '../core/utils';
import { customIdArgs, parseIdList, parsePositiveInt } from '../lib/customId';
import { handleInteractionError } from '../lib/errorHandler';
import { getLogger } from '../config/logger';
import { COLORS, EMOJIS, IMAGES, MESSAGES } from '../constants';

const logger = getLogger();

export class ConfirmNotification extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext) {
    super(ctx, { interactionHandlerType: InteractionHandlerTypes.SelectMenu });
  }

  public async run(interaction: StringSelectMenuInteraction): Promise<void> {
    try {
      await interaction.deferUpdate();

      const mealPeriod = interaction.values[0];

      // Parse customId: confirmNotification-1,2,3-24/12/2025-4
      const [rawRestaurantIds, rawDate, rawPartyMix] = customIdArgs(interaction.customId);
      const restaurantIds = parseIdList(rawRestaurantIds);
      const partyMix = parsePositiveInt(rawPartyMix);
      if (!restaurantIds || !rawDate || !partyMix || !isMealPeriod(mealPeriod)) {
        await interaction.followUp({
          embeds: [
            {
              title: MESSAGES.ERROR.GENERIC.TITLE,
              description: MESSAGES.ERROR.GENERIC.DESCRIPTION,
              color: COLORS.ERROR,
            },
          ],
          ephemeral: true,
        });
        return;
      }


      // Fetch restaurant details
      const restaurants = await Promise.all(
        restaurantIds.map((id) => fetchRestaurantById(id)),
      );
      const validRestaurants = restaurants.filter((r) => r !== undefined);

      if (validRestaurants.length === 0) {
        await interaction.followUp({
          embeds: [
            {
              title: MESSAGES.ERROR.RESTAURANT_NOT_FOUND.TITLE,
              description: MESSAGES.ERROR.RESTAURANT_NOT_FOUND.DESCRIPTION,
              color: COLORS.ERROR,
            },
          ],
          ephemeral: true,
        });
        return;
      }

      const mealPeriodFr = frenchMealPeriod(mealPeriod);

      const restaurantNames = validRestaurants.map((r) => r!.name);
      const messageContent = MESSAGES.INFO.CONFIRM_NOTIFICATION(restaurantNames);

      // Build confirmation buttons
      const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`validateNotification-${restaurantIds.join(',')}-${rawDate}-${partyMix}-${mealPeriod}`)
          .setLabel('✅ Confirmer et créer la notification')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('startAlertBook')
          .setLabel('Modifier')
          .setEmoji(EMOJIS.BACK)
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('cancelRestaurantSelection')
          .setLabel('Annuler')
          .setEmoji(EMOJIS.ERROR)
          .setStyle(ButtonStyle.Danger),
      );

      await interaction.editReply({
        embeds: [
          {
            title: messageContent.TITLE,
            description: messageContent.DESCRIPTION,
            color: COLORS.PRIMARY,
            thumbnail: {
              url: validRestaurants[0]!.imageUrl || IMAGES.DEFAULT_RESTAURANT,
            },
            fields: [
              {
                name: `${EMOJIS.RESTAURANT} Restaurant(s) surveillé(s) (${validRestaurants.length})`,
                value: `\`\`\`\n${messageContent.RESTAURANTS_FIELD}\n\`\`\``,
                inline: false,
              },
              {
                name: `${EMOJIS.CALENDAR} Date de visite`,
                value: `\`\`\`${rawDate}\`\`\``,
                inline: true,
              },
              {
                name: `${EMOJIS.PARTY} Nombre de couverts`,
                value: `\`\`\`${partyMix} personne(s)\`\`\``,
                inline: true,
              },
              {
                name: `${EMOJIS.BELL} Période de repas`,
                value: `\`\`\`${mealPeriodFr}\`\`\``,
                inline: true,
              },
            ],
            footer: {
              text: '💡 Vérifiez bien toutes les informations avant de confirmer',
              icon_url: 'https://emojicdn.elk.sh/✨?style=google',
            },
          },
        ],
        components: [actionRow],
      });

      logger.info(
        {
          userId: interaction.user.id,
          restaurantCount: validRestaurants.length,
          restaurantIds,
          date: rawDate,
          partyMix,
          mealPeriod,
        },
        'User confirming notification details',
      );
    } catch (error) {
      await handleInteractionError(interaction, error, {
        customId: interaction.customId,
      });
    }
  }

  public parse(interaction: StringSelectMenuInteraction) {
    if (!interaction.customId.startsWith('confirmNotification-')) {
      return this.none();
    }
    return this.some();
  }
}

