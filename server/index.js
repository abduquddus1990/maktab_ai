require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Anthropic = require('@anthropic-ai/sdk');

const app = express();
app.use(express.json({ limit: '20mb' }));
app.use(express.static(path.join(__dirname, '../public')));

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY || '' });

const CLAUDE_MODEL = 'claude-sonnet-5';

const REPETITOR_PROMPT = fs.readFileSync(path.join(__dirname, 'prompts/repetitor.txt'), 'utf-8');
const IXTIRO_PROMPT = fs.readFileSync(path.join(__dirname, 'prompts/ixtiro.txt'), 'utf-8');

// Yengil old-tekshiruv — asosiy himoya system promptlarda. Bu faqat aniq xavfli
// kategoriyalarni ushlab, Claude'ga yubormay muloyim rad javobini qaytaradi.
const BANNED = [
  'porno', 'seks', 'erotik', 'narkotik', 'giyohvand', 'terror', 'bomba', 'dinamit',
  'portlovchi', 'qotil', "zo'rlash", 'tajovuz', "o'z joniga qasd", 'qurol yasash',
];
function isBanned(text = '') {
  const lower = String(text).toLowerCase();
  return BANNED.some((w) => lower.includes(w));
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
  const text = trimmed || 'Bu rasm(lar)ni tahlil qiling.';
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
const ERROR_REPLY = "Kechirasiz, xato yuz berdi. Qayta urinib ko'ring.";

app.post('/api/chat', async (req, res) => {
  const { grade, subject, message, images, history, mode, text } = req.body;

  // Eski "maqola tushuntirish" rejimi (yangiliklar.html) — o'zgarishsiz, Gemini orqali.
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
      console.error('Gemini error:', err.message);
      return res.status(500).json({ reply: ERROR_REPLY });
    }
  }

  if (isBanned(message)) return res.json({ reply: REFUSAL, flagged: true });

  try {
    const contextLine = `[Kontekst: ${grade || '?'}-sinf, ${subject || 'umumiy'} fani]\n\n`;
    const userContent = buildUserContent(contextLine + (message || ''), images);

    const completion = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: REPETITOR_PROMPT,
      messages: buildMessages(history, userContent),
    });

    res.json({ reply: extractReply(completion) || ERROR_REPLY, flagged: false });
  } catch (err) {
    console.error('Claude error (chat):', err.message);
    res.status(500).json({ reply: ERROR_REPLY, flagged: false });
  }
});

app.post('/api/ixtiro', async (req, res) => {
  const { message, images, history } = req.body;

  if (isBanned(message)) return res.json({ reply: IXTIRO_REFUSAL, flagged: true });

  try {
    const userContent = buildUserContent(message, images);

    const completion = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system: IXTIRO_PROMPT,
      messages: buildMessages(history, userContent),
    });

    res.json({ reply: extractReply(completion) || ERROR_REPLY, flagged: false });
  } catch (err) {
    console.error('Claude error (ixtiro):', err.message);
    res.status(500).json({ reply: ERROR_REPLY, flagged: false });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Maktab AI server http://localhost:${PORT} da ishlamoqda`));
