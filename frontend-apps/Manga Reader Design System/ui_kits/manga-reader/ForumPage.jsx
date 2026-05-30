// ForumPage.jsx — Fórum: índice de tópicos
// Layout: sidebar categorias (esquerda) + feed (centro) + sidebar comunidade (direita)
// Mobile: feed apenas, categorias viram drawer, lateral direita não aparece
// Tablet (≥768): feed + lateral direita visível
// Desktop (≥1024): 3 colunas

function ForumPage({ onOpenTopic, onOpenCompose, onNav }) {
  const [category, setCategory] = React.useState('home');
  const [tab, setTab] = React.useState('alta');
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [hoveredUser, setHoveredUser] = React.useState(null);

  const topics = window.FORUM_TOPICS || [];
  const filtered = topics.filter(t => {
    if (category !== 'home' && t.category !== category) return false;
    if (tab === 'sem-resposta' && t.replies > 0) return false;
    if (tab === 'fixados' && !t.pinned) return false;
    return true;
  });

  // ordenação por tab
  const sorted = [...filtered].sort((a,b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    if (tab === 'recentes')      return parseTime(a.when) - parseTime(b.when);
    if (tab === 'comentados')    return b.replies - a.replies;
    return (b.hot?1:0) - (a.hot?1:0) || b.replies - a.replies;
  });

  return (
    <div className="forum-shell" data-screen-label="forum">
      {/* mobile drawer overlay (categorias) */}
      {drawerOpen && (
        <div className="forum-drawer-overlay" onClick={() => setDrawerOpen(false)}>
          <aside className="forum-drawer" onClick={e => e.stopPropagation()}>
            <div className="forum-drawer-head">
              <span className="mr-label" style={{color:'#ddda2a'}}>Categorias</span>
              <button onClick={() => setDrawerOpen(false)} className="forum-icon-btn"><Icon name="close" size={18}/></button>
            </div>
            <ForumSidebarNav active={category} onSelect={k => { setCategory(k); setDrawerOpen(false); }}/>
          </aside>
        </div>
      )}

      <div className="forum-layout">
        {/* ============ LEFT SIDEBAR (categorias) ============ */}
        <aside className="forum-sidebar-left">
          <ForumSidebarNav active={category} onSelect={setCategory}/>
        </aside>

        {/* ============ CENTER FEED ============ */}
        <main className="forum-main">
          {/* Header */}
          <div className="forum-header">
            <div className="forum-header-top">
              <div>
                <div className="mr-label" style={{color:'#ddda2a', display:'inline-flex', alignItems:'center', gap:6}}>
                  <Icon name="forum" size={13}/>Fórum da comunidade
                </div>
                <h1 className="forum-title">
                  {(window.FORUM_CATEGORIES.find(c => c.key === category) || {}).label || 'Home do fórum'}
                </h1>
                <p className="forum-subtitle">
                  {sorted.length} {sorted.length===1?'tópico ativo':'tópicos ativos'} · {window.FORUM_STATS.online.toLocaleString('pt-BR')} leitores online agora
                </p>
              </div>
              <div className="forum-header-actions">
                <button className="forum-icon-btn forum-drawer-toggle" onClick={() => setDrawerOpen(true)} aria-label="Abrir categorias">
                  <Icon name="menu" size={18}/>
                </button>
                <Button variant="primary" icon="plus" onClick={onOpenCompose}>Criar tópico</Button>
              </div>
            </div>

            {/* search bar */}
            <div className="forum-search">
              <Icon name="search" size={16}/>
              <input placeholder="Buscar tópicos, autores, tags…"/>
              <kbd className="forum-kbd">⌘ K</kbd>
            </div>

            {/* tabs */}
            <div className="forum-tabs">
              {[
                ['alta',         'Em alta',         'trending'],
                ['recentes',     'Recentes',        'clock'],
                ['sem-resposta', 'Sem respostas',   'comment'],
                ['comentados',   'Mais comentados', 'forum'],
                ['seguindo',     'Seguindo',        'heart'],
                ['fixados',      'Fixados',         'bookmark'],
              ].map(([k, l, ic]) => {
                const active = tab === k;
                return (
                  <button key={k} onClick={() => setTab(k)} className={`forum-tab ${active?'active':''}`}>
                    <Icon name={ic} size={14}/>
                    {l}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Topics feed */}
          {sorted.length === 0 ? (
            <ForumEmptyState/>
          ) : (
            <div className="forum-feed">
              {sorted.map(t => (
                <ForumTopicCard
                  key={t.id} topic={t}
                  onOpen={() => onOpenTopic(t.id)}
                  onUserHover={setHoveredUser}
                  onUserLeave={() => setHoveredUser(null)}
                />
              ))}
            </div>
          )}

          {/* skeleton loading sample */}
          <div className="forum-skeleton">
            <div className="forum-skeleton-card">
              <div className="forum-skel-avatar"/>
              <div className="forum-skel-body">
                <div className="forum-skel-line" style={{width:'60%'}}/>
                <div className="forum-skel-line" style={{width:'90%'}}/>
                <div className="forum-skel-line" style={{width:'75%'}}/>
              </div>
            </div>
          </div>

          {/* pagination */}
          <ForumPagination/>
        </main>

        {/* ============ RIGHT SIDEBAR (comunidade) ============ */}
        <aside className="forum-sidebar-right">
          <ForumPanelTrending onOpenTopic={onOpenTopic}/>
          <ForumPanelRecentComments onOpenTopic={onOpenTopic}/>
          <ForumPanelRanking/>
          <ForumPanelEvents onNav={onNav}/>
          <ForumPanelStats/>
        </aside>
      </div>

      {/* user mini-profile hover card */}
      {hoveredUser && <UserHoverCard user={window.FORUM_USERS[hoveredUser.id]} at={hoveredUser.at}/>}
    </div>
  );
}

// ============================================================
// Sidebar de categorias
// ============================================================
function ForumSidebarNav({ active, onSelect }) {
  const cats = window.FORUM_CATEGORIES || [];
  return (
    <nav className="forum-cats">
      {cats.map(c => {
        const isActive = active === c.key;
        return (
          <button key={c.key} onClick={() => onSelect(c.key)}
            className={`forum-cat ${isActive?'active':''}`}>
            <div className="forum-cat-icon"><Icon name={c.icon} size={16}/></div>
            <span className="forum-cat-label">{c.label}</span>
            <span className="forum-cat-count">{c.count >= 1000 ? `${(c.count/1000).toFixed(1)}k` : c.count}</span>
          </button>
        );
      })}
      <div className="forum-cats-foot">
        <div className="mr-label" style={{color:'#727273', marginBottom:6}}>Regras</div>
        <p style={{fontSize:11, color:'#999', lineHeight:1.5, margin:0}}>Spoilers de capítulos com menos de 7 dias precisam de tag <span style={{color:'#FF784F', fontWeight:700}}>[spoiler]</span> obrigatória.</p>
      </div>
    </nav>
  );
}

// ============================================================
// Card de tópico
// ============================================================
function ForumTopicCard({ topic, onOpen, onUserHover, onUserLeave }) {
  const u = window.FORUM_USERS[topic.authorId];
  const last = window.FORUM_USERS[topic.lastUserId];
  const cat = window.FORUM_CATEGORIES.find(c => c.key === topic.category);

  return (
    <article className="forum-card" onClick={onOpen}>
      {topic.pinned && (
        <div className="forum-card-pin"><Icon name="bookmark" size={10}/>Fixado</div>
      )}
      {topic.hot && !topic.pinned && (
        <div className="forum-card-hot"><Icon name="trending" size={10}/>Em alta</div>
      )}

      <div className="forum-card-main">
        {/* avatar */}
        <div className="forum-card-avatar"
          onMouseEnter={e => onUserHover({ id: u.id, at: e.currentTarget.getBoundingClientRect() })}
          onMouseLeave={onUserLeave}
          onClick={e => e.stopPropagation()}>
          <Avatar initials={u.initials} color={u.color} size={44}/>
          {u.role === 'mod'   && <span className="forum-role-badge mod">M</span>}
          {u.role === 'admin' && <span className="forum-role-badge admin">A</span>}
        </div>

        {/* body */}
        <div className="forum-card-body">
          <div className="forum-card-meta">
            <span className="forum-author" onClick={e => e.stopPropagation()}>{u.name}</span>
            <span className="forum-meta-dot">·</span>
            <span className="forum-card-when">{topic.when}</span>
            <span className="forum-meta-dot">·</span>
            <span className="forum-card-cat">{cat?.label}</span>
          </div>

          <h3 className="forum-card-title">{topic.title}</h3>
          <p className="forum-card-excerpt">{topic.excerpt}</p>

          {/* tags */}
          <div className="forum-card-tags">
            {topic.tags.map(t => {
              const tag = window.FORUM_TAGS[t] || { label:t, tone:'neutral' };
              return <span key={t} className={`forum-tag forum-tag-${tag.tone}`}>{tag.label}</span>;
            })}
          </div>

          {/* footer stats */}
          <div className="forum-card-footer">
            <div className="forum-card-stats">
              <span className="forum-stat"><Icon name="comment" size={13}/>{topic.replies.toLocaleString('pt-BR')}</span>
              <span className="forum-stat"><Icon name="eye"     size={13}/>{formatViews(topic.views)}</span>
              <span className="forum-stat forum-stat-up"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>{topic.reactions.up}</span>
            </div>
            <div className="forum-last-reply" onClick={e => e.stopPropagation()}>
              <span className="mr-label" style={{color:'#727273'}}>Última resposta</span>
              <div className="forum-last-reply-line">
                <Avatar initials={last.initials} color={last.color} size={22}/>
                <span style={{color:'#fff', fontWeight:700, fontSize:12, letterSpacing:'.0625rem'}}>{last.name}</span>
                <span style={{color:'#999', fontSize:11}}>· {topic.lastReplyAt}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

// ============================================================
// Paineis da sidebar direita
// ============================================================
function ForumPanelTrending({ onOpenTopic }) {
  return (
    <section className="forum-panel">
      <header className="forum-panel-head">
        <Icon name="trending" size={14}/>
        <h4>Em alta agora</h4>
      </header>
      <ol className="forum-trending">
        {window.FORUM_TRENDING.map((t, i) => (
          <li key={t.id} onClick={() => onOpenTopic(t.id)}>
            <span className="forum-trending-rank">{i+1}</span>
            <div style={{flex:1, minWidth:0}}>
              <div className="forum-trending-title">{t.title}</div>
              <div className="forum-trending-meta">
                <Icon name="comment" size={10}/>{t.replies} respostas
                <span style={{color:'#ddda2a', fontWeight:800}}>· {t.trend}</span>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

function ForumPanelRecentComments({ onOpenTopic }) {
  return (
    <section className="forum-panel">
      <header className="forum-panel-head">
        <Icon name="comment" size={14}/>
        <h4>Comentários recentes</h4>
      </header>
      <ul className="forum-recent">
        {window.FORUM_RECENT_COMMENTS.map((c, i) => {
          const u = window.FORUM_USERS[c.userId];
          const t = window.FORUM_TOPICS.find(x => x.id === c.topicId);
          return (
            <li key={i} onClick={() => onOpenTopic(c.topicId)}>
              <Avatar initials={u.initials} color={u.color} size={30}/>
              <div style={{flex:1, minWidth:0}}>
                <div className="forum-recent-head">
                  <span style={{color:'#fff', fontWeight:700, fontSize:12, letterSpacing:'.0625rem'}}>{u.name}</span>
                  <span style={{color:'#727273', fontSize:11}}>· {c.when}</span>
                </div>
                <div className="forum-recent-text">{c.text}</div>
                <div className="forum-recent-on">em <span style={{color:'#ddda2a'}}>{t?.title}</span></div>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ForumPanelRanking() {
  return (
    <section className="forum-panel">
      <header className="forum-panel-head">
        <Icon name="sparkle" size={14}/>
        <h4>Top da semana</h4>
      </header>
      <ol className="forum-ranking">
        {window.FORUM_RANKING.map((r, i) => {
          const u = window.FORUM_USERS[r.userId];
          return (
            <li key={u.id}>
              <span className={`forum-rank-pos ${i===0?'gold':i===1?'silver':i===2?'bronze':''}`}>{i+1}</span>
              <Avatar initials={u.initials} color={u.color} size={28}/>
              <div style={{flex:1, minWidth:0}}>
                <div className="forum-rank-name">{u.name}</div>
                <div className="forum-rank-meta">Nível {u.level} · {u.posts} posts</div>
              </div>
              <div className="forum-rank-points">{r.points}</div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function ForumPanelEvents({ onNav }) {
  return (
    <section className="forum-panel">
      <header className="forum-panel-head">
        <Icon name="calendar" size={14}/>
        <h4>Próximos eventos</h4>
      </header>
      <ul className="forum-events">
        {window.FORUM_EVENTS.map(e => (
          <li key={e.id}>
            <div className="forum-event-when">{e.when}</div>
            <div className="forum-event-title">{e.title}</div>
            <span className="forum-event-badge">{e.badge}</span>
          </li>
        ))}
      </ul>
      <button className="forum-panel-link" onClick={() => onNav && onNav('events')}>Ver todos os eventos →</button>
    </section>
  );
}

function ForumPanelStats() {
  const s = window.FORUM_STATS;
  return (
    <section className="forum-panel forum-panel-stats">
      <header className="forum-panel-head">
        <Icon name="news" size={14}/>
        <h4>Estatísticas</h4>
      </header>
      <div className="forum-stats-grid">
        <div className="forum-stat-tile">
          <div className="forum-stat-tile-v">{s.online.toLocaleString('pt-BR')}</div>
          <div className="forum-stat-tile-l"><span className="forum-online-dot"/>Online agora</div>
        </div>
        <div className="forum-stat-tile">
          <div className="forum-stat-tile-v">{s.topicsToday}</div>
          <div className="forum-stat-tile-l">Tópicos hoje</div>
        </div>
        <div className="forum-stat-tile">
          <div className="forum-stat-tile-v">{s.commentsToday.toLocaleString('pt-BR')}</div>
          <div className="forum-stat-tile-l">Comentários hoje</div>
        </div>
        <div className="forum-stat-tile">
          <div className="forum-stat-tile-v">+{s.newUsers}</div>
          <div className="forum-stat-tile-l">Novos leitores</div>
        </div>
      </div>
    </section>
  );
}

// ============================================================
// Empty state, pagination, hover-card
// ============================================================
function ForumEmptyState() {
  return (
    <div className="forum-empty">
      <img src="../../assets/illustrations/pensando.png" width="120" height="120" alt=""/>
      <h3 style={{color:'#fff', margin:'10px 0 4px', letterSpacing:'.0625rem'}}>Ninguém começou a conversa ainda</h3>
      <p style={{color:'#999', fontSize:13, marginBottom:14}}>Seja o primeiro a abrir um tópico nesta categoria.</p>
      <Button variant="primary" icon="plus">Criar tópico</Button>
    </div>
  );
}

function ForumPagination() {
  return (
    <div className="forum-pagination">
      <button disabled className="forum-page-btn"><Icon name="chevronL" size={14}/></button>
      <button className="forum-page-btn active">1</button>
      <button className="forum-page-btn">2</button>
      <button className="forum-page-btn">3</button>
      <span style={{color:'#727273', padding:'0 8px'}}>…</span>
      <button className="forum-page-btn">12</button>
      <button className="forum-page-btn"><Icon name="chevronR" size={14}/></button>
    </div>
  );
}

function UserHoverCard({ user, at }) {
  if (!user || !at) return null;
  const top  = Math.min(window.innerHeight - 220, at.bottom + 8);
  const left = Math.min(window.innerWidth - 280, at.left);
  return (
    <div className="forum-userhover" style={{top, left}}>
      <div className="forum-userhover-head">
        <Avatar initials={user.initials} color={user.color} size={48}/>
        <div>
          <div className="forum-userhover-name">{user.name}</div>
          <div className="forum-userhover-handle">@{user.handle}</div>
        </div>
      </div>
      <div className="forum-userhover-body">
        <div className="forum-userhover-row">
          <span className="mr-label">Nível</span>
          <span className="forum-userhover-v">{user.level}</span>
        </div>
        {user.badge && (
          <div className="forum-userhover-row">
            <span className="mr-label">Selo</span>
            <span className="forum-userhover-badge">{user.badge}</span>
          </div>
        )}
        {user.role && (
          <div className="forum-userhover-row">
            <span className="mr-label">Cargo</span>
            <span className={`forum-userhover-role ${user.role}`}>{user.role === 'mod' ? 'Moderador' : 'Administrador'}</span>
          </div>
        )}
      </div>
      <div className="forum-userhover-actions">
        <Button variant="primary" block>Seguir</Button>
        <Button variant="raised" block>Ver perfil</Button>
      </div>
    </div>
  );
}

// helpers
function formatViews(n) {
  if (n >= 1_000_000) return (n/1_000_000).toFixed(1).replace('.0','') + 'M';
  if (n >= 1_000)     return (n/1_000).toFixed(1).replace('.0','') + 'k';
  return String(n);
}
function parseTime(s) {
  if (s.includes('min'))    return parseInt(s)        || 0;
  if (s.includes('hora'))   return (parseInt(s) || 1) * 60;
  if (s.includes('ontem'))  return 1440;
  if (s.includes('dia'))    return (parseInt(s) || 1) * 1440;
  return 99999;
}

Object.assign(window, { ForumPage, ForumTopicCard, ForumSidebarNav, UserHoverCard, formatViews });
