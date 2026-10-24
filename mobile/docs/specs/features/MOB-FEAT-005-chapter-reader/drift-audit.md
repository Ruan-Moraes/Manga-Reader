# Drift audit — MOB-FEAT-005

- Data: 2026-08-09
- Implementação auditada: working-tree sha256:0197e775ac2875fd2619dc4a8a1a68162b97aa1591d460593588c2932c2d51b2
- Status da feature: `verification-pending`

## Escopo auditado

Spec, tasks, review, entities/features/widget/page do leitor, testes, coverage e dependências consumidoras.

## Divergências

| Severidade     | Evidência         | Classificação               | Ação                             |
| -------------- | ----------------- | --------------------------- | -------------------------------- |
| risco residual | `TASK-010` aberta | verificação física pendente | executar matriz real iOS/Android |

## Pendências de verificação

VoiceOver/TalkBack, rotação física, memória, rede degradada e preload em iOS/Android reais. Nenhum resultado manual é alegado.

Revalidação global de 2026-08-30: checksum da working tree atualizado após a
manutenção dos TODOs de auth/review local. A referência é global por definição
do validador; não representa nova inspeção nativa desta feature.

Rebase documental de performance (2026-09-05): checksum global atualizado pela inclusão da auditoria e da MOB-DEC-007; runtime preservado por comparação SHA-256. Não representa nova verificação física nem alteração de verdict.

Rodada de performance 2026-09-06: C01 / MOB-PERF-002 corrigido dentro do contrato existente, com testes de regressão. Evidência (arquivo externo: `perfomance_app/mobile/docs/active/performance-evidence/corrections-2026-09-06/review.md`). Verificação nativa permanece aberta; nenhuma nova evidência física é atribuída a esta alteração.

Rebase C01/C03/C04 (2026-09-06): checksum global atualizado após correções de numeração do leitor, persistência da validação e limite de resposta. Escopo e validações em review de performance (arquivo externo: `perfomance_app/mobile/docs/active/performance-evidence/corrections-2026-09-06/review.md`). Não representa nova verificação física das demais features.

Rodada C02/C05: contratos aprovados e gates abertos preservados; runtime coberto e revisão registrada no review da rodada (arquivo externo: `perfomance_app/mobile/docs/active/performance-evidence/corrections-c02-c05-2026-09-06/review.md`). Medição nativa permanece aberta. Contadores da revisão estática: mismatch 0, undocumented 0, arquivos descobertos 0; não substituem validação física.

Rebase C02/C05 (2026-09-06): checksum global atualizado após virtualização do leitor e download de exportação para arquivo. Escopo e validação (arquivo externo: `perfomance_app/mobile/docs/active/performance-evidence/corrections-c02-c05-2026-09-06/review.md`). Não representa nova verificação física das demais features.

Consolidação documental (2026-09-06): checksum global atualizado após reconciliar o estado de performance; runtime e verdict preservados. Registro (arquivo externo: `perfomance_app/mobile/docs/active/performance-evidence/consolidation-2026-09-06/review.md`). Sem nova validação física.

Preparação de commit (2026-09-06): rebase global após excluir scripts avulsos de ensaio, listagens Git e metadados do sistema dos arquivos versionados, conforme solicitação humana. Resultados históricos preservados; runtime e verdict inalterados.

Rebase C06 (2026-09-12): referência global recalculada para a árvore local com recuperação compartilhada. Escopo (arquivo externo: `perfomance_app/mobile/docs/active/performance-evidence/recovery-2026-09-12/review.md`). Não altera verdict nem valida implementações locais de outras tarefas ou medições físicas.
