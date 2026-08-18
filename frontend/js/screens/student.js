// Subject icon & color mapping (Material Icons)
const SUBJECT_STYLE = {
  "O'zbek tili":      { icon: 'translate',    bg: '#FFEB3B', text: '#7F6E00' },
  "Ona tili":         { icon: 'translate',    bg: '#FFEB3B', text: '#7F6E00' },
  "Matematika":       { icon: 'calculate',    bg: '#2196F3', text: 'white'   },
  "Algebra":          { icon: 'calculate',    bg: '#2196F3', text: 'white'   },
  "Algebra va Analiz":{ icon: 'calculate',    bg: '#2196F3', text: 'white'   },
  "Geometriya":       { icon: 'straighten',   bg: '#FF9800', text: 'white'   },
  "Ingliz tili":      { icon: 'language',     bg: '#673AB7', text: 'white'   },
  "Biologiya":        { icon: 'biotech',      bg: '#4CAF50', text: 'white'   },
  "Geografiya":       { icon: 'public',       bg: '#00BCD4', text: 'white'   },
  "Tarix":            { icon: 'history_edu',  bg: '#795548', text: 'white'   },
  "Fizika":           { icon: 'bolt',         bg: '#FF5722', text: 'white'   },
  "Kimyo":            { icon: 'science',      bg: '#9C27B0', text: 'white'   },
  "Informatika":      { icon: 'computer',     bg: '#607D8B', text: 'white'   },
  "Tabiatshunoslik":  { icon: 'forest',       bg: '#4CAF50', text: 'white'   },
  "Atrofimizdagi olam":{ icon: 'nature',      bg: '#4CAF50', text: 'white'   },
  "Tasviriy san'at":  { icon: 'palette',      bg: '#E91E63', text: 'white'   },
  "Musiqa":           { icon: 'music_note',   bg: '#9C27B0', text: 'white'   },
  "Texnologiya":      { icon: 'handyman',     bg: '#FF9800', text: 'white'   },
  "Iqtisodiyot":      { icon: 'payments',     bg: '#4CAF50', text: 'white'   },
  "O'qish":           { icon: 'auto_stories', bg: '#F44336', text: 'white'   },
};

function getSubjectStyle(name) {
  return SUBJECT_STYLE[name] || { icon: 'menu_book', bg: '#ffc800', text: '#241a00' };
}

let selectedGrade = null;

function initStudentScreen() {
  if (State.student.name && State.student.grade) {
    showSubjectList();
  } else {
    showSetupForm();
  }
}

function showSetupForm() {
  document.getElementById('setup-form').style.display = 'block';
  document.getElementById('subject-list').style.display = 'none';
  buildGradeGrid();
  selectedGrade = State.student.grade || null;
  if (selectedGrade) highlightGrade(selectedGrade);
  const nameInput = document.getElementById('input-name');
  if (State.student.name) nameInput.value = State.student.name;
}

function buildGradeGrid() {
  const grid = document.getElementById('grade-grid');
  grid.innerHTML = '';
  for (let i = 1; i <= 11; i++) {
    const btn = document.createElement('button');
    btn.className = 'grade-btn';
    btn.textContent = `${i}`;
    btn.dataset.grade = i;
    btn.onclick = () => selectGrade(i);
    grid.appendChild(btn);
  }
}

function selectGrade(grade) {
  selectedGrade = grade;
  TG.haptic('light');
  highlightGrade(grade);
}

function highlightGrade(grade) {
  document.querySelectorAll('.grade-btn').forEach(b => {
    b.classList.toggle('selected', parseInt(b.dataset.grade) === grade);
  });
}

function saveStudentInfo() {
  const name = document.getElementById('input-name').value.trim();
  if (!name)          { showToast('Iltimos, ismingizni kiriting!'); return; }
  if (!selectedGrade) { showToast('Iltimos, sinfingizni tanlang!'); return; }

  State.student = { ...State.student, name, grade: selectedGrade };
  State.save();
  TG.haptic('medium');
  showToast(`Xush kelibsiz, ${name}! 🎉`);
  showSubjectList();
}

function resetStudent() {
  showSetupForm();
}

async function showSubjectList() {
  document.getElementById('setup-form').style.display = 'none';
  document.getElementById('subject-list').style.display = 'block';

  const { name, grade } = State.student;
  document.getElementById('student-info-text').textContent = `${name} · ${grade}-sinf`;
  document.getElementById('grade-subjects-label').textContent = `${grade}-sinf fanlari`;

  const grid = document.getElementById('subjects-grid');
  grid.innerHTML = `<div style="text-align:center;padding:20px;color:#81765f;">Yuklanmoqda...</div>`;

  let subjects = await Api.getSubjects(grade);
  if (!subjects || subjects.length === 0)
    subjects = await MOCK.getSubjects(grade);

  grid.innerHTML = '';
  subjects.forEach(sub => {
    const style = getSubjectStyle(sub.name);
    const card = document.createElement('div');
    card.className = 'bg-surface-container-lowest p-4 rounded-xl shadow-sm border border-outline-variant/20 flex items-center justify-between group cursor-pointer active:scale-[0.98] transition-transform';
    card.innerHTML = `
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-lg flex items-center justify-center shadow-sm flex-shrink-0"
          style="background:${style.bg};">
          <span class="material-symbols-outlined" style="color:${style.text};font-size:22px;">${style.icon}</span>
        </div>
        <div>
          <h3 class="text-body-lg font-bold text-on-surface">${sub.name}</h3>
          <p class="text-label-sm text-on-secondary-container">${grade}-sinf dasturi</p>
        </div>
      </div>
      <span class="material-symbols-outlined text-outline" style="font-size:20px;">chevron_right</span>`;
    card.onclick = () => openSubject(sub);
    grid.appendChild(card);
  });
}

function openSubject(subject) {
  TG.haptic('light');
  State.currentSubject = subject;
  State.save();
  navigateTo('chat');
  initChatScreen(subject);
}
