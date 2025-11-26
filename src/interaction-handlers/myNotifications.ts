import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import {
    ActionRowBuilder,
    ButtonInteraction,
    EmbedBuilder,
    SelectMenuBuilder,
    StringSelectMenuBuilder
} from 'discord.js';
import { fetchActiveBookAlertsForUser } from '../core/bookAlerts';
import { RestaurantAlert } from '../typings/bookAlerts';
import { frenchMealPeriod, normalizeDate } from '../core/utils';
import { captureException } from '@sentry/node';
import { fetchRestaurantById } from '../core/restaurants';
import { COLORS, EMOJIS, MESSAGES } from '../constants';


export class MyNotifications extends InteractionHandler {
    public constructor(ctx: InteractionHandler.LoaderContext) {
        super(ctx, { interactionHandlerType: InteractionHandlerTypes.Button });
    }

    public async run(interaction: ButtonInteraction) {
        let bookAlerts: RestaurantAlert[];
        try {
            bookAlerts = await fetchActiveBookAlertsForUser(String(interaction.user.id));
        } catch (e) {
            console.error(e);
            captureException(e);
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

        const embed = new EmbedBuilder()
            .setTitle(`${EMOJIS.BELL} Vos notifications actives`)
            .setColor(COLORS.PRIMARY);

        if (bookAlerts.length === 0) {
            embed.setDescription(`${EMOJIS.SPARKLES} **Aucune notification active pour le moment**\n\nVous n'avez pas encore créé de notification de disponibilité.\n\n💡 **Pour commencer :**\nCliquez sur le bouton "*Enregistrer une notification*" dans le message épinglé du salon pour créer votre première alerte !`)
            embed.setThumbnail('https://emojicdn.elk.sh/🔕?style=google');
            await interaction.reply({
                embeds: [embed],
                ephemeral: true,
            });
            return;
        } else {
            embed.setDescription(`Vous avez **${bookAlerts.length}** notification(s) active(s).\n\n${EMOJIS.TRASH} Pour supprimer une notification, sélectionnez-la dans le menu ci-dessous.`);
            embed.setThumbnail('https://emojicdn.elk.sh/🔔?style=google');

            for (const bookAlert of bookAlerts) {
                const restaurant = await fetchRestaurantById(bookAlert.checks[0].restaurantId);
                if (restaurant) {
                    const emoji = bookAlert.mealPeriod === 'BREAKFAST' ? EMOJIS.BREAKFAST :
                                  bookAlert.mealPeriod === 'LUNCH' ? EMOJIS.LUNCH : EMOJIS.DINNER;

                    embed.addFields({
                        name: `${emoji} Notification #${bookAlert.id}`,
                        value: `**Date :** ${normalizeDate(bookAlert.date)}\n**Restaurant :** ${restaurant.name}\n**Couverts :** ${bookAlert.partyMix} personne(s)\n**Période :** ${frenchMealPeriod(bookAlert.mealPeriod)}`,
                        inline: true,
                    });
                }
            }

            embed.setFooter({
                text: `Total : ${bookAlerts.length} notification(s)`,
                // sparkles emoji
                iconURL: 'https://emojicdn.elk.sh/✨?style=google',
            });
        }

        const menuBuilder =  new StringSelectMenuBuilder()
          .setCustomId('viewNotification')
          .setPlaceholder(`${EMOJIS.TRASH} Sélectionnez une notification à gérer`);

        for (const bookAlert of bookAlerts) {
            const restaurant = await fetchRestaurantById(bookAlert.checks[0].restaurantId);
            if (restaurant) {
                const emoji = bookAlert.mealPeriod === 'BREAKFAST' ? EMOJIS.BREAKFAST :
                              bookAlert.mealPeriod === 'LUNCH' ? EMOJIS.LUNCH : EMOJIS.DINNER;

                menuBuilder.addOptions(
                    {
                        label: `#${bookAlert.id} - ${restaurant.name}`,
                        description: `${normalizeDate(bookAlert.date)} • ${frenchMealPeriod(bookAlert.mealPeriod)} • ${bookAlert.partyMix} pers.`,
                        value: String(bookAlert.id),
                        emoji: emoji,
                    }
                );
            }
        }

        const componentRow = new ActionRowBuilder<SelectMenuBuilder>()
            .addComponents(menuBuilder);

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
