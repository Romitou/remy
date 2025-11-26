import { DailyReport } from '../typings/core';
import { container } from '@sapphire/framework';
import { Colors, EmbedBuilder } from 'discord.js';
import { getAxiosClient } from '../core/axios';
import { getLogger } from '../config/logger';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const logger = getLogger();

/**
 * Fetch daily report from API
 */
export async function getDailyReport(): Promise<DailyReport> {
  try {
    const response = await getAxiosClient().get<DailyReport>('/daily-report');
    return response.data;
  } catch (error) {
    logger.error({ error }, 'Failed to fetch daily report');
    throw error;
  }
}

/**
 * Fetch status from API
 */
export async function getStatus(): Promise<DailyReport> {
  try {
    const response = await getAxiosClient().get<DailyReport>('/status');
    return response.data;
  } catch (error) {
    logger.error({ error }, 'Failed to fetch status');
    throw error;
  }
}

/**
 * Send daily report to the owner
 */
export default async function sendDailyReport(): Promise<void> {
  try {
    const { client } = container;

    // Get owner ID from environment
    const ownerId = process.env.OWNER_ID;
    if (!ownerId) {
      logger.warn('OWNER_ID not set, skipping daily report');
      return;
    }

    // Fetch daily report
    let dailyReport: DailyReport;
    try {
      dailyReport = await getDailyReport();
    } catch (error) {
      logger.error({ error }, 'Failed to fetch daily report, aborting send');
      return;
    }

    // Fetch owner user
    const owner = await client.users.fetch(ownerId);

    // Create embed
    const today = format(new Date(), 'PPP', { locale: fr });
    const embed = new EmbedBuilder()
      .setTitle('📊 Rapport quotidien')
      .setDescription(`Rapport d'activité pour le ${today}`)
      .setColor(Colors.Navy)
      .setFields([
        {
          name: '🆕 Nouveaux créneaux',
          value: dailyReport.newBookSlots.toString(),
          inline: true,
        },
        {
          name: '🔔 Nouvelles alertes',
          value: dailyReport.newBookAlerts.toString(),
          inline: true,
        },
        {
          name: '📬 Notifications envoyées',
          value: dailyReport.newNotifications.toString(),
          inline: true,
        },
        {
          name: '⏱️ Intervalle max de vérification',
          value: `${dailyReport.highestCheckInterval} minutes`,
          inline: true,
        },
      ])
      .setTimestamp();

    await owner.send({ embeds: [embed] });

    logger.info(
      {
        ownerId,
        newSlots: dailyReport.newBookSlots,
        newAlerts: dailyReport.newBookAlerts,
        newNotifications: dailyReport.newNotifications,
      },
      'Daily report sent successfully',
    );
  } catch (error) {
    logger.error({ error }, 'Error sending daily report');
    // Don't throw - let the task continue running
  }
}

