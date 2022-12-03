import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import {
    ActionRowBuilder,
    ButtonInteraction,
    ModalActionRowComponentBuilder,
    ModalBuilder,
    SelectMenuInteraction,
    TextInputBuilder,
    TextInputStyle
} from 'discord.js';

export class ChooseDateAndPartyMix extends InteractionHandler {
    public constructor(ctx) {
        super(ctx, { interactionHandlerType: InteractionHandlerTypes.SelectMenu });
    }

    public async run(interaction: SelectMenuInteraction) {
        const restaurantDisneyId = interaction.values[0];

        const modal = new ModalBuilder()
            .setTitle('Indiquez votre date et vos couverts')
            .setCustomId('chooseMealPeriod-' + restaurantDisneyId)

        const dateInput = new TextInputBuilder()
            .setCustomId('date')
            .setLabel('Date de votre visite (JJ/MM/AAAA) 📅')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('24/12/2023')
            .setMinLength(10)
            .setMaxLength(10);

        const partySizeInput = new TextInputBuilder()
            .setCustomId('partyMix')
            .setLabel('Nombre de couverts (1 à 10) 👪')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('2')
            .setMinLength(1)
            .setMaxLength(2);

        const dateRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(dateInput);
        const partySizeRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(partySizeInput);

        modal.addComponents(dateRow, partySizeRow);
        await interaction.showModal(modal);
    }

    public parse(interaction: ButtonInteraction) {
        if (!(interaction.customId === 'chooseDateAndPartyMix')) return this.none();
        return this.some();
    }
}
