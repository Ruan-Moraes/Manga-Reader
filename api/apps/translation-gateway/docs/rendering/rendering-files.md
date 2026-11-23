# Renderer de arquivos — plano de execução, 2026-10-03

Parcela de TASK-005 da MOB-FEAT-020. O adapter explícito implementa RenderPort,
sem bean, ativação, provider ou integração transacional nesta parcela.

## Persistência antes do código — database-design

- Banco escolhido: PostgreSQL continua dono dos estados/metadados do pipeline;
  arquivos efêmeros continuam no storage privado. O adapter não acessa banco
  nem bucket: produz somente arquivo local temporário para o futuro chamador.
- Modelo BCNF: nenhuma entidade/tabela/coluna é criada ou alterada. Contratos
  RenderRequest, RenderedImage e RenderManifest já existentes são reutilizados;
  texto e pixels não serão persistidos no PostgreSQL.
- Integridade: conferir bytes, MIME, dimensões e SHA-256 do original antes do
  decode, contra o snapshot do job recebido. O manifesto vincula imagem,
  OCR/tradução e IDs/ordem sem alterar esses inputs.
- Índices e derivados: nenhum índice, contador ou cache novo.
- Migration e código: nenhuma V6 neste incremento. Alterar adapters e testes
  de arquivos em conjunto. Reserva, schema de artefatos, commit/READY e retenção
  remota exigem o próximo plano concreto, após inspeção de V1–V5/ACK.

## Decode e propriedade dos recursos

Revalidar em snapshot comprimido privado limitado a 12 MiB (ou limite menor da
política); nunca pintar/reabrir o caminho original depois da verificação. Antes
de alocar raster, confirmar dimensões/80 milhões de pixels e formato estático.
JPEG/PNG usam leitores locais do JDK, sem URLs, plugins externos, subsampling
ou redução de qualidade. PNG animado e WebP animado são rejeitados. WebP usa o
codec preparado, com hash e timeout já existentes.

Um buffer de pixels por decode: os leitores escrevem no modelo de cor de
origem em um bridge local, que converte cada escrita para o mesmo DataBufferInt
ARGB usando um raster de apenas um pixel. A view final compartilha esse buffer.
Não fazer ImageIO.read seguido de cópia integral/conversão da página.
Metadados/dimensões do leitor também devem corresponder ao snapshot, não só
ao cabeçalho inicial. Fonte/codec não são baixados durante render.

Limitar o ciclo completo decode→pintura→encode a uma execução por JVM, sem
fila. O orçamento nativo existente limita cada processo; interrupção é
verificada antes/depois das operações e durante o decode/pintura. Não declarar
deadline global ou profiling de memória comprovados por isso.

O adapter cria arquivos de saída somente no diretório temporário autorizado.
Sucesso transfere propriedade de um WebP ao chamador; falha remove apenas
paths criados pela execução, nunca original, diretório compartilhado ou
arquivos de outra rodada. Falha de limpeza é explícita e sanitizada.

O WebP final é lossless/exact, verificado pelo codec e vinculado ao manifesto
completo. Página vazia continua equivalente; overflow mantém tradução inteira.
Nenhum caminho, texto, ID, exceção bruta ou hash entra nas mensagens de erro.

## Verificação planejada

Testes anteriores ao código: JPEG/PNG reais em variantes RGB/RGBA/cinza/paleta,
dimensões/hash/MIME/bytes divergentes, limites antes de decode, arquivo ausente,
symlink, imagem truncada/animada, cancelamento, concorrência, erros de codec/
pintura e isolamento/limpeza. Native opt-in: arquivo→pintura→WebP→decode,
pixels externos preservados, vazio, fallback e manifesto íntegros. Fixtures
sintéticas não são revisão visual/linguística nem benchmark nativo em volume.

Gateway leve/completo, Maven global offline com Docker, web type-check,
pnpm check, SDD/links/formato direcionado e git diff --check. Defaults, task,
/v1, migrations e manifests OCR/tradução permanecem inalterados.

## Execução e limites constatados

Adapter de arquivos explícito entregue, sem chamador de produção. Fase vermelha
por classes ausentes reproduzida. A hipótese inicial de escolher diretamente
um destino INT_RGB/ARGB falhou nas variantes cinza/paleta e mudou a aparência
do JPEG cinza. Em vez de excluir essas fixtures ou tolerar pixels diferentes,
o bridge converte as escritas no modelo de origem. JDK 23 local inspecionado:
PNG escreve pixels e JPEG fornece scanlines; nenhum código do JDK foi copiado.

Os testes verificam igualdade da aparência decodificada pelo JDK, identidade
do DataBuffer compartilhado e PNG RGB/RGBA/cinza/paleta/1-bit/16-bit/gray-alpha,
JPEG RGB/cinza/progressivo e PNG interlaçado. WebP é decodificado pelos tools
verificados. APNG/ANIM/ANMF, limites de chunks e inconsistência RIFF falham
antes do native. A seleção dos leitores é explicitamente limitada às classes
PNG/JPEG do OpenJDK; outro runtime exige admissão/testes, sem fallback silencioso.
Avisos dos leitores são tratados como falha sanitizada: JPEG sem EOI não é
aceito pela reparação permissiva do JDK. Essa regressão foi reproduzida antes
da correção, sem excluir formatos válidos.

Uma falha inicial dos testes nativos era comparação lexical de /var e /private/var
no macOS: o adapter devolve caminho canônico, e o teste foi corrigido para
conferir arquivos canônicos. Não foi reduzido o diff de pixels.

Há uma execução completa de render por JVM, sem fila. Não existe deadline global
de decode/pintura, profiling nos 80 milhões de pixels ou empacotamento libwebp
de produção comprovado. Esses itens continuam nas tasks de integração/recursos
e validação. O bridge depende dos padrões de escrita dos leitores admitidos,
cobertos por fixtures; não autoriza plugins externos.

Sucesso entrega ao chamador apenas WebP novo e manifesto, com arquivo original
intacto. Nenhuma transação ou estado READY foi introduzido: retenção remota,
artefatos finais no bucket, URLs/ACK e cleanup continuam pendentes.
