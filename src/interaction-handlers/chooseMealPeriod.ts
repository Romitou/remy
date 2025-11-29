import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import {
  ActionRowBuilder,
  ModalSubmitInteraction,
  StringSelectMenuBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { fetchRestaurantById } from '../core/restaurants';
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

      // Parse restaurant IDs from customId (format: chooseMealPeriod-1,2,3)
      const customIdParts = interaction.customId.split('-');
      if (customIdParts.length < 2) {
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

      // Check if date is in the future and within range
      const visitDate = parseDateDDMMYYYY(rawDate);
      const today = startOfDay(new Date());
      // const maxDate = addDays(today, LIMITS.DATE_RANGE_DAYS);

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
            },
          ],
          ephemeral: true,
        });
        return;
      }

      // if (isAfter(visitDate, maxDate)) {
      //   await interaction.followUp({
      //     embeds: [
      //       {
      //         title: `${EMOJIS.WARNING} Date trop lointaine`,
      //         description: `La date ne peut pas dépasser ${LIMITS.DATE_RANGE_DAYS} jours dans le futur.\n\n💡 **Astuce :** Choisissez une date plus proche.`,
      //         color: COLORS.WARNING,
      //         thumbnail: {
      //           url: 'https://emojicdn.elk.sh/📅?style=google',
      //         },
      //       },
      //     ],
      //     ephemeral: true,
      //   });
      //   return;
      // }

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
          .setCustomId(`confirmNotification-${restaurantIds.join(',')}-${rawDate}-${parsedPartyMix}`)
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

      const actionRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId('startAlertBook')
          .setLabel('Modifier la sélection')
          .setEmoji(EMOJIS.BACK)
          .setStyle(ButtonStyle.Secondary),
      );

      const restaurantsList = validRestaurants.map((r) => `• ${r!.name}`).join('\n');

      await interaction.followUp({
        embeds: [
          {
            title: `${EMOJIS.SPARKLES} Dernière étape : choisissez votre période de repas`,
            description: `Excellent choix ! Nous surveillerons les disponibilités pour vous.\n\n${EMOJIS.LOADING} **Récapitulatif de votre demande :**`,
            color: COLORS.PRIMARY,
            thumbnail: {
              url: validRestaurants[0]!.imageUrl || IMAGES.DEFAULT_RESTAURANT,
            },
            fields: [
              {
                name: `${EMOJIS.RESTAURANT} Restaurant(s) (${validRestaurants.length})`,
                value: `\`\`\`\n${restaurantsList}\n\`\`\``,
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
              text: `✨ Étape 3/3 • Plus qu'une étape pour finaliser votre notification !`,
              icon_url: 'https://emojicdn.elk.sh/✨?style=google',
            },
          },
        ],
        components: [componentRow, actionRow],
        ephemeral: true,
      });

      logger.info(
        {
          userId: interaction.user.id,
          restaurantCount: validRestaurants.length,
          restaurantIds,
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
    if (!interaction.customId.startsWith('chooseMealPeriod-')) return this.none();
    return this.some();
  }
}