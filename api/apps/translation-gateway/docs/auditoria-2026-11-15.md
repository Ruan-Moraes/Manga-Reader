# Auditoria — qualidade visual e pipeline do translation-gateway (2026-11-14 → 2026-11-15)

Roteiro para auditar tudo o que foi feito na branch `fix/gateway-local-profile` desde o pipeline local real
(`ff247c2c`) até `3454ef26`, mais o que ainda não foi commitado. Cada item diz **o que mudou**, **onde**, **como foi
verificado** e **o que conferir na auditoria**. Marque `[x]` ao auditar.

Origem: auditoria visual da tradução de Ubunchu! (balões vazios, resíduo, remendos sobre a arte, fontes gigantes,
SFX/UI traduzidos como fala) → roadmap [`rendering/visual-quality-roadmap-2026-11-14.md`](rendering/visual-quality-roadmap-2026-11-14.md)
e DT-77 em [`docs/tech-debt.md`](../../../../docs/tech-debt.md).

## 0. Estado na hora desta auditoria

- Suíte do gateway: **1424 testes**, só as 3 falhas de ambiente conhecidas (`GatewayRuntimeTest` Java 25 vs JDK 23
  local, `RenderJvmLauncherTest`, `NativeRenderIntegrationTest`). Testes com codec/amostras locais são pulados
  fora desta máquina (`IsolatedInpaintingEndToEndTest`, `RealPageRegressionTest`).
- Nada enviado ao remoto; não há PR. Branch Gemini (`feat/gateway-language-refine`) já mesclada (`d683c2e3`).
- Pilha local real funcionando por scripts versionados (seção 12).
- Produção: Terraform mantém gateway/worker/OCR/tradução/render **desligados**; só `layout_mode = "grouping"`
  é padrão; camada Gemini `disabled` por padrão.

## 1. Pipeline local real e infraestrutura de dev

| Commit | O quê |
|---|---|
| `ff247c2c` | perfil `local`: `spring-boot:run` conecta ao Postgres do compose (5433) |
| `28897b93` | pipeline real local (storage, docs, dispatcher `scripts/local/dev-dispatcher.sh`) |
| `03249795` | gateway-tester traduz um lote de páginas |

**Incidente 2026-11-15 (`ocr-unavailable` em lote):** após ~6 min sem chamadas, toda chamada de OCR do worker
esperava os 60 s do prazo numa conexão gRPC morta (a mesma chamada fora do worker respondia em 3 s; reiniciar o
worker resolvia). Como as retentativas são desligadas de propósito (sem cobrança dupla), a correção é no canal:
`idleTimeout` de 2 min (conexão ociosa é fechada e reaberta na próxima chamada) e keepalive de 60 s/20 s durante
chamadas, em Vision e Translation (`VisionClientFactory`, `TranslationClientFactory`, `ProviderChannelHygieneTest`).

Conferir:
- [ ] Mesmo problema pode ocorrer no Cloud Run (instância ociosa): a correção vale para os dois ambientes.
- [ ] `scripts/local/gateway-real.env.example` não contém segredos; o env real fica em `~/.config/toonlira/` (fora do repo).
- [ ] O dispatcher é **só dev** (substitui Cloud Tasks) e cada job pode gerar custo de OCR/tradução.

## 2. Tradução: termos protegidos, literais e fragmentos

| Commit | O quê | Onde |
|---|---|---|
| `5319ccb8` | termos técnicos/URLs/`$var` em `<span translate="no">`; região que perde o termo volta ao original | `ProtectedTerms`, `TranslationEnvelopeCodec`, `glossary/` |
| `e7f8403a` | remove espaço do provedor entre termo protegido e pontuação ("Ubuntu!") | `TranslationEnvelopeCodec` |
| `af9d89fe` | 「あ」「ら」 em balões vizinhos traduzidos juntos ("Ora" / "…") | `FragmentJoiner`, `ProcessTranslationTaskUseCase` |
| `0c301d8a` | fragmentos só com letra CJK (nunca "c"/"C" de tela) | `FragmentJoiner` |

Conferir:
- [ ] `FragmentJoiner` junta 2–3 regiões **consecutivas** de 1 letra CJK; risco aceito: interjeições de personagens
  diferentes (「あ」「え」) também seriam juntadas.
- [ ] A resposta expandida valida contra o pedido original (`TranslationValidator`), ids e contagem iguais.

## 3. Agrupamento do OCR por balão

| Commit | O quê |
|---|---|
| `fbebe7a2` | parágrafos do OCR agrupados por fala |
| `35226d6c` | calibração em 48 páginas reais (balões > heurística em 10 de 12 páginas en com diferença) |
| `6ae5f417` | colunas verticais CJK numa fala (direita→esquerda, sem espaço ja/zh, com espaço ko); 855 → ~440 regiões |
| `01a68bed` | pedaços claramente no mesmo balão viram uma fala (「こっこのCCSMってコンパネ」), só escrita CJK e letra parecida |
| `543a6e43` | letra medida por sqrt(área/letras); colunas com letra > 2,2× só juntam coladas (furigana) — letreiro grande não engole fala |

**Capa (2026-11-15, depois da auditoria inicial):** no agrupamento de línguas com espaço, linhas com letra de tamanho
muito diferente (altura por linha > 1,75× **e** área por letra > 1,5×) não se juntam fora de um balão detectado —
o logo "Ubunchu!" (7× o subtítulo) era juntado ao subtítulo e virava letreiro (logo apagado pelo LaMa) e o "Ubunty"
do livro do pinguim entrava nos créditos (inpainting borrava o desenho). Dentro de um balão, diferença de tamanho é
ênfase e continua juntando ("YOU LINUX / FREAKS ARE SO ANNOYING!"). Bancada en (24 págs.): só separações corretas
(logo/título, créditos/livro, SFX/interface: "Network Connection"/"TA-DA!"); capa na regressão real
(`en-01-01a-cover.json`). Resto: o nome em japonês 瀬尾 浩史 é lido como "WE" e grudado na linha do autor.

Onde: `domain/OcrRegionGrouper.java` (+ `OcrRegionGrouperTest`, 15 testes). Bancada: `.local/bench/GroupingEval.java`
(cache do Vision em `.local/bench/visioncache`).

Conferir:
- [ ] Regras descartadas estão documentadas em `ocr-evaluation/layout-experimental.md` (razão de tamanho pura quebrava
  furigana; vão pela coluna mais estreita partia falas).
- [ ] Constantes calibradas (`MAX_LINE_RATIO` 1,75, `SIZE_JUMP` 2,2, `COLUMN_GAP`, `BALLOON_SLACK` .15) vieram só de
  Ubunchu! — risco de sobreajuste a um título (ver seção 13).

## 4. OCR: releitura, recuperação e leitura parcial

| Commit | O quê |
|---|---|
| `819a6ce2` | releitura de falas duvidosas em 4 variantes num mosaico (1 chamada extra/página), voto confiança+concordância+dicionário (FrequencyWords 50k, CC BY-SA) |
| `1b65cdd8` | caixas do detector **sem nenhuma palavra** relidas no recorte exato (「わーい」 → "Eba!"; 9 de 16 caixas) |
| `bf0e26ae` | caixas lidas pela metade (< 60% do lado longo) estendidas só por leitura maior que contém o lido (「うん……でも」); moldura branca no recorte; reticências de tamanhos diferentes votam juntas |

Onde: `OcrRereadService`, `OcrReread`, `RereadMosaicBuilder`, `MosaicLayout` (gap lateral ≥ altura do ladrilho;
palavra que cruza ladrilhos descartada), `ProcessOcrTaskUseCase`.

Conferir:
- [ ] Custo: no máximo 1 chamada extra de releitura + 1 de recuperação por página; orçamento de 8 regiões/caixas.
- [ ] Nunca inventa texto: exige 2+ variantes concordando, confiança ≥ 0,8, letras (não só pontuação).
- [ ] Logs só com contagens (nunca texto de OCR).

## 5. Render: composição, fonte e limpeza

| Commit | O quê |
|---|---|
| `ccfc024e` | render sem danificar a arte: overflow preserva o original, teto de fonte 1,35× mediana, piso 0,75× via expansão para o fundo liso, máscara do balão, limpeza do halo JPEG |
| `d9d48550` | balões detectados limitam máscara e expansão (+15%) |
| `1d439374` | CJK: piso pelo tamanho do glifo de origem (0,75×); expansão também das faixas centrais 60%/35% alargando primeiro (13–15 → 19–25 px) |
| `6b1703ea` | classe do detector chega ao render; `unknown` nunca recebe inpainting |

Onde: `PageRasterPainter`, `BalloonExpansion`, `BalloonMask`, `CleanBoxPainter`, `RasterPolygon`.

Conferir:
- [ ] Contrato `clean-box-1.1` não mudou de versão apesar das regras novas (manifesto inalterado) — decidir se deveria.
- [ ] Nada é pintado fora do balão (coberto pela regressão, seção 10).

## 6. Inpainting (LaMa)

| Commit | O quê |
|---|---|
| `e8e361df` | LaMa ONNX (Carve/LaMa-ONNX `lama_fp32`, Apache-2.0, SHA fixado) para fala/legenda sobre a arte no render local; só pixels mudados são escritos |
| `7af83e0c` | balão com retícula (≥ 15 pontos de tinta minúsculos fora do polígono) passa pelo LaMa em vez de preenchimento liso |
| `0c301d8a` | legenda em japonês/chinês reconhecida sem espaços (≥ 4 letras com kanji, ≥ 6 só kana, sem repetição) |
| `6ec4f20d` | modos isolado/nativo: **modelo no pai**, dois passes do filho (janelas 512×512 cruas + máscara; o filho continua sendo o único que decodifica a página); pedido ao filho agora leva dicas de fala e balões |
| `679e9c0b` | fala que não cabe no papel (mesmo crescida) passa pelo LaMa em vez de ficar no original |

Onde: `LamaInpainter`, `InpaintWindow`, `InpaintModel`, `InpaintExchange`, `IsolatedRenderAdapter`, `RenderChildMain`,
`RenderSubprocessProtocol`, `NativeRenderingConfiguration`, `CaptionFilter`.

Conferir (segurança — prioridade):
- [ ] `InpaintExchange`: arquivos versionados, tamanho exato, máscara 0/1, geometria coerente, máximo 8 janelas;
  qualquer divergência recusa a janela (original preservado).
- [ ] O pai nunca recebe a imagem codificada; só tensores de tamanho fixo.
- [ ] Retícula: **sem página real de validação** (só teste sintético).

## 7. Letreiros à mão

| Commit | O quê |
|---|---|
| `679e9c0b` | frase que o detector não vê como texto ou desenhada ≥ 1,8× maior que a mediana da página → `letteringHints`: LaMa + Noto Sans Black, contorno largo, inclinada como o polígono (≤ 0,5 rad) |
| `3454ef26` | Noto Sans CJK Black (jp/kr/sc/tc) para destinos asiáticos — pacote `noto-sans-1.2`, +~68 MB |

Conferir:
- [ ] Fontes novas: OFL, mesma revisão fixada do upstream, SHA-256 + hash Git do blob conferidos com o GitHub
  (`font-pack.json`, `BundledRenderingFonts.validate`).
- [ ] Impacto de +68 MB na imagem do worker e no tempo de carga; filho isolado (128 MiB) testado com as fontes.
- [ ] Limite: fim de letreiro que nem OCR nem detector leem (「上手くいく」, pág. 03) fica no original.

## 8. Camada de linguagem opcional (Gemini no Vertex AI)

| Commit | O quê |
|---|---|
| `8d1dc013` (+ merge `d683c2e3`) | revisão de OCR duvidoso + tradução com contexto da página, só texto, 1 chamada/página; `disabled` por padrão |

Onde: `TranslationRefinerPort`, `GeminiTranslationRefiner`, `VertexGeminiClient`, `GeminiClientFactory`,
`TranslationRefinement`, `GatewayProperties.Translation.Refine`, Terraform (`translation_refine_mode`, API
`aiplatform`, `roles/aiplatform.user`), disclosure `languageModelLocation` (OpenAPI + mobile zod + painel i18n).

Conferir:
- [ ] **Nunca testada contra o Vertex real** (custo) — validar com 3–4 páginas antes de ligar.
- [ ] Fallback: erro/timeout/ids trocados/termo protegido perdido → resposta do Google intacta.
- [ ] Disclosure: versão precisa mudar (`GATEWAY_DISCLOSURE_VERSION`) ao ligar; textos do mobile em todos os idiomas.
- [ ] Ordem no use case: fragmentos juntados → Google → Gemini → expand (`ProcessTranslationTaskUseCase`).

## 9. API, contrato e qualidade

| Commit | O quê |
|---|---|
| `6e59ee38` | `ReadyResult.quality` (V10 grava contagens no render), selo "revisar" no gateway-tester |
| `398f6270`, `97775e4e` | OpenAPI/Swagger UI do gateway |

Conferir:
- [ ] Migration V10: `CHECK` com `IS NOT NULL` explícito (bug corrigido na época).
- [ ] Contrato OpenAPI × mobile (zod) alinhados (`TranslationGatewayOpenApiTest`).

## 10. Regressão visual

`3672fc57`: `VisualRegressionTest` (9 cenas sintéticas, sempre roda) e `RealPageRegressionTest` (7 páginas reais de
Ubunchu!, só onde as amostras existem). Doc: [`rendering/visual-regression.md`](rendering/visual-regression.md).

Conferir:
- [ ] **Licença**: os fixtures em `src/test/resources/visual-regression/` trazem o **texto** de Ubunchu!
  (CC BY-NC-SA) no repositório (imagens ficam fora). Decidir se é aceitável.
- [ ] Linha de base "não piorar" (fonte ≥ 85%, tinta ≤ ×1,1 + 20, pixels fora ≤ +50) — tolerâncias adequadas?
- [ ] `UPDATE_VISUAL_FIXTURES=1` exige revisão do diff dos JSON junto com a mudança.

## 11. Produção / Terraform

| Commit | O quê |
|---|---|
| `d01dc43a` | `Dockerfile` baixa o detector (revisão + SHA fixados); Terraform `layout_mode`/`layout_direction`; worker baseline 2 GiB com layout |
| `98a1cf04` | `layout_mode = "grouping"` padrão; `terraform validate`/`fmt -check` verdes (1.9.8 em contêiner) |

Conferir:
- [ ] Memória: detector +366 MiB carga, +178 MiB inferência; LaMa ~+200 MB; fontes CJK +68 MB — 2 GiB ainda basta?
- [ ] O LaMa **não** está no `Dockerfile` (só local): decidir como provisionar em produção.

## 12. Não commitado nesta data

- `api/apps/translation-gateway/scripts/local/dev-api.sh` e `dev-worker.sh` (sobem API 8084 e worker 8085 com o env
  real, detector e LaMa se existirem em `.local/`).
- `.run/Gateway Real *.run.xml` + `.run/README.md`: configurações do IntelliJ — `Gateway API real (8084)`,
  `Gateway Worker real (8085)`, `Gateway Dispatcher dev` e o composto
  `🚀 Gateway real (API + Worker + Dispatcher + Tester)`. Validado subindo pelos scripts e processando uma página
  (READY).
- Este documento.

## 13. Limites conhecidos e riscos abertos

- Dois textos no mesmo balão dividem espaço; tradução muito mais longa que o original sai pequena.
- Letra à mão encostada na borda do balão não é apagada (「がま」, pág. 03).
- 「つ」 e letras soltas de baixa confiança continuam sem leitura.
- Fala em kana curta (< 6 letras) sobre a arte fica no original.
- **Sobreajuste**: quase toda calibração em um único título (Ubunchu!); validar outros mangás, manhwa (ltr) e manhua.
- Modo nativo com a biblioteca do codec não roda na máquina de desenvolvimento (só o isolado com codec CLI foi
  testado de ponta a ponta).
- Comparação com a edição oficial não foi feita.

## 14. Como reproduzir as verificações

```bash
cd api && ./mvnw -pl apps/translation-gateway -am test                      # suíte (3 falhas de ambiente)
cd api && ./mvnw -pl apps/translation-gateway -am test -Dtest='VisualRegressionTest,RealPageRegressionTest'
cd api && . ~/.config/toonlira/gateway-real.env && ./mvnw -pl apps/translation-gateway -am test -Dtest=IsolatedInpaintingEndToEndTest
bash api/apps/translation-gateway/scripts/local/dev-api.sh                  # ou pelo IntelliJ (.run/)
bash api/apps/translation-gateway/scripts/local/dev-worker.sh
python3 -I .local/bench/submit_pages.py <saída> ja <páginas...>              # gateway-tester em http://localhost:5175
```
