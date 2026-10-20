import { captureException } from '@sentry/node';
import { Interaction, MessageFlags } from 'discord.js';
import { getLogger } from '../config/logger';
import { errorView } from './views';

const logger = getLogger();

export interface ErrorContext {
  userId?: string;
  guildId?: string;
  commandName?: string;
  customId?: string;
  [key: string]: unknown;
}

/**
 * Handle errors in interaction handlers and commands
 */
export async function handleInteractionError(
  interaction: Interaction,
  error: unknown,
  context?: ErrorContext,
): Promise<void> {
  logger.error(
    {
      error,
      userId: interaction.user?.id,
      guildId: interaction.guildId,
      ...context,
    },
    'Error in interaction handler',
  );

  captureException(error, {
    tags: {
      interactionType: interaction.type,
      userId: interaction.user?.id,
      guildId: interaction.guildId,
    },
    extra: context,
  });

  try {
    if (interaction.isRepliable()) {
      const view = errorView();
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ ...view, flags: MessageFlags.Ephemeral });
      } else {
        await interaction.reply({ ...view, flags: MessageFlags.Ephemeral });
      }
    }
  } catch (replyError) {
    logger.error({ error: replyError }, 'Failed to send error message to user');
  }
}

/**
 * Handle errors in scheduled tasks
 */
export function handleTaskError(taskName: string, error: unknown, context?: ErrorContext): void {
  logger.error({ error, taskName, ...context }, `Error in scheduled task: ${taskName}`);

  captureException(error, {
    tags: {
      taskName,
    },
    extra: context,
  });
}
