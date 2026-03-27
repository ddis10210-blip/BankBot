const { 
  Client, 
  GatewayIntentBits, 
  ButtonBuilder, 
  ButtonStyle, 
  ActionRowBuilder, 
  Events,
  REST,
  Routes,
  SlashCommandBuilder
} = require("discord.js");
    require("dotenv").config();

// ===== ملفات =====
const fs = require("fs");
const DATA_FILE = "./bank.json";
const INVENTORY_FILE = "./inventory.json";
const COMPANY_FILE = "./companies.json";
const CHANNEL_FILE = "./channel.json";

// ===== بياناتك =====
const token = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

// ===== البوت =====
const client = new Client({ 
  intents: [
    GatewayIntentBits.Guilds, 
    GatewayIntentBits.GuildMessages, 
    GatewayIntentBits.MessageContent
  ] 
});

// =========================
// 🔥 تحميل الرصيد
// =========================
let balancesData = {};

if (fs.existsSync(DATA_FILE)) {
  try {
    balancesData = JSON.parse(fs.readFileSync(DATA_FILE));
  } catch {
    console.log("⚠️ خطأ بملف الرصيد - تم إعادة التهيئة");
    balancesData = {};
  }
}

// =========================
// 🔥 تحميل الممتلكات
// =========================
let inventoryData = {};

if (fs.existsSync(INVENTORY_FILE)) {
  try {
    inventoryData = JSON.parse(fs.readFileSync(INVENTORY_FILE));
  } catch {
    console.log("⚠️ خطأ بملف الممتلكات - تم إعادة التهيئة");
    inventoryData = {};
  }
}
// ===== تحميل الشركات =====
let companyData = {};
if (fs.existsSync(COMPANY_FILE)) {
  try {
    companyData = JSON.parse(fs.readFileSync(COMPANY_FILE));
  } catch (err) {
    console.log("⚠️ خطأ بملف الشركات");
    companyData = {};
  }
}
// ===== تحميل الشات =====
let channelData = {};

if (fs.existsSync(CHANNEL_FILE)) {
  channelData = JSON.parse(fs.readFileSync(CHANNEL_FILE));
}

// تحويل Map
const companyMap = new Map(
  Object.entries(companyData)
);

// =========================
// 🔥 تحويل إلى Map
// =========================
const balancesMap = new Map(
  Object.entries(balancesData).map(([k, v]) => [k, Number(v)])
);

const inventoryMap = new Map(
  Object.entries(inventoryData)
);

// =========================
// 💾 الحفظ
// =========================
function saveBalances() {
  const obj = Object.fromEntries(balancesMap);
  fs.writeFileSync(DATA_FILE, JSON.stringify(obj, null, 2));
}

function saveInventory() {
  const obj = Object.fromEntries(inventoryMap);
  fs.writeFileSync(INVENTORY_FILE, JSON.stringify(obj, null, 2));
}

function saveCompanies() {
  const obj = Object.fromEntries(companyMap);
  fs.writeFileSync(COMPANY_FILE, JSON.stringify(obj, null, 2));
}

function saveChannel(){
  fs.writeFileSync(CHANNEL_FILE, JSON.stringify(channelData, null, 2));
}

// =========================
// 💰 دوال الرصيد
// =========================
function getBalance(userId) {
  return Number(balancesMap.get(userId) || 0);
}

function addBalance(userId, amount) {
  balancesMap.set(userId, getBalance(userId) + amount);
  saveBalances();
}

function removeBalance(userId, amount) {
  balancesMap.set(userId, getBalance(userId) - amount);
  saveBalances();
}

// =========================
// 🛒 المتجر
// =========================
const shopItems = {
  "جوال": { price: 5000, stock: 5000 },
  "سيارة": { price: 50000, stock: 5000 },
  "طيارة": { price: 500000, stock: 5000 },
  "منزل": { price: 200000, stock: 5000 },
  "قصر": { price: 1000000, stock: 5000 },
  "قلعة": { price: 2000000, stock: 5000 },
  "مطعم": { price: 300000, stock: 5000 }
};

// =========================
// 🎮 مابات الألعاب
// =========================
const minesGameMap = new Map();
const treasureGameMap = new Map();

// =========================
// ⏳ الكولداون
// =========================
const giftCooldown = new Map();
const mineCooldown = new Map();
const luckCooldown = new Map();
const treasureCooldown = new Map();
const rpsCooldown = new Map();
const tableCooldown = new Map();
const tradeCooldown = new Map();

// ===== أنواع الشركات =====
const companyTypes = {
  "تقنية": {
    "جديدة": { price: 100000, stock: 10, min: 0.8, max: 1.2 },
    "متوسطة": { price: 300000, stock: 10, min: 0.7, max: 1.5 },
    "منهارة": { price: 50000, stock: 10, min: 0.2, max: 2.0 },
    "قوية": { price: 700000, stock: 10, min: 1.2, max: 2.5 }
  },
  "مطاعم": {
    "جديدة": { price: 80000, stock: 10, min: 0.8, max: 1.2 },
    "متوسطة": { price: 200000, stock: 10, min: 0.7, max: 1.5 },
    "منهارة": { price: 40000, stock: 10, min: 0.2, max: 2.0 },
    "قوية": { price: 500000, stock: 10, min: 1.2, max: 2.5 }
  },
  "سيارات": {
    "جديدة": { price: 150000, stock: 10, min: 0.8, max: 1.2 },
    "متوسطة": { price: 400000, stock: 10, min: 0.7, max: 1.5 },
    "منهارة": { price: 70000, stock: 10, min: 0.2, max: 2.0 },
    "قوية": { price: 900000, stock: 10, min: 1.2, max: 2.5 }
  }
};

const giftCooldownTime = 5 * 60 * 1000;
const gameCooldownTime = 3 * 60 * 1000;
const tableCooldownTime = 3 * 60 * 1000; // دقيقتين
const tradeCooldownTime = 3 * 60 * 1000; // 3 دقائق

// =========================
// ⚡ جاهزية البوت
// =========================
client.once(Events.ClientReady, () => {
  console.log(`🔥 Logged in as ${client.user.tag}`);
});
// =========================
// 💣 إعداد ماين
// =========================
const MINE_SIZE = 16;
const MINE_BOMBS = 2;

function generateMineBoard() {
  const board = Array(MINE_SIZE).fill("safe");
  let bombs = 0;

  while (bombs < MINE_BOMBS) {
    const i = Math.floor(Math.random() * MINE_SIZE);
    if (board[i] === "safe") {
      board[i] = "bomb";
      bombs++;
    }
  }

  return board;
}

// =========================
// 🔘 أزرار ماين
// =========================
function createMineRows(game) {
  const rows = [];

  for (let i = 0; i < MINE_SIZE; i += 4) {
    const row = new ActionRowBuilder();

    for (let j = i; j < i + 4; j++) {
      let label = "🟦";

      if (game.clicked.has(j)) {
        label = game.board[j] === "bomb" ? "💣" : "✅";
      }

      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`mine_${j}`)
          .setLabel(label)
          .setStyle(ButtonStyle.Primary)
      );
    }

    rows.push(row);
  }

  // ⭐ زر الأرباح (مهم جداً)
  const collectRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`mine_collect_${game.userId}`)
      .setLabel("💰 جمع الأرباح")
      .setStyle(ButtonStyle.Success)
  );

  rows.push(collectRow);

  return rows;
}

// =========================
// 💎 إعداد كنز
// =========================
const TREASURE_SIZE = 16;
const TREASURE_BOMBS = 2;
const TREASURE_CHESTS = 2;

function generateTreasureBoard() {
  const board = Array(TREASURE_SIZE).fill("empty");
  let bombs = 0, chests = 0;

  while (bombs < TREASURE_BOMBS) {
    const i = Math.floor(Math.random() * TREASURE_SIZE);
    if (board[i] === "empty") {
      board[i] = "bomb";
      bombs++;
    }
  }

  while (chests < TREASURE_CHESTS) {
    const i = Math.floor(Math.random() * TREASURE_SIZE);
    if (board[i] === "empty") {
      board[i] = "chest";
      chests++;
    }
  }

  return board;
}

// =========================
// 🔘 أزرار كنز
// =========================
function createTreasureRows(game) {
  const rows = [];

  for (let i = 0; i < TREASURE_SIZE; i += 4) {
    const row = new ActionRowBuilder();

    for (let j = i; j < i + 4; j++) {
      let label = "❓";

      if (game.clicked.has(j)) {
        if (game.board[j] === "bomb") label = "💣";
        else if (game.board[j] === "chest") label = "💰";
        else label = "⬜";
      }

      row.addComponents(
        new ButtonBuilder()
          .setCustomId(`treasure_${j}`)
          .setLabel(label)
          .setStyle(ButtonStyle.Primary)
      );
    }

    rows.push(row);
  }

  return rows;
}

// =========================
// 🎯 حظ
// =========================
function createLuckRow(amount) {
  const row = new ActionRowBuilder();

  for (let i = 0; i < 3; i++) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`luck_${i}_${amount}_${Date.now()}`)
        .setLabel("❓")
        .setStyle(ButtonStyle.Primary)
    );
  }

  return [row];
}

// =========================
// ✂️ حجر ورقة مقص
// =========================
function createRPSRow(amount) {
  const row = new ActionRowBuilder();
  const moves = ["🪨", "📄", "✂️"];

  moves.forEach(move => {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`rps_${move}_${amount}_${Date.now()}`)
        .setLabel(move)
        .setStyle(ButtonStyle.Primary)
    );
  });

  return [row];
}

// =========================
// 🎮 منطق الأزرار (التفاعل)
// =========================
client.on("interactionCreate", async (interaction) => {

  const uid = interaction.user.id;

  if(channelData.channelId && interaction.channelId !== channelData.channelId){
  return interaction.reply({
    content: `❌ يمكنك استخدام الأوامر فقط في <#${channelData.channelId}>`,
    ephemeral: true
  });
}

  // أولًا تعامل مع الأزرار
  if (interaction.isButton()) {

    if(interaction.customId === "cmd_games"){
      return interaction.reply({
        content:
          `🎮 **أوامر اللعبة:**\n\n` +
          `💰 !رصيد\n` +
          `🎁 !هدية\n` +
          `⏱️ !وقت\n\n` +

          `💣 !ماين <مبلغ>\n` +
          `💎 !كنز <مبلغ>\n` +
          `🎯 !حظ <مبلغ>\n` +
          `✂️ !حجر <مبلغ>\n\n` +
          `🎲 !طاولة <مبلغ>\n\n` +
          `📊 !تداول <مبلغ>\n\n` +

          `🏢 !شركة\n` +
          `📊 !ارباحي\n\n` +

          `🛒 !متجر\n` +
          `🛍️ !شراء\n` +
          `💸 !بيع\n` +
          `📦 !ممتلكاتي`,
        ephemeral: true
      });
    }

    if (interaction.customId === "cmd_admin") {
      return interaction.reply({
        content:
          `🛠️ **أوامر الإدارة:**\n\n` +
          `/addmoney\n` +
          `/removemoney\n` +
          `/reset\n` +
          `/شحن`,
        ephemeral: true
      });
    }

  }


  // ===== فقط أزرار =====
  if (!interaction.isButton()) return;

  // =========================
  // ⭐ زر جمع الأرباح (مهم جداً يكون أول شيء)
  // =========================
  if (interaction.customId.startsWith("mine_collect_")) {

    const ownerId = interaction.customId.split("_")[2];

    if (uid !== ownerId) {
      return interaction.reply({
        content: "❌ هذا مو لعبك!",
        ephemeral: true
      });
    }

    if (!minesGameMap.has(ownerId)) {
      return interaction.reply({
        content: "⚠️ اللعبة منتهية!",
        ephemeral: true
      });
    }

    const game = minesGameMap.get(ownerId);

    const total = game.earned;
    const newBalance = getBalance(ownerId) + total;

    balancesMap.set(ownerId, newBalance);
    saveBalances();

    minesGameMap.delete(ownerId);

    return interaction.update({
      content:
        `🏁 انتهت اللعبة\n` +
        `💰 تم جمع: ${total}\n` +
        `💳 رصيدك الآن: ${newBalance}`,
      components: []
    });
  }

  // =========================
  // 💣 ماين
  // =========================
  if (interaction.customId.startsWith("mine_")) {

    if (!minesGameMap.has(uid)) return;

    const game = minesGameMap.get(uid);
    const i = parseInt(interaction.customId.split("_")[1]);

    if (game.clicked.has(i)) {
      return interaction.reply({ content: "⚠️ ضغطته", ephemeral: true });
    }

    game.clicked.add(i);

    if (game.board[i] === "bomb") {
      minesGameMap.delete(uid);

      return interaction.update({
        content: "💥 قنبلة! خسرت",
        components: []
      });
    }

    const gain = Math.floor(game.amount * 1.5);
    game.earned += gain;

    return interaction.update({
      content: `💸 ربحك الحالي: ${game.earned}`,
      components: createMineRows(game)
    });
  }

  // =========================
  // 💎 كنز
  // =========================
  if (interaction.customId.startsWith("treasure_")) {

    if (!treasureGameMap.has(uid)) return;

    const game = treasureGameMap.get(uid);
    const i = parseInt(interaction.customId.split("_")[1]);

    if (game.clicked.has(i)) {
      return interaction.reply({ content: "⚠️ ضغطته", ephemeral: true });
    }

    game.clicked.add(i);

    if (game.board[i] === "bomb") {
      game.lives -= 2;
      game.bombs++;
    } else if (game.board[i] === "chest") {
      game.chests++;
      game.amount = Math.floor(game.amount * 1.5);
    } else {
      game.lives--;
      game.empties++;
    }

    if (game.lives <= 0) {
      treasureGameMap.delete(uid);

      return interaction.update({
        content:
          `🏁 انتهت اللعبة\n` +
          `💎 ${game.chests} | 💣 ${game.bombs} | ⬜ ${game.empties}`,
        components: []
      });
    }

    return interaction.update({
      content:
        `❤️ ${game.lives} | 💎 ${game.chests} | 💣 ${game.bombs}`,
      components: createTreasureRows(game)
    });
  }

  // =========================
  // 🎯 حظ
  // =========================
  if (interaction.customId.startsWith("luck_")) {

    const parts = interaction.customId.split("_");
    const amount = parseInt(parts[2]);

    const rand = Math.random();

    let result = "";
    let win = 0;

    if (rand < 0.33) {
      result = "💣";
    } else if (rand < 0.66) {
      result = "⬜";
      win = amount;
    } else {
      result = "💰";
      win = amount * 2;
    }

    addBalance(uid, win);

    return interaction.update({
      content: `${result}\n💰 رصيدك: ${getBalance(uid)}`,
      components: []
    });
  }

  // =========================
  // ✂️ حجر
  // =========================
  if (interaction.customId.startsWith("rps_")) {

    const parts = interaction.customId.split("_");
    const userChoice = parts[1];
    const amount = parseInt(parts[2]);

    const moves = ["🪨", "📄", "✂️"];
    const bot = moves[Math.floor(Math.random() * 3)];

    let result = "🤝";

    if (userChoice !== bot) {
      if (
        (userChoice === "🪨" && bot === "✂️") ||
        (userChoice === "📄" && bot === "🪨") ||
        (userChoice === "✂️" && bot === "📄")
      ) {
        result = "😎";
        addBalance(uid, amount * 2);
      } else {
        result = "💥";
      }
    } else {
      addBalance(uid, amount);
    }

    return interaction.update({
      content: `${userChoice} ضد ${bot}\n${result}\n💰 ${getBalance(uid)}`,
      components: []
    });
  }
  if(interaction.customId.startsWith("company_type_")){
  const type = interaction.customId.split("_")[2];

  const levels = companyTypes[type];

  const rows = [];

  for(const lvl in levels){
    const data = levels[lvl];

    if(data.stock <= 0) continue;

    const btn = new ButtonBuilder()
      .setCustomId(`company_buy_${type}_${lvl}`)
      .setLabel(`${lvl} | 💰${data.price} | 📦${data.stock}`)
      .setStyle(ButtonStyle.Success);

    rows.push(new ActionRowBuilder().addComponents(btn));
  }

  return interaction.update({
    content: `📂 ${type}\nاختر المستوى:`,
    components: rows
  });
}
if(interaction.customId.startsWith("company_buy_")){

  const parts = interaction.customId.split("_");
  const type = parts[2];
  const level = parts[3];

  if(companyMap.has(uid)){
    return interaction.reply({
      content: "❌ عندك شركة بالفعل!",
      ephemeral: true
    });
  }

  const data = companyTypes[type][level];

  if(data.stock <= 0){
    return interaction.reply({content:"❌ خلصت!",ephemeral:true});
  }

  if(getBalance(uid) < data.price){
    return interaction.reply({content:"❌ ما معك فلوس",ephemeral:true});
  }

  // 💸 خصم
  removeBalance(uid, data.price);

  // 📦 تقليل المخزون
  data.stock--;

  // ⏳ 12 ساعة
  const endTime = Date.now() + (12 * 60 * 60 * 1000);

  // 💾 حفظ الشركة
  companyMap.set(uid, {
    type,
    level,
    startTime: Date.now(),
    endTime,
    price: data.price
  });

  saveCompanies();

  return interaction.update({
    content:`✅ اشتريت شركة ${type} - ${level}`,
    components:[]
  });
}
});
// =========================
// 💬 الرسائل (الأوامر)
// =========================
client.on("messageCreate", async (message) => {
  if (message.author.bot) return;

  const uid = message.author.id;

  if(channelData.channelId && message.channel.id !== channelData.channelId){
  return message.reply(`❌ يمكنك استخدام الأوامر فقط في <#${channelData.channelId}>`);
}

  // =========================
  // 💰 رصيد
  // =========================
  if (message.content === "!رصيد") {
    return message.reply(`💰 رصيدك: ${getBalance(uid)}`);
  }

  // =========================
  // 🎁 هدية
  // =========================
  if (message.content === "!هدية") {
    const now = Date.now();
    const last = giftCooldown.get(uid) || 0;

    if (now - last < giftCooldownTime) {
      const sec = Math.ceil((giftCooldownTime - (now - last)) / 1000);
      return message.reply(`⏳ انتظر ${sec} ثانية`);
    }

    addBalance(uid, 100000);
    giftCooldown.set(uid, now);

    return message.reply(`🎁 أخذت 100,000\n💰 رصيدك: ${getBalance(uid)}`);
  }

  // =========================
  // ⏳ وقت
  // =========================
  if (message.content === "!وقت") {
    const now = Date.now();

    const calc = (cd, time) => {
      const last = cd.get(uid) || 0;
      const remain = time - (now - last);
      return Math.max(0, Math.ceil(remain / 1000));
    };

    return message.reply(
      `⏳ الكولداون:\n` +
      `🎁 هدية: ${calc(giftCooldown, giftCooldownTime)} ث\n` +
      `💣 ماين: ${calc(mineCooldown, gameCooldownTime)} ث\n` +
      `💎 كنز: ${calc(treasureCooldown, gameCooldownTime)} ث\n` +
      `🎯 حظ: ${calc(luckCooldown, gameCooldownTime)} ث\n` +
      `🎲 طاولة: ${calc(tableCooldown, tableCooldownTime)} ث\n` +
      `📊 تداول: ${calc(tradeCooldown, tradeCooldownTime)} ث\n` +
      `✂️ حجر: ${calc(rpsCooldown, gameCooldownTime)} ث`
    );
  }

  // =========================
  // 📜 أوامر (أزرار)
  // =========================
  if (message.content === "!اوامر") {
    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("cmd_games")
        .setLabel("🎮 أوامر اللعبة")
        .setStyle(ButtonStyle.Primary),

      new ButtonBuilder()
        .setCustomId("cmd_admin")
        .setLabel("🛠️ أوامر صناع البوت")
        .setStyle(ButtonStyle.Secondary)
    );

    return message.reply({
      content: "📜 اختر نوع الأوامر:",
      components: [row]
    });
  }
  // ===== شركة =====
if(message.content === "!شركة"){

  // ❌ عنده شركة
  if(companyMap.has(uid)){
    const comp = companyMap.get(uid);

    const remaining = Math.max(0, Math.floor((comp.endTime - Date.now()) / 1000));

    return message.reply(
      `🏢 شركتك:\n` +
      `📂 النوع: ${comp.type}\n` +
      `📊 المستوى: ${comp.level}\n` +
      `⏳ باقي: ${remaining} ثانية`
    );
  }

  // ✅ اختيار نوع الشركة
  const row = new ActionRowBuilder();

  Object.keys(companyTypes).forEach(type=>{
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`company_type_${type}`)
        .setLabel(type)
        .setStyle(ButtonStyle.Primary)
    );
  });

  return message.reply({
    content: "🏢 اختر نوع الشركة (يمكنك امتلاك شركة واحدة فقط)",
    components: [row]
  });
}

  // =========================
  // 🛒 متجر
  // =========================
  if (message.content === "!متجر") {
    let msg = "🛒 **المتجر:**\n\n";

    for (const item in shopItems) {
      const data = shopItems[item];
      msg += `📦 ${item}\n💰 السعر: ${data.price}\n📊 المتوفر: ${data.stock}\n\n`;
    }

    return message.reply(msg);
  }
  if(message.content === "!ارباحي"){

  if(!companyMap.has(uid)){
    return message.reply("❌ ما عندك شركة");
  }

  const comp = companyMap.get(uid);

  if(Date.now() < comp.endTime){
    const remain = Math.floor((comp.endTime - Date.now())/1000);
    return message.reply(`⏳ باقي ${remain} ثانية`);
  }

  const data = companyTypes[comp.type][comp.level];

  const ratio = Math.random() * (data.max - data.min) + data.min;
  const result = Math.floor(comp.price * ratio);

  addBalance(uid, result);

  companyMap.delete(uid);
  saveCompanies();

  return message.reply(
    `📊 نتيجة الشركة:\n` +
    `💰 الربح/الخسارة: ${result}\n` +
    `💳 رصيدك: ${getBalance(uid)}`
  );
}

  // =========================
  // 🛍️ شراء
  // =========================
  if (message.content.startsWith("!شراء")) {
    const args = message.content.split(" ");
    const itemName = args[1];
    const amount = parseInt(args[2]);

    if (!shopItems[itemName]) return message.reply("❌ المنتج غير موجود");
    if (isNaN(amount) || amount <= 0) return message.reply("❌ اكتب كمية صح");

    const item = shopItems[itemName];

    if (item.stock < amount) return message.reply("❌ الكمية غير متوفرة");

    const totalPrice = item.price * amount;

    if (getBalance(uid) < totalPrice) return message.reply("❌ ما معك فلوس");

    removeBalance(uid, totalPrice);

    item.stock -= amount;

    if (!inventoryMap.has(uid)) inventoryMap.set(uid, {});
    const inv = inventoryMap.get(uid);

    inv[itemName] = (inv[itemName] || 0) + amount;

    saveInventory();

    return message.reply(`✅ اشتريت ${amount} ${itemName}`);
  }

  // =========================
  // 💸 بيع
  // =========================
  if (message.content.startsWith("!بيع")) {
    const args = message.content.split(" ");
    const itemName = args[1];
    const amount = parseInt(args[2]);

    if (!inventoryMap.has(uid)) return message.reply("❌ ما عندك ممتلكات");

    const inv = inventoryMap.get(uid);

    if (!inv[itemName] || inv[itemName] < amount) {
      return message.reply("❌ ما عندك الكمية");
    }

    const item = shopItems[itemName];
    const sellPrice = Math.floor(item.price * 0.7) * amount;

    addBalance(uid, sellPrice);

    inv[itemName] -= amount;
    item.stock += amount;

    saveInventory();

    return message.reply(`💰 بعت ${amount} ${itemName} بـ ${sellPrice}`);
  }

  // =========================
  // 📦 ممتلكاتي
  // =========================
  if (message.content === "!ممتلكاتي") {
    if (!inventoryMap.has(uid)) {
      return message.reply("📦 ما عندك أي ممتلكات");
    }

    const inv = inventoryMap.get(uid);
    let msg = "📦 **ممتلكاتك:**\n\n";

    for (const item in inv) {
      msg += `• ${item}: ${inv[item]}\n`;
    }

    return message.reply(msg);
  }

  // =========================
  // 🏆 توب
  // =========================
  if (message.content === "!توب") {

    if (balancesMap.size === 0) {
      return message.reply("❌ ما في بيانات!");
    }

    const sorted = [...balancesMap.entries()]
      .sort((a, b) => b[1] - a[1]);

    const top10 = sorted.slice(0, 10);

    let msg = "🏆 **أغنى 10 لاعبين:**\n\n";

    top10.forEach((user, index) => {
      msg += `${index + 1}️⃣ <@${user[0]}> — ${user[1]} 💰\n`;
    });

    const rank = sorted.findIndex(user => user[0] === uid) + 1;

    if (rank === 0) {
      msg += `\n📊 أنت غير مصنف`;
      return message.reply(msg);
    }

    msg += `\n📊 ترتيبك: #${rank}\n`;

    if (rank > 1) {
      const aboveUser = sorted[rank - 2];
      const diff = aboveUser[1] - getBalance(uid);

      msg += `📈 الفرق بينك وبين اللي فوقك: ${diff} 💰`;
    } else {
      msg += `👑 أنت الأول!`;
    }

    return message.reply(msg);
  }

  // =========================
  // 🎮 ماين
  // =========================
  if (message.content.startsWith("!ماين")) {
    const now = Date.now();
    const last = mineCooldown.get(uid) || 0;

    if (now - last < gameCooldownTime) {
      const sec = Math.ceil((gameCooldownTime - (now - last)) / 1000);
      return message.reply(`⏳ انتظر ${sec} ثانية`);
    }

    const amount = parseInt(message.content.split(" ")[1]);

    if (isNaN(amount)) return message.reply("❌ اكتب مبلغ");
    if (amount < 500) return message.reply("❌ الحد الادنى 500");
    if (amount > 5000000) return message.reply("❌ الحد الاقصى 5000000");

    if (getBalance(uid) < amount) return message.reply("❌ ما معك فلوس");

    removeBalance(uid, amount);
    mineCooldown.set(uid, now);

    const game = {
      board: generateMineBoard(),
      amount,
      earned: 0,
      clicked: new Set(),
      userId: uid
    };

    minesGameMap.set(uid, game);

    return message.reply({
      content: `🎮 بدأت لعبة ماين\n💰 رصيدك: ${getBalance(uid)}`,
      components: createMineRows(game)
    });
  }
  // ===== تداول =====
if(message.content.startsWith("!تداول")){
  const args = message.content.split(" ");
  const amount = parseInt(args[1]);
  const now = Date.now();
  const last = tradeCooldown.get(uid) || 0;

  if(now - last < tradeCooldownTime){
    const sec = Math.ceil((tradeCooldownTime - (now - last)) / 1000);
    return message.reply(`⏳ انتظر ${sec} ثانية`);
  }

  // 🔹 حدّث الكولداون الآن
tradeCooldown.set(uid, now);

  if(isNaN(amount)) return message.reply("❌ اكتب مبلغ");
  if(amount < 500) return message.reply("❌ الحد الادنى 500");
  if(amount > 5000000) return message.reply("❌ الحد الاقصى 5000000");

  const balance = getBalance(uid);

  if(balance < amount) return message.reply("❌ ما معك فلوس");

  // 💸 خصم المبلغ
  removeBalance(uid, amount);

  // 🎲 نسب مع احتمالات (كل ما زادت النسبة تقل الفرصة)
  const chances = [
    { chance: 30, value: 0, label: "💥 خسرت كل شيء!" },

    { chance: 20, value: 0.01, label: "📈 +1%" },
    { chance: 15, value: 0.10, label: "📈 +10%" },
    { chance: 10, value: 0.20, label: "📈 +20%" },
    { chance: 8, value: 0.30, label: "📈 +30%" },
    { chance: 6, value: 0.40, label: "📈 +40%" },
    { chance: 5, value: 0.50, label: "📈 +50%" },
    { chance: 3, value: 0.75, label: "🚀 +75%" },
    { chance: 2, value: 1.00, label: "🚀 +100%" },
    { chance: 1, value: 2.00, label: "🔥 +200%" }
  ];

  // 🎯 اختيار عشوائي حسب الاحتمالات
  let rand = Math.random() * 100;
  let sum = 0;
  let selected = chances[0];

  for(const c of chances){
    sum += c.chance;
    if(rand <= sum){
      selected = c;
      break;
    }
  }

  // 💰 حساب الربح
  let win = Math.floor(amount * selected.value);

  // ➕ إضافة الربح
  addBalance(uid, win);

  // 📊 الرصيد الجديد
  const newBalance = getBalance(uid);

  return message.reply(
    `📊 **نتيجة التداول:**\n\n` +
    `${selected.label}\n` +
    `💰 المبلغ: ${amount}\n` +
    `💸 الربح: ${win}\n\n` +
    `💳 رصيدك الآن: ${newBalance}`
  );
}

// ===== طاولة =====
if(message.content.startsWith("!طاولة")){
  const now = Date.now();
  const last = tableCooldown.get(uid) || 0;

  if(now - last < tableCooldownTime){
    const sec = Math.ceil((tableCooldownTime - (now - last)) / 1000);
    return message.reply(`⏳ انتظر ${sec} ثانية`);
  }

  const args = message.content.split(" ");
  const amount = parseInt(args[1]);

  if(isNaN(amount)) return message.reply("❌ اكتب مبلغ");
  if(amount < 500) return message.reply("❌ الحد الادنى 500");
  if(amount > 5000000) return message.reply("❌ الحد الاقصى 5000000");

  const balance = getBalance(uid);

  if(balance < amount) return message.reply("❌ ما معك فلوس");

  // خصم
  removeBalance(uid, amount);

  // حفظ الكولداون
  tableCooldown.set(uid, now);

  const win = Math.random() < 0.5;

  if(win){
    const reward = amount * 2;
    addBalance(uid, reward);

    return message.reply(
      `🟢 فزت!\n💰 ربحت ${reward}\n💳 رصيدك: ${getBalance(uid)}`
    );
  } else {
    return message.reply(
      `🔴 خسرت!\n💸 خسرت ${amount}\n💳 رصيدك: ${getBalance(uid)}`
    );
  }
}

  // =========================
  // 💎 كنز
  // =========================
  if (message.content.startsWith("!كنز")) {
    const now = Date.now();
    const last = treasureCooldown.get(uid) || 0;

    if (now - last < gameCooldownTime) {
      const sec = Math.ceil((gameCooldownTime - (now - last)) / 1000);
      return message.reply(`⏳ انتظر ${sec} ثانية`);
    }

    const amount = parseInt(message.content.split(" ")[1]);

    if (isNaN(amount)) return message.reply("❌ اكتب مبلغ");
    if (getBalance(uid) < amount) return message.reply("❌ ما معك فلوس");

    removeBalance(uid, amount);
    treasureCooldown.set(uid, now);

    const game = {
      board: generateTreasureBoard(),
      amount,
      clicked: new Set(),
      lives: 5,
      chests: 0,
      bombs: 0,
      empties: 0
    };

    treasureGameMap.set(uid, game);

    return message.reply({
      content: `🎮 بدأت لعبة كنز\n💰 رصيدك: ${getBalance(uid)}`,
      components: createTreasureRows(game)
    });
  }

  // =========================
  // 🎯 حظ
  // =========================
  if (message.content.startsWith("!حظ")) {
    const now = Date.now();
    const last = luckCooldown.get(uid) || 0;

    if (now - last < gameCooldownTime) {
      const sec = Math.ceil((gameCooldownTime - (now - last)) / 1000);
      return message.reply(`⏳ انتظر ${sec} ثانية`);
    }

    const amount = parseInt(message.content.split(" ")[1]);

    if (isNaN(amount)) return message.reply("❌ اكتب مبلغ");
    if (getBalance(uid) < amount) return message.reply("❌ ما معك فلوس");

    removeBalance(uid, amount);
    luckCooldown.set(uid, now);

    return message.reply({
      content: "🎯 اختر صندوق:",
      components: createLuckRow(amount)
    });
  }

  // =========================
  // ✂️ حجر
  // =========================
  if (message.content.startsWith("!حجر")) {
    const now = Date.now();
    const last = rpsCooldown.get(uid) || 0;

    if (now - last < gameCooldownTime) {
      const sec = Math.ceil((gameCooldownTime - (now - last)) / 1000);
      return message.reply(`⏳ انتظر ${sec} ثانية`);
    }

    const amount = parseInt(message.content.split(" ")[1]);

    if (isNaN(amount)) return message.reply("❌ اكتب مبلغ");
    if (getBalance(uid) < amount) return message.reply("❌ ما معك فلوس");

    removeBalance(uid, amount);
    rpsCooldown.set(uid, now);

    return message.reply({
      content: "✂️🪨📄 اختر:",
      components: createRPSRow(amount)
    });
  }

});
// =========================
// ⚡ أوامر السلاش
// =========================
const commands = [
  
  new SlashCommandBuilder()
  .setName("setchannel")
  .setDescription("تحديد روم البوت")
  .addChannelOption(option =>
    option.setName("room")
      .setDescription("اختر الروم")
      .setRequired(true)
  ),

  new SlashCommandBuilder()
    .setName("addmoney")
    .setDescription("إضافة فلوس")
    .addUserOption(option =>
      option.setName("user").setDescription("الشخص").setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName("amount").setDescription("المبلغ").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("removemoney")
    .setDescription("حذف فلوس")
    .addUserOption(option =>
      option.setName("user").setDescription("الشخص").setRequired(true)
    )
    .addIntegerOption(option =>
      option.setName("amount").setDescription("المبلغ").setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("reset")
    .setDescription("تصفير جميع الأرصدة"),

  new SlashCommandBuilder()
    .setName("شحن")
    .setDescription("إعادة تعبئة المتجر")

];

// =========================
// 📡 تسجيل السلاش
// =========================
const rest = new REST({ version: "10" }).setToken(token);

(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log("✅ Slash commands registered");
  } catch (err) {
    console.log("❌ Error:", err);
  }
})();

// =========================
// 🔘 التفاعل (سلاش + أزرار)
// =========================
client.on("interactionCreate", async (interaction) => {

  if(!interaction.isChatInputCommand()) return;

  const OWNER_ID = "1211941658829266994";
  const uid = interaction.user.id;
  
  if(interaction.commandName === "setchannel"){

  const OWNER_ID = "1211941658829266994";

  if(interaction.user.id !== OWNER_ID){
    return interaction.reply({
      content: "❌ هذا الأمر للمالك فقط!",
      ephemeral: true
    });
  }

  const channel = interaction.options.getChannel("room");

  // حفظ الروم
  channelData.channelId = channel.id;
  saveChannel();

  return interaction.reply(`✅ تم تحديد الروم: <#${channel.id}>`);
}

  // ===== RESET =====
  if(interaction.commandName === "reset"){

    if(uid !== OWNER_ID){
      return interaction.reply({
        content: "❌ هذا الأمر للمالك فقط!",
        ephemeral: true
      });
    }

    // 💰 تصفير الفلوس
    for (const userId of balancesMap.keys()) {
      balancesMap.set(userId, 0);
    }

    // 📦 تصفير الممتلكات
    inventoryMap.clear();

    // 🏢 تصفير الشركات
    companyMap.clear();

    saveBalances();
    saveInventory();
    saveCompanies();

    return interaction.reply(
      `*♻️ عزيزي المسؤول <@${uid}>\n` +
      `لقد قمت للتو بتصفير جميع الأرصدة والبيانات\n` +
      `🏦 طاقم الإدارة المالية*`
    );
  }

  // ===== شحن =====
  if(interaction.commandName === "شحن"){

    if(uid !== OWNER_ID){
      return interaction.reply({
        content: "❌ هذا الأمر للمالك فقط!",
        ephemeral: true
      });
    }

    // 🛒 شحن المتجر
    for(const item in shopItems){
      shopItems[item].stock = 5000;
    }

    // 🏢 شحن الشركات
    for(const type in companyTypes){
      for(const level in companyTypes[type]){
        companyTypes[type][level].stock = 10;
      }
    }

    return interaction.reply(
      `*🔄 عزيزي المسؤول <@${uid}>\n` +
      `لقد قمت للتو بشحن المتجر + الشركات بالكامل\n` +
      `🏦 طاقم الإدارة المالية*`
    );
  }

  // ===== تحقق الصلاحية لباقي الأوامر =====
  if(uid !== OWNER_ID){
    return interaction.reply({
      content: "❌ هذا الأمر لك فقط يا أسطورة 😎",
      ephemeral: true
    });
  }

  // ===== defer فقط لهذول =====
  await interaction.deferReply();

  const user = interaction.options.getUser("user");
  const amount = interaction.options.getInteger("amount");

  if(!balancesMap.has(user.id)) balancesMap.set(user.id, 0);

  // ===== إضافة فلوس =====
  if(interaction.commandName === "addmoney"){

    addBalance(user.id, amount);

    return interaction.editReply(
      `*💸 عزيزي المسؤول <@${uid}>\n` +
      `لقد قمت للتو بإضافة ${amount} إلى <@${user.id}>\n` +
      `💰 أصبح رصيده الآن: ${getBalance(user.id)}\n` +
      `🏦 طاقم الإدارة المالية*`
    );
  }

  // ===== حذف فلوس =====
  if(interaction.commandName === "removemoney"){

    removeBalance(user.id, amount);

    return interaction.editReply(
      `*💸 عزيزي المسؤول <@${uid}>\n` +
      `لقد قمت للتو بإزالة ${amount} من <@${user.id}>\n` +
      `💰 أصبح رصيده الآن: ${getBalance(user.id)}\n` +
      `🏦 طاقم الإدارة المالية*`
    );
  
  }

  // =========================
  // 🔘 أزرار !اوامر
  // =========================
  if (interaction.isButton()) {

    if(interaction.customId === "cmd_games"){
  return interaction.reply({
    content:
      `🎮 **أوامر اللعبة:**\n\n` +
      `💰 !رصيد\n` +
      `🎁 !هدية\n` +
      `⏱️ !وقت\n\n` +

      `💣 !ماين <مبلغ>\n` +
      `💎 !كنز <مبلغ>\n` +
      `🎯 !حظ <مبلغ>\n` +
      `✂️ !حجر <مبلغ>\n\n` +

      `🏢 !شركة\n` +
      `📊 !ارباحي\n\n` +

      `🛒 !متجر\n` +
      `🛍️ !شراء\n` +
      `💸 !بيع\n` +
      `📦 !ممتلكاتي`,
    ephemeral: true
  });
}

    if (interaction.customId === "cmd_admin") {
      return interaction.reply({
        content:
          `🛠️ **أوامر الإدارة:**\n\n` +
          `/addmoney\n` +
          `/removemoney\n` +
          `/reset\n` +
          `/setchannel\n` +
          `/شحن`,
        ephemeral: true
      });
    }
  }
  });

// =========================
// 🚀 تشغيل البوت
// =========================
client.once(Events.ClientReady, () => {
  console.log(`🔥 Logged in as ${client.user.tag}`);
});

client.login(process.env.TOKEN);