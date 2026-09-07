# Drift audit — MOB-FEAT-045

- Data: 2026-08-31
- Implementação auditada: working-tree sha256:cb2e5226cae5289175f02ef3243e0e048890a91e89ff1da21764db1ee89ab84e
- Status da feature: `verification-pending`

## Escopo auditado

- Spec, tasks, código de repository/controller/UI/page, testes, locales,
  coverage, registry, evidências e dependências MOB-FEAT-015/043.

## Divergências

| Severidade | Evidência | Classificação             | Ação    |
| ---------- | --------- | ------------------------- | ------- |
| —          | —         | sem divergência conhecida | nenhuma |

## Contadores derivados

- `mismatch`: 0 no escopo MOB-FEAT-045.
- `undocumented`: 0 no escopo MOB-FEAT-045.
- arquivos runtime descobertos: 0.
- caminhos obsoletos: 0.
- violações de gate da feature: 0.

## Pendências de verificação

- TASK-005: executar estado de erro e substituição no picker real, tema escuro,
  fonte ampliada e VoiceOver/TalkBack.
- O `specs:check` global permanece bloqueado por 21 checksums de outras features
  na working tree compartilhada; os 23 testes dos validadores passam.

## Refinamento auditado em 2026-09-01

O componente compartilhado está mapeado a `AC-002` e `AC-005`; detalhes e ações
continuam no slice de Validação, sem acoplamento horizontal ou mudança de
persistência. TASK-006 foi concluída. O gate SDD mantém 23 testes verdes e lista
22 checksums divergentes no snapshot compartilhado; a pendência funcional real
continua exclusivamente em TASK-005.

Rebase documental de performance (2026-09-05): checksum global atualizado pela inclusão da auditoria e da MOB-DEC-007; runtime preservado por comparação SHA-256. Não representa nova verificação física nem alteração de verdict.

Rebase C01/C03/C04 (2026-09-06): checksum global atualizado após correções de numeração do leitor, persistência da validação e limite de resposta. Escopo e validações em [review de performance](../../../active/performance-evidence/corrections-2026-09-06/review.md). Não representa nova verificação física das demais features.

Rebase C02/C05 (2026-09-06): checksum global atualizado após virtualização do leitor e download de exportação para arquivo. [Escopo e validação](../../../active/performance-evidence/corrections-c02-c05-2026-09-06/review.md). Não representa nova verificação física das demais features.

Consolidação documental (2026-09-06): checksum global atualizado após reconciliar o estado de performance; runtime e verdict preservados. [Registro](../../../active/performance-evidence/consolidation-2026-09-06/review.md). Sem nova validação física.

Preparação de commit (2026-09-06): rebase global após excluir scripts avulsos de ensaio, listagens Git e metadados do sistema dos arquivos versionados, conforme solicitação humana. Resultados históricos preservados; runtime e verdict inalterados.
