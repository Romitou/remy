import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ButtonInteraction } from 'discord.js';

/**
 * This handler is now handled by selectRestaurants.ts
 * It's kept for backward compatibility but doesn't do anything special
 * The selectRestaurants handler will intercept the 'startAlertBook' customId
 */
export class StartAlertBook extends InteractionHandler {
    public constructor(ctx: InteractionHandler.LoaderContext) {
        super(ctx, { interactionHandlerType: InteractionHandlerTypes.Button });
    }

    public async run(_interaction: ButtonInteraction) {
        // This is now handled by selectRestaurants.ts
        // This handler will never be reached because selectRestaurants has priority
    }

    public parse(interaction: ButtonInteraction) {
        // Let selectRestaurants handle this
        if (interaction.customId === 'startAlertBook') return this.none();
        return this.none();
    }
}
