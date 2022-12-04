import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ButtonInteraction, Colors, EmbedBuilder } from 'discord.js';
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

        await interaction.update({
            embeds: [newEmbed],
            components: [],
        });

    }

    public parse(interaction: ButtonInteraction) {
        if (!(interaction.customId.startsWith('markNotificationSolved-'))) return this.none();
        const notificationId = interaction.customId.split('-')[1];
        return this.some(notificationId);
    }
}
