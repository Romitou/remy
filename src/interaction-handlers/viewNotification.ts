import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    Colors,
    EmbedBuilder,
    SelectMenuInteraction
} from 'discord.js';
import { Restaurant } from '../typings/restaurants';
import { fetchBookAlertById } from '../core/bookAlerts';
import { BookAlert } from '../typings/bookAlerts';
import { frenchMealPeriod, normalizeDate } from '../core/utils';

export class ViewNotification extends InteractionHandler {
    public constructor(ctx) {
        super(ctx, { interactionHandlerType: InteractionHandlerTypes.SelectMenu });
    }

    public async run(interaction: SelectMenuInteraction) {
        const bookAlertId = interaction.values[0];
        let bookAlert: BookAlert;
        try {
            bookAlert = await fetchBookAlertById(parseInt(bookAlertId));
        } catch (e) {
            console.error(e);
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
            .setTitle(`Votre notification n°${bookAlert.id} 📬`)
            .setDescription('Vous êtes sur le point de supprimer cette notification. Après cela, vous ne recevrez plus de notifications pour ce restaurant et ce repas. Si vous souhaitez continuer, cliquez sur le bouton ci-dessous.')
            .setColor(Colors.Red);

        embed.setFields([
            {
                name: 'Restaurant',
                value: bookAlert.restaurant.name,
                inline: true
},
            {
                name: 'Date',
                value: normalizeDate(bookAlert.date),
                inline: true
            },
            {
                name: 'Période de repas',
                value: frenchMealPeriod(bookAlert.mealPeriod),
                inline: true
            },
            {
                name: 'Nombre de couverts',
                value: bookAlert.partyMix.toString(),
                inline: true
            },
            {
                name: 'Statut',
                value: bookAlert.completed ? 'Terminée' : 'En cours',
                inline: true
            },
            {
                name: 'Date de création',
                value: `<t:${Math.round(new Date(bookAlert.createdAt).valueOf() / 1000)}:R>`,
                inline: true
            },

        ]);


        const componentRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`deleteNotification-${bookAlert.id}`)
                    .setEmoji('🗑️')
                    .setLabel('Supprimer')
                    .setStyle(ButtonStyle.Danger)
            );

        await interaction.update({
            embeds: [embed],
            components: [componentRow],
        });
    }

    public parse(interaction: ButtonInteraction) {
        if (!(interaction.customId === 'viewNotification')) return this.none();
        return this.some();
    }
}
