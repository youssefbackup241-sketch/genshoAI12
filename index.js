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

function loadData() {
    if (fs.existsSync(DB_FILE)) {
        try {
            const content = fs.readFileSync(DB_FILE, 'utf8');
            if (content) userData = JSON.parse(content);
        } catch (e) { console.error("⚠️ Database load error:", e.message); }
    }
}
loadData();

function saveData() { 
    try { fs.writeFileSync(DB_FILE, JSON.stringify(userData, null, 2)); } 
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
    { item: "Ōtsutsuki", rarity: "Mythical", emoji: "👁️" }, { item: "Kaguya", rarity: "Mythical", emoji: "🪐" },
    { item: "Uchiha", rarity: "Legendary", emoji: "🔥" }, { item: "Senju", rarity: "Legendary", emoji: "🌳" }, { item: "Hyuga", rarity: "Legendary", emoji: "👁️" }, { item: "Uzumaki", rarity: "Legendary", emoji: "🌀" },
    { item: "Chinoike", rarity: "Epic", emoji: "🩸" }, { item: "Jugo", rarity: "Epic", emoji: "🌿" }, { item: "Kurama", rarity: "Epic", emoji: "🦊" }, { item: "Lee", rarity: "Epic", emoji: "🥋" }, { item: "Yuki", rarity: "Epic", emoji: "❄️" }, { item: "Yamanaka", rarity: "Epic", emoji: "🧠" },
    { item: "Aburame", rarity: "Rare", emoji: "🐜" }, { item: "Yotsuki", rarity: "Rare", emoji: "🟡" }, { item: "Fūma", rarity: "Rare", emoji: "🪓" }, { item: "Iburi", rarity: "Rare", emoji: "💨" }, { item: "Hatake", rarity: "Rare", emoji: "👒" }, { item: "Akimichi", rarity: "Rare", emoji: "🍙" }, { item: "Sabaku", rarity: "Rare", emoji: "🏜️" }, { item: "Sarutobi", rarity: "Rare", emoji: "🐒" }, { item: "Kurogane", rarity: "Rare", emoji: "⚔️" },
    { item: "Nara", rarity: "Common", emoji: "🦌" }, { item: "Inuzuka", rarity: "Common", emoji: "🐕" }, { item: "Shimura", rarity: "Common", emoji: "🪓" }, { item: "Kamizuru", rarity: "Common", emoji: "🦅" }, { item: "Hozuki", rarity: "Common", emoji: "💧" }, { item: "Hoshigaki", rarity: "Common", emoji: "🦈" }, { item: "Shirogane", rarity: "Common", emoji: "⚪" }
];

const ELEMENTS = [
    { item: "Fire", rarity: "Rare", emoji: "🔥" }, { item: "Water", rarity: "Rare", emoji: "💧" }, { item: "Earth", rarity: "Rare", emoji: "🪨" }, { item: "Wind", rarity: "Rare", emoji: "🌪️" }, { item: "Lightning", rarity: "Rare", emoji: "⚡" },
    { item: "Chaos", rarity: "Mythical", emoji: "🌀" }, { item: "Order", rarity: "Mythical", emoji: "⚖️" }, { item: "Yin", rarity: "Mythical", emoji: "🌑" }, { item: "Yang", rarity: "Mythical", emoji: "☀️" }
];

const TRAITS = [
    { item: "Prodigy", rarity: "Mythical", emoji: "💎" }, { item: "Clan Specialist", rarity: "Mythical", emoji: "🧬" },
    { item: "Genius", rarity: "Legendary", emoji: "🧠" }, { item: "Analytical Eye", rarity: "Legendary", emoji: "👁️" }, { item: "Jutsu Amplification", rarity: "Legendary", emoji: "🔥" },
    { item: "Iryojutsu Proficiency", rarity: "Epic", emoji: "🩹" }, { item: "Genjutsu/Illusionary Proficiency", rarity: "Epic", emoji: "🎭" },
    { item: "Superhuman", rarity: "Rare", emoji: "💪" }, { item: "Scientist", rarity: "Rare", emoji: "🧪" },
    { item: "Hard Working!", rarity: "Common", emoji: "🏋️" }, { item: "Knucklehead!", rarity: "Common", emoji: "🤪" }
];

const KENJUTSU = [
    { item: "Sun", rarity: "Mythical", emoji: "☀️" }, { item: "Moon", rarity: "Mythical", emoji: "🌙" },
    { item: "Wind", rarity: "Rare", emoji: "🌪️" }, { item: "Water", rarity: "Rare", emoji: "💧" }, { item: "Thunder", rarity: "Rare", emoji: "⚡" }, { item: "Flame", rarity: "Rare", emoji: "🔥" }, { item: "Mist", rarity: "Rare", emoji: "🌫️" }
];

const VILLAGES = [
    { item: "Konohagakure", emoji: "🍃" },
    { item: "Sunagakure", emoji: "🏜️" },
    { item: "Kirigakure", emoji: "🌫️" },
    { item: "Kumogakure", emoji: "⚡" },
    { item: "Iwagakure", emoji: "🪨" }
];

const RARITY_COLORS = { Mythical: 0xff00ff, Legendary: 0xffa500, Epic: 0x9400d3, Rare: 0x1e90ff, Common: 0x808080 };
const RARITY_EMOJI = { Mythical: "💎", Legendary: "🏆", Epic: "✨", Rare: "🔹", Common: "⚪" };

const BANNED_WORDS = ["nigga", "nigger", "nigg", "nig ga", "faggot", "fag", "retard"];
const messageLog = new Collection();

// Helper: Weighted Random
function weightedRandom(items, isLucky = false) {
    const weights = { Common: 70, Rare: 25, Epic: 4, Legendary: 0.9, Mythical: 0.1 };
    let pool = items;
    if (isLucky) {
        pool = items.filter(i => i.rarity !== 'Common' && i.rarity !== 'Rare');
        weights.Epic = 4; weights.Legendary = 4.5; weights.Mythical = 0.5; // 5x boost
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

    // Count people in each village from finalized data
    Object.values(userData).forEach(data => {
        if (data.finalized && data.finalized.village && data.finalized.village !== 'None') {
            villageCounts[data.finalized.village] = (villageCounts[data.finalized.village] || 0) + 1;
        }
    });

    // Find the current cap tier
    const counts = Object.values(villageCounts);
    const minCount = Math.min(...counts);
    
    // Determine target cap: 3, 6, 9, etc.
    let targetCap = 3;
    while (minCount >= targetCap) {
        targetCap += 3;
    }

    // Filter villages that haven't reached the current target cap
    const availableVillages = VILLAGES.filter(v => villageCounts[v.item] < targetCap);
    
    // If all are at cap, they are all available for the next tier
    const finalPool = availableVillages.length > 0 ? availableVillages : VILLAGES;
    return finalPool[Math.floor(Math.random() * finalPool.length)];
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
// 3-Day Kick Check
setInterval(async () => {
    const now = Date.now();
    for (const [id, data] of Object.entries(userData)) {
        if (data.oc_pending_start) {
            if (now - data.oc_pending_start > 72 * 60 * 60 * 1000) {
                try {
                    const user = await client.users.fetch(id);
                    await user.send("⚠️ You have been kicked from **GENSHŌ — 幻象** because you did not submit your OC within the 3-day window.").catch(() => {});
                    for (const guild of client.guilds.cache.values()) {
                        const member = await guild.members.fetch(id).catch(() => null);
                        if (member && member.roles.cache.has(OC_PENDING_ROLE_ID)) {
                            await member.kick("OC Submission Deadline Missed").catch(console.error);
                        }
                    }
                    userData[id].oc_pending_start = null;
                    saveData();
                } catch (e) { console.error("Kick error:", e.message); }
            }
        }
    }
}, 10 * 60 * 1000);

// 12-Hour Reminder Ping
setInterval(async () => {
    try {
        const channel = await client.channels.fetch(REMINDER_CHANNEL_ID);
        if (!channel) return;
        const members = await channel.guild.members.fetch();
        const pending = members.filter(m => m.roles.cache.has(OC_PENDING_ROLE_ID));
        if (pending.size > 0) {
            const pings = pending.map(m => `<@${m.id}>`).join(' ');
            await channel.send(`${pings}\n\n⚠️ **Reminder:** Please submit your OCs if you haven't already! Once your OC is submitted and accepted, you will receive full server access. Failure to submit within the 3-day window will result in an automatic removal from the server.`);
        }
    } catch (e) { console.error("Reminder error:", e.message); }
}, 12 * 60 * 60 * 1000);

// ----- EVENTS -----
client.on('guildMemberAdd', async member => {
    try {
        await member.roles.add([OC_PENDING_ROLE_ID, ...AUTO_ROLES]);
        ensureUser(member.id);
        userData[member.id].oc_pending_start = Date.now();
        saveData();
        const embed = new EmbedBuilder().setTitle("Welcome to **GENSHŌ — 幻象**").setDescription(`You’ve stepped into a world shaped by the aftermath of chaos… where peace is fragile, and power defines your path.\n\nBefore you begin, make sure you:\n• Read the rules carefully\n• Create your character properly\n• Submit your OC before getting started\n• Understand the world and its lore\n\n**Full server access will be granted once your OC is submitted and accepted.**\n\n⚠️ **IMPORTANT:** You have a **3-day window** to submit your OC. Failure to do so will result in an automatic removal from the server.`).setColor(0x000000);
        await member.send({ embeds: [embed] }).catch(() => {});
        
        // Ghost Ping
        const ghostChannel = await client.channels.fetch(GHOST_PING_CHANNEL_ID);
        if (ghostChannel) {
            const ghostMsg = await ghostChannel.send(`<@${member.id}>`);
            await ghostMsg.delete().catch(() => {});
        }
    } catch (e) { console.error("Join error:", e.message); }
});

client.on('messageCreate', async msg => {
    if (msg.author.bot) return;

    // GLOBAL SLUR FILTER - DELETES REGARDLESS OF ROLES
    if (BANNED_WORDS.some(w => msg.content.toLowerCase().includes(w))) {
        await msg.delete().catch(() => {});
        return msg.channel.send(`⚠️ <@${msg.author.id}>, inappropriate language.`).then(m => setTimeout(() => m.delete(), 3000));
    }

    if (!msg.member?.permissions.has(PermissionsBitField.Flags.Administrator)) {
        if (msg.content.includes('discord.gg/') || msg.mentions.users.size > 5) {
            await msg.delete().catch(() => {});
            return msg.channel.send(`⚠️ <@${msg.author.id}>, auto-mod triggered.`).then(m => setTimeout(() => m.delete(), 3000));
        }
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
        if (!SPIN_CHANNELS.includes(msg.channelId)) return msg.reply("❌ You can only use spin commands in the designated spin channels!");
        const type = cmd === 'villagespin' ? 'village' : cmd;
        if (type === 'kenjutsu' && userData[id].finalized.clan !== 'Kurogane') {
            return msg.reply("❌ The Kenjutsu spin is exclusive to members of the **Kurogane** clan!");
        }
        const embed = new EmbedBuilder().setTitle(`🎰 ${type.toUpperCase()} SPIN`).setDescription(`🔋 Normal: ${userData[id].spins[type]}\n🍀 Lucky: ${userData[id].luckySpins[type] || 0}`).setColor(0x7289da);
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`spin_normal_${type}_${id}`).setLabel('Normal Spin').setStyle(ButtonStyle.Primary).setDisabled(userData[id].spins[type] <= 0),
            new ButtonBuilder().setCustomId(`spin_lucky_${type}_${id}`).setLabel('Lucky Spin').setStyle(ButtonStyle.Success).setDisabled((userData[id].luckySpins[type] || 0) <= 0)
        );
        return msg.reply({ embeds: [embed], components: [row] });
    }

    if (cmd === 'cmds') {
        const embed = new EmbedBuilder().setTitle("📜 GENSHŌ RPG COMMANDS").setColor(0x2b2d31)
            .addFields(
                { name: '✨ Player Commands', value: "`!check` - View your specs\n`!clan` - Spin for a clan\n`!element1` - Spin for element 1\n`!element2` - Spin for element 2\n`!trait` - Spin for a trait\n`!kenjutsu` - Spin for kenjutsu (Kurogane only)\n`!villagespin` - Spin for a village" },
                { name: '🛡️ Staff Commands', value: "`!givespec @User` - Directly assign a spec\n`!givespins @User` - Give normal spins\n`!givels @User` - Give lucky spins\n`!resetspins @User` - Reset normal spins\n`!wipe @User` - Clear a user's specs\n`!announce [msg]` - Post an announcement\n`!purge [num/all]` - Delete messages" }
            )
            .setFooter({ text: "Use !cmds to see this menu again!" });
        return msg.reply({ embeds: [embed] });
    }

    if (cmd === 'announce' && msg.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        const text = args.join(' ');
        if (!text) return;
        await msg.delete().catch(() => {});
        return msg.channel.send({ embeds: [new EmbedBuilder().setDescription(text).setColor(0x2b2d31)] });
    }

    if (cmd === 'purge' && msg.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        let amt = args[0] === 'all' ? 100 : parseInt(args[0]);
        if (isNaN(amt) || amt < 1) return;
        await msg.channel.bulkDelete(Math.min(amt, 100), true);
        return msg.channel.send(`✅ Purged ${amt} messages.`).then(m => setTimeout(() => m.delete(), 3000));
    }

    if (cmd === 'givespec' && msg.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        const target = await findUser(msg, args);
        if (!target) return;
        const row = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`give_cat_${target.id}_${id}`).setPlaceholder('Select Category').addOptions([{ label: 'Clan', value: 'clan' }, { label: 'Element 1', value: 'element1' }, { label: 'Element 2', value: 'element2' }, { label: 'Trait', value: 'trait' }, { label: 'Kenjutsu', value: 'kenjutsu' }, { label: 'Village', value: 'village' }]));
        return msg.reply({ content: `Giving spec to **${target.username}**...`, components: [row] });
    }

    if (cmd === 'givels' && msg.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        const target = await findUser(msg, args);
        if (!target) return;
        const row = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`givels_cat_${target.id}_${id}`).setPlaceholder('Select Category').addOptions([{ label: 'Clan', value: 'clan' }, { label: 'Element 1', value: 'element1' }, { label: 'Element 2', value: 'element2' }, { label: 'Trait', value: 'trait' }, { label: 'Kenjutsu', value: 'kenjutsu' }]));
        return msg.reply({ content: `Giving Lucky Spins to **${target.username}**...`, components: [row] });
    }

    if (cmd === 'wipe' && msg.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        const target = await findUser(msg, args);
        if (!target) return;
        ensureUser(target.id);
        userData[target.id].finalized = { clan: 'None', element1: 'None', element2: 'None', trait: 'None', kenjutsu: 'None', village: 'None' };
        saveData();
        return msg.reply(`✅ Wiped specs for **${target.username}**.`);
    }

    if (cmd === 'resetspins' && msg.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        const target = await findUser(msg, args);
        if (!target) return;
        ensureUser(target.id);
        userData[target.id].spins = { clan: 25, element1: 5, element2: 5, trait: 7, kenjutsu: 7, village: 2 };
        userData[target.id].luckySpins = { clan: 0, element1: 0, element2: 0, trait: 0, kenjutsu: 0 };
        saveData();
        return msg.reply(`✅ Reset spins and lucky spins for **${target.username}**.`);
    }

    if (cmd === 'givespins' && msg.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        const target = await findUser(msg, args);
        if (!target) return;
        const row = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`givespins_cat_${target.id}_${id}`).setPlaceholder('Select Category').addOptions([{ label: 'Clan', value: 'clan' }, { label: 'Element 1', value: 'element1' }, { label: 'Element 2', value: 'element2' }, { label: 'Trait', value: 'trait' }, { label: 'Kenjutsu', value: 'kenjutsu' }, { label: 'Village', value: 'village' }]));
        return msg.reply({ content: `Giving Normal Spins to **${target.username}**...`, components: [row] });
    }
});

client.on(Events.InteractionCreate, async i => {
    if (i.isButton()) {
        const [action, mode, type, originalId] = i.customId.split('_');
        if (originalId && i.user.id !== originalId) return i.reply({ content: "Unauthorized!", ephemeral: true });
        const id = i.user.id;
        ensureUser(id);

        if (action === 'spin') {
            if (!SPIN_CHANNELS.includes(i.channelId)) return i.reply({ content: "❌ You can only spin in the designated spin channels!", ephemeral: true });
            const isLucky = mode === 'lucky';
            if (isLucky) userData[id].luckySpins[type]--;
            else userData[id].spins[type]--;
            
            let res;
            if (type === 'village') {
                res = getBalancedVillage();
            } else {
                const pool = type === 'clan' ? CLANS : (type.startsWith('element') ? ELEMENTS : (type === 'trait' ? TRAITS : KENJUTSU));
                res = weightedRandom(pool, isLucky);
            }
            
            userData[id].temp[type].push(res);
            saveData();
            const embed = new EmbedBuilder().setTitle(isLucky ? "🍀 LUCKY SPIN" : "🎰 SPIN").setColor(RARITY_COLORS[res.rarity] || 0x3498db).setDescription(`You rolled: **${res.emoji} ${res.item}**${res.rarity ? ` (\`${res.rarity}\`)` : ""}`);
            const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`finalize_${type}_${id}`).setLabel('Finalize').setStyle(ButtonStyle.Success), new ButtonBuilder().setCustomId(`spinagain_${type}_${id}`).setLabel('Spin Again').setStyle(ButtonStyle.Secondary));
            await i.update({ embeds: [embed], components: [row] });
        } else if (action === 'finalize') {
            const res = userData[id].temp[mode].pop();
            if (res) {
                userData[id].finalized[mode] = res.item;
                userData[id].temp[mode] = [];
                saveData();
                await i.update({ content: `✅ Finalized **${res.item}**!`, embeds: [], components: [] });
            }
        } else if (action === 'spinagain') {
            if (!SPIN_CHANNELS.includes(i.channelId)) return i.reply({ content: "❌ You can only spin in the designated spin channels!", ephemeral: true });
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
                const row = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`give_item_part_${p[2]}_clan_${i.user.id}`).setPlaceholder('Select Rarity Group').addOptions(rarities.map(r => ({ label: `${r} Clans`, value: r }))));
                await i.update({ content: `Select **Clan Rarity** to give to <@${p[2]}>:`, components: [row] });
            } else if (type === 'village') {
                const row = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`give_item_${p[2]}_village_${i.user.id}`).setPlaceholder('Select Village').addOptions(VILLAGES.map(v => ({ label: v.item, value: v.item, emoji: v.emoji }))));
                await i.update({ content: `Select **Village** to give to <@${p[2]}>:`, components: [row] });
            } else {
                const pool = type.startsWith('element') ? ELEMENTS : (type === 'trait' ? TRAITS : KENJUTSU);
                const row = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`give_item_${p[2]}_${type}_${i.user.id}`).setPlaceholder(`Select ${type}`).addOptions(pool.map(it => ({ label: it.item, value: it.item, description: it.rarity, emoji: it.emoji }))));
                await i.update({ content: `Select **${type}** to give to <@${p[2]}>:`, components: [row] });
            }
        } else if (p[0] === 'give' && p[1] === 'item' && p[2] === 'part') {
            if (i.user.id !== p[5]) return i.reply({ content: "Unauthorized!", ephemeral: true });
            const rarity = i.values[0];
            const pool = CLANS.filter(c => c.rarity === rarity);
            const row = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`give_item_${p[3]}_clan_${i.user.id}`).setPlaceholder('Select Clan').addOptions(pool.map(it => ({ label: it.item, value: it.item, description: it.rarity, emoji: it.emoji }))));
            await i.update({ content: `Select **${rarity} Clan** to give to <@${p[3]}>:`, components: [row] });
        } else if (p[0] === 'give' && p[1] === 'item') {
            if (i.user.id !== p[4]) return i.reply({ content: "Unauthorized!", ephemeral: true });
            ensureUser(p[2]);
            userData[p[2]].finalized[p[3]] = i.values[0];
            saveData();
            await i.update({ content: `✅ Gave **${i.values[0]}** to <@${p[2]}>!`, components: [] });
        } else if (p[0] === 'givels' && p[1] === 'cat') {
            if (i.user.id !== p[3]) return i.reply({ content: "Unauthorized!", ephemeral: true });
            const type = i.values[0];
            await i.update({ content: `How many **${type}** Lucky Spins to give? (Type a number)`, components: [] });
            const filter = m => m.author.id === i.user.id && !isNaN(parseInt(m.content));
            const col = i.channel.createMessageCollector({ filter, time: 15000, max: 1 });
            col.on('collect', m => {
                const amt = parseInt(m.content);
                ensureUser(p[2]);
                userData[p[2]].luckySpins[type] += amt;
                saveData();
                m.reply(`✅ Gave **${amt}** Lucky Spins to <@${p[2]}>.`);
            });
        } else if (p[0] === 'givespins' && p[1] === 'cat') {
            if (i.user.id !== p[3]) return i.reply({ content: "Unauthorized!", ephemeral: true });
            const type = i.values[0];
            await i.update({ content: `How many **${type}** Normal Spins to give? (Type a number)`, components: [] });
            const filter = m => m.author.id === i.user.id && !isNaN(parseInt(m.content));
            const col = i.channel.createMessageCollector({ filter, time: 15000, max: 1 });
            col.on('collect', m => {
                const amt = parseInt(m.content);
                ensureUser(p[2]);
                userData[p[2]].spins[type] += amt;
                saveData();
                m.reply(`✅ Gave **${amt}** Normal Spins to <@${p[2]}>.`);
            });
        }
    }
});

client.once('ready', () => { console.log(`✅ Main Bot ONLINE: ${client.user.tag}`); });
client.login(TOKEN);
