// LegalPages.jsx — Termos, Privacidade, DMCA, Contatos
// Shell compartilhado + 4 páginas estáticas curtas.
// Mobile-first: TOC vira chips horizontais; sticky sidebar a partir de 1024px.

// ============================================================
// LegalShell — header + tabs entre docs + layout TOC/conteúdo
// ============================================================
function LegalShell({
  page,           // 'terms' | 'privacy' | 'dmca' | 'contact'
  eyebrow,
  title,
  sub,
  updated,        // string visível, p.ex. "12 / mai / 2026"
  version,        // string, p.ex. "v3.2"
  toc,            // [{id, label}]
  onNav,
  children,
}) {
  const tabs = [
    { key:'terms',   label:'Termos de uso',  icon:'news' },
    { key:'privacy', label:'Privacidade',    icon:'eye' },
    { key:'dmca',    label:'DMCA',           icon:'bookmark' },
    { key:'contact', label:'Contatos',       icon:'mail' },
  ];

  const [active, setActive] = React.useState(toc && toc[0] ? toc[0].id : null);
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    setActive(id);
    const top = el.getBoundingClientRect().top + window.scrollY - 72;
    window.scrollTo({ top, behavior: 'smooth' });
  };

  // observer pra marcar a seção atual
  React.useEffect(() => {
    if (!toc) return;
    const els = toc.map(t => document.getElementById(t.id)).filter(Boolean);
    if (!els.length) return;
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0.01 }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  }, [toc]);

  return (
    <div className="legal-shell" data-screen-label={`legal-${page}`}>

      {/* HERO */}
      <section className="legal-hero">
        <div className="legal-hero-inner">
          <div className="legal-hero-eyebrow">
            <Icon name="bookmark" size={12}/>
            <span>{eyebrow}</span>
          </div>
          <h1 className="legal-hero-title">{title}</h1>
          <p className="legal-hero-sub">{sub}</p>

          <div className="legal-hero-meta">
            <span className="legal-meta-tag">
              <Icon name="clock" size={11}/>
              Atualizado em <strong>{updated}</strong>
            </span>
            {version && (
              <span className="legal-meta-tag">
                <Icon name="refresh" size={11}/>
                Versão <strong>{version}</strong>
              </span>
            )}
            <span className="legal-meta-tag">
              <Icon name="globe" size={11}/>
              Português (BR)
            </span>
          </div>

          <nav className="legal-tabs" aria-label="Documentos legais">
            {tabs.map(t => (
              <button
                key={t.key}
                className={`legal-tab ${page === t.key ? 'active' : ''}`}
                onClick={() => onNav && onNav(t.key)}
              >
                <Icon name={t.icon} size={13}/>
                <span>{t.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </section>

      {/* CONTENT */}
      <div className={`legal-content ${toc ? '' : 'no-toc'}`}>

        {/* TOC mobile */}
        {toc && (
          <div className="legal-toc-mobile" aria-label="Sumário">
            {toc.map((t, i) => (
              <button
                key={t.id}
                className="legal-toc-chip"
                onClick={() => scrollTo(t.id)}
              >
                <span className="legal-toc-chip-num">{String(i+1).padStart(2,'0')}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* TOC desktop */}
        {toc && (
          <aside className="legal-toc" aria-label="Sumário">
            <div className="legal-toc-inner">
              <div className="legal-toc-label">Neste documento</div>
              <div className="legal-toc-list">
                {toc.map((t, i) => (
                  <button
                    key={t.id}
                    className={`legal-toc-item ${active === t.id ? 'active' : ''}`}
                    onClick={() => scrollTo(t.id)}
                  >
                    <span className="legal-toc-item-num">{String(i+1).padStart(2,'0')}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>
        )}

        {/* Main */}
        <div className="legal-main">{children}</div>
      </div>
    </div>
  );
}

// ============================================================
// Helper: seção numerada com TL;DR opcional
// ============================================================
function LegalSection({ id, num, title, tldr, children }) {
  return (
    <section id={id} className="legal-section">
      <header className="legal-section-head">
        <div className="legal-section-num">{String(num).padStart(2,'0')}</div>
        <h2 className="legal-section-title">{title}</h2>
      </header>
      {tldr && (
        <div className="legal-tldr">
          <div className="legal-tldr-icon"><Icon name="sparkle" size={16}/></div>
          <div className="legal-tldr-body">
            <div className="legal-tldr-label">Em resumo</div>
            <p className="legal-tldr-text">{tldr}</p>
          </div>
        </div>
      )}
      <div className="legal-prose">{children}</div>
    </section>
  );
}

// ============================================================
// CrossLinks — cards no fim das páginas legais
// ============================================================
function LegalCrossLinks({ current, onNav }) {
  const all = [
    { key:'terms',   label:'Documento', icon:'news',     title:'Termos de uso',    desc:'O que combinamos quando você usa o Manga Reader.' },
    { key:'privacy', label:'Documento', icon:'eye',      title:'Privacidade',      desc:'Quais dados coletamos, por quê, e como você controla.' },
    { key:'dmca',    label:'Documento', icon:'bookmark', title:'DMCA',             desc:'Pedidos de remoção e direitos autorais.' },
    { key:'contact', label:'Canal',     icon:'mail',     title:'Contatos',         desc:'Email, suporte, parcerias e prioridade.' },
  ];
  const others = all.filter(x => x.key !== current);
  return (
    <div className="legal-cross">
      {others.map(c => (
        <button key={c.key} className="legal-cross-card" onClick={() => onNav && onNav(c.key)}>
          <div className="legal-cross-icon"><Icon name={c.icon} size={18}/></div>
          <div className="legal-cross-body">
            <div className="legal-cross-label">{c.label}</div>
            <div className="legal-cross-title">{c.title}</div>
            <div className="legal-cross-desc">{c.desc}</div>
          </div>
          <Icon name="arrowR" size={14}/>
        </button>
      ))}
    </div>
  );
}

// ============================================================
// TERMS — Termos de uso
// ============================================================
function TermsPage({ onNav }) {
  const toc = [
    { id:'t-aceite',     label:'Aceite e quem somos' },
    { id:'t-conta',      label:'Sua conta' },
    { id:'t-uso',        label:'Uso do serviço' },
    { id:'t-conteudo',   label:'Conteúdo da comunidade' },
    { id:'t-direitos',   label:'Direitos autorais' },
    { id:'t-pagamentos', label:'Apoio e pagamentos' },
    { id:'t-encerrar',   label:'Encerramento' },
    { id:'t-isencao',    label:'Isenções e limites' },
    { id:'t-mudancas',   label:'Mudanças nestes termos' },
    { id:'t-leis',       label:'Lei aplicável e foro' },
  ];

  return (
    <LegalShell
      page="terms"
      eyebrow="Documentos legais"
      title="Termos de uso"
      sub="As regras de convívio que valem pra todo mundo que usa o Manga Reader. Texto direto, sem letras miúdas escondidas."
      updated="12 / mai / 2026"
      version="v3.2"
      toc={toc}
      onNav={onNav}
    >
      <LegalSection id="t-aceite" num={1} title="Aceite e quem somos"
        tldr="Ao criar conta ou navegar logado, você concorda com este documento. O Manga Reader é um projeto de estudo independente — não somos editora oficial.">
        <p>O Manga Reader (“nós”, “a plataforma”) é um projeto pessoal de estudo mantido por <strong>Ruan Moraes</strong>. Não temos vínculo com editoras, scans ou autores das obras catalogadas, salvo quando explicitamente indicado em um perfil oficial verificado.</p>
        <p>Ao acessar a plataforma — com ou sem cadastro — você concorda com os termos abaixo. Se não concordar com algum ponto, pedimos pra <strong>não usar o serviço</strong>.</p>
      </LegalSection>

      <LegalSection id="t-conta" num={2} title="Sua conta"
        tldr="Uma conta por pessoa. Você é responsável pela senha. Pode excluir a conta quando quiser.">
        <ul>
          <li><strong>Idade mínima:</strong> 13 anos. Entre 13 e 17, é necessário consentimento de quem é responsável por você.</li>
          <li><strong>Veracidade:</strong> use dados reais ou um pseudônimo consistente. Contas usadas pra se passar por outra pessoa serão removidas.</li>
          <li><strong>Segurança:</strong> guarde sua senha — ações feitas com seu login são consideradas suas.</li>
          <li><strong>Exclusão:</strong> você pode encerrar a conta a qualquer momento em Configurações → Conta → Excluir. A remoção é definitiva e leva até 7 dias.</li>
        </ul>
      </LegalSection>

      <LegalSection id="t-uso" num={3} title="Uso do serviço">
        <p>A plataforma oferece leitura, catalogação, fórum, grupos e listas — gratuitamente — pra fins pessoais e não-comerciais. É proibido:</p>
        <ul>
          <li>Raspar conteúdo em massa (scraping automatizado) sem autorização escrita.</li>
          <li>Usar a plataforma pra distribuir malware, phishing ou conteúdo ilegal.</li>
          <li>Interferir no funcionamento do serviço (DoS, exploração de falhas sem reporte responsável).</li>
          <li>Vender, alugar ou sublicenciar o acesso à sua conta.</li>
        </ul>
        <p>Pesquisa acadêmica, indexação respeitosa e uso da nossa API pública são bem-vindos. Veja a seção <a href="#t-direitos">Direitos autorais</a> antes.</p>
      </LegalSection>

      <LegalSection id="t-conteudo" num={4} title="Conteúdo da comunidade"
        tldr="Você é responsável pelo que posta. Vale o bom senso: nada de ódio, assédio, doxing, NSFW fora das áreas marcadas, spam ou pirataria explícita.">
        <p>Reviews, comentários, tópicos de fórum, perfis de grupo e listas públicas seguem as <strong>diretrizes da comunidade</strong>. O time de moderação pode remover conteúdo, advertir ou banir contas em desacordo, sem aviso prévio em casos graves.</p>
        <p>Ao postar, você nos concede uma licença não-exclusiva e gratuita pra exibir aquele conteúdo dentro do Manga Reader. Você continua dono do que escreve e pode pedir remoção a qualquer momento.</p>
      </LegalSection>

      <LegalSection id="t-direitos" num={5} title="Direitos autorais"
        tldr="Catalogamos obras publicadas; capas e metadados são exibidos sob uso editorial. Se você é o autor e quer remover algo, abra um pedido na página DMCA.">
        <p>O Manga Reader não hospeda capítulos completos de obras com copyright ativo. Capas, sinopses e dados bibliográficos são exibidos com finalidade informativa e podem ser removidos a pedido do titular dos direitos.</p>
        <p>Para pedidos formais de remoção, leia o documento <a href="#" onClick={(e)=>{e.preventDefault(); onNav && onNav('dmca');}}>DMCA / Direitos autorais</a>.</p>
      </LegalSection>

      <LegalSection id="t-pagamentos" num={6} title="Apoio e pagamentos"
        tldr="A plataforma é gratuita. Apoios mensais são opcionais, não dão privilégios de moderação, e podem ser cancelados a qualquer momento.">
        <p>O modelo financeiro do Manga Reader é por <strong>apoio voluntário</strong>. Apoiar não dá direito a remoção de anúncios (não temos anúncios), conteúdo exclusivo ou prioridade no fórum — apoia porque quer ver o projeto continuar.</p>
        <p>Cobranças recorrentes podem ser canceladas em Configurações → Apoio. Reembolsos seguem a lei brasileira de direito de arrependimento (7 dias após a primeira cobrança).</p>
      </LegalSection>

      <LegalSection id="t-encerrar" num={7} title="Encerramento">
        <p>Podemos suspender ou encerrar contas em casos de violação destes termos, fraude, abuso ou exigência legal. Em encerramentos por nossa iniciativa, avisamos por email cadastrado com pelo menos 7 dias de antecedência — exceto em violações graves, em que a suspensão é imediata.</p>
      </LegalSection>

      <LegalSection id="t-isencao" num={8} title="Isenções e limites de responsabilidade">
        <p>O serviço é entregue <strong>“como está”</strong>. Fazemos o possível pra manter tudo funcionando, mas não garantimos disponibilidade ininterrupta, ausência de bugs ou exatidão integral dos metadados. Não nos responsabilizamos por:</p>
        <ul>
          <li>Conteúdo postado por outros usuários.</li>
          <li>Decisões tomadas com base em reviews ou recomendações da plataforma.</li>
          <li>Perdas indiretas resultantes de indisponibilidade do serviço.</li>
        </ul>
      </LegalSection>

      <LegalSection id="t-mudancas" num={9} title="Mudanças nestes termos"
        tldr="Avisamos no app e por email quando algo material mudar, com pelo menos 14 dias de antecedência.">
        <p>Atualizações pequenas (correção de redação, ajustes de link) entram em vigor imediatamente. Mudanças materiais (regras de conduta, política de dados, modelo de cobrança) são anunciadas com antecedência.</p>
      </LegalSection>

      <LegalSection id="t-leis" num={10} title="Lei aplicável e foro">
        <p>Estes termos são regidos pelas leis da <strong>República Federativa do Brasil</strong>. Conflitos serão resolvidos no foro da cidade de São Paulo / SP, com renúncia a qualquer outro, salvo direito do consumidor que estabeleça foro do domicílio do usuário.</p>
      </LegalSection>

      <div className="legal-foot">
        <div>
          <div className="legal-foot-title">Algo ficou confuso?</div>
          <p className="legal-foot-desc">A gente lê com calma e responde com calma. Mande sua dúvida no canal de contato.</p>
        </div>
        <Button variant="primary" icon="mail" onClick={() => onNav && onNav('contact')}>Falar com o time</Button>
      </div>

      <LegalCrossLinks current="terms" onNav={onNav}/>
    </LegalShell>
  );
}

// ============================================================
// PRIVACY — Política de Privacidade
// ============================================================
function PrivacyPage({ onNav }) {
  const toc = [
    { id:'p-resumo',      label:'Resumo em 30 segundos' },
    { id:'p-quais',       label:'Quais dados coletamos' },
    { id:'p-como',        label:'Como usamos' },
    { id:'p-base',        label:'Base legal (LGPD)' },
    { id:'p-compartilha', label:'Com quem compartilhamos' },
    { id:'p-cookies',     label:'Cookies' },
    { id:'p-direitos',    label:'Seus direitos' },
    { id:'p-retencao',    label:'Retenção e exclusão' },
    { id:'p-seguranca',   label:'Segurança' },
    { id:'p-criancas',    label:'Crianças e adolescentes' },
    { id:'p-internacional', label:'Transferências internacionais' },
    { id:'p-contato',     label:'Encarregado (DPO)' },
  ];

  return (
    <LegalShell
      page="privacy"
      eyebrow="Documentos legais"
      title="Política de Privacidade"
      sub="O que coletamos, por quê coletamos e como você manda no que é seu. Em conformidade com a LGPD (Lei 13.709/2018)."
      updated="12 / mai / 2026"
      version="v2.4"
      toc={toc}
      onNav={onNav}
    >
      <LegalSection id="p-resumo" num={1} title="Resumo em 30 segundos"
        tldr="Coletamos o mínimo, não vendemos nada, você pode pedir tudo de volta ou pedir pra apagar. Email é o único dado obrigatório.">
        <p>Privacidade aqui não é um item de checklist de compliance — é uma decisão de projeto. Quanto menos dado a gente tiver de você, melhor.</p>
      </LegalSection>

      <LegalSection id="p-quais" num={2} title="Quais dados coletamos">
        <div className="legal-defs">
          <div className="legal-def">
            <div className="legal-def-term">Cadastro</div>
            <div className="legal-def-body">Email, nome de exibição, senha (hash, nunca em texto puro).</div>
          </div>
          <div className="legal-def">
            <div className="legal-def-term">Uso da plataforma</div>
            <div className="legal-def-body">Obras na biblioteca, status de leitura, reviews, posts de fórum, grupos seguidos.</div>
          </div>
          <div className="legal-def">
            <div className="legal-def-term">Técnicos (logs)</div>
            <div className="legal-def-body">IP, agente do navegador, timestamps. Mantidos por 30 dias pra detecção de abuso.</div>
          </div>
          <div className="legal-def">
            <div className="legal-def-term">Opcionais</div>
            <div className="legal-def-body">Avatar, bio, gêneros favoritos, idiomas — você escolhe se preenche.</div>
          </div>
        </div>
        <p>Não coletamos localização precisa, contatos do celular, agenda, microfone ou câmera.</p>
      </LegalSection>

      <LegalSection id="p-como" num={3} title="Como usamos">
        <ul>
          <li>Fazer a plataforma funcionar (sincronizar biblioteca, exibir reviews, autenticar você).</li>
          <li>Personalizar recomendações com base no seu histórico — sempre no seu dispositivo, sem perfil exportado.</li>
          <li>Notificar sobre capítulos novos, respostas no fórum e atualizações de grupos que você segue.</li>
          <li>Investigar abuso, fraude e violações dos <a href="#" onClick={(e)=>{e.preventDefault(); onNav && onNav('terms');}}>termos de uso</a>.</li>
        </ul>
      </LegalSection>

      <LegalSection id="p-base" num={4} title="Base legal (LGPD)"
        tldr="Cada dado tem uma base legal explícita. Você pode revogar consentimentos opcionais quando quiser.">
        <p>Operamos sob as seguintes bases do art. 7 da LGPD:</p>
        <ul>
          <li><strong>Execução de contrato</strong> — dados de cadastro e uso, necessários pra você ter conta.</li>
          <li><strong>Legítimo interesse</strong> — logs técnicos pra segurança e detecção de fraude.</li>
          <li><strong>Consentimento</strong> — newsletter, recomendações personalizadas, cookies não-essenciais.</li>
          <li><strong>Cumprimento de obrigação legal</strong> — guardar registros mínimos conforme o Marco Civil da Internet.</li>
        </ul>
      </LegalSection>

      <LegalSection id="p-compartilha" num={5} title="Com quem compartilhamos"
        tldr="Não vendemos dados. Compartilhamos só com prestadores que precisamos pra operar, todos sob contrato de confidencialidade.">
        <p>Operadores que processam dados em nosso nome:</p>
        <ul>
          <li><strong>Hospedagem</strong> — provedor cloud (servidores na região de São Paulo).</li>
          <li><strong>Email transacional</strong> — envio de confirmação, recuperação de senha, notificações.</li>
          <li><strong>Análise agregada</strong> — métricas anônimas (nada que identifique você).</li>
        </ul>
        <p>Podemos divulgar dados específicos mediante ordem judicial fundamentada, sempre tentando notificar você antes — salvo proibição legal.</p>
      </LegalSection>

      <LegalSection id="p-cookies" num={6} title="Cookies"
        tldr="Usamos cookies essenciais (login, preferências) e nada de tracking de terceiros.">
        <ul>
          <li><strong>Essenciais</strong> — sessão de login, idioma, tema. Não dá pra desligar e o serviço funcionar.</li>
          <li><strong>Funcionais</strong> — última obra lida, posição do leitor. Opcionais, ligados por padrão.</li>
          <li><strong>Analíticos próprios</strong> — agregados, sem ID individual. Opcionais.</li>
        </ul>
        <p>Não usamos cookies de terceiros (Google Analytics, Meta, etc.).</p>
      </LegalSection>

      <LegalSection id="p-direitos" num={7} title="Seus direitos"
        tldr="A LGPD te dá controle: acessar, corrigir, exportar, apagar, revogar consentimento. Tudo disponível em Configurações → Privacidade.">
        <ul>
          <li><strong>Acesso</strong> — baixe um JSON com tudo que temos sobre você.</li>
          <li><strong>Correção</strong> — edite seus dados a qualquer momento.</li>
          <li><strong>Portabilidade</strong> — exporte sua biblioteca em CSV / JSON.</li>
          <li><strong>Exclusão</strong> — apague a conta e tudo que vier com ela.</li>
          <li><strong>Revogação</strong> — desligue newsletter, recomendações e cookies funcionais.</li>
          <li><strong>Oposição</strong> — pedir interrupção de tratamento por legítimo interesse.</li>
        </ul>
      </LegalSection>

      <LegalSection id="p-retencao" num={8} title="Retenção e exclusão">
        <p>Mantemos dados enquanto sua conta estiver ativa. Após exclusão:</p>
        <ul>
          <li>Dados pessoais são apagados em até <strong>30 dias</strong>.</li>
          <li>Logs técnicos vinculados expiram em <strong>90 dias</strong>.</li>
          <li>Posts públicos no fórum permanecem anonimizados, salvo pedido explícito de remoção integral.</li>
        </ul>
      </LegalSection>

      <LegalSection id="p-seguranca" num={9} title="Segurança">
        <p>HTTPS obrigatório, senhas com Argon2, banco criptografado em repouso, MFA opcional e auditoria de acessos. Mesmo assim, segurança absoluta não existe — se rolar um incidente, avisamos no app e por email em até 72h, conforme art. 48 da LGPD.</p>
      </LegalSection>

      <LegalSection id="p-criancas" num={10} title="Crianças e adolescentes">
        <p>Não cadastramos menores de 13 anos. Entre 13 e 17, exigimos consentimento de quem é responsável. Se identificarmos cadastro indevido, a conta é desativada e os dados apagados.</p>
      </LegalSection>

      <LegalSection id="p-internacional" num={11} title="Transferências internacionais">
        <p>Servidores principais ficam no Brasil. CDN e provedor de email podem replicar dados em servidores no exterior (EUA e Europa), sempre em países com nível de proteção compatível ou via cláusulas contratuais específicas.</p>
      </LegalSection>

      <LegalSection id="p-contato" num={12} title="Encarregado (DPO)">
        <p>Nossa Encarregada de Tratamento de Dados (DPO) é <strong>Marina Yamamoto</strong>. Para qualquer dúvida, pedido ou denúncia relacionada a dados pessoais:</p>
        <p><a href="mailto:dpo@manga-reader.example.com">dpo@manga-reader.example.com</a> — resposta em até 15 dias corridos, conforme o art. 19 da LGPD.</p>
      </LegalSection>

      <div className="legal-foot">
        <div>
          <div className="legal-foot-title">Quer exercer um direito agora?</div>
          <p className="legal-foot-desc">Em Configurações você baixa, edita ou apaga tudo sem precisar abrir chamado.</p>
        </div>
        <Button variant="primary" icon="settings" onClick={() => onNav && onNav('settings')}>Abrir configurações</Button>
      </div>

      <LegalCrossLinks current="privacy" onNav={onNav}/>
    </LegalShell>
  );
}

// ============================================================
// DMCA — Direitos autorais
// ============================================================
function DmcaPage({ onNav }) {
  const toc = [
    { id:'d-resumo',      label:'O que é, em poucas linhas' },
    { id:'d-quem',        label:'Quem pode pedir remoção' },
    { id:'d-como',        label:'Como pedir remoção' },
    { id:'d-info',        label:'Informações necessárias' },
    { id:'d-prazo',       label:'Prazo de resposta' },
    { id:'d-contra',      label:'Contra-notificação' },
    { id:'d-reincidente', label:'Reincidência' },
    { id:'d-agente',      label:'Agente designado' },
  ];

  return (
    <LegalShell
      page="dmca"
      eyebrow="Documentos legais"
      title="DMCA / Direitos autorais"
      sub="Procedimento pra pedidos de remoção por violação de direitos autorais, em conformidade com a Lei de Direitos Autorais brasileira (9.610/98) e a DMCA dos EUA."
      updated="08 / mai / 2026"
      version="v1.6"
      toc={toc}
      onNav={onNav}
    >
      <LegalSection id="d-resumo" num={1} title="O que é, em poucas linhas"
        tldr="Se você é o autor (ou representa) e algo seu está no Manga Reader sem autorização, envie um pedido formal. Removemos em até 48h após validação.">
        <p>Esta página descreve o processo padrão de <strong>notice and takedown</strong>. Antes de enviar, confira se a obra realmente está hospedada por nós — não fazemos espelho de scans externos.</p>
      </LegalSection>

      <LegalSection id="d-quem" num={2} title="Quem pode pedir remoção">
        <ul>
          <li>O titular original dos direitos (autor, editora, sucessor).</li>
          <li>Agente legalmente autorizado por procuração ou contrato.</li>
          <li>Em casos de imagem pessoal indevida, a própria pessoa retratada.</li>
        </ul>
      </LegalSection>

      <LegalSection id="d-como" num={3} title="Como pedir remoção"
        tldr="Email único, formulário aberto. Sem advogado obrigatório — só conteúdo claro.">
        <p>Envie a notificação para <a href="mailto:dmca@manga-reader.example.com">dmca@manga-reader.example.com</a> ou abra um chamado priorizado em <a href="#" onClick={(e)=>{e.preventDefault(); onNav && onNav('contact');}}>Contatos</a> selecionando o assunto “Direitos autorais”.</p>
      </LegalSection>

      <LegalSection id="d-info" num={4} title="Informações necessárias">
        <p>O pedido precisa conter, pra ser processado:</p>
        <ul>
          <li><strong>Identificação completa</strong> — nome, contato, e relação com a obra.</li>
          <li><strong>Descrição da obra</strong> — título, autor, edição, e onde está publicada originalmente.</li>
          <li><strong>URL específica</strong> dentro do Manga Reader onde o conteúdo aparece.</li>
          <li><strong>Comprovação de titularidade</strong> — registro, contrato, procuração, ou link autoral evidente.</li>
          <li><strong>Declaração de boa-fé</strong> de que o uso não foi autorizado.</li>
          <li><strong>Declaração sob as penas da lei</strong> de que as informações são verdadeiras.</li>
          <li><strong>Assinatura</strong> física ou eletrônica.</li>
        </ul>
        <div className="legal-callout-danger">
          <Icon name="bell" size={16}/>
          <div><strong>Atenção:</strong> declarações falsas em pedidos de remoção podem responder civil e criminalmente. Use o processo só se você realmente é o titular.</div>
        </div>
      </LegalSection>

      <LegalSection id="d-prazo" num={5} title="Prazo de resposta">
        <ul>
          <li><strong>24h</strong> — confirmação de recebimento.</li>
          <li><strong>48h</strong> — análise inicial e remoção provisória do conteúdo, se o pedido estiver completo.</li>
          <li><strong>10 dias úteis</strong> — decisão final, considerando eventual contra-notificação.</li>
        </ul>
      </LegalSection>

      <LegalSection id="d-contra" num={6} title="Contra-notificação"
        tldr="Se você foi notificado e acredita que o pedido é indevido, pode pedir restauração do conteúdo.">
        <p>O usuário que teve material removido pode enviar contra-notificação para o mesmo email, contendo:</p>
        <ul>
          <li>Identificação do conteúdo retirado e URL original.</li>
          <li>Declaração de boa-fé de que a remoção foi por engano ou identificação incorreta.</li>
          <li>Concordância com a jurisdição do foro de São Paulo / SP para eventual ação.</li>
        </ul>
        <p>Restauraremos o conteúdo em até 14 dias, salvo se o notificante inicial entrar com ação judicial nesse período.</p>
      </LegalSection>

      <LegalSection id="d-reincidente" num={7} title="Reincidência">
        <p>Contas que receberem três notificações fundadas em 12 meses são suspensas permanentemente, em política equivalente ao <em>repeat infringer policy</em> da DMCA (17 U.S.C. § 512(i)).</p>
      </LegalSection>

      <LegalSection id="d-agente" num={8} title="Agente designado">
        <p>Notificações formais devem ser endereçadas a:</p>
        <div className="legal-defs">
          <div className="legal-def">
            <div className="legal-def-term">Email primário</div>
            <div className="legal-def-body"><a href="mailto:dmca@manga-reader.example.com">dmca@manga-reader.example.com</a></div>
          </div>
          <div className="legal-def">
            <div className="legal-def-term">Endereço postal</div>
            <div className="legal-def-body">Manga Reader — A/C Agente DMCA<br/>Rua Fictícia, 123 — sala 4<br/>São Paulo / SP — 01310-100</div>
          </div>
        </div>
      </LegalSection>

      <div className="legal-foot">
        <div>
          <div className="legal-foot-title">Tem um caso urgente?</div>
          <p className="legal-foot-desc">Conteúdo ilegal, vazamento de obra pré-publicação, imagem indevida — use o canal prioritário.</p>
        </div>
        <Button variant="primary" icon="bell" onClick={() => onNav && onNav('contact')}>Canal prioritário</Button>
      </div>

      <LegalCrossLinks current="dmca" onNav={onNav}/>
    </LegalShell>
  );
}

// ============================================================
// CONTACT — Contatos
// ============================================================
function ContactPage({ onNav }) {
  const [topic, setTopic] = React.useState('suporte');
  const [name, setName]   = React.useState('');
  const [email, setEmail] = React.useState('');
  const [msg, setMsg]     = React.useState('');
  const [sent, setSent]   = React.useState(false);

  const channels = [
    { key:'geral',     icon:'mail',     label:'Geral',           title:'Fale com a gente',
      desc:'Dúvidas, sugestões e qualquer coisa que não se encaixe nos outros canais.',
      email:'oi@manga-reader.example.com', sla:'até 48h em dias úteis' },
    { key:'suporte',   icon:'help',     label:'Suporte',         title:'Problemas com a conta',
      desc:'Login, sincronização, bugs no leitor, importação de listas.',
      email:'suporte@manga-reader.example.com', sla:'~4h em dias úteis' },
    { key:'dmca',      icon:'bookmark', label:'Direitos autorais', title:'DMCA / remoção',
      desc:'Pedidos formais de remoção de obra ou contra-notificação.',
      email:'dmca@manga-reader.example.com', sla:'até 48h' },
    { key:'imprensa',  icon:'news',     label:'Imprensa',        title:'Pauta e entrevista',
      desc:'Pra repórteres, podcasts e quem cobre o cenário de mangá.',
      email:'press@manga-reader.example.com', sla:'até 72h' },
    { key:'parceria',  icon:'groups',   label:'Parcerias',       title:'Grupos e editoras',
      desc:'Verificação de perfil oficial, traduções autorizadas, colaborações.',
      email:'parcerias@manga-reader.example.com', sla:'até 5 dias' },
    { key:'urgente',   icon:'bell',     label:'Prioritário',     title:'Conta hackeada ou conteúdo ilegal',
      desc:'Use só em emergências reais. Atendimento humano 24/7 com triagem.',
      email:'urgente@manga-reader.example.com', sla:'resposta em até 1h', priority:true },
  ];

  return (
    <LegalShell
      page="contact"
      eyebrow="Documentos legais"
      title="Contatos"
      sub="Pra cada tipo de assunto, um canal. Escolha pela tabela abaixo ou use o formulário e a gente roteia internamente."
      updated="14 / mai / 2026"
      toc={null}
      onNav={onNav}
    >

      {/* GRID de canais */}
      <section className="legal-section">
        <header className="legal-section-head">
          <div className="legal-section-num">01</div>
          <h2 className="legal-section-title">Canais diretos</h2>
        </header>
        <div className="contact-grid">
          {channels.map(c => (
            <article key={c.key} className={`contact-card ${c.priority ? 'priority' : ''}`}>
              <div className="contact-card-head">
                <div className="contact-card-icon"><Icon name={c.icon} size={18}/></div>
                <div className="contact-card-label">{c.label}</div>
              </div>
              <h3 className="contact-card-title">{c.title}</h3>
              <p className="contact-card-desc">{c.desc}</p>
              <div className="contact-card-row">
                <a className="contact-card-email" href={`mailto:${c.email}`}>
                  <Icon name="mail" size={12}/>
                  {c.email}
                </a>
              </div>
              <div className="contact-card-sla">SLA · {c.sla}</div>
            </article>
          ))}
        </div>
      </section>

      {/* FORM */}
      <section className="legal-section">
        <header className="legal-section-head">
          <div className="legal-section-num">02</div>
          <h2 className="legal-section-title">Enviar mensagem</h2>
        </header>

        {sent ? (
          <div className="contact-success">
            <img src="../../assets/illustrations/feliz.png" alt=""/>
            <h3>Mensagem enviada</h3>
            <p>A gente respondeu pro email <strong style={{color:'#fff'}}>{email}</strong> com o protocolo do atendimento. Conferimos junto, sem pressa.</p>
            <Button variant="primary" onClick={() => { setSent(false); setMsg(''); }}>Enviar outra</Button>
          </div>
        ) : (
          <div className="contact-form-shell">
            <div className="contact-form-head">
              <h3 className="contact-form-title">Não sabe pra qual canal mandar?</h3>
              <p className="contact-form-sub">Preencha aqui que a gente roteia internamente. Resposta no email cadastrado em até 48h em dias úteis.</p>
            </div>

            <div className="contact-form-row split">
              <div className="contact-form-row" style={{margin:0}}>
                <label className="contact-form-label">Seu nome</label>
                <input className="contact-form-input" placeholder="Como prefere ser chamado(a)" value={name} onChange={e=>setName(e.target.value)}/>
              </div>
              <div className="contact-form-row" style={{margin:0}}>
                <label className="contact-form-label">Email pra resposta</label>
                <input className="contact-form-input" type="email" placeholder="seu@email.com" value={email} onChange={e=>setEmail(e.target.value)}/>
              </div>
            </div>

            <div className="contact-form-row">
              <label className="contact-form-label">Assunto</label>
              <select className="contact-form-select" value={topic} onChange={e=>setTopic(e.target.value)}>
                <option value="suporte">Suporte — algo não está funcionando</option>
                <option value="geral">Geral — uma sugestão ou dúvida</option>
                <option value="dmca">DMCA — pedido de remoção</option>
                <option value="imprensa">Imprensa — pauta ou entrevista</option>
                <option value="parceria">Parcerias — grupos, editoras, projetos</option>
                <option value="urgente">Prioritário — conta hackeada / conteúdo ilegal</option>
              </select>
            </div>

            <div className="contact-form-row">
              <label className="contact-form-label">Mensagem</label>
              <textarea
                className="contact-form-textarea"
                placeholder="Conta o que está rolando. Quanto mais detalhe, mais rápido a gente resolve."
                value={msg} onChange={e=>setMsg(e.target.value)}
              />
            </div>

            <div className="contact-form-foot">
              <div className="contact-form-meta">
                <span className="contact-form-meta-dot"/>
                <span>Tempo médio de resposta: <strong style={{color:'#fff'}}>4h12min</strong></span>
              </div>
              <Button variant="primary" icon="mail" onClick={() => {
                if (!email || !msg) return;
                setSent(true);
              }}>Enviar mensagem</Button>
            </div>
          </div>
        )}
      </section>

      {/* ENDEREÇO POSTAL */}
      <section className="legal-section">
        <header className="legal-section-head">
          <div className="legal-section-num">03</div>
          <h2 className="legal-section-title">Endereço postal</h2>
        </header>
        <div className="legal-prose">
          <p>Para notificações formais que exigem registro físico:</p>
          <div className="legal-defs">
            <div className="legal-def">
              <div className="legal-def-term">Sede administrativa</div>
              <div className="legal-def-body">Manga Reader<br/>Rua Fictícia, 123 — sala 4<br/>São Paulo / SP — 01310-100<br/>Brasil</div>
            </div>
            <div className="legal-def">
              <div className="legal-def-term">Encarregado de dados (DPO)</div>
              <div className="legal-def-body">A/C Marina Yamamoto<br/><a href="mailto:dpo@manga-reader.example.com">dpo@manga-reader.example.com</a></div>
            </div>
          </div>
        </div>
      </section>

      <LegalCrossLinks current="contact" onNav={onNav}/>
    </LegalShell>
  );
}

Object.assign(window, { TermsPage, PrivacyPage, DmcaPage, ContactPage });
