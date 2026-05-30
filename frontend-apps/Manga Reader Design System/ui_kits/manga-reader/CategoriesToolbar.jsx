// CategoriesToolbar.jsx — search + sort + active filter chips for Categories

function CatSortSelect({ value, onChange }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef(null);
  React.useEffect(() => {
    const onDoc = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  const opts = window.SORT_OPTIONS || [];
  const cur = opts.find(o => o.key === value) || opts[0];
  return (
    <div ref={ref} style={{position:'relative', flexShrink:0}}>
      <button onClick={()=>setOpen(o=>!o)} style={{
        display:'inline-flex', alignItems:'center', gap:6,
        height:40, padding:'0 12px',
        background:'#252526', border:`1px solid ${open?'#ddda2a':'#444'}`, borderRadius:2,
        color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer',
        fontFamily:'inherit', letterSpacing:'.0625rem',
      }}>
        <Icon name={cur.icon} size={14}/>
        <span>{cur.label}</span>
        <Icon name="chevronD" size={12}/>
      </button>
      {open && (
        <div style={{position:'absolute', top:'calc(100% + 4px)', right:0, minWidth:200, background:'#161616', border:'1px solid #444', borderRadius:2, zIndex:10, boxShadow:'-0.25rem 0.25rem 0 0 rgba(221,218,42,0.25)', overflow:'hidden'}}>
          {opts.map(o => {
            const active = o.key === value;
            return (
              <button key={o.key} onClick={()=>{onChange(o.key); setOpen(false);}} style={{
                display:'flex', alignItems:'center', gap:8, width:'100%',
                background: active?'rgba(221,218,42,0.12)':'none', border:0,
                borderLeft:`2px solid ${active?'#ddda2a':'transparent'}`,
                color: active?'#ddda2a':'#fff',
                padding:'10px 12px', fontSize:12, fontWeight:600, cursor:'pointer',
                fontFamily:'inherit', letterSpacing:'.0625rem', textAlign:'left',
              }}>
                <Icon name={o.icon} size={14}/>
                {o.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CatActiveChips({ filters, setFilters }) {
  const statuses = window.STATUS_OPTIONS || [];
  const items = [];
  filters.tags.forEach(t => items.push({ key:`tag-${t}`, label:t, onRemove:()=>setFilters({...filters, tags: filters.tags.filter(x=>x!==t)}) }));
  filters.status.forEach(s => {
    const lbl = (statuses.find(x=>x.key===s)||{}).label || s;
    items.push({ key:`st-${s}`, label:lbl, onRemove:()=>setFilters({...filters, status: filters.status.filter(x=>x!==s)}) });
  });
  if (filters.adult) items.push({ key:'adult', label:'+18 ativo', onRemove:()=>setFilters({...filters, adult:false}) });
  if (filters.search) items.push({ key:'q', label:`"${filters.search}"`, onRemove:()=>setFilters({...filters, search:''}) });
  if (items.length === 0) return null;
  return (
    <div style={{display:'flex', flexWrap:'wrap', gap:6, marginBottom:14}}>
      {items.map(it => (
        <span key={it.key} style={{display:'inline-flex', alignItems:'center', gap:4, padding:'4px 6px 4px 10px', background:'#252526', border:'1px solid #444', borderRadius:2, fontSize:11, color:'#fff', fontWeight:700, letterSpacing:'.0625rem'}}>
          {it.label}
          <button onClick={it.onRemove} style={{background:'none', border:0, color:'#999', cursor:'pointer', padding:2, display:'flex', alignItems:'center'}}>
            <Icon name="close" size={12}/>
          </button>
        </span>
      ))}
    </div>
  );
}

function CatToolbar({ filters, setFilters, sort, setSort, total, onOpenFilters }) {
  return (
    <div>
      <div style={{display:'flex', gap:8, alignItems:'center', marginBottom:12, flexWrap:'wrap'}}>
        <button onClick={onOpenFilters} className="cat-filters-btn" style={{
          display:'none', alignItems:'center', gap:6, height:40, padding:'0 12px',
          background:'#252526', border:'1px solid #444', borderRadius:2,
          color:'#fff', fontSize:12, fontWeight:700, cursor:'pointer',
          fontFamily:'inherit', letterSpacing:'.0625rem', flexShrink:0,
        }}>
          <Icon name="filter" size={14}/>
          Filtros
          {(filters.tags.length + filters.status.length + (filters.adult?1:0)) > 0 && (
            <span style={{background:'#ddda2a', color:'#161616', fontSize:10, padding:'1px 6px', borderRadius:999, fontWeight:800}}>{filters.tags.length + filters.status.length + (filters.adult?1:0)}</span>
          )}
        </button>

        <div style={{flex:1, minWidth:200, position:'relative'}}>
          <div style={{position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#727273'}}><Icon name="search" size={14}/></div>
          <input
            value={filters.search}
            onChange={e=>setFilters({...filters, search:e.target.value})}
            placeholder="Buscar por título ou autor..."
            style={{width:'100%', height:40, padding:'0 36px 0 32px', background:'#252526', color:'#fff', border:'1px solid #444', borderRadius:2, fontSize:13, fontFamily:'inherit', letterSpacing:'.0625rem', boxSizing:'border-box'}}/>
          {filters.search && (
            <button onClick={()=>setFilters({...filters, search:''})} style={{position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', background:'none', border:0, color:'#999', cursor:'pointer', padding:4, display:'flex'}}>
              <Icon name="close" size={14}/>
            </button>
          )}
        </div>

        <CatSortSelect value={sort} onChange={setSort}/>
      </div>

      <CatActiveChips filters={filters} setFilters={setFilters}/>

      <div style={{fontSize:11, color:'#999', marginBottom:14, letterSpacing:'.0625rem'}}>
        <strong style={{color:'#fff', fontWeight:800}}>{total}</strong> obra{total===1?'':'s'} encontrada{total===1?'':'s'}
      </div>
    </div>
  );
}

window.CatToolbar = CatToolbar;
window.CatActiveChips = CatActiveChips;
window.CatSortSelect = CatSortSelect;
