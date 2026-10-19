import { ActivityType } from 'discord.js';
import { container } from '@sapphire/framework';
import { fetchStatistics } from '../core/statistics';
import { getLogger } from '../config/logger';

const logger = getLogger();

let nextPresence = 0;

/**
 * Update the bot's presence with rotating statistics
 */
export default async function updatePresence(): Promise<void> {
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

  client.user.setPresence({
    activities: [currentPresence],
    status: 'online',
  });

  logger.debug({ presence: currentPresence.name }, 'Presence updated');

  // Cycle to next presence
  nextPresence = (nextPresence + 1) % presences.length;
}
