# Tasks — MOB-FEAT-008

- Spec: `spec.md`
- Status da spec no planejamento: `approved`
- Gate no planejamento: `open`
- Dependências implementadas: `MOB-FEAT-002`, `MOB-FEAT-003`, `MOB-FEAT-004`, `MOB-FEAT-005`, `MOB-FEAT-006`, `MOB-FEAT-007`

## Rastreabilidade

| Critério | Tasks                                                      | Evidência planejada                                                                                                                                                          |
| -------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-001   | TASK-001, TASK-003, TASK-005, TASK-006, TASK-007, TASK-010 | Teste do manifesto com os sete IDs exatos, rotas únicas e capacidades reais; integração do índice sem notificações, importação ou controles Web                              |
| AC-002   | TASK-002, TASK-003, TASK-006, TASK-007, TASK-009, TASK-010 | Integração Expo Router partindo de Profile e do índice, abertura de cada subrota, back para a origem/índice e remount sem perda de edição confirmada                         |
| AC-003   | TASK-002, TASK-003, TASK-009, TASK-011, TASK-012, TASK-015 | Testes cold/warm de deep links, hidratação retardada, consumo único do destino, subrota equivalente e caminho desconhecido em `+not-found`                                   |
| AC-004   | TASK-003, TASK-007, TASK-010, TASK-011, TASK-015           | Matriz guest/auth para capacidades local, mista e privada; zero request `/users/me` antes do login e retorno ao destino privado permitido depois da autenticação             |
| AC-005   | TASK-004, TASK-005, TASK-006, TASK-007, TASK-015           | Testes das projeções por grupo em local/pendente, sincronizando, sincronizado e erro; resposta obsoleta e retry enviando a versão mais nova sem rollback da edição local     |
| AC-006   | TASK-006, TASK-007, TASK-009, TASK-012, TASK-015           | Settings/session hydration controladas provando ausência de valor default transitório em índice e subrotas, inclusive cold deep link                                         |
| AC-007   | TASK-002, TASK-008, TASK-009, TASK-014, TASK-015           | Testes de Expo Constants e adaptador de link: versão/build presentes ou ausentes, filtro HTTPS, configuração vazia, abertura nativa e falha localizada sem desmontar a rota  |
| AC-008   | TASK-005, TASK-006, TASK-007, TASK-008, TASK-013, TASK-015 | RNTL para roles, labels, hints, ordem de foco, estado de sync, alvos mínimos e reflow; matriz manual dirigida de fonte, leitor de tela, contraste e densidade em iOS/Android |
| AC-009   | TASK-003, TASK-004, TASK-007, TASK-008, TASK-011, TASK-015 | Testes de erro/retry de sync e link, logout/expiração/troca A→B em subrota privada, descarte síncrono dos dados anteriores e ausência de loop/duplicação de redirects        |

## Checklist

- [x] TASK-001 — Escrever primeiro os testes do contrato estático do índice: exatamente `appearance-accessibility`, `interface-language-region`, `content-languages`, `reader`, `privacy`, `data` e `about`, cada ID uma única vez, com título i18n, rota própria e política de acesso coerente com a capacidade implementada. Provar explicitamente a ausência de notificações, importação, newsletter, atalhos, footer, reload e quota do navegador.
- [x] TASK-002 — Ampliar `shared/navigation` com paths tipados de settings e destinos internos permitidos, sem aceitar URL arbitrária como `returnTo`; criar adaptadores nativos agnósticos para ler versão/build opcional dos metadados Expo e abrir somente URLs HTTPS configuradas. Configuração ausente, não HTTPS ou inválida deve ser filtrada, e nenhuma URL externa deve ser inventada ou adicionada ao `app.json` nesta execução.
- [x] TASK-003 — Criar `features/navigate-settings` com a definição pública das seções, classificação `local | mixed | private`, resolução pura de acesso guest/auth e destino de autenticação/retorno. O slice deve receber sessão e callbacks por parâmetros/props, não importar `features/auth` nem qualquer outra feature, e deve rejeitar destinos fora do conjunto interno conhecido para impedir redirects em loop ou externos.
- [x] TASK-004 — Expor pelas APIs públicas dos slices proprietários projeções de estado por grupo, reutilizando stores e protocolos existentes: `manage-settings` distingue local guest, pending autenticado, syncing, synced e error sem segundo store de preferências; `manage-content-languages`, `update-privacy` e ações privadas de `data-controls` expõem somente seus estados reais e retries existentes. Registrar a origem/grupo da versão pendente no fluxo canônico de settings para que a UI não atribua o erro ao grupo errado, preservar a edição local e garantir que retry use o snapshot mais novo.
- [x] TASK-005 — Criar `widgets/settings-index` para compor o manifesto, status projetados e ações de navegação em uma lista acessível, sem possuir regra de sync, sessão ou autenticação. Cada linha deve anunciar título, disponibilidade e status real; estado privado em guest deve anunciar login necessário e continuar acionável para iniciar o fluxo de autenticação, enquanto capacidade local abre diretamente.
- [x] TASK-006 — Criar uma page por rota local de aparência/acessibilidade, idioma/região e leitor, compondo respectivamente as APIs públicas já implementadas de `manage-settings` e `configure-chapter-reader`/`chapter-reader`. Manter o contrato único de settings, preview imediato, status/retry do grupo e restauração após back/remount, sem duplicar controles ou persistência dentro da page.
- [x] TASK-007 — Criar pages para idiomas de conteúdo, privacidade e dados com boundary de acesso derivada de `navigate-settings`: content languages e privacy oferecem autenticação antes de montar ou disparar qualquer contrato `/users/me`; data mantém limpeza de cache local para guest e transforma exportação/histórico em ações de login recuperáveis, sem request privado. Em troca/logout/expiração, desmontar a superfície privada antiga antes de mostrar fallback/CTA e preservar o destino elegível.
- [x] TASK-008 — Criar a page “Sobre” usando somente o adaptador público de metadados/links: ocultar separadamente versão ou build indisponível, renderizar somente itens HTTPS realmente configurados entre suporte, termos, privacidade e projeto, e comunicar falha de abertura com retry localizado. Não criar fallback de URL, footer, newsletter, atalho, quota ou ação de reload.
- [x] TASK-009 — Adicionar `app/settings/_layout.tsx`, `index.tsx` e as sete cascas finas de subrota, todas exportando pages pelas APIs públicas. O Stack interno deve usar títulos localizados, respeitar redução de movimento, possuir índice como origem segura para cold deep link e preservar histórico/back; registrar somente o grupo `settings` no navegador raiz, sem lógica de capacidade nos arquivos Expo Router.
- [x] TASK-010 — Substituir a composição monolítica de controles no Profile por uma entrada localizada para o índice de settings, mantendo dados de perfil/logout existentes e sem duplicar as mesmas configurações em duas superfícies. Provar navegação Profile → índice → subrota → back até a origem lógica e acesso direto ao índice quando ele for aberto por link.
- [x] TASK-011 — Ajustar o gate global de sessão e o sucesso de login para a política de rotas de settings: guest pode permanecer em rotas local/mixed, rota privada oferece login em vez de request, e login recebe somente um destino interno permitido e retorna a ele uma vez. Cold/warm deep link privado, expiração e troca de identidade devem cancelar/ignorar navegação tardia da identidade anterior, sem ping-pong entre auth, tabs e settings.
- [x] TASK-012 — Integrar o processamento de deep link aos gates existentes de settings e sessão, sem criar outro store de hidratação: a árvore continua oculta até preferências/sessão necessárias resolverem, o path original é preservado durante o bloqueio e nenhum `push`/`replace` duplicado ocorre ao rerenderizar ou receber o mesmo link warm. Caminhos desconhecidos continuam sob a `+not-found` localizada existente.
- [x] TASK-013 — Aplicar acessibilidade e layout responsivo ao índice, headers, linhas, badges de sync, CTA de login, retry e About: ordem de foco coerente, roles/labels/hints/selected/disabled quando aplicáveis, `accessibilityLiveRegion` para transições, reflow sem alturas fixas e alvos mínimos vindos do tema em fonte ampliada, alto contraste e densidade compacta.
- [x] TASK-014 — Adicionar somente as chaves consumidoras de settings navigation/About aos namespaces existentes ou a um namespace novo real nos três idiomas, com paridade estrutural e fallback `pt-BR`. Títulos das sete seções, estados de sync, login/retorno e erros de link devem ser localizados; valores de versão/build e URLs configuradas não são traduzidos.
- [x] TASK-015 — Implementar a suíte sem snapshots: testes puros de manifesto/acesso/return-to; RNTL do índice e das pages; integração de Router para entry/back/cold/warm/unknown; requests inspecionados em guest/auth; timers e promises controlados para hidratação, sync concorrente, retry e identidade A→B; mocks de Expo Constants/Linking para About; asserts de acessibilidade e ausência de conteúdo Web/notificações.
- [x] TASK-016 — Atualizar `coverage.json` individualmente para cada novo arquivo runtime/evidência, registry com código relacionado e somente os baselines/reconciliações realmente substituídos, em especial a substituição parcial de `MOB-BASE-008/OBS-002` e qualquer ajuste observável da proteção em `MOB-BASE-006`. Não reescrever a Target Spec nem promover placeholders a requisitos.
- [x] TASK-017 — Executar testes focados por slice e os gates `pnpm specs:check`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, `pnpm format:check`, `pnpm test:ci` e `pnpm check`; registrar comandos, contagens e limitações da matriz manual, encaminhar a implementação a Reviewer e Drift Auditor e somente então avaliar a promoção para `implemented`.

## Ordem e colocação FSD

1. `shared`: paths internos tipados, adaptador de metadados Expo, abertura HTTPS e primitives visuais agnósticas; nenhum ID de seção, regra guest ou estado de settings.
2. `entities`: não criar nova entity; reutilizar modelos públicos de settings/user já existentes sem mover mutações para entities.
3. `features/navigate-settings`: ação de escolher seção e resolver acesso/retorno por props; projeções de sync permanecem nos slices donos (`manage-settings`, `manage-content-languages`, `update-privacy`, `data-controls`) para evitar import horizontal.
4. `widgets/settings-index`: compor seções e descritores fornecidos pelas features; sem protocolo de sync, leitura de Expo Constants ou redirect global.
5. `pages/settings-*`: uma composição de rota por índice/capacidade/About; ligar sessão, features e widget por APIs públicas, sem importar outra page.
6. `src/application`: gates globais de hidratação/sessão/deep link e registro no navegador raiz; pode consumir pages/features/shared, mas não incorporar controles ou contratos privados.
7. `app/settings`: arquivos Expo Router finos, layout Stack e exports das pages; nenhuma regra de domínio.
8. i18n, evidências, coverage, registry, baseline afetado, review e auditoria de drift.

## Arquivos prováveis

- `src/shared/navigation/routes.ts`
- `src/shared/config/{appMetadata,externalLinks}.ts`, `src/shared/config/index.ts` e testes próximos
- `src/features/navigate-settings/{model,ui,index.ts}` e testes de manifesto/acesso/retorno
- APIs públicas/modelos dos slices de settings existentes para projeções de status, sem imports entre features
- `src/widgets/settings-index/{ui,index.ts}` e testes de integração
- `src/pages/settings-index/`, `src/pages/settings-appearance/`, `src/pages/settings-locale/`, `src/pages/settings-content-languages/`, `src/pages/settings-reader/`, `src/pages/settings-privacy/`, `src/pages/settings-data/` e `src/pages/settings-about/`
- `app/settings/_layout.tsx`, `app/settings/index.tsx`, `app/settings/{appearance,locale,content-languages,reader,privacy,data,about}.tsx`
- `src/application/gates/` e `src/application/navigation/RootNavigator.tsx`
- `src/pages/login/ui/LoginPage.tsx` e `src/pages/profile/ui/ProfilePage.tsx`
- `src/shared/i18n/index.ts` e locales `pt-BR`, `en-US`, `es-ES`
- `specs/coverage.json`, `specs/registry.md` e baseline/reconciliação diretamente afetados

## Contratos de navegação e integração

- Rotas internas são estáticas e tipadas. O parâmetro de retorno não aceita scheme, host, URL externa ou path desconhecido; nesta feature, somente destinos privados de settings registrados podem atravessar o login.
- `SettingsGate` continua sendo a única barreira de preferências e deve liberar a árvore somente após hidratação. O processamento do path não cria persistência, fila ou store paralelo.
- `SessionGate` deixa de tratar todas as rotas não-auth como privadas apenas na medida necessária para as rotas settings classificadas como local/mixed. A política vigente das demais rotas não é ampliada por esta spec.
- Acesso a content languages e privacy é privado. Data é misto: cache/medição suportada são locais; exportação e histórico são privados. Appearance, locale, reader e About são locais, embora settings autenticados continuem usando o sync existente quando houver conta.
- O mesmo path representa cold e warm deep link. Cold start aguarda os gates; warm start usa o Router existente. O executor não deve adicionar um segundo listener se o Expo Router já entregar o path de forma determinística; a prova é ausência de navegação duplicada.
- Back usa o histórico nativo quando existe. O layout de settings mantém o índice como origem segura para uma subrota aberta sem histórico, sem reaplicar defaults nem limpar stores confirmados.
- Estados de sync devem ser derivados do estado canônico e atribuídos ao grupo que originou a edição. `synced` só aparece após confirmação da Core; erro/retry não desfaz o valor local e respostas antigas não podem limpar uma pendência mais nova.
- A tela About lê `version` e os builds opcionais de `Constants.expoConfig`/manifesto nativo conforme disponibilidade. Links vêm exclusivamente de configuração mobile existente e passam por validação HTTPS; se nenhum estiver configurado, a lista fica ausente sem itens vazios.

## Riscos e controles

- O `SessionGate` atual redireciona qualquer guest fora de `(auth)`; alterar uma condição ampla pode tornar tabs privadas públicas. Cobrir uma tabela explícita de paths e preservar o baseline fora de settings.
- `LoginPage` hoje sempre substitui por `/(tabs)`. Usar string arbitrária de query cria open redirect ou loop; aceitar somente enum/path interno conhecido e consumir o destino uma vez.
- Expo Router já processa links; adicionar listeners concorrentes pode abrir a subrota duas vezes. Preferir estado de rota existente e testar cold/warm/rerender antes de introduzir adaptação adicional.
- Os controles atuais estão todos no Profile. Removê-los antes de as sete subrotas existirem gera regressão de acesso; migrar a composição depois das pages e testar cada destino.
- `syncStatus: local` representa tanto guest confirmado localmente quanto edição autenticada ainda pendente. Usar `activeIdentityEpoch` e `pendingVersion`/grupo para distinguir os estados sem declarar confirmação remota inexistente.
- Content languages, privacy e data usam stores e erros diferentes. Não achatá-los em um store agregado; projetar descritores públicos e compor no widget/page.
- Dados privados podem permanecer um frame durante A→B se o boundary depender apenas de `useEffect`. A page/boundary privada deve bloquear sincronicamente identidade desalinhada e os testes devem inspecionar o frame anterior à nova hidratação.
- Links opcionais não justificam valores fictícios. Testar configuração vazia como caminho normal e manter cada item ausente oculto.
- Font scale e textos traduzidos podem aumentar headers/badges. Usar rolagem/reflow e tokens globais em vez de truncamento ou alturas literais.
- Criar um único slice `pages/settings` com subcomponentes importados por rota pode conflitar com a regra “uma slice por rota”; manter slices de page separados e barrels próprios.

## Gates e critérios de parada

- Parar antes de código se a spec deixar de estar `approved`, se o gate deixar de estar `open` ou se qualquer `MOB-FEAT-002`…`007` deixar de estar `implemented` no registry.
- Parar e retornar ao Spec Architect se for necessário decidir uma URL externa, tornar outra tab pública, criar notificações, alterar o contrato de autenticação da Core ou definir um novo estado de sync não derivável das capacidades implementadas.
- Parar a task afetada se exigir import horizontal entre features, deep import externo, regra de settings em `shared`, lógica de sync no widget/page ou regra de capacidade dentro de arquivos `app/`.
- Não adicionar APIs, endpoints, settings store paralelo, protocolo de persistência, listener duplicado de deep link, URL fallback, notificações, importação ou qualquer controle Web fora do pacote aprovado.
- Não usar disabled sem ação para uma operação privada que a spec exige encaminhar ao login; também não disparar request privado antes da sessão autenticada.
- Não considerar navegação pronta enquanto houver flash de default, perda de edição confirmada ao voltar, destino processado mais de uma vez, loop auth/settings, dado A visível para B ou rótulo hardcoded.
- Não marcar `implemented` enquanto qualquer `AC-*` estiver sem evidência, houver arquivo runtime sem cobertura, gate vermelho, review diferente de `approved` ou drift não reconciliado.
- Não editar `spec.md` para acomodar a implementação. Contradição ou lacuna normativa interrompe a execução e exige decisão humana.

## Evidências a registrar durante a execução

- Manifesto exato das sete seções e tabela de acesso `local | mixed | private`, incluindo ausências proibidas.
- Histórico de Router observado em Profile, índice, subrota, back, cold/warm link, path desconhecido, login e return-to, com contagem de `push`/`replace`.
- Requests HTTP inspecionados para guest e auth em content languages, privacy e data, provando zero `/users/me` antes de login.
- Linha temporal por grupo de local/pending → syncing → synced/error → retry, incluindo edição v2 durante resposta v1 e preservação do valor local.
- Renderização sob hidratação retardada, troca/expiração e identidade A→B, com ausência de defaults e dados privados transitórios.
- Matriz de metadados/links: version/build presentes/ausentes, HTTPS válido, `http`, string inválida, falha de abertura, retry e zero itens quando configuração estiver vazia.
- Asserts de roles, labels, hints, live regions, foco, touch target e reflow; matriz manual datada iOS/Android para leitor de tela, fonte ampliada, alto contraste e modo compacto.
- Resultado final de cada gate, contagem de suítes/testes, arquivos associados aos `AC-*` em `coverage.json`, review independente e auditoria de drift.

## Evidências de execução

- Manifesto/rotas/acesso: `src/features/navigate-settings/model/__tests__/settingsNavigation.test.ts`, `src/shared/navigation/__tests__/routes.test.ts` e `src/pages/settings-index/ui/__tests__/SettingsIndexPage.test.tsx` cobrem os sete IDs, ausência de placeholders, rotas únicas, classificação guest/auth e allowlist de `returnTo`.
- Navegação e identidade: `src/pages/settings-index/ui/__tests__/SettingsNavigation.integration.test.tsx` renderiza Profile, índice e as sete pages reais, verifica os sete `push`, back nativo e remount com edição preservada. `src/application/gates/__tests__/SessionGate.test.tsx` cobre cold/warm/unknown paths, contagem de `replace`, rejeição externa e dois ciclos sucessivos para o mesmo `returnTo`, sem duplicação no mesmo ciclo.
- Sync: `pendingGroup` identifica aparência, locale e leitor no store canônico; `SettingsSyncStatus` e o índice projetam local/pending/syncing/synced/error sem segundo store. Os testes preexistentes dos slices cobrem debounce, resposta obsoleta, erro, retry e troca A→B.
- Guest/private: a integração das pages usa Axios Mock Adapter e prova zero request `/users/me` em content languages, privacy e data guest; exportação/histórico encaminham ao login. `SettingsAccountGate.test.tsx` inspeciona o frame síncrono A→B e logout antes dos effects.
- Hidratação sem flash: `SettingsAccountGate.test.tsx` mantém os children desmontados durante promise remota controlada, libera apenas após `synced` e, em erro inicial, mostra retry localizado sem renderizar valores guest/default. A rota não recebe `replace` durante esse boundary.
- About: testes de configuração e page cobrem versão/build independentes, configuração vazia, filtro HTTPS, link ausente, falha nativa e retry localizado; nenhum link foi adicionado ao `app.json`.
- Acessibilidade: RNTL do índice verifica ordem, roles, labels, hints e CTA acionável; headers, status e erros usam roles/live regions, reflow e touch targets do tema. A matriz física iOS/Android com leitor de tela, fonte ampliada, alto contraste e modo compacto não foi executada neste ambiente automatizado e permanece checklist de release.
- Cobertura SDD: `coverage.json` classifica individualmente todos os novos arquivos; `MOB-BASE-008/OBS-002` e o relatório de reconciliação registram a substituição da composição monolítica do Profile.

## Gates executados

- `CI=true pnpm specs:check`: 15 testes do validador passaram; 19 artefatos normativos e 372 arquivos classificados, incluindo evidência explícita para `AC-006`.
- `CI=true pnpm typecheck`: passou.
- `CI=true pnpm lint`: passou.
- `CI=true pnpm lint:fsd`: passou sem exceções novas.
- `CI=true pnpm format:check`: passou.
- `CI=true pnpm test:ci`: 56 suítes e 237 testes passaram; zero snapshots.
- `CI=true pnpm check`: passou integralmente.

Implementação pronta para handoff independente ao SDD Reviewer e ao Drift Auditor; o executor não alterou a Target Spec nem seu status.
