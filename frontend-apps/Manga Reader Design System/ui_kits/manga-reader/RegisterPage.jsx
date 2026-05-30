// RegisterPage.jsx — criar conta nova

function RegisterPage({ onLogin, onNav }) {
  const [name, setName] = React.useState('');
  const [handle, setHandle] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [accept, setAccept] = React.useState(false);
  const [errors, setErrors] = React.useState({});
  const [loading, setLoading] = React.useState(false);

  const strength = React.useMemo(() => {
    if (!password) return { level:0, label:'—', color:'#444' };
    let s = 0;
    if (password.length >= 8) s++;
    if (/[A-Z]/.test(password)) s++;
    if (/[0-9]/.test(password)) s++;
    if (/[^A-Za-z0-9]/.test(password)) s++;
    const map = [
      { level:1, label:'Fraca',  color:'#ff784f' },
      { level:2, label:'Média',  color:'#ddda2a' },
      { level:3, label:'Forte',  color:'#10b981' },
      { level:4, label:'Ótima',  color:'#10b981' },
    ];
    return map[Math.max(0, s-1)] || map[0];
  }, [password]);

  const submit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!name.trim()) errs.name = 'Diga como podemos te chamar.';
    if (!handle.trim()) errs.handle = 'Escolha um @usuario único.';
    else if (!/^[a-z0-9_.]{3,20}$/i.test(handle.trim())) errs.handle = 'Use 3 a 20 caracteres: letras, números, ponto ou _.';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = 'E-mail inválido.';
    if (password.length < 8) errs.password = 'Senha precisa de pelo menos 8 caracteres.';
    if (!accept) errs.accept = 'É preciso aceitar os termos para continuar.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setLoading(true);
    setTimeout(() => {
      onLogin({
        name: name.trim(),
        handle: handle.trim(),
        initials: name.trim().split(/\s+/).map(p => p[0]).join('').slice(0,2).toUpperCase(),
        email: email.trim(),
        role: 'Leitor',
      });
    }, 500);
  };

  return (
    <AuthShell
      eyebrow="Crie sua conta"
      title="Comece a ler com a comunidade"
      subtitle="Leva menos de um minuto. Sua biblioteca e progresso ficam salvos para sempre."
      footer={<>Já tem conta? <a href="#" onClick={e => {e.preventDefault(); onNav('login');}} style={{color:'#ddda2a', fontWeight:700, textDecoration:'none', letterSpacing:'.0625rem'}}>Entrar</a></>}
    >
      <form onSubmit={submit} noValidate>
        <AuthField label="Nome" autoComplete="name"
          value={name} onChange={e => setName(e.target.value)}
          placeholder="Como podemos te chamar"
          error={errors.name}/>

        <AuthField label="Nome de usuário" autoComplete="username"
          value={handle} onChange={e => setHandle(e.target.value.replace(/\s+/g,''))}
          placeholder="@ruan"
          hint="Aparece nos seus comentários e no link do seu perfil."
          error={errors.handle}/>

        <AuthField label="E-mail" type="email" autoComplete="email"
          value={email} onChange={e => setEmail(e.target.value)}
          placeholder="voce@email.com"
          error={errors.email}/>

        <AuthField label="Senha" type="password" autoComplete="new-password"
          value={password} onChange={e => setPassword(e.target.value)}
          placeholder="Mínimo 8 caracteres"
          error={errors.password}
          rightSlot={
            password ? (
              <span style={{fontSize:11, color:strength.color, fontWeight:700, letterSpacing:'.0625rem'}}>{strength.label}</span>
            ) : null
          }/>

        {password && (
          <div style={{display:'flex', gap:4, marginTop:-8, marginBottom:14}}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{
                flex:1, height:3, borderRadius:1,
                background: i <= strength.level ? strength.color : '#2a2a2a',
                transition:'background .15s',
              }}/>
            ))}
          </div>
        )}

        <label style={{display:'flex', alignItems:'flex-start', gap:8, marginBottom:8, cursor:'pointer'}}>
          <input type="checkbox" checked={accept} onChange={e => setAccept(e.target.checked)}
            style={{accentColor:'#ddda2a', width:14, height:14, marginTop:3, flexShrink:0}}/>
          <span style={{fontSize:12, color:'#bbb', letterSpacing:'.0625rem', lineHeight:1.5}}>
            Li e aceito os <a href="#" style={{color:'#ddda2a', textDecoration:'none'}}>Termos de Uso</a> e a <a href="#" style={{color:'#ddda2a', textDecoration:'none'}}>Política de Privacidade</a>.
          </span>
        </label>
        {errors.accept && <div style={{fontSize:11, color:'#ff784f', marginBottom:14, letterSpacing:'.0625rem'}}>{errors.accept}</div>}

        <AuthSubmit loading={loading}>Criar conta</AuthSubmit>
      </form>
    </AuthShell>
  );
}

window.RegisterPage = RegisterPage;
