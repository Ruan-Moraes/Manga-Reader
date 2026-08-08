# Relatório de migração SDD — Mobile

> Atualização de paridade: a reconciliação completa posterior está em [BASELINE-RECONCILIATION-REPORT.md](BASELINE-RECONCILIATION-REPORT.md), com nove baselines, mapa arquivo→contrato e zero gaps de runtime.

- Data: 2026-08-08
- Escopo: `mobile/`
- Tipo: migração brownfield de processo e evidência

## Resultado

O mobile passou a separar comportamento observado (`OBS-*`) de intenção futura (`AC-*`). Novas features exigem Target Spec humanamente aprovada, tasks rastreáveis, implementação com evidências, review e auditoria de drift. Nenhuma funcionalidade do roadmap foi implementada.

## Arquivos criados

- `AGENTS.md` com guardrails e workflow obrigatório.
- `specs/README.md`, `specs/registry.md` e cinco templates em `specs/_templates/`.
- Nove Baseline Specs `MOB-BASE-001` a `MOB-BASE-009`.
- Decisões `MOB-DEC-001` e `MOB-DEC-002`.
- `specs/baseline-vs-target-audit.md` e `specs/baseline/placeholder-inventory.md`.
- Sete skills em `.agents/skills/`, cada uma com `SKILL.md` e `agents/openai.yaml`.
- `specs/coverage.json`, scripts de validação, `jest.config.js` e `jest.setup.ts`.
- Nove suítes de teste co-localizadas com foundation, auth, API, hooks, UI e gates.

`specs/features/` contém somente `.gitkeep`: não foi criada Target Spec de roadmap.

## Arquivos alterados

- `README.md` passou a ser referência técnica e aponta para os contratos SDD.
- `docs/auth-design-reference/README.md` deixou de declarar o README como fonte comportamental exclusiva.
- `package.json` e `pnpm-lock.yaml` receberam scripts e dependências de teste.
- `src/shared/api/index.ts` passou a expor `notifyAuthExpired` pela API pública do segmento para evidência do gate de sessão.

Nenhum arquivo de `api/` ou `web/` foi alterado por esta migração.

## Baselines capturados

| ID           | Capacidade                                  | Evidência principal                         |
| ------------ | ------------------------------------------- | ------------------------------------------- |
| MOB-BASE-001 | bootstrap, providers, settings, Query e FSD | inspeção + lint/typecheck                   |
| MOB-BASE-002 | tema, tokens e override                     | testes de provider/store                    |
| MOB-BASE-003 | idiomas, namespaces e header                | testes i18n/store/API                       |
| MOB-BASE-004 | login, cadastro, forgot e contrato Core     | testes de auth service + inspeção de pages  |
| MOB-BASE-005 | SecureStore, sessão, refresh e expiração    | testes de store/API/gate                    |
| MOB-BASE-006 | rotas, tabs e redirects                     | testes do SessionGate + inventário de rotas |
| MOB-BASE-007 | componentes compartilhados de UI            | inspeção + testes de Button/Input           |
| MOB-BASE-008 | shell, profile, modal e placeholders        | inspeção de pages e wrappers                |
| MOB-BASE-009 | hooks, constantes e contratos               | inspeção + testes de debounce               |

Os testes preservam fotografias substituíveis; eles não promovem login obrigatório ou dependência da Core a Target.

## Código com baseline mínimo e áreas inexistentes

- Home, Library, Forum, Profile, modal e not-found possuem observações mínimas em `MOB-BASE-008`, sem requisitos futuros inferidos.
- Query keys, hooks, modelos e barrels possuem inventário normativo em `MOB-BASE-009`, sem serem convertidos em features.
- Componentes compartilhados possuem contratos observados em `MOB-BASE-007`, sem congelar um design system futuro.
- Assets e protótipos estão classificados no manifesto; arquivos isolados não se tornam comportamento de produto.
- Nenhum comportamento de catálogo, importação, reader, biblioteca real, publicação ou sincronização foi definido.

## Conflitos encontrados

- Login obrigatório versus experiência principal futura sem autenticação obrigatória.
- Dependência atual da Core versus direção mobile-first independente.
- Tokens hidratados sem reidratação do usuário.
- Checkbox de sessão, newsletter, termos e login social sem efeito completo.
- Reenvio de forgot que reinicia somente o cooldown.
- Confirmação de senha vazia aceita pelo fluxo observado.
- Strings de reset password sem rota/tela.
- `application/**` fora do gate Steiger e responsabilidades de auth em `shared` como dívida FSD registrada.

Nenhum conflito foi resolvido nesta migração.

## Decisões tomadas

- Baselines usam `OBS-*`; Target Specs usam `AC-*`.
- Somente uma pessoa promove `draft` para `approved`.
- Task Planner e Executor recusam specs não aprovadas.
- Jest/`jest-expo` + RNTL evidenciam riscos centrais, sem threshold percentual ou snapshots.
- `specs:check` valida metadados, registry, estrutura, reconciliação e mapa exaustivo arquivo→contrato.
- `lint:fsd` continua obrigatório e usa polling para evitar `EMFILE` no ambiente atual.

## Gates adicionados ou alterados

- `pnpm specs:check`: validador Node sem dependências.
- `pnpm test` e `pnpm test:ci`: Jest com preset Expo.
- `pnpm check`: specs, typecheck, ESLint, FSD, Prettier e testes.
- Dependências compatíveis com Expo 54/React 19.1: Jest 29.7, `jest-expo` 54, RNTL 13.3 e React Test Renderer 19.1.

## Validação realizada

- `pnpm check` passou integralmente após a migração.
- 11 artefatos normativos registrados e validados.
- 184 arquivos classificados, incluindo 88 arquivos de comportamento e 9 de evidência.
- 7 skills aprovadas por `quick_validate.py`.
- 9 suítes, 27 testes, 0 snapshots.
- Forward-test do Spec Architect interrompeu corretamente diante de decisões de produto ausentes e manteve a spec `draft`.
- Forward-test de Reviewer/Drift Auditor identificou código divergente, task falsamente concluída e evidência ausente.
- Forward-test de Reverse Spec separou observação, desconhecido e conflito sem criar Target; nuances de snapshot de token e falha de storage foram incorporadas ao baseline.

## Riscos

- Baselines envelhecem se mudanças ignorarem o workflow; executar Drift Auditor periodicamente.
- Testes Jest não substituem validação em dispositivo de permissões, storage nativo, deep links ou publicação.
- A exceção FSD de `application/**` permanece e deve ser tratada por uma futura decisão/spec, não por refactor oportunista.
- A matriz RNTL 13/renderer 19.1 deve ser reavaliada junto de um upgrade do Expo/React.

## Próximos passos

Para iniciar “importação de imagens locais” ou outra feature:

1. invocar `sdd-spec-architect` e responder às decisões de produto;
2. criar a Target Spec `draft` no diretório de features e registrá-la;
3. obter aprovação humana explícita;
4. gerar tasks com rastreabilidade completa;
5. executar, testar, revisar e auditar drift;
6. atualizar supersession para os `OBS-*` realmente substituídos.
