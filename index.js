const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// Database
const DATA_PATH = path.join(__dirname, 'database.json');
let userData = {};
if (fs.existsSync(DATA_PATH)) userData = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
function saveData() { fs.writeFileSync(DATA_PATH, JSON.stringify(userData, null, 2)); }
function ensureUser(id) {
    if (!userData[id]) userData[id] = {
        spins: { clan: 10, element: 10, trait: 5 },
        finalized: { clan: null, element: [], trait: null },
        temp: { clan: [], element: [], trait: [] }
    };
}

// Rarities
const CLANS = [
    { item: 'Ōtsutsuki', rarity: 'Mythical' }, { item: 'Kaguya', rarity: 'Mythical' },
    { item: 'Uchiha', rarity: 'Legendary' }, { item: 'Senju', rarity: 'Legendary' },
    { item: 'Hyuga', rarity: 'Legendary' }, { item: 'Uzumaki', rarity: 'Legendary' },
    { item: 'Yuki', rarity: 'Epic' }, { item: 'Hozuki', rarity: 'Epic' }, { item: 'Hoshigaki', rarity: 'Epic' },
    { item: 'Chinoike', rarity: 'Epic' }, { item: 'Jugo', rarity: 'Epic' }, { item: 'Kurama', rarity: 'Epic' }, { item: 'Sabaku', rarity: 'Epic' },
    { item: 'Shirogane', rarity: 'Rare' }, { item: 'Yotsuki', rarity: 'Rare' }, { item: 'Fūma', rarity: 'Rare' },
    { item: 'Iburi', rarity: 'Rare' }, { item: 'Hatake', rarity: 'Rare' }, { item: 'Kamizuru', rarity: 'Rare' }, { item: 'Sarutobi', rarity: 'Rare' },
    { item: 'Aburame', rarity: 'Common' }, { item: 'Akimichi', rarity: 'Common' }, { item: 'Nara', rarity: 'Common' },
    { item: 'Yamanaka', rarity: 'Common' }, { item: 'Inuzuka', rarity: 'Common' }, { item: 'Shimura', rarity: 'Common' }, { item: 'Lee', rarity: 'Common' }
];

const ELEMENTS = [
    { item: 'Yin', rarity: 'Mythical' }, { item: 'Yang', rarity: 'Mythical' }, { item: 'Chaos', rarity: 'Mythical' }, { item: 'Order', rarity: 'Mythical' },
    { item: 'Wood', rarity: 'Legendary' }, { item: 'Fire', rarity: 'Rare' }, { item: 'Water', rarity: 'Rare' },
    { item: 'Earth', rarity: 'Rare' }, { item: 'Wind', rarity: 'Rare' }, { item: 'Lightning', rarity: 'Rare' }
];

const TRAITS = [
    { item: 'Analytical Eye', rarity: 'Legendary' }, { item: 'Jutsu Amplification', rarity: 'Legendary' },
    { item: 'Elemental Affinity Mastery', rarity: 'Epic' }, { item: 'Illusion/Genjutsu Potency', rarity: 'Epic' },
    { item: 'Kekkei Genkai Proficiency', rarity: 'Legendary' }, { item: 'Fuinjutsu Technique Expertise', rarity: 'Rare' },
    { item: 'Iryojutsu Proficiency', rarity: 'Epic' }, { item: 'Scientist', rarity: 'Rare' }, { item: 'Superhuman Physique', rarity: 'Rare' }
];

// Weighted random
function weightedRandom(arr) {
    const weights = { Mythical: 1, Legendary: 5, Epic: 15, Rare: 30, Common: 49 };
    const total = arr.reduce((sum, x) => sum + weights[x.rarity], 0);
    let rnd = Math.floor(Math.random() * total);
    for (const x of arr) {
        rnd -= weights[x.rarity];
        if (rnd < 0) return x;
    }
    return arr[0];
}

// Emoji mapping
const rarityEmoji = { Mythical: '🌟', Legendary: '💎', Epic: '🔥', Rare: '✨', Common: '⚪' };

// Spin function
async function spin(interaction, type) {
    const id = interaction.user.id;
    ensureUser(id);
    if (userData[id].spins[type] <= 0) return interaction.reply({ content: `❌ No ${type} spins left!`, ephemeral: true });

    let result;
    let attempts = 0;
    do {
        result = weightedRandom(type === 'clan' ? CLANS : type === 'element' ? ELEMENTS : TRAITS);
        attempts++;
    } while (userData[id].temp[type].filter(x => x.item === result.item).length >= 2 && attempts < 10);

    // Duplicate protection: +1 spin
    if (userData[id].temp[type].some(x => x.item === result.item)) userData[id].spins[type]++;

    userData[id].temp[type].push(result);
    userData[id].spins[type]--;
    saveData();

    const embed = new EmbedBuilder()
        .setTitle(`🎲 ${type.toUpperCase()} Spin Result`)
        .setColor({ Mythical: 0xff00ff, Legendary: 0xffa500, Epic: 0xff4500, Rare: 0x1e90ff, Common: 0xaaaaaa }[result.rarity])
        .setDescription(`${rarityEmoji[result.rarity]} **${result.item}** (${result.rarity})`)
        .addFields(
            { name: 'Spins left', value: `${userData[id].spins[type]}`, inline: true },
            { name: 'Temp results', value: userData[id].temp[type].map(x => `${rarityEmoji[x.rarity]} ${x.item}`).join(', ') || 'None', inline: false }
        )
        .setFooter({ text: 'Click Finalize to lock your spin!' });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`finalize_${type}`).setLabel('Finalize').setStyle(ButtonStyle.Primary)
    );

    interaction.reply({ embeds: [embed], components: [row] });
}

// Button handler
client.on('interactionCreate', async i => {
    if (!i.isButton()) return;
    const [action, type] = i.customId.split('_');
    const id = i.user.id;
    ensureUser(id);
    if (action === 'finalize') {
        if (type === 'element') {
            // Max 2 elements
            const finalized = userData[id].temp[type].slice(0, 2);
            userData[id].finalized[type] = finalized.map(x => x.item);
        } else {
            userData[id].finalized[type] = userData[id].temp[type][0]?.item || null;
        }
        userData[id].temp[type] = [];
        saveData();
        return i.update({ content: `✅ ${type} finalized!`, embeds: [], components: [] });
    }
});

// Commands
client.on('messageCreate', async msg => {
    if (!msg.content.startsWith('!')) return;
    const [cmd, ...args] = msg.content.slice(1).split(' ');
    const id = msg.author.id;
    ensureUser(id);

    if (cmd === 'clan' || cmd === 'element' || cmd === 'trait') return spin(msg, cmd);
    if (cmd === 'check') {
        const embed = new EmbedBuilder()
            .setTitle(`${msg.author.username}'s Finalized Specs`)
            .addFields(
                { name: 'Clan', value: userData[id].finalized.clan || 'None', inline: true },
                { name: 'Element', value: userData[id].finalized.element.join(', ') || 'None', inline: true },
                { name: 'Trait', value: userData[id].finalized.trait || 'None', inline: true }
            );
        return msg.reply({ embeds: [embed] });
    }
    if (cmd === 'cmds') {
        const embed = new EmbedBuilder()
            .setTitle('Commands')
            .setDescription('!clan, !element, !trait, !check, !cmds, !announce [message]');
        return msg.reply({ embeds: [embed] });
    }
    if (cmd === 'announce') {
        const embed = new EmbedBuilder()
            .setDescription(args.join(' '))
            .setColor(0x00ffff);
        return msg.channel.send({ embeds: [embed] });
    }
});

client.login(process.env.DISCORD_TOKEN);
