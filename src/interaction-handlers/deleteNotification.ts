import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ButtonInteraction, EmbedBuilder } from 'discord.js';
import { completeBookAlert, fetchBookAlertById } from '../core/bookAlerts';
import { frenchMealPeriod, mealPeriodEmoji, normalizeDate } from '../core/utils';
import { fetchRestaurantById } from '../core/restaurants';
import { COLORS, EMOJIS, MESSAGES } from '../constants';
import { handleInteractionError } from '../lib/errorHandler';
import { customIdArgs, parsePositiveInt } from '../lib/customId';
import { getLogger } from '../config/logger';

const logger = getLogger();

export class DeleteNotification extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext) {
    super(ctx, { interactionHandlerType: InteractionHandlerTypes.Button });
  }

  public async run(interaction: ButtonInteraction, bookAlertId: number | null) {
    try {
      await interaction.deferUpdate();

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

      await completeBookAlert(bookAlert.id);
      logger.info({ userId: interaction.user.id, alertId: bookAlert.id }, 'Book alert deleted');

      const restaurantId = bookAlert.checks[0]?.restaurantId;
      const restaurant = restaurantId ? await fetchRestaurantById(restaurantId) : undefined;

      const embed = new EmbedBuilder()
        .setTitle(`${EMOJIS.SUCCESS} Notification supprimée avec succès`)
        .setDescription(
          `${EMOJIS.SPARKLES} **La notification #${bookAlert.id} a été supprimée.**\nVous ne recevrez plus d'alertes pour cette réservation.\n\n💡 **Astuce :** Vous pouvez créer une nouvelle notification à tout moment via le bouton "*Créer une alerte*".\n`,
        )
        .setColor(COLORS.SUCCESS)
        .setThumbnail('https://emojicdn.elk.sh/✅?style=google')
        .setFields([
          {
            name: `${mealPeriodEmoji(bookAlert.mealPeriod)} Détails de la notification supprimée`,
            value: `**Restaurant :** ${restaurant?.name ?? 'Restaurant inconnu'}\n**Date :** ${normalizeDate(bookAlert.date)}\n**Période :** ${frenchMealPeriod(bookAlert.mealPeriod)}\n**Couverts :** ${bookAlert.partyMix} personne(s)`,
            inline: false,
          },
        ])
        .setFooter({
          text: "Supprimée à l'instant",
          iconURL: 'https://emojicdn.elk.sh/✨?style=google',
        })
        .setTimestamp();

      await interaction.editReply({
        embeds: [embed],
        components: [],
      });
    } catch (error) {
      await handleInteractionError(interaction, error, {
        customId: interaction.customId,
      });
    }
  }

  public parse(interaction: ButtonInteraction) {
    if (!interaction.customId.startsWith('deleteNotification-')) return this.none();
    return this.some(parsePositiveInt(customIdArgs(interaction.customId)[0]));
  }
}
