import { RestaurantAlert } from '../typings/bookAlerts';
import axios from 'axios';
import { getAxiosClient } from './axios';

export async function createBookAlert(restaurantIds: number[], mealPeriod: string, date: string, partyMix: number, discordId: string): Promise<RestaurantAlert> {
    return await getAxiosClient().post('/bookAlerts', {
        restaurantIds,
        discordId,
        mealPeriod,
        date,
        partyMix,
    }).then((response) => response.data);
}

export async function fetchBookAlerts(): Promise<RestaurantAlert[]> {
    return await getAxiosClient().get('/bookAlerts')
        .then((response) => response.data);
}

export async function fetchActiveBookAlertsForUser(discordId: string): Promise<RestaurantAlert[]> {
    const bookAlerts = await fetchBookAlerts();
    return bookAlerts.filter(bookAlert => bookAlert.discordId === discordId && !bookAlert.completed);
}

export async function fetchBookAlertById(id: number): Promise<RestaurantAlert> {
    const bookAlerts = await fetchBookAlerts();
    return bookAlerts.find(bookAlert => bookAlert.id === id);
}

export async function completeBookAlert(id: number): Promise<RestaurantAlert> {
    return await getAxiosClient().post('/completeBookAlert', { id })
        .then((response) => response.data);
}
