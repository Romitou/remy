import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ActionRowBuilder, ButtonInteraction, Colors, SelectMenuBuilder } from 'discord.js';
import { fetchRestaurants } from '../core/restaurants';
import { Restaurant } from '../typings/restaurants';
import Sentry from '@sentry/node';

export class StartAlertBook extends InteractionHandler {
    public constructor(ctx) {
        super(ctx, { interactionHandlerType: InteractionHandlerTypes.Button });
    }

    public async run(interaction: ButtonInteraction) {
        let restaurants;
        try {
            restaurants = await fetchRestaurants();
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

        const componentRow = new ActionRowBuilder<SelectMenuBuilder>()
            .addComponents(
                new SelectMenuBuilder()
                    .setCustomId('chooseDateAndPartyMix')
                    .setPlaceholder('Sélectionnez un restaurant')
                    .setOptions(
                        restaurants.map((restaurant: Restaurant) => {
                            return {
                                label: restaurant.name,
                                value: restaurant.id,
                            };
                        })
                    )
            );

        await interaction.reply({
            embeds: [
                {
                    title: 'Sélectionnez un restaurant 🍽️',
                    description: `Alors, dans quel restaurant souhaiteriez-vous manger ? Faites votre choix parmi les restaurants disponibles à la réservation, puis je vous demanderai votre date de votre visite !`,
                    color: Colors.Navy,
                    image: {
                        url: 'https://media.disneylandparis.com/d4th/fr-fr/images/n031922_2049jul09_world_food-the-lion-king-jungle-festival-buffet_5-1_tcm808-224702.jpg?w=1920',
                    },
                }
            ],
            components: [componentRow],
            ephemeral: true,
        });
    }

    public parse(interaction: ButtonInteraction) {
        if (!(interaction.customId === 'startAlertBook')) return this.none();
        return this.some();
    }
}
