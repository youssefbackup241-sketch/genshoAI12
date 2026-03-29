require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// Rarity emojis
const rarityEmojis = {
    Mythical: '💎',
    Legendary: '🌟',
    Epic: '🔥',
    Rare: '✨',
    Common: '⚪'
};

// Rarity chances
const rarityWeights = {
    Mythical: 1,
    Legendary: 5,
    Epic: 15,
    Rare: 30,
    Common: 49
};

// Clans
const clans = {
    Mythical: ['Ōtsutsuki','Kaguya'],
    Legendary: ['Uchiha','Senju','Hyuga','Uzumaki'],
    Epic: ['Yuki','Hozuki','Hoshigaki','Chinoike','Jugo','Kurama','Sabaku'],
    Rare: ['Shirogane','Yotsuki','Fūma','Iburi','Hatake','Kamizuru','Sarutobi'],
    Common: ['Aburame','Akimichi','Nara','Yamanaka','Inuzuka','Shimura','Lee']
};

// Elements
const elements = {
    Mythical: ['Yin','Yang','Chaos','Order'],
    Legendary: ['Wood'],
    Rare: ['Fire','Water','Earth','Wind','Lightning']
};

// Traits
const traits = {
    Legendary: ['Analytical Eye','Jutsu Amplification','Kekkei Genkai Proficiency'],
    Epic: ['Elemental Affinity Mastery','Illusion/Genjutsu Potency','Iryojutsu Proficiency'],
    Rare: ['Fuinjutsu Technique Expertise','Scientist','Superhuman Physique']
};

// Users database
const users = {};

// Helpers
function weightedRandom(typeObj) {
    const allItems = [];
    for(const [rarity, items] of Object.entries(typeObj)) {
        const weight = rarityWeights[rarity] || 1;
        items.forEach(item => { for(let i=0;i<weight;i++) allItems.push({item, rarity}); });
    }
    return allItems[Math.floor(Math.random()*allItems.length)];
}

function sendSpinEmbed(message, typeName, result) {
    const embed = new EmbedBuilder()
        .setTitle(`🎲 ${typeName.toUpperCase()} SPIN!`)
        .setDescription(`${rarityEmojis[result.rarity]} **${result.item}**\nRarity: **${result.rarity}**`)
        .setColor('Random');
    message.reply({ embeds: [embed] });
}

// Commands
client.on('messageCreate', (message) => {
    if(message.author.bot) return;

    const args = message.content.trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    // Initialize user
    if(!users[message.author.id]) users[message.author.id] = {
        clanSpins: 10,
        elementSpins: 10,
        traitSpins: 5
    };
    const user = users[message.author.id];

    const isStaff = message.member.permissions.has('Administrator');

    // Clan spin
    if(cmd === '!clan') {
        if(user.clanSpins <= 0) return message.reply('No clan spins left!');
        const result = weightedRandom(clans);
        user.clanSpins--;
        sendSpinEmbed(message, 'Clan', result);
    }

    // Element spin
    if(cmd === '!element') {
        if(user.elementSpins <= 0) return message.reply('No element spins left!');
        const result = weightedRandom(elements);
        user.elementSpins--;
        sendSpinEmbed(message, 'Element', result);
    }

    // Trait spin
    if(cmd === '!trait') {
        if(user.traitSpins <= 0) return message.reply('No trait spins left!');
        const result = weightedRandom(traits);
        user.traitSpins--;
        sendSpinEmbed(message, 'Trait', result);
    }

    // Staff commands
    if(isStaff) {
        // Wipe
        if(cmd === '!wipe') {
            const targetId = args[0]?.replace(/[<@!>]/g,'');
            if(targetId) {
                users[targetId] = { clanSpins:10, elementSpins:10, traitSpins:5 };
                message.reply(`Wiped spins for <@${targetId}>`);
            }
        }

        // Add spins
        if(cmd === '!addspin') {
            const targetId = args[0]?.replace(/[<@!>]/g,'');
            const type = args[1]; // clan/element/trait
            const amount = parseInt(args[2]);
            if(targetId && type && !isNaN(amount)) {
                if(!users[targetId]) users[targetId] = { clanSpins:0, elementSpins:0, traitSpins:0 };
                users[targetId][type+'Spins'] += amount;
                message.reply(`Added ${amount} ${type} spins to <@${targetId}>`);
            }
        }

        // Set specs
        if(cmd === '!setspecs') {
            const targetId = args[0]?.replace(/[<@!>]/g,'');
            const type = args[1]; // clan/element/trait
            const value = args.slice(2).join(' ');
            if(targetId && type && value) {
                if(!users[targetId]) users[targetId] = { clanSpins:0, elementSpins:0, traitSpins:0 };
                users[targetId][type+'Spec'] = value;
                users[targetId][type+'Spins'] = 0; // reset spins after manual set
                message.reply(`Set ${type} spec for <@${targetId}> to ${value}`);
            }
        }

        // Command list
        if(cmd === '!cmds') {
            message.reply('**Staff Commands:** !clan !element !trait !wipe !addspin !setspecs !cmds');
        }
    }
});

client.login(process.env.BOT_TOKEN);
