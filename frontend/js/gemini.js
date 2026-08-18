// Google Gemini AI — MAKTAB AI full integration
const GEMINI_API_KEY = 'AIzaSyD2nOTfeR0M_Hp-K4goY4d5v4eexby01Ps';
const GEMINI_MODEL   = 'gemini-2.5-flash';
const GEMINI_URL     = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

// Sinfga qarab darsliklari
const GRADE_SUBJECTS = {
  1:  ['Ona tili', 'O\'qish', 'Matematika', 'Atrofimizdagi olam'],
  2:  ['Ona tili', 'O\'qish', 'Matematika', 'Atrofimizdagi olam'],
  3:  ['Ona tili', 'O\'qish', 'Matematika', 'Atrofimizdagi olam'],
  4:  ['Ona tili', 'O\'qish', 'Matematika', 'Tabiatshunoslik'],
  5:  ['Ona tili', 'Adabiyot', 'Matematika', 'Tarix', 'Biologiya', 'Geografiya'],
  6:  ['Ona tili', 'Adabiyot', 'Algebra', 'Geometriya', 'Tarix', 'Biologiya', 'Geografiya'],
  7:  ['Ona tili', 'Adabiyot', 'Algebra', 'Geometriya', 'Fizika', 'Kimyo', 'Tarix'],
  8:  ['Ona tili', 'Adabiyot', 'Algebra', 'Geometriya', 'Fizika', 'Kimyo', 'Tarix'],
  9:  ['Ona tili', 'Adabiyot', 'Algebra', 'Geometriya', 'Fizika', 'Kimyo', 'Biologiya'],
  10: ['Ona tili', 'Adabiyot', 'Algebra', 'Geometriya', 'Fizika', 'Kimyo', 'Biologiya'],
  11: ['Ona tili', 'Adabiyot', 'Algebra', 'Geometriya', 'Fizika', 'Kimyo', 'Biologiya'],
};

// Sinfga qarab til darajasi
function getTilDarajasi(grade) {
  if (grade <= 4) return 'juda sodda so\'zlar, qisqa jumlalar, emoji ishlat 😊';
  if (grade <= 8) return 'o\'rtacha murakkablik, rag\'batlantiruvchi ohang';
  return 'batafsil tushuntirish, akademik uslub';
}

const Gemini = {

  buildSystemPrompt(grade, subject, name) {
    const subjectList = (GRADE_SUBJECTS[grade] || []).join(', ');
    const tilDarajasi = getTilDarajasi(grade);

    return `Siz MAKTAB AI — O'zbekiston Xalq ta'limi vazirligi tomonidan tasdiqlangan rasmiy darsliklar asosida ishlaydigan AI mentorsiz.

SINF VA KITOB QOIDASI:
- Faqat ${grade}-sinf rasmiy O'zbekiston maktab darsliklaridan javob ber
- ${grade}-sinf darsliklari: ${subjectList}
- Boshqa manbalardan foydalanma
- Javob darslikda yo'q bo'lsa: "Bu mavzu ${grade}-sinf darsligida yo'q, ustozingizdan so'rang" de
- Har bir javobda qaysi darslik, qaysi bob ekanini ayt

TIL QOIDASI:
- Faqat O'zbek tilida (lotin alifbosi) javob ber
- ${grade}-sinf uchun: ${tilDarajasi}

O'QITISH USLUBI:
- Javobni to'g'ridan berma — bosqichma-bosqich yetakla
- Har doim real hayotdan misol keltir
- Javobdan keyin "Tushundingizmi? Test qilamizmi? 😊" de
- "Zo'r!", "To'g'ri!", "Ajoyib!" kabi so'zlar ishlat
- Javob maksimum 5 jumladan oshmasin

QATTIQ CHEKLOVLAR — bu mavzularda HECH QACHON javob berma:
1. Pornografiya / jinsiy mavzular → "Bu mavzuda javob bera olmayman. Faqat maktab darsliklari bo'yicha yordam beraman."
2. Din (islom, xristianlik, va boshqalar) → "Din mavzusida javob bera olmayman. Bu maktab o'quv dasturiga kirmaydi. Diniy savollar uchun ota-onangizga murojaat qiling."
3. Siyosat, partiyalar, siyosatchilar → "Siyosiy mavzularda javob bera olmayman. Faqat maktab darsliklari bo'yicha yordam beraman."
4. Zo'ravonlik, qurol, zarar etkazish → "Bu mavzuda javob bera olmayman."
5. Shaxsiy ma'lumot so'rash → HECH QACHON o'quvchidan shaxsiy ma'lumot so'rama

O'quvchi: ${name}, ${grade}-sinf, fan: ${subject}`;
  },

  async chat(grade, subject, name, question, history = []) {
    const systemPrompt = this.buildSystemPrompt(grade, subject, name);

    const contents = [];
    for (const msg of history.slice(-10)) {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }
    contents.push({ role: 'user', parts: [{ text: question }] });

    try {
      const res = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: {
            maxOutputTokens: 600,
            temperature: 0.7,
          }
        })
      });

      if (!res.ok) {
        const err = await res.json();
        console.error('Gemini error:', err);
        return null;
      }

      const data = await res.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || null;

    } catch (e) {
      console.error('Gemini fetch error:', e);
      return null;
    }
  },

  async generateTest(grade, subject) {
    const prompt = `O'zbekiston ${grade}-sinf "${subject}" darsligidan 5 ta test savoli tuz.

Faqat quyidagi JSON formatda qaytarim (boshqa hech narsa yozma):
{
  "questions": [
    {
      "q": "savol matni",
      "options": ["A variant", "B variant", "C variant", "D variant"],
      "correct": 0
    }
  ]
}

Qoidalar:
- Savollar ${grade}-sinf rasmiy darsligiga mos bo'lsin
- ${getTilDarajasi(grade)}
- correct — to'g'ri javob indeksi (0 dan 3 gacha)
- Faqat JSON, boshqa matn yo'q`;

    try {
      const res = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { maxOutputTokens: 1500, temperature: 0.4 }
        })
      });

      const data = await res.json();
      let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // JSON ni ajratib olish (```json ... ``` bo'lsa)
      const start = text.indexOf('{');
      const end   = text.lastIndexOf('}') + 1;
      if (start >= 0 && end > start) text = text.slice(start, end);

      return JSON.parse(text);
    } catch (e) {
      console.error('Gemini test error:', e);
      return null;
    }
  }
};
