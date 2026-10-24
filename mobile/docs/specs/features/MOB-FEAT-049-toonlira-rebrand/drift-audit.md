# Drift audit — MOB-FEAT-049

- Data: 2026-09-08
- Implementação auditada: working-tree sha256:0197e775ac2875fd2619dc4a8a1a68162b97aa1591d460593588c2932c2d51b2
- Status da feature: `verification-pending`

## Escopo auditado

- Fonte central, artefato mobile, manifesto, persistência, locales, testes de
  geração, auditoria de ocorrências e coverage.

## Divergências

| Severidade | Evidência      | Classificação        | Ação           |
| ---------- | -------------- | -------------------- | -------------- |
| baixa      | `format:check` | dívida de formatação | revisão manual |

## Contadores derivados

- `mismatch`: 0 funcional; 1 de formatação.
- `undocumented`: 0
- arquivos runtime descobertos: 0
- caminhos obsoletos: 0
- violações de gate funcional: 0

## Pendências de verificação

- TASK-004 — sanear `format:check` sem rewrite automático de JSX.

Rebase C06 (2026-09-12): referência global recalculada para a árvore local com recuperação compartilhada. Escopo (arquivo externo: `perfomance_app/mobile/docs/active/performance-evidence/recovery-2026-09-12/review.md`). Não altera verdict nem valida implementações locais de outras tarefas ou medições físicas.
