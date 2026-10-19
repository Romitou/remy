import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ButtonInteraction } from 'discord.js';
import { createBookAlert } from '../core/bookAlerts';
import { RestaurantAlert } from '../typings/bookAlerts';
import { captureException } from '@sentry/node';
import { fetchRestaurantById } from '../core/restaurants';
import { COLORS, EMOJIS, IMAGES, MESSAGES } from '../constants';
import { handleInteractionError } from '../lib/errorHandler';
import { getLogger } from '../config/logger';
import { clearCachedRestaurantSelection } from '../lib/restaurantSelection';

const logger = getLogger();

export class ValidateNotification extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext) {
    super(ctx, { interactionHandlerType: InteractionHandlerTypes.Button });
  }

  public async run(interaction: ButtonInteraction) {
    try {
      await interaction.deferUpdate();

      // Parse customId: validateNotification-1,2,3-24/12/2025-4-lunch
      const customIdParts = interaction.customId.split('-');
      if (customIdParts.length < 5) {
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

      const restaurantIds = customIdParts[1].split(',').map((id) => parseInt(id, 10));
      const rawDate = customIdParts[2];
      const partyMix = parseInt(customIdParts[3], 10);
      const mealPeriod = customIdParts[4];

      let bookAlert: RestaurantAlert;
      try {
        const parsedDate = rawDate.split('/').reverse().join('-');
        bookAlert = await createBookAlert(
          restaurantIds,
          mealPeriod,
          parsedDate,
          partyMix,
          String(interaction.user.id),
        );
      } catch (e) {
        logger.error({ error: e, userId: interaction.user.id }, 'Failed to create book alert');
        captureException(e);
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
          ephemeral: true,
        });
        return;
      }

      // Clear the cached selection
      await clearCachedRestaurantSelection(interaction.user.id);

      let mealPeriodFr;
      switch (bookAlert.mealPeriod) {
        case 'BREAKFAST':
          mealPeriodFr = 'Petit-déjeuner';
          break;
        case 'LUNCH':
          mealPeriodFr = 'Déjeuner';
          break;
        case 'DINNER':
          mealPeriodFr = 'Dîner';
          break;
        default:
          mealPeriodFr = bookAlert.mealPeriod;
      }

      // Fetch all restaurants
      const restaurants = await Promise.all(
        bookAlert.checks.map((check) => fetchRestaurantById(check.restaurantId)),
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

      const restaurantsList = validRestaurants.map((r) => `• ${r!.name}`).join('\n');

      await interaction.editReply({
        embeds: [
          {
            title: `${EMOJIS.SUCCESS} Notification créée avec succès !`,
            description: `${EMOJIS.SPARKLES} **Parfait !** Je surveillerai les disponibilités pour vous.\n\n${EMOJIS.CHEF} **Promis !** Dès qu'une table se libère dans l'un de ces restaurants, vous recevrez un message privé instantanément.\n\n💡 **Astuce :** Gérez vos notifications via le bouton "*Mes notifications*" dans le salon principal.`,
            color: COLORS.SUCCESS,
            thumbnail: {
              url: validRestaurants[0]!.imageUrl || IMAGES.DEFAULT_RESTAURANT,
            },
            fields: [
              {
                name: `${EMOJIS.RESTAURANT} Restaurant(s) surveillé(s) (${validRestaurants.length})`,
                value: `\`\`\`\n${restaurantsList}\n\`\`\``,
                inline: false,
              },
              {
                name: `${EMOJIS.CALENDAR} Date`,
                value: `\`\`\`${rawDate}\`\`\``,
                inline: true,
              },
              {
                name: `${EMOJIS.PARTY} Couverts`,
                value: `\`\`\`${partyMix} personne(s)\`\`\``,
                inline: true,
              },
              {
                name: `${EMOJIS.BELL} Période`,
                value: `\`\`\`${mealPeriodFr}\`\`\``,
                inline: true,
              },
            ],
            footer: {
              text: `ID de notification : #${bookAlert.id} • Créée à l'instant`,
              icon_url: 'https://emojicdn.elk.sh/✅?style=google',
            },
            timestamp: new Date().toISOString(),
            image: {
              url: IMAGES.NOTIFICATION_CREATED,
            },
          },
        ],
        components: [],
      });

      logger.info(
        {
          userId: interaction.user.id,
          alertId: bookAlert.id,
          restaurantCount: validRestaurants.length,
          restaurantIds,
          date: rawDate,
          partyMix,
          mealPeriod,
        },
        'Book alert created successfully',
      );
    } catch (error) {
      await handleInteractionError(interaction, error, {
        customId: interaction.customId,
      });
    }
  }

  public parse(interaction: ButtonInteraction) {
    if (!interaction.customId.startsWith('validateNotification-')) return this.none();
    return this.some();
  }
}
