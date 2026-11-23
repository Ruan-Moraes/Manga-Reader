# Tasks — MOB-FEAT-011

- Spec: `spec.md`
- Status da spec no planejamento: `approved`
- Gate no planejamento: `open`
- Dependências implementadas: `MOB-FEAT-002`, `MOB-FEAT-003`, `MOB-FEAT-005`, `MOB-FEAT-008`, `MOB-FEAT-010`

## Rastreabilidade

| Critério | Tasks                        | Evidência planejada                                                       |
| -------- | ---------------------------- | ------------------------------------------------------------------------- |
| AC-001   | TASK-001, TASK-002           | Testes de tokens e paletas                                                |
| AC-002   | TASK-001, TASK-002           | Testes do resolvedor tema × contraste                                     |
| AC-003   | TASK-001, TASK-002           | Testes das escalas de layout e raio                                       |
| AC-004   | TASK-001, TASK-002           | Testes de tipografia e ThemeProvider                                      |
| AC-005   | TASK-003, TASK-004           | React Native Testing Library para Button e migração auth                  |
| AC-006   | TASK-003, TASK-004           | React Native Testing Library para Input e migração auth                   |
| AC-007   | TASK-003, TASK-005           | Testes de ChoiceGroup, SwitchRow, ListRow e consumidores                  |
| AC-008   | TASK-004, TASK-005, TASK-006 | Testes existentes das features/pages e revisão de equivalência            |
| AC-009   | TASK-004, TASK-005, TASK-006 | Testes de regressão dos fluxos preservados                                |
| AC-010   | TASK-003, TASK-006, TASK-008 | Testes de reflow/alvos mínimos e inspeção dirigida no simulador           |
| AC-011   | TASK-007                     | Typecheck, lint FSD, barrels e specs:check                                |
| AC-012   | TASK-008                     | Fonte/diff histórico, capturas finais, checklist e declaração de ausência |

## Checklist

- [x] TASK-001 — Introduzir em `shared/theme` as paletas editoriais, escalas de raio, layout e estilos tipográficos semânticos, preservando alto contraste e preferências existentes.
- [x] TASK-002 — Atualizar testes de tema para cobrir paletas, contraste, densidade, tipografia e métricas mínimas de interação.
- [x] TASK-003 — Evoluir a API pública de `shared/ui` com AppText, Button, Input, Card, Section, ListRow, ChoiceGroup, SwitchRow, PageContainer e ScreenScaffold consistentes e testados.
- [x] TASK-004 — Migrar autenticação para as primitivas compartilhadas, remover wrappers duplicados e preservar validação, i18n, acessibilidade e fluxo.
- [x] TASK-005 — Migrar features e widgets consumidores na ordem FSD, mantendo semântica, estados e APIs públicas.
- [x] TASK-006 — Migrar todas as pages e wrappers de rota existentes, preservando comportamento e aplicando o sistema editorial a estados normais, vazios, loading e erro.
- [x] TASK-007 — Atualizar barrels e `coverage.json`, executar specs:check, typecheck, lint FSD, testes focados e `pnpm check`, corrigindo somente regressões da feature.
- [x] TASK-008 — Auditar no simulador iOS a matriz visual prevista no AC-012; registrar fonte/diff histórico, capturas finais, checklist manual e a inexistência das capturas originais anteriores; entregar a implementação ao Reviewer.

## Riscos e bloqueios

- O worktree já contém mudanças mobile aprovadas de MOB-FEAT-001 a MOB-FEAT-010; preservar integralmente mudanças alheias e editar apenas consumidores necessários ao redesign.
- Alterar a API de `ThemeContext` e `shared/ui` afeta muitos consumidores; concluir e validar `shared` antes de migrar camadas superiores.
- A preferência de densidade não pode reduzir alvos abaixo de 44 pontos no iOS ou 48 dp no Android.
- O `pnpm` pode tentar reconciliar `node_modules` neste sandbox; quando isso ocorrer, executar os binários locais equivalentes sem modificar dependências e registrar a limitação no review.

## Evidência de execução

- `pnpm check`: pass; 63 suítes, 262 testes, zero snapshots.
- Simulador: iPhone 17, iOS 26.5; launcher, login, cadastro, recuperação, estado conectado, configurações, leitor e matriz de aparência inspecionados.
- Capturas finais: `evidence/`.
