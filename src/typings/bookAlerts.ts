import { Restaurant } from './restaurants';

export interface RestaurantAlert {
    id: number;
    checks: RestaurantCheck[];
    discordId: string;
    date: string;
    mealPeriod: 'BREAKFAST' | 'LUNCH' | 'DINNER';
    partyMix: number;
    completed: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface RestaurantCheck {
    id: number;
    alertId: number;
    restaurantId: number;
    checkedAt: string;
    checkCount: number;
    errorCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface BookNotification {
    alertId: number;
    discordId: string;
    restaurant: Restaurant;
    date: string;
    mealPeriod: string;
    partyMix: number;
    hours: string[];
}
