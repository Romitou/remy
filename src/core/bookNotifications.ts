import { container } from '@sapphire/framework';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  DiscordAPIError,
  EmbedBuilder,
  RESTJSONErrorCodes,
  User,
} from 'discord.js';
import { captureException } from '@sentry/node';
import { bookNotificationSchema } from '../typings/bookAlerts';
import { convertTime12to24, formatPartyMix, frenchMealPeriod, mealPeriodEmoji } from './utils';
import { formatApiDate } from '../lib/dates';
import { alertConfirmationDm, AlertSummary } from '../lib/views';
import { buildCustomId, CUSTOM_IDS } from '../lib/customId';
import { BOOKING_URL, COLORS, EMOJIS } from '../constants';
import { getLogger } from '../config/logger';

const logger = getLogger();

/**
 * Whether an error means that the user does not accept DMs from the bot
 */
export function isDmClosedError(error: unknown): boolean {
  return (
    error instanceof DiscordAPIError &&
    error.code === RESTJSONErrorCodes.CannotSendMessagesToThisUser
  );
}

/**
 * Confirm a new alert in DM. Returns false if the user's DMs are closed, so that they can be
 * warned while they are still in the flow.
 */
export async function sendAlertConfirmationDm(
  user: User,
  alertId: number,
  summary: AlertSummary,
): Promise<boolean> {
  try {
    await user.send({ embeds: [alertConfirmationDm(alertId, summary)] });
    return true;
  } catch (error) {
    if (isDmClosedError(error)) {
      return false;
    }
    logger.error({ error, userId: user.id, alertId }, 'Failed to send alert confirmation DM');
    captureException(error, { tags: { component: 'alert-confirmation' } });
    return true;
  }
}

/**
 * Handle a raw message received on the "restaurant-notifications" channel:
 * validate it and send the notification to the user in DM
 */
export async function handleBookNotificationMessage(message: string): Promise<void> {
  let payload: unknown;
  try {
    payload = JSON.parse(message);
  } catch (error) {
    logger.error({ error, message }, 'Received invalid JSON book notification');
    captureException(error, { tags: { component: 'book-notification' }, extra: { message } });
    return;
  }

  const parsed = bookNotificationSchema.safeParse(payload);
  if (!parsed.success) {
    logger.error({ issues: parsed.error.issues, message }, 'Received malformed book notification');
    captureException(parsed.error, {
      tags: { component: 'book-notification' },
      extra: { message },
    });
    return;
  }

  const notification = parsed.data;
  const logContext = {
    userId: notification.discordId,
    alertId: notification.alertId,
    restaurant: notification.restaurant.name,
    date: notification.date,
  };
  logger.info(logContext, 'Processing book notification');

  const hours = notification.hours.map(convertTime12to24);

  const embed = new EmbedBuilder()
    .setTitle(`${EMOJIS.RESTAURANT} Une table est disponible !`)
    .setColor(COLORS.SUCCESS)
    .setDescription(
      `**${notification.restaurant.name}** a de la place le **${formatApiDate(notification.date)}** pour **${formatPartyMix(notification.partyMix)}**.\n\nRéservez vite dans l'application ou sur le site Disneyland Paris : les tables partent souvent en quelques minutes !`,
    )
    .setImage(notification.restaurant.imageUrl || null)
    .setFields([
      {
        name: `${EMOJIS.CLOCK} Horaire(s)`,
        value: hours.length > 0 ? hours.join(' · ') : 'Voir dans l’application',
        inline: true,
      },
      {
        name: `${mealPeriodEmoji(notification.mealPeriod)} Repas`,
        value: frenchMealPeriod(notification.mealPeriod),
        inline: true,
      },
    ])
    .setFooter({
      text: `Alerte n°${notification.alertId} · Sans réponse de votre part, je continue de surveiller`,
    });

  const componentRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setLabel('Réserver').setStyle(ButtonStyle.Link).setURL(BOOKING_URL),
    new ButtonBuilder()
      .setCustomId(buildCustomId(CUSTOM_IDS.ALERT_SOLVED, notification.alertId))
      .setLabel("J'ai réservé")
      .setStyle(ButtonStyle.Success)
      .setEmoji(EMOJIS.SUCCESS),
    new ButtonBuilder()
      .setCustomId(buildCustomId(CUSTOM_IDS.STOP_ALERT, notification.alertId))
      .setLabel("Arrêter l'alerte")
      .setStyle(ButtonStyle.Secondary)
      .setEmoji(EMOJIS.BELL_OFF),
  );

  try {
    const user = await container.client.users.fetch(notification.discordId);
    await user.send({
      embeds: [embed],
      components: [componentRow],
    });
    logger.info(logContext, 'Book notification sent successfully');
  } catch (error) {
    // Users who closed their DMs are an expected situation, not a bug to report
    if (isDmClosedError(error)) {
      logger.warn(logContext, 'Cannot send book notification: user DMs are closed');
      return;
    }
    logger.error({ ...logContext, error }, 'Failed to send book notification');
    captureException(error, { tags: { component: 'book-notification' }, extra: logContext });
  }
}
