import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  StringSelectMenuInteraction,
} from 'discord.js';
import { fetchBookAlertById } from '../core/bookAlerts';
import { frenchMealPeriod, mealPeriodEmoji, normalizeDate } from '../core/utils';
import { fetchRestaurantById } from '../core/restaurants';
import { COLORS, EMOJIS, MESSAGES } from '../constants';
import { handleInteractionError } from '../lib/errorHandler';
import { parsePositiveInt } from '../lib/customId';

export class ViewNotification extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext) {
    super(ctx, { interactionHandlerType: InteractionHandlerTypes.SelectMenu });
  }

  public async run(interaction: StringSelectMenuInteraction) {
    try {
      await interaction.deferUpdate();

      const bookAlertId = parsePositiveInt(interaction.values[0]);
      const bookAlert = bookAlertId ? await fetchBookAlertById(bookAlertId) : null;

      if (!bookAlert || bookAlert.discordId !== interaction.user.id) {
        await interaction.followUp({
          embeds: [
            {
              title: MESSAGES.ERROR.ALERT_NOT_FOUND.TITLE,
              description: MESSAGES.ERROR.ALERT_NOT_FOUND.DESCRIPTION,
              color: COLORS.ERROR,
            },
          ],
          ephemeral: true,
        });
        return;
      }

      const restaurantId = bookAlert.checks[0]?.restaurantId;
      const restaurant = restaurantId ? await fetchRestaurantById(restaurantId) : undefined;

      const embed = new EmbedBuilder()
        .setTitle(`${mealPeriodEmoji(bookAlert.mealPeriod)} Notification #${bookAlert.id}`)
        .setDescription(
          `${EMOJIS.WARNING} **Attention** : Vous êtes sur le point de supprimer cette notification. Après suppression, vous ne recevrez plus d'alertes pour les disponibilités correspondant à ces critères.\n`,
        )
        .setColor(COLORS.PRIMARY)
        .setThumbnail(restaurant?.imageUrl || 'https://emojicdn.elk.sh/🍽️?style=google')
        .addFields([
          {
            name: `${EMOJIS.RESTAURANT} Restaurant`,
            value: restaurant?.name ?? 'Restaurant inconnu',
            inline: false,
          },
          {
            name: `${EMOJIS.CALENDAR} Date`,
            value: normalizeDate(bookAlert.date),
            inline: true,
          },
          {
            name: `🕐 Repas`,
            value: frenchMealPeriod(bookAlert.mealPeriod),
            inline: true,
          },
          {
            name: `${EMOJIS.PARTY} Couverts`,
            value: `${bookAlert.partyMix} personne(s)`,
            inline: true,
          },
          {
            name: '⏰ Créée',
            value: `<t:${Math.round(new Date(bookAlert.createdAt).valueOf() / 1000)}:R>`,
            inline: true,
          },
        ])
        .setFooter({
          text: `Notification #${bookAlert.id} • Cette action est irréversible`,
          iconURL: 'https://emojicdn.elk.sh/✨?style=google',
        });

      const componentRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId(`deleteNotification-${bookAlert.id}`)
          .setEmoji(EMOJIS.TRASH)
          .setLabel('Supprimer définitivement')
          .setStyle(ButtonStyle.Danger),
      );

      await interaction.editReply({
        embeds: [embed],
        components: [componentRow],
      });
    } catch (error) {
      await handleInteractionError(interaction, error, {
        customId: interaction.customId,
      });
    }
  }

  public parse(interaction: StringSelectMenuInteraction) {
    if (interaction.customId !== 'viewNotification') return this.none();
    return this.some();
  }
}
