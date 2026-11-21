# native-image/

Prepara, **sem Docker, rede ou instalação implícita**, os insumos das imagens do
worker que usa libwebp nativa. Docs:
[`rendering-native-distribution`](../../docs/rendering/rendering-native-distribution.md),
[`rendering-native-image`](../../docs/rendering/rendering-native-image.md),
[`native-base-update`](../../docs/native-runtime/native-base-update-2026-10-11.md).

| Arquivo | Função |
| --- | --- |
| `render-native-package.mjs` | Empacota `libwebp`/`libsharpyuv` com licenças e manifesto, validando hashes fixados (`packageCodec`). |
| `render-native-image.mjs` | Monta o contexto de build da imagem (JAR + pacote nativo + `image-inputs.json`) a partir do `Dockerfile.native`. |
| `render-single-jre-image.mjs` | Variante single-JRE do preparo da imagem (usa a prova de `../single-jre/`). |
| `ubuntu-base-update.mjs` | Prepara a base Ubuntu atualizada (`libfreetype6`, `libpng16-16t64`) e verifica o inventário antes/depois. |
| `Dockerfile.native` | Dockerfile do worker nativo. Recebe `RUNTIME_IMAGE` e hashes por `ARG`; só é válido com o contexto gerado pelos scripts. |
| `*.test.mjs` | Testes. |
