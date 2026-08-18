/* Maktab AI — O'zbekiston SVG xaritasi */
(function () {
  const container = document.getElementById('map-container');
  if (!container) return;

  fetch('/js/uz-regions-data.json')
    .then(r => r.json())
    .then(buildMap)
    .catch(console.error);

  function buildMap(REGIONS) {
    const maxU = Math.max(...REGIONS.map(r => r.users));
    const minU = Math.min(...REGIONS.map(r => r.users));
    const sorted = [...REGIONS].sort((a, b) => b.users - a.users);
    const top3Names = new Set(sorted.slice(0, 3).map(r => r.name));
    const reduced = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

    function lerp(t) {
      const r = Math.round(232 + (75 - 232) * t);
      const g = Math.round(233 + (59 - 233) * t);
      const b = Math.round(255 + (255 - 255) * t);
      return `rgb(${r},${g},${b})`;
    }

    /* wrapper */
    container.style.position = 'relative';

    /* SVG */
    const NS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 1000 620');
    svg.style.cssText = [
      'width:100%;height:auto;display:block;',
      reduced ? '' : 'transform:perspective(900px) rotateX(8deg);',
      'filter:drop-shadow(0 24px 40px rgba(75,59,255,.12));',
      'transition:transform .4s;'
    ].join('');

    /* tooltip */
    const tip = document.createElement('div');
    tip.style.cssText = 'position:absolute;background:#12183b;color:#fff;padding:8px 14px;border-radius:10px;font-size:13px;font-weight:600;pointer-events:none;opacity:0;transition:opacity .15s;z-index:10;white-space:nowrap;font-family:Inter,sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.2)';
    container.appendChild(tip);

    REGIONS.forEach(region => {
      const t = maxU === minU ? 0.5 : (region.users - minU) / (maxU - minU);
      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', region.path);
      path.setAttribute('fill', lerp(t));
      path.setAttribute('stroke', '#fff');
      path.setAttribute('stroke-width', '1.5');
      path.setAttribute('stroke-linejoin', 'round');
      path.style.cssText = 'cursor:pointer;transition:filter .18s;';

      path.addEventListener('mouseenter', e => {
        path.style.filter = 'brightness(1.18) saturate(1.2)';
        tip.textContent = `${region.name}: ${region.users.toLocaleString()} o'quvchi`;
        tip.style.opacity = '1';
      });
      path.addEventListener('mousemove', e => {
        const rc = container.getBoundingClientRect();
        tip.style.left = (e.clientX - rc.left + 12) + 'px';
        tip.style.top = (e.clientY - rc.top - 42) + 'px';
      });
      path.addEventListener('mouseleave', () => {
        path.style.filter = '';
        tip.style.opacity = '0';
      });
      svg.appendChild(path);

      /* pulsating dot for top-3 */
      if (top3Names.has(region.name)) {
        const g = document.createElementNS(NS, 'g');

        const outer = document.createElementNS(NS, 'circle');
        outer.setAttribute('cx', region.cx);
        outer.setAttribute('cy', region.cy);
        outer.setAttribute('r', '10');
        outer.setAttribute('fill', '#fec700');
        outer.setAttribute('opacity', '0.35');

        if (!reduced) {
          const anim = document.createElementNS(NS, 'animate');
          anim.setAttribute('attributeName', 'r');
          anim.setAttribute('values', '7;16;7');
          anim.setAttribute('dur', '2.2s');
          anim.setAttribute('repeatCount', 'indefinite');
          outer.appendChild(anim);
          const anim2 = document.createElementNS(NS, 'animate');
          anim2.setAttribute('attributeName', 'opacity');
          anim2.setAttribute('values', '0.4;0;0.4');
          anim2.setAttribute('dur', '2.2s');
          anim2.setAttribute('repeatCount', 'indefinite');
          outer.appendChild(anim2);
        }

        const inner = document.createElementNS(NS, 'circle');
        inner.setAttribute('cx', region.cx);
        inner.setAttribute('cy', region.cy);
        inner.setAttribute('r', '5');
        inner.setAttribute('fill', '#fec700');

        g.appendChild(outer);
        g.appendChild(inner);
        svg.appendChild(g);
      }
    });

    container.insertBefore(svg, tip);

    /* ─── Sidebar ranking ─── */
    const rankEl = document.getElementById('map-ranking');
    if (rankEl) {
      sorted.slice(0, 5).forEach((r, i) => {
        const pct = Math.round((r.users / maxU) * 100);
        const div = document.createElement('div');
        div.style.marginBottom = '14px';
        div.innerHTML = `
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:5px">
            <span style="font-family:Montserrat,sans-serif;font-weight:800;color:#4b3bff;width:18px;font-size:14px">${i + 1}</span>
            <span style="flex:1;font-size:13px;font-weight:600;color:#12183b">${r.name}</span>
            <span style="font-size:13px;font-weight:700;color:#464557">${r.users.toLocaleString()}</span>
          </div>
          <div style="height:5px;background:#E7E9F4;border-radius:999px;margin-left:28px">
            <div style="height:5px;background:#4b3bff;border-radius:999px;width:${pct}%;transition:width .8s .3s"></div>
          </div>`;
        rankEl.appendChild(div);
      });
    }

    /* ─── Total count-up ─── */
    const totalEl = document.getElementById('map-total');
    if (totalEl) {
      const total = REGIONS.reduce((s, r) => s + r.users, 0);
      countUp(totalEl, total);
    }

    /* ─── Stats section count-ups ─── */
    const stats = [
      { id: 'stat-students', val: 51080 },
      { id: 'stat-teachers', val: 640 },
      { id: 'stat-lessons',  val: 128000 },
      { id: 'stat-regions',  val: 14 },
    ];
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          const el = e.target;
          const s = stats.find(s => s.id === el.id);
          if (s) countUp(el, s.val);
          io.unobserve(el);
        }
      });
    }, { threshold: 0.3 });
    stats.forEach(s => { const el = document.getElementById(s.id); if (el) io.observe(el); });
  }

  function countUp(el, end, dur = 1800) {
    if (window.matchMedia('(prefers-reduced-motion:reduce)').matches) {
      el.textContent = end.toLocaleString() + (end > 99 ? '+' : '');
      return;
    }
    const start = performance.now();
    function tick(now) {
      const p = Math.min((now - start) / dur, 1);
      const v = Math.floor(end * (1 - Math.pow(1 - p, 3)));
      el.textContent = v.toLocaleString() + (end > 99 && p >= 1 ? '+' : '');
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
})();
