# Drift audit — MOB-FEAT-046

- Data: 2026-09-06
- Implementação auditada: working-tree sha256:cb2e5226cae5289175f02ef3243e0e048890a91e89ff1da21764db1ee89ab84e
- Status da feature: `implemented`

## Escopo auditado

- Manifesto, lockfile, módulos Expo, adaptações RN 0.86, testes, bundles iOS e
  Android, execução no Simulator, no emulador e em Android físico, coverage,
  registry e toolchain.

## Divergências

| Severidade | Evidência                       | Classificação        | Ação                  |
| ---------- | ------------------------------- | -------------------- | --------------------- |
| baixa      | peer `tsconfck` declara TS `^5` | limitação de tooling | monitorar atualização |

## Contadores derivados

- `mismatch`: 0 no comportamento iOS e Android emulado; nenhum desvio foi
  reportado no Android físico.
- `undocumented`: 0 no escopo auditado.
- arquivos runtime descobertos: 0.
- caminhos obsoletos: 0 nesta etapa.
- violações de gate da feature: 0.

## Pendências de verificação

- Nenhuma. TASK-004 foi concluída com ateste de Ruan Moraes em 2026-09-06.

Rebase documental de performance (2026-09-05): checksum global atualizado pela inclusão da auditoria e da MOB-DEC-007; runtime preservado por comparação SHA-256. Não representa nova verificação física nem alteração de verdict.

Rebase C01/C03/C04 (2026-09-06): checksum global atualizado após correções de numeração do leitor, persistência da validação e limite de resposta. Escopo e validações em [review de performance](../../../active/performance-evidence/corrections-2026-09-06/review.md). Não representa nova verificação física das demais features.

Rebase C02/C05 (2026-09-06): checksum global atualizado após virtualização do leitor e download de exportação para arquivo. [Escopo e validação](../../../active/performance-evidence/corrections-c02-c05-2026-09-06/review.md). Não representa nova verificação física das demais features.

Consolidação documental (2026-09-06): checksum global atualizado após reconciliar o estado de performance; runtime e verdict preservados. [Registro](../../../active/performance-evidence/consolidation-2026-09-06/review.md). Sem nova validação física.

Preparação de commit (2026-09-06): rebase global após excluir scripts avulsos de ensaio, listagens Git e metadados do sistema dos arquivos versionados, conforme solicitação humana. Resultados históricos preservados; runtime e verdict inalterados.
