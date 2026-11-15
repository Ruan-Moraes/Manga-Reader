# Matriz nativa local do renderer volátil — 2026-11-01

## Escopo e resultado

Oito cenários passaram, com 22 renderizações sintéticas autorizadas, codec real
WebP lossless/exact e filha JVM Linux. Nenhum cenário registrou OOM ou arquivo
regular de conteúdo no diretório de trabalho verificado ao término. O teste
compara pixels fora da região de pintura em uma segunda JVM independente,
reusando um único raster nativo. A entrada sem regiões é comparada integralmente.
Nos sete destinos pequenos, o teste exige pintura real, fonte acima do mínimo
e ausência de overflow; não se limita a conferir metadados.

Esta é prova isolada do renderer e IPC. Não exercita o endpoint HTTP inteiro,
PostgreSQL, providers, produção ou aparelho. Não aprova AC, status ou gate da 020. A versão anterior do pipeline não foi usada como prova de ausência de I/O.

## Identidade da candidata

- Imagem local: `sha256:37f9827620b16c8f0b2ec38aad39c68b4355000a53a64ff229f7b1497df02838`.
- JAR da imagem: `4b94748943f44070e09f3859ac840997550efbd339d784926f193a9ea9a568a4`.
- Manifesto do pacote ARM64/glibc: `bfe9572c3113f805c15634c8e3106b74a2b925735767424269b5e81fc46a3a58`.
- Runtime: Java `25.0.4.1+1-LTS`; filha com heap de 256 MiB.
- Limites locais: memória agregada 8 GiB, swap zero, pids 64 e scratch 512 MiB.
- Evidência operacional local: `.local/mob020-volatile-20261101/native-candidate-1-matrix-3/`.
  Contém log Maven, XML/texto Surefire, métricas e hashes individuais das fontes
  do renderer/probes. Esse diretório local é recibo da rodada, sem mídia do usuário.

O JAR é a candidata desta prova. Alterações posteriores na orquestração HTTP,
recibos ou cliente não são executadas retroativamente por ela. A prova final
do serviço combinado deve vincular sua própria imagem e configuração.

## Medições

| Cenário        | Dimensões    | Renderizações | Pico agregado em bytes | Arquivos de conteúdo ao fim |
| -------------- | ------------ | ------------- | ---------------------- | --------------------------- |
| sete destinos  | 320 × 220    | 8             | 560074752              | 0                           |
| PNG 80 MP      | 10000 × 8000 | 2             | 1514455040             | 0                           |
| JPEG 80 MP     | 10000 × 8000 | 2             | 1434304512             | 0                           |
| WebP 80 MP     | 10000 × 8000 | 2             | 1481969664             | 0                           |
| 12.000 × 6.666 | 12000 × 6666 | 2             | 1367539712             | 0                           |
| 6.666 × 12.000 | 6666 × 12000 | 2             | 1396899840             | 0                           |
| 12.000 × 1     | 12000 × 1    | 2             | 337420288              | 0                           |
| 1 × 12.000     | 1 × 12000    | 2             | 337678336              | 0                           |

O pico máximo observado foi 1.514.455.040 bytes neste ambiente sintético.
Isso não altera automaticamente a admissão de RAM do serviço público combinado.
`memory.oom.group=0` corresponde ao supervisor privado com morte preferencial
da filha, e não representa uma afirmação de isolamento por heap.

## Reprodução

Na raiz `api/`, após preparar a imagem local e compilar os probes de teste:

```bash
./mvnw -o -q -pl apps/translation-gateway -am surefire:test \
  -Dtest=VolatileNativeImageLinuxTest -Dsurefire.failIfNoSpecifiedTests=false \
  -Drenderer.volatile.image.enabled=true \
  -Drenderer.native.image.arm64.id=sha256:37f9827620b16c8f0b2ec38aad39c68b4355000a53a64ff229f7b1497df02838 \
  -Drenderer.glibc.arm64.sha256=bfe9572c3113f805c15634c8e3106b74a2b925735767424269b5e81fc46a3a58 \
  -Drenderer.linux.docker.host=unix:///Users/ruanmoraes/.orbstack/run/docker.sock
```

O preparo de JPEG/WebP escreve apenas fixtures sintéticos do lado do harness,
fora da execução do servidor. Não integra o JAR de produção. O WebP usa o mesmo
codec fixado sem CLI externa; o teste real recebe a entrada montada readonly e
usa apenas memória/pipes para conteúdo. Duas rodadas anteriores falharam no
preparo desses fixtures e não foram contadas como matriz aprovada; seus logs
foram preservados separadamente.

## Pendências

- Falhas e timeout do novo processo real, perda de entrega, encerramento e
  capacidade sob chamadas não cooperativas no pipeline combinado.
- Integração HTTP/SQL/SDK inline e budgets completos da imagem final.
- Qualidade linguística e visual independente, inclusive comportamento do
  Vision acima de 75 MP; equivalência raster não prova qualidade de OCR.
- Aquisição/commit/reader pela nova resposta direta e validação no aparelho.
- Admissão e políticas do ambiente alvo; nenhuma chamada paga ou implantação
  foi feita nesta rodada.
