# Review — MOB-FEAT-017, revisão volátil

- Spec revisada: `spec.md`, intenção humana de 2026-11-01; status técnico de 2026-11-02.
- Implementação/revisão: working-tree sha256:751f485409b07f18d689b9d6ab37b2b133be8503c09c2e2ca570a8c5ac7bf1d3
- Gate corrente: `open`; dependência 016 preservada.
- Verdict: `verification-pending`.
- Revisão independente: agente `/root/volatile_specs`, conferência final read-only em 2026-11-02.
- Registro integrado após revisão; não é aprovação de produção, provider real ou aparelho.

## Findings resolvidos e limites

R01 (bearer entre gateways), R03 (duas identidades em bootstrap concorrente) e
R02 (recibo conhecido descartado) foram reproduzidos e corrigidos com regressões.
A revisão independente na árvore corrigida não encontrou outro bloqueador
concreto de código. O gate geral confirmou 126 suites/987 testes; a rodada
independente confirmou 8 suites/80 testes, sem mutação do runtime.

[Revisão inicial independente](evidence/volatile-mobile-017-review-2026-11-02.md)
conserva os findings, e o [registro de correções](evidence/volatile-fixes-and-local-validation-2026-11-02.md)
explica implementação e provas. A referência inicial não foi reescrita como se
as falhas nunca tivessem existido. Checksum corrente cobre a árvore final.

## Critérios e evidências

| Critério | Implementação técnica conferida                                                                    | Evidência executada                                                               | Verificação restante / resultado                                                          |
| -------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| AC-001   | Disclosure volátil, operador, localidades, treinamento e políticas trilíngues                      | capabilities/disclosure e RNTL dos três locales; fontes Terms/Privacy atualizadas | publicação/práticas atuais: TASK-016; verification-pending                                |
| AC-002   | Aceite afirmativo, versionado e escopado; novo disclosure não herda aceite antigo                  | controller, repository e RNTL aceitar/recusar                                     | apresentação física: TASK-014/015; verification-pending                                   |
| AC-003   | Primeira página, arquivo físico, metadados, limites, par e consentimento revalidados antes do POST | startRemoteProcessing.test.ts, zero processPage em pré-condição inválida          | Expo/aparelho: TASK-014; verification-pending                                             |
| AC-004   | HTTPS binário limitado, sem redirect, framing/EOF/timeout validados                                | volatileTranslationTransport.test.ts e controller; HTTP integrado backend         | transporte nativo/ambiente alvo: TASK-014; verification-pending                           |
| AC-005   | Bearer por gateway; bootstrap por geração; clear impede recriação tardia                           | remoteProcessingIdentity.test.ts; autorização owner-scoped backend                | revogação no serviço alvo: TASK-017; verification-pending                                 |
| AC-006   | Attempt/chave antes da rede; singleflight e nenhum replay pago automático                          | controller/identity; PostgreSQL real, quota/replay/purge e HTTP privado           | configuração operacional: TASK-017; verification-pending                                  |
| AC-007   | Aceite transacional, PROCESSING sem READY local; recibos distintos                                 | SQLite real upgrade/rollback/terminais e controller/widget                        | transações/lifecycle físico: TASK-014; verification-pending                               |
| AC-008   | Reconciliação só de metadados, identidade proprietária e saída local seguras                       | controller, identity, cancel e SQLite; nenhuma nova mídia em consulta             | restart/rede no aparelho: TASK-014; verification-pending                                  |
| AC-009   | Abort/background/unmount, descarte tardio, posse e waiter isolados                                 | hook, controller, volatileDelivery e cancel tests                                 | lifecycle nativo: TASK-014; consumidor 021 permanece fora de escopo; verification-pending |
| AC-010   | Sem conteúdo no recibo/logs; ausência dos gravadores legados no JAR; buffers/pipes                 | guards backend, duas rodadas HTTP e oito cenários nativos; revisão de fontes      | proxy/APM/swap/dumps/ambiente alvo: TASK-017; verification-pending                        |
| AC-011   | Recibos conhecidos/desconhecidos, consentimento e erros nos três locales                           | RNTL, i18n/type/lint/FSD e gate completo                                          | foco/layout/leitor de tela reais: TASK-015; verification-pending                          |
| AC-012   | Primeira página e fronteiras; resposta 2.0 não entra no consumidor antigo 1.0                      | controller, guard do widget e FSD verde                                           | pass técnico; aquisição 021 continua futura e bloqueada                                   |

## Gates e proveniência

- `pnpm check`: exit 0, 126 suites/987 testes, checksum técnico anterior às
  atualizações de governança `d37bcafd84f84ea9ef52c71695492275da328510d1c891a5896abcb48a9c2f82`.
- Revisão independente: `/private/tmp/toonlira-volatile-mobile-017-independent-final-20261102.log`.
- Recibo local: `.local/mob020-volatile-20261101/mobile-review-fixes-20261102-1/` na raiz do checkout.
- Após este registro, executar `pnpm specs:check` e renovar somente os headers
  de checksum; nenhum aceite antigo é promovido por rebase mecânico.

## Próximo passo autorizado

A 017 tem código/testes técnicos executados, com TASK-014..017 abertas para
verificações reais. `verification-pending` permite dependência executada conforme
AGENTS/DEC-008. A autorização de continuidade permite abrir a 018 somente após
validar esta governança. Isso não transforma código ausente da 021 em teste pendente.

## Ajuste de relógio — 2026-11-04

A resposta do gateway em Android apresentou avanço de 200 ms e foi rejeitada.
O cliente tolera até cinco segundos na geração sem estender a expiração; a ação
fica oculta quando a capability é inutilizável. Regressões passaram e o APK
corrigido abriu o consentimento no emulador. O envio e o ciclo físico seguem
pendentes. Registro operacional: [teste Android](../../../../../api/apps/translation-gateway/docs/private-android-test-2026-11-04.md).
