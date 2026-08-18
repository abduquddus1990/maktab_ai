// AI CHAT SCREEN — Gemini powered
let chatHistory = [];
let testState = null;

function initChatScreen(subject) {
  const sub = subject || State.currentSubject;
  if (!sub) return;

  document.getElementById('chat-subject-name').textContent = sub.name;
  document.getElementById('chat-grade-label').textContent  = `${State.student.grade}-sinf`;

  // Fan o'zgarsa chatni tozala
  if (!subject && State.currentSubject?.id === sub?.id) return;

  chatHistory = [];
  const area = document.getElementById('messages-area');
  area.innerHTML = `
    <div class="flex flex-col items-start max-w-[85%] msg-animate">
      <div class="flex items-center gap-2 mb-1">
        <div class="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center">
          <span class="material-symbols-outlined text-on-primary-container"
            style="font-size:14px;font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">smart_toy</span>
        </div>
        <span class="text-label-sm text-on-surface-variant">MAKTAB AI</span>
      </div>
      <div class="bg-surface-container-lowest shadow-sm rounded-tr-2xl rounded-br-2xl rounded-bl-2xl p-4 border border-surface-container">
        <p class="text-body-md text-on-surface">
          Salom, <strong>${State.student.name || 'o\'quvchi'}</strong>! 👋<br>
          <strong>${sub.name}</strong> fanidan savolingizni bering, men tushuntirib beraman! 😊
        </p>
      </div>
    </div>`;

  document.getElementById('test-area').style.display = 'none';
  area.style.display = 'flex';
  testState = null;

  document.getElementById('test-btn').textContent = '📝 Test';
  document.getElementById('test-btn').onclick = startTest;

  State.currentSubject = sub;
  State.save();
}

function handleEnter(e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}

function autoResize(el) {
  el.style.height = 'auto';
  el.style.height = Math.min(el.scrollHeight, 100) + 'px';
}

async function sendMessage() {
  const input = document.getElementById('chat-input');
  const text  = input.value.trim();
  if (!text || !State.currentSubject) return;

  input.value = '';
  input.style.height = 'auto';
  TG.haptic('light');

  appendUserMessage(text);
  chatHistory.push({ role: 'user', content: text });

  const typing = appendTyping();

  const { name, grade } = State.student;
  const subject = State.currentSubject;

  // Gemini ga savol yuborish
  let answer = await Gemini.chat(grade, subject.name, name, text, chatHistory);

  // Gemini ishlamasa mock javob
  if (!answer) {
    const mock = await MOCK.chat(text, grade, subject.name, name);
    answer = mock?.answer || 'Kechirasiz, javob olishda xato bo\'ldi. Qayta urinib ko\'ring.';
  }

  removeTyping(typing);
  appendAiMessage(answer);
  chatHistory.push({ role: 'assistant', content: answer });

  const area = document.getElementById('messages-area');
  area.scrollTop = area.scrollHeight;
}

function appendUserMessage(text) {
  const area = document.getElementById('messages-area');
  const div  = document.createElement('div');
  div.className = 'flex flex-col items-end self-end max-w-[85%] msg-animate';
  div.innerHTML = `
    <div class="bg-primary-container shadow-sm rounded-tl-2xl rounded-bl-2xl rounded-br-2xl p-4">
      <p class="text-body-md text-on-primary-container">${escapeHtml(text)}</p>
    </div>`;
  area.appendChild(div);
  area.scrollTop = area.scrollHeight;
}

function appendAiMessage(text) {
  const area = document.getElementById('messages-area');
  const div  = document.createElement('div');
  div.className = 'flex flex-col items-start max-w-[85%] msg-animate';

  const formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br>');

  div.innerHTML = `
    <div class="flex items-center gap-2 mb-1">
      <div class="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center">
        <span class="material-symbols-outlined text-on-primary-container"
          style="font-size:14px;font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">smart_toy</span>
      </div>
      <span class="text-label-sm text-on-surface-variant">MAKTAB AI</span>
    </div>
    <div class="bg-surface-container-lowest shadow-sm rounded-tr-2xl rounded-br-2xl rounded-bl-2xl p-4 border border-surface-container">
      <p class="text-body-md text-on-surface">${formatted}</p>
    </div>`;
  area.appendChild(div);
}

function appendTyping() {
  const area = document.getElementById('messages-area');
  const div  = document.createElement('div');
  div.className = 'flex flex-col items-start max-w-[85%] msg-animate';
  div.id = 'typing-indicator';
  div.innerHTML = `
    <div class="flex items-center gap-2 mb-1">
      <div class="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center">
        <span class="material-symbols-outlined text-on-primary-container"
          style="font-size:14px;font-variation-settings:'FILL' 1,'wght' 400,'GRAD' 0,'opsz' 24;">smart_toy</span>
      </div>
      <span class="text-label-sm text-on-surface-variant">MAKTAB AI yozmoqda...</span>
    </div>
    <div class="bg-surface-container-lowest shadow-sm rounded-tr-2xl rounded-br-2xl rounded-bl-2xl p-4 border border-surface-container flex gap-1 items-center">
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
      <div class="typing-dot"></div>
    </div>`;
  area.appendChild(div);
  area.scrollTop = area.scrollHeight;
  return div;
}

function removeTyping(el) { el?.remove(); }

function escapeHtml(t) {
  return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

// ===== TEST MODE =====
async function startTest() {
  if (!State.currentSubject) return;
  TG.haptic('medium');

  const overlay = document.getElementById('loading-overlay');
  overlay.style.display = 'flex';

  const { grade } = State.student;
  const subject   = State.currentSubject;

  // Gemini dan test olish
  let data = await Gemini.generateTest(grade, subject.name);

  // Gemini ishlamasa mock
  if (!data?.questions?.length) {
    data = await MOCK.getTestQuestions(grade, subject.name);
  }

  overlay.style.display = 'none';

  if (!data?.questions?.length) { showToast('Test yuklanmadi!'); return; }

  testState = { questions: data.questions, current: 0, score: 0 };

  document.getElementById('messages-area').style.display = 'none';
  document.getElementById('test-area').style.display = 'block';
  document.getElementById('test-btn').textContent = '❌ Tugatish';
  document.getElementById('test-btn').onclick = endTest;

  renderTestQuestion();
}

function renderTestQuestion() {
  const { questions, current } = testState;
  if (current >= questions.length) { finishTest(); return; }

  const q = questions[current];
  document.getElementById('test-progress').textContent = `${current + 1}/${questions.length}`;
  document.getElementById('test-question').textContent = q.q;

  const opts   = document.getElementById('test-options');
  opts.innerHTML = '';
  const labels = ['A', 'B', 'C', 'D'];

  q.options.forEach((opt, i) => {
    const btn = document.createElement('button');
    btn.className = 'test-option';
    btn.textContent = `${labels[i]}) ${opt}`;
    btn.onclick = () => answerTest(i, q.correct, opts);
    opts.appendChild(btn);
  });
}

function answerTest(chosen, correct, opts) {
  TG.haptic(chosen === correct ? 'medium' : 'heavy');
  opts.querySelectorAll('.test-option').forEach((b, i) => {
    b.disabled = true;
    if (i === correct) b.classList.add('correct');
    if (i === chosen && chosen !== correct) b.classList.add('wrong');
  });

  if (chosen === correct) testState.score++;

  setTimeout(() => {
    testState.current++;
    renderTestQuestion();
  }, 900);
}

function finishTest() {
  const { score, questions } = testState;
  const percent = Math.round((score / questions.length) * 100);
  const emoji   = percent >= 80 ? '🏆' : percent >= 60 ? '👍' : '💪';

  document.getElementById('test-area').innerHTML = `
    <div style="text-align:center;padding:16px;">
      <div style="font-size:52px;margin-bottom:10px;">${emoji}</div>
      <div style="font-size:22px;font-weight:800;color:#201b10;margin-bottom:6px;">
        ${score}/${questions.length} to'g'ri
      </div>
      <div style="font-size:14px;color:#636262;margin-bottom:16px;">
        ${percent}% natija — ${percent >= 80 ? "A'lo!" : percent >= 60 ? 'Yaxshi!' : 'Yana harakat qiling!'}
      </div>
      <button onclick="endTest()"
        class="w-full bg-primary-container text-[#241a00] rounded-2xl font-bold active:scale-[0.97] transition-transform"
        style="height:48px;font-size:15px;">
        Davom etish
      </button>
    </div>`;
}

function endTest() {
  testState = null;
  document.getElementById('messages-area').style.display = 'flex';
  document.getElementById('test-area').style.display = 'none';
  document.getElementById('test-btn').textContent = '📝 Test';
  document.getElementById('test-btn').onclick = startTest;
}
