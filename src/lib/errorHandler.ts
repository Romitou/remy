import { captureException } from '@sentry/node';
import { EmbedBuilder, Interaction } from 'discord.js';
import { getLogger } from '../config/logger';
import { COLORS, IMAGES, MESSAGES } from '../constants';

const logger = getLogger();

export interface ErrorContext {
  userId?: string;
  guildId?: string;
  commandName?: string;
  customId?: string;
  [key: string]: unknown;
}

/**
 * Handle errors in interaction handlers
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

  const errorEmbed = new EmbedBuilder()
    .setTitle(MESSAGES.ERROR.GENERIC.TITLE)
    .setDescription(MESSAGES.ERROR.GENERIC.DESCRIPTION)
    .setColor(COLORS.ERROR)
    .setImage(IMAGES.ERROR)
    .setTimestamp();

  try {
    if (interaction.isRepliable()) {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [errorEmbed], ephemeral: true });
      } else {
        await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
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
