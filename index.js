// index.js
require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// Users database (in-memory for now)
const users = {};

// Spin data
const clans = [
    { name: 'Ōtsutsuki', rarity: 'Mythical', emoji: '👁️' },
    { name: 'Kaguya', rarity: 'Mythical', emoji: '🌌' },
    { name: 'Uchiha', rarity: 'Legendary', emoji: '🔥' },
    { name: 'Senju', rarity: 'Legendary', emoji: '🌳' },
    { name: 'Hyuga', rarity: 'Legendary', emoji: '👀' },
    { name: 'Uzumaki', rarity: 'Legendary', emoji: '🌀' },
    { name: 'Yuki', rarity: 'Epic', emoji: '❄️' },
    { name: 'Hozuki', rarity: 'Epic', emoji: '💧' },
    { name: 'Hoshigaki', rarity: 'Epic', emoji: '🌑' },
    { name: 'Chinoike', rarity: 'Epic', emoji: '🩸' },
    { name: 'Jugo', rarity: 'Epic', emoji: '🌿' },
    { name: 'Kurama', rarity: 'Epic', emoji: '🦊' },
    { name: 'Sabaku', rarity: 'Epic', emoji: '🏜️' },
    { name: 'Shirogane', rarity: 'Rare', emoji: '⚪' },
    { name: 'Yotsuki', rarity: 'Rare', emoji: '✖️' },
    { name: 'Fūma', rarity: 'Rare', emoji: '🗡️' },
    { name: 'Iburi', rarity: 'Rare', emoji: '💨' },
    { name: 'Hatake', rarity: 'Rare', emoji: '🧑‍🦰' },
    { name: 'Kamizuru', rarity: 'Rare', emoji: '🦅' },
    { name: 'Sarutobi', rarity: 'Rare', emoji: '🐒' },
    { name: 'Aburame', rarity: 'Common', emoji: '🐛' },
    { name: 'Akimichi', rarity: 'Common', emoji: '🍗' },
    { name: 'Nara', rarity: 'Common', emoji: '🦌' },
    { name: 'Yamanaka', rarity: 'Common', emoji: '💭' },
    { name: 'Inuzuka', rarity: 'Common', emoji: '🐕' },
    { name: 'Shimura', rarity: 'Common', emoji: '🧓' },
    { name: 'Lee', rarity: 'Common', emoji: '🥷' }
];

const elements = [
    { name: 'Fire', rarity: 'Rare', emoji: '🔥' },
    { name: 'Water', rarity: 'Rare', emoji: '💧' },
    { name: 'Earth', rarity: 'Rare', emoji: '🌍' },
    { name: 'Wind', rarity: 'Rare', emoji: '🌪️' },
    { name: 'Lightning', rarity: 'Rare', emoji: '⚡' },
    { name: 'Wood', rarity: 'Legendary', emoji: '🌳' },
    { name: 'Yin', rarity: 'Mythical', emoji: '🌑' },
    { name: 'Yang', rarity: 'Mythical', emoji: '🌕' },
    { name: 'Chaos', rarity: 'Mythical', emoji: '🌀' },
    { name: 'Order', rarity: 'Mythical', emoji: '⚖️' }
];

const traits = [
    { name: 'Analytical Eye', rarity: 'Legendary', emoji: '👁️' },
    { name: 'Jutsu Amplification', rarity: 'Legendary', emoji: '💥' },
    { name: 'Elemental Affinity Mastery', rarity: 'Epic', emoji: '✨' },
    { name: 'Illusion/Genjutsu Potency', rarity: 'Epic', emoji: '🌫️' },
    { name: 'Kekkei Genkai Proficiency', rarity: 'Legendary', emoji: '🩸' },
    { name: 'Fuinjutsu Technique Expertise', rarity: 'Rare', emoji: '🪄' },
    { name: 'Iryojutsu Proficiency', rarity: 'Epic', emoji: '🩹' },
    { name: 'Scientist', rarity: 'Rare', emoji: '🧪' },
    { name: 'Superhuman Physique', rarity: 'Rare', emoji: '💪' }
];

const rarities = {
    Mythical: 1,
    Legendary: 5,
    Epic: 15,
    Rare: 29,
    Common: 50
};

function getRandomItem(arr) {
    let total = 100;
    const pick = Math.floor(Math.random() * total) + 1;
    let current = 0;
    for (const item of arr) {
        current += rarities[item.rarity];
        if (pick <= current) return item;
    }
    return arr[arr.length - 1];
}

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;

    const userId = interaction.user.id;
    const data = users[userId];
    if (!data) return interaction.reply({ content: 'No spins to finalize!', ephemeral: true });

    const type = interaction.customId; // clan/element/trait
    if (!data.finalized) data.finalized = {};
    if (!data.finalized[type]) {
        data.finalized[type] = data.spins[type][0]; // take the first spin
        await interaction.update({ content: `Finalized ${type}: ${data.finalized[type].emoji} **${data.finalized[type].name}**`, components: [] });
    } else {
        await interaction.reply({ content: `You already finalized ${type}!`, ephemeral: true });
    }
});

client.on('messageCreate', async message => {
    if (!message.guild || message.author.bot) return;

    const args = message.content.split(' ');
    const command = args.shift().toLowerCase();

    if (!users[message.author.id]) {
        users[message.author.id] = { spins: { clan: [], element: [], trait: [] }, finalized: {} };
    }

    const userData = users[message.author.id];

    if (command === '!clan') {
        const spin = getRandomItem(clans);
        userData.spins.clan.push(spin);
        const embed = new EmbedBuilder()
            .setTitle('🎲 Clan Spin')
            .setDescription(`${spin.emoji} **${spin.name}**\nSpins left: 10`)
            .setColor(0x00FF00);
        const button = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('clan').setLabel('Finalize Clan').setStyle(ButtonStyle.Primary)
        );
        message.channel.send({ embeds: [embed], components: [button] });
    }

    if (command === '!element') {
        const spin = getRandomItem(elements);
        userData.spins.element.push(spin);
        const embed = new EmbedBuilder()
            .setTitle('🎲 Element Spin')
            .setDescription(`${spin.emoji} **${spin.name}**\nSpins left: 10`)
            .setColor(0x1E90FF);
        const button = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('element').setLabel('Finalize Element').setStyle(ButtonStyle.Primary)
        );
        message.channel.send({ embeds: [embed], components: [button] });
    }

    if (command === '!trait') {
        const spin = getRandomItem(traits);
        userData.spins.trait.push(spin);
        const embed = new EmbedBuilder()
            .setTitle('🎲 Trait Spin')
            .setDescription(`${spin.emoji} **${spin.name}**\nSpins left: 5`)
            .setColor(0xFF69B4);
        const button = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('trait').setLabel('Finalize Trait').setStyle(ButtonStyle.Primary)
        );
        message.channel.send({ embeds: [embed], components: [button] });
    }

    if (command === '!check') {
        const embed = new EmbedBuilder()
            .setTitle(`📝 ${message.author.username}'s Finalized Specs`)
            .setColor(0xFFD700);
        const f = userData.finalized;
        embed.setDescription(
            `Clan: ${f.clan ? `${f.clan.emoji} **${f.clan.name}**` : 'None'}\n` +
            `Elements: ${f.element ? `${f.element.emoji} **${f.element.name}**` : 'None'}\n` +
            `Trait: ${f.trait ? `${f.trait.emoji} **${f.trait.name}**` : 'None'}`
        );
        message.channel.send({ embeds: [embed] });
    }

    if (command === '!announce') {
        const content = args.join(' ');
        if (!content) return message.reply('Please provide a message.');
        const embed = new EmbedBuilder()
            .setDescription(content)
            .setColor(0x00FFFF);
        message.channel.send({ embeds: [embed] });
    }

    if (command === '!cmds') {
        const embed = new EmbedBuilder()
            .setTitle('📜 Command List')
            .setColor(0xFFA500)
            .setDescription(
                '**!clan** – Roll a clan\n' +
                '**!element** – Roll an element\n' +
                '**!trait** – Roll a trait\n' +
                '**!check** – See your finalized specs\n' +
                '**!announce** – Send an embed announcement\n' +
                '**!cmds** – Show this command list'
            );
        message.channel.send({ embeds: [embed] });
    }
});

client.login(process.env.DISCORD_TOKEN);
