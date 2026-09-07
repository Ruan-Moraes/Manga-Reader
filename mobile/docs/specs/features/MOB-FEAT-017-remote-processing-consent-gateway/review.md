# Review — MOB-FEAT-017

- Spec revisada: `spec.md`
- Implementação/revisão: working-tree sha256:cb2e5226cae5289175f02ef3243e0e048890a91e89ff1da21764db1ee89ab84e
- Gate na entrada do planejamento: `open`
- Dependência verificada: `MOB-FEAT-016` implementada
- Verdict: `verification-pending`

## Findings

Nenhum finding bloqueante permanece no código do gateway ou do slice mobile.
O contrato server-side, quotas, outbox e Terraform foram validados; no mobile,
schema v7, transporte, identidade, consentimento, submissão, recovery,
cancelamento e UI trilíngue possuem testes dirigidos e boundaries FSD verdes.

A feature permanece fail-closed. Operador e contato reais foram definidos;
Termos e Privacidade operacionais 1.0 estão publicados nas URLs Firebase e o
disclosure `2026-09-07.v1` registra a política do provider. A promoção para
`implemented` ainda exige aprovação final do operador, configuração cloud e
worker correspondentes, scan do AAB e verificação de leitor de tela em Android
físico.

## Critérios e evidências

| Critério | Implementado | Evidência verificada                                                                  | Resultado |
| -------- | ------------ | ------------------------------------------------------------------------------------- | --------- |
| AC-001   | parcial      | operador/contato, publicação, versão e policy completos; aprovação final pendente     | pending   |
| AC-002   | sim          | consent por projeto+versão+locale, recusa neutra e round-trip SQLite                  | pass      |
| AC-003   | sim          | testes provam pré-condições e attempt durável antes do transporte de mídia            | pass      |
| AC-004   | sim          | OpenAPI, Zod, HTTPS, timeout, limites, redirect e traversal hostil                    | pass      |
| AC-005   | parcial      | Argon2/sessão opaca no gateway e SecureStore/bearer em memória; AAB aberto            | pending   |
| AC-006   | sim          | chave persistida, duplo toque, timeout, replay e outbox atômica                       | pass      |
| AC-007   | sim          | receipt e attempt/página/projeto transitam atomicamente; rejeição preserva DRAFT      | pass      |
| AC-008   | sim          | SUBMITTING/UNKNOWN persistem e reconciliam por job/chave sem nova identidade          | pass      |
| AC-009   | sim          | cancelamento distingue UNKNOWN, CANCEL_PENDING e confirmação terminal                 | pass      |
| AC-010   | parcial      | payload/log allowlist, cleanup e política pública completos; cloud ainda aberto       | pending   |
| AC-011   | parcial      | RNTL trilíngue e sem falso sucesso; leitor de tela Android ainda aberto               | pending   |
| AC-012   | sim          | somente a primeira página é submetida e não há OCR/provider/Core no client            | pass      |

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

Rebase documental de performance (2026-09-05): checksum global atualizado pela inclusão da auditoria e da MOB-DEC-007; runtime preservado por comparação SHA-256. Não representa nova verificação física nem alteração de verdict.

Rodada de performance 2026-09-06: C04 / MOB-PERF-004 corrigido dentro do contrato existente, com testes de regressão. [Evidência](../../../active/performance-evidence/corrections-2026-09-06/review.md). Verificação nativa permanece aberta; nenhuma nova evidência física é atribuída a esta alteração.

Rebase C01/C03/C04 (2026-09-06): checksum global atualizado após correções de numeração do leitor, persistência da validação e limite de resposta. Escopo e validações em [review de performance](../../../active/performance-evidence/corrections-2026-09-06/review.md). Não representa nova verificação física das demais features.

Rebase C02/C05 (2026-09-06): checksum global atualizado após virtualização do leitor e download de exportação para arquivo. [Escopo e validação](../../../active/performance-evidence/corrections-c02-c05-2026-09-06/review.md). Não representa nova verificação física das demais features.

Consolidação documental (2026-09-06): checksum global atualizado após reconciliar o estado de performance; runtime e verdict preservados. [Registro](../../../active/performance-evidence/consolidation-2026-09-06/review.md). Sem nova validação física.

Preparação de commit (2026-09-06): rebase global após excluir scripts avulsos de ensaio, listagens Git e metadados do sistema dos arquivos versionados, conforme solicitação humana. Resultados históricos preservados; runtime e verdict inalterados.

## Continuação — 2026-09-06

A dependência `MOB-FEAT-016` foi promovida para `implemented`. A auditoria dos
slices confirmou a ordem FSD `shared → entities → features → widgets → pages →
application`, APIs públicas e ausência de deep imports externos. As URLs legais
reservadas responderam com falha de handshake TLS e ainda não constituem
publicação HTTPS válida. O verdict permanece `verification-pending` pelos gates
externos e nativos já registrados.

## Continuação — 2026-09-07

Termos e Privacidade 1.0 foram atualizados nos três locales e publicados em
`toonlira-rm.firebaseapp.com`. O disclosure `2026-09-07.v1` e a política de
treinamento do Cloud Vision/Cloud Translation foram registrados no exemplo de
Terraform. Testes legais, TypeScript, formatação e validação Terraform passaram.
A publicação e a verificação pública estão registradas em
[`evidence/legal-publication-2026-09-07.md`](evidence/legal-publication-2026-09-07.md).
O runtime continua desabilitado: o projeto Cloud está ativo, porém sem billing,
e o worker pertence a `MOB-FEAT-018..020`, ainda não implementadas. A auditoria
está em
[`evidence/cloud-deployment-audit-2026-09-07.md`](evidence/cloud-deployment-audit-2026-09-07.md).
