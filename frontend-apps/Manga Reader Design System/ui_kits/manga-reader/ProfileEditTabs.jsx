// ProfileEditTabs.jsx — tab bodies for the profile-edit modal

// shared field shells
function PEField({ label, hint, children }) {
  return (
    <label style={{display:'block', marginBottom:14}}>
      <div style={{fontSize:11, fontWeight:800, color:'#ddda2a', textTransform:'uppercase', letterSpacing:'.08em', marginBottom:6}}>{label}</div>
      {children}
      {hint && <div style={{fontSize:11, color:'#999', marginTop:4}}>{hint}</div>}
    </label>
  );
}
const inputStyle = {
  width:'100%', height:40, padding:'0 12px',
  background:'#252526', color:'#fff',
  border:'1px solid #444', borderRadius:2,
  fontSize:13, fontFamily:'inherit', letterSpacing:'.0625rem',
  boxSizing:'border-box',
};

function PEInfoTab({ form, set }) {
  const fileRef = React.useRef(null);
  return (
    <div>
      {/* Avatar uploader */}
      <div style={{display:'flex', alignItems:'center', gap:14, marginBottom:18, padding:14, background:'#1f1f20', border:'1px solid #333', borderRadius:4}}>
        <div style={{position:'relative'}}>
          <Avatar initials="RM" size={64}/>
          <button onClick={()=>fileRef.current && fileRef.current.click()} style={{position:'absolute', right:-4, bottom:-4, width:24, height:24, padding:0, borderRadius:2, background:'#ddda2a', color:'#161616', border:'2px solid #161616', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center'}}>
            <Icon name="plus" size={12}/>
          </button>
        </div>
        <div style={{flex:1, minWidth:0}}>
          <div style={{fontSize:13, fontWeight:700, color:'#fff', marginBottom:4, letterSpacing:'.0625rem'}}>Foto do perfil</div>
          <div style={{fontSize:11, color:'#999', lineHeight:1.5}}>PNG ou JPG, até 2MB. Imagem quadrada funciona melhor.</div>
          <div style={{display:'flex', gap:6, marginTop:8}}>
            <button onClick={()=>fileRef.current && fileRef.current.click()} style={{padding:'6px 10px', background:'transparent', color:'#fff', border:'1px solid #727273', borderRadius:2, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit', letterSpacing:'.0625rem'}}>Trocar</button>
            <button style={{padding:'6px 10px', background:'transparent', color:'#FF784F', border:'1px solid #FF784F', borderRadius:2, fontSize:11, fontWeight:700, cursor:'pointer', fontFamily:'inherit', letterSpacing:'.0625rem'}}>Remover</button>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{display:'none'}}/>
      </div>

      <PEField label="Nome">
        <input value={form.name} onChange={e=>set('name', e.target.value)} style={inputStyle}/>
      </PEField>

      <PEField label="Usuário" hint="Aparece como @ruanmoraes nos comentários e no link do perfil.">
        <div style={{display:'flex', alignItems:'center', height:40, background:'#252526', border:'1px solid #444', borderRadius:2}}>
          <span style={{padding:'0 10px', color:'#727273', fontSize:13, letterSpacing:'.0625rem'}}>mr.app/u/</span>
          <input value={form.handle} onChange={e=>set('handle', e.target.value)} style={{...inputStyle, height:'100%', border:0, background:'transparent', padding:'0 10px 0 0'}}/>
        </div>
      </PEField>

      <PEField label="Biografia" hint={`${form.bio.length}/280 caracteres. Use pra contar quem você é como leitor.`}>
        <textarea value={form.bio} onChange={e=>set('bio', e.target.value.slice(0,280))} rows="4" style={{...inputStyle, height:'auto', padding:10, resize:'vertical', minHeight:96, lineHeight:1.5}}/>
      </PEField>
    </div>
  );
}

function PESocialsTab({ form, set }) {
  const fields = [
    { key:'twitter',     label:'Twitter / X',  prefix:'@',                       placeholder:'usuario' },
    { key:'instagram',   label:'Instagram',    prefix:'@',                       placeholder:'usuario' },
    { key:'myanimelist', label:'MyAnimeList',  prefix:'myanimelist.net/profile/',placeholder:'usuario' },
    { key:'github',      label:'GitHub',       prefix:'github.com/',             placeholder:'usuario' },
  ];
  return (
    <div>
      <p style={{fontSize:12, color:'#ccc', lineHeight:1.6, marginTop:0, marginBottom:18}}>
        Adicione suas redes para que outros leitores possam te encontrar. Tudo é opcional e pode ser ocultado depois.
      </p>
      {fields.map(f => (
        <PEField key={f.key} label={f.label}>
          <div style={{display:'flex', alignItems:'center', height:40, background:'#252526', border:'1px solid #444', borderRadius:2}}>
            <span style={{padding:'0 10px', color:'#727273', fontSize:12, letterSpacing:'.0625rem', borderRight:'1px solid #444', height:'100%', display:'flex', alignItems:'center'}}>{f.prefix}</span>
            <input value={form.socials[f.key]||''} onChange={e=>set(`socials.${f.key}`, e.target.value)} placeholder={f.placeholder} style={{...inputStyle, height:'100%', border:0, background:'transparent', padding:'0 12px'}}/>
          </div>
        </PEField>
      ))}
    </div>
  );
}

window.PEInfoTab = PEInfoTab;
window.PESocialsTab = PESocialsTab;
window.PEField = PEField;
window.peInputStyle = inputStyle;
