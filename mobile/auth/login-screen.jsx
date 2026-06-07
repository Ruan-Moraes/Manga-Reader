// login-screen.jsx — Manga Reader · tela de login nativa (iOS)
// Exports to window: LoginScreen — consome auth-kit.jsx + login-icons.jsx

function LoginScreen({
  layout = 'mascote', radius = 2, heading = 'Que bom te ver de novo',
  showSocial = true, showBiometric = true, showDemo = true,
  reviewState = 'interativo', onNavigate = () => {},
}) {
  const MR = window.MR_TOKENS;
  const DEMO = window.DEMO_CREDS;
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [showPw, setShowPw] = React.useState(false);
  const [remember, setRemember] = React.useState(true);
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);
  const timer = React.useRef(null);

  const forcedError = reviewState === 'erro';
  const forcedLoading = reviewState === 'carregando';
  const forcedSuccess = reviewState === 'sucesso';
  const showError = error || forcedError;
  const showLoading = loading || forcedLoading;
  const showSuccess = success || forcedSuccess;

  React.useEffect(() => () => clearTimeout(timer.current), []);

  const submit = (e) => {
    if (e) e.preventDefault();
    if (loading) return;
    setError(''); setLoading(true);
    timer.current = setTimeout(() => {
      setLoading(false);
      if (email.trim().toLowerCase() === DEMO.email && password === DEMO.password) setSuccess(true);
      else setError('E-mail ou senha incorretos. Use as credenciais demo abaixo.');
    }, 700);
  };

  const fillDemo = () => { setEmail(DEMO.email); setPassword(DEMO.password); setError(''); };
  const reset = () => { setSuccess(false); setEmail(''); setPassword(''); setError(''); };
  const errMsg = forcedError ? 'E-mail ou senha incorretos. Use as credenciais demo abaixo.' : error;

  if (showSuccess) {
    return (
      <div style={window.authScreenStyle({ justifyContent: 'center', alignItems: 'center', textAlign: 'center' })}>
        <div style={{ position: 'relative', marginBottom: 22 }}>
          <div style={{
            position: 'absolute', inset: '-18% -10%',
            background: 'radial-gradient(circle at 50% 45%, var(--accent-glow), transparent 62%)',
          }} />
          <img src="assets/feliz.png" alt="" width={148} height={148}
            style={{ position: 'relative', display: 'block', width: 148, height: 148 }} />
        </div>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 14,
          padding: '5px 12px', borderRadius: 999, background: 'rgba(16,185,129,0.12)',
          border: '1px solid rgba(16,185,129,0.4)', color: MR.success,
          fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          <MRIcon name="check" size={13} color={MR.success} /> Conectado
        </div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, lineHeight: 1.2, letterSpacing: MR.ls }}>Que bom te ver!</h1>
        <p style={{ margin: '14px 0 26px', fontSize: 13, lineHeight: 1.5, color: MR.subtle, letterSpacing: MR.ls, maxWidth: 280 }}>
          Sua biblioteca está sincronizada. Vamos continuar de onde você parou.
        </p>
        <button type="button" onClick={reset} style={{
          height: 52, padding: '0 28px', background: 'var(--accent)', color: MR.bg,
          border: 'none', borderRadius: radius, fontFamily: MR.font,
          fontSize: 14, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase',
          cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
        }}>
          Continuar <MRIcon name="arrow-right" size={18} color={MR.bg} />
        </button>
      </div>
    );
  }

  return (
    <div style={window.authScreenStyle()}>
      <window.AuthHeader
        layout={layout} radius={radius} mascot="feliz.png"
        eyebrow="Bem-vindo de volta" title={heading}
        sub="Acesse sua biblioteca, continue de onde parou e participe da comunidade."
      />

      <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column' }}>
        <window.Field
          label="E-mail" type="email" icon="mail" radius={radius}
          autoComplete="email" inputMode="email"
          value={email} onChange={(v) => { setEmail(v); if (error) setError(''); }}
          placeholder="voce@email.com" error={showError ? ' ' : ''}
        />
        <window.Field
          label="Senha" type={showPw ? 'text' : 'password'} icon="lock" radius={radius}
          autoComplete="current-password"
          value={password} onChange={(v) => { setPassword(v); if (error) setError(''); }}
          placeholder="••••••••" error={errMsg}
          rightSlot={
            <a href="#" onClick={(ev) => { ev.preventDefault(); onNavigate('forgot'); }} style={{
              fontSize: 11, color: MR.subtle, letterSpacing: MR.ls, textDecoration: 'none', whiteSpace: 'nowrap',
            }}>Esqueci a senha</a>
          }
          trailing={
            <button type="button" onClick={() => setShowPw((s) => !s)}
              aria-label={showPw ? 'Esconder senha' : 'Mostrar senha'}
              style={{
                position: 'absolute', right: 8, height: 36, width: 36,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent', border: 'none', cursor: 'pointer', color: MR.tertiary, padding: 0,
              }}>
              <MRIcon name={showPw ? 'eye-off' : 'eye'} size={18} />
            </button>
          }
        />

        <window.AuthCheckbox checked={remember} onChange={() => setRemember((r) => !r)} radius={radius}>
          Manter sessão ativa neste dispositivo
        </window.AuthCheckbox>
        <div style={{ height: 6 }} />

        <window.PrimaryButton type="submit" loading={showLoading} radius={radius}>Entrar</window.PrimaryButton>

        {showBiometric && (
          <div style={{ marginTop: 12 }}>
            <window.GhostButton icon="face-id" radius={radius}>Entrar com Face ID</window.GhostButton>
          </div>
        )}

        {showSocial && <window.SocialRow radius={radius} />}

        {showDemo && (
          <div style={{
            marginTop: 22, padding: 14, borderRadius: Math.min(radius + 2, 6),
            background: 'rgba(221,218,42,0.06)', border: '1px dashed rgba(221,218,42,0.35)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12,
          }}>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{
                fontSize: 10, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase',
                color: 'var(--accent)', marginBottom: 7,
              }}>Credenciais de demonstração</div>
              <div style={{ fontFamily: MR.mono, fontSize: 12, color: MR.muted, lineHeight: 1.7, wordBreak: 'break-all' }}>
                <div>{DEMO.email}</div>
                <div>{DEMO.password}</div>
              </div>
            </div>
            <button type="button" onClick={fillDemo} style={{
              flexShrink: 0, padding: '7px 11px', background: 'transparent',
              border: '1px solid var(--accent)', borderRadius: radius, color: 'var(--accent)',
              fontFamily: MR.font, fontSize: 10, fontWeight: 800, letterSpacing: '0.1em',
              textTransform: 'uppercase', cursor: 'pointer',
            }}>Preencher</button>
          </div>
        )}
      </form>

      <window.AuthFooter prompt="Ainda não tem conta?" action="Criar conta" onAction={() => onNavigate('register')} />
    </div>
  );
}

window.LoginScreen = LoginScreen;
