require("dotenv").config();

const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField } = require("discord.js");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ===== STORAGE =====
const users = {};

// ===== RESET DAILY =====
setInterval(() => {
  for (let id in users) {
    users[id].clanSpins = 0;
    users[id].elementSpins = 0;
    users[id].traitSpins = 0;
  }
  console.log("Daily spins reset");
}, 24 * 60 * 60 * 1000);

// ===== CLANS =====
const clans = [
  { name: "Uchiha", chance: 15 },
  { name: "Senju", chance: 15 },
  { name: "Otsutsuki", chance: 15 },
  { name: "Hyuga", chance: 20 },
  { name: "Nara", chance: 20 },
  { name: "Inuzuka", chance: 15 }
];

// ===== ELEMENTS =====
const elements = [
  { name: "Fire", chance: 20 },
  { name: "Water", chance: 20 },
  { name: "Wind", chance: 20 },
  { name: "Lightning", chance: 20 },
  { name: "Earth", chance: 15 },
  { name: "Wood", chance: 5 }
];

// ===== TRAITS =====
const traits = [
  { name: "Clan Specialist", rarity: "Mythical", chance: 1 },

  { name: "Analytical Eye", rarity: "Legendary", chance: 6 },
  { name: "Jutsu Amplification", rarity: "Legendary", chance: 6 },
  { name: "Kekkei Genkai Proficiency", rarity: "Legendary", chance: 6 },

  { name: "Elemental Affinity Mastery", rarity: "Epic", chance: 13 },
  { name: "Illusion/Genjutsu Potency", rarity: "Epic", chance: 13 },
  { name: "Iryojutsu Proficiency", rarity: "Epic", chance: 13 },

  { name: "Fuinjutsu Technique Expertise", rarity: "Rare", chance: 14 },
  { name: "Scientist", rarity: "Rare", chance: 14 },
  { name: "Superhuman Physique", rarity: "Rare", chance: 14 }
];

// ===== RNG FUNCTION =====
function roll(list) {
  let rand = Math.random() * 100;
  let sum = 0;

  for (let item of list) {
    sum += item.chance;
    if (rand <= sum) return item;
  }
}

// ===== READY =====
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// ===== MESSAGE =====
client.on("messageCreate", async (msg) => {
  if (!msg.guild || msg.author.bot) return;

  const id = msg.author.id;

  if (!users[id]) {
    users[id] = {
      clan: null,
      element: null,
      trait: null,
      clanSpins: 0,
      elementSpins: 0,
      traitSpins: 0
    };
  }

  // ===== AUTOMOD =====
  const banned = ["nigger", "nigga", "faggot", "retard"];
  if (banned.some(word => msg.content.toLowerCase().includes(word))) {
    await msg.delete();
    msg.channel.send(`${msg.author}, watch your language.`);
    return;
  }

  // ===== CLAN =====
  if (msg.content === "!clan") {
    if (users[id].clanSpins >= 5)
      return msg.reply("❌ You used all clan spins today.");

    const result = roll(clans);
    users[id].clan = result.name;
    users[id].clanSpins++;

    msg.reply(`🧬 You got: **${result.name}**`);
  }

  // ===== ELEMENT =====
  if (msg.content === "!element") {
    if (users[id].elementSpins >= 5)
      return msg.reply("❌ You used all element spins today.");

    const result = roll(elements);
    users[id].element = result.name;
    users[id].elementSpins++;

    msg.reply(`🌿 You got: **${result.name}**`);
  }

  // ===== TRAIT =====
  if (msg.content === "!trait") {
    if (users[id].traitSpins >= 5)
      return msg.reply("❌ You used all trait spins today.");

    const result = roll(traits);
    users[id].trait = result.name;
    users[id].traitSpins++;

    msg.reply(`⚡ You got: **${result.name}** (${result.rarity})`);
  }

  // ===== STAFF CHECK =====
  if (msg.content.startsWith("!check")) {
    if (!msg.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return;

    const user = msg.mentions.users.first();
    if (!user) return msg.reply("Mention a user.");

    const data = users[user.id];
    if (!data) return msg.reply("No data.");

    msg.reply(`
👤 ${user.username}
Clan: ${data.clan || "None"}
Element: ${data.element || "None"}
Trait: ${data.trait || "None"}
    `);
  }

  // ===== ANNOUNCE =====
  if (msg.content.startsWith("!announce")) {
    if (!msg.member.permissions.has(PermissionsBitField.Flags.Administrator))
      return;

    const text = msg.content.slice(10);

    const embed = new EmbedBuilder()
      .setTitle("📢 Announcement")
      .setDescription(text)
      .setColor("Red");

    msg.channel.send({ embeds: [embed] });
  }

  // ===== POLL =====
  if (msg.content.startsWith("!poll")) {
    const text = msg.content.slice(6);

    const embed = new EmbedBuilder()
      .setTitle("📊 Poll")
      .setDescription(text)
      .setColor("Blue");

    const poll = await msg.channel.send({ embeds: [embed] });
    await poll.react("👍");
    await poll.react("👎");
  }

  // ===== PING =====
  if (msg.content === "!ping") {
    msg.reply("🏓 Pong!");
  }
});

// ===== LOGIN =====
client.login(process.env.DISCORD_TOKEN);
