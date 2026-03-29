const { Client, GatewayIntentBits, Partials, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
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
    Rare: ["Fire", "Water", "Earth", "Wind", "Lightning"],
    Common: []
};

const traits = {
    Legendary: ["Analytical Eye","Jutsu Amplification","Kekkei Genkai Proficiency"],
    Epic: ["Elemental Affinity Mastery","Illusion/Genjutsu Potency","Iryojutsu Proficiency"],
    Rare: ["Fuinjutsu Technique Expertise","Scientist","Superhuman Physique"],
    Common: []
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
    if(pool.length===0) return pickRarityWeighted(obj);
    const picked = pool[Math.floor(Math.random()*pool.length)];
    return { name: picked, rarity };
}

// ----- COMMANDS -----
client.on('messageCreate', async msg=>{
    if(msg.author.bot) return;
    const args = msg.content.trim().split(/ +/g);
    const cmd = args.shift().toLowerCase();

    if(["!element","!clan","!trait"].includes(cmd)){
        const type = cmd.slice(1);
        if(!db[msg.author.id]) db[msg.author.id] = { spins: { element: [], clan: [], trait: [] }, finalized: { element: [], clan: null, trait: null }};
        if(db[msg.author.id].spins[type].length >= maxSpins[type]) return msg.reply(`You used all your ${type} spins!`);

        const pool = type==="element"?elements:type==="clan"?clans:traits;
        const picked = pickRarityWeighted(pool);
        db[msg.author.id].spins[type].push(picked);
        saveDB();

        const remainingSpins = maxSpins[type] - db[msg.author.id].spins[type].length;

        const embed = new EmbedBuilder()
            .setTitle(`🎰 ${type.toUpperCase()} SPIN 🎰`)
            .setDescription(`${rarityEmojis[picked.rarity]} **${picked.name}** (${picked.rarity})`)
            .addFields({ name: 'Spins Left', value: remainingSpins.toString(), inline:true })
            .setColor(0x00FF00)
            .setFooter({ text:`Click "Finalize" to lock this ${type}` });

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('finalize')
                    .setLabel('Finalize')
                    .setStyle(ButtonStyle.Success)
            );

        const msgEmbed = await msg.channel.send({embeds:[embed], components:[row]});

        const collector = msgEmbed.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', i=>{
            if(i.user.id !== msg.author.id) return i.reply({content:"This is not for you!", ephemeral:true});
            if(type==="element"){
                if(db[msg.author.id].finalized.element.length<maxFinal.element) db[msg.author.id].finalized.element.push(picked.name);
                else return i.reply({content:`You already finalized ${maxFinal.element} elements!`, ephemeral:true});
            } else {
                if(!db[msg.author.id].finalized[type]) db[msg.author.id].finalized[type]=picked.name;
                else return i.reply({content:`You already finalized a ${type}!`, ephemeral:true});
            }
            saveDB();
            i.update({content:`✅ Finalized **${picked.name}** as your ${type}!`, embeds:[], components:[]});
        });
    }

    if(cmd==="!check"){
        const user = msg.mentions.users.first()||msg.author;
        if(!db[user.id]||!db[user.id].finalized) return msg.reply("No finalized data!");
        const f = db[user.id].finalized;
        const embed = new EmbedBuilder()
            .setTitle(`${user.username}'s Finalized Spins`)
            .setDescription(`${rarityEmojis[f.clan?getRarity(clans,f.clan):'Rare']||''} **Clan:** ${f.clan||'None'}\n`+
                            `${(f.element[0]?rarityEmojis[getRarity(elements,f.element[0])]: '')} **Elements:** ${f.element.join(', ')||'None'}\n`+
                            `${rarityEmojis[f.trait?getRarity(traits,f.trait):'Rare']||''} **Trait:** ${f.trait||'None'}`)
            .setColor(0xFFD700);
        msg.channel.send({embeds:[embed]});
    }

    if(cmd==="!announce"){
        const text = args.join(" ");
        if(!text) return msg.reply("Message required!");
        const embed = new EmbedBuilder()
            .setDescription(text)
            .setColor(0x00FFFF);
        msg.channel.send({embeds:[embed]});
    }

    if(cmd==="!cmds"){
        const embed = new EmbedBuilder()
            .setTitle("Commands")
            .setDescription("!element, !clan, !trait, !check, !announce, !cmds")
            .setColor(0xAAAAAA);
        msg.channel.send({embeds:[embed]});
    }
});

// Helper to find rarity for !check emojis
function getRarity(obj, name){
    for(const [rarity, list] of Object.entries(obj)){
        if(list.includes(name)) return rarity;
    }
    return "Rare";
}

client.login(process.env.BOT_TOKEN);
