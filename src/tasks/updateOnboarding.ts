import { container } from '@sapphire/framework';
import { ActionRowBuilder, BaseGuildTextChannel, ButtonBuilder, ButtonStyle, Embed, Message } from 'discord.js';
import { DailyReport } from '../typings/core';
import { getDailyReport, getStatus } from './sendDailyReport';

let messageId;

export default async function updateOnboarding() {
    const { client } = container;

    const onboardingChannel = await client.channels.fetch(process.env.CHANNEL_ID) as BaseGuildTextChannel;

    let message: Message;
    if (!messageId) {
        const messages = await onboardingChannel.messages.fetch();
        message = messages.find(message => message.author.id === client.user.id) as Message;
        if (message)
            messageId = message.id;
    } else {
        message = await onboardingChannel.messages.fetch(messageId);
    }

    let maintenanceMode = false;
    let dailyReport: DailyReport;
    try {
        dailyReport = await getDailyReport();
    } catch (e) {
        console.error(e);
        maintenanceMode = true;
    }

    let statusResponse;
    try {
        statusResponse = await getStatus();
        if (!statusResponse?.status?.includes('OK')) {
            maintenanceMode = true;
        }
    } catch (e) {
        console.error(e);
        maintenanceMode = true;
    }

    const componentRow = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
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
                .setEmoji('📘')
        );
    const components = [componentRow];


    const embeds = [createOnboardingEmbed(dailyReport, maintenanceMode)]
    if (!message) {
        message = await onboardingChannel.send({ embeds, components });
        messageId = message.id;
        return;
    }

    await message.edit({ embeds, components });
}

function createOnboardingEmbed(dailyReport: DailyReport, maintenanceMode: boolean): Embed {
    const maintenanceString = 'Hey, c\'est Rémy ! Je ne parviens pas à vérifier les disponibilités des restaurants pour le moment. Je viens de prévenir les équipes afin de résoudre ce problème. Je reviens très vite, promis ! 🐭🍽️';
    return {
        title: 'Notifications de disponibilité des restaurants 🍽️',
        color: maintenanceMode ? 14897443 : 7445165,
        image: {
            url: 'https://s3-01.romitou.fr/disneytables/welcome.jpg',
        },
        fields: [
            {
                name: '📝 Fonctionnement',
                value: `Vous cherchez à réserver une table dans un des restaurants de Disneyland Paris ? Recevez une notification dès lorsque les restaurants de votre choix libèrent une table aux dates de vos prochaines visites !`,
            },
            {
                name: maintenanceMode ? '🟠 Mise en pause temporaire' : '🕓 Intervalle de vérification',
                value: maintenanceMode ? maintenanceString : `Chaque demande est actuellement vérifiée toutes les **${dailyReport.highestCheckInterval} minutes**, intervalle susceptible d'évoluer en fonction de la charge du serveur et du nombre de demandes enregistrées.`,
            },
        ],
        footer: {
            text: 'Créé et développé par Romitou pour DLP HELP - Notifications et entraides',
        },
    } as Embed;
}
