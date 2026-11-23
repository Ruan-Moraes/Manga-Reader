# Tasks — MOB-FEAT-010

- Spec: `spec.md`
- Status da spec no planejamento: `approved`
- Gate no planejamento: `open`
- Dependências implementadas na entrada: `MOB-FEAT-009`

## Rastreabilidade

| Critério | Tasks    | Evidência planejada                |
| -------- | -------- | ---------------------------------- |
| AC-001   | TASK-001 | Testes de rota inicial e gates     |
| AC-002   | TASK-002 | RNTL do seletor público            |
| AC-003   | TASK-002 | RNTL da entrada de plataforma      |
| AC-004   | TASK-003 | Integração auth/status/tabs        |
| AC-005   | TASK-001 | Testes de rotas públicas/privadas  |
| AC-006   | TASK-004 | Testes de navegação e persistência |
| AC-007   | TASK-003 | Integração de retorno seguro       |
| AC-008   | TASK-002 | RNTL do shell offline              |

## Checklist

- [x] TASK-001 — Atualizar rotas, allowlists, gates e hidratação sem frame vazio.
- [x] TASK-002 — Criar launcher e shell offline por APIs públicas FSD.
- [x] TASK-003 — Criar status autenticado e bloquear as tabs futuras.
- [x] TASK-004 — Integrar login/cadastro, back, deep links, i18n e acessibilidade.
- [x] TASK-005 — Atualizar evidências, coverage, baselines e documentação.

## Riscos e bloqueios

- As tabs atuais resolvem `/` por causa do route group e precisam ser realocadas antes de adicionar o launcher.
