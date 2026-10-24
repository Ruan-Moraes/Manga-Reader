# Evidência parcial — renderer de arquivos, 2026-10-03

Parcela de TASK-005 da MOB-FEAT-020, ainda `in-progress/open`. O adapter local
implementa RenderPort; não possui bean/chamador no worker nem produtor de READY.
TASK-002/005/006/007/008 permanecem abertas e a 021 continua bloqueada.

## Implementação e propriedade

[Plano anterior ao código](../../../../../../api/apps/translation-gateway/docs/rendering-files.md):
nenhuma tabela, migration, índice ou cache novo; PostgreSQL continua dono dos
estados. O adapter produz arquivo temporário privado local, sem acessar bucket,
credenciais, provider, rede Google ou pipeline ativo.

Revalida o original em snapshot comprimido limitado por política, comparando
SHA-256, bytes, MIME e dimensões. Recusa symlink e caminhos ausentes/relativos.
PNG/JPEG usam somente os leitores admitidos do JDK; WebP usa tools pinados.
Dimensões/pixels são conferidos antes de raster. APNG e WebP animado, chunks
fora dos limites e RIFF incoerente são rejeitados antes do codec.

JPEG/PNG recebem um destino que converte escritas de pixels/scanlines no modelo
de cor original para um único DataBufferInt ARGB. Usa um pixel intermediário e
buffers de linha; a view final compartilha o buffer. Não decodifica uma segunda
página inteira para conversão. Cor e alpha permanecem equivalentes ao decode
de referência do JDK nas fixtures. JDK 23 foi inspecionado localmente para os
padrões de escrita; outro runtime/plugin exige admissão, não fallback automático.

Uma capacidade cobre decode→pintura→encode por JVM, sem fila; interrupção
preservada. Native mantém seu timeout e finalização antes de liberar capacidade.
O WebP final verificado vincula o manifesto completo, IDs, ordem, geometria,
hashes OCR/tradução e fallback existente. Sucesso transfere somente o arquivo
novo ao chamador; falha remove paths possuídos, nunca original ou sentinela.
Exceções são internas/sanitizadas, sem causas ou logs de texto/paths/job.

Não há deadline global, pico de memória em volume comprovado, distribuição do
codec de produção ou revisão visual/linguística nesta parcela. Esses pontos
permanecem abertos, assim como upload/commit/READY/URLs/ACK/TTL integrados.

## Testes e falhas observadas

Testes precederam os novos tipos: fase vermelha por classes ausentes observada.
Destinos INT_RGB/ARGB diretos falharam em PNG cinza/paleta; JPEG cinza mudava
aparência. A conversão foi corrigida, sem excluir variantes ou tolerar pixels
diferentes. No macOS, a comparação lexical /var vs /private/var falhou no teste
de arquivos; a comparação passou a usar paths canônicos, sem relaxar o diff.

51 testes novos/focados passaram: 31 decoder, 12 adapter e oito native opt-in.
Cobrem RGB/RGBA, cinza 8/16-bit, paleta/1-bit, gray-alpha/RGBA 16-bit,
progressivo/interlaçado, compartilhamento do buffer, divergências de input,
imagens truncadas/animadas, falta de arquivo, symlink, interrupção, capacidade
concorrente, erro de pintura/codec e remoção de saída após manifesto inválido.

A regressão adicional de JPEG sem EOI reproduziu a aceitação silenciosa pelo
JDK, que reparava o término e retornava pixels. Avisos do decoder agora falham
de forma sanitizada, sem registrar sua mensagem. Imagem incompleta não vira
resultado válido; as fixtures válidas continuam aprovadas.

Native usa somente libwebp 1.6.0 já preparado. JPEG/PNG/WebP percorrem o
adapter completo e são comparados pixel a pixel fora de um polígono inclinado.
Página vazia conserva todos os pixels; fallback conserva a tradução inteira
após encode/decode estrito do manifesto. Limite de saída remove parciais e
preserva os bytes originais. Nenhuma imagem privada foi usada.

## Matriz parcial

| Critério | Evidência desta parcela                                                | Pendência integral                                    |
| -------- | ---------------------------------------------------------------------- | ----------------------------------------------------- |
| AC-001   | arquivo original intacto, diff externo ao polígono no WebP final       | worker, retenção e cancelamento transacional          |
| AC-002   | compositor/fontes existentes reutilizados no adapter                   | revisão visual/linguística e integração               |
| AC-003   | overflow completo e manifesto verificado no fluxo de arquivos          | commit e consumo final                                |
| AC-004   | zero regiões em JPEG/PNG/WebP, equivalência de todos os pixels         | estado terminal válido no worker                      |
| AC-005   | bytes/hash/MIME/dimensões do WebP final e vínculo íntegro do manifesto | storage remoto, URLs, ACK, TTL e confirmação perdida  |
| AC-006   | buffer compartilhado, limites antes de decode, concorrência/isolamento | profiling/caps nativos, memória/disco/deadline global |

## Fotografia técnica

231 arquivos: `e2c07411a860b22ce32c8f0b99753f1fb0bf2a69550a131ab48da6b393122bf8`.
Algoritmo preservado: src/scripts/openapi, pom.xml e Terraform tf/tfvars.example,
ordenados por path relativo; SHA-256 de path + NUL + bytes + NUL. Inclui fonts
empacotadas; não inclui docs/build/artefatos privados. Hashes históricos de
contratos/codec/fontes e OCR/tradução não foram renovados.

## Comandos e resultados

```bash
cd api
./mvnw -o -q -pl apps/translation-gateway -am test \
  -Dtest=ValidatedRasterDecoderTest,LocalFileRenderAdapterTest,LocalFileRenderAdapterNativeTest \
  -Dsurefire.failIfNoSpecifiedTests=false -Drenderer.native.enabled=true \
  -Drenderer.cwebp.path="${RENDER_CWEBP_PATH:?}" \
  -Drenderer.cwebp.sha256="${RENDER_CWEBP_SHA256:?}" \
  -Drenderer.dwebp.path="${RENDER_DWEBP_PATH:?}" \
  -Drenderer.dwebp.sha256="${RENDER_DWEBP_SHA256:?}"
```

Usar somente paths/hashes da admissão local da
[evidência do codec](rendering-codec-2026-10-03.md), não PATH/download implícito.
Sem opt-in, testes native são explicitamente ignorados.

Suíte completa gateway offline/Docker com opt-in passou: 593 testes/54 classes,
zero falhas/erros/ignorados. Suíte leve passou após permitir sockets locais:
a tentativa inicial dentro do sandbox falhou ao bind dos servidores gRPC
falsos; não foi falha de provider nem justificativa para excluir os testes.
Node tooling: 85 pass/um opt-in não executado. Web tsc -b passou.
Maven global e mobile integral são registrados na review após suas execuções;
este texto não presume resultados futuros nem renova conclusões de outras specs.

MOB-DEC-007: runtime mobile não foi alterado; medição de aparelho não se aplica
a esta parcela Java/documental. Profiling gateway/Android integral continua em
TASK-008. Nenhuma chamada paga, deploy, credencial, migration ou upload ativado.
