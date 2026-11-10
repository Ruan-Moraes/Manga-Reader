# Tasks — MOB-FEAT-055

- Spec: `spec.md`, aprovada por Ruan Moraes em 2026-11-04.
- Gate no planejamento: `open`.
- Dependências: MOB-FEAT-017, 021, 025 e 051 em `verification-pending`.

## Rastreabilidade

| Critério | Tasks    | Evidência planejada                    |
| -------- | -------- | -------------------------------------- |
| AC-001   | TASK-001 | SQLite, migração, integridade e falhas |
| AC-002   | TASK-002 | CRUD local, capa e exclusão            |
| AC-003   | TASK-003 | capítulos, importação e ordenação      |
| AC-004   | TASK-004 | lote sequencial e progresso            |
| AC-005   | TASK-005 | falha isolada, ambiguidade e retry     |
| AC-006   | TASK-006 | reader, fallback e erro localizado     |
| AC-007   | TASK-007 | zoom, pan e gestos                     |
| AC-008   | TASK-008 | navegação e consistência de header     |
| AC-009   | TASK-009 | interrupção, restart e offline         |
| AC-010   | TASK-010 | gates e matriz física                  |

## Checklist

- [x] TASK-001 — Implementar e verificar persistência e migração não destrutiva.
      Execução (2026-11-08): cadeia completa v0 → v11 com os repositórios reais em SQLite (`localDataMigrationChain.test.ts`), preservando projeto e páginas, idempotente ao reabrir e sem violação de FK.
- [x] TASK-002 — Integrar cadastro e gerenciamento local das obras e capas.
- [x] TASK-003 — Integrar capítulos e páginas à biblioteca e importação.
- [x] TASK-004 — Processar lote sequencial com progresso por página e agregado.
- [x] TASK-005 — Isolar falhas e permitir retry seletivo sem reenvio ambíguo.
- [x] TASK-006 — Exibir original, erro acessível e retry individual no leitor.
- [x] TASK-007 — Implementar zoom, pan, reset e coordenação de gestos.
- [x] TASK-008 — Corrigir navegação e concluir padronização do cabeçalho.
- [x] TASK-009 — Verificar interrupção, reinício, offline e limites de rede.
- [ ] TASK-010 — Executar gates completos e validar matriz em aparelho físico.

## Riscos e bloqueios

A entrega volátil não permite recuperar o conteúdo após perda da sessão; resposta
ambígua não autoriza retry pago automático. Dados existentes devem sobreviver à
migration e a exclusões devem coordenar SQLite, arquivos e operação em curso.

## Progresso parcial — 2026-11-04

A camada SQLite aditiva, ordenação de rótulos, proteção contra alterações
concorrentes, exclusão transacional com bloqueio de tentativas ativas e
operações privadas de capa possuem testes focados. O leitor verifica o original
quando não existe resultado; o retorno de um projeto sem draft abre a biblioteca.
Essas peças ainda não estão integradas à biblioteca de obras nem ao lote; as
TAREFAS permanecem abertas, incluindo testes de migração de todas as versões e
validação nativa. O `pnpm check` parcial passou com 130 suítes e 1.036 testes.

## Progresso parcial — 2026-11-07

Integrado e coberto por testes focados (sem validação em aparelho; tasks seguem
abertas): criação de capítulo diretamente a partir da obra (vínculo do projeto
preparado, apenas se criado na sessão); orquestrador de lote sequencial
(`widgets/remote-processing/model/chapterBatch.ts`) com falha isolada, parada em
condições globais, ambiguidade nunca reenviada e retry seletivo; painel de lote com
seleção por página, progresso e consentimento; marcador de falha no canto superior
direito do leitor com retry só da página; zoom por pinça/pan/reset
(`ZoomableSurface`); voltar quadrado + Home na biblioteca; reconciliação de
tentativas ambíguas ao reabrir. Roteiro manual em
`evidence/device-test-plan-2026-11-07.md`. Pendentes: teste de migração em cadeia
de todas as versões, validação nativa (gestos, memória, acessibilidade) e checksums
de review divergentes (17–19, 21, 25–27, 49–54), que exigem nova revisão humana.

## Progresso — 2026-11-08

TASK-001..009 concluídas com evidência automatizada: a cadeia de migrações foi coberta por
`features/manage-local-works/model/__tests__/localDataMigrationChain.test.ts`; as demais peças já
estavam integradas (progresso de 2026-11-07) e foram conferidas no código: criação de capítulo a
partir da obra (`LocalWorksPanel` → `OfflineTranslationPage` com `workTarget`), lote sequencial
(`chapterBatch.ts`/`ChapterBatchPanel`), marcador e retry por página (`PageRetryIndicator` no leitor
local), zoom (`ZoomableSurface` no `ContentReader`), voltar quadrado e Home, reconciliação ao reabrir.
TASK-010 continua aberta: o roteiro `evidence/device-test-plan-2026-11-07.md` ainda não foi executado
em aparelho físico.
