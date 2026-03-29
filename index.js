require('dotenv').config();
const { Client, Intents } = require('discord.js');
const fs = require('fs');

const client = new Client({
    intents: [Intents.Flags.Guilds, Intents.Flags.GuildMessages, Intents.Flags.MessageContent]
});

// ==== Data ====
const CLANS = {
    Mythical: ['Ōtsutsuki', 'Kaguya'],
    Legendary: ['Uchiha', 'Senju', 'Hyuga', 'Uzumaki'],
    Epic: ['Yuki','Hozuki','Hoshigaki','Chinoike','Jugo','Kurama','Sabaku'],
    Rare: ['Shirogane','Yotsuki','Fūma','Iburi','Hatake','Kamizuru','Sarutobi'],
    Common: ['Aburame','Akimichi','Nara','Yamanaka','Inuzuka','Shimura','Lee']
};

const ELEMENTS = {
    Mythical: ['Yin', 'Yang', 'Chaos', 'Order'],
    Legendary: ['Fire','Water','Wind','Earth','Lightning']
};

const TRAITS = {
    Legendary: ['Analytical Eye','Jutsu Amplification','Kekkei Genkai Proficiency'],
    Epic: ['Elemental Affinity Mastery','Illusion/Genjutsu Potency','Iryojutsu Proficiency'],
    Rare: ['Fuinjutsu Technique Expertise','Scientist','Superhuman Physique']
};

// ==== Spin limits ====
const MAX_SPINS = { clan: 10, element: 10, trait: 5 };

// ==== User data store ====
let data = {};
if (fs.existsSync('data.json')) data = JSON.parse(fs.readFileSync('data.json'));

// ==== Helpers ====
function saveData() {
    fs.writeFileSync('data.json', JSON.stringify(data, null, 2));
}

function rollRandom(arr, count = 1) {
    let results = [];
    for (let i = 0; i < count; i++) {
        const keys = Object.keys(arr);
        const rarity = keys[Math.floor(Math.random() * keys.length)];
        const choice = arr[rarity][Math.floor(Math.random() * arr[rarity].length)];
        results.push({ name: choice, rarity });
    }
    return results;
}

function ensureUser(userId) {
    if (!data[userId]) {
        data[userId] = {
            spins: { clan: MAX_SPINS.clan, element: MAX_SPINS.element, trait: MAX_SPINS.trait },
            rolls: { clan: [], element: [], trait: [] },
            finalized: { clan: null, element: [], trait: null }
        };
    }
}

// ==== Commands ====
client.on('messageCreate', async message => {
    if (message.author.bot) return;
    const args = message.content.trim().split(/ +/);
    const cmd = args.shift().toLowerCase();

    ensureUser(message.author.id);

    // ---- SPIN CLAN ----
    if (cmd === '!clan') {
        if (data[message.author.id].spins.clan <= 0) return message.reply('No clan spins left.');
        const roll = rollRandom(CLANS)[0];
        data[message.author.id].rolls.clan.push(roll);
        data[message.author.id].spins.clan--;
        saveData();
        return message.reply(`You rolled: **${roll.name} (${roll.rarity})**. Spins left: ${data[message.author.id].spins.clan}`);
    }

    // ---- SPIN ELEMENT ----
    if (cmd === '!element') {
        if (data[message.author.id].spins.element <= 0) return message.reply('No element spins left.');
        const rolls = rollRandom(ELEMENTS, 2);
        data[message.author.id].rolls.element.push(...rolls);
        data[message.author.id].spins.element--;
        saveData();
        return message.reply(`You rolled: ${rolls.map(r => `**${r.name} (${r.rarity})**`).join(' & ')}. Spins left: ${data[message.author.id].spins.element}`);
    }

    // ---- SPIN TRAIT ----
    if (cmd === '!trait') {
        if (data[message.author.id].spins.trait <= 0) return message.reply('No trait spins left.');
        const roll = rollRandom(TRAITS)[0];
        data[message.author.id].rolls.trait.push(roll);
        data[message.author.id].spins.trait--;
        saveData();
        return message.reply(`You rolled: **${roll.name} (${roll.rarity})**. Spins left: ${data[message.author.id].spins.trait}`);
    }

    // ---- FINALIZE ----
    if (cmd === '!finalize') {
        const userRolls = data[message.author.id].rolls;
        if (userRolls.clan.length === 0 || userRolls.element.length === 0 || userRolls.trait.length === 0) return message.reply('You must roll all types at least once.');
        data[message.author.id].finalized.clan = userRolls.clan[userRolls.clan.length-1];
        data[message.author.id].finalized.element = userRolls.element.slice(-2);
        data[message.author.id].finalized.trait = userRolls.trait[userRolls.trait.length-1];
        saveData();
        return message.reply(`Your final OC is:\nClan: ${data[message.author.id].finalized.clan.name}\nElements: ${data[message.author.id].finalized.element.map(e => e.name).join(', ')}\nTrait: ${data[message.author.id].finalized.trait.name}`);
    }

    // ---- STAFF COMMANDS ----
    if (message.member.permissions.has('Administrator')) {
        // Wipe user
        if (cmd === '!wipe') {
            const target = message.mentions.users.first();
            if (!target) return message.reply('Mention a user to wipe.');
            delete data[target.id];
            saveData();
            return message.reply(`User ${target.tag} data wiped.`);
        }

        // Add spins
        if (cmd === '!addspin') {
            const target = message.mentions.users.first();
            const type = args[1]?.toLowerCase();
            const amount = parseInt(args[2]) || 1;
            if (!target || !['clan','element','trait'].includes(type)) return message.reply('Usage: !addspin @user type amount');
            ensureUser(target.id);
            data[target.id].spins[type] += amount;
            saveData();
            return message.reply(`Added ${amount} ${type} spins to ${target.tag}.`);
        }

        // Set specs manually
        if (cmd === '!setspecs') {
            const target = message.mentions.users.first();
            if (!target) return message.reply('Mention a user.');
            ensureUser(target.id);
            data[target.id].finalized.clan = { name: args[1] || null, rarity: 'Custom' };
            data[target.id].finalized.element = [{ name: args[2] || null, rarity:'Custom'},{ name: args[3] || null, rarity:'Custom'}];
            data[target.id].finalized.trait = { name: args[4] || null, rarity:'Custom' };
            saveData();
            return message.reply(`User ${target.tag} specs set manually.`);
        }

        // Check rolls
        if (cmd === '!check') {
            const target = message.mentions.users.first();
            if (!target) return message.reply('Mention a user.');
            ensureUser(target.id);
            const rolls = data[target.id].rolls;
            return message.reply(`User ${target.tag} rolls:\nClans: ${rolls.clan.map(r => r.name).join(', ')}\nElements: ${rolls.element.map(r => r.name).join(', ')}\nTraits: ${rolls.trait.map(r => r.name).join(', ')}`);
        }

        // Command list
        if (cmd === '!cmds') {
            const cmds = `
**User Commands:**
!clan, !element, !trait, !finalize

**Staff Commands:**
!wipe, !addspin, !setspecs, !check, !cmds
`;
            return message.reply(cmds);
        }
    }
});

// ==== Login ====
client.login(process.env.BOT_TOKEN);
