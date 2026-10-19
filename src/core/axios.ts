import axios, { AxiosInstance } from 'axios';
import axiosRetry from 'axios-retry';
import { getEnvironment } from '../config/environment';
import { getLogger } from '../config/logger';

let axiosClient: AxiosInstance | null = null;
const logger = getLogger();

/**
 * Create and configure the Axios client with retry logic
 */
export function createAxiosClient(): AxiosInstance {
  const env = getEnvironment();

  const client = axios.create({
    baseURL: env.BASE_API,
    headers: {
      Authorization: env.WEBSERVER_TOKEN,
      'Accept-Encoding': 'gzip,deflate,compress',
      'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 seconds timeout
  });

  // Configure retry logic
  axiosRetry(client, {
    retries: 3,
    retryDelay: axiosRetry.exponentialDelay,
    // Only retry idempotent requests (network errors and 5xx): retrying a POST could create
    // duplicate alerts
    retryCondition: axiosRetry.isNetworkOrIdempotentRequestError,
    onRetry: (retryCount, error, requestConfig) => {
      logger.warn(
        {
          retryCount,
          url: requestConfig.url,
          method: requestConfig.method,
          error: error.message,
        },
        'Retrying API request',
      );
    },
  });

  // Request interceptor for logging
  client.interceptors.request.use(
    (config) => {
      logger.debug(
        {
          method: config.method?.toUpperCase(),
          url: config.url,
        },
        'API Request',
      );
      return config;
    },
    (error) => {
      logger.error({ error }, 'API Request Error');
      return Promise.reject(error);
    },
  );

  // Response interceptor for logging
  client.interceptors.response.use(
    (response) => {
      logger.debug(
        {
          status: response.status,
          url: response.config.url,
        },
        'API Response',
      );
      return response;
    },
    (error) => {
      logger.error(
        {
          status: error.response?.status,
          url: error.config?.url,
          error: error.message,
        },
        'API Response Error',
      );
      return Promise.reject(error);
    },
  );

  axiosClient = client;
  logger.info('Axios client created and configured');
  return client;
}

/**
 * Get the configured Axios client
 * Creates the client lazily if it doesn't exist
 */
export function getAxiosClient(): AxiosInstance {
  if (!axiosClient) {
    axiosClient = createAxiosClient();
  }
  return axiosClient;
}


