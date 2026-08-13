# Review — MOB-FEAT-002

- Spec revisada: `spec.md`
- Implementação/revisão: working-tree sha256:2a9c4a85c0b28420394a6cf36082e65787410c03624e1609fc95423e27d42a37
- Gate na entrada do planejamento: `open`
- Dependências verificadas: `MOB-FEAT-001` (`implemented`)
- Verdict: `approved`

## Findings

Nenhum finding aberto.

Os findings das revisões anteriores foram resolvidos:

1. A composição global está em `src/application`; `src/app` não existe, o Expo Router descobre somente `app/` e o typecheck de typed routes é estável.
2. Root stack, auth stack e Skeleton consomem `decorativeMotionEnabled`; ambos os stacks possuem testes para animação normal e `none`.
3. Profile, not-found, telas e componentes de auth usam tipografia/espaçamento globais; ações de Login, AuthFooter, settings e demais controles inspecionados garantem o alvo mínimo no elemento acionável.
4. A evidência combina `COMFORTABLE` com `fontScale=1.6` no provider e verifica reflow estrutural, ausência de altura fixa, wrapping e alvo mínimo nos controles.
5. Radios e switches anunciam estado selecionado/checked, habilitação e erro traduzido; o erro também permanece em live region/alert com ação de retry.
6. Login, Register, DemoCredentials, SocialRow, as duas navegações, componentes compartilhados e respectivas evidências estão ligados aos `AC-*` corretos em `coverage.json`.

## Critérios e evidências

| Critério | Implementado | Evidência verificada                                                                              | Resultado |
| -------- | ------------ | ------------------------------------------------------------------------------------------------- | --------- |
| AC-001   | sim          | defaults/normalização, resolução de `SYSTEM` e provider sob esquema simulado                      | pass      |
| AC-002   | sim          | mudança do sistema durante a sessão e precedência estável de `LIGHT`/`DARK`                       | pass      |
| AC-003   | sim          | `SettingsGate → RootApplication/AppProviders`, hidratação e espera pelas APIs nativas antes da UI | pass      |
| AC-004   | sim          | matriz normal clara/escura, resolvedor semântico e shared UI sem cores de produto literais        | pass      |
| AC-005   | sim          | matriz tema × contraste, valores mínimos das paletas e combinação manual/sistema                  | pass      |
| AC-006   | sim          | escalas exatas e adoção da tipografia semântica nas rotas e componentes existentes                | pass      |
| AC-007   | sim          | `COMFORTABLE` + font scale nativo, wrapping, crescimento vertical e superfícies roláveis          | pass      |
| AC-008   | sim          | escalas compactas, helper iOS/Android e alvos mínimos nos elementos acionáveis                    | pass      |
| AC-009   | sim          | estado efetivo manual/sistema, Skeleton e root/auth stacks sem movimento quando solicitado        | pass      |
| AC-010   | sim          | `animations=false` interrompe decoração/transições sem remover feedback funcional                 | pass      |
| AC-011   | sim          | semântica de radio/switch, habilitação, erro/hint, retry e paridade trilíngue                     | pass      |
| AC-012   | sim          | preview imediato, persistência/sync delegados, manutenção local, erro e retry                     | pass      |
| AC-013   | sim          | subscriptions de esquema, movimento, contraste e font scale durante a sessão                      | pass      |
| AC-014   | sim          | typecheck, ESLint, Steiger, APIs públicas e ausência de `src/app`/deep imports                    | pass      |

## Cobertura de arquivos e drift

| Indicador                    | Resultado |
| ---------------------------- | --------: |
| `mismatch`                   |         0 |
| `undocumented`               |         0 |
| arquivos runtime descobertos |         0 |

- `coverage.json` classifica individualmente os arquivos runtime e liga implementação/evidência de MOB-FEAT-002 aos critérios correspondentes.
- `pnpm specs:check` confirmou 267 arquivos classificados, sendo 127 de comportamento e 32 de evidência.
- `src/app` foi eliminado; a app layer local usa `src/application`, enquanto `app/` permanece como casca de rotas Expo.
- Steiger não encontrou import invertido, import horizontal ou deep import externo; nenhuma regra nova foi desabilitada.
- O gate foi aberto somente após MOB-FEAT-001 chegar a `implemented`.

## Gates

| Comando                                                           | Resultado                                                  |
| ----------------------------------------------------------------- | ---------------------------------------------------------- |
| `CI=true pnpm specs:check`                                        | pass: 19 artefatos normativos e 267 arquivos classificados |
| `CI=true pnpm typecheck`                                          | pass                                                       |
| `CI=true pnpm lint`                                               | pass                                                       |
| `CI=true pnpm lint:fsd`                                           | pass, zero problemas                                       |
| `CI=true pnpm format:check`                                       | pass                                                       |
| `CI=true pnpm test:ci`                                            | pass: 32 suítes, 121 testes, 0 snapshots                   |
| Jest focado em theme, controles, shared UI e root/auth navigation | pass: 6 suítes, 22 testes, 0 snapshots                     |
| `CI=true pnpm check`                                              | pass end-to-end                                            |

## Mudanças fora da spec

- Nenhuma mudança de produto fora de MOB-FEAT-002 foi identificada na implementação revisada.
- A reorganização da composição global corrige a colisão técnica com Expo Router e preserva as responsabilidades FSD previstas pela spec.
- Alterações concorrentes de MOB-FEAT-003, MOB-FEAT-006 e MOB-FEAT-007 foram excluídas do julgamento funcional; o gate completo confirmou que não causam regressão no snapshot final.

## Conclusão

O gate de entrada estava aberto, MOB-FEAT-001 estava implementada e todos os AC-001–AC-014 possuem implementação e evidência proporcionais ao risco. Cobertura, typed routes, FSD, i18n, tema, acessibilidade, movimento, reflow e gates estão coerentes, com zero drift descoberto. O verdict é `approved`; MOB-FEAT-002 pode seguir para Drift Auditor e, se a auditoria permanecer zero a zero, ser promovida para `implemented`.
