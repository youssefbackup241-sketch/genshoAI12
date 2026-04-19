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
const ACCEPTED_ROLE_ID = "1487175229351526717";
const REMINDER_CHANNEL_ID = "1488008579498901635";
const GHOST_PING_CHANNEL_ID = "1488021993948319865";
const AUDIT_LOG_CHANNEL_ID = "1488008579498901635"; // Defaulting to reminder channel for audit logs if not specified

const UCHIHA_ROLE_ID = "1487175229360046226";
const MS_ROLE_ID = "1487175229360046226"; // Using the same as provided Uchiha ID for MS as per prompt context
const EMS_ROLE_ID = "1487175229360046225";
const SPIN_CHANNELS = ["1487175230131535946", "1487175230555164876"];
const AUTO_ROLES = [
    "1487175229506584767",
    "1487175229498458264",
    "1487175229473296415",
    "1487175229426893001",
    "1487175229410377787",
    "1488684798254780416",
    "1487175229393473724",
    "1487175229351526720"
];

// RANKS
const RANKS = [
    { label: "Kage", value: "Kage", roleId: "1487175229498458263" },
    { label: "Elite Jounin", value: "Elite Jounin", roleId: "1487175229498458262" },
    { label: "Jounin", value: "Jounin", roleId: "1487175229485748395" },
    { label: "Chunin", value: "Chunin", roleId: "1487175229485748393" },
    { label: "Genin", value: "Genin", roleId: "1487175229485748392" },
    { label: "Academy", value: "Academy", roleId: "1487175229485748391" },
    { label: "Rogue", value: "Rogue", roleId: "1487175229485748394" }
];

const KAGE_ROLES = [
    { label: "Raikage", value: "Raikage", roleId: "1487175229506584770" },
    { label: "Sub-Raikage", value: "Sub-Raikage", roleId: "1487175229506584769" },
    { label: "Hokage", value: "Hokage", roleId: "1487175229519298625" },
    { label: "Sub-Hokage", value: "Sub-Hokage", roleId: "1487175229519298624" },
    { label: "Kazekage", value: "Kazekage", roleId: "1487175229506584776" },
    { label: "Sub-Kazekage", value: "Sub-Kazekage", roleId: "1487175229506584775" },
    { label: "Tsuchikage", value: "Tsuchikage", roleId: "1487175229506584774" },
    { label: "Sub-Tsuchikage", value: "Sub-Tsuchikage", roleId: "1487175229506584773" },
    { label: "Mizukage", value: "Mizukage", roleId: "1487175229506584772" },
    { label: "Sub-Mizukage", value: "Sub-Mizukage", roleId: "1487175229506584771" }
];

// Database Setup
const DB_FILE = './database.json';
let userData = {};
let capData = { capped: [] };
let emsLogs = [];

function loadData() {
    if (fs.existsSync(DB_FILE)) {
        try {
            const content = fs.readFileSync(DB_FILE, 'utf8');
            if (content) {
                const parsed = JSON.parse(content);
                userData = parsed.userData || {};
                capData = parsed.capData || { capped: [] };
                emsLogs = parsed.emsLogs || [];
            }
        } catch (e) { console.error("⚠️ Database load error:", e.message); }
    }
}
loadData();

function saveData() { 
    try { 
        fs.writeFileSync(DB_FILE, JSON.stringify({ userData, capData, emsLogs }, null, 2)); 
    } 
    catch (e) { console.error("⚠️ Database save error:", e.message); }
}

function ensureUser(id) {
    if (!userData[id]) {
        userData[id] = {
            spins: { clan: 25, element1: 5, element2: 5, trait: 7, kenjutsu: 7, village: 2 },
            luckySpins: { clan: 0, element1: 0, element2: 0, trait: 0, kenjutsu: 0 },
            temp: { clan: [], element1: [], element2: [], trait: [], kenjutsu: [], village: [] },
            finalized: { clan: 'None', element1: 'None', element2: 'None', trait: 'None', kenjutsu: 'None', village: 'None', specialty: 'None', subSpecialty: 'None' },
            oc_pending_start: null,
            last_reminder: null
        };
    }
    if (!userData[id].spins) userData[id].spins = { clan: 25, element1: 5, element2: 5, trait: 7, kenjutsu: 7, village: 2 };
    if (userData[id].spins.village === undefined) userData[id].spins.village = 2;
    if (userData[id].spins.kenjutsu === undefined) userData[id].spins.kenjutsu = 7;
    if (!userData[id].luckySpins) userData[id].luckySpins = { clan: 0, element1: 0, element2: 0, trait: 0, kenjutsu: 0 };
    if (userData[id].luckySpins.kenjutsu === undefined) userData[id].luckySpins.kenjutsu = 0;
    if (!userData[id].temp) userData[id].temp = { clan: [], element1: [], element2: [], trait: [], kenjutsu: [], village: [] };
    if (!userData[id].finalized) userData[id].finalized = { clan: 'None', element1: 'None', element2: 'None', trait: 'None', kenjutsu: 'None', village: 'None', specialty: 'None', subSpecialty: 'None' };
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

const SPECIALTIES = [
    { item: "Ninjutsu", emoji: "🌀", roleId: "1488604117541847281" },
    { item: "Genjutsu", emoji: "🎭", roleId: "1488604262924685525" },
    { item: "Taijutsu", emoji: "🥋", roleId: "1488608909747814490" }
];

const SUB_SPECIALTIES = [
    { item: "Iryojutsu", emoji: "🩹", roleId: "1488604929957560320" },
    { item: "Fuinjutsu", emoji: "📜", roleId: "1488605357310738452" },
    { item: "Bukijutsu", emoji: "⚔️", roleId: "1488611504684007464" },
    { item: "Kenjutsu", emoji: "🗡️", roleId: "1488611720195735822", restricted: "Kurogane" }
];

const RARITY_COLORS = { Mythical: 0xff00ff, Legendary: 0xffa500, Epic: 0x9400d3, Rare: 0x1e90ff, Common: 0x808080 };
const BANNED_WORDS = ["nigga", "nigger", "nigg", "nig ga", "faggot", "fag", "retard"];

// Helper: Weighted Random
function weightedRandom(items, isLucky = false) {
    const weights = { Mythical: 0.1, Legendary: 1, Epic: 5, Rare: 20, Common: 73.9 };
    let pool = items.filter(i => weights[i.rarity] > 0);
    if (pool.length === 0) pool = items; 

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

// Helper: Balanced logic
function getBalancedInfo(pool, type) {
    const counts = {};
    pool.forEach(p => counts[p.item] = 0);
    Object.values(userData).forEach(data => {
        if (data.finalized && data.finalized[type] && data.finalized[type] !== 'None') {
            counts[data.finalized[type]] = (counts[data.finalized[type]] || 0) + 1;
        }
    });
    const currentCounts = Object.values(counts);
    const minCount = Math.min(...currentCounts);
    let targetCap = 3;
    while (minCount >= targetCap) { targetCap += 3; }
    return { counts, targetCap };
}

function getBalancedChoice(pool, type) {
    const { counts, targetCap } = getBalancedInfo(pool, type);
    let available = pool.filter(p => counts[p.item] < targetCap && !capData.capped.includes(p.item));
    if (available.length === 0) available = pool.filter(p => !capData.capped.includes(p.item));
    return available.length > 0 ? available : pool;
}

// Helper: Assign Role
async function assignRoles(member, id) {
    if (!member) return;
    const data = userData[id].finalized;
    const rolesToAdd = [ACCEPTED_ROLE_ID];
    const pools = [CLANS, ELEMENTS, ELEMENTS, TRAITS, VILLAGES, SPECIALTIES, SUB_SPECIALTIES];
    const keys = ['clan', 'element1', 'element2', 'trait', 'village', 'specialty', 'subSpecialty'];
    keys.forEach((key, idx) => {
        const item = pools[idx].find(i => i.item === data[key]);
        if (item?.roleId) rolesToAdd.push(item.roleId);
    });
    await member.roles.add(rolesToAdd.filter(id => id)).catch(() => {});
    await member.roles.remove(OC_PENDING_ROLE_ID).catch(() => {});
}

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
        if (!data.oc_pending_start) continue;
        const guild = client.guilds.cache.first();
        if (!guild) continue;
        const member = await guild.members.fetch(id).catch(() => null);
        if (!member || !member.roles.cache.has(OC_PENDING_ROLE_ID)) {
            userData[id].oc_pending_start = null;
            saveData();
            continue;
        }

        const elapsed = now - data.oc_pending_start;
        // Kick after 3 days
        if (elapsed > 72 * 60 * 60 * 1000) {
            await member.send("⚠️ Kicked from **GENSHŌ — 幻象** (OC deadline missed).").catch(() => {});
            await member.kick("OC Missed").catch(() => {});
            userData[id].oc_pending_start = null;
            saveData();
            continue;
        }

        // Reminder every 12 hours
        if (!data.last_reminder || now - data.last_reminder > 12 * 60 * 60 * 1000) {
            const reminderChannel = await client.channels.fetch(REMINDER_CHANNEL_ID).catch(() => null);
            if (reminderChannel) {
                await reminderChannel.send(`⚠️ <@${id}>, this is a reminder to submit your OC. You have **${Math.round((72 * 60 * 60 * 1000 - elapsed) / (60 * 60 * 1000))} hours** remaining before automatic removal.`).catch(() => {});
            }
            await member.send(`⚠️ **OC REMINDER:** You have a character pending in **GENSHŌ**. Please submit your OC soon to avoid being kicked.`).catch(() => {});
            userData[id].last_reminder = now;
            saveData();
        }
    }
}, 15 * 60 * 1000);

// ----- EVENTS -----
client.on('guildMemberAdd', async member => {
    try {
        await member.roles.add([OC_PENDING_ROLE_ID, ...AUTO_ROLES]);
        ensureUser(member.id);
        userData[member.id].oc_pending_start = Date.now();
        saveData();
        const ghostChannel = await client.channels.fetch(GHOST_PING_CHANNEL_ID).catch(() => null);
        if (ghostChannel) {
            const m = await ghostChannel.send(`<@${member.id}>`);
            await m.delete().catch(() => {});
        }
        const welcomeEmbed = new EmbedBuilder()
            .setTitle("Welcome to **GENSHŌ — 幻象**")
            .setDescription(`You’ve stepped into a world shaped by the aftermath of chaos… where peace is fragile, and power defines your path.\n\nBefore you begin, make sure you:\n• Read the rules carefully\n• Create your character properly\n• Submit your OC before getting started\n• Understand the world and its lore\n• **Spin for your village using \`!villagespin\`**\n• **Choose your path with \`!specialty\` and \`!subspecialty\`**\n\n**Full server access will be granted once your OC is submitted and accepted by staff using \`!accept\`.**\n\n⚠️ **IMPORTANT:** You have a **3-day window** to submit your OC. Failure to do so will result in an automatic removal from the server.`)
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
        
        // Find user's rank from roles
        const member = await msg.guild.members.fetch(target.id).catch(() => null);
        let userRank = "None";
        if (member) {
            const allRanks = [...RANKS, ...KAGE_ROLES];
            const foundRank = allRanks.find(r => member.roles.cache.has(r.roleId));
            if (foundRank) userRank = foundRank.label;
        }

        const embed = new EmbedBuilder().setTitle(`✨ ${target.username.toUpperCase()}'S SPECS`).setColor(0x2b2d31)
            .addFields(
                { name: '🧬 Clan', value: `\`\`\`${data.clan}\`\`\``, inline: true }, 
                { name: '🔥 Element 1', value: `\`\`\`${data.element1}\`\`\``, inline: true }, 
                { name: '🌊 Element 2', value: `\`\`\`${data.element2}\`\`\``, inline: true }, 
                { name: '🔋 Trait', value: `\`\`\`${data.trait}\`\`\``, inline: true },
                { name: '⚔️ Kenjutsu', value: `\`\`\`${data.kenjutsu}\`\`\``, inline: true },
                { name: '🏘️ Village', value: `\`\`\`${data.village || 'None'}\`\`\``, inline: true },
                { name: '🌀 Specialty', value: `\`\`\`${data.specialty || 'None'}\`\`\``, inline: true },
                { name: '🩹 Sub-Specialty', value: `\`\`\`${data.subSpecialty || 'None'}\`\`\``, inline: true },
                { name: '🎖️ Rank', value: `\`\`\`${userRank}\`\`\``, inline: true }
            );
        return msg.reply({ embeds: [embed] });
    }

    if (cmd === 'cmds') {
        const embed = new EmbedBuilder().setTitle("📜 GENSHŌ COMMANDS").setColor(0x2b2d31)
            .addFields(
                { name: '👤 Player Commands', value: "`!check` - View your specs\n`!clan` - Spin for Clan\n`!element1` - Spin for 1st Element\n`!element2` - Spin for 2nd Element\n`!trait` - Spin for Trait\n`!kenjutsu` - Spin for Kenjutsu (Kurogane)\n`!villagespin` - Spin for Village\n`!specialty` - Choose Specialty\n`!subspecialty` - Choose Sub-Specialty\n`!ems` - Uchiha EMS Transplant" },
                { name: '🛡️ Staff Commands (Admin Only)', value: "`!accept @User` - Accept OC & Give Rank\n`!givespins @User` - Give Normal/Lucky Spins\n`!cap` - Open Capping Menu\n`!uncap` - Open Uncapping Menu\n`!givespec @User` - Manually set specs\n`!resetspins @User` - Reset user spins\n`!wipe @User` - Wipe user specs\n`!announce [text]` - Send an announcement\n`!emslogs` - View EMS transplant logs\n`!purge [amount]` - Bulk delete messages" }
            ).setFooter({ text: "Use spins in designated channels only." });
        return msg.reply({ embeds: [embed] });
    }

    if (cmd === 'ems') {
        const member = msg.member;
        if (!member.roles.cache.has(UCHIHA_ROLE_ID) || !member.roles.cache.has(MS_ROLE_ID)) {
            return msg.reply("❌ You must be an **Uchiha** and possess the **Mangekyou Sharingan** to attempt an EMS transplant.");
        }
        if (member.roles.cache.has(EMS_ROLE_ID)) {
            return msg.reply("✨ You already possess the **Eternal Mangekyou Sharingan**.");
        }

        const embed = new EmbedBuilder()
            .setTitle("👁️ EMS TRANSPLANTATION")
            .setDescription("To achieve the **Eternal Mangekyou Sharingan**, you must transplant the eyes of another Uchiha who possesses the Mangekyou Sharingan.\n\n⚠️ **WARNING:** This process is risky and its success depends entirely on the blood relation of the donor eyes.")
            .setColor(0x800000)
            .setImage("https://media.discordapp.net/attachments/1487175230131535946/1234567890/ems_ritual.gif"); // Placeholder for a cool visual

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`ems_start_${id}`).setLabel('Transplant Eyes').setStyle(ButtonStyle.Danger),
            new ButtonBuilder().setCustomId(`ems_leave_${id}`).setLabel('Leave').setStyle(ButtonStyle.Secondary)
        );

        return msg.reply({ embeds: [embed], components: [row] });
    }

    if (cmd === 'emslogs') {
        if (!msg.member.permissions.has(PermissionsBitField.Flags.Administrator)) return msg.reply("❌ Admin only.");
        if (emsLogs.length === 0) return msg.reply("📝 No EMS transplant logs found.");

        const embed = new EmbedBuilder()
            .setTitle("👁️ EMS TRANSPLANTATION LOGS")
            .setColor(0x800000)
            .setTimestamp();

        const recentLogs = emsLogs.slice(-10).reverse();
        let logText = "";
        recentLogs.forEach((log, index) => {
            const date = new Date(log.timestamp).toLocaleDateString();
            logText += `**${index + 1}.** <@${log.userId}> | **Donor:** ${log.donorName} | **Relation:** ${log.relation.toUpperCase()} | **Result:** ${log.success ? "✅" : "❌"} | *${date}*\n`;
        });

        embed.setDescription(logText || "No recent logs.");
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

    if (cmd === 'specialty' || cmd === 'subspecialty') {
        const type = cmd === 'specialty' ? 'specialty' : 'subSpecialty';
        const pool = cmd === 'specialty' ? SPECIALTIES : SUB_SPECIALTIES;
        const available = getBalancedChoice(pool, type);
        const row = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`select_${type}_${id}`).setPlaceholder(`Choose your ${cmd}`).addOptions(available.map(opt => ({ label: opt.item, value: opt.item, emoji: opt.emoji, description: opt.restricted ? `Restricted to ${opt.restricted}` : undefined }))));
        return msg.reply({ content: `Choose your **${cmd}**:`, components: [row] });
    }

    if (msg.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        if (cmd === 'accept') {
            const target = await findUser(msg, args);
            if (!target) return msg.reply("❌ Mention a user to accept.");
            const row = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`accept_rank_${target.id}_${id}`).setPlaceholder('Select Rank').addOptions(RANKS.map(r => ({ label: r.label, value: r.value }))));
            return msg.reply({ content: `Accepting **${target.username}**. Select their rank:`, components: [row] });
        }
        if (cmd === 'givespins') {
            const target = await findUser(msg, args);
            if (!target) return msg.reply("❌ Mention a user.");
            const row = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`givespins_mode_${target.id}_${id}`).setPlaceholder('Select Spin Type').addOptions([{ label: 'Normal Spins', value: 'normal' }, { label: 'Lucky Spins', value: 'lucky' }]));
            return msg.reply({ content: `Give spins to **${target.username}**:`, components: [row] });
        }
        if (cmd === 'cap') {
            const row = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`cap_cat_${id}`).setPlaceholder('Select Category to Cap').addOptions([{ label: 'Clan', value: 'clan' }, { label: 'Elements', value: 'elements' }, { label: 'Trait', value: 'trait' }, { label: 'Kenjutsu', value: 'kenjutsu' }, { label: 'Village', value: 'village' }, { label: 'Specialty', value: 'specialty' }, { label: 'Sub-Specialty', value: 'subSpecialty' }]));
            return msg.reply({ content: "Select a category to view items for capping:", components: [row] });
        }
        if (cmd === 'uncap') {
            if (capData.capped.length === 0) return msg.reply("⚠️ No items are currently capped.");
            const row = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`uncap_item_${id}`).setPlaceholder('Select Item to Uncap').addOptions(capData.capped.map(item => ({ label: item, value: item }))));
            return msg.reply({ content: "Select an item to uncap:", components: [row] });
        }
        if (cmd === 'givespec') {
            const target = await findUser(msg, args);
            if (!target) return;
            const row = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`give_cat_${target.id}_${id}`).setPlaceholder('Select Category').addOptions([{ label: 'Clan', value: 'clan' }, { label: 'Element 1', value: 'element1' }, { label: 'Element 2', value: 'element2' }, { label: 'Trait', value: 'trait' }, { label: 'Kenjutsu', value: 'kenjutsu' }, { label: 'Village', value: 'village' }, { label: 'Specialty', value: 'specialty' }, { label: 'Sub-Specialty', value: 'subSpecialty' }]));
            return msg.reply({ content: `Giving spec to **${target.username}**...`, components: [row] });
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
        if (cmd === 'wipe') {
            const target = await findUser(msg, args);
            if (!target) return msg.reply("❌ Mention a user to wipe.");
            ensureUser(target.id);
            const member = await msg.guild.members.fetch(target.id).catch(() => null);
            if (member) {
                const keepRoles = AUTO_ROLES;
                const rolesToRemove = member.roles.cache.filter(role => !keepRoles.includes(role.id) && role.id !== msg.guild.id);
                if (rolesToRemove.size > 0) await member.roles.remove(rolesToRemove).catch(() => {});
                await member.roles.remove(ACCEPTED_ROLE_ID).catch(() => {});
                await member.roles.add(OC_PENDING_ROLE_ID).catch(() => {});
                await member.setNickname(null).catch(() => {});
            }
            userData[target.id].finalized = { clan: 'None', element1: 'None', element2: 'None', trait: 'None', kenjutsu: 'None', village: 'None', specialty: 'None', subSpecialty: 'None' };
            userData[target.id].oc_pending_start = Date.now();
            saveData();
            return msg.reply(`✅ Wiped **${target.username}**.`);
        }
        if (cmd === 'announce') {
            const text = args.join(' ');
            if (!text) return;
            await msg.delete().catch(() => {});
            const embed = new EmbedBuilder().setDescription(text).setColor(0x000000);
            return msg.channel.send({ embeds: [embed] });
        }
        if (cmd === 'purge') {
            const amount = parseInt(args[0]);
            if (isNaN(amount) || amount < 1 || amount > 100) return msg.reply("❌ Provide an amount between 1 and 100.");
            await msg.delete().catch(() => {});
            const deleted = await msg.channel.bulkDelete(amount, true).catch(() => null);
            if (!deleted) return msg.reply("❌ Failed to purge messages. They may be older than 14 days.").then(m => setTimeout(() => m.delete(), 3000));
            return msg.channel.send(`✅ Purged **${deleted.size}** messages.`).then(m => setTimeout(() => m.delete(), 3000));
        }
    }
});

client.on(Events.InteractionCreate, async i => {
    const id = i.user.id;
    ensureUser(id);

    if (i.isModalSubmit()) {
        if (i.customId.startsWith('ems_modal_')) {
            const [,, category, originalId] = i.customId.split('_');
            if (id !== originalId) return i.reply({ content: "Unauthorized!", ephemeral: true });
            
            const donorName = i.fields.getTextInputValue('donor_name');
            const chances = { 'close': 0.6, 'distant': 0.3, 'clan': 0.1 };
            const success = Math.random() < chances[category];
            const member = await i.guild.members.fetch(id);

            // Log EMS Transplant
            emsLogs.push({
                userId: id,
                username: i.user.username,
                donorName: donorName,
                relation: category,
                success: success,
                timestamp: Date.now()
            });
            saveData();

            const auditChannel = await client.channels.fetch(AUDIT_LOG_CHANNEL_ID).catch(() => null);
            const auditEmbed = new EmbedBuilder()
                .setTitle("📝 EMS TRANSPLANT LOG")
                .addFields(
                    { name: "User", value: `<@${id}> (${i.user.username})`, inline: true },
                    { name: "Donor Relation", value: category.toUpperCase(), inline: true },
                    { name: "Donor Name", value: donorName, inline: true },
                    { name: "Result", value: success ? "✅ SUCCESS" : "❌ FAILURE", inline: true }
                )
                .setColor(success ? 0x00ff00 : 0xff0000)
                .setTimestamp();

            if (auditChannel) await auditChannel.send({ embeds: [auditEmbed] });

            if (success) {
                await member.roles.add(EMS_ROLE_ID).catch(() => {});
                return i.reply({ content: `✨ **SUCCESS!** The transplantation was successful. You have awakened the **Eternal Mangekyou Sharingan**.`, ephemeral: false });
            } else {
                return i.reply({ content: `❌ **FAILURE.** The transplantation failed. Your eyes rejected the donor's Mangekyou Sharingan.`, ephemeral: false });
            }
        }
    }

    if (i.isButton()) {
        if (i.customId.startsWith('ems_start_')) {
            const originalId = i.customId.split('_')[2];
            if (id !== originalId) return i.reply({ content: "Unauthorized!", ephemeral: true });

            const row = new ActionRowBuilder().addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId(`ems_select_${id}`)
                    .setPlaceholder('Select Donor Relation')
                    .addOptions([
                        { label: 'Close Relative (60%)', value: 'close', description: 'Parents, Siblings, Grandparents, Children' },
                        { label: 'Distant Relative (30%)', value: 'distant', description: 'Cousins, Aunts/Uncles, Great-grandparents' },
                        { label: 'Clan Member (10%)', value: 'clan', description: 'Broader group, tribal lineage' }
                    ])
            );
            return i.update({ content: "Select the relation of the donor eyes:", embeds: [], components: [row] });
        }
        if (i.customId.startsWith('ems_leave_')) {
            const originalId = i.customId.split('_')[2];
            if (id !== originalId) return i.reply({ content: "Unauthorized!", ephemeral: true });
            return i.update({ content: "You decided to leave the ritual.", embeds: [], components: [] });
        }
        const [action, mode, type, originalId] = i.customId.split('_');
        if (originalId && id !== originalId) return i.reply({ content: "Unauthorized!", ephemeral: true });
        if (action === 'spin') {
            const isLucky = mode === 'lucky';
            if (isLucky) userData[id].luckySpins[type]--; else userData[id].spins[type]--;
            let res = type === 'village' ? getBalancedChoice(VILLAGES, 'village')[Math.floor(Math.random() * getBalancedChoice(VILLAGES, 'village').length)] : weightedRandom(type === 'clan' ? CLANS : (type.startsWith('element') ? ELEMENTS : (type === 'trait' ? TRAITS : KENJUTSU)), isLucky);
            userData[id].temp[type].push(res); saveData();
            const embed = new EmbedBuilder().setTitle(isLucky ? "🍀 LUCKY SPIN" : "🎰 SPIN").setColor(RARITY_COLORS[res.rarity] || 0x3498db).setDescription(`Rolled: **${res.emoji} ${res.item}**${res.rarity ? ` (\`${res.rarity}\`)` : ""}`);
            const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`finalize_${type}_${id}`).setLabel('Finalize').setStyle(ButtonStyle.Success), new ButtonBuilder().setCustomId(`spinagain_${type}_${id}`).setLabel('Spin Again').setStyle(ButtonStyle.Secondary));
            await i.update({ embeds: [embed], components: [row] });
        } else if (action === 'finalize') {
            const res = userData[id].temp[mode].pop();
            if (res) {
                if (capData.capped.includes(res.item)) return i.reply({ content: `❌ **${res.item}** is capped! Spin again.`, ephemeral: true });
                userData[id].finalized[mode] = res.item; userData[id].temp[mode] = []; saveData();
                await i.update({ content: `✅ Finalized **${res.item}**! Roles assigned on \`!accept\`.`, embeds: [], components: [] });
            }
        } else if (action === 'spinagain') {
            const embed = new EmbedBuilder().setTitle(`🎰 ${mode.toUpperCase()} SPIN`).setDescription(`🔋 Normal: ${userData[id].spins[mode]}\n🍀 Lucky: ${userData[id].luckySpins[mode] || 0}`).setColor(0x7289da);
            const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`spin_normal_${mode}_${id}`).setLabel('Normal Spin').setStyle(ButtonStyle.Primary).setDisabled(userData[id].spins[mode] <= 0), new ButtonBuilder().setCustomId(`spin_lucky_${mode}_${id}`).setLabel('Lucky Spin').setStyle(ButtonStyle.Success).setDisabled((userData[id].luckySpins[mode] || 0) <= 0));
            await i.update({ embeds: [embed], components: [row] });
        }
    }

    if (i.isStringSelectMenu()) {
        const p = i.customId.split('_');
        if (p[0] === 'ems' && p[1] === 'select') {
            const targetId = p[2];
            if (id !== targetId) return i.reply({ content: "Unauthorized!", ephemeral: true });
            const category = i.values[0];

            const { ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
            const modal = new ModalBuilder()
                .setCustomId(`ems_modal_${category}_${id}`)
                .setTitle('EMS Transplantation Details');

            const nameInput = new TextInputBuilder()
                .setCustomId('donor_name')
                .setLabel("Who do the eyes belong to? (RP Name)")
                .setStyle(TextInputStyle.Short)
                .setPlaceholder("e.g. Itachi Uchiha")
                .setRequired(true);

            modal.addComponents(new ActionRowBuilder().addComponents(nameInput));
            return i.showModal(modal);
        }
        if (p[0] === 'select') {
            const type = p[1], choice = i.values[0];
            const config = type === 'specialty' ? SPECIALTIES.find(s => s.item === choice) : SUB_SPECIALTIES.find(s => s.item === choice);
            if (config.restricted && userData[id].finalized.clan !== config.restricted) return i.reply({ content: `❌ Restricted to **${config.restricted}**!`, ephemeral: true });
            if (capData.capped.includes(choice)) return i.reply({ content: `❌ **${choice}** is capped!`, ephemeral: true });
            userData[id].finalized[type] = choice; saveData();
            await i.update({ content: `✅ Chosen **${choice}**! Roles assigned on \`!accept\`.`, components: [] });
        } else if (p[0] === 'accept' && p[1] === 'rank') {
            const targetId = p[2], rankVal = i.values[0];
            const member = await i.guild.members.fetch(targetId).catch(() => null);
            if (!member) return i.reply("❌ User not found.");
            if (rankVal === 'Kage') {
                const row = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`accept_kage_${targetId}_${id}`).setPlaceholder('Select Kage Role').addOptions(KAGE_ROLES.map(k => ({ label: k.label, value: k.value }))));
                await i.update({ content: `Select specific Kage role for <@${targetId}>:`, components: [row] });
            } else {
                const rank = RANKS.find(r => r.value === rankVal);
                await assignRoles(member, targetId);
                await member.roles.add(rank.roleId).catch(() => {});
                userData[targetId].oc_pending_start = null; saveData();
                await i.update({ content: `✅ **${member.user.username}** accepted as **${rankVal}**!`, components: [] });
            }
        } else if (p[0] === 'accept' && p[1] === 'kage') {
            const targetId = p[2], kageVal = i.values[0];
            const member = await i.guild.members.fetch(targetId).catch(() => null);
            if (!member) return i.reply("❌ User not found.");
            const kage = KAGE_ROLES.find(k => k.value === kageVal);
            const kageRank = RANKS.find(r => r.value === 'Kage');
            await assignRoles(member, targetId);
            await member.roles.add([kageRank.roleId, kage.roleId]).catch(() => {});
            userData[targetId].oc_pending_start = null; saveData();
            await i.update({ content: `✅ **${member.user.username}** accepted as **${kageVal}**!`, components: [] });
        } else if (p[0] === 'givespins' && p[1] === 'mode') {
            const targetId = p[2], mode = i.values[0];
            const row = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`givespins_type_${targetId}_${mode}_${id}`).setPlaceholder('Select Item').addOptions([{ label: 'Clan', value: 'clan' }, { label: 'Element 1', value: 'element1' }, { label: 'Element 2', value: 'element2' }, { label: 'Trait', value: 'trait' }, { label: 'Kenjutsu', value: 'kenjutsu' }, { label: 'Village', value: 'village' }]));
            await i.update({ content: `Select item to give **${mode}** spins for:`, components: [row] });
        } else if (p[0] === 'givespins' && p[1] === 'type') {
            const targetId = p[2], mode = p[3], type = i.values[0];
            const row = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`givespins_amt_${targetId}_${mode}_${type}_${id}`).setPlaceholder('Select Amount').addOptions([1, 2, 3, 5, 10, 20, 50].map(n => ({ label: `${n} Spins`, value: `${n}` }))));
            await i.update({ content: `Select amount of **${mode}** ${type} spins:`, components: [row] });
        } else if (p[0] === 'givespins' && p[1] === 'amt') {
            const targetId = p[2], mode = p[3], type = p[4], amt = parseInt(i.values[0]);
            ensureUser(targetId);
            if (mode === 'lucky') userData[targetId].luckySpins[type] = (userData[targetId].luckySpins[type] || 0) + amt;
            else userData[targetId].spins[type] = (userData[targetId].spins[type] || 0) + amt;
            saveData();
            await i.update({ content: `✅ Added **${amt}** ${mode} ${type} spins to <@${targetId}>.`, components: [] });
        } else if (p[0] === 'cap' && p[1] === 'cat') {
            const type = i.values[0];
            const pool = type === 'elements' ? ELEMENTS : (type === 'clan' ? CLANS : (type === 'trait' ? TRAITS : (type === 'village' ? VILLAGES : (type === 'specialty' ? SPECIALTIES : (type === 'subSpecialty' ? SUB_SPECIALTIES : KENJUTSU)))));
            const row = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`cap_item_${id}`).setPlaceholder('Select Item to Cap').addOptions(pool.filter(it => !capData.capped.includes(it.item)).slice(0, 25).map(it => ({ label: it.item, value: it.item, emoji: it.emoji }))));
            await i.update({ content: `Select an item from **${type}** to cap:`, components: [row] });
        } else if (p[0] === 'cap' && p[1] === 'item') {
            const item = i.values[0]; if (!capData.capped.includes(item)) { capData.capped.push(item); saveData(); }
            await i.update({ content: `✅ **${item}** capped.`, components: [] });
        } else if (p[0] === 'uncap' && p[1] === 'item') {
            const item = i.values[0], idx = capData.capped.indexOf(item);
            if (idx > -1) { capData.capped.splice(idx, 1); saveData(); }
            await i.update({ content: `✅ **${item}** uncapped.`, components: [] });
        } else if (p[0] === 'give' && p[1] === 'cat') {
            const type = i.values[0], targetId = p[2];
            if (type === 'clan') {
                const rarities = ["Mythical", "Legendary", "Epic", "Rare", "Common"];
                const row = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`give_item_part_${targetId}_clan_${id}`).setPlaceholder('Select Rarity').addOptions(rarities.map(r => ({ label: r, value: r }))));
                await i.update({ content: `Select rarity for <@${targetId}>:`, components: [row] });
            } else {
                const pool = type === 'specialty' ? SPECIALTIES : (type === 'subSpecialty' ? SUB_SPECIALTIES : (type === 'village' ? VILLAGES : (type.startsWith('element') ? ELEMENTS : (type === 'trait' ? TRAITS : KENJUTSU))));
                const row = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`give_item_${targetId}_${type}_${id}`).setPlaceholder(`Select ${type}`).addOptions(pool.map(it => ({ label: it.item, value: it.item, emoji: it.emoji }))));
                await i.update({ content: `Select ${type} for <@${targetId}>:`, components: [row] });
            }
        } else if (p[0] === 'give' && p[1] === 'item' && p[2] === 'part') {
            const pool = CLANS.filter(c => c.rarity === i.values[0]);
            const row = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`give_item_${p[3]}_clan_${id}`).setPlaceholder('Select Clan').addOptions(pool.map(it => ({ label: it.item, value: it.item, emoji: it.emoji }))));
            await i.update({ content: `Select clan for <@${p[3]}>:`, components: [row] });
        } else if (p[0] === 'give' && p[1] === 'item') {
            userData[p[2]].finalized[p[3]] = i.values[0]; saveData();
            await i.update({ content: `✅ Gave **${i.values[0]}** to <@${p[2]}>!`, components: [] });
        }
    }
});

client.once(Events.ClientReady, () => { console.log(`✅ Main Bot ONLINE: ${client.user.tag}`); });
client.login(TOKEN);
