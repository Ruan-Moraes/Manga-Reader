// Pages.jsx — HomePage, TitlePage, LibraryPage, ProfilePage, NewsPage

function HomePage({ onOpenTitle, library, toggleLib, onNav }) {
  const hero = window.MANGAS[0];
  const trending = window.MANGAS.slice(1, 6);
  const recent = [...window.MANGAS].sort((a,b)=>a.addedDays-b.addedDays).slice(0,6);
  // "Para você": obras que combinam com o histórico (fake: mesmos gêneros da biblioteca)
  const libGenres = new Set([...library].flatMap(id => (window.MANGAS.find(m=>m.id===id)||{}).genre || []));
  const forYou = window.MANGAS.filter(m => !library.has(m.id) && m.genre.some(g => libGenres.has(g))).slice(0,6);
  const forYouFallback = forYou.length ? forYou : window.MANGAS.slice(2,8);

  return (
    <div className="page">
      {/* Hero */}
      <section className="hero">
        <div className="hero-copy">
          <div style={{alignSelf:'flex-start'}}><Badge>Em destaque</Badge></div>
          <h1 className="hero-title">{hero.title}</h1>
          <div style={{display:'flex', gap:6, margin:'10px 0 12px', flexWrap:'wrap'}}>{hero.genre.map(g => <Badge key={g} variant="neutral">{g}</Badge>)}</div>
          <p className="hero-synopsis">{hero.synopsis}</p>
          <div style={{display:'flex', gap:10, flexWrap:'wrap'}}>
            <Button variant="primary" icon="bookmark" onClick={() => onOpenTitle(hero.id)}>Começar a ler</Button>
            <Button variant="raised" onClick={() => toggleLib(hero.id)}>{library.has(hero.id)?'Na biblioteca ✓':'+ Adicionar'}</Button>
          </div>
        </div>
        <div className="hero-poster">
          <div style={{width:'min(220px, 45vw)', aspectRatio:'2/3', background: hero.gradient, borderRadius:8, border:'1px solid #ddda2a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:56, fontWeight:800, color:'rgba(221,218,42,.5)', boxShadow:'-0.5rem 0.5rem 0 0 rgba(221,218,42,0.25)'}}>{hero.initial}</div>
        </div>
      </section>

      {/* Em alta */}
      <section style={{marginBottom:32}}>
        <SectionHeader icon="trending" eyebrow="Em alta esta semana" title="O que todo mundo está lendo" onSeeAll={()=>{}}/>
        <MangaGrid minW={140}>
          {trending.map(m => <MangaCard key={m.id} manga={m} onClick={() => onOpenTitle(m.id)}/>)}
        </MangaGrid>
      </section>

      {/* Recentemente adicionadas */}
      <section style={{marginBottom:32}}>
        <SectionHeader icon="sparkle" eyebrow="Recentemente adicionadas" title="Novos títulos no catálogo" onSeeAll={()=>{}}/>
        <MangaGrid minW={140}>
          {recent.map(m => (
            <MangaCard key={m.id} manga={m} onClick={() => onOpenTitle(m.id)} tag={m.addedDays===0?'Hoje': m.addedDays<=3?'Novo': m.addedDays<=7?'Semana': null}/>
          ))}
        </MangaGrid>
      </section>

      {/* Para você */}
      <section style={{marginBottom:32}}>
        <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:12, marginBottom:14, flexWrap:'wrap'}}>
          <div>
            <div style={{fontSize:11, fontWeight:800, color:'#ddda2a', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:4, display:'inline-flex', alignItems:'center', gap:6}}><Icon name="sparkle" size={13}/>Recomendações personalizadas</div>
            <h2 style={{fontSize:'clamp(18px, 4vw, 22px)', fontWeight:700, color:'#fff', margin:0, letterSpacing:'.0625rem'}}>Para você, Ruan</h2>
            <p style={{fontSize:12, color:'#999', margin:'4px 0 0'}}>Baseado nos seus gêneros favoritos{libGenres.size?` (${[...libGenres].slice(0,3).join(' · ')})`:''}</p>
          </div>
          <a href="#" onClick={e=>{e.preventDefault();}} style={{color:'#ddda2a', fontSize:12, fontWeight:700, textDecoration:'none', whiteSpace:'nowrap'}}>Ajustar preferências →</a>
        </div>
        <MangaGrid minW={140}>
          {forYouFallback.map(m => <MangaCard key={m.id} manga={m} onClick={() => onOpenTitle(m.id)}/>)}
        </MangaGrid>
      </section>

      {/* Community callout */}
      <section style={{background:'#252526', borderRadius:8, padding:'20px', border:'1px solid #444', marginBottom:32, display:'flex', gap:16, alignItems:'center', flexWrap:'wrap'}}>
        <img src="../../assets/illustrations/feliz.png" width="96" height="96" style={{objectFit:'contain', flexShrink:0}}/>
        <div style={{flex:'1 1 240px', minWidth:240}}>
          <div style={{fontSize:11, fontWeight:800, color:'#ddda2a', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:6}}>Comunidade</div>
          <h3 style={{fontSize:18, fontWeight:700, color:'#fff', margin:'0 0 6px', letterSpacing:'.0625rem'}}>Junte-se ao fórum da semana</h3>
          <p style={{fontSize:13, color:'#ccc', margin:'0 0 12px', lineHeight:1.55}}>3.241 leitores estão discutindo o capítulo 1120 de One Piece agora. Deixe sua teoria e faça amigos que amam mangá tanto quanto você.</p>
          <Button variant="raised" onClick={()=>onNav && onNav('forum')}>Entrar no tópico</Button>
        </div>
      </section>
    </div>
  );
}

function TitlePage({ id, onRead, library, toggleLib }) {
  const manga = window.MANGAS.find(m => m.id === id) || window.MANGAS[0];
  const [tab, setTab] = React.useState('reviews');
  return (
    <div className="page" style={{maxWidth:1040}}>
      <div className="title-head">
        <div className="title-poster">
          <div style={{width:'100%', aspectRatio:'2/3', background: manga.gradient, borderRadius:8, border:'1px solid #ddda2a', display:'flex', alignItems:'center', justifyContent:'center', fontSize:56, fontWeight:800, color:'rgba(221,218,42,.5)'}}>{manga.initial}</div>
        </div>
        <div style={{flex:1, minWidth:0}}>
          <Badge>{manga.status}</Badge>
          <h1 style={{fontSize:'clamp(24px, 5vw, 32px)', fontWeight:700, color:'#fff', margin:'10px 0 6px', letterSpacing:'.0625rem'}}>{manga.title}</h1>
          <div style={{fontSize:13, color:'#ccc', marginBottom:10}}>por <span style={{color:'#ddda2a', fontWeight:700}}>{manga.author}</span></div>
          <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:12, flexWrap:'wrap'}}>
            <Stars value={manga.rating} size={16}/>
            <span style={{fontSize:13, fontWeight:700, color:'#fff'}}>{manga.rating}</span>
            <span style={{fontSize:11, color:'#999'}}>· 2.431 reviews</span>
          </div>
          <div style={{display:'flex', gap:6, marginBottom:14, flexWrap:'wrap'}}>{manga.genre.map(g => <Badge key={g} variant="neutral">{g}</Badge>)}</div>
          <p style={{fontSize:13, color:'#ccc', lineHeight:1.7, marginBottom:18}}>{manga.synopsis}</p>
          <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
            <Button variant="primary" onClick={onRead}>Ler capítulo {manga.ch}</Button>
            <Button variant="raised" onClick={() => toggleLib(manga.id)}>{library.has(manga.id)?'✓ Na biblioteca':'+ Biblioteca'}</Button>
            <Button variant="ghost" icon="heart">Favoritar</Button>
          </div>
        </div>
      </div>

      <div style={{display:'flex', gap:4, borderBottom:'1px solid #444', marginBottom:20, overflowX:'auto'}}>
        {[['reviews','Reviews (2.431)'],['chapters','Capítulos'],['groups','Grupos']].map(([k,l]) => (
          <button key={k} onClick={() => setTab(k)} style={{padding:'12px 16px', background:'none', border:0, borderBottom:`2px solid ${tab===k?'#ddda2a':'transparent'}`, color: tab===k?'#ddda2a':'#999', fontSize:13, fontWeight:700, cursor:'pointer', fontFamily:'inherit', letterSpacing:'.0625rem', whiteSpace:'nowrap'}}>{l}</button>
        ))}
      </div>

      {tab === 'reviews' && (
        <div>
          <div style={{background:'#252526', border:'1px solid #444', borderRadius:8, padding:14, marginBottom:14, display:'flex', gap:12}}>
            <Avatar initials="RM" size={40}/>
            <div style={{flex:1, minWidth:0}}>
              <textarea placeholder="Compartilhe o que achou..." rows="3" style={{width:'100%', background:'#161616', color:'#fff', border:'1px solid #727273', borderRadius:2, padding:10, fontSize:13, fontFamily:'inherit', resize:'vertical', boxSizing:'border-box'}}/>
              <div style={{display:'flex', justifyContent:'flex-end', marginTop:10}}>
                <Button variant="primary">Publicar review</Button>
              </div>
            </div>
          </div>
          {window.COMMENTS.map((c, i) => (
            <div key={i} style={{display:'flex', gap:12, padding:14, background:'#252526', border:'1px solid #444', borderRadius:8, marginBottom:10}}>
              <Avatar initials={c.initials} color={c.color} size={40}/>
              <div style={{flex:1, minWidth:0}}>
                <div style={{display:'flex', alignItems:'baseline', gap:8, marginBottom:6, flexWrap:'wrap'}}>
                  <span style={{fontWeight:700, color:'#fff', fontSize:13}}>{c.user}</span>
                  <span style={{fontSize:11, color:'#999'}}>{c.when}</span>
                  {c.badge && <Badge>{c.badge}</Badge>}
                </div>
                <div style={{color:'#ccc', fontSize:13, lineHeight:1.6}}>{c.text}</div>
                <div style={{display:'flex', gap:14, marginTop:10, fontSize:11, color:'#999'}}>
                  <button style={{background:'none', border:0, color:'#999', cursor:'pointer', padding:0, fontSize:11, minHeight:32}}>▲ {c.up}</button>
                  <button style={{background:'none', border:0, color:'#999', cursor:'pointer', padding:0, fontSize:11, minHeight:32}}>▼ {c.down}</button>
                  <button style={{background:'none', border:0, color:'#999', cursor:'pointer', padding:0, fontSize:11, minHeight:32}}>Responder</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {tab === 'chapters' && (
        <div style={{background:'#252526', border:'1px solid #444', borderRadius:8, overflow:'hidden'}}>
          {Array.from({length:8}).map((_,i) => {
            const n = manga.ch - i;
            return (
              <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'14px 14px', borderBottom:'1px solid #333', fontSize:13, cursor:'pointer', gap:10}} onMouseEnter={e => e.currentTarget.style.background='rgba(221,218,42,0.08)'} onMouseLeave={e => e.currentTarget.style.background='none'}>
                <span style={{color:'#fff'}}><span style={{color:'#ddda2a', fontWeight:700}}>Cap. {n}</span> — O novo arco começa</span>
                <span style={{color:'#999', whiteSpace:'nowrap'}}>{i===0?'hoje':`${i}sem`}</span>
              </div>
            );
          })}
        </div>
      )}
      {tab === 'groups' && (
        <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:12}}>
          {['Scan Central','Otaku Translators','Panda Scans','Noturnos Scan'].map(g => (
            <div key={g} style={{background:'#252526', border:'1px solid #444', borderRadius:8, padding:12, display:'flex', gap:10, alignItems:'center'}}>
              <Avatar initials={g.split(' ').map(w=>w[0]).join('').slice(0,2)} color="#3a2a10" size={40}/>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontWeight:700, color:'#fff', fontSize:13}}>{g}</div>
                <div style={{fontSize:11, color:'#999'}}>1.2k membros · 42 obras</div>
              </div>
              <Badge variant="neutral">Ativo</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LibraryPage({ onOpenTitle, library }) {
  const [tab, setTab] = React.useState('reading');
  const tabs = [
    ['reading','Lendo', library.size],
    ['completed','Concluídos', 87],
    ['onhold','Em espera', 4],
    ['dropped','Largados', 1],
    ['planning','Planejados', 12],
  ];
  const list = window.MANGAS.filter(m => library.has(m.id)).length ? window.MANGAS.filter(m => library.has(m.id)) : window.MANGAS.slice(0,6);
  return (
    <div className="page">
      <h1 style={{fontSize:'clamp(24px, 5vw, 32px)', fontWeight:700, color:'#fff', margin:'0 0 6px', letterSpacing:'.0625rem'}}>Minha biblioteca</h1>
      <p style={{color:'#999', fontSize:13, marginBottom:20}}>Tudo que você está lendo, terminou, ou quer ler um dia.</p>
      <div style={{display:'flex', gap:4, borderBottom:'1px solid #444', marginBottom:20, overflowX:'auto', whiteSpace:'nowrap'}}>
        {tabs.map(([k,l,n]) => (
          <button key={k} onClick={() => setTab(k)} style={{padding:'12px 14px', background:'none', border:0, borderBottom:`2px solid ${tab===k?'#ddda2a':'transparent'}`, color: tab===k?'#ddda2a':'#999', fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', letterSpacing:'.0625rem'}}>{l} <span style={{fontWeight:400, opacity:.8}}>({n})</span></button>
        ))}
      </div>
      {list.length ? (
        <MangaGrid minW={140}>
          {list.map((m,i) => <MangaCard key={m.id} manga={m} onClick={() => onOpenTitle(m.id)} progress={Math.min(99, 20+i*12)}/>)}
        </MangaGrid>
      ) : (
        <div style={{textAlign:'center', padding:'60px 20px'}}>
          <img src="../../assets/illustrations/duvida.png" width="140" height="140"/>
          <h3 style={{color:'#fff', marginTop:10}}>Nada por aqui ainda</h3>
          <p style={{color:'#999', fontSize:13}}>Comece a explorar e adicione obras à sua lista.</p>
        </div>
      )}
    </div>
  );
}

function ProfilePage({ onOpenTitle, user, onLogout }) {
  const [editing, setEditing] = React.useState(false);
  const u = user || { initials:'RM', name:'Ruan Moraes', handle:'ruanmoraes', role:'Postador' };
  return (
    <div className="page" style={{maxWidth:1040}}>
      <div style={{background:'#252526', border:'1px solid #444', borderRadius:8, padding:18, display:'flex', gap:18, alignItems:'center', marginBottom:20, flexWrap:'wrap'}}>
        <Avatar initials="RM" size={80}/>
        <div style={{flex:'1 1 240px', minWidth:0}}>
          <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:4, flexWrap:'wrap'}}>
            <h1 style={{fontSize:'clamp(20px, 4vw, 24px)', fontWeight:700, color:'#fff', margin:0, letterSpacing:'.0625rem'}}>Ruan Moraes</h1>
            <Badge>Postador</Badge>
          </div>
          <div style={{fontSize:12, color:'#ccc', marginBottom:14}}>@ruanmoraes · Entrou em março de 2024</div>
          <div style={{display:'flex', gap:20, flexWrap:'wrap'}}>
            {[['Reviews','42'],['Biblioteca','124'],['Seguindo','18'],['Grupos','3']].map(([l,v]) => (
              <div key={l}><div style={{color:'#ddda2a', fontWeight:800, fontSize:18}}>{v}</div><div style={{fontSize:10, color:'#999', textTransform:'uppercase', letterSpacing:'.08em', fontWeight:700}}>{l}</div></div>
            ))}
          </div>
        </div>
        <div style={{display:'flex', gap:8, flexWrap:'wrap'}}>
          <Button variant="raised" icon="settings" onClick={()=>setEditing(true)}>Editar perfil</Button>
          {onLogout && <Button variant="ghost" onClick={onLogout}>Sair</Button>}
        </div>
      </div>

      <h2 style={{fontSize:18, fontWeight:700, color:'#fff', marginBottom:12, letterSpacing:'.0625rem'}}>Lendo agora</h2>
      <div style={{marginBottom:28}}>
        <MangaGrid minW={140}>
          {window.MANGAS.slice(0,4).map((m,i) => <MangaCard key={m.id} manga={m} onClick={() => onOpenTitle(m.id)} progress={40+i*15}/>)}
        </MangaGrid>
      </div>

      <h2 style={{fontSize:18, fontWeight:700, color:'#fff', marginBottom:12, letterSpacing:'.0625rem'}}>Últimas reviews</h2>
      <div>
        {window.COMMENTS.slice(0,2).map((c,i) => (
          <div key={i} style={{background:'#252526', border:'1px solid #444', borderRadius:8, padding:14, marginBottom:10, display:'flex', gap:12}}>
            <Avatar initials="RM" size={36}/>
            <div style={{flex:1, minWidth:0}}>
              <div style={{display:'flex', alignItems:'baseline', gap:8, marginBottom:6, flexWrap:'wrap'}}>
                <span style={{fontWeight:700, color:'#fff', fontSize:13}}>{['One Piece','Berserk'][i]}</span>
                <Stars value={5} size={13}/>
                <span style={{fontSize:11, color:'#999'}}>{c.when}</span>
              </div>
              <div style={{color:'#ccc', fontSize:13, lineHeight:1.6}}>{c.text}</div>
            </div>
          </div>
        ))}
      </div>
      {editing && <ProfileEditModal open={editing} onClose={()=>setEditing(false)}/>}
    </div>
  );
}

// ReaderPage agora vive em ReaderPage.jsx

function NewsPage() {
  const [filter, setFilter] = React.useState('ALL');
  const cats = [
    { key:'ALL', label:'Tudo' },
    { key:'APP', label:'O app' },
    { key:'MUNDO', label:'Mundo dos mangás' },
    { key:'COMUNIDADE', label:'Comunidade' },
  ];
  const items = (window.NEWS||[]).filter(n => filter==='ALL' || n.category===filter);
  const pinned = items.find(n => n.pinned);
  const rest = items.filter(n => !n.pinned);

  return (
    <div className="page" style={{maxWidth:1040}}>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:11, fontWeight:800, color:'#ddda2a', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:6, display:'inline-flex', alignItems:'center', gap:6}}><Icon name="news" size={13}/>Novidades</div>
        <h1 style={{fontSize:'clamp(24px, 5vw, 32px)', fontWeight:700, color:'#fff', margin:'0 0 8px', letterSpacing:'.0625rem'}}>O que rolou essa semana</h1>
        <p style={{color:'#ccc', fontSize:13, lineHeight:1.6, maxWidth:560, margin:0}}>Atualizações do app, notícias do mundo dos mangás e o melhor da comunidade — tudo em um só lugar.</p>
      </div>

      {/* filter chips */}
      <div style={{display:'flex', gap:6, marginBottom:20, overflowX:'auto', paddingBottom:4, flexWrap:'wrap'}}>
        {cats.map(c => {
          const active = filter===c.key;
          return (
            <button key={c.key} onClick={()=>setFilter(c.key)} style={{padding:'8px 14px', background: active?'#ddda2a':'transparent', color: active?'#161616':'#fff', border:`1px solid ${active?'#ddda2a':'#727273'}`, borderRadius:2, fontSize:12, fontWeight:700, cursor:'pointer', fontFamily:'inherit', letterSpacing:'.0625rem', whiteSpace:'nowrap', minHeight:36, textTransform:'uppercase'}}>{c.label}</button>
          );
        })}
      </div>

      {/* Pinned hero card */}
      {pinned && (
        <article style={{position:'relative', background: `linear-gradient(135deg, ${pinned.tone}25, #252526)`, border:'1px solid #ddda2a', borderRadius:8, padding:'20px', marginBottom:20, boxShadow:'-0.25rem 0.25rem 0 0 rgba(221,218,42,0.25)'}}>
          <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:10, flexWrap:'wrap'}}>
            <Badge>Fixado</Badge>
            <Badge variant="neutral">{pinned.category}</Badge>
            <span style={{fontSize:11, color:'#999', letterSpacing:'.05em'}}>{pinned.when}</span>
          </div>
          <h2 style={{fontSize:'clamp(18px, 4vw, 22px)', fontWeight:700, color:'#fff', margin:'0 0 8px', letterSpacing:'.0625rem'}}>{pinned.title}</h2>
          <p style={{fontSize:13, color:'#ccc', lineHeight:1.6, margin:'0 0 10px'}}>{pinned.excerpt}</p>
          <p style={{fontSize:13, color:'#ccc', lineHeight:1.6, margin:'0 0 14px'}}>{pinned.body}</p>
          <Button variant="raised">Ler mais</Button>
        </article>
      )}

      {/* timeline of remaining news */}
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:12}}>
        {rest.map(n => (
          <article key={n.id} style={{background:'#252526', border:'1px solid #444', borderRadius:8, padding:16, position:'relative', overflow:'hidden'}}>
            <div style={{position:'absolute', top:0, left:0, right:0, height:3, background:n.tone}}/>
            <div style={{display:'flex', alignItems:'center', gap:8, marginBottom:8, flexWrap:'wrap'}}>
              <Badge variant="neutral">{n.category}</Badge>
              <span style={{fontSize:11, color:'#999'}}>{n.when}</span>
            </div>
            <h3 style={{fontSize:15, fontWeight:700, color:'#fff', margin:'0 0 6px', letterSpacing:'.0625rem', lineHeight:1.3}}>{n.title}</h3>
            <p style={{fontSize:12, color:'#ccc', lineHeight:1.6, margin:'0 0 10px'}}>{n.excerpt}</p>
            <a href="#" onClick={e=>e.preventDefault()} style={{color:'#ddda2a', fontSize:12, fontWeight:700, textDecoration:'none'}}>Ler mais →</a>
          </article>
        ))}
      </div>

      {items.length === 0 && (
        <div style={{textAlign:'center', padding:'40px 20px', color:'#999'}}>Nada por aqui nessa categoria.</div>
      )}
    </div>
  );
}

Object.assign(window, { HomePage, TitlePage, LibraryPage, ProfilePage, NewsPage });
