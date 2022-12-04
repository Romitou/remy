import { NotificationDetails } from '../typings/embeds';
import { Embed } from 'discord.js';
import { fetchRestaurantByName } from './restaurants';

export async function getNotificationDetails(embed: Embed): Promise<NotificationDetails> {
    let notificationDetails: NotificationDetails = {
        restaurantId: null,
        mealPeriod: null,
        date: null,
        partyMix: null,
    };
    for (const field of embed.fields) {
        switch (field.name) {
            case 'Restaurant':
                const restaurant = await fetchRestaurantByName(field.value)
                notificationDetails.restaurantId = restaurant.disneyId;
                break;
            case 'Date de visite':
                notificationDetails.date = field.value;
                break;
            case 'Nombre de couverts':
                const parsedPartyMix = Number.parseInt(field.value);
                notificationDetails.partyMix = parsedPartyMix;
                break;
        }
    }
    return notificationDetails;
}
