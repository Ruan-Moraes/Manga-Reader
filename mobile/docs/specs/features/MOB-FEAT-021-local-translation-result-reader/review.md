# Review — MOB-FEAT-021, aquisição volátil no aparelho

- Spec revisada: `spec.md`, direção humana de 2026-11-01.
- Implementação/revisão: working-tree sha256:751f485409b07f18d689b9d6ab37b2b133be8503c09c2e2ca570a8c5ac7bf1d3
- Gate corrente: `open`; dependências019/026/027/051 `verification-pending` antes do plano.
- Verdict: `verification-pending`.
- Revisão independente: /root/volatile_specs, 2026-11-02.

## Findings

A revisão independente encontrou empréstimo do cancelled do primeiro dono ao
foreground retomado e corrupção comprovada de arquivo deixando READY preso.
Três regressões reproduziram esses problemas e a distinção de I/O indeterminado.
Correções conferidas no código e testes: retomada resolve somente verdade local
após limpeza do dono anterior; corrupção invalida somente o resultado próprio;
inspeção indeterminada preserva os dados. Nenhum novo blocker concreto encontrado.

## Critérios

| Critério | Código e evidência atual                                                                                                    | Resultado / verificação real aberta                              |
| -------- | --------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| AC-001   | take único, callback recebido somente após posse/vínculo, inicial sem marco, UI recebido/salvo, nenhum polling remoto       | pass técnico; lifecycle nativo TASK-007                          |
| AC-002   | parser/limites/hash/real WebP/decode, staging/promote/recheck, SQLite exclusivo/rollback, lease contra reconciliação        | pass técnico; arquivos/commit nativos TASK-007                   |
| AC-003   | claim SQL persistido antes de navegar, hook back/rerender, foreground durante COMMIT abandonado                             | pass técnico; navegação/restart reais TASK-007                   |
| AC-004   | domínio local e reader revalidados, sem overlay demo em REMOTE, original e texto completo                                   | pass técnico; inspeção física TASK-007                           |
| AC-005   | resultado salvo revalidado sem transporte/identidade/take; original/fallback locais                                         | pass técnico; leitura física offline após fim da sessão TASK-007 |
| AC-006   | bytes/manifesto/binding/hash inválidos, disco/move/decode, interrupção, COMMIT ambíguo, perda/corrupção e I/O indeterminado | pass técnico; falhas/ciclo nativos TASK-007                      |
| AC-007   | arte-only abre, aviso nos três locales, sem fallback vazio                                                                  | pass técnico; inspeção física TASK-007                           |
| AC-008   | widget/reader trilíngues, tokens, labels/touch targets existentes, refresh local e confirmação de custo                     | pass técnico; acessibilidade física TASK-007                     |

## Gates e proveniência

`pnpm check` exit0 na rodada6:128 suites/1016 testes, sem falhas. Specs, tsc,
eslint, FSD e prettier passaram. As rodadas4/5 pararam em ordenação de export e
formatação de registry; correções pontuais, sem fix/format global. Focados9/123
passaram, incluindo fixtures históricas fora do runtime, sem atribuir a elas
aceite do protocolo novo. Testes anteriores foram mantidos; APIs1.0 sem consumidor
foram retiradas do runtime. [Evidência](evidence/volatile-client-verification-2026-11-02.md)
e [review independente](evidence/volatile-spec-and-plan-review-2026-11-02.md).

TASK-001..006 estão executadas; TASK-007 é verificação real aberta, sem código
placeholder. Esta conclusão não é `implemented`, aceite físico ou de operação
pública. Provider pago/mídia real/deploy não foram utilizados. Rebase de headers
e specs:check são executados após o fechamento documental.

## Revalidação em 2026-11-03

Após a consolidação documental c6 da 020, `pnpm check` rodada7 passou com
128 suites/1016 testes, specs, typecheck, lint, FSD e format verdes. Recibo local
`mobile-final-verification-20261103/`, sem alterações de runtime nesta rodada
documental. TASK-007 continua aberta: DeviceHub/CUA expirou e a enumeração do
simulador não comprova ciclo nativo, restart/offline ou acessibilidade física.

## APK para ensaio manual — 2026-11-04

O APK de teste incorpora o gateway temporário real; `pnpm check` passou.
A [evidência operacional](../../../../../api/apps/translation-gateway/docs/private-android-test-2026-11-04.md)
não comprova instalação ou ciclo nativo. TASK-007 e a matriz física continuam
abertas; o verdict permanece inalterado.

## Ensaio Android sintético — 2026-11-04

O APK corrigido instalou no emulador Android, preparou uma página sintética,
recebeu e abriu a tradução do gateway real e reabriu a página após encerramento
do app com Wi-Fi e dados móveis desligados. A [evidência operacional](../../../../../api/apps/translation-gateway/docs/private-android-test-2026-11-04.md)
registra escopo, hash e limitação visual. Este resultado substitui a afirmação
anterior de ausência de qualquer ciclo Android nesta rodada, mas não comprova
interrupção, todos os idiomas, aparelho físico ou acessibilidade. TASK-007 e o
verdict `verification-pending` permanecem abertos.
