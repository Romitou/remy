import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ButtonInteraction, SelectMenuInteraction } from 'discord.js';
import { createBookAlert } from '../core/bookAlerts';
import { getNotificationDetails } from '../core/embeds';
import { RestaurantAlert } from '../typings/bookAlerts';
import Sentry from '@sentry/node';
import { fetchRestaurantById } from '../core/restaurants';
import { COLORS, EMOJIS, IMAGES, MESSAGES } from '../constants';

export class ValidateNotification extends InteractionHandler {
    public constructor(ctx: InteractionHandler.LoaderContext) {
        super(ctx, { interactionHandlerType: InteractionHandlerTypes.SelectMenu });
    }

    public async run(interaction: SelectMenuInteraction) {
        const mealPeriod = interaction.values[0];

        const notificationDetails = await getNotificationDetails(interaction.message.embeds[0]);
        if (!notificationDetails || !notificationDetails.date || !notificationDetails.restaurantId || !notificationDetails.partyMix) {
            return;
        }

        let bookAlert: RestaurantAlert;
        try {
            const parsedDate = notificationDetails.date.split('/').reverse().join('-');
            bookAlert = await createBookAlert(
                [notificationDetails.restaurantId],
                mealPeriod,
                parsedDate,
                notificationDetails.partyMix,
                String(interaction.user.id)
            );
        } catch (e) {
            console.error(e);
            Sentry.captureException(e);
            await interaction.reply({
                embeds: [
                    {
                        title: MESSAGES.ERROR.GENERIC.TITLE,
                        description: MESSAGES.ERROR.GENERIC.DESCRIPTION,
                        color: COLORS.ERROR,
                        thumbnail: {
                            url: 'https://emojicdn.elk.sh/💔?style=google',
                        },
                    }
                ],
                ephemeral: true,
            });
            return;
        }

        let eatingVerb;
        let mealPeriodFr;
        switch (bookAlert.mealPeriod) {
            case 'BREAKFAST':
                eatingVerb = 'prendre votre petit-déjeuner';
                mealPeriodFr = 'Petit-déjeuner';
                break;
            case 'LUNCH':
                eatingVerb = 'déjeuner';
                mealPeriodFr = 'Déjeuner';
                break;
            case 'DINNER':
                eatingVerb = 'dîner';
                mealPeriodFr = 'Dîner';
                break;
        }

        console.log(eatingVerb);

        const restaurant = await fetchRestaurantById(bookAlert.checks[0].restaurantId);
        if (restaurant) {
            const successMessage = MESSAGES.SUCCESS.NOTIFICATION_CREATED(
                restaurant.name,
                notificationDetails.date,
                notificationDetails.partyMix,
                mealPeriodFr
            );

            await interaction.update({
                embeds: [
                    {
                        title: successMessage.TITLE,
                        description: successMessage.DESCRIPTION,
                        color: COLORS.SUCCESS,
                        thumbnail: {
                            url: restaurant.imageUrl || IMAGES.DEFAULT_RESTAURANT,
                        },
                        fields: [
                            {
                                name: `${EMOJIS.RESTAURANT} Restaurant`,
                                value: `\`\`\`${restaurant.name}\`\`\``,
                                inline: false,
                            },
                            {
                                name: `${EMOJIS.CALENDAR} Date`,
                                value: `\`\`\`${notificationDetails.date}\`\`\``,
                                inline: true,
                            },
                            {
                                name: `${EMOJIS.PARTY} Couverts`,
                                value: `\`\`\`${notificationDetails.partyMix} personne(s)\`\`\``,
                                inline: true,
                            },
                            {
                                name: `${EMOJIS.BELL} Période`,
                                value: `\`\`\`${mealPeriodFr}\`\`\``,
                                inline: true,
                            },
                        ],
                        footer: {
                            text: `ID de notification : #${bookAlert.id} • Créée à l'instant`,
                            icon_url: 'https://emojicdn.elk.sh/✅?style=google',
                        },
                        timestamp: new Date().toISOString(),
                    }
                ],
                components: []
            });
        }
    }

    public parse(interaction: ButtonInteraction) {
        if (!(interaction.customId === 'validateNotification')) return this.none();
        return this.some();
    }
}
