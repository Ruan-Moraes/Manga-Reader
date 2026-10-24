# Auditoria incremental — MOB-FEAT-019 — 2026-10-03

- Implementação auditada: working-tree sha256:0197e775ac2875fd2619dc4a8a1a68162b97aa1591d460593588c2932c2d51b2
- Escopo: pares operacionais, submissão, parser local/bytes, reentrega, receipts, associação local OCR/tradução e adapter de escrita de regiões.
- Parcela adicional: leitura estrita, transporte gRPC sintético e ACK/cleanup durável no gateway, sem renderer.
- Gate: `open`; dependência 018 em `verification-pending`, permitida pelos guardrails atuais.
- Status: `verification-pending`; verdict correspondente, TASK-006 externa aberta.

Aplicação de `sdd-drift-auditor`: confronto da spec/tasks/review, registry,
coverage, reconciliação corrente e código/testes da parcela. O auditor não
alterou requisitos ou runtime. A decisão de status/gate foi registrada após
essa conferência, conforme autorização de execução incremental de Ruan.

## Findings

| Classificação                         | Evidência                                                                                            | Estado / ação                                                                              |
| ------------------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| código divergente corrigido           | capabilities publicava 42 pares sem ler o conjunto operacional; teste vermelho e correção registrada | pares publicados, submissão e worker agora conferem a configuração; ETag canônico          |
| evidência corrente obsoleta corrigida | resumo arquitetural dizia V4/concorrência pendentes de Docker, já aprovado em 2026-10-02             | resumo corrente atualizado; fotografias históricas preservadas                             |
| fronteiras futuras ainda ausentes     | resultado renderizado e download/commit/ACK do aplicativo não disponíveis                            | responsabilidades das 020/021; 020 autorizada após prontidão técnica da 019, 021 bloqueada |
| lacuna server-side resolvida          | ACK por owner com registro durável e cleanup por lease, V5 e testes PostgreSQL/HTTP                  | finding de retenção corrigido; não comprova producer READY nem operação cloud              |
| verificação externa pendente          | provider/contexto real, qualidade/referências e operação não aprovados                               | TASK-006 aberta; gates automatizados da TASK-007 executados, sem chamadas pagas            |

Na parcela auditada, cobertura individual dos arquivos runtime e testes foi
registrada. A validação automatizada completa é reportada na
[evidência datada](evidence/translation-capabilities-contracts-2026-10-03.md).
Na continuação, dois problemas de código foram reproduzidos antes da correção:
falha pré-reserva alterava uma execução ativa e confirmação perdida podia
apagar manifesto referenciado após mudança de estado. Executor corrigiu os
dois com regressões de aplicação/PostgreSQL. Ver
[evidência de reentrega](evidence/translation-delivery-safety-2026-10-03.md).
Na parcela local seguinte, hashing dos bytes adquiridos e UTF-8 estrito foram
entregues sem aquisição HTTP, gravação ou ACK. A fronteira exige metadados
confiáveis; decoder Expo e digest Node em testes não são validação física.
Ver [evidência de integridade](evidence/translation-manifest-byte-integrity-2026-10-03.md).
Auditoria seguinte encontrou dois problemas de código na fronteira mobile:
erros publicados do worker rejeitados e receipts não vinculados ao job/versão
persistidos. Corrigidos com testes de falha legítima, job incompatível,
cancelamento e recovery por idempotência; nenhuma mudança normativa necessária.
O filtro de versão anterior à consulta fecha também o ramo de reenvio por `404`
de tentativa incompatível, com regressão específica.
Ver [evidência dos receipts](evidence/translation-job-receipts-2026-10-03.md).
Parcela seguinte associa as regiões OCR e o manifesto traduzido integralmente,
com snapshots imutáveis e geometria preservada. Mapper de objetos não é
verificação dos bytes fonte nem commit local: retorno/ACK, gravação de resultado
final e qualidade/operação continuam ausentes. Não há escrita de resultado
parcial para contornar renderer ou abertura de gate 020/021. Ver
[evidência da associação](evidence/translation-region-association-2026-10-03.md).
Nenhuma lacuna funcional foi reclassificada como simples verificação externa.
Naquela fotografia incremental, a auditoria ainda não cobria a feature integral
e 020/021 continuavam bloqueadas. A revisão integral seguinte verificou a escrita
local, o ACK corrigido e a fronteira das specs, sem preencher benchmark por fixtures.

Contadores do escopo corrente: `mismatch=0`, `undocumented=0`, arquivos runtime
descobertos `0`, confirmados pelos checks SDD registrados na evidência.
Esses contadores não significam que todos os seis critérios foram concluídos.
Checksum mobile não cobre Java; snapshot técnico separado na evidência.
Rebase de headers de outras reviews/drifts é mecânico, sem renovar conclusões.

Na parcela adicional, a leitura limitada do manifesto foi confrontada com
AC-002/003/004: hash/contexto, IDs/ordem e limites preservados; resposta inválida
falha sanitizada. Testes não constituem evidência de provider real ou renderer.
Não há mudança de schema, API ou contratos normativos. O snapshot técnico Java
é registrado separadamente na
[evidência da leitura](evidence/translation-manifest-reader-2026-10-03.md).

Na auditoria de transporte, a tentativa única antes demonstrada com mock passou
a ser medida por gRPC local e no fluxo integrado ao PostgreSQL. Não houve
mudança de intenção ou flexibilização de validação. O retorno é sintético,
sem tradução real; ver
[evidência do transporte](evidence/translation-grpc-integration-2026-10-03.md).

Finding funcional explicitado na fotografia anterior: ACK server-side era incondicionalmente
`409`; não há pedido durável ou remoção antecipada. Não basta deslocar toda
a obrigação para o cliente da 021. Executor deve fechar a fronteira de retenção
com testes antes de nova decisão de prontidão da 019; consumidor e resultado
renderizado continuam fora desta parcela. Nenhuma promoção foi realizada.

Resolução seguinte do Executor: V5, ACK transacional e cleanup por job foram
implementados e revalidados em PostgreSQL/MockMvc, incluindo lease antiga,
falha parcial e confirmação perdida. O Reviewer conferiu isolamento, ausência
de texto e I/O fora de transação. A constatação anterior permanece histórica,
não finding aberto de aceitação server-side. Ver
[evidência da retenção](evidence/translation-result-ack-2026-10-03.md).
Revisão integral e decisão de gate da 019 ainda não realizadas naquela parcela;
020/021 continuavam bloqueadas. Não se converte entrega de teste em qualidade,
operação real ou aquisição mobile concluídas.

## Resolução integral — 2026-10-03

Conferidos os seis critérios, implementação, fixtures/gRPC, transações reais,
configuração fail-closed, perfil worker, observabilidade e limpeza. A escrita
local da TASK-005 já existe; o chamador que adquire arquivo/resultado pertence
à 021. Dois testes adicionais fecham a evidência da primeira página em
projeto multipágina. Nenhuma nova lacuna funcional da 019 foi encontrada.

Estado corrente: 019 `verification-pending/open`; TASK-006 aberta. A autorização
de Ruan para implementar autonomamente até a renderização é registrada como
abertura condicional da 020 após a transição verificada. A 020 fica
`approved/open` com tasks abertas; a 021 permanece `approved/blocked`.

Contadores derivados: `mismatch=0`, `undocumented=0`, arquivos runtime
descobertos `0`, caminhos obsoletos `0`, violações de gate `0`. Sem supersession
nova ou promoção a `implemented`. Ver
[evidência consolidada](evidence/translation-consolidation-2026-10-03.md).
O checksum técnico Java permanece separado do checksum mobile corrente.
