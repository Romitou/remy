export interface NotificationDetails {
    restaurantId: number;
    mealPeriod: 'Breakfast' | 'Lunch' | 'Dinner';
    date: string;
    partyMix: number;
}
