# Tasks — MOB-FEAT-050

- Spec: `spec.md`
- Status da spec: `verification-pending`
- Gate no planejamento: `open`
- Dependências implementadas: `MOB-FEAT-016`

## Rastreabilidade

| Critério | Tasks    | Evidência planejada                         |
| -------- | -------- | ------------------------------------------- |
| AC-001   | TASK-001 | testes de guard dev/prod e ausência de HTTP |
| AC-002   | TASK-002 | integração de geração multi-page            |
| AC-003   | TASK-003 | repository e fault injection                |
| AC-004   | TASK-004 | RNTL e paridade i18n                        |

## Checklist

- [x] TASK-001 — Criar o guard e o controller local de demonstração.
- [x] TASK-002 — Gerar arquivos e regiões determinísticos por página.
- [x] TASK-003 — Persistir resultados de modo atômico e idempotente.
- [ ] TASK-004 — Validar progresso, avisos e erros em aparelho físico.

## Riscos e bloqueios

- A demonstração não pode ser confundida com capacidade real nem abrir os gates
  de `MOB-FEAT-018..021`.
