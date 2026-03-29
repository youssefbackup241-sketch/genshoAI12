const { Client, GatewayIntentBits, Partials, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

const dbFile = './database.json';
let db = fs.existsSync(dbFile) ? JSON.parse(fs.readFileSync(dbFile)) : {};

// ----- DATA -----
const clans = {
    Mythical: ["Ōtsutsuki", "Kaguya"],
    Legendary: ["Uchiha", "Senju", "Hyuga", "Uzumaki"],
    Epic: ["Yuki", "Hozuki", "Hoshigaki", "Chinoike", "Jugo", "Kurama", "Sabaku"],
    Rare: ["Shirogane", "Yotsuki", "Fūma", "Iburi", "Hatake", "Kamizuru", "Sarutobi"],
    Common: ["Aburame", "Akimichi", "Nara", "Yamanaka", "Inuzuka", "Shimura", "Lee"]
};

const elements = {
    Mythical: ["Yin", "Yang", "Chaos", "Order"],
    Legendary: ["Wood"],
    Rare: ["Fire", "Water", "Earth", "Wind", "Lightning"]
};

const traits = {
    Legendary: ["Analytical Eye","Jutsu Amplification","Kekkei Genkai Proficiency"],
    Epic: ["Elemental Affinity Mastery","Illusion/Genjutsu Potency","Iryojutsu Proficiency"],
    Rare: ["Fuinjutsu Technique Expertise","Scientist","Superhuman Physique"]
};

const rarityEmojis = {
    Mythical: "💎",
    Legendary: "🌟",
    Epic: "✨",
    Rare: "🔹",
    Common: "⚪"
};

const maxSpins = { element: 10, clan: 10, trait: 5 };
const maxFinal = { element: 2, clan: 1, trait: 1 };

// ----- HELPERS -----
function saveDB() { fs.writeFileSync(dbFile, JSON.stringify(db, null, 2)); }

function pickRarityWeighted(obj){
    const roll = Math.random()*100;
    let rarity;
    if(roll<1) rarity="Mythical";
    else if(roll<6) rarity="Legendary";
    else if(roll<21) rarity="Epic";
    else if(roll<50) rarity="Rare";
    else rarity="Common";

    const pool = obj[rarity] || [];
    const picked = pool[Math.floor(Math.random()*pool.length)];
    return { name: picked, rarity };
}

// ----- COMMANDS -----
client.on('messageCreate', async msg=>{
    if(msg.author.bot) return;
    const args = msg.content.trim().split(/ +/g);
    const cmd = args.shift().toLowerCase();

    // Spin commands
    if(["!element","!clan","!trait"].includes(cmd)){
        const type = cmd.slice(1);
        if(!db[msg.author.id]) db[msg.author.id] = { spins: { element: [], clan: [], trait: [] }, finalized: { element: [], clan: null, trait: null }};
        if(db[msg.author.id].spins[type].length >= maxSpins[type]) return msg.reply(`You used all your ${type} spins!`);

        const pool = type==="element"?elements:type==="clan"?clans:traits;
        const picked = pickRarityWeighted(pool);
        db[msg.author.id].spins[type].push(picked);
        saveDB();

        const embed = new EmbedBuilder()
            .setTitle(`${type.toUpperCase()} SPIN`)
            .setDescription(`${rarityEmojis[picked.rarity]} **${picked.name}** (${picked.rarity})\nReact ✅ to finalize`)
            .setColor(0x00FF00);

        const msgEmbed = await msg.channel.send({embeds:[embed]});
        await msgEmbed.react('✅');

        const filter = (reaction, user)=>reaction.emoji.name==='✅' && user.id===msg.author.id;
        const collector = msgEmbed.createReactionCollector({filter, max:1, time:60000});
        collector.on('collect', r=>{
            if(type==="element"){
                if(db[msg.author.id].finalized.element.length<maxFinal.element) db[msg.author.id].finalized.element.push(picked.name);
            } else db[msg.author.id].finalized[type]=picked.name;
            saveDB();
            msg.channel.send(`Finalized **${picked.name}** as your ${type}!`);
        });
    }

    // Check finalized
    if(cmd==="!check"){
        const user = msg.mentions.users.first()||msg.author;
        if(!db[user.id]||!db[user.id].finalized) return msg.reply("No finalized data!");
        const f = db[user.id].finalized;
        const embed = new EmbedBuilder()
            .setDescription(`**Clan:** ${f.clan||'None'}\n**Elements:** ${f.element.join(', ')||'None'}\n**Trait:** ${f.trait||'None'}`)
            .setColor(0xFFD700);
        msg.channel.send({embeds:[embed]});
    }

    // Announce
    if(cmd==="!announce"){
        const text = args.join(" ");
        if(!text) return msg.reply("Message required!");
        const embed = new EmbedBuilder()
            .setDescription(text)
            .setColor(0x00FFFF);
        msg.channel.send({embeds:[embed]});
    }

    // Command list
    if(cmd==="!cmds"){
        const embed = new EmbedBuilder()
            .setTitle("Commands")
            .setDescription("!element, !clan, !trait, !check, !announce, !cmds")
            .setColor(0xAAAAAA);
        msg.channel.send({embeds:[embed]});
    }
});

client.login(process.env.BOT_TOKEN);
