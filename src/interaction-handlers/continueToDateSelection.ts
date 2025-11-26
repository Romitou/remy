import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import {
  ButtonInteraction,
  ActionRowBuilder,
  ModalActionRowComponentBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import { handleInteractionError } from '../lib/errorHandler';
import { getLogger } from '../config/logger';
import { EMOJIS, LIMITS, MESSAGES } from '../constants';
import { getCachedRestaurantSelection } from '../lib/restaurantSelection';
import { COLORS } from '../constants';

const logger = getLogger();

export class ContinueToDateSelection extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext) {
    super(ctx, { interactionHandlerType: InteractionHandlerTypes.Button });
  }

  public async run(interaction: ButtonInteraction): Promise<void> {
    try {
      // Get selected restaurants from cache
      const selectedRestaurantIds = await getCachedRestaurantSelection(interaction.user.id);

      if (selectedRestaurantIds.length === 0) {
        await interaction.reply({
          embeds: [
            {
              title: MESSAGES.ERROR.NO_RESTAURANTS_SELECTED.TITLE,
              description: MESSAGES.ERROR.NO_RESTAURANTS_SELECTED.DESCRIPTION,
              color: COLORS.WARNING,
              thumbnail: {
                url: 'https://emojicdn.elk.sh/⚠️?style=google',
              },
            },
          ],
          ephemeral: true,
        });
        return;
      }

      // Create modal for date and party size
      const modal = new ModalBuilder()
        .setTitle(`${EMOJIS.SPARKLES} Détails de votre visite`)
        .setCustomId(`chooseMealPeriod-${selectedRestaurantIds.join(',')}`);

      const dateInput = new TextInputBuilder()
        .setCustomId('date')
        .setLabel(`${EMOJIS.CALENDAR} Date de votre visite`)
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('JJ/MM/AAAA (exemple : 24/12/2025)')
        .setMinLength(LIMITS.DATE_MIN_LENGTH)
        .setMaxLength(LIMITS.DATE_MAX_LENGTH)
        .setRequired(true);

      const partySizeInput = new TextInputBuilder()
        .setCustomId('partyMix')
        .setLabel(`${EMOJIS.PARTY} Nombre de convives (${LIMITS.PARTY_MIN}-${LIMITS.PARTY_MAX})`)
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('Exemple : 4')
        .setMinLength(LIMITS.PARTY_INPUT_MIN_LENGTH)
        .setMaxLength(LIMITS.PARTY_INPUT_MAX_LENGTH)
        .setRequired(true);

      const dateRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(dateInput);
      const partySizeRow =
        new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(partySizeInput);

      modal.addComponents(dateRow, partySizeRow);
      await interaction.showModal(modal);

      logger.info(
        {
          userId: interaction.user.id,
          restaurantCount: selectedRestaurantIds.length,
          restaurantIds: selectedRestaurantIds,
        },
        'User opening date/party selection modal',
      );
    } catch (error) {
      await handleInteractionError(interaction, error, {
        customId: interaction.customId,
      });
    }
  }

  public parse(interaction: ButtonInteraction) {
    if (interaction.customId === 'continueToDateSelection') {
      return this.some();
    }
    return this.none();
  }
}

