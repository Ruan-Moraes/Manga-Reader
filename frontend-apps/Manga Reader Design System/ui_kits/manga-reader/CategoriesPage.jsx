// CategoriesPage.jsx — combines filters + toolbar + grid

function applyCategoryFilters(list, filters, sort) {
  let out = list.slice();
  if (filters.tags.length > 0) {
    out = out.filter(m => filters.tags.every(t => (m.tags||[]).includes(t)));
  }
  if (filters.status.length > 0) {
    out = out.filter(m => filters.status.includes(m.statusKey));
  }
  if (!filters.adult) {
    out = out.filter(m => !m.adult);
  }
  if (filters.search) {
    const q = filters.search.toLowerCase();
    out = out.filter(m => m.title.toLowerCase().includes(q) || (m.author||'').toLowerCase().includes(q));
  }
  switch (sort) {
    case 'popular':    out.sort((a,b)=> (b.views||0) - (a.views||0)); break;
    case 'rising':     out.sort((a,b)=> (b.rising||0) - (a.rising||0)); break;
    case 'rated':      out.sort((a,b)=> (b.rating||0) - (a.rating||0)); break;
    case 'recent':     out.sort((a,b)=> (a.addedDays||0) - (b.addedDays||0)); break;
    case 'updated':    out.sort((a,b)=> (a.updatedHrs||0) - (b.updatedHrs||0)); break;
    case 'alpha':      out.sort((a,b)=> a.title.localeCompare(b.title)); break;
    case 'alpha-desc': out.sort((a,b)=> b.title.localeCompare(a.title)); break;
    case 'random':     out.sort(()=> Math.random() - 0.5); break;
    default: break;
  }
  return out;
}

function CategoriesPage({ onOpenTitle, library, toggleLib }) {
  const [filters, setFilters] = React.useState({
    tags: [],
    status: [],
    adult: false,
    search: '',
  });
  const [sort, setSort] = React.useState('popular');
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [randomSeed, setRandomSeed] = React.useState(0);

  const clearAll = () => setFilters({ tags:[], status:[], adult:false, search:'' });

  const results = React.useMemo(
    () => applyCategoryFilters(window.MANGAS||[], filters, sort),
    [filters, sort, randomSeed]
  );

  return (
    <div className="page" style={{maxWidth:1240}}>
      <div style={{marginBottom:18}}>
        <div style={{fontSize:11, fontWeight:800, color:'#ddda2a', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:6}}>Catálogo</div>
        <h1 style={{fontSize:'clamp(22px, 4vw, 28px)', fontWeight:700, color:'#fff', margin:0, letterSpacing:'.0625rem'}}>Categorias</h1>
        <p style={{fontSize:13, color:'#ccc', marginTop:6, maxWidth:560, lineHeight:1.5}}>Filtre o catálogo por tags, situação e classificação. Use a busca para encontrar pelo título ou autor.</p>
      </div>

      <div className="cat-layout" style={{display:'grid', gridTemplateColumns:'minmax(0, 1fr)', gap:24, alignItems:'start'}}>
        {/* Sidebar — desktop */}
        <aside className="cat-sidebar" style={{display:'none', position:'sticky', top:72, padding:16, background:'#1a1a1a', border:'1px solid #333', borderRadius:4}}>
          <CatFilterPanel filters={filters} setFilters={setFilters} onClear={clearAll}/>
        </aside>

        <div style={{minWidth:0}}>
          <CatToolbar
            filters={filters} setFilters={setFilters}
            sort={sort}
            setSort={(s)=>{ setSort(s); if (s==='random') setRandomSeed(x=>x+1); }}
            total={results.length}
            onOpenFilters={()=>setDrawerOpen(true)}
          />

          {results.length === 0 ? (
            <div style={{textAlign:'center', padding:'60px 20px', background:'#1a1a1a', border:'1px solid #333', borderRadius:4}}>
              <div style={{fontSize:11, fontWeight:800, color:'#ddda2a', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:8}}>Sem resultados</div>
              <h2 style={{fontSize:18, color:'#fff', margin:'0 0 8px', letterSpacing:'.0625rem'}}>Nada bateu com esses filtros</h2>
              <p style={{color:'#999', fontSize:13, maxWidth:380, margin:'0 auto 16px'}}>Tente afrouxar as tags ou desativar a busca.</p>
              <Button variant="ghost" onClick={clearAll}>Limpar filtros</Button>
            </div>
          ) : (
            <div className="cat-grid" style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:14}}>
              {results.map(m => (
                <MangaCard key={m.id} manga={m}
                  onClick={()=>onOpenTitle(m.id)}
                  inLib={library.has(m.id)}
                  onToggleLib={()=>toggleLib(m.id)}/>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {drawerOpen && (
        <>
          <div onClick={()=>setDrawerOpen(false)} style={{position:'fixed', inset:0, background:'rgba(22,22,22,0.8)', backdropFilter:'blur(4px)', zIndex:30}}/>
          <aside style={{position:'fixed', top:0, bottom:0, right:0, width:'min(360px, 90vw)', background:'#161616', borderLeft:'2px solid #727273', zIndex:31, display:'flex', flexDirection:'column'}}>
            <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:14, borderBottom:'2px solid #727273'}}>
              <span style={{fontSize:12, fontWeight:800, color:'#fff', textTransform:'uppercase', letterSpacing:'.08em'}}>Filtros</span>
              <button onClick={()=>setDrawerOpen(false)} style={{background:'none', border:0, color:'#fff', cursor:'pointer', padding:4}}><Icon name="close" size={22}/></button>
            </div>
            <div style={{flex:1, overflowY:'auto', padding:16}}>
              <CatFilterPanel filters={filters} setFilters={setFilters} onClear={clearAll}/>
            </div>
            <div style={{padding:14, borderTop:'1px solid #444', display:'flex', gap:8}}>
              <Button variant="ghost" onClick={clearAll}>Limpar</Button>
              <Button variant="primary" onClick={()=>setDrawerOpen(false)}>Ver {results.length} obras</Button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

window.CategoriesPage = CategoriesPage;
