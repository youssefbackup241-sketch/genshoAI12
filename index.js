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
            spins: { clan: 15, element1: 5, element2: 5, trait: 3 },
            luckySpins: { clan: 0, element1: 0, element2: 0, trait: 0 },
            temp: { clan: [], element1: [], element2: [], trait: [] },
            finalized: { clan: 'None', element1: 'None', element2: 'None', trait: 'None' },
            oc_pending_start: null
        };
    }
    if (!userData[id].spins) userData[id].spins = { clan: 15, element1: 5, element2: 5, trait: 3 };
    if (!userData[id].luckySpins) userData[id].luckySpins = { clan: 0, element1: 0, element2: 0, trait: 0 };
    if (!userData[id].temp) userData[id].temp = { clan: [], element1: [], element2: [], trait: [] };
    if (!userData[id].finalized) userData[id].finalized = { clan: 'None', element1: 'None', element2: 'None', trait: 'None' };
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
    { item: "Ice", rarity: "Epic", emoji: "❄️" }, { item: "Lava", rarity: "Epic", emoji: "🌋" }, { item: "Wood", rarity: "Legendary", emoji: "🌳" }, { item: "Particle", rarity: "Mythical", emoji: "✨" }
];

const TRAITS = [
    { item: "Strong Body", rarity: "Rare", emoji: "💪" }, { item: "Fast Reflexes", rarity: "Rare", emoji: "⚡" }, { item: "High Intellect", rarity: "Epic", emoji: "🧠" }, { item: "Sage Mode", rarity: "Legendary", emoji: "🐸" }, { item: "Six Paths Power", rarity: "Mythical", emoji: "🌞" }
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
        await member.roles.add(OC_PENDING_ROLE_ID);
        ensureUser(member.id);
        userData[member.id].oc_pending_start = Date.now();
        saveData();
        const embed = new EmbedBuilder().setTitle("Welcome to **GENSHŌ — 幻象**").setDescription(`You’ve stepped into a world shaped by the aftermath of chaos… where peace is fragile, and power defines your path.\n\nBefore you begin, make sure you:\n• Read the rules carefully\n• Create your character properly\n• Submit your OC before getting started\n• Understand the world and its lore\n\n**Full server access will be granted once your OC is submitted and accepted.**\n\n⚠️ **IMPORTANT:** You have a **3-day window** to submit your OC. Failure to do so will result in an automatic removal from the server.`).setColor(0x000000);
        await member.send({ embeds: [embed] }).catch(() => {});
    } catch (e) { console.error("Join error:", e.message); }
});

client.on('messageCreate', async msg => {
    if (msg.author.bot) return;
    if (!msg.member?.permissions.has(PermissionsBitField.Flags.Administrator)) {
        if (BANNED_WORDS.some(w => msg.content.toLowerCase().includes(w))) {
            await msg.delete().catch(() => {});
            return msg.channel.send(`⚠️ <@${msg.author.id}>, inappropriate language.`).then(m => setTimeout(() => m.delete(), 3000));
        }
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
        const embed = new EmbedBuilder().setTitle(`✨ ${target.username.toUpperCase()}'S SPECS`).setColor(0x2b2d31).setThumbnail(target.displayAvatarURL())
            .addFields({ name: '🧬 Clan', value: `\`\`\`${data.clan}\`\`\``, inline: true }, { name: '🔥 Element 1', value: `\`\`\`${data.element1}\`\`\``, inline: true }, { name: '🌊 Element 2', value: `\`\`\`${data.element2}\`\`\``, inline: true }, { name: '🔋 Trait', value: `\`\`\`${data.trait}\`\`\``, inline: true });
        return msg.reply({ embeds: [embed] });
    }

    if (['clan', 'element1', 'element2', 'trait'].includes(cmd)) {
        const type = cmd;
        const embed = new EmbedBuilder().setTitle(`🎰 ${type.toUpperCase()} SPIN`).setDescription(`🔋 Normal: ${userData[id].spins[type]}\n🍀 Lucky: ${userData[id].luckySpins[type]}`).setColor(0x7289da);
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`spin_normal_${type}`).setLabel('Normal Spin').setStyle(ButtonStyle.Primary).setDisabled(userData[id].spins[type] <= 0),
            new ButtonBuilder().setCustomId(`spin_lucky_${type}`).setLabel('Lucky Spin').setStyle(ButtonStyle.Success).setDisabled(userData[id].luckySpins[type] <= 0)
        );
        return msg.reply({ embeds: [embed], components: [row] });
    }

    if (cmd === 'cmds') {
        const embed = new EmbedBuilder().setTitle("📜 GENSHŌ RPG COMMANDS").setColor(0x2b2d31)
            .addFields(
                { name: '✨ Player Commands', value: "`!check` - View your specs\n`!clan` - Spin for a clan\n`!element1` - Spin for element 1\n`!element2` - Spin for element 2\n`!trait` - Spin for a trait" },
                { name: '🛡️ Staff Commands', value: "`!givespec @User` - Directly assign a spec\n`!givels @User` - Give lucky spins\n`!resetspins @User` - Reset normal spins\n`!wipe @User` - Clear a user's specs\n`!announce [msg]` - Post an announcement\n`!purge [num/all]` - Delete messages" }
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
        const row = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`give_cat_${target.id}_${id}`).setPlaceholder('Select Category').addOptions([{ label: 'Clan', value: 'clan' }, { label: 'Element 1', value: 'element1' }, { label: 'Element 2', value: 'element2' }, { label: 'Trait', value: 'trait' }]));
        return msg.reply({ content: `Giving spec to **${target.username}**...`, components: [row] });
    }

    if (cmd === 'givels' && msg.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        const target = await findUser(msg, args);
        if (!target) return;
        const row = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`givels_cat_${target.id}_${id}`).setPlaceholder('Select Category').addOptions([{ label: 'Clan', value: 'clan' }, { label: 'Element 1', value: 'element1' }, { label: 'Element 2', value: 'element2' }, { label: 'Trait', value: 'trait' }]));
        return msg.reply({ content: `Giving Lucky Spins to **${target.username}**...`, components: [row] });
    }

    if (cmd === 'wipe' && msg.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        const target = await findUser(msg, args);
        if (!target) return;
        ensureUser(target.id);
        userData[target.id].finalized = { clan: 'None', element1: 'None', element2: 'None', trait: 'None' };
        saveData();
        return msg.reply(`✅ Wiped specs for **${target.username}**.`);
    }

    if (cmd === 'resetspins' && msg.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
        const target = await findUser(msg, args);
        if (!target) return;
        ensureUser(target.id);
        userData[target.id].spins = { clan: 15, element1: 5, element2: 5, trait: 3 };
        saveData();
        return msg.reply(`✅ Reset spins for **${target.username}**.`);
    }
});

client.on(Events.InteractionCreate, async i => {
    if (i.isButton()) {
        const [action, mode, type, originalId] = i.customId.split('_');
        if (originalId && i.user.id !== originalId) return i.reply({ content: "Unauthorized!", ephemeral: true });
        const id = i.user.id;
        ensureUser(id);

        if (action === 'spin') {
            const isLucky = mode === 'lucky';
            if (isLucky) userData[id].luckySpins[type]--;
            else userData[id].spins[type]--;
            const pool = type === 'clan' ? CLANS : (type.startsWith('element') ? ELEMENTS : TRAITS);
            const res = weightedRandom(pool, isLucky);
            userData[id].temp[type].push(res);
            saveData();
            const embed = new EmbedBuilder().setTitle(isLucky ? "🍀 LUCKY SPIN" : "🎰 SPIN").setColor(RARITY_COLORS[res.rarity] || 0x3498db).setDescription(`You rolled: **${res.emoji} ${res.item}** (\`${res.rarity}\`)`);
            const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`finalize_${type}`).setLabel('Finalize').setStyle(ButtonStyle.Success), new ButtonBuilder().setCustomId(`spinagain_${type}_${id}`).setLabel('Spin Again').setStyle(ButtonStyle.Secondary));
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
            const embed = new EmbedBuilder().setTitle(`🎰 ${mode.toUpperCase()} SPIN`).setDescription(`🔋 Normal: ${userData[id].spins[mode]}\n🍀 Lucky: ${userData[id].luckySpins[mode]}`).setColor(0x7289da);
            const row = new ActionRowBuilder().addComponents(new ButtonBuilder().setCustomId(`spin_normal_${mode}`).setLabel('Normal Spin').setStyle(ButtonStyle.Primary).setDisabled(userData[id].spins[mode] <= 0), new ButtonBuilder().setCustomId(`spin_lucky_${mode}`).setLabel('Lucky Spin').setStyle(ButtonStyle.Success).setDisabled(userData[id].luckySpins[mode] <= 0));
            await i.update({ embeds: [embed], components: [row] });
        }
    }

    if (i.isStringSelectMenu()) {
        const p = i.customId.split('_');
        if (p[0] === 'give' && p[1] === 'cat') {
            if (i.user.id !== p[3]) return i.reply({ content: "Unauthorized!", ephemeral: true });
            const type = i.values[0];
            const pool = type === 'clan' ? CLANS : (type.startsWith('element') ? ELEMENTS : TRAITS);
            const row = new ActionRowBuilder().addComponents(new StringSelectMenuBuilder().setCustomId(`give_item_${p[2]}_${type}_${i.user.id}`).setPlaceholder(`Select ${type}`).addOptions(pool.map(it => ({ label: it.item, value: it.item, description: it.rarity, emoji: it.emoji }))));
            await i.update({ content: `Select **${type}** to give:`, components: [row] });
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
        }
    }
});

client.once('ready', () => { console.log(`✅ Main Bot ONLINE: ${client.user.tag}`); });
client.login(TOKEN);
