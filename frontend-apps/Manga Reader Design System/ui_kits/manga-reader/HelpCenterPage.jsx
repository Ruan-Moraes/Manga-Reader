// HelpCenterPage.jsx — Central de Ajuda
// Tela universal acessível de qualquer lugar via footer.
// Estrutura: hero com busca, categorias visuais, artigos populares,
// status do sistema, opções de contato, e CTA de "ainda preciso de ajuda".

function HelpCenterPage({ onNav }) {
  const [q, setQ] = React.useState('');
  const [openCategory, setOpenCategory] = React.useState(null);
  const [contactOpen, setContactOpen] = React.useState(false);

  const categories = [
    {
      key:'conta',     icon:'user',     label:'Conta e perfil',
      desc:'Login, senha, dados pessoais e exclusão.',
      count: 18,
    },
    {
      key:'leitor',    icon:'eye',      label:'Leitor de mangá',
      desc:'Como mudar modo, direção, qualidade e performance.',
      count: 24,
    },
    {
      key:'biblioteca', icon:'library',  label:'Biblioteca e listas',
      desc:'Organizar obras, importar listas e progresso.',
      count: 16,
    },
    {
      key:'comunidade', icon:'forum',    label:'Comunidade e fórum',
      desc:'Regras de spoiler, denúncias, moderação e perfil de leitor.',
      count: 21,
    },
    {
      key:'grupos',    icon:'groups',   label:'Grupos de scan',
      desc:'Como contribuir, reivindicar grupo e fluxo de tradução.',
      count: 14,
    },
    {
      key:'direitos',  icon:'bookmark', label:'Direitos autorais',
      desc:'DMCA, remoção de obra e relação com editoras.',
      count: 9,
    },
    {
      key:'pagamento', icon:'check',    label:'Apoio e pagamento',
      desc:'Como apoiar o projeto, cancelar e dúvidas de cobrança.',
      count: 7,
    },
    {
      key:'tecnico',   icon:'settings', label:'Problemas técnicos',
      desc:'App travando, sincronização e dispositivos suportados.',
      count: 12,
    },
  ];

  const popular = [
    { id:'a1', cat:'leitor',     title:'Como mudo entre leitura vertical e horizontal?',          views: '24k', helpful:96 },
    { id:'a2', cat:'comunidade', title:'O que conta como spoiler no fórum?',                      views: '18k', helpful:91 },
    { id:'a3', cat:'biblioteca', title:'Posso importar minha lista do MyAnimeList?',              views: '15k', helpful:88 },
    { id:'a4', cat:'conta',      title:'Esqueci minha senha — como recupero?',                    views: '12k', helpful:97 },
    { id:'a5', cat:'grupos',     title:'Como reivindico o perfil oficial do meu grupo de scan?',  views: '9.4k', helpful:94 },
    { id:'a6', cat:'direitos',   title:'Sou o autor — como solicito remoção de uma obra?',        views: '7.1k', helpful:99 },
    { id:'a7', cat:'tecnico',    title:'O leitor está travando no celular — o que fazer?',        views: '6.8k', helpful:82 },
    { id:'a8', cat:'pagamento',  title:'Como cancelo o apoio mensal?',                            views: '4.2k', helpful:95 },
  ];

  // FAQ por categoria — itens curtos pra accordion
  const faq = [
    { cat:'leitor', q:'Como mudar a direção de leitura (LTR / RTL / Webtoon)?',
      a:'Vá em Configurações do Sistema → Leitor → Direção de leitura. A mudança afeta o padrão de toda a plataforma. Cada leitor pode sobrescrever no próprio perfil.' },
    { cat:'leitor', q:'Quanto de dados o leitor consome por capítulo?',
      a:'Depende da qualidade configurada: Baixa (~50 KB/pág), Média (~120 KB), Alta (~300 KB) e Original (sem compressão). O modo Automático escolhe com base na sua conexão.' },
    { cat:'conta',  q:'Posso excluir minha conta permanentemente?',
      a:'Pode. A exclusão é definitiva e remove sua biblioteca, reviews e tópicos do fórum. Solicite em "Falar com o time" — confirmamos em até 7 dias.' },
    { cat:'biblioteca', q:'Como importar uma lista do MyAnimeList ou AniList?',
      a:'Em Biblioteca → Importar lista. Aceitamos XML do MAL e JSON do AniList. As obras são casadas pelo título original; ajustes manuais podem ser necessários.' },
    { cat:'comunidade', q:'Quais são as regras de spoiler no fórum?',
      a:'Spoilers de capítulos com menos de 7 dias precisam de tag [spoiler] obrigatória. O conteúdo é mostrado borrado e o leitor decide se revela. Quebrar a regra resulta em remoção do post e advertência.' },
    { cat:'direitos', q:'Sou o autor — como peço a remoção de uma obra?',
      a:'Envie em "Falar com o time" anexando comprovação de autoria. Removemos em até 48h. Para pedidos formais, use o endereço dmca@manga-reader.example.com.' },
  ];

  const filtered = q
    ? popular.filter(a => a.title.toLowerCase().includes(q.toLowerCase()))
    : popular;

  return (
    <div className="help-shell" data-screen-label="help-center">

      {/* ============ HERO ============ */}
      <section className="help-hero">
        <div className="help-hero-inner">
          <div className="mr-label" style={{color:'#ddda2a', marginBottom:10, display:'inline-flex', alignItems:'center', gap:6}}>
            <Icon name="help" size={13}/>Central de ajuda
          </div>
          <h1 className="help-hero-title">Como podemos ajudar?</h1>
          <p className="help-hero-subtitle">
            Busque por uma dúvida, dê uma olhada nos artigos populares ou fale com nosso time. Tudo aqui em pt-BR.
          </p>

          <div className="help-search">
            <Icon name="search" size={18}/>
            <input
              autoFocus={false}
              placeholder="Como mudar a direção de leitura, esqueci a senha, importar lista…"
              value={q} onChange={e=>setQ(e.target.value)}
            />
            {q && <button onClick={()=>setQ('')} className="forum-icon-btn" style={{width:36, height:36, border:0}}><Icon name="close" size={14}/></button>}
            <kbd className="forum-kbd">⌘ K</kbd>
          </div>

          <div className="help-quick">
            <span className="mr-label" style={{color:'#727273'}}>Buscas populares</span>
            {['mudar idioma', 'spoiler', 'importar MAL', 'cancelar apoio', 'API'].map(k => (
              <button key={k} onClick={()=>setQ(k)} className="help-quick-chip">{k}</button>
            ))}
          </div>
        </div>

        {/* status banner sobre o hero */}
        <div className="help-hero-status">
          <div className="forum-status-dot help-status-dot"/>
          <div>
            <div style={{fontSize:11, fontWeight:800, color:'#ddda2a', textTransform:'uppercase', letterSpacing:'.1em'}}>Status</div>
            <div style={{color:'#fff', fontSize:13, fontWeight:700, letterSpacing:'.0625rem', marginTop:2}}>Tudo operando</div>
          </div>
          <div style={{flex:1}}/>
          <a href="#" onClick={(e)=>e.preventDefault()} style={{color:'#ddda2a', fontSize:11, fontWeight:800, textTransform:'uppercase', letterSpacing:'.1em', textDecoration:'none'}}>Ver detalhes →</a>
        </div>
      </section>

      <div className="help-content">

        {/* ============ CATEGORIAS ============ */}
        <section className="help-section">
          <header className="help-section-head">
            <div>
              <div className="mr-label" style={{color:'#727273', marginBottom:4}}>Navegue por tópico</div>
              <h2 className="help-section-title">Categorias de ajuda</h2>
            </div>
            <span className="help-section-meta">{categories.length} áreas · {categories.reduce((s,c)=>s+c.count,0)} artigos</span>
          </header>

          <div className="help-cat-grid">
            {categories.map(c => (
              <button key={c.key} className={`help-cat ${openCategory===c.key?'active':''}`} onClick={()=>setOpenCategory(openCategory===c.key?null:c.key)}>
                <div className="help-cat-icon"><Icon name={c.icon} size={22}/></div>
                <div className="help-cat-body">
                  <div className="help-cat-label">{c.label}</div>
                  <div className="help-cat-desc">{c.desc}</div>
                  <div className="help-cat-count"><Icon name="news" size={11}/>{c.count} artigos</div>
                </div>
                <Icon name="chevronR" size={16}/>
              </button>
            ))}
          </div>
        </section>

        {/* ============ ARTIGOS POPULARES / RESULTADOS ============ */}
        <section className="help-section">
          <header className="help-section-head">
            <div>
              <div className="mr-label" style={{color:'#727273', marginBottom:4}}>{q ? `Resultados para "${q}"` : 'Mais buscados'}</div>
              <h2 className="help-section-title">{q ? `${filtered.length} artigos encontrados` : 'Artigos populares'}</h2>
            </div>
            {!q && <span className="help-section-meta">atualizado há 1 dia</span>}
          </header>

          {filtered.length > 0 ? (
            <div className="help-articles">
              {filtered.map((a, i) => {
                const cat = categories.find(c => c.key === a.cat);
                return (
                  <article key={a.id} className="help-article">
                    <div className="help-article-num">{String(i+1).padStart(2,'0')}</div>
                    <div className="help-article-body">
                      <div className="help-article-meta">
                        <Icon name={cat.icon} size={12}/>
                        <span>{cat.label}</span>
                      </div>
                      <h3 className="help-article-title">{a.title}</h3>
                      <div className="help-article-stats">
                        <span><Icon name="eye" size={11}/>{a.views} leituras</span>
                        <span><Icon name="check" size={11}/>{a.helpful}% útil</span>
                      </div>
                    </div>
                    <Icon name="arrowR" size={16}/>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="help-noresults">
              <img src="../../assets/illustrations/duvida.png" width="120" height="120" alt=""/>
              <h3 style={{color:'#fff', margin:'10px 0 4px', letterSpacing:'.0625rem'}}>Nada encontrado por "{q}"</h3>
              <p style={{color:'#999', fontSize:13, margin:'0 0 14px', maxWidth:380, textAlign:'center'}}>Tente termos diferentes ou abra um chamado pro nosso time — respondemos em até 24h em dias úteis.</p>
              <Button variant="primary" icon="mail" onClick={()=>setContactOpen(true)}>Abrir chamado</Button>
            </div>
          )}
        </section>

        {/* ============ FAQ ACCORDION ============ */}
        <section className="help-section">
          <header className="help-section-head">
            <div>
              <div className="mr-label" style={{color:'#727273', marginBottom:4}}>Respostas rápidas</div>
              <h2 className="help-section-title">Perguntas frequentes</h2>
            </div>
          </header>

          <div className="help-faq">
            {faq.map((f, i) => (
              <HelpFaqItem key={i} item={f}/>
            ))}
          </div>
        </section>

        {/* ============ STILL NEED HELP ============ */}
        <section className="help-cta">
          <div className="help-cta-illus">
            <img src="../../assets/illustrations/pensando.png" width="120" height="120" alt=""/>
          </div>
          <div className="help-cta-body">
            <div className="mr-label" style={{color:'#ddda2a', marginBottom:6}}>Não achou o que procurava?</div>
            <h3 className="help-cta-title">Falar com o time</h3>
            <p className="help-cta-desc">
              Tempo médio de resposta em dias úteis: <strong style={{color:'#fff'}}>4h12min</strong>. Para emergências (conta hackeada, conteúdo ilegal), use o canal prioritário.
            </p>
            <div className="help-cta-channels">
              <button className="help-channel" onClick={()=>setContactOpen(true)}>
                <div className="help-channel-icon"><Icon name="mail" size={18}/></div>
                <div>
                  <div className="help-channel-label">Abrir chamado</div>
                  <div className="help-channel-meta">Recomendado · resposta por email</div>
                </div>
                <Icon name="arrowR" size={14}/>
              </button>
              <button className="help-channel" onClick={()=>onNav && onNav('forum')}>
                <div className="help-channel-icon"><Icon name="forum" size={18}/></div>
                <div>
                  <div className="help-channel-label">Perguntar no fórum</div>
                  <div className="help-channel-meta">A comunidade responde rápido</div>
                </div>
                <Icon name="arrowR" size={14}/>
              </button>
              <button className="help-channel help-channel-priority">
                <div className="help-channel-icon"><Icon name="bell" size={18}/></div>
                <div>
                  <div className="help-channel-label">Canal prioritário</div>
                  <div className="help-channel-meta">Conta hackeada, conteúdo ilegal</div>
                </div>
                <Icon name="arrowR" size={14}/>
              </button>
            </div>
          </div>
        </section>

        {/* ============ STATUS GRID ============ */}
        <section className="help-section">
          <header className="help-section-head">
            <div>
              <div className="mr-label" style={{color:'#727273', marginBottom:4}}>Saúde da plataforma</div>
              <h2 className="help-section-title">Status do sistema</h2>
            </div>
            <span className="help-section-meta">Última checagem há 2 min</span>
          </header>

          <div className="help-status-grid">
            {[
              ['Leitor de mangá',  'operating'],
              ['Catálogo & busca', 'operating'],
              ['Fórum e comentários','operating'],
              ['Sincronização de listas','operating'],
              ['Notificações push','degraded'],
              ['API pública','operating'],
            ].map(([label, st]) => (
              <div key={label} className={`help-status-tile ${st}`}>
                <div className="help-status-tile-dot"/>
                <div style={{flex:1, minWidth:0}}>
                  <div className="help-status-tile-label">{label}</div>
                  <div className="help-status-tile-state">
                    {st === 'operating' ? 'Operando' : st === 'degraded' ? 'Degradado' : 'Indisponível'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* contact modal */}
      {contactOpen && <HelpContactModal onClose={()=>setContactOpen(false)}/>}
    </div>
  );
}

// ============================================================
// FAQ item — accordion controlado
// ============================================================
function HelpFaqItem({ item }) {
  const [open, setOpen] = React.useState(false);
  return (
    <article className={`help-faq-item ${open?'open':''}`}>
      <button className="help-faq-q" onClick={()=>setOpen(v=>!v)}>
        <span>{item.q}</span>
        <span className={`help-faq-toggle ${open?'open':''}`}>
          <Icon name={open?'close':'plus'} size={14}/>
        </span>
      </button>
      <div className="help-faq-a" style={{ display: open ? 'block' : 'none' }}>
        <p>{item.a}</p>
        <div className="help-faq-foot">
          <span style={{color:'#999', fontSize:11, letterSpacing:'.0625rem'}}>Isso foi útil?</span>
          <button className="help-faq-vote">Sim</button>
          <button className="help-faq-vote">Não</button>
        </div>
      </div>
    </article>
  );
}

// ============================================================
// Contact modal — formulário rápido pra abrir chamado
// ============================================================
function HelpContactModal({ onClose }) {
  const [topic, setTopic] = React.useState('conta');
  const [msg, setMsg] = React.useState('');
  const [sent, setSent] = React.useState(false);

  if (sent) {
    return (
      <div className="composer-overlay" onClick={onClose}>
        <div className="composer-shell" style={{maxWidth:520, textAlign:'center'}} onClick={e=>e.stopPropagation()}>
          <div style={{padding:'40px 28px'}}>
            <img src="../../assets/illustrations/feliz.png" width="120" height="120" alt=""/>
            <h2 style={{color:'#fff', fontSize:22, fontWeight:800, margin:'14px 0 8px', letterSpacing:'.0625rem'}}>Chamado enviado</h2>
            <p style={{color:'#ccc', fontSize:13, lineHeight:1.6, marginBottom:18}}>Recebemos sua mensagem. Vamos responder no seu email cadastrado em até 4h em dias úteis.</p>
            <Button variant="primary" onClick={onClose}>Fechar</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="composer-overlay" onClick={onClose}>
      <div className="composer-shell" style={{maxWidth:560}} onClick={e=>e.stopPropagation()}>
        <header className="composer-head">
          <div>
            <div className="mr-label" style={{color:'#ddda2a', marginBottom:4, display:'inline-flex', alignItems:'center', gap:6}}>
              <Icon name="mail" size={13}/>Falar com o time
            </div>
            <h2 className="composer-title">Abrir um chamado</h2>
          </div>
          <button onClick={onClose} className="forum-icon-btn"><Icon name="close" size={20}/></button>
        </header>
        <div className="composer-body">
          <div className="composer-row">
            <label className="composer-label"><span className="mr-label">Assunto</span></label>
            <div className="composer-cats">
              {[
                ['conta',     'Conta'],
                ['leitor',    'Leitor'],
                ['biblioteca','Biblioteca'],
                ['comunidade','Fórum'],
                ['direitos',  'Direitos autorais'],
                ['outro',     'Outro'],
              ].map(([k,l]) => (
                <button key={k} onClick={()=>setTopic(k)} className={`composer-cat ${topic===k?'active':''}`}>{l}</button>
              ))}
            </div>
          </div>
          <div className="composer-row">
            <label className="composer-label"><span className="mr-label">Sua mensagem</span></label>
            <textarea
              className="composer-editor"
              placeholder="Descreva o que está acontecendo. Quanto mais detalhe, mais rápido conseguimos resolver."
              value={msg} onChange={e=>setMsg(e.target.value)}
              rows="6"
            />
            <div style={{fontSize:11, color:'#727273', marginTop:6}}>Responderemos no email vinculado à sua conta.</div>
          </div>
        </div>
        <footer className="composer-foot">
          <div className="composer-meta">
            <Icon name="check" size={12}/>
            <span>Tempo médio de resposta: 4h12min</span>
          </div>
          <div style={{display:'flex', gap:8}}>
            <Button variant="ghost" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" icon="mail" onClick={()=>setSent(true)}>Enviar chamado</Button>
          </div>
        </footer>
      </div>
    </div>
  );
}

Object.assign(window, { HelpCenterPage });
