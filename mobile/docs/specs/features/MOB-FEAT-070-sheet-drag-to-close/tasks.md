# Tasks — MOB-FEAT-070

- Spec: `spec.md`
- Status da spec no planejamento: `approved`
- Gate no planejamento: `open`
- Dependências: nenhuma

## Rastreabilidade

| Critério | Tasks              | Evidência planejada                                                                                  |
| -------- | ------------------ | ---------------------------------------------------------------------------------------------------- |
| AC-001   | TASK-002, TASK-004 | `bottomSheetDrag.test.tsx`: arrasto além de 30% chama `onClose` uma vez.                             |
| AC-002   | TASK-002, TASK-004 | `bottomSheetDrag.test.tsx`: arrasto curto e lento volta à posição aberta sem `onClose`.              |
| AC-003   | TASK-002, TASK-004 | `bottomSheetDrag.test.tsx`: puxão rápido curto chama `onClose`.                                      |
| AC-004   | TASK-002, TASK-004 | `bottomSheetDrag.test.tsx`: o detector envolve só a alça e o cabeçalho; conferência manual na régua. |
| AC-005   | TASK-001, TASK-004 | `bottomSheetDrag.test.tsx` e `motionScale.test.tsx`: movimento reduzido sem animação ao soltar.      |
| AC-006   | TASK-001, TASK-003 | Testes existentes do `BottomSheet`, `ActionSheet` e da folha encadeada seguem verdes.                |

## Checklist

- [x] TASK-001 — Migrar entrada e saída do `BottomSheet` para Reanimated, mantendo medição de altura, tempos, curvas e `onClosed`.
- [x] TASK-002 — Gesto de arrastar na alça e no cabeçalho (`Gesture.Pan`), com limite de 30%, velocidade de 800 pt/s, resistência para cima e volta em `motion.base`; fechar o teclado ao fechar.
- [x] TASK-003 — Envolver o conteúdo do Modal em `GestureHandlerRootView` (Android) e ajustar os mocks locais de Reanimated e gesture-handler dos testes.
- [x] TASK-004 — Escrever os testes da matriz acima e mapear no `coverage.json`.
- [ ] TASK-005 — Conferir no simulador iOS e no Android, temas claro e escuro, com "Reduzir movimento" ligado e desligado, numa folha curta, numa com rolagem e numa com teclado.

## Riscos e bloqueios

- O gesto começa só na alça e no cabeçalho; o X fica no cabeçalho, então o gesto só ativa depois de 8 pt de deslocamento vertical para não roubar o toque.
- Os mocks locais de Reanimated e gesture-handler (`sharedUi`, `designKitControls`, `LocalMediaReviewPanel`) passaram a cobrir o que a folha usa, e o detector mockado ignora o arrasto da folha. O `jest.setup.ts` agora carrega o setup do gesture-handler.
- TASK-005 depende do aparelho: o gesto não pode ser conferido nos testes de componente além da lógica.
