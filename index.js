// index.js
const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, StringSelectMenuBuilder, PermissionsBitField } = require('discord.js');
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
        const fileContent = fs.readFileSync(DATABASE_FILE, 'utf8');
        userData = fileContent ? JSON.parse(fileContent) : {};
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

// UI & THEME CONFIG
const RARITY_COLORS = { Mythical: 0xff00ff, Legendary: 0xffa500, Epic: 0x9400d3, Rare: 0x1e90ff, Common: 0x808080 };
const RARITY_EMOJI = { Mythical: "💎", Legendary: "🏆", Epic: "✨", Rare: "🔹", Common: "⚪" };

// RARITY WEIGHTS
const CLAN_RARITY_WEIGHTS = { Mythical: 1, Legendary: 8, Epic: 35, Rare: 65, Common: 35 };
const ELEMENT_RARITY_WEIGHTS = { Mythical: 0.1, Legendary: 5, Epic: 15, Rare: 75, Common: 35 };
const DEFAULT_RARITY_WEIGHTS = { Mythical: 1, Legendary: 5, Epic: 15, Rare: 30, Common: 49 };

// ---------------- UTILS ----------------
function saveData() { fs.writeFileSync(DATABASE_FILE, JSON.stringify(userData, null, 2)); }

function ensureUser(id) {
    if (!userData[id]) {
        userData[id] = { 
            spins: { clan: 15, element1: 6, element2: 6, trait: 3 }, 
            temp: { clan: [], element1: [], element2: [], trait: [] }, 
            finalized: { clan: null, element1: null, element2: null, trait: null } 
        };
    }
    if (!userData[id].spins) userData[id].spins = {};
    if (!userData[id].temp) userData[id].temp = {};
    if (!userData[id].finalized) userData[id].finalized = {};

    const defaults = { clan: 15, element1: 6, element2: 6, trait: 3 };
    for (const key in defaults) {
        if (userData[id].spins[key] === undefined) userData[id].spins[key] = defaults[key];
        if (!Array.isArray(userData[id].temp[key])) userData[id].temp[key] = [];
        if (userData[id].finalized[key] === undefined) userData[id].finalized[key] = null;
    }
}

function weightedRandom(arr, weights) {
    const pool = [];
    for (let obj of arr) {
        const weight = weights[obj.rarity] || 1;
        const count = Math.max(1, Math.round(weight * 10));
        for (let i = 0; i < count; i++) pool.push(obj);
    }
    return pool[Math.floor(Math.random() * pool.length)];
}

async function findUser(msg, args) {
    const mention = msg.mentions.users.first();
    if (mention) return mention;
    const id = args[0];
    if (id && /^\d{17,20}$/.test(id)) {
        try {
            return await client.users.fetch(id);
        } catch (err) {
            return null;
        }
    }
    return null;
}

// ---------------- SPIN COMMAND ----------------
async function spinCommand(msg, type) {
    try {
        const id = msg.author.id;
        ensureUser(id);
        
        if (userData[id].spins[type] <= 0) {
            const embed = new EmbedBuilder()
                .setTitle("❌ No Spins Left")
                .setDescription(`You have run out of **${type}** spins!`)
                .setColor(0xff0000);
            return msg.reply({ embeds: [embed] });
        }

        let weights = type === 'clan' ? CLAN_RARITY_WEIGHTS : type.startsWith('element') ? ELEMENT_RARITY_WEIGHTS : DEFAULT_RARITY_WEIGHTS;
        let pool = type === 'clan' ? CLANS : type.startsWith('element') ? ELEMENTS : TRAITS;

        let result;
        let attempts = 0;
        do {
            result = weightedRandom(pool, weights);
            attempts++;
        } while (userData[id].temp[type].filter(x => x.item === result.item).length >= 1 && attempts < 10);

        const lastResult = userData[id].temp[type][userData[id].temp[type].length - 1];
        const isBackToBackDupe = lastResult && lastResult.item === result.item;

        userData[id].temp[type].push(result);
        if (!isBackToBackDupe) userData[id].spins[type]--;

        saveData();

        const embed = new EmbedBuilder()
            .setTitle(`🎲 ${type.toUpperCase()} SPIN`)
            .setAuthor({ name: msg.author.username, iconURL: msg.author.displayAvatarURL() })
            .setColor(RARITY_COLORS[result.rarity] || 0x000000)
            .setDescription(`You spun: ${result.emoji} **${result.item}**\n**Rarity:** ${RARITY_EMOJI[result.rarity]} ${result.rarity}${isBackToBackDupe ? '\n\n*(Back-to-back Duplicate — spin refunded!)*' : ''}`)
            .addFields(
                { name: '🔋 Spins Remaining', value: `\`${userData[id].spins[type]}\``, inline: true },
                { name: '📝 Recent Results', value: userData[id].temp[type].slice(-5).map(x => `\`${x.item}\``).join(', ') || 'None', inline: false }
            )
            .setTimestamp()
            .setFooter({ text: 'Click Finalize to lock this result!' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`finalize_${type}`).setLabel('Finalize').setStyle(ButtonStyle.Success)
        );

        await msg.reply({ embeds: [embed], components: [row] });
    } catch (err) {
        console.error("Error in spin command:", err);
        msg.reply("❌ An error occurred during the spin.");
    }
}

// ---------------- INTERACTION HANDLER ----------------
client.on(Events.InteractionCreate, async interaction => {
    try {
        if (interaction.isButton()) {
            const [action, type] = interaction.customId.split('_');
            if (action === 'finalize') {
                const id = interaction.user.id;
                ensureUser(id);

                const lastItem = userData[id].temp[type][userData[id].temp[type].length - 1];
                if (!lastItem) return interaction.reply({ content: "❌ Nothing to finalize!", ephemeral: true });

                userData[id].finalized[type] = lastItem.item;
                userData[id].temp[type] = []; 
                saveData();

                const embed = new EmbedBuilder()
                    .setTitle("✅ Finalized!")
                    .setDescription(`Successfully locked in **${lastItem.item}** for your **${type}** slot.`)
                    .setColor(0x00ff00);

                await interaction.update({ embeds: [embed], components: [] });
            }
        }

        if (interaction.isStringSelectMenu()) {
            const [action, targetId, category, originalUserId] = interaction.customId.split('_');
            
            if (originalUserId && interaction.user.id !== originalUserId) {
                return interaction.reply({ content: "❌ You cannot interact with this menu!", ephemeral: true });
            }

            if (action === 'givespec-category') {
                const selectedCategory = interaction.values[0];
                let items = [];
                
                if (selectedCategory === 'clan') items = CLANS;
                else if (selectedCategory === 'element1' || selectedCategory === 'element2') items = ELEMENTS;
                else if (selectedCategory === 'trait') items = TRAITS;

                const menu = new StringSelectMenuBuilder()
                    .setCustomId(`givespec-item_${targetId}_${selectedCategory}_${interaction.user.id}`)
                    .setPlaceholder(`Choose a ${selectedCategory} to give...`)
                    .addOptions(items.slice(0, 25).map(i => ({
                        label: i.item,
                        description: `Rarity: ${i.rarity}`,
                        value: i.item,
                        emoji: i.emoji
                    })));

                const row = new ActionRowBuilder().addComponents(menu);
                await interaction.update({ content: `Now select the **${selectedCategory}** you want to give:`, components: [row] });
            }

            if (action === 'givespec-item') {
                const selectedItem = interaction.values[0];
                ensureUser(targetId);
                
                userData[targetId].finalized[category] = selectedItem;
                saveData();

                const targetUser = await client.users.fetch(targetId);
                await interaction.update({ 
                    content: `✅ Successfully gave **${selectedItem}** (${category}) to **${targetUser.username}**!`, 
                    components: [],
                    embeds: []
                });
            }
        }
    } catch (err) {
        console.error("Error in interaction:", err);
    }
});

// ---------------- COMMAND HANDLER ----------------
client.on('messageCreate', async msg => {
    if (!msg.content.startsWith('!') || msg.author.bot) return;
    
    try {
        const [cmd, ...args] = msg.content.slice(1).split(' ');
        const id = msg.author.id;
        ensureUser(id);

        if (cmd === 'clan' || cmd === 'element1' || cmd === 'element2' || cmd === 'trait') {
            return await spinCommand(msg, cmd);
        }

        if (cmd === 'givespec') {
            if (!msg.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
                return msg.reply("❌ Only Staff (Administrators) can use this command!");
            }

            const target = await findUser(msg, args);
            if (!target) return msg.reply("❌ Please mention a user or provide a valid ID: `!givespec @User` or `!givespec ID`.");

            const menu = new StringSelectMenuBuilder()
                .setCustomId(`givespec-category_${target.id}_none_${msg.author.id}`)
                .setPlaceholder('Choose a category to give...')
                .addOptions([
                    { label: 'Clan', value: 'clan', emoji: '⛩️' },
                    { label: 'Element 1', value: 'element1', emoji: '🔥' },
                    { label: 'Element 2', value: 'element2', emoji: '🌊' },
                    { label: 'Trait', value: 'trait', emoji: '✨' }
                ]);

            const row = new ActionRowBuilder().addComponents(menu);
            return await msg.reply({ content: `Giving a spec to **${target.username}** (${target.id}). First, choose a category:`, components: [row] });
        }

        if (cmd === 'check') {
            let target = await findUser(msg, args) || msg.author;
            ensureUser(target.id);
            const data = userData[target.id].finalized;
            
            const embed = new EmbedBuilder()
                .setTitle(`📜 ${target.username.toUpperCase()}'S SPECS`)
                .setThumbnail(target.displayAvatarURL())
                .setColor(0x2f3136)
                .addFields(
                    { name: '⛩️ Clan', value: `\`${data.clan || 'None'}\``, inline: true },
                    { name: '✨ Trait', value: `\`${data.trait || 'None'}\``, inline: true },
                    { name: '\u200B', value: '\u200B', inline: false },
                    { name: '🔥 Element 1', value: `\`${data.element1 || 'None'}\``, inline: true },
                    { name: '🌊 Element 2', value: `\`${data.element2 || 'None'}\``, inline: true }
                )
                .setFooter({ text: "Use !clan, !element1, !element2, or !trait to spin!" })
                .setTimestamp();

            return await msg.reply({ embeds: [embed] });
        }

        if (cmd === 'cmds') {
            const embed = new EmbedBuilder()
                .setTitle("🎮 BOT COMMANDS")
                .setColor(0x7289da)
                .setDescription("Here are the available commands for the bot:")
                .addFields(
                    { name: '🎲 Spinning', value: "`!clan`, `!element1`, `!element2`, `!trait`", inline: false },
                    { name: '📜 Info', value: "`!check @User`, `!cmds`", inline: false },
                    { name: '🎁 Staff', value: "`!givespec @User`, `!announce [message]`", inline: false }
                );
            return await msg.reply({ embeds: [embed] });
        }

        if (cmd === 'announce') {
            const text = args.join(' ');
            if (!text) return await msg.reply('❌ Provide a message to announce.');
            
            // Delete original command message
            try { await msg.delete(); } catch (e) { console.error("Could not delete announce command message:", e); }
            
            // Send clean embed with NO title or header
            const embed = new EmbedBuilder().setDescription(text).setColor(0xffc107);
            return await msg.channel.send({ embeds: [embed] });
        }
    } catch (err) {
        console.error("Error in message handler:", err);
    }
});

client.once('ready', () => { console.log(`Logged in as ${client.user.tag}!`); });
client.login(process.env.BOT_TOKEN).catch(err => { console.error("Failed to login:", err); });
