# Layout automático experimental

Extensão própria do gateway, fora do aceite atual da `MOB-FEAT-018`, que permanece
`in-progress`. Não controla tradução, renderização ou estados públicos, nem altera
texto, geometria ou ordem do manifesto OCR `1.0`. Nenhuma rota nova foi criada.

## Configuração e modelo

Default `gateway.layout.mode=disabled`: não abre modelo nem inicializa ONNX.
`grouping` (mesmos requisitos de `shadow`) também deixa os balões detectados decidirem o agrupamento
OCR — ver "Agrupamento por balão" abaixo; `shadow` continua só registrando.
`shadow` exige perfil `worker`, `GATEWAY_LAYOUT_MODEL_PATH` válido e
`GATEWAY_LAYOUT_DIRECTION=ltr|rtl`, sem inferência de direção pelo idioma.
Gateway, OCR e worker cloud continuam desabilitados por padrão.

Modelo não é baixado no startup, nas tasks ou nos testes comuns. Aquisição e
instalação exigem ação explícita. Runtime CPU: `com.microsoft.onnxruntime:onnxruntime:1.24.2`.
Modelo não integra Git, Docker ou Maven; provisionamento operacional permanece aberto.

Autor/modelo: [ogkalu/comic-text-and-bubble-detector](https://huggingface.co/ogkalu/comic-text-and-bubble-detector),
RT-DETR-v2. Licença declarada pelo autor: Apache-2.0. Arquivo `detector.onnx` FP32.

- Revisão: `16e8a622f91fabc6b5b65c96d32d1183f8843546`.
- SHA-256: `065744e91c0594ad8663aa8b870ce3fb27222942eded5a3cc388ce23421bd195`.
- Classes: `0=bubble`, `1=text_bubble`, `2=text_free`; só `bubble` fornece contêineres.
  Desde `layoutVersion=1.2`, `text_bubble`/`text_free` vão para `textBoxes` (mesmo limiar e
  limite de 256) e cada região OCR recebe `regionKinds[].kind` = classe da caixa de texto que
  cobre ≥ 50% dela, ou `unknown`. São só sinais semânticos: não agrupam, não ordenam e não
  controlam o render (ver comparação abaixo).
- RGB, resize bilinear 640 × 640, escala `[0,1]`, sem média/desvio, padding ou crop.
- Limiar `0.5`, experimental; supressão conservadora descrita abaixo, sem correção de coordenadas.
- Entrada `images`: FLOAT `[N,3,H,W]`; `orig_target_sizes`: INT64 `[N,2]`.
- Saídas `labels`: INT64 `[N,K]`; `boxes`: FLOAT `[N,K,4]`; `scores`: FLOAT `[N,K]`.
- O exportador recebe **`[largura,altura]`** para escalar `xyxy`, conforme
  [RTDETRPostProcessor.forward](https://github.com/lyuwenyu/RT-DETR/blob/main/rtdetrv2_pytorch/src/zoo/rtdetr/rtdetr_postprocessor.py).
  Não usar a convenção `(altura,largura)` de outras APIs de pós-processamento.

Hash e contrato de tensores são verificados antes de admitir shadow; nenhuma
substituição automática. Erros nativos não são anexados aos erros de domínio.

## Geometria e artefato

Domínio sem Spring/ONNX; `LayoutPort`/`BubbleDetectionPort` isolam infraestrutura.
Separadores: RGB ≥ 240, cobertura ≥ 99,5%, faixa ≥ 0,5% da dimensão atual,
fragmentos ≥ 2% da área original após remover margens. Maior faixa proporcional
vence; empate horizontal. Árvore de cortes ordena quadros; cortes verticais
respeitam LTR/RTL. Sem corte confiável, nenhum quadro é inventado: `inconclusive`.

Associação usa clipping e área do quadrilátero OCR, não seu retângulo envolvente:
contenção ≥ 90%. Múltiplos candidatos permanecem ambíguos. Todas as regiões são
preservadas, inclusive texto repetido, cenário e onomatopeias. Agrupamento exige
um único balão detectado; não deriva de blocos Vision ou proximidade.

Balões formam unidades de leitura dentro do quadro. Precedência vertical vence;
em alturas sobrepostas, horizontal segue a direção. Sem precedência segura, ordem
pendente. `suggestedOrder` pode ser parcial; `groups.regionIds` preserva a sequência
original. Não há concatenação de texto ou pontuação inventada.

`layoutVersion=1.1`: hashes da imagem/OCR, algoritmo, modelo, parâmetros, direção,
quadros, balões, associações, grupos, ordem sugerida, não associados e ambiguidades.
Acrescenta `suppressedBubbles`: caixa original, `retainedBubbleId`, IoU e motivo
`near-duplicate`. Leitura de artefatos históricos `1.0` permanece compatível;
nenhum artefato antigo é reescrito. O relatório permite ver as caixas suprimidas
separadamente e informa contagens bruta, retida e suprimida.
Sem texto OCR. Estados `complete|partial|inconclusive` nunca significam aprovação
humana. Limites: 128 quadros, 256 candidatos de balão **antes** da supressão,
1.024 associações e 1 MiB incluindo auditoria; falha sem truncar.

### Duplicatas quase idênticas

Revisão `white-gutters-1-dedup-1`, parâmetro experimental `duplicateIou=0.95`.
O domínio valida todos os candidatos antes da filtragem e os ordena por confiança
decrescente, coordenadas `(left,top,right,bottom)` crescentes e ID lexicográfico.
Caixa com IoU ≥ 0,95 em relação a uma já retida é suprimida; se houver várias,
a primeira nessa ordem é a referência. Caixas suprimidas não suprimem outras:
não há fusão transitiva. ID, coordenadas e confiança da vencedora ficam intactos.

A auditoria é revalidada antes do upload e na leitura local. Associações só usam
balões retidos; candidatos distintos válidos continuam ambíguos. Não há escolha
de maior confiança por região OCR, fusão de texto ou regra por amostra/idioma.
Balões semanticamente distintos quase coincidentes ainda podem ser suprimidos
incorretamente: o limiar é uma hipótese experimental, não garantia de qualidade.
Onomatopeias permanecem nos artefatos, com avaliação específica fora deste escopo.

## Worker, falhas e schema V3

Executa após OCR sobre o arquivo local validado, antes de remover o original.
Sem transação durante inferência. Uma análise por instância, sem fila; orçamento
de 30 segundos e cancelamento nativo ONNX. Capacidade só é liberada quando a
chamada nativa retorna, inclusive após timeout. Inicialização do modelo ocorre
no startup, fora desse orçamento.

Erros allowlisted: `layout-unavailable`, `layout-timeout`, `layout-invalid-response`,
`layout-limit-exceeded`. Layout falho não invalida OCR válido. Upload privado
create-only; referência e conclusão OCR/job compartilham transação. Cancelamento
e rollback removem artefatos por best effort. Confirmação perdida mantém artefatos
se houve commit ou estado incerto. Cleanup de uma hora inclui `private/layout/`.

Schema aprovado conforme `database-design`:

- **Banco:** PostgreSQL para metadados transacionais; geometria/associações no bucket.
- **BCNF:** `processing_job_layouts`, `job_id UUID PRIMARY KEY` determina estado,
  chave `VARCHAR(512)`, hash `CHAR(64)`, erro `VARCHAR(64)` e timestamps `TIMESTAMPTZ`.
  `stage` é discriminador constante `OCR` necessário à FK, não classificação variável.
- **Integridade:** FK `(job_id,stage)` para etapa com `ON DELETE CASCADE`;
  `SUCCEEDED|FAILED`; sucesso exige chave/hash sem erro; falha exige erro sem
  artefato. Hash lowercase e conclusão ≥ início verificados por CHECKs.
- **Índices:** PK cobre lookup e cascade. Sem índice redundante, contador, cache,
  tabela de regiões ou texto no PostgreSQL.
- **Migration:** V3 aditiva, V1–V2 preservadas. Porta/JDBC/testes evoluem juntos.
  Retenção de sete dias do job propaga aos metadados por cascade.

Layout `1.1` não altera esse modelo BCNF, PK, FK, CHECKs ou índices. Não cria V4,
contador ou cache: o hash existente cobre também a auditoria no storage privado.

## Replay local

Requer Docker, Java 23, dependências Maven instaladas e modelo adquirido com
aprovação. O executor usa Maven **offline** e PostgreSQL 17 temporário; não aceita
banco externo. Harness exclusivo de testes, controller real por MockMvc com filtros,
sem listener HTTP. Replay protobuf usa o mapper real sem criar ADC/GCS/Vision.

Da raiz:

```bash
node api/apps/translation-gateway/scripts/ocr/ocr-evaluation.mjs layout \
  --run-id pt-p01-real-20260927-a --analysis-id layout-minha-rodada --direction ltr

# Regenerar HTML: não executa inferência, Maven ou provider
node api/apps/translation-gateway/scripts/ocr/ocr-evaluation.mjs report \
  --run-id pt-p01-real-20260927-a --layout layout-minha-rodada
```

Modelo padrão: `.local/ocr-samples/models/comic-detector-16e8a622/detector.onnx`.
`--model` permite outro caminho do **mesmo hash**, não outro modelo. Imagem deve
estar no catálogo local; captura protobuf e manifesto devem ter hashes válidos.

Saída exclusiva: `runs/<run-id>/layouts/<analysis-id>/`, ignorada pelo Git:
request, invocation lock, resultado, layout quando bem-sucedido, relatório,
notas e journal dos objetos locais. Rodada existente não pode ser retomada.
Inspecionar journal/resultado em falhas; nunca fazer limpeza ampla para recuperar.

Job ref reutilizado apenas no banco temporário mantém IDs e comprova hash idêntico
do manifesto. Nada sobrescreve OCR ou imagem fonte. Reentrega não repete inferência.
Relatório distingue captura OCR anterior de inferência local nova; escapa texto,
preserva créditos, não usa scripts/remotos e exibe aviso experimental permanente.
Memória heap medida não inclui alocações nativas nem equivale ao RSS do processo.

O rasterizador local utiliza os leitores ImageIO disponíveis: JPEG/PNG no JDK.
WebP sem leitor instalado falha somente no layout experimental, sem mudar o aceite
da mídia ou o OCR. Não há instalação automática de codecs nem conversão silenciosa.
Quadros irregulares/sobrepostos e separadores escuros também permanecem fora da cobertura.

Veja a [evidência datada](layout-validation-2026-09-27.md).
Supressão e regressão local: [evidência do layout 1.1](layout-dedup-validation-2026-09-27.md).

## Comparação `regionKinds` × máscara do render (2026-11-14)

Ubunchu! ch02 p.03–04 (en→pt-BR, 35 regiões, worker local em `shadow`, `ltr`): todas as
regiões `text_bubble` foram renderizadas pela máscara do balão; `text_free` sobre arte/borda de
quadro ("Thank you…", "Now Akane…", rótulos do CD) foram preservadas; `text_free` sobre fundo liso
("Aff…", "We can be the…") traduzidas. SFX estilizados ("FREEK", "PAH-", "clatter") saem como
`unknown` — o modelo não os vê como texto — e a máscara os preservou. Conclusão: nestas páginas o
ONNX confirma, mas não corrige, as decisões do render; seu ganho esperado é o agrupamento por
balão (o OCR juntou o SFX "clatter" à fala "YOU LINUX FREAKS…").

## Agrupamento por balão (`mode=grouping`, 2026-11-14)

O detector roda uma vez **antes** do OCR ser agrupado; as mesmas detecções alimentam o artefato de
layout (sem segunda inferência). Balões passam pela mesma deduplicação do artefato. Se o detector
falhar, o OCR segue com a heurística de proximidade — layout nunca falha o OCR.

1. **Divisão por palavra** (`OcrRegionGrouper.splitByBubbles`): o Vision pode juntar fala e SFX num
   parágrafo ("YOU LINUX clatter"). As palavras (caixas do próprio Vision, via
   `VisionResponseMapper.mapParagraphs`) recebem o balão que contém ≥ 50% delas; palavra em duas
   caixas sobrepostas é ambígua e segue as vizinhas, nunca causa divisão. Cada sequência de palavras
   com o mesmo dono vira uma região com ID derivado estável; o texto só é particionado, nunca alterado.
2. **Agrupamento** (`OcrRegionGrouper.group(..., bubbles)`): regiões no mesmo balão viram uma fala
   (na posição da primeira); balões diferentes, ou dentro × fora, nunca se juntam; só texto fora de
   balão usa a heurística de proximidade.

Validação (Ubunchu! ch02 p.03–04, en→pt-BR): p.03 idêntica ao modo heurístico; p.04 passou a separar
o SFX "clatter" da fala "YOU LINUX FREAKS ARE SO ANNOYING!" e de "WINDOWS IS SO PATHETIC!" (o "after"
que a heurística traduzia como "depois" era o SFX mal lido). As caixas do modelo nesta página em
inglês são imprecisas — vários balões não detectados e caixas sobre arte —, por isso o modo segue
opcional e a regra de ambiguidade é essencial ("UP"/"THIS" caíam em duas caixas sobrepostas).

## Avaliação em lote e ajustes (2026-11-14, rodada 2)

Bancada offline: uma leitura do Vision por página (respostas em cache), heurística × balões calculados
sobre a mesma leitura. Regras ajustadas com os erros observados (todas gerais, nenhuma por obra):

- Linha pertence ao balão que a contém **claramente mais** (vantagem ≥ 0,15); caixas vizinhas se
  sobrepõem e antes deixavam "THIS IS DEFINITELY" ambígua.
- Divisão por palavra só com dono claro: ≥ 80% numa caixa ou ≤ 20% em todas; palavra cortada pela
  caixa ("GET OUT" a 43%, "post." ao lado de "AH!!") não divide.
- Dentro do mesmo balão, só junta linha **perto** de outra da fala (empilhada, sobreposta ou na mesma
  linha); caixas grandes não colam falas distantes ("GET OUT NOOB" + "BUT... FLAME WAR").
- Linha fora de balão, empilhada sob uma fala de balão, continua a fala se estiver na folga de 15% da
  caixa, tiver ≥ 2 palavras ou for só pontuação; palavra isolada (perfil de SFX, "clatter") fica à parte.
- Caixas de parágrafos que se sobrepõem (≥ 25% da menor) são um bloco só — texto inclinado/manuscrito
  ("We can be the" / "GUI Brigade!").

| Amostra | Páginas | Com diferença | Balões melhor | Balões pior | Iguais |
|---|---|---|---|---|---|
| Inglês (ch01, ch03, ch05) | 24 | 12 | 10 | 1 ("GET / OUT NOOB!" estilizado) | 1 |
| Japonês (ch01, ch02) | 24 | 2 | 1 (separou colunas de balões vizinhos) | 1 (caminho de arquivo partido) | — |

**Achado principal no japonês:** o agrupador não junta texto vertical CJK em nenhum modo; o Vision
devolveu 855 parágrafos (≈ 1 por coluna) para 237 balões, e **171 balões (72%) têm vários parágrafos**
— cada coluna é traduzida isolada. Agrupar CJK por balão (colunas direita→esquerda, sem espaço) é o
maior ganho pendente para mangá japonês.

**Recomendação:** `grouping` como modo de produção para fontes horizontais (en/es/pt-BR) quando o
modelo estiver provisionado. O default do código continua `disabled` porque o modelo não é versionado.

## Texto vertical CJK e uso das classes no render (2026-11-15)

**Agrupamento CJK** (`OcrRegionGrouper.groupCjk`, ja/zh/ko, com ou sem balões): o Vision devolve cada
coluna vertical como um parágrafo e fora da ordem de leitura. Colunas vizinhas (espaço ≤ 1 largura de
coluna, sobreposição vertical ≥ 30%) e linhas horizontais empilhadas (altura de linha parecida, razão
≤ 1,75) formam uma fala, lida da direita para a esquerda (cada coluna de cima para baixo) e unida sem
espaço em japonês/chinês (com espaço em coreano). Balões detectados só **vetam**: colunas claramente em
dois balões distintos (caixas que se sobrepõem < 10%) não se juntam; o detector costuma devolver várias
caixas parciais para um mesmo balão vertical, que não vetam.

| Bancada (ja, ch01–02, 24 páginas) | Antes | Agora |
|---|---|---|
| Regiões traduzidas | 855 (≈ 1 por coluna) | 434 sem balões / 440 com balões |
| Páginas em que balões mudam o resultado | — | 4 (3 melhores, 1 empate em tela de computador) |

Exemplos reais: 「試しにちょっと」「インスコしてみる」「だけだかんな」 (vindos fora de ordem) →
「試しにちょっとインスコしてみるだけだかんな」 → "É só para instalar e testar um pouco, viu?";
SFX 「カタカタ…」 (linhas ~2× mais altas) não gruda mais na legenda abaixo dele.
Fonte em balão vertical estreito: piso pelo tamanho do glifo de origem + expansão a partir da faixa central
(ver `rendering-contracts.md`): "Eu tenho o trabalho do comitê…" 15 → 19 px, "A tela ficou com um visual
impressionante." 13 → 21 px, "Risa-chan!?" 14 → 25 px.

**Classes no render**: o render lê `regionKinds` do artefato (mesma verificação de hash/imagem/OCR dos
balões). Região `unknown` (o detector não a vê como texto — letreiro/SFX estilizado) nunca recebe
inpainting, mesmo que o dicionário a leia como frase.

**Provisionamento**: o `Dockerfile` baixa o detector da revisão fixada e confere o SHA-256 no build
(`/app/models/comic-detector-16e8a622/detector.onnx`); Terraform ganhou `layout_mode`
(`disabled`|`shadow`|`grouping`) e `layout_direction`, e com layout ligado o worker baseline sobe para 2 GiB
(medido: detector +366 MiB ao carregar, +178 MiB na inferência, ~0,30 s por página). `terraform validate`
não foi executado (Terraform ausente na máquina de desenvolvimento).

