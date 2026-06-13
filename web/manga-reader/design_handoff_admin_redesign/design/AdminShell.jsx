// AdminShell.jsx — header + sidebar agrupada + drawer mobile

const ADMIN_NAV = [
  { section: 'Geral', items: [
    { route: 'overview', icon: 'home', label: 'Visão geral' },
  ]},
  { section: 'Conteúdo', items: [
    { route: 'titles', icon: 'book', label: 'Títulos' },
    { route: 'tags',   icon: 'tag',  label: 'Tags' },
    { route: 'news',   icon: 'news', label: 'Notícias' },
    { route: 'events', icon: 'calendar', label: 'Eventos' },
  ]},
  { section: 'Comunidade', items: [
    { route: 'users',  icon: 'users',  label: 'Usuários' },
    { route: 'groups', icon: 'layers', label: 'Grupos' },
  ]},
  { section: 'Monetização', items: [
    { route: 'financial',     icon: 'dollar', label: 'Financeiro' },
    { route: 'subscriptions', icon: 'card',   label: 'Assinaturas' },
  ]},
];

function SidebarNav({ route, go }) {
  return (
    <nav className="adm-sidebar-nav">
      {ADMIN_NAV.map((sec) => (
        <div className="adm-nav-section" key={sec.section}>
          <div className="adm-nav-title">{sec.section}</div>
          {sec.items.map((it) => (
            <div
              key={it.route}
              className={'adm-nav-item' + (route === it.route ? ' active' : '')}
              onClick={() => go(it.route)}
              role="button" tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(it.route); } }}
            >
              <Icon name={it.icon} size={18} />
              <span>{it.label}</span>
            </div>
          ))}
        </div>
      ))}
    </nav>
  );
}

function AdminShell({ route, setRoute, children }) {
  const [drawer, setDrawer] = React.useState(false);
  const s = window.ADMIN_SESSION;

  const go = (r) => { setRoute(r); setDrawer(false); window.scrollTo({ top: 0 }); };

  // Fecha o drawer com Esc
  React.useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setDrawer(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="adm">
      <header className="adm-header">
        <button className="adm-burger" aria-label="Abrir menu" onClick={() => setDrawer(true)}>
          <Icon name="menu" size={22} />
        </button>
        <a className="adm-brand" href="#" onClick={(e) => { e.preventDefault(); go('overview'); }}>
          <img src="../../assets/favicon.svg" alt="" />
          <span className="adm-brand-text">
            <span className="adm-brand-name">Manga <b>Reader</b></span>
            <span className="adm-brand-sub">Dashboard</span>
          </span>
        </a>
        <div className="adm-header-spacer" />
        <div className="adm-user">
          <div className="adm-user-meta">
            <div className="adm-user-name">{s.name}</div>
            <div className="adm-user-id">#{s.shortId}</div>
          </div>
          <Avatar initials={s.initials} color={s.color} size={36} />
        </div>
      </header>

      <div className="adm-body">
        {/* Backdrop (mobile/tablet) */}
        <div className={'adm-backdrop' + (drawer ? ' show' : '')} onClick={() => setDrawer(false)} />

        {/* Sidebar / drawer */}
        <aside className={'adm-sidebar' + (drawer ? ' open' : '')}>
          <div className="adm-sidebar-head">
            <span className="adm-brand-name" style={{ fontSize: 16 }}>Manga <b style={{ color: 'var(--mr-accent)' }}>Reader</b></span>
            <button className="adm-burger" aria-label="Fechar menu" onClick={() => setDrawer(false)}>
              <Icon name="close" size={20} />
            </button>
          </div>
          <SidebarNav route={route} go={go} />
        </aside>

        <main className="adm-content">
          {children}
        </main>
      </div>
    </div>
  );
}

Object.assign(window, { AdminShell, ADMIN_NAV });
