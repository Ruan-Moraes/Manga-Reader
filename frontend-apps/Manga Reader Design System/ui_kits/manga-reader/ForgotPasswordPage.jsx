// ForgotPasswordPage.jsx — recuperação

function ForgotPasswordPage({ onNav }) {
  const [email, setEmail] = React.useState('');
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  const submit = (e) => {
    e.preventDefault();
    setError('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Informe um e-mail válido.');
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setSent(true);
      setLoading(false);
    }, 500);
  };

  if (sent) {
    return (
      <AuthShell
        eyebrow="Quase lá"
        title="Verifique seu e-mail"
        subtitle="Se essa conta existir no Manga Reader, você vai receber um link para criar uma nova senha em alguns instantes."
        footer={<>Não chegou? <a href="#" onClick={e => {e.preventDefault(); setSent(false);}} style={{color:'#ddda2a', fontWeight:700, textDecoration:'none', letterSpacing:'.0625rem'}}>Tentar de novo</a> · <a href="#" onClick={e => {e.preventDefault(); onNav('login');}} style={{color:'#ddda2a', fontWeight:700, textDecoration:'none', letterSpacing:'.0625rem'}}>Voltar ao login</a></>}
      >
        <div style={{
          padding:'20px 18px',
          background:'rgba(16,185,129,0.08)',
          border:'1px solid rgba(16,185,129,0.35)',
          borderRadius:4,
          display:'flex', gap:14, alignItems:'flex-start',
        }}>
          <div style={{
            width:36, height:36, flexShrink:0,
            background:'rgba(16,185,129,0.18)', borderRadius:2,
            display:'flex', alignItems:'center', justifyContent:'center',
            color:'#10b981', fontSize:18,
          }}>✓</div>
          <div style={{flex:1, minWidth:0}}>
            <div style={{fontSize:13, fontWeight:700, color:'#fff', marginBottom:4, letterSpacing:'.0625rem'}}>
              Link enviado para <span style={{color:'#ddda2a'}}>{email}</span>
            </div>
            <div style={{fontSize:12, color:'#bbb', lineHeight:1.6}}>
              O link expira em 30 minutos. Verifique também a pasta de spam.
            </div>
          </div>
        </div>

        <div style={{marginTop:18}}>
          <div style={{fontSize:11, fontWeight:800, color:'#ddda2a', textTransform:'uppercase', letterSpacing:'.12em', marginBottom:8}}>
            Próximos passos
          </div>
          <ol style={{margin:0, paddingLeft:20, color:'#bbb', fontSize:13, lineHeight:1.7}}>
            <li>Abra o e-mail com o assunto "Redefinir senha"</li>
            <li>Clique no botão dentro da mensagem</li>
            <li>Defina sua nova senha</li>
          </ol>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Recuperar acesso"
      title="Esqueceu a senha?"
      subtitle="Tudo bem. Informe o e-mail cadastrado e enviaremos um link para redefinir."
      footer={<>Lembrou? <a href="#" onClick={e => {e.preventDefault(); onNav('login');}} style={{color:'#ddda2a', fontWeight:700, textDecoration:'none', letterSpacing:'.0625rem'}}>Voltar ao login</a></>}
    >
      <form onSubmit={submit} noValidate>
        <AuthField label="E-mail cadastrado" type="email" autoComplete="email"
          value={email} onChange={e => setEmail(e.target.value)}
          placeholder="voce@email.com"
          hint="Vamos enviar instruções para esse endereço."
          error={error}/>

        <AuthSubmit loading={loading}>Enviar link de recuperação</AuthSubmit>
      </form>
    </AuthShell>
  );
}

window.ForgotPasswordPage = ForgotPasswordPage;
