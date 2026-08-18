/* Maktab AI — shared nav + footer + auth state */
(function () {

  /* ─── auth helpers ─── */
  function getUser() {
    try {
      return JSON.parse(localStorage.getItem('maktabai_currentUser')) ||
             JSON.parse(localStorage.getItem('maktab_user')) || null;
    } catch { return null; }
  }

  function logout() {
    localStorage.removeItem('maktabai_currentUser');
    localStorage.removeItem('maktab_user');
    location.href = '/index.html';
  }

  /* ─── NAV HTML ─── */
  function buildNav() {
    const user = getUser();

    const authHTML = user
      ? `<div style="position:relative" id="_avatarwrap">
           <div style="display:flex;align-items:center;gap:10px;cursor:pointer;padding:6px 12px;border-radius:10px;transition:background .15s" id="_avatarbtn" onclick="window.__mktbDropdown()"
                onmouseover="this.style.background='#f4f3ff'" onmouseout="this.style.background=''">
             <div style="width:36px;height:36px;background:linear-gradient(135deg,#4b3bff,#7c5cbf);border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:Montserrat,sans-serif;font-weight:800;font-size:14px;color:#fff;flex-shrink:0">${(user.name?.[0]||'U').toUpperCase()}</div>
             <span style="font-size:14px;font-weight:600;color:#12183b;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${user.name}</span>
             <span style="font-family:'Material Symbols Outlined';font-size:18px;color:#464557">expand_more</span>
           </div>
           <div id="_dropdown" style="display:none;position:absolute;top:calc(100% + 8px);right:0;background:#fff;border:1px solid #E7E9F4;border-radius:14px;box-shadow:0 12px 30px rgba(20,26,61,.1);min-width:180px;overflow:hidden;z-index:300">
             <div style="padding:12px 16px;border-bottom:1px solid #E7E9F4">
               <div style="font-size:13px;font-weight:700;color:#12183b">${user.name}</div>
               <div style="font-size:12px;color:#464557;margin-top:2px;text-transform:capitalize">${_roleLabel(user.role)}</div>
             </div>
             <a href="${_roleHome(user.role)}" style="display:flex;align-items:center;gap:10px;padding:11px 16px;text-decoration:none;color:#12183b;font-size:14px;font-weight:500;transition:background .15s" onmouseover="this.style.background='#f4f3ff'" onmouseout="this.style.background=''">
               <span style="font-family:'Material Symbols Outlined';font-size:18px;color:#4b3bff">dashboard</span>Panel
             </a>
             <div onclick="window.__mktbLogout()" style="display:flex;align-items:center;gap:10px;padding:11px 16px;cursor:pointer;color:#ba1a1a;font-size:14px;font-weight:500;transition:background .15s" onmouseover="this.style.background='#fff4f4'" onmouseout="this.style.background=''">
               <span style="font-family:'Material Symbols Outlined';font-size:18px">logout</span>Chiqish
             </div>
           </div>
         </div>`
      : `<a href="/kirish.html" style="border:1.5px solid #c7c4da;background:#fff;color:#12183b;font-family:Montserrat,sans-serif;font-weight:700;font-size:14px;padding:9px 20px;border-radius:10px;cursor:pointer;transition:all .2s;white-space:nowrap;text-decoration:none;display:inline-flex;align-items:center" onmouseover="this.style.borderColor='#4b3bff';this.style.color='#4b3bff'" onmouseout="this.style.borderColor='#c7c4da';this.style.color='#12183b'">Kirish</a>
         <a href="/royxat.html" style="background:#4b3bff;color:#fff;font-family:Montserrat,sans-serif;font-weight:700;font-size:14px;padding:9px 20px;border-radius:10px;text-decoration:none;white-space:nowrap;transition:background .2s" onmouseover="this.style.background='#2f06e9'" onmouseout="this.style.background='#4b3bff'">Ro'yxatdan o'tish</a>`;

    const mobileAuthHTML = user
      ? `<div style="padding:12px 0;border-top:1px solid #E7E9F4">
           <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
             <div style="width:32px;height:32px;background:linear-gradient(135deg,#4b3bff,#7c5cbf);border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;color:#fff">${(user.name?.[0]||'U').toUpperCase()}</div>
             <div>
               <div style="font-weight:700;color:#12183b;font-size:14px">${user.name}</div>
               <div style="font-size:12px;color:#464557;text-transform:capitalize">${_roleLabel(user.role)}</div>
             </div>
           </div>
           <a href="${_roleHome(user.role)}" style="display:flex;align-items:center;gap:8px;padding:10px 0;color:#4b3bff;font-size:14px;font-weight:600;text-decoration:none;border-bottom:1px solid #E7E9F4">
             <span style="font-family:'Material Symbols Outlined';font-size:18px">dashboard</span>Paneliga o'tish
           </a>
           <div onclick="window.__mktbLogout()" style="display:flex;align-items:center;gap:8px;padding:10px 0;color:#ba1a1a;font-size:14px;font-weight:600;cursor:pointer">
             <span style="font-family:'Material Symbols Outlined';font-size:18px">logout</span>Chiqish
           </div>
         </div>`
      : `<div style="display:flex;flex-direction:column;gap:10px;padding-top:12px;border-top:1px solid #E7E9F4">
           <a href="/kirish.html" style="display:block;width:100%;padding:12px;border:1.5px solid #c7c4da;background:#fff;color:#12183b;font-family:Montserrat,sans-serif;font-weight:700;font-size:15px;border-radius:10px;text-decoration:none;text-align:center">Kirish</a>
           <a href="/royxat.html" style="display:block;width:100%;padding:12px;background:#4b3bff;color:#fff;font-family:Montserrat,sans-serif;font-weight:700;font-size:15px;border-radius:10px;text-decoration:none;text-align:center">Ro'yxatdan o'tish</a>
         </div>`;

    const cur = location.pathname.split('/').pop() || 'index.html';
    function lnk(href, label) {
      const active = href === cur || (cur === '' && href === 'index.html');
      return `<a href="/${href}" style="color:${active?'#4b3bff':'#464557'};text-decoration:none;font-size:15px;font-weight:${active?'700':'500'};padding:8px 14px;border-radius:8px;background:${active?'#f0eeff':'transparent'};transition:all .2s;white-space:nowrap" onmouseover="if(this.style.background!='#f0eeff')this.style.background='#f4f3ff';this.style.color='#4b3bff'" onmouseout="if('${href}'!='${cur}'){this.style.background='transparent';this.style.color='#464557';}">${label}</a>`;
    }

    return `<nav id="_nav" style="background:#fff;border-bottom:1px solid #E7E9F4;position:sticky;top:0;z-index:200;box-shadow:0 2px 20px rgba(20,26,61,.04)">
  <div style="max-width:1200px;margin:0 auto;padding:0 24px;height:72px;display:flex;align-items:center;gap:24px">
    <a href="/index.html" style="display:flex;align-items:center;gap:10px;text-decoration:none;flex-shrink:0">
      <img src="/logo.png" alt="Maktab AI" style="height:36px;object-fit:contain">
      <span style="font-family:Montserrat,sans-serif;font-weight:800;font-size:18px;color:#4b3bff">Maktab AI</span>
    </a>
    <div id="_nlinks" style="display:flex;gap:4px;flex:1;align-items:center">
      ${lnk('index.html','Bosh sahifa')}
      ${lnk('ixtiro.html','Ixtiro')}
      ${lnk('repetitorlar.html','Repetitorlar')}
      ${lnk('yangiliklar.html','Yangiliklar')}
      ${lnk('ota-ona-paneli.html','Ota-onalar')}
    </div>
    <div id="_nauth" style="display:flex;align-items:center;gap:10px;flex-shrink:0">${authHTML}</div>
    <button id="_nbtn" onclick="window.__mktbNavToggle()" style="display:none;background:none;border:none;cursor:pointer;padding:8px;color:#12183b;flex-shrink:0">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><rect y="4" width="24" height="2.5" rx="1.25"/><rect y="11" width="24" height="2.5" rx="1.25"/><rect y="18" width="24" height="2.5" rx="1.25"/></svg>
    </button>
  </div>
  <div id="_nmob" style="display:none;padding:12px 24px 16px;border-top:1px solid #E7E9F4;background:#fff">
    <a href="/index.html" style="display:block;padding:12px 0;color:#464557;text-decoration:none;font-size:16px;font-weight:500;border-bottom:1px solid #E7E9F4">Bosh sahifa</a>
    <a href="/ixtiro.html" style="display:block;padding:12px 0;color:#464557;text-decoration:none;font-size:16px;font-weight:500;border-bottom:1px solid #E7E9F4">Ixtiro</a>
    <a href="/repetitorlar.html" style="display:block;padding:12px 0;color:#464557;text-decoration:none;font-size:16px;font-weight:500;border-bottom:1px solid #E7E9F4">Repetitorlar</a>
    <a href="/yangiliklar.html" style="display:block;padding:12px 0;color:#464557;text-decoration:none;font-size:16px;font-weight:500;border-bottom:1px solid #E7E9F4">Yangiliklar</a>
    <a href="/ota-ona-paneli.html" style="display:block;padding:12px 0;color:#464557;text-decoration:none;font-size:16px;font-weight:500;border-bottom:1px solid #E7E9F4">Ota-onalar</a>
    ${mobileAuthHTML}
  </div>
</nav>
<style>
@media(max-width:768px){#_nlinks{display:none!important}#_nbtn{display:flex!important;align-items:center}}
</style>`;
  }

  /* ─── role helpers ─── */
  function _roleLabel(role) {
    return role === 'student' ? '👨‍🎓 O\'quvchi' : role === 'parent' ? '👨‍👩‍👦 Ota-ona' : role === 'teacher' ? '👩‍🏫 Ustoz' : 'Foydalanuvchi';
  }
  function _roleHome(role) {
    return role === 'parent' ? '/ota-ona-paneli.html' : role === 'student' ? '/ai-chat.html' : '/index.html';
  }

  /* ─── FOOTER HTML ─── */
  const FOOTER_HTML = `<footer style="background:#12183b;color:#fff;padding:56px 24px 28px">
  <div style="max-width:1200px;margin:0 auto">
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:40px;margin-bottom:48px">
      <div>
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px">
          <img src="/logo.png" alt="" style="height:32px;filter:brightness(0) invert(1)">
          <span style="font-family:Montserrat,sans-serif;font-weight:800;font-size:18px;color:#fec700">Maktab AI</span>
        </div>
        <p style="font-size:14px;color:rgba(255,255,255,.55);line-height:1.8">O'zbekiston maktab o'quvchilari uchun AI ta'lim platformasi. 1–11 sinf.</p>
      </div>
      <div>
        <div style="font-family:Montserrat,sans-serif;font-weight:700;font-size:12px;letter-spacing:.8px;text-transform:uppercase;color:rgba(255,255,255,.4);margin-bottom:18px">Platforma</div>
        <div style="display:flex;flex-direction:column;gap:12px">
          <a href="/ai-chat.html" style="color:rgba(255,255,255,.65);text-decoration:none;font-size:14px;transition:color .2s" onmouseover="this.style.color='#fec700'" onmouseout="this.style.color='rgba(255,255,255,.65)'">AI Repetitor</a>
          <a href="/repetitorlar.html" style="color:rgba(255,255,255,.65);text-decoration:none;font-size:14px;transition:color .2s" onmouseover="this.style.color='#fec700'" onmouseout="this.style.color='rgba(255,255,255,.65)'">Repetitorlar</a>
          <a href="/yangiliklar.html" style="color:rgba(255,255,255,.65);text-decoration:none;font-size:14px;transition:color .2s" onmouseover="this.style.color='#fec700'" onmouseout="this.style.color='rgba(255,255,255,.65)'">Yangiliklar</a>
          <a href="/ota-ona-paneli.html" style="color:rgba(255,255,255,.65);text-decoration:none;font-size:14px;transition:color .2s" onmouseover="this.style.color='#fec700'" onmouseout="this.style.color='rgba(255,255,255,.65)'">Ota-ona paneli</a>
        </div>
      </div>
      <div>
        <div style="font-family:Montserrat,sans-serif;font-weight:700;font-size:12px;letter-spacing:.8px;text-transform:uppercase;color:rgba(255,255,255,.4);margin-bottom:18px">Aloqa</div>
        <div style="display:flex;flex-direction:column;gap:12px;font-size:14px;color:rgba(255,255,255,.65)">
          <span>📧 info@maktabai.uz</span>
          <span>📱 @maktabai_bot</span>
          <span>📍 Toshkent, O'zbekiston</span>
        </div>
      </div>
    </div>
    <div style="border-top:1px solid rgba(255,255,255,.08);padding-top:24px;display:flex;flex-wrap:wrap;justify-content:space-between;align-items:center;gap:12px">
      <span style="font-size:13px;color:rgba(255,255,255,.3)">© 2026 Maktab AI. Barcha huquqlar himoyalangan.</span>
      <div style="display:flex;gap:24px">
        <a href="#" style="font-size:13px;color:rgba(255,255,255,.3);text-decoration:none">Maxfiylik siyosati</a>
        <a href="#" style="font-size:13px;color:rgba(255,255,255,.3);text-decoration:none">Foydalanish shartlari</a>
      </div>
    </div>
  </div>
</footer>`;

  /* ─── global actions ─── */
  window.__mktbLogout = function () {
    localStorage.removeItem('maktabai_currentUser');
    localStorage.removeItem('maktab_user');
    location.href = '/index.html';
  };

  window.__mktbDropdown = function () {
    const d = document.getElementById('_dropdown');
    if (!d) return;
    d.style.display = d.style.display === 'none' ? 'block' : 'none';
  };

  window.__mktbNavToggle = function () {
    const m = document.getElementById('_nmob');
    if (m) m.style.display = m.style.display === 'none' ? 'block' : 'none';
  };

  /* ─── inject ─── */
  const navPh = document.getElementById('nav-ph');
  if (navPh) navPh.innerHTML = buildNav();

  const footerPh = document.getElementById('footer-ph');
  if (footerPh) footerPh.innerHTML = FOOTER_HTML;

  /* close dropdown on outside click */
  document.addEventListener('click', function(e) {
    const wrap = document.getElementById('_avatarwrap');
    const d    = document.getElementById('_dropdown');
    if (wrap && d && !wrap.contains(e.target)) {
      d.style.display = 'none';
    }
  });
})();
