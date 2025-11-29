import { container } from '@sapphire/framework';
import {
  ActionRowBuilder,
  BaseGuildTextChannel,
  ButtonBuilder,
  ButtonStyle,
  Embed,
  Message,
} from 'discord.js';
import { DailyReport, Statistics } from '../typings/core';
import { getDailyReport, getStatus } from './sendDailyReport';
import { getLogger } from '../config/logger';
import { getAxiosClient } from '../core/axios';

const logger = getLogger();

let messageId: string | undefined;

/**
 * Fetch statistics from the API
 */
async function fetchStatistics(): Promise<Statistics> {
  try {
    const response = await getAxiosClient().get<Statistics>('/statistics');
    return response.data;
  } catch (error) {
    logger.error({ error }, 'Failed to fetch statistics for onboarding');
    throw error;
  }
}

/**
 * Create the onboarding embed
 */
function createOnboardingEmbed(
  dailyReport: DailyReport | null,
  statistics: Statistics | null,
  maintenanceMode: boolean
): Embed {
  const maintenanceString =
    "Je fais une petite pause pour le moment. Les équipes sont déjà au courant et travaillent à rétablir le service. À très bientôt !";

  // Build a friendly description with stats if available
  let descriptionText = "👋 Je suis Rémy, votre assistant personnel pour les réservations de restaurants à Disneyland Paris. Ma mission ? Vous avertir instantanément dès qu'une table se libère dans vos restaurants préférés ! ✨";

  let statisticsText = '';
  if (statistics && !maintenanceMode) {
    const stats: string[] = [];
    if (statistics.alerts > 0) {
      stats.push(`**${statistics.alerts}** notifications actives`);
    }
    if (dailyReport && dailyReport.newNotifications > 0) {
      stats.push(`**${dailyReport.newNotifications}** alertes envoyées aujourd'hui`);
    }

    if (stats.length > 0) {
        statisticsText = stats.join(' • ');
    }
  }

  const fields = [];
  //
  // // How it works section - simplified and friendly
  // fields.push({
  //   name: '✨ Comment ça marche ?',
  //   value:
  //     "**C'est très simple !**\n" +
  //     "1️⃣ Cliquez sur **« Créer une alerte »** ci-dessous\n" +
  //     "2️⃣ Choisissez votre restaurant préféré 🍽️\n" +
  //     "3️⃣ Indiquez vos dates de visite 📅\n" +
  //     "4️⃣ Validez ! Je m'occupe du reste 🎯\n\n" +
  //     "Je vérifie les disponibilités **automatiquement** et vous préviens dès qu'une table se libère !",
  // });
  //
  // // Benefits section - why use this service
  // if (!maintenanceMode) {
  //   fields.push({
  //     name: '👉 Pourquoi utiliser Rémy ?',
  //     value:
  //       "✅ **Gain de temps** - Plus besoin de vérifier sans cesse\n" +
  //       "✅ **Réactivité** - Soyez le premier informé\n" +
  //       "✅ **Simple** - Quelques clics suffisent\n"
  //   });
  // }

  // Status or maintenance section
  fields.push({
    name: maintenanceMode ? '🟠 Pause temporaire' : '🟢 Service opérationnel',
    value: maintenanceMode
      ? maintenanceString
      : `Je vérifie les disponibilités toutes les **${dailyReport?.highestCheckInterval ?? 'N/A'} minutes**\n` +
      statisticsText,
  });

  return {
    title: '🐭 Rémy - notifications de disponibilités de restaurants',
    description: descriptionText,
    color: maintenanceMode ? 15844367 : 5793266, // Softer orange for maintenance, Disney blue for normal
    image: {
      url: 'https://s3-01.romitou.fr/disneytables/welcome.jpg',
    },
    fields,
    footer: {
      text: 'Créé et développé par Romitou pour DLP HELP - Notifications et entraides',
    },
  } as Embed;
}

/**
 * Update the onboarding message in the configured channel
 */
export default async function updateOnboarding(): Promise<void> {
  try {
    const { client } = container;

    const channelId = process.env.CHANNEL_ID;
    if (!channelId) {
      logger.warn('CHANNEL_ID not set, skipping onboarding update');
      return;
    }

    const onboardingChannel = (await client.channels.fetch(channelId)) as BaseGuildTextChannel;

    if (!onboardingChannel) {
      logger.error({ channelId }, 'Onboarding channel not found');
      return;
    }

    // Find or fetch the onboarding message
    let message: Message | undefined;
    if (!messageId) {
      const messages = await onboardingChannel.messages.fetch({ limit: 100 });
      message = messages.find((msg) => msg.author.id === client.user?.id);
      if (message) {
        messageId = message.id;
        logger.info({ messageId }, 'Found existing onboarding message');
      }
    } else {
      try {
        message = await onboardingChannel.messages.fetch(messageId);
      } catch (error) {
        logger.warn({ messageId, error }, 'Could not fetch onboarding message, will create new');
        messageId = undefined;
      }
    }

    // Check system status
    let maintenanceMode = false;
    let dailyReport: DailyReport | null = null;
    let statistics: Statistics | null = null;

    try {
      dailyReport = await getDailyReport();
    } catch (error) {
      logger.error({ error }, 'Failed to fetch daily report for onboarding');
      maintenanceMode = true;
    }

    try {
      statistics = await fetchStatistics();
    } catch (error) {
      logger.error({ error }, 'Failed to fetch statistics for onboarding');
      // Don't set maintenance mode, statistics are optional
    }

    try {
      const statusResponse = await getStatus();
      if (!statusResponse) {
        logger.warn({ status: statusResponse }, 'System status not OK');
        maintenanceMode = true;
      }
    } catch (error) {
      logger.error({ error }, 'Failed to fetch status for onboarding');
      maintenanceMode = true;
    }

    // Create components
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

    // Create or update the message
    if (!message) {
      message = await onboardingChannel.send({ embeds, components });
      messageId = message.id;
      logger.info({ messageId, channelId }, 'Created new onboarding message');
    } else {
      await message.edit({ embeds, components });
      logger.debug({ messageId }, 'Updated onboarding message');
    }
  } catch (error) {
    logger.error({ error }, 'Error updating onboarding message');
    // Don't throw - let the task continue running
  }
}
