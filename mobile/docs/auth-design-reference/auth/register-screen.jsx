// register-screen.jsx — Manga Reader · tela de cadastro nativa (iOS)
// Exports to window: RegisterScreen — consome auth-kit.jsx + login-icons.jsx

const TAKEN_EMAIL = 'leitor@manga-reader.app';

function RegisterScreen({ layout = 'mascote', radius = 2, heading = 'Criar conta', showSocial = true, reviewState = 'interativo', onNavigate = () => {} }) {
    const MR = window.MR_TOKENS;
    const [email, setEmail] = React.useState('');
    const [name, setName] = React.useState('');
    const [pw, setPw] = React.useState('');
    const [pw2, setPw2] = React.useState('');
    const [showPw, setShowPw] = React.useState(false);
    const [terms, setTerms] = React.useState(false);
    const [news, setNews] = React.useState(false);
    const [errors, setErrors] = React.useState({});
    const [loading, setLoading] = React.useState(false);
    const [success, setSuccess] = React.useState(false);
    const timer = React.useRef(null);
    React.useEffect(() => () => clearTimeout(timer.current), []);

    const forcedErr = reviewState === 'erro';
    const showLoading = loading || reviewState === 'carregando';
    const showSuccess = success || reviewState === 'sucesso';
    const e = forcedErr ? { email: 'Esse e-mail já está cadastrado.' } : errors;

    const set = (k, v, fn) => {
        fn(v);
        if (errors[k])
            setErrors(p => {
                const n = { ...p };
                delete n[k];
                return n;
            });
    };

    const submit = ev => {
        if (ev) ev.preventDefault();
        if (loading) return;
        const next = {};
        if (!email.trim()) next.email = 'Informe seu e-mail.';
        else if (email.trim().toLowerCase() === TAKEN_EMAIL) next.email = 'Esse e-mail já está cadastrado.';
        if (!name.trim()) next.name = 'Escolha um nome de exibição.';
        if (window.passwordStrength(pw).score < 2) next.pw = 'Senha precisa ter ao menos 8 caracteres e um número.';
        if (pw2 && pw2 !== pw) next.pw2 = 'As senhas não coincidem.';
        if (!terms) next.terms = 'É preciso aceitar os termos pra continuar.';
        setErrors(next);
        if (Object.keys(next).length) return;
        setLoading(true);
        timer.current = setTimeout(() => {
            setLoading(false);
            setSuccess(true);
        }, 800);
    };

    if (showSuccess) {
        return (
            <div style={window.authScreenStyle({ justifyContent: 'center', alignItems: 'center', textAlign: 'center' })}>
                <div style={{ position: 'relative', marginBottom: 22 }}>
                    <div
                        style={{
                            position: 'absolute',
                            inset: '-18% -10%',
                            background: 'radial-gradient(circle at 50% 45%, var(--accent-glow), transparent 62%)',
                        }}
                    />
                    <img
                        src="assets/surpresa.png?v=2"
                        alt=""
                        width={148}
                        height={148}
                        style={{ position: 'relative', display: 'block', width: 148, height: 148 }}
                    />
                </div>
                <div
                    style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 7,
                        marginBottom: 14,
                        padding: '5px 12px',
                        borderRadius: 999,
                        background: 'rgba(16,185,129,0.12)',
                        border: '1px solid rgba(16,185,129,0.4)',
                        color: MR.success,
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                    }}
                >
                    <MRIcon name="check" size={13} color={MR.success} /> Conta criada
                </div>
                <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, lineHeight: 1.2, letterSpacing: MR.ls }}>Bem-vindo à comunidade!</h1>
                <p style={{ margin: '14px 0 26px', fontSize: 13, lineHeight: 1.5, color: MR.subtle, letterSpacing: MR.ls, maxWidth: 290 }}>
                    Sua biblioteca está pronta. Comece a montar sua estante e a seguir grupos.
                </p>
                <button
                    type="button"
                    onClick={() => onNavigate('login')}
                    style={{
                        height: 52,
                        padding: '0 28px',
                        background: 'var(--accent)',
                        color: MR.bg,
                        border: 'none',
                        borderRadius: radius,
                        fontFamily: MR.font,
                        fontSize: 14,
                        fontWeight: 800,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                    }}
                >
                    Explorar agora <MRIcon name="arrow-right" size={18} color={MR.bg} />
                </button>
            </div>
        );
    }

    return (
        <div style={window.authScreenStyle()}>
            <window.AuthHeader
                layout={layout}
                radius={radius}
                mascot="surpresa.png?v=2"
                eyebrow="Junte-se à comunidade"
                title={heading}
                sub="É grátis e sem anúncios. Leve sua estante pra qualquer lugar."
            />

            <form onSubmit={submit} noValidate style={{ display: 'flex', flexDirection: 'column' }}>
                <window.Field
                    label="E-mail"
                    type="email"
                    icon="mail"
                    radius={radius}
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={v => set('email', v, setEmail)}
                    placeholder="voce@email.com"
                    error={e.email}
                />
                <window.Field
                    label="Nome de exibição"
                    icon="user"
                    radius={radius}
                    autoComplete="nickname"
                    value={name}
                    onChange={v => set('name', v, setName)}
                    placeholder="Como a comunidade vai te ver"
                    error={e.name}
                />
                <window.Field
                    label="Senha"
                    type={showPw ? 'text' : 'password'}
                    icon="lock"
                    radius={radius}
                    autoComplete="new-password"
                    value={pw}
                    onChange={v => set('pw', v, setPw)}
                    placeholder="Crie uma senha forte"
                    error={e.pw}
                    trailing={
                        <button
                            type="button"
                            onClick={() => setShowPw(s => !s)}
                            aria-label={showPw ? 'Esconder senha' : 'Mostrar senha'}
                            style={{
                                position: 'absolute',
                                right: 8,
                                height: 36,
                                width: 36,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: 'transparent',
                                border: 'none',
                                cursor: 'pointer',
                                color: MR.tertiary,
                                padding: 0,
                            }}
                        >
                            <MRIcon name={showPw ? 'eye-off' : 'eye'} size={18} />
                        </button>
                    }
                />
                {!e.pw && <window.StrengthMeter value={pw} />}
                <window.Field
                    label="Confirmar senha"
                    type={showPw ? 'text' : 'password'}
                    icon="lock"
                    radius={radius}
                    autoComplete="new-password"
                    value={pw2}
                    onChange={v => set('pw2', v, setPw2)}
                    placeholder="Repita a senha"
                    error={e.pw2}
                />

                <div style={{ height: 4 }} />
                <window.AuthCheckbox checked={terms} onChange={() => set('terms', !terms, setTerms)} error={e.terms} radius={radius}>
                    Li e aceito os <span style={{ color: 'var(--accent)', fontWeight: 700 }}>Termos</span> e a{' '}
                    <span style={{ color: 'var(--accent)', fontWeight: 700 }}>Política de Privacidade</span>.
                </window.AuthCheckbox>
                {e.terms && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, margin: '-8px 0 12px', fontSize: 11, color: MR.danger, letterSpacing: MR.ls }}>
                        <MRIcon name="alert" size={13} />
                        <span>{e.terms}</span>
                    </div>
                )}
                <window.AuthCheckbox checked={news} onChange={() => setNews(n => !n)} radius={radius}>
                    Quero receber novidades e lançamentos por e-mail (opcional).
                </window.AuthCheckbox>

                <div style={{ height: 6 }} />
                <window.PrimaryButton type="submit" loading={showLoading} radius={radius}>
                    Criar conta
                </window.PrimaryButton>

                {showSocial && <window.SocialRow radius={radius} caption="ou cadastre-se com" />}
            </form>

            <window.AuthFooter prompt="Já tem conta?" action="Entrar" onAction={() => onNavigate('login')} />
        </div>
    );
}

window.RegisterScreen = RegisterScreen;
