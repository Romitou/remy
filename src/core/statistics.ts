import { DailyReport, Statistics } from '../typings/core';
import { getAxiosClient } from './axios';
import { getLogger } from '../config/logger';

const logger = getLogger();

// Statistics are shown in the presence (every minute) and the onboarding message (every
// 5 minutes): a short cache avoids hitting the API on every presence rotation.
const STATISTICS_TTL_MS = 5 * 60 * 1000;

let statisticsCache: { data: Statistics; timestamp: number } | null = null;

/**
 * Fetch global statistics (active alerts, watched slots), cached for a few minutes
 */
export async function fetchStatistics(): Promise<Statistics> {
  if (statisticsCache && Date.now() - statisticsCache.timestamp < STATISTICS_TTL_MS) {
    return statisticsCache.data;
  }

  const response = await getAxiosClient().get<Statistics>('/statistics');
  statisticsCache = { data: response.data, timestamp: Date.now() };
  return response.data;
}

/**
 * Fetch the daily activity report
 */
export async function fetchDailyReport(): Promise<DailyReport> {
  const response = await getAxiosClient().get<DailyReport>('/daily-report');
  return response.data;
}

/**
 * Check whether the DisneyTables API reports itself as operational
 */
export async function isServiceOperational(): Promise<boolean> {
  try {
    await getAxiosClient().get('/status');
    return true;
  } catch (error) {
    logger.warn({ error }, 'DisneyTables status check failed');
    return false;
  }
}
