import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ButtonInteraction, ButtonStyle, Colors, EmbedBuilder } from 'discord.js';
import { completeBookAlert, fetchBookAlertById } from '../core/bookAlerts';
import { RestaurantAlert } from '../typings/bookAlerts';
import { normalizeDate } from '../core/utils';
import Sentry from '@sentry/node';
import { fetchRestaurantById } from '../core/restaurants';

export class DeleteNotification extends InteractionHandler {
    public constructor(ctx) {
        super(ctx, { interactionHandlerType: InteractionHandlerTypes.Button });
    }

    public async run(interaction: ButtonInteraction, bookAlertId: string) {
        let bookAlert: RestaurantAlert;
        try {
            bookAlert = await fetchBookAlertById(parseInt(bookAlertId));
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
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

        try {
            await completeBookAlert(bookAlert.id);
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
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

        const restaurant = await fetchRestaurantById(bookAlert.checks[0].restaurantId)
        const embed = new EmbedBuilder()
            .setTitle(`Votre notification a bien été supprimée 📬`)
            .setDescription('La notification pour le restaurant **' + restaurant.name + '**, le ' + normalizeDate(bookAlert.date) + ' a bien été supprimée. Vous ne recevrez plus de mes notifications pour ce restaurant et ce repas.')
            .setColor(Colors.Red);

        await interaction.update({
            embeds: [embed],
            components: [],
        });
    }

    public parse(interaction: ButtonInteraction) {
        if (!(interaction.customId.startsWith('deleteNotification-'))) return this.none();
        const notificationId = interaction.customId.split('-')[1];
        return this.some(notificationId);
    }
}
