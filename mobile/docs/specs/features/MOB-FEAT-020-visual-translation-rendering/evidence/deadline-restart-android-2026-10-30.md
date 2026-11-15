# Deadline, recuperação de snapshots e perfil Android — 2026-10-30

Estado desta parcela: correções, pacote Linux e rodada GCS com o JAR
definitivo verificados; recursos cloud retirados e ausência confirmada. A 020 continua `in-progress/open`. Este
registro não altera requisitos nem habilita gateway, uploads ou providers.
A 021 permanece `implemented` e sua implementação foi preservada.

## Divergências reproduzidas e corrigidas

| Reprodução anterior ao fix                                                      | Correção e prova                                                                                        |
| ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Original, OCR e tradução ignoravam interrupção, embora respondessem a `close()` | Timer registra e fecha somente o stream ativo, fora do monitor do deadline; três regressões red/green   |
| Executor terminava enquanto o timer ainda fechava o stream                      | Fechamento serializado; posse mantida até `close()` terminar, com regressão red/green                   |
| Timer terminava antes do render e permitia execução além do prazo do original   | Timer também durante render/uploads, até o deadline original imutável; regressão red/green              |
| Segunda JVM admitia inspeção mantendo snapshot abandonado pela primeira         | Diretório privado com lock de processo, recuperação antes da primeira admissão e prova entre JVMs reais |

São **70 testes focados**, zero falhas/erros/skips: `OriginalReadDeadlineTest`,
`ProcessRenderingTaskUseCaseTest`, `MediaInspectionServiceTest` e
`MediaInspectionRestartTest`. Os seis casos de reinício incluem processo
ativo, recuperação depois de término, exclusão recusada, symlink, entrada
inesperada e legado sem posse demonstrável. Vizinho externo preservado.

A política e seus limites estão em
[recuperação de snapshots](../../../../../../api/apps/translation-gateway/docs/rendering-snapshot-recovery.md).
Nenhum schema, migration, requisito de qualidade, prazo ou default cloud mudou.
Snapshot fica no scratch privado; o namespace contém somente o lock de zero
bytes após cleanup. O harness deixou de confundir esse diretório vazio com
conteúdo residual e continua recusando qualquer outro temporário de tradução.
A primeira falha desse inventário foi preservada, sem ocultar o diagnóstico.

## Pacote atual e worker Linux

JAR definitivo: SHA-256
`7f86d55990d1ed0bc24696eed08e5f5a05af975e2ffd52cc7a9645b4048bf350`.
O agregado de 203 arquivos de `src/main` e POMs é
`1e3808969844e0b242b22e03edfb1d20b0d5bb6a32cc025f13cd27c5f0ecc344`;
manifesto individual preservado na rodada local.

Imagem ARM64 local: `sha256:fb847ce72a2a371e8f76214bf138a9685793e61c4a057040fe6fef7c6566a066`.
Preparador existente, JAR/codec fixados, build sem rede ou pull. O gate confere
que o JAR contém as classes/resources atuais. Renderer e PostgreSQL reais,
providers falsos, rede Docker interna, nenhum serviço público.

| Cenário atual                         | Resultado                                                                         | Pico agregado do cgroup |
| ------------------------------------- | --------------------------------------------------------------------------------- | ----------------------- |
| Entrega privada pequena               | READY, downloads íntegros, dois ACKs e uma intenção concluída                     | 498.962.432 bytes       |
| Falha controlada de endereço da filha | FAILED sem artefatos, filha encerrada, página seguinte READY                      | 1.124.773.888 bytes     |
| Scratch esgotado                      | zero espaço útil observado, FAILED sem artefatos, cleanup e página seguinte READY | 869.314.560 bytes       |

Três testes executados, zero falhas/erros/skips. Cap de 8 GiB, swap extra zero,
PIDs 64, scratch tmpfs 512 MiB, AS pai/filha 3 GiB; zero OOM kills. A imagem usa
Temurin 25.0.4.1+1 e codec fixado. Não é aprovação de segurança dessa base nem
admissão do baseline Cloud Run de 1 GiB. A prova x86 de três máximas 80 MP,
pico 1.533.161.472 bytes, e timeout/cancelamento anteriores são reaproveitados
com seus ambientes e hashes na [rodada anterior](cloud-priority-validation-2026-10-30.md).

## Android: aquisição e leitura de 40 MP

AVD existente `Medium_Phone_API_37.0`, Android 17 ARM64, 2 GiB, modo somente
leitura, sem salvar snapshot e renderer gráfico por software. APK debug
SHA-256 `1b1accf5de0aba5106fe92027231d68471fbc1944911072694a41e558e94508e`.
Componentes atuais da aquisição e do leitor, servidos pelo Metro loopback;
sem alterações no runtime mobile. Harness derivado da prova da 021, com
entrada direta no leitor atual, sem publicar rota ou configuração de produto.

Fixture controlada Pillow 12.3.0: PNG 5.000 × 8.000 (40 MP, limite aceito pelo
mobile), 148.791 bytes; WebP lossless 18.466 bytes, zero regiões. É controle
sintético de aquisição/decodificação, não saída alegada do renderer do gateway.
O original tem SHA-256
`aeeb69353f0cf6aa53c50ac08ab85e1d6840243f8146efe7db7533abc9e09b05` e
WebP `0f29f78d86180efb4deacbed7eda1904a673e521ca1d753481e73e57fb3423ca`.

O PID 8672 realizou aquisição nova, dois downloads simulados, hash, staging,
validação nativa e commit `REMOTE/READY`. SQLite v9, FK habilitada e zero
violações; abertura única confirmada. A coleta começou no arranque e reuniu
45 amostras durante 43,95 s. O kernel registrou **VmHWM 848.548 KiB
(828,66 MiB)**; maior PSS amostrado **646.956 KiB (631,79 MiB)**. PSS amostrado
não é pico exato. O mesmo PID exibiu a imagem, executou dois swipes e manteve
o VmHWM, com confirmação nativa de carga e captura visual conferida.

Limites: APK debug, Metro, AVD/graphics software, fixture compressível e uma
sequência; não extrapola para release, aparelho físico, todos os formatos ou
pior caso de bytes. O decoder de validação usa o limite existente de 2048 px
para sua representação de inspeção; os arquivos e seus hashes/dimensões são
preservados. Houve ANR de System UI no boot do emulador; não foi atribuído ao
app. Tentativas com host Metro/rota incorretos foram preservadas; a prova final
usa os componentes originais, sem a cópia diagnóstica de callbacks.

A aprovação visual de Ruan das sete fixtures em 28/10 foi reaproveitada sem
solicitar nova aprovação ou estendê-la a outras páginas.

## GCS atual, gates e retirada

A rodada `mob020-1030-062ae242` usa o JAR definitivo, codec x86 preservado,
fixture pequena e providers falsos. Preflight de 30/10 confirmou billing,
quota, máquina 16 GiB, IAM inalterado e ausência inicial de recursos mob020.
Permissões de bucket foram verificadas no bucket novo antes dos demais
recursos. Cotação oficial por região: E2 2 CPUs/16 GiB US$ 0,1434924/h,
disco Standard US$ 0,06/GiB-mês, GCS Standard US$ 0,035/GiB-mês, registry
US$ 0,10/GiB-mês, sem presumir créditos. A reserva total é US$ 6 incluindo
a estimativa anterior US$ 2,96; parada preventiva US$ 15 e teto US$ 20.
A retirada foi confirmada em 2026-10-30T16:39:17.871315Z: zero VMs, discos,
imagens, contas, buckets, redes/subnets e registries da rodada; IAM do projeto
inalterado. A VM ficou provisionada por no máximo 0,1301 h, incluindo operações
de criação/exclusão. Infraestrutura nova: limite estimado US$ 0,019; com US$ 2
de provisão para operações/transferência e a estimativa anterior, o total
conservador acumulado é US$ 4,98. Não há confirmação contábil em tempo real.

Maven global da fonte definitiva passou nos sete módulos, zero falhas/erros.
Node do gateway: 153 passaram e um opt-in ignorado. Web `tsc -b` e FSD com
polling passaram. Gate mobile/documental final aprovado: 121 suítes e 953 testes, com specs,
links, tipos, lint, FSD e formato.

## Pendências que esta parcela não transforma em aceite

Stream que ignora interrupção **e** fechamento continua retendo posse até
retornar. Exclusão recusada não é cleanup concluído. Falta comprovar a garantia
absoluta de remoção GCS até o deadline: a observação anterior confirmou seis
gerações removidas **966 ms após** 3.600 segundos reais, sem scheduler testado.
Expiração da URL e cancelamento não substituem ausência observada das gerações.
O [lifecycle GCS](https://docs.cloud.google.com/storage/docs/lifecycle) é
assíncrono; a [consistência de delete](https://docs.cloud.google.com/storage/docs/consistency)
só comprova ausência depois de um delete bem-sucedido, e
[retries/timeouts](https://docs.cloud.google.com/storage/docs/retry-strategy)
não fornecem prazo máximo para sucesso. Não foi inventada tolerância de atraso,
abreviado o prazo para simular conformidade ou alterada a spec.

Os recibos locais ficam em `.local/mob020-completion-20261030/` e
`.local/mob020-current-gcs-20261030/`, sem credenciais ou URLs assinadas.

## Resultado GCS com o JAR definitivo

VM `1589916485626198830`, COS 125 `cos-125-19216-760-20`, x86_64,
kernel 6.12.113+, Docker 27.5.1, cgroup v2. Sem IP público, regra de ingresso,
SSH, IAP, NAT, Cloud SQL ou Cloud Run. Identidades sem chave e políticas
restritas ao bucket/registry/signer novos. Vida máxima de 14.400 s e reinício
automático desabilitado; exclusão explícita incluiu o disco de boot registrado.

Worker publicado por digest
`sha256:64ba23d43772fafbb4f66df0bfce7d1dd31ed9d3ef92e365aaf8367267c2156c`,
com o JAR 7f86d559… e manifesto x86
`0103ab2d4d789b5244371bbb276550a81a77797c583591b008fdba64f683dae5`.
O registry privado foi removido após a coleta; o digest é identidade histórica,
não uma referência que permanece disponível para produção.

Entrega real: READY; sessões ausentes e proprietário diferente recusados;
consulta autenticada; downloads HTTPS com SHA-256, bytes, MIME, dimensões e
vínculo job/manifesto/imagem. Assinatura adulterada foi negada, assim como GET
sem assinatura. Após o primeiro ACK 202, todas as gerações autorizadas estavam
ausentes antes de manutenção explícita. Repetição retornou 202 com uma única
intenção; vizinho preservado; URLs anteriores ainda válidas passaram a negar
os downloads. Pico agregado do worker: 608.665.600 bytes, sem OOM.

Falha de exclusão injetada retornou ACK 503, preservou objetos e uma intenção
pendente no PostgreSQL. Após o retry real de um minuto, outra JVM executou a
manutenção de produção e um terceiro processo verificou duas intenções
concluídas, zero pendentes, oito referências ausentes e vizinho preservado
através do reinício. Pico nessa execução: 602.439.680 bytes. Contador OOM do
host permaneceu zero antes/depois. Etapas de entrega, diferimento e recuperação
e recibo terminal: PASS, sem lacunas no transporte serial verificado por hash.

A prova não reexecuta o período real de uma hora: essa observação anterior é
preservada com seu atraso de 966 ms e suas limitações. Também não transforma
cancelamento cooperativo em exclusão pontual ou admite outro ambiente.

## Comandos e recibos

A partir de `api/`:

```bash
./mvnw -o -pl apps/translation-gateway -am test -Dtest=OriginalReadDeadlineTest,ProcessRenderingTaskUseCaseTest,MediaInspectionServiceTest,MediaInspectionRestartTest -Dsurefire.failIfNoSpecifiedTests=false
./mvnw -o -pl apps/translation-gateway -am package -DskipTests
./mvnw -o test
node --test apps/translation-gateway/scripts/*.test.mjs
```

O harness de imagem selecionou explicitamente os três métodos ARM64 de
entrega/ACK e falhas de memória/disco em `NativeRenderingWorkerImageLinuxTest`,
com `renderer.native.image.enabled=true`, ID fb847ce7… e pin do codec
bfe9572c…. Docker sem rede no build; PostgreSQL e worker em rede interna no
teste. Na VM, startup controlado usou os mesmos guards de CPU/RAM/PIDs/AS e
scratch, metadata credentials e somente fixtures/providers sintéticos.
Não houve chamada cobrada de OCR/tradução, troca de ADC ou publicação da feature.

Web: `pnpm --filter toonlira exec tsc -b` e
`CHOKIDAR_USEPOLLING=1 pnpm --filter toonlira lint:fsd`, ambos exit 0.
As versões falhas e os relatórios pontuais/offline anteriores do Android foram
preservados; a medição final está em `android-measured/`.

Recibos SHA-256 desta rodada GCS:

- `cloud-results/acceptancegcs/resource-metrics.json`: `79c472023b0d34be5e3579f34de9b9ccc51835533c0ff88cb8e549a76aa37dcc`.
- `cloud-results/acceptancedeferred/resource-metrics.json`: `9a8ef382c016e3cbc08572ff7663376576e96d0ff1538e5260d0371dcb79f005`.
- `cloud-results/acceptancerecovery/cleanup-recovery-result.json`: `1de31414a739d895246072e7459d10dc69d7801d7cb9651f1dac0fb1c4ab836c`.
- `final-cloud-audit.json`: `c15579ece5f4cdc504b74d0865ec5a99d8635dfbd9bc65ba96131988cfd0d1cd`.
- `cost-final.json`: `062d348411666f002e701cc3601248c692652cb809534dfec1f4a0843541ac6b`.
- `serial-cursor.json`: `f939bedf94c179d7e29eca0a1957acb7ba1b0900a10e690f9ff301b9fcfe401e`.

## Admissão humana do orçamento — 2026-10-30

Após conferir as medições, Ruan respondeu **«Admitir somente nesse ambiente
verificado»** para 2 CPUs/8 GiB no worker em VM privada e2-highmem-2 de 16 GiB,
cgroup privado, swap zero, PIDs 64, AS pai/filha 3 GiB e scratch 512 MiB,
mantendo defaults e implantação desabilitados. O aceite cobre o orçamento no
ambiente e guards explicitados, com os insumos/medições registrados; não é
admissão do baseline 1 GiB, de Cloud Run ou da garantia de retenção AC-005.

A TASK-008 pode ser encerrada após a revisão dessas evidências e desse aceite.
TASK-006 continua aberta e a 020 continua `in-progress/open` com 7/8 tasks;
021 `implemented`. O recebimento desse aceite não criou, publicou ou habilitou
recursos adicionais. O recibo textual está preservado na rodada local.
