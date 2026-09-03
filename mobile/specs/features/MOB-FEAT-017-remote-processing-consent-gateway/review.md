# Review — MOB-FEAT-017

- Spec revisada: `spec.md`
- Implementação/revisão: working-tree sha256:38172ac139f24be05ddf591a77830ea02b9586b8729bba5be6c131da60bffe58
- Gate na entrada do planejamento: `open`
- Dependência verificada: `MOB-FEAT-016` executada e `verification-pending`
- Verdict: `verification-pending`

## Findings

Nenhum finding bloqueante permanece no código do gateway ou do slice mobile.
O contrato server-side, quotas, outbox e Terraform foram validados; no mobile,
schema v7, transporte, identidade, consentimento, submissão, recovery,
cancelamento e UI trilíngue possuem testes dirigidos e boundaries FSD verdes.

A feature permanece fail-closed e não pode ser promovida para `implemented` até
existirem operador, contato e URLs legais públicos verdadeiros, configuração
cloud correspondente, scan do AAB e verificação de SQLite/SecureStore/recovery e
leitor de tela em Android físico.

## Critérios e evidências

| Critério | Implementado | Evidência verificada                                                                | Resultado |
| -------- | ------------ | ----------------------------------------------------------------------------------- | --------- |
| AC-001   | parcial      | schema de disclosure e UI completos; dados legais reais indisponíveis fecham o gate | pending   |
| AC-002   | sim          | consent por projeto+versão+locale, recusa neutra e round-trip SQLite                | pass      |
| AC-003   | sim          | testes provam pré-condições e attempt durável antes do transporte de mídia          | pass      |
| AC-004   | sim          | OpenAPI, Zod, HTTPS, timeout, limites, redirect e traversal hostil                  | pass      |
| AC-005   | parcial      | Argon2/sessão opaca no gateway e SecureStore/bearer em memória; AAB aberto          | pending   |
| AC-006   | sim          | chave persistida, duplo toque, timeout, replay e outbox atômica                     | pass      |
| AC-007   | sim          | receipt e attempt/página/projeto transitam atomicamente; rejeição preserva DRAFT    | pass      |
| AC-008   | sim          | SUBMITTING/UNKNOWN persistem e reconciliam por job/chave sem nova identidade        | pass      |
| AC-009   | sim          | cancelamento distingue UNKNOWN, CANCEL_PENDING e confirmação terminal               | pass      |
| AC-010   | parcial      | payload/log allowlist e cleanup testados; política pública/cloud ainda abertos      | pending   |
| AC-011   | parcial      | RNTL trilíngue e sem falso sucesso; leitor de tela Android ainda aberto             | pending   |
| AC-012   | sim          | somente a primeira página é submetida e não há OCR/provider/Core no client          | pass      |

## Gates

| Comando                                        | Resultado                                                              |
| ---------------------------------------------- | ---------------------------------------------------------------------- |
| gateway `./mvnw test`                          | pass — 53 testes                                                       |
| reactor `./mvnw test`                          | pass — 7 módulos                                                       |
| PostgreSQL Testcontainers                      | pass — 8 testes de integração                                          |
| `terraform fmt -check -recursive` / `validate` | pass                                                                   |
| `pnpm typecheck`                               | pass                                                                   |
| testes dirigidos MOB-FEAT-017                  | pass — 8 suítes, 36 testes                                             |
| ESLint dirigido                                | pass                                                                   |
| `pnpm lint:fsd`                                | pass                                                                   |
| suíte mobile completa                          | pass — 95 suítes, 545 testes                                           |
| `pnpm lint` / `pnpm format:check`              | pass                                                                   |
| `pnpm specs:check`                             | pass após remoção do pattern obsoleto e renovação global dos checksums |

## Mudanças fora da spec

Nenhuma mudança funcional intencional fora do gateway e do fluxo remoto mobile.
O worktree contém alterações paralelas preexistentes; elas foram preservadas. A
manutenção global posterior corrigiu o slider e os gates sem ampliar o escopo de
processamento remoto.

## Conclusão

O código planejado está implementado e verificado em ambiente automatizado. O
runtime continua deliberadamente desabilitado/fail-closed, e as quatro
verificações externas acima mantêm o status `verification-pending`.
