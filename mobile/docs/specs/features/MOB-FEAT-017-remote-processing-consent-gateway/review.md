# Review — MOB-FEAT-017

- Spec revisada: `spec.md`
- Implementação/revisão: working-tree sha256:0197e775ac2875fd2619dc4a8a1a68162b97aa1591d460593588c2932c2d51b2
- Gate na entrada do planejamento: `open`
- Dependência verificada: `MOB-FEAT-016` implementada
- Verdict: `verification-pending`

## Findings

Parcela posterior de [purge por objeto](../MOB-FEAT-020-visual-translation-rendering/evidence/cleanup-isolation-2026-10-09.md):
falha individual reproduzida e corrigida sem ocultar limpeza incompleta. Outros
objetos elegíveis são tratados; bucket/prefixo/fonte reutilizável permanecem
protegidos. Testes locais/GCS mockado/worker conferidos, sem cloud ou mudança
de prazo. TASK-017 e verdict/status/gates continuam conservados.

Parcela posterior de [resultado com prazo imutável](../MOB-FEAT-020-visual-translation-rendering/evidence/result-retention-snapshot-2026-10-09.md):
política publicada agora acompanha job/deadline do resultado; replay e aumento
de configuração não renovam o limite aceito. V9 e guards/consulta/purge
conferidos no PostgreSQL e worker local, sem mudança mobile/cloud ou uploads.
TASK-017 permanece aberta para auditoria integral/operacional e legado;
verdict/status/020/021 preservados, sem aprovar execução linguística ou legal.

Parcela posterior de [snapshot de retenção original](../MOB-FEAT-020-visual-translation-rendering/evidence/original-retention-snapshot-2026-10-09.md):
prazo publicado agora é persistido na primeira reserva e aplicado aos guards
worker e purge, sem renovação por replay. Foco 264/zero failures/errors/skips,
incluindo 12 casos PostgreSQL; defaults cloud/mobile inalterados.
A lacuna abreviada da fotografia anterior foi tratada, mas TASK-017 permanece
aberta para auditoria integral/operacional e backfill legado quando aplicável.
Verdict/estado/020/021 preservados; não habilita uploads.

Incremento de 2026-10-09 UTC na integração da 020:
[reserva ambígua e original](../MOB-FEAT-020-visual-translation-rendering/evidence/submission-original-ownership-2026-10-09.md).
Descarte após confirmação perdida foi reproduzido e corrigido com lock/snapshot
independentes e posse exata, sem repetir reserva/quota/task. Foco final 69 aprovado;
fonte/JAR novos registrados na evidência, separados da auditoria histórica.
AC-006/008/010 recebem essa parcela técnica; não amplia conclusão linguística,
legal ou operacional. TASK-017 permanece aberta, inclusive para a lacuna
funcional de prazo original menor publicado mas não aplicado. A 020 permanece
in-progress e a 021 bloqueada; nenhum upload real foi habilitado.

Incremento de 2026-10-04, auditado no gate aberto da 020:
[posse/locks do dispatch](../MOB-FEAT-020-visual-translation-rendering/evidence/dispatch-ownership-2026-10-04.md).
Falha/conclusão antigas alteravam job/lease sem posse da outbox; inversão de
locks observada e recuperação podia criar nona task. Bugs corrigidos com
regressões PostgreSQL/adapter falso e arquivos locais, sem alteração da spec,
schema, task/HTTP ou defaults. AC-006/009/010 recebem evidência técnica desta
parcela; TASK-017 e verificações integrais/nativas/legais permanecem abertas.

Parcela incremental de 2026-10-03: consulta/cancelamento agora vinculam o
receipt à versão persistida e à referência conhecida antes de mutação local.
Allowlist aceita os erros sanitizados OCR/tradução já previstos no OpenAPI;
não há conteúdo bruto, novo erro local ou alteração de schema. Regressões e
gates próprios na [evidência dos receipts da 019](../MOB-FEAT-019-contextual-language-pair-translation/evidence/translation-job-receipts-2026-10-03.md).
Verdict e verificações legais/nativas/operacionais permanecem abertos.

Não há finding bloqueante novo no contrato de localização do gateway ou do slice
mobile. O contrato server-side, quotas, outbox e Terraform foram validados em
rodadas anteriores; no mobile,
schema v7, transporte, identidade, consentimento, submissão, recovery,
cancelamento e UI trilíngue possuem testes dirigidos e boundaries FSD verdes.

A feature permanece fail-closed. Operador e contato reais foram definidos;
Termos e Privacidade operacionais 1.0 estão publicados nas URLs Firebase e o
disclosure `2026-09-07.v1` registra a política do provider. Após a decisão de
usar tradução global, esses textos não comprovam o disclosure de localização
requerido. O contrato e o consentimento foram reconciliados em 2026-10-02; a
promoção para `implemented` ainda exige revisão/republicação legal, nova
versão aprovada do disclosure, aprovação final do operador, configuração cloud e worker
correspondentes, scan do AAB e leitor de tela em Android físico.

## Critérios e evidências

| Critério | Implementado | Evidência verificada                                                              | Resultado |
| -------- | ------------ | --------------------------------------------------------------------------------- | --------- |
| AC-001   | parcial      | publicação antiga não cobre tradução global; nova versão e aprovação pendentes    | pending   |
| AC-002   | sim          | consent por projeto+versão+locale, recusa neutra e round-trip SQLite              | pass      |
| AC-003   | sim          | testes provam pré-condições e attempt durável antes do transporte de mídia        | pass      |
| AC-004   | sim          | contrato OpenAPI/Zod separa OCR `us` e tradução `global`; formato legado recusado | pass      |
| AC-005   | parcial      | Argon2/sessão opaca no gateway e SecureStore/bearer em memória; AAB aberto        | pending   |
| AC-006   | sim          | chave persistida, duplo toque, timeout, replay e outbox atômica                   | pass      |
| AC-007   | sim          | receipt e attempt/página/projeto transitam atomicamente; rejeição preserva DRAFT  | pass      |
| AC-008   | sim          | SUBMITTING/UNKNOWN persistem e reconciliam por job/chave sem nova identidade      | pass      |
| AC-009   | sim          | cancelamento distingue UNKNOWN, CANCEL_PENDING e confirmação terminal             | pass      |
| AC-010   | parcial      | cleanup existe; retenção até render, cloud e política atualizada ainda abertos    | pending   |
| AC-011   | parcial      | copy trilíngue de localização testada; leitor de tela Android ainda aberto        | pending   |
| AC-012   | sim          | somente a primeira página é submetida e não há OCR/provider/Core no client        | pass      |

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

Revisão de escopo de 2026-09-27: Ruan retirou a exigência de tradução nos EUA.
Este review conserva os resultados históricos dos testes, mas não certifica o
novo disclosure ou o contrato de região. `GetCapabilitiesUseCase`, OpenAPI,
parser mobile e textos legais publicados ainda representam a geografia
anterior; AC-001 e a verificação atual de AC-004 ficam pendentes de atualização
e novos testes antes de qualquer ativação. Não houve mudança de runtime nesta
revisão documental.

Continuação de 2026-10-02: TASK-016 atualizou capabilities, OpenAPI, parser e
copy trilíngue para distinguir OCR regional `us` de tradução global. Os testes
focalizados validaram o formato novo e a rejeição do legado antes de qualquer
upload. A versão `2026-09-07.v1` agora falha fechada no gateway; o exemplo
Terraform mantém versão vazia. Os resultados históricos acima não representam
testes desta rodada. TASK-001, TASK-017 e validações nativas/operacionais seguem
abertas; nenhuma política web foi republicada.

Gates desta continuação: 23 testes Java focalizados, suíte leve do gateway,
26 testes mobile dirigidos, `pnpm check` (109 suítes/679 testes), type-check web,
SDD/links, `terraform fmt -check`, `terraform validate` local e
`git diff --check` passaram. A suíte global Maven não passou por um teste
Mongo/Testcontainers da Core sem Docker acessível; o sandbox também impediu
bind gRPC local, resolvido para a suíte leve com execução sem essa restrição.
Nenhum teste real/pago de provider foi executado. O checksum SDD compartilhado
foi renovado para a árvore local; isso não revalida as demais features cujas
reviews recebem a mesma referência.

Rebase documental de performance (2026-09-05): checksum global atualizado pela inclusão da auditoria e da MOB-DEC-007; runtime preservado por comparação SHA-256. Não representa nova verificação física nem alteração de verdict.

Rodada de performance 2026-09-06: C04 / MOB-PERF-004 corrigido dentro do contrato existente, com testes de regressão. Evidência (arquivo externo: `perfomance_app/mobile/docs/active/performance-evidence/corrections-2026-09-06/review.md`). Verificação nativa permanece aberta; nenhuma nova evidência física é atribuída a esta alteração.

Rebase C01/C03/C04 (2026-09-06): checksum global atualizado após correções de numeração do leitor, persistência da validação e limite de resposta. Escopo e validações em review de performance (arquivo externo: `perfomance_app/mobile/docs/active/performance-evidence/corrections-2026-09-06/review.md`). Não representa nova verificação física das demais features.

Rebase C02/C05 (2026-09-06): checksum global atualizado após virtualização do leitor e download de exportação para arquivo. Escopo e validação (arquivo externo: `perfomance_app/mobile/docs/active/performance-evidence/corrections-c02-c05-2026-09-06/review.md`). Não representa nova verificação física das demais features.

Consolidação documental (2026-09-06): checksum global atualizado após reconciliar o estado de performance; runtime e verdict preservados. Registro (arquivo externo: `perfomance_app/mobile/docs/active/performance-evidence/consolidation-2026-09-06/review.md`). Sem nova validação física.

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

C06 (2026-09-12): AC-003/006/008 preservados por testes de reconcile compartilhado, idempotência e cancelamento isolado. Evidências (arquivo externo: `perfomance_app/mobile/docs/active/performance-evidence/recovery-2026-09-12/review.md`). TASK-014 aberta; verdict e gates externos mantidos, sem nova validação nativa.

Referência anterior à C06: commit c55a22aaaebeeba279a0e535730b8ee246a9b30e; resultados históricos não são reatribuídos à correção atual.

Rebase C06 (2026-09-12): referência global recalculada para a árvore local com recuperação compartilhada. Escopo (arquivo externo: `perfomance_app/mobile/docs/active/performance-evidence/recovery-2026-09-12/review.md`). Não altera verdict nem valida implementações locais de outras tarefas ou medições físicas.

Validação C06: 108 suítes / 670 testes passaram; tipos, lint, FSD e specs verdes. O pnpm check completo permanece bloqueado por formatação da árvore local (50 arquivos no check registrado). Nenhum ganho nativo alegado.

## Multipart e recuperação controlada — 2026-09-13

TASK-015 corrige divergência do código ao contrato AC-004/006: expo/fetch 57
rejeitava o descritor uri antes do POST. Regressão compara multipart com conversor
real instalado. AC-003 continua exigindo consentimento; não houve mudança de
requisitos, identidade ou gates. Evidência e limites (arquivo externo: `perfomance_app/mobile/docs/active/performance-evidence/https-recovery-2026-09-13/review.md`).
TASK-014 e verdict verification-pending permanecem pelos cenários residuais.

Validação final da continuação (2026-09-13): pnpm check integral verde,
109 suítes / 674 testes; quinze rodadas HTTPS no Android emulado passaram.
Esse resultado atualiza o estado dos checks locais, mantendo as limitações
nativas/externas e o verdict verification-pending.
