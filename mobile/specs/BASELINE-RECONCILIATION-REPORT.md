# Reconciliação completa — código mobile versus Baseline Specs

Data: 2026-08-08

## Resultado

O código em `mobile/` foi tratado como fonte real. Cada arquivo de `app/` e `src/` está individualmente ligado a uma observação em `coverage.json`; arquivos de suporte estão classificados como evidência, infraestrutura, recurso ou governança.

| Indicador                    | Resultado |
| ---------------------------- | --------: |
| Baselines observados         |         9 |
| Verdicts `match`             |        55 |
| Verdicts `mismatch`          |         0 |
| Verdicts `undocumented`      |         0 |
| Arquivos runtime descobertos |         0 |

## MOB-BASE-001 — Fundação e bootstrap

| Observação | Evidência reconciliada              | Verdict | Correção documental                                      |
| ---------- | ----------------------------------- | ------- | -------------------------------------------------------- |
| OBS-001    | `app/_layout.tsx`                   | `match` | —                                                        |
| OBS-002    | `SettingsGate.tsx`, fontes e splash | `match` | —                                                        |
| OBS-003    | `AppProviders.tsx`                  | `match` | —                                                        |
| OBS-004    | `QueryProvider.tsx`                 | `match` | —                                                        |
| OBS-005    | barrels, ESLint e Steiger           | `match` | —                                                        |
| OBS-006    | `app.json`                          | `match` | Metadados e plugins antes implícitos foram documentados. |
| OBS-007    | `app/+html.tsx`, configuração web   | `match` | Shell web antes sem baseline foi documentado.            |
| OBS-008    | Babel, Metro, CSS e TypeScript      | `match` | Contratos de build/resolução foram incorporados.         |

## MOB-BASE-002 — Tema

| Observação | Evidência reconciliada                          | Verdict | Correção documental |
| ---------- | ----------------------------------------------- | ------- | ------------------- |
| OBS-001    | `ThemeProvider.tsx` e teste focado              | `match` | —                   |
| OBS-002    | `tokens.ts`, `fonts.ts` e typecheck             | `match` | —                   |
| OBS-003    | `settingsStore.ts` e teste de persistência      | `match` | —                   |
| OBS-004    | `ThemeProvider.tsx`, `AppProviders.tsx` e teste | `match` | —                   |

## MOB-BASE-003 — Internacionalização

| Observação | Evidência reconciliada              | Verdict | Correção documental |
| ---------- | ----------------------------------- | ------- | ------------------- |
| OBS-001    | inicialização i18n e seis catálogos | `match` | —                   |
| OBS-002    | teste de paridade de chaves         | `match` | —                   |
| OBS-003    | settings store e testes             | `match` | —                   |
| OBS-004    | `SettingsGate.tsx`                  | `match` | —                   |
| OBS-005    | interceptor Axios e testes          | `match` | —                   |

## MOB-BASE-004 — Autenticação

| Observação | Evidência reconciliada                  | Verdict | Correção documental                                           |
| ---------- | --------------------------------------- | ------- | ------------------------------------------------------------- |
| OBS-001    | LoginPage, auth service e session store | `match` | —                                                             |
| OBS-002    | RegisterPage e validações locais        | `match` | —                                                             |
| OBS-003    | ForgotPage e endpoint correspondente    | `match` | —                                                             |
| OBS-004    | auth service, modelos e testes          | `match` | —                                                             |
| OBS-005    | logout remoto e teste                   | `match` | —                                                             |
| OBS-006    | SocialRow e DemoCredentials             | `match` | —                                                             |
| OBS-007    | `src/features/auth/ui`                  | `match` | Toolkit visual e medidor antes implícitos foram documentados. |

## MOB-BASE-005 — Sessão e tokens

| Observação | Evidência reconciliada                    | Verdict | Correção documental |
| ---------- | ----------------------------------------- | ------- | ------------------- |
| OBS-001    | token storage e teste do store            | `match` | —                   |
| OBS-002    | hidratação do session store e teste       | `match` | —                   |
| OBS-003    | login/logout local e testes               | `match` | —                   |
| OBS-004    | interceptor de request e teste            | `match` | —                   |
| OBS-005    | refresh single-flight e teste concorrente | `match` | —                   |
| OBS-006    | authExpired, interceptor e SessionGate    | `match` | —                   |

## MOB-BASE-006 — Navegação

| Observação | Evidência reconciliada               | Verdict | Correção documental |
| ---------- | ------------------------------------ | ------- | ------------------- |
| OBS-001    | RootNavigator e root stack           | `match` | —                   |
| OBS-002    | layout do grupo auth                 | `match` | —                   |
| OBS-003    | layout das tabs                      | `match` | —                   |
| OBS-004    | teste de redirect visitante          | `match` | —                   |
| OBS-005    | teste de redirect autenticado        | `match` | —                   |
| OBS-006    | teste de bloqueio durante hidratação | `match` | —                   |

## MOB-BASE-007 — Shared UI

| Observação | Evidência reconciliada           | Verdict | Correção documental                             |
| ---------- | -------------------------------- | ------- | ----------------------------------------------- |
| OBS-001    | `Avatar.tsx`                     | `match` | Capacidade antes sem baseline foi documentada.  |
| OBS-002    | `Button.tsx` e teste de loading  | `match` | Capacidade antes sem baseline foi documentada.  |
| OBS-003    | `Card.tsx`, `EmptyState.tsx`     | `match` | Capacidade antes sem baseline foi documentada.  |
| OBS-004    | `Input.tsx` e teste de erro/blur | `match` | Capacidade antes sem baseline foi documentada.  |
| OBS-005    | `PageContainer.tsx`              | `match` | Capacidade antes sem baseline foi documentada.  |
| OBS-006    | `Skeleton.tsx`                   | `match` | Capacidade antes sem baseline foi documentada.  |
| OBS-007    | barrel `shared/ui`               | `match` | API pública antes sem baseline foi documentada. |

## MOB-BASE-008 — Superfícies do shell

| Observação | Evidência reconciliada                | Verdict | Correção documental                            |
| ---------- | ------------------------------------- | ------- | ---------------------------------------------- |
| OBS-001    | pages Home, Library e Forum           | `match` | Inventário informal virou baseline mínimo.     |
| OBS-002    | ProfilePage                           | `match` | Superfície mínima e logout foram documentados. |
| OBS-003    | ModalPage                             | `match` | Placeholder ganhou baseline mínimo.            |
| OBS-004    | NotFoundPage                          | `match` | Utilitário de navegação foi documentado.       |
| OBS-005    | wrappers em `app/` e barrels de pages | `match` | Fronteira route→page foi explicitada.          |

## MOB-BASE-009 — Contratos e utilitários

| Observação | Evidência reconciliada               | Verdict | Correção documental                                       |
| ---------- | ------------------------------------ | ------- | --------------------------------------------------------- |
| OBS-001    | `useDebounce.ts` e testes com timers | `match` | Hook antes sem baseline/evidência foi documentado.        |
| OBS-002    | `routes.ts`                          | `match` | Constantes atuais foram documentadas sem criar roadmap.   |
| OBS-003    | `query-keys.ts`                      | `match` | Exports não consumidos foram separados de features reais. |
| OBS-004    | `demo.ts` e consumidor `__DEV__`     | `match` | Contrato demo foi documentado.                            |
| OBS-005    | `model/api.ts`                       | `match` | Envelope e paginação foram documentados.                  |
| OBS-006    | `model/auth.ts` e consumidores       | `match` | Tipos compartilhados foram reconciliados.                 |
| OBS-007    | barrels de constant, hook e model    | `match` | APIs públicas foram documentadas.                         |

## Áreas deliberadamente sem Target Spec

- catálogo, busca, detalhes e leitor;
- biblioteca persistida e sincronizada;
- fórum, tópicos e comentários;
- perfil completo, notificações e cache offline;
- reset password mobile, login social, newsletter e termos funcionais.

Essas ausências não são `undocumented`: não existe código de comportamento correspondente. Chaves, textos, protótipos ou constantes isoladas permanecem inventário observado, não intenção aprovada.

## Critério para próximas mudanças

Uma nova Target Spec pode entrar no ciclo somente com `pnpm specs:check` verde. Durante a implementação aprovada, cada arquivo novo precisa de entrada individual ligada ao `AC-*`; comportamento brownfield encontrado sem contrato retorna ao Reverse Spec.
