/* Maktab AI — Ixtiro mentori sahifasi (umumiy AICore, sinf/fan konteksti yo'q) */
(function () {
  AICore.init({
    endpoint: '/api/ixtiro',
    aiLabel: 'Ixtiro mentori',
    logType: 'ixtiro',
    getExtraBody: () => ({}),
    welcome: () =>
      `Assalomu alaykum! 👋 Men **Ixtiro mentori**man.\n\n` +
      `Sizga o'zingiz g'oya topib, uni haqiqiy loyihaga aylantirishda yordam beraman. ` +
      `Muammo yoki qiziqishingizni ayting, yoki eskizingiz rasmini yuboring — birga o'ylab topamiz! 💡📷`,
  });
})();
