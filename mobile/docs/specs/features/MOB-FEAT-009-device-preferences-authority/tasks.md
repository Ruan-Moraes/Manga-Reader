# Tasks — MOB-FEAT-009

- Spec: `spec.md`
- Status da spec no planejamento: `approved`
- Gate no planejamento: `open`
- Dependências implementadas: `MOB-FEAT-001`, `MOB-FEAT-002`, `MOB-FEAT-003`, `MOB-FEAT-007`, `MOB-FEAT-008`

## Rastreabilidade

| Critério | Tasks    | Evidência planejada                   |
| -------- | -------- | ------------------------------------- |
| AC-001   | TASK-001 | Testes do envelope                    |
| AC-002   | TASK-002 | Testes do store                       |
| AC-003   | TASK-002 | Testes de autoridade local            |
| AC-004   | TASK-002 | Testes de merge e cliente HTTP        |
| AC-005   | TASK-001 | Testes do contrato de valores         |
| AC-006   | TASK-002 | Testes de concorrência e retry        |
| AC-007   | TASK-003 | Testes de controles e storage offline |

## Checklist

- [x] TASK-001 — Evoluir o envelope local e sua migração preservando o contrato público do modelo.
- [x] TASK-002 — Implementar dirty paths, merge seletivo, persistência, concorrência, retry e logout no store proprietário.
- [x] TASK-003 — Adicionar registro verdadeiro de dados offline e integrar o estado vazio aos controles de dados.
- [x] TASK-004 — Atualizar evidências, coverage e documentação afetada.

## Riscos e bloqueios

- O endpoint exige payload integral; o merge deve ocorrer antes do PATCH e nunca enviar idioma da interface.
