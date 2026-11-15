# Candidata volátil 4 — verificação local em 2026-11-02

## Artefato e escopo

- Imagem: `sha256:d183df35e843fdb2e9517d27c2e0c0cfb09d1bca43895c637f825657678de08c`.
- JAR: `50fef1f9ef2ce52e9c9c05f4f3e2c6bb810635d0e188df6b6b4c5710586b357d`.
- Manifesto ARM64/glibc: `bfe9572c3113f805c15634c8e3106b74a2b925735767424269b5e81fc46a3a58`.
- Limites do servidor: 8 GiB agregados, swap zero, 64 PIDs, scratch 512 MiB;
  filha com heap 256 MiB. Mesma política WebP lossless/exact e fontes Noto.

O OCR produtivo agora tem somente a entrada de bytes de `InlineOcrPort`.
Construção de requests GCS/URI, porta antiga, adapter e wiring worker foram
retirados do artefato produtivo e preservados em suporte histórico de teste.
O mapper usa contexto de operação/dimensões sem referência de objeto; algoritmo,
IDs e ordem foram preservados. Guardas falharam antes da retirada e passaram
após ela. Sete hints, limites, timeout ambíguo, UNAVAILABLE, erro embutido e
resposta excedente são exercitados diretamente no adapter inline atual.

Estas provas locais usam fixtures sintéticos e serviços gRPC privados. Não
chamam providers pagos, não aprovam qualidade de OCR/tradução real, aparelho,
políticas publicadas ou produção. A prova da candidata 3 permanece identificada
como daquela versão; esta prova usa os bytes exatos da candidata 4.

## HTTP e falhas na candidata atual

As rodadas privadas 6 e 7 passaram com cinco OCR/quatro traduções, inlineViolations=0,
cinco recibos, zero jobs legados, ausência de conteúdo/arquivos regulares no
scratch e `pids.events=max 0`. Picos totais: 1929252864 e 1929048064 bytes, sem OOM.

Exercita autenticação, owner scope, replay sem nova cobrança, concorrente
recusado antes de provider, morte da filha durante página máxima, página válida
seguinte, falha OCR e recuperação. Resposta direta é validada pelo cliente
separado. Apenas o cliente monta os arquivos de entrada, sem mount de imagens
no servidor; nenhuma porta é publicada e a rede é interna.

## Matriz nativa atual

Oito cenários / 22 renders passaram, sem OOM ou arquivos de conteúdo ao fim.
A primeira linha inclui sete destinos; as três páginas 10000×8000 são PNG,
JPEG e WebP. Comparação independente em segunda JVM verifica preservação fora
da região e a imagem inteira quando não há regiões.

| Dimensões | Renders | Pico agregado em bytes | Conteúdo ao fim |
| --- | --- | --- | --- |
| 320 × 220 | 8 | 556638208 | 0 |
| 10000 × 8000 | 2 | 1410174976 | 0 |
| 10000 × 8000 | 2 | 1436815360 | 0 |
| 10000 × 8000 | 2 | 1312923648 | 0 |
| 12000 × 6666 | 2 | 1364439040 | 0 |
| 6666 × 12000 | 2 | 1398775808 | 0 |
| 12000 × 1 | 2 | 467722240 | 0 |
| 1 × 12000 | 2 | 336490496 | 0 |

## Amostras visuais recebidas pelo cliente

Nove respostas adicionais passaram: sete destinos, imagem genuinamente sem
texto no fixture e overflow. O cliente separado salva WebP/manifesto apenas no
seu mount privado de saída; o servidor não recebe esse mount. Nove OCR/oito
traduções confirmam que vazio não chama tradução. Pico agregado do servidor:
896724992 bytes, zero OOM, `pids.events=max 0`, scratch sem arquivos regulares.

A comparação de pixels no host cliente usa dwebp 1.6.0 existente e pngjs 3.4.0
já instalado no workspace. Verificou 8699904 pixels: nenhuma mudança fora da
região OCR, e imagem vazia integralmente idêntica. Hash/tamanho dos nove WebPs
correspondem aos manifestos. A inspeção visual do integrador e revisão
independente automatizada não observaram glyph ausente, clipping ou invasão de
arte nestas amostras; isso não generaliza qualidade a qualquer página/idioma.

O overflow conserva integralmente 4860 caracteres, `overflow=true` e
`fontSizePx=0`. Os três pontos no raster são visualmente fracos; a 021 deve
apresentar indicação perceptível e acesso ao texto completo. Esta prova não
implementa nem aprova a experiência de fallback no aplicativo. Apenas mostrar
o WebP de overflow deixaria a tradução inacessível.

## Gates e proveniência

O pacote completo da candidata passou com 1435 testes, zero falhas/erros e
114 skips opt-in antes da adição do opt-in visual. A raiz completa atualizada passou depois: 2848 testes, zero falhas/erros,
115 skips, 467 XMLs todos reescritos na rodada. Os opt-ins desta evidência foram
executados separadamente, sem skip. Recibo em `root-tests-20261102-4/` no
mesmo diretório de evidências locais; isso não aprova operação pública.

Recibos locais sob `.local/mob020-volatile-20261101/` na raiz do checkout:

- `ocr-retirement-candidate-4-20261102/`: pacote, guard red, falhas inline e fontes.
- `pre-ocr-uri-retirement-20261102/`: fontes anteriores preservadas com hashes.
- `http-native-integration-20261102-6/` e `-7/`: Maven, logs operacionais e métricas.
- `native-candidate-4-matrix-20261102/`: oito medições e XML/texto da matriz.
- `visual-client-candidate-4-20261102-1/`: nove WebPs/manifestos, originais
  sintéticos, métricas, verificador de pixels e receipt com hashes dos arquivos.

Os arquivos de imagem desse último diretório são artefatos do cliente de teste,
sem mídia de usuário. Logs do servidor foram conferidos sem textos-fonte,
traduções ou bearer. A prova não representa rastreamento universal de syscalls,
remoção de conteúdo de versões antigas ou admissão do serviço público.
