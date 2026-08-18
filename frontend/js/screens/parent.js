// PARENT PANEL SCREEN
let selectedChild = 'Alibek';

function initParentScreen() {
  buildWeeklyChart();
  loadParentStats();
}

function buildWeeklyChart() {
  const bars = document.getElementById('chart-bars');
  if (!bars) return;
  // Sample weekly data (minutes per day)
  const data = [30, 45, 0, 60, 50, 20, 40];
  const max = Math.max(...data);
  bars.innerHTML = data.map((val, i) => {
    const height = max > 0 ? Math.round((val / max) * 80) : 0;
    const isToday = i === new Date().getDay() - 1;
    return `<div class="chart-bar ${isToday ? 'active' : ''}" style="height:${Math.max(height, 4)}px" title="${val} daqiqa"></div>`;
  }).join('');
}

function selectChild(el, name) {
  selectedChild = name;
  document.querySelectorAll('.child-card').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  TG.haptic('light');
  loadParentStats();
}

async function loadParentStats() {
  // In production — fetch from /api/stats/:studentId
  // Mock data for now
  const stats = { time: 45, messages: 23, tests: 2, score: 8.5 };
  document.getElementById('stat-time').textContent = stats.time;
  document.getElementById('stat-messages').textContent = stats.messages;
  document.getElementById('stat-tests').textContent = stats.tests;
  document.getElementById('stat-score').textContent = stats.score;
}

function showAddChild() {
  document.getElementById('add-child-modal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('add-child-modal').style.display = 'none';
}

function addChild() {
  const name = document.getElementById('child-name').value.trim();
  const grade = document.getElementById('child-grade').value;
  if (!name || !grade) { showToast('Iltimos, barcha maydonlarni to\'ldiring!'); return; }

  const list = document.getElementById('children-list');
  const addBtn = list.querySelector('.add-child-btn');
  const card = document.createElement('div');
  card.className = 'child-card';
  card.innerHTML = `
    <div class="child-avatar">${Math.random() > 0.5 ? '👦' : '👧'}</div>
    <div class="child-info">
      <div class="child-name">${name}</div>
      <div class="child-grade">${grade}-sinf</div>
    </div>
    <div class="child-status offline">●</div>`;
  card.onclick = () => selectChild(card, name);
  list.insertBefore(card, addBtn);

  closeModal();
  TG.haptic('medium');
  showToast(`${name} qo'shildi! ✅`);
}

function parentLogin() {
  const phone = document.getElementById('parent-phone').value.trim();
  if (!phone) { showToast('Telefon raqamini kiriting!'); return; }
  showToast('SMS kod yuborildi! (Demo rejim)');
}
