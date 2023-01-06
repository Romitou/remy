import { ActivityType } from 'discord.js';
import { Statistics } from '../typings/core';
import { container } from '@sapphire/framework';
import axios from 'axios';
import { getAxiosClient } from '../core/axios';

function fetchBookAlerts(): Promise<Statistics> {
    return getAxiosClient().get<Statistics>('/statistics')
        .then((response) => response.data);
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
