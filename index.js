// index.js
import 'dotenv/config';
import { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Events } from 'discord.js';
import fs from 'fs';

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

// DATA: CLANS, ELEMENTS, TRAITS
const CLANS = {
    Mythical: ["Ōtsutsuki 🛸", "Kaguya 👑"],
    Legendary: ["Uchiha 🔥", "Senju 🌳", "Hyuga 👁️", "Uzumaki 🌀"],
    Epic: ["Yuki ❄️", "Hozuki 💧", "Hoshigaki 🌊", "Chinoike 🩸", "Jugo 🌿", "Kurama 🦊", "Sabaku 🏜️"],
    Rare: ["Shirogane ⚪", "Yotsuki 🟡", "Fūma 🐍", "Iburi 🐉", "Hatake ⚔️", "Kamizuru 🐦", "Sarutobi 🐒"],
    Common: ["Aburame 🐛", "Akimichi 🍙", "Nara 🦉", "Yamanaka 🌸", "Inuzuka 🐕", "Shimura 🦊", "Lee 🥋"]
};

const ELEMENTS = {
    Mythical: ["Yin ☯️", "Yang ☯️", "Chaos 🌌", "Order 🛡️"],
    Legendary: ["Wood 🌳"],
    Rare: ["Fire 🔥", "Water 💧", "Earth 🌍", "Wind 🌬️", "Lightning ⚡"],
};

const TRAITS = {
    Mythical: ["Clan Specialist 🧬"],
    Legendary: ["Analytical Eye 👁️", "Jutsu Amplification 🔥", "Kekkei Genkai Proficiency 💎"],
    Epic: ["Elemental Affinity Mastery 🌟", "Illusion/Genjutsu Potency 🌫️", "Iryojutsu Proficiency 💉"],
    Rare: ["Fuinjutsu Technique Expertise 🔒", "Scientist 🔬", "Superhuman Physique 💪"],
};

// USER DATABASE
let db = {};
const DB_FILE = './db.json';
if (fs.existsSync(DB_FILE)) db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));

function saveDB() {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// Weighted spin
function pickWeighted(pool, previous = []) {
    const roll = Math.random() * 100;
    let rarity;
    if (roll < 2) rarity = "Mythical";
    else if (roll < 10) rarity = "Legendary";
    else if (roll < 25) rarity = "Epic";
    else if (roll < 50) rarity = "Rare";
    else rarity = "Common";

    const items = pool[rarity] || [];
    const filtered = items.filter(i => !previous.includes(i));
    if (filtered.length === 0) return pickWeighted(pool, previous);

    const picked = filtered[Math.floor(Math.random() * filtered.length)];
    return { name: picked, rarity };
}

// Command Handler
client.on(Events.MessageCreate, async msg => {
    if (!msg.content.startsWith('!') || msg.author.bot) return;

    const args = msg.content.slice(1).split(/ +/);
    const command = args.shift().toLowerCase();

    // INIT USER DATA
    if (!db[msg.author.id]) db[msg.author.id] = { spins: { clan: [], element: [], trait: [] }, finalized: { clan: null, element: [], trait: null } };

    if (command === 'clan' || command === 'element' || command === 'trait') {
        const type = command;
        let spinsLeft = type === 'element' ? 10 : 10; // 10 for element and clan, 5 for trait
        if (type === 'trait') spinsLeft = 5;

        const previous = db[msg.author.id].spins[type].map(s => s.name);
        const picked = pickWeighted(type === 'clan' ? CLANS : type === 'element' ? ELEMENTS : TRAITS, previous);

        // DUPLICATE CHECK
        if (previous.includes(picked.name)) {
            msg.channel.send(`🔁 You spun a duplicate **${picked.name}**, extra spin granted!`);
            spinsLeft++;
        } else {
            db[msg.author.id].spins[type].push(picked);
            saveDB();
        }

        // Embed for spin
        const embed = new EmbedBuilder()
            .setTitle(`🎰 ${type.charAt(0).toUpperCase() + type.slice(1)} Spin!`)
            .setDescription(`You got **${picked.name}** (${picked.rarity})\nRemaining spins: ${spinsLeft}`)
            .setColor(0x00AE86);

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`finalize_${type}`)
                    .setLabel('Finalize')
                    .setStyle(ButtonStyle.Success)
            );

        await msg.channel.send({ embeds: [embed], components: [row] });
    }

    if (command === 'check') {
        const userId = args[0] ? args[0].replace(/[<@!>]/g, '') : msg.author.id;
        const user = db[userId];
        if (!user) return msg.channel.send('User not found!');

        const embed = new EmbedBuilder()
            .setTitle(`${msg.guild.members.cache.get(userId)?.user.username || 'User'} Specs`)
            .addFields(
                { name: 'Clan', value: user.finalized.clan || 'None', inline: true },
                { name: 'Elements', value: user.finalized.element.length ? user.finalized.element.join(', ') : 'None', inline: true },
                { name: 'Trait', value: user.finalized.trait || 'None', inline: true }
            )
            .setColor(0xFFD700);

        msg.channel.send({ embeds: [embed] });
    }
});

// Button interaction for finalizing
client.on(Events.InteractionCreate, async inter => {
    if (!inter.isButton()) return;
    const [action, type] = inter.customId.split('_');
    const user = db[inter.user.id];
    if (!user) return;

    if (action === 'finalize') {
        if (type === 'element') {
            if (!user.finalized.element.includes(user.spins.element[0]?.name)) {
                user.finalized.element.push(user.spins.element[0]?.name);
                if (user.finalized.element.length > 2) user.finalized.element.shift();
            }
        } else {
            user.finalized[type] = user.spins[type][0]?.name;
        }
        saveDB();
        inter.update({ content: `✅ You finalized your ${type}!`, components: [], embeds: [] });
    }
});

client.login(process.env.BOT_TOKEN);
