import { Command } from '@sapphire/framework';
import { InteractionContextType } from 'discord.js';
import { loadAlertListView } from '../lib/alertList';
import { handleInteractionError } from '../lib/errorHandler';
import { deferView } from '../lib/respond';

/**
 * /mes-alertes: list, edit and delete the active alerts
 */
export class MesAlertesCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, { ...options, name: 'mes-alertes' });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('mes-alertes')
        .setDescription('Voir, modifier ou supprimer vos alertes')
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM),
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    try {
      await deferView(interaction);
      await interaction.editReply(await loadAlertListView(interaction.user.id));
    } catch (error) {
      await handleInteractionError(interaction, error, { commandName: this.name });
    }
  }
}
