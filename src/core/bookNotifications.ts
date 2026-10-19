import { container } from '@sapphire/framework';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  Colors,
  DiscordAPIError,
  EmbedBuilder,
  RESTJSONErrorCodes,
} from 'discord.js';
import { captureException } from '@sentry/node';
import { bookNotificationSchema } from '../typings/bookAlerts';
import { convertTime12to24, frenchMealPeriod, normalizeDate } from './utils';
import { getLogger } from '../config/logger';

const logger = getLogger();

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

  const bookNotification = parsed.data;
  const logContext = {
    userId: bookNotification.discordId,
    alertId: bookNotification.alertId,
    restaurant: bookNotification.restaurant.name,
    date: bookNotification.date,
  };
  logger.info(logContext, 'Processing book notification');

  const embed = new EmbedBuilder()
    .setTitle('📬 Nouvelle notification de réservation')
    .setColor(Colors.Navy)
    .setImage(bookNotification.restaurant.imageUrl || null)
    .setFooter({
      text: `Alerte de disponibilité associée à votre notification n°${bookNotification.alertId}`,
    })
    .setDescription(
      "Hey, ici Rémy ! Une table est **actuellement disponible à la réservation** selon les critères que vous avez définis, sur l'application Disneyland Paris.",
    )
    .setFields([
      {
        name: '🏢 Restaurant',
        value: bookNotification.restaurant.name,
        inline: true,
      },
      {
        name: '📅 Date',
        value: normalizeDate(bookNotification.date),
        inline: true,
      },
      {
        name: '🕒 Heure(s)',
        value: bookNotification.hours.map(convertTime12to24).join(', ') || '-',
        inline: true,
      },
      {
        name: '🍽️ Nombre de couverts',
        value: `${bookNotification.partyMix} couverts`,
        inline: true,
      },
      {
        name: '😋 Période de repas',
        value: frenchMealPeriod(bookNotification.mealPeriod),
        inline: true,
      },
    ]);

  const componentRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`markNotificationSolved-${bookNotification.alertId}`)
      .setLabel('Marquer comme réservé')
      .setStyle(ButtonStyle.Success)
      .setEmoji('✅'),
  );

  try {
    const user = await container.client.users.fetch(bookNotification.discordId);
    await user.send({
      embeds: [embed],
      components: [componentRow],
    });
    logger.info(logContext, 'Book notification sent successfully');
  } catch (error) {
    // Users who closed their DMs are an expected situation, not a bug to report
    if (
      error instanceof DiscordAPIError &&
      error.code === RESTJSONErrorCodes.CannotSendMessagesToThisUser
    ) {
      logger.warn(logContext, 'Cannot send book notification: user DMs are closed');
      return;
    }
    logger.error({ ...logContext, error }, 'Failed to send book notification');
    captureException(error, { tags: { component: 'book-notification' }, extra: logContext });
  }
}
