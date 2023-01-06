import axios from 'axios';
import { Restaurant, RestaurantAvailabilities } from '../typings/restaurants';
import { getAxiosClient } from './axios';

let cacheDate: Date | null = null;
let cachedRestaurants: Restaurant[] = [];

export async function fetchRestaurants(): Promise<Restaurant[]> {
    if (!cacheDate || (cacheDate.getTime() < Date.now() - 1000 * 60 * 60)) {
        cacheDate = new Date();
        cachedRestaurants = await getAxiosClient().get<Restaurant[]>('/restaurants')
            .then((response) => response.data);
    }
    return cachedRestaurants;
}

export async function fetchRestaurantById(disneyId: string): Promise<Restaurant> {
    const restaurants = await fetchRestaurants();
    return restaurants.find((restaurant) => restaurant.disneyId === disneyId);
}

export async function fetchRestaurantAvailabilities(date: string, restaurantId: string, partyMix: number) {
    return await getAxiosClient().post<RestaurantAvailabilities[]>('/restaurantAvailabilities', {
        date,
        restaurantId,
        partyMix,
    }).then((response) => response.data);
}

export async function fetchRestaurantByName(name: string): Promise<Restaurant> {
    const restaurants = await fetchRestaurants();
    return restaurants.find((restaurant) => restaurant.name === name);
}
