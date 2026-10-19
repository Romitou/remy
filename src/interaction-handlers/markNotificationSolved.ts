import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ButtonInteraction, EmbedBuilder } from 'discord.js';
import { completeBookAlert, fetchBookAlertById } from '../core/bookAlerts';
import { COLORS, EMOJIS, MESSAGES } from '../constants';
import { handleInteractionError } from '../lib/errorHandler';
import { customIdArgs, parsePositiveInt } from '../lib/customId';
import { getEnvironment } from '../config/environment';
import { getLogger } from '../config/logger';

const logger = getLogger();

export class MarkNotificationSolved extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext) {
    super(ctx, { interactionHandlerType: InteractionHandlerTypes.Button });
  }

  public async run(interaction: ButtonInteraction, notificationId: number | null) {
    try {
      await interaction.deferUpdate();

      const bookAlert = notificationId ? await fetchBookAlertById(notificationId) : null;

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
      logger.info({ userId: interaction.user.id, alertId: bookAlert.id }, 'Book alert solved');

      const newEmbed = EmbedBuilder.from(interaction.message.embeds[0])
        .setColor(COLORS.SUCCESS)
        .setFooter({
          text: `${EMOJIS.SUCCESS} Réservation confirmée • Notification désactivée`,
          iconURL: 'https://emojicdn.elk.sh/✅?style=google',
        })
        .setTimestamp();

      await interaction.editReply({
        embeds: [newEmbed],
        components: [],
      });

      const { FEEDBACK_CHANNEL_ID } = getEnvironment();
      const feedbackText = FEEDBACK_CHANNEL_ID
        ? `\n\n💬 **Votre avis compte :** N'hésitez pas à partager votre expérience dans <#${FEEDBACK_CHANNEL_ID}> !`
        : '';

      await interaction.followUp({
        embeds: [
          {
            title: `${EMOJIS.SUCCESS} Félicitations pour votre réservation !`,
            description: `${EMOJIS.SPARKLES} **Parfait !** Cette notification a été marquée comme résolue.\n\nVous ne recevrez plus d'alertes pour cette réservation. Profitez bien de votre repas magique !${feedbackText}`,
            color: COLORS.SUCCESS,
            thumbnail: {
              url: 'https://emojicdn.elk.sh/🎉?style=google',
            },
            footer: {
              text: "Merci d'utiliser Rémy !",
              icon_url: 'https://emojicdn.elk.sh/✨?style=google',
            },
          },
        ],
        ephemeral: true,
      });
    } catch (error) {
      await handleInteractionError(interaction, error, {
        customId: interaction.customId,
      });
    }
  }

  public parse(interaction: ButtonInteraction) {
    if (!interaction.customId.startsWith('markNotificationSolved-')) return this.none();
    return this.some(parsePositiveInt(customIdArgs(interaction.customId)[0]));
  }
}
