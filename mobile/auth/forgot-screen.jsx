// forgot-screen.jsx — Manga Reader · recuperar senha (iOS)
// Exports to window: ForgotScreen — consome auth-kit.jsx + login-icons.jsx
// Passo 1: pedir e-mail · Passo 2: link enviado (cooldown 30s p/ reenviar)

function ForgotScreen({
  radius = 2, reviewState = 'interativo', onNavigate = () => {},
}) {
  const MR = window.MR_TOKENS;
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [cooldown, setCooldown] = React.useState(0);
  const timer = React.useRef(null);
  const tick = React.useRef(null);

  const showSent = sent || reviewState === 'enviado';
  const showLoading = loading || reviewState === 'carregando';
  const sentEmail = email.trim() || 'voce@email.com';

  React.useEffect(() => () => { clearTimeout(timer.current); clearInterval(tick.current); }, []);

  const startCooldown = () => {
    setCooldown(30);
    clearInterval(tick.current);
    tick.current = setInterval(() => {
      setCooldown((c) => { if (c <= 1) { clearInterval(tick.current); return 0; } return c - 1; });
    }, 1000);
  };

  const submit = (ev) => {
    if (ev) ev.preventDefault();
    if (loading) return;
    if (!email.trim() || !/.+@.+\..+/.test(email.trim())) { setError('Informe um e-mail válido.'); return; }
    setError(''); setLoading(true);
    timer.current = setTimeout(() => { setLoading(false); setSent(true); startCooldown(); }, 700);
  };

  const resend = () => { if (cooldown === 0) startCooldown(); };
  const retry = () => { setSent(false); setError(''); setCooldown(0); clearInterval(tick.current); };

  // ── Passo 2: link enviado ────────────────────────────────
  if (showSent) {
    return (
      <div style={window.authScreenStyle({ justifyContent: 'center', alignItems: 'center', textAlign: 'center' })}>
        <div style={{ position: 'relative', marginBottom: 20 }}>
          <div style={{
            position: 'absolute', inset: '-16% -8%',
            background: 'radial-gradient(circle at 50% 45%, var(--accent-glow), transparent 62%)',
          }} />
          <img src="assets/pensando.png" alt="" width={140} height={140}
            style={{ position: 'relative', display: 'block', width: 140, height: 140, objectFit: 'contain' }} />
        </div>
        <div role="status" style={{
          display: 'inline-flex', alignItems: 'center', gap: 7, marginBottom: 14,
          padding: '5px 12px', borderRadius: 999, background: 'var(--accent-25)',
          border: '1px solid var(--accent-50)', color: 'var(--accent)',
          fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>
          <MRIcon name="send" size={13} color="var(--accent)" /> Link enviado
        </div>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, lineHeight: 1.2, letterSpacing: MR.ls }}>Olha sua caixa de entrada</h1>
        <p style={{ margin: '14px 0 28px', fontSize: 13, lineHeight: 1.6, color: MR.subtle, letterSpacing: MR.ls, maxWidth: 300 }}>
          Mandamos um link de recuperação para{' '}
          <strong style={{ color: MR.text, wordBreak: 'break-all' }}>{sentEmail}</strong>. Ele vale por 30 minutos.
        </p>
        <div style={{ width: '100%', maxWidth: 340 }}>
          <window.GhostButton icon="mail" radius={radius} disabled={cooldown > 0} onClick={resend}>
            {cooldown > 0 ? `Reenviar em ${cooldown}s` : 'Não chegou? Reenviar'}
          </window.GhostButton>
        </div>
        <button type="button" onClick={retry} style={{
          marginTop: 18, background: 'transparent', border: 'none', cursor: 'pointer',
          color: MR.subtle, fontFamily: MR.font, fontSize: 13, letterSpacing: MR.ls,
        }}>
          Errou o e-mail? <span style={{ color: 'var(--accent)', fontWeight: 700 }}>Tentar de novo</span>
        </button>
      </div>
    );
  }

  // ── Passo 1: pedir e-mail ────────────────────────────────
  return (
    <div style={window.authScreenStyle()}>
      <button type="button" onClick={() => onNavigate('login')} aria-label="Voltar"
        style={{
          alignSelf: 'flex-start', display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'transparent', border: 'none', cursor: 'pointer', padding: '0 0 22px',
          color: MR.subtle, fontFamily: MR.font, fontSize: 13, letterSpacing: MR.ls, whiteSpace: 'nowrap',
        }}>
        <MRIcon name="arrow-left" size={18} /> Voltar pro login
      </button>

      <window.AuthHeader
        layout="minimal" radius={radius}
        eyebrow="Recuperar acesso" title="Esqueci a senha"
        sub="Sem problema. Informe o e-mail da sua conta e enviamos um link para você criar uma nova senha."
      />

      <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column' }}>
        <window.Field
          label="E-mail cadastrado" type="email" icon="mail" radius={radius}
          autoComplete="email" inputMode="email"
          value={email} onChange={(v) => { setEmail(v); if (error) setError(''); }}
          placeholder="voce@email.com" error={error}
          hint="Por segurança, mostramos a confirmação mesmo se o e-mail não estiver cadastrado."
        />
        <div style={{ height: 6 }} />
        <window.PrimaryButton type="submit" loading={showLoading} radius={radius}>Enviar link</window.PrimaryButton>
      </form>

      <window.AuthFooter prompt="Lembrou a senha?" action="Voltar pro login" onAction={() => onNavigate('login')} />
    </div>
  );
}

window.ForgotScreen = ForgotScreen;
