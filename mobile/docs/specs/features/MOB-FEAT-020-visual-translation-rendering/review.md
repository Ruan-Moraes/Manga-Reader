# Review — MOB-FEAT-020, candidata6 e limites correntes

- Spec revisada: spec.md, direção humana de 2026-11-01.
- Implementação/revisão: working-tree sha256:751f485409b07f18d689b9d6ab37b2b133be8503c09c2e2ca570a8c5ac7bf1d3
- Referência consolidada com coverage e validação documental; somente os headers de checksum das demais reviews foram reconciliados, com recibo local.
- Gate corrente: open; dependência019 verification-pending antes do plano.
- Data da atualização: 2026-11-03.
- Verdict: changes-requested.

| Critério | Evidência conferida                                                                                                                                          | Resultado e limite                                          |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------- |
| AC-001   | Matriz c6: oito cenários/22 renders e visual c6: 8699904 pixels, hash do original e ausência de conteúdo no servidor.                                        | pass local nas fixtures                                     |
| AC-002   | Nove WebPs c6 byte-idênticos aos c5 inspecionados, sete destinos/fontes/licenças.                                                                            | pass nas amostras, sem generalização de qualidade           |
| AC-003   | Overflow integral 4860 caracteres; reader021 técnico revalidado.                                                                                             | ciclo no aplicativo ainda sem prova                         |
| AC-004   | Vazio c6 integralmente equivalente, sem chamada de tradução.                                                                                                 | pass local                                                  |
| AC-005   | HTTP c6: 12 OCR/11 traduções/12 recibos, limites/hash/vínculos e restart real, zero conteúdo/arquivos/jobs legados;021takeonce/commit.                       | técnico local comprovado; nativo/ativação separados         |
| AC-006   | C6 corrigiu pipe com worker plataforma; SIGSTOP/deadline de 90s/ASfault/recovery, PIDs/CPU/AS/swap e página seguinte passaram. C5 HTTP11 permanece negativo. | pass no cenário ARM local; alvo AMD64/COS125 não comprovado |

O [audit c6](evidence/volatile-candidate-6-completion-audit-2026-11-03.md) e a
[prova do gateway](../../../../../api/apps/translation-gateway/docs/volatile-runtime-candidate-6-verification-2026-11-03.md)
registram artefatos e limites. A raiz backend7 passou 2863 testes, zero falhas/
erros, 116 skips e 470 XMLs novos; não é admissão operacional. Mobile 128 suites/
1016 testes e revisão independente021 não comprovam ciclo físico/Simulador iOS.

TASK-004 concluída para a prova local c6 e sua rastreabilidade; TASK-005/006/007
permanecem abertas. A rejeição automática de nova rodada cloud impede executá-la
por inferência da autorização histórica; não houve retry/criação. O Simulador
existente foi enumerado, mas tentativas DeviceHub/CUA deram timeout, sem prova
do app. Nenhum implemented, aprovação pública, benchmark humano ou admissão
AMD64 foi concedido. As specs019–021 continuam coerentes com o requisito volátil.

Gates da consolidação em 2026-11-03: `pnpm specs:check`, rodada11, exit0,
26 testes dos validadores, 67 artefatos normativos, 991 arquivos classificados,
373 de comportamento e 279 de evidência; links válidos. Formatação dos documentos
alterados e `git diff --check` passaram. O rebase alterou somente os headers de
checksum de 65 reviews/audits, preservando seus corpos e verdicts; recibo local
`mobile-checksum-rebase-20261103T095026116089Z/receipt.json`.

Gate completo final `pnpm check`, rodada7 em 2026-11-03: exit0, 128 suites e
1016 testes passaram; specs, typecheck, lint, FSD e formatação passaram.
Log `toonlira-volatile-mobile-check-20261103-7.log`, conservado no recibo local
`mobile-final-verification-20261103/`. Isso mantém abertas as provas nativas.

## Atualização posterior — 2026-11-03

A rodada privada c6 executou em AMD64/COS125, com pipeline e oito cenários
nativos aprovados e recursos removidos; ver [audit atualizado](evidence/volatile-candidate-6-completion-audit-2026-11-03.md).
AC-006 tem evidência nova para memória, falhas, timeout, recuperação e restart;
cancelamento explícito nesse alvo não foi exercitado e permanece aberto.
A prova iOS/offline e a matriz física da 021 também permanecem abertas.
As afirmações anteriores sobre autorização e ausência de execução são histórico
anterior à nova autorização; não alteram o verdict nem concluem a feature.

## Ensaio de implantação — 2026-11-04

Uma imagem sintética foi traduzida uma vez com providers reais no gateway
temporário; hashes e recibo foram verificados. Permanecem pequenos vestígios
visuais das letras originais e cancelamento explícito no alvo sem prova.
A evidência e os limites estão no [registro operacional](../../../../../api/apps/translation-gateway/docs/private-android-test-2026-11-04.md).
Não altera o verdict nem conclui a feature.
