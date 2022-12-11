export interface Statistics {
    bookAlertsCount: number;
    bookSlotsCount: number;
    sentNotificationsCount: number;
}

export interface DailyReport {
    highestCheckInterval: number;
    newBookAlerts: number;
    newBookSlots: number;
    newNotifications: number;
}
