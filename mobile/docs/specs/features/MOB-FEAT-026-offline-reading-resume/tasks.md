# Tasks — MOB-FEAT-026

- Spec: `spec.md`
- Status da spec: `verification-pending`
- Gate no planejamento: `open`
- Dependências implementadas: `MOB-FEAT-025`

## Rastreabilidade

| Critério | Tasks    | Evidência planejada                    |
| -------- | -------- | -------------------------------------- |
| AC-001   | TASK-001 | RNTL do leitor local                   |
| AC-002   | TASK-002 | SQLite e integração de restart         |
| AC-003   | TASK-003 | guest/offline e integridade de arquivo |
| AC-004   | TASK-004 | i18n, acessibilidade e gates           |

## Checklist

- [x] TASK-001 — Implementar leitor, alternância e fallback textual.
- [x] TASK-002 — Persistir e restaurar posição local válida.
- [x] TASK-003 — Validar arquivos e operação guest/offline automaticamente.
- [ ] TASK-004 — Validar retomada, i18n e acessibilidade em aparelho físico.

## Riscos e bloqueios

- A verificação física do usuário permanece necessária para conclusão.
