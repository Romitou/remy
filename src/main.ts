import 'dotenv/config';
import { IntentsBitField } from 'discord.js';
import { SapphireClient } from '@sapphire/framework';
import { subscribeBookNotifications } from './core/redis';
import { init } from '@sentry/node';
import { schedule } from 'node-cron';
import updatePresence from './tasks/updatePresence';
import sendDailyReport from './tasks/sendDailyReport';
import { createAxiosClient } from './core/axios';
import updateOnboarding from './tasks/updateOnboarding';

async function start() {
    init({
        dsn: process.env.SENTRY_DSN,
    });

    const client = new SapphireClient({
        intents: [IntentsBitField.Flags.Guilds],
    });

    await client.login(process.env.DISCORD_TOKEN);
    createAxiosClient();

    schedule('* * * * *', updatePresence);
    schedule('0 0 * * *', sendDailyReport);
    schedule('*/5 * * * *', updateOnboarding);
    await subscribeBookNotifications();
}

void start();
