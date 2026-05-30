// GroupDetailPage.jsx — single group view with tabs

function GroupDetailPage({ id, onBack, onOpenTitle }) {
  const group = (window.GROUPS||[]).find(g => g.id === id) || (window.GROUPS||[])[0];
  const [following, setFollowing] = React.useState(group.following);
  const [tab, setTab] = React.useState('about');
  const initials = group.name.split(' ').map(w=>w[0]).join('').slice(0,2);
  const works = (group.works||[]).map(wid => (window.MANGAS||[]).find(m=>m.id===wid)).filter(Boolean);

  return (
    <div className="page" style={{maxWidth:1240, padding:0}}>
      {/* Cover */}
      <div style={{height:180, background:group.cover, position:'relative'}}>
        <button onClick={onBack} style={{position:'absolute', top:12, left:12, background:'rgba(22,22,22,0.7)', border:'1px solid #444', borderRadius:2, color:'#fff', padding:'8px 10px', fontSize:12, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', gap:4, fontFamily:'inherit', letterSpacing:'.0625rem', backdropFilter:'blur(4px)'}}>
          <Icon name="chevronL" size={14}/>Voltar
        </button>
      </div>

      {/* Header */}
      <div style={{padding:'0 16px', marginTop:-44, position:'relative'}}>
        <div style={{display:'flex', gap:14, alignItems:'flex-end', flexWrap:'wrap'}}>
          <div style={{width:88, height:88, borderRadius:2, background:group.avatar, color:'#161616', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:28, letterSpacing:'.0625rem', border:'3px solid #161616', flexShrink:0}}>{initials}</div>
          <div style={{flex:'1 1 240px', minWidth:0, paddingBottom:6}}>
            <h1 style={{fontSize:'clamp(20px,4vw,26px)', fontWeight:700, color:'#fff', margin:0, letterSpacing:'.0625rem'}}>{group.name}</h1>
            <div style={{fontSize:12, color:'#999', marginTop:2}}>{group.tag} · {group.city} · desde {group.founded}</div>
          </div>
          <button onClick={()=>setFollowing(f=>!f)} style={{
            padding:'10px 18px', height:40,
            background: following?'transparent':'#ddda2a',
            color: following?'#ddda2a':'#161616',
            border:`1px solid #ddda2a`, borderRadius:2,
            fontSize:12, fontWeight:800, cursor:'pointer',
            fontFamily:'inherit', letterSpacing:'.0625rem',
            display:'inline-flex', alignItems:'center', gap:6,
          }}>{following && <Icon name="check" size={14}/>}{following?'Seguindo':'Seguir grupo'}</button>
        </div>

        {/* Stats */}
        <div style={{display:'flex', gap:24, marginTop:18, flexWrap:'wrap', borderBottom:'1px solid #333', paddingBottom:14}}>
          {[
            ['Seguidores', (group.followers/1000).toFixed(1)+'k'],
            ['Obras', group.translated],
            ['Capítulos', group.chapters],
            ['Membros', group.members],
          ].map(([l,v]) => (
            <div key={l}><div style={{color:'#ddda2a', fontWeight:800, fontSize:18}}>{v}</div><div style={{fontSize:10, color:'#999', textTransform:'uppercase', letterSpacing:'.08em', fontWeight:700}}>{l}</div></div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{display:'flex', borderBottom:'1px solid #333', marginTop:0, overflowX:'auto', whiteSpace:'nowrap'}}>
          {[['about','Sobre'],['works','Obras'],['team','Equipe'],['discussion','Discussão']].map(([k,l]) => {
            const active = tab===k;
            return (
              <button key={k} onClick={()=>setTab(k)} style={{
                padding:'12px 16px', background:'none', border:0,
                borderBottom:`2px solid ${active?'#ddda2a':'transparent'}`,
                color: active?'#ddda2a':'#999',
                fontSize:12, fontWeight:700, cursor:'pointer',
                fontFamily:'inherit', letterSpacing:'.0625rem',
              }}>{l}</button>
            );
          })}
        </div>

        <div style={{padding:'18px 0 60px'}}>
          {tab==='about' && <GroupAbout group={group}/>}
          {tab==='works' && <GroupWorks works={works} onOpenTitle={onOpenTitle}/>}
          {tab==='team' && <GroupTeam group={group}/>}
          {tab==='discussion' && <GroupDiscussion/>}
        </div>
      </div>
    </div>
  );
}

window.GroupDetailPage = GroupDetailPage;
