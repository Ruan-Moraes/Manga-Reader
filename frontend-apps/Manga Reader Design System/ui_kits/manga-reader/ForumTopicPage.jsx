// ForumTopicPage.jsx — detalhe de um tópico aberto: thread completa
// Suporta: spoiler blur reveal, respostas aninhadas, reactions, edição, destaque mod/admin

function ForumTopicPage({ topicId, onBack, onOpenTopic }) {
  const topic = (window.FORUM_TOPICS || []).find(t => t.id === topicId) || window.FORUM_TOPICS[0];
  const author = window.FORUM_USERS[topic.authorId];
  const cat = window.FORUM_CATEGORIES.find(c => c.key === topic.category);
  const [replyOpen, setReplyOpen] = React.useState(false);
  const [followed, setFollowed] = React.useState(false);
  const [bookmarked, setBookmarked] = React.useState(false);

  return (
    <div className="forum-shell" data-screen-label="forum-topic">
      <div className="forum-layout forum-layout-topic">
        {/* center column */}
        <main className="forum-main">
          {/* breadcrumb */}
          <div className="forum-crumbs">
            <a href="#" onClick={e => { e.preventDefault(); onBack(); }}>Fórum</a>
            <Icon name="chevronR" size={11}/>
            <span style={{color:'#999'}}>{cat?.label}</span>
            <Icon name="chevronR" size={11}/>
            <span style={{color:'#ddda2a'}}>Tópico #{topic.id.replace('t','')}</span>
          </div>

          {/* ============ TÓPICO ============ */}
          <article className="forum-topic">
            {/* meta strip */}
            <div className="forum-topic-meta">
              {topic.pinned && <span className="forum-topic-pin"><Icon name="bookmark" size={10}/>Fixado</span>}
              <span className="forum-topic-cat">{cat?.label}</span>
              <span style={{flex:1}}/>
              <span className="forum-topic-when">{topic.when}</span>
            </div>

            <h1 className="forum-topic-title">{topic.title}</h1>

            <div className="forum-topic-tags">
              {topic.tags.map(t => {
                const tag = window.FORUM_TAGS[t] || { label:t, tone:'neutral' };
                return <span key={t} className={`forum-tag forum-tag-${tag.tone}`}>{tag.label}</span>;
              })}
            </div>

            {/* author + actions */}
            <div className="forum-topic-author">
              <div className="forum-topic-author-block">
                <div className="forum-card-avatar">
                  <Avatar initials={author.initials} color={author.color} size={48}/>
                  {author.role === 'mod'   && <span className="forum-role-badge mod">M</span>}
                  {author.role === 'admin' && <span className="forum-role-badge admin">A</span>}
                </div>
                <div>
                  <div style={{display:'flex', alignItems:'center', gap:6, flexWrap:'wrap'}}>
                    <span style={{color:'#fff', fontWeight:800, fontSize:14, letterSpacing:'.0625rem'}}>{author.name}</span>
                    {author.badge && <span className="forum-user-badge">{author.badge}</span>}
                  </div>
                  <div style={{color:'#999', fontSize:11, marginTop:2}}>@{author.handle} · Nível {author.level} · {topic.views.toLocaleString('pt-BR')} visualizações</div>
                </div>
              </div>
              <div className="forum-topic-author-actions">
                <button className={`forum-icon-btn forum-toggle-btn ${followed?'active':''}`} onClick={() => setFollowed(v => !v)} title={followed ? 'Seguindo tópico' : 'Seguir tópico'}>
                  <Icon name="bell" size={16}/>
                </button>
                <button className={`forum-icon-btn forum-toggle-btn ${bookmarked?'active':''}`} onClick={() => setBookmarked(v => !v)} title={bookmarked ? 'Salvo' : 'Salvar tópico'}>
                  <Icon name="bookmark" size={16}/>
                </button>
              </div>
            </div>

            {/* content */}
            <div className="forum-topic-content">
              <RichBody text={topic.excerpt + '\n\nDetalhei minha argumentação nas respostas abaixo. **Marquei com [spoiler]** as partes que dependem do capítulo mais recente — quem ainda não leu, não dá scroll!\n\n[spoiler]Quero confirmar minha leitura comparando os painéis 7 e 11 lado a lado, mas estou no celular agora. Quem puder ajudar a achar a página exata, agradeço.[/spoiler]'} />
            </div>

            {/* reactions */}
            <div className="forum-topic-reactions">
              <button className="forum-react forum-react-up">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
                <span>{topic.reactions.up}</span>
              </button>
              <button className="forum-react forum-react-down">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
                <span>{topic.reactions.down}</span>
              </button>
              <button className="forum-react"><Icon name="heart" size={14}/><span>Curtir</span></button>
              <button className="forum-react"><Icon name="bookmark" size={14}/><span>Salvar</span></button>
              <button className="forum-react"><span style={{fontSize:16, fontWeight:800, lineHeight:1}}>"</span><span>Citar</span></button>
              <span style={{flex:1}}/>
              <button className="forum-react">Reportar</button>
            </div>
          </article>

          {/* ============ COMENTÁRIOS ============ */}
          <div className="forum-comments-head">
            <h2 className="forum-comments-title">{topic.replies} comentários</h2>
            <div className="forum-comments-sort">
              <span className="mr-label" style={{color:'#727273'}}>Ordenar por</span>
              <select className="forum-comments-sort-select">
                <option>Melhores</option>
                <option>Mais recentes</option>
                <option>Mais antigos</option>
              </select>
            </div>
          </div>

          {/* reply box */}
          <ForumReplyBox open={replyOpen} onToggle={() => setReplyOpen(v=>!v)}/>

          {/* thread */}
          <div className="forum-thread">
            {(window.FORUM_COMMENTS || []).map(c => (
              <ForumComment key={c.id} comment={c}/>
            ))}
          </div>

          <div className="forum-pagination" style={{marginTop:18}}>
            <button disabled className="forum-page-btn"><Icon name="chevronL" size={14}/></button>
            <button className="forum-page-btn active">1</button>
            <button className="forum-page-btn">2</button>
            <button className="forum-page-btn">3</button>
            <span style={{color:'#727273', padding:'0 8px'}}>…</span>
            <button className="forum-page-btn">9</button>
            <button className="forum-page-btn"><Icon name="chevronR" size={14}/></button>
          </div>
        </main>

        {/* right rail — versão reduzida */}
        <aside className="forum-sidebar-right">
          <section className="forum-panel">
            <header className="forum-panel-head">
              <Icon name="trending" size={14}/>
              <h4>Tópicos relacionados</h4>
            </header>
            <ul className="forum-recent">
              {(window.FORUM_TOPICS || []).filter(t => t.id !== topic.id && t.category === topic.category).slice(0,3).map(t => (
                <li key={t.id} onClick={() => onOpenTopic(t.id)}>
                  <div style={{flex:1, minWidth:0}}>
                    <div className="forum-trending-title">{t.title}</div>
                    <div className="forum-trending-meta">
                      <Icon name="comment" size={10}/>{t.replies} · <Icon name="eye" size={10}/>{window.formatViews(t.views)}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className="forum-panel">
            <header className="forum-panel-head">
              <Icon name="user" size={14}/>
              <h4>Participantes ({Object.keys(window.FORUM_USERS).length})</h4>
            </header>
            <div className="forum-participants">
              {Object.values(window.FORUM_USERS).slice(0, 8).map(u => (
                <div key={u.id} className="forum-participant">
                  <Avatar initials={u.initials} color={u.color} size={32}/>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

// ============================================================
// Comment (com aninhamento, spoiler blur, role highlight)
// ============================================================
function ForumComment({ comment, depth = 0 }) {
  const u = window.FORUM_USERS[comment.userId];
  const role = comment.role || u.role;
  return (
    <article className={`forum-comment ${role || ''} ${depth>0?'nested':''}`}>
      {depth > 0 && <div className="forum-comment-rail"/>}
      <div className="forum-card-avatar">
        <Avatar initials={u.initials} color={u.color} size={depth>0?32:38}/>
        {role === 'mod'   && <span className="forum-role-badge mod">M</span>}
        {role === 'admin' && <span className="forum-role-badge admin">A</span>}
      </div>
      <div className="forum-comment-body">
        <div className="forum-comment-head">
          <span className="forum-comment-name">{u.name}</span>
          {comment.isOP   && <span className="forum-user-badge op">OP</span>}
          {role === 'mod'   && <span className="forum-user-badge mod">Moderador</span>}
          {role === 'admin' && <span className="forum-user-badge admin">Admin</span>}
          {u.badge && !role && !comment.isOP && <span className="forum-user-badge">{u.badge}</span>}
          <span className="forum-comment-when">· {comment.when}</span>
          {comment.edited && <span className="forum-comment-edited">· editado</span>}
        </div>

        <div className="forum-comment-text">
          <RichBody text={comment.text}/>
        </div>

        <div className="forum-comment-actions">
          <button className="forum-react-mini forum-react-up">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
            <span>{comment.reactions.up}</span>
          </button>
          <button className="forum-react-mini">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
            <span>{comment.reactions.down}</span>
          </button>
          <button className="forum-react-mini"><Icon name="comment" size={12}/><span>Responder</span></button>
          <button className="forum-react-mini"><span style={{fontWeight:800, fontSize:14, lineHeight:1}}>"</span><span>Citar</span></button>
          <button className="forum-react-mini">Reportar</button>
        </div>

        {comment.replies && comment.replies.length > 0 && (
          <div className="forum-comment-replies">
            {comment.replies.map(r => <ForumComment key={r.id} comment={r} depth={depth+1}/>)}
          </div>
        )}
      </div>
    </article>
  );
}

// ============================================================
// RichBody — parse simples de **bold**, [spoiler]...[/spoiler] e quebras de linha.
// ============================================================
function RichBody({ text }) {
  if (!text) return null;
  // Split por blocos de spoiler primeiro
  const parts = [];
  const re = /\[spoiler\](.+?)\[\/spoiler\]/gs;
  let last = 0; let m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push({ type:'text', value: text.slice(last, m.index) });
    parts.push({ type:'spoiler', value: m[1] });
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push({ type:'text', value: text.slice(last) });

  return (
    <div className="forum-rich">
      {parts.map((p, i) => p.type === 'spoiler'
        ? <SpoilerBlock key={i} text={p.value}/>
        : <RichText key={i} text={p.value}/>)}
    </div>
  );
}

function RichText({ text }) {
  // bold + paragraph splits
  const paras = text.split(/\n{2,}/);
  return (
    <>
      {paras.map((p, i) => (
        <p key={i} style={{margin:'0 0 12px', lineHeight:1.7}}>{
          p.split(/(\*\*[^*]+\*\*)/g).map((seg, j) =>
            /^\*\*[^*]+\*\*$/.test(seg)
              ? <strong key={j} style={{color:'#fff', fontWeight:800}}>{seg.slice(2,-2)}</strong>
              : <React.Fragment key={j}>{seg.split('\n').reduce((acc, line, k, arr) => acc.concat(k>0 ? [<br key={`b${k}`}/>, line] : [line]), [])}</React.Fragment>
          )
        }</p>
      ))}
    </>
  );
}

function SpoilerBlock({ text }) {
  const [revealed, setRevealed] = React.useState(false);
  return (
    <div className={`forum-spoiler ${revealed?'revealed':''}`}>
      <button className="forum-spoiler-head" onClick={() => setRevealed(v=>!v)}>
        <span className="forum-spoiler-badge">SPOILER</span>
        <span className="forum-spoiler-instruction">{revealed ? 'Clique para esconder' : 'Clique para revelar'}</span>
        <Icon name={revealed ? 'eye' : 'eye'} size={14}/>
      </button>
      <div className="forum-spoiler-body"><RichText text={text}/></div>
    </div>
  );
}

// ============================================================
// Reply box
// ============================================================
function ForumReplyBox({ open, onToggle }) {
  return (
    <div className={`forum-reply ${open?'open':''}`}>
      <div className="forum-reply-head" onClick={onToggle}>
        <Avatar initials="RM" color="#ddda2a" size={36}/>
        {!open ? (
          <div className="forum-reply-placeholder">Escreva uma resposta — Markdown suportado…</div>
        ) : (
          <span className="mr-label" style={{color:'#ddda2a'}}>Sua resposta</span>
        )}
        {open && <button className="forum-icon-btn" onClick={(e) => { e.stopPropagation(); onToggle(); }}><Icon name="close" size={16}/></button>}
      </div>
      {open && (
        <div className="forum-reply-body">
          <div className="forum-md-toolbar">
            <button title="Negrito"><strong>B</strong></button>
            <button title="Itálico"><em>I</em></button>
            <button title="Citação">"</button>
            <button title="Lista">≡</button>
            <button title="Código">{'</>'}</button>
            <button title="Imagem">IMG</button>
            <span style={{width:1, height:18, background:'#444', margin:'0 4px'}}/>
            <button title="Spoiler" className="forum-md-spoiler"><Icon name="eye" size={12}/>Spoiler</button>
          </div>
          <textarea
            className="forum-md-editor"
            placeholder="Compartilhe sua ideia. Use **negrito** ou [spoiler]texto[/spoiler] para esconder partes sensíveis."
            defaultValue="Vou montar uma resposta detalhada comparando os painéis. Volto em alguns minutos com a referência das páginas exatas."
            rows="5"
          />
          <div className="forum-reply-footer">
            <div className="forum-reply-hints">
              <Icon name="check" size={11}/>
              <span>Markdown · Spoiler · Drag & drop de imagens</span>
            </div>
            <div style={{display:'flex', gap:8}}>
              <Button variant="ghost">Visualizar</Button>
              <Button variant="primary" icon="comment">Publicar resposta</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

Object.assign(window, { ForumTopicPage });
