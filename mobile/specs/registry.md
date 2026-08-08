# Registry SDD — Mobile

Todo baseline, Target Spec e decisão deve estar nesta tabela. Caminhos são relativos a `mobile/specs/`.

| ID           | Tipo     | Nome                                    | Status   | Arquivo                                   | Código relacionado                                                                                                             | Supersedes | Superseded by |
| ------------ | -------- | --------------------------------------- | -------- | ----------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------- | ------------- |
| MOB-BASE-001 | baseline | Fundação e bootstrap                    | observed | baseline/MOB-BASE-001-foundation.md       | `app/_layout.tsx`; `src/application`; `steiger.config.ts`                                                                      | —          | —             |
| MOB-BASE-002 | baseline | Tema                                    | observed | baseline/MOB-BASE-002-theme.md            | `src/shared/theme`; `src/shared/store/settingsStore.ts`                                                                        | —          | —             |
| MOB-BASE-003 | baseline | Internacionalização e idioma            | observed | baseline/MOB-BASE-003-i18n.md             | `src/shared/i18n`; `src/application/gates/SettingsGate.tsx`; `src/shared/api/apiClient.ts`                                     | —          | —             |
| MOB-BASE-004 | baseline | Fluxos de autenticação e Core           | observed | baseline/MOB-BASE-004-auth-flows.md       | `src/features/auth`; `src/pages/login`; `src/pages/register`; `src/pages/forgot`                                               | —          | —             |
| MOB-BASE-005 | baseline | Sessão e tokens                         | observed | baseline/MOB-BASE-005-session-tokens.md   | `src/shared/api`; `src/shared/store/sessionStore.ts`                                                                           | —          | —             |
| MOB-BASE-006 | baseline | Navegação e controle de acesso          | observed | baseline/MOB-BASE-006-navigation.md       | `app`; `src/application/navigation`; `src/application/gates/SessionGate.tsx`                                                   | —          | —             |
| MOB-BASE-007 | baseline | Componentes compartilhados de interface | observed | baseline/MOB-BASE-007-shared-ui.md        | `src/shared/ui`                                                                                                                | —          | —             |
| MOB-BASE-008 | baseline | Superfícies do shell e placeholders     | observed | baseline/MOB-BASE-008-shell-surfaces.md   | `app`; `src/pages/home`; `src/pages/library`; `src/pages/forum`; `src/pages/profile`; `src/pages/modal`; `src/pages/not-found` | —          | —             |
| MOB-BASE-009 | baseline | Contratos, constantes e hooks           | observed | baseline/MOB-BASE-009-shared-contracts.md | `src/shared/constant`; `src/shared/hook`; `src/shared/model`                                                                   | —          | —             |
| MOB-DEC-001  | decision | SDD brownfield e aprovação humana       | accepted | decisions/MOB-DEC-001-brownfield-sdd.md   | `AGENTS.md`; `specs/`                                                                                                          | —          | —             |
| MOB-DEC-002  | decision | Evidência automatizada baseada em risco | accepted | decisions/MOB-DEC-002-test-evidence.md    | `package.json`; `jest.config.js`; `scripts/validate-specs.mjs`                                                                 | —          | —             |

## Inventários informativos

- [Placeholders e superfícies incompletas](baseline/placeholder-inventory.md)
- [Conflitos baseline versus target](baseline-vs-target-audit.md)
- [Mapa exaustivo código → contrato](coverage.json)
- [Reconciliação baseline versus código](BASELINE-RECONCILIATION-REPORT.md)
