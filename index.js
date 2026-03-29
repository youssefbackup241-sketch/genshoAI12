// index.js
const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });
const token = process.env.BOT_TOKEN;

let userData = {};
const dbFile = './db.json';

// Load database
if (fs.existsSync(dbFile)) userData = JSON.parse(fs.readFileSync(dbFile));

// Save database
function saveData() { fs.writeFileSync(dbFile, JSON.stringify(userData, null, 2)); }

// Ensure user entry
function ensureUser(id) {
    if (!userData[id]) userData[id] = {
        spins: { clan: 15, element: 5, trait: 5 },
        finalized: { clan: null, element: [], trait: null },
        temp: { clan: [], element: [], trait: [] }
    };
}

// Items
const CLANS = [
    { name: "Ōtsutsuki", rarity: "Mythical", emoji:"👑", weight:1 },
    { name: "Kaguya", rarity: "Mythical", emoji:"🛡️", weight:1 },
    { name: "Uchiha", rarity:"Legendary", emoji:"🔥", weight:5 },
    { name: "Senju", rarity:"Legendary", emoji:"🌳", weight:5 },
    { name: "Hyuga", rarity:"Legendary", emoji:"👁️", weight:5 },
    { name: "Uzumaki", rarity:"Legendary", emoji:"🌀", weight:5 },
    { name: "Yuki", rarity:"Epic", emoji:"❄️", weight:10 },
    { name: "Hozuki", rarity:"Epic", emoji:"💧", weight:10 },
    { name: "Hoshigaki", rarity:"Epic", emoji:"🌑", weight:10 },
    { name: "Chinoike", rarity:"Epic", emoji:"🩸", weight:10 },
    { name: "Jugo", rarity:"Epic", emoji:"🪨", weight:10 },
    { name: "Kurama", rarity:"Epic", emoji:"🦊", weight:10 },
    { name: "Sabaku", rarity:"Epic", emoji:"🏜️", weight:10 },
    { name: "Shirogane", rarity:"Rare", emoji:"⚪", weight:20 },
    { name: "Yotsuki", rarity:"Rare", emoji:"🟡", weight:20 },
    { name: "Fūma", rarity:"Rare", emoji:"🐉", weight:20 },
    { name: "Iburi", rarity:"Rare", emoji:"💨", weight:20 },
    { name: "Hatake", rarity:"Rare", emoji:"🗡️", weight:20 },
    { name: "Kamizuru", rarity:"Rare", emoji:"🕊️", weight:20 },
    { name: "Sarutobi", rarity:"Rare", emoji:"🙈", weight:20 },
    { name: "Aburame", rarity:"Common", emoji:"🐜", weight:50 },
    { name: "Akimichi", rarity:"Common", emoji:"🍗", weight:50 },
    { name: "Nara", rarity:"Common", emoji:"🦝", weight:50 },
    { name: "Yamanaka", rarity:"Common", emoji:"🧠", weight:50 },
    { name: "Inuzuka", rarity:"Common", emoji:"🐕", weight:50 },
    { name: "Shimura", rarity:"Common", emoji:"👴", weight:50 },
    { name: "Lee", rarity:"Common", emoji:"💪", weight:50 }
];

const ELEMENTS = [
    { name:"Wood", rarity:"Rare", emoji:"🌳", weight:15 },
    { name:"Fire", rarity:"Rare", emoji:"🔥", weight:25 },
    { name:"Water", rarity:"Rare", emoji:"💧", weight:25 },
    { name:"Earth", rarity:"Rare", emoji:"🪨", weight:25 },
    { name:"Wind", rarity:"Rare", emoji:"🌪️", weight:25 },
    { name:"Lightning", rarity:"Rare", emoji:"⚡", weight:25 },
    { name:"Yin", rarity:"Mythical", emoji:"☯️", weight:1 },
    { name:"Yang", rarity:"Mythical", emoji:"☯️", weight:1 },
    { name:"Chaos", rarity:"Mythical", emoji:"🌀", weight:1 },
    { name:"Order", rarity:"Mythical", emoji:"🔱", weight:1 }
];

const TRAITS = [
    { name:'Analytical Eye', rarity:'Legendary', emoji:'👁️', weight:2 },
    { name:'Jutsu Amplification', rarity:'Legendary', emoji:'⚡', weight:2 },
    { name:'Elemental Affinity Mastery', rarity:'Epic', emoji:'🔥', weight:10 },
    { name:'Illusion/Genjutsu Potency', rarity:'Epic', emoji:'🌀', weight:10 },
    { name:'Kekkei Genkai Proficiency', rarity:'Legendary', emoji:'🧬', weight:2 },
    { name:'Fuinjutsu Technique Expertise', rarity:'Rare', emoji:'📦', weight:20 },
    { name:'Iryojutsu Proficiency', rarity:'Epic', emoji:'💉', weight:10 },
    { name:'Scientist', rarity:'Rare', emoji:'🔬', weight:20 },
    { name:'Superhuman Physique', rarity:'Rare', emoji:'💪', weight:20 }
];

// Weighted random function
function weightedRandom(array) {
    const total = array.reduce((acc, i) => acc + i.weight, 0);
    let r = Math.random() * total;
    for (let i of array) {
        r -= i.weight;
        if (r <= 0) return i;
    }
}

// Send spin embed
async function sendSpin(interaction, type) {
    const id = interaction.user.id;
    ensureUser(id);

    if (userData[id].spins[type] <= 0) return interaction.reply({ content: `❌ No ${type} spins left!`, ephemeral:true });

    let pool = type === 'clan' ? CLANS : type==='element'? ELEMENTS : TRAITS;
    let result = weightedRandom(pool);

    // Duplicate handling
    let already = type==='element'? userData[id].temp.element : userData[id].temp[type];
    if (already.includes(result.name)) {
        userData[id].spins[type] +=1; // give extra spin
    } else {
        if (type==='element') userData[id].temp.element.push(result.name);
        else userData[id].temp[type].push(result.name);
    }
    userData[id].spins[type]--;

    const embed = new EmbedBuilder()
        .setTitle(`🎰 ${type.toUpperCase()} Spin`)
        .setDescription(`${result.emoji} **${result.name}** (${result.rarity})\nSpins left: ${userData[id].spins[type]}`)
        .setColor('#00FF00');
    
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`finalize_${type}`).setLabel('Finalize').setStyle(ButtonStyle.Success)
    );

    await interaction.reply({ embeds:[embed], components:[row], ephemeral:true });
    saveData();
}

// Finalize button
client.on('interactionCreate', async interaction=>{
    if (!interaction.isButton()) return;
    const id = interaction.user.id;
    ensureUser(id);
    const type = interaction.customId.replace('finalize_','');
    if (!['clan','element','trait'].includes(type)) return;

    const temp = type==='element'? userData[id].temp.element : userData[id].temp[type];
    if (temp.length===0) return interaction.update({ content:`❌ No ${type} to finalize!`, embeds:[], components:[] });

    if (type==='element') userData[id].finalized.element = Array.from(new Set(temp)).slice(0,2);
    else userData[id].finalized[type] = temp[0];
    if(type==='element') userData[id].temp.element=[];
    else userData[id].temp[type]=[];

    saveData();
    interaction.update({ content:`✅ Your ${type} has been finalized!`, embeds:[], components:[] });
});

// Commands
client.on('messageCreate', async message=>{
    if (message.author.bot) return;
    const args = message.content.split(' ');
    const cmd = args.shift().toLowerCase();

    ensureUser(message.author.id);

    if(cmd==='!clan'||cmd==='!element'||cmd==='!trait'){
        sendSpin(message, cmd.slice(1));
    }

    if(cmd==='!check'){
        const id = message.mentions.users.first()? message.mentions.users.first().id : message.author.id;
        ensureUser(id);
        const data = userData[id].finalized;
        const embed = new EmbedBuilder()
            .setTitle(`${message.mentions.users.first()? message.mentions.users.first().username : message.author.username}'s Specs`)
            .setColor('#FFD700')
            .setDescription(`**Clan:** ${data.clan||'None'}\n**Elements:** ${data.element.length?data.element.join(', '):'None'}\n**Trait:** ${data.trait||'None'}`);
        message.reply({ embeds:[embed] });
    }

    if(cmd==='!announce'){
        const content = args.join(' ');
        const embed = new EmbedBuilder()
            .setDescription(content)
            .setColor('#00FFFF');
        message.channel.send({ embeds:[embed] });
    }
});

client.login(token);
