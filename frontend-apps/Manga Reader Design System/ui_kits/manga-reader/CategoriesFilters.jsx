// CategoriesFilters.jsx — the filter sidebar / drawer for Categories page

function CatTagSelect({ selected, onChange }) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState('');
  const ref = React.useRef(null);

  React.useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  const all = window.ALL_TAGS || [];
  const filtered = all.filter(t => t.toLowerCase().includes(query.toLowerCase()));
  const toggle = (t) => {
    const next = selected.includes(t) ? selected.filter(x => x !== t) : [...selected, t];
    onChange(next);
  };

  return (
    <div ref={ref} style={{position:'relative'}}>
      {/* Selected tags as chips + entry */}
      <div onClick={()=>setOpen(true)} style={{
        minHeight:40, padding:'6px 8px',
        background:'#252526', border:`1px solid ${open?'#ddda2a':'#444'}`, borderRadius:2,
        display:'flex', flexWrap:'wrap', gap:4, alignItems:'center',
        cursor:'text',
      }}>
        {selected.map(t => (
          <span key={t} style={{display:'inline-flex', alignItems:'center', gap:4, padding:'3px 6px 3px 8px', background:'#ddda2a', color:'#161616', borderRadius:2, fontSize:11, fontWeight:700, letterSpacing:'.0625rem'}}>
            {t}
            <button onClick={(e)=>{e.stopPropagation(); toggle(t);}} style={{background:'none', border:0, color:'#161616', cursor:'pointer', padding:0, display:'flex', alignItems:'center'}}>
              <Icon name="close" size={12}/>
            </button>
          </span>
        ))}
        <input
          value={query}
          onChange={e=>{setQuery(e.target.value); setOpen(true);}}
          onFocus={()=>setOpen(true)}
          placeholder={selected.length===0 ? 'Buscar tags...' : ''}
          style={{flex:1, minWidth:80, height:28, padding:'0 4px', background:'transparent', color:'#fff', border:0, outline:'none', fontSize:13, fontFamily:'inherit', letterSpacing:'.0625rem'}}/>
      </div>

      {open && (
        <div style={{position:'absolute', top:'calc(100% + 4px)', left:0, right:0, background:'#161616', border:'1px solid #444', borderRadius:2, maxHeight:240, overflowY:'auto', zIndex:10, boxShadow:'-0.25rem 0.25rem 0 0 rgba(221,218,42,0.25)'}}>
          {filtered.length === 0 && <div style={{padding:12, fontSize:12, color:'#999'}}>Nenhuma tag encontrada</div>}
          {filtered.map(t => {
            const active = selected.includes(t);
            return (
              <button key={t} onClick={()=>toggle(t)} style={{
                display:'flex', alignItems:'center', gap:8, width:'100%',
                background: active?'rgba(221,218,42,0.12)':'none', border:0,
                color: active?'#ddda2a':'#fff',
                padding:'8px 10px', fontSize:12, cursor:'pointer',
                fontFamily:'inherit', letterSpacing:'.0625rem', textAlign:'left',
              }}>
                <span style={{width:14, height:14, border:`1px solid ${active?'#ddda2a':'#727273'}`, borderRadius:2, display:'flex', alignItems:'center', justifyContent:'center', background: active?'#ddda2a':'transparent'}}>
                  {active && <Icon name="check" size={10}/>}
                </span>
                {t}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CatFilterPanel({ filters, setFilters, onClear }) {
  const setF = (k, v) => setFilters({ ...filters, [k]: v });
  const statuses = window.STATUS_OPTIONS || [];

  return (
    <div>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14}}>
        <div style={{fontSize:12, fontWeight:800, color:'#fff', textTransform:'uppercase', letterSpacing:'.08em'}}>Filtros</div>
        <button onClick={onClear} style={{background:'none', border:0, color:'#FF784F', fontSize:11, fontWeight:700, cursor:'pointer', padding:0, fontFamily:'inherit', letterSpacing:'.0625rem'}}>Limpar tudo</button>
      </div>

      <div style={{marginBottom:18}}>
        <div style={{fontSize:11, fontWeight:800, color:'#ddda2a', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:6}}>Tags</div>
        <CatTagSelect selected={filters.tags} onChange={(v)=>setF('tags', v)}/>
        {filters.tags.length > 0 && <div style={{fontSize:11, color:'#999', marginTop:6}}>{filters.tags.length} tag{filters.tags.length===1?'':'s'} selecionada{filters.tags.length===1?'':'s'}</div>}
      </div>

      <div style={{marginBottom:18}}>
        <div style={{fontSize:11, fontWeight:800, color:'#ddda2a', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:6}}>Situação</div>
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:6}}>
          {statuses.map(s => {
            const active = filters.status.includes(s.key);
            return (
              <button key={s.key} onClick={()=>{
                const next = active ? filters.status.filter(x=>x!==s.key) : [...filters.status, s.key];
                setF('status', next);
              }} style={{
                display:'flex', alignItems:'center', gap:6,
                padding:'8px 10px',
                background: active?'rgba(221,218,42,0.12)':'#252526',
                border:`1px solid ${active?'#ddda2a':'#444'}`, borderRadius:2,
                color: active?'#ddda2a':'#fff',
                fontSize:11, fontWeight:700, cursor:'pointer',
                fontFamily:'inherit', letterSpacing:'.0625rem', textAlign:'left',
                minHeight:36,
              }}>
                <span style={{width:8, height:8, borderRadius:999, background:s.tone, flexShrink:0}}/>
                {s.label}
              </button>
            );
          })}
        </div>
      </div>

      <div style={{marginBottom:18, padding:12, background:'rgba(255,120,79,0.08)', border:'1px solid rgba(255,120,79,0.4)', borderRadius:4}}>
        <div style={{display:'flex', alignItems:'flex-start', gap:10}}>
          <div style={{flex:1, minWidth:0}}>
            <div style={{display:'flex', alignItems:'center', gap:6, marginBottom:4}}>
              <span style={{padding:'1px 5px', background:'#FF784F', color:'#fff', fontSize:10, fontWeight:800, borderRadius:2, letterSpacing:'.0625rem'}}>+18</span>
              <span style={{fontSize:12, fontWeight:700, color:'#fff', letterSpacing:'.0625rem'}}>Conteúdo adulto</span>
            </div>
            <div style={{fontSize:11, color:'#ccc', lineHeight:1.5}}>Exibe obras com violência gráfica, conteúdo sexual ou temas pesados.</div>
          </div>
          <PEToggle checked={filters.adult} onChange={v=>setF('adult', v)}/>
        </div>
      </div>
    </div>
  );
}

window.CatFilterPanel = CatFilterPanel;
window.CatTagSelect = CatTagSelect;
