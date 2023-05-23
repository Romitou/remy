const { Client, ActionRowBuilder, ButtonBuilder, ButtonStyle, IntentsBitField} = require('discord.js');
const dotenv = require('dotenv');

async function sendMaintenanceMessage() {
    dotenv.config();

    const client = new Client({
        intents: [
            IntentsBitField.Flags.Guilds
        ]
    });
    await client.login(process.env.DISCORD_TOKEN);

    const guild = await client.guilds.fetch(process.env.GUILD_ID);
    const channel = await guild.channels.fetch(process.env.CHANNEL_ID);

    await channel.send({
        embeds: [
            {
                title: '🔕 Je suis appelé en cuisine !',
                description: `L'enregistrement et l'envoi de certaines notifications de disponibilité des restaurants de Disneyland Paris sont momentanément interrompus. Ne vous inquiétez pas, je reviens vite !`,
                color: 0xe67e22,
                footer: {
                    text: 'Créé et développé par Romitou pour Disneyland Paris - Notifications et entraides',
                },
                image: {
                    url: 'https://s3-01.romitou.fr/disneytables/error.png',
                }
            }
        ],
    });

    process.exit(0);
}

sendMaintenanceMessage();
