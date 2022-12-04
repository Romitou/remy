import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ButtonInteraction, Colors, SelectMenuInteraction } from 'discord.js';
import { createBookAlert } from '../core/bookAlerts';
import { getNotificationDetails } from '../core/embeds';
import { BookAlert } from '../typings/bookAlerts';
import Sentry from '@sentry/node';

export class ValidateNotification extends InteractionHandler {
    public constructor(ctx) {
        super(ctx, { interactionHandlerType: InteractionHandlerTypes.SelectMenu });
    }

    public async run(interaction: SelectMenuInteraction) {
        const mealPeriod = interaction.values[0];

        const notificationDetails = await getNotificationDetails(interaction.message.embeds[0]);

        let bookAlert: BookAlert;
        try {
            const parsedDate = notificationDetails.date.split('/').reverse().join('-');
            bookAlert = await createBookAlert(
                notificationDetails.restaurantId,
                mealPeriod,
                parsedDate,
                notificationDetails.partyMix,
                interaction.user.id
            );
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

        let eatingVerb;
        switch (bookAlert.mealPeriod) {
            case 'breakfast':
                eatingVerb = 'petit-déjeuner';
                break;
            case 'lunch':
                eatingVerb = 'déjeuner';
                break;
            case 'dinner':
                eatingVerb = 'dîner';
                break;
        }

        await interaction.update({
            embeds: [
                {
                    title: '✅ Votre notification a bien été enregistrée !',
                    description: `Je me chargerai personnellement de vérifier régulièrement si le restaurant **${bookAlert.restaurant.name}** propose des tables pour y **${eatingVerb}** le **${notificationDetails.date}** pour **${notificationDetails.partyMix}** couverts.\n\nSi je trouve une disponibilité, comptez sur moi pour vous en informer en vous en envoyant immédiatement un message privé !\n\nVous pouvez à tout moment gérer vos notifications en cliquant sur le bouton *Mes notifications* du message en haut du salon.`,
                    color: Colors.Green,
                    image: {
                        url: 'https://s3-01.romitou.fr/disneytables/notificationCreated.jpg'
                    },
                    footer: {
                        text: `Identifiant associé à votre notification : n°${bookAlert.id}`
                    }
                }
            ],
            components: []
        });
    }

    public parse(interaction: ButtonInteraction) {
        if (!(interaction.customId === 'validateNotification')) return this.none();
        return this.some();
    }
}
