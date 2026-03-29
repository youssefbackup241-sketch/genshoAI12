require("dotenv").config();
const { Client, GatewayIntentBits, Partials, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Events } = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
  partials: [Partials.Channel]
});

// ---- DATA ----
const CLANS = [
  { name: "Ōtsutsuki", rarity: "Mythical", emoji: "👹" },
  { name: "Kaguya", rarity: "Mythical", emoji: "👺" },
  { name: "Uchiha", rarity: "Legendary", emoji: "🦅" },
  { name: "Senju", rarity: "Legendary", emoji: "🌲" },
  { name: "Hyuga", rarity: "Legendary", emoji: "👁️" },
  { name: "Uzumaki", rarity: "Legendary", emoji: "🌀" },
  { name: "Yuki", rarity: "Epic", emoji: "❄️" },
  { name: "Hozuki", rarity: "Epic", emoji: "💧" },
  { name: "Hoshigaki", rarity: "Epic", emoji: "🌑" },
  { name: "Chinoike", rarity: "Epic", emoji: "🩸" },
  { name: "Jugo", rarity: "Epic", emoji: "🌿" },
  { name: "Kurama", rarity: "Epic", emoji: "🦊" },
  { name: "Sabaku", rarity: "Epic", emoji: "🏜️" },
  { name: "Shirogane", rarity: "Rare", emoji: "⚪" },
  { name: "Yotsuki", rarity: "Rare", emoji: "✴️" },
  { name: "Fūma", rarity: "Rare", emoji: "🗡️" },
  { name: "Iburi", rarity: "Rare", emoji: "💨" },
  { name: "Hatake", rarity: "Rare", emoji: "🪓" },
  { name: "Kamizuru", rarity: "Rare", emoji: "🦅" },
  { name: "Sarutobi", rarity: "Rare", emoji: "🐒" },
  { name: "Aburame", rarity: "Common", emoji: "🐛" },
  { name: "Akimichi", rarity: "Common", emoji: "🍗" },
  { name: "Nara", rarity: "Common", emoji: "🦉" },
  { name: "Yamanaka", rarity: "Common", emoji: "🧠" },
  { name: "Inuzuka", rarity: "Common", emoji: "🐕" },
  { name: "Shimura", rarity: "Common", emoji: "👴" },
  { name: "Lee", rarity: "Common", emoji: "🥷" },
];

const ELEMENTS = [
  { name: "Yin", rarity: "Mythical", emoji: "☯️" },
  { name: "Yang", rarity: "Mythical", emoji: "☯️" },
  { name: "Chaos", rarity: "Mythical", emoji: "💀" },
  { name: "Order", rarity: "Mythical", emoji: "⚖️" },
  { name: "Wood", rarity: "Rare", emoji: "🌳" },
  { name: "Fire", rarity: "Rare", emoji: "🔥" },
  { name: "Water", rarity: "Rare", emoji: "💧" },
  { name: "Earth", rarity: "Rare", emoji: "🌍" },
  { name: "Wind", rarity: "Rare", emoji: "🌪️" },
  { name: "Lightning", rarity: "Rare", emoji: "⚡" },
];

const TRAITS = [
  { name: "Analytical Eye", rarity: "Legendary", emoji: "👁️‍🗨️" },
  { name: "Jutsu Amplification", rarity: "Legendary", emoji: "💥" },
  { name: "Elemental Affinity Mastery", rarity: "Epic", emoji: "🔮" },
  { name: "Illusion/Genjutsu Potency", rarity: "Epic", emoji: "🌫️" },
  { name: "Kekkei Genkai Proficiency", rarity: "Legendary", emoji: "🧬" },
  { name: "Fuinjutsu Technique Expertise", rarity: "Rare", emoji: "📜" },
  { name: "Iryojutsu Proficiency", rarity: "Epic", emoji: "💉" },
  { name: "Scientist", rarity: "Rare", emoji: "🔬" },
  { name: "Superhuman Physique", rarity: "Rare", emoji: "💪" },
];

// In-memory user data
let users = {};

// ---- UTILS ----
function getRandomItem(array) {
  const roll = Math.random() * 100;
  for (let item of array) {
    let chance;
    switch (item.rarity) {
      case "Mythical": chance = 1; break;
      case "Legendary": chance = 5; break;
      case "Epic": chance = 15; break;
      case "Rare": chance = 25; break;
      case "Common": chance = 54; break;
    }
    if (roll <= chance) return item;
  }
  return array[Math.floor(Math.random() * array.length)];
}

function getUser(id) {
  if (!users[id]) users[id] = { clan: null, trait: null, elements: [], spins: { clan: 10, element: 10, trait: 5 } };
  return users[id];
}

// ---- SPIN ----
async function handleSpin(message, type) {
  const user = getUser(message.author.id);

  if (user.spins[type] <= 0) return message.reply(`No ${type} spins left!`);

  let array = type === "clan" ? CLANS : type === "element" ? ELEMENTS : TRAITS;
  let results = [];
  let spinsToRoll = type === "element" ? 2 : 1;

  for (let i = 0; i < spinsToRoll; i++) {
    let item = getRandomItem(array);
    // duplicate check
    let duplicateCount = results.filter(r => r.name === item.name).length;
    if (duplicateCount >= 2) {
      user.spins[type] += 1; // extra spin for duplicate
      continue;
    }
    results.push(item);
  }

  user.spins[type] -= 1;

  const embed = new EmbedBuilder()
    .setTitle(`${message.author.username} spun ${type}!`)
    .setDescription(results.map(r => `${r.emoji} ${r.name} (${r.rarity})`).join("\n"))
    .setFooter({ text: `Spins left: ${user.spins[type]}` })
    .setColor("Random");

  const finalizeButton = new ActionRowBuilder()
    .addComponents(new ButtonBuilder().setCustomId(`finalize_${type}`).setLabel("Finalize").setStyle(ButtonStyle.Primary));

  await message.reply({ embeds: [embed], components: [finalizeButton] });
}

// ---- COMMANDS ----
client.on(Events.MessageCreate, async message => {
  if (!message.content.startsWith("!") || message.author.bot) return;

  const args = message.content.slice(1).split(" ");
  const cmd = args.shift().toLowerCase();
  const user = getUser(message.author.id);

  if (cmd === "cmds") {
    message.reply("Commands:\n!spin clan\n!spin element\n!spin trait\n!check\n!announce <message>");
  }

  else if (cmd === "spin") {
    const type = args[0];
    if (!["clan", "element", "trait"].includes(type)) return message.reply("Invalid spin type!");
    handleSpin(message, type);
  }

  else if (cmd === "check") {
    const embed = new EmbedBuilder()
      .setTitle(`${message.author.username}'s Specs`)
      .setDescription(
        `Clan: ${user.clan ? user.clan.emoji + " " + user.clan.name : "None"}\n` +
        `Trait: ${user.trait ? user.trait.emoji + " " + user.trait.name : "None"}\n` +
        `Elements: ${user.elements.length ? user.elements.map(e => e.emoji + " " + e.name).join(", ") : "None"}`
      )
      .setColor("Random");
    message.reply({ embeds: [embed] });
  }

  else if (cmd === "announce") {
    const embed = new EmbedBuilder()
      .setDescription(args.join(" "))
      .setColor("Random");
    message.channel.send({ embeds: [embed] });
  }
});

// ---- BUTTONS ----
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;
  const user = getUser(interaction.user.id);
  const [action, type] = interaction.customId.split("_");

  if (action === "finalize") {
    // save last spun
    let lastSpun;
    if (type === "clan") lastSpun = getRandomItem(CLANS);
    else if (type === "trait") lastSpun = getRandomItem(TRAITS);
    else if (type === "element") lastSpun = [getRandomItem(ELEMENTS), getRandomItem(ELEMENTS)];

    if (type === "clan") user.clan = lastSpun;
    else if (type === "trait") user.trait = lastSpun;
    else if (type === "element") user.elements = lastSpun;

    await interaction.update({ content: `You finalized your ${type}!`, embeds: [], components: [] });
  }
});

// ---- LOGIN ----
client.login(process.env.DISCORD_TOKEN);
