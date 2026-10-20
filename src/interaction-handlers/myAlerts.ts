import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ButtonInteraction } from 'discord.js';
import { loadAlertListView } from '../lib/alertList';
import { handleInteractionError } from '../lib/errorHandler';
import { deferView } from '../lib/respond';
import { CUSTOM_IDS } from '../lib/customId';

/**
 * "Mes alertes" buttons: list of the active alerts of the user
 */
export class MyAlerts extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext) {
    super(ctx, { interactionHandlerType: InteractionHandlerTypes.Button });
  }

  public async run(interaction: ButtonInteraction) {
    try {
      await deferView(interaction);
      await interaction.editReply(await loadAlertListView(interaction.user.id));
    } catch (error) {
      await handleInteractionError(interaction, error, { customId: interaction.customId });
    }
  }

  public parse(interaction: ButtonInteraction) {
    const { customId } = interaction;
    if (customId !== CUSTOM_IDS.MY_ALERTS && customId !== CUSTOM_IDS.MY_ALERTS_LEGACY) {
      return this.none();
    }
    return this.some();
  }
}
