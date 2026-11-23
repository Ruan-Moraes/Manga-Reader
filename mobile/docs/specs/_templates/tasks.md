# Tasks — MOB-FEAT-###

- Spec: `spec.md`
- Status da spec no planejamento: `approved`
- Gate no planejamento: `open`
- Dependências implementadas: listar `blocked_by` ou `nenhuma`

## Rastreabilidade

| Critério | Tasks    | Evidência planejada |
| -------- | -------- | ------------------- |
| AC-001   | TASK-001 | Teste/comando       |

Cada `AC-*` deve ocupar exatamente uma linha; não agrupar critérios na mesma célula.

## Checklist

- [ ] TASK-001 — Implementar alteração mínima derivada do AC-001.
- [ ] TASK-002 — Criar ou atualizar a evidência do AC-001.
- [ ] TASK-003 — Executar gates focados e `pnpm check`.

`implemented` exige todos os checkboxes concluídos. Quando o código estiver pronto, mas uma verificação real ainda estiver aberta, usar `verification-pending` e manter a task correspondente desmarcada.

## Riscos e bloqueios

- Registrar dependências e decisões ainda válidas. Não acrescentar requisitos. Este arquivo não pode existir enquanto `implementation_gate` estiver `blocked`.
