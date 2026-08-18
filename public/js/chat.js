/* Maktab AI — AI Repetitor sahifasi (fan/sinf konteksti + umumiy AICore) */
(function () {
  const selFan = document.getElementById('sel-fan');
  const selSinf = document.getElementById('sel-sinf');
  const tinput = document.getElementById('tinput');

  const savedGrade = localStorage.getItem('student_grade') || '7';
  if (selSinf) selSinf.value = savedGrade;

  const urlFan = new URLSearchParams(location.search).get('fan');
  if (urlFan && selFan) selFan.value = urlFan;

  window.updateContext = function () {
    const fan = selFan?.value || 'Umumiy';
    const sinf = selSinf?.value || '7';
    const title = document.getElementById('hdr-title');
    const sub = document.getElementById('hdr-sub');
    if (title) title.textContent = `${fan} — AI Repetitor`;
    if (sub) sub.textContent = `${sinf}-sinf · O'zbekiston maktab dasturi`;
    localStorage.setItem('student_grade', sinf);
  };

  updateContext();

  AICore.init({
    endpoint: '/api/chat',
    aiLabel: 'AI Repetitor',
    logType: 'repetitor',
    getExtraBody: () => ({ grade: selSinf?.value || '7', subject: selFan?.value || 'Umumiy' }),
    welcome: () => {
      const fan = selFan?.value || 'Matematika';
      const sinf = selSinf?.value || '7';
      return (
        `Assalomu alaykum! 👋 Men **Maktab AI** repetitoriman.\n\n` +
        `Siz hozir **${sinf}-sinf ${fan}** bo'yicha dars boshlayapsiz.\n` +
        `Menga istalgan savol bering yoki uy vazifangiz rasmini yuboring — men qadam-baqadam tushuntirib beraman! 📚📷`
      );
    },
  });
})();
