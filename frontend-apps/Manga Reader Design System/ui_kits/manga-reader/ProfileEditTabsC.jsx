// ProfileEditTabsC.jsx — groups + privacy

function PEGroupsTab({ form, set }) {
  const toggleLink = (id) => {
    const next = form.groups.map(g => g.id === id ? { ...g, linked: !g.linked, role: g.linked ? null : 'Membro' } : g);
    set('groups', next);
  };
  const linked = form.groups.filter(g => g.linked);
  const available = form.groups.filter(g => !g.linked);
  return (
    <div>
      <p style={{fontSize:12, color:'#ccc', lineHeight:1.6, marginTop:0, marginBottom:14}}>
        Vincule-se a grupos de scan para aparecer nas obras que eles traduzem. Você pode desvincular a qualquer momento.
      </p>

      {linked.length > 0 && (
        <div style={{marginBottom:18}}>
          <div style={{fontSize:11, fontWeight:800, color:'#ddda2a', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8}}>Vinculado a {linked.length} grupo{linked.length===1?'':'s'}</div>
          {linked.map(g => (
            <div key={g.id} style={{display:'flex', alignItems:'center', gap:12, padding:12, marginBottom:8, background:'#1f1f20', border:'1px solid #ddda2a', borderRadius:4}}>
              <Avatar initials={g.name.split(' ').map(w=>w[0]).join('').slice(0,2)} color="#3a2a10" size={40}/>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:13, fontWeight:700, color:'#fff', letterSpacing:'.0625rem'}}>{g.name}</div>
                <div style={{display:'flex', alignItems:'center', gap:6, fontSize:11, color:'#999', marginTop:2}}>
                  <Badge>{g.role}</Badge>
                  <span>{g.members} membros</span>
                </div>
              </div>
              <button onClick={()=>toggleLink(g.id)} style={{padding:'8px 12px', background:'transparent', color:'#FF784F', border:'1px solid #FF784F', borderRadius:2, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit', letterSpacing:'.0625rem', whiteSpace:'nowrap'}}>Desvincular</button>
            </div>
          ))}
        </div>
      )}

      {available.length > 0 && (
        <div>
          <div style={{fontSize:11, fontWeight:800, color:'#727273', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:8}}>Outros grupos disponíveis</div>
          {available.map(g => (
            <div key={g.id} style={{display:'flex', alignItems:'center', gap:12, padding:12, marginBottom:8, background:'#1a1a1a', border:'1px solid #333', borderRadius:4}}>
              <Avatar initials={g.name.split(' ').map(w=>w[0]).join('').slice(0,2)} color="#2a2a2a" size={40}/>
              <div style={{flex:1, minWidth:0}}>
                <div style={{fontSize:13, fontWeight:700, color:'#fff', letterSpacing:'.0625rem'}}>{g.name}</div>
                <div style={{fontSize:11, color:'#999', marginTop:2}}>{g.members} membros</div>
              </div>
              <button onClick={()=>toggleLink(g.id)} style={{padding:'8px 12px', background:'#ddda2a', color:'#161616', border:'1px solid #ddda2a', borderRadius:2, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit', letterSpacing:'.0625rem', whiteSpace:'nowrap'}}>Vincular</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PEToggle({ checked, onChange }) {
  return (
    <button onClick={()=>onChange(!checked)} style={{
      position:'relative', width:44, height:24, padding:0,
      background: checked?'#ddda2a':'#333',
      border:`1px solid ${checked?'#ddda2a':'#444'}`,
      borderRadius:999, cursor:'pointer',
      transition:'all .2s', flexShrink:0,
    }}>
      <span style={{
        position:'absolute', top:2, left: checked?22:2,
        width:18, height:18, background: checked?'#161616':'#999',
        borderRadius:999, transition:'left .2s, background .2s',
      }}/>
    </button>
  );
}

function PEPrivacyTab({ form, set }) {
  const items = [
    {
      key:'showHistory',
      title:'Mostrar histórico de leituras',
      desc:'Quando ativo, outros leitores podem ver tudo que você já leu — capítulos, datas e ritmo.',
      icon:'library',
    },
    {
      key:'showComments',
      title:'Exibir meus comentários nas obras',
      desc:'Mantém visível a lista de reviews e respostas que você deixou. Desativar oculta sem apagar.',
      icon:'comment',
    },
  ];
  return (
    <div>
      <p style={{fontSize:12, color:'#ccc', lineHeight:1.6, marginTop:0, marginBottom:18}}>
        Controle o que aparece publicamente no seu perfil. Mudanças entram em vigor na hora.
      </p>
      {items.map(it => (
        <div key={it.key} style={{display:'flex', alignItems:'flex-start', gap:14, padding:14, marginBottom:10, background:'#1f1f20', border:'1px solid #333', borderRadius:4}}>
          <div style={{width:36, height:36, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(221,218,42,0.1)', borderRadius:2, color:'#ddda2a', flexShrink:0}}>
            <Icon name={it.icon} size={18}/>
          </div>
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontSize:13, fontWeight:700, color:'#fff', marginBottom:4, letterSpacing:'.0625rem'}}>{it.title}</div>
            <div style={{fontSize:12, color:'#999', lineHeight:1.5}}>{it.desc}</div>
          </div>
          <PEToggle checked={form.privacy[it.key]} onChange={v => set(`privacy.${it.key}`, v)}/>
        </div>
      ))}

      <div style={{padding:14, background:'rgba(255,120,79,0.08)', border:'1px solid rgba(255,120,79,0.4)', borderRadius:4, marginTop:14}}>
        <div style={{fontSize:11, fontWeight:800, color:'#FF784F', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:6}}>Zona de risco</div>
        <p style={{fontSize:12, color:'#ccc', lineHeight:1.6, margin:'0 0 10px'}}>Apagar sua conta remove todos os comentários, listas e seguidores. Essa ação não pode ser desfeita.</p>
        <button style={{padding:'8px 12px', background:'transparent', color:'#FF784F', border:'1px solid #FF784F', borderRadius:2, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit', letterSpacing:'.0625rem'}}>Apagar conta</button>
      </div>
    </div>
  );
}

window.PEGroupsTab = PEGroupsTab;
window.PEPrivacyTab = PEPrivacyTab;
window.PEToggle = PEToggle;
