import { RestaurantAlert } from '../typings/bookAlerts';
import axios from 'axios';
import { getAxiosClient } from './axios';

export async function createBookAlert(restaurantIds: number[], mealPeriod: string, date: string, partyMix: number, discordId: string): Promise<RestaurantAlert> {
    return await getAxiosClient().post('/discord-alerts', {
        restaurantIds,
        discordId,
        mealPeriod,
        date,
        partyMix,
    }).then((response) => response.data);
}

export async function fetchBookAlerts(): Promise<RestaurantAlert[]> {
    return await getAxiosClient().get('/discord-alerts')
        .then((response) => response.data);
}

export async function fetchActiveBookAlertsForUser(discordId: string): Promise<RestaurantAlert[]> {
    return await getAxiosClient().get('/discord-alerts?discordId='+discordId)
      .then((response) => response.data);
}

export async function fetchBookAlertById(id: number): Promise<RestaurantAlert> {
    return await getAxiosClient().get('/discord-alert?id='+id)
      .then((response) => response.data);
}

export async function completeBookAlert(id: number): Promise<RestaurantAlert> {
    return await getAxiosClient().get('/complete-alert?id=' + id)
        .then((response) => response.data);
}
