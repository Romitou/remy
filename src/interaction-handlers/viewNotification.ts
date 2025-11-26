import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import {
    ActionRowBuilder,
    ButtonBuilder,
    ButtonInteraction,
    ButtonStyle,
    EmbedBuilder,
    SelectMenuInteraction
} from 'discord.js';
import { fetchBookAlertById } from '../core/bookAlerts';
import { RestaurantAlert } from '../typings/bookAlerts';
import { frenchMealPeriod, normalizeDate } from '../core/utils';
import Sentry from '@sentry/node';
import { fetchRestaurantById } from '../core/restaurants';
import { COLORS, EMOJIS, MESSAGES } from '../constants';

export class ViewNotification extends InteractionHandler {
    public constructor(ctx: InteractionHandler.LoaderContext) {
        super(ctx, { interactionHandlerType: InteractionHandlerTypes.SelectMenu });
    }

    public async run(interaction: SelectMenuInteraction) {
        const bookAlertId = interaction.values[0];
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

        const restaurant = await fetchRestaurantById(bookAlert.checks[0].restaurantId);
        const emoji = bookAlert.mealPeriod === 'BREAKFAST' ? EMOJIS.BREAKFAST :
                      bookAlert.mealPeriod === 'LUNCH' ? EMOJIS.LUNCH : EMOJIS.DINNER;

        const embed = new EmbedBuilder()
            .setTitle(`${emoji} Notification #${bookAlert.id}`)
            .setDescription(`${EMOJIS.WARNING} **Attention** : Vous êtes sur le point de supprimer cette notification. Après suppression, vous ne recevrez plus d'alertes pour les disponibilités correspondant à ces critères.\n`)
            .setColor(COLORS.PRIMARY);

        if (restaurant) {
            console.log(restaurant)
            embed.setThumbnail(restaurant.imageUrl || 'https://emojicdn.elk.sh/🍽️?style=google');
            embed.addFields([
                {
                    name: `${EMOJIS.RESTAURANT} Restaurant`,
                    value: restaurant.name,
                    inline: false
                },
                {
                    name: `${EMOJIS.CALENDAR} Date`,
                    value: normalizeDate(bookAlert.date),
                    inline: true
                },
                {
                    name: `🕐 Repas`,
                    value: frenchMealPeriod(bookAlert.mealPeriod),
                    inline: true
                },
                {
                    name: `${EMOJIS.PARTY} Couverts`,
                    value: `${bookAlert.partyMix} personne(s)`,
                    inline: true
                },
                // {
                //     name: '📊 Statut',
                //     value: `${statusEmoji} ${statusText}`,
                //     inline: true
                // },
                {
                    name: '⏰ Créée',
                    value: `<t:${Math.round(new Date(bookAlert.createdAt).valueOf() / 1000)}:R>`,
                    inline: true
                },
            ]);
            embed.setFooter({
                text: `Notification #${bookAlert.id} • Cette action est irréversible`,
                iconURL: 'https://emojicdn.elk.sh/✨?style=google',
            });
        }

        const componentRow = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`deleteNotification-${bookAlert.id}`)
                    .setEmoji(EMOJIS.TRASH)
                    .setLabel('Supprimer définitivement')
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
