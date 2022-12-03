export interface NotificationDetails {
    restaurantId: string;
    mealPeriod: 'Breakfast' | 'Lunch' | 'Dinner';
    date: string;
    partyMix: number;
}
