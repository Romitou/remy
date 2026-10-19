import { InteractionHandler, InteractionHandlerTypes } from '@sapphire/framework';
import {
  ActionRowBuilder,
  ButtonInteraction,
  EmbedBuilder,
  StringSelectMenuBuilder,
} from 'discord.js';
import { fetchActiveBookAlertsForUser } from '../core/bookAlerts';
import { frenchMealPeriod, mealPeriodEmoji, normalizeDate } from '../core/utils';
import { fetchRestaurantById } from '../core/restaurants';
import { COLORS, EMOJIS } from '../constants';
import { handleInteractionError } from '../lib/errorHandler';

export class MyNotifications extends InteractionHandler {
  public constructor(ctx: InteractionHandler.LoaderContext) {
    super(ctx, { interactionHandlerType: InteractionHandlerTypes.Button });
  }

  public async run(interaction: ButtonInteraction) {
    try {
      await interaction.deferReply({ ephemeral: true });

      const bookAlerts = await fetchActiveBookAlertsForUser(interaction.user.id);

      const embed = new EmbedBuilder()
        .setTitle(`${EMOJIS.BELL} Vos notifications actives`)
        .setColor(COLORS.PRIMARY);

      if (bookAlerts.length === 0) {
        embed
          .setDescription(
            `${EMOJIS.SPARKLES} **Aucune notification active pour le moment**\n\nVous n'avez pas encore créé de notification de disponibilité.\n\n💡 **Pour commencer :**\nCliquez sur le bouton "*Créer une alerte*" dans le message épinglé du salon pour créer votre première alerte !`,
          )
          .setThumbnail('https://emojicdn.elk.sh/🔕?style=google');
        await interaction.editReply({ embeds: [embed] });
        return;
      }

      embed
        .setDescription(
          `Vous avez **${bookAlerts.length}** notification(s) active(s).\n\n${EMOJIS.TRASH} Pour supprimer une notification, sélectionnez-la dans le menu ci-dessous.`,
        )
        .setThumbnail('https://emojicdn.elk.sh/🔔?style=google')
        .setFooter({
          text: `Total : ${bookAlerts.length} notification(s)`,
          iconURL: 'https://emojicdn.elk.sh/✨?style=google',
        });

      const menuBuilder = new StringSelectMenuBuilder()
        .setCustomId('viewNotification')
        .setPlaceholder(`${EMOJIS.TRASH} Sélectionnez une notification à gérer`);

      // Discord allows at most 25 embed fields and 25 select menu options
      for (const bookAlert of bookAlerts.slice(0, 25)) {
        const restaurantId = bookAlert.checks[0]?.restaurantId;
        const restaurant = restaurantId ? await fetchRestaurantById(restaurantId) : undefined;
        const restaurantName = restaurant?.name ?? 'Restaurant inconnu';
        const emoji = mealPeriodEmoji(bookAlert.mealPeriod);

        embed.addFields({
          name: `${emoji} Notification #${bookAlert.id}`,
          value: `**Date :** ${normalizeDate(bookAlert.date)}\n**Restaurant :** ${restaurantName}\n**Couverts :** ${bookAlert.partyMix} personne(s)\n**Période :** ${frenchMealPeriod(bookAlert.mealPeriod)}`,
          inline: true,
        });

        menuBuilder.addOptions({
          label: `#${bookAlert.id} - ${restaurantName}`.slice(0, 100),
          description: `${normalizeDate(bookAlert.date)} • ${frenchMealPeriod(bookAlert.mealPeriod)} • ${bookAlert.partyMix} pers.`,
          value: String(bookAlert.id),
          emoji,
        });
      }

      await interaction.editReply({
        embeds: [embed],
        components: [new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menuBuilder)],
      });
    } catch (error) {
      await handleInteractionError(interaction, error, {
        customId: interaction.customId,
      });
    }
  }

  public parse(interaction: ButtonInteraction) {
    if (interaction.customId !== 'myNotifications') return this.none();
    return this.some();
  }
}
