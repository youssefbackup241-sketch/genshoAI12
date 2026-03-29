const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

const databaseFile = './database.json';
let db = {};
if(fs.existsSync(databaseFile)) db = JSON.parse(fs.readFileSync(databaseFile));

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
    Mythical: [],
    Legendary: ["Analytical Eye","Jutsu Amplification","Kekkei Genkai Proficiency"],
    Epic: ["Elemental Affinity Mastery","Illusion/Genjutsu Potency","Iryojutsu Proficiency"],
    Rare: ["Fuinjutsu Technique Expertise","Scientist","Superhuman Physique"]
};

// Emojis for rarity
const rarityEmojis = {
    Mythical: "💎",
    Legendary: "🌟",
    Epic: "✨",
    Rare: "🔹",
    Common: "⚪"
};

// Spin limits
const maxSpins = { element: 10, clan: 10, trait: 5 };
const maxFinal = { element: 2, clan: 1, trait: 1 };

// ----- HELPERS -----
function saveDB() { fs.writeFileSync(databaseFile, JSON.stringify(db, null, 2)); }
function pickRarityWeighted(obj) {
    const pool = [];
    for(const rarity in obj) {
        const weight = rarity === "Mythical" ? 1 : rarity === "Legendary" ? 2 : rarity === "Epic" ? 3 : 4;
        obj[rarity].forEach(item=> { for(let i=0;i<weight;i++) pool.push({name:item, rarity}); });
    }
    return pool[Math.floor(Math.random()*pool.length)];
}

// ----- COMMANDS -----
client.on('messageCreate', async msg=>{
    if(msg.author.bot) return;
    const args = msg.content.trim().split(/ +/g);
    const cmd = args.shift().toLowerCase();

    // Spin commands
    if(cmd === "!element" || cmd === "!clan" || cmd === "!trait"){
        const type = cmd.slice(1);
        if(!db[msg.author.id]) db[msg.author.id] = { spins: { element: [], clan: [], trait: [] }, finalized: { element: [], clan: null, trait: null }};
        if(db[msg.author.id].spins[type].length >= maxSpins[type]) return msg.reply(`You used all your ${type} spins!`);

        const pool = type==="element"?elements:type==="clan"?clans:traits;
        const picked = pickRarityWeighted(pool);
        db[msg.author.id].spins[type].push(picked);
        saveDB();

        const embed = new EmbedBuilder()
            .setTitle(`${type.toUpperCase()} SPIN`)
            .setDescription(`${rarityEmojis[picked.rarity]} **${picked.name}** (${picked.rarity})`)
            .setColor(0x00FF00)
            .setFooter({text:"Click ✅ to finalize this spin"});
        
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

    // !check
    if(cmd==="!check"){
        let user = msg.mentions.users.first()||msg.author;
        if(!db[user.id]||!db[user.id].finalized) return msg.reply("No finalized data for this user!");
        const data = db[user.id].finalized;
        const embed = new EmbedBuilder()
            .setTitle(`${user.username}'s OC`)
            .setDescription(`**Clan:** ${data.clan||'None'}\n**Elements:** ${data.element.join(', ')||'None'}\n**Trait:** ${data.trait||'None'}`)
            .setColor(0xFFD700);
        msg.channel.send({embeds:[embed]});
    }

    // !announce
    if(cmd==="!announce"){
        const text = args.join(" ");
        if(!text) return msg.reply("Message required!");
        const embed = new EmbedBuilder()
            .setTitle("Announcement")
            .setDescription(text)
            .setColor(0x00FFFF);
        msg.channel.send({embeds:[embed]});
    }

    // STAFF commands (!setspec, !addspin, !wipe, !cmds)
    if(["!setspec","!addspin","!wipe","!cmds"].includes(cmd)){
        if(!msg.member.permissions.has("ManageGuild")) return msg.reply("Staff only");
        
        if(cmd==="!cmds"){
            msg.channel.send(`Staff commands: !setspec, !addspin, !wipe, !cmds, !announce`);
        }
        if(cmd==="!wipe"){
            const user = msg.mentions.users.first();
            if(!user) return msg.reply("Mention user");
            db[user.id]={spins:{element:[],clan:[],trait:[]},finalized:{element:[],clan:null,trait:null}};
            saveDB();
            msg.reply(`Cleared ${user.username}'s data`);
        }
        if(cmd==="!addspin"){
            const user = msg.mentions.users.first();
            if(!user) return msg.reply("Mention user");
            const type = args[1];
            const count = parseInt(args[2]);
            if(!["element","clan","trait"].includes(type)) return msg.reply("Invalid type");
            if(!db[user.id]) db[user.id]={spins:{element:[],clan:[],trait:[]},finalized:{element:[],clan:null,trait:null}};
            for(let i=0;i<count;i++){
                const pool = type==="element"?elements:type==="clan"?clans:traits;
                db[user.id].spins[type].push(pickRarityWeighted(pool));
            }
            saveDB();
            msg.reply(`Added ${count} ${type} spins to ${user.username}`);
        }
        if(cmd==="!setspec"){
            msg.reply("Please implement interactive selection via followup or buttons in your server.");
        }
    }
});

client.login(process.env.BOT_TOKEN);
