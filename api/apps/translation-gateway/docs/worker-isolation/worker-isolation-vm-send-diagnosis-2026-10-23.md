# Diagnóstico local do envio da VM — 2026-10-23 UTC

Continuação da [prova COS7608 e sua recuperação](worker-isolation-cos7608-operator-2026-10-23.md).
A 020 permanece `in-progress/open`; a 021 permanece `approved/blocked`.
Nenhuma nova execução cloud foi feita neste diagnóstico.

## Fato observado e limite da conclusão

A captura histórica foi reconferida por SHA-256, sem alteração. O único GET
com falha de transporte, às 00:56:15.046 UTC, corresponde exatamente à listagem
agregada de `packetMirrorings`, com os parâmetros originais. Os nove POSTs
capturados continuam sendo sete recursos Compute anteriores à VM e dois
recursos Storage. Não há POST da VM nessa captura.

O fluxo completo contém uma verificação adicional dentro do fetch da VM,
depois do grant: rede → listas completas de rotas/roteadores/espelhamentos →
firewalls efetivos → rede → journal. O teste anterior de latência do driver
HTTP/barreira de rotas não exercitava esse wrapper de `runHttpMountCycle`.

`request-response` abrange essa verificação local, a admissão nativa e o
transporte. Portanto, essa fase e a idade final do ticket não identificam
sozinhas qual limite ou predicado falhou. A causa exclusiva da rodada real
continua não comprovada; não foi atribuída automaticamente ao ticket de 1 s.

## Reprodução e candidato

O harness usa o `verifyScope` real, journals CAS Java reais, identidade e
respostas HTTP sintéticas. Instrumenta somente fases fixas, tempos e contagens.
Não usa ADC, SDK cloud, rede real, mídia ou providers.

| Cenário sintético                             | Resultado                                           |
| --------------------------------------------- | --------------------------------------------------- |
| Controle e escopo final lento ainda válido    | Uma criação vinculada; reentrega não cria outra     |
| Timeout durante escopo final                  | Nenhum POST; grant gasto, sem `NOT_SENT` inventado  |
| Escopo inválido antes do transporte           | Nenhum POST; diagnóstico externo `request-response` |
| Recusa local após escopo, antes do transporte | Nenhum POST; mesmo diagnóstico externo              |

O candidato offline sobrepõe somente a consulta de firewalls efetivos às três
listas independentes de escopo. A fronteira inicial permanece antes de todas;
a final permanece depois de todas, seguida da comparação do journal. Mantém
todos os predicados, prazos, ticket, grant e ausência de retry. O fan-out medido
é limitado a quatro GETs, sem cache. Falha de um irmão aguarda os demais que
já iniciaram; escopo ou firewall inválido continua recusado.

Essa mudança elimina uma leitura sequencial por verificação, mas não é uma
medição de desempenho cloud nem prova de que a próxima rodada passará.
O candidato está em arquivo separado; o grafo do operador continua inalterado.

## Evidência reproduzível

Pacote privado: `.local/worker-isolation/mount-vm-send-diagnosis.8XAxBh/`.
O plano foi registrado antes do código. O RED comportamental contra o código
anterior teve um controle aprovado e quatro falhas de sobreposição esperadas.
O gate estabilizado passou **13/13**, sem falhas, skips ou cancelamentos, com
barreira offline de rede/credenciais. A asserção inicial de duração do timeout
foi corrigida: o prazo de 10 s inclui estado/grant antes do escopo, não somente
a leitura final. Nenhum prazo de implementação foi ampliado.

| Artefato privado                     | SHA-256                                                            |
| ------------------------------------ | ------------------------------------------------------------------ |
| Recibo do gate                       | `9c1a18d8125e5e0c9436db6712c7c61e31c59fcb046a8f346d59d03f66d501d9` |
| Captura original reconferida         | `79235c8d290249e8f9d050b72b7ac3c3c35ce0ed21972150f180494c5f90bcbd` |
| Journal Compute original reconferido | `99e777d3d8861c12b7a6d41b8a616e8e8b5e4fe9ee71a9b54f937b95bebb127d` |

O recibo contém inventário dos fontes e hash do TAP. Reconfere também os 186
fontes do gate COS7608 anterior e os 419 fontes técnicos do gateway. Ledger
permaneceu com oito reservas e USD 40 reservados, não faturados. Nenhuma nova
reserva, instalação, download, chamada cloud ou alteração de runtime Java.
Os gates globais de Maven/web/mobile registrados na recuperação continuam
fotografias daquela execução, não novas execuções deste gate local.

Não repetir o verificador no mesmo diretório: os recibos usam escrita exclusiva.
Para reproduzir, preparar outro diretório de evidências e manter os anteriores.
Capturas, locks, arquivos de performance e o pacote técnico foram preservados.

## Encaminhamento e continuação

Continuação entregue localmente: [grafo separado e testes integrais do coordenador](worker-isolation-vm-scope-graph-2026-10-23.md).
Isso não altera o operador encerrado nem transforma este diagnóstico em prova cloud.

Ao fechar o diagnóstico, foi proposto propagar o candidato e auditar sua seleção
com testes integrais, falhas e cancelamento; essa parcela está no registro acima.
Resta melhorar a distinção sanitizada das fases internas antes de outra prova cloud.
Não reutilizar o operador encerrado ou a cotação vencida. Uma nova prova exige
preparo e admissão frescos; montagem, boot/segurança e worker completo seguem
pendentes. Nada neste diagnóstico habilita uploads ou aprova produção.
