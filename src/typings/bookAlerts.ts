import { z } from 'zod';

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

/**
 * Notification published by DisneyTables on the "restaurant-notifications" Redis channel
 */
export const bookNotificationSchema = z.object({
  alertId: z.number(),
  discordId: z.string(),
  restaurant: z.object({
    name: z.string(),
    imageUrl: z.string().nullish(),
  }),
  date: z.string(),
  mealPeriod: z.string(),
  partyMix: z.number(),
  hours: z.array(z.string()),
});

export type BookNotification = z.infer<typeof bookNotificationSchema>;
