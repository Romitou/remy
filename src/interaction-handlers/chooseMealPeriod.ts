import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import {
  ActionRowBuilder,
  ModalSubmitInteraction,
  StringSelectMenuBuilder,
} from 'discord.js';
import { fetchRestaurantByDisneyId } from '../core/restaurants';
import { isValidDateFormat, parseDateDDMMYYYY } from '../core/utils';
import { handleInteractionError } from '../lib/errorHandler';
import { getLogger } from '../config/logger';
import { isAfter, startOfDay } from 'date-fns';
import { COLORS, EMOJIS, IMAGES, MESSAGES, LIMITS } from '../constants';

const logger = getLogger();

export class ChooseMealPeriod extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext) {
    super(ctx, { interactionHandlerType: InteractionHandlerTypes.ModalSubmit });
  }

  public async run(interaction: ModalSubmitInteraction): Promise<void> {
    try {
      await interaction.deferReply({ ephemeral: true });

      // Validate date
      const rawDate = interaction.fields.getTextInputValue('date');
      if (!isValidDateFormat(rawDate)) {
        await interaction.followUp({
          embeds: [
            {
              title: MESSAGES.ERROR.INVALID_DATE.TITLE,
              description: MESSAGES.ERROR.INVALID_DATE.DESCRIPTION,
              color: COLORS.WARNING,
              thumbnail: {
                url: 'https://emojicdn.elk.sh/📅?style=google',
              },
              footer: {
                text: '💡 Besoin d\'aide ? Assurez-vous de bien respecter le format de date.',
              },
            },
          ],
          ephemeral: true,
        });
        return;
      }

      // Check if date is in the future
      const visitDate = parseDateDDMMYYYY(rawDate);
      const today = startOfDay(new Date());
      if (!isAfter(visitDate, today) && visitDate.getTime() !== today.getTime()) {
        await interaction.followUp({
          embeds: [
            {
              title: MESSAGES.ERROR.PAST_DATE.TITLE,
              description: MESSAGES.ERROR.PAST_DATE.DESCRIPTION,
              color: COLORS.WARNING,
              thumbnail: {
                url: 'https://emojicdn.elk.sh/⏳?style=google',
              },
              footer: {
                text: '💡 Les réservations ne peuvent être faites que pour des dates futures.',
              },
            },
          ],
          ephemeral: true,
        });
        return;
      }

      // Validate party mix
      const rawPartyMix = interaction.fields.getTextInputValue('partyMix');
      const parsedPartyMix = Number.parseInt(rawPartyMix, 10);
      if (isNaN(parsedPartyMix) || parsedPartyMix < LIMITS.PARTY_MIN || parsedPartyMix > LIMITS.PARTY_MAX) {
        await interaction.followUp({
          embeds: [
            {
              title: MESSAGES.ERROR.INVALID_PARTY.TITLE,
              description: MESSAGES.ERROR.INVALID_PARTY.DESCRIPTION,
              color: COLORS.WARNING,
              thumbnail: {
                url: 'https://emojicdn.elk.sh/👥?style=google',
              },
              footer: {
                text: `💡 Nombre accepté : entre ${LIMITS.PARTY_MIN} et ${LIMITS.PARTY_MAX} personne(s).`,
              },
            },
          ],
          ephemeral: true,
        });
        return;
      }

      // Get restaurant info
      const restaurantDisneyId = interaction.customId.split('-')[1];
      const restaurant = await fetchRestaurantByDisneyId(restaurantDisneyId);

      if (!restaurant) {
        await interaction.followUp({
          embeds: [
            {
              title: MESSAGES.ERROR.RESTAURANT_NOT_FOUND.TITLE,
              description: MESSAGES.ERROR.RESTAURANT_NOT_FOUND.DESCRIPTION,
              color: COLORS.ERROR,
              thumbnail: {
                url: 'https://emojicdn.elk.sh/🔍?style=google',
              },
            },
          ],
          ephemeral: true,
        });
        return;
      }

      // Create meal period selection menu
      const componentRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId(`chooseDateAndPartyMix-${rawDate}-${parsedPartyMix}-${restaurant.disneyId}`)
          .setPlaceholder('🕐 Sélectionnez votre période de repas')
          .setOptions([
            {
              label: 'Petit-déjeuner',
              value: 'breakfast',
              emoji: EMOJIS.BREAKFAST,
              description: 'Commencez votre journée magique avec un bon petit-déjeuner',
            },
            {
              label: 'Déjeuner',
              value: 'lunch',
              emoji: EMOJIS.LUNCH,
              description: 'Profitez d\'une pause déjeuner gourmande',
            },
            {
              label: 'Dîner',
              value: 'dinner',
              emoji: EMOJIS.DINNER,
              description: 'Terminez votre journée avec un délicieux dîner',
            },
          ]),
      );

      await interaction.followUp({
        embeds: [
          {
            title: `${EMOJIS.SPARKLES} Dernière étape : choisissez votre période de repas`,
            description: `Excellent choix pour le restaurant **${restaurant.name}** !\n\n${EMOJIS.LOADING} **Récapitulatif de votre demande :**`,
            color: COLORS.PRIMARY,
            thumbnail: {
              url: restaurant.imageUrl || IMAGES.DEFAULT_RESTAURANT,
            },
            fields: [
              {
                name: `${EMOJIS.RESTAURANT} Restaurant`,
                value: `\`\`\`${restaurant.name}\`\`\``,
                inline: false,
              },
              {
                name: `${EMOJIS.CALENDAR} Date de visite`,
                value: `\`\`\`${rawDate}\`\`\``,
                inline: true,
              },
              {
                name: `${EMOJIS.PARTY} Nombre de couverts`,
                value: `\`\`\`${parsedPartyMix} personne(s)\`\`\``,
                inline: true,
              },
            ],
            footer: {
              text: '✨ Plus qu\'une étape pour finaliser votre notification !',
              icon_url: 'https://emojicdn.elk.sh/✨?style=google',
            },
          },
        ],
        components: [componentRow],
        ephemeral: true,
      });

      logger.info(
        {
          userId: interaction.user.id,
          restaurant: restaurant.name,
          date: rawDate,
          partyMix: parsedPartyMix,
        },
        'User selected meal period options',
      );
    } catch (error) {
      await handleInteractionError(interaction, error, {
        customId: interaction.customId,
      });
    }
  }

  public parse(interaction: ModalSubmitInteraction) {
    if (!interaction.customId.startsWith('chooseMealPeriod')) return this.none();
    return this.some();
  }
}