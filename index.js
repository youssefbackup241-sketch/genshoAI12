require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder, PermissionsBitField } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

const PREFIX = "!";
const warnings = new Map();
const spins = new Map();

// ================= AUTO MOD =================
const bannedWords = [
  "nigger", "nigga", "faggot", "retard", "kys",
  "n1gg", "ni99", "n!gg", "nigg@", "n!gga"
];

client.on("messageCreate", async message => {
  if (message.author.bot) return;

  const content = message.content.toLowerCase().replace(/[^a-z0-9]/g, "");

  for (let word of bannedWords) {
    if (content.includes(word)) {
      await message.delete().catch(() => {});
      return handleWarning(message);
    }
  }

  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

  // ================= PING =================
  if (command === "ping") {
    return message.reply("Pong!");
  }

  // ================= ANNOUNCE =================
  if (command === "announce") {
    if (!message.member.permissions.has(PermissionsBitField.Flags.Administrator)) return;

    const text = args.join(" ");
    const embed = new EmbedBuilder()
      .setColor("Blue")
      .setDescription(text);

    return message.channel.send({ embeds: [embed] });
  }

  // ================= POLL =================
  if (command === "poll") {
    const text = args.join(" ");
    const embed = new EmbedBuilder()
      .setColor("Green")
      .setTitle("📊 Poll")
      .setDescription(text);

    const msg = await message.channel.send({ embeds: [embed] });
    await msg.react("✅");
    await msg.react("❌");
  }

  // ================= ELEMENT SPIN =================
  if (command === "element") {
    if (!checkSpin(message.author.id, "element")) {
      return message.reply("You used all 5 element spins today.");
    }

    const roll = Math.random() * 100;
    let element;

    if (roll <= 5) element = "🌳 Wood (RARE)";
    else {
      const elements = ["🔥 Fire", "💧 Water", "⚡ Lightning", "🌪 Wind", "🌍 Earth"];
      element = elements[Math.floor(Math.random() * elements.length)];
    }

    return message.reply(`You got: **${element}**`);
  }

  // ================= CLAN SPIN =================
  if (command === "clan") {
    if (!checkSpin(message.author.id, "clan")) {
      return message.reply("You used all 5 clan spins today.");
    }

    const roll = Math.random() * 100;
    let clan;

    if (roll <= 15) {
      const rare = ["Uchiha", "Senju", "Otsutsuki"];
      clan = rare[Math.floor(Math.random() * rare.length)];
    } else {
      const normal = ["Hyuga", "Inuzuka", "Aburame", "Nara", "Akimichi"];
      clan = normal[Math.floor(Math.random() * normal.length)];
    }

    return message.reply(`You got clan: **${clan}**`);
  }
});

// ================= WARNING SYSTEM =================
async function handleWarning(message) {
  const id = message.author.id;
  let count = warnings.get(id) || 0;
  count++;
  warnings.set(id, count);

  if (count === 1) {
    message.channel.send(`${message.author}, verbal warning.`);
  } else if (count === 2) {
    await message.member.timeout(60 * 60 * 1000).catch(() => {});
    message.channel.send(`${message.author} muted for 1 hour.`);
  } else if (count === 3) {
    await message.member.timeout(24 * 60 * 60 * 1000).catch(() => {});
    message.channel.send(`${message.author} muted for 24 hours.`);
  } else if (count >= 4) {
    await message.member.kick().catch(() => {});
    message.channel.send(`${message.author} has been kicked.`);
  }
}

// ================= SPIN LIMIT =================
function checkSpin(userId, type) {
  const now = Date.now();
  if (!spins.has(userId)) spins.set(userId, {});

  const userData = spins.get(userId);

  if (!userData[type]) {
    userData[type] = { count: 0, time: now };
  }

  // reset after 24h
  if (now - userData[type].time > 86400000) {
    userData[type] = { count: 0, time: now };
  }

  if (userData[type].count >= 5) return false;

  userData[type].count++;
  return true;
}

// ================= READY =================
client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

// ================= LOGIN =================
client.login(process.env.DISCORD_TOKEN);