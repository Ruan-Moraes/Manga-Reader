/* ============================================================
   Cabeçalho — Manga Reader — interatividade do showcase
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Lucide-style icons (2px outline, 24 viewBox) ---------- */
  var P = {
    menu: '<line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/>',
    close: '<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>',
    search: '<circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    library: '<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',
    chevronD: '<polyline points="6 9 12 15 18 9"/>',
    compass: '<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    sliders: '<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',
    flame: '<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',
    sparkles: '<path d="M12 3l1.9 5.6L19.5 10l-5.6 1.9L12 17.5l-1.9-5.6L4.5 10l5.6-1.9z"/>',
    grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>',
    calendar: '<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',
    message: '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    star: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26"/>',
    help: '<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12" y2="17.01"/>',
    info: '<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="8.01"/>',
    logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>',
    bookmark: '<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>'
  };
  function icon(name, size, stroke) {
    size = size || 20;
    return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" ' +
      'stroke="currentColor" stroke-width="' + (stroke || 2) + '" stroke-linecap="round" stroke-linejoin="round">' +
      (P[name] || '') + '</svg>';
  }

  /* ---------- Nav data ---------- */
  var NAV = [
    { id: 'descobrir', label: 'Descobrir', items: [
      { ic: 'flame',    tt: 'Em alta',      hint: 'O que a comunidade está devorando agora' },
      { ic: 'sparkles', tt: 'Lançamentos',  hint: 'Capítulos fresquinhos do dia' },
      { ic: 'grid',     tt: 'Categorias',   hint: 'Gêneros, temas e demografias' },
      { ic: 'calendar', tt: 'Eventos',      hint: 'Maratonas, desafios e coleções' }
    ]},
    { id: 'comunidade', label: 'Comunidade', items: [
      { ic: 'users',   tt: 'Grupos & scans', hint: 'Times de tradução que você segue' },
      { ic: 'message', tt: 'Fórum',          hint: 'Discussões capítulo a capítulo' },
      { ic: 'star',    tt: 'Reviews',        hint: 'Opiniões de outros leitores' }
    ]},
    { id: 'sistema', label: 'Sistema', items: [
      { ic: 'sliders', tt: 'Configurações',    hint: 'Conta, leitura e aparência' },
      { ic: 'help',    tt: 'Central de ajuda', hint: 'Dúvidas e suporte' },
      { ic: 'info',    tt: 'Sobre',            hint: 'O projeto Manga Reader' }
    ]}
  ];

  var SUGGEST = [
    { tt: 'Solo Leveling',          meta: 'Manhwa · 179 capítulos' },
    { tt: 'Vagabond',               meta: 'Mangá · 327 capítulos' },
    { tt: 'Omniscient Reader',      meta: 'Manhwa · 218 capítulos' }
  ];
  var RECENT = ['berserk', 'one piece capítulo 1120', 'grupo: Tsuki Scans'];

  var LOGO = 'favicon-64x64.png';

  /* ---------- builders ---------- */
  function buildLogo(dir) {
    return '<a class="hdr-logo" href="#" data-noop>' +
      '<span class="hdr-logo-mark"><img src="' + LOGO + '" alt=""/></span>' +
      '<span class="hdr-logo-word">Manga <span class="accent">Reader</span></span>' +
      '</a>';
  }

  function buildNav() {
    var groups = NAV.map(function (g) {
      var items = g.items.map(function (it) {
        return '<a class="nav-item" href="#" data-noop>' +
          '<span class="nav-item-ico">' + icon(it.ic, 18) + '</span>' +
          '<span><span class="nav-item-tt">' + it.tt + '</span>' +
          '<span class="nav-item-hint" style="display:block">' + it.hint + '</span></span>' +
          '</a>';
      }).join('');
      return '<div class="nav-group">' +
        '<button class="nav-trigger">' + g.label + '<span class="chev">' + icon('chevronD', 15) + '</span></button>' +
        '<div class="nav-panel">' + items + '</div>' +
        '</div>';
    }).join('');
    return '<nav class="hdr-nav">' + groups + '</nav>';
  }

  function buildSearchPanel() {
    var sugg = SUGGEST.map(function (s) {
      return '<a class="sp-item" href="#" data-noop><span class="sp-cover"></span>' +
        '<span><span class="sp-tt">' + s.tt + '</span><span class="sp-meta" style="display:block">' + s.meta + '</span></span></a>';
    }).join('');
    var rec = RECENT.map(function (r) {
      return '<a class="sp-item" href="#" data-noop><span class="ic">' + icon('search', 16) + '</span>' +
        '<span class="sp-tt" style="font-weight:600">' + r + '</span></a>';
    }).join('');
    return '<div class="search-panel">' +
      '<div class="sp-label">Sugestões para você</div>' + sugg +
      '<div class="sp-label" style="margin-top:4px">Buscas recentes</div>' + rec +
      '</div>';
  }

  function buildSearch(variant) {
    var cls = variant === 'mobile' ? 'hdr-search hdr-search--mobile' : 'hdr-search hdr-search--inline';
    var ph = 'Buscar títulos, autores, grupos…';
    var kbd = variant === 'mobile' ? '' : '<span class="kbd">⌘K</span>';
    return '<div class="' + cls + '">' +
      '<div class="hdr-search-field">' +
        '<span class="lupa">' + icon('search', 18) + '</span>' +
        '<input type="text" placeholder="' + ph + '" aria-label="Buscar"/>' +
        kbd +
      '</div>' + buildSearchPanel() +
      '</div>';
  }

  function buildActions(dir, loggedIn) {
    if (loggedIn) {
      return '<div class="hdr-actions">' +
        '<button class="icon-btn" aria-label="Novidades">' + icon('bell', 20) + '<span class="badge danger">3</span></button>' +
        '<button class="icon-btn act-library" aria-label="Biblioteca">' + icon('library', 20) + '<span class="badge accent">12</span></button>' +
        '<button class="avatar-btn" aria-label="Perfil">RM</button>' +
        '</div>';
    }
    var entrarCls = dir === 'b' ? 'btn-entrar raised' : 'btn-entrar solid';
    var ghost = dir === 'b' ? '<button class="btn-ghost-sm">Criar conta</button>' : '';
    return '<div class="hdr-actions">' + ghost +
      '<button class="' + entrarCls + '">Entrar</button>' +
      '</div>';
  }

  function buildHeader(dir, ctx) {
    var cls = 'mr-hdr dir-' + dir + (ctx.scrolled ? ' is-scrolled' : '') + (ctx.forceSearch ? ' force-search' : '');
    return '<header class="' + cls + '">' +
      '<div class="mr-hdr-bar">' +
        '<button class="hdr-burger" data-drawer aria-label="Menu">' + icon('menu', 24) + '</button>' +
        buildLogo(dir) +
        buildNav() +
        buildSearch('inline') +
        buildActions(dir, ctx.loggedIn) +
      '</div>' +
      '<div class="mr-hdr-searchrow">' + buildSearch('mobile') + '</div>' +
      '</header>';
  }

  function buildPeek() {
    var posters = '';
    for (var i = 0; i < 6; i++) posters += '<div class="peek-poster"></div>';
    // posters wrap to fewer columns on narrow frames automatically
    return '<div class="peek"><div class="peek-hero"></div><div class="peek-row">' + posters + '</div></div>';
  }

  var FRAMES = [
    { key: 'mobile',  cls: 'dev-mobile',  num: '01', name: 'Mobile',  px: '390px · base' },
    { key: 'tablet',  cls: 'dev-tablet',  num: '02', name: 'Tablet',  px: '820px · ≥768' },
    { key: 'desktop', cls: 'dev-desktop', num: '03', name: 'Desktop', px: '1200px · ≥1024' }
  ];

  function render() {
    var dir = state.dir;
    var ctx = { loggedIn: state.loggedIn, scrolled: state.scrolled, forceSearch: state.forceSearch };
    var html = FRAMES.map(function (f) {
      return '<div class="frame ' + f.cls + '">' +
        '<div class="frame-cap"><span class="num">' + f.num + '</span>' +
          '<span class="name">' + f.name + '</span><span class="px">' + f.px + '</span></div>' +
        '<div class="device-scroll"><div class="device"><div class="device-vp">' +
          buildHeader(dir, ctx) + buildPeek() +
        '</div></div></div>' +
      '</div>';
    }).join('');
    document.getElementById('stage').innerHTML = html;
  }

  /* ---------- drawer ---------- */
  function buildDrawer() {
    var secs = NAV.map(function (g) {
      var links = g.items.map(function (it) {
        return '<button class="drawer-link" data-close-drawer><span class="ic">' + icon(it.ic, 20) + '</span>' + it.tt + '</button>';
      }).join('');
      return '<div class="drawer-sec"><div class="drawer-sec-tt">' + g.label + '</div>' + links + '</div>';
    }).join('');
    var ov = document.createElement('div');
    ov.className = 'drawer-overlay';
    ov.innerHTML =
      '<aside class="drawer" role="dialog" aria-label="Menu de navegação">' +
        '<div class="drawer-head">' +
          '<a class="hdr-logo" href="#" data-noop><span class="hdr-logo-mark"><img src="' + LOGO + '" alt=""/></span>' +
          '<span class="hdr-logo-word" style="font-size:15px">Manga <span class="accent">Reader</span></span></a>' +
          '<button class="icon-btn" data-close-drawer aria-label="Fechar">' + icon('close', 22) + '</button>' +
        '</div>' +
        '<div class="drawer-body">' + secs +
          '<div class="drawer-sec"><div class="drawer-sec-tt">Conta</div>' +
            '<button class="drawer-link" data-close-drawer><span class="ic">' + icon('library', 20) + '</span>Biblioteca</button>' +
            '<button class="drawer-link" data-close-drawer><span class="ic">' + icon('bell', 20) + '</span>Novidades</button>' +
            '<button class="drawer-link" data-close-drawer><span class="ic">' + icon('bookmark', 20) + '</span>Salvos</button>' +
          '</div>' +
        '</div>' +
        '<div class="drawer-foot"><span class="av">RM</span>' +
          '<span style="flex:1"><span style="font-weight:700;font-size:14px;display:block">Ruan Moraes</span>' +
          '<span style="font-size:11px;color:var(--mr-fg-subtle)">Postador</span></span>' +
          '<button class="icon-btn" aria-label="Sair">' + icon('logout', 18) + '</button>' +
        '</div>' +
      '</aside>';
    document.body.appendChild(ov);
    return ov;
  }

  /* ---------- state + wiring ---------- */
  var state = { dir: 'a', loggedIn: true, scrolled: false, forceSearch: false };
  var drawerEl;

  function openDrawer() { drawerEl.classList.add('open'); var a = drawerEl.querySelector('.drawer'); if (a) a.classList.add('open'); }
  function closeDrawer() { drawerEl.classList.remove('open'); var a = drawerEl.querySelector('.drawer'); if (a) a.classList.remove('open'); }

  document.addEventListener('DOMContentLoaded', function () {
    drawerEl = buildDrawer();
    render();

    // global delegation
    document.addEventListener('click', function (e) {
      var t = e.target;
      if (t.closest('[data-noop]')) { e.preventDefault(); return; }
      if (t.closest('[data-drawer]')) { openDrawer(); return; }
      if (t.closest('[data-close-drawer]')) { closeDrawer(); return; }
      if (t === drawerEl) { closeDrawer(); return; }
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeDrawer(); });

    // toolbar
    var seg = document.querySelectorAll('[data-dir]');
    seg.forEach(function (b) {
      b.addEventListener('click', function () {
        state.dir = b.getAttribute('data-dir');
        seg.forEach(function (x) { x.classList.toggle('active', x === b); });
        document.getElementById('dir-name').textContent = b.textContent.trim();
        render();
      });
    });

    bindPill('pill-auth', function (on) { state.loggedIn = on; render(); }, state.loggedIn);
    bindPill('pill-scroll', function (on) { state.scrolled = on; render(); }, state.scrolled);
    bindPill('pill-search', function (on) { state.forceSearch = on; render(); }, state.forceSearch);
  });

  function bindPill(id, cb, initial) {
    var el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('on', !!initial);
    el.addEventListener('click', function () {
      var on = !el.classList.contains('on');
      el.classList.toggle('on', on);
      cb(on);
    });
  }
})();
