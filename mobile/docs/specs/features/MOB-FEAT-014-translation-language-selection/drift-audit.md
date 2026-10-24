# Drift audit — MOB-FEAT-014

Data: 2026-08-15

- Implementação auditada: working-tree sha256:0197e775ac2875fd2619dc4a8a1a68162b97aa1591d460593588c2932c2d51b2
- Status da feature: `implemented`

## Divergências

Nenhuma divergência normativa. O runtime, schema v6, i18n, cobertura, tasks,
review e registry refletem os sete idiomas e 42 pares aprovados.

## Contadores

- `mismatch`: 0
- `undocumented`: 0
- arquivos runtime descobertos: 0
- caminhos obsoletos: 0
- violações de gate: 0
- verificações abertas: 0

## Escopo auditado

Spec, tasks, registry, coverage, dependência e gate; domínio e repositories de
draft/projeto; migration SQLite v6; controller/hook/UI; i18n pt-BR/en-US/es-ES;
testes de 42 pares, upgrade, FK e rollback; boundaries FSD.

Não houve ampliação para detecção automática, OCR, processamento remoto,
provider, tradução, renderização, biblioteca final, conta ou Core.

Revalidação global de 2026-08-30: checksum da working tree atualizado após a
manutenção dos TODOs de auth/review local. A referência é global por definição
do validador; não representa nova inspeção nativa desta feature.

Rebase documental de performance (2026-09-05): checksum global atualizado pela inclusão da auditoria e da MOB-DEC-007; runtime preservado por comparação SHA-256. Não representa nova verificação física nem alteração de verdict.

Rebase C01/C03/C04 (2026-09-06): checksum global atualizado após correções de numeração do leitor, persistência da validação e limite de resposta. Escopo e validações em review de performance (arquivo externo: `perfomance_app/mobile/docs/active/performance-evidence/corrections-2026-09-06/review.md`). Não representa nova verificação física das demais features.

Rebase C02/C05 (2026-09-06): checksum global atualizado após virtualização do leitor e download de exportação para arquivo. Escopo e validação (arquivo externo: `perfomance_app/mobile/docs/active/performance-evidence/corrections-c02-c05-2026-09-06/review.md`). Não representa nova verificação física das demais features.

Consolidação documental (2026-09-06): checksum global atualizado após reconciliar o estado de performance; runtime e verdict preservados. Registro (arquivo externo: `perfomance_app/mobile/docs/active/performance-evidence/consolidation-2026-09-06/review.md`). Sem nova validação física.

Preparação de commit (2026-09-06): rebase global após excluir scripts avulsos de ensaio, listagens Git e metadados do sistema dos arquivos versionados, conforme solicitação humana. Resultados históricos preservados; runtime e verdict inalterados.

Rebase C06 (2026-09-12): referência global recalculada para a árvore local com recuperação compartilhada. Escopo (arquivo externo: `perfomance_app/mobile/docs/active/performance-evidence/recovery-2026-09-12/review.md`). Não altera verdict nem valida implementações locais de outras tarefas ou medições físicas.
