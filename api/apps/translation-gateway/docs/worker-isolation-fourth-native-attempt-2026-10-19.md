# Quarta prova restrita e recuperação — 2026-10-19

Continuação do [diagnóstico pré-VM](worker-isolation-prevm-preflight-2026-10-19.md).
A 020 permanece `in-progress/open`; a 021 continua bloqueada. Montagem,
isolamento do worker completo e qualidade visual não estão aprovados.

## Gates locais e admissão

O runtime com preparação separada passou 100/100; o operador passou 53/53.
Os recibos e a interrupção inicial preservada estão no diagnóstico anterior.
O operador revalidou os 419 fontes e a cadeia de evidências, os preços/billing
para toda a janela, quatro consultas de pré-flight e **22 GETs 404** dos dois
escopos precedentes antes de reservar.

A rodada `mount-check-20261019-8c3e45ff` foi admitida exclusivamente para
`mount-content-only`, no teto autorizado de USD 100, com uma reserva de USD 5.
Não houve instalação, OCR, tradução, renderer, mídia nova, alteração de IAM,
deploy ou upload público. O staging continha o arquivo técnico já existente.

## Resultado real: avanço e rejeição

Entre aproximadamente **22:54 e 22:58 UTC**, o fluxo criou staging privado,
rede sem rota default ativa, subnet, firewalls, imagem e discos. A preparação
separada ultrapassou o ponto que havia bloqueado a terceira rodada.

O POST da VM foi efetivamente enviado uma vez, às **22:58:20.835 UTC**, e
recebeu **HTTP 400**. Não foi repetido. O resultado terminal foi
`supervisor-recovery-required`; montagem não observada, ausência ativa ainda
não confirmada pelo supervisor. IO e helpers terminaram quiescentes.

O transporte original registrou 10 POSTs (nove HTTP 200 e um 400), 254 GETs
e um DELETE da rota, além dos 22 GETs anteriores. O corpo do erro não foi
preservado pelo transporte original; a causa ainda não estava comprovada
nesse momento. A investigação posterior está registrada abaixo.

Duas observações independentes e limitadas retornaram 40 GETs 404 cada para a
VM, sem guardar resposta bruta. Não há observação de guest, systemd, montagem,
Java ou renderer. A omissão de `serviceAccounts` continua sem evidência real;
essas leituras 404 não autorizam relaxar esse validador.

## Recuperação explícita, sem reclassificar o original

O journal v4 conserva a intenção e o grant de dispatch da VM. Um 400 não foi
transformado em NOT_SENT, 403 ou operação DONE. O lock original foi mantido.

Uma recuperação separada foi planejada, implementada e validada com **15/15**
testes: prova do POST exato, propriedade, recusa por evidência
incompatível, fluxo completo com CAS e confirmação perdida de DELETE. A
primeira fixture de DELETE esperava o journal do criador; foi corrigida para
exigir a intenção exclusiva da recuperação, sem mudar o Compute CAS.

Antes de qualquer exclusão real, exigiram-se duas leituras 404 da VM e duas
listas vazias de operações pelo requestId, com pausa entre as observações.
Os recursos criados tiveram ID, nome, URL, labels/descrição e ausência de users
revalidados antes da exclusão. Apenas GET e DELETE foram admitidos.

A retirada terminou às **23:07:29 UTC** com:

- 193 GETs e nove DELETEs; nenhum POST ou reserva adicional.
- Sete DELETEs Compute HTTP 200, operações DONE sem erro e alvos correspondentes.
- Dois DELETEs Storage HTTP 204.
- Ausência ativa final dos oito alvos Compute, rota, bucket e objeto.
- Journal Compute original byte a byte idêntico; intenção/dispatch e locks
  históricos preservados. O journal Storage registra sua retirada real.

Os recursos temporários ativos desta rodada foram removidos. O arquivo local
reutilizável foi preservado. Exclusão temporária do Storage por sete dias não
equivale a eliminação física imediata; `physicalDeletionVerified=false`.

## Integridade e orçamento

| Registro privado              | SHA-256                                                            |
| ----------------------------- | ------------------------------------------------------------------ |
| Resultado da quarta rodada    | `1c187a074e749fb16a563858b9c52b4b3f7cfb337a1409a88e86e107f565c873` |
| Recibo offline da recuperação | `dbaff7004547c1891432c51d3b03c82fd68e73cc3c62b9bf2609d659bb15a14e` |
| Resultado real da recuperação | `60d1524266490ffac8bbef44b4ad757992f83bb7c33d54c972bb492536be7453` |
| Auditoria de 114 artefatos    | `6581dcc056ea81b9cb10e94c36e4da1f35f48b225481d14d5d4b352938b55adc` |

Fontes, TAPs, resultados, journals e observações estão nos diretórios privados
`mount-prepared-operator.LoQ9fO` e `mount-http400-recovery.RyT7ca`, sob
`.local/worker-isolation/`. A auditoria revalidou os pins e os 419 fontes,
confirmou ausência ativa final e preservação dos locks. A busca de três padrões
de credenciais não encontrou correspondências nesses artefatos; não é detector
universal de segredos nem varredura de todo o computador.

O ledger possui quatro reservas de USD 5 (**USD 20 reservados**, não gasto
faturado), USD 65 normais ainda não reservados e cenário contábil máximo de
USD 35 incluindo allowances/contingência, sob autorização total de USD 100.
A estimativa de USD 2,14 não é fatura, cotação completa ou teto do provider.
Custos reais e retenção soft-delete continuam sem conciliação de cobrança.

## Diagnóstico posterior: causa confirmada

Depois da retirada, consultou-se somente o evento de auditoria dessa VM, no
intervalo 22:58–22:59 UTC, sem criar recursos. Os dois primeiros leitores
passaram seus testes sintéticos, mas a consulta real retornou HTTP 400; isso
era um erro separado do leitor, não a causa Compute. Seus fontes e resultados
foram preservados. Ao retirar somente a projeção remota de resposta, a terceira
revisão obteve HTTP 200 e uma entrada, sem paginação.

O corpo ficou limitado a 256 KiB e foi descartado em memória após extração por
allowlist. Não se guardaram request, principal, metadata, token ou mensagem
bruta. O registro confirmou identidade/tempo, código canônico 3 e os termos
E2/TERMINATE. Em seguida, a comparação offline com uma mensagem controlada
conhecida confirmou exatamente seu hash, sem outra chamada cloud.

A causa é **E2 padrão incompatível com `onHostMaintenance=TERMINATE`**. A
[documentação oficial de manutenção](https://docs.cloud.google.com/compute/docs/instances/setting-vm-host-options)
confirma que E2 exige live migration, exceto Spot/preemptible. Não houve troca
silenciosa para `MIGRATE`, mudança de identidade ou enfraquecimento do guard.

| Evidência posterior               | SHA-256                                                            |
| --------------------------------- | ------------------------------------------------------------------ |
| Leitor final offline, 9/9         | `c9f8eb6e49720e63b31ae49e07e285475e1470a9d684d12e7dc69ef4ec29128a` |
| Resultado de auditoria sanitizado | `b0839415e9694f5c484623a95d9663b01a4ee5cd3d6c87fefeb658169dc18294` |
| Confirmação do hash da restrição  | `db3ba0bb739a34a78a91ae20c0700267250041d5548ec3f21ca7e1dc7791df49` |
| Auditoria posterior, 19 artefatos | `f0a7720e30230f7dab32c86d8be1ca1c5c15198e378f65aa7f9cc94c55f325bc` |

Os leitores estão em `mount-http400-diagnostic.ebNLY4`,
`mount-http400-logs2.Mpp3d8` e `mount-http400-logs3.AoaLMJ`. A auditoria de 114
artefatos anterior é uma fotografia da retirada; não cobre esses leitores
posteriores. Nenhuma reserva ou mutação de recursos foi acrescentada.

## Próximo trabalho

Preparar um [perfil compatível, sem habilitá-lo](worker-isolation-compatible-profile-plan-2026-10-19.md).
Rejeitar a combinação incompatível antes de staging/reserva e preservar as
demais proteções. Uma nova criação exige novo ID, nova admissão e nova reserva
dentro do teto existente. Worker completo, segurança COS/Docker, memória,
montagem e validação visual permanecem abertos; não há promoção da 020.

Nesta parcela, os gates executados foram os do tooling acima, links locais,
formatação direcionada e diff dos documentos. Não se declara nova execução de
Maven global, web/mobile ou SDD. Alterações externas e auditoria de performance
foram preservadas.

Foram conferidos 212 links relativos dos documentos correntes, sem destino
ausente. O diff direcionado passou. `git diff --check` global mantém o baseline
alheio em `web/landing-page/src/shared/component/PlatformBadge.tsx:44`
(`new blank line at EOF`); esse arquivo não foi alterado nesta parcela.
