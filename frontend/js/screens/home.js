// HOME SCREEN
function initHomeScreen() {
  const user = TG.getUser();
  const student = State.student;

  const nameEl = document.getElementById('welcome-name');
  const subEl  = document.getElementById('welcome-sub');

  if (student.name) {
    nameEl.textContent = `Salom, ${student.name}!`;
    subEl.textContent  = student.grade
      ? `${student.grade}-sinf o'quvchisi`
      : 'O\'zbekiston maktab AI mentori';
  } else {
    const displayName = user.first_name || 'O\'quvchi';
    nameEl.textContent = `Salom, ${displayName}!`;
    subEl.textContent  = 'O\'zbekiston maktab dasturi asosida AI mentor';
  }
}
