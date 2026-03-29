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
    // Mythical
    { item: "Ōtsutsuki", rarity: "Mythical", emoji: "👁️" },
    { item: "Kaguya", rarity: "Mythical", emoji: "🪐" },
    
    // Legendary
    { item: "Uchiha", rarity: "Legendary", emoji: "🔥" },
    { item: "Senju", rarity: "Legendary", emoji: "🌳" },
    { item: "Hyuga", rarity: "Legendary", emoji: "👁️" },
    { item: "Uzumaki", rarity: "Legendary", emoji: "🌀" },
    
    // Epic
    { item: "Chinoike", rarity: "Epic", emoji: "🩸" },
    { item: "Jugo", rarity: "Epic", emoji: "🌿" },
    { item: "Kurama", rarity: "Epic", emoji: "🦊" },
    { item: "Lee", rarity: "Epic", emoji: "🥋" },
    { item: "Yuki", rarity: "Epic", emoji: "❄️" },
    { item: "Yamanaka", rarity: "Epic", emoji: "🧠" },
    
    // Rare
    { item: "Aburame", rarity: "Rare", emoji: "🐜" },
    { item: "Yotsuki", rarity: "Rare", emoji: "🟡" },
    { item: "Fūma", rarity: "Rare", emoji: "🪓" },
    { item: "Iburi", rarity: "Rare", emoji: "💨" },
    { item: "Hatake", rarity: "Rare", emoji: "👒" },
    { item: "Akimichi", rarity: "Rare", emoji: "🍙" },
    { item: "Sabaku", rarity: "Rare", emoji: "🏜️" },
    { item: "Sarutobi", rarity: "Rare", emoji: "🐒" },
    
    // Common
    { item: "Nara", rarity: "Common", emoji: "🦌" },
    { item: "Inuzuka", rarity: "Common", emoji: "🐕" },
    { item: "Shimura", rarity: "Common", emoji: "🪓" },
    { item: "Kamizuru", rarity: "Common", emoji: "🦅" },
    { item: "Hozuki", rarity: "Common", emoji: "💧" },
    { item: "Hoshigaki", rarity: "Common", emoji: "🦈" },
    { item: "Shirogane", rarity: "Common", emoji: "⚪" }
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
            spins: { clan: 15, element1: 5, element2: 5, trait: 3 }, 
            luckySpins: { clan: 0, element1: 0, element2: 0, trait: 0 },
            temp: { clan: [], element1: [], element2: [], trait: [] }, 
            finalized: { clan: null, element1: null, element2: null, trait: null } 
        };
    }
    if (!userData[id].spins) userData[id].spins = {};
    if (!userData[id].luckySpins) userData[id].luckySpins = {};
    if (!userData[id].temp) userData[id].temp = {};
    if (!userData[id].finalized) userData[id].finalized = {};

    const spinDefaults = { clan: 15, element1: 5, element2: 5, trait: 3 };
    for (const key in spinDefaults) {
        if (userData[id].spins[key] === undefined) userData[id].spins[key] = spinDefaults[key];
        if (userData[id].luckySpins[key] === undefined) userData[id].luckySpins[key] = 0;
        if (!Array.isArray(userData[id].temp[key])) userData[id].temp[key] = [];
        if (userData[id].finalized[key] === undefined) userData[id].finalized[key] = null;
    }
}

function weightedRandom(arr, weights, isLucky) {
    const pool = [];
    for (let obj of arr) {
        // If Lucky Spin, remove Common and Rare from the pool
        if (isLucky && (obj.rarity === 'Common' || obj.rarity === 'Rare')) continue;

        let weight = weights[obj.rarity] || 1;
        // Lucky Spin Effect: 5x boost for Epic, Legendary, Mythical
        if (isLucky && ['Epic', 'Legendary', 'Mythical'].includes(obj.rarity)) {
            weight *= 5;
        }
        const count = Math.max(1, Math.round(weight * 10));
        for (let i = 0; i < count; i++) pool.push(obj);
    }
    if (pool.length === 0) return arr[Math.floor(Math.random() * arr.length)];
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

// ---------------- SPIN LOGIC ----------------
async function performSpin(source, type, isLucky) {
    const user = source.user || source.author;
    const id = user.id;
    ensureUser(id);

    if (isLucky && userData[id].luckySpins[type] <= 0) {
        const msg = `❌ You don't have any **${type}** Lucky Spins left!`;
        return source.replied || source.deferred ? source.followUp(msg) : source.reply(msg);
    } else if (!isLucky && userData[id].spins[type] <= 0) {
        const msg = `❌ You don't have any **${type}** Normal Spins left!`;
        return source.replied || source.deferred ? source.followUp(msg) : source.reply(msg);
    }

    let weights = type === 'clan' ? CLAN_RARITY_WEIGHTS : type.startsWith('element') ? ELEMENT_RARITY_WEIGHTS : DEFAULT_RARITY_WEIGHTS;
    let pool = type === 'clan' ? CLANS : type.startsWith('element') ? ELEMENTS : TRAITS;

    let result;
    let attempts = 0;
    do {
        result = weightedRandom(pool, weights, isLucky);
        attempts++;
    } while (userData[id].temp[type].filter(x => x.item === result.item).length >= 1 && attempts < 10);

    const lastResult = userData[id].temp[type][userData[id].temp[type].length - 1];
    const isBackToBackDupe = lastResult && lastResult.item === result.item;

    userData[id].temp[type].push(result);

    if (!isBackToBackDupe) {
        if (isLucky) userData[id].luckySpins[type]--;
        else userData[id].spins[type]--;
    }

    saveData();

    const embed = new EmbedBuilder()
        .setTitle(`🎲 ${type.toUpperCase()} SPIN ${isLucky ? '(LUCKY 🍀)' : ''}`)
        .setAuthor({ name: user.username, iconURL: user.displayAvatarURL() })
        .setColor(RARITY_COLORS[result.rarity] || 0x000000)
        .setDescription(`You spun: ${result.emoji} **${result.item}**\n**Rarity:** ${RARITY_EMOJI[result.rarity]} ${result.rarity}${isBackToBackDupe ? '\n\n*(Back-to-back Duplicate — spin refunded!)*' : ''}${isLucky ? '\n\n*🍀 Lucky Spin used! (Guaranteed Epic+, 5x Odds for Leg/Myth!)*' : ''}`)
        .addFields(
            { name: '🔋 Normal Spins', value: `\`${userData[id].spins[type]}\``, inline: true },
            { name: '🍀 Lucky Spins', value: `\`${userData[id].luckySpins[type]}\``, inline: true },
            { name: '📝 Recent Results', value: userData[id].temp[type].slice(-5).map(x => `\`${x.item}\``).join(', ') || 'None', inline: false }
        )
        .setTimestamp()
        .setFooter({ text: 'Click Finalize to lock this result!' });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`finalize_${type}`).setLabel('Finalize').setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId(`spinagain_${type}_${id}`).setLabel('Spin Again').setStyle(ButtonStyle.Primary)
    );

    if (source.isButton && source.isButton()) {
        await source.update({ embeds: [embed], components: [row] });
    } else {
        await source.reply({ embeds: [embed], components: [row] });
    }
}

async function showSpinChoice(source, type) {
    const user = source.user || source.author;
    const id = user.id;
    ensureUser(id);

    const embed = new EmbedBuilder()
        .setTitle(`🎰 ${type.toUpperCase()} SPIN`)
        .setDescription(`Choose which type of spin you want to use for **${type}**:`)
        .setColor(0x7289da)
        .addFields(
            { name: '🔋 Normal', value: `\`${userData[id].spins[type]}\` remaining`, inline: true },
            { name: '🍀 Lucky', value: `\`${userData[id].luckySpins[type]}\` remaining`, inline: true }
        );

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`spinchoice_${type}_${id}`).setLabel('Normal Spin').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId(`spinchoice_${type}lucky_${id}`).setLabel('Lucky Spin').setStyle(ButtonStyle.Secondary)
    );

    if (source.isButton && source.isButton()) {
        await source.update({ embeds: [embed], components: [row] });
    } else {
        await source.reply({ embeds: [embed], components: [row] });
    }
}

// ---------------- INTERACTION HANDLER ----------------
client.on(Events.InteractionCreate, async interaction => {
    try {
        if (interaction.isButton()) {
            const [action, type, originalUserId] = interaction.customId.split('_');
            
            if (originalUserId && interaction.user.id !== originalUserId) {
                return interaction.reply({ content: "❌ You cannot interact with this menu!", ephemeral: true });
            }

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

            if (action === 'spinchoice') {
                const isLucky = type.endsWith('lucky');
                const realType = type.replace('lucky', '');
                await performSpin(interaction, realType, isLucky);
            }

            if (action === 'spinagain') {
                await showSpinChoice(interaction, type);
            }
        }

        if (interaction.isStringSelectMenu()) {
            const [action, targetId, category, originalUserId] = interaction.customId.split('_');
            if (originalUserId && interaction.user.id !== originalUserId) {
                return interaction.reply({ content: "❌ You cannot interact with this menu!", ephemeral: true });
            }

            if (action === 'givespec-category') {
                const selectedCategory = interaction.values[0];
                let items = selectedCategory === 'clan' ? CLANS : (selectedCategory.startsWith('element') ? ELEMENTS : TRAITS);
                const menu = new StringSelectMenuBuilder()
                    .setCustomId(`givespec-item_${targetId}_${selectedCategory}_${interaction.user.id}`)
                    .setPlaceholder(`Choose a ${selectedCategory} to give...`)
                    .addOptions(items.slice(0, 25).map(i => ({ label: i.item, description: `Rarity: ${i.rarity}`, value: i.item, emoji: i.emoji })));
                await interaction.update({ content: `Now select the **${selectedCategory}** to give:`, components: [new ActionRowBuilder().addComponents(menu)] });
            }

            if (action === 'givespec-item') {
                ensureUser(targetId);
                userData[targetId].finalized[category] = interaction.values[0];
                saveData();
                const targetUser = await client.users.fetch(targetId);
                await interaction.update({ content: `✅ Gave **${interaction.values[0]}** to **${targetUser.username}**!`, components: [], embeds: [] });
            }

            if (action === 'givels-category') {
                const selectedCategory = interaction.values[0];
                const targetUser = await client.users.fetch(targetId);
                await interaction.update({ content: `How many **${selectedCategory}** Lucky Spins to give to **${targetUser.username}**?`, components: [] });
                const filter = m => m.author.id === originalUserId && !isNaN(m.content);
                const collector = interaction.channel.createMessageCollector({ filter, time: 15000, max: 1 });
                collector.on('collect', async m => {
                    const amount = parseInt(m.content);
                    ensureUser(targetId);
                    if (selectedCategory === 'all') ['clan', 'element1', 'element2', 'trait'].forEach(k => userData[targetId].luckySpins[k] += amount);
                    else userData[targetId].luckySpins[selectedCategory] += amount;
                    saveData();
                    await m.reply(`✅ Gave **${amount}** Lucky Spins to **${targetUser.username}**!`);
                });
            }
        }
    } catch (err) { console.error("Error in interaction:", err); }
});

// ---------------- COMMAND HANDLER ----------------
client.on('messageCreate', async msg => {
    if (!msg.content.startsWith('!') || msg.author.bot) return;
    try {
        const [cmd, ...args] = msg.content.slice(1).split(' ');
        const id = msg.author.id;
        ensureUser(id);

        if (cmd === 'clan' || cmd === 'element1' || cmd === 'element2' || cmd === 'trait') {
            return await showSpinChoice(msg, cmd);
        }

        if (cmd === 'resetspins') {
            if (!msg.member.permissions.has(PermissionsBitField.Flags.Administrator)) return msg.reply("❌ Staff only!");
            const target = await findUser(msg, args);
            if (!target) return msg.reply("❌ Mention a user or ID.");
            ensureUser(target.id);
            userData[target.id].spins = { clan: 15, element1: 5, element2: 5, trait: 3 };
            saveData();
            return await msg.reply(`✅ Reset spins for **${target.username}** to defaults.`);
        }

        if (cmd === 'wipe') {
            if (!msg.member.permissions.has(PermissionsBitField.Flags.Administrator)) return msg.reply("❌ Staff only!");
            const target = await findUser(msg, args);
            if (!target) return msg.reply("❌ Mention a user or ID.");
            ensureUser(target.id);
            userData[target.id].finalized = { clan: null, element1: null, element2: null, trait: null };
            saveData();
            return await msg.reply(`✅ Wiped specs for **${target.username}**.`);
        }

        if (cmd === 'givespec') {
            if (!msg.member.permissions.has(PermissionsBitField.Flags.Administrator)) return msg.reply("❌ Staff only!");
            const target = await findUser(msg, args);
            if (!target) return msg.reply("❌ Mention a user or ID.");
            const menu = new StringSelectMenuBuilder().setCustomId(`givespec-category_${target.id}_none_${msg.author.id}`).setPlaceholder('Choose a category...')
                .addOptions([{ label: 'Clan', value: 'clan', emoji: '⛩️' }, { label: 'Element 1', value: 'element1', emoji: '🔥' }, { label: 'Element 2', value: 'element2', emoji: '🌊' }, { label: 'Trait', value: 'trait', emoji: '✨' }]);
            return await msg.reply({ content: `Giving spec to **${target.username}**:`, components: [new ActionRowBuilder().addComponents(menu)] });
        }

        if (cmd === 'givels') {
            if (!msg.member.permissions.has(PermissionsBitField.Flags.Administrator)) return msg.reply("❌ Staff only!");
            const target = await findUser(msg, args);
            if (!target) return msg.reply("❌ Mention a user or ID.");
            const menu = new StringSelectMenuBuilder().setCustomId(`givels-category_${target.id}_none_${msg.author.id}`).setPlaceholder('Choose category for Lucky Spins...')
                .addOptions([{ label: 'Clan', value: 'clan', emoji: '⛩️' }, { label: 'Element 1', value: 'element1', emoji: '🔥' }, { label: 'Element 2', value: 'element2', emoji: '🌊' }, { label: 'Trait', value: 'trait', emoji: '✨' }, { label: 'All Categories', value: 'all', emoji: '🌟' }]);
            return await msg.reply({ content: `Giving Lucky Spins to **${target.username}**:`, components: [new ActionRowBuilder().addComponents(menu)] });
        }

        if (cmd === 'check') {
            let target = await findUser(msg, args) || msg.author;
            ensureUser(target.id);
            const data = userData[target.id].finalized;
            const ls = userData[target.id].luckySpins;
            const embed = new EmbedBuilder().setTitle(`📜 ${target.username.toUpperCase()}'S SPECS`).setThumbnail(target.displayAvatarURL()).setColor(0x2f3136)
                .addFields({ name: '⛩️ Clan', value: `\`${data.clan || 'None'}\` (🍀 ${ls.clan})`, inline: true }, { name: '✨ Trait', value: `\`${data.trait || 'None'}\` (🍀 ${ls.trait})`, inline: true }, { name: '\u200B', value: '\u200B', inline: false },
                    { name: '🔥 Element 1', value: `\`${data.element1 || 'None'}\` (🍀 ${ls.element1})`, inline: true }, { name: '🌊 Element 2', value: `\`${data.element2 || 'None'}\` (🍀 ${ls.element2})`, inline: true })
                .setFooter({ text: "Use !clan, !element1, !element2, or !trait to spin!" }).setTimestamp();
            return await msg.reply({ embeds: [embed] });
        }

        if (cmd === 'cmds') {
            const embed = new EmbedBuilder().setTitle("🎮 BOT COMMANDS").setColor(0x7289da).addFields({ name: '🎲 Spinning', value: "`!clan`, `!element1`, `!element2`, `!trait`", inline: false }, { name: '📜 Info', value: "`!check @User`, `!cmds`", inline: false }, { name: '🎁 Staff', value: "`!givespec @User`, `!givels @User`, `!wipe @User`, `!resetspins @User`, `!announce [msg]`, `!purge [number/all]`", inline: false });
            return await msg.reply({ embeds: [embed] });
        }

        if (cmd === 'announce') {
            const text = args.join(' ');
            if (!text) return await msg.reply('❌ Provide a message.');
            try { await msg.delete(); } catch (e) {}
            return await msg.channel.send({ embeds: [new EmbedBuilder().setDescription(text).setColor(0xffc107)] });
        }

        if (cmd === 'purge') {
            if (!msg.member.permissions.has(PermissionsBitField.Flags.Administrator)) return msg.reply("❌ Staff only!");
            let amount = args[0] === 'all' ? 100 : parseInt(args[0]);
            if (isNaN(amount) || amount < 1 || amount > 100) return msg.reply("❌ Provide a number between 1 and 100, or 'all' (clears 100).");
            await msg.delete(); // Delete command
            const deleted = await msg.channel.bulkDelete(amount, true);
            const reply = await msg.channel.send(`✅ Purged **${deleted.size}** messages.`);
            setTimeout(() => reply.delete().catch(() => {}), 3000);
            return;
        }
    } catch (err) { console.error("Error in message handler:", err); }
});

client.once('ready', () => { console.log(`Logged in as ${client.user.tag}!`); });
client.login(process.env.BOT_TOKEN).catch(err => { console.error("Failed to login:", err); });
