require('dotenv').config();
const { Client, GatewayIntentBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

// ----- DATA -----
const CLANS = [
  { name: "Ōtsutsuki", rarity: "Mythical", emoji: "🌌" },
  { name: "Kaguya", rarity: "Mythical", emoji: "👑" },
  { name: "Uchiha", rarity: "Legendary", emoji: "🔥" },
  { name: "Senju", rarity: "Legendary", emoji: "🌲" },
  { name: "Hyuga", rarity: "Legendary", emoji: "👁️" },
  { name: "Uzumaki", rarity: "Legendary", emoji: "🌀" },
  { name: "Yuki", rarity: "Epic", emoji: "❄️" },
  { name: "Hozuki", rarity: "Epic", emoji: "💧" },
  { name: "Hoshigaki", rarity: "Epic", emoji: "🌑" },
  { name: "Chinoike", rarity: "Epic", emoji: "🩸" },
  { name: "Jugo", rarity: "Epic", emoji: "🟣" },
  { name: "Kurama", rarity: "Epic", emoji: "🦊" },
  { name: "Sabaku", rarity: "Epic", emoji: "🏜️" },
  { name: "Shirogane", rarity: "Rare", emoji: "⚪" },
  { name: "Yotsuki", rarity: "Rare", emoji: "🟡" },
  { name: "Fūma", rarity: "Rare", emoji: "🗡️" },
  { name: "Iburi", rarity: "Rare", emoji: "💨" },
  { name: "Hatake", rarity: "Rare", emoji: "👨‍🌾" },
  { name: "Kamizuru", rarity: "Rare", emoji: "🦅" },
  { name: "Sarutobi", rarity: "Rare", emoji: "🐒" },
  { name: "Aburame", rarity: "Common", emoji: "🐜" },
  { name: "Akimichi", rarity: "Common", emoji: "🍗" },
  { name: "Nara", rarity: "Common", emoji: "🦌" },
  { name: "Yamanaka", rarity: "Common", emoji: "🧠" },
  { name: "Inuzuka", rarity: "Common", emoji: "🐕" },
  { name: "Shimura", rarity: "Common", emoji: "🏯" },
  { name: "Lee", rarity: "Common", emoji: "🥋" }
];

const ELEMENTS = [
  { name: "Wood", rarity: "Legendary", emoji: "🌳" },
  { name: "Fire", rarity: "Rare", emoji: "🔥" },
  { name: "Water", rarity: "Rare", emoji: "💧" },
  { name: "Earth", rarity: "Rare", emoji: "🪨" },
  { name: "Wind", rarity: "Rare", emoji: "💨" },
  { name: "Lightning", rarity: "Rare", emoji: "⚡" },
  { name: "Yin", rarity: "Mythical", emoji: "🌑" },
  { name: "Yang", rarity: "Mythical", emoji: "🌕" },
  { name: "Chaos", rarity: "Mythical", emoji: "🌀" },
  { name: "Order", rarity: "Mythical", emoji: "⚖️" }
];

const TRAITS = [
  { name: "Analytical Eye", rarity: "Legendary", emoji: "👁️" },
  { name: "Clan Specialist", rarity: "Mythical", emoji: "🦸" },
  { name: "Jutsu Amplification", rarity: "Legendary", emoji: "💥" },
  { name: "Elemental Affinity Mastery", rarity: "Epic", emoji: "🌪️" },
  { name: "Illusion/Genjutsu Potency", rarity: "Epic", emoji: "🌀" },
  { name: "Kekkei Genkai Proficiency", rarity: "Legendary", emoji: "✨" },
  { name: "Fuinjutsu Technique Expertise", rarity: "Rare", emoji: "🛡️" },
  { name: "Iryojutsu Proficiency", rarity: "Epic", emoji: "🩹" },
  { name: "Scientist", rarity: "Rare", emoji: "🧪" },
  { name: "Superhuman Physique", rarity: "Rare", emoji: "💪" }
];

// ----- UTILITY -----
function getRandomItem(array) {
  const chanceRoll = Math.random() * 100;
  let pool = [];
  for (const item of array) {
    let chance = 0;
    switch (item.rarity) {
      case "Mythical": chance = 1; break;
      case "Legendary": chance = 5; break;
      case "Epic": chance = 15; break;
      case "Rare": chance = 30; break;
      case "Common": chance = 49; break;
    }
    for (let i = 0; i < chance; i++) pool.push(item);
  }
  return pool.length ? pool[Math.floor(Math.random() * pool.length)] : array[Math.floor(Math.random() * array.length)];
}

// ----- STORAGE -----
let users = {};
const DATA_FILE = './users.json';
if (fs.existsSync(DATA_FILE)) users = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));

function saveData() { fs.writeFileSync(DATA_FILE, JSON.stringify(users, null, 2)); }

// ----- SPIN LOGIC -----
function spinCategory(userId, category, amount) {
  if (!users[userId]) users[userId] = { spins: { clan: 10, element: 10, trait: 5 }, finalized: { clan: [], element: [], trait: [] } };
  let spinsLeft = users[userId].spins[category];
  if (spinsLeft <= 0) return null;

  const dataArray = category === "clan" ? CLANS : category === "element" ? ELEMENTS : TRAITS;
  const results = [];
  for (let i = 0; i < amount; i++) {
    if (users[userId].spins[category] <= 0) break;
    let item = getRandomItem(dataArray);

    // DUPLICATE PROTECTION
    let finalized = users[userId].finalized[category].map(f => f.name);
    let sameCount = finalized.filter(n => n === item.name).length;
    if (sameCount >= 2) {
      users[userId].spins[category] += 1; // give extra spin
      continue;
    }

    results.push(item);
    users[userId].spins[category] -= 1;
  }

  saveData();
  return results;
}

// ----- COMMANDS -----
client.on('messageCreate', async message => {
  if (message.author.bot) return;
  const prefix = "!";
  if (!message.content.startsWith(prefix)) return;

  const args = message.content.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  const userId = message.author.id;
  if (!users[userId]) users[userId] = { spins: { clan: 10, element: 10, trait: 5 }, finalized: { clan: [], element: [], trait: [] } };

  if (command === "clan" || command === "element" || command === "trait") {
    let results = spinCategory(userId, command, 1);
    if (!results || results.length === 0) return message.reply("No spins left!");

    const embed = new EmbedBuilder()
      .setTitle(`🎰 ${command.toUpperCase()} Spin`)
      .setDescription(results.map(r => `${r.emoji} **${r.name}** (${r.rarity})`).join("\n"))
      .addFields({ name: "Spins Left", value: `${users[userId].spins[command]}` })
      .setColor("Random");

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId(`finalize_${command}_${userId}`)
        .setLabel("Finalize")
        .setStyle(ButtonStyle.Success)
    );

    await message.reply({ embeds: [embed], components: [row] });
  }

  if (command === "check") {
    const data = users[userId].finalized;
    const embed = new EmbedBuilder()
      .setTitle(`${message.author.username}'s Finalized Specs`)
      .setDescription(
        `**Clans:** ${data.clan.map(c => c.emoji + " " + c.name).join(", ") || "None"}\n` +
        `**Elements:** ${data.element.map(c => c.emoji + " " + c.name).join(", ") || "None"}\n` +
        `**Traits:** ${data.trait.map(c => c.emoji + " " + c.name).join(", ") || "None"}`
      )
      .setColor("Random");
    message.reply({ embeds: [embed] });
  }

  if (command === "cmds") {
    const embed = new EmbedBuilder()
      .setTitle("Command List")
      .setDescription("!clan | !element | !trait | !check | !cmds | !announce")
      .setColor("Blue");
    message.reply({ embeds: [embed] });
  }

  if (command === "announce") {
    const text = args.join(" ");
    if (!text) return message.reply("Provide a message to announce.");
    const embed = new EmbedBuilder()
      .setDescription(text)
      .setColor("Green");
    message.channel.send({ embeds: [embed] });
  }
});

// ----- BUTTON INTERACTIONS -----
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;
  const [action, category, uid] = interaction.customId.split("_");
  if (action !== "finalize") return;

  if (interaction.user.id !== uid) return interaction.reply({ content: "This isn't your spin!", ephemeral: true });

  const results = spinCategory(uid, category, 0); // nothing new, just finalize previous
  if (!results) return interaction.reply({ content: "No spins to finalize!", ephemeral: true });

  const lastItem = users[uid].spins[category] < 10 ? null : getRandomItem(category === "clan" ? CLANS : category === "element" ? ELEMENTS : TRAITS);
  if (lastItem && !users[uid].finalized[category].some(f => f.name === lastItem.name)) {
    users[uid].finalized[category].push(lastItem);
    saveData();
  }

  await interaction.update({ content: `✅ Finalized your ${category}!`, components: [] });
});

// ----- LOGIN -----
client.login(process.env.DISCORD_TOKEN);
