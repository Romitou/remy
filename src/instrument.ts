// Must be imported before any other module so that Sentry can instrument them
import 'dotenv/config';
import { init } from '@sentry/node';
import { getEnvironment } from './config/environment';

const env = getEnvironment();

if (env.SENTRY_DSN) {
  init({
    dsn: env.SENTRY_DSN,
    environment: env.NODE_ENV,
    tracesSampleRate: env.NODE_ENV === 'production' ? 0.1 : 1.0,
  });
}
