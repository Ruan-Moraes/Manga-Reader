# Tasks — MOB-FEAT-004

- Spec: `spec.md`
- Status da spec no planejamento: `approved`
- Gate no planejamento: `open`
- Dependências implementadas: `MOB-FEAT-001`, `MOB-FEAT-003`

## Rastreabilidade

| Critério | Tasks                        | Evidência planejada                                                                                       |
| -------- | ---------------------------- | --------------------------------------------------------------------------------------------------------- |
| AC-001   | TASK-001, TASK-003           | Unitários da normalização e integração da hidratação com duplicatas, locale externo e fallback ausente    |
| AC-002   | TASK-004, TASK-006           | Testes do editor/store comprovando a mesma ordem exibida, enviada e confirmada                            |
| AC-003   | TASK-001, TASK-004, TASK-006 | Unitários da normalização e interação com remoção de `pt-BR` desabilitada e nenhum PATCH inválido         |
| AC-004   | TASK-002, TASK-003, TASK-004 | Contrato Axios Mock Adapter do GET/PATCH e gates provando ausência de requests autenticados como guest    |
| AC-005   | TASK-005                     | Integração da confirmação do PATCH com invalidação seletiva de catálogo/UGC e preservação de cache neutro |
| AC-006   | TASK-001, TASK-003, TASK-007 | Teste parametrizado da cadeia guest, transição do idioma da UI, editor oculto e zero persistência remota  |
| AC-007   | TASK-003, TASK-007           | Integração de logout, expiração e troca entre duas identidades, incluindo resposta tardia e cache privado |
| AC-008   | TASK-002, TASK-008           | Cliente HTTP com UI `es-ES`, cadeia divergente e header contendo somente `es-ES`                          |
| AC-009   | TASK-003, TASK-006           | Falha do GET sem vazamento entre contas, fallback temporário e retry identificável                        |
| AC-010   | TASK-004                     | Respostas PATCH fora de ordem, falha e retry preservando exclusivamente a versão pendente mais recente    |
| AC-011   | TASK-006                     | Teste de acessibilidade do editor para posição, idioma, mover, remover, fallback, disabled e touch target |

## Checklist

- [x] TASK-001 — Criar a entity `content-language-preference` com tipos públicos, conjunto mobile suportado, normalização ordenada e derivação guest, escrevendo primeiro os unitários de `AC-001`, `AC-003` e `AC-006`.
- [x] TASK-002 — Implementar a leitura autenticada `GET /users/me/content-locales` na entity e a escrita `PATCH /users/me/content-locales` na feature, ambas com envelope `{ contentLocales: string[] }`, sinal de cancelamento e testes de contrato; não alterar o interceptor nem serializar a cadeia em headers.
- [x] TASK-003 — Criar em `manage-content-languages` o estado de hidratação por `identityEpoch`, cadeia confirmada, fallback efetivo, indisponibilidade e retry de leitura; cancelar requests e limpar projeção/cache privado antes de guest ou nova conta, sem importar horizontalmente de `manage-settings`.
- [x] TASK-004 — Implementar edição explícita de adicionar, remover e reordenar, PATCH da cadeia integral, cadeia confirmada separada da pendente, versão monotônica, proteção contra respostas obsoletas e retry da versão mais recente; não disparar PATCH para correção produzida apenas pela normalização do GET.
- [x] TASK-005 — Invalidar ou atualizar somente queries de catálogo e UGC marcadas como dependentes da cadeia após confirmação do PATCH; preservar estado independente de idioma e manter a preferência confirmada quando a atualização de consumidores falhar.
- [x] TASK-006 — Criar o editor autenticado com textos i18n trilíngues e estados reais de loading/error/pending/retry; explicar prioridade e fallback, ocultar a edição para guest e tornar posição, ações, disabled e alvos de toque verificáveis por tecnologia assistiva.
- [x] TASK-007 — Compor um `ContentLanguagesAccountGate` no shell e o editor na superfície Profile usando apenas APIs públicas; o widget deve combinar sessão e idioma da UI para ativar, desativar e atualizar o fallback guest sem acoplar dois slices de feature.
- [x] TASK-008 — Adicionar evidência explícita de que `Accept-Language` continua sendo apenas o idioma efetivo da interface em request comum e refresh, mesmo quando a cadeia autenticada divergir.
- [x] TASK-009 — Atualizar `coverage.json`, registry/código relacionado e as fotografias/reconciliação de baseline afetadas pela nova composição, sem reescrever requisitos normativos nem promover placeholders a comportamento de domínio.
- [x] TASK-010 — Executar testes focados durante cada camada e, ao final, `pnpm specs:check`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, `pnpm format:check`, `pnpm test:ci` e `pnpm check`; registrar evidências e encaminhar a implementação ao Reviewer e Drift Auditor.

## Ordem e colocação FSD

1. `shared`: reutilizar `src/shared/api`, i18n, query client e utilitários BCP 47 genéricos; não colocar o conjunto mobile nem regras de conteúdo nesta camada.
2. `entities/content-language-preference`: modelo, normalização, derivação efetiva e GET da preferência de conteúdo; expor somente a API pública em `index.ts`.
3. `features/manage-content-languages`: PATCH, store/state machine, ações do editor e UI da alteração; importar apenas entity e `shared`.
4. `application`: gate de identidade/idioma e composição global; atualizar o barrel público da app layer.
5. `pages/profile`: compor o editor autenticado sem chamada HTTP ou regra de domínio direta.
6. `app`/root: incluir apenas o gate já encapsulado pelo widget, preservando a ordem de inicialização e os gates existentes.
7. Evidências, `coverage.json`, baselines afetados, registry, review e auditoria de drift.

## Arquivos prováveis

- `src/entities/content-language-preference/{api,model,index.ts}`
- `src/entities/content-language-preference/{api,model}/__tests__/`
- `src/features/manage-content-languages/{api,model,ui,index.ts}`
- `src/features/manage-content-languages/{api,model,ui}/__tests__/`
- `src/application/gates/ContentLanguagesAccountGate.tsx`
- `src/application/gates/__tests__/ContentLanguagesAccountGate.test.tsx`
- `src/application/gates/index.ts`
- `src/application/RootApplication.tsx`
- `src/pages/profile/ui/ProfilePage.tsx`
- `src/shared/api/__tests__/apiClient.test.ts`
- `src/shared/i18n/locales/{pt-BR,en-US,es-ES}/common.json`
- `specs/coverage.json`, `specs/registry.md` e baselines/reconciliação diretamente afetados

## Riscos e controles

- A sessão hidratada pode estar autenticada com `user` nulo; usar `identityEpoch`, não dados opcionais do perfil, como limite técnico de isolamento.
- O idioma da UI pertence a `manage-settings`, mas a nova feature não pode importá-la. A composição deve ocorrer no widget/page por argumentos ou props para preservar FSD.
- O GET pode retornar valores válidos para a Core, mas fora do conjunto mobile. Normalizar localmente sem PATCH automático evita escrita não solicitada.
- Estado otimista não é confirmação remota. Manter `confirmed`, `pending`, versão e status distintos impede que erro ou resposta antiga apaguem a prioridade escolhida.
- Invalidação de cache deve ser declarativa e seletiva; não limpar todo o Query Client nem apagar formulário, downloads ou estado sem relação com a cadeia.
- Guest não possui editor nem armazenamento próprio da cadeia. A política efetiva deve reagir ao idioma da interface sem criar uma preferência fictícia.
- A UI deve reutilizar tokens de tema, tipografia, densidade e alvo mínimo de toque já implementados, sem cores ou textos hardcoded.
- Nenhuma query real de catálogo/UGC deve ser inventada para satisfazer `AC-005`; a evidência pode usar metadata/query keys e consumidores de teste até essas superfícies existirem.

## Gates e critérios de parada

- Parar antes de código se a spec deixar de estar `approved`, se o frontmatter/registry deixarem o gate `open` ou se `MOB-FEAT-001`/`MOB-FEAT-003` deixarem de estar `implemented`.
- Parar e retornar ao Spec Architect se o contrato real da Core divergir do envelope ou dos endpoints normativos, ou se uma decisão exigir idioma, persistência guest, filtro ou navegação fora desta spec.
- Parar a task afetada se sua implementação exigir import horizontal entre features, regra de domínio em `shared`, deep import externo ou nova exceção do Steiger.
- Não alterar runtime de catálogo, fórum, leitor ou navegação de settings; `MOB-FEAT-005` e `MOB-FEAT-008` continuam fora deste executor.
- Não marcar `implemented` com qualquer `AC-*` sem evidência, arquivo runtime sem cobertura, gate vermelho, review diferente de `approved` ou drift não reconciliado.
- Não editar `spec.md` para acomodar o código. Qualquer lacuna ou contradição normativa interrompe a execução e volta para decisão humana.

## Evidências a registrar durante a execução

- Comandos focados por model/store/API/UI usando Jest e Axios Mock Adapter, sem snapshots.
- Contagem final de suítes/testes e resultado de cada gate no bloco de evidências deste arquivo.
- Caminho exato de cada teste ligado ao respectivo `AC-*` no `coverage.json`.
- Review independente comparando spec, código e evidências, seguido de auditoria de drift antes da promoção de status.

## Evidências executadas

- `CI=true pnpm test:ci --runTestsByPath ...`: o conjunto focado final de regressão da revisão aprovou 4 suítes, 26 testes e zero snapshots; somado aos contratos de entity/API/client já verificados, cobre normalização/guest, GET/PATCH, concorrência, retry de escrita, retry exclusivo de consumidores, invalidação versionada, boundary de identidade e editor.
- `CI=true pnpm specs:check`: 19 artefatos normativos registrados; 284 arquivos classificados; 137 arquivos de comportamento e 37 de evidência mapeados.
- `CI=true pnpm typecheck`: aprovado sem erros.
- `CI=true pnpm lint`: aprovado sem erros.
- `CI=true pnpm lint:fsd`: aprovado, sem violações.
- `CI=true pnpm test:ci`: 37 suítes e 151 testes aprovados, zero snapshots.
- `CI=true pnpm check`: aprovado integralmente após as correções da revisão; 37 suítes e 152 testes aprovados, zero snapshots e sem handles pendentes.
- Regressões dos findings: resultados tardios de invalidação são ignorados por identidade e versão em troca de conta/logout/expiração; a boundary síncrona bloqueia qualquer filho enquanto sessão e store divergem; retry de consumidor reexecuta somente as query keys falhas e jamais repete o PATCH.
- Handoff pendente ao Reviewer e ao Drift Auditor; a spec permanece `in-progress` e não foi autoaprovada.
