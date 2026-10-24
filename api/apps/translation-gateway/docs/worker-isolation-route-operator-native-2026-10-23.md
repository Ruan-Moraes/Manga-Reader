# Operador com barreira pareada — 2026-10-23 UTC

Continuação do [candidato offline da barreira](worker-isolation-route-barrier-offline-2026-10-23.md).
O novo operador foi integrado e preparado com dados financeiros atuais. Uma
tentativa nativa restrita parou no pré-flight, sem reserva ou recurso criado.
Não há admissão do worker completo nem promoção da 020/021.

## Integridade e escopos anteriores

O plano foi registrado antes do código conforme `database-design`: sem banco,
migration, índice, contador ou alteração de valores. Reutiliza ledger privado
em centavos/USD e os journals existentes; novo diretório, sem adotar contextos
ou locks anteriores. Mantém verificação serial e fresca da reserva.

A sétima rodada retirada é agora validada por recibos/SHA fixos: CAS5 selado,
sete criações/exclusões terminais ligadas aos mesmos alvos/IDs, VM sem dispatch,
rota efetivamente removida e onze últimas observações de ausência 404. A rota
é reconstruída pelo contrato e conferida contra o hash do plano original, não
inventada por nome. O lock da execução retirada deve estar ausente.

Essas onze referências somam-se às 53 anteriores: **64 GETs de ausência**, cinco
metadados e duas quotas, total **71 GETs antes da reserva**. A guarda histórica
da primeira rodada permanece. Recibo local não substitui essas leituras atuais;
qualquer alvo presente ou observação vencida impede reservar.

## Grafo selecionado e gates

O nativo usa o grafo de barreira pareada de 52 fontes, selado em 58 testes.
Os pins históricos do dispatch anterior são conservados como antecedentes,
não como seleção daquele caminho. Metadados, reserva, cancelamento, CAS/grant,
ausência de retry e retirada permanecem obrigatórios. Timers de 10 s/30 s e
ticket de 1.000 ms não foram ampliados.

O núcleo foi selado de 00:15:06.877 a 00:16:17.760 UTC: **167/167 testes**,
zero falhas/skips/cancelamentos e 195 fontes reconferidas. Launcher: mais três
testes, 146 fontes. A integração usa CAS Java, leitor financeiro real em cópia
temporária do ledger e HTTP/identidade/preços sintéticos. Nenhuma reserva real
ou chamada cloud durante os gates. Os 419 fontes Java/config/teste do gateway
permanecem iguais.

A primeira execução encontrou 15 falhas causadas por data e ID inconsistentes
na fixture sintética. A fixture foi alinhada ao dia planejado; o validador de
staging não foi relaxado. O TAP da falha foi preservado, e os 24 casos focalizados
e a suíte integral passaram depois. Não houve redatação de evidência real.

| Recibo privado     | SHA-256                                                            |
| ------------------ | ------------------------------------------------------------------ |
| Núcleo do operador | `6abc7ce9ce5df91256f0f9a7861210141136c6dcd6c576df328a83ce1c7af01a` |
| Launcher           | `0b62e7d933461d606ef628721e0423445d4439bb103626c3010e40b1f3a82e8c` |
| Preparo local      | `6dde17a0004f9c8196a703f045db6d88eef1382c0ea3df658a4c9181c2874d78` |
| Auditoria prévia   | `35914e8fc1a148e8f0c42101025616bba85bccded9498835a0a43f3f1e7a4dc6` |

Maven global offline/Docker, type-check web e `pnpm check` integral da
[continuação anterior](worker-isolation-route-barrier-offline-2026-10-23.md)
foram reconferidos como evidência recente com fonte de produto igual; não se
alega nova execução desses gates neste intervalo de integração.

## Preparação financeira

Um pacote novo recebeu somente os bytes locais pinados do leitor API, com
dependências relativas preservadas. Os 143 hashes foram reconferidos. Recibos
e TAPs históricos foram copiados como históricos, sem alegar testes reexecutados
ou instalar software. As capturas antigas expiradas não foram adotadas.

A captura atual fez 14 GETs 200 de preços, mais dois GETs 200 de billing, usando
a identidade existente, sem chave/grant novo, recurso ou reserva. A janela
observada começa às 00:17:09.317 UTC; validade até 01:17:09.317 UTC. O cenário
conservador estimou USD 2,11, sem comprovar fatura, impostos reais ou hard cap.

O preparo local passou às 00:17:56 UTC, sem usar credencial ou criar rodada;
a auditoria prévia passou às 00:18:35 UTC. A configuração liga por SHA os dados,
billing e recibo API. O ledger ainda tinha sete reservas, USD 35 reservados,
antes da prova. A autorização total continua USD 100, não um limite imposto
pelo Google. Nenhum estorno automático.

## Limites da prova e pendências

A prova isolada usa o mesmo perfil N1/COS de montagem e uma reserva de USD 5,
com retirada ao final e sem repetir criação. O upload previsto é do arquivo
técnico de prova para staging privado, não de páginas para OCR/tradução.
Não presumir sucesso por obter resposta de API: essa tentativa não chegou ao
runtime de criação.

## Resultado: imagem fixada depreciada

Tentativa `mount-check-20261023-05b7263c`, de 00:18:44 a 00:18:49 UTC. Resultado
`phase=prerequisites`, sem entrada no runtime, reserva ou operação de criação.
Captura do runtime vazia, `requiresRecovery=false`, `safeToUnlock=true`; o dono
removeu seu lock. Não houve staging a retirar. O ledger continua com sete
reservas e USD 35 reservados. O campo conservador `source419Unchanged=false`
do resultado indica que a reconferência final do fluxo não foi alcançada;
a reconferência independente posterior confirmou os 419 fontes iguais.

O helper não havia sido registrado antes da recusa do wrapper; por isso os
GETs exatos daquele pré-flight não foram capturados e não são apresentados como
observação detalhada. O leitor está limitado a cinco GETs. Um diagnóstico novo,
somente leitura, registrou três GETs 200: projeto e metadados passaram, mas o
contrato da imagem COS foi recusado. Identidade, SDK e fontes passaram.

Uma consulta restrita adicional confirmou os mesmos nome/ID/status/arquitetura/
disco da imagem `cos-125-19216-739-16`, agora com `deprecated.state=DEPRECATED`
e replacement `cos-125-19216-760-8`. A [API documenta que DEPRECATED ainda pode
ser usado com aviso](https://docs.cloud.google.com/compute/docs/reference/rest/v1/images);
o bloqueio veio da política explícita do nosso gate, que não foi relaxada.

## Candidata, ainda não instalada ou admitida

A consulta pública de metadados da substituta retornou HTTP 200, ID
`671750716531408064`, `READY`, `X86_64`, disco de 10 GiB e sem objeto de
depreciação. Não foi criado disco/VM ou baixada/instalada imagem. A indicação
do publisher é dado para revisão, não autoridade para trocar o alvo.

As [notas oficiais do COS M125](https://docs.cloud.google.com/container-optimized-os/docs/release-notes/m125)
registram a versão como LTS Refresh de 22/10/2026, kernel 6.12.113, com mudanças
de certificados/agents e correções de segurança. Docker e containerd publicados
mantêm as versões 27.5.1 e 2.2.7. Isso não é auditoria de CVEs ou admissão do
worker completo.

Próximo trabalho: plano e implementação offline de uma revisão explicitamente
pinada para a candidata, incluindo pré-flight, requests, bindings, testes e
reconciliação dos snapshots históricos. Sem fallback por family/latest, troca
silenciosa, alteração do operador selado ou novo execute deste contexto.

020 permanece `in-progress/open`, 021 `approved/blocked`. Montagem restrita não
substitui boot/segurança/CVEs, memória, isolamento, rendering/qualidade ou retenção
do worker completo. Sem provider, upload público, nova instalação, IAM/API,
deploy, alteração mobile ou arquivos de performance.

Continuação: [pin e grafo COS7608 preparados offline](worker-isolation-cos7608-offline-2026-10-23.md).
O resultado acima permanece histórico; nenhum recibo foi reescrito para trocar
a imagem da tentativa recusada.
