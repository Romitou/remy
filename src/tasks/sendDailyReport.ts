import { DailyReport, Statistics } from '../typings/core';
import { ofetch } from 'ofetch';
import { container } from '@sapphire/framework';
import { ActivityType, Colors, EmbedBuilder } from 'discord.js';

function getDailyReport(): Promise<DailyReport> {
    return ofetch<DailyReport>(`${process.env.BASE_API}/dailyReport`, {
        method: 'GET',
        parseResponse: JSON.parse,
        headers: {
            'Authorization': `Bearer ${process.env.WEBSERVER_TOKEN}`
        }
    });
}

export default async function sendDailyReport() {
    const { client } = container;
    let dailyReport: DailyReport;
    try {
        dailyReport = await getDailyReport();
    } catch (e) {
        console.error(e);
        return;
    }

    const userId = process.env.OWNER_ID;
    const user = await client.users.fetch(userId);

    const embed = new EmbedBuilder()
        .setTitle('Rapport quotidien')
        .setColor(Colors.Navy)
        .setFields([
            {
                name: 'Nouveaux créneaux',
                value: dailyReport.newBookSlots.toString(),
            },
            {
                name: 'Nouvelles notifications',
                value: dailyReport.newBookAlerts.toString(),
            },
            {
                name: 'Nouvelles notifications envoyées',
                value: dailyReport.newNotifications.toString(),
            },
            {
                name: 'Intervalle de vérification le plus long',
                value: dailyReport.highestCheckInterval + ' minutes',
            }
        ]);

    await user.send({ embeds: [embed] });
}
