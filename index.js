// index.js
const fs = require('fs');
const { Client, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder, InteractionType, REST, Routes, SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

const token = process.env.BOT_TOKEN;
const dbFile = './database.json';

// Load or create database
let userData = {};
if (fs.existsSync(dbFile)) userData = JSON.parse(fs.readFileSync(dbFile));
else fs.writeFileSync(dbFile, JSON.stringify(userData, null, 2));

function saveDB() { fs.writeFileSync(dbFile, JSON.stringify(userData, null, 2)); }

function ensureUser(id) {
    if (!userData[id]) {
        userData[id] = {
            spins: { clan: 15, element: 5, trait: 5 },
            finalized: { clan: null, element: [], trait: null },
            pending: { clan: [], element: [], trait: [] }
        };
        saveDB();
    }
}

// Your Rarities + Emojis
const clans = [
    { name: "Ōtsutsuki", rarity: 1, emoji: "👹" },
    { name: "Uchiha", rarity: 5, emoji: "🗡️" },
    { name: "Senju", rarity: 5, emoji: "🌲" },
    { name: "Hyuga", rarity: 5, emoji: "👁️" },
    { name: "Uzumaki", rarity: 5, emoji: "🔴" },
    // Add Epic/Rare/Common here with rarities
];
const elements = [
    { name: "Wood", rarity: 1, emoji: "🌳" },
    { name: "Fire", rarity: 10, emoji: "🔥" },
    { name: "Water", rarity: 10, emoji: "💧" },
    { name: "Earth", rarity: 10, emoji: "🌍" },
    { name: "Wind", rarity: 10, emoji: "🌬️" },
    { name: "Lightning", rarity: 10, emoji: "⚡" },
    { name: "Yin", rarity: 1, emoji: "🌑" },
    { name: "Yang", rarity: 1, emoji: "☀️" },
    { name: "Chaos", rarity: 1, emoji: "🌪️" },
    { name: "Order", rarity: 1, emoji: "🔷" },
];
const traits = [
    { name: "Analytical Eye", rarity: 5, emoji: "👁️‍🗨️" },
    { name: "Jutsu Amplification", rarity: 5, emoji: "⚡" },
    { name: "Elemental Affinity Mastery", rarity: 10, emoji: "🔥💧🌳" },
    { name: "Illusion/Genjutsu Potency", rarity: 10, emoji: "💭" },
    { name: "Kekkei Genkai Proficiency", rarity: 5, emoji: "🧬" },
    { name: "Fuinjutsu Technique Expertise", rarity: 20, emoji: "📜" },
    { name: "Iryojutsu Proficiency", rarity: 10, emoji: "💉" },
];

// Weighted random function
function weightedRandom(arr) {
    const total = arr.reduce((sum, item) => sum + item.rarity, 0);
    let rand = Math.floor(Math.random() * total);
    for (let item of arr) {
        if (rand < item.rarity) return item;
        rand -= item.rarity;
    }
    return arr[arr.length - 1];
}

// Send Spin Embed
async function sendSpin(interaction, type) {
    const id = interaction.user.id;
    ensureUser(id);

    if (userData[id].spins[type] <= 0) return interaction.reply({ content: `No ${type} spins left!`, ephemeral: true });

    const pool = type === 'clan' ? clans : type === 'element' ? elements : traits;
    const spin = weightedRandom(pool);

    // Duplicate protection: max 2
    const pendingList = userData[id].pending[type];
    const finalizedList = userData[id].finalized[type];
    if ((type === 'element' && [...pendingList, ...finalizedList].filter(e => e.name === spin.name).length >= 2) ||
        (type !== 'element' && [...pendingList, ...finalizedList].some(e => e.name === spin.name))) {
        userData[id].spins[type]++; // give extra spin
        saveDB();
        return interaction.reply({ content: `Duplicate detected! Extra spin awarded.`, ephemeral: true });
    }

    pendingList.push(spin);
    userData[id].spins[type]--;
    saveDB();

    const embed = new EmbedBuilder()
        .setTitle(`${type.toUpperCase()} SPIN!`)
        .setDescription(`You spun: ${spin.emoji} **${spin.name}**\nRemaining Spins: ${userData[id].spins[type]}`)
        .setColor('#00FFFF');

    const row = new ActionRowBuilder()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`finalize_${type}`)
                .setLabel('Finalize')
                .setStyle(ButtonStyle.Primary)
        );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
}

// Button interaction
client.on('interactionCreate', async interaction => {
    if (interaction.isButton()) {
        const id = interaction.user.id;
        ensureUser(id);

        const [action, type] = interaction.customId.split('_');
        if (action === 'finalize') {
            const pending = userData[id].pending[type];
            if (!pending.length) return interaction.reply({ content: 'No spins to finalize.', ephemeral: true });

            if (type === 'element') {
                userData[id].finalized[type] = pending.slice(0, 2);
            } else {
                userData[id].finalized[type] = pending[0];
            }

            userData[id].pending[type] = [];
            saveDB();

            await interaction.update({ content: `✅ Your ${type} has been finalized!`, embeds: [], components: [] });
        }
    }
});

// Slash command registration
const commands = [
    new SlashCommandBuilder().setName('clan').setDescription('Spin a clan'),
    new SlashCommandBuilder().setName('element').setDescription('Spin an element'),
    new SlashCommandBuilder().setName('trait').setDescription('Spin a trait'),
    new SlashCommandBuilder().setName('check').setDescription('Check your finalized specs'),
    new SlashCommandBuilder()
        .setName('announce')
        .setDescription('Send an announcement')
        .addStringOption(option => option.setName('message').setDescription('Announcement message').setRequired(true)),
].map(c => c.toJSON());

client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}`);

    const rest = new REST({ version: '10' }).setToken(token);
    await rest.put(Routes.applicationGuildCommands(client.user.id, process.env.GUILD_ID), { body: commands });
});

client.on('interactionCreate', async interaction => {
    if (!interaction.isCommand()) return;
    const id = interaction.user.id;
    ensureUser(id);

    if (interaction.commandName === 'clan') await sendSpin(interaction, 'clan');
    if (interaction.commandName === 'element') await sendSpin(interaction, 'element');
    if (interaction.commandName === 'trait') await sendSpin(interaction, 'trait');
    if (interaction.commandName === 'check') {
        const data = userData[id].finalized;
        const embed = new EmbedBuilder()
            .setTitle(`${interaction.user.username}'s Specs`)
            .setDescription(`**Clan:** ${data.clan ? `${data.clan.emoji} ${data.clan.name}` : 'None'}\n**Elements:** ${data.element.length ? data.element.map(e => `${e.emoji} ${e.name}`).join(', ') : 'None'}\n**Trait:** ${data.trait ? `${data.trait.emoji} ${data.trait.name}` : 'None'}`)
            .setColor('#FFD700');
        await interaction.reply({ embeds: [embed], ephemeral: true });
    }
    if (interaction.commandName === 'announce') {
        const content = interaction.options.getString('message');
        const embed = new EmbedBuilder().setDescription(content).setColor('#00FFFF');
        await interaction.reply({ embeds: [embed] });
    }
});

client.login(token);
