import 'dotenv/config';
import { ButtonStyle, IntentsBitField, TextInputStyle } from 'discord.js';
import { SapphireClient } from '@sapphire/framework';
import { subscribeBookNotifications } from './core/redis';
import Sentry from '@sentry/node';

async function start() {
    Sentry.init({
        dsn: process.env.SENTRY_DSN,
    });

    const client = new SapphireClient({
        intents: [IntentsBitField.Flags.Guilds],
    });

    await client.login(process.env.DISCORD_TOKEN);
    await subscribeBookNotifications();
}

start();
