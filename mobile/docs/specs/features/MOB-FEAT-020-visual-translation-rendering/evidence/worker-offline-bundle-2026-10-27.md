# Worker reproduzível sem cache local — 2026-10-27

Parcela local de TASK-002/006/007/008. A 020 continua `in-progress/open` e a
021 `implemented`; operação cloud e qualidade multilíngue não foram avaliadas.

## JAR offline

O archive local `offline-worker-java-final-darwin-arm64.tar.gz` contém fontes
principais, JDK 25.0.5, Maven 3.9.9, repositório offline selecionado, settings
restritos, lock e verificador. Archive SHA-256
`7baa30d1196df0801e74c3c750df3020df26d630fb8f1da07b08ac7560e63515`;
[lock](../../../../../../api/apps/translation-gateway/docs/worker-offline-build-lock-2026-10-27.json)
SHA-256 `ee425097441faf6b4aaaa6b903d2d609916eab197bdf874fb5c88ee253a8fba2`.
O lock descreve 1.920 arquivos, 205 links internos e modos; o repositório
contém 1.321 arquivos selecionados pela resolução e pelos BOMs. Não há settings
ou metadados pessoais do cache. A seleção não é declarada mínima.

O archive foi extraído em diretório novo. O verificador incluído conferiu o
conteúdo antes e depois de compilar, usando `user.home`, repositório e settings
isolados. O sandbox bloqueou rede e leitura do checkout, do cache Maven e do
JDK originais; testes separados confirmaram esses bloqueios. O JAR gerado teve
SHA-256 `6aa86b3fe3a45137a6daf221a62dbdf728310fad754c4c3cc48a039cbe6eec9c`,
igual à fotografia anterior. O build de embalagem não compilou nem executou
testes. Log local SHA-256
`674f2a0a460841ad2bc2913895462b197169fd35e48fe689fb663e948248c453`.

A primeira versão foi recusada porque faltavam descritores de dependências;
os arquivos faltantes e seus parents foram incluídos na segunda versão. O
archive e o lock anteriores permanecem em `.local/` como histórico. O Finder
criou `.DS_Store` durante a montagem; o verificador ignora apenas esse nome
quando é arquivo regular limitado, e o archive final o exclui.

## Insumos nativos e imagem

O archive local `offline-worker-native-portable-arm64.tar.gz`, SHA-256
`22ee54ef38ea60f4313a9c4a0574e53764c13ca6b8762414246c75a3cbff91be`,
contém fonte libwebp, Dockerfiles, scripts e os archives do builder e do parent.
O verificador OCI incluído conferiu os hashes dos 12 e 16 blobs e todas as
referências alcançáveis dos IDs fixados. Docker restaurou esses IDs a partir
dos archives; o daemon já possuía imagens, portanto não é prova de daemon vazio.

O codec foi reconstruído a partir dos scripts extraídos, com checkout bloqueado
e container sem rede. A preparação do contexto também bloqueou rede, checkout
e cache Maven; seu hash coincidiu com o anterior:
`d40cae87d18641c3c99ef2a1f03e0391d9e5cbf9456c0e3144a2a2b0596f1075`.
O build Docker usou `--no-cache`, `--pull=false` e `--network=none` nos passos;
preflight `admitted-not-operational` passou. A imagem local resultante foi
`sha256:8523c2b02c57ca42d7e69aa112c0b40692ee360842806b35cef58decdad0f41c`.

Nessa imagem, worker/SQL/storage locais e providers falsos produziram `READY`,
WebP e manifesto íntegros, dois ACKs e cleanup. WebP SHA-256
`7513040237e614b8e82cb6aeb9cb0da52b6a513cc640488b67123bee2dd27c8f`;
manifesto `0d3704783b7c966eace8cf600b3ea5e1afbec968f78fa9d981cda9d243d8c501`.
O XML foi preservado em `.local/`, SHA-256
`bd19388724e2dc0ecb4565fa06599a67c6206c51b8ad1b7642a6948139b48aa9`.

## Limites

A prova de build Java vale para macOS ARM64 compatível e depende de Python e
bibliotecas do sistema; Docker e Node não são incluídos nos archives. Não houve
prova em outra máquina ou daemon vazio, nem chamadas pagas, publicação, IAM ou
admissão de memória cloud. A prova de entrega usa principal e transporte local
de teste; não afirma autenticação ou GCS reais. Comandos e gates estão no
[registro técnico](../../../../../../api/apps/translation-gateway/docs/worker-reproducibility-2026-10-26.md)
e na review.

## Fonte atual e timestamps — 2026-10-28

O pacote Java foi atualizado após as mudanças de ACK e GCS. Duas montagens do
arquivo tiveram SHA-256 `d126c06e1d9cd5b0c0ee7ae1b22330fadfce2b2124123902e48c4486702249ab`;
o build após extração reproduziu o JAR acima sem rede, checkout ou cache Maven.
O lock v2 verifica timestamps em segundos; o hash final do JAR continua
obrigatório. A falha de uma montagem com tempos normalizados, os hashes do lock
e as restrições da prova estão no
[registro técnico](../../../../../../api/apps/translation-gateway/docs/worker-reproducibility-2026-10-26.md).
Não houve teste em outro host ou daemon vazio, nem aprovação operacional.

## Auditoria da TASK-002 — 2026-10-28

O JAR atual contém cinco fontes Noto, duas licenças OFL e o manifesto com
versões, atribuições e hashes; inventário do JAR tem SHA-256
`23590c4ede496b37242bb410261177f80feeae090bd451e826c26bfd9084f71d`.
O pacote nativo ARM64 contém libwebp 1.6.0, libsharpyuv, COPYING, PATENTS e
manifesto fixados por hash. Os dois pacotes foram reconstruídos sem rede e
compostos no contexto com hash correspondente ao worker testado. As fixtures
existentes dos sete destinos verificam fontes e glyphs; os testes rejeitam
fontes e codec inválidos antes do render. As provas nativas anteriores cobrem
decode/encode limitado, lossless/exact, e a execução atual do worker comprovou
READY e falha controlada de memória. O codec é preparado com insumos locais; a task e os testes comuns não
adquirem o codec pela rede.

Isso encerra a preparação e validação local da TASK-002, não a segurança do
JRE, a admissão de operação ou revisão visual/linguística da feature. A prova
é local ARM64; não se inferem outro host ou daemon vazio. Os hashes, resultados
e limites detalhados estão no
[registro técnico](../../../../../../api/apps/translation-gateway/docs/worker-reproducibility-2026-10-26.md).
