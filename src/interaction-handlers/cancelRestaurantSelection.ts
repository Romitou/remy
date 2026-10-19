import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ButtonInteraction } from 'discord.js';
import { handleInteractionError } from '../lib/errorHandler';
import { getLogger } from '../config/logger';
import { COLORS, EMOJIS } from '../constants';
import { clearCachedRestaurantSelection } from '../lib/restaurantSelection';

const logger = getLogger();

export class CancelRestaurantSelection extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext) {
    super(ctx, { interactionHandlerType: InteractionHandlerTypes.Button });
  }

  public async run(interaction: ButtonInteraction): Promise<void> {
    try {
      // Clear the cached selection
      await clearCachedRestaurantSelection(interaction.user.id);

      await interaction.update({
        embeds: [
          {
            title: `${EMOJIS.SUCCESS} Sélection annulée`,
            description:
              'Vous avez annulé la création de notification.\n\n💡 **Vous pouvez recommencer à tout moment** en cliquant sur le bouton "*Créer une alerte*".',
            color: COLORS.INFO,
            thumbnail: {
              url: 'https://emojicdn.elk.sh/👋?style=google',
            },
          },
        ],
        components: [],
      });

      logger.info(
        {
          userId: interaction.user.id,
        },
        'User cancelled restaurant selection',
      );
    } catch (error) {
      await handleInteractionError(interaction, error, {
        customId: interaction.customId,
      });
    }
  }

  public parse(interaction: ButtonInteraction) {
    if (interaction.customId === 'cancelRestaurantSelection') {
      return this.some();
    }
    return this.none();
  }
}
