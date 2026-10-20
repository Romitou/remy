import { getRedisClient } from '../core/redis';
import { getLogger } from '../config/logger';
import { MealPeriod } from '../core/utils';

const logger = getLogger();

/**
 * Values last typed by a user in the alert form, used to prefill it: when correcting an error,
 * editing an alert, or creating several alerts for the same visit.
 */
export interface AlertDraft {
  date?: string;
  partyMix?: string;
  mealPeriod?: MealPeriod;
}

const DRAFT_TTL_SECONDS = 24 * 60 * 60;

function draftKey(userId: string): string {
  return `alert_draft:${userId}`;
}

/**
 * Get the alert draft of a user (empty if none or if Redis is unavailable)
 */
export async function getAlertDraft(userId: string): Promise<AlertDraft> {
  try {
    const redis = getRedisClient();
    if (!redis.isReady) {
      return {};
    }
    const cached = await redis.get(draftKey(userId));
    return cached ? (JSON.parse(cached) as AlertDraft) : {};
  } catch (error) {
    logger.warn({ error, userId }, 'Failed to get alert draft');
    return {};
  }
}

/**
 * Save the alert draft of a user; failures only lose the prefill
 */
export async function saveAlertDraft(userId: string, draft: AlertDraft): Promise<void> {
  try {
    const redis = getRedisClient();
    if (!redis.isReady) {
      return;
    }
    await redis.setEx(draftKey(userId), DRAFT_TTL_SECONDS, JSON.stringify(draft));
  } catch (error) {
    logger.warn({ error, userId }, 'Failed to save alert draft');
  }
}
