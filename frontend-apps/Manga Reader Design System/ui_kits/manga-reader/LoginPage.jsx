// LoginPage.jsx — entrar com credenciais demo

function LoginPage({ onLogin, onNav }) {
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [remember, setRemember] = React.useState(true);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const submit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      const u = window.DEMO_USER;
      if (email.trim().toLowerCase() === u.email && password === u.password) {
        onLogin(u);
      } else {
        setError('E-mail ou senha incorretos. Tente as credenciais demo abaixo.');
      }
      setLoading(false);
    }, 400);
  };

  const fillDemo = () => {
    setEmail(window.DEMO_USER.email);
    setPassword(window.DEMO_USER.password);
    setError('');
  };

  return (
    <AuthShell
      eyebrow="Bem-vindo de volta"
      title="Entrar na sua conta"
      subtitle="Acesse sua biblioteca, continue de onde parou e participe da comunidade."
      footer={<>Ainda não tem conta? <a href="#" onClick={e => {e.preventDefault(); onNav('register');}} style={{color:'#ddda2a', fontWeight:700, textDecoration:'none', letterSpacing:'.0625rem'}}>Crie uma agora</a></>}
    >
      <form onSubmit={submit} noValidate>
        <AuthField label="E-mail" type="email" autoComplete="email"
          value={email} onChange={e => setEmail(e.target.value)}
          placeholder="voce@email.com"
          error={error ? ' ' : ''}/>

        <AuthField label="Senha" type="password" autoComplete="current-password"
          value={password} onChange={e => setPassword(e.target.value)}
          placeholder="••••••••"
          error={error}
          rightSlot={
            <a href="#" onClick={e => {e.preventDefault(); onNav('forgot');}}
              style={{fontSize:11, color:'#999', textDecoration:'none', letterSpacing:'.0625rem'}}>
              Esqueci a senha
            </a>
          }/>

        <label style={{display:'flex', alignItems:'center', gap:8, marginBottom:18, cursor:'pointer'}}>
          <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)}
            style={{accentColor:'#ddda2a', width:14, height:14}}/>
          <span style={{fontSize:12, color:'#bbb', letterSpacing:'.0625rem'}}>Manter sessão ativa neste dispositivo</span>
        </label>

        <AuthSubmit loading={loading}>Entrar</AuthSubmit>

        {/* Demo credentials helper */}
        <div style={{
          marginTop:18, padding:14,
          background:'rgba(221,218,42,0.06)',
          border:'1px dashed rgba(221,218,42,0.35)',
          borderRadius:4,
        }}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12}}>
            <div style={{flex:1, minWidth:0}}>
              <div style={{fontSize:10, fontWeight:800, color:'#ddda2a', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:6}}>
                Credenciais de demonstração
              </div>
              <div style={{fontSize:12, color:'#bbb', lineHeight:1.6, fontFamily:'ui-monospace, monospace'}}>
                <div>{window.DEMO_USER.email}</div>
                <div>{window.DEMO_USER.password}</div>
              </div>
            </div>
            <button type="button" onClick={fillDemo} style={{
              flexShrink:0, padding:'6px 10px',
              background:'transparent', color:'#ddda2a',
              border:'1px solid #ddda2a', borderRadius:2,
              fontSize:10, fontWeight:800, letterSpacing:'.1em', textTransform:'uppercase',
              cursor:'pointer', fontFamily:'inherit',
            }}>Preencher</button>
          </div>
        </div>
      </form>
    </AuthShell>
  );
}

window.LoginPage = LoginPage;
