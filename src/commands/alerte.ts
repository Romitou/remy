import { Command } from '@sapphire/framework';
import { InteractionContextType } from 'discord.js';
import { fetchRestaurantById, fetchSelectableRestaurants } from '../core/restaurants';
import { getAlertDraft } from '../lib/alertDraft';
import { handleInteractionError } from '../lib/errorHandler';
import { searchRestaurants } from '../lib/restaurantSearch';
import { showView } from '../lib/respond';
import { alertFormModal, restaurantPickerView } from '../lib/views';
import { parsePositiveInt } from '../lib/customId';
import { getLogger } from '../config/logger';

const logger = getLogger();

/**
 * /alerte [restaurant]: create an alert, directly from a restaurant picked by autocompletion
 */
export class AlerteCommand extends Command {
  public constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, { ...options, name: 'alerte' });
  }

  public override registerApplicationCommands(registry: Command.Registry) {
    registry.registerChatInputCommand((builder) =>
      builder
        .setName('alerte')
        .setDescription("Être prévenu dès qu'une table se libère dans un restaurant")
        .setContexts(InteractionContextType.Guild, InteractionContextType.BotDM)
        .addStringOption((option) =>
          option
            .setName('restaurant')
            .setDescription('Le restaurant à surveiller (tapez pour rechercher)')
            .setAutocomplete(true)
            .setRequired(false),
        ),
    );
  }

  public override async chatInputRun(interaction: Command.ChatInputCommandInteraction) {
    try {
      const value = interaction.options.getString('restaurant')?.trim();
      if (!value) {
        await showView(interaction, restaurantPickerView(await fetchSelectableRestaurants()));
        return;
      }

      // An autocompleted value is an id; free text is searched by name
      const restaurantId = parsePositiveInt(value);
      let restaurant = restaurantId ? await fetchRestaurantById(restaurantId) : undefined;
      let matches = restaurant ? [restaurant] : [];
      if (!restaurant) {
        matches = searchRestaurants(await fetchSelectableRestaurants(), value);
        restaurant = matches.length === 1 ? matches[0] : undefined;
      }

      if (!restaurant) {
        await showView(interaction, restaurantPickerView(matches, { query: value }));
        return;
      }

      const draft = await getAlertDraft(interaction.user.id);
      await interaction.showModal(alertFormModal(restaurant, draft));
    } catch (error) {
      await handleInteractionError(interaction, error, { commandName: this.name });
    }
  }

  public override async autocompleteRun(interaction: Command.AutocompleteInteraction) {
    try {
      const query = interaction.options.getFocused();
      const restaurants = await fetchSelectableRestaurants();
      const matches = query ? searchRestaurants(restaurants, query) : restaurants;
      await interaction.respond(
        matches.slice(0, 25).map((restaurant) => ({
          name: restaurant.name.slice(0, 100),
          value: String(restaurant.id),
        })),
      );
    } catch (error) {
      logger.warn({ error }, 'Failed to autocomplete restaurants');
    }
  }
}
