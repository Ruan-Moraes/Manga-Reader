// EventDetailPage.jsx — detalhe de evento

function EventDetailPage({ id, onBack }) {
  const event = (window.EVENTS || []).find(e => e.id === id);
  if (!event) {
    return (
      <div className="page" style={{textAlign:'center',padding:'80px 20px'}}>
        <div style={{color:'#999'}}>Evento não encontrado.</div>
        <button onClick={onBack} style={{marginTop:16,padding:'10px 18px',background:'#ddda2a',color:'#161616',border:'none',borderRadius:2,fontWeight:800,cursor:'pointer'}}>Voltar</button>
      </div>
    );
  }

  const status = window.eventStatus(event);
  const accent = event.accent || (event.type === 'special' ? '#ddda2a' : '#888');
  const isSpecial = event.type === 'special';

  return (
    <div data-screen-label="event-detail">
      {/* Hero cover */}
      <div style={{position:'relative', height:'min(280px, 40vw)', minHeight:200, background: event.cover, overflow:'hidden'}}>
        <div aria-hidden style={{position:'absolute',inset:0,
          backgroundImage:'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.2) 0%, transparent 60%)',
          mixBlendMode:'overlay'}}/>
        <div aria-hidden style={{position:'absolute',inset:0,
          background:'linear-gradient(180deg,rgba(0,0,0,0.2) 0%,rgba(22,22,22,1) 100%)'}}/>
        <button onClick={onBack} style={{
          position:'absolute',top:16,left:16,zIndex:2,
          width:40,height:40,borderRadius:2,
          background:'rgba(0,0,0,0.6)',border:'1px solid rgba(255,255,255,0.15)',
          color:'#fff',fontSize:18,cursor:'pointer',backdropFilter:'blur(8px)',
        }}>‹</button>
      </div>

      <div className="page" style={{marginTop:-60,position:'relative',zIndex:1}}>
        <div style={{display:'flex',gap:8,alignItems:'center',marginBottom:12,flexWrap:'wrap'}}>
          {isSpecial && (
            <span style={{
              display:'inline-flex',alignItems:'center',gap:6,
              background:'#000',color:accent,padding:'6px 12px',borderRadius:2,
              fontSize:11,fontWeight:800,letterSpacing:'.12em',textTransform:'uppercase',
              border:`1px solid ${accent}`,boxShadow:`0 0 12px ${accent}66`,
            }}>
              <span style={{width:6,height:6,borderRadius:'50%',background:accent}}/>
              Especial
            </span>
          )}
          <StatusPill status={status}/>
        </div>

        {event.tagline && (
          <div style={{fontSize:12,fontWeight:700,color:accent,letterSpacing:'.1em',textTransform:'uppercase',marginBottom:8}}>
            {event.tagline}
          </div>
        )}
        <h1 style={{fontSize:'clamp(24px,5vw,36px)',fontWeight:800,color:'#fff',margin:'0 0 12px',letterSpacing:'.0625rem',lineHeight:1.15}}>
          {event.name}
        </h1>
        <p style={{fontSize:15,color:'#bbb',lineHeight:1.65,margin:'0 0 24px',letterSpacing:'.0625rem',maxWidth:680}}>
          {event.description}
        </p>

        <div style={{display:'grid',gap:12,gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',marginBottom:24}}>
          <Stat label="Período" value={fmtRange(event.start, event.end)}/>
          {event.chapters > 0 && <Stat label="Capítulos" value={event.chapters}/>}
          {event.participants > 0 && <Stat label="Participantes" value={event.participants.toLocaleString('pt-BR')}/>}
          <Stat label="Status" value={status === 'active' ? 'Ativo' : status === 'upcoming' ? 'Em breve' : 'Encerrado'} accent={accent}/>
        </div>

        {(status === 'active' || status === 'upcoming') && (
          <div style={{marginBottom:24}}>
            <div style={{fontSize:11,fontWeight:700,color:'#888',textTransform:'uppercase',letterSpacing:'.12em',marginBottom:8}}>
              {status === 'active' ? 'Termina em' : 'Começa em'}
            </div>
            <CountdownBox targetIso={status === 'active' ? event.end : event.start} accent={accent}/>
          </div>
        )}

        {event.rewards && event.rewards.length > 0 && (
          <div style={{marginBottom:24}}>
            <h3 style={{fontSize:14,fontWeight:800,color:'#fff',margin:'0 0 12px',letterSpacing:'.08em',textTransform:'uppercase'}}>Recompensas</h3>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {event.rewards.map((r, i) => (
                <div key={i} style={{display:'flex',gap:10,alignItems:'center',padding:'10px 14px',background:'#1a1a1a',border:'1px solid #2a2a2a',borderRadius:4}}>
                  <span style={{color:accent,fontSize:14}}>◆</span>
                  <span style={{fontSize:13,color:'#ddd',letterSpacing:'.0625rem'}}>{r}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <button style={{
          width:'100%',maxWidth:320,padding:'14px 20px',
          background: status === 'ended' ? '#2a2a2a' : accent,
          color: status === 'ended' ? '#666' : '#161616',
          border:'none',borderRadius:2,
          fontWeight:800,fontSize:13,letterSpacing:'.12em',textTransform:'uppercase',
          cursor: status === 'ended' ? 'not-allowed' : 'pointer',
          boxShadow: status === 'active' ? `0 4px 16px ${accent}44` : 'none',
        }}>
          {status === 'active' ? 'Participar agora' : status === 'upcoming' ? 'Lembrar quando começar' : 'Evento encerrado'}
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div style={{padding:'12px 14px',background:'#1a1a1a',border:'1px solid #2a2a2a',borderRadius:4}}>
      <div style={{fontSize:10,fontWeight:700,color:'#777',textTransform:'uppercase',letterSpacing:'.12em',marginBottom:4}}>{label}</div>
      <div style={{fontSize:14,fontWeight:700,color:accent || '#fff',letterSpacing:'.0625rem'}}>{value}</div>
    </div>
  );
}

window.EventDetailPage = EventDetailPage;
