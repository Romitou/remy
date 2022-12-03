export interface Restaurant {
    id: number;
    disneyId: string;
    name: string;
    imageUrl: string;
}

export interface RestaurantAvailabilities {
    startTime: string;
    endTime: string;
    date: string;
    status: string;
    mealPeriods: RestaurantMealPeriod[];
}

export interface RestaurantMealPeriod {
    mealPeriod: string;
    slotList: RestaurantSlot[];
}

export interface RestaurantSlot {
    time: string;
    available: string;
}
