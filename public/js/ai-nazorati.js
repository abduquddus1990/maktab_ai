/* Maktab AI — Ota-ona paneli: "AI nazorati" bo'limi.
   AILog (ai-log.js) dagi loglar asosida farzandning AI Repetitor va Ixtiro
   mentoridan foydalanishini ko'rsatadi. Bola tanlash tugmalari (#child-btns
   ichidagi .child-btn, data-child-id bilan) orqali qayta chiziladi. */
(function () {
  const SUBJECT_COLORS = {
    Matematika: '#4b3bff', Fizika: '#0ea5e9', Kimyo: '#f97316', Biologiya: '#ec4899',
    "Ingliz tili": '#22c55e', "Ona tili": '#fec700', Geografiya: '#8b5cf6',
    Ixtiro: '#06b6d4', Umumiy: '#c7c4da',
  };
  const DAY_LABELS = ['Ya', 'Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh']; // getDay(): 0=Yakshanba

  function subjColor(s) { return SUBJECT_COLORS[s] || '#8b98b8'; }

  function fmtDuration(sec) {
    const m = Math.round(sec / 60);
    if (m < 60) return `${m} daq`;
    const h = Math.floor(m / 60), mm = m % 60;
    return mm ? `${h} soat ${mm} daq` : `${h} soat`;
  }

  function timeAgo(iso) {
    const diffMs = Date.now() - new Date(iso).getTime();
    const min = Math.floor(diffMs / 60000);
    if (min < 1) return 'hozirgina';
    if (min < 60) return `${min} daqiqa oldin`;
    const hr = Math.floor(min / 60);
    if (hr < 24) return `${hr} soat oldin`;
    const day = Math.floor(hr / 24);
    return day === 1 ? 'kecha' : `${day} kun oldin`;
  }

  function pad2(n) { return String(n).padStart(2, '0'); }

  function dayLabel(iso) {
    const d = new Date(iso);
    const today = new Date();
    const hm = `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
    if (d.toDateString() === today.toDateString()) return `bugun ${hm}`;
    const y = new Date(today); y.setDate(y.getDate() - 1);
    if (d.toDateString() === y.toDateString()) return `kecha ${hm}`;
    return `${d.getDate()}.${pad2(d.getMonth() + 1)} ${hm}`;
  }

  function isNightHour(iso, settings) {
    const h = new Date(iso).getHours();
    const ns = Number(settings.nightStart.split(':')[0]);
    const ne = Number(settings.nightEnd.split(':')[0]);
    return ns > ne ? (h >= ns || h < ne) : (h >= ns && h < ne);
  }

  function subjectIcon(subject, type) {
    if (type === 'ixtiro') return '💡';
    const icons = {
      Matematika: '📐', Fizika: '⚡', Kimyo: '🧪', Biologiya: '🧬',
      "Ingliz tili": '🇬🇧', "Ona tili": '📝', Geografiya: '🌍',
    };
    return icons[subject] || '📚';
  }

  let activeChildId = null;

  function getActiveChildId() {
    const D = window.DASHBOARD_DATA;
    const first = D && D.farzandlar && D.farzandlar[0];
    return activeChildId || (first ? first.id : 1);
  }

  /* ── render pieces ── */
  function renderStatus(logs) {
    const dot = document.getElementById('ai-online-dot');
    const text = document.getElementById('ai-online-text');
    if (!dot || !text) return;
    if (!logs.length) {
      dot.style.background = '#c7c4da';
      text.textContent = "Hali AI'dan foydalanmagan";
      return;
    }
    const last = logs[0];
    const diffMin = (Date.now() - new Date(last.createdAt).getTime()) / 60000;
    if (diffMin < 5) {
      dot.style.background = '#22c55e';
      text.textContent = 'Hozir onlayn';
    } else {
      dot.style.background = '#c7c4da';
      text.textContent = `Oxirgi faollik: ${timeAgo(last.createdAt)}`;
    }
  }

  function renderMetrics(logs) {
    const grid = document.getElementById('ai-metric-grid');
    if (!grid) return;
    const today = new Date();
    const todayLogs = logs.filter((l) => new Date(l.createdAt).toDateString() === today.toDateString());
    const weekAgo = Date.now() - 7 * 86400000;
    const weekLogs = logs.filter((l) => new Date(l.createdAt).getTime() >= weekAgo);
    const weekSec = weekLogs.reduce((s, l) => s + (l.durationSec || 0), 0);

    const bySubject = {};
    logs.filter((l) => l.type === 'repetitor').forEach((l) => {
      const s = l.subject || 'Umumiy';
      bySubject[s] = (bySubject[s] || 0) + 1;
    });
    const topEntry = Object.entries(bySubject).sort((a, b) => b[1] - a[1])[0];
    const ixtiroCount = logs.filter((l) => l.type === 'ixtiro').length;
    const todayMsgs = todayLogs.reduce((s, l) => s + (l.messageCount || 0), 0);

    const metrics = [
      { icon: '💬', qiymat: todayLogs.length, yorliq: 'Bugun suhbatlar', trend: `${todayMsgs} xabar`, rang: '#4b3bff' },
      { icon: '⏱️', qiymat: fmtDuration(weekSec), yorliq: 'Bu hafta jami vaqt', trend: `${weekLogs.length} sessiya`, rang: '#0ea5e9' },
      { icon: '🏆', qiymat: topEntry ? topEntry[0] : '—', yorliq: 'Eng ko\'p fan', trend: topEntry ? `${topEntry[1]} marta so'ralgan` : '', rang: '#f97316' },
      { icon: '💡', qiymat: ixtiroCount, yorliq: 'Ixtiro loyihalari', trend: 'jami', rang: '#ec4899' },
    ];

    grid.innerHTML = metrics.map((m) => `
      <div class="card" style="padding:22px;transition:box-shadow .2s" onmouseover="this.style.boxShadow='0 8px 24px rgba(20,26,61,.1)'" onmouseout="this.style.boxShadow=''">
        <div style="font-size:28px;margin-bottom:10px">${m.icon}</div>
        <div class="mont" style="font-size:22px;font-weight:900;color:${m.rang};margin-bottom:4px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${m.qiymat}</div>
        <div style="font-size:13px;color:#464557;font-weight:500;margin-bottom:6px">${m.yorliq}</div>
        <div style="font-size:12px;color:#464557;font-weight:600;background:#f8f8fc;padding:3px 10px;border-radius:999px;display:inline-block">${m.trend}</div>
      </div>
    `).join('');
  }

  function renderDonut(logs) {
    const wrap = document.getElementById('ai-donut-wrap');
    if (!wrap) return;
    const bySubject = {};
    logs.filter((l) => l.type === 'repetitor').forEach((l) => {
      const s = l.subject || 'Umumiy';
      bySubject[s] = (bySubject[s] || 0) + 1;
    });
    const entries = Object.entries(bySubject).sort((a, b) => b[1] - a[1]);
    const total = entries.reduce((s, [, c]) => s + c, 0);

    if (!total) {
      wrap.innerHTML = '<div style="font-size:13px;color:#c7c4da;padding:20px 0">Hali ma\'lumot yo\'q</div>';
      return;
    }

    let acc = 0;
    const stops = entries.map(([subj, count]) => {
      const from = (acc / total) * 100;
      acc += count;
      const to = (acc / total) * 100;
      return `${subjColor(subj)} ${from}% ${to}%`;
    }).join(', ');

    wrap.innerHTML = `
      <div style="position:relative;width:140px;height:140px;flex-shrink:0">
        <div style="width:140px;height:140px;border-radius:50%;background:conic-gradient(${stops})"></div>
        <div style="position:absolute;inset:20px;background:#fff;border-radius:50%;display:flex;flex-direction:column;align-items:center;justify-content:center">
          <div class="mont" style="font-size:22px;font-weight:900;color:#12183b">${total}</div>
          <div style="font-size:10px;color:#464557;font-weight:600">so'rov</div>
        </div>
      </div>
      <div style="flex:1;min-width:160px;display:flex;flex-direction:column;gap:10px">
        ${entries.map(([subj, count]) => `
          <div style="display:flex;align-items:center;gap:8px">
            <span style="width:10px;height:10px;border-radius:3px;background:${subjColor(subj)};flex-shrink:0"></span>
            <span style="font-size:13px;color:#12183b;font-weight:600;flex:1">${subj}</span>
            <span class="mont" style="font-size:13px;font-weight:800;color:${subjColor(subj)}">${Math.round((count / total) * 100)}%</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  function renderWeekly(logs) {
    const chart = document.getElementById('ai-weekly-chart');
    const labels = document.getElementById('ai-weekly-labels');
    if (!chart || !labels) return;

    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d);
    }
    const perDay = days.map((d) => {
      const sec = logs
        .filter((l) => new Date(l.createdAt).toDateString() === d.toDateString())
        .reduce((s, l) => s + (l.durationSec || 0), 0);
      return { date: d, minutes: Math.round(sec / 60) };
    });
    const max = Math.max(1, ...perDay.map((p) => p.minutes));

    chart.innerHTML = perDay.map((p) => {
      const pct = Math.round((p.minutes / max) * 100);
      return `<div class="bar-col">
        <span style="font-size:11px;font-weight:700;color:#464557">${p.minutes}</span>
        <div class="bar" style="background:linear-gradient(180deg,#4b3bff,#7c5cbf);height:0" data-h="${pct}"></div>
      </div>`;
    }).join('');
    labels.innerHTML = perDay.map((p) =>
      `<div style="flex:1;text-align:center;font-size:11px;font-weight:600;color:#c7c4da">${DAY_LABELS[p.date.getDay()]}</div>`
    ).join('');
    requestAnimationFrame(() => {
      chart.querySelectorAll('.bar[data-h]').forEach((bar) => { bar.style.height = bar.dataset.h + '%'; });
    });
  }

  function renderHourly(logs) {
    const chart = document.getElementById('ai-hourly-chart');
    const labels = document.getElementById('ai-hourly-labels');
    if (!chart || !labels) return;

    const buckets = [
      { label: '00–06', from: 0, to: 6, night: true },
      { label: '06–12', from: 6, to: 12, night: false },
      { label: '12–18', from: 12, to: 18, night: false },
      { label: '18–24', from: 18, to: 24, night: false },
    ];
    buckets.forEach((b) => {
      b.count = logs.filter((l) => {
        const h = new Date(l.createdAt).getHours();
        return h >= b.from && h < b.to;
      }).length;
    });
    const max = Math.max(1, ...buckets.map((b) => b.count));

    chart.innerHTML = buckets.map((b) => {
      const pct = Math.round((b.count / max) * 100);
      const color = b.night ? 'linear-gradient(180deg,#ef4444,#f97316)' : 'linear-gradient(180deg,#4b3bff,#7c5cbf)';
      return `<div class="bar-col">
        <span style="font-size:11px;font-weight:700;color:#464557">${b.count}</span>
        <div class="bar" style="background:${color};height:0" data-h="${pct}"></div>
      </div>`;
    }).join('');
    labels.innerHTML = buckets.map((b) =>
      `<div style="flex:1;text-align:center;font-size:10px;font-weight:600;color:${b.night ? '#ef4444' : '#c7c4da'}">${b.label}</div>`
    ).join('');
    requestAnimationFrame(() => {
      chart.querySelectorAll('.bar[data-h]').forEach((bar) => { bar.style.height = bar.dataset.h + '%'; });
    });
  }

  function renderTopics(logs) {
    const el = document.getElementById('ai-topics-list');
    if (!el) return;
    const recent = logs.slice(0, 7);
    if (!recent.length) {
      el.innerHTML = '<div style="font-size:13px;color:#c7c4da;text-align:center;padding:16px">Hali suhbat yo\'q</div>';
      return;
    }
    el.innerHTML = recent.map((l, i) => `
      <div style="display:flex;align-items:center;gap:14px;padding:12px 0;${i < recent.length - 1 ? 'border-bottom:1px solid #E7E9F4' : ''}">
        <div style="width:38px;height:38px;border-radius:11px;background:${subjColor(l.type === 'ixtiro' ? 'Ixtiro' : (l.subject || 'Umumiy'))}15;display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <span style="font-size:18px">${subjectIcon(l.subject, l.type)}</span>
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:700;color:#12183b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${l.type === 'ixtiro' ? 'Ixtiro' : (l.subject || 'Umumiy')} · ${esc(l.topicSummary || '')}</div>
          <div style="font-size:12px;color:#464557;margin-top:2px">${dayLabel(l.createdAt)} · ${l.messageCount || 1} xabar</div>
        </div>
      </div>
    `).join('');
  }

  function renderIxtiroActivity(logs) {
    const el = document.getElementById('ai-ixtiro-list');
    if (!el) return;
    const items = logs.filter((l) => l.type === 'ixtiro').slice(0, 5);
    if (!items.length) {
      el.innerHTML = '<div style="font-size:13px;color:#c7c4da;text-align:center;padding:16px">Farzandingiz hali Ixtiro mentori bilan ishlamagan</div>';
      return;
    }
    el.innerHTML = items.map((l, i) => `
      <div style="display:flex;align-items:center;gap:14px;padding:12px 0;${i < items.length - 1 ? 'border-bottom:1px solid #E7E9F4' : ''}">
        <div style="width:38px;height:38px;border-radius:11px;background:#ecfeff;display:flex;align-items:center;justify-content:center;flex-shrink:0">
          <span style="font-size:18px">💡</span>
        </div>
        <div style="flex:1;min-width:0">
          <div style="font-size:13px;font-weight:700;color:#12183b">${esc(l.topicSummary || '')}</div>
          <div style="font-size:12px;color:#464557;margin-top:2px">${dayLabel(l.createdAt)} · ${l.messageCount || 1} xabar · ${fmtDuration(l.durationSec || 0)}</div>
        </div>
      </div>
    `).join('');
  }

  function renderAlerts(logs, settings) {
    const el = document.getElementById('ai-alerts-list');
    if (!el) return;
    const alerts = [];

    logs.filter((l) => l.flagged).forEach((l) => {
      alerts.push({
        type: 'red', time: l.createdAt,
        html: `<div style="font-size:13px;font-weight:700;color:#b91c1c">Nomaqbul savol bloklandi</div>
               <div style="font-size:12.5px;color:#464557;margin-top:3px">"${esc(l.flaggedQuestion || '')}"</div>
               <div style="font-size:11px;color:#c7c4da;margin-top:4px">${dayLabel(l.createdAt)}</div>`,
      });
    });

    if (settings.nightModeEnabled) {
      logs.filter((l) => isNightHour(l.createdAt, settings)).forEach((l) => {
        alerts.push({
          type: 'amber', time: l.createdAt,
          html: `<div style="font-size:13px;font-weight:700;color:#92400e">Tungi rejim buzildi</div>
                 <div style="font-size:12.5px;color:#464557;margin-top:3px">${l.type === 'ixtiro' ? 'Ixtiro' : (l.subject || 'Umumiy')} bo'yicha suhbat — ${dayLabel(l.createdAt)}</div>`,
        });
      });
    }

    const byDay = {};
    logs.forEach((l) => {
      const key = new Date(l.createdAt).toDateString();
      byDay[key] = (byDay[key] || 0) + (l.durationSec || 0);
    });
    const limitSec = (settings.dailyLimitMin || 120) * 60;
    Object.entries(byDay).forEach(([key, sec]) => {
      if (sec > limitSec) {
        alerts.push({
          type: 'amber', time: new Date(key).toISOString(),
          html: `<div style="font-size:13px;font-weight:700;color:#92400e">Kunlik chegaradan oshdi</div>
                 <div style="font-size:12.5px;color:#464557;margin-top:3px">${new Date(key).toLocaleDateString('uz-UZ')} — ${fmtDuration(sec)} (chegara: ${fmtDuration(limitSec)})</div>`,
        });
      }
    });

    alerts.sort((a, b) => new Date(b.time) - new Date(a.time));

    if (!alerts.length) {
      el.innerHTML = `<div style="display:flex;align-items:center;gap:10px;padding:16px;color:#22c55e;font-size:13px;font-weight:600">
        <span class="ms">check_circle</span> Ogohlantirish yo'q — hammasi joyida
      </div>`;
      return;
    }

    el.innerHTML = alerts.slice(0, 6).map((a) => `
      <div class="alert-item ${a.type}">
        <span class="ms" style="font-size:20px;color:${a.type === 'red' ? '#ef4444' : '#f59e0b'};flex-shrink:0">${a.type === 'red' ? 'error' : 'warning'}</span>
        <div style="flex:1;min-width:0">${a.html}</div>
      </div>
    `).join('');
  }

  function renderSettingsForm(settings) {
    const limitEl = document.getElementById('ai-daily-limit');
    const toggleEl = document.getElementById('ai-night-toggle');
    const startEl = document.getElementById('ai-night-start');
    const endEl = document.getElementById('ai-night-end');
    if (limitEl) limitEl.value = settings.dailyLimitMin;
    if (toggleEl) toggleEl.checked = settings.nightModeEnabled;
    if (startEl) startEl.value = settings.nightStart;
    if (endEl) endEl.value = settings.nightEnd;
  }

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function renderAINazorati(childId) {
    activeChildId = childId;
    const settings = AILog.getSettings(childId);
    const logs = AILog.getByStudent(childId).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    renderStatus(logs);
    renderMetrics(logs);
    renderDonut(logs);
    renderWeekly(logs);
    renderHourly(logs);
    renderTopics(logs);
    renderAlerts(logs, settings);
    renderIxtiroActivity(logs);
    renderSettingsForm(settings);
  }

  window.toggleAISettings = function () {
    const panel = document.getElementById('ai-settings-panel');
    if (panel) panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
  };

  window.saveAISettings = function () {
    const childId = getActiveChildId();
    const limitEl = document.getElementById('ai-daily-limit');
    const toggleEl = document.getElementById('ai-night-toggle');
    const startEl = document.getElementById('ai-night-start');
    const endEl = document.getElementById('ai-night-end');
    AILog.setSettings(childId, {
      dailyLimitMin: Number(limitEl?.value) || 120,
      nightModeEnabled: !!toggleEl?.checked,
      nightStart: startEl?.value || '22:00',
      nightEnd: endEl?.value || '06:00',
    });
    renderAINazorati(childId);
    const saved = document.getElementById('ai-settings-saved');
    if (saved) {
      saved.style.display = 'inline';
      setTimeout(() => { saved.style.display = 'none'; }, 2000);
    }
  };

  /* child selector — delegated listener, independent of the page's own inline script state */
  const childBtnsWrap = document.getElementById('child-btns');
  if (childBtnsWrap) {
    childBtnsWrap.addEventListener('click', (e) => {
      const btn = e.target.closest('.child-btn');
      if (!btn || !btn.dataset.childId) return;
      renderAINazorati(btn.dataset.childId);
    });
  }

  renderAINazorati(getActiveChildId());
})();
