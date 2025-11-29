import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ButtonInteraction, EmbedBuilder } from 'discord.js';
import { completeBookAlert, fetchBookAlertById } from '../core/bookAlerts';
import { RestaurantAlert } from '../typings/bookAlerts';
import { frenchMealPeriod, normalizeDate } from '../core/utils';
import Sentry from '@sentry/node';
import { fetchRestaurantById } from '../core/restaurants';
import { COLORS, EMOJIS, MESSAGES } from '../constants';

export class DeleteNotification extends InteractionHandler {
    public constructor(ctx: InteractionHandler.LoaderContext) {
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

        try {
            await completeBookAlert(bookAlert.id);
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

        const restaurant = await fetchRestaurantById(bookAlert.checks[0].restaurantId);
        if (restaurant) {
            const emoji = bookAlert.mealPeriod === 'BREAKFAST' ? EMOJIS.BREAKFAST :
                          bookAlert.mealPeriod === 'LUNCH' ? EMOJIS.LUNCH : EMOJIS.DINNER;

            const embed = new EmbedBuilder()
                .setTitle(`${EMOJIS.SUCCESS} Notification supprimée avec succès`)
                .setDescription(`${EMOJIS.SPARKLES} **La notification #${bookAlert.id} a été supprimée.**\nVous ne recevrez plus d'alertes pour cette réservation.\n\n💡 **Astuce :** Vous pouvez créer une nouvelle notification à tout moment via le bouton "*Enregistrer une notification*".\n`)
                .setColor(COLORS.SUCCESS)
                .setThumbnail('https://emojicdn.elk.sh/✅?style=google')
                .setFields([
                    {
                        name: `${emoji} Détails de la notification supprimée`,
                        value: `**Restaurant :** ${restaurant.name}\n**Date :** ${normalizeDate(bookAlert.date)}\n**Période :** ${frenchMealPeriod(bookAlert.mealPeriod)}\n**Couverts :** ${bookAlert.partyMix} personne(s)`,
                        inline: false,
                    }
                ])
                .setFooter({
                    text: 'Supprimée à l\'instant',
                    iconURL: 'https://emojicdn.elk.sh/✨?style=google',
                })
                .setTimestamp();

            await interaction.update({
                embeds: [embed],
                components: [],
            });
        }
    }

    public parse(interaction: ButtonInteraction) {
        if (!(interaction.customId.startsWith('deleteNotification-'))) return this.none();
        const notificationId = interaction.customId.split('-')[1];
        return this.some(notificationId);
    }
}
