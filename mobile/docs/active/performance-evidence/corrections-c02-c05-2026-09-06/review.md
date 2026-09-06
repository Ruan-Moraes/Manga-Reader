# Correções C02/C05 — 2026-09-06

Estado: código e testes implementados; validação nativa pendente. Autorização:
continuação humana das correções. Gates 005/007 já abertos e requisitos previamente
aprovados, sem novo requisito, dependência, endpoint, schema ou configuração de runtime.

## C02 / MOB-PERF-001 — Leitor vertical

`ReaderViewport` usa FlatList sobre as páginas lógicas. `verticalPageLayouts`
calcula alturas por WIDTH/HEIGHT/ORIGINAL e offsets acumulados com gap. Assim,
retomada distante não precisa montar imagens anteriores. Erros/retries continuam
no dono do viewport, sobrevivendo à desmontagem das células. O espaço da imagem
é preservado; mensagens que exigem mais altura são medidas para acomodar retry
acessível. Reflow reinicia a lista na página lógica e invalida medições antigas.

Ajustes iniciais: batch 3, windowSize 5 e clipping nativo desativado. São escolhas
provisórias, não orçamento de produto nem parâmetros declarados ótimos. Risco:
fill rate em rolagem rápida, imagens muito curtas, reflow, remount das células,
leitores de tela e custo nativo de decode/cache. Imagens mantêm fontes e qualidade.

Evidência estática anterior: [trechos históricos](../source-excerpts.md), montagem
integral via ScrollView. Testes atuais usam a FlatList real do RN no Jest e imagem
mockada, verificando quantidade inicial menor que o total em 10/67/200 páginas,
leitura indexada linear, retomada em 100/200 sem montar a primeira página,
geometria heterogênea com três fits, gaps e largura de rotação, preservação do fundo,
labels DOUBLE LTR/RTL e último par ímpar. Falha de página curta cresce para comportar
retry e restaura geometria ao tentar novamente. Esses asserts comprovam mecanismos,
não bytes de memória, frames ou tempos. Não há baseline físico novo.

Aceite aberto (TASK-010 da 005): protocolo de aquecimento + cinco repetições em
release, mesma fixture/rede/cache/aparelho; testar rolagem rápida e lenta, retorno,
fit/rotação, erro/retry, fonte ampliada e VoiceOver/TalkBack. Medir janela montada,
frames, memória JS/nativa e retenção após entradas/saídas. Aprovar performance só
se o ganho superar a variabilidade sem regressão funcional ou de outras dimensões.

Reversão isolada: restaurar somente o viewport/layout e testes de C02 para ScrollView
com offsets medidos, mantendo C01 (mapa de numeração) e demais correções.

## C05 / MOB-PERF-005 — Exportação

`exportMyData(uri, signal)` usa o mesmo cliente Axios com adapter de download
FileSystem. Request/response interceptors preservam token, idioma, refresh único
e erros HTTP. Cada tentativa respeita timeout e signal. O corpo não passa por
parse/stringify no JS; o adapter retorna somente status/headers e data undefined.
O proprietário cria subdiretório temporário por UUID e mantém o nome datado/MIME/UTI.
A troca de identidade cancela preparação/download, espera seu resultado e limpa;
conclusão nativa tardia também tenta remover o destino isolado. Timeout não aguarda
indefinidamente a confirmação nativa de cancelamento. Share sheet já aberta segue
as limitações da plataforma; não há API para fechá-la programaticamente.

Capacidade conferida no pacote expo-file-system instalado (hashes em
[source-hashes.json](source-hashes.json)): Android `downloadResumableTask` copia
`response.body.byteStream()` para `FileOutputStream`; iOS delegate move o arquivo
URLSession. Ambos substituem o arquivo quando repetem download. MD5 não solicitado,
evitando a leitura integral opcional do iOS. A API legada já era usada no projeto.
Não elimina buffers/tarefas nativos nem reduz a memória do servidor (DT-71 separada).

Testes com cliente Axios real e filesystem controlado cobrem endpoint, auth/idioma,
refresh único de dois 401 concorrentes, respostas 403/500, falha/indisponibilidade
nativa, timeout, abort antes/durante download, limpeza tardia, nenhuma resposta JSON
retornada ao JS, guest sem operação, falha/retry, preparação cancelada, indisponibilidade,
share sheet encerrada/falha e armazenamento contando somente arquivos. A limpeza
não remove tokens, settings ou progresso. Ausência de materialização no cliente é
confirmada por código; equivalência dos bytes efetivamente baixados/compartilhados
em Android/iOS e redução de pico de memória ainda não foram medidas.

Riscos: diferenças de FileSystem entre plataformas, falha de disco/cleanup, transporte
nativo atrasado, redirect/rede degradada e share sheet. Uma falha nativa de cancelamento
ou remoção pode adiar a liberação do recurso; não prometer eliminação imediata em
qualquer plataforma. Não gravar payloads privados em fixtures, logs ou traces.

Aceite aberto (TASK-007 da 007): baixar JSON sintético pequeno/intermediário/grande de
resposta controlada, comparar bytes e conteúdo do arquivo compartilhado, repetir
401, abort, offline, disco cheio e troca de identidade; conferir temporários após
repouso e entradas/saídas. Medir memória JS/nativa, CPU, duração, rede e disco com o
mesmo protocolo. Sem limite de produto ou benefício numérico inventado.

Reversão isolada: restaurar assinatura payload de exportMyData/JsonExportAdapter,
caller e testes C05, remover o adapter e sua exportação/cobertura. Nenhum dado
persistido ou schema precisa de migração. Reversão reintroduz materialização original.

## Verificação e rastreabilidade

- Testes focados: 6 suítes / 48 testes passaram, sem snapshots. O conjunto inclui
  ChapterReader; essa suíte emite avisos de act de Icon, sem falha. Não foram ocultados.
- `pnpm check`: passou com 95 suítes / 588 testes, zero snapshots; specs, links,
  TypeScript, ESLint, FSD e formato verdes. Avisos de act já presentes em testes de
  Icon/AsyncStorage não foram suprimidos. `git diff --check` dos caminhos alterados passou.
- Ambiente de 2026-09-06: `adb devices -l` sem aparelho; iPhone 17/iOS 26.5 simulado
  ativo, sem build release do projeto identificado. Não houve envio de mídia ou
  request externo autenticado; HTTP e filesystem nos testes foram controlados.
- [Hashes do código](source-hashes.json): árvore local inclui mudanças anteriores,
  não equivale ao HEAD. Inventário da auditoria e evidências da primeira rodada
  permanecem históricos; não foram reescritos como se descrevessem esta versão.
- A revisão SDD mantém 005 em verification-pending e reabre 007 nesse estado. DT-75
  segue aberta; hipóteses restantes não foram promovidas a defeitos sem medição.

Referências oficiais consultadas: [FlatList](https://reactnative.dev/docs/flatlist)
e [FileSystem legacy](https://docs.expo.dev/versions/latest/sdk/filesystem-legacy/).
Para compatibilidade, o código/tipos instalados RN 0.86.3 e Expo FS 57.0.6 foram
inspecionados; referências latest não substituem a versão local.
