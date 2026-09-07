# Reconciliação corrente — código mobile versus Baseline Specs

Data: 2026-08-09

## Resultado

Somente baselines com status `observed` participam desta fotografia. Baselines superseded permanecem no histórico normativo, mas não geram seções nem mappings comportamentais correntes. Os contadores abaixo são derivados das seis seções atuais.

| Indicador                    | Resultado |
| ---------------------------- | --------: |
| Baselines observados         |         6 |
| Verdicts `match`             |        39 |
| Verdicts `mismatch`          |         0 |
| Verdicts `undocumented`      |         0 |
| Arquivos runtime descobertos |         0 |

## MOB-BASE-001 — Fundação e bootstrap

| Observação | Evidência reconciliada                                       | Verdict | Correção documental                                     |
| ---------- | ------------------------------------------------------------ | ------- | ------------------------------------------------------- |
| OBS-001    | `src/app/_layout.tsx`; `src/application/RootApplication.tsx` | `match` | Ordem efetiva corrigida para providers antes dos gates. |
| OBS-002    | `src/application/gates/SettingsGate.tsx`; fontes e splash    | `match` | —                                                       |
| OBS-003    | `src/application/providers`; gates de conta                  | `match` | Composição global retirada de widgets.                  |
| OBS-004    | `src/application/providers/QueryProvider.tsx`                | `match` | —                                                       |
| OBS-005    | barrels, Steiger e validador FSD local                       | `match` | `src/application` agora possui cobertura explícita.     |
| OBS-006    | `app.json`                                                   | `match` | —                                                       |
| OBS-007    | `src/app/+html.tsx`; configuração web                        | `match` | —                                                       |
| OBS-008    | Babel, Metro, CSS e TypeScript                               | `match` | —                                                       |

## MOB-BASE-004 — Autenticação

| Observação | Evidência reconciliada                             | Verdict | Correção documental                                         |
| ---------- | -------------------------------------------------- | ------- | ----------------------------------------------------------- |
| OBS-001    | LoginPage; `features/authenticate`; SessionGate    | `match` | Retorno atual usa allowlist e `/platform/status`, não tabs. |
| OBS-002    | RegisterPage; `features/authenticate`; SessionGate | `match` | Retorno seguro alinhado ao login.                           |
| OBS-003    | ForgotPage; API de recuperação                     | `match` | —                                                           |
| OBS-004    | `features/authenticate/api`; `entities/user`       | `match` | Tipos separados por responsabilidade.                       |
| OBS-005    | ação `signOut`; teste da API                       | `match` | Saída local é garantida pela feature.                       |
| OBS-006    | SocialRow; DemoCredentials                         | `match` | —                                                           |
| OBS-007    | `features/authenticate/ui`; primitives `shared/ui` | `match` | Wrappers antigos removidos da API atual.                    |

## MOB-BASE-005 — Sessão e tokens

| Observação | Evidência reconciliada                                   | Verdict | Correção documental                       |
| ---------- | -------------------------------------------------------- | ------- | ----------------------------------------- |
| OBS-001    | token storage; teste de `entities/session`               | `match` | —                                         |
| OBS-002    | restauração em `features/authenticate`; entity de sessão | `match` | Sessão não reside mais em shared.         |
| OBS-003    | transições de sessão; ações sign-in/sign-up/sign-out     | `match` | Escritas controladas pela feature.        |
| OBS-004    | interceptor de request e teste                           | `match` | —                                         |
| OBS-005    | refresh single-flight e teste concorrente                | `match` | —                                         |
| OBS-006    | authExpired; interceptor; SessionGate                    | `match` | Expiração usa ação local de authenticate. |

## MOB-BASE-006 — Navegação

| Observação | Evidência reconciliada              | Verdict | Correção documental                          |
| ---------- | ----------------------------------- | ------- | -------------------------------------------- |
| OBS-001    | RootNavigator; launcher; root stack | `match` | —                                            |
| OBS-002    | layout auth e tema efetivo          | `match` | —                                            |
| OBS-003    | tabs sob `/platform`; Profile       | `match` | —                                            |
| OBS-004    | matriz de rotas públicas/privadas   | `match` | Rotas técnicas vivem em `shared/navigation`. |
| OBS-005    | allowlist e status autenticado      | `match` | —                                            |
| OBS-006    | feedback durante hidratação         | `match` | —                                            |

## MOB-BASE-008 — Superfícies do shell

| Observação | Evidência reconciliada                      | Verdict | Correção documental                                           |
| ---------- | ------------------------------------------- | ------- | ------------------------------------------------------------- |
| OBS-001    | pages Home, Library e Forum; leitor público | `match` | Placeholders continuam bloqueados; leitor é uma rota própria. |
| OBS-002    | ProfilePage; settings                       | `match` | —                                                             |
| OBS-003    | ModalPage                                   | `match` | —                                                             |
| OBS-004    | NotFoundPage                                | `match` | —                                                             |
| OBS-005    | wrappers Expo Router e barrels de pages     | `match` | Root global pertence a `src/application`.                     |

## MOB-BASE-009 — Contratos e utilitários

| Observação | Evidência reconciliada                             | Verdict | Correção documental                          |
| ---------- | -------------------------------------------------- | ------- | -------------------------------------------- |
| OBS-001    | `useDebounce.ts`; testes com timers                | `match` | —                                            |
| OBS-002    | `shared/navigation`; testes de allowlist           | `match` | Rotas atuais e parsers seguros documentados. |
| OBS-003    | factories em chapter/progress; scopes nas features | `match` | Registry global removido.                    |
| OBS-004    | configuração interna de `features/authenticate`    | `match` | Credenciais demo retiradas de shared.        |
| OBS-005    | `shared/model/api.ts`                              | `match` | —                                            |
| OBS-006    | `entities/user`; `entities/session`; authenticate  | `match` | Modelos de negócio retirados de shared.      |
| OBS-007    | barrels de navigation, hook e model                | `match` | —                                            |

## Áreas deliberadamente sem Target Spec

- catálogo, busca e detalhes;
- biblioteca persistida e sincronizada;
- fórum, tópicos e comentários;
- perfil completo, notificações e armazenamento de capítulos offline;
- reset password mobile, login social, newsletter e termos funcionais.

Essas ausências não são `undocumented`: não existe código de comportamento correspondente. Chaves, textos, protótipos ou superfícies bloqueadas não criam intenção aprovada.

## Critério para próximas mudanças

Uma nova Target Spec entra no ciclo somente com `pnpm specs:check` verde. Cada arquivo novo recebe mapping individual, cada AC recebe evidência classificada e qualquer review de working tree usa o checksum reproduzível exigido por `MOB-DEC-003`.
