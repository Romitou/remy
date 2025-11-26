import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ButtonInteraction, EmbedBuilder, TextChannel } from 'discord.js';
import { completeBookAlert } from '../core/bookAlerts';
import Sentry from '@sentry/node';
import { COLORS, EMOJIS, MESSAGES } from '../constants';

export class MarkNotificationSolved extends InteractionHandler {
    public constructor(ctx: InteractionHandler.LoaderContext) {
        super(ctx, { interactionHandlerType: InteractionHandlerTypes.Button });
    }

    public async run(interaction: ButtonInteraction, notificationId: string) {

        try {
            await completeBookAlert(parseInt(notificationId));
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

        const embed = interaction.message.embeds[0];
        const newEmbed = EmbedBuilder.from(embed);

        newEmbed.setColor(COLORS.SUCCESS)
            .setFooter({
                text: `${EMOJIS.SUCCESS} Réservation confirmée • Notification désactivée`,
                iconURL: 'https://emojicdn.elk.sh/✅?style=google',
            })
            .setTimestamp();

        const channel = await interaction.client.channels.fetch(interaction.channelId);
        const message = await (channel as TextChannel).messages.fetch(interaction.message.id);
        await message.edit({
            embeds: [newEmbed],
            components: [],
        })

        await interaction.reply({
            embeds: [
                {
                    title: `${EMOJIS.SUCCESS} Félicitations pour votre réservation !`,
                    description: `${EMOJIS.SPARKLES} **Parfait !** Cette notification a été marquée comme résolue.\n\nVous ne recevrez plus d'alertes pour cette réservation. Profitez bien de votre repas magique !\n\n💬 **Votre avis compte :** N'hésitez pas à partager votre expérience dans <#${process.env.FEEDBACK_CHANNEL_ID}> !`,
                    color: COLORS.SUCCESS,
                    thumbnail: {
                        url: 'https://emojicdn.elk.sh/🎉?style=google',
                    },
                    footer: {
                        text: 'Merci d\'utiliser Rémy !',
                        icon_url: 'https://emojicdn.elk.sh/✨?style=google',
                    }
                }
            ],
            ephemeral: true,
        })
    }

    public parse(interaction: ButtonInteraction) {
        if (!(interaction.customId.startsWith('markNotificationSolved-'))) return this.none();
        const notificationId = interaction.customId.split('-')[1];
        return this.some(notificationId);
    }
}
