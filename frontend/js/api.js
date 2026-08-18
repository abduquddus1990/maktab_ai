// API client — all backend calls go here
const API_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:8000'
  : 'https://your-backend.railway.app';  // production URL

const Api = {
  async request(method, path, body = null) {
    const opts = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'X-Telegram-Init-Data': TG.getInitData(),
      },
    };
    if (body) opts.body = JSON.stringify(body);
    try {
      const res = await fetch(API_URL + path, opts);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (e) {
      console.warn('API error:', e.message);
      return null;
    }
  },

  async authTelegram() {
    return this.request('POST', '/api/auth/telegram', {
      init_data: TG.getInitData(),
    });
  },

  async getSubjects(grade) {
    return this.request('GET', `/api/subjects?grade=${grade}`);
  },

  async chat(studentId, grade, subject, subjectId, question, history = []) {
    return this.request('POST', '/api/chat', {
      student_id: studentId,
      grade,
      subject,
      subject_id: subjectId,
      question,
      history: history.slice(-10), // last 10 messages for context
    });
  },

  async startTest(studentId, subjectId, grade, subject) {
    return this.request('POST', '/api/test/start', {
      student_id: studentId,
      subject_id: subjectId,
      grade,
      subject,
    });
  },

  async submitAnswer(testId, questionIndex, answer) {
    return this.request('POST', '/api/test/answer', {
      test_id: testId,
      question_index: questionIndex,
      answer,
    });
  },

  async getStats(studentId) {
    return this.request('GET', `/api/stats/${studentId}`);
  },

  async getNews() {
    return this.request('GET', '/api/news');
  },
};

// ===== MOCK DATA (when backend is not available) =====
const MOCK = {
  subjects: {
    1: [
      { id:1, name:'O\'zbek tili', icon:'📝', grade:1 },
      { id:2, name:'Matematika', icon:'📐', grade:1 },
      { id:3, name:'Atrofimizdagi olam', icon:'🌍', grade:1 },
      { id:4, name:'Tasviriy san\'at', icon:'🎨', grade:1 },
    ],
    2: [
      { id:1, name:'O\'zbek tili', icon:'📝', grade:2 },
      { id:2, name:'Matematika', icon:'📐', grade:2 },
      { id:3, name:'Atrofimizdagi olam', icon:'🌍', grade:2 },
      { id:5, name:'Musiqa', icon:'🎵', grade:2 },
    ],
    3: [
      { id:1, name:'O\'zbek tili', icon:'📝', grade:3 },
      { id:2, name:'Matematika', icon:'📐', grade:3 },
      { id:3, name:'Atrofimizdagi olam', icon:'🌍', grade:3 },
      { id:6, name:'Texnologiya', icon:'🔧', grade:3 },
    ],
    4: [
      { id:1, name:'O\'zbek tili', icon:'📝', grade:4 },
      { id:2, name:'Matematika', icon:'📐', grade:4 },
      { id:3, name:'Tabiatshunoslik', icon:'🌿', grade:4 },
      { id:7, name:'Ingliz tili', icon:'🇬🇧', grade:4 },
      { id:8, name:'Tarix', icon:'🏛️', grade:4 },
      { id:9, name:'Musiqa', icon:'🎵', grade:4 },
    ],
    5: [
      { id:1, name:'O\'zbek tili', icon:'📝', grade:5 },
      { id:2, name:'Matematika', icon:'📐', grade:5 },
      { id:7, name:'Ingliz tili', icon:'🇬🇧', grade:5 },
      { id:10, name:'Biologiya', icon:'🧬', grade:5 },
      { id:11, name:'Geografiya', icon:'🗺️', grade:5 },
      { id:12, name:'Tarix', icon:'🏛️', grade:5 },
      { id:13, name:'Fizika', icon:'⚡', grade:5 },
    ],
    6: [
      { id:1, name:'O\'zbek tili', icon:'📝', grade:6 },
      { id:2, name:'Matematika', icon:'📐', grade:6 },
      { id:7, name:'Ingliz tili', icon:'🇬🇧', grade:6 },
      { id:10, name:'Biologiya', icon:'🧬', grade:6 },
      { id:11, name:'Geografiya', icon:'🗺️', grade:6 },
      { id:12, name:'Tarix', icon:'🏛️', grade:6 },
      { id:13, name:'Fizika', icon:'⚡', grade:6 },
      { id:14, name:'Kimyo', icon:'🧪', grade:6 },
    ],
    7: [
      { id:1, name:'O\'zbek tili', icon:'📝', grade:7 },
      { id:2, name:'Algebra', icon:'📐', grade:7 },
      { id:3, name:'Geometriya', icon:'📏', grade:7 },
      { id:7, name:'Ingliz tili', icon:'🇬🇧', grade:7 },
      { id:10, name:'Biologiya', icon:'🧬', grade:7 },
      { id:13, name:'Fizika', icon:'⚡', grade:7 },
      { id:14, name:'Kimyo', icon:'🧪', grade:7 },
      { id:15, name:'Informatika', icon:'💻', grade:7 },
    ],
    8: [
      { id:1, name:'O\'zbek tili', icon:'📝', grade:8 },
      { id:2, name:'Algebra', icon:'📐', grade:8 },
      { id:3, name:'Geometriya', icon:'📏', grade:8 },
      { id:7, name:'Ingliz tili', icon:'🇬🇧', grade:8 },
      { id:10, name:'Biologiya', icon:'🧬', grade:8 },
      { id:13, name:'Fizika', icon:'⚡', grade:8 },
      { id:14, name:'Kimyo', icon:'🧪', grade:8 },
      { id:15, name:'Informatika', icon:'💻', grade:8 },
    ],
    9: [
      { id:1, name:'O\'zbek tili', icon:'📝', grade:9 },
      { id:2, name:'Algebra', icon:'📐', grade:9 },
      { id:3, name:'Geometriya', icon:'📏', grade:9 },
      { id:7, name:'Ingliz tili', icon:'🇬🇧', grade:9 },
      { id:10, name:'Biologiya', icon:'🧬', grade:9 },
      { id:13, name:'Fizika', icon:'⚡', grade:9 },
      { id:14, name:'Kimyo', icon:'🧪', grade:9 },
      { id:15, name:'Informatika', icon:'💻', grade:9 },
    ],
    10: [
      { id:2, name:'Algebra va Analiz', icon:'📐', grade:10 },
      { id:3, name:'Geometriya', icon:'📏', grade:10 },
      { id:7, name:'Ingliz tili', icon:'🇬🇧', grade:10 },
      { id:13, name:'Fizika', icon:'⚡', grade:10 },
      { id:14, name:'Kimyo', icon:'🧪', grade:10 },
      { id:10, name:'Biologiya', icon:'🧬', grade:10 },
      { id:15, name:'Informatika', icon:'💻', grade:10 },
      { id:16, name:'Iqtisodiyot', icon:'💰', grade:10 },
    ],
    11: [
      { id:2, name:'Algebra va Analiz', icon:'📐', grade:11 },
      { id:3, name:'Geometriya', icon:'📏', grade:11 },
      { id:7, name:'Ingliz tili', icon:'🇬🇧', grade:11 },
      { id:13, name:'Fizika', icon:'⚡', grade:11 },
      { id:14, name:'Kimyo', icon:'🧪', grade:11 },
      { id:10, name:'Biologiya', icon:'🧬', grade:11 },
      { id:15, name:'Informatika', icon:'💻', grade:11 },
    ],
  },

  async getSubjects(grade) {
    return this.subjects[grade] || [];
  },

  async chat(question, grade, subject, name) {
    // Simulate backend — in production this hits /api/chat → Claude API
    await new Promise(r => setTimeout(r, 1500));
    const responses = [
      `Ajoyib savol, ${name}! ${subject} fanida bu juda muhim mavzu.\n\nKeling, sodda tushuntiray: har bir misol biz ko'rgan narsani aniq ko'rsatadi.\n\nBoshqa savolingiz bormi? Test qilamizmi? 😊`,
      `${name}, bu ${grade}-sinf dasturida bor. Men senga tushuntiraman!\n\nBu masalani hal qilish uchun:\n1. Avval ma'lumotlarni yig'amiz\n2. Keyin hisoblaymiz\n3. Natijani tekshiramiz\n\nTushundingizmi? 🎯`,
      `Yaxshi savol! ${subject} da bu qoida juda muhim.\n\nMisol bilan ko'ramiz:\n• Birinchi holat...\n• Ikkinchi holat...\n\nShunday qilib, javob aniq bo'ldi! Test qilamizmi? ✅`,
    ];
    return { answer: responses[Math.floor(Math.random() * responses.length)] };
  },

  async getTestQuestions(grade, subject) {
    await new Promise(r => setTimeout(r, 1000));
    return {
      test_id: Math.floor(Math.random() * 10000),
      questions: [
        { q: `${subject} fanida quyidagilardan qaysi biri to'g'ri?`, options: ['A variant', 'B variant', 'C variant', 'D variant'], correct: 0 },
        { q: `${grade}-sinf ${subject} dasturiga ko'ra...`, options: ['Birinchi javob', 'Ikkinchi javob', 'Uchinchi javob', 'To\'rtinchi javob'], correct: 2 },
        { q: `Bu misolda qaysi qoida qo'llaniladi?`, options: ['1-qoida', '2-qoida', '3-qoida', 'Hech biri'], correct: 1 },
        { q: `Necha bo'ladi: 4 × 7 = ?`, options: ['24', '28', '32', '21'], correct: 1 },
        { q: `To'g'ri javobni belgilang:`, options: ['Ha', 'Yo\'q', 'Ba\'zan', 'Har doim'], correct: 0 },
      ],
    };
  },
};
