import { BookAlert } from '../typings/bookAlerts';
import axios from 'axios';
import { getAxiosClient } from './axios';

export async function createBookAlert(restaurantDisneyId: string, mealPeriod: string, date: string, partyMix: number, discordId: string): Promise<BookAlert> {
    return await getAxiosClient().post<BookAlert>('/bookAlerts', {
        restaurantDisneyId,
        discordId,
        mealPeriod,
        date,
        partyMix,
    }).then((response) => response.data);
}

export async function fetchBookAlerts(): Promise<BookAlert[]> {
    return await getAxiosClient().get<BookAlert[]>('/bookAlerts')
        .then((response) => response.data);
}

export async function fetchActiveBookAlertsForUser(discordId: string): Promise<BookAlert[]> {
    const bookAlerts = await fetchBookAlerts();
    return bookAlerts.filter(bookAlert => bookAlert.discordId === discordId && !bookAlert.completed);
}

export async function fetchBookAlertById(id: number): Promise<BookAlert> {
    const bookAlerts = await fetchBookAlerts();
    return bookAlerts.find(bookAlert => bookAlert.id === id);
}

export async function completeBookAlert(id: number): Promise<BookAlert> {
    return await getAxiosClient().post<BookAlert>('/completeBookAlert', { id })
        .then((response) => response.data);
}
