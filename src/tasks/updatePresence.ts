import { ActivityType } from 'discord.js';
import { Statistics } from '../typings/core';
import { container } from '@sapphire/framework';
import { getAxiosClient } from '../core/axios';
import { getLogger } from '../config/logger';

const logger = getLogger();

/**
 * Fetch statistics from the API
 */
async function fetchStatistics(): Promise<Statistics> {
  try {
    const response = await getAxiosClient().get<Statistics>('/statistics');
    return response.data;
  } catch (error) {
    logger.error({ error }, 'Failed to fetch statistics for presence update');
    throw error;
  }
}

let nextPresence = 0;

/**
 * Update the bot's presence with rotating statistics
 */
export default async function updatePresence(): Promise<void> {
  try {
    const { client } = container;

    if (!client.user) {
      logger.warn('Client user not available, skipping presence update');
      return;
    }

    const statistics = await fetchStatistics();

    const presences = [
      {
        name: `${statistics.slots} créneaux`,
        type: ActivityType.Watching,
      },
      {
        name: `${statistics.alerts} notifications`,
        type: ActivityType.Watching,
      },
      {
        name: `les disponibilités des restaurants`,
        type: ActivityType.Watching,
      },
    ];

    const currentPresence = presences[nextPresence];

    await client.user.setPresence({
      activities: [currentPresence],
      status: 'online',
    });

    logger.debug({ presence: currentPresence.name }, 'Presence updated');

    // Cycle to next presence
    nextPresence = (nextPresence + 1) % presences.length;
  } catch (error) {
    logger.error({ error }, 'Error updating presence');
    // Don't throw - let the task continue running
  }
}


