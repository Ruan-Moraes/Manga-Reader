# Tasks — MOB-FEAT-007

- Spec: `spec.md`
- Status da spec no planejamento: `approved`
- Gate no planejamento: `open`
- Dependências implementadas: `MOB-FEAT-001`

## Rastreabilidade

| Critério | Tasks              | Evidência planejada                                       |
| -------- | ------------------ | --------------------------------------------------------- |
| AC-001   | TASK-001, TASK-003 | Limpeza de queries/imagens/temporários e dados protegidos |
| AC-002   | TASK-003, TASK-004 | Cancelamento e descritores localizáveis de confirmação    |
| AC-003   | TASK-001, TASK-002 | GET autenticado e compartilhamento de JSON datado         |
| AC-004   | TASK-001, TASK-004 | Remoção de temporário em sucesso, cancelamento e falha    |
| AC-005   | TASK-002, TASK-003 | DELETE e invalidação seletiva sem reading-progress        |
| AC-006   | TASK-003, TASK-004 | Guest sem requests privados; cache local disponível       |
| AC-007   | TASK-001, TASK-004 | Capability retorna ausência em plataforma não suportada   |
| AC-008   | TASK-003, TASK-004 | Busy, erro recuperável e retry sem duplicidade            |

## Checklist

- [x] TASK-001 — Criar adaptadores shared de cache, arquivo temporário, compartilhamento e medição condicional.
- [x] TASK-002 — Criar contratos da entity user para exportação e limpeza do histórico.
- [x] TASK-003 — Criar feature de ações com confirmação explícita, bloqueio concorrente, autenticação e invalidação seletiva.
- [x] TASK-004 — Cobrir riscos com testes sem snapshots e mapear todos os arquivos em `coverage.json`.
- [x] TASK-005 — Executar gates e preparar review independente.

## Evidência de gate

- `CI=true pnpm check`: specs, TypeScript, ESLint, Steiger, formato e 37 suítes/142 testes passaram, sem snapshots.

## Ordem de execução

`shared` → `entities/user` → `features/data-controls` → evidências/coverage → gates.
