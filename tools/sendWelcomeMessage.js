const { Client, ActionRowBuilder, ButtonBuilder, ButtonStyle, IntentsBitField} = require('discord.js');
const dotenv = require('dotenv');

async function sendWelcomeMessage() {
    dotenv.config();

    const client = new Client({
        intents: [
            IntentsBitField.Flags.Guilds
        ]
    });
    await client.login(process.env.DISCORD_TOKEN);

    const guild = await client.guilds.fetch(process.env.GUILD_ID);
    const channel = await guild.channels.fetch(process.env.CHANNEL_ID);

    const componentRow = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId('startAlertBook')
                .setLabel('Enregistrer une notification')
                .setStyle(ButtonStyle.Success)
                .setEmoji('📬'),
            new ButtonBuilder()
                .setCustomId('myNotifications')
                .setLabel('Mes notifications')
                .setStyle(ButtonStyle.Primary)
                .setEmoji('📘')
        );

    await channel.send({
        embeds: [
            {
                title: 'Notifications de disponibilité des restaurants 🍽️',
                description: `Salut, c'est Rémy !\n\n:white_small_square: Grâce à moi, **activez dès maintenant vos notifications de disponibilité pour les restaurants** des parcs et hôtels de Disneyland Paris.\n:white_small_square: Je me chargerai de **vérifier périodiquement si une table est disponible** dans le restaurant de votre choix selon votre période de repas, votre date de visite et votre nombre d'invités.\n:white_small_square: Dès qu'une table sera disponible, **je vous enverrai une notification en message privé** ! Il ne vous restera plus qu'à vous rendre sur l'application Disneyland Paris et **réserver votre table**.\n\nVous souhaitez enregistrer une nouvelle notification ou consulter vos notifications actuelles ? Cliquez sur les boutons correspondants ci-dessous !`,
                color: 7445165,
                footer: {
                    text: 'Créé et développé par Romitou pour Disneyland Paris - Notifications et entraides',
                },
                image: {
                    url: 'https://s3-01.romitou.fr/disneytables/welcome.jpg',
                }
            }
        ],
        components: [componentRow]
    });

    process.exit(0);
}

sendWelcomeMessage();
