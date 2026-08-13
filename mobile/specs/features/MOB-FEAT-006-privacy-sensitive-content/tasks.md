# Tasks — MOB-FEAT-006

- Spec: `spec.md`
- Status da spec no planejamento: `approved`
- Gate no planejamento: `open`
- Dependências implementadas: `MOB-FEAT-001`

## Rastreabilidade

| Critério | Tasks    | Evidência planejada                                 |
| -------- | -------- | --------------------------------------------------- |
| AC-001   | TASK-001 | Testes dos enums, opções e normalização estrita     |
| AC-002   | TASK-002 | Teste HTTP do PATCH parcial e resposta normalizada  |
| AC-003   | TASK-003 | Teste da entrada confirmada em DNT                  |
| AC-004   | TASK-003 | Teste de bloqueio de analytics durante DNT          |
| AC-005   | TASK-003 | Teste da saída de DNT sem opt-in implícito          |
| AC-006   | TASK-004 | Testes da política BLUR/HIDE/SHOW e revelação local |
| AC-007   | TASK-005 | Testes de rollback e retry                          |
| AC-008   | TASK-005 | Testes das query keys invalidadas                   |
| AC-009   | TASK-006 | Teste de troca/logout e resposta tardia             |

## Checklist

- [x] TASK-001 — Criar `entities/user` com contratos, opções e normalização estrita, sem defaults graváveis antes da hidratação.
- [x] TASK-002 — Criar API pública da mutação parcial `PATCH /users/me/privacy`.
- [x] TASK-003 — Criar a feature `update-privacy` com confirmação de DNT e invariantes de analytics.
- [x] TASK-004 — Criar política reutilizável de conteúdo adulto para BLUR, HIDE e SHOW.
- [x] TASK-005 — Implementar estado confirmado/otimista, rollback, retry e invalidação direcionada via TanStack Query.
- [x] TASK-006 — Isolar o estado privado por `identityEpoch` e limpar estado/cache na troca de sessão.
- [x] TASK-007 — Executar testes focados, typecheck, lint e FSD.

## Evidência de gate

- `CI=true pnpm check`: specs, TypeScript, ESLint, Steiger, formato e 32 suítes/121 testes passaram, sem snapshots.

## Arquivos prováveis

- `src/entities/user/{model,lib,index.ts}`
- `src/features/update-privacy/{api,model,index.ts}`
- `src/application/gates/PrivacyAccountGate.tsx`
- `app/_layout.tsx`

## Riscos e bloqueios

- Uma resposta desconhecida da Core deve permanecer erro observável, nunca virar `BLUR` ou outro default silencioso.
- Falha de invalidação após PATCH confirmado não pode provocar rollback.
- Não criar tela ou navegação antes da spec correspondente; a confirmação é exposta como contrato injetável para a futura UI.
