// GroupsPage.jsx — index of all groups (cards grid)

function GroupsPage({ onOpenGroup }) {
  const [query, setQuery] = React.useState('');
  const [sort, setSort] = React.useState('followers');
  const groups = (window.GROUPS||[]).filter(g =>
    !query || g.name.toLowerCase().includes(query.toLowerCase()) || (g.genres||[]).some(x=>x.toLowerCase().includes(query.toLowerCase()))
  ).slice().sort((a,b)=>{
    if (sort==='followers') return b.followers - a.followers;
    if (sort==='chapters')  return b.chapters - a.chapters;
    if (sort==='alpha')     return a.name.localeCompare(b.name);
    return 0;
  });

  return (
    <div className="page" style={{maxWidth:1240}}>
      <div style={{marginBottom:18}}>
        <div style={{fontSize:11, fontWeight:800, color:'#ddda2a', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:6}}>Comunidade</div>
        <h1 style={{fontSize:'clamp(22px,4vw,28px)', fontWeight:700, color:'#fff', margin:0, letterSpacing:'.0625rem'}}>Grupos de scan</h1>
        <p style={{fontSize:13, color:'#ccc', marginTop:6, maxWidth:560, lineHeight:1.5}}>Conheça os grupos que traduzem as obras que você lê. Siga, acompanhe lançamentos e descubra novos coletivos.</p>
      </div>

      <div style={{display:'flex', gap:8, marginBottom:18, flexWrap:'wrap'}}>
        <div style={{flex:1, minWidth:220, position:'relative'}}>
          <div style={{position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#727273'}}><Icon name="search" size={14}/></div>
          <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar grupo ou gênero..."
            style={{width:'100%', height:40, padding:'0 12px 0 32px', background:'#252526', color:'#fff', border:'1px solid #444', borderRadius:2, fontSize:13, fontFamily:'inherit', letterSpacing:'.0625rem', boxSizing:'border-box'}}/>
        </div>
        <CatSortSelect value={sort} onChange={setSort}/>
      </div>

      <div className="groups-grid" style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:14}}>
        {groups.map(g => <GroupCard key={g.id} group={g} onOpen={()=>onOpenGroup(g.id)}/>)}
      </div>
    </div>
  );
}

function GroupCard({ group, onOpen }) {
  const [following, setFollowing] = React.useState(group.following);
  const initials = group.name.split(' ').map(w=>w[0]).join('').slice(0,2);
  return (
    <div onClick={onOpen} style={{
      background:'#1a1a1a', border:'1px solid #333', borderRadius:4,
      cursor:'pointer', overflow:'hidden',
      display:'flex', flexDirection:'column',
      transition:'border-color .2s, box-shadow .2s',
    }}
    onMouseEnter={e=>{ e.currentTarget.style.borderColor='#ddda2a'; e.currentTarget.style.boxShadow='-0.25rem 0.25rem 0 0 rgba(221,218,42,0.25)'; }}
    onMouseLeave={e=>{ e.currentTarget.style.borderColor='#333'; e.currentTarget.style.boxShadow='none'; }}>
      <div style={{height:64, background:group.cover, position:'relative'}}>
        <div style={{position:'absolute', left:14, bottom:-22, width:48, height:48, borderRadius:2, background:group.avatar, color:'#161616', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:16, letterSpacing:'.0625rem', border:'2px solid #1a1a1a'}}>{initials}</div>
      </div>
      <div style={{padding:'30px 14px 14px'}}>
        <div style={{fontSize:14, fontWeight:700, color:'#fff', letterSpacing:'.0625rem', marginBottom:2}}>{group.name}</div>
        <div style={{fontSize:11, color:'#999', marginBottom:10}}>{group.tag}</div>
        <div style={{fontSize:12, color:'#ccc', lineHeight:1.5, marginBottom:12, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden'}}>{group.bio}</div>
        <div style={{display:'flex', gap:6, flexWrap:'wrap', marginBottom:12}}>
          {group.genres.slice(0,3).map(x => <Badge key={x} variant="neutral">{x}</Badge>)}
        </div>
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', borderTop:'1px solid #333', paddingTop:10}}>
          <div style={{display:'flex', gap:14, fontSize:11, color:'#999'}}>
            <span><strong style={{color:'#ddda2a', fontWeight:800}}>{(group.followers/1000).toFixed(1)}k</strong> seguidores</span>
            <span><strong style={{color:'#fff', fontWeight:800}}>{group.translated}</strong> obras</span>
          </div>
          <button onClick={(e)=>{e.stopPropagation(); setFollowing(f=>!f);}} style={{
            padding:'6px 10px',
            background: following?'transparent':'#ddda2a',
            color: following?'#ddda2a':'#161616',
            border:`1px solid ${following?'#ddda2a':'#ddda2a'}`,
            borderRadius:2, fontSize:11, fontWeight:800, cursor:'pointer',
            fontFamily:'inherit', letterSpacing:'.0625rem',
          }}>{following?'Seguindo':'Seguir'}</button>
        </div>
      </div>
    </div>
  );
}

window.GroupsPage = GroupsPage;
window.GroupCard = GroupCard;
