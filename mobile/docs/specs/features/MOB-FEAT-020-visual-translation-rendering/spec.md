---
id: MOB-FEAT-020
type: feature
title: Renderização visual da tradução
status: in-progress
implementation_gate: open
blocked_by: [MOB-FEAT-019]
created: 2026-08-15
updated: 2026-11-02
supersedes: []
superseded_by: []
---

# MOB-FEAT-020 — Renderização visual da tradução

## Decisão vigente e aprovação da revisão

Esta versão substitui integralmente as regras anteriores deste arquivo sobre
conteúdo remoto. A direção foi aprovada explicitamente por Ruan em
2026-11-01: processamento volátil em memória, entrega ao cliente e manutenção
de logs operacionais sanitizados. A solicitação inclui substituir o conteúdo
anterior das especificações. Não se trata de aprovação da implementação.

Referências normativas: [MOB-DEC-008](../../../decisions/MOB-DEC-008-volatile-processing.md)
e [arquitetura do gateway](../../../../../docs/volatile-processing-architecture.md).
A [versão anterior](evidence/pre-volatile-spec-2026-11-01.md) e as provas
anteriores permanecem históricas, sem herdar seus aceites para este transporte.

## Objetivo

Gerar uma imagem traduzida legível da primeira página em memória, alterando
somente regiões textuais reconhecidas, preservando o original no aparelho e
oferecendo fallback para traduções que não caibam com segurança.

## Contexto e contratos relacionados

- Depende de `MOB-FEAT-019`; atende RF-TRN-021..026 e controla RSK-004/010/024.
- Renderização ocorre no servidor em processo isolado, fora da UI thread.
- Estratégia é caixa limpa determinística, com fontes licenciadas e codec
  fixado; inpainting generativo não pertence ao slice.
- A 021 verifica e mantém resultado/regiões no aparelho e abre o leitor.

## Requisitos e regras

- Receber original validado, OCR e tradução da mesma sessão em memória.
  Decode, composição, encode e comunicação entre processos não criam arquivos
  de imagem, raster, OCR, tradução ou manifesto no servidor.
- Validar formato real, hash, bytes, dimensões, pixels, vínculos e política
  antes de pintar. Nenhum conteúdo é reaberto de armazenamento remoto.
- Cada polígono é recortado/clampado; sobreposição é resolvida em ordem estável
  sem pintar fora da união textual necessária.
- Neutralizar região com cor estimada do entorno, sem alegar reconstrução de
  arte ou remoção perfeita do texto fonte.
- Usar Noto Sans/Noto Sans CJK empacotadas e licenciadas. Fonte, quebra de
  linha, alinhamento e contraste seguem o idioma destino.
- Reduzir tamanho da fonte até mínimo legível da política. Se não couber,
  marcar overflow e preservar tradução completa no manifesto para fallback
  local; não truncar silenciosamente.
- Tratar texto como conteúdo, sem HTML/markup executável.
- Página sem regiões produz resultado visual equivalente ao original,
  sem caixas artificiais.
- Saída WebP lossless/exact usa política versionada; hash, bytes, MIME e
  dimensões são calculados sobre a saída efetivamente entregue.
- Não manter cópias integrais redundantes do raster na aplicação. Buffers
  internos do codec são permitidos com versão/política fixadas e orçamento
  total limitado e medido, incluindo JVM, memória nativa, fontes, entradas,
  saídas e IPC. Heap/cache isoladamente não representam esse orçamento.
- Adquirir capacidade antes de ler/decode/call de provider: uma página pesada
  por instância e nenhuma fila ilimitada. Posse dos buffers e da capacidade
  termina somente após execução nativa e encerramento/limpeza confirmados.
- Timeout/cancelamento supervisiona o processo e impede transferência tardia
  de resultado; não liberar capacidade enquanto uma execução ainda puder usar
  seus buffers. Falha de memória não corrompe outra operação.
- Demonstrar limites defensivos e máximo aceito no pipeline completo antes da
  admissão operacional. Não redimensionar, perder qualidade ou truncar para
  fazer um teto experimental passar.
- Imagem final e manifesto são entregues diretamente na resposta autenticada
  da sessão, com limites e `Cache-Control: no-store`. Não há resultado remoto
  disponível para download posterior, URL de objeto ou confirmação de remoção.
- Encerramento perde conteúdo da sessão. Recibo durável registra somente
  metadados sanitizados; resultado produzido não comprova commit no aparelho.
- A implantação admitida desabilita swap, dumps de heap/core e captura de corpo
  por proxy/APM. Descartar referências/limpar buffers não promete apagamento
  físico verificável de toda memória do sistema.

## Dados e posse

Servidor não persiste conteúdo; fontes/bibliotecas de runtime não são mídia do
usuário. Original comprimido, raster nativo e saída têm dono explícito e vida
limitada à execução/entrega. Comunicação entre processos usa memória/pipes
limitados, sem staging de conteúdo em diretório temporário.

A persistência privada no aparelho pertence à 021: arquivo final e metadados
normalizados têm vínculo único com página/tentativa; cache de apresentação não
substitui o arquivo local verificado.

## Casos de erro

- Decode/encode, fonte ausente, limite de bytes/memória ou orçamento incompatível
  falham com código sanitizado; original do aparelho permanece íntegro.
- Geometria inválida bloqueia somente a operação atual.
- Overflow produz fallback completo em vez de truncamento.
- Timeout/interrupção impede sucesso tardio; encerrar processo antes de liberar
  sua capacidade, mesmo quando uma rotina ignora interrupção cooperativa.
- Queda da sessão não oferece recuperação do resultado no servidor; novo
  processamento depende de decisão explícita conforme a 017.
- Resposta/manifesto/hash divergente impede `READY` local.

## Critérios de aceite

### AC-001 — Alteração limitada e original preservado

O renderer modifica somente regiões válidas e nunca escreve sobre o original
privado no aparelho ou cria cópia de conteúdo persistente no servidor.

### AC-002 — Texto legível nos sete destinos

Fontes, wrapping, direção, contraste e caracteres suportam os sete códigos,
com fixtures e revisão visual sem glyph ausente conhecido.

### AC-003 — Overflow possui fallback completo

Texto que não couber não é truncado; o manifesto entregue sinaliza overflow e
conserva a tradução completa para o leitor.

### AC-004 — Página sem texto permanece visualmente válida

Zero regiões não cria caixas e entrega resultado equivalente ao original.

### AC-005 — Resultado verificável e entrega volátil

Imagem e manifesto limitados, vinculados e verificáveis por SHA-256/MIME/bytes/
dimensões chegam na resposta autenticada da sessão, sem persistência de conteúdo
no servidor ou possibilidade de download posterior após encerramento.

### AC-006 — Memória, concorrência e falha isoladas

O pipeline completo atende orçamento total demonstrado, sem raster redundante
na aplicação, com uma página pesada admitida antes de decode/providers. Timeout,
interrupção ou falha nativa não libera buffers/capacidade prematuramente, não
entrega resultado tardio e não corrompe outra página ou reduz qualidade.

## Estratégia de evidência

| Critério | Teste/evidência esperada                                                                    |
| -------- | ------------------------------------------------------------------------------------------- |
| AC-001   | golden fixtures, diff fora dos polígonos e inspeção de ausência de gravação                 |
| AC-002   | sete scripts/destinos, fontes licenciadas e revisão visual                                  |
| AC-003   | fixture overflow com manifesto entregue e tradução completa                                 |
| AC-004   | fixture arte-only e comparação de pixels                                                    |
| AC-005   | resposta direta autenticada, limites/hash/vínculos e sessão encerrada sem replay            |
| AC-006   | perfil total, admissão antes do decode e falhas/restart/cancel/timeout no ambiente admitido |

Provas do fluxo anterior são referências históricas e exigem revalidação quando
a interface, o ciclo de vida ou a posse dos buffers mudar. Aprovação visual ou
linguística anterior pode orientar fixtures, sem comprovar privacidade, entrega
ou recuperação da sessão atual.

## Gate de implementação

- Estado: `open` em 2026-11-02; dependências `MOB-FEAT-019` em `verification-pending`.
- A 019 encerrou sua revisão técnica independente, com correção de fences,
  provas atuais da candidata 5, raiz backend2859 sem falha e gate documental
  verde antes desta abertura. As verificações humanas/operacionais continuam
  explicitamente abertas e não significam implementação ausente.
- A abertura sequencial e o planejamento seguem a autorização de continuidade
  de Ruan/DEC-008. Não promovem aquisição, qualidade humana, ambiente alvo ou
  operação pública por inferência. Tasks devem provar a integração corrente.

## Fora de escopo

- Inpainting generativo, redesenho de arte, edição, onomatopeia avançada.
- Export/share, comparação avançada, lote e armazenamento de conteúdo no servidor.
- Admissão cloud ou aprovação visual inferida a partir de testes do desenho anterior.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-11-01

Ruan aprovou explicitamente implementar processamento estritamente volátil,
retorno ao cliente e logs operacionais padrão sanitizados; depois pediu substituir
as especificações antigas por esse requisito. Aprovação inicial do slice em
2026-08-15 permanece no histórico. Esta revisão não autoriza deploy, chamadas
pagas, nova infraestrutura ou publicação de textos legais sem o fluxo pertinente.
