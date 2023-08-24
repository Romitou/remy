import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import {
    ActionRowBuilder,
    ButtonInteraction,
    Colors,
    ModalSubmitInteraction,
    SelectMenuBuilder
} from 'discord.js';
import { Restaurant, RestaurantAvailabilities } from '../typings/restaurants';
import { fetchRestaurantAvailabilities, fetchRestaurantByDisneyId, fetchRestaurantById } from '../core/restaurants';
import moment from 'moment';

moment.locale('fr');

const breakfast = {
    label: 'Petit-déjeuner',
    value: 'BREAKFAST',
    emoji: '🥐',
};

const lunch = {
    label: 'Déjeuner',
    value: 'LUNCH',
    emoji: '🍔',
};

const dinner = {
    label: 'Dîner',
    value: 'DINNER',
    emoji: '🍝',
}

export class ChooseMealPeriod extends InteractionHandler {
    public constructor(ctx) {
        super(ctx, { interactionHandlerType: InteractionHandlerTypes.ModalSubmit });
    }

    public async run(interaction: ModalSubmitInteraction, restaurantId: number) {
        await interaction.deferReply({ ephemeral: true });

        const rawDate = interaction.fields.getTextInputValue('date');
        let isValidDate = /^[0-9]{2}\/[0-9]{2}\/[0-9]{4}$/.test(rawDate);
        if (isValidDate) {
            const [day, month, year] = rawDate.split('/').map((value) => parseInt(value));
            if (new Date().setFullYear(year, month-1, day) < Date.now()) {
                isValidDate = false;
            }
        }

        if (isValidDate) {
            const date = moment(rawDate, 'DD/MM/YYYY');
            isValidDate = date.isValid();
        }

        if (!isValidDate) {
            await interaction.followUp({
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
        if (isNaN(parsedPartyMix) || parsedPartyMix < 1 || parsedPartyMix > 10) {
            await interaction.followUp({
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
            if (e.response.status >= 500) {
                await interaction.followUp({
                    embeds: [
                        {
                            title: '🛠 Oups, une erreur est survenue !',
                            description: 'Les serveurs de Disney ont rencontré une erreur, je n\'ai pas pu récupérer les disponibilités pour ce restaurant. Je vous invite à réessayer d\'ici quelques minutes.',
                            color: Colors.Orange,
                            image: {
                                url: 'https://s3-01.romitou.fr/disneytables/error.png'
                            }
                        }
                    ],
                })
            }
            return;
        }

        const selectMenu = new SelectMenuBuilder()
            .setCustomId('validateNotification')
            .setPlaceholder('Sélectionnez une période de repas');

        const embed = {
            title: 'Sélectionnez une période de repas 🍽️',
            description: `Super, c'est tout bon pour moi ! Il ne vous reste plus qu'à sélectionner le type de repas que vous désirez, et votre notification sera enregistrée. `,
            color: Colors.Navy,
            image: {
                url: restaurant.imageUrl,
            },
            fields: [
                {
                    name: 'Restaurant',
                    value: restaurant.name,
                    inline: true,
                },
                {
                    name: 'Date de visite',
                    value: rawDate,
                    inline: true,
                },
                {
                    name: 'Nombre de couverts',
                    value: rawPartyMix,
                    inline: true,
                }
            ]
        }

        if (availabilities.length === 0) {
            selectMenu.setOptions([breakfast, lunch, dinner])
            embed.description += `\n\n⚠️ Attention, les créneaux et services de ce restaurant **n'ont pas été encore publiés**. Merci de vérifier que le restaurant *${restaurant.name}* sera ouvert et proposera le type de service que vous sélectionnerez.`;
        } else {
            embed.description += `\n\nVoici les créneaux actuellement publiés pour ce restaurant :`;
            availabilities.forEach((availability) => {
                availability.mealPeriods.forEach((mealPeriod) => {
                    switch (mealPeriod.mealPeriod) {
                        case 'Breakfast':
                            selectMenu.addOptions([breakfast]);
                            embed.description += `\n▫️ Petit-déjeuner *(${mealPeriod.slotList.length} créneaux)*`;
                            break;
                        case 'Lunch':
                            selectMenu.addOptions([lunch]);
                            embed.description += `\n▫️ Déjeuner *(${mealPeriod.slotList.length} créneaux)*`;
                            break;
                        case 'Dinner':
                            selectMenu.addOptions([dinner]);
                            embed.description += `\n▫️ Dîner *(${mealPeriod.slotList.length} créneaux)*`;
                            break;
                    }
                })
            })
        }

        const componentRow = new ActionRowBuilder<SelectMenuBuilder>()
            .addComponents(selectMenu);

        await interaction.followUp({
            embeds: [embed],
            components: [componentRow],
            ephemeral: true,
        });
    }

    public parse(interaction: ButtonInteraction) {
        if (!(interaction.customId.startsWith('chooseMealPeriod-'))) return this.none();
        const restaurantId = interaction.customId.split('-')[1];
        const parsedInt = parseInt(restaurantId);
        return this.some(parsedInt);
    }
}
