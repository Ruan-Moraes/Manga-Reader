// Chrome.jsx — NavigationMenu (desktop top-nav + mobile drawer + mobile tab-bar) + Footer

function NavigationMenu({ onNav, route, library, user }) {
  const [megaOpen, setMegaOpen] = React.useState(null); // which section's dropdown is open
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  // Desktop top bar
  return (
    <>
      <nav style={{position:'sticky', top:0, zIndex:20, background:'#252526', borderBottom:'2px solid #727273'}}>
        <div style={{maxWidth:1240, margin:'0 auto', padding:'10px 12px', display:'flex', alignItems:'center', gap:12}}>
          {/* Mobile: drawer toggle — only on small screens */}
          <button onClick={() => setDrawerOpen(true)}
            className="nav-mobile-only"
            style={{display:'none', background:'none', border:0, color:'#fff', cursor:'pointer', padding:8, alignItems:'center', flexShrink:0}}>
            <Icon name="menu" size={22}/>
          </button>

          {/* Logo — desktop only */}
          <a href="#" onClick={(e)=>{e.preventDefault(); onNav('home');}} className="nav-desktop-only" style={{display:'flex', alignItems:'center', gap:8, textDecoration:'none', flexShrink:0}}>
            <img src="../../assets/favicon.svg" width="26" height="26" alt=""/>
            <span style={{fontStyle:'italic', fontWeight:800, fontSize:17, color:'#fff', letterSpacing:1.2}}>Manga <span style={{color:'#ddda2a'}}>Reader</span></span>
          </a>

          {/* Desktop: mega-menu triggers */}
          <div className="nav-desktop-only" style={{display:'none', alignItems:'center', gap:4, marginLeft:12}}>
            {(window.NAV_SECTIONS||[]).map(section => (
              <div key={section.title} style={{position:'relative'}}
                onMouseEnter={() => setMegaOpen(section.title)}
                onMouseLeave={() => setMegaOpen(null)}>
                <button style={{background: megaOpen===section.title ? 'rgba(221,218,42,0.12)' : 'none', border:0, color:'#fff', padding:'8px 12px', fontSize:13, fontWeight:700, cursor:'pointer', display:'inline-flex', alignItems:'center', gap:4, fontFamily:'inherit', letterSpacing:'.0625rem', borderRadius:2, transition:'background .2s'}}>
                  {section.title}
                  <Icon name="chevronD" size={14}/>
                </button>
                {megaOpen === section.title && (
                  <div style={{position:'absolute', top:'100%', left:0, minWidth:320, background:'#161616', border:'1px solid #444', borderRadius:4, padding:8, boxShadow:'-0.25rem 0.25rem 0 0 rgba(221,218,42,0.25)', marginTop:4}}>
                    {section.items.map(it => (
                      <a key={it.key} href="#" onClick={(e)=>{e.preventDefault(); setMegaOpen(null); onNav(it.key);}}
                        style={{display:'flex', alignItems:'flex-start', gap:10, padding:10, borderRadius:2, textDecoration:'none', color:'#fff', transition:'background .2s'}}
                        onMouseEnter={e=>e.currentTarget.style.background='rgba(221,218,42,0.1)'}
                        onMouseLeave={e=>e.currentTarget.style.background='none'}>
                        <div style={{width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(221,218,42,0.1)', borderRadius:2, color:'#ddda2a', flexShrink:0}}><Icon name={it.icon} size={16}/></div>
                        <div style={{flex:1, minWidth:0}}>
                          <div style={{fontSize:13, fontWeight:700, letterSpacing:'.0625rem'}}>{it.label}</div>
                          <div style={{fontSize:11, color:'#999', marginTop:2}}>{it.hint}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Search: flex grow on desktop */}
          <form onSubmit={e=>e.preventDefault()} style={{flex:1, display:'flex', justifyContent:'center', minWidth:0}}>
            <div className="nav-search" style={{width:'100%', maxWidth:420, position:'relative'}}>
              <div style={{position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#727273'}}><Icon name="search" size={14}/></div>
              <input placeholder="Buscar..." style={{width:'100%', height:40, padding:'0 12px 0 32px', background:'#161616', color:'#fff', border:'1px solid #727273', borderRadius:2, fontSize:13, fontFamily:'inherit', letterSpacing:'.0625rem'}}/>
            </div>
          </form>

          {/* Right cluster */}
          <div style={{display:'flex', alignItems:'center', gap:6, flexShrink:0}}>
            <button onClick={()=>onNav('news')} className="nav-desktop-only" style={{display:'none', alignItems:'center', gap:6, background:'none', border:0, color:route==='news'?'#ddda2a':'#fff', cursor:'pointer', padding:'8px 10px', fontSize:13, fontWeight:700, letterSpacing:'.0625rem', fontFamily:'inherit', position:'relative'}}>
              <Icon name="bell" size={16}/>
              Novidades
              <span style={{background:'#FF784F', color:'#fff', fontSize:10, padding:'1px 6px', borderRadius:999, fontWeight:800}}>3</span>
            </button>
            <button onClick={()=>onNav('library')} className="nav-desktop-only" style={{display:'none', alignItems:'center', gap:6, background:'none', border:0, color:route==='library'?'#ddda2a':'#fff', cursor:'pointer', padding:'8px 10px', fontSize:13, fontWeight:700, letterSpacing:'.0625rem', fontFamily:'inherit'}}>
              <Icon name="library" size={16}/>
              Biblioteca
              {library.size > 0 && <span style={{background:'#ddda2a', color:'#161616', fontSize:10, padding:'1px 6px', borderRadius:999, fontWeight:800}}>{library.size}</span>}
            </button>
            {user ? (
              <Avatar initials={user.initials} size={40} onClick={()=>onNav('profile')}/>
            ) : (
              <button onClick={()=>onNav('login')} style={{
                padding:'10px 16px', height:40,
                background:'#ddda2a', color:'#161616',
                border:'1px solid #ddda2a', borderRadius:2,
                fontWeight:800, fontSize:12, letterSpacing:'.1em', textTransform:'uppercase',
                cursor:'pointer', fontFamily:'inherit', whiteSpace:'nowrap',
              }}>Entrar</button>
            )}
          </div>
        </div>
      </nav>

      <MobileDrawer open={drawerOpen} onClose={()=>setDrawerOpen(false)} onNav={onNav} route={route} library={library}/>
      <MobileTabBar onNav={onNav} route={route} library={library}/>
    </>
  );
}

function MobileDrawer({ open, onClose, onNav, route, library }) {
  if (!open) return null;
  return (
    <>
      <div onClick={onClose} style={{position:'fixed', inset:0, background:'rgba(22,22,22,.8)', backdropFilter:'blur(4px)', zIndex:30}}/>
      <aside style={{position:'fixed', top:0, bottom:0, left:0, width:'min(320px, 85vw)', background:'#161616', borderRight:'2px solid #727273', zIndex:31, display:'flex', flexDirection:'column'}}>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:14, borderBottom:'2px solid #727273'}}>
          <div style={{display:'flex', alignItems:'center', gap:8}}>
            <img src="../../assets/favicon.svg" width="26" height="26"/>
            <span style={{fontStyle:'italic', fontWeight:800, fontSize:15, color:'#fff'}}>Manga <span style={{color:'#ddda2a'}}>Reader</span></span>
          </div>
          <button onClick={onClose} style={{background:'none', border:0, color:'#fff', cursor:'pointer', padding:4}}><Icon name="close" size={22}/></button>
        </div>
        <div style={{flex:1, overflowY:'auto', padding:'8px 0'}}>
          {(window.NAV_SECTIONS||[]).map(s => (
            <div key={s.title} style={{padding:'10px 8px'}}>
              <div style={{fontSize:10, fontWeight:800, color:'#ddda2a', textTransform:'uppercase', letterSpacing:'.1em', margin:'0 10px 6px'}}>{s.title}</div>
              {s.items.map(it => {
                const active = route === it.key;
                return (
                  <button key={it.key} onClick={()=>{onNav(it.key); onClose();}}
                    style={{display:'flex', alignItems:'center', gap:12, width:'100%', textAlign:'left', background: active?'rgba(221,218,42,0.12)':'none', border:0, borderLeft:`2px solid ${active?'#ddda2a':'transparent'}`, color: active?'#ddda2a':'#fff', padding:'12px 10px', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', letterSpacing:'.0625rem', minHeight:44}}>
                    <Icon name={it.icon} size={18}/>
                    <span>{it.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
          <div style={{padding:'10px 8px'}}>
            <div style={{fontSize:10, fontWeight:800, color:'#ddda2a', textTransform:'uppercase', letterSpacing:'.1em', margin:'0 10px 6px'}}>Conta</div>
            <button onClick={()=>{onNav('library'); onClose();}} style={{display:'flex', alignItems:'center', justifyContent:'space-between', width:'100%', background:'none', border:0, color:'#fff', padding:'12px 10px', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', letterSpacing:'.0625rem', minHeight:44}}>
              <span style={{display:'flex', alignItems:'center', gap:12}}><Icon name="library" size={18}/>Biblioteca</span>
              <span style={{color:'#ddda2a', fontWeight:800}}>{library.size}</span>
            </button>
            <button onClick={()=>{onNav('profile'); onClose();}} style={{display:'flex', alignItems:'center', gap:12, width:'100%', background:'none', border:0, color:'#fff', padding:'12px 10px', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', letterSpacing:'.0625rem', minHeight:44}}>
              <Icon name="user" size={18}/>Perfil
            </button>
            <button onClick={()=>{onNav('settings'); onClose();}} style={{display:'flex', alignItems:'center', gap:12, width:'100%', background:'none', border:0, color:'#fff', padding:'12px 10px', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', letterSpacing:'.0625rem', minHeight:44}}>
              <Icon name="settings" size={18}/>Configurações
            </button>
            <button onClick={()=>{onNav('help'); onClose();}} style={{display:'flex', alignItems:'center', gap:12, width:'100%', background:'none', border:0, color:'#fff', padding:'12px 10px', fontSize:14, fontWeight:600, cursor:'pointer', fontFamily:'inherit', letterSpacing:'.0625rem', minHeight:44}}>
              <Icon name="help" size={18}/>Central de ajuda
            </button>
          </div>
        </div>
        <div style={{padding:14, borderTop:'1px solid #444', display:'flex', alignItems:'center', gap:10}}>
          <Avatar initials="RM" size={36}/>
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontSize:13, fontWeight:700, color:'#fff'}}>Ruan Moraes</div>
            <div style={{fontSize:11, color:'#999'}}>Postador</div>
          </div>
          <button style={{background:'none', border:0, color:'#999', cursor:'pointer', padding:8}}><Icon name="logout" size={16}/></button>
        </div>
      </aside>
    </>
  );
}

function MobileTabBar({ onNav, route, library }) {
  const tabs = [
    { key:'home',    icon:'home' },
    { key:'search',  icon:'search' },
    { key:'library', icon:'library', badge: library.size },
    { key:'profile', icon:'user' },
  ];
  return (
    <nav className="nav-mobile-only" style={{
      display:'none', position:'fixed', left:0, right:0, bottom:0, zIndex:15,
      background:'#1a1a1a', borderTop:'1px solid #2d2d2d',
      paddingBottom:'env(safe-area-inset-bottom, 0px)',
      paddingTop:8, paddingLeft:8, paddingRight:8,
    }}>
      <div style={{display:'flex', justifyContent:'space-around', alignItems:'center', gap:8, paddingBottom:8}}>
        {tabs.map(t => {
          const active = route === t.key;
          return (
            <button key={t.key} onClick={()=>onNav(t.key)}
              style={{
                background: active ? 'rgba(221,218,42,0.12)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${active ? 'rgba(221,218,42,0.45)' : '#333'}`,
                borderRadius:4,
                color: active ? '#ddda2a' : '#727273',
                width:54, height:48,
                display:'flex', alignItems:'center', justifyContent:'center',
                cursor:'pointer', position:'relative',
                transition:'all .2s ease',
                flexShrink:0,
                padding:0,
              }}>
              <div style={{position:'relative'}}>
                <Icon name={t.icon} size={22}/>
                {t.badge > 0 && (
                  <span style={{
                    position:'absolute', top:-6, right:-10,
                    background:'#ddda2a', color:'#161616',
                    fontSize:9, padding:'0 4px', borderRadius:999,
                    fontWeight:800, minWidth:14, textAlign:'center', lineHeight:'15px'
                  }}>{t.badge}</span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

function Footer({ onNav }) {
  const nav = onNav || ((k) => {
    const evt = new CustomEvent('mr-nav', { detail: k });
    window.dispatchEvent(evt);
  });
  // Helper para link de rota (usa onNav se houver, senão emite evento)
  const L = ({ to, children }) => (
    <a href="#" onClick={(e) => { e.preventDefault(); nav(to); }} className="footer-link">{children}</a>
  );

  const columns = [
    {
      title: 'Descobrir',
      links: [
        ['home',     'Início'],
        ['trending', 'Em alta'],
        ['new',      'Lançamentos'],
        ['genres',   'Categorias'],
        ['genres',   'Por gênero'],
        ['genres',   'Por status'],
        ['home',     'Aleatório'],
        ['home',     'Concluídos'],
      ],
    },
    {
      title: 'Biblioteca',
      links: [
        ['library',  'Minha biblioteca'],
        ['library',  'Lendo agora'],
        ['library',  'Histórico'],
        ['library',  'Favoritos'],
        ['library',  'Planejados'],
        ['library',  'Importar lista'],
      ],
    },
    {
      title: 'Comunidade',
      links: [
        ['forum',    'Fórum'],
        ['events',   'Eventos'],
        ['groups',   'Grupos de scan'],
        ['forum',    'Top da semana'],
        ['news',     'Novidades'],
        ['help',     'Como contribuir'],
        ['help',     'Diretrizes da comunidade'],
      ],
    },
    {
      title: 'Conta',
      links: [
        ['login',    'Entrar'],
        ['register', 'Criar conta'],
        ['profile',  'Meu perfil'],
        ['settings', 'Configurações'],
        ['help',     'Notificações'],
        ['help',     'Apoiar o projeto'],
      ],
    },
    {
      title: 'Suporte',
      links: [
        ['help',     'Central de ajuda'],
        ['help',     'Perguntas frequentes'],
        ['contact',  'Reportar problema'],
        ['help',     'Status do sistema'],
        ['contact',  'Falar com o time'],
        ['help',     'API para devs'],
      ],
    },
    {
      title: 'Legal',
      links: [
        ['terms',    'Termos de uso'],
        ['privacy',  'Privacidade'],
        ['dmca',     'DMCA / Direitos autorais'],
        ['privacy',  'Cookies'],
        ['terms',    'Diretrizes para scans'],
        ['contact',  'Contatos'],
      ],
    },
  ];

  return (
    <footer className="footer">
      <div className="footer-inner">

        {/* ============ TOP: brand + colunas ============ */}
        <div className="footer-top">
          <div className="footer-brand">
            <div className="footer-logo">
              <img src="../../assets/favicon.svg" width="32" height="32" alt=""/>
              <span className="footer-wordmark">Manga <span style={{color:'#ddda2a'}}>Reader</span></span>
            </div>
            <p className="footer-tagline">
              Leia, catalogue e participe da comunidade de mangás, manhwas e manhuas.
            </p>
            <div className="footer-newsletter">
              <div className="mr-label" style={{color:'#ddda2a', marginBottom:6}}>Receba os destaques da semana</div>
              <form className="footer-newsletter-form" onSubmit={(e)=>e.preventDefault()}>
                <input type="email" placeholder="seu@email.com" aria-label="Email"/>
                <button type="submit" aria-label="Inscrever">
                  <Icon name="arrowR" size={16}/>
                </button>
              </form>
              <div style={{fontSize:11, color:'#727273', marginTop:6}}>Sem spam. Cancele quando quiser.</div>
            </div>

            <div className="footer-apps">
              <a href="#" className="footer-app" onClick={(e)=>e.preventDefault()}>
                <Icon name="download" size={16}/>
                <div>
                  <div style={{fontSize:9, color:'#999', textTransform:'uppercase', letterSpacing:'.1em', fontWeight:700}}>Baixe para</div>
                  <div style={{fontSize:13, color:'#fff', fontWeight:800, letterSpacing:'.0625rem'}}>iOS</div>
                </div>
              </a>
              <a href="#" className="footer-app" onClick={(e)=>e.preventDefault()}>
                <Icon name="download" size={16}/>
                <div>
                  <div style={{fontSize:9, color:'#999', textTransform:'uppercase', letterSpacing:'.1em', fontWeight:700}}>Baixe para</div>
                  <div style={{fontSize:13, color:'#fff', fontWeight:800, letterSpacing:'.0625rem'}}>Android</div>
                </div>
              </a>
            </div>
          </div>

          <nav className="footer-columns" aria-label="Rodapé">
            {columns.map(col => (
              <div key={col.title} className="footer-col">
                <div className="footer-col-title">{col.title}</div>
                <ul className="footer-col-list">
                  {col.links.map(([to, label]) => (
                    <li key={label}><L to={to}>{label}</L></li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </div>

        {/* ============ MIDDLE: status banner ============ */}
        <div className="footer-status">
          <div className="footer-status-dot"/>
          <div>
            <span style={{color:'#fff', fontWeight:700, fontSize:13, letterSpacing:'.0625rem'}}>Tudo operando normalmente</span>
            <span style={{color:'#727273', fontSize:11, marginLeft:8, letterSpacing:'.0625rem'}}>· última checagem há 2 min</span>
          </div>
          <a href="#" onClick={(e)=>{e.preventDefault(); nav('help');}} className="footer-link" style={{marginLeft:'auto', color:'#ddda2a'}}>Ver status →</a>
        </div>

        {/* ============ BOTTOM: legal + preferências ============ */}
        <div className="footer-bottom">
          <div className="footer-bottom-left">
            © 2026 Manga Reader. Feito por Ruan — projeto de estudo.
          </div>
          <div className="footer-bottom-right">
            <button className="footer-pref" onClick={()=>nav('settings')} aria-label="Idioma">
              <Icon name="globe" size={14}/>
              <span>Português (BR)</span>
              <Icon name="chevronD" size={12}/>
            </button>
            <button className="footer-pref" aria-label="Tema">
              <Icon name="moon" size={14}/>
              <span>Escuro</span>
              <Icon name="chevronD" size={12}/>
            </button>
            <a href="#" onClick={(e)=>{e.preventDefault(); nav('help');}} className="footer-pref" style={{color:'#ddda2a'}}>
              <Icon name="help" size={14}/>
              <span>Ajuda</span>
            </a>
          </div>
        </div>

      </div>
    </footer>
  );
}

Object.assign(window, { NavigationMenu, Footer });
