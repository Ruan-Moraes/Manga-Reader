# Tasks — MOB-FEAT-029

- Spec: `spec.md`
- Status no planejamento: `implemented`
- Gate: `open`

## Rastreabilidade

| Critério | Tasks    | Evidência planejada              |
| -------- | -------- | -------------------------------- |
| AC-001   | TASK-001 | testes do botão compartilhado    |
| AC-002   | TASK-002 | testes do cabeçalho flexível     |
| AC-003   | TASK-003 | matriz de rotas e retornos       |
| AC-004   | TASK-004 | busca de duplicações antigas     |
| AC-005   | TASK-005 | safe area e teclado no Simulator |
| AC-006   | TASK-006 | auditoria tela a tela            |
| AC-007   | TASK-007 | estados visuais e assistivos     |
| AC-008   | TASK-008 | dimensões, temas e font scale    |
| AC-009   | TASK-009 | regressão funcional              |
| AC-010   | TASK-010 | gates e evidência persistida     |

## Checklist

- [x] TASK-001 — Implementar BackButton público com estados e variantes.
- [x] TASK-002 — Implementar NavigationHeader sem placeholders laterais.
- [x] TASK-003 — Mapear rotas internas, histórico e fallbacks seguros.
- [x] TASK-004 — Migrar e remover implementações duplicadas de retorno.
- [x] TASK-005 — Corrigir safe areas, teclado e conteúdo extenso.
- [x] TASK-006 — Corrigir refinamentos encontrados em todas as superfícies.
- [x] TASK-007 — Validar estados de conteúdo e interação.
- [x] TASK-008 — Executar matriz responsiva, temas e font scale.
- [x] TASK-009 — Executar suítes de regressão funcional.
- [x] TASK-010 — Executar gates, review e drift audit.

## Riscos e bloqueios

- Estados autenticados dependem da sessão/API disponível; quando não forem
  reproduzíveis, testes existentes e estados controlados serão usados como
  evidência complementar, sem fabricar evidência manual.
- Rotas futuras bloqueadas não serão expostas apenas para auditoria.
