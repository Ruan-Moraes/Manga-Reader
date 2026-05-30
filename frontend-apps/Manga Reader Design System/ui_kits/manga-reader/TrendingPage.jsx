// TrendingPage.jsx — "Em alta" — descoberta de obras populares.
// Mobile-first: stack vertical → 2 cols tablet → 3-5 cols desktop.

function TrendingPage({ onOpenTitle, library, toggleLib, onNav }) {
  const [period, setPeriod] = React.useState('semana'); // dia | semana | mes

  // Top da semana — ordenado por viewsWeek (numeral parsing tosco mas suficiente p/ mock)
  const parseViews = (s) => {
    const n = parseFloat(s);
    if (s.endsWith('M')) return n * 1_000_000;
    if (s.endsWith('k')) return n * 1_000;
    return n;
  };
  const ranked = [...window.MANGAS].sort((a,b) => {
    const av = parseViews(window.MANGA_STATS[a.id]?.viewsWeek || '0');
    const bv = parseViews(window.MANGA_STATS[b.id]?.viewsWeek || '0');
    return bv - av;
  });

  const heroManga = ranked[0];
  const heroStats = window.MANGA_STATS[heroManga.id];

  const top10 = ranked.slice(0, 10);
  const climbers = [...window.MANGAS]
    .filter(m => (window.MANGA_STATS[m.id]?.trend || '').startsWith('+'))
    .sort((a,b) => parseInt(window.MANGA_STATS[b.id].trend) - parseInt(window.MANGA_STATS[a.id].trend))
    .slice(0, 6);

  // Géneros em destaque — agrupa por primeiro gênero
  const byGenre = {};
  ranked.forEach(m => { const g = m.genre[0]; (byGenre[g] = byGenre[g] || []).push(m); });
  const featuredGenres = Object.entries(byGenre).slice(0, 3);

  return (
    <div className="page trending-page" data-screen-label="trending">
      {/* ============ HERO ============ */}
      <section className="trending-hero">
        <div className="trending-hero-poster" style={{background: heroManga.gradient}}>
          <div className="trending-hero-initial">{heroManga.initial}</div>
          <div className="trending-hero-rank">
            <div className="mr-label" style={{color:'#161616', fontSize:9}}>#1 esta semana</div>
          </div>
        </div>
        <div className="trending-hero-copy">
          <div style={{display:'flex', gap:6, alignItems:'center', marginBottom:12, flexWrap:'wrap'}}>
            <Badge>Top 1 da semana</Badge>
            <Badge variant="neutral">{heroStats.trend} vs. semana passada</Badge>
          </div>
          <h1 className="trending-hero-title">{heroManga.title}</h1>
          <div style={{display:'flex', gap:6, margin:'6px 0 14px', flexWrap:'wrap'}}>
            {heroManga.genre.map(g => <Badge key={g} variant="neutral">{g}</Badge>)}
          </div>
          <p className="trending-hero-synopsis">{heroManga.synopsis}</p>

          <div className="trending-hero-stats">
            <div className="th-stat"><div className="th-stat-v">{heroManga.rating}</div><div className="th-stat-l">Nota</div></div>
            <div className="th-stat"><div className="th-stat-v">{heroStats.views}</div><div className="th-stat-l">Views</div></div>
            <div className="th-stat"><div className="th-stat-v">{heroManga.ch}</div><div className="th-stat-l">Capítulos</div></div>
            <div className="th-stat"><div className="th-stat-v" style={{fontSize:14}}>{heroStats.lastChWhen}</div><div className="th-stat-l">Último cap.</div></div>
          </div>

          <div style={{display:'flex', gap:10, flexWrap:'wrap'}}>
            <Button variant="primary" icon="bookmark" onClick={() => onOpenTitle(heroManga.id)}>Começar a ler</Button>
            <Button variant="raised" onClick={() => toggleLib(heroManga.id)}>{library.has(heroManga.id)?'✓ Na biblioteca':'+ Biblioteca'}</Button>
          </div>
        </div>
      </section>

      {/* ============ PERIOD SWITCHER ============ */}
      <section style={{marginBottom:20}}>
        <div style={{display:'flex', alignItems:'center', gap:12, marginBottom:14, flexWrap:'wrap', justifyContent:'space-between'}}>
          <div>
            <div style={{fontSize:11, fontWeight:800, color:'#ddda2a', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:4, display:'inline-flex', alignItems:'center', gap:6}}><Icon name="trending" size={13}/>Ranking</div>
            <h2 style={{fontSize:'clamp(18px, 4vw, 22px)', fontWeight:700, color:'#fff', margin:0, letterSpacing:'.0625rem'}}>Top 10 mais lidos</h2>
          </div>
          <div className="th-segmented">
            {[['dia','Hoje'],['semana','Semana'],['mes','Mês']].map(([k,l]) => (
              <button key={k} onClick={()=>setPeriod(k)} className={`th-segmented-btn ${period===k?'active':''}`}>{l}</button>
            ))}
          </div>
        </div>

        {/* Top 10 — scroll horizontal mobile, grid 2/5 cols tablet/desktop */}
        <div className="th-top10">
          {top10.map((m, i) => {
            const st = window.MANGA_STATS[m.id];
            const climbing = (st?.trend || '').startsWith('+');
            return (
              <a key={m.id} href="#" onClick={(e)=>{e.preventDefault(); onOpenTitle(m.id);}} className="th-top10-card">
                <div className="th-top10-rank">{i+1}</div>
                <div className="th-top10-poster" style={{background: m.gradient}}>
                  <div className="th-top10-initial">{m.initial}</div>
                  <div className="th-top10-rating">★ {m.rating}</div>
                </div>
                <div className="th-top10-meta">
                  <div className="th-top10-title">{m.title}</div>
                  <div className="th-top10-row">
                    <span className="th-top10-views"><Icon name="eye" size={11}/>{st.viewsWeek}</span>
                    <span className={`th-top10-trend ${climbing?'up':'down'}`}>{st.trend}</span>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </section>

      {/* ============ TENDÊNCIA ATUAL ============ */}
      <section style={{marginBottom:32}}>
        <SectionHeader icon="trending" eyebrow="Subindo rápido" title="Quem está crescendo agora" onSeeAll={()=>{}}/>
        <div className="th-climbers">
          {climbers.map((m, i) => {
            const st = window.MANGA_STATS[m.id];
            return (
              <a key={m.id} href="#" onClick={(e)=>{e.preventDefault(); onOpenTitle(m.id);}} className="th-climber">
                <div className="th-climber-pos">{i+1}</div>
                <div className="th-climber-poster" style={{background: m.gradient}}>
                  <span style={{fontSize:18, fontWeight:800, color:'rgba(221,218,42,.4)'}}>{m.initial}</span>
                </div>
                <div className="th-climber-body">
                  <div className="th-climber-title">{m.title}</div>
                  <div className="th-climber-meta">
                    <span style={{color:'#cccccc'}}>{m.genre[0]}</span>
                    <span style={{color:'#727273'}}>·</span>
                    <span style={{color:'#cccccc'}}>{m.status}</span>
                  </div>
                  <div className="th-climber-bar">
                    <div className="th-climber-bar-fill" style={{width:`${Math.min(100, parseInt(st.trend))*2}%`}}/>
                  </div>
                </div>
                <div className="th-climber-trend">
                  <span style={{fontSize:18, fontWeight:800, color:'#ddda2a', letterSpacing:'.02em'}}>{st.trend}</span>
                  <span style={{fontSize:10, color:'#999', textTransform:'uppercase', letterSpacing:'.08em', fontWeight:700}}>7 dias</span>
                </div>
              </a>
            );
          })}
        </div>
      </section>

      {/* ============ EM ALTA POR GÊNERO ============ */}
      {featuredGenres.map(([g, list]) => (
        <section key={g} style={{marginBottom:32}}>
          <SectionHeader icon="compass" eyebrow={`Em alta · ${g}`} title={`O melhor de ${g} agora`} onSeeAll={()=>onNav && onNav('genres')}/>
          <MangaGrid minW={140}>
            {list.slice(0, 6).map(m => {
              const st = window.MANGA_STATS[m.id];
              const trending = (st?.trend || '').startsWith('+') && parseInt(st.trend) >= 20;
              return <MangaCard key={m.id} manga={m} onClick={() => onOpenTitle(m.id)} tag={trending?'Em alta':null}/>;
            })}
          </MangaGrid>
        </section>
      ))}

      {/* ============ COMMUNITY CALLOUT ============ */}
      <section className="th-callout">
        <img src="../../assets/illustrations/surpresa.png" width="84" height="84" style={{objectFit:'contain', flexShrink:0}} alt=""/>
        <div style={{flex:'1 1 240px', minWidth:0}}>
          <div className="mr-label" style={{color:'#ddda2a', marginBottom:6}}>Acompanhe semanalmente</div>
          <h3 style={{fontSize:17, fontWeight:700, color:'#fff', margin:'0 0 6px', letterSpacing:'.0625rem'}}>O ranking muda toda segunda</h3>
          <p style={{fontSize:13, color:'#ccc', margin:'0 0 12px', lineHeight:1.55}}>Receba uma notificação quando seu mangá favorito entrar ou sair do top 10. Sem spam — só o essencial.</p>
          <Button variant="raised" icon="bell">Ativar notificações</Button>
        </div>
      </section>
    </div>
  );
}

window.TrendingPage = TrendingPage;
