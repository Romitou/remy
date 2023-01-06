import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import {
    ActionRowBuilder,
    ButtonInteraction,
    Colors,
    EmbedBuilder,
    SelectMenuBuilder,
    StringSelectMenuBuilder
} from 'discord.js';
import { fetchActiveBookAlertsForUser } from '../core/bookAlerts';
import { BookAlert } from '../typings/bookAlerts';
import { frenchMealPeriod, normalizeDate } from '../core/utils';
import { captureException } from '@sentry/node';


export class MyNotifications extends InteractionHandler {
    public constructor(ctx) {
        super(ctx, { interactionHandlerType: InteractionHandlerTypes.Button });
    }

    public async run(interaction: ButtonInteraction) {
        let bookAlerts: BookAlert[];
        try {
            bookAlerts = await fetchActiveBookAlertsForUser(interaction.user.id);
        } catch (e) {
            console.error(e);
            captureException(e);
            await interaction.reply({
                embeds: [
                    {
                        title: '🛠 Oups, quelque chose est cassé !',
                        description: 'On dirait bien que quelque chose ne fonctionne pas comme prévu. Pas d\'inquiétude, cet incident technique a été remonté et sera corrigé le plus vite possible. Nous vous invitons à réessayer ultérieurement.',
                        color: Colors.Red,
                        image: {
                            url: 'https://s3-01.romitou.fr/disneytables/error.png'
                        }
                    }
                ],
                ephemeral: true,
            });
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle('Liste de vos notifications 📬')
            .setColor(Colors.Navy);

        if (bookAlerts.length === 0) {
            embed.setDescription('Je vois que vous n\'avez aucune notification active... Cliquez sur le bouton *Enregistrer une notification* du message en haut du salon pour commencer !')
            await interaction.reply({
                embeds: [embed],
                ephemeral: true,
            });
            return;
        } else {
            embed.setDescription("Voici la liste de vos notifications actives. Afin de supprimer une de vos notifications, sélectionnez-la simplement dans le menu déroulant ci-dessous.");
            bookAlerts.forEach((bookAlert) => {
                return embed.addFields({
                    name: `Notification n° ${bookAlert.id}`,
                    value: `▫️ ${normalizeDate(bookAlert.date)}\n▫️ ${bookAlert.restaurant.name}\n▫️ ${bookAlert.partyMix} couverts\n▫️ ${frenchMealPeriod(bookAlert.mealPeriod)}`,
                    inline: true,
                });
            })
        }

        const componentRow = new ActionRowBuilder<SelectMenuBuilder>()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('viewNotification')
                    .setPlaceholder('Sélectionnez une notification à supprimer')
                    .setOptions(
                        bookAlerts.map((bookAlert) => ({
                            label: 'Supprimer la notification n°' + bookAlert.id,
                            description: `📅 ${normalizeDate(bookAlert.date)} - 🍽 ${frenchMealPeriod(bookAlert.mealPeriod)} - 🏢 ${bookAlert.restaurant.name}`,
                            value: String(bookAlert.id),
                        }))
                    )
            );

        await interaction.reply({
            embeds: [embed],
            components: [componentRow],
            ephemeral: true,
        });
    }

    public parse(interaction: ButtonInteraction) {
        if (!(interaction.customId === 'myNotifications')) return this.none();
        return this.some();
    }
}
