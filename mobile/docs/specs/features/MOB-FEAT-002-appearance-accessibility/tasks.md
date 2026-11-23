# Tasks — MOB-FEAT-002

- Spec: `spec.md`
- Status da spec no planejamento: `approved`
- Gate no planejamento: `open`
- Dependências implementadas: `MOB-FEAT-001`

## Rastreabilidade

| Critério | Tasks              | Evidência planejada                                                           |
| -------- | ------------------ | ----------------------------------------------------------------------------- |
| AC-001   | TASK-001, TASK-004 | Resolução de tema em `ThemeProvider.test.tsx`                                 |
| AC-002   | TASK-001, TASK-004 | Mudanças do sistema em `ThemeProvider.test.tsx`                               |
| AC-003   | TASK-004           | Integração do provider com settings já hidratados e espera pelas APIs nativas |
| AC-004   | TASK-001, TASK-004 | Matriz de tokens normal claro/escuro                                          |
| AC-005   | TASK-001, TASK-004 | Matriz de tokens em alto contraste claro/escuro                               |
| AC-006   | TASK-001, TASK-005 | Escalas tipográficas                                                          |
| AC-007   | TASK-001, TASK-005 | Reflow dos componentes compartilhados                                         |
| AC-008   | TASK-001, TASK-005 | Tokens de densidade e alvos mínimos por plataforma                            |
| AC-009   | TASK-002, TASK-005 | Estado efetivo de movimento                                                   |
| AC-010   | TASK-002, TASK-005 | Skeleton sem animação decorativa                                              |
| AC-011   | TASK-003, TASK-006 | Controles traduzidos e acessíveis                                             |
| AC-012   | TASK-003, TASK-006 | Preview, erro e retry                                                         |
| AC-013   | TASK-002, TASK-004 | Subscriptions de esquema, movimento, contraste e font scale                   |
| AC-014   | TASK-007           | `pnpm typecheck`, `pnpm lint:fsd` e APIs públicas                             |

## Checklist

- [x] TASK-001 — Criar escalas semânticas de tipografia/densidade e paletas de alto contraste em `shared/theme`.
- [x] TASK-002 — Resolver movimento, animações e preferências nativas com atualização durante a sessão.
- [x] TASK-003 — Conectar aparência/acessibilidade ao settings store e criar controles nativos acessíveis com i18n trilíngue.
- [x] TASK-004 — Integrar o provider global e cobrir tema, contraste, hidratação e subscriptions.
- [x] TASK-005 — Adaptar componentes compartilhados a tipografia, densidade, alvos mínimos e redução de movimento.
- [x] TASK-006 — Cobrir preview imediato, persistência delegada, erro e retry dos controles.
- [x] TASK-007 — Executar testes focados, typecheck e gate FSD; registrar as evidências.

## Evidências executadas

- Regressão de boot: `ThemeProvider.test.tsx` prova que consultas nativas de acessibilidade que nunca resolvem exibem progresso e liberam a aplicação por fallback finito, sem tela branca permanente.
- Forward-test no Expo Go/iOS 26.5: o estado branco foi reproduzido antes da correção; após reiniciar o bundle, a tela de login foi renderizada normalmente.
- `CI=true pnpm typecheck`: passou sem erros.
- `CI=true pnpm lint:fsd`: passou sem violações.
- `CI=true pnpm check`: specs, TypeScript, ESLint, Steiger, formato e 32 suítes/121 testes passaram, sem snapshots.
- ESLint focado nos arquivos de MOB-FEAT-002: passou sem erros.
- `pnpm lint` e `pnpm format:check` globais aguardam a consolidação dos arquivos concorrentes de MOB-FEAT-007; nenhum erro restante pertence a MOB-FEAT-002.

## Riscos e bloqueios

- As APIs nativas de alto contraste variam por plataforma; falha de detecção deve preservar a preferência manual.
- A rota final das configurações pertence a `MOB-FEAT-008`; estes controles são entregues como API pública componível, sem criar navegação antecipada.
