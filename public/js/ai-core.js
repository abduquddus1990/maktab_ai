/* Maktab AI — universal AI chat core (matn + rasm + kamera)
   Ikkala sahifa (AI Repetitor, Ixtiro) shu moduldan foydalanadi. */
(function () {
  const MAX_DIM = 1600;
  const JPEG_QUALITY = 0.85;

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function escUser(s) {
    return esc(s).replace(/\n/g, '<br>');
  }

  function renderMarkdown(raw) {
    let s = esc(raw || '');

    const codeBlocks = [];
    s = s.replace(/```([\s\S]*?)```/g, (_, code) => {
      codeBlocks.push(code.trim());
      return `%%CODEBLOCK${codeBlocks.length - 1}%%`;
    });

    s = s.replace(/`([^`]+)`/g, '<code style="background:#f0eeff;padding:2px 6px;border-radius:4px;font-size:13px;color:#4b3bff;font-family:monospace">$1</code>');
    s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
    s = s.replace(/^### (.*)$/gm, '<strong style="display:block;margin:6px 0;font-size:15px">$1</strong>');
    s = s.replace(/^## (.*)$/gm, '<strong style="display:block;margin:8px 0;font-size:16px">$1</strong>');
    s = s.replace(/^# (.*)$/gm, '<strong style="display:block;margin:8px 0;font-size:17px">$1</strong>');

    const lines = s.split('\n');
    const out = [];
    let listBuffer = [];
    let listType = null;
    function flushList() {
      if (!listBuffer.length) return;
      const tag = listType === 'ol' ? 'ol' : 'ul';
      out.push(`<${tag} style="margin:6px 0;padding-left:20px">${listBuffer.map((li) => `<li style="margin-bottom:4px">${li}</li>`).join('')}</${tag}>`);
      listBuffer = [];
      listType = null;
    }
    for (const line of lines) {
      const ulMatch = line.match(/^\s*[-*]\s+(.*)$/);
      const olMatch = line.match(/^\s*\d+\.\s+(.*)$/);
      if (ulMatch) {
        if (listType && listType !== 'ul') flushList();
        listType = 'ul';
        listBuffer.push(ulMatch[1]);
      } else if (olMatch) {
        if (listType && listType !== 'ol') flushList();
        listType = 'ol';
        listBuffer.push(olMatch[1]);
      } else {
        flushList();
        out.push(line);
      }
    }
    flushList();
    s = out.join('\n').replace(/\n/g, '<br>');
    s = s.replace(/%%CODEBLOCK(\d+)%%/g, (_, i) => `<pre style="background:#12183b;color:#e2e8f0;padding:12px 14px;border-radius:10px;overflow-x:auto;font-size:13px;margin:8px 0"><code>${codeBlocks[Number(i)]}</code></pre>`);
    return s;
  }

  function compressImage(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          let { width, height } = img;
          if (width > MAX_DIM || height > MAX_DIM) {
            const scale = MAX_DIM / Math.max(width, height);
            width = Math.round(width * scale);
            height = Math.round(height * scale);
          }
          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          canvas.getContext('2d').drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', JPEG_QUALITY);
          resolve({ dataUrl, mediaType: 'image/jpeg', data: dataUrl.split(',')[1] });
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  window.AICore = {
    init(opts) {
      const msgs = document.getElementById('msgs');
      const tinput = document.getElementById('tinput');
      const chipsRow = document.getElementById('chips-row');
      const fileInput = document.getElementById('file-input');
      const cameraInput = document.getElementById('camera-input');
      const attachBtn = document.getElementById('attach-btn');
      const cameraBtn = document.getElementById('camera-btn');
      const previewRow = document.getElementById('img-preview-row');
      const aiLabel = opts.aiLabel || 'AI';

      let pending = [];
      let history = [];
      let logSession = null;

      function logInteraction(text, flagged) {
        if (!window.AILog) return;
        const extra = opts.getExtraBody ? opts.getExtraBody() : {};
        if (!logSession) {
          logSession = {
            id: AILog.uid(),
            studentId: AILog.getCurrentStudentId(),
            type: opts.logType || 'repetitor',
            subject: extra.subject || (opts.logType === 'ixtiro' ? 'Ixtiro' : null),
            grade: extra.grade || null,
            topicSummary: (text || '').trim().slice(0, 80) || (opts.logType === 'ixtiro' ? "Ixtiro g'oyasi" : 'Savol'),
            messageCount: 0,
            startedAt: Date.now(),
            flagged: false,
            flaggedQuestion: undefined,
            createdAt: new Date().toISOString(),
          };
        }
        logSession.messageCount += 1;
        logSession.durationSec = Math.round((Date.now() - logSession.startedAt) / 1000);
        if (flagged) {
          logSession.flagged = true;
          if (!logSession.flaggedQuestion) logSession.flaggedQuestion = text;
        }
        AILog.upsert(Object.assign({}, logSession));
      }

      function addWelcome() {
        appendAI(typeof opts.welcome === 'function' ? opts.welcome() : opts.welcome);
      }

      function renderPreview() {
        if (!previewRow) return;
        if (!pending.length) {
          previewRow.style.display = 'none';
          previewRow.innerHTML = '';
          return;
        }
        previewRow.style.display = 'flex';
        previewRow.innerHTML = pending
          .map((img, i) => `
            <div class="img-thumb">
              <img src="${img.dataUrl}" alt="rasm">
              <div class="rm" data-i="${i}">✕</div>
            </div>`)
          .join('');
        previewRow.querySelectorAll('.rm').forEach((el) => {
          el.addEventListener('click', () => {
            pending.splice(Number(el.dataset.i), 1);
            renderPreview();
          });
        });
      }

      async function handleFiles(fileList) {
        for (const file of Array.from(fileList || [])) {
          if (!file.type.startsWith('image/')) continue;
          try {
            pending.push(await compressImage(file));
          } catch (e) {
            console.error('Rasm o\'qishda xato:', e);
          }
        }
        renderPreview();
      }

      attachBtn?.addEventListener('click', () => fileInput?.click());
      cameraBtn?.addEventListener('click', () => cameraInput?.click());
      fileInput?.addEventListener('change', (e) => { handleFiles(e.target.files); e.target.value = ''; });
      cameraInput?.addEventListener('change', (e) => { handleFiles(e.target.files); e.target.value = ''; });

      function appendMe(text, imgs) {
        const wrap = document.createElement('div');
        const thumbsHtml = imgs && imgs.length
          ? `<div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:flex-end;${text ? 'margin-bottom:8px' : ''}">${imgs.map((i) => `<img src="${i.dataUrl}" style="width:72px;height:72px;object-fit:cover;border-radius:10px">`).join('')}</div>`
          : '';
        wrap.innerHTML = `
          <div class="msg-label-me">Siz</div>
          <div class="msg-row-me msg-in">
            <div class="bub-me">${thumbsHtml}${text ? escUser(text) : ''}</div>
          </div>`;
        msgs.appendChild(wrap);
        scrollBottom();
      }

      function appendAI(text) {
        const wrap = document.createElement('div');
        wrap.innerHTML = `
          <div class="msg-label">${aiLabel}</div>
          <div class="msg-row-ai msg-in">
            <div class="ai-avatar"><span class="ms">smart_toy</span></div>
            <div class="bub-ai">${renderMarkdown(text)}</div>
          </div>`;
        msgs.appendChild(wrap);
        scrollBottom();
        return wrap;
      }

      function appendTyping() {
        const wrap = document.createElement('div');
        wrap.innerHTML = `
          <div class="msg-label">${aiLabel}</div>
          <div class="msg-row-ai msg-in">
            <div class="ai-avatar"><span class="ms">smart_toy</span></div>
            <div class="typing-bub"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div>
          </div>`;
        msgs.appendChild(wrap);
        scrollBottom();
        return wrap;
      }

      function scrollBottom() {
        msgs.scrollTop = msgs.scrollHeight;
      }

      async function sendMessage(text) {
        const imgsForSend = pending.slice();
        appendMe(text, imgsForSend);
        pending = [];
        renderPreview();
        const typing = appendTyping();

        try {
          const body = Object.assign(
            {
              message: text,
              images: imgsForSend.map((i) => ({ media_type: i.mediaType, data: i.data })),
              history,
            },
            opts.getExtraBody ? opts.getExtraBody() : {},
          );

          const res = await fetch(opts.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });
          const data = await res.json();
          typing.remove();
          const reply = data.reply || 'Kechirasiz, javob kelmadi.';
          appendAI(reply);
          history.push({ role: 'user', content: text || '(rasm yubordi)' });
          history.push({ role: 'assistant', content: reply });
          logInteraction(text, !!data.flagged);
        } catch {
          typing.remove();
          appendAI('Kechirasiz, xato yuz berdi. Internet aloqangizni tekshiring va qayta urinib ko\'ring. 🔄');
        }
      }

      window.newChat = function () {
        msgs.innerHTML = '';
        history = [];
        pending = [];
        logSession = null;
        renderPreview();
        addWelcome();
        if (tinput) { tinput.value = ''; tinput.style.height = ''; }
        if (chipsRow) chipsRow.style.display = 'flex';
      };

      window.autoResize = function (ta) {
        ta.style.height = 'auto';
        ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
      };

      window.onKey = function (e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); }
      };

      window.sendChip = function (t) {
        if (chipsRow) chipsRow.style.display = 'none';
        sendMessage(t.replace(/^[\p{Emoji}\s]+/u, '').trim() || t);
      };

      window.doSend = function () {
        const text = tinput?.value?.trim() || '';
        if (!text && !pending.length) return;
        if (chipsRow) chipsRow.style.display = 'none';
        if (tinput) { tinput.value = ''; tinput.style.height = ''; }
        sendMessage(text);
      };

      addWelcome();

      return { sendMessage, addWelcome };
    },
  };
})();
