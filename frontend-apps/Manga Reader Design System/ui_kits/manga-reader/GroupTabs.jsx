// GroupTabs.jsx — tab bodies for GroupDetailPage

function GroupAbout({ group }) {
  return (
    <div style={{display:'grid', gridTemplateColumns:'minmax(0,1fr)', gap:16}} className="group-about">
      <div>
        <div style={{fontSize:11, fontWeight:800, color:'#ddda2a', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8}}>Sobre o grupo</div>
        <p style={{fontSize:14, color:'#ccc', lineHeight:1.7, margin:'0 0 18px'}}>{group.bio}</p>

        <div style={{fontSize:11, fontWeight:800, color:'#ddda2a', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8}}>Gêneros traduzidos</div>
        <div style={{display:'flex', flexWrap:'wrap', gap:6, marginBottom:18}}>
          {group.genres.map(g => <Badge key={g} variant="neutral">{g}</Badge>)}
        </div>
      </div>

      <aside style={{padding:14, background:'#1a1a1a', border:'1px solid #333', borderRadius:4}}>
        <div style={{fontSize:11, fontWeight:800, color:'#ddda2a', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:10}}>Onde encontrar</div>
        {group.socials.discord && <SocialRow icon="forum" label="Discord" value={group.socials.discord}/>}
        {group.socials.twitter && <SocialRow icon="compass" label="Twitter" value={group.socials.twitter}/>}
        {group.socials.site &&    <SocialRow icon="news" label="Site" value={group.socials.site}/>}
      </aside>
    </div>
  );
}

function SocialRow({ icon, label, value }) {
  return (
    <div style={{display:'flex', alignItems:'center', gap:10, padding:'8px 0', borderTop:'1px solid #2d2d2d'}}>
      <div style={{width:28, height:28, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(221,218,42,0.1)', borderRadius:2, color:'#ddda2a', flexShrink:0}}><Icon name={icon} size={14}/></div>
      <div style={{flex:1, minWidth:0}}>
        <div style={{fontSize:10, color:'#999', textTransform:'uppercase', letterSpacing:'.08em', fontWeight:700}}>{label}</div>
        <div style={{fontSize:12, color:'#fff', letterSpacing:'.0625rem', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{value}</div>
      </div>
    </div>
  );
}

function GroupWorks({ works, onOpenTitle }) {
  if (!works.length) return <div style={{textAlign:'center', padding:'40px 20px', color:'#999', fontSize:13}}>Esse grupo ainda não tem obras catalogadas.</div>;
  return (
    <div>
      <div style={{fontSize:11, fontWeight:800, color:'#ddda2a', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:12}}>Obras traduzidas — {works.length}</div>
      <div className="cat-grid" style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:14}}>
        {works.map(m => <MangaCard key={m.id} manga={m} onClick={()=>onOpenTitle(m.id)}/>)}
      </div>
    </div>
  );
}

function GroupTeam({ group }) {
  return (
    <div>
      <div style={{fontSize:11, fontWeight:800, color:'#ddda2a', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:12}}>Equipe — {group.team.length} integrantes</div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:10}}>
        {group.team.map(m => (
          <div key={m.initials} style={{display:'flex', alignItems:'center', gap:12, padding:12, background:'#1a1a1a', border:'1px solid #333', borderRadius:4}}>
            <Avatar initials={m.initials} size={40}/>
            <div style={{flex:1, minWidth:0}}>
              <div style={{fontSize:13, fontWeight:700, color:'#fff', letterSpacing:'.0625rem'}}>{m.name}</div>
              <div style={{fontSize:11, color:'#ddda2a', fontWeight:700, letterSpacing:'.0625rem'}}>{m.role}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function GroupDiscussion() {
  return (
    <div>
      <div style={{fontSize:11, fontWeight:800, color:'#ddda2a', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:12}}>Discussão recente</div>
      <div style={{padding:'40px 20px', background:'#1a1a1a', border:'1px solid #333', borderRadius:4, textAlign:'center'}}>
        <div style={{fontSize:13, color:'#ccc', marginBottom:12, lineHeight:1.5}}>O fórum interno do grupo aparece aqui.</div>
        <Button variant="ghost">Ver no fórum</Button>
      </div>
    </div>
  );
}

window.GroupAbout = GroupAbout;
window.GroupWorks = GroupWorks;
window.GroupTeam = GroupTeam;
window.GroupDiscussion = GroupDiscussion;
