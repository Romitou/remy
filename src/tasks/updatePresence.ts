import { ActivityType } from 'discord.js';
import { Statistics } from '../typings/core';
import { ofetch } from 'ofetch';
import { container } from '@sapphire/framework';

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

export default async function updatePresence() {
    const { client } = container;
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
                    name: `${statistics.bookAlertsCount} notifications`,
                    type: ActivityType.Watching,
                }],
            });
            nextPresence = 2;
            break;
        case 2:
            client.user?.setPresence({
                activities: [{
                    name: `les disponibilités des restaurants`,
                    type: ActivityType.Watching,
                }],
            });
            nextPresence = 0;
            break;
    }
}
