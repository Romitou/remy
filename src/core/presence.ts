import { ofetch } from 'ofetch';
import { Statistics } from '../typings/core';
import { ActivityType, Client } from 'discord.js';

function fetchBookAlerts(): Promise<Statistics> {
    return ofetch<Statistics>(`${process.env.BASE_API}/statistics`, {
        method: 'GET',
        parseResponse: JSON.parse,
        headers: {
            'Authorization': `Bearer ${process.env.WEBSERVER_TOKEN}`
        }
    });
}

let nextPresence = 0;

export async function setPresence(client: Client) {
    setInterval(async () => {
        const statistics = await fetchBookAlerts();
        switch (nextPresence) {
            case 0:
                client.user?.setPresence({
                    activities: [{
                        name: `${statistics.bookSlotsCount} créneaux`,
                        type: ActivityType.Watching,
                    }],
                });
                nextPresence = 1;
                break;
            case 1:
                client.user?.setPresence({
                    activities: [{
                        name: `${statistics.bookAlertsCount} notifications d'utilisateurs`,
                        type: ActivityType.Watching,
                    }],
                });
                nextPresence = 2;
                break;
            case 2:
                client.user?.setPresence({
                    activities: [{
                        name: `${statistics.sentNotificationsCount} notifications envoyées`,
                    }],
                });
                nextPresence = 0;
                break;
        }
    }, 1000 * 60);
}
