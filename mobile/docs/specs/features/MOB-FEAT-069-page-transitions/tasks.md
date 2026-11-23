# Tasks — MOB-FEAT-069

- Spec: `spec.md`
- Status da spec no planejamento: `approved`
- Gate no planejamento: `open`
- Dependências: nenhuma

## Rastreabilidade

| Critério | Tasks              | Evidência planejada                                                                               |
| -------- | ------------------ | ------------------------------------------------------------------------------------------------- |
| AC-001   | TASK-001, TASK-004 | `transitions.test.ts`: os quatro tipos com animações ligadas e desligadas.                        |
| AC-002   | TASK-002, TASK-004 | `RootNavigator.test.tsx`: tipo de cada rota da raiz e nenhuma animação com movimento desligado.   |
| AC-003   | TASK-003, TASK-004 | `StackLayouts.integration.test.tsx`: Configurações, Auth, Plataforma e abas.                      |
| AC-004   | TASK-001, TASK-002 | `transitions.test.ts`, `RootNavigator.test.tsx` e `StackLayouts.integration.test.tsx`; simulador. |
| AC-005   | TASK-002, TASK-005 | Testes do `useLeaveGuard` e do fluxo seguem verdes; conferência manual no simulador.              |

## Checklist

- [x] TASK-001 — Criar `shared/navigation/transitions.ts` com os quatro tipos, `tabTransition` e `useScreenTransitions`.
- [x] TASK-002 — Declarar no `RootNavigator` o tipo de cada rota da raiz, incluindo `translation-library`, `work` e `translation-reader`.
- [x] TASK-003 — Usar o módulo nas pilhas de Configurações, Auth, Plataforma e leitores, e `fade` nas abas.
- [x] TASK-004 — Escrever os testes da matriz acima e mapear no `coverage.json`.
- [ ] TASK-005 — Conferir no simulador iOS e no Android, temas claro e escuro, com "Reduzir movimento" ligado e desligado.

## Riscos e bloqueios

- `animationDuration` só vale no iOS; no Android a duração é a do sistema.
- O simulador iOS não respondia aos toques na sessão de implementação; TASK-005 fica pendente.
