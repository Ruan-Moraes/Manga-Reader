# Scripts e dimensões sintéticos no worker — 2026-10-08

Parcela de TASK-002/007/008, AC-001/002/003/004/005/006. Não altera runtime,
codec, políticas, caps, infraestrutura ou qualidade. Só harness/fixtures/testes
e governança. 020 `in-progress/open/changes-requested`, 021 `approved/blocked`.
Nenhuma mídia real/privada, aquisição externa, credencial, Google, pagamento,
deploy ou mobile runtime.

## Lacuna e casos

O worker admitido já havia processado PNG de 80M pixels com texto ASCII.
JPEG/PNG/WebP e fontes tinham provas de componentes; isso não equivale a
todos os formatos/scripts/dimensões no pipeline completo. Este incremento
preserva essa distinção e amplia o PNG no worker real com providers falsos.

SyntheticWorkerText reutiliza os sete códigos do domínio, sem aliases.
Fixtures incluem acentos, quebras, japonês, hangul e chinês simplificado/
tradicional distintos. Gerador cria tamanhos exatos em UTF-16; não corta nem
normaliza resposta de provider. Oito testes leves verificam códigos, variantes,
tamanhos, conteúdo e recusa sanitizada. RED de compilação precedeu o helper;
novo método da fixture também foi exigido antes de implementação.

| Matriz              | Imagem                                        | Texto/resultado exigido                                                              |
| ------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------ |
| Limites por destino | PNG RGB multicolor 10.000 × 8.000, 80M pixels | 1.024 regiões × 256/512 e 64 × 4.096/8.192; texto inteiro/IDs/ordem/par no manifesto |
| Pintura por destino | mesmo PNG 80M                                 | uma região, 16/32 caracteres; overflow zero e imagem diferente do controle vazio     |
| Máxima largura      | 12.000 × 6.666, 79.992.000 pixels             | ambas formas de limite textual                                                       |
| Máxima altura       | 6.666 × 12.000, 79.992.000 pixels             | ambas formas de limite textual                                                       |
| Uma linha           | 12.000 × 1                                    | vazio sem tradução e uma região com fallback inteiro                                 |
| Uma coluna          | 1 × 12.000                                    | vazio sem tradução e uma região com fallback inteiro                                 |

12.000 × 6.667 ultrapassaria 80M: não é reduzido silenciosamente para entrar
na política. A matriz usa a maior dimensão inteira compatível com 12.000.
O caso quadrado/retangular 10.000 × 8.000 conserva exatamente o teto de pixels.
Fixtures são geradas por linha, sem raster completo no JVM que supervisiona.
Formato real, SHA-256, bytes e dimensões são revalidados antes da reserva.

Na amostra de limite, muitas quebras obrigatórias excedem a altura da caixa.
READY com texto íntegro em fallback não prova pintura de glyphs. Por isso
os controles de texto que cabe são separados e exigem overflow=false.
Nenhuma coordenada, fonte mínima, algoritmo ou texto foi ajustado pelo ID
da amostra; não redimensiona a mídia ou diminui limite/qualidade para passar.

## Ambiente e invariantes

Mesma fábrica/preparação/admissão de produção: worker privado frio com cap
real 3 GiB no pai, filhas normais 3 GiB, uma CPU, swap zero, 64 PIDs, tmpfs
512 MiB e cgroup 8 GiB diagnóstico. RAM cloud permanece 1 GiB/defaults disabled.
SQL PostgreSQL 17 privado separado, storage local, render/libwebp/fontes reais,
OCR/tradução falsos e layout disabled. Sem ADC ou rede Google. Java 23.0.2+7,
pacotes/imagens locais pinados; não instala/puxa dependências durante teste.

Cada job só é sucesso após READY, três etapas SUCCEEDED, imagem/manifesto
com hashes correspondentes, conteúdo completo por ID, original reutilizável
inalterado e staging limpo. Reentrega não chama providers novamente. Resultados
privados READY continuam retidos por ACK/TTL; staging não é armazenamento
canônico. Zero OOM e metadata numérica conferidos pelo kernel, sem inventar zero.
Rotas públicas inacessíveis e ausência de listener HTTP real são revalidadas.

## Observações parciais antes da consolidação

Primeiro reactor terminou exit 0: 30 testes, zero failures/errors/skips.
Oito leves e onze execuções por alvo (sete idiomas/duas formas textuais e
quatro dimensões), total 44 jobs READY. Nenhum OOM, original/hash/texto/
ordem/cleanup/reentrega conferidos. x86_64 é emulação local, não Cloud Run.

Essa primeira execução usa o snapshot intermediário de 354 arquivos,
`1877d15bd88c902e11d08da259734518a4b9866d8aee7beaefb209b084e17cfb`.
Controles novos de pintura/metadata de overflow foram acrescentados durante
o reactor sem recompilá-lo ou executar Maven concorrente. Seus resultados
não foram retroativamente atribuídos ao primeiro snapshot.
Após capturar os 22 relatórios JSON e contagens XML, o novo source foi
compilado e iniciou a rodada de pintura. Primeiro japonês/inglês/espanhol
ARM64 passaram com overflow zero. Segundo reactor terminou exit 0: 22 testes,
zero failures/errors/skips, oito leves reexecutados e 14 workers pintados
(sete destinos por alvo), todos READY e sem overflow. Source atual já
compilado nessa rodada: 354 arquivos,
`c17871c6edadf03bcc9e57a0fbccacdf24e1db20d75e1d01ae47127f124759b5`.
Não atribuir os 30 casos do snapshot anterior retroativamente a este hash.

| Dimensão ARM64 | Bytes original | Pico cgroup (bytes) | Tempo total (s) |
| -------------- | -------------- | ------------------- | --------------- |
| 12.000 × 6.666 | 6321928        | 2357354496          | 75,120          |
| 6.666 × 12.000 | 10292940       | 2576007168          | 75,797          |
| 12.000 × 1     | 925            | 614924288           | 15,108          |
| 1 × 12.000     | 1071           | 567259136           | 15,413          |

| Dimensão x86_64 emulada | Bytes original | Pico cgroup (bytes) | Tempo total (s) |
| ----------------------- | -------------- | ------------------- | --------------- |
| 12.000 × 6.666          | 6321928        | 2670002176          | 170,860         |
| 6.666 × 12.000          | 10292940       | 2833010688          | 181,738         |
| 12.000 × 1              | 925            | 963555328           | 58,229          |
| 1 × 12.000              | 1071           | 906301440           | 61,512          |

Saídas de cada dimensão coincidiram entre alvos. Nos limites de texto, os
marcadores geram as mesmas imagens, mas cada manifesto conserva o texto
sintético distinto por destino; isso não comprova glyphs pintados. As duas
formas têm 262.144/524.288 unidades UTF-16 fonte/destino, sem truncamento.

Observações individuais de bootstrap+jobs, não SLA ou aprovação de consumo
total operacional. Controles pintados usam uma região e 32 caracteres; nenhuma
passou apenas por fallback. Saídas têm hashes iguais entre alvos e diferentes
do controle sem regiões. Fontes/compositor reais foram inspecionados; comparação
por todos os pixels de componentes é evidência separada, não uma revisão
visual/linguística humana das páginas máximas.

| Destino | Pico ARM64 (bytes) | Pico x86_64 emulado (bytes) | SHA-256 WebP igual nos alvos                                       |
| ------- | ------------------ | --------------------------- | ------------------------------------------------------------------ |
| ja      | 2419216384         | 2744475648                  | `84baccfe1d904bb9c21acb0ee2f84b4f45b176f7f87d539d520bf6ceb04b6faa` |
| en      | 2304057344         | 2753667072                  | `7403771be3fe2765c153ddc1148e42146fd1d1509b582da7226d925185f9b0f2` |
| es      | 2354180096         | 2631544832                  | `af9ce021ad82740b0d4e0b27ef40ca683583ca21f7ef22bf0f630c6ef16b772d` |
| ko      | 2439741440         | 2656722944                  | `f9279b09fe2dfd38a10c1518b7b97ec6efdb8ac3f13a9133c9fd426389ecb1a0` |
| zh-Hans | 2477948928         | 2654433280                  | `220433f33d1e27577cddbde5e064514df33ca6188cb98bbc239dee4107cc52b9` |
| zh-Hant | 2460151808         | 2648596480                  | `473606a8b0507adde5f2abb1a96cee8a4c2d24441018aa29d9c7e64093e250a1` |
| pt-BR   | 2460430336         | 2667356160                  | `21a81232ab118d2db0183c23a2ad05979eef47e79308407f270deda5d9328cd3` |

As duas rodadas observaram 58 READY em 36 workers: 44 na matriz de limites/
dimensões e 14 pintados. Os oito testes leves foram reexecutados na segunda
rodada, não contam como nova capacidade do produto. Todos sem OOM e sem
segunda chamada aos providers. Códigos/variantes/textos/ordem/IDs permanecem
íntegros nos manifestos; nenhuma mídia é redimensionada.

Observações individuais de bootstrap+jobs, não SLA ou aprovação de consumo
total operacional. JPEG/WebP máximos, SDKs/layout residentes, interleavings/
retenção integral, qualidade/revisão humana e operação continuam pendentes.
Não usar esta matriz sintética como referência linguística real ou benchmark
independente das 18 amostras. Performance mobile N/A: apenas governança alterada.

## Reprodução e rastreabilidade

Em `api/`, usar Maven offline/reactor e os pins locais da
[prova de timing](rendering-admitted-timing-2026-10-08.md). Selecionar
SyntheticWorkerTextTest e métodos `admittedWorkerCompletesBothUnicodeTextLimitShapes`,
`admittedWorkerCompletesMaximumAndOnePixelDimensionShapes`,
`admittedWorkerPaintsFittingUnicodeTextAtMaximumPixels` da NativeRenderingWorkerLinuxTest;
AMD64 usa os mesmos nomes com prefixo `admittedAmd64Worker`.
Não baixar imagens ou acionar utilitário de aquisição/OCR real.

Snapshot técnico source/tests/config atual: 354 arquivos, receita paths relativos
ordenados + NUL + bytes + NUL, SHA-256
`c17871c6edadf03bcc9e57a0fbccacdf24e1db20d75e1d01ae47127f124759b5`.
JAR de produção inalterado:
`9d0c63570e85fe6ed55f22bd3f5d81c15d9f3284d4c19a67543687d7b8e99131`.
Históricos 66e42dbb…eab3 e 1877d15b…7cfb permanecem fotografias anteriores.
Checksum mobile separado será registrado em review/drift, que são excluídos
do hash; não inseri-lo na evidência autorreferente.

Node: 92 pass/um opt-in não selecionado/zero failures. Web `tsc -b`: exit 0.
Global Maven offline/Docker está em execução; suíte leve e check mobile
integral serão registrados após término e estabilização na [review](../review.md).
SDD/links/formatação dirigida/diff exigem aprovação observada; não presumir
que green padrão com opt-ins não selecionados aprova extended integral.
TASK-002/006/007/008 ficam abertas; performance mobile N/A.
