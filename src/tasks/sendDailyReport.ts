import { container } from '@sapphire/framework';
import { Colors, EmbedBuilder } from 'discord.js';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { fetchDailyReport } from '../core/statistics';
import { getEnvironment } from '../config/environment';
import { getLogger } from '../config/logger';

const logger = getLogger();

/**
 * Send daily report to the owner
 */
export default async function sendDailyReport(): Promise<void> {
  const { OWNER_ID: ownerId } = getEnvironment();
  if (!ownerId) {
    logger.warn('OWNER_ID not set, skipping daily report');
    return;
  }

  const dailyReport = await fetchDailyReport();
  const owner = await container.client.users.fetch(ownerId);

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
}
