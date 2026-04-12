// index.js - Main Genshō RPG Bot
const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Events, StringSelectMenuBuilder, PermissionsBitField, Collection } = require('discord.js');
const fs = require('fs');

// Initialize Discord Client
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMessages, 
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildPresences
    ],
    partials: [Partials.Channel, Partials.GuildMember, Partials.User]
});

// Railway Environment Variable
const TOKEN = process.env.BOT_TOKEN;

// IDs
const OC_PENDING_ROLE_ID = "1487175229485748390";
const REMINDER_CHANNEL_ID = "1488008579498901635";
const GHOST_PING_CHANNEL_ID = "1488021993948319865";
const SPIN_CHANNELS = ["1487175230131535946", "1487175230555164876"];
const AUTO_ROLES = [
    "1487175229506584767",
    "1487175229498458264",
    "1487175229473296415",
    "1487175229426893001",
    "1487175229410377787",
    "1487175229393473724",
    "1487175229351526720"
];

// Database Setup
const DB_FILE = './database.json';
let userData = {};
let capData = { capped: [] }; // Stores capped item names

function loadData() {
    if (fs.existsSync(DB_FILE)) {
        try {
            const content = fs.readFileSync(DB_FILE, 'utf8');
            if (content) {
                const parsed = JSON.parse(content);
                userData = parsed.userData || {};
                capData = parsed.capData || { capped: [] };
            }
        } catch (e) { console.error("⚠️ Database load error:", e.message); }
    }
}
loadData();

function saveData() { 
    try { 
        fs.writeFileSync(DB_FILE, JSON.stringify({ userData, capData }, null, 2)); 
    } 
    catch (e) { console.error("⚠️ Database save error:", e.message); }
}

function ensureUser(id) {
    if (!userData[id]) {
        userData[id] = {
            spins: { clan: 25, element1: 5, element2: 5, trait: 7, kenjutsu: 7, village: 2 },
            luckySpins: { clan: 0, element1: 0, element2: 0, trait: 0, kenjutsu: 0 },
            temp: { clan: [], element1: [], element2: [], trait: [], kenjutsu: [], village: [] },
            finalized: { clan: 'None', element1: 'None', element2: 'None', trait: 'None', kenjutsu: 'None', village: 'None' },
            oc_pending_start: null
        };
    }
    // Deep check for missing fields
    if (!userData[id].spins) userData[id].spins = { clan: 25, element1: 5, element2: 5, trait: 7, kenjutsu: 7, village: 2 };
    if (userData[id].spins.village === undefined) userData[id].spins.village = 2;
    if (!userData[id].spins.kenjutsu && userData[id].spins.kenjutsu !== 0) userData[id].spins.kenjutsu = 7;
    if (!userData[id].luckySpins) userData[id].luckySpins = { clan: 0, element1: 0, element2: 0, trait: 0, kenjutsu: 0 };
    if (!userData[id].luckySpins.kenjutsu && userData[id].luckySpins.kenjutsu !== 0) userData[id].luckySpins.kenjutsu = 0;
    if (!userData[id].temp) userData[id].temp = { clan: [], element1: [], element2: [], trait: [], kenjutsu: [], village: [] };
    if (!userData[id].temp.village) userData[id].temp.village = [];
    if (!userData[id].temp.kenjutsu) userData[id].temp.kenjutsu = [];
    if (!userData[id].finalized) userData[id].finalized = { clan: 'None', element1: 'None', element2: 'None', trait: 'None', kenjutsu: 'None', village: 'None' };
    if (userData[id].finalized.village === undefined) userData[id].finalized.village = 'None';
    if (!userData[id].finalized.kenjutsu) userData[id].finalized.kenjutsu = 'None';
}

// ----- CONFIGURATION -----
const CLANS = [
    { item: "Ōtsutsuki", rarity: "Mythical", emoji: "👁️", roleId: "1488017367970746398" },
    { item: "Kaguya", rarity: "Mythical", emoji: "🪐", roleId: "1487175229452062845" },
    { item: "Uchiha", rarity: "Legendary", emoji: "🔥", roleId: "1487175229473296414" },
    { item: "Senju", rarity: "Legendary", emoji: "🌳", roleId: "1487175229439606821" },
    { item: "Hyuga", rarity: "Legendary", emoji: "👁️", roleId: "1487175229452062847" },
    { item: "Uzumaki", rarity: "Legendary", emoji: "🌀", roleId: "1487175229439606820" },
    { item: "Chinoike", rarity: "Epic", emoji: "🩸", roleId: "1487175229439606814" },
    { item: "Jugo", rarity: "Epic", emoji: "🌿", roleId: "1487175229439606816" },
    { item: "Kurama", rarity: "Epic", emoji: "🦊", roleId: "1488008068628353055" },
    { item: "Lee", rarity: "Epic", emoji: "🥋", roleId: "1487175229439606818" },
    { item: "Yuki", rarity: "Epic", emoji: "❄️", roleId: "1487175229439606823" },
    { item: "Yamanaka", rarity: "Epic", emoji: "🧠", roleId: "1487175229452062842" },
    { item: "Aburame", rarity: "Rare", emoji: "🐜", roleId: "1487175229452062850" },
    { item: "Yotsuki", rarity: "Rare", emoji: "🟡", roleId: "1487175229439606819" },
    { item: "Fūma", rarity: "Rare", emoji: "🪓", roleId: "1488008205333430342" },
    { item: "Iburi", rarity: "Rare", emoji: "💨", roleId: "1488008211511382146" },
    { item: "Hatake", rarity: "Rare", emoji: "👒", roleId: "1487175229452062849" },
    { item: "Akimichi", rarity: "Rare", emoji: "🍙", roleId: "1487175229452062851" },
    { item: "Sabaku", rarity: "Rare", emoji: "🏜️", roleId: "1487175229452062844" },
    { item: "Sarutobi", rarity: "Rare", emoji: "🐒", roleId: "1487175229439606822" },
    { item: "Kurogane", rarity: "Rare", emoji: "⚔️", roleId: "1488017938924441700" },
    { item: "Nara", rarity: "Common", emoji: "🦌", roleId: "1487175229452062843" },
    { item: "Inuzuka", rarity: "Common", emoji: "🐕", roleId: "1487175229452062846" },
    { item: "Shimura", rarity: "Common", emoji: "🪓", roleId: "1488008202397159585" },
    { item: "Kamizuru", rarity: "Common", emoji: "🦅", roleId: "1488008208550203542" },
    { item: "Hozuki", rarity: "Common", emoji: "💧", roleId: "1487175229452062848" },
    { item: "Hoshigaki", rarity: "Common", emoji: "🦈", roleId: "1487175229439606815" },
    { item: "Shirogane", rarity: "Common", emoji: "⚪", roleId: "1487175229439606817" }
];

const ELEMENTS = [
    { item: "Fire", rarity: "Rare", emoji: "🔥", roleId: "1487175229410377786" },
    { item: "Lightning", rarity: "Rare", emoji: "⚡", roleId: "1487175229410377784" },
    { item: "Earth", rarity: "Rare", emoji: "🪨", roleId: "1487175229410377783" },
    { item: "Wind", rarity: "Rare", emoji: "🌪️", roleId: "1487175229410377785" },
    { item: "Water", rarity: "Rare", emoji: "💧", roleId: "1487175229410377782" },
    { item: "Yin", rarity: "Mythical", emoji: "🌑", roleId: "1487175229410377781" },
    { item: "Yang", rarity: "Mythical", emoji: "☀️", roleId: "1487175229410377780" },
    { item: "Chaos", rarity: "Mythical", emoji: "🌀", roleId: "1492908634173079633" },
    { item: "Order", rarity: "Mythical", emoji: "⚖️", roleId: "1492908920300240896" }
];

const TRAITS = [
    { item: "Prodigy", rarity: "Mythical", emoji: "💎", roleId: "1487175229426892997" },
    { item: "Clan Specialist", rarity: "Mythical", emoji: "🧬", roleId: "1487175229426892995" },
    { item: "Jutsu Amplification", rarity: "Legendary", emoji: "🔥", roleId: "1487175229426892993" },
    { item: "Genius", rarity: "Legendary", emoji: "🧠", roleId: "1487175229426892998" },
    { item: "Analytical Eye", rarity: "Legendary", emoji: "👁️", roleId: "1490218804913901629" },
    { item: "Iryojutsu Proficiency", rarity: "Epic", emoji: "🩹", roleId: "1487175229426893000" },
    { item: "Genjutsu/Illusionary Proficiency", rarity: "Epic", emoji: "🎭", roleId: "1487175229426892999" },
    { item: "Superhuman Physique", rarity: "Rare", emoji: "💪", roleId: "1487175229426892996" },
    { item: "Scientist", rarity: "Rare", emoji: "🧪", roleId: "1487175229410377788" },
    { item: "Hard Working", rarity: "Common", emoji: "🏋️", roleId: "1487175229426892994" }
];

const KENJUTSU = [
    { item: "Sun", rarity: "Mythical", emoji: "☀️" }, { item: "Moon", rarity: "Mythical", emoji: "🌙" },
    { item: "Wind", rarity: "Rare", emoji: "🌪️" }, { item: "Water", rarity: "Rare", emoji: "💧" }, { item: "Thunder", rarity: "Rare", emoji: "⚡" }, { item: "Flame", rarity: "Rare", emoji: "🔥" }, { item: "Mist", rarity: "Rare", emoji: "🌫️" }
];

const VILLAGES = [
    { item: "Konohagakure", emoji: "🍃", roleId: "1487175229498458270" },
    { item: "Kumogakure", emoji: "⚡", roleId: "1487175229498458269" },
    { item: "Kirigakure", emoji: "🌫️", roleId: "1487175229498458268" },
    { item: "Sunagakure", emoji: "🏜️", roleId: "1487175229498458267" },
    { item: "Iwagakure", emoji: "🪨", roleId: "1487175229498458266" }
];

const ALL_POOLS = [...CLANS, ...ELEMENTS, ...TRAITS, ...KENJUTSU, ...VILLAGES];

const RARITY_COLORS = { Mythical: 0xff00ff, Legendary: 0xffa500, Epic: 0x9400d3, Rare: 0x1e90ff, Common: 0x808080 };
const BANNED_WORDS = ["nigga", "nigger", "nigg", "nig ga", "faggot", "fag", "retard"];

// Helper: Weighted Random
function weightedRandom(items, isLucky = false) {
    const weights = { Common: 70, Rare: 25, Epic: 4, Legendary: 0.9, Mythical: 0.1 };
    // Filter out capped items
    let pool = items.filter(i => !capData.capped.includes(i.item));
    if (pool.length === 0) pool = items; // Fallback if all are capped

    if (isLucky) {
        pool = pool.filter(i => i.rarity !== 'Common' && i.rarity !== 'Rare');
        if (pool.length === 0) pool = items.filter(i => i.rarity !== 'Common' && i.rarity !== 'Rare');
        weights.Epic = 4; weights.Legendary = 4.5; weights.Mythical = 0.5;
    }
    const totalWeight = pool.reduce((acc, item) => acc + (weights[item.rarity] || 0), 0);
    let random = Math.random() * totalWeight;
    for (const item of pool) {
        if (random < (weights[item.rarity] || 0)) return item;
        random -= (weights[item.rarity] || 0);
    }
    return pool[0];
}

// Helper: Balanced Village Random
function getBalancedVillage() {
    const villageCounts = {};
    VILLAGES.forEach(v => villageCounts[v.item] = 0);

    Object.values(userData).forEach(data => {
        if (data.finalized && data.finalized.village && data.finalized.village !== 'None') {
            villageCounts[data.finalized.village] = (villageCounts[data.finalized.village] || 0) + 1;
        }
    });

    const counts = Object.values(villageCounts);
    const minCount = Math.min(...counts);
    
    let targetCap = 3;
    while (minCount >= targetCap) { targetCap += 3; }

    // Filter villages that haven't reached the current target cap AND aren't manually capped
    let availableVillages = VILLAGES.filter(v => villageCounts[v.item] < targetCap && !capData.capped.includes(v.item));
    
    if (availableVillages.length === 0) {
        availableVillages = VILLAGES.filter(v => !capData.capped.includes(v.item));
    }
    
    const finalPool = availableVillages.length > 0 ? availableVillages : VILLAGES;
    return finalPool[Math.floor(Math.random() * finalPool.length)];
}

// Helper: Assign Role
async function updateRoles(member, type, newItem) {
    if (!member) return;
    const pool = type === 'clan' ? CLANS : (type.startsWith('element') ? ELEMENTS : (type === 'trait' ? TRAITS : (type === 'village' ? VILLAGES : [])));
    
    // Remove old roles of the same type
    const oldRoles = pool.map(i => i.roleId).filter(id => id);
    if (oldRoles.length > 0) {
        await member.roles.remove(oldRoles).catch(() => {});
    }

    // Add new role
    const itemConfig = pool.find(i => i.item === newItem);
    if (itemConfig && itemConfig.roleId) {
        await member.roles.add(itemConfig.roleId).catch(e => console.error(`Role add error: ${e.message}`));
    }
}

// Helper: Find User
async function findUser(msg, args) {
    const mention = msg.mentions.users.first();
    if (mention) return mention;
    const id = args[0];
    if (id && /^\d{17,20}$/.test(id)) {
        try { return await client.users.fetch(id); } catch (e) { return null; }
    }
    return null;
}

// ----- BACKGROUND TASKS -----
setInterval(async () => {
    const now = Date.now();
    for (const [id, data] of Object.entries(userData)) {
        if (data.oc_pending_start && now - data.oc_pending_start > 72 * 60 * 60 * 1000) {
            try {
                const user = await client.users.fetch(id);
                await user.send("⚠️ Kicked from **GENSHŌ — 幻象** (OC deadline missed).").catch(() => {});
                for (const guild of client.guilds.cache.values()) {
                    const member = await guild.members.fetch(id).catch(() => null);
                    if (member && member.roles.cache.has(OC_PENDING_ROLE_ID)) await member.kick("OC Missed").catch(() => {});
                }
                userData[id].oc_pending_start = null;
                saveData();
            } catch (e) {}
        }
    }
}, 10 * 60 * 1000);

// ----- EVENTS -----
client.on('guildMemberAdd', async member => {
    try {
        await member.roles.add([OC_PENDING_ROLE_ID, ...AUTO_ROLES]);
        ensureUser(member.id);
        userData[member.id].oc_pending_start = Date.now();
        saveData();
        const ghostChannel = await client.channels.fetch(GHOST_PING_CHANNEL_ID);
        if (ghostChannel) {
            const m = await ghostChannel.send(`<@${member.id}>`);
            await m.delete().catch(() => {});
        }

        const welcomeEmbed = new EmbedBuilder()
            .setTitle("Welcome to **GENSHŌ — 幻象**")
            .setDescription(`You’ve stepped into a world shaped by the aftermath of chaos… where peace is fragile, and power defines your path.\n\nBefore you begin, make sure you:\n• Read the rules carefully\n• Create your character properly\n• Submit your OC before getting started\n• Understand the world and its lore\n• **Spin for your village using \`!villagespin\`**\n\n**Full server access will be granted once your OC is submitted and accepted.**\n\n⚠️ **IMPORTANT:** You have a **3-day window** to submit your OC. Failure to do so will result in an automatic removal from the server.`)
            .setColor(0x000000);
        await member.send({ embeds: [welcomeEmbed] }).catch(() => {});
    } catch (e) {}
});

client.on('messageCreate', async msg => {
    if (msg.author.bot) return;

    if (BANNED_WORDS.some(w => msg.content.toLowerCase().includes(w))) {
        await msg.delete().catch(() => {});
        return msg.channel.send(`⚠️ <@${msg.author.id}>, inappropriate language.`).then(m => setTimeout(() => m.delete(), 3000));
    }

    if (!msg.content.startsWith('!')) return;
    const args = msg.content.slice(1).split(' ');
    const cmd = args.shift().toLowerCase();
    const id = msg.author.id;
    ensureUser(id);

    if (cmd === 'check') {
        const target = await findUser(msg, args) || msg.author;
        ensureUser(target.id);
        const data = userData[target.id].finalized;
        const embed = new EmbedBuilder().setTitle(`✨ ${target.username.toUpperCase()}'S SPECS`).setColor(0x2b2d31)
            .addFields(
                { name: '🧬 Clan', value: `\`\`\`${data.clan}\`\`\``, inline: true }, 
                { name: '🔥 Element 1', value: `\`\`\`${data.element1}\`\`\``, inline: true }, 
                { name: '🌊 Element 2', value: `\`\`\`${data.element2}\`\`\``, inline: true }, 
                { name: '🔋 Trait', value: `\`\`\`${data.trait}\`\`\``, inline: true },
                { name: '⚔️ Kenjutsu', value: `\`\`\`${data.kenjutsu}\`\`\``, inline: true },
                { name: '🏘️ Village', value: `\`\`\`${data.village || 'None'}\`\`\``, inline: true }
            );
        return msg.reply({ embeds: [embed] });
    }

    if (['clan', 'element1', 'element2', 'trait', 'kenjutsu', 'villagespin'].includes(cmd)) {
        if (!SPIN_CHANNELS.includes(msg.channelId)) return msg.reply("❌ Designated spin channels only!");
        const type = cmd === 'villagespin' ? 'village' : cmd;
        if (type === 'kenjutsu' && userData[id].finalized.clan !== 'Kurogane') return msg.reply("❌ Kurogane only!");
        const embed = new EmbedBuilder().setTitle(`🎰 ${type.toUpperCase()} SPIN`).setDescription(`🔋 Normal: ${userData[id].spins[type]}\n🍀 Lucky: ${userData[id].luckySpins[type] || 0}`).setColor(0x7289da);
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`spin_normal_${type}_${id}`).setLabel('Normal Spin').setStyle(ButtonStyle.Primary).setDisabled(userData[id].spins[type] <= 0),
            new ButtonBuilder().setCustomId(`spin_lucky_${type}_${id}`).setLabel('Lucky Spin').setStyle(ButtonStyle.Success).setDisabled((userData[id].luckySpins[type] || 0) <= 0)
        );
        return msg.reply({ embeds: [embed], components: [row] });
    }

    if (cmd === 'cap' && msg.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        const item = args.join(' ');
        if (!item) return msg.reply("❌ Specify an item to cap.");
        if (!capData.capped.includes(item)) {
            capData.capped.push(item);
            saveData();
            return msg.reply(`✅ **${item}** is now capped.`);
        }
        return msg.reply("⚠️ Already capped.");
    }

    if (cmd === 'uncap' && msg.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        const item = args.join(' ');
        if (!item) return msg.reply("❌ Specify an item to uncap.");
        const idx = capData.capped.indexOf(item);
        if (idx > -1) {
            capData.capped.splice(idx, 1);
            saveData();
            return msg.reply(`✅ **${item}** is now uncapped.`);
        }
        return msg.reply("⚠️ Not capped.");
    }

    if (cmd === 'cmds') {
        const embed = new EmbedBuilder().setTitle("📜 GENSHŌ RPG COMMANDS").setColor(0x2b2d31)
            .addFields(
                { name: '✨ Player Commands', value: "`!check`, `!clan`, `!element1`, `!element2`, `!trait`, `!kenjutsu`, `!villagespin`" },
                { name: '🛡️ Staff Commands', value: "`!givespec`, `!givespins`, `!givels`, `!resetspins`, `!wipe`, `!cap [item]`, `!uncap [item]`, `!purge`, `!announce`" }
            );
        return msg.reply({ embeds: [embed] });
    }

    // Standard Staff Commands
    if (msg.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        if (cmd === 'givespec') {
            const target = await findUser(msg, args);
            if (!target) return;
            const row = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`give_cat_${target.id}_${id}`).setPlaceholder('Select Category').addOptions([{ label: 'Clan', value: 'clan' }, { label: 'Element 1', value: 'element1' }, { label: 'Element 2', value: 'element2' }, { label: 'Trait', value: 'trait' }, { label: 'Kenjutsu', value: 'kenjutsu' }, { label: 'Village', value: 'village' }]));
            return msg.reply({ content: `Giving spec to **${target.username}**...`, components: [row] });
        }
        if (cmd === 'givels') {
            const target = await findUser(msg, args);
            if (!target) return;
            const row = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`givels_cat_${target.id}_${id}`).setPlaceholder('Select Category').addOptions([{ label: 'Clan', value: 'clan' }, { label: 'Element 1', value: 'element1' }, { label: 'Element 2', value: 'element2' }, { label: 'Trait', value: 'trait' }, { label: 'Kenjutsu', value: 'kenjutsu' }]));
            return msg.reply({ content: `Giving Lucky Spins to **${target.username}**...`, components: [row] });
        }
        if (cmd === 'givespins') {
            const target = await findUser(msg, args);
            if (!target) return;
            const row = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`givespins_cat_${target.id}_${id}`).setPlaceholder('Select Category').addOptions([{ label: 'Clan', value: 'clan' }, { label: 'Element 1', value: 'element1' }, { label: 'Element 2', value: 'element2' }, { label: 'Trait', value: 'trait' }, { label: 'Kenjutsu', value: 'kenjutsu' }, { label: 'Village', value: 'village' }]));
            return msg.reply({ content: `Giving Normal Spins to **${target.username}**...`, components: [row] });
        }
        if (cmd === 'wipe') {
            const target = await findUser(msg, args);
            if (!target) return;
            ensureUser(target.id);
            userData[target.id].finalized = { clan: 'None', element1: 'None', element2: 'None', trait: 'None', kenjutsu: 'None', village: 'None' };
            saveData();
            return msg.reply(`✅ Wiped **${target.username}**.`);
        }
        if (cmd === 'resetspins') {
            const target = await findUser(msg, args);
            if (!target) return;
            ensureUser(target.id);
            userData[target.id].spins = { clan: 25, element1: 5, element2: 5, trait: 7, kenjutsu: 7, village: 2 };
            userData[target.id].luckySpins = { clan: 0, element1: 0, element2: 0, trait: 0, kenjutsu: 0 };
            saveData();
            return msg.reply(`✅ Reset spins for **${target.username}**.`);
        }
        if (cmd === 'announce') {
            const text = args.join(' ');
            if (!text) return;
            await msg.delete().catch(() => {});
            return msg.channel.send({ embeds: [new EmbedBuilder().setDescription(text).setColor(0x2b2d31)] });
        }
        if (cmd === 'purge') {
            let amt = args[0] === 'all' ? 100 : parseInt(args[0]);
            if (isNaN(amt) || amt < 1) return;
            await msg.channel.bulkDelete(Math.min(amt, 100), true);
            return msg.channel.send(`✅ Purged ${amt}.`).then(m => setTimeout(() => m.delete(), 3000));
        }
    }
});

client.on(Events.InteractionCreate, async i => {
    if (i.isButton()) {
        const [action, mode, type, originalId] = i.customId.split('_');
        if (originalId && i.user.id !== originalId) return i.reply({ content: "Unauthorized!", ephemeral: true });
        const id = i.user.id;
        ensureUser(id);

        if (action === 'spin') {
            if (!SPIN_CHANNELS.includes(i.channelId)) return i.reply({ content: "Designated channels only!", ephemeral: true });
            const isLucky = mode === 'lucky';
            if (isLucky) userData[id].luckySpins[type]--;
            else userData[id].spins[type]--;
            
            let res = type === 'village' ? getBalancedVillage() : weightedRandom(type === 'clan' ? CLANS : (type.startsWith('element') ? ELEMENTS : (type === 'trait' ? TRAITS : KENJUTSU)), isLucky);
            
            userData[id].temp[type].push(res);
            saveData();
            const embed = new EmbedBuilder().setTitle(isLucky ? "🍀 LUCKY SPIN" : "🎰 SPIN").setColor(RARITY_COLORS[res.rarity] || 0x3498db).setDescription(`Rolled: **${res.emoji} ${res.item}**${res.rarity ? ` (\`${res.rarity}\`)` : ""}`);
            const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`finalize_${type}_${id}`).setLabel('Finalize').setStyle(ButtonStyle.Success), new ButtonBuilder().setCustomId(`spinagain_${type}_${id}`).setLabel('Spin Again').setStyle(ButtonStyle.Secondary));
            await i.update({ embeds: [embed], components: [row] });
        } else if (action === 'finalize') {
            const res = userData[id].temp[mode].pop();
            if (res) {
                // Double check cap before finalizing
                if (capData.capped.includes(res.item)) {
                    return i.reply({ content: `❌ **${res.item}** was just capped! You must spin again.`, ephemeral: true });
                }
                userData[id].finalized[mode] = res.item;
                userData[id].temp[mode] = [];
                saveData();
                await updateRoles(i.member, mode, res.item);
                await i.update({ content: `✅ Finalized **${res.item}**! Roles updated.`, embeds: [], components: [] });
            }
        } else if (action === 'spinagain') {
            const embed = new EmbedBuilder().setTitle(`🎰 ${mode.toUpperCase()} SPIN`).setDescription(`🔋 Normal: ${userData[id].spins[mode]}\n🍀 Lucky: ${userData[id].luckySpins[mode] || 0}`).setColor(0x7289da);
            const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`spin_normal_${mode}_${id}`).setLabel('Normal Spin').setStyle(ButtonStyle.Primary).setDisabled(userData[id].spins[mode] <= 0), new ButtonBuilder().setCustomId(`spin_lucky_${mode}_${id}`).setLabel('Lucky Spin').setStyle(ButtonStyle.Success).setDisabled((userData[id].luckySpins[mode] || 0) <= 0));
            await i.update({ embeds: [embed], components: [row] });
        }
    }

    if (i.isStringSelectMenu()) {
        const p = i.customId.split('_');
        if (p[0] === 'give' && p[1] === 'cat') {
            if (i.user.id !== p[3]) return i.reply({ content: "Unauthorized!", ephemeral: true });
            const type = i.values[0];
            if (type === 'clan') {
                const rarities = ["Mythical", "Legendary", "Epic", "Rare", "Common"];
                const row = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`give_item_part_${p[2]}_clan_${i.user.id}`).setPlaceholder('Select Rarity').addOptions(rarities.map(r => ({ label: r, value: r }))));
                await i.update({ content: `Select rarity for <@${p[2]}>:`, components: [row] });
            } else if (type === 'village') {
                const row = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`give_item_${p[2]}_village_${i.user.id}`).setPlaceholder('Select Village').addOptions(VILLAGES.map(v => ({ label: v.item, value: v.item, emoji: v.emoji }))));
                await i.update({ content: `Select village for <@${p[2]}>:`, components: [row] });
            } else {
                const pool = type.startsWith('element') ? ELEMENTS : (type === 'trait' ? TRAITS : KENJUTSU);
                const row = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`give_item_${p[2]}_${type}_${i.user.id}`).setPlaceholder(`Select ${type}`).addOptions(pool.map(it => ({ label: it.item, value: it.item, description: it.rarity, emoji: it.emoji }))));
                await i.update({ content: `Select ${type} for <@${p[2]}>:`, components: [row] });
            }
        } else if (p[0] === 'give' && p[1] === 'item' && p[2] === 'part') {
            const pool = CLANS.filter(c => c.rarity === i.values[0]);
            const row = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`give_item_${p[3]}_clan_${i.user.id}`).setPlaceholder('Select Clan').addOptions(pool.map(it => ({ label: it.item, value: it.item, emoji: it.emoji }))));
            await i.update({ content: `Select clan for <@${p[3]}>:`, components: [row] });
        } else if (p[0] === 'give' && p[1] === 'item') {
            ensureUser(p[2]);
            userData[p[2]].finalized[p[3]] = i.values[0];
            saveData();
            const targetMember = await i.guild.members.fetch(p[2]).catch(() => null);
            if (targetMember) await updateRoles(targetMember, p[3], i.values[0]);
            await i.update({ content: `✅ Gave **${i.values[0]}** to <@${p[2]}>! Roles updated.`, components: [] });
        } else if (p[0] === 'givels' && p[1] === 'cat') {
            const type = i.values[0];
            await i.update({ content: `How many **${type}** Lucky Spins to give?`, components: [] });
            const col = i.channel.createMessageCollector({ filter: m => m.author.id === i.user.id && !isNaN(parseInt(m.content)), time: 15000, max: 1 });
            col.on('collect', m => {
                ensureUser(p[2]);
                userData[p[2]].luckySpins[type] += parseInt(m.content);
                saveData();
                m.reply(`✅ Gave **${m.content}** Lucky Spins to <@${p[2]}>.`);
            });
        } else if (p[0] === 'givespins' && p[1] === 'cat') {
            const type = i.values[0];
            await i.update({ content: `How many **${type}** Normal Spins to give?`, components: [] });
            const col = i.channel.createMessageCollector({ filter: m => m.author.id === i.user.id && !isNaN(parseInt(m.content)), time: 15000, max: 1 });
            col.on('collect', m => {
                ensureUser(p[2]);
                userData[p[2]].spins[type] += parseInt(m.content);
                saveData();
                m.reply(`✅ Gave **${m.content}** Normal Spins to <@${p[2]}>.`);
            });
        }
    }
});

client.once('ready', () => { console.log(`✅ Main Bot ONLINE: ${client.user.tag}`); });
client.login(TOKEN);
