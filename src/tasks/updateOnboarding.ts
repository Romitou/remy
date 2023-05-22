import { container } from '@sapphire/framework';
import { BaseGuildTextChannel, Embed, Message } from 'discord.js';
import { DailyReport } from '../typings/core';
import { getDailyReport } from './sendDailyReport';

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

    let dailyReport: DailyReport;
    try {
        dailyReport = await getDailyReport();
    } catch (e) {
        console.error(e);
        return;
    }

    const embeds = [createOnboardingEmbed(dailyReport)]
    if (!message) {
        message = await onboardingChannel.send({ embeds });
        messageId = message.id;
        return;
    }

    await message.edit({ embeds });
}

function createOnboardingEmbed(dailyReport: DailyReport): Embed {
    return {
        title: 'Notifications de disponibilité des restaurants 🍽️',
        color: 7445165,
        image: {
            url: 'https://s3-01.romitou.fr/disneytables/welcome.jpg',
        },
        fields: [
            {
                name: '📝 Fonctionnement',
                value: `:white_small_square: Grâce à moi, **activez dès maintenant vos notifications de disponibilité pour les restaurants** des parcs et hôtels de Disneyland Paris.\n:white_small_square: Je me chargerai de **vérifier périodiquement si une table est disponible** dans le restaurant de votre choix selon votre période de repas, votre date de visite et votre nombre de couverts.\n:white_small_square: Dès qu'une table sera disponible, **je vous enverrai une notification en message privé** ! Il ne vous restera plus qu'à vous rendre sur l'application Disneyland Paris et **réserver votre table**.\nㅤ`,
            },
            {
                name: '🕓 Intervalle de vérification',
                value: `Chaque demande est actuellement vérifiée toutes les **${dailyReport.highestCheckInterval} minutes**, intervalle susceptible d'évoluer en fonction de la charge du serveur et du nombre de demandes enregistrées.`,
            },
        ],
        footer: {
            text: 'Créé et développé par Romitou pour Disneyland Paris - Notifications et entraides',
        },
    } as Embed;
}
