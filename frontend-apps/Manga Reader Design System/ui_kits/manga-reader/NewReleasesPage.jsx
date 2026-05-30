// NewReleasesPage.jsx — "Lançamentos" — feed de novos capítulos.
// Mobile-first: cards verticais full-width → 2 cols tablet → 3 cols desktop.

function NewReleasesPage({ onOpenTitle, onNav }) {
  const [bucket, setBucket] = React.useState('todos'); // todos | hoje | semana | mes
  const [lang, setLang] = React.useState('todos');
  const [scan, setScan] = React.useState('todos');
  const [grouping, setGrouping] = React.useState('tempo'); // tempo | obra

  const releases = window.RELEASES || [];

  const filtered = releases.filter(r => {
    if (bucket !== 'todos' && window.releaseBucket(r.t) !== bucket) return false;
    if (lang !== 'todos' && r.lang !== lang) return false;
    if (scan !== 'todos' && r.scan !== scan) return false;
    return true;
  });

  const buckets = [
    { key:'todos',  label:'Tudo',     count: releases.length },
    { key:'hoje',   label:'Hoje',     count: releases.filter(r=>window.releaseBucket(r.t)==='hoje').length },
    { key:'semana', label:'Semana',   count: releases.filter(r=>window.releaseBucket(r.t)==='semana').length },
    { key:'mes',    label:'Mês',      count: releases.filter(r=>window.releaseBucket(r.t)==='mes').length },
  ];

  const scans = ['todos', ...new Set(releases.map(r => r.scan))];

  // Agrupamento temporal — agrupa releases por dia/semana
  const groups = grouping === 'tempo'
    ? groupByTime(filtered)
    : groupByManga(filtered);

  return (
    <div className="page nr-page" data-screen-label="new-releases">
      {/* ============ HEADER ============ */}
      <div className="nr-header">
        <div>
          <div className="mr-label" style={{color:'#ddda2a', marginBottom:6, display:'inline-flex', alignItems:'center', gap:6}}>
            <Icon name="sparkle" size={13}/>Atualizações recentes
          </div>
          <h1 className="nr-title">Lançamentos</h1>
          <p className="nr-subtitle">
            Novos capítulos de mangás, manhwas e manhuas que você acompanha — atualizados em tempo real pelos grupos de tradução.
          </p>
        </div>
        <div className="nr-livecount">
          <div className="nr-livecount-dot"/>
          <div>
            <div style={{fontSize:11, color:'#999', textTransform:'uppercase', letterSpacing:'.08em', fontWeight:700}}>Hoje</div>
            <div style={{fontSize:22, fontWeight:800, color:'#fff', lineHeight:1, marginTop:2}}>
              {releases.filter(r=>window.releaseBucket(r.t)==='hoje').length} <span style={{fontSize:12, color:'#999', fontWeight:600}}>novos cap.</span>
            </div>
          </div>
        </div>
      </div>

      {/* ============ TIMELINE BUCKETS (chips) ============ */}
      <div className="nr-buckets">
        {buckets.map(b => {
          const active = bucket === b.key;
          return (
            <button key={b.key} onClick={()=>setBucket(b.key)} className={`nr-bucket ${active?'active':''}`}>
              <span className="nr-bucket-label">{b.label}</span>
              <span className="nr-bucket-count">{b.count}</span>
            </button>
          );
        })}
      </div>

      {/* ============ FILTROS SECUNDÁRIOS ============ */}
      <div className="nr-filters">
        <label className="nr-filter">
          <span className="mr-label">Idioma</span>
          <select value={lang} onChange={e=>setLang(e.target.value)} className="nr-select">
            <option value="todos">Todos</option>
            <option value="pt-BR">Português (BR)</option>
            <option value="en">Inglês</option>
            <option value="es">Espanhol</option>
          </select>
        </label>
        <label className="nr-filter">
          <span className="mr-label">Grupo de scan</span>
          <select value={scan} onChange={e=>setScan(e.target.value)} className="nr-select">
            {scans.map(s => <option key={s} value={s}>{s==='todos'?'Todos':s}</option>)}
          </select>
        </label>
        <label className="nr-filter">
          <span className="mr-label">Agrupar por</span>
          <div className="nr-toggle">
            <button onClick={()=>setGrouping('tempo')} className={grouping==='tempo'?'active':''}>Tempo</button>
            <button onClick={()=>setGrouping('obra')} className={grouping==='obra'?'active':''}>Obra</button>
          </div>
        </label>
        <button className="nr-refresh" onClick={()=>{}}>
          <Icon name="refresh" size={14}/>Atualizar feed
        </button>
      </div>

      {/* ============ FEATURED — primeiro release hot ============ */}
      {(() => {
        const hero = filtered.find(r => r.hot);
        if (!hero) return null;
        const m = window.MANGAS.find(x => x.id === hero.mangaId);
        return (
          <article className="nr-featured" onClick={() => onOpenTitle(hero.mangaId)}>
            <div className="nr-featured-poster" style={{background: m.gradient}}>
              <span className="nr-featured-initial">{m.initial}</span>
              <span className="nr-featured-pages">{hero.pages} págs.</span>
            </div>
            <div className="nr-featured-body">
              <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:8, flexWrap:'wrap'}}>
                <span className="nr-badge-new">NOVO</span>
                <Badge variant="neutral">{m.genre[0]}</Badge>
                <span style={{fontSize:11, color:'#999', display:'inline-flex', alignItems:'center', gap:4}}>
                  <Icon name="clock" size={11}/>{window.relativeTime(hero.t)}
                </span>
              </div>
              <div className="nr-featured-eyebrow">{m.title} · <span style={{color:'#ddda2a'}}>Cap. {hero.chapter}</span></div>
              <h2 className="nr-featured-title">{hero.title}</h2>
              <div className="nr-featured-meta">
                <div className="nr-featured-meta-item">
                  <span className="mr-label">Grupo</span>
                  <span style={{color:'#fff', fontWeight:700, fontSize:13}}>{hero.scan}</span>
                </div>
                <div className="nr-featured-meta-item">
                  <span className="mr-label">Páginas</span>
                  <span style={{color:'#fff', fontWeight:700, fontSize:13}}>{hero.pages}</span>
                </div>
                <div className="nr-featured-meta-item">
                  <span className="mr-label">Idioma</span>
                  <span style={{color:'#fff', fontWeight:700, fontSize:13}}>{labelLang(hero.lang)}</span>
                </div>
                {hero.verified && (
                  <div className="nr-featured-meta-item">
                    <span className="mr-label">Status</span>
                    <span style={{color:'#ddda2a', fontWeight:700, fontSize:13, display:'inline-flex', alignItems:'center', gap:4}}>
                      <Icon name="check" size={12}/>Verificado
                    </span>
                  </div>
                )}
              </div>
              <div style={{display:'flex', gap:8, marginTop:14, flexWrap:'wrap'}}>
                <Button variant="primary" icon="bookmark">Ler agora</Button>
                <Button variant="raised">Ver obra</Button>
              </div>
            </div>
          </article>
        );
      })()}

      {/* ============ TIMELINE / GROUPED FEED ============ */}
      {groups.length === 0 ? (
        <div style={{textAlign:'center', padding:'60px 20px'}}>
          <img src="../../assets/illustrations/duvida.png" width="120" height="120" alt=""/>
          <h3 style={{color:'#fff', marginTop:10, letterSpacing:'.0625rem'}}>Sem novidades aqui</h3>
          <p style={{color:'#999', fontSize:13}}>Tente ajustar os filtros para ver mais lançamentos.</p>
        </div>
      ) : (
        <div className="nr-timeline">
          {groups.map(group => (
            <section key={group.key} className="nr-tl-group">
              <div className="nr-tl-header">
                <div className="nr-tl-dot"/>
                <h3 className="nr-tl-heading">{group.label}</h3>
                <span className="nr-tl-count">{group.items.length} {group.items.length===1?'capítulo':'capítulos'}</span>
                <div className="nr-tl-rule"/>
              </div>
              <div className="nr-tl-grid">
                {group.items.map(r => {
                  const m = window.MANGAS.find(x => x.id === r.mangaId);
                  const fresh = r.t < 360; // < 6h
                  return (
                    <article key={r.id} className="nr-card" onClick={()=>onOpenTitle(r.mangaId)}>
                      {fresh && <span className="nr-badge-new nr-card-new">NOVO</span>}
                      <div className="nr-card-poster" style={{background: m.gradient}}>
                        <span className="nr-card-initial">{m.initial}</span>
                      </div>
                      <div className="nr-card-body">
                        <div className="nr-card-meta-top">
                          <span style={{color:'#ddda2a', fontWeight:800, fontSize:11, letterSpacing:'.08em', textTransform:'uppercase'}}>Cap. {r.chapter}</span>
                          <span style={{fontSize:11, color:'#999'}}>·</span>
                          <span style={{fontSize:11, color:'#999', display:'inline-flex', alignItems:'center', gap:3}}>
                            <Icon name="clock" size={10}/>{window.relativeTime(r.t)}
                          </span>
                        </div>
                        <div className="nr-card-manga">{m.title}</div>
                        <div className="nr-card-title">{r.title}</div>
                        <div className="nr-card-footer">
                          <div className="nr-card-scan">
                            <Avatar initials={r.scan.split(' ').map(w=>w[0]).join('').slice(0,2).toUpperCase()} color="#3a3a1f" size={22}/>
                            <span>{r.scan}</span>
                            {r.verified && <Icon name="check" size={12}/>}
                          </div>
                          <span style={{fontSize:11, color:'#727273', fontWeight:600}}>{r.pages}p · {labelLang(r.lang)}</span>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* ============ LOAD MORE ============ */}
      <div className="nr-loadmore">
        <Button variant="raised" icon="refresh">Carregar mais lançamentos</Button>
        <p style={{fontSize:11, color:'#727273', marginTop:10}}>Atualizado há 2 min · Próxima atualização automática em 30 seg</p>
      </div>
    </div>
  );
}

// ===== helpers =====
function labelLang(code) {
  return { 'pt-BR':'PT-BR', 'en':'EN', 'es':'ES', 'ja':'JA' }[code] || code;
}

function groupByTime(list) {
  const groups = {
    hoje:    { key:'hoje',    label:'Hoje',          items:[] },
    ontem:   { key:'ontem',   label:'Ontem',         items:[] },
    semana:  { key:'semana',  label:'Esta semana',   items:[] },
    mes:     { key:'mes',     label:'Este mês',      items:[] },
    antigo:  { key:'antigo',  label:'Mais antigos',  items:[] },
  };
  list.forEach(r => {
    if (r.t < 1440)       groups.hoje.items.push(r);
    else if (r.t < 2880)  groups.ontem.items.push(r);
    else if (r.t < 10080) groups.semana.items.push(r);
    else if (r.t < 43200) groups.mes.items.push(r);
    else                   groups.antigo.items.push(r);
  });
  return Object.values(groups).filter(g => g.items.length);
}

function groupByManga(list) {
  const byId = {};
  list.forEach(r => { (byId[r.mangaId] = byId[r.mangaId] || []).push(r); });
  return Object.entries(byId).map(([id, items]) => {
    const m = window.MANGAS.find(x => x.id === id);
    return { key:id, label:m.title, items };
  });
}

window.NewReleasesPage = NewReleasesPage;
