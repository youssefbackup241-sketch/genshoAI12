require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// Emojis for rarities
const rarityEmojis = {
    Mythical: '💎',
    Legendary: '🌟',
    Epic: '🔥',
    Rare: '✨',
    Common: '⚪'
};

// Data
const clans = {
    Mythical: ['Ōtsutsuki', 'Kaguya'],
    Legendary: ['Uchiha', 'Senju', 'Hyuga', 'Uzumaki'],
    Epic: ['Yuki','Hozuki','Hoshigaki','Chinoike','Jugo','Kurama','Sabaku'],
    Rare: ['Shirogane','Yotsuki','Fūma','Iburi','Hatake','Kamizuru','Sarutobi'],
    Common: ['Aburame','Akimichi','Nara','Yamanaka','Inuzuka','Shimura','Lee']
};

const elements = {
    Mythical: ['Yin','Yang','Chaos','Order'],
    Legendary: ['Wood'],
    Rare: ['Fire','Water','Earth','Wind','Lightning']
};

const traits = {
    Legendary: ['Analytical Eye', 'Jutsu Amplification', 'Kekkei Genkai Proficiency'],
    Epic: ['Elemental Affinity Mastery','Illusion/Genjutsu Potency','Iryojutsu Proficiency'],
    Rare: ['Fuinjutsu Technique Expertise','Scientist','Superhuman Physique']
};

// Users database
const users = {};

// Helpers
function randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function getRarity(item, type) {
    for (const [rarity, list] of Object.entries(type)) {
        if(list.includes(item)) return rarity;
    }
    return 'Common';
}

// Send spin embed
function sendSpinEmbed(message, type, item) {
    const rarity = getRarity(item, type);
    const embed = new EmbedBuilder()
        .setTitle(`🎲 ${type.slice(0,-1).toUpperCase()} SPIN!`)
        .setDescription(`${rarityEmojis[rarity]} **${item}**\nRarity: **${rarity}**`)
        .setColor('Random');
    message.reply({ embeds: [embed] });
}

// Commands
client.on('messageCreate', async (message) => {
    if(message.author.bot) return;
    const args = message.content.trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    if(!users[message.author.id]) users[message.author.id] = {
        clanSpins: 10,
        elementSpins: 10,
        traitSpins: 5,
        current: { clans: [], elements: [], traits: [] },
        finalized: { clans: [], elements: [], traits: [] }
    };
    const user = users[message.author.id];

    // CLAN
    if(cmd === '!clan') {
        if(user.clanSpins <= 0) return message.reply('No clan spins left!');
        const choice = randomChoice(Object.values(clans).flat());
        user.clanSpins--;
        user.current.clans.push(choice);
        sendSpinEmbed(message, clans, choice);
    }

    // ELEMENT
    if(cmd === '!element') {
        if(user.elementSpins <= 0) return message.reply('No element spins left!');
        const choice = randomChoice(Object.values(elements).flat());
        user.elementSpins--;
        user.current.elements.push(choice);
        sendSpinEmbed(message, elements, choice);
    }

    // TRAIT
    if(cmd === '!trait') {
        if(user.traitSpins <= 0) return message.reply('No trait spins left!');
        const choice = randomChoice(Object.values(traits).flat());
        user.traitSpins--;
        user.current.traits.push(choice);
        sendSpinEmbed(message, traits, choice);
    }

    // FINALIZE
    if(cmd === '!finalize') {
        const type = args.shift();
        const choice = args.join(' ');
        if(!['clan','element','trait'].includes(type)) return message.reply('Invalid type!');
        if(!user.current[type+'s'].includes(choice)) return message.reply('You didn’t spin this item!');
        if(user.finalized[type+'s'].includes(choice)) return message.reply('Already finalized!');
        user.finalized[type+'s'].push(choice);
        const embed = new EmbedBuilder()
            .setTitle(`✅ Finalized ${type}`)
            .setDescription(`You chose **${choice}**`)
            .setColor('Green');
        message.reply({ embeds: [embed] });
    }

    // STAFF
    const isStaff = message.member.permissions.has('Administrator');

    // WIPE
    if(cmd === '!wipe' && isStaff) {
        const targetId = args[0].replace(/[<@!>]/g,'');
        users[targetId] = { clanSpins:10, elementSpins:10, traitSpins:5, current:{ clans: [], elements: [], traits: [] }, finalized:{ clans: [], elements: [], traits: [] }};
        message.reply(`Wiped spins for <@${targetId}>`);
    }

    // ADDSPIN
    if(cmd === '!addspin' && isStaff) {
        const targetId = args[0].replace(/[<@!>]/g,'');
        const type = args[1];
        const amount = parseInt(args[2]);
        if(!users[targetId]) users[targetId] = { clanSpins:0, elementSpins:0, traitSpins:0, current:{ clans: [], elements: [], traits: [] }, finalized:{ clans: [], elements: [], traits: [] }};
        users[targetId][type+'Spins'] += amount;
        message.reply(`Added ${amount} ${type} spins to <@${targetId}>`);
    }

    // SETSPECS
    if(cmd === '!setspecs' && isStaff) {
        const targetId = args[0].replace(/[<@!>]/g,'');
        const type = args[1]; // clan/element/trait
        const value = args.slice(2).join(' ');
        if(!users[targetId]) users[targetId] = { clanSpins:0, elementSpins:0, traitSpins:0, current:{ clans: [], elements: [], traits: [] }, finalized:{ clans: [], elements: [], traits: [] }};
        if(!['clan','element','trait'].includes(type)) return message.reply('Invalid type!');
        users[targetId].finalized[type+'s'] = [value];
        message.reply(`Set ${type} for <@${targetId}> to ${value}`);
    }

    // CMD LIST
    if(cmd === '!cmds' && isStaff) {
        message.reply('**Commands:** !clan !element !trait !finalize !wipe !addspin !setspecs !cmds');
    }
});

client.login(process.env.BOT_TOKEN);
