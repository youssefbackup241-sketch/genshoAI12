// index.js
require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, Events } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ]
});

// === Data ===
const clans = [
    { name: "Ōtsutsuki", rarity: "Mythical", emoji: "👑" },
    { name: "Kaguya", rarity: "Mythical", emoji: "🌀" },
    { name: "Uchiha", rarity: "Legendary", emoji: "🔥" },
    { name: "Senju", rarity: "Legendary", emoji: "🌳" },
    { name: "Hyuga", rarity: "Legendary", emoji: "👁️" },
    { name: "Uzumaki", rarity: "Legendary", emoji: "🌀" },
    { name: "Yuki", rarity: "Epic", emoji: "❄️" },
    { name: "Hozuki", rarity: "Epic", emoji: "💧" },
    { name: "Hoshigaki", rarity: "Epic", emoji: "🌊" },
    { name: "Chinoike", rarity: "Epic", emoji: "🩸" },
    { name: "Jugo", rarity: "Epic", emoji: "🍃" },
    { name: "Kurama", rarity: "Epic", emoji: "🦊" },
    { name: "Sabaku", rarity: "Epic", emoji: "🏜️" },
    { name: "Shirogane", rarity: "Rare", emoji: "⚪" },
    { name: "Yotsuki", rarity: "Rare", emoji: "🔷" },
    { name: "Fūma", rarity: "Rare", emoji: "🗡️" },
    { name: "Iburi", rarity: "Rare", emoji: "💨" },
    { name: "Hatake", rarity: "Rare", emoji: "🧢" },
    { name: "Kamizuru", rarity: "Rare", emoji: "🕊️" },
    { name: "Sarutobi", rarity: "Rare", emoji: "🐒" },
    { name: "Aburame", rarity: "Common", emoji: "🐛" },
    { name: "Akimichi", rarity: "Common", emoji: "🍩" },
    { name: "Nara", rarity: "Common", emoji: "🌲" },
    { name: "Yamanaka", rarity: "Common", emoji: "🧠" },
    { name: "Inuzuka", rarity: "Common", emoji: "🐕" },
    { name: "Shimura", rarity: "Common", emoji: "👴" },
    { name: "Lee", rarity: "Common", emoji: "🥋" }
];

const elements = [
    { name: "Yin", rarity: "Mythical", emoji: "☯️" },
    { name: "Yang", rarity: "Mythical", emoji: "☯️" },
    { name: "Chaos", rarity: "Mythical", emoji: "🌌" },
    { name: "Order", rarity: "Mythical", emoji: "⚖️" },
    { name: "Wood", rarity: "Rare", emoji: "🌳" },
    { name: "Fire", rarity: "Rare", emoji: "🔥" },
    { name: "Water", rarity: "Rare", emoji: "💧" },
    { name: "Earth", rarity: "Rare", emoji: "🌍" },
    { name: "Wind", rarity: "Rare", emoji: "💨" },
    { name: "Lightning", rarity: "Rare", emoji: "⚡" }
];

const traits = [
    { name: "Analytical Eye", rarity: "Legendary", emoji: "👁️‍🗨️" },
    { name: "Clan Specialist", rarity: "Mythical", emoji: "🛡️" },
    { name: "Jutsu Amplification", rarity: "Legendary", emoji: "💥" },
    { name: "Elemental Affinity Mastery", rarity: "Epic", emoji: "🌐" },
    { name: "Illusion/Genjutsu Potency", rarity: "Epic", emoji: "🎭" },
    { name: "Kekkei Genkai Proficiency", rarity: "Legendary", emoji: "🔮" },
    { name: "Fuinjutsu Technique Expertise", rarity: "Rare", emoji: "📜" },
    { name: "Iryojutsu Proficiency", rarity: "Epic", emoji: "💉" },
    { name: "Scientist", rarity: "Rare", emoji: "🔬" },
    { name: "Superhuman Physique", rarity: "Rare", emoji: "💪" }
];

// === User Data ===
let userData = {}; // { userId: { clan: "", elements: [], trait: "", spins: { clan: 10, element: 10, trait: 5 } } }

// === Weighted Random Function ===
function weightedRandom(array) {
    const pool = [];
    for (let item of array) {
        let weight;
        switch (item.rarity) {
            case "Mythical": weight = 1; break;
            case "Legendary": weight = 5; break;
            case "Epic": weight = 15; break;
            case "Rare": weight = 25; break;
            case "Common": weight = 54; break;
        }
        for (let i = 0; i < weight; i++) pool.push(item);
    }
    return pool[Math.floor(Math.random() * pool.length)];
}

// === Utility Functions ===
function getUser(id) {
    if (!userData[id]) {
        userData[id] = { clan: null, elements: [], trait: null, spins: { clan: 10, element: 10, trait: 5 } };
    }
    return userData[id];
}

// === Commands ===
client.on(Events.MessageCreate, async message => {
    if (message.author.bot) return;

    const args = message.content.trim().split(/\s+/);
    const cmd = args.shift().toLowerCase();

    const user = getUser(message.author.id);

    // === Spin Clan ===
    if (cmd === "!clan") {
        if (user.spins.clan <= 0) return message.reply("No clan spins left!");
        const result = weightedRandom(clans);

        // Duplicate check
        if (user.clan === result.name) user.spins.clan++; // extra spin
        else user.clan = result.name;

        user.spins.clan--;

        const embed = new EmbedBuilder()
            .setTitle(`Clan Spin 🎲`)
            .setDescription(`You spun: ${result.emoji} **${result.name}**\nSpins left: ${user.spins.clan}`)
            .setColor(0x00FF00);
        message.reply({ embeds: [embed] });
    }

    // === Spin Element ===
    if (cmd === "!element") {
        if (user.spins.element <= 0) return message.reply("No element spins left!");
        const result = weightedRandom(elements);

        // Duplicate check
        if (user.elements.includes(result.name)) user.spins.element++; // extra spin
        else {
            if (user.elements.length < 2) user.elements.push(result.name);
        }

        user.spins.element--;

        const embed = new EmbedBuilder()
            .setTitle(`Element Spin 🎲`)
            .setDescription(`You spun: ${result.emoji} **${result.name}**\nSpins left: ${user.spins.element}`)
            .setColor(0x0099FF);
        message.reply({ embeds: [embed] });
    }

    // === Spin Trait ===
    if (cmd === "!trait") {
        if (user.spins.trait <= 0) return message.reply("No trait spins left!");
        const result = weightedRandom(traits);

        // Duplicate check
        if (user.trait === result.name) user.spins.trait++; // extra spin
        else user.trait = result.name;

        user.spins.trait--;

        const embed = new EmbedBuilder()
            .setTitle(`Trait Spin 🎲`)
            .setDescription(`You spun: ${result.emoji} **${result.name}**\nSpins left: ${user.spins.trait}`)
            .setColor(0xFF9900);
        message.reply({ embeds: [embed] });
    }

    // === Check ===
    if (cmd === "!check") {
        const embed = new EmbedBuilder()
            .setTitle(`${message.author.username}'s Specs 📝`)
            .setColor(0xFFFF00)
            .setDescription(`**Clan:** ${user.clan || "None"}\n**Elements:** ${user.elements.join(", ") || "None"}\n**Trait:** ${user.trait || "None"}`);
        message.reply({ embeds: [embed] });
    }

    // === Announce ===
    if (cmd === "!announce") {
        const content = args.join(" ");
        if (!content) return message.reply("Please provide a message to announce!");
        const embed = new EmbedBuilder()
            .setDescription(content)
            .setColor(0xFF00FF);
        message.channel.send({ embeds: [embed] });
    }

    // === Commands List ===
    if (cmd === "!cmds") {
        const embed = new EmbedBuilder()
            .setTitle("Available Commands ⚡")
            .setColor(0x00FFFF)
            .setDescription("!clan - Spin a clan\n!element - Spin an element (max 2)\n!trait - Spin a trait\n!check - Check your finalized specs\n!announce <msg> - Send an announcement");
        message.reply({ embeds: [embed] });
    }
});

client.login(process.env.DISCORD_TOKEN);
