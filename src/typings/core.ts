export interface Statistics {
    alerts: number;
    slots: number;
}

export interface DailyReport {
    highestCheckInterval: number;
    newBookAlerts: number;
    newBookSlots: number;
    newNotifications: number;
}
