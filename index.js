// index.js
require('dotenv').config();
const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

let userData = {};
const DB_FILE = './database.json';

// Load database
if (fs.existsSync(DB_FILE)) userData = JSON.parse(fs.readFileSync(DB_FILE));

// Utilities
function saveData() { fs.writeFileSync(DB_FILE, JSON.stringify(userData, null, 2)); }
function ensureUser(id) { 
    if (!userData[id]) userData[id] = { spins: { clan:10, element:10, trait:5 }, finalized: { clan:null, element:[], trait:null }, temp:{ clan:[], element:[], trait:[] } }; 
}

// Weighted random
function weightedRandom(arr) {
    const total = arr.reduce((sum, x) => sum + x.weight, 0);
    let rnd = Math.random() * total;
    for (let i of arr) {
        if (rnd < i.weight) return i;
        rnd -= i.weight;
    }
}

// Data
const CLANS = [
    { item:'Ōtsutsuki', rarity:'Mythical', emoji:'👁️', weight:1 },
    { item:'Uchiha', rarity:'Legendary', emoji:'🔥', weight:5 },
    { item:'Senju', rarity:'Legendary', emoji:'🌲', weight:5 },
    { item:'Hyuga', rarity:'Legendary', emoji:'👀', weight:5 },
    { item:'Uzumaki', rarity:'Legendary', emoji:'🌀', weight:5 },
    { item:'Yuki', rarity:'Epic', emoji:'❄️', weight:10 },
    { item:'Hozuki', rarity:'Epic', emoji:'💧', weight:10 },
    { item:'Hoshigaki', rarity:'Epic', emoji:'🦈', weight:10 },
    { item:'Chinoike', rarity:'Epic', emoji:'🩸', weight:10 },
    { item:'Jugo', rarity:'Epic', emoji:'🟣', weight:10 },
    { item:'Kurama', rarity:'Epic', emoji:'🦊', weight:10 },
    { item:'Sabaku', rarity:'Epic', emoji:'🏜️', weight:10 },
    { item:'Shirogane', rarity:'Rare', emoji:'⚪', weight:20 },
    { item:'Yotsuki', rarity:'Rare', emoji:'🟡', weight:20 },
    { item:'Fūma', rarity:'Rare', emoji:'⚫', weight:20 },
    { item:'Iburi', rarity:'Rare', emoji:'🟤', weight:20 },
    { item:'Hatake', rarity:'Rare', emoji:'🌿', weight:20 },
    { item:'Kamizuru', rarity:'Rare', emoji:'🦋', weight:20 },
    { item:'Sarutobi', rarity:'Rare', emoji:'🐒', weight:20 },
    { item:'Aburame', rarity:'Common', emoji:'🪲', weight:50 },
    { item:'Akimichi', rarity:'Common', emoji:'🍗', weight:50 },
    { item:'Nara', rarity:'Common', emoji:'🦝', weight:50 },
    { item:'Yamanaka', rarity:'Common', emoji:'🧠', weight:50 },
    { item:'Inuzuka', rarity:'Common', emoji:'🐕', weight:50 },
    { item:'Shimura', rarity:'Common', emoji:'🛡️', weight:50 },
    { item:'Lee', rarity:'Common', emoji:'🥋', weight:50 }
];

const ELEMENTS = [
    { item:'Fire', rarity:'Rare', emoji:'🔥', weight:20 },
    { item:'Water', rarity:'Rare', emoji:'💧', weight:20 },
    { item:'Earth', rarity:'Rare', emoji:'🌍', weight:20 },
    { item:'Wind', rarity:'Rare', emoji:'🌪️', weight:20 },
    { item:'Lightning', rarity:'Rare', emoji:'⚡', weight:20 },
    { item:'Wood', rarity:'Legendary', emoji:'🌳', weight:5 },
    { item:'Yin', rarity:'Mythical', emoji:'☯️', weight:1 },
    { item:'Yang', rarity:'Mythical', emoji:'☯️', weight:1 },
    { item:'Chaos', rarity:'Mythical', emoji:'🌀', weight:1 },
    { item:'Order', rarity:'Mythical', emoji:'📜', weight:1 }
];

const TRAITS = [
    { item:'Analytical Eye', rarity:'Legendary', emoji:'👁️', weight:5 },
    { item:'Jutsu Amplification', rarity:'Legendary', emoji:'⚡', weight:5 },
    { item:'Elemental Affinity Mastery', rarity:'Epic', emoji:'🔥', weight:10 },
    { item:'Illusion/Genjutsu Potency', rarity:'Epic', emoji:'🌀', weight:10 },
    { item:'Kekkei Genkai Proficiency', rarity:'Legendary', emoji:'🧬', weight:5 },
    { item:'Fuinjutsu Technique Expertise', rarity:'Rare', emoji:'📦', weight:20 },
    { item:'Iryojutsu Proficiency', rarity:'Epic', emoji:'💉', weight:10 },
    { item:'Scientist', rarity:'Rare', emoji:'🔬', weight:20 },
    { item:'Superhuman Physique', rarity:'Rare', emoji:'💪', weight:20 }
];

// Spin function
async function spin(msg, type) {
    const id = msg.author.id;
    ensureUser(id);
    if (userData[id].spins[type] <= 0) return msg.reply(`❌ No ${type} spins left!`);

    let result, attempts = 0;
    const list = type === 'clan' ? CLANS : type === 'element' ? ELEMENTS : TRAITS;
    do {
        result = weightedRandom(list);
        attempts++;
    } while (userData[id].temp[type].filter(x => x.item === result.item).length >= 2 && attempts < 10);

    if (userData[id].temp[type].some(x => x.item === result.item)) userData[id].spins[type]++; // +1 spin for dupe

    userData[id].temp[type].push(result);
    userData[id].spins[type]--;
    saveData();

    const colors = { clan: 0xffa500, element: 0x1e90ff, trait: 0x8a2be2 };
    const embed = new EmbedBuilder()
        .setTitle(`🎲 ${type.toUpperCase()} Spin Result`)
        .setColor(colors[type])
        .setDescription(`${result.emoji} **${result.item}** (${result.rarity})`)
        .addFields(
            { name: '🕹️ Spins Left', value: `${userData[id].spins.clan} 🏯 | ${userData[id].spins.element} 🔥 | ${userData[id].spins.trait} 💎`, inline:false },
            { name: '📝 Temporary Results', value: userData[id].temp[type].map(x => `${x.emoji} ${x.item} (${x.rarity})`).join('\n') || 'None', inline:false }
        )
        .setFooter({ text: 'Click the button below to finalize this category!' });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`finalize_${type}`)
            .setLabel('Finalize')
            .setStyle(ButtonStyle.Primary)
    );

    msg.reply({ embeds: [embed], components: [row] });
}

// Button interaction
client.on('interactionCreate', async interaction => {
    if (!interaction.isButton()) return;
    const id = interaction.user.id;
    ensureUser(id);
    const type = interaction.customId.replace('finalize_', '');
    if (!['clan','element','trait'].includes(type)) return;
    
    // Finalize
    if (type === 'element') {
        userData[id].finalized.element = Array.from(new Set(userData[id].temp.element)).slice(0,2);
        userData[id].temp.element = [];
    } else {
        userData[id].finalized[type] = userData[id].temp[type][0] || null;
        userData[id].temp[type] = [];
    }
    saveData();
    await interaction.update({ content:`✅ Finalized your ${type}!`, embeds:[], components:[] });
});

// Commands
client.on('messageCreate', async msg => {
    if (msg.author.bot) return;
    const id = msg.author.id;
    ensureUser(id);
    const args = msg.content.trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    if (cmd === '!clan') spin(msg,'clan');
    if (cmd === '!element') spin(msg,'element');
    if (cmd === '!trait') spin(msg,'trait');
    if (cmd === '!check') {
        const data = userData[id].finalized;
        const embed = new EmbedBuilder()
            .setTitle(`📝 ${msg.author.username}'s Specs`)
            .setColor(0x00ff00)
            .addFields(
                { name:'🏯 Clan', value: data.clan ? `${data.clan.emoji} ${data.clan.item}` : 'None', inline:true },
                { name:'🔥 Element', value: data.element.length ? data.element.map(x => `${x.emoji} ${x.item}`).join('\n') : 'None', inline:true },
                { name:'💎 Trait', value: data.trait ? `${data.trait.emoji} ${data.trait.item}` : 'None', inline:true }
            );
        msg.reply({ embeds:[embed] });
    }
    if (cmd === '!announce') {
        const text = args.join(' ');
        const embed = new EmbedBuilder()
            .setColor(0xff0000)
            .setDescription(text);
        msg.channel.send({ embeds:[embed] });
    }
    if (cmd === '!cmds') {
        msg.reply('Commands: !clan, !element, !trait, !check, !announce, !cmds');
    }
});

client.login(process.env.DISCORD_TOKEN);
