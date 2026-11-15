# Tasks — MOB-FEAT-020, revisão volátil

Spec aprovada por Ruan em 2026-11-01; gate aberto em 2026-11-02 após revisão
019 `verification-pending`, conforme DEC-008. Backend externo não é submetido
ao gate mobile, mas sua integração corrente exige provas próprias.

| Critério | Tasks                        | Evidência prevista                                                    |
| -------- | ---------------------------- | --------------------------------------------------------------------- |
| AC-001   | TASK-001, TASK-004           | pixels fora da região e original integral preservado                  |
| AC-002   | TASK-002, TASK-004           | fontes licenciadas, sete destinos e revisão visual                    |
| AC-003   | TASK-002, TASK-005           | overflow integral no manifesto e acesso no leitor                     |
| AC-004   | TASK-001, TASK-004           | arte-only sem alteração de pixels                                     |
| AC-005   | TASK-003, TASK-004, TASK-005 | resposta autenticada/hash/limites sem arquivo de conteúdo no servidor |
| AC-006   | TASK-003, TASK-004, TASK-006 | memória total, falhas/deadline/restart/cancel e alvo admitido         |

- [x] TASK-001 — Conferir algoritmo clean-box/polígonos, raster único e comparação independente de pixels em formatos/dimensões admitidos.
- [x] TASK-002 — Conferir fontes/licenças/wrapping/direção/contraste em sete destinos; overflow conserva tradução integral e vazio não cria caixas.
- [x] TASK-003 — Conferir sessão/IPC em memória, hashes/framing/limites, admissão antes de provider/decode e posse de processos/buffers até limpeza.
- [x] TASK-004 — Consolidar provas atuais da candidata6, matriz8/22, HTTP máximo/deadline real e visual9 com fontes/JAR/imagens, logs/SQL/scratch, coverage e gates documentais finais. Reaberta após o contraexemplo c5 e a correção do pipe.
- [ ] TASK-005 — Revalidar consumo e armazenamento exclusivamente no aparelho na 021, READY após commit, leitor/original/fallback e ciclo offline; prova física separada de Jest.
- [ ] TASK-006 — Reproduzir composição volátil atual em Linux AMD64/COS125/e2-highmem-2 no envelope privado e orçamento previamente autorizados; aferir memória/CPU/PIDs/swap/scratch e falhas/recovery sem providers pagos. Preservar recibos e limpar recursos próprios; nenhuma inferência a partir da ARM local.
- [ ] TASK-007 — Fechar revisão independente por AC, drift/coverage/checksum e auditoria de conclusão. Qualidade humana/políticas/operação não comprovadas continuam explícitas.

Não há persistência de conteúdo nova no servidor nem migration prevista.
Recibos sanitizados pertencem à 017; dados do resultado somente no SQLite e
arquivos privados do aparelho pela 021. Evidências históricas permanecem
preservadas e não recebem aceite retroativo. Nenhum gate público é aberto por
testes privados. As condições de custo/infra da autorização original continuam
valendo; esta task não cria autorização adicional.

## Provas locais vigentes

Atualização de 2026-11-03: TASK-001..003 conferidas localmente na candidata6.
O contraexemplo c5 HTTP11 (SIGSTOP90s sem retorno até o future120s) permanece
preservado. C6 passou o cenário real de timeout/ASfault/recovery, HTTP12OCR/
11Translate, restart real, matriz8/22 e visual9/8699904 pixels. A raiz backend7
passou 2863 testes, zero falhas/erros, 116 skips e 470 XMLs novos. TASK-004 consolida as provas locais c6 e a referência documental; não são
aceites operacionais. Os gates finais desta consolidação constam da review.

A 021 está verification-pending após integração técnica, gate128 suites/1016
testes e revisão independente. TASK-005 continua sem prova do ciclo no Simulador
iOS; disponibilidade do framework e timeouts DeviceHub/CUA não comprovam o app.
TASK-006 não foi executada: imagem AMD64 pronta não é admissão Compute, e nova
rodada cloud foi rejeitada automaticamente antes da execução. Não houve retry
ou criação; exige autorização explícita vigente, sem inferi-la do handoff antigo.
O [audit corrente c6](evidence/volatile-candidate-6-completion-audit-2026-11-03.md)
registra provas, contraevidência e pendências, sem concluir a 020.

## Atualização posterior — rodada privada AMD64 de 2026-11-03

A rodada c6 autorizada executou em AMD64/COS125 e terminou com código 0;
inventário final e cleanup confirmaram ausência dos recursos próprios. A
[evidência](evidence/volatile-candidate-6-completion-audit-2026-11-03.md)
registra medições e limites. TASK-006 permanece aberta: o harness dessa rodada
não exercitou cancelamento explícito no alvo, exigido no plano de verificação.
TASK-005 e TASK-007 permanecem abertas; o Device Hub ainda não respondeu.
Os parágrafos anteriores sobre ausência de autorização são histórico anterior
à resposta humana explícita e à execução desta rodada.

## Ensaio público controlado — 2026-11-04

A tradução sintética real e a operação temporária estão registradas em
[registro operacional](../../../../../api/apps/translation-gateway/docs/private-android-test-2026-11-04.md).
TASK-005, TASK-006 e TASK-007 permanecem abertas; a prova não substitui
cancelamento explícito, qualidade visual e evidência física.
