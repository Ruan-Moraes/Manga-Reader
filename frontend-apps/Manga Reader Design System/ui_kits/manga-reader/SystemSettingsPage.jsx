// SystemSettingsPage.jsx — "Configurações do Sistema"
// IMPORTANTE: não é perfil/conta do usuário. São configurações GLOBAIS da plataforma:
//   1) Leitor (modo, direção, preload, qualidade, etc)
//   2) Idioma da Interface (UI da plataforma)
//   3) Idioma do Conteúdo Servido (mangás, capítulos)
// Visual: dashboard administrativa — sidebar + área principal com cards de seção.

function SystemSettingsPage() {
  const [section, setSection] = React.useState('leitor');
  const [cfg, setCfg] = React.useState(() => ({ ...(window.SYSTEM_DEFAULTS||{}) }));
  const [dirty, setDirty] = React.useState(false);

  const set = (key, val) => { setCfg(prev => ({...prev, [key]: val})); setDirty(true); };
  const reset = () => { setCfg({ ...window.SYSTEM_DEFAULTS }); setDirty(false); };

  const sections = [
    { key:'leitor',     label:'Leitor',                 icon:'eye',      hint:'Modo, direção, preload, zoom' },
    { key:'interface',  label:'Idioma da Interface',    icon:'settings', hint:'Textos, menus, botões' },
    { key:'conteudo',   label:'Idioma do Conteúdo',     icon:'compass',  hint:'Obras, capítulos, prioridade' },
  ];

  return (
    <div className="ss-page" data-screen-label="system-settings">
      {/* ============ HEADER (full width) ============ */}
      <header className="ss-header">
        <div className="page" style={{padding:'18px 16px', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:14}}>
          <div>
            <div className="mr-label" style={{color:'#ddda2a', marginBottom:6, display:'inline-flex', alignItems:'center', gap:6}}>
              <Icon name="settings" size={13}/>Painel administrativo · Plataforma
            </div>
            <h1 className="ss-title">Configurações do Sistema</h1>
            <p className="ss-subtitle">Defaults globais da plataforma de leitura. Aplica-se a todos os leitores até que cada um sobrescreva no próprio perfil.</p>
          </div>
          <div className="ss-header-actions">
            {dirty && <span className="ss-dirty"><span className="ss-dirty-dot"/>Alterações não salvas</span>}
            <Button variant="ghost" onClick={reset}>Restaurar padrões</Button>
            <Button variant="primary" icon="check" onClick={()=>setDirty(false)}>Salvar alterações</Button>
          </div>
        </div>
      </header>

      {/* ============ LAYOUT: sidebar + main ============ */}
      <div className="ss-layout">
        {/* Sidebar (chips no mobile, vertical lista no desktop) */}
        <aside className="ss-sidebar">
          <nav className="ss-nav">
            {sections.map(s => {
              const active = section === s.key;
              return (
                <button key={s.key} onClick={()=>setSection(s.key)} className={`ss-nav-item ${active?'active':''}`}>
                  <div className="ss-nav-icon"><Icon name={s.icon} size={18}/></div>
                  <div className="ss-nav-text">
                    <div className="ss-nav-label">{s.label}</div>
                    <div className="ss-nav-hint">{s.hint}</div>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Status box */}
          <div className="ss-status-box">
            <img src="../../assets/illustrations/pensando.png" width="64" height="64" alt=""/>
            <div>
              <div className="mr-label" style={{color:'#ddda2a'}}>Sistema</div>
              <div style={{color:'#fff', fontSize:13, fontWeight:700, marginTop:2}}>Tudo operando</div>
              <div style={{color:'#999', fontSize:11, marginTop:2}}>Última sincronização há 4 min</div>
            </div>
          </div>
        </aside>

        {/* Main */}
        <main className="ss-main">
          {section === 'leitor'    && <ReaderSettings cfg={cfg} set={set}/>}
          {section === 'interface' && <InterfaceLanguage cfg={cfg} set={set}/>}
          {section === 'conteudo'  && <ContentLanguage cfg={cfg} set={set}/>}
        </main>
      </div>
    </div>
  );
}

// ============================================================
// SEÇÃO: LEITOR
// ============================================================
function ReaderSettings({ cfg, set }) {
  return (
    <>
      <SSSectionHeader
        icon="eye"
        eyebrow="Configurações globais do leitor"
        title="Leitor de mangá"
        desc="Como os capítulos são exibidos por padrão. Cada leitor pode sobrescrever em seu próprio perfil."
      />

      {/* Modo + direção */}
      <SSCard title="Modo e direção de leitura" desc="Como as páginas fluem por padrão ao abrir um capítulo.">
        <SSField label="Modo de leitura padrão" hint="Vertical é o padrão para manhwas/webtoons. Horizontal para mangás tradicionais.">
          <SSSegmented value={cfg.modoLeitura} onChange={v=>set('modoLeitura', v)}
            options={[
              { value:'vertical',   label:'Vertical',   icon:<TileIconVertical/> },
              { value:'horizontal', label:'Horizontal', icon:<TileIconHorizontal/> },
              { value:'paginado',   label:'Paginado',   icon:<TileIconPaged/> },
            ]}/>
        </SSField>

        <SSField label="Direção de leitura" hint="LTR para ocidentais e manhwas. RTL para mangás japoneses. Webtoon para rolagem infinita.">
          <SSRadioRow value={cfg.direcao} onChange={v=>set('direcao', v)}
            options={[
              { value:'ltr',     label:'Esquerda → Direita',  desc:'Manhwa, ocidental' },
              { value:'rtl',     label:'Direita → Esquerda',  desc:'Mangá japonês' },
              { value:'webtoon', label:'Webtoon (vertical)',   desc:'Rolagem contínua' },
            ]}/>
        </SSField>

        <SSField label="Modo de exibição de páginas" hint="Página única é o mais leve; dupla simula uma revista; spread combina capa + miolo.">
          <SSRadioRow value={cfg.modoPagina} onChange={v=>set('modoPagina', v)}
            options={[
              { value:'simples', label:'Página única', desc:'1 por vez' },
              { value:'dupla',   label:'Página dupla', desc:'Estilo revista' },
              { value:'spread',  label:'Spread',       desc:'Capa + miolo' },
            ]}/>
        </SSField>
      </SSCard>

      {/* Performance */}
      <SSCard title="Performance e carregamento" desc="Controla quanto é baixado antecipadamente e a qualidade das imagens.">
        <SSField label="Preload de páginas" hint="Quantas páginas seguintes são carregadas em segundo plano. Mais = menos espera, mais dados.">
          <div className="ss-slider-row">
            <input type="range" min="0" max="10" value={cfg.preload} onChange={e=>set('preload', parseInt(e.target.value))} className="ss-slider"/>
            <div className="ss-slider-value">{cfg.preload} {cfg.preload===1?'pág.':'págs.'}</div>
          </div>
          <div className="ss-slider-ticks">
            <span>Desligado</span><span>Equilibrado</span><span>Agressivo</span>
          </div>
        </SSField>

        <SSField label="Qualidade padrão das imagens" hint="Auto detecta a conexão. Original consome mais dados, mas mantém o detalhe da arte.">
          <SSSelect value={cfg.qualidade} onChange={v=>set('qualidade', v)}
            options={[
              { value:'auto',     label:'Automático',  desc:'Detecta sua conexão' },
              { value:'baixa',    label:'Baixa',       desc:'Economia de dados — ~50 KB/pág.' },
              { value:'media',    label:'Média',       desc:'Padrão móvel — ~120 KB/pág.' },
              { value:'alta',     label:'Alta',        desc:'Recomendado desktop — ~300 KB/pág.' },
              { value:'original', label:'Original',    desc:'Sem compressão — qualidade máxima' },
            ]}/>
        </SSField>

        <SSField label="Lazy loading do leitor" hint="Atrasa o carregamento de páginas distantes. Economiza dados em capítulos longos.">
          <SSToggle value={cfg.lazyLoad} onChange={v=>set('lazyLoad', v)}
            offLabel="Desligado · Todas as páginas carregam de uma vez"
            onLabel="Ativo · Carrega apenas o que está visível"/>
        </SSField>
      </SSCard>

      {/* Auto + zoom */}
      <SSCard title="Auto-scroll e zoom" desc="Comportamento de leitura assistida e ampliação inicial.">
        <SSField label="Auto-scroll">
          <SSToggle value={cfg.autoScroll} onChange={v=>set('autoScroll', v)}
            offLabel="Desligado · Usuário rola manualmente"
            onLabel={`Ativo · Velocidade ${cfg.velocidadeAutoScroll}/5`}/>
        </SSField>

        {cfg.autoScroll && (
          <SSField label="Velocidade do auto-scroll">
            <div className="ss-slider-row">
              <input type="range" min="1" max="5" value={cfg.velocidadeAutoScroll}
                onChange={e=>set('velocidadeAutoScroll', parseInt(e.target.value))} className="ss-slider"/>
              <div className="ss-slider-value">{cfg.velocidadeAutoScroll}/5</div>
            </div>
            <div className="ss-slider-ticks">
              <span>Lento</span><span>Médio</span><span>Rápido</span>
            </div>
          </SSField>
        )}

        <SSField label="Zoom padrão" hint="Ampliação inicial ao abrir uma página. Pode ser alterada por toque/scroll.">
          <div className="ss-slider-row">
            <input type="range" min="50" max="200" step="10" value={cfg.zoomPadrao}
              onChange={e=>set('zoomPadrao', parseInt(e.target.value))} className="ss-slider"/>
            <div className="ss-slider-value">{cfg.zoomPadrao}%</div>
          </div>
          <div className="ss-slider-ticks">
            <span>50%</span><span>100%</span><span>200%</span>
          </div>
        </SSField>
      </SSCard>
    </>
  );
}

// ============================================================
// SEÇÃO: IDIOMA DA INTERFACE
// ============================================================
function InterfaceLanguage({ cfg, set }) {
  const langs = [
    { code:'pt-BR', name:'Português (Brasil)', native:'Português', flag:'BR', coverage:100 },
    { code:'en',    name:'Inglês',             native:'English',   flag:'EN', coverage:100 },
    { code:'es',    name:'Espanhol',           native:'Español',   flag:'ES', coverage:92  },
    { code:'ja',    name:'Japonês',            native:'日本語',      flag:'JA', coverage:78  },
  ];

  return (
    <>
      <SSSectionHeader
        icon="settings"
        eyebrow="Idioma da Interface"
        title="Em qual idioma a plataforma fala"
        desc="Define o idioma dos textos da própria plataforma — menus, botões, mensagens, painel admin. Não afeta os mangás."
      />

      <SSCard title="Idioma da interface" desc="Selecione o idioma padrão. Usuários novos começam com este idioma; podem trocar depois.">
        <div className="ss-lang-grid">
          {langs.map(l => {
            const active = cfg.idiomaInterface === l.code;
            return (
              <button key={l.code} onClick={()=>set('idiomaInterface', l.code)}
                className={`ss-lang-card ${active?'active':''}`}>
                <div className="ss-lang-flag">{l.flag}</div>
                <div style={{flex:1, minWidth:0, textAlign:'left'}}>
                  <div className="ss-lang-name">{l.name}</div>
                  <div className="ss-lang-native">{l.native}</div>
                  <div className="ss-lang-coverage">
                    <div className="ss-lang-coverage-bar"><div style={{width:`${l.coverage}%`}}/></div>
                    <span>{l.coverage}% traduzido</span>
                  </div>
                </div>
                {active && <div className="ss-lang-check"><Icon name="check" size={16}/></div>}
              </button>
            );
          })}
        </div>
      </SSCard>

      <SSCard title="O que esta configuração afeta" desc="Lista de superfícies da plataforma que mudam de idioma junto.">
        <ul className="ss-affects">
          {[
            ['Menus e botões', 'Navegação, ações primárias, abas, filtros'],
            ['Páginas da plataforma', 'Início, Em Alta, Lançamentos, Biblioteca, Fórum, Eventos'],
            ['Painel administrativo', 'Esta tela, configurações de moderação, dashboards'],
            ['Mensagens do sistema', 'Erros, confirmações, toasts, e-mails transacionais'],
            ['Estados vazios e ilustrações', 'Textos de "sem resultado", "404", "ainda não tem nada por aqui"'],
          ].map(([t, d]) => (
            <li key={t} className="ss-affect">
              <Icon name="check" size={16}/>
              <div>
                <div style={{color:'#fff', fontWeight:700, fontSize:13, letterSpacing:'.0625rem'}}>{t}</div>
                <div style={{color:'#999', fontSize:12, marginTop:2, lineHeight:1.5}}>{d}</div>
              </div>
            </li>
          ))}
        </ul>
      </SSCard>
    </>
  );
}

// ============================================================
// SEÇÃO: IDIOMA DO CONTEÚDO SERVIDO
// ============================================================
function ContentLanguage({ cfg, set }) {
  const langs = [
    { code:'pt-BR', name:'Português (Brasil)', native:'Português' },
    { code:'en',    name:'Inglês',             native:'English' },
    { code:'es',    name:'Espanhol',           native:'Español' },
    { code:'ja',    name:'Japonês',            native:'日本語' },
    { code:'ko',    name:'Coreano',            native:'한국어' },
    { code:'zh',    name:'Chinês',             native:'中文' },
  ];

  const toggleAtivo = (code) => {
    const has = cfg.idiomasAtivos.includes(code);
    if (has && cfg.idiomasAtivos.length === 1) return; // mínimo 1
    const next = has ? cfg.idiomasAtivos.filter(c => c !== code) : [...cfg.idiomasAtivos, code];
    set('idiomasAtivos', next);
    // Também atualiza prioridade — remove ou anexa
    const prio = has ? cfg.prioridade.filter(c => c !== code) : [...cfg.prioridade, code];
    set('prioridade', prio);
  };

  const movePriority = (code, dir) => {
    const idx = cfg.prioridade.indexOf(code);
    if (idx < 0) return;
    const target = idx + dir;
    if (target < 0 || target >= cfg.prioridade.length) return;
    const next = [...cfg.prioridade];
    [next[idx], next[target]] = [next[target], next[idx]];
    set('prioridade', next);
  };

  return (
    <>
      <SSSectionHeader
        icon="compass"
        eyebrow="Idioma do Conteúdo Servido"
        title="Em qual idioma os mangás aparecem"
        desc="Independente do idioma da interface. Define o que entra no catálogo, em qual ordem de prioridade, e como cair em outro idioma se o capítulo não existir no preferido."
      />

      <SSCard title="Idioma principal do conteúdo" desc="Primeira escolha ao exibir uma obra ou capítulo. Se não houver tradução, o fallback assume.">
        <SSSelect value={cfg.idiomaPrincipal} onChange={v=>set('idiomaPrincipal', v)}
          options={langs.map(l => ({ value:l.code, label:l.name, desc:l.native }))}/>
      </SSCard>

      <SSCard title="Fallback automático" desc="Quando o idioma principal não tem o capítulo, escolher o próximo idioma da lista de prioridade.">
        <SSToggle value={cfg.fallbackAuto} onChange={v=>set('fallbackAuto', v)}
          offLabel="Desligado · Capítulos sem tradução no idioma principal ficam ocultos"
          onLabel="Ativo · Mostra o próximo idioma disponível na ordem de prioridade"/>
      </SSCard>

      <SSCard title="Idiomas ativos no catálogo" desc="Quais idiomas aparecem como opção para os leitores. Pelo menos um precisa estar ativo.">
        <div className="ss-multi-grid">
          {langs.map(l => {
            const active = cfg.idiomasAtivos.includes(l.code);
            return (
              <button key={l.code} onClick={()=>toggleAtivo(l.code)} className={`ss-multi-chip ${active?'active':''}`}>
                <div className={`ss-multi-check ${active?'on':''}`}>
                  {active && <Icon name="check" size={12}/>}
                </div>
                <div style={{flex:1, minWidth:0, textAlign:'left'}}>
                  <div style={{color: active?'#161616':'#fff', fontWeight:700, fontSize:13, letterSpacing:'.0625rem'}}>{l.name}</div>
                  <div style={{color: active?'rgba(22,22,22,.7)':'#999', fontSize:11, marginTop:1}}>{l.native}</div>
                </div>
              </button>
            );
          })}
        </div>
        <div className="ss-hint">
          <Icon name="check" size={12}/>
          {cfg.idiomasAtivos.length} de {langs.length} idiomas ativos no catálogo
        </div>
      </SSCard>

      <SSCard title="Prioridade de entrega" desc="Quando o fallback estiver ativo, o sistema busca o capítulo nesta ordem. Arraste ou use as setas para reordenar.">
        <ol className="ss-priority">
          {cfg.prioridade.map((code, i) => {
            const l = langs.find(x => x.code === code);
            if (!l) return null;
            const first = i === 0;
            const last = i === cfg.prioridade.length - 1;
            return (
              <li key={code} className={`ss-priority-item ${first?'first':''}`}>
                <div className="ss-priority-rank">{i+1}</div>
                <div style={{flex:1, minWidth:0}}>
                  <div style={{display:'flex', alignItems:'center', gap:8, flexWrap:'wrap'}}>
                    <span style={{color:'#fff', fontWeight:700, fontSize:14, letterSpacing:'.0625rem'}}>{l.name}</span>
                    {first && <Badge>Principal</Badge>}
                    <span style={{color:'#727273', fontSize:11}}>{l.native}</span>
                  </div>
                  <div style={{color:'#999', fontSize:11, marginTop:3}}>
                    {first ? 'Primeira escolha — sempre tentada antes de qualquer outra'
                           : `Cai aqui se ${cfg.prioridade.slice(0, i).map(c => langs.find(x=>x.code===c)?.name).join(', ')} não tiver o capítulo`}
                  </div>
                </div>
                <div className="ss-priority-actions">
                  <button onClick={()=>movePriority(code, -1)} disabled={first} aria-label="Subir prioridade">▲</button>
                  <button onClick={()=>movePriority(code, +1)} disabled={last} aria-label="Descer prioridade">▼</button>
                </div>
              </li>
            );
          })}
        </ol>
      </SSCard>
    </>
  );
}

// ============================================================
// Primitivos visuais da página
// ============================================================

function SSSectionHeader({ icon, eyebrow, title, desc }) {
  return (
    <div className="ss-section-head">
      <div className="mr-label" style={{color:'#ddda2a', display:'inline-flex', alignItems:'center', gap:6, marginBottom:6}}>
        <Icon name={icon} size={13}/>{eyebrow}
      </div>
      <h2 className="ss-section-title">{title}</h2>
      {desc && <p className="ss-section-desc">{desc}</p>}
    </div>
  );
}

function SSCard({ title, desc, children }) {
  return (
    <section className="ss-card">
      <header className="ss-card-head">
        <h3 className="ss-card-title">{title}</h3>
        {desc && <p className="ss-card-desc">{desc}</p>}
      </header>
      <div className="ss-card-body">{children}</div>
    </section>
  );
}

function SSField({ label, hint, children }) {
  return (
    <div className="ss-field">
      <div className="ss-field-label">
        <div className="ss-field-label-text">{label}</div>
        {hint && <div className="ss-field-hint">{hint}</div>}
      </div>
      <div className="ss-field-control">{children}</div>
    </div>
  );
}

function SSSegmented({ value, onChange, options }) {
  return (
    <div className="ss-segmented">
      {options.map(o => (
        <button key={o.value} onClick={()=>onChange(o.value)}
          className={`ss-segmented-tile ${value===o.value?'active':''}`}>
          <div className="ss-segmented-icon">{o.icon}</div>
          <div className="ss-segmented-label">{o.label}</div>
        </button>
      ))}
    </div>
  );
}

function SSRadioRow({ value, onChange, options }) {
  return (
    <div className="ss-radio-row">
      {options.map(o => (
        <button key={o.value} onClick={()=>onChange(o.value)}
          className={`ss-radio-card ${value===o.value?'active':''}`}>
          <div className={`ss-radio-dot ${value===o.value?'on':''}`}/>
          <div style={{flex:1, minWidth:0, textAlign:'left'}}>
            <div className="ss-radio-label">{o.label}</div>
            <div className="ss-radio-desc">{o.desc}</div>
          </div>
        </button>
      ))}
    </div>
  );
}

function SSSelect({ value, onChange, options }) {
  const [open, setOpen] = React.useState(false);
  const current = options.find(o => o.value === value) || options[0];
  return (
    <div className="ss-select" onMouseLeave={()=>setOpen(false)}>
      <button onClick={()=>setOpen(v=>!v)} className="ss-select-trigger">
        <div style={{flex:1, minWidth:0, textAlign:'left'}}>
          <div style={{color:'#fff', fontWeight:700, fontSize:14, letterSpacing:'.0625rem'}}>{current.label}</div>
          {current.desc && <div style={{color:'#999', fontSize:11, marginTop:2}}>{current.desc}</div>}
        </div>
        <Icon name="chevronD" size={14}/>
      </button>
      {open && (
        <div className="ss-select-menu">
          {options.map(o => (
            <button key={o.value} onClick={()=>{onChange(o.value); setOpen(false);}}
              className={`ss-select-option ${value===o.value?'active':''}`}>
              <div style={{flex:1, minWidth:0, textAlign:'left'}}>
                <div style={{color:'#fff', fontWeight:700, fontSize:13, letterSpacing:'.0625rem'}}>{o.label}</div>
                {o.desc && <div style={{color:'#999', fontSize:11, marginTop:2}}>{o.desc}</div>}
              </div>
              {value === o.value && <Icon name="check" size={14}/>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function SSToggle({ value, onChange, onLabel, offLabel }) {
  return (
    <button onClick={()=>onChange(!value)} className={`ss-toggle-row ${value?'on':''}`}>
      <div className={`ss-toggle-switch ${value?'on':''}`}>
        <div className="ss-toggle-thumb"/>
      </div>
      <div style={{flex:1, minWidth:0, textAlign:'left'}}>
        <div style={{color: value?'#ddda2a':'#fff', fontWeight:700, fontSize:13, letterSpacing:'.0625rem'}}>
          {value ? 'Ativado' : 'Desativado'}
        </div>
        <div style={{color:'#999', fontSize:12, marginTop:2, lineHeight:1.5}}>
          {value ? onLabel : offLabel}
        </div>
      </div>
    </button>
  );
}

// Ícones-tile para o segmented "modo de leitura"
function TileIconVertical() { return (<svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2"><rect x="8" y="4"  width="16" height="7" rx="1"/><rect x="8" y="13" width="16" height="7" rx="1"/><rect x="8" y="22" width="16" height="6" rx="1"/></svg>); }
function TileIconHorizontal() { return (<svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4"  y="9" width="7"  height="14" rx="1"/><rect x="13" y="9" width="7"  height="14" rx="1"/><rect x="22" y="9" width="6"  height="14" rx="1"/></svg>); }
function TileIconPaged() { return (<svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2"><rect x="6" y="6" width="20" height="20" rx="1"/><path d="M16 6v20"/></svg>); }

window.SystemSettingsPage = SystemSettingsPage;
