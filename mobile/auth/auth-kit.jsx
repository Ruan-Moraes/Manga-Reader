// auth-kit.jsx — Manga Reader · primitivas compartilhadas das telas de auth
// Exports to window: MR_TOKENS, DEMO_CREDS, Wordmark, LogoMark, AuthHeader,
//   Field, Spinner, SocialButton, AuthCheckbox, StrengthMeter, PrimaryButton,
//   GhostButton, SocialRow, AuthFooter, passwordStrength
// Consome MRIcon (login-icons.jsx) e os tokens de colors_and_type.css

const MR = {
    bg: '#161616',
    inputBg: '#0f0f0f',
    inputBorder: '#2a2a2a',
    surface: '#252526',
    danger: '#FF784F',
    success: '#10b981',
    warn: '#e0a32e',
    text: '#ffffff',
    muted: '#cccccc',
    subtle: '#999999',
    tertiary: '#727273',
    mono: "'Fira Code','JetBrains Mono',ui-monospace,Menlo,Consolas,monospace",
    font: "'Nunito Sans',system-ui,-apple-system,Segoe UI,Roboto,sans-serif",
    ls: '0.0625rem',
};

const DEMO = { email: 'leitor@manga-reader.app', password: 'mangareader' };

// ── Marca ──────────────────────────────────────────────────
function Wordmark({ size = 18 }) {
    return (
        <span
            style={{
                fontStyle: 'italic',
                fontWeight: 800,
                fontSize: size,
                letterSpacing: '1.4px',
                color: MR.text,
                lineHeight: 1,
                whiteSpace: 'nowrap',
            }}
        >
            Manga <span style={{ color: 'var(--accent)' }}>Reader</span>
        </span>
    );
}

function LogoMark({ box = 40, radius = 2 }) {
    return (
        <div
            style={{
                width: box,
                height: box,
                borderRadius: radius,
                overflow: 'hidden',
                flexShrink: 0,
                background: '#000',
                boxShadow: '0 0 0 1px rgba(221,218,42,0.25)',
            }}
        >
            <img src="assets/logo.png" alt="" width={box} height={box} style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
    );
}

// ── Cabeçalho de auth (varia por layout/tela) ──────────────
function AuthHeader({ layout = 'mascote', eyebrow, title, sub, mascot, radius = 2, titleSize }) {
    const Eyebrow = eyebrow ? (
        <div
            style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--accent)',
                marginBottom: 8,
            }}
        >
            {eyebrow}
        </div>
    ) : null;
    const Title = (
        <h1
            style={{
                margin: 0,
                fontSize: titleSize || (layout === 'minimal' ? 30 : 26),
                fontWeight: 800,
                lineHeight: 1.15,
                letterSpacing: MR.ls,
                color: MR.text,
                textWrap: 'balance',
            }}
        >
            {title}
        </h1>
    );
    const Sub = sub ? (
        <p
            style={{
                margin: '10px 0 0',
                fontSize: 13,
                lineHeight: 1.5,
                color: MR.subtle,
                letterSpacing: MR.ls,
                maxWidth: 320,
            }}
        >
            {sub}
        </p>
    ) : null;

    if (layout === 'minimal') {
        return (
            <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 36 }}>
                    <LogoMark box={32} radius={radius} />
                    <Wordmark size={16} />
                </div>
                {Eyebrow}
                {Title}
                {Sub}
            </div>
        );
    }

    if (layout === 'logo') {
        return (
            <div style={{ textAlign: 'center', marginBottom: 28 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14, marginBottom: 22 }}>
                    <LogoMark box={68} radius={Math.min(radius * 1.6, 18)} />
                    <Wordmark size={20} />
                </div>
                {Eyebrow}
                {Title}
                <div style={{ display: 'flex', justifyContent: 'center' }}>{Sub}</div>
            </div>
        );
    }

    // mascote
    return (
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 9,
                    marginBottom: 18,
                }}
            >
                <LogoMark box={28} radius={radius} />
                <Wordmark size={16} />
            </div>
            {mascot && (
                <div style={{ position: 'relative', display: 'inline-block', marginBottom: 14 }}>
                    <div
                        style={{
                            position: 'absolute',
                            inset: '-14% -6%',
                            background: 'radial-gradient(circle at 50% 42%, var(--accent-glow), transparent 62%)',
                            pointerEvents: 'none',
                        }}
                    />
                    <img
                        src={'assets/' + mascot}
                        alt=""
                        width={108}
                        height={108}
                        style={{ position: 'relative', display: 'block', width: 108, height: 108, objectFit: 'contain' }}
                    />
                </div>
            )}
            {Eyebrow}
            {Title}
            <div style={{ display: 'flex', justifyContent: 'center' }}>{Sub}</div>
        </div>
    );
}

// ── Campo ──────────────────────────────────────────────────
function Field({ label, type = 'text', value, onChange, placeholder, icon, error, hint, autoComplete, inputMode, rightSlot, radius = 2, trailing, onBlur }) {
    const [focused, setFocused] = React.useState(false);
    const border = error ? MR.danger : focused ? 'var(--accent)' : MR.inputBorder;
    return (
        <label style={{ display: 'block', marginBottom: 16 }}>
            <div
                style={{
                    display: 'flex',
                    alignItems: 'baseline',
                    justifyContent: 'space-between',
                    marginBottom: 7,
                }}
            >
                <span
                    style={{
                        fontSize: 11,
                        fontWeight: 800,
                        letterSpacing: '0.1em',
                        textTransform: 'uppercase',
                        color: error ? MR.danger : 'var(--accent)',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {label}
                </span>
                {rightSlot}
            </div>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                {icon && (
                    <span
                        style={{
                            position: 'absolute',
                            left: 14,
                            display: 'flex',
                            pointerEvents: 'none',
                            color: focused ? 'var(--accent)' : MR.tertiary,
                            transition: 'color .15s',
                        }}
                    >
                        <MRIcon name={icon} size={18} />
                    </span>
                )}
                <input
                    type={type}
                    value={value}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    inputMode={inputMode}
                    onChange={e => onChange(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => {
                        setFocused(false);
                        if (onBlur) onBlur();
                    }}
                    style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        height: 52,
                        padding: `0 ${trailing ? 46 : 14}px 0 ${icon ? 42 : 14}px`,
                        background: MR.inputBg,
                        color: MR.text,
                        border: `1px solid ${border}`,
                        borderRadius: radius,
                        fontFamily: MR.font,
                        fontSize: 15,
                        letterSpacing: MR.ls,
                        outline: 'none',
                        transition: 'border-color .15s',
                    }}
                />
                {trailing}
            </div>
            {error && typeof error === 'string' && error.trim() ? (
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        marginTop: 7,
                        fontSize: 11,
                        color: MR.danger,
                        letterSpacing: MR.ls,
                    }}
                >
                    <MRIcon name="alert" size={13} />
                    <span>{error}</span>
                </div>
            ) : hint ? (
                <div style={{ marginTop: 7, fontSize: 11, color: MR.tertiary, letterSpacing: MR.ls }}>{hint}</div>
            ) : null}
        </label>
    );
}

// ── Medidor de força de senha ──────────────────────────────
function passwordStrength(pw) {
    if (!pw) return { score: 0, label: '', tone: MR.tertiary };
    let s = 0;
    if (pw.length >= 8) s++;
    if (/[0-9]/.test(pw)) s++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
    if (/[^A-Za-z0-9]/.test(pw)) s++;
    if (pw.length >= 12) s++;
    const score = Math.min(s, 4);
    const map = {
        1: { label: 'Fraca', tone: MR.danger },
        2: { label: 'Razoável', tone: MR.warn },
        3: { label: 'Boa', tone: '#8bc34a' },
        4: { label: 'Forte', tone: MR.success },
    };
    return { score, ...(map[score] || { label: 'Fraca', tone: MR.danger }) };
}

function StrengthMeter({ value }) {
    const { score, label, tone } = passwordStrength(value);
    return (
        <div style={{ margin: '-6px 0 16px' }}>
            <div style={{ display: 'flex', gap: 5 }}>
                {[1, 2, 3, 4].map(i => (
                    <span
                        key={i}
                        style={{
                            flex: 1,
                            height: 4,
                            borderRadius: 999,
                            background: i <= score ? tone : MR.inputBorder,
                            transition: 'background .2s',
                        }}
                    />
                ))}
            </div>
            <output
                aria-live="polite"
                style={{
                    display: 'block',
                    marginTop: 6,
                    fontSize: 11,
                    letterSpacing: MR.ls,
                    color: score ? tone : MR.tertiary,
                    minHeight: 14,
                }}
            >
                {score ? `Senha ${label.toLowerCase()}` : 'Mín. 8 caracteres, com número'}
            </output>
        </div>
    );
}

// ── Checkbox ───────────────────────────────────────────────
function AuthCheckbox({ checked, onChange, children, error, radius = 2 }) {
    return (
        <button
            type="button"
            onClick={onChange}
            style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                background: 'transparent',
                border: 'none',
                padding: '2px 0',
                margin: '0 0 14px',
                cursor: 'pointer',
                color: error ? MR.danger : MR.muted,
                fontFamily: MR.font,
                fontSize: 13,
                letterSpacing: MR.ls,
                textAlign: 'left',
                lineHeight: 1.45,
                width: '100%',
            }}
        >
            <span
                style={{
                    width: 20,
                    height: 20,
                    flexShrink: 0,
                    marginTop: 1,
                    borderRadius: Math.min(radius, 4),
                    border: `1.5px solid ${checked ? 'var(--accent)' : error ? MR.danger : MR.tertiary}`,
                    background: checked ? 'var(--accent)' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all .15s',
                }}
            >
                {checked && <MRIcon name="check" size={13} color={MR.bg} strokeWidth={3} />}
            </span>
            <span>{children}</span>
        </button>
    );
}

// ── Botões ─────────────────────────────────────────────────
function Spinner({ color }) {
    return (
        <span
            style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                border: `2px solid ${color}`,
                borderTopColor: 'transparent',
                display: 'inline-block',
                animation: 'mr-spin .7s linear infinite',
            }}
        />
    );
}

function PrimaryButton({ children, onClick, type = 'button', loading, disabled, radius = 2 }) {
    const off = loading || disabled;
    return (
        <button
            type={type}
            onClick={onClick}
            disabled={off}
            style={{
                height: 54,
                width: '100%',
                border: 'none',
                borderRadius: radius,
                background: off ? MR.inputBorder : 'var(--accent)',
                color: off ? '#666' : MR.bg,
                fontFamily: MR.font,
                fontSize: 14,
                fontWeight: 800,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                cursor: off ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                whiteSpace: 'nowrap',
                transition: 'background .2s',
            }}
        >
            {loading ? (
                <>
                    <Spinner color="#666" /> Aguarde…
                </>
            ) : (
                children
            )}
        </button>
    );
}

function GhostButton({ children, onClick, icon, radius = 2, disabled, accentShadow = true }) {
    return (
        <button
            type="button"
            onClick={onClick}
            disabled={disabled}
            style={{
                height: 54,
                width: '100%',
                background: 'transparent',
                color: disabled ? MR.tertiary : MR.text,
                border: `1px solid ${MR.tertiary}`,
                borderRadius: radius,
                boxShadow: accentShadow && !disabled ? '-0.25rem 0.25rem 0 0 var(--accent-25)' : 'none',
                fontFamily: MR.font,
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: MR.ls,
                cursor: disabled ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                whiteSpace: 'nowrap',
                transition: 'opacity .2s',
            }}
        >
            {icon && <MRIcon name={icon} size={20} color={disabled ? MR.tertiary : 'var(--accent)'} />}
            {children}
        </button>
    );
}

function SocialButton({ icon, label, radius = 2, onPress }) {
    const [press, setPress] = React.useState(false);
    return (
        <button
            type="button"
            onClick={onPress}
            onPointerDown={() => setPress(true)}
            onPointerUp={() => setPress(false)}
            onPointerLeave={() => setPress(false)}
            style={{
                flex: 1,
                height: 52,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 9,
                background: MR.surface,
                color: MR.text,
                border: `1px solid ${MR.tertiary}`,
                borderRadius: radius,
                fontFamily: MR.font,
                fontSize: 14,
                fontWeight: 700,
                letterSpacing: MR.ls,
                cursor: 'pointer',
                transition: 'transform .12s, background .2s',
                transform: press ? 'scale(0.97)' : 'none',
            }}
        >
            <MRIcon name={icon} size={20} color={MR.text} />
            {label}
        </button>
    );
}

function SocialRow({ radius = 2, caption = 'ou continue com' }) {
    return (
        <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '22px 0 18px' }}>
                <span style={{ flex: 1, height: 1, background: MR.inputBorder }} />
                <span
                    style={{
                        fontSize: 11,
                        color: MR.tertiary,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {caption}
                </span>
                <span style={{ flex: 1, height: 1, background: MR.inputBorder }} />
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
                <SocialButton icon="google" label="Google" radius={radius} onPress={() => {}} />
                <SocialButton icon="apple" label="Apple" radius={radius} onPress={() => {}} />
            </div>
        </>
    );
}

function AuthFooter({ prompt, action, onAction }) {
    return (
        <div
            style={{
                marginTop: 24,
                paddingTop: 20,
                borderTop: `1px solid ${MR.inputBorder}`,
                textAlign: 'center',
                fontSize: 13,
                color: MR.subtle,
                letterSpacing: MR.ls,
            }}
        >
            {prompt}{' '}
            <a
                href="#"
                onClick={e => {
                    e.preventDefault();
                    onAction && onAction();
                }}
                style={{
                    color: 'var(--accent)',
                    fontWeight: 700,
                    textDecoration: 'none',
                }}
            >
                {action}
            </a>
        </div>
    );
}

// helper p/ o container de tela
function authScreenStyle(extra = {}) {
    return {
        minHeight: '100%',
        boxSizing: 'border-box',
        background: MR.bg,
        color: MR.text,
        fontFamily: MR.font,
        letterSpacing: MR.ls,
        padding: '58px 24px 36px',
        display: 'flex',
        flexDirection: 'column',
        ...extra,
    };
}

Object.assign(window, {
    MR_TOKENS: MR,
    DEMO_CREDS: DEMO,
    Wordmark,
    LogoMark,
    AuthHeader,
    Field,
    passwordStrength,
    StrengthMeter,
    AuthCheckbox,
    Spinner,
    PrimaryButton,
    GhostButton,
    SocialButton,
    SocialRow,
    AuthFooter,
    authScreenStyle,
});
