// index.js
const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events } = require('discord.js');
const fs = require('fs');
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
    partials: [Partials.Channel]
});
require('dotenv').config();

const DATABASE_FILE = './database.json';
let userData = {};
if (fs.existsSync(DATABASE_FILE)) {
    try {
        userData = JSON.parse(fs.readFileSync(DATABASE_FILE));
    } catch (e) {
        console.error("Failed to parse database.json, starting fresh.", e);
        userData = {};
    }
}

// ----- CONFIG -----
const CLANS = [
    { item: "Ōtsutsuki", rarity: "Mythical", emoji: "👁️" },
    { item: "Kaguya", rarity: "Mythical", emoji: "🪐" },
    { item: "Uchiha", rarity: "Legendary", emoji: "🔥" },
    { item: "Senju", rarity: "Legendary", emoji: "🌳" },
    { item: "Hyuga", rarity: "Legendary", emoji: "👁️" },
    { item: "Uzumaki", rarity: "Legendary", emoji: "🌀" },
    { item: "Yuki", rarity: "Epic", emoji: "❄️" },
    { item: "Hozuki", rarity: "Epic", emoji: "💧" },
    { item: "Hoshigaki", rarity: "Epic", emoji: "🦈" },
    { item: "Chinoike", rarity: "Epic", emoji: "🩸" },
    { item: "Jugo", rarity: "Epic", emoji: "🌿" },
    { item: "Kurama", rarity: "Epic", emoji: "🦊" },
    { item: "Sabaku", rarity: "Epic", emoji: "🏜️" },
    { item: "Shirogane", rarity: "Rare", emoji: "⚪" },
    { item: "Yotsuki", rarity: "Rare", emoji: "🟡" },
    { item: "Fūma", rarity: "Rare", emoji: "🪓" },
    { item: "Iburi", rarity: "Rare", emoji: "💨" },
    { item: "Hatake", rarity: "Rare", emoji: "👒" },
    { item: "Kamizuru", rarity: "Rare", emoji: "🦅" },
    { item: "Sarutobi", rarity: "Rare", emoji: "🐒" },
    { item: "Aburame", rarity: "Common", emoji: "🐜" },
    { item: "Akimichi", rarity: "Common", emoji: "🍙" },
    { item: "Nara", rarity: "Common", emoji: "🦌" },
    { item: "Yamanaka", rarity: "Common", emoji: "🧠" },
    { item: "Inuzuka", rarity: "Common", emoji: "🐕" },
    { item: "Shimura", rarity: "Common", emoji: "🪓" },
    { item: "Lee", rarity: "Common", emoji: "🥋" }
];

const ELEMENTS = [
    { item: "Fire", rarity: "Rare", emoji: "🔥" },
    { item: "Water", rarity: "Rare", emoji: "💧" },
    { item: "Earth", rarity: "Rare", emoji: "🌍" },
    { item: "Wind", rarity: "Rare", emoji: "🌪️" },
    { item: "Lightning", rarity: "Rare", emoji: "⚡" },
    { item: "Wood", rarity: "Legendary", emoji: "🌳" },
    { item: "Yin", rarity: "Mythical", emoji: "🌑" },
    { item: "Yang", rarity: "Mythical", emoji: "🌕" },
    { item: "Chaos", rarity: "Mythical", emoji: "🌀" },
    { item: "Order", rarity: "Mythical", emoji: "⚖️" }
];

const TRAITS = [
    { item: "Analytical Eye", rarity: "Legendary", emoji: "👁️" },
    { item: "Jutsu Amplification", rarity: "Legendary", emoji: "💥" },
    { item: "Elemental Affinity Mastery", rarity: "Epic", emoji: "🪄" },
    { item: "Illusion/Genjutsu Potency", rarity: "Epic", emoji: "🌫️" },
    { item: "Kekkei Genkai Proficiency", rarity: "Legendary", emoji: "🧬" },
    { item: "Fuinjutsu Technique Expertise", rarity: "Rare", emoji: "📜" },
    { item: "Iryojutsu Proficiency", rarity: "Epic", emoji: "💉" },
    { item: "Scientist", rarity: "Rare", emoji: "🧪" },
    { item: "Superhuman Physique", rarity: "Rare", emoji: "💪" }
];

// Rarity weights for Clan spins (higher Rare/Epic)
const CLAN_RARITY_WEIGHTS = { Mythical: 1, Legendary: 5, Epic: 25, Rare: 50, Common: 40 };

// Rarity weights for Element spins (very low Mythical)
const ELEMENT_RARITY_WEIGHTS = { Mythical: 0.1, Legendary: 5, Epic: 15, Rare: 70, Common: 40 };

// Default weights for Traits
const DEFAULT_RARITY_WEIGHTS = { Mythical: 1, Legendary: 5, Epic: 15, Rare: 30, Common: 49 };

const rarityEmoji = { Mythical: "💎", Legendary: "🏆", Epic: "✨", Rare: "🔹", Common: "⚪" };

// ---------------- UTILS ----------------
function saveData() { fs.writeFileSync(DATABASE_FILE, JSON.stringify(userData, null, 2)); }

function ensureUser(id) {
    if (!userData[id]) {
        userData[id] = { 
            spins: { clan: 15, element: 6, trait: 3 }, // Updated initial spin counts
            temp: { clan: [], element: [], trait: [] }, 
            finalized: { clan: null, element: [], trait: null } 
        };
    }

    // --- HEAL OLD/MALFORMED DATA ---
    if (!userData[id].spins) userData[id].spins = { clan: 15, element: 6, trait: 3 };
    if (!userData[id].temp) userData[id].temp = { clan: [], element: [], trait: [] };
    if (!userData[id].finalized) userData[id].finalized = { clan: null, element: [], trait: null };

    // Ensure finalized.element is ALWAYS an array (prevents crash in !check)
    if (!Array.isArray(userData[id].finalized.element)) {
        userData[id].finalized.element = [];
    }
}

function weightedRandom(arr, weights) {
    const pool = [];
    for (let obj of arr) {
        const weight = weights[obj.rarity] || 1;
        // Since we have fractional weights (0.1), we scale everything up by 10
        for (let i = 0; i < Math.max(1, Math.round(weight * 10)); i++) pool.push(obj);
    }
    return pool[Math.floor(Math.random() * pool.length)];
}

// ---------------- SPIN COMMAND ----------------
async function spinCommand(msg, type) {
    const id = msg.author.id;
    ensureUser(id);
    
    if (userData[id].spins[type] <= 0) return msg.reply(`❌ No ${type} spins left!`);

    // Determine weights based on spin type
    let weights;
    if (type === 'clan') weights = CLAN_RARITY_WEIGHTS;
    else if (type === 'element') weights = ELEMENT_RARITY_WEIGHTS;
    else weights = DEFAULT_RARITY_WEIGHTS;

    // Guard against duplicate result spam (keeps things fair)
    const maxDupesInTemp = type === 'element' ? 2 : 1;
    let result;
    let attempts = 0;
    do {
        result = weightedRandom(type === 'clan' ? CLANS : type === 'element' ? ELEMENTS : TRAITS, weights);
        attempts++;
    } while (userData[id].temp[type].filter(x => x.item === result.item).length >= maxDupesInTemp && attempts < 10);

    // Back-to-back refund logic
    const lastResult = userData[id].temp[type][userData[id].temp[type].length - 1];
    const isBackToBackDupe = lastResult && lastResult.item === result.item;

    userData[id].temp[type].push(result);

    if (!isBackToBackDupe) {
        userData[id].spins[type]--;
    }

    saveData();

    const embed = new EmbedBuilder()
        .setTitle(`🎲 ${type.toUpperCase()} Spin Result`)
        .setColor({ Mythical: 0xff00ff, Legendary: 0xffa500, Epic: 0xff4500, Rare: 0x1e90ff, Common: 0xaaaaaa }[result.rarity] || 0x000000)
        .setDescription(`${rarityEmoji[result.rarity] || '❓'} **${result.item}** (${result.rarity})${isBackToBackDupe ? '\n*(Back-to-back Duplicate — spin refunded!)*' : ''}`)
        .addFields(
            { name: 'Spins left', value: `${userData[id].spins[type]}`, inline: true },
            { name: 'Temp results', value: userData[id].temp[type].map(x => `${rarityEmoji[x.rarity] || ''} ${x.item}`).join(', ') || 'None', inline: false }
        )
        .setFooter({ text: 'Click Finalize to lock your spin!' });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`finalize_${type}`).setLabel('Finalize').setStyle(ButtonStyle.Primary)
    );

    msg.reply({ embeds: [embed], components: [row] });
}

// ---------------- BUTTON HANDLER ----------------
client.on(Events.InteractionCreate, async interaction => {
    if (!interaction.isButton()) return;

    const [action, type] = interaction.customId.split('_');
    if (action === 'finalize') {
        const id = interaction.user.id;
        ensureUser(id);

        if (type === 'element') {
            // Take the first 2 unique elements from temp, or just the first 2 if not enough unique
            const uniqueItems = [];
            for (const x of userData[id].temp[type]) {
                if (!uniqueItems.includes(x.item)) uniqueItems.push(x.item);
                if (uniqueItems.length === 2) break;
            }
            
            // If we don't have 2 unique items, just take what we have
            if (uniqueItems.length < 2 && userData[id].temp[type].length > 0) {
                userData[id].finalized[type] = userData[id].temp[type].slice(0, 2).map(x => x.item);
            } else {
                userData[id].finalized[type] = uniqueItems;
            }
        } else {
            const lastItem = userData[id].temp[type][userData[id].temp[type].length - 1];
            userData[id].finalized[type] = lastItem ? lastItem.item : null;
        }

        userData[id].temp[type] = []; // Clear temp list
        saveData();

        await interaction.update({ content: `✅ You finalized your ${type}!`, embeds: [], components: [] });
    }
});

// ---------------- CHECK COMMAND ----------------
client.on('messageCreate', async msg => {
    if (!msg.content.startsWith('!') || msg.author.bot) return;
    const [cmd, ...args] = msg.content.slice(1).split(' ');

    const id = msg.author.id;
    ensureUser(id);

    if (cmd === 'clan' || cmd === 'element' || cmd === 'trait') return spinCommand(msg, cmd);

    if (cmd === 'check') {
        try {
            let target = msg.mentions.users.first() || msg.author;
            ensureUser(target.id);
            
            const data = userData[target.id].finalized;
            
            const clan = data.clan || 'None';
            const trait = data.trait || 'None';
            
            let elements = 'None';
            if (Array.isArray(data.element) && data.element.length > 0) {
                elements = data.element.join(', ');
            }

            const embed = new EmbedBuilder()
                .setTitle(`📜 ${target.username}'s Specs`)
                .setColor(0x00ff00)
                .addFields(
                    { name: 'Clan', value: String(clan), inline: true },
                    { name: 'Elements', value: String(elements), inline: true },
                    { name: 'Trait', value: String(trait), inline: true }
                );

            return msg.reply({ embeds: [embed] });
        } catch (err) {
            console.error("Error in !check command:", err);
            return msg.reply("❌ An error occurred while checking specs.");
        }
    }

    if (cmd === 'cmds') {
        return msg.reply(`**Commands:** !clan !element !trait !check @User !cmds !announce [message]`);
    }

    if (cmd === 'announce') {
        const text = args.join(' ');
        if (!text) return msg.reply('❌ Provide a message to announce.');
        const embed = new EmbedBuilder().setDescription(text).setColor(0xffc107);
        return msg.reply({ embeds: [embed] });
    }
});

// ---------------- LOGIN ----------------
client.login(process.env.BOT_TOKEN);
