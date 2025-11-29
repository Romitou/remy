import { captureException } from '@sentry/node';
import { Colors, EmbedBuilder, Interaction } from 'discord.js';
import { getLogger } from '../config/logger';

const logger = getLogger();

export interface ErrorContext {
  userId?: string;
  guildId?: string;
  commandName?: string;
  customId?: string;
  [key: string]: unknown;
}

/**
 * Get user-friendly error message based on error type
 */
function getUserFriendlyErrorMessage(error: unknown): {
  title: string;
  description: string;
} {
  // if (error instanceof ApiError) {
  //   return {
  //     title: '🌐 Erreur de connexion à l\'API',
  //     description:
  //       'Impossible de communiquer avec le service de réservation. Veuillez réessayer dans quelques instants.',
  //   };
  // }
  //
  // if (error instanceof ValidationError) {
  //   return {
  //     title: '⚠️ Données invalides',
  //     description:
  //       'Les informations fournies ne sont pas valides. Veuillez vérifier et réessayer.',
  //   };
  // }
  //
  // if (error instanceof RedisError) {
  //   return {
  //     title: '💾 Erreur de sauvegarde',
  //     description:
  //       'Une erreur s\'est produite lors de la sauvegarde de vos données. Veuillez réessayer.',
  //   };
  // }
  //
  // if (error instanceof BusinessError) {
  //   return {
  //     title: '❌ Opération impossible',
  //     description:
  //       (error as BusinessError).message ||
  //       'Cette opération ne peut pas être effectuée pour le moment. Veuillez réessayer plus tard.',
  //   };
  // }

    console.log(error);

  // Erreur générique
  return {
    title: '🛠 Oups, quelque chose est cassé !',
    description:
      "On dirait bien que quelque chose ne fonctionne pas comme prévu. Pas d'inquiétude, cet incident technique a été remonté et sera corrigé le plus vite possible. Nous vous invitons à réessayer ultérieurement.",
  };
}

/**
 * Handle errors in interaction handlers
 */
export async function handleInteractionError(
  interaction: Interaction,
  error: unknown,
  context?: ErrorContext,
): Promise<void> {
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const errorStack = error instanceof Error ? error.stack : undefined;

  // Log the error
  logger.error(
    {
      error: errorMessage,
      stack: errorStack,
      userId: interaction.user?.id,
      guildId: interaction.guildId,
      ...context,
    },
    'Error in interaction handler',
  );

  // Report to Sentry
  captureException(error, {
    tags: {
      interactionType: interaction.type,
      userId: interaction.user?.id,
      guildId: interaction.guildId,
    },
    extra: context,
  });

  // Send user-friendly error message
  const { title, description } = getUserFriendlyErrorMessage(error);
  const errorEmbed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(description)
    .setColor(Colors.Red)
    .setImage('https://s3-01.romitou.fr/disneytables/error.png')
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
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  const errorStack = error instanceof Error ? error.stack : undefined;

  logger.error(
    {
      error: errorMessage,
      stack: errorStack,
      taskName,
      ...context,
    },
    `Error in scheduled task: ${taskName}`,
  );

  captureException(error, {
    tags: {
      taskName,
    },
    extra: context,
  });
}

/**
 * Wrap async functions with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorHandler: (error: unknown, ...args: Parameters<T>) => void | Promise<void>,
): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      await errorHandler(error, ...args);
    }
  }) as T;
}

