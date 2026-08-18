// MAIN APP
const State = {
  studentId: null,
  student: { name: '', grade: null },
  currentSubject: null,
  currentScreen: 'home',

  save() {
    localStorage.setItem('maktab_student', JSON.stringify(this.student));
    if (this.currentSubject)
      localStorage.setItem('maktab_subject', JSON.stringify(this.currentSubject));
  },

  load() {
    try {
      const s = localStorage.getItem('maktab_student');
      if (s) this.student = JSON.parse(s);
      const sub = localStorage.getItem('maktab_subject');
      if (sub) this.currentSubject = JSON.parse(sub);
    } catch(e) {}
  },
};

function navigateTo(screenName) {
  if (State.currentScreen === screenName) return;

  document.getElementById(`screen-${State.currentScreen}`).classList.remove('active');
  document.getElementById(`screen-${screenName}`).classList.add('active');

  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.screen === screenName);
  });

  State.currentScreen = screenName;
  TG.haptic('light');

  if (screenName === 'home')    initHomeScreen();
  if (screenName === 'student') initStudentScreen();
  if (screenName === 'chat')    initChatScreen();
  if (screenName === 'parent')  initParentScreen();
}

function showToast(msg, duration = 2500) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

// ===== BOOT =====
(async function init() {
  TG.init();
  State.load();

  const user = TG.getUser();
  if (user) {
    State.studentId = user.id;
    if (!State.student.name && user.first_name)
      State.student.name = user.first_name;
  }

  initHomeScreen();
})();
