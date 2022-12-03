import { ofetch } from 'ofetch';
import { Restaurant, RestaurantAvailabilities } from '../typings/restaurants';

let cacheDate: Date | null = null;
let cachedRestaurants: Restaurant[] = [];

export async function fetchRestaurants(): Promise<Restaurant[]> {
    if (!cacheDate || (cacheDate.getTime() < Date.now() - 1000 * 60 * 60)) {
        cacheDate = new Date();
        cachedRestaurants = await ofetch<Restaurant[]>(`${process.env.BASE_API}/restaurants`, {
            parseResponse: JSON.parse,
            headers: {
                'Authorization': `Bearer ${process.env.WEBSERVER_TOKEN}`
            }
        });
    }
    return cachedRestaurants;
}

export async function fetchRestaurantById(disneyId: string): Promise<Restaurant> {
    const restaurants = await fetchRestaurants();
    return restaurants.find((restaurant) => restaurant.disneyId === disneyId);
}

export async function fetchRestaurantAvailabilities(date: string, disneyId: string, partyMix: number) {
    return await ofetch<RestaurantAvailabilities[]>(`${process.env.BASE_API}/restaurantAvailabilities`, {
        method: 'POST',
        body: {
            date,
            restaurantId: disneyId,
            partyMix,
        },
        parseResponse: JSON.parse,
        headers: {
            'Authorization': `Bearer ${process.env.WEBSERVER_TOKEN}`
        }
    });
}

export async function fetchRestaurantByName(name: string): Promise<Restaurant> {
    const restaurants = await fetchRestaurants();
    return restaurants.find((restaurant) => restaurant.name === name);
}
