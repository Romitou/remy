import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import { ActionRowBuilder, ButtonInteraction, Colors, SelectMenuBuilder, SelectMenuInteraction } from 'discord.js';
import { Restaurant } from '../typings/restaurants';
import { fetchRestaurantByDisneyId } from '../core/restaurants';

export class ChooseRestaurant extends InteractionHandler {
    public constructor(ctx) {
        super(ctx, { interactionHandlerType: InteractionHandlerTypes.SelectMenu });
    }

    public async run(interaction: SelectMenuInteraction) {
        // const restaurantDisneyId = interaction.values[0];
        // const restaurant = await fetchRestaurantByDisneyId(restaurantDisneyId);
        //
        // const componentRow = new ActionRowBuilder<SelectMenuBuilder>()
        //     .addComponents(
        //         new SelectMenuBuilder()
        //             .setCustomId('chooseDateAndPartyMix')
        //             .setPlaceholder('Sélectionnez une période de repas')
        //             .setOptions([
        //                 {
        //                     label: 'Déjeuner',
        //                     value: 'lunch',
        //                 },
        //                 {
        //                     label: 'Dîner',
        //                     value: 'dinner',
        //                 },
        //                 {
        //                     label: 'Petit-déjeuner',
        //                     value: 'breakfast',
        //                 }
        //             ])
        //     );
        //
        // await interaction.update({
        //     embeds: [
        //         {
        //             title: 'Sélectionnez une période de repas 🍽️',
        //             description: `Vous avez décidé de manger au restaurant **${restaurant.name}** ? Quel bon choix ! Souhaiteriez-vous y manger au petit-déjeuner, au déjeuner ou au dîner ?`,
        //             color: Colors.Navy,
        //             image: {
        //                 url: restaurant.imageUrl,
        //             },
        //             fields: [
        //                 {
        //                     name: 'Restaurant',
        //                     value: restaurant.name,
        //                 }
        //             ]
        //         }
        //     ],
        //     components: [componentRow],
        // });
    }

    public parse(interaction: ButtonInteraction) {
        if (!(interaction.customId === 'chooseRestaurant')) return this.none();
        return this.some();
    }
}
