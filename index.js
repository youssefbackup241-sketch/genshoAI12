// index.js
require('dotenv').config();
const { Client, GatewayIntentBits, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Events } = require('discord.js');
const fs = require('fs');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
    partials: [Partials.Channel]
});

// Database simulation
let db = {};
const DB_FILE = './db.json';
function loadDB() {
    if (fs.existsSync(DB_FILE)) db = JSON.parse(fs.readFileSync(DB_FILE));
}
function saveDB() { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); }
loadDB();

// Configs
const clans = [
    { name: 'Ōtsutsuki', rarity: 'Mythical', emoji: '👑' },
    { name: 'Kaguya', rarity: 'Mythical', emoji: '🪐' },
    { name: 'Uchiha', rarity: 'Legendary', emoji: '🔥' },
    { name: 'Senju', rarity: 'Legendary', emoji: '🌳' },
    { name: 'Hyuga', rarity: 'Legendary', emoji: '👁️' },
    { name: 'Uzumaki', rarity: 'Legendary', emoji: '🌀' },
    { name: 'Yuki', rarity: 'Epic', emoji: '❄️' },
    { name: 'Hozuki', rarity: 'Epic', emoji: '💧' },
    { name: 'Hoshigaki', rarity: 'Epic', emoji: '🌊' },
    { name: 'Chinoike', rarity: 'Epic', emoji: '🩸' },
    { name: 'Jugo', rarity: 'Epic', emoji: '🟣' },
    { name: 'Kurama', rarity: 'Epic', emoji: '🦊' },
    { name: 'Sabaku', rarity: 'Epic', emoji: '🏜️' },
    { name: 'Shirogane', rarity: 'Rare', emoji: '⚪' },
    { name: 'Yotsuki', rarity: 'Rare', emoji: '🟡' },
    { name: 'Fūma', rarity: 'Rare', emoji: '⚫' },
    { name: 'Iburi', rarity: 'Rare', emoji: '🌫️' },
    { name: 'Hatake', rarity: 'Rare', emoji: '🎩' },
    { name: 'Kamizuru', rarity: 'Rare', emoji: '🦅' },
    { name: 'Sarutobi', rarity: 'Rare', emoji: '🐒' },
    { name: 'Aburame', rarity: 'Common', emoji: '🐜' },
    { name: 'Akimichi', rarity: 'Common', emoji: '🥐' },
    { name: 'Nara', rarity: 'Common', emoji: '🌳' },
    { name: 'Yamanaka', rarity: 'Common', emoji: '🧠' },
    { name: 'Inuzuka', rarity: 'Common', emoji: '🐕' },
    { name: 'Shimura', rarity: 'Common', emoji: '🪖' },
    { name: 'Lee', rarity: 'Common', emoji: '🥋' }
];

const traits = [
    { name: 'Analytical Eye', rarity: 'Legendary', emoji: '👁️' },
    { name: 'Clan Specialist', rarity: 'Mythical', emoji: '👑' },
    { name: 'Jutsu Amplification', rarity: 'Legendary', emoji: '⚡' },
    { name: 'Elemental Affinity Mastery', rarity: 'Epic', emoji: '🌟' },
    { name: 'Illusion/Genjutsu Potency', rarity: 'Epic', emoji: '🌀' },
    { name: 'Kekkei Genkai Proficiency', rarity: 'Legendary', emoji: '🧬' },
    { name: 'Fuinjutsu Technique Expertise', rarity: 'Rare', emoji: '📜' },
    { name: 'Iryojutsu Proficiency', rarity: 'Epic', emoji: '💉' },
    { name: 'Scientist', rarity: 'Rare', emoji: '🧪' },
    { name: 'Superhuman Physique', rarity: 'Rare', emoji: '💪' }
];

const elements = [
    { name: 'Wood', rarity: 'Legendary', emoji: '🌳' },
    { name: 'Fire', rarity: 'Rare', emoji: '🔥' },
    { name: 'Water', rarity: 'Rare', emoji: '💧' },
    { name: 'Earth', rarity: 'Rare', emoji: '🌎' },
    { name: 'Wind', rarity: 'Rare', emoji: '💨' },
    { name: 'Lightning', rarity: 'Rare', emoji: '⚡' },
    { name: 'Yin', rarity: 'Mythical', emoji: '🌑' },
    { name: 'Yang', rarity: 'Mythical', emoji: '🌕' },
    { name: 'Chaos', rarity: 'Mythical', emoji: '🌀' },
    { name: 'Order', rarity: 'Mythical', emoji: '📜' }
];

// Rarity chances
const rarityChances = { Mythical: 1, Legendary: 5, Epic: 15, Rare: 30, Common: 49 };

function spinItem(list) {
    const roll = Math.random() * 100;
    let cumulative = 0;
    const pool = [];
    for (let item of list) {
        cumulative += rarityChances[item.rarity] || 0;
        if (roll <= cumulative) pool.push(item);
    }
    return pool.length ? pool[Math.floor(Math.random() * pool.length)] : list[Math.floor(Math.random() * list.length)];
}

// Command handler
client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;
    const args = message.content.split(/ +/);
    const cmd = args.shift().toLowerCase();

    const userId = message.author.id;
    if (!db[userId]) db[userId] = { spins: { clan: 10, element: 10, trait: 5 }, finalized: { clan: null, element: [], trait: null } };

    if (cmd === '!clan') {
        if (db[userId].spins.clan <= 0) return message.reply('❌ You have no clan spins left!');
        const item = spinItem(clans);
        db[userId].spins.clan--;
        saveDB();
        const embed = new EmbedBuilder()
            .setTitle('🎲 Clan Spin')
            .setDescription(`You spun: ${item.emoji} **${item.name}** (${item.rarity})\nSpins left: ${db[userId].spins.clan}`)
            .setColor('Blue');
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('finalize_clan').setLabel('Finalize').setStyle(ButtonStyle.Primary)
        );
        await message.reply({ embeds: [embed], components: [row] });
    }

    if (cmd === '!element') {
        if (db[userId].spins.element <= 0) return message.reply('❌ You have no element spins left!');
        const item = spinItem(elements);
        db[userId].spins.element--;
        saveDB();
        const embed = new EmbedBuilder()
            .setTitle('🎲 Element Spin')
            .setDescription(`You spun: ${item.emoji} **${item.name}** (${item.rarity})\nSpins left: ${db[userId].spins.element}`)
            .setColor('Green');
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('finalize_element').setLabel('Finalize').setStyle(ButtonStyle.Primary)
        );
        await message.reply({ embeds: [embed], components: [row] });
    }

    if (cmd === '!trait') {
        if (db[userId].spins.trait <= 0) return message.reply('❌ You have no trait spins left!');
        const item = spinItem(traits);
        db[userId].spins.trait--;
        saveDB();
        const embed = new EmbedBuilder()
            .setTitle('🎲 Trait Spin')
            .setDescription(`You spun: ${item.emoji} **${item.name}** (${item.rarity})\nSpins left: ${db[userId].spins.trait}`)
            .setColor('Purple');
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('finalize_trait').setLabel('Finalize').setStyle(ButtonStyle.Primary)
        );
        await message.reply({ embeds: [embed], components: [row] });
    }

    if (cmd === '!check') {
        const user = message.mentions.users.first() || message.author;
        if (!db[user.id]) return message.reply('❌ User has no finalized specs yet!');
        const f = db[user.id].finalized;
        const embed = new EmbedBuilder()
            .setTitle(`📋 ${user.username}'s Specs`)
            .setDescription(`**Clan:** ${f.clan || 'None'}\n**Elements:** ${f.element.length ? f.element.join(', ') : 'None'}\n**Trait:** ${f.trait || 'None'}`)
            .setColor('Gold');
        message.reply({ embeds: [embed] });
    }

    if (cmd === '!cmds') {
        const embed = new EmbedBuilder()
            .setTitle('🛠️ Command List')
            .setDescription('!clan\n!element\n!trait\n!check @user\n!cmds')
            .setColor('DarkBlue');
        message.reply({ embeds: [embed] });
    }

    if (cmd === '!announce') {
        const content = args.join(' ');
        if (!content) return message.reply('❌ Provide a message to announce.');
        const embed = new EmbedBuilder().setDescription(content).setColor('Orange');
        message.channel.send({ embeds: [embed] });
    }
});

// Button handling for finalize
client.on(Events.InteractionCreate, async inter => {
    if (!inter.isButton()) return;
    const userId = inter.user.id;
    if (!db[userId]) db[userId] = { spins: { clan: 10, element: 10, trait: 5 }, finalized: { clan: null, element: [], trait: null } };

    if (inter.customId.startsWith('finalize_')) {
        const type = inter.customId.split('_')[1];
        const user = db[userId];
        if (!user.spins[type] && type !== 'element') return inter.reply({ content: `❌ You have no spins to finalize!`, ephemeral: true });
        if (type === 'element') {
            const lastSpin = elements[Math.floor(Math.random() * elements.length)];
            if (!user.finalized.element.includes(lastSpin.name)) {
                user.finalized.element.push(lastSpin.name);
                if (user.finalized.element.length > 2) user.finalized.element.shift();
            }
        } else {
            const lastSpin = type === 'clan' ? clans[Math.floor(Math.random() * clans.length)] : traits[Math.floor(Math.random() * traits.length)];
            user.finalized[type] = lastSpin.name;
        }
        saveDB();
        inter.update({ content: `✅ Your ${type} has been finalized!`, components: [], embeds: [] });
    }
});

client.login(process.env.DISCORD_TOKEN);
