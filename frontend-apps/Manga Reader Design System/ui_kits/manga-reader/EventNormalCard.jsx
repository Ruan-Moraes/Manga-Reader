// EventNormalCard.jsx — card compacto

function EventNormalCard({ event, onOpen }) {
  const status = window.eventStatus(event);
  const isEnded = status === 'ended';

  return (
    <div onClick={() => onOpen(event.id)}
      style={{
        cursor:'pointer', display:'flex', gap:14,
        background:'#1a1a1a', border:'1px solid #2a2a2a',
        borderRadius:8, padding:14, opacity: isEnded ? 0.65 : 1,
        transition:'all .2s',
      }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = '#3a3a3a'; e.currentTarget.style.transform='translateY(-2px)'; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = '#2a2a2a'; e.currentTarget.style.transform='translateY(0)'; }}>
      {/* thumb */}
      <div style={{
        flexShrink:0, width:72, height:72, borderRadius:4,
        background: event.cover, position:'relative', overflow:'hidden',
        filter: isEnded ? 'grayscale(0.4)' : 'none',
      }}>
        <div aria-hidden style={{position:'absolute',inset:0,
          background:'linear-gradient(135deg,rgba(0,0,0,0) 50%,rgba(0,0,0,0.3) 100%)'}}/>
      </div>
      {/* body */}
      <div style={{flex:1, minWidth:0, display:'flex', flexDirection:'column', justifyContent:'space-between'}}>
        <div>
          <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:4}}>
            <StatusPill status={status}/>
          </div>
          <h4 style={{fontSize:14,fontWeight:700,color:'#fff',margin:'0 0 4px',letterSpacing:'.0625rem',lineHeight:1.25,
            overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
            {event.name}
          </h4>
          <p style={{fontSize:12,color:'#999',margin:0,lineHeight:1.45,
            display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden'}}>
            {event.description}
          </p>
        </div>
        <div style={{display:'flex',gap:10,alignItems:'center',marginTop:8,fontSize:11,color:'#777'}}>
          <span>▸ {fmtRange(event.start, event.end)}</span>
          {event.chapters > 0 && <span>· {event.chapters} caps</span>}
        </div>
      </div>
    </div>
  );
}

window.EventNormalCard = EventNormalCard;
