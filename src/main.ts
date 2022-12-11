import 'dotenv/config';
import { ButtonStyle, IntentsBitField, TextInputStyle } from 'discord.js';
import { SapphireClient } from '@sapphire/framework';
import { subscribeBookNotifications } from './core/redis';
import { init } from '@sentry/node';
import { schedule } from 'node-cron';
import updatePresence from './tasks/updatePresence';
import sendDailyReport from './tasks/sendDailyReport';

async function start() {
    init({
        dsn: process.env.SENTRY_DSN,
    });

    const client = new SapphireClient({
        intents: [IntentsBitField.Flags.Guilds],
    });

    await client.login(process.env.DISCORD_TOKEN);
    schedule('* * * * *', updatePresence);
    schedule('0 0 * * *', sendDailyReport);
    await subscribeBookNotifications();
}

start();
