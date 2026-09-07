# Tasks — MOB-FEAT-001

- Spec: `spec.md`
- Status da spec no planejamento: `approved`
- Gate no planejamento: `open`
- Dependências implementadas: nenhuma

## Rastreabilidade

| Critério | Tasks                        | Evidência planejada                                 |
| -------- | ---------------------------- | --------------------------------------------------- |
| AC-001   | TASK-001, TASK-005           | Unitários de normalização, versão e migração        |
| AC-002   | TASK-002, TASK-006           | Storage inválido e integração do gate de hidratação |
| AC-003   | TASK-002, TASK-003, TASK-005 | Store guest sem chamadas HTTP                       |
| AC-004   | TASK-003, TASK-006           | Integração login → hidratação Core                  |
| AC-005   | TASK-003, TASK-005           | Fake timers e inspeção do PATCH integral            |
| AC-006   | TASK-003, TASK-005           | Respostas fora de ordem por versão                  |
| AC-007   | TASK-003, TASK-005           | Falha, pending e retry                              |
| AC-008   | TASK-003, TASK-006           | Flush na desmontagem controlada                     |
| AC-009   | TASK-003, TASK-006           | Logout/troca de conta com resposta tardia           |
| AC-010   | TASK-002, TASK-006           | Retorno ao perfil guest persistido                  |
| AC-011   | TASK-003, TASK-005           | Transições `local/syncing/synced/error`             |
| AC-012   | TASK-001, TASK-004, TASK-005 | Teste do payload sem idioma/contentLocales/privacy  |

## Checklist

- [x] TASK-001 — Criar entity `user-settings` com tipos, defaults, normalização versionada e query GET, expondo somente API pública.
- [x] TASK-002 — Criar adaptador JSON seguro em `shared` e migrar as preferências locais atuais para envelope guest versionado sem bloquear o bootstrap em falha.
- [x] TASK-003 — Criar feature `manage-settings` com store local-first, PATCH integral, debounce 400 ms, versionamento, pending, retry, flush e isolamento de identidade.
- [x] TASK-004 — Integrar selectors/actions da feature ao tema e aos gates em `app`/`application`, removendo a store de negócio de `shared` sem inverter dependências FSD.
- [x] TASK-005 — Adicionar testes unitários da entity/store/API cobrindo normalização, guest, concorrência, falha, retry, payload e estados de sync.
- [x] TASK-006 — Adicionar testes dos gates/transições de sessão, atualizar `coverage.json` por arquivo e preservar as evidências dos baselines substituídos.
- [x] TASK-007 — Rodar `pnpm specs:check`, `typecheck`, `lint`, `lint:fsd`, `format:check`, `test:ci` e `pnpm check`; registrar resultados e preparar review.

## Evidências executadas

- `CI=true pnpm check`: pass.
- `specs:check`: 19 artefatos normativos e 211 arquivos classificados.
- `lint:fsd`: zero problemas, sem desabilitar regras adicionais.
- Jest: 14 suítes, 44 testes, zero snapshots.

## Ordem de execução

`shared` → `entities/user-setting` → `features/manage-settings` → `application` → evidências/coverage → gates.

## Riscos e bloqueios

- A sessão hidratada pode não possuir `user`; a identidade técnica deve continuar isolada sem persistir projeção privada da conta.
- SecureStore pode falhar ou conter as chaves legadas `mr_theme_override`/`mr_language`; migração só remove/ignora a origem após envelope válido.
- Requests antigos e timers devem ser invalidados em logout/troca de conta.
- Idioma da interface continua local e não entra no payload `/users/me/settings`.
