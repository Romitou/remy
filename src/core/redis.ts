import { createClient } from 'redis';
import { BookNotification } from '../typings/bookAlerts';
import { container } from '@sapphire/framework';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, Colors, EmbedBuilder } from 'discord.js';
import { convertTime12to24, frenchMealPeriod, normalizeDate } from './utils';

export async function subscribeBookNotifications() {
    const client = createClient({
        url: process.env.REDIS_URL,
        password: process.env.REDIS_PASSWORD,
    });

    try {
        await client.connect();
    } catch (e) {
        console.error(e);
    }

    await client.subscribe('book-notifications', async (message) => {
        const bookNotification: BookNotification = JSON.parse(message);

        const user = await container.client.users.fetch(bookNotification.discordId);

        const embed = new EmbedBuilder()
            .setTitle(`📬 Nouvelle notification de réservation`)
            .setColor(Colors.Navy)
            .setImage(bookNotification.restaurant.imageUrl)
            .setFooter({ text: `Alerte de disponibilité associée à votre notification n°${bookNotification.bookAlertId}` })
            .setDescription('▫️ Ici Rémy, une table est **actuellement disponible à la réservation** selon les critères que vous avez définis.\n▫️ Vous pouvez réserver cette table en vous rendant sur **l\'application Disneyland Paris**.\n▫️ Si vous avez réussi à **réserver cette table**, merci de me le faire savoir en **cliquant sur le bouton ci-dessous** : j\'arrêterai de vous envoyer des notifications pour ce restaurant et ce repas !');

        embed.setFields([
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
                value: bookNotification.hours.map(convertTime12to24).join(', '),
                inline: true,
            },
            {
                name: '🍽️ Nombre de couverts',
                value: bookNotification.partyMix + ' couverts',
                inline: true,
            },
            {
                name: '😋 Période de repas',
                value: frenchMealPeriod(bookNotification.mealPeriod),
                inline: true,
            }
        ]);

        const componentRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`markNotificationSolved-${bookNotification.bookAlertId}`)
                    .setLabel('Marquer comme réservé')
                    .setStyle(ButtonStyle.Success)
                    .setEmoji('✅')
            );

        await user.send({
            embeds: [embed],
            components: [componentRow]
        });
    });
}
