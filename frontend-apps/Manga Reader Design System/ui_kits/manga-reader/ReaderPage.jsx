// ReaderPage.jsx — Leitor de mangá
// Chrome auto-hide, 3 modos de leitura (vertical / paginado / dupla),
// settings drawer, chapter dropdown, scrubber, comentários inline e fim de capítulo.

function ReaderPage({ id, onBack }) {
  const manga  = window.MANGAS.find(m => m.id === id) || window.MANGAS[0];
  const TOTAL  = 18;

  // ---------- state ----------
  const [mode, setMode]       = React.useState('vertical');    // vertical | paged | double
  const [direction, setDir]   = React.useState('ltr');         // ltr | rtl
  const [fit, setFit]         = React.useState('width');       // width | height | original
  const [gap, setGap]         = React.useState(8);
  const [bg, setBg]           = React.useState('black');       // black | dark | paper
  const [inlineCmts, setIC]   = React.useState(true);

  const [page, setPage]       = React.useState(1);
  const [chapter, setChapter] = React.useState(manga.ch);

  const [topbarHidden, setTH] = React.useState(false);
  const [settingsOpen, setSO] = React.useState(false);
  const [chaptersOpen, setCO] = React.useState(false);

  const [rating, setRating]   = React.useState(0);
  const [comment, setComment] = React.useState('');
  const [posted, setPosted]   = React.useState(false);

  // ---------- scroll auto-hide topbar + scrubber tracking (vertical) ----------
  const lastY = React.useRef(0);
  const listRef = React.useRef(null);

  React.useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setTH(y > 120 && y > lastY.current);
      lastY.current = y;

      // só rastreia página em vertical
      if (mode !== 'vertical' || !listRef.current) return;
      const pages = listRef.current.querySelectorAll('[data-rd-page]');
      let bestIdx = 1;
      let bestDist = Infinity;
      pages.forEach((el) => {
        const r = el.getBoundingClientRect();
        const dist = Math.abs(r.top + r.height/2 - window.innerHeight/2);
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = parseInt(el.dataset.rdPage, 10);
        }
      });
      if (bestIdx !== page) setPage(bestIdx);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [mode, page]);

  // ---------- keyboard shortcuts ----------
  React.useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      if (e.key === 'Escape') {
        if (settingsOpen) { setSO(false); return; }
        if (chaptersOpen) { setCO(false); return; }
      }
      if (e.key === 'ArrowRight' || e.key === 'j') {
        e.preventDefault();
        goNext();
      }
      if (e.key === 'ArrowLeft' || e.key === 'k') {
        e.preventDefault();
        goPrev();
      }
      if (e.key === 's') { setSO(v => !v); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line
  }, [page, mode, settingsOpen, chaptersOpen]);

  // ---------- navigation ----------
  const step = mode === 'double' ? 2 : 1;
  const lastPage = mode === 'vertical' ? TOTAL : TOTAL + 1; // paged/double podem ir pra "página fim"
  const goNext = () => {
    if (mode === 'vertical') {
      const el = document.querySelector(`[data-rd-page="${page+1}"]`);
      if (el) el.scrollIntoView({ behavior:'smooth', block:'start' });
      return;
    }
    setPage(p => Math.min(lastPage, p + step));
  };
  const goPrev = () => {
    if (mode === 'vertical') {
      const el = document.querySelector(`[data-rd-page="${Math.max(1,page-1)}"]`);
      if (el) el.scrollIntoView({ behavior:'smooth', block:'start' });
      return;
    }
    setPage(p => Math.max(1, p - step));
  };
  const goToPage = (n) => {
    const target = Math.max(1, Math.min(TOTAL, n));
    if (mode === 'vertical') {
      const el = document.querySelector(`[data-rd-page="${target}"]`);
      if (el) el.scrollIntoView({ behavior:'smooth', block:'start' });
    }
    setPage(target);
  };
  const switchChapter = (delta) => {
    setChapter(c => Math.max(1, c + delta));
    setPage(1);
    setCO(false);
    window.scrollTo({ top: 0, behavior:'smooth' });
  };

  // ---------- scrubber drag ----------
  const onScrubberClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    goToPage(Math.round(ratio * (TOTAL - 1)) + 1);
  };

  // ---------- inline comment data ----------
  const inlineMarkers = {
    5:  { count: 12, top: { user:'Akari', initials:'AK', color:'#ddda2a', when:'há 2 horas', text:'A construção do painel da pg. 5 é absurda — começa em close fechado e o splash da pg. seguinte muda a escala inteira.' } },
    12: { count: 8,  top: { user:'Kenji_99', initials:'KJ', color:'#FF784F', when:'há 4 horas', text:'Spoiler leve do próximo capítulo na última fala — ninguém comentou isso ainda?' } },
  };

  // ---------- chapter list ----------
  const chaptersList = Array.from({ length: 10 }, (_, i) => {
    const num = manga.ch - i;
    return { num, title: `Capítulo ${num}`, when: i === 0 ? 'hoje' : i === 1 ? 'ontem' : `há ${i+1} dias`, isCurrent: num === chapter };
  });

  // ---------- render ----------
  const fillPct = ((page - 1) / Math.max(1, TOTAL - 1)) * 100;

  return (
    <div className="reader-shell" data-bg={bg} data-screen-label={`reader / ${manga.title} cap ${chapter}`}>

      {/* ============ TOP CHROME ============ */}
      <div className={`reader-topbar ${topbarHidden ? 'hidden' : ''}`}>
        <button className="reader-icon-btn" onClick={onBack} aria-label="Voltar">
          <Icon name="chevronL" size={18}/>
        </button>

        <button className="reader-title-btn" onClick={() => setCO(v => !v)}>
          <div className="reader-title-line">
            <strong>{manga.title}</strong>
            <span style={{color:'#666'}}>·</span>
            <span>Cap. {chapter}</span>
            <Icon name="chevronD" size={14}/>
          </div>
          <div className="reader-title-meta">Página {page} de {TOTAL} · {manga.status}</div>
        </button>

        <div className="reader-topbar-actions">
          <span className="reader-pg-counter">{String(page).padStart(2,'0')} / {TOTAL}</span>
          <button className="reader-icon-btn" aria-label="Salvar"><Icon name="bookmark" size={18}/></button>
          <button className="reader-icon-btn" onClick={()=>setIC(v=>!v)} aria-label="Comentários inline" title="Comentários por página">
            <Icon name="comment" size={18}/>
          </button>
          <button className={`reader-icon-btn ${settingsOpen?'primary':''}`} onClick={()=>setSO(v=>!v)} aria-label="Configurações">
            <Icon name="settings" size={18}/>
          </button>
        </div>

        {chaptersOpen && (
          <ChapterDropdown
            list={chaptersList}
            onPick={(n)=>{ setChapter(n); setPage(1); setCO(false); window.scrollTo({top:0,behavior:'smooth'}); }}
            onClose={()=>setCO(false)}
          />
        )}
      </div>

      {/* ============ READING AREA ============ */}
      <div className="reader-area" data-mode={mode} style={{ '--reader-gap': gap + 'px' }}>

        {/* VERTICAL */}
        {mode === 'vertical' && (
          <div className="reader-pages-vertical" ref={listRef}>
            {Array.from({ length: TOTAL }, (_, i) => i + 1).map((n) => (
              <React.Fragment key={n}>
                <ReaderPagePlaceholder n={n} manga={manga}/>
                {inlineCmts && inlineMarkers[n] && (
                  <InlineCommentMarker n={n} info={inlineMarkers[n]}/>
                )}
              </React.Fragment>
            ))}
            <EndOfChapter
              manga={manga} chapter={chapter}
              rating={rating} setRating={setRating}
              comment={comment} setComment={setComment}
              posted={posted} setPosted={setPosted}
              onNext={()=>switchChapter(+1)}
              onBack={onBack}
            />
          </div>
        )}

        {/* PAGED (single) */}
        {mode === 'paged' && (
          <div className="reader-paged-stage" data-fit={fit}
               style={{ flexDirection: direction === 'rtl' ? 'row-reverse' : 'row' }}>
            {page > TOTAL ? (
              <EndOfChapter
                manga={manga} chapter={chapter}
                rating={rating} setRating={setRating}
                comment={comment} setComment={setComment}
                posted={posted} setPosted={setPosted}
                onNext={()=>switchChapter(+1)}
                onBack={onBack}
              />
            ) : (
              <ReaderPagePlaceholder n={page} manga={manga}/>
            )}
          </div>
        )}

        {/* DOUBLE (desktop) */}
        {mode === 'double' && (
          <div className="reader-double-stage"
               style={{ flexDirection: direction === 'rtl' ? 'row-reverse' : 'row' }}>
            <ReaderPagePlaceholder n={page} manga={manga}/>
            {page + 1 <= TOTAL && <ReaderPagePlaceholder n={page+1} manga={manga}/>}
          </div>
        )}
      </div>

      {/* ============ SIDE RAILS (desktop, paged/double) ============ */}
      <div className="reader-rails">
        <button className="reader-rail left"
                onClick={direction==='rtl' ? goNext : goPrev}
                aria-label="Página anterior">
          <span className="reader-rail-arrow"><Icon name="chevronL" size={28}/></span>
        </button>
        <button className="reader-rail right"
                onClick={direction==='rtl' ? goPrev : goNext}
                aria-label="Próxima página">
          <span className="reader-rail-arrow"><Icon name="chevronR" size={28}/></span>
        </button>
      </div>

      {/* ============ BOTTOM CHROME ============ */}
      <div className={`reader-bottombar ${topbarHidden ? 'hidden' : ''}`}>
        <div className="reader-bb-group">
          <button className="reader-icon-btn" onClick={()=>switchChapter(-1)} aria-label="Capítulo anterior" title="Capítulo anterior">
            <Icon name="chevronL" size={14}/><Icon name="chevronL" size={14}/>
          </button>
          <button className="reader-icon-btn" onClick={goPrev} aria-label="Página anterior">
            <Icon name="chevronL" size={18}/>
          </button>
        </div>

        <div className="reader-bb-scrubber">
          <div className="reader-scrubber-track" onClick={onScrubberClick}>
            <div className="reader-scrubber-fill" style={{ width: `${fillPct}%` }}/>
            <div className="reader-scrubber-thumb" style={{ left: `${fillPct}%` }}/>
          </div>
          <div className="reader-scrubber-stamp">
            <strong>{String(page).padStart(2,'0')}</strong> / {TOTAL}
          </div>
        </div>

        <div className="reader-bb-group">
          <button className="reader-icon-btn primary" onClick={goNext} aria-label="Próxima página">
            <Icon name="chevronR" size={18}/>
          </button>
          <button className="reader-icon-btn" onClick={()=>switchChapter(+1)} aria-label="Próximo capítulo" title="Próximo capítulo">
            <Icon name="chevronR" size={14}/><Icon name="chevronR" size={14}/>
          </button>
        </div>
      </div>

      {/* ============ SETTINGS DRAWER ============ */}
      {settingsOpen && (
        <>
          <div className="reader-overlay" onClick={()=>setSO(false)}/>
          <aside className="reader-drawer" role="dialog" aria-label="Configurações do leitor">
            <header className="reader-drawer-head">
              <h2 className="reader-drawer-title">Configurações</h2>
              <button className="reader-icon-btn" onClick={()=>setSO(false)} aria-label="Fechar">
                <Icon name="close" size={18}/>
              </button>
            </header>
            <div className="reader-drawer-body">

              <ReaderOptGroup label="Modo de leitura">
                <div className="reader-opt-grid cols-3">
                  <ReaderPill icon="library"  label="Vertical" active={mode==='vertical'} onClick={()=>setMode('vertical')}/>
                  <ReaderPill icon="news"     label="Paginado" active={mode==='paged'}    onClick={()=>setMode('paged')}/>
                  <ReaderPill icon="bookmark" label="Dupla"    active={mode==='double'}   onClick={()=>setMode('double')}/>
                </div>
              </ReaderOptGroup>

              {mode !== 'vertical' && (
                <ReaderOptGroup label="Direção">
                  <div className="reader-opt-grid">
                    <ReaderPill icon="arrowR" label="LTR" active={direction==='ltr'} onClick={()=>setDir('ltr')}/>
                    <ReaderPill icon="arrowR" label="RTL (mangá)" active={direction==='rtl'} onClick={()=>setDir('rtl')}/>
                  </div>
                </ReaderOptGroup>
              )}

              <ReaderOptGroup label="Ajuste da imagem">
                <div className="reader-opt-grid cols-3">
                  <ReaderPill label="Largura"  active={fit==='width'}    onClick={()=>setFit('width')}/>
                  <ReaderPill label="Altura"   active={fit==='height'}   onClick={()=>setFit('height')}/>
                  <ReaderPill label="Original" active={fit==='original'} onClick={()=>setFit('original')}/>
                </div>
              </ReaderOptGroup>

              {mode === 'vertical' && (
                <ReaderOptGroup label="Espaço entre páginas">
                  <div className="reader-opt-grid cols-4">
                    <ReaderPill label="0"  active={gap===0}  onClick={()=>setGap(0)}/>
                    <ReaderPill label="8"  active={gap===8}  onClick={()=>setGap(8)}/>
                    <ReaderPill label="16" active={gap===16} onClick={()=>setGap(16)}/>
                    <ReaderPill label="32" active={gap===32} onClick={()=>setGap(32)}/>
                  </div>
                </ReaderOptGroup>
              )}

              <ReaderOptGroup label="Fundo da página">
                <div className="reader-opt-grid cols-3">
                  <ReaderPill label="Preto" active={bg==='black'} onClick={()=>setBg('black')}/>
                  <ReaderPill label="Escuro" active={bg==='dark'} onClick={()=>setBg('dark')}/>
                  <ReaderPill label="Papel" active={bg==='paper'} onClick={()=>setBg('paper')}/>
                </div>
              </ReaderOptGroup>

              <ReaderOptGroup label="Comportamento">
                <button
                  className="reader-opt-toggle"
                  data-on={inlineCmts ? 'true' : 'false'}
                  onClick={()=>setIC(v=>!v)}
                >
                  <div className="reader-opt-toggle-body">
                    <div className="reader-opt-toggle-title">Comentários por página</div>
                    <div className="reader-opt-toggle-sub">Mostra discussões entre painéis</div>
                  </div>
                  <span className="reader-switch"/>
                </button>
              </ReaderOptGroup>

              <ReaderOptGroup label="Atalhos de teclado">
                <div className="reader-kbd-list">
                  <div className="reader-kbd-row"><span>Próxima página</span><span><kbd className="reader-kbd">→</kbd> <kbd className="reader-kbd">J</kbd></span></div>
                  <div className="reader-kbd-row"><span>Página anterior</span><span><kbd className="reader-kbd">←</kbd> <kbd className="reader-kbd">K</kbd></span></div>
                  <div className="reader-kbd-row"><span>Abrir / fechar configurações</span><kbd className="reader-kbd">S</kbd></div>
                  <div className="reader-kbd-row"><span>Fechar painel</span><kbd className="reader-kbd">Esc</kbd></div>
                </div>
              </ReaderOptGroup>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}

// ============================================================
// Placeholder de página (substituível por img real)
// ============================================================
function ReaderPagePlaceholder({ n, manga }) {
  return (
    <div className="reader-page" data-rd-page={n} style={{ background: manga.gradient }}>
      <div className="reader-page-num">Pg. {String(n).padStart(2,'0')}</div>
      <div>Pg. {n}</div>
    </div>
  );
}

// ============================================================
// Marcador de comentário entre páginas
// ============================================================
function InlineCommentMarker({ n, info }) {
  const [open, setOpen] = React.useState(false);
  return (
    <>
      <button className="reader-pg-marker" onClick={()=>setOpen(v=>!v)}>
        <span className="reader-pg-marker-chip">
          <Icon name="comment" size={12}/>
          {info.count} comentários na pg. {n}
          <Icon name={open?'close':'chevronD'} size={12}/>
        </span>
      </button>
      {open && (
        <div className="reader-pg-thread">
          <div className="reader-pg-thread-head">
            <Icon name="comment" size={12}/>
            <strong>{info.count} comentários</strong>
            <span>· marcando a página {n}</span>
          </div>
          <div className="reader-pg-comment">
            <Avatar initials={info.top.initials} color={info.top.color} size={32}/>
            <div className="reader-pg-comment-body">
              <div className="reader-pg-comment-meta">
                <strong>{info.top.user}</strong>
                <span>{info.top.when}</span>
              </div>
              <div className="reader-pg-comment-text">{info.top.text}</div>
            </div>
          </div>
          <Button variant="ghost" icon="comment">Ver os outros {info.count - 1} comentários</Button>
        </div>
      )}
    </>
  );
}

// ============================================================
// Helpers do drawer
// ============================================================
function ReaderOptGroup({ label, children }) {
  return (
    <div className="reader-opt-group">
      <div className="reader-opt-label">{label}</div>
      {children}
    </div>
  );
}
function ReaderPill({ icon, label, active, onClick }) {
  return (
    <button className={`reader-opt-pill ${active?'active':''}`} onClick={onClick}>
      {icon && <Icon name={icon} size={16}/>}
      <span>{label}</span>
    </button>
  );
}

// ============================================================
// Dropdown da lista de capítulos
// ============================================================
function ChapterDropdown({ list, onPick, onClose }) {
  return (
    <>
      <div onClick={onClose} style={{position:'fixed', inset:0, zIndex:20}}/>
      <div className="reader-chapters-pop">
        <header className="reader-chapters-head">
          <span>Capítulos · mais recentes</span>
          <button onClick={onClose} style={{background:'transparent', border:0, color:'#999', cursor:'pointer', fontFamily:'inherit'}} aria-label="Fechar">
            <Icon name="close" size={14}/>
          </button>
        </header>
        {list.map(c => (
          <button key={c.num}
            className={`reader-chapter-item ${c.isCurrent?'active':''}`}
            onClick={()=>onPick(c.num)}>
            <span className="reader-chapter-num">#{c.num}</span>
            <span style={{flex:1, fontSize:13, fontWeight:700, letterSpacing:'0.0625rem'}}>{c.title}</span>
            <span className="reader-chapter-meta">
              <span>{c.when}</span>
              {c.isCurrent && <Badge>Lendo</Badge>}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

// ============================================================
// Fim de capítulo
// ============================================================
function EndOfChapter({ manga, chapter, rating, setRating, comment, setComment, posted, setPosted, onNext, onBack }) {
  return (
    <section className="reader-end">
      <div className="reader-end-top">
        <img src="../../assets/illustrations/feliz.png" alt=""/>
        <div className="reader-end-eyebrow">
          <Icon name="check" size={12}/>
          Fim do capítulo {chapter}
        </div>
        <h2 className="reader-end-title">Você zerou o capítulo {chapter}</h2>
        <p className="reader-end-sub">
          Mais <strong style={{color:'#fff'}}>3.241 leitores</strong> terminaram esse capítulo hoje — e a discussão tá quente no fórum.
        </p>
      </div>

      <div className="reader-end-rate">
        <div className="reader-opt-label">Como foi?</div>
        <div className="reader-end-rate-row">
          {[1,2,3,4,5].map(n => (
            <button key={n}
              className={`reader-rate-btn ${rating>=n?'active':''}`}
              onClick={()=>setRating(rating===n?0:n)}
              aria-label={`${n} estrela${n>1?'s':''}`}>
              <Icon name="star" size={18}/>
            </button>
          ))}
          <span className="reader-rate-stat">
            Média da comunidade: <strong>{manga.rating}</strong> · 1.482 votos
          </span>
        </div>
      </div>

      <div className="reader-end-quick">
        <div className="reader-opt-label">{posted ? 'Comentário enviado' : 'Deixe um comentário rápido'}</div>
        {posted ? (
          <div style={{display:'flex', alignItems:'center', gap:10, padding:'10px 0', color:'#ccc', fontSize:13}}>
            <Icon name="check" size={16}/>
            <span>Seu comentário foi publicado no tópico do capítulo {chapter}. Obrigado!</span>
          </div>
        ) : (
          <>
            <textarea
              className="reader-end-input"
              placeholder="Sem spoiler de capítulo futuro. Diga o que sentiu, qual painel pegou, o que esperar."
              value={comment} onChange={e=>setComment(e.target.value)}
            />
            <div className="reader-end-actions">
              <span style={{fontSize:11, color:'#999', letterSpacing:'.04em'}}>
                <Icon name="bell" size={11}/> Marque <strong style={{color:'#ddda2a'}}>[spoiler]</strong> se passar do cap. {chapter}.
              </span>
              <Button variant="primary" icon="comment" onClick={()=>{ if (comment.trim()) setPosted(true); }}>Publicar</Button>
            </div>
          </>
        )}
      </div>

      <div className="reader-end-nav">
        <button className="reader-end-nav-card primary" onClick={onNext}>
          <div className="reader-end-nav-icon"><Icon name="arrowR" size={20}/></div>
          <div>
            <div className="reader-end-nav-label">Próximo capítulo</div>
            <div className="reader-end-nav-title">Cap. {chapter + 1} · publicado hoje</div>
          </div>
        </button>
        <button className="reader-end-nav-card" onClick={onBack}>
          <div className="reader-end-nav-icon"><Icon name="library" size={18}/></div>
          <div>
            <div className="reader-end-nav-label">Voltar pra</div>
            <div className="reader-end-nav-title">Detalhes da obra</div>
          </div>
        </button>
        <button className="reader-end-nav-card">
          <div className="reader-end-nav-icon"><Icon name="forum" size={18}/></div>
          <div>
            <div className="reader-end-nav-label">Discussão</div>
            <div className="reader-end-nav-title">847 posts no fórum</div>
          </div>
        </button>
      </div>
    </section>
  );
}

Object.assign(window, { ReaderPage });
