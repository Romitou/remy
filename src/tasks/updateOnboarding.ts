import { container } from '@sapphire/framework';
import {
  ActionRowBuilder,
  APIEmbed,
  ButtonBuilder,
  ButtonStyle,
  Colors,
  Message,
  TextBasedChannel,
} from 'discord.js';
import { DailyReport, Statistics } from '../typings/core';
import { fetchDailyReport, fetchStatistics, isServiceOperational } from '../core/statistics';
import { getEnvironment } from '../config/environment';
import { getLogger } from '../config/logger';

const logger = getLogger();

let messageId: string | undefined;

/**
 * Create the onboarding embed
 */
function createOnboardingEmbed(
  dailyReport: DailyReport | null,
  statistics: Statistics | null,
  maintenanceMode: boolean,
): APIEmbed {
  const maintenanceString =
    'Je fais une petite pause pour le moment. Les équipes sont déjà au courant et travaillent à rétablir le service. À très bientôt !';

  const descriptionText =
    "👋 Je suis Rémy, votre assistant personnel pour les réservations de restaurants à Disneyland Paris. Ma mission ? Vous avertir instantanément dès qu'une table se libère dans vos restaurants préférés ! ✨";

  const stats: string[] = [];
  if (statistics && !maintenanceMode && statistics.alerts > 0) {
    stats.push(`**${statistics.alerts}** notifications actives`);
  }
  if (dailyReport && !maintenanceMode && dailyReport.newNotifications > 0) {
    stats.push(`**${dailyReport.newNotifications}** alertes envoyées aujourd'hui`);
  }

  return {
    title: '🐭 Rémy - notifications de disponibilités de restaurants',
    description: descriptionText,
    color: maintenanceMode ? Colors.Gold : Colors.Blurple,
    image: {
      url: 'https://s3-01.romitou.fr/disneytables/welcome.jpg',
    },
    fields: [
      {
        name: maintenanceMode ? '🟠 Pause temporaire' : '🟢 Service opérationnel',
        value: maintenanceMode
          ? maintenanceString
          : `Je vérifie les disponibilités toutes les **${dailyReport?.highestCheckInterval ?? 'N/A'} minutes**\n` +
            stats.join(' • '),
      },
    ],
    footer: {
      text: 'Créé et développé par Romitou pour DLP HELP - Notifications et entraides',
    },
  };
}

/**
 * Find the onboarding message previously sent by the bot, if any
 */
async function findOnboardingMessage(channel: TextBasedChannel): Promise<Message | undefined> {
  const { client } = container;

  if (messageId) {
    try {
      return await channel.messages.fetch(messageId);
    } catch (error) {
      logger.warn({ messageId, error }, 'Could not fetch onboarding message, will create new');
      messageId = undefined;
    }
  }

  const messages = await channel.messages.fetch({ limit: 100 });
  const message = messages.find((msg) => msg.author.id === client.user?.id);
  if (message) {
    messageId = message.id;
    logger.info({ messageId }, 'Found existing onboarding message');
  }
  return message;
}

/**
 * Update the onboarding message in the configured channel
 */
export default async function updateOnboarding(): Promise<void> {
  const { CHANNEL_ID: channelId } = getEnvironment();
  if (!channelId) {
    logger.warn('CHANNEL_ID not set, skipping onboarding update');
    return;
  }

  const onboardingChannel = await container.client.channels.fetch(channelId);
  if (!onboardingChannel || !onboardingChannel.isTextBased() || onboardingChannel.isDMBased()) {
    logger.error({ channelId }, 'Onboarding channel not found or not a guild text channel');
    return;
  }

  let message = await findOnboardingMessage(onboardingChannel);

  // Check system status: the daily report and the status are required, statistics are optional
  const [dailyReport, statistics, operational] = await Promise.all([
    fetchDailyReport().catch((error) => {
      logger.error({ error }, 'Failed to fetch daily report for onboarding');
      return null;
    }),
    fetchStatistics().catch((error) => {
      logger.error({ error }, 'Failed to fetch statistics for onboarding');
      return null;
    }),
    isServiceOperational(),
  ]);
  const maintenanceMode = !dailyReport || !operational;

  const componentRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId('startAlertBook')
      .setLabel(maintenanceMode ? 'Service en pause' : 'Créer une alerte')
      .setStyle(maintenanceMode ? ButtonStyle.Secondary : ButtonStyle.Success)
      .setDisabled(maintenanceMode)
      .setEmoji(maintenanceMode ? '⏸️' : '✨'),
    new ButtonBuilder()
      .setCustomId('myNotifications')
      .setLabel('Voir mes alertes')
      .setStyle(ButtonStyle.Primary)
      .setEmoji('📋'),
  );

  const components = [componentRow];
  const embeds = [createOnboardingEmbed(dailyReport, statistics, maintenanceMode)];

  if (!message) {
    message = await onboardingChannel.send({ embeds, components });
    messageId = message.id;
    logger.info({ messageId, channelId }, 'Created new onboarding message');
  } else {
    await message.edit({ embeds, components });
    logger.debug({ messageId }, 'Updated onboarding message');
  }
}
