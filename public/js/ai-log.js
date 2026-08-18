/* Maktab AI — AI (Repetitor + Ixtiro) foydalanish loglari va ota-ona sozlamalari.
   Demo uchun localStorage'da saqlanadi; real backendda bu /api/chat va /api/ixtiro
   har chaqirilganda DB'ga yoziladigan log jadvaliga to'g'ri keladi. */
(function () {
  const LOG_KEY = 'maktabai_ai_logs';
  const SETTINGS_KEY = 'maktabai_ai_settings';

  const DEFAULT_SETTINGS = {
    dailyLimitMin: 120,
    nightModeEnabled: true,
    nightStart: '22:00',
    nightEnd: '06:00',
  };

  function readJSON(key, fallback) {
    try {
      const v = JSON.parse(localStorage.getItem(key));
      return v == null ? fallback : v;
    } catch {
      return fallback;
    }
  }
  function writeJSON(key, val) {
    localStorage.setItem(key, JSON.stringify(val));
  }

  function getAll() {
    return readJSON(LOG_KEY, []);
  }
  function saveAll(list) {
    writeJSON(LOG_KEY, list);
  }
  function getByStudent(studentId) {
    return getAll().filter((e) => String(e.studentId) === String(studentId));
  }

  function upsert(entry) {
    const list = getAll();
    const idx = list.findIndex((e) => e.id === entry.id);
    if (idx >= 0) list[idx] = entry;
    else list.push(entry);
    saveAll(list);
    return entry;
  }

  function getCurrentStudentId() {
    try {
      const cu = JSON.parse(localStorage.getItem('maktabai_currentUser') || localStorage.getItem('maktab_user') || 'null');
      return (cu && cu.id) || 1;
    } catch {
      return 1;
    }
  }

  function getSettings(studentId) {
    const all = readJSON(SETTINGS_KEY, {});
    return Object.assign({}, DEFAULT_SETTINGS, all[studentId] || {});
  }
  function setSettings(studentId, patch) {
    const all = readJSON(SETTINGS_KEY, {});
    all[studentId] = Object.assign({}, DEFAULT_SETTINGS, all[studentId] || {}, patch);
    writeJSON(SETTINGS_KEY, all);
    return all[studentId];
  }

  function uid() {
    return 'log_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 8);
  }

  function seedDemo() {
    if (getAll().length) return;
    const now = Date.now();
    const DAY = 86400000;
    const entries = [];

    function addEntry({ studentId, type, subject, grade, topicSummary, dayOffset, hour, minute, messageCount, durationSec, flagged, flaggedQuestion }) {
      const d = new Date(now - dayOffset * DAY);
      d.setHours(hour, minute, 0, 0);
      entries.push({
        id: uid(),
        studentId,
        type,
        subject: subject || null,
        grade: grade || null,
        topicSummary,
        messageCount,
        durationSec,
        flagged: !!flagged,
        flaggedQuestion: flagged ? flaggedQuestion : undefined,
        createdAt: d.toISOString(),
      });
    }

    /* Asilbek — 8-sinf, id 1 */
    addEntry({ studentId: 1, type: 'repetitor', subject: 'Matematika', grade: 8, topicSummary: 'Kvadrat tenglama yechish', dayOffset: 0, hour: 16, minute: 20, messageCount: 6, durationSec: 640 });
    addEntry({ studentId: 1, type: 'repetitor', subject: 'Fizika', grade: 8, topicSummary: 'Nyuton qonunlari', dayOffset: 0, hour: 18, minute: 5, messageCount: 4, durationSec: 410 });
    addEntry({ studentId: 1, type: 'ixtiro', subject: 'Ixtiro', grade: 8, topicSummary: "Quyosh energiyasida ishlaydigan sug'orish tizimi", dayOffset: 0, hour: 19, minute: 40, messageCount: 8, durationSec: 900 });
    addEntry({ studentId: 1, type: 'repetitor', subject: 'Matematika', grade: 8, topicSummary: 'Foizlar masalasi', dayOffset: 1, hour: 17, minute: 10, messageCount: 5, durationSec: 520 });
    addEntry({ studentId: 1, type: 'repetitor', subject: 'Ingliz tili', grade: 8, topicSummary: 'Past Simple qoidasi', dayOffset: 1, hour: 23, minute: 15, messageCount: 3, durationSec: 260 });
    addEntry({ studentId: 1, type: 'repetitor', subject: 'Kimyo', grade: 8, topicSummary: 'Kimyoviy reaksiya turlari', dayOffset: 2, hour: 15, minute: 50, messageCount: 7, durationSec: 700 });
    addEntry({ studentId: 1, type: 'repetitor', subject: 'Matematika', grade: 8, topicSummary: "Nomaqbul mavzu so'raldi — javob berilmadi", dayOffset: 2, hour: 20, minute: 30, messageCount: 1, durationSec: 20, flagged: true, flaggedQuestion: 'Bomba qanday yasaladi?' });
    addEntry({ studentId: 1, type: 'ixtiro', subject: 'Ixtiro', grade: 8, topicSummary: 'Chiqindi plastikni qayta ishlash qurilmasi', dayOffset: 3, hour: 16, minute: 0, messageCount: 6, durationSec: 610 });
    addEntry({ studentId: 1, type: 'repetitor', subject: 'Fizika', grade: 8, topicSummary: 'Elektr zanjiri', dayOffset: 4, hour: 17, minute: 45, messageCount: 4, durationSec: 380 });
    addEntry({ studentId: 1, type: 'repetitor', subject: 'Geografiya', grade: 8, topicSummary: 'Iqlim mintaqalari', dayOffset: 5, hour: 14, minute: 30, messageCount: 3, durationSec: 300 });
    addEntry({ studentId: 1, type: 'repetitor', subject: 'Matematika', grade: 8, topicSummary: 'Uchburchak yuzasi', dayOffset: 6, hour: 18, minute: 20, messageCount: 5, durationSec: 540 });

    /* Malika — 5-sinf, id 2 */
    addEntry({ studentId: 2, type: 'repetitor', subject: 'Ona tili', grade: 5, topicSummary: 'Ega va kesim', dayOffset: 0, hour: 15, minute: 0, messageCount: 4, durationSec: 360 });
    addEntry({ studentId: 2, type: 'repetitor', subject: 'Matematika', grade: 5, topicSummary: "Ko'paytirish jadvali", dayOffset: 0, hour: 16, minute: 30, messageCount: 5, durationSec: 400 });
    addEntry({ studentId: 2, type: 'ixtiro', subject: 'Ixtiro', grade: 5, topicSummary: 'Uy hayvonlari uchun avtomatik ovqatlantirgich', dayOffset: 1, hour: 17, minute: 0, messageCount: 5, durationSec: 480 });
    addEntry({ studentId: 2, type: 'repetitor', subject: 'Biologiya', grade: 5, topicSummary: 'Hujayra tuzilishi', dayOffset: 2, hour: 15, minute: 40, messageCount: 3, durationSec: 290 });
    addEntry({ studentId: 2, type: 'repetitor', subject: 'Ona tili', grade: 5, topicSummary: 'Insho tuzilishi', dayOffset: 3, hour: 2, minute: 10, messageCount: 2, durationSec: 150 });
    addEntry({ studentId: 2, type: 'repetitor', subject: 'Matematika', grade: 5, topicSummary: "Qo'shish va ayirish masalalari", dayOffset: 4, hour: 16, minute: 10, messageCount: 4, durationSec: 340 });

    saveAll(entries);
  }

  window.AILog = {
    getAll, saveAll, getByStudent, upsert, getCurrentStudentId,
    getSettings, setSettings, uid, seedDemo, DEFAULT_SETTINGS,
  };

  seedDemo();
})();
