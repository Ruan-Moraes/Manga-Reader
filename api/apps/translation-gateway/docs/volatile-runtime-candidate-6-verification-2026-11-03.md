# Candidata volátil 6 — provas locais em 2026-11-03

## Identidade e escopo

- JAR: `fb07569a75535dbfa6db8698ad01f762250207cf097bb13954b28fc3aa244386`.
- Imagem ARM64: `sha256:7a2cbaefd5d9e5f7ca430f0b8312b63d36a2718de1628e2acf1a4740d6e59f62`.
- Imagem AMD64 preparada: `sha256:5b37fd92b99bb2b5dcc480a65cb2c58dd02dad45941a5dd9ea7e65aa99b17c18`.
- Manifesto nativo ARM64: `bfe9572c3113f805c15634c8e3106b74a2b925735767424269b5e81fc46a3a58`.

As execuções abaixo são locais ARM64, com SDKs reais contra gRPC sintético,
PostgreSQL e filha nativa reais. Imagens de entrada são geradas no tmpfs do
cliente separado e enviadas por HTTP; não há mount de imagens no servidor.
Nenhum provider pago, mídia de usuário ou ambiente público foi usado.
A existência de imagem AMD64 não é prova de execução ou admissão Compute.

## Falha c5 preservada e correção c6

A rodada c5 HTTP11 falhou no cenário SIGSTOP/deadline: o cliente atingiu sua
espera de 120 segundos diante do limite nativo de 90 segundos. O resultado
negativo permanece em `/private/tmp/toonlira-volatile-http-native-integration-20261102-11.log`
e na revisão de timeout de 2026-11-02 da MOB-FEAT-020. Os cenários positivos
anteriores não aprovam esse caso nem tornam a rodada11 bem-sucedida.

A c6 acrescenta ThreadFactory ao RenderCallSupervisor e usa worker daemon de
plataforma para o pipe do IsolatedMemoryRenderAdapter. A troca evita depender do scheduler virtual compartilhado para esse I/O
bloqueável. A causalidade de starvation/pinning é hipótese de diagnóstico;
não há dump que estabeleça uma causa definitiva no JDK. O resultado observado
é a passagem do cenário real SIGSTOP na candidata6.
Uma sessão pesada continua admitida por vez, e a capacidade só é devolvida
depois do término/cleanup confirmado do dono. Isso não promete término pontual
sob qualquer falha de kernel.

## Pipeline local combinado da candidata atual

Execução `pipeline-local-20261103-2`, sob `.local/mob020-volatile-20261101/`,
terminou com `VOLATILE_PIPELINE_PROOFS_PASSED` e `VOLATILE_PIPELINE_DONE ... 0`.
Log: `/private/tmp/toonlira-volatile-pipeline-local-20261103-2.log`.

| Prova              | Resultado                                                                                                                                                                                                |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HTTP máximo/falhas | 12 OCR, 11 traduções, 12 recibos; PNG/JPEG/WebP de 80MP, PNG de 12MiB, autenticação, owner, replay, concorrência, morte nativa, falha de AS, SIGSTOP/deadline de 90s e páginas seguintes. Cliente exit0. |
| Recursos HTTP      | Pico agregado 1800118272 bytes; limite 8GiB, swap0, PIDs64, pids.events max0, CPU 200000/100000, AS pai3GiB. Zero OOM/conteúdo/arquivos regulares/jobs legados e nenhuma filha restante.                 |
| Restart real       | Cliente exit0, nova instância de runtime; uma OCR/uma tradução após restart, 14 recibos acumulados, pico 651247616 bytes, sem conteúdo/arquivos/filhas/jobs legados.                                     |
| Matriz nativa      | Oito cenários/22 renders, todos passed, pico máximo 1448869888 bytes, zero OOM/conteúdo. Sete destinos, três formatos80MP, limites de largura/altura e uma linha/coluna.                                 |

Os state.json do cliente HTTP, cliente de restart e oito containers nativos
registram exit0. O servidor foi encerrado ao fim pelo harness: exit143 nesse
state não é o resultado do cliente. A métrica final childAddressSpaceBytes0
significa ausência de filha ao fim, não limite nativo configurado em zero.
Os recibos preservam cada cenário e identidade dos artefatos; não inferir a
mesma medição para outro JAR, arquitetura, host ou implantação.

O integrador confirmou limpeza por label `mob020-local-v6-1103-2`, sem recursos
Docker restantes nas três enumerações da rodada. A limpeza local não substitui
inventário cloud, nem autoriza nova rodada remota.

## Visual c6 e comparação independente

`visual-client-candidate-6-20261103-1/` contém nove respostas e manifestos,
salvos somente pelo cliente separado. O log
`/private/tmp/toonlira-volatile-native-visual-candidate-6-20261103-1.log`
termina BUILD SUCCESS. Nove OCR/oito traduções, pico 801071104 bytes,
pids.events max0 e zero OOM/conteúdo/arquivos regulares no servidor.

O pixel-verification.json registra 8699904 pixels comparados, preservação fora
do OCR e imagem vazia integralmente equivalente. O reviewer conferiu os hashes
e tamanhos dos nove WebPs contra os manifestos e sua igualdade byte a byte
com os WebPs c5 previamente inspecionados. Esse reaproveitamento visual está
justificado pela igualdade dos arquivos; não foi presumido por nome da candidata.

Overflow conserva os 4860 caracteres exatos do fixture, overflow=true e
fontSizePx=0. Os três pontos no raster continuam visualmente fracos; indicação
perceptível e painel integral são responsabilidade da 021. As amostras não
comprovam qualidade de tradução/OCR reais ou legibilidade de qualquer página.

## Recibo consolidado

O integrador arquivou fontes, identidade e resultados em
`.local/mob020-volatile-20261101/candidate-6-local-verification-20261103/receipt.json`.
Os logs temporários citados complementam esse recibo, sem substituir a
proveniência persistida da candidata.

## Gates e pendências

A raiz backend7 terminou exit0: 2863 testes, zero falhas/erros, 116 skips e 470 XMLs
novos, sem relatórios antigos na contagem. Recibo:
`.local/mob020-volatile-20261101/root-tests-20261103-7/receipt.json`;
log `/private/tmp/toonlira-volatile-root-tests-20261103-7.log`, SHA-256
`0f2bbf14575473bc6192aa059ad64735b34a25f3aa0a1ea4176fe8f8c6cd07b0`.
O receipt foi conferido nesta revisão. Fechamento documental/checksum mobile
continua pendente do integrador; nenhum aceite operacional é inferido do gate.

AMD64/COS125/e2-highmem-2 continua sem execução/admissão da composição c6.
A revisão automática rejeitou a preparação de nova rodada cloud antes da
execução por escopo limitado à contenção local. Não houve retry ou criação;
proposta offline não é autorização para provisionar. Exige autorização vigente
explícita antes de mutação, além de inventário/budget atuais. A
[proposta privada concreta](volatile-private-verification-proposal-2026-11-03.md)
está preparada offline, não executada; seu pacote/hashes não constituem aprovação.

O usuário informou apenas Simulador iOS existente no Mac. O framework simctl
existente foi enumerado sem instalar SDK; tentativas DeviceHub/CUA terminaram
por timeout. Nenhum fluxo nativo/offline do app foi comprovado por isso.
Benchmark humano, políticas/provider, ingresso/APM e admissão pública continuam
separados. Esta evidência não aprova produção ou conclusão da MOB-FEAT-020.
