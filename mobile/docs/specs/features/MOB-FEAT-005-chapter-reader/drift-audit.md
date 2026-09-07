# Drift audit — MOB-FEAT-005

- Data: 2026-08-09
- Implementação auditada: working-tree sha256:cb2e5226cae5289175f02ef3243e0e048890a91e89ff1da21764db1ee89ab84e
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

Rodada de performance 2026-09-06: C01 / MOB-PERF-002 corrigido dentro do contrato existente, com testes de regressão. [Evidência](../../../active/performance-evidence/corrections-2026-09-06/review.md). Verificação nativa permanece aberta; nenhuma nova evidência física é atribuída a esta alteração.

Rebase C01/C03/C04 (2026-09-06): checksum global atualizado após correções de numeração do leitor, persistência da validação e limite de resposta. Escopo e validações em [review de performance](../../../active/performance-evidence/corrections-2026-09-06/review.md). Não representa nova verificação física das demais features.

Rodada C02/C05: contratos aprovados e gates abertos preservados; runtime coberto e revisão registrada no [review da rodada](../../../active/performance-evidence/corrections-c02-c05-2026-09-06/review.md). Medição nativa permanece aberta. Contadores da revisão estática: mismatch 0, undocumented 0, arquivos descobertos 0; não substituem validação física.

Rebase C02/C05 (2026-09-06): checksum global atualizado após virtualização do leitor e download de exportação para arquivo. [Escopo e validação](../../../active/performance-evidence/corrections-c02-c05-2026-09-06/review.md). Não representa nova verificação física das demais features.

Consolidação documental (2026-09-06): checksum global atualizado após reconciliar o estado de performance; runtime e verdict preservados. [Registro](../../../active/performance-evidence/consolidation-2026-09-06/review.md). Sem nova validação física.

Preparação de commit (2026-09-06): rebase global após excluir scripts avulsos de ensaio, listagens Git e metadados do sistema dos arquivos versionados, conforme solicitação humana. Resultados históricos preservados; runtime e verdict inalterados.
