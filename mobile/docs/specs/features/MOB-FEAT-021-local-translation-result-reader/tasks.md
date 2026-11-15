# Tasks — MOB-FEAT-021, aquisição volátil no aparelho

- Spec humana aprovada em 2026-11-01; gate aberto em 2026-11-02 após
  019/026/027/051 `verification-pending`. Autorização sequencial: DEC-008.
- Gate documental 019: `pnpm specs:check` exit0, rodada8, antes deste plano.
- Tasks antigas estão preservadas em evidence; não provam esta integração.

## Rastreabilidade

| Critério | Tasks                                  | Evidência prevista                                                                      |
| -------- | -------------------------------------- | --------------------------------------------------------------------------------------- |
| AC-001   | TASK-001, TASK-004                     | somente marcos de resposta recebida e commit local; retomada local sem polling remoto   |
| AC-002   | TASK-001, TASK-002, TASK-003           | bytes/manifesto/vínculos, arquivos privados, SQLite real, rollback e concorrência       |
| AC-003   | TASK-003, TASK-004                     | claim durável antes de navegar; back/rerender/restart                                   |
| AC-004   | TASK-004, TASK-005                     | leitor local sem demo/Core/login; original e overflow completo                          |
| AC-005   | TASK-003, TASK-005, TASK-007           | resultado íntegro retomado sem transporte/gateway; prova física offline                 |
| AC-006   | TASK-001, TASK-002, TASK-003, TASK-004 | resposta perdida/inválida, disco/DB, interrupção, limpeza somente de artefatos próprios |
| AC-007   | TASK-005                               | arte-only abre com aviso localizado e sem fallback vazio                                |
| AC-008   | TASK-004, TASK-005, TASK-007           | UI e testes em três idiomas; acessibilidade física                                      |

## Checklist

- [x] TASK-001 — Trocar URL/poll/ACK pelo take único da entrega em memória da 017; conferir operação, original, par, limites, hash e manifesto; sempre liberar buffers; nunca repetir provider.
- [x] TASK-002 — Verificar formato real/dimensões e decode do WebP antes do commit privado; preservar original e remover somente arquivos parciais próprios nas falhas.
- [x] TASK-003 — Reusar transação exclusiva resultado/regiões/READY com fence de interrupção; resolver COMMIT ambíguo por verdade durável; impedir reconciliação de arquivos em paralelo com promoção/commit; manter auto-open durável exatamente uma vez.
- [x] TASK-004 — Integrar contrato2.0 ao widget/hook, progresso somente confirmado, retomada e mensagens honestas de perda sem retry/reconsulta de conteúdo; i18n/tokens/accessibilidade.
- [x] TASK-005 — Revalidar leitor local, original, texto completo de overflow e arte-only nos três idiomas, sem demo overlay ou rede após commit.
- [x] TASK-006 — Executar testes focados, `pnpm check`, revisão independente e auditoria de drift; coverage individual e checksum reproduzível.
- [ ] TASK-007 — Verificar ponta a ponta no aplicativo nativo, ciclo foreground/background/restart, disco/commit, navegação uma vez e leitura offline sem gateway, com matriz física de acessibilidade. Não inferir isso de Jest/Node.

## Plano de dados antes do código

Banco local existente: SQLite. Nenhuma nova tabela/coluna/migration prevista.
`translation_page_results`: `page_id` PK e `attempt_id` UNIQUE; resultado depende
dessas chaves candidatas, FK para página/tentativa com CASCADE. Regiões dependem
do ID e `(page_id,reading_order)`; vértices de `(region_id,vertex_index)`.
Preservar CHECK/FK/índices existentes e metadados opcionais, sem documento
paralelo de conteúdo. `auto_opened_at` continua na linha do resultado.

A alteração de predicado do writer aceita somente tentativa2.0 já confirmada
como entrega integral (`ACCEPTED`, recibo `FINISHED`, operação correta), mantendo
leitura offline de resultados legados. Fence local de cancelamento participa da
transação; nenhum novo estado SQL é necessário. Falha/rollback confirmado usa
`failVolatileAttempt` existente; COMMIT ambíguo não apaga a única cópia enquanto
não for possível consultar a linha durável. A reconciliação conserva arquivos
referidos por resultados e remove somente órfãos confirmados no próximo início.

Lease em memória no slice `local-translation-result` serializa promoção/commit
e reconciliação de arquivos. Não é um journal persistente ou sincronização de
conteúdo no servidor. O retorno direto nunca depende de sessão de conta.

## Arquivos e FSD

Shared mantém framing/limites binários da 017 e inspeção/hash de arquivos.
Entities mantêm posse da entrega, validação de manifesto e escrita do agregado
local. A feature `acquire-remote-translation-result` orquestra via APIs públicas;
o widget combina start/acquire sem import horizontal entre features. Reader
local existente é revalidado. Novos arquivos runtime exigem coverage individual.

## Limites

Somente fixtures sintéticos/testes locais nesta etapa. Não autoriza provider
pago, mídia real, deploy ou habilitação pública. Ausência de conteúdo após
restart não pode ser classificada como conteúdo remotamente recuperável.

## Resultado técnico em 2026-11-02

Gate completo `pnpm check`: exit0,128 suites/1016 testes, zero falhas; specs,
typecheck, lint, FSD e format passaram. Revisão independente reconferiu dois
findings corrigidos por três regressões red/green, sem outro bloqueador concreto.
TASK-007 permanece aberta; não foi simulada como prova física. Ver
[evidência](evidence/volatile-client-verification-2026-11-02.md) e
[revisão independente](evidence/volatile-spec-and-plan-review-2026-11-02.md).
