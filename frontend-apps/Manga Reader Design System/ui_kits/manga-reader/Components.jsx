// Components.jsx — shared UI primitives (single source of truth)

function Icon({ name, size = 20 }) {
  const s = size, st = 2;
  const paths = {
    menu: <><path d="M3 6h18M3 12h18M3 18h18" /></>,
    search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.35-4.35" /></>,
    bookmark: <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />,
    user: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    home: <><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2z" /></>,
    library: <><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></>,
    star: <polygon points="12 2 15 9 22 9 17 14 19 22 12 17 5 22 7 14 2 9 9 9" />,
    heart: <path d="M20.84 4.6a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.07a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.79 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />,
    comment: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
    close: <><path d="M18 6 6 18M6 6l12 12" /></>,
    chevronL: <path d="M15 18l-6-6 6-6" />,
    chevronR: <path d="m9 18 6-6-6-6" />,
    chevronD: <path d="m6 9 6 6 6-6" />,
    plus: <><path d="M12 5v14M5 12h14" /></>,
    check: <path d="m5 13 4 4L19 7" />,
    bell: <><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></>,
    settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
    sparkle: <><path d="M12 3l2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5z"/></>,
    trending: <><path d="M23 6l-9.5 9.5-5-5L1 18"/><path d="M17 6h6v6"/></>,
    compass: <><circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88"/></>,
    news: <><path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
    groups: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
    forum: <><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></>,
    logout: <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></>,
    eye: <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>,
    clock: <><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></>,
    refresh: <><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/><path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/></>,
    help: <><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><circle cx="12" cy="17" r=".5" fill="currentColor"/></>,
    download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></>,
    globe: <><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></>,
    moon: <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>,
    mail: <><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></>,
    arrowR: <><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></>,
    shuffle: <><path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="m15 15 6 6"/><path d="M4 4l5 5"/></>,
    filter: <><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></>,
    az: <><path d="M3 6h13M3 12h10M3 18h7"/><path d="m17 18 4-9 4 9"/></>,
    za: <><path d="M3 18h13M3 12h10M3 6h7"/><path d="m17 6 4 9 4-9"/></>,
  };
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={st} strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function Stars({ value=0, size=14 }) {
  const full = Math.round(value);
  return (
    <span style={{display:'inline-flex', gap:2, color:'#ddda2a'}}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i<=full?'#ddda2a':'#444'}><polygon points="12 2 15 9 22 9 17 14 19 22 12 17 5 22 7 14 2 9 9 9"/></svg>
      ))}
    </span>
  );
}

function Badge({ children, variant='accent' }) {
  const m = {
    accent:  { bg:'rgba(221,218,42,0.15)', fg:'#ddda2a', b:'rgba(221,218,42,0.5)' },
    neutral: { bg:'#2d2d2d', fg:'#cccccc', b:'#444' },
    danger:  { bg:'rgba(255,120,79,0.15)', fg:'#FF784F', b:'rgba(255,120,79,0.4)' },
  }[variant];
  return <span style={{display:'inline-flex', alignItems:'center', padding:'2px 8px', borderRadius:999, fontSize:11, fontWeight:700, background:m.bg, color:m.fg, border:`1px solid ${m.b}`, textTransform:'uppercase', letterSpacing:'.08em'}}>{children}</span>;
}

function Button({ variant='raised', onClick, children, icon, danger, block }) {
  const base = {display:'inline-flex', alignItems:'center', justifyContent:'center', gap:8, padding:'0 16px', height:44, borderRadius:2, fontWeight:700, fontSize:14, cursor:'pointer', transition:'all .3s', width: block?'100%':'auto', letterSpacing:'.0625rem', fontFamily:'inherit'};
  const styles = {
    primary: { ...base, background:'#ddda2a', color:'#161616', border:'1px solid #ddda2a' },
    raised:  { ...base, background:'transparent', color:'#fff', border:'1px solid #727273', boxShadow:'-0.25rem 0.25rem 0 0 rgba(221,218,42,0.25)' },
    ghost:   { ...base, background:'#252526', color:'#fff', border:`1px solid ${danger?'#FF784F':'#727273'}` },
  };
  const s = styles[variant];
  if (danger && variant==='ghost') s.color = '#FF784F';
  return <button style={s} onClick={onClick}>{icon && <Icon name={icon} size={16}/>}{children}</button>;
}

// Avatar — shared by comments, forum, profile, navbar, side menu. radius 2px (angular).
function Avatar({ initials='??', color='#ddda2a', size=40, onClick }) {
  const fs = size <= 24 ? 10 : size <= 32 ? 12 : size <= 48 ? 14 : size <= 64 ? 18 : 32;
  return (
    <div onClick={onClick} style={{
      width:size, height:size, minWidth:size,
      borderRadius:2,
      background:color, color:'#161616',
      display:'flex', alignItems:'center', justifyContent:'center',
      fontWeight:800, fontSize:fs,
      cursor: onClick ? 'pointer' : 'default',
      flexShrink:0,
      letterSpacing:'.05em'
    }}>{initials}</div>
  );
}

/**
 * MangaCard — one canonical manga tile used everywhere
 * (home, library, profile, search, related, para-você, recentes...)
 * Title + meta sit ON the poster with a bottom gradient overlay.
 */
function MangaCard({ manga, onClick, featured, tag, progress }) {
  const [hover, setHover] = React.useState(false);
  const lifted = hover || featured;
  return (
    <a href="#" onClick={(e) => { e.preventDefault(); onClick && onClick(); }}
       onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
       style={{ display:'block', textDecoration:'none', transform: hover ? 'translateY(-2px)' : 'none', transition:'transform .3s ease' }}>
      <div style={{
        position:'relative', aspectRatio:'2/3',
        background: manga.gradient, borderRadius:4, overflow:'hidden',
        border: `1px solid ${lifted ? '#ddda2a' : 'transparent'}`,
        boxShadow: lifted ? '-0.25rem 0.25rem 0 0 rgba(221,218,42,0.25)' : 'none',
        transition:'all .3s ease',
        display:'flex', flexDirection:'column', justifyContent:'flex-end',
        padding:10,
      }}>
        {/* giant ghost initial behind title */}
        <div style={{position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', fontSize:'clamp(34px, 10vw, 56px)', fontWeight:800, color:'rgba(221,218,42,0.32)', letterSpacing:2, pointerEvents:'none'}}>{manga.initial}</div>

        {/* rating chip */}
        <div style={{position:'absolute', top:8, left:8, zIndex:2, display:'inline-flex', alignItems:'center', gap:3, background:'rgba(22,22,22,0.7)', backdropFilter:'blur(4px)', color:'#ddda2a', fontSize:11, fontWeight:700, padding:'3px 7px', borderRadius:2, border:'1px solid rgba(221,218,42,0.3)'}}>
          ★ {manga.rating}
        </div>

        {/* optional corner tag (NOVO, HOJE etc) */}
        {tag && (
          <div style={{position:'absolute', top:8, right:8, zIndex:2, display:'inline-flex', alignItems:'center', background:'#ddda2a', color:'#161616', fontSize:9, fontWeight:800, padding:'3px 7px', borderRadius:2, textTransform:'uppercase', letterSpacing:'.08em'}}>
            {tag}
          </div>
        )}

        {/* bottom gradient for text legibility */}
        <div style={{position:'absolute', left:0, right:0, bottom:0, height:'65%', background:'linear-gradient(180deg, transparent 0%, rgba(22,22,22,0.95) 75%)', pointerEvents:'none', borderRadius:4}}/>

        {/* meta */}
        <div style={{position:'relative', zIndex:2}}>
          <div style={{fontSize:'clamp(12px, 2.8vw, 13px)', fontWeight:700, color:'#fff', lineHeight:1.25, textShadow:'0 1px 2px rgba(0,0,0,0.8)', display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden'}}>{manga.title}</div>
          <div style={{fontSize:10, color:'#ccc', marginTop:4, textTransform:'uppercase', letterSpacing:'.08em', fontWeight:600}}>
            {manga.genre[0]} · {manga.ch} cap.
          </div>
          {progress !== undefined && (
            <div style={{marginTop:6, display:'flex', alignItems:'center', gap:6}}>
              <div style={{flex:1, height:3, background:'rgba(255,255,255,0.15)', borderRadius:2, overflow:'hidden'}}>
                <div style={{width:`${progress}%`, height:'100%', background:'#ddda2a'}}/>
              </div>
              <span style={{fontSize:9, color:'#ddda2a', fontWeight:700, letterSpacing:'.05em'}}>{progress}%</span>
            </div>
          )}
        </div>
      </div>
    </a>
  );
}

/** Responsive grid of manga cards — 2 cols mobile → 3 tablet → 4–5 desktop.
 *  Pass `minW` (default 140px) to tune card size vs count. */
function MangaGrid({ children, minW=140 }) {
  return (
    <div style={{display:'grid', gridTemplateColumns:`repeat(auto-fill, minmax(${minW}px, 1fr))`, gap:12}}>
      {children}
    </div>
  );
}

/** Section header — title + "see all" link, used across every page. */
function SectionHeader({ icon, eyebrow, title, href, onSeeAll }) {
  return (
    <div style={{display:'flex', alignItems:'baseline', justifyContent:'space-between', gap:12, marginBottom:14, flexWrap:'wrap'}}>
      <div>
        {eyebrow && <div style={{fontSize:11, fontWeight:800, color:'#ddda2a', textTransform:'uppercase', letterSpacing:'.1em', marginBottom:4, display:'inline-flex', alignItems:'center', gap:6}}>{icon && <Icon name={icon} size={13}/>}{eyebrow}</div>}
        <h2 style={{fontSize:'clamp(18px, 4vw, 22px)', fontWeight:700, color:'#fff', margin:0, letterSpacing:'.0625rem'}}>{title}</h2>
      </div>
      {onSeeAll && <a href="#" onClick={(e)=>{e.preventDefault(); onSeeAll();}} style={{color:'#ddda2a', fontSize:12, fontWeight:700, textDecoration:'none', whiteSpace:'nowrap'}}>Ver tudo →</a>}
    </div>
  );
}

Object.assign(window, { Icon, Stars, Badge, Button, Avatar, MangaCard, MangaGrid, SectionHeader });
