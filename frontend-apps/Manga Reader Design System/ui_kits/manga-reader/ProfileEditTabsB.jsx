// ProfileEditTabsB.jsx — recs / groups / privacy tabs

function PERecsTab({ form, set }) {
  const all = window.MANGAS || [];
  const sel = new Set(form.recommended);
  const toggle = (id) => {
    const next = new Set(sel);
    next.has(id) ? next.delete(id) : next.add(id);
    set('recommended', [...next]);
  };
  return (
    <div>
      <p style={{fontSize:12, color:'#ccc', lineHeight:1.6, marginTop:0, marginBottom:14}}>
        Escolha até 6 obras pra mostrar no topo do seu perfil. Pense como uma vitrine — o que define seu gosto.
      </p>
      <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12, padding:'8px 12px', background:'#1f1f20', border:'1px solid #333', borderRadius:2}}>
        <span style={{fontSize:12, color:'#fff', fontWeight:700}}>{sel.size} de 6 selecionadas</span>
        {sel.size > 0 && <button onClick={()=>set('recommended', [])} style={{background:'none', border:0, color:'#FF784F', fontSize:11, fontWeight:700, cursor:'pointer', padding:0, fontFamily:'inherit', letterSpacing:'.0625rem'}}>Limpar</button>}
      </div>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(110px, 1fr))', gap:10}}>
        {all.map(m => {
          const isSel = sel.has(m.id);
          const disabled = !isSel && sel.size >= 6;
          return (
            <button key={m.id} onClick={()=>!disabled && toggle(m.id)} disabled={disabled}
              style={{
                position:'relative', padding:0, cursor: disabled?'not-allowed':'pointer',
                background: m.gradient, border:`1px solid ${isSel?'#ddda2a':'transparent'}`, borderRadius:4,
                aspectRatio:'2/3', overflow:'hidden',
                opacity: disabled?0.4:1,
                boxShadow: isSel?'-0.25rem 0.25rem 0 0 rgba(221,218,42,0.25)':'none',
                transition:'all .2s',
              }}>
              <div style={{position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'clamp(20px,5vw,32px)', fontWeight:800, color:'rgba(221,218,42,0.4)'}}>{m.initial}</div>
              <div style={{position:'absolute', left:0, right:0, bottom:0, height:'55%', background:'linear-gradient(180deg, transparent 0%, rgba(22,22,22,0.95) 80%)'}}/>
              <div style={{position:'absolute', left:6, right:6, bottom:6, color:'#fff', fontSize:10, fontWeight:700, lineHeight:1.2, textAlign:'left', letterSpacing:'.05em', textShadow:'0 1px 2px rgba(0,0,0,0.8)', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden'}}>{m.title}</div>
              {isSel && (
                <div style={{position:'absolute', top:6, right:6, width:22, height:22, background:'#ddda2a', color:'#161616', borderRadius:2, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800}}>
                  <Icon name="check" size={14}/>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

window.PERecsTab = PERecsTab;
