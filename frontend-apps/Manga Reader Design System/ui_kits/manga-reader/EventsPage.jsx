// EventsPage.jsx — index page (especiais + normais + filtros + busca)

function EventsPage({ onOpenEvent }) {
  const all = window.EVENTS || [];
  const [filter, setFilter] = React.useState('all');
  const [query, setQuery] = React.useState('');

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter(ev => {
      const status = window.eventStatus(ev);
      if (filter === 'special' && ev.type !== 'special') return false;
      if (filter === 'normal'  && ev.type !== 'normal')  return false;
      if (filter === 'active'  && status !== 'active')   return false;
      if (filter === 'ended'   && status !== 'ended')    return false;
      if (q && !ev.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [all, filter, query]);

  const specials = filtered.filter(e => e.type === 'special');
  const normals  = filtered.filter(e => e.type === 'normal');

  const filters = [
    { id:'all',      label:'Todos' },
    { id:'special',  label:'Especiais' },
    { id:'normal',   label:'Normais' },
    { id:'active',   label:'Ativos' },
    { id:'ended',    label:'Encerrados' },
  ];

  return (
    <div className="page" data-screen-label="events">
      {/* Header */}
      <div style={{marginBottom:24}}>
        <div style={{fontSize:11,fontWeight:800,color:'#ddda2a',textTransform:'uppercase',letterSpacing:'.12em',marginBottom:6}}>
          Comunidade
        </div>
        <h1 style={{fontSize:'clamp(24px,5vw,32px)',color:'#fff',margin:'0 0 8px',letterSpacing:'.0625rem',fontWeight:800}}>
          Eventos
        </h1>
        <p style={{color:'#999',fontSize:14,margin:0,maxWidth:540,lineHeight:1.5}}>
          Concursos, leituras coletivas, especiais sazonais e tudo o que rola por tempo limitado na plataforma.
        </p>
      </div>

      {/* Search + filter pills */}
      <div style={{display:'flex',flexDirection:'column',gap:12,marginBottom:28}}>
        <div style={{position:'relative'}}>
          <span style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:'#666',fontSize:14}}>⌕</span>
          <input
            type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Buscar evento por nome…"
            style={{
              width:'100%',padding:'12px 16px 12px 38px',
              background:'#1a1a1a',border:'1px solid #2a2a2a',borderRadius:2,
              color:'#fff',fontSize:14,letterSpacing:'.0625rem',outline:'none',
              transition:'border-color .15s',
            }}
            onFocus={e => e.target.style.borderColor = '#ddda2a'}
            onBlur={e => e.target.style.borderColor = '#2a2a2a'}
          />
        </div>
        <div style={{display:'flex',gap:8,overflowX:'auto',paddingBottom:4,marginLeft:-12,paddingLeft:12,marginRight:-12,paddingRight:12}}>
          {filters.map(f => {
            const active = filter === f.id;
            return (
              <button key={f.id} onClick={() => setFilter(f.id)}
                style={{
                  flexShrink:0,padding:'8px 16px',
                  background: active ? '#ddda2a' : 'transparent',
                  color: active ? '#161616' : '#bbb',
                  border:`1px solid ${active ? '#ddda2a' : '#2a2a2a'}`,
                  borderRadius:2,fontSize:12,fontWeight:700,
                  letterSpacing:'.08em',textTransform:'uppercase',
                  cursor:'pointer',transition:'all .15s',
                }}>
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Especiais */}
      {specials.length > 0 && (
        <section style={{marginBottom:36}}>
          <SectionHeader icon="✦" label="Eventos Especiais" count={specials.length}/>
          <div className="events-special-grid" style={{
            display:'grid', gap:18,
            gridTemplateColumns:'minmax(0, 1fr)',
          }}>
            {specials.map(ev => <EventSpecialCard key={ev.id} event={ev} onOpen={onOpenEvent}/>)}
          </div>
        </section>
      )}

      {/* Normais */}
      {normals.length > 0 && (
        <section>
          <SectionHeader icon="●" label="Eventos Normais" count={normals.length}/>
          <div className="events-normal-grid" style={{
            display:'grid', gap:12,
            gridTemplateColumns:'minmax(0, 1fr)',
          }}>
            {normals.map(ev => <EventNormalCard key={ev.id} event={ev} onOpen={onOpenEvent}/>)}
          </div>
        </section>
      )}

      {filtered.length === 0 && (
        <div style={{textAlign:'center',padding:'60px 20px',color:'#666'}}>
          <div style={{fontSize:36,marginBottom:8}}>⚐</div>
          <div style={{fontSize:14,color:'#999'}}>Nenhum evento corresponde a esses filtros.</div>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ icon, label, count }) {
  return (
    <div style={{display:'flex',alignItems:'baseline',gap:10,marginBottom:14,paddingBottom:10,borderBottom:'1px solid #222'}}>
      <span style={{color:'#ddda2a',fontSize:14}}>{icon}</span>
      <h2 style={{fontSize:16,fontWeight:800,color:'#fff',margin:0,letterSpacing:'.08em',textTransform:'uppercase'}}>{label}</h2>
      <span style={{fontSize:12,color:'#666',marginLeft:'auto'}}>{count}</span>
    </div>
  );
}

window.EventsPage = EventsPage;
