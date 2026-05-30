// EventSpecialCard.jsx — card grande "Especial" com glow + countdown

function EventSpecialCard({ event, onOpen }) {
  const status = window.eventStatus(event);
  const accent = event.accent || '#ddda2a';
  const isActive = status === 'active';
  const isUpcoming = status === 'upcoming';

  return (
    <div onClick={() => onOpen(event.id)}
      style={{
        position:'relative', cursor:'pointer',
        background:'#1a1a1a',
        border:`1px solid ${accent}55`,
        borderRadius:12, overflow:'hidden',
        boxShadow: isActive ? `0 0 0 1px ${accent}33, 0 8px 32px ${accent}25` : '0 4px 20px rgba(0,0,0,0.4)',
        transition:'transform .25s ease, box-shadow .25s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-3px)';
        e.currentTarget.style.boxShadow = `0 0 0 1px ${accent}66, 0 12px 40px ${accent}35`;
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = isActive ? `0 0 0 1px ${accent}33, 0 8px 32px ${accent}25` : '0 4px 20px rgba(0,0,0,0.4)';
      }}>
      {/* Cover banner */}
      <div style={{
        position:'relative', height:180, background: event.cover, overflow:'hidden',
      }}>
        {/* pattern overlay */}
        <div aria-hidden style={{position:'absolute',inset:0,
          backgroundImage:'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.18) 0%, transparent 50%)',
          mixBlendMode:'overlay'}}/>
        <div aria-hidden style={{position:'absolute',inset:0,
          background:'linear-gradient(180deg,transparent 40%,rgba(0,0,0,0.85) 100%)'}}/>

        {/* badge */}
        <div style={{position:'absolute',top:14,left:14,display:'flex',gap:8,alignItems:'center'}}>
          <span style={{
            display:'inline-flex',alignItems:'center',gap:6,
            background:'#000',color:accent,
            padding:'6px 12px',borderRadius:2,
            fontSize:11,fontWeight:800,letterSpacing:'.12em',textTransform:'uppercase',
            border:`1px solid ${accent}`,
            boxShadow:`0 0 12px ${accent}66`,
          }}>
            <span style={{width:6,height:6,borderRadius:'50%',background:accent,boxShadow:`0 0 6px ${accent}`}}/>
            {event.badge}
          </span>
          <StatusPill status={status}/>
        </div>

        {/* title overlaid */}
        <div style={{position:'absolute',left:18,right:18,bottom:14}}>
          <div style={{fontSize:11,fontWeight:700,color:accent,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:4}}>
            {event.tagline}
          </div>
          <h3 style={{fontSize:'clamp(18px,3vw,24px)',fontWeight:800,color:'#fff',margin:0,letterSpacing:'.0625rem',lineHeight:1.15,textShadow:'0 2px 12px rgba(0,0,0,0.6)'}}>
            {event.name}
          </h3>
        </div>
      </div>

      {/* body */}
      <div style={{padding:'18px 18px 20px'}}>
        <p style={{fontSize:13,color:'#bbb',lineHeight:1.6,margin:'0 0 14px',letterSpacing:'.0625rem'}}>
          {event.description}
        </p>

        <div style={{display:'flex',flexWrap:'wrap',gap:10,alignItems:'center',marginBottom:14}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:12,color:'#999'}}>
            <span style={{color:accent}}>▸</span>
            {fmtRange(event.start, event.end)}
          </div>
          {event.chapters > 0 && (
            <div style={{fontSize:12,color:'#999'}}>{event.chapters} capítulos</div>
          )}
          {event.participants > 0 && (
            <div style={{fontSize:12,color:'#999'}}>{event.participants.toLocaleString('pt-BR')} participantes</div>
          )}
        </div>

        {(isActive || isUpcoming) && (
          <div style={{marginBottom:14}}>
            <div style={{fontSize:10,fontWeight:700,color:'#888',textTransform:'uppercase',letterSpacing:'.12em',marginBottom:6}}>
              {isActive ? 'Termina em' : 'Começa em'}
            </div>
            <CountdownBox targetIso={isActive ? event.end : event.start} accent={accent}/>
          </div>
        )}

        <button onClick={(e) => { e.stopPropagation(); onOpen(event.id); }}
          style={{
            width:'100%',padding:'12px 16px',
            background: isActive ? accent : 'transparent',
            color: isActive ? '#161616' : '#fff',
            border:`1px solid ${accent}`,
            borderRadius:2,fontWeight:800,fontSize:13,letterSpacing:'.1em',textTransform:'uppercase',
            cursor:'pointer',transition:'all .2s',
          }}>
          Ver detalhes
        </button>
      </div>
    </div>
  );
}

window.EventSpecialCard = EventSpecialCard;
