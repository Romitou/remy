import {
  ChatInputCommandInteraction,
  MessageComponentInteraction,
  MessageFlags,
  ModalSubmitInteraction,
} from 'discord.js';
import { View } from './views';

export type ViewInteraction =
  | MessageComponentInteraction
  | ModalSubmitInteraction
  | ChatInputCommandInteraction;

/**
 * Acknowledge an interaction before a potentially slow operation. Interactions coming from an
 * ephemeral message of the bot will replace it, so that each flow keeps a single message;
 * others (onboarding message, commands) get a new ephemeral message.
 */
export async function deferView(interaction: ViewInteraction): Promise<void> {
  if (interaction.deferred || interaction.replied) {
    return;
  }

  if (interaction.isMessageComponent() && interaction.message.flags.has(MessageFlags.Ephemeral)) {
    await interaction.deferUpdate();
  } else if (
    interaction.isModalSubmit() &&
    interaction.isFromMessage() &&
    interaction.message.flags.has(MessageFlags.Ephemeral)
  ) {
    await interaction.deferUpdate();
  } else {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  }
}

/**
 * Show a view in response to an interaction, deferring it first if needed
 */
export async function showView(interaction: ViewInteraction, view: View): Promise<void> {
  await deferView(interaction);
  await interaction.editReply(view);
}
