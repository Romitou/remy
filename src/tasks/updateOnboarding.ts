import { container } from '@sapphire/framework';
import {
  ActionRowBuilder,
  BaseGuildTextChannel,
  ButtonBuilder,
  ButtonStyle,
  Embed,
  Message,
} from 'discord.js';
import { DailyReport } from '../typings/core';
import { getDailyReport, getStatus } from './sendDailyReport';
import { getLogger } from '../config/logger';

const logger = getLogger();

let messageId: string | undefined;

/**
 * Create the onboarding embed
 */
function createOnboardingEmbed(dailyReport: DailyReport | null, maintenanceMode: boolean): Embed {
  const maintenanceString =
    "Hey, c'est Rémy ! Je ne parviens pas à vérifier les disponibilités des restaurants pour le moment. Je viens de prévenir les équipes afin de résoudre ce problème. Je reviens très vite, promis ! 🐭🍽️";

  return {
    title: 'Notifications de disponibilité des restaurants 🍽️',
    color: maintenanceMode ? 14897443 : 7445165,
    image: {
      url: 'https://s3-01.romitou.fr/disneytables/welcome.jpg',
    },
    fields: [
      {
        name: '📝 Fonctionnement',
        value:
          'Vous cherchez à réserver une table dans un des restaurants de Disneyland Paris ? Recevez une notification dès lorsque les restaurants de votre choix libèrent une table aux dates de vos prochaines visites !',
      },
      {
        name: maintenanceMode ? '🟠 Mise en pause temporaire' : '🕓 Intervalle de vérification',
        value: maintenanceMode
          ? maintenanceString
          : `Chaque demande est actuellement vérifiée toutes les **${dailyReport?.highestCheckInterval ?? 'N/A'} minutes**, intervalle susceptible d'évoluer en fonction de la charge du serveur et du nombre de demandes enregistrées.`,
      },
    ],
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

    try {
      dailyReport = await getDailyReport();
    } catch (error) {
      logger.error({ error }, 'Failed to fetch daily report for onboarding');
      maintenanceMode = true;
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
        .setLabel('Enregistrer une notification')
        .setStyle(maintenanceMode ? ButtonStyle.Danger : ButtonStyle.Success)
        .setDisabled(maintenanceMode)
        .setEmoji('📬'),
      new ButtonBuilder()
        .setCustomId('myNotifications')
        .setLabel('Mes notifications')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📘'),
    );

    const components = [componentRow];
    const embeds = [createOnboardingEmbed(dailyReport, maintenanceMode)];

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
