import { ofetch } from 'ofetch';
import { BookAlert } from '../typings/bookAlerts';

export async function createBookAlert(restaurantDisneyId: string, mealPeriod: string, date: string, partyMix: number, discordId: string): Promise<BookAlert> {
    return await ofetch<BookAlert>(`${process.env.BASE_API}/bookAlerts`, {
        method: 'POST',
        body: {
            restaurantDisneyId,
            discordId,
            mealPeriod,
            date,
            partyMix,
        },
        parseResponse: JSON.parse,
        headers: {
            'Authorization': `Bearer ${process.env.WEBSERVER_TOKEN}`
        }
    });
}

export async function fetchBookAlerts(): Promise<BookAlert[]> {
    return await ofetch<BookAlert[]>(`${process.env.BASE_API}/bookAlerts`, {
        method: 'GET',
        parseResponse: JSON.parse,
        headers: {
            'Authorization': `Bearer ${process.env.WEBSERVER_TOKEN}`
        }
    });
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
    return await ofetch<BookAlert>(`${process.env.BASE_API}/completeBookAlert`, {
        method: 'POST',
        body: {
            id,
        },
        parseResponse: JSON.parse,
        headers: {
            'Authorization': `Bearer ${process.env.WEBSERVER_TOKEN}`
        }
    });
}
