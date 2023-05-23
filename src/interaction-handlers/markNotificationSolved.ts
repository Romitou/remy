import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ButtonInteraction, Colors, EmbedBuilder, TextChannel } from 'discord.js';
import { completeBookAlert } from '../core/bookAlerts';
import Sentry from '@sentry/node';

export class MarkNotificationSolved extends InteractionHandler {
    public constructor(ctx) {
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

        const embed = interaction.message.embeds[0];
        const newEmbed = new EmbedBuilder(embed);

        newEmbed.setColor(Colors.DarkGreen)
            .setFooter({
                text: 'Cette notification a été marquée comme réservée. ✅',
            });

        const channel = await interaction.client.channels.fetch(interaction.channelId);
        const message = await (channel as TextChannel).messages.fetch(interaction.message.id);
        await message.edit({
            embeds: [newEmbed],
            components: [],
        })

        await interaction.reply({
            embeds: [
                {
                    title: 'Mon travail est terminé pour cette notification !',
                    description: `Cette notification a été marquée comme réservée et aucune nouvelle notification à propos de cette notification ne vous sera envoyée. Si vous avez apprécié ce service ou si vous avez quelconque commentaire à nous faire part, n'hésitez pas à faire un tour dans le salon <#${process.env.FEEDBACK_CHANNEL_ID}> !`,
                    color: Colors.DarkGreen,
                }
            ]
        })
    }

    public parse(interaction: ButtonInteraction) {
        if (!(interaction.customId.startsWith('markNotificationSolved-'))) return this.none();
        const notificationId = interaction.customId.split('-')[1];
        return this.some(notificationId);
    }
}
