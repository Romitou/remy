import { AxiosResponse } from 'axios';
import { Restaurant, RestaurantAvailabilities } from '../typings/restaurants';
import { getAxiosClient } from './axios';

let cacheDate: Date | null = null;
let cachedRestaurants: Restaurant[] = [];

export async function fetchRestaurants(): Promise<Restaurant[]> {
    if (!cacheDate || (cacheDate.getTime() < Date.now() - 1000 * 60 * 60)) {
        cacheDate = new Date();
        const restaurants = await getAxiosClient().get<Restaurant[]>('/restaurants')
            .then((response: AxiosResponse<Restaurant[]>) => response.data);
        cachedRestaurants = restaurants;
    }
    return cachedRestaurants;
}

export async function fetchRestaurantById(id: number): Promise<Restaurant> {
    const restaurants = await fetchRestaurants();
    return restaurants.find((restaurant) => restaurant.id === id);
}

export async function fetchRestaurantByDisneyId(disneyId: string): Promise<Restaurant> {
    const restaurants = await fetchRestaurants();
    return restaurants.find((restaurant) => restaurant.disneyId === disneyId);
}

export async function fetchRestaurantAvailabilities(date: string, restaurantId: number, partyMix: number): Promise<RestaurantAvailabilities[]> {
    return await getAxiosClient().post('/availabilities', {
        date,
        restaurantId,
        partyMix,
    }).then((response) => response.data);
}

export async function fetchRestaurantByName(name: string): Promise<Restaurant> {
    const restaurants = await fetchRestaurants();
    return restaurants.find((restaurant) => restaurant.name === name);
}
