import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ButtonInteraction, ModalSubmitInteraction, StringSelectMenuInteraction } from 'discord.js';
import { handleInteractionError } from '../lib/errorHandler';
import { showView } from '../lib/respond';
import { expiredView } from '../lib/views';
import { customIdPrefix } from '../lib/customId';

/**
 * customId prefixes of the components sent by previous versions of the bot. Without these
 * handlers, using an old ephemeral message would fail with "This interaction failed".
 */
const LEGACY_PREFIXES = new Set([
  'selectRestaurants',
  'toggleRestaurantSelection',
  'continueToDateSelection',
  'cancelRestaurantSelection',
  'chooseMealPeriod',
  'confirmNotification',
  'validateNotification',
  'viewNotification',
  'deleteNotification',
  'chooseDateAndPartyMix',
  'chooseRestaurant',
]);

type LegacyInteraction = ButtonInteraction | StringSelectMenuInteraction | ModalSubmitInteraction;

async function showExpired(interaction: LegacyInteraction): Promise<void> {
  try {
    await showView(interaction, expiredView());
  } catch (error) {
    await handleInteractionError(interaction, error, { customId: interaction.customId });
  }
}

function isLegacy(interaction: LegacyInteraction): boolean {
  return LEGACY_PREFIXES.has(customIdPrefix(interaction.customId));
}

export class LegacyButtons extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext) {
    super(ctx, { name: 'legacyButtons', interactionHandlerType: InteractionHandlerTypes.Button });
  }

  public async run(interaction: ButtonInteraction) {
    await showExpired(interaction);
  }

  public parse(interaction: ButtonInteraction) {
    return isLegacy(interaction) ? this.some() : this.none();
  }
}

export class LegacySelectMenus extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext) {
    super(ctx, {
      name: 'legacySelectMenus',
      interactionHandlerType: InteractionHandlerTypes.SelectMenu,
    });
  }

  public async run(interaction: StringSelectMenuInteraction) {
    await showExpired(interaction);
  }

  public parse(interaction: StringSelectMenuInteraction) {
    return isLegacy(interaction) ? this.some() : this.none();
  }
}

export class LegacyModals extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext) {
    super(ctx, {
      name: 'legacyModals',
      interactionHandlerType: InteractionHandlerTypes.ModalSubmit,
    });
  }

  public async run(interaction: ModalSubmitInteraction) {
    await showExpired(interaction);
  }

  public parse(interaction: ModalSubmitInteraction) {
    return isLegacy(interaction) ? this.some() : this.none();
  }
}
