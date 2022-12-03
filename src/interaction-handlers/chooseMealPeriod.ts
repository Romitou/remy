import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ActionRowBuilder, ButtonInteraction, Colors, ModalSubmitInteraction, SelectMenuBuilder } from 'discord.js';
import { Restaurant, RestaurantAvailabilities } from '../typings/restaurants';
import { fetchRestaurantAvailabilities, fetchRestaurantById } from '../core/restaurants';

export class ChooseMealPeriod extends InteractionHandler {
    public constructor(ctx) {
        super(ctx, { interactionHandlerType: InteractionHandlerTypes.ModalSubmit });
    }

    public async run(interaction: ModalSubmitInteraction, restaurantId: string) {

        await interaction.deferReply({ ephemeral: true });

        const rawDate = interaction.fields.getTextInputValue('date');
        const isValidDate = rawDate.match(/^[0-9]{2}\/[0-9]{2}\/[0-9]{4}$/);
        if (!isValidDate) {
            await interaction.reply({
                embeds: [
                    {
                        title: '🛠 Oups, votre date de visite est invalide !',
                        description: 'La date de visite que vous avez renseignée est invalide, je n\'ai pas pu la comprendre. Veuillez réessayer en respectant le format indiqué dans le formulaire.',
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

        const rawPartyMix = interaction.fields.getTextInputValue('partyMix');
        const parsedPartyMix = Number.parseInt(rawPartyMix);
        if (isNaN(parsedPartyMix) || parsedPartyMix < 0 || parsedPartyMix > 10) {
            await interaction.reply({
                embeds: [
                    {
                        title: '🛠 Oups, votre nombre de couverts est invalide !',
                        description: 'Le nombre de personnes que vous avez renseigné est invalide, je n\'ai pas pu le comprendre. Veuillez réessayer en respectant le format indiqué dans le formulaire.',
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

        const restaurant = await fetchRestaurantById(restaurantId);

        const parsedDate = rawDate.split('/').reverse().join('-');
        let availabilities: RestaurantAvailabilities[] = [];
        try {
            availabilities = await fetchRestaurantAvailabilities(parsedDate, restaurantId, parsedPartyMix);
        } catch (e) {
            console.log(e);
            console.log(e.data);
        }

        const selectMenu = new SelectMenuBuilder()
            .setCustomId('validateNotification')
            .setPlaceholder('Sélectionnez une période de repas')
            .setOptions([
                {
                    label: 'Petit-déjeuner',
                    value: 'breakfast',
                    emoji: '🥐',
                },
                {
                    label: 'Déjeuner',
                    value: 'lunch',
                    emoji: '🍔',
                },
                {
                    label: 'Dîner',
                    value: 'dinner',
                    emoji: '🍝',
                },
            ])

        if (availabilities.length === 0) {
            selectMenu.options.forEach(option => {
                option.setDescription('Nous ne savons pas encore si ce restaurant proposera ce service à cette date. 🤔');
            })
        } else {
            selectMenu.options.forEach(option => {
                option.setDescription('Ce restaurant ne propose pas ce service à cette date. ❌');
            })
            availabilities.forEach((availability) => {
                availability.mealPeriods.forEach((mealPeriod) => {
                    switch (mealPeriod.mealPeriod) {
                        case 'Breakfast':
                            selectMenu.options[0].setDescription('Le restaurant propose ce service à cette date. ✅');
                            break;
                        case 'Lunch':
                            selectMenu.options[1].setDescription('Le restaurant propose ce service à cette date. ✅');
                            break;
                        case 'Dinner':
                            selectMenu.options[2].setDescription('Le restaurant propose ce service à cette date. ✅');
                            break;
                    }
                })
            })
        }

        const componentRow = new ActionRowBuilder<SelectMenuBuilder>()
            .addComponents(selectMenu);

        await interaction.followUp({
            embeds: [
                {
                    title: 'Sélectionnez une période de repas 🍽️',
                    description: `Super, c'est tout bon. Il ne me reste plus qu'à vous demander quelle période de repas vous souhaiteriez réserver.`,
                    color: Colors.Navy,
                    image: {
                        url: restaurant.imageUrl,
                    },
                    fields: [
                        {
                            name: 'Restaurant',
                            value: restaurant.name,
                        },
                        {
                            name: 'Date de visite',
                            value: rawDate,
                        },
                        {
                            name: 'Nombre de couverts',
                            value: rawPartyMix,
                        }
                    ]
                }
            ],
            components: [componentRow],
            ephemeral: true,
        });
    }

    public parse(interaction: ButtonInteraction) {
        if (!(interaction.customId.startsWith('chooseMealPeriod-'))) return this.none();
        const restaurantId = interaction.customId.split('-')[1];
        return this.some(restaurantId);
    }
}
