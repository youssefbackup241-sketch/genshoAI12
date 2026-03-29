require('dotenv').config();
const { Client, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

// Data
const clans = {
    Mythical: ['Ōtsutsuki', 'Kaguya'],
    Legendary: ['Uchiha', 'Senju', 'Hyuga', 'Uzumaki'],
    Epic: ['Yuki','Hozuki','Hoshigaki','Chinoike','Jugo','Kurama','Sabaku'],
    Rare: ['Shirogane','Yotsuki','Fūma','Iburi','Hatake','Kamizuru','Sarutobi'],
    Common: ['Aburame','Akimichi','Nara','Yamanaka','Inuzuka','Shimura','Lee']
};

const elements = {
    Mythical: ['Yin', 'Yang', 'Chaos', 'Order'],
    Legendary: ['Wood'],
    Rare: ['Fire','Water','Earth','Wind','Lightning']
};

const traits = {
    Legendary: ['Analytical Eye', 'Jutsu Amplification', 'Kekkei Genkai Proficiency'],
    Epic: ['Elemental Affinity Mastery','Illusion/Genjutsu Potency','Iryojutsu Proficiency'],
    Rare: ['Fuinjutsu Technique Expertise','Scientist','Superhuman Physique']
};

// User storage
const users = {}; // { userId: { clanSpins: [], elementSpins: [], traitSpins: [], finalized: {} } }

// Helper
function randomChoice(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// Commands
client.on('messageCreate', async (message) => {
    if(message.author.bot) return;
    const args = message.content.trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    // Init user
    if(!users[message.author.id]) users[message.author.id] = {
        clanSpins: 10,
        elementSpins: 10,
        traitSpins: 5,
        finalized: { clans: [], elements: [], traits: [] }
    };

    // ELEMENT SPIN
    if(cmd === '!element') {
        if(users[message.author.id].elementSpins <= 0) return message.reply('No element spins left!');
        const chosen = randomChoice(Object.values(elements).flat());
        users[message.author.id].elementSpins--;
        message.reply(`You spun: **${chosen}**. Use !finalize element ${chosen} to keep it.`);
    }

    // CLAN SPIN
    if(cmd === '!clan') {
        if(users[message.author.id].clanSpins <= 0) return message.reply('No clan spins left!');
        const chosen = randomChoice(Object.values(clans).flat());
        users[message.author.id].clanSpins--;
        message.reply(`You spun: **${chosen}**. Use !finalize clan ${chosen} to keep it.`);
    }

    // TRAIT SPIN
    if(cmd === '!trait') {
        if(users[message.author.id].traitSpins <= 0) return message.reply('No trait spins left!');
        const chosen = randomChoice(Object.values(traits).flat());
        users[message.author.id].traitSpins--;
        message.reply(`You spun: **${chosen}**. Use !finalize trait ${chosen} to keep it.`);
    }

    // FINALIZE
    if(cmd === '!finalize') {
        const type = args.shift();
        const choice = args.join(' ');
        if(!['clan','element','trait'].includes(type)) return message.reply('Invalid type!');
        if(users[message.author.id].finalized[type + 's'].includes(choice)) return message.reply('Already finalized this!');
        users[message.author.id].finalized[type + 's'].push(choice);
        message.reply(`You finalized: **${choice}** for ${type}.`);
    }

    // STAFF: WIPE
    if(cmd === '!wipe' && message.member.permissions.has('Administrator')) {
        const userId = args[0].replace(/[<@!>]/g,'');
        if(!users[userId]) return message.reply('User not found!');
        users[userId] = { clanSpins:10, elementSpins:10, traitSpins:5, finalized:{ clans: [], elements: [], traits: [] } };
        message.reply('User spins reset!');
    }

    // STAFF: ADD SPINS
    if(cmd === '!addspin' && message.member.permissions.has('Administrator')) {
        const userId = args[0].replace(/[<@!>]/g,'');
        const type = args[1];
        const amount = parseInt(args[2]);
        if(!users[userId]) users[userId] = { clanSpins:0, elementSpins:0, traitSpins:0, finalized:{ clans: [], elements: [], traits: [] } };
        users[userId][type+'Spins'] += amount;
        message.reply(`Added ${amount} ${type} spins to <@${userId}>`);
    }

    // STAFF: SET SPECS
    if(cmd === '!setspecs' && message.member.permissions.has('Administrator')) {
        const userId = args[0].replace(/[<@!>]/g,'');
        const type = args[1];
        const value = args.slice(2).join(' ');
        if(!users[userId]) users[userId] = { clanSpins:0, elementSpins:0, traitSpins:0, finalized:{ clans: [], elements: [], traits: [] } };
        users[userId].finalized[type+'s'] = [value];
        message.reply(`Set ${type} for <@${userId}> to ${value}`);
    }

    // STAFF: CMD LIST
    if(cmd === '!cmds' && message.member.permissions.has('Administrator')) {
        message.reply('**Commands:** !element !clan !trait !finalize !wipe !addspin !setspecs !cmds');
    }
});

client.login(process.env.BOT_TOKEN);
