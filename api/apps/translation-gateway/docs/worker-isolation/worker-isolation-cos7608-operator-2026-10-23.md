# Operador COS7608 — 2026-10-23 UTC

Continuação posterior: [diagnóstico offline do envio da VM](worker-isolation-vm-send-diagnosis-2026-10-23.md),
sem reexecutar este operador ou alterar seus recibos.

Continuação do [grafo COS7608 preparado offline](worker-isolation-cos7608-offline-2026-10-23.md).
A revisão do operador é separada dos contextos anteriores. A 020 permanece
`in-progress/open`; a 021 permanece `approved/blocked`.

## Implementação e segurança

Plano registrado antes do código conforme `database-design`: sem banco,
schema, migration, FK, índice, contador ou cache novo. Ledger em centavos/USD
e sete reservas históricas preservados; testes usam somente cópia privada.

Imports ativos de pin/requests, runtime e preflight apontam à COS7608. O gate
reconfere os 186 fontes do pacote e o conjunto exato de 52 módulos. Os gates
anteriores de rotas/dispatch são linhagem histórica, não seleção do runtime
antigo. Retiradas anteriores continuam usando seus validadores originais.

Permanecem as 64 observações de ausência, cinco metadados e duas quotas antes
de reservar, além da conferência da primeira retirada no launcher. Não foi
inventada uma oitava retirada para a tentativa que parou sem criar recursos.
Os timers, ticket de 1.000 ms, grants, reserva fresca/serial, ausência de retry,
posse do cleanup e remoção condicionada a recibos terminais não foram relaxados.

O engine agora grava o resultado sanitizado do preflight e o valida
imediatamente, antes de consultar quota/ausências ou reservar. O mesmo
predicado volta a ser exigido antes da reserva. Uma falha observada não é
perdida pela recusa anterior do wrapper nem autoriza continuar com identidade,
SDK, fontes, imagem ou prazo inválidos.

## Gates locais

O RED próprio registrou quatro falhas contra os contratos antigos. As mesmas
quatro regressões passaram após a implementação, junto de 26 cenários focais.
A execução integral estabilizada encerrou de 00:48:30.432 a 00:49:40.976 UTC:
**173/173**, zero falhas/skips/cancelamentos e 209 fontes sem alteração.
Integração com CAS Java e leitor real de reserva sobre cópia privada do ledger;
HTTP, identidade, preços e campos nativos de fixture são sintéticos.

O launcher, acrescentado somente após selar o núcleo para não criar checksum
autorreferente, passou mais três testes, com 154 fontes conferidas. Nenhuma
chamada cloud, credencial real ou reserva durante esses gates.

| Recibo privado | SHA-256                                                            |
| -------------- | ------------------------------------------------------------------ |
| Núcleo         | `55aeb89a1a4240c1cfbedcd0de95d5bc23a7772405b5e937a6720215b761130d` |
| TAP do núcleo  | `600fd13781c213a104d79bc6651c30a38b2cffee76b8ccf759b6be1d6d21e1c7` |
| Launcher       | `b3546c950313a62a18a8893cba08d657212618e2d315169e64f5a7407df6ead2` |

Pacote privado: `.local/worker-isolation/mount-cos7608-operator.d8kQcq/`.
Não repetir `execute` desse contexto ou sobrescrever recibos com `wx`.

## Leituras reais e preparo

A consulta restrita dos cinco metadados, entre 00:48:52.515 e 00:48:56.431 UTC,
passou com identidade existente, SDK/fontes iguais, projeto ativo e metadados
herdados vazios. A imagem concreta estava READY/X86_64/não depreciada; perfil
N1 e zona passaram. Não foi criada VM, alterada configuração ou feita reserva.
Recibo: `cc25180b78db2ffb17f951b253caa3d0600a2e906f4291add8f71b1fba62985f`.
É observação histórica, não preflight fresco reutilizável indefinidamente.

O preparo local passou às 00:50:35 UTC, sem credencial ou recurso. Reutiliza por
SHA a captura financeira ainda vigente, sem redatar seus dados. Estimativa do
cenário conservador: USD 2,11; não é fatura, garantia tributária ou hard cap.
A cotação vence às 01:17:09.317 UTC e deve cobrir também a retirada da rodada.
O contrato local tem revisão própria, sem modificar a captura original.

| Recibo privado   | SHA-256                                                            |
| ---------------- | ------------------------------------------------------------------ |
| Preparo local    | `bdabafa5077e573977c604dbb77950ab55190201d793fa2d04d790baf7a2bf5c` |
| Auditoria prévia | `0b721cb1ce7c36869f5fce639f298c93c335c30e20eeb78fa97cb459c9bce934` |

## Prova restrita

A autorização vigente de até USD 100 cobre uma rodada de montagem com reserva
de USD 5, VM N1 temporária limitada a 600 segundos e retirada do próprio escopo.
Não instala nada no Mac; não executa o worker completo nem providers. O arquivo
eventualmente enviado é o pacote técnico de montagem, não página de mangá.

Rodada `mount-check-20261023-2f4879ba`: terminou exit 2, com quiescência
confirmada, sete criações Compute anteriores à VM e staging verificado. As 64
ausências e os sete GETs de metadata/quota passaram antes da oitava reserva
real, registrada às 00:52:14 UTC. Ledger: USD 40 reservados, não faturados.

O diagnóstico foi `instance / request-response / dispatch-unconfirmed`, com
ticket de 1.684 ms na observação. Não prova sozinho a causa histórica nem
autoriza ampliar o ticket. Captura: 243 eventos, nove POSTs 200 (sete Compute,
dois Storage), um DELETE 200 de rota, 232 GETs com resposta e um GET com falha
de transporte. Nenhum POST da VM chegou ao transporte capturado. O grant
permaneceu gasto/selado, sem handle, terminal ou rejeição HTTP da VM.

O supervisor retornou `requiresRecovery=true`, `safeToUnlock=false`, sem
montagem ou ausência ativa confirmada. O processo foi observado terminal;
o lock e todos os recibos originais foram mantidos. Não houve segundo execute.

| Evidência privada     | SHA-256                                                            |
| --------------------- | ------------------------------------------------------------------ |
| Falha original        | `92a4451e3dd0f34ba3dc7d4eb0841f7713cf65fb99554bd9620d72a64d335e9a` |
| Captura de transporte | `79235c8d290249e8f9d050b72b7ac3c3c35ce0ed21972150f180494c5f90bcbd` |
| Boundary nativo       | `a83c57d82bbe14336006ebda7f7d9bf28d4ad1ea9cbd1da4739a2d90b17d5e5a` |

## Recuperação explícita

Foi priorizada a retirada do mesmo contexto, sem nova criação ou reserva.
O plano mantém os estados originais: ausência no transporte não é convertida
em `NOT_SENT`, HTTP 400 ou operação terminal inventada. A admissão exige
captura/boundary/hash/fontes, quiescência e snapshot selado consistentes, além
de leituras atuais repetidas da VM e operações antes de excluir recursos.

A preparação e os testes ocorreram em
`.local/worker-isolation/mount-cos7608-recovery.v69Fkg/`. O gate encerrou de
01:09:01.527 a 01:10:01.555 UTC: **21/21 testes**, zero falhas/skips/cancelamentos,
172 fontes conferidos e ledger sem alteração. Inclui integração com CAS real
e HTTP sintético, operação inesperada, dono divergente e confirmação de DELETE
perdida. A sequência RED e as falhas intermediárias de fixtures não são
apresentadas como evidências aprovadas. Nenhum teste foi excluído para aprovar.

A execução real foi retomada após a interrupção, com nova reconferência local
às 16:22:59 UTC, não com uma alegação de limpeza imediata durante a madrugada.
Não reutilizou cotação vencida para criação: o escopo permitiu somente GET e
DELETE, sem provider, recurso ou reserva novos. O mesmo processo de recuperação
foi acompanhado até exit 0, às **16:25:13.949 UTC**.

Resultado: **203 requisições** — 78 GETs 200, 116 GETs 404, sete DELETEs Compute
200 e dois DELETEs Storage 204. As sete operações Compute de exclusão chegaram
a DONE sem erro. As leituras repetidas confirmaram ausência da VM e de
operações correspondentes antes da retirada; depois, ausência ativa de todos
os recursos, rota, objeto e bucket. Não houve POST, retry de criação ou reserva.

Compute, source, route, falha e captura originais permaneceram byte a byte
iguais. O journal de storage recebeu somente os recibos de exclusão autorizados.
O lock original e o lock da recuperação permanecem como evidência; não são
prova de processo ainda ativo e não autorizam reexecução desses contextos.
O grant gasto permanece distinto de `NOT_SENT`, rejeição HTTP e terminal cloud.

| Evidência privada   | SHA-256                                                            |
| ------------------- | ------------------------------------------------------------------ |
| Gate da recuperação | `723a2964ec5886cddf353d189b61d3477404278f0e3a99f8e21545a6a844013c` |
| TAP da recuperação  | `7ccf288865784542b324e5337d37effce9c1d78fdcfd7f85667f42385ec6a8ec` |
| Resultado nativo    | `e8d9dd255d8ff9ca01392e7c61126d8adc50491825d58ec7807768f7c379d87e` |

O ledger continua com oito reservas e USD 40 reservados, sem estorno automático;
isso não comprova consumo faturado. A ausência ativa no GCS não significa
apagamento físico: o soft delete de sete dias permanece explícito.

## Auditoria posterior e gates globais

A auditoria de 16:36:49 UTC reconferiu 721 referências de hash (260 fontes
distintos) dos gates 145/173/3/21. As sete criações conhecidas foram vinculadas
aos mesmos IDs e operações de exclusão DONE; cada DELETE foi único. Onze últimas
observações 404 cobrem VM, sete recursos Compute, rota, objeto e bucket. Os dois
GETs filtrados da operação da VM e o grant original permanecem como provas
distintas, sem fabricar um terminal cloud. SDK e os 419 fontes do gateway não
mudaram. Auditoria somente local, sem chamada cloud ou nova reserva.

Também foram reexecutados, sem reinstalação ou download:

- Maven global offline com Docker em cache, de 16:33:41 a 16:36:02 UTC: sete
  módulos SUCCESS, zero falhas/erros; gateway com 1.297 testes e 104 skips.
  Esses skips não representam aprovação dos caminhos nativos opt-in.
- Type-check web `tsc -b`: exit 0, às 16:33:50 UTC.
- `pnpm check` mobile integral: exit 0, às 16:34:35 UTC; 116 suítes e 892 testes
  Jest aprovados, além dos checks SDD, tipos, lint/FSD e formatação.

Logs/recibos privados em
`.local/worker-isolation/mount-cos7608-post-recovery-gates.xTkhhB/`.

| Evidência              | SHA-256                                                            |
| ---------------------- | ------------------------------------------------------------------ |
| Auditoria pós-retirada | `5263bcefd8365f7d115a3386c39e50882146129d63a164388aed34d48f7d4d55` |
| Log Maven              | `6f66a66afb039d48f9553233180c5055e638b3afe86bad991a8252e7668b2ba5` |
| Log mobile             | `0879758dd37b883285637df3a46cbe538d3cd96854873d1aff4619c0502d239d` |

Links locais e diff dos documentos alterados passaram. O diff global continua
apontando somente a linha em branco preexistente em
`web/landing-page/src/shared/component/PlatformBadge.tsx:44`, não corrigida por
este incremento. Arquivos da auditoria de performance permaneceram fora do escopo.

## Próximo trabalho

Investigar offline a recusa entre grant e transporte, com as mesmas fronteiras
de 1.000 ms/10 s/30 s e captura de fases sanitizadas. O valor de 1.684 ms é uma
observação no catch, não diagnóstico exclusivo de expiração do ticket.
Não ampliar prazos ou repetir a VM para descobrir a causa. Outra prova exige
novo contexto, reconferência desta oitava retirada e cotação atual, após o fix
e seus testes. A cotação das 00:17 UTC já não está vigente.

Boot/CVEs, memória/isolamento, rendering/qualidade e retenção/operação do worker
completo continuam gates distintos. Sem upload público, IAM/API, deploy,
implementação mobile ou alteração dos arquivos de performance.
