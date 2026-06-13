// AdminPrimitives.jsx — primitivos compartilhados da área admin
// Reaproveita o vocabulário visual do UI kit (Icon lucide-like, Badge, Button, Avatar).

function Icon({ name, size = 20, strokeWidth = 2 }) {
  const paths = {
    menu: <path d="M3 6h18M3 12h18M3 18h18" />,
    home: <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z" />,
    book: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>,
    tag: <><path d="M20.59 13.41 13.42 20.58a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><circle cx="7" cy="7" r="1.4" fill="currentColor" stroke="none" /></>,
    news: <><path d="M4 4h16v16H4z" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
    users: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></>,
    layers: <><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></>,
    dollar: <><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></>,
    card: <><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></>,
    alert: <><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" /></>,
    edit: <><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z" /></>,
    trash: <><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></>,
    plus: <path d="M12 5v14M5 12h14" />,
    star: <polygon points="12 2 15 9 22 9 17 14 19 22 12 17 5 22 7 14 2 9 9 9" />,
    trending: <><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></>,
    chevronR: <path d="m9 18 6-6-6-6" />,
    chevronL: <path d="M15 18l-6-6 6-6" />,
    chevronD: <path d="m6 9 6 6 6-6" />,
    close: <path d="M18 6 6 18M6 6l12 12" />,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></>,
    award: <><circle cx="12" cy="8" r="6" /><path d="M15.5 12.5 17 22l-5-3-5 3 1.5-9.5" /></>,
  };
  return (
    <svg className="ic" width={size} height={size} viewBox="0 0 24 24" fill="none"
         stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
         style={{ display: 'block', flexShrink: 0 }}>
      {paths[name] || null}
    </svg>
  );
}

// Tom → cor de status (disciplinado: accent + neutros + coral)
const STATUS_TONE = {
  live:  { c: 'var(--st-live)',  bg: 'rgba(221,218,42,0.15)', b: 'rgba(221,218,42,0.45)' },
  open:  { c: 'var(--st-open)',  bg: 'rgba(221,218,42,0.10)', b: 'rgba(221,218,42,0.30)' },
  soon:  { c: 'var(--mr-fg-subtle)', bg: 'var(--mr-gray-800)', b: 'var(--mr-gray-700)' },
  ended: { c: 'var(--st-ended)', bg: 'rgba(255,120,79,0.13)', b: 'rgba(255,120,79,0.38)' },
};
const TONE_FILL = { live: 'var(--st-live)', open: 'var(--st-open)', soon: 'var(--st-soon)', ended: 'var(--st-ended)' };

function StatusPill({ tone = 'soon', children }) {
  const t = STATUS_TONE[tone] || STATUS_TONE.soon;
  return (
    <span className="adm-pill" style={{ background: t.bg, color: t.c, border: `1px solid ${t.b}` }}>
      <span className="dot" style={{ background: t.c }} />{children}
    </span>
  );
}

function Badge({ children, variant = 'accent' }) {
  const m = {
    accent:  { bg: 'rgba(221,218,42,0.15)', fg: 'var(--mr-accent)', b: 'rgba(221,218,42,0.5)' },
    neutral: { bg: 'var(--mr-gray-800)', fg: 'var(--mr-fg-muted)', b: 'var(--mr-gray-700)' },
    danger:  { bg: 'rgba(255,120,79,0.15)', fg: 'var(--mr-danger)', b: 'rgba(255,120,79,0.4)' },
  }[variant];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 9px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: m.bg, color: m.fg, border: `1px solid ${m.b}`, textTransform: 'uppercase', letterSpacing: '.08em', whiteSpace: 'nowrap' }}>
      {children}
    </span>
  );
}

function Button({ variant = 'raised', onClick, children, icon, danger, block, size = 'md' }) {
  const h = size === 'sm' ? 36 : 44;
  const base = { display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '0 16px', height: h, borderRadius: 2, fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all .3s', width: block ? '100%' : 'auto', letterSpacing: '.0625rem', fontFamily: 'inherit', whiteSpace: 'nowrap' };
  const styles = {
    primary: { ...base, background: 'var(--mr-accent)', color: 'var(--mr-primary)', border: '1px solid var(--mr-accent)' },
    raised:  { ...base, background: 'transparent', color: 'var(--mr-fg)', border: '1px solid var(--mr-tertiary)', boxShadow: '-0.25rem 0.25rem 0 0 rgba(221,218,42,0.25)' },
    ghost:   { ...base, background: 'var(--mr-secondary)', color: danger ? 'var(--mr-danger)' : 'var(--mr-fg)', border: `1px solid ${danger ? 'var(--mr-danger)' : 'var(--mr-tertiary)'}` },
  };
  return <button style={styles[variant]} onClick={onClick}>{icon && <Icon name={icon} size={16} />}{children}</button>;
}

function IconButton({ icon, onClick, danger, title }) {
  const [h, setH] = React.useState(false);
  return (
    <button title={title} onClick={onClick}
      onMouseEnter={() => setH(true)} onMouseLeave={() => setH(false)}
      style={{
        width: 32, height: 32, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 'var(--mr-radius-xs)', cursor: 'pointer', transition: 'all .25s',
        background: h ? (danger ? 'rgba(255,120,79,0.15)' : 'var(--mr-accent-25)') : 'transparent',
        border: `1px solid ${h ? (danger ? 'rgba(255,120,79,0.4)' : 'var(--mr-accent-50)') : 'var(--mr-border)'}`,
        color: danger ? 'var(--mr-danger)' : (h ? 'var(--mr-accent)' : 'var(--mr-fg-muted)'),
      }}>
      <Icon name={icon} size={15} />
    </button>
  );
}

function Avatar({ initials = '??', color = '#ddda2a', size = 36, photo }) {
  const fs = size <= 24 ? 10 : size <= 36 ? 13 : size <= 48 ? 15 : 20;
  if (photo) return <img src={photo} alt="" style={{ width: size, height: size, borderRadius: 2, objectFit: 'cover', flexShrink: 0 }} />;
  return (
    <div style={{ width: size, height: size, minWidth: size, borderRadius: 2, background: color, color: '#161616', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: fs, flexShrink: 0, letterSpacing: '.04em' }}>
      {initials}
    </div>
  );
}

Object.assign(window, { Icon, StatusPill, Badge, Button, IconButton, Avatar, TONE_FILL });
