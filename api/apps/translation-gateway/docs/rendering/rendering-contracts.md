# Renderer — contratos e plano do primeiro incremento

MOB-FEAT-020, TASK-001, iniciada após 019 `verification-pending` e 020
`approved/open`, agora em execução. Execução incremental autorizada por Ruan. Esta parcela define
contratos e validação; não desenha imagens, carrega fontes/codec, cria bean ou
liga renderer ao worker. Não envia mídia ou chama providers.

## Plano antes do código

1. Testes sintéticos de entrada/saída antes dos tipos, esperando compilação
   vermelha por contratos ainda ausentes.
2. Tipos imutáveis no domínio, com limites e falhas sanitizadas, sem Spring,
   Jackson, AWT ou SDKs. Porta com paths locais fora dos objetos de domínio.
3. Entrada construída pela associação do OCR `1.0` com o resultado validado
   da tradução, conferindo job/par/IDs/ordem/dimensões. Copiar coleções e
   geometria; não modificar qualquer texto ou manifesto anterior.
4. Saída com metadados da imagem final e manifesto próprio `1.0`: hash/bytes/
   MIME/dimensões, versões, hashes de origem, fonte/target, região/ordem/textos/
   polígonos e flag overflow. Fallback mantém tradução completa, não substring.
5. Serialização estrita e verificação do contrato de bytes entregues com
   `RenderManifestService`; testes/gates e evidência parcial. As demais tasks
   continuam abertas; nenhum critério integral do renderer é aprovado só por contratos.

## Políticas versionadas

`clean-box-1.0` é a política histórica (compressão método 4).
`clean-box-1.1` é a política corrente (compressão método 0), com os mesmos
pixels lossless/exact e qualidade de configuração 100. O esforço foi reduzido
para resolver a alocação do JPEG máximo sem elevar caps ou alterar a imagem.
Java FFM e CLI usam a versão, sem fallback silencioso entre métodos.
Fonte entre 12 e 48 pixels da imagem, padding de 2 pixels,
saída `image/webp` **lossless**, até 64 MiB; manifesto até 4 MiB. Entrada
preserva os limites atuais: JPEG/PNG/WebP, 12 MiB, 12.000 pixels por dimensão e
80 milhões de pixels. A política aceita um snapshot com limites de mídia mais
restritos, para respeitar capabilities/configuração na integração futura.

12 pixels é parâmetro inicial experimental de execução, não meta de aprovação
de legibilidade. A adequação visual precisa de fixtures e revisão; nenhum dado
atual comprova wrapping/glyph/desempenho. A política de bytes é explícita: um
arquivo que não caiba falhará inteiro; não reduzir qualidade, resolução ou
truncar texto silenciosamente. Limites de fonte não são tamanho da fonte na UI.

A escolha lossless atende o diff fora dos polígonos sobre os pixels decodificados;
bytes diferentes do original JPEG são esperados. A especificação do formato
descreve preservação exata de ARGB, inclusive RGB de pixels transparentes; o
adapter deverá provar isso em round-trip e não presumir configuração `exact`
do encoder. [Especificação WebP](https://developers.google.com/speed/webp/docs/webp_lossless_bitstream_specification).

## Domínio e porta

- `RenderPolicy`: versão e limites de entrada/saída/fonte; a compressão não
  oferece opção com perdas para enfraquecer AC-001.
- `RenderSource`: metadados verificados do original, sem chave de objeto/path.
- `RenderRequest`: job/par, hashes original/OCR/tradução, dimensões e regiões
  imutáveis com ID, ordem, texto fonte/traduzido e geometria original.
- `RenderedImage`: metadados do arquivo final, não afirma ter lido seus bytes.
- `RenderManifest`: associação exata com uma colocação por ID, overflow/font
  válidos e texto integral; resultado sempre na ordem original.
- `RenderPort`: recebe cópia privada local validada e request; retorna path
  temporário de saída e manifesto. O chamador futuro verificará bytes/hash
  e propriedade dos paths antes de upload/commit. Não há implementação agora.
- `RenderValidationException`: somente código interno, sem causa/conteúdo.
  Nenhum código HTTP novo ou mudança de `/v1` nesta parcela.

Hashes fornecidos são metadados confiáveis do chamador: a validação de domínio
confere formato/vínculo, não autenticidade do arquivo. A integração terá de
reler mídia/manifests limitados e comprovar seus hashes antes da reserva.
`toString()` não expõe texto, IDs, job, hashes, caminhos ou chaves.

## Manifesto final — contrato de bytes

JSON UTF-8, versão `1.0`, separado dos artefatos OCR/tradução existentes:

- `version`, `policyVersion`, `jobRef`, `sourceLanguage`, `targetLanguage`;
- `originalSha256`, `ocrSha256`, `translationSha256`;
- `image`: `mimeType`, `byteSize`, `widthPx`, `heightPx`, `sha256`;
- `regions`: `id`, `readingOrder`, `sourceText`, `translatedText`, `polygon`
  (quatro vértices normalizados `x`/`y`), `overflow`, `fontSizePx`;
- `quality`: `status` (`OK` | `NEEDS_REVIEW`) e `issues` (`TEXT_NOT_RENDERED`,
  `ALL_TEXT_NOT_RENDERED`), derivados de `overflow` e revalidados no decode.
  Não bloqueia a entrega: o job continua `READY`.
- Exposto também em `ReadyResult.quality` (OpenAPI `PageQuality`, opcional). A V10 persiste na
  etapa `RENDERING` só `rendered_text_region_count` (regiões cuja tradução difere do original) e
  `rendered_text_missing_count` (dessas, quantas mantiveram o original); status e issues são
  derivados por `PageQuality.of(RenderTextCounts)`, a mesma regra do manifesto. Resultados
  renderizados antes da V10 não têm contagens e a API omite `quality`.

Política de composição (`clean-box-1.1`, auditoria Ubunchu! 2026-11-14):
região cujo texto não cabe (`overflow=true`) **não é limpa** — os pixels
originais permanecem, em vez de um balão apagado. A fonte de cada região é
limitada a 1,35× a mediana das regiões da página (com 3 ou mais regiões).
Piso relativo: região que sai abaixo de 0,75× a mediana (ou em `overflow`) é
recomposta numa caixa expandida a partir da caixa inscrita para o fundo liso ao
redor (distância de cor ≤ 30 da cor de limpeza; até max(altura inicial, 2× o
piso) por lado). A expansão para em tinta (borda do balão, arte), na borda da
imagem, a 4 px do retângulo de qualquer outra região e em caixas já expandidas
por outra região. Até 8 px do próprio polígono, ruído de compressão JPEG (não
tinta, distância ≤ 120) não bloqueia. O plano expandido só é aceito se a fonte
aumentar; a caixa expandida é preenchida inteira com a cor de limpeza (apaga o
halo) e o texto é recortado a ela. Fundo texturizado não expande — a região
mantém o resultado anterior.
Origem japonesa/chinesa/coreana tem também um piso pela própria letra: tamanho
do glifo estimado por sqrt(área / caracteres) da caixa do OCR, × 0,75 (limitado
ao teto). Colunas verticais são estreitas; a mediana da página, feita dessas
colunas, não percebe que o português horizontal saiu pequeno. A expansão parte
da caixa inteira e também das faixas centrais de 60% e 35% da altura, que
alargam primeiro e depois crescem na vertical (num balão oval, as pontas de uma
coluna alta já encostam na borda curva); vence a maior fonte.

**Máscara do balão** (substitui o preenchimento do polígono inteiro e o antigo
fringe): por região, numa janela de 12 px em volta do polígono, o interior do
balão é o maior componente liso (4-conexo, distância ≤ 30 da cor de limpeza)
dentro do polígono; letras de origem são blobs não-lisos (8-conexos) cercados por
ele **e que tocam o polígono**. Só interior do balão dentro do polígono + letras
cercadas são limpos; borda do balão, arte e SFX fora do balão alcançam a borda da
janela e ficam intactos, mesmo quando o polígono OCR passa da borda. A caixa de
layout é a caixa inscrita encolhida até cair só em pixels permitidos, e o texto é
recortado a ela. Região coberta por outras (sem amostra de entorno) usa o
polígono inteiro, como antes.

**Original preservado** (`overflow=true`, `fontSizePx=0`), além de texto que não cabe:
- tradução igual ao original após normalizar espaços/caixa ("AKANE!", "FREEK",
  "PAH-"): a letra original fica; **não** conta como `TEXT_NOT_RENDERED`;
- menos de 25% da tinta de origem dentro do polígono cercada pelo balão (texto
  sobre arte ou borda de quadro): conta como `TEXT_NOT_RENDERED` (`NEEDS_REVIEW`).

Palavra mais larga que a caixa nunca é quebrada no meio (`requireNextWord`): a
fonte diminui e, se ainda não couber, a região preserva o original.

Halo de compressão: pixels até 8 px do polígono com distância de cor entre 6 e
120 (ruído JPEG em volta do texto original, que vira um contorno retangular ao
lado do preenchimento liso) também são limpos, só no interior do balão ou em
pontinhos isolados, exceto a até 2 px de tinta que permanece (antialiasing de
borda/arte), dentro da caixa de outra região, ou quando mais de 40% da faixa é
não-lisa (retícula/gradiente). Máscara e halo de todas as regiões são calculados
no raster intacto, antes de qualquer pintura.

O encoder usa stream limitado antes da materialização final: escapes JSON
contam nos bytes. Um texto válido nos limites UTF-16 ainda pode exceder o teto
de 4 MiB após escape; nesse caso falha inteiro, sem truncamento. `overflow=true`
usa `fontSizePx=0`; não afirma que uma tradução foi desenhada parcialmente.

O decoder exige hash esperado e request/metadata da imagem verificados pelo
chamador. Rejeita UTF-8 inválido, UTF-16, campos desconhecidos/ausentes/nulos,
coerções escalares, números fracionários para inteiros, chaves duplicadas e
tokens posteriores. Confere job, par, política, todos os hashes, imagem,
texto, geometria e ordem integralmente antes de reconstruir o contrato.
JSON não executa markup. A validação do manifesto não substitui a inspeção
dos bytes da imagem final. O serviço não é bean e não altera o pipeline.

## Persistência — mini-protocolo database-design

- Banco escolhido: PostgreSQL existente para estados/locks e bucket privado
  para imagem/texto; nenhum MongoDB, texto/região no PostgreSQL ou SQL novo.
- Modelo BCNF desta parcela: nenhuma tabela/coluna/entidade persistida é
  criada. As dependências existentes `(job_id, stage) → metadados da etapa`
  e `job_id → pedido ACK` permanecem intactas.
- Integridade: PKs, FKs cascade, CHECKs/unicidades V1–V5 preservados.
- Índices: nenhum novo; não existe consulta nova ou índice redundante.
- Derivados: nenhum contador ou cache.
- Migration/código: nenhuma V6 neste incremento de contratos. Antes da
  TASK-005, modelar explicitamente como imagem e manifesto serão vinculados à
  etapa `RENDERING`, com metadados de integridade e commit atômico; atualizar
  repository/cleanup/consulta/testes conjuntamente e validar a cadeia PostgreSQL.
  Este documento não antecipa tabela/coluna ainda não escolhida.

## Recursos e integrações ainda pendentes

Noto Sans/Noto Sans CJK foram empacotadas no incremento local posterior,
com versão/hash, SIL OFL, atribuição e loader verificado; ver
[fontes da renderização](rendering-fonts.md). Esta seção não altera a fotografia
histórica da entrega inicial de contratos.
A distinção de fontes CJK por destino é importante; não confundir chinês
simplificado/tradicional pelo idioma fonte. [Distribuição do autor](https://github.com/notofonts/noto-cjk/blob/main/Sans/README.md)
e [licença/release notes](https://github.com/notofonts/noto-cjk/blob/main/Sans/NEWS.md).

O adapter Java das ferramentas oficiais libwebp foi testado localmente; ver
[preparação do codec](rendering-codec.md). Seu empacotamento por plataforma e
profiling continuam pendentes. A seleção não foi baseada apenas em busca. O projeto
[webp-imageio](https://github.com/gotson/webp-imageio) está arquivado; os plugins
[TwelveMonkeys](https://github.com/haraldk/TwelveMonkeys) e
[NightMonkeys](https://github.com/gotson/NightMonkeys) documentam leitura, não
escrita WebP. Um adapter de encode precisa ser efetivamente verificado com
libwebp atual e plataformas de execução; não usar plugin de decode como encoder.
Nenhuma dependência foi instalada ou automaticamente baixada em teste comum.
O opt-in usa somente executáveis previamente preparados, com versão/hash explícitos.

Caixa limpa, composição raster e adapter de arquivos locais estão
codificados/testados; ver [geometria](rendering-paint.md),
[texto/fallback](rendering-text.md) e [arquivos](rendering-files.md).
A [persistência](rendering-persistence.md) acrescenta reserva/commit dos dois
artefatos e ACK/cleanup transacionais. Empacotamento do codec, memória nativa,
retenção do original, orquestração/READY no worker e URLs assinadas ainda são
trabalho da 020. O repository não é um pipeline de resultado ativo.
Aquisição, commit/READY local, envio do ACK e reader continuam na 021 bloqueada.
Layouts experimentais não alteram este contrato nem fornecem geometria alternativa.
