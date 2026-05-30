// ProfileEditModal.jsx — full-featured edit modal for the profile page

function ProfileEditModal({ open, onClose }) {
  const [tab, setTab] = React.useState('info');
  const [form, setForm] = React.useState({
    name: 'Ruan Moraes',
    handle: 'ruanmoraes',
    bio: 'Apaixonado por mangás desde 2008. Shounen é a minha pegada, mas dou chance pra tudo. Caçando os clássicos perdidos.',
    avatar: null,
    socials: { twitter:'@ruan', instagram:'@ruan.dev', myanimelist:'ruanmoraes', github:'Ruan-Moraes' },
    recommended: ['op','fr','bk'],
    groups: [
      { id:'sc',  name:'Scan Central',     members:'1.2k', linked:true,  role:'Tradutor' },
      { id:'ot',  name:'Otaku Translators', members:'820',  linked:true,  role:'Revisor' },
      { id:'ps',  name:'Panda Scans',      members:'2.1k', linked:false, role:null },
      { id:'ns',  name:'Noturnos Scan',    members:'410',  linked:false, role:null },
    ],
    privacy: {
      showHistory: true,
      showComments: true,
    },
  });

  if (!open) return null;

  const set = (path, value) => {
    setForm(prev => {
      const next = { ...prev };
      const keys = path.split('.');
      let cur = next;
      for (let i = 0; i < keys.length - 1; i++) {
        cur[keys[i]] = { ...cur[keys[i]] };
        cur = cur[keys[i]];
      }
      cur[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const tabs = [
    { key:'info',     label:'Informações', icon:'user' },
    { key:'socials',  label:'Redes',       icon:'compass' },
    { key:'recs',     label:'Recomendações', icon:'sparkle' },
    { key:'groups',   label:'Grupos',      icon:'groups' },
    { key:'privacy',  label:'Privacidade', icon:'settings' },
  ];

  return (
    <div style={{position:'fixed', inset:0, zIndex:50, background:'rgba(10,10,10,0.78)', backdropFilter:'blur(6px)', display:'flex', alignItems:'flex-start', justifyContent:'center', padding:'min(40px, 4vh) 12px', overflowY:'auto'}}
         onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        width:'100%', maxWidth:760,
        background:'#161616', border:'1px solid #444', borderRadius:8,
        boxShadow:'-0.5rem 0.5rem 0 0 rgba(221,218,42,0.25)',
        display:'flex', flexDirection:'column',
        maxHeight:'92vh', overflow:'hidden',
      }}>
        {/* header */}
        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'16px 20px', borderBottom:'1px solid #333'}}>
          <div>
            <div style={{fontSize:11, fontWeight:800, color:'#ddda2a', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:2}}>Perfil</div>
            <h2 style={{fontSize:18, fontWeight:700, color:'#fff', margin:0, letterSpacing:'.0625rem'}}>Editar perfil</h2>
          </div>
          <button onClick={onClose} style={{background:'none', border:0, color:'#999', cursor:'pointer', padding:6}}>
            <Icon name="close" size={22}/>
          </button>
        </div>

        {/* tabs */}
        <div style={{display:'flex', gap:0, borderBottom:'1px solid #333', overflowX:'auto', whiteSpace:'nowrap', flexShrink:0}}>
          {tabs.map(t => {
            const active = tab === t.key;
            return (
              <button key={t.key} onClick={()=>setTab(t.key)} style={{
                display:'inline-flex', alignItems:'center', gap:6,
                padding:'12px 14px', background:'none', border:0,
                borderBottom:`2px solid ${active?'#ddda2a':'transparent'}`,
                color: active?'#ddda2a':'#999',
                fontSize:12, fontWeight:700, cursor:'pointer',
                fontFamily:'inherit', letterSpacing:'.0625rem',
                whiteSpace:'nowrap', minHeight:44,
              }}>
                <Icon name={t.icon} size={14}/>
                {t.label}
              </button>
            );
          })}
        </div>

        {/* body */}
        <div style={{flex:1, overflowY:'auto', padding:'18px 20px'}}>
          {tab === 'info'    && <PEInfoTab form={form} set={set}/>}
          {tab === 'socials' && <PESocialsTab form={form} set={set}/>}
          {tab === 'recs'    && <PERecsTab form={form} set={set}/>}
          {tab === 'groups'  && <PEGroupsTab form={form} set={set}/>}
          {tab === 'privacy' && <PEPrivacyTab form={form} set={set}/>}
        </div>

        {/* footer */}
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:10, padding:'14px 20px', borderTop:'1px solid #333', background:'#1a1a1a', flexShrink:0}}>
          <span style={{fontSize:11, color:'#999'}}>Alterações salvas automaticamente</span>
          <div style={{display:'flex', gap:8}}>
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" onClick={onClose}>Salvar</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

window.ProfileEditModal = ProfileEditModal;
