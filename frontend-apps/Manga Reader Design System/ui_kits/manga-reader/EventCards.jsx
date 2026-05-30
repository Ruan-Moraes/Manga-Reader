// EventCards.jsx — cards de evento (especial + normal) e helpers compartilhados

const fmtBR = (iso) => {
  const [y,m,d] = iso.split('-');
  return `${d}/${m}/${y.slice(2)}`;
};

const fmtRange = (s, e) => {
  if (s === e) return fmtBR(s);
  const [, sm, sd] = s.split('-');
  const [, em, ed] = e.split('-');
  if (sm === em) return `${sd}–${ed}/${sm}`;
  return `${sd}/${sm} – ${ed}/${em}`;
};

const daysBetween = (a, b) => Math.ceil((b - a) / (1000*60*60*24));

function useCountdown(targetIso) {
  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const target = new Date(targetIso + 'T23:59:59');
  const diff = target - now;
  if (diff <= 0) return null;
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  return { d, h, m, s };
}

function StatusPill({ status }) {
  const map = {
    active:   { label:'Ativo',     bg:'rgba(16,185,129,0.15)', fg:'#10b981', dot:'#10b981' },
    upcoming: { label:'Em breve',  bg:'rgba(221,218,42,0.15)', fg:'#ddda2a', dot:'#ddda2a' },
    ended:    { label:'Encerrado', bg:'rgba(255,255,255,0.06)', fg:'#888',   dot:'#666'    },
  };
  const cfg = map[status];
  return (
    <span style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:11,fontWeight:700,
      padding:'4px 10px',borderRadius:2,background:cfg.bg,color:cfg.fg,letterSpacing:'.08em',textTransform:'uppercase'}}>
      <span style={{width:6,height:6,borderRadius:'50%',background:cfg.dot,boxShadow: status==='active'?`0 0 8px ${cfg.dot}`:'none'}}/>
      {cfg.label}
    </span>
  );
}

function CountdownBox({ targetIso, accent }) {
  const c = useCountdown(targetIso);
  if (!c) return null;
  const Cell = ({ value, label }) => (
    <div style={{textAlign:'center',minWidth:44}}>
      <div style={{fontSize:18,fontWeight:800,color:'#fff',fontVariantNumeric:'tabular-nums',letterSpacing:'.0625rem'}}>
        {String(value).padStart(2,'0')}
      </div>
      <div style={{fontSize:9,fontWeight:700,color:accent,textTransform:'uppercase',letterSpacing:'.12em',marginTop:2}}>{label}</div>
    </div>
  );
  return (
    <div style={{display:'inline-flex',gap:4,padding:'10px 12px',background:'rgba(0,0,0,0.35)',
      border:`1px solid ${accent}33`, borderRadius:4, backdropFilter:'blur(8px)'}}>
      <Cell value={c.d} label="Dias"/>
      <div style={{color:'#444',alignSelf:'center'}}>:</div>
      <Cell value={c.h} label="Hrs"/>
      <div style={{color:'#444',alignSelf:'center'}}>:</div>
      <Cell value={c.m} label="Min"/>
      <div style={{color:'#444',alignSelf:'center'}}>:</div>
      <Cell value={c.s} label="Seg"/>
    </div>
  );
}

window.fmtBR = fmtBR;
window.fmtRange = fmtRange;
window.StatusPill = StatusPill;
window.CountdownBox = CountdownBox;
