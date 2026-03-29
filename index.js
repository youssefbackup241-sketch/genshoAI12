const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const dotenv = require('dotenv');
dotenv.config();

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

// Load or create database
const dbFile = './database.json';
let db = { users: {} };
if (fs.existsSync(dbFile)) db = JSON.parse(fs.readFileSync(dbFile));

const saveDB = () => fs.writeFileSync(dbFile, JSON.stringify(db, null, 2));

// ------------------- DATA -------------------
const clanList = {
    Mythical: ['Ōtsutsuki', 'Kaguya'],
    Legendary: ['Uchiha', 'Senju', 'Hyuga', 'Uzumaki'],
    Epic: ['Yuki', 'Hozuki', 'Hoshigaki', 'Chinoike', 'Jugo', 'Kurama', 'Sabaku'],
    Rare: ['Shirogane', 'Yotsuki', 'Fūma', 'Iburi', 'Hatake', 'Kamizuru', 'Sarutobi'],
    Common: ['Aburame', 'Akimichi', 'Nara', 'Yamanaka', 'Inuzuka', 'Shimura', 'Lee']
};

const elementList = {
    Mythical: ['Yin', 'Yang', 'Chaos', 'Order'],
    Legendary: ['Wood'],
    Rare: ['Fire', 'Water', 'Earth', 'Wind', 'Lightning']
};

const traitList = {
    Mythical: ['Clan Specialist'],
    Legendary: ['Analytical Eye','Jutsu Amplification','Kekkei Genkai Proficiency'],
    Epic: ['Elemental Affinity Mastery','Illusion/Genjutsu Potency','Iryojutsu Proficiency'],
    Rare: ['Fuinjutsu Technique Expertise','Scientist','Superhuman Physique']
};

const emojis = {
    Mythical: '🟣',
    Legendary: '🟠',
    Epic: '🔵',
    Rare: '🟢',
    Common: '⚪'
};

const maxSpins = {
    clan: 10,
    element: 10,
    trait: 5
};

// ------------------- HELPERS -------------------
function getRandomRarity(list) {
    const rarities = Object.keys(list);
    const weights = { Mythical:1, Legendary:3, Epic:5, Rare:10, Common:20 }; // adjust chances
    const total = rarities.reduce((acc,r)=>acc+weights[r],0);
    let roll = Math.random()*total;
    for (const r of rarities) {
        roll -= weights[r];
        if (roll <= 0) return r;
    }
    return 'Common';
}

function spin(category) {
    if (category === 'clan') {
        const rarity = getRandomRarity(clanList);
        const choices = clanList[rarity];
        return { name: choices[Math.floor(Math.random()*choices.length)], rarity };
    } else if (category === 'element') {
        const rarity = getRandomRarity(elementList);
        const choices = elementList[rarity];
        return { name: choices[Math.floor(Math.random()*choices.length)], rarity };
    } else if (category === 'trait') {
        const rarity = getRandomRarity(traitList);
        const choices = traitList[rarity];
        return { name: choices[Math.floor(Math.random()*choices.length)], rarity };
    }
}

// ------------------- COMMANDS -------------------
client.on('messageCreate', async message => {
    if (message.author.bot) return;
    const args = message.content.trim().split(/\s+/);
    const cmd = args.shift().toLowerCase();

    // Initialize user in DB
    if (!db.users[message.author.id]) db.users[message.author.id] = { clan: null, elements: [], traits: [], spins: { clan:maxSpins.clan, element:maxSpins.element, trait:maxSpins.trait } };
    const user = db.users[message.author.id];

    // ----- !element -----
    if (cmd === '!element') {
        if (user.spins.element <= 0) return message.reply('You have no element spins left!');
        const result = spin('element');
        user.spins.element--;
        if (user.elements.length < 2) user.elements.push(result);
        saveDB();
        const embed = new EmbedBuilder()
            .setTitle('Element Spin')
            .setDescription(`${emojis[result.rarity]} **${result.name}** (${result.rarity})`)
            .setColor('Purple');
        return message.reply({ embeds: [embed] });
    }

    // ----- !clan -----
    if (cmd === '!clan') {
        if (user.spins.clan <= 0) return message.reply('You have no clan spins left!');
        const result = spin('clan');
        user.spins.clan--;
        user.clan = result;
        saveDB();
        const embed = new EmbedBuilder()
            .setTitle('Clan Spin')
            .setDescription(`${emojis[result.rarity]} **${result.name}** (${result.rarity})`)
            .setColor('Orange');
        return message.reply({ embeds: [embed] });
    }

    // ----- !trait -----
    if (cmd === '!trait') {
        if (user.spins.trait <= 0) return message.reply('You have no trait spins left!');
        const result = spin('trait');
        user.spins.trait--;
        user.traits.push(result);
        saveDB();
        const embed = new EmbedBuilder()
            .setTitle('Trait Spin')
            .setDescription(`${emojis[result.rarity]} **${result.name}** (${result.rarity})`)
            .setColor('Blue');
        return message.reply({ embeds: [embed] });
    }

    // ----- !check -----
    if (cmd === '!check') {
        let target = message.author;
        if (message.mentions.users.size) target = message.mentions.users.first();
        const tUser = db.users[target.id];
        if (!tUser) return message.reply('No data for this user.');
        const embed = new EmbedBuilder()
            .setTitle(`${target.username}'s Specs`)
            .setDescription(
                `**Clan:** ${tUser.clan ? `${emojis[tUser.clan.rarity]} ${tUser.clan.name}` : 'None'}\n`+
                `**Elements:** ${tUser.elements.length ? tUser.elements.map(e=>`${emojis[e.rarity]} ${e.name}`).join(', ') : 'None'}\n`+
                `**Traits:** ${tUser.traits.length ? tUser.traits.map(t=>`${emojis[t.rarity]} ${t.name}`).join(', ') : 'None'}`
            )
            .setColor('Green');
        return message.reply({ embeds: [embed] });
    }

    // ----- !announce -----
    if (cmd === '!announce') {
        if (!message.member.permissions.has('Administrator')) return;
        const content = args.join(' ');
        if (!content) return message.reply('Please provide a message!');
        const embed = new EmbedBuilder()
            .setTitle('📢 Announcement')
            .setDescription(content)
            .setColor('Yellow');
        return message.channel.send({ embeds: [embed] });
    }

    // ----- !cmds -----
    if (cmd === '!cmds') {
        const embed = new EmbedBuilder()
            .setTitle('Command List')
            .setDescription('!element | !clan | !trait | !check | !announce (staff) | !cmds')
            .setColor('Blue');
        return message.reply({ embeds: [embed] });
    }
});

client.login(process.env.BOT_TOKEN);
