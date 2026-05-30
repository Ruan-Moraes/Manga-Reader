// AuthShell.jsx — layout compartilhado das telas de auth + componentes

function AuthShell({ eyebrow, title, subtitle, children, footer }) {
  return (
    <div className="page" style={{maxWidth:880, padding:'24px 16px 80px'}}>
      <div style={{
        display:'grid', gridTemplateColumns:'minmax(0,1fr)', gap:24,
        background:'#1a1a1a', border:'1px solid #2a2a2a', borderRadius:8,
        overflow:'hidden',
      }} className="auth-shell">
        {/* Side panel — só desktop */}
        <aside className="auth-side" style={{
          display:'none', position:'relative',
          padding:32, background:'linear-gradient(135deg,#1a1a1a 0%, #252526 100%)',
          borderRight:'1px solid #2a2a2a', minHeight:480,
        }}>
          <div aria-hidden style={{position:'absolute', inset:0,
            backgroundImage:'radial-gradient(circle at 30% 20%, rgba(221,218,42,0.12), transparent 50%)',
            pointerEvents:'none'}}/>
          <div style={{position:'relative'}}>
            <div style={{display:'flex', alignItems:'center', gap:10, marginBottom:32}}>
              <img src="../../assets/favicon.svg" width="32" height="32" alt=""/>
              <span style={{fontStyle:'italic', fontWeight:800, fontSize:18, color:'#fff', letterSpacing:1.2}}>Manga <span style={{color:'#ddda2a'}}>Reader</span></span>
            </div>
            <div style={{fontSize:11, fontWeight:800, color:'#ddda2a', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:8}}>
              Comunidade
            </div>
            <h2 style={{fontSize:24, color:'#fff', margin:'0 0 16px', letterSpacing:'.0625rem', fontWeight:800, lineHeight:1.2}}>
              Leitura compartilhada, do jeito que devia ser.
            </h2>
            <p style={{fontSize:13, color:'#bbb', lineHeight:1.65, margin:'0 0 24px'}}>
              Acompanhe lançamentos, monte sua biblioteca, participe de fóruns por capítulo e descubra obras pela curadoria da comunidade.
            </p>
            <div style={{display:'flex', flexDirection:'column', gap:10}}>
              {['Biblioteca pessoal com listas customizadas',
                'Fórum por capítulo com discussões temáticas',
                'Eventos especiais e maratonas comunitárias',
                'Curadoria de grupos de tradução'].map((t,i) => (
                <div key={i} style={{display:'flex', gap:10, alignItems:'flex-start', fontSize:12, color:'#ccc'}}>
                  <span style={{color:'#ddda2a', fontSize:12, marginTop:2}}>▸</span>
                  <span style={{lineHeight:1.5}}>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Form panel */}
        <div style={{padding:'28px 24px 32px'}}>
          {eyebrow && (
            <div style={{fontSize:11, fontWeight:800, color:'#ddda2a', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:6}}>
              {eyebrow}
            </div>
          )}
          <h1 style={{fontSize:'clamp(22px,4vw,28px)', color:'#fff', margin:'0 0 8px', letterSpacing:'.0625rem', fontWeight:800}}>
            {title}
          </h1>
          {subtitle && (
            <p style={{fontSize:13, color:'#999', margin:'0 0 24px', lineHeight:1.55, maxWidth:420}}>{subtitle}</p>
          )}
          {children}
          {footer && <div style={{marginTop:24, paddingTop:20, borderTop:'1px solid #2a2a2a', fontSize:13, color:'#999', textAlign:'center'}}>{footer}</div>}
        </div>
      </div>
    </div>
  );
}

function AuthField({ label, type='text', value, onChange, placeholder, hint, error, autoComplete, rightSlot }) {
  return (
    <label style={{display:'block', marginBottom:14}}>
      <div style={{display:'flex', justifyContent:'space-between', alignItems:'baseline', marginBottom:6}}>
        <span style={{fontSize:11, fontWeight:800, color:error ? '#ff784f' : '#ddda2a', textTransform:'uppercase', letterSpacing:'.1em'}}>
          {label}
        </span>
        {rightSlot}
      </div>
      <input
        type={type} value={value} onChange={onChange}
        placeholder={placeholder} autoComplete={autoComplete}
        style={{
          width:'100%', boxSizing:'border-box',
          padding:'12px 14px',
          background:'#0f0f0f', color:'#fff',
          border:`1px solid ${error ? '#ff784f' : '#2a2a2a'}`, borderRadius:2,
          fontSize:14, letterSpacing:'.0625rem', outline:'none',
          transition:'border-color .15s',
        }}
        onFocus={e => { if (!error) e.target.style.borderColor = '#ddda2a'; }}
        onBlur={e => { if (!error) e.target.style.borderColor = '#2a2a2a'; }}
      />
      {(error || hint) && (
        <div style={{fontSize:11, color:error ? '#ff784f' : '#666', marginTop:6, letterSpacing:'.0625rem'}}>
          {error || hint}
        </div>
      )}
    </label>
  );
}

function AuthSubmit({ children, disabled, loading }) {
  return (
    <button type="submit" disabled={disabled || loading} style={{
      width:'100%', padding:'14px 18px', marginTop:8,
      background: (disabled || loading) ? '#2a2a2a' : '#ddda2a',
      color: (disabled || loading) ? '#666' : '#161616',
      border:'none', borderRadius:2,
      fontWeight:800, fontSize:13, letterSpacing:'.12em', textTransform:'uppercase',
      cursor: (disabled || loading) ? 'not-allowed' : 'pointer',
      transition:'background .15s',
    }}>
      {loading ? 'Carregando…' : children}
    </button>
  );
}

window.AuthShell = AuthShell;
window.AuthField = AuthField;
window.AuthSubmit = AuthSubmit;
