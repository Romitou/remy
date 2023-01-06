import { DailyReport, Statistics } from '../typings/core';
import { container } from '@sapphire/framework';
import { ActivityType, Colors, EmbedBuilder } from 'discord.js';
import axios from 'axios';
import { getAxiosClient } from '../core/axios';

function getDailyReport(): Promise<DailyReport> {
    return getAxiosClient().get<DailyReport>('/dailyReport')
        .then((response) => response.data);
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
