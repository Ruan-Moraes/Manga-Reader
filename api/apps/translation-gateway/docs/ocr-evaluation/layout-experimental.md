# Layout automático experimental

Extensão própria do gateway, fora do aceite atual da `MOB-FEAT-018`, que permanece
`in-progress`. Não controla tradução, renderização ou estados públicos, nem altera
texto, geometria ou ordem do manifesto OCR `1.0`. Nenhuma rota nova foi criada.

## Configuração e modelo

Default `gateway.layout.mode=disabled`: não abre modelo nem inicializa ONNX.
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
node api/apps/translation-gateway/scripts/ocr-evaluation.mjs layout \
  --run-id pt-p01-real-20260927-a --analysis-id layout-minha-rodada --direction ltr

# Regenerar HTML: não executa inferência, Maven ou provider
node api/apps/translation-gateway/scripts/ocr-evaluation.mjs report \
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
