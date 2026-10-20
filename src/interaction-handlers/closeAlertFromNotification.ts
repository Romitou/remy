import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { APIEmbed, ButtonInteraction, EmbedBuilder, MessageFlags } from 'discord.js';
import { completeBookAlert, fetchBookAlertById } from '../core/bookAlerts';
import { handleInteractionError } from '../lib/errorHandler';
import { alertNotFoundView } from '../lib/views';
import { CUSTOM_IDS, customIdArgs, customIdPrefix, parsePositiveInt } from '../lib/customId';
import { COLORS, EMOJIS } from '../constants';
import { getEnvironment } from '../config/environment';
import { getLogger } from '../config/logger';

const logger = getLogger();

interface CloseAlertArgs {
  alertId: number | null;
  booked: boolean;
}

/**
 * "J'ai réservé" and "Arrêter l'alerte" buttons of the notifications sent in DM
 */
export class CloseAlertFromNotification extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext) {
    super(ctx, { interactionHandlerType: InteractionHandlerTypes.Button });
  }

  public async run(interaction: ButtonInteraction, { alertId, booked }: CloseAlertArgs) {
    try {
      await interaction.deferUpdate();

      const alert = alertId ? await fetchBookAlertById(alertId) : null;
      if (!alert || alert.discordId !== interaction.user.id) {
        await interaction.followUp({ ...alertNotFoundView(), flags: MessageFlags.Ephemeral });
        return;
      }

      await completeBookAlert(alert.id);
      logger.info(
        { userId: interaction.user.id, alertId: alert.id, booked },
        'Alert closed from DM',
      );

      // Keep the notification, marked as handled, without its buttons
      const original = interaction.message.embeds[0];
      const updated = (original ? EmbedBuilder.from(original) : new EmbedBuilder())
        .setColor(booked ? COLORS.SUCCESS : COLORS.MUTED)
        .setFooter({
          text: booked
            ? `${EMOJIS.SUCCESS} Réservation confirmée · Alerte n°${alert.id} arrêtée`
            : `${EMOJIS.BELL_OFF} Alerte n°${alert.id} arrêtée`,
        });
      await interaction.editReply({ embeds: [updated], components: [] });

      await interaction.followUp({
        embeds: [booked ? bookedEmbed() : stoppedEmbed()],
        flags: MessageFlags.Ephemeral,
      });
    } catch (error) {
      await handleInteractionError(interaction, error, { customId: interaction.customId });
    }
  }

  public parse(interaction: ButtonInteraction) {
    const prefix = customIdPrefix(interaction.customId);
    if (prefix !== CUSTOM_IDS.ALERT_SOLVED && prefix !== CUSTOM_IDS.STOP_ALERT) {
      return this.none();
    }
    return this.some<CloseAlertArgs>({
      alertId: parsePositiveInt(customIdArgs(interaction.customId)[0]),
      booked: prefix === CUSTOM_IDS.ALERT_SOLVED,
    });
  }
}

function bookedEmbed(): APIEmbed {
  const { FEEDBACK_CHANNEL_ID } = getEnvironment();
  const feedback = FEEDBACK_CHANNEL_ID
    ? `\n\n💬 Racontez-nous comment ça s'est passé dans <#${FEEDBACK_CHANNEL_ID}> !`
    : '';
  return {
    title: '🎉 Félicitations pour votre réservation !',
    description: `J'ai arrêté cette alerte. Bon appétit et profitez bien de votre journée magique !${feedback}`,
    color: COLORS.SUCCESS,
  };
}

function stoppedEmbed(): APIEmbed {
  return {
    title: `${EMOJIS.BELL_OFF} Alerte arrêtée`,
    description:
      'Je ne surveille plus ce restaurant pour cette date. Créez une nouvelle alerte à tout moment avec `/alerte`.',
    color: COLORS.MUTED,
  };
}
