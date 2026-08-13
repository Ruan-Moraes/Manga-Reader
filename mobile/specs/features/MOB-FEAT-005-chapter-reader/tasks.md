# Tasks — MOB-FEAT-005

- Spec: `spec.md`
- Status atual: `verification-pending`
- Gate no planejamento: `open`
- Dependências implementadas: `MOB-FEAT-001`, `MOB-FEAT-004`

## Rastreabilidade

| Critério | Tasks                                  | Evidência planejada                                                                                                                                                            |
| -------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC-001   | TASK-001, TASK-002, TASK-005, TASK-009 | Unitários do mapper com páginas inválidas, repetidas e fora de ordem; contrato GET; integração da lista ordenada e estado localizado de capítulo vazio                         |
| AC-002   | TASK-003, TASK-005, TASK-009           | Matriz unitária de `VERTICAL`/`PAGED`/`DOUBLE` × `LTR`/`RTL`/`WEBTOON`, interação de troca de modo e caso ímpar de DOUBLE sem repetição                                        |
| AC-003   | TASK-004, TASK-005                     | Testes de limites de fit/saturação/gap/fundo/preload, integração com o único store de settings e remount provando restauração sem estado paralelo                              |
| AC-004   | TASK-001, TASK-004                     | Teste de capacidade escondendo LOW/MEDIUM/HIGH com apenas `imageUrl`/`thumbnailUrl` e liberando opções somente diante de fontes materialmente distintas verificáveis           |
| AC-005   | TASK-002, TASK-006, TASK-008, TASK-009 | Integração guest inspecionando zero GET/PUT em `/users/me/reading-progress`, com navegação, preferências e retry local ainda funcionais                                        |
| AC-006   | TASK-006, TASK-007, TASK-009           | Integração de retomada válida, escolha entre capítulo solicitado/recente, progresso inválido, logout, expiração, resposta tardia e troca entre duas identidades                |
| AC-007   | TASK-006, TASK-008                     | Testes de payload com página base 1, clamp ao total, total desconhecido e matriz `autoMarkRead` ativo/inativo × última/não última página                                       |
| AC-008   | TASK-005, TASK-008, TASK-009           | Falha/retry isolado de imagem e rede, posição preservada, pending observável, retry da versão mais recente, resposta obsoleta ignorada e nenhuma duplicação/regressão          |
| AC-009   | TASK-004, TASK-005, TASK-009, TASK-010 | Testes de roles/labels/hints/disabled/touch target, redução de movimento e escala de fonte; teste de rotação preservando página lógica e matriz manual iOS/Android documentada |

## Checklist

- [x] TASK-001 — Escrever primeiro os testes e criar `entities/chapter` com tipos do contrato do leitor, validação das páginas prontas, deduplicação por identidade de página, ordenação numérica crescente por `order`, agrupamento sem repetição e detecção explícita das variantes de imagem realmente disponíveis; expor somente a API pública pelo barrel.
- [x] TASK-002 — Implementar na entity a query pública `GET /titles/{titleId}/chapters/{number}/reader`, mapear somente `id`, `titleId`, `number`, `title`, `status` e páginas `id/order/imageUrl/thumbnailUrl/width/height`, integrar query keys específicas e cobrir envelope, parâmetros, cancelamento, indisponibilidade, resposta sem páginas válidas e ausência de qualquer endpoint privado para guest.
- [x] TASK-003 — Criar uma feature de navegação do leitor com funções puras/estado para obter a sequência e a posição lógica em `VERTICAL`, `PAGED` e `DOUBLE`, aplicando `WEBTOON` como fluxo vertical e LTR/RTL como direção nos modos paginados; cobrir mudanças de modo/direção, página ímpar final, limites e estabilidade da página corrente.
- [x] TASK-004 — Criar uma feature de configuração do leitor cuja UI receba settings e callbacks por props, aplique fit/saturação/gap/fundo/preload dentro dos domínios já normalizados por `MOB-FEAT-001`, e derive as opções de qualidade da capacidade real das fontes; na composição superior, ligar os callbacks à API pública de `manage-settings`, sem import horizontal nem store paralelo.
- [x] TASK-005 — Implementar a viewport com `expo-image`, superfície de fundo restrita ao leitor, ajuste que não use recorte implícito, preload limitado às páginas adjacentes configuradas e estado por página para loading/erro/retry; provar que falha e retry de uma imagem preservam posição, páginas já carregadas e identidade da lista, e adicionar testes de memória/rede que controlem a quantidade solicitada para preload 0 e 10.
- [x] TASK-006 — Criar `entities/reading-progress` com modelo validado e query autenticada `GET /users/me/reading-progress/{titleId}`, além do contrato de escrita `PUT /users/me/reading-progress` em uma feature de rastreamento; o payload deve conter exatamente `titleId`, `chapterNumber`, `currentPage`, `totalPages` e `completed`, aceitar cancelamento e nunca executar GET/PUT quando não houver sessão autenticada.
- [x] TASK-007 — Implementar o fluxo de retomada autenticada isolado por `identityEpoch`: validar capítulo/página do progresso, oferecer escolha localizada entre continuar o progresso recente e abrir o capítulo solicitado quando divergirem, usar a primeira página válida para resposta inválida e registrar diagnóstico observável; cancelar/ignorar respostas da identidade anterior antes de consultar a nova conta.
- [x] TASK-008 — Implementar a máquina de sincronização de progresso com versão monotônica da posição lógica, pending não bloqueante e retry; limitar `currentPage` a 1…`totalPages`, enviar `completed: true` somente na última página com total conhecido e `autoMarkRead` ativo, rejeitar respostas obsoletas/regressivas e, em logout ou expiração, interromper apenas a sincronização privada sem desmontar a leitura pública.
- [x] TASK-009 — Criar `widgets/chapter-reader` para compor viewport, controles ocultáveis/descobríveis, navegação, settings e progresso sem lógica de domínio própria; criar `pages/reader` full-screen e casca fina Expo Router parametrizada por `titleId`/`number`, com estados localizados de loading, indisponibilidade, erro e saída segura para a obra. A page/widget deve ser a única camada que combine sessão, `manage-settings` e as features do leitor.
- [ ] TASK-010 — Cobrir acessibilidade e rotação: nomes, roles, hints, estado selecionado/desabilitado e alvos mínimos de toque; layout com reflow sob escala de fonte; transições decorativas condicionadas à redução de movimento efetiva; preservação da página lógica após mudança de dimensões/orientação. Executar e registrar também a matriz manual iOS/Android para VoiceOver/TalkBack, rotação, memória, rede e preload. Parcela automatizável concluída; matriz física iOS/Android explicitamente pendente.
- [x] TASK-011 — Adicionar as chaves visíveis do leitor em namespace próprio ou namespace consumidor apropriado nos três idiomas suportados, validar paridade trilíngue e manter labels vindos da API sem tradução artificial; nenhum texto de erro, retry, retomada, controle ou acessibilidade pode ficar hardcoded.
- [x] TASK-012 — Atualizar `coverage.json` individualmente para cada arquivo runtime/evidência, o registry com código relacionado e somente as fotografias/reconciliações de baseline realmente afetadas, em especial a substituição parcial de `MOB-BASE-008/OBS-001`; não alterar outras superfícies placeholder nem reescrever a Target Spec.
- [x] TASK-013 — Executar testes focados por camada e os gates `pnpm specs:check`, `pnpm typecheck`, `pnpm lint`, `pnpm lint:fsd`, `pnpm format:check`, `pnpm test:ci` e `pnpm check`; registrar comandos/resultados, encaminhar a implementação ao Reviewer e ao Drift Auditor e somente então avaliar a promoção para `implemented`.

## Ordem e colocação FSD

1. `shared`: reutilizar cliente HTTP, query client, tema, i18n, primitives de acessibilidade e `expo-image`; criar adaptador de viewport/dimensões apenas se ele for genuinamente agnóstico ao domínio.
2. `entities/chapter`: contrato de capítulo/página, mapper, ordenação/deduplicação, capacidade de fontes e GET público; nenhum gesto, mutação ou dependência de sessão.
3. `entities/reading-progress`: modelo validado e GET privado de progresso; nenhuma escrita ou decisão de retomada.
4. `features/navigate-chapter-reader`: sequência, direção, modo e posição lógica; importar somente entities/shared.
5. `features/configure-chapter-reader`: controles e derivações de preferência por props; não importar `manage-settings` nem outra feature.
6. `features/track-reading-progress`: PUT, pending/retry, monotonicidade e isolamento por identidade; não importar navegação ou configuração horizontalmente.
7. `widgets/chapter-reader`: compor as três features, entities e UI; ligar o settings store e a sessão por APIs públicas ou receber esses contratos da page quando isso reduzir acoplamento.
8. `pages/reader`: orquestrar parâmetros da rota, capítulo solicitado, escolha de retomada, estados da página e saída segura.
9. `app`: adicionar somente a casca de rota Expo Router e a configuração full-screen necessária, sem regra de capítulo.
10. Evidências, i18n, cobertura, registry, baseline afetado, review e auditoria de drift.

## Arquivos prováveis

- `src/entities/chapter/{api,model,index.ts}` e testes próximos a `api/`/`model/`
- `src/entities/reading-progress/{api,model,index.ts}` e testes de contrato/validação
- `src/features/navigate-chapter-reader/{model,ui,index.ts}` e testes de sequência/interação
- `src/features/configure-chapter-reader/{model,ui,index.ts}` e testes de settings/capacidade/acessibilidade
- `src/features/track-reading-progress/{api,model,index.ts}` e testes de sessão/concorrência/retry
- `src/widgets/chapter-reader/{ui,index.ts}` e testes de integração da viewport/controles
- `src/pages/reader/{ui,index.ts}` e testes de retomada, estados e rotação
- `app/reader/[titleId]/[number].tsx` e eventual `_layout.tsx` fino, se necessário para full-screen
- factories de query keys em `src/entities/chapter` e `src/entities/reading-progress`
- `src/shared/i18n/index.ts` e `src/shared/i18n/locales/{pt-BR,en-US,es-ES}/reader.json`
- `specs/coverage.json`, `specs/registry.md` e baseline/reconciliação diretamente afetados

## Contratos e limites de integração

- O cliente compartilhado já prefixa `/api`; os paths da feature permanecem `/titles/{titleId}/chapters/{number}/reader`, `/users/me/reading-progress/{titleId}` e `/users/me/reading-progress`, sem duplicar o prefixo.
- O GET público do capítulo deve continuar funcional após expiração da sessão. O GET em `/users/me/reading-progress/{titleId}` e o PUT em `/users/me/reading-progress` exigem a sessão vigente e devem ser cancelados ou ignorados quando o `identityEpoch` mudar.
- O PUT envia o snapshot integral `{ titleId, chapterNumber, currentPage, totalPages, completed }`. Se o envelope real da Core divergir do contrato normativo, parar antes de adaptar silenciosamente.
- `Accept-Language` e a cadeia de conteúdo continuam sob `MOB-FEAT-003`/`MOB-FEAT-004`; o leitor apenas usa o cliente e os contratos públicos existentes, sem criar header ou persistência paralela.
- O contrato atual expõe `imageUrl` e `thumbnailUrl`. Isso não comprova três fontes LOW/MEDIUM/HIGH; a UI deve permanecer capability-driven e não sintetizar variantes por transformação de URL.
- Query keys devem incorporar identidade quando privadas e `titleId`/capítulo quando públicas, permitindo remover progresso privado sem apagar o capítulo público ou caches sem relação.

## Riscos e controles

- Páginas podem chegar fora de ordem, repetidas, inválidas ou com o mesmo `order`. O mapper deve produzir identidade/ordem determinísticas sem fabricar página; ambiguidade que não possa ser resolvida pelos campos normativos volta ao Spec Architect.
- Trocar modo, direção, dimensões ou agrupamento pode deslocar índices visuais. Manter uma identidade de página lógica separada do índice do item/pair impede perda de posição.
- Eventos rápidos de viewability e respostas PUT fora de ordem podem regredir progresso. Versionar snapshots e aceitar confirmação somente da identidade e posição mais recentes.
- O leitor público e o progresso privado possuem ciclos de vida distintos. Expiração deve cancelar/remover somente estado da conta, nunca a query pública nem a posição local corrente.
- Preload alto pode pressionar memória e rede. Limitar estritamente a janela adjacente, cancelar trabalho fora dela e medir os extremos previstos sem prometer cache offline.
- `DOUBLE` com RTL não pode ser implementado apenas invertendo a lista visual, pois isso pode repetir ou omitir a página ímpar. Derivar pares por função pura e testar a matriz completa.
- `ORIGINAL` e fit por altura não autorizam `cover`, crop, zoom ou processamento destrutivo. A viewport deve preservar proporção e permitir a dimensão necessária no eixo de leitura.
- Uma folha de controles que importe diretamente outro slice de feature viola FSD. A integração de `manage-settings`, sessão, navegação e progresso pertence ao widget/page.
- Rotação e leitores de tela têm limitações no ambiente Jest. Automatizar estado lógico e propriedades acessíveis e registrar a matriz manual exigida, sem substituir uma pela outra.

## Gates e critérios de parada

- Parar antes de código se a spec deixar de estar `approved`, se o gate deixar de estar `open`, ou se `MOB-FEAT-001`/`MOB-FEAT-004` deixarem de estar `implemented` no registry.
- Parar e retornar ao Spec Architect se a Core não expuser os endpoints/campos normativos, se identidade de página duplicada for irremediavelmente ambígua, ou se a experiência de retomada exigir uma decisão não descrita pela spec.
- Parar a task afetada se ela exigir import horizontal entre features, deep import externo, regra de capítulo em `shared`, lógica de negócio no widget/page ou nova exceção no Steiger.
- Não implementar catálogo, detalhes da obra, comentários, avaliações, download/offline, zoom, recorte, processamento de imagem no servidor ou qualidades artificiais.
- Não transformar teste de rotação/accessibility em snapshot e não considerar evidência manual genérica como substituta dos casos automatizáveis.
- Não marcar `implemented` enquanto a TASK-010 permanecer aberta, qualquer `AC-*` estiver sem evidência, houver arquivo runtime sem cobertura, gate vermelho, review diferente de `approved` ou drift não reconciliado.
- Não editar `spec.md` para acomodar o código. Contradição ou lacuna normativa interrompe a execução e exige decisão humana.

## Evidências a registrar durante a execução

- Comandos Jest focados por entity/feature/widget/page e testes de contrato com Axios Mock Adapter, sem snapshots.
- Matriz automática de modo × direção × paridade de páginas, limites de settings, qualidade disponível, sessão guest/auth e conclusão.
- Cenários temporizados de PUT concorrente, retry, resposta tardia, logout, expiração e troca de conta com inspeção dos requests.
- Métricas/asserts do número de imagens adjacentes solicitadas em preload 0 e 10 e preservação da posição após falha/rotação.
- Matriz manual datada por plataforma/dispositivo para VoiceOver/TalkBack, escala de fonte, redução de movimento, rotação, memória e rede degradada.
- Resultado final de cada gate, contagem de suítes/testes e caminhos exatos associados aos `AC-*` em `coverage.json`.
- Review independente comparando spec, código e evidências, seguido da auditoria de drift antes da promoção de status.

## Evidências executadas

- Modelos/contratos: `src/entities/chapter/**`, `src/entities/reading-progress/**`, `src/features/navigate-chapter-reader/**` e `src/features/track-reading-progress/**`; mappers, GET/PUT, cancelamento, identidade, retomada, monotonicidade e limites cobertos por testes focados.
- Configuração/viewport: `src/features/configure-chapter-reader/**` e `src/widgets/chapter-reader/**`; qualidade capability-driven, modos/direções, paridade ímpar, preload 0/10, falha/retry e propriedades acessíveis cobertos sem snapshots.
- Composição: `src/pages/reader/**`, `app/reader/**` e registro no RootNavigator; integração guest prova somente GET público e zero chamadas `/users/me`.
- Preferências do leitor também são compostas em Profile pelo mesmo `manage-settings`, sem store paralelo.
- i18n: namespace `reader` em `pt-BR`, `en-US` e `es-ES`; teste global de paridade atualizado.
- Correções pós-review: `chapterNumber` textual e decimal foi provado em envelopes GET e payload PUT; falha do GET privado mantém leitura pública, oferece retry localizado e bloqueia PUT; a boundary keyed por `identityEpoch` descarta estado A antes de B e ignora resposta tardia; o viewport vertical restaura a identidade por layouts medidos, alturas variáveis, gap e reflow; controles ocultos removem também anterior/próxima e o painel de preferências é rolável.
- Validação contextual adicional: progresso remoto `3/3` contra capítulo real de duas páginas é diagnosticado, volta à página 1 e mantém zero PUT até navegação explícita; capítulo recente 404 também é diagnosticado, não grava progresso e oferece retorno localizado ao capítulo solicitado.
- Matriz automática: 48 suítes, 192 testes, zero snapshots; inclui as nove combinações modo × direção, limites, sessão guest/auth, retry separado de GET/PUT, troca síncrona de identidade, progresso inválido estrutural e contextual observável, capítulo recente indisponível, preload, alvos acessíveis, fonte ampliada e preservação da página lógica por layout controlado. VoiceOver/TalkBack, rotação física, memória e rede degradada em dispositivos reais permanecem explicitamente **não executados** por ausência de simulador/dispositivo.
- `CI=true pnpm check` pós-review em 2026-08-08: verde. Subgates: 15 testes do validador; 19 artefatos normativos/324 arquivos classificados; typecheck, ESLint, Steiger e Prettier verdes; 48 suítes/192 testes verdes, zero snapshots.
- Ajuste FSD durante a execução: a composição permaneceu em `widgets/chapter-reader` e ganhou o segundo consumidor real em Profile para disponibilizar as mesmas preferências fora do leitor; nenhuma exceção Steiger foi criada.
