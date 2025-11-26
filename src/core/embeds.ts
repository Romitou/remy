import { NotificationDetails } from '../typings/embeds';
import { Embed } from 'discord.js';
import { fetchRestaurantByName } from './restaurants';

export async function getNotificationDetails(embed: Embed): Promise<Partial<NotificationDetails>> {
    let notificationDetails: Partial<NotificationDetails> = {
        restaurantId: undefined,
        mealPeriod: undefined,
        date: undefined,
        partyMix: undefined,
    };
    for (const field of embed.fields) {
        switch (field.name) {
            case 'Restaurant':
                const restaurant = await fetchRestaurantByName(field.value);
                if (restaurant) {
                    notificationDetails.restaurantId = restaurant.id;
                }
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

