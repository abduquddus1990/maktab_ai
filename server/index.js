require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// AI Clients
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });

const CLAUDE_MODEL = 'claude-sonnet-5';

// Load Prompts
const REPETITOR_PROMPT = fs.readFileSync(path.join(__dirname, 'prompts/repetitor.txt'), 'utf-8');
const IXTIRO_PROMPT = fs.readFileSync(path.join(__dirname, 'prompts/ixtiro.txt'), 'utf-8');
let PARENT_PROMPT = "";
try {
  PARENT_PROMPT = fs.readFileSync(path.join(__dirname, 'prompts/parent_advisor.txt'), 'utf-8');
} catch (e) {
  PARENT_PROMPT = "Sen Maktab AI Oila va Ota-ona nazorati maslahatchisisisan.";
}

// Load 1-11 Sinf DTS Knowledge Base
let dtsKnowledgeBase = [];
try {
  const dtsPath = path.join(__dirname, '../knowledge_base_dts.json');
  if (fs.existsSync(dtsPath)) {
    const raw = fs.readFileSync(dtsPath, 'utf-8');
    const parsed = JSON.parse(raw);
    dtsKnowledgeBase = parsed.modules || [];
    console.log(`📚 DTS Knowledge Base loaded: ${dtsKnowledgeBase.length} ta darslik moduli`);
  }
} catch (err) {
  console.error("DTS Knowledge base yuklashda xato:", err.message);
}

// In-Memory Telemetry Data Store (Supabase bilan sinxronlash imkoni bilan)
const telemetryStore = {
  children: {
    "child_1": {
      id: "child_1",
      name: "Aliyor",
      grade: 5,
      avatar: "👦",
      location: {
        lat: 41.311081,
        lng: 69.240562,
        address: "Toshkent sh., Yunusobod tumani, 12-maktab yaqinida",
        battery: 88,
        speed: 0,
        updatedAt: new Date().toISOString()
      },
      locationHistory: [
        { lat: 41.311081, lng: 69.240562, timestamp: new Date(Date.now() - 15*60000).toISOString(), place: "12-maktab" },
        { lat: 41.313500, lng: 69.242000, timestamp: new Date(Date.now() - 60*60000).toISOString(), place: "Uy" }
      ],
      appUsage: [
        { app: "YouTube & Shorts", timeMinutes: 65, category: "Video & Media", icon: "▶️" },
        { app: "Maktab AI Ta'lim", timeMinutes: 45, category: "Ta'lim", icon: "🎓" },
        { app: "Telegram", timeMinutes: 30, category: "Muloqot", icon: "💬" },
        { app: "Roblox / O'yinlar", timeMinutes: 25, category: "O'yin", icon: "🎮" }
      ],
      reelsTopics: {
        education: 45, // %
        science: 25,
        entertainment: 30,
        summary: "Farzandingiz asosan IT va fizika tajribalari, shuningdek ingliz tili qisqa videolarini tomosha qilgan."
      }
    }
  }
};

// Xavfsizlik filtri
const BANNED = [
  'porno', 'seks', 'erotik', 'narkotik', 'giyohvand', 'terror', 'bomba', 'dinamit',
  'portlovchi', 'qotil', "zo'rlash", 'tajovuz', "o'z joniga qasd", 'qurol yasash',
];

function isBanned(text = '') {
  const lower = String(text).toLowerCase();
  return BANNED.some((w) => lower.includes(w));
}

// DTS RAG qidiruvi
function searchDts(query, grade = null) {
  if (!query || !dtsKnowledgeBase.length) return null;
  const lower = query.toLowerCase();
  let bestMatch = null;
  let maxScore = 0;

  for (const item of dtsKnowledgeBase) {
    let score = 0;
    if (grade && item.grade === Number(grade)) score += 3;
    if (lower.includes(item.subject.toLowerCase())) score += 3;
    if (lower.includes(item.chapter.toLowerCase())) score += 5;
    if (item.keywords && item.keywords.some(k => lower.includes(k.toLowerCase()))) score += 4;

    if (score > maxScore) {
      maxScore = score;
      bestMatch = item;
    }
  }

  return maxScore >= 3 ? bestMatch : null;
}

function buildImageBlocks(images) {
  if (!Array.isArray(images)) return [];
  return images
    .filter((img) => img && img.data && img.media_type)
    .map((img) => ({
      type: 'image',
      source: { type: 'base64', media_type: img.media_type, data: img.data },
    }));
}

function buildUserContent(message, images) {
  const blocks = buildImageBlocks(images);
  const trimmed = (message || '').trim();
  if (!blocks.length) return trimmed;
  const text = trimmed || "Ushbu rasmda berilgan darslik topshirig'i yoki masalani tahlil qilib, o'quvchiga qadam-baqadam o'rgat.";
  return [...blocks, { type: 'text', text }];
}

function buildMessages(history, currentContent) {
  const msgs = [];
  if (Array.isArray(history)) {
    for (const h of history) {
      if (h && (h.role === 'user' || h.role === 'assistant') && typeof h.content === 'string' && h.content.trim()) {
        msgs.push({ role: h.role, content: h.content });
      }
    }
  }
  msgs.push({ role: 'user', content: currentContent });
  return msgs;
}

function extractReply(completion) {
  return (completion.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
}

const REFUSAL = "Kechirasiz, bu mavzuda javob bera olmayman. O'quv mavzusiga qaytaylik 📚";
const IXTIRO_REFUSAL = "Kechirasiz, bu g'oyada yordam bera olmayman. Xavfsiz va foydali ixtiro ustida ishlaylik 💡";
const ERROR_REPLY = "Kechirasiz, xatolik yuz berdi. Iltimos qayta urinib ko'ring.";

// ============================================================================
// 1. DTS Darsliklar API
// ============================================================================
app.get('/api/dts/curriculum', (req, res) => {
  const grade = req.query.grade;
  if (!grade || grade === 'all') {
    return res.json({ modules: dtsKnowledgeBase });
  }
  const filtered = dtsKnowledgeBase.filter(m => m.grade === Number(grade));
  res.json({ modules: filtered });
});

app.post('/api/dts/search', (req, res) => {
  const { query, grade } = req.body;
  const match = searchDts(query, grade);
  res.json({ match });
});

// ============================================================================
// 2. AI Chat & Vision Repetitor (DTS Context bilan)
// ============================================================================
app.post('/api/chat', async (req, res) => {
  const { grade, subject, message, images, history, mode, text } = req.body;

  if (mode === 'explain') {
    if (isBanned(text)) return res.json({ reply: REFUSAL });
    try {
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: `Quyidagi maqolani sodda tushuntir:\n\n${text}` }] }],
        systemInstruction: {
          role: 'system',
          parts: [{ text: "Sen Maktab AI yordamchisisisan. Maqolalarni o'zbek tilida, maktab o'quvchilari tushunadigan sodda tilda qisqacha tushuntir. Maksimum 150 so'z." }],
        },
        generationConfig: { maxOutputTokens: 600, temperature: 0.4 },
      });
      return res.json({ reply: result.response.text() });
    } catch (err) {
      return res.status(500).json({ reply: ERROR_REPLY });
    }
  }

  if (isBanned(message)) return res.json({ reply: REFUSAL, flagged: true });

  // DTS RAG qidiruvi
  const dtsMatch = searchDts(message, grade);
  let dtsContext = "";
  if (dtsMatch) {
    dtsContext = `\n[DTS Darslik Standarti: ${dtsMatch.grade}-sinf ${dtsMatch.subject}, "${dtsMatch.chapter}", ${dtsMatch.page}-bet. Rasmiy qoida: ${dtsMatch.rule} ${dtsMatch.formula ? 'Formula: ' + dtsMatch.formula : ''}]\n`;
  }

  const contextLine = `[Kontekst: ${grade || '?'}-sinf, ${subject || 'umumiy'} fani]${dtsContext}\n\n`;

  // 1. Claude orqali urinish
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const userContent = buildUserContent(contextLine + (message || ''), images);
      const completion = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        system: REPETITOR_PROMPT,
        messages: buildMessages(history, userContent),
      });
      const reply = extractReply(completion);
      if (reply) return res.json({ reply, dtsMatch, flagged: false });
    } catch (err) {
      console.warn('Claude fallback to Gemini:', err.message);
    }
  }

  // 2. Gemini 2.0 Flash orqali zaxira javob (Vision bilan)
  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: REPETITOR_PROMPT + "\n" + contextLine
    });

    const parts = [{ text: message || "Ushbu topshiriqni tushuntirib ber." }];
    if (Array.isArray(images) && images.length > 0) {
      for (const img of images) {
        if (img.data && img.media_type) {
          parts.push({
            inlineData: {
              data: img.data,
              mimeType: img.media_type
            }
          });
        }
      }
    }

    const result = await model.generateContent({ contents: [{ role: 'user', parts }] });
    const reply = result.response.text();
    return res.json({ reply: reply || ERROR_REPLY, dtsMatch, flagged: false });
  } catch (geminiErr) {
    console.error("AI chat xatosi:", geminiErr.message);
    return res.status(500).json({ reply: ERROR_REPLY, flagged: false });
  }
});

// ============================================================================
// 3. Ixtiro Laboratoriyasi API
// ============================================================================
app.post('/api/ixtiro', async (req, res) => {
  const { message, images, history } = req.body;

  if (isBanned(message)) return res.json({ reply: IXTIRO_REFUSAL, flagged: true });

  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const userContent = buildUserContent(message, images);
      const completion = await anthropic.messages.create({
        model: CLAUDE_MODEL,
        max_tokens: 1024,
        system: IXTIRO_PROMPT,
        messages: buildMessages(history, userContent),
      });
      const reply = extractReply(completion);
      if (reply) return res.json({ reply, flagged: false });
    } catch (err) {
      console.warn("Ixtiro Claude fallback to Gemini:", err.message);
    }
  }

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: IXTIRO_PROMPT
    });
    const result = await model.generateContent(message || "Mening yangi ixtiro g'oyam bor.");
    return res.json({ reply: result.response.text(), flagged: false });
  } catch (err) {
    return res.status(500).json({ reply: ERROR_REPLY, flagged: false });
  }
});

// ============================================================================
// 4. Ota-ona Maslahatchisi & AI Tahlil API
// ============================================================================
app.post('/api/parent/ask-ai', async (req, res) => {
  const { childId, message, history } = req.body;
  const child = telemetryStore.children[childId || 'child_1'];

  const statsContext = child ? `
[Farzand profili: ${child.name}, ${child.grade}-sinf]
[Ekran vaqti va Ilovalar: ${JSON.stringify(child.appUsage)}]
[Reels va Qiziqishlar: ${JSON.stringify(child.reelsTopics)}]
[So'nggi manzil: ${child.location.address}, Batareya: ${child.location.battery}%]
` : "";

  try {
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.0-flash',
      systemInstruction: PARENT_PROMPT + "\n" + statsContext
    });
    const result = await model.generateContent(message || "Farzandimning haftalik ko'rsatkichlari bo'yicha xulosa bering.");
    return res.json({ reply: result.response.text() });
  } catch (err) {
    return res.status(500).json({ reply: "Maslahat generatsiyasida xatolik yuz berdi." });
  }
});

// ============================================================================
// 4.1 Ota-ona Haftalik Telegram AI Digest (Haftalik Tahlil Xabarnomasi)
// ============================================================================
app.get('/api/parent/generate-digest/:childId', async (req, res) => {
  const child = telemetryStore.children[req.params.childId] || telemetryStore.children['child_1'];

  const statsSummary = `
Farzand: ${child.name}, ${child.grade}-sinf
Haftalik ekran vaqti: 14 soat 20 daqiqa (Kuniga o'rtacha 2 soat)
Asosiy ilovalar: YouTube (${child.appUsage[0]?.timeMinutes || 65} daq/kun), Maktab AI (${child.appUsage[1]?.timeMinutes || 45} daq/kun)
Reels/Shorts qiziqishlari: Ta'lim & IT (${child.reelsTopics.education}%), Ilmiy tajribalar (${child.reelsTopics.science}%), O'yinlar (${child.reelsTopics.entertainment}%)
Lokatsiya intizomi: Maktabga o'z vaqtida borgan, 100% xavfsiz geozonada.
`;

  const defaultDigest = `🌟 <b>Haftalik umumiy baho:</b> A'lo (Dars va hordiq balansi to'g'ri saqlangan).\n`
    + `• 📚 <b>Ta'limiy faollik:</b> Farzandingiz ushbu haftada 5-sinf matematika va ingliz tili darsliklaridan faol foydalandi.\n`
    + `• 📱 <b>Reels & Video mazmuni:</b> 70% video vaqti ilm-fan, IT va mantiqiy tajribalarga sarflangan.\n`
    + `• 📍 <b>Xavfsizlik:</b> 100% vaqtida maktab va uy xavfsiz geozonalarida bo'ldi.\n`
    + `• 💡 <b>Tavsiya:</b> Farzandingizning fizika va dasturlashga qiziqishi yuqori, dam olish kunlari birgalikda mantiqiy o'yinlar o'ynashni tavsiya qilamiz!`;

  try {
    if (process.env.GEMINI_API_KEY && !process.env.GEMINI_API_KEY.includes('your_')) {
      const prompt = `${PARENT_PROMPT}\n\nQuyidagi haftalik statistika asosida ota-ona uchun qisqa Telegram AI hisoboti tayyorla:\n${statsSummary}`;
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (text) {
        return res.json({
          success: true,
          childName: child.name,
          digestText: text,
          stats: { totalScreenTime: "14 soat 20 daqiqa", educationPct: child.reelsTopics.education, safeLocationPct: "100%" }
        });
      }
    }
  } catch (err) {
    console.warn("Gemini Digest fallback:", err.message);
  }

  res.json({
    success: true,
    childName: child.name,
    digestText: defaultDigest,
    stats: { totalScreenTime: "14 soat 20 daqiqa", educationPct: child.reelsTopics.education, safeLocationPct: "100%" }
  });
});

app.post('/api/parent/send-digest', async (req, res) => {
  const { childId, chatId } = req.body;
  const child = telemetryStore.children[childId || 'child_1'];
  const botToken = process.env.TELEGRAM_BOT_TOKEN;

  try {
    // Generate AI Digest text
    const digestRes = await fetch(`http://localhost:${process.env.PORT || 3000}/api/parent/generate-digest/${childId || 'child_1'}`);
    const digestData = await digestRes.json();
    const messageText = `📊 <b>MAKTAB AI & QALQON — HAFTALIK HISOBOT</b> 🛡️\n\n`
      + `👦 <b>Farzand:</b> ${child.name} (${child.grade}-sinf)\n`
      + `📅 <b>Davr:</b> So'nggi 7 kunlik tahlil\n\n`
      + `${digestData.digestText}\n\n`
      + `🔗 <a href="http://localhost:3000/app.html?role=parent">To'liq xaritani va hisobotni ochish</a>`;

    if (botToken && chatId) {
      const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: messageText,
          parse_mode: 'HTML'
        })
      });
      const tgData = await tgRes.json();
      return res.json({ success: true, delivered: tgData.ok, messageText });
    }

    res.json({
      success: true,
      delivered: false,
      note: "Bot tokeni yoki chatId kiritilmagan bo'lsa, simulyatsiya xabari qaytariladi.",
      messageText
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// ============================================================================
// 5. Qalqon Telemetriya API (GPS, Apps, Reels)
// ============================================================================
app.post('/api/telemetry/location', (req, res) => {
  const { childId, lat, lng, speed, battery, address } = req.body;
  const targetId = childId || 'child_1';
  if (!telemetryStore.children[targetId]) {
    telemetryStore.children[targetId] = {
      id: targetId,
      name: "Farzand",
      grade: 5,
      location: {},
      locationHistory: [],
      appUsage: [],
      reelsTopics: {}
    };
  }

  const child = telemetryStore.children[targetId];
  child.location = {
    lat: lat || 41.311081,
    lng: lng || 69.240562,
    speed: speed || 0,
    battery: battery || 100,
    address: address || "Toshkent shahri",
    updatedAt: new Date().toISOString()
  };

  child.locationHistory.unshift({
    lat: child.location.lat,
    lng: child.location.lng,
    timestamp: child.location.updatedAt,
    place: address || "Lokatsiya nuqtasi"
  });
  if (child.locationHistory.length > 20) child.locationHistory.pop();

  res.json({ success: true, location: child.location });
});

app.get('/api/parent/location/:childId', (req, res) => {
  const child = telemetryStore.children[req.params.childId] || telemetryStore.children['child_1'];
  res.json({
    childId: child.id,
    name: child.name,
    location: child.location,
    history: child.locationHistory
  });
});

app.post('/api/telemetry/activities', (req, res) => {
  const { childId, appPackage, topic, timestamp } = req.body;
  const targetId = childId || 'child_1';
  if (!telemetryStore.children[targetId]) return res.json({ success: false });

  const child = telemetryStore.children[targetId];
  if (topic) {
    const lower = topic.toLowerCase();
    if (lower.includes('dars') || lower.includes('matem') || lower.includes('fizika') || lower.includes('python') || lower.includes('english') || lower.includes('til')) {
      child.reelsTopics.education = Math.min(80, (child.reelsTopics.education || 45) + 2);
    } else if (lower.includes('tajriba') || lower.includes('ilm') || lower.includes('robot') || lower.includes('mantiq')) {
      child.reelsTopics.science = Math.min(50, (child.reelsTopics.science || 25) + 2);
    } else {
      child.reelsTopics.entertainment = Math.min(60, (child.reelsTopics.entertainment || 30) + 1);
    }
  }
  res.json({ success: true, reelsTopics: child.reelsTopics });
});

app.get('/api/parent/analytics/:childId', (req, res) => {
  const child = telemetryStore.children[req.params.childId] || telemetryStore.children['child_1'];
  res.json({
    childId: child.id,
    name: child.name,
    grade: child.grade,
    appUsage: child.appUsage,
    reelsTopics: child.reelsTopics,
    location: child.location
  });
});

// ============================================================================
// 6. Gibrid To'lov Tizimi API (Click / Payme / Telegram Stars / TON)
// ============================================================================
app.post('/api/payments/create-invoice', (req, res) => {
  const { provider, plan, childId } = req.body; // 'click', 'payme', 'stars', 'ton'
  const amount = plan === 'yearly' ? 240000 : 25000; // UZS

  if (provider === 'stars') {
    return res.json({
      success: true,
      provider: 'stars',
      starsAmount: 150,
      invoiceLink: `https://t.me/$farzand_nazorat_bot?start=invoice_pro_${Date.now()}`
    });
  }

  if (provider === 'ton') {
    return res.json({
      success: true,
      provider: 'ton',
      tonAmount: "1.2 TON",
      walletAddress: "EQD...MaktabAiOfficialWallet...TON",
      memo: `PRO_${childId || 'USER'}_${Date.now()}`
    });
  }

  // Click & Payme link generator
  res.json({
    success: true,
    provider: provider || 'click',
    amount,
    payUrl: `https://my.click.uz/services/pay?service_id=12345&merchant_id=67890&amount=${amount}&transaction_param=${childId || '1'}`
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Maktab AI & Qalqon Ekotizimi http://localhost:${PORT} da ishlamoqda`);
});
