---
id: MOB-FEAT-005
type: feature
title: Leitor de capítulos
status: draft
created: 2026-08-08
updated: 2026-08-08
implementation_gate: blocked
blocked_by: [MOB-FEAT-001, MOB-FEAT-004]
supersedes: []
superseded_by: []
---

# MOB-FEAT-005 — Leitor de capítulos

## Objetivo

Permitir a leitura mobile de capítulos publicados com navegação acessível, preferências previsíveis e continuidade de progresso para pessoas autenticadas, sem expor controles que não alterem o resultado da leitura.

## Contexto e contratos relacionados

- Depende da fundação de configurações definida em `MOB-FEAT-001` e da política de idiomas de conteúdo de `MOB-FEAT-004`.
- Substitui parcialmente o placeholder de conteúdo descrito em `MOB-BASE-008/OBS-001`; não altera as demais superfícies desse baseline.
- O capítulo para leitura é obtido por `GET /titles/{titleId}/chapters/{number}/reader`. O contrato fornece `id`, `titleId`, `number`, `title`, `status` e páginas prontas com `id`, `order`, `imageUrl`, `thumbnailUrl`, `width` e `height`.
- A continuidade autenticada usa `GET /users/me/reading-progress/{titleId}` e `PUT /users/me/reading-progress`, cujo payload contém `titleId`, `chapterNumber`, `currentPage`, `totalPages` e `completed`.
- O endpoint público do capítulo não torna o progresso público: leitura anônima não chama endpoints `/users/me`.

## Requisitos e regras

- O leitor deve ocupar a área útil da tela e manter os controles de navegação ocultáveis, sem encobrir permanentemente a página ou depender somente de gestos não descobríveis.
- As páginas devem ser apresentadas pela ordem numérica crescente de `order`. Registros duplicados ou fora de ordem não podem mudar essa sequência.
- Os modos suportados são `VERTICAL`, `PAGED` e `DOUBLE`. A direção é `LTR`, `RTL` ou `WEBTOON`; `WEBTOON` usa fluxo vertical contínuo, enquanto LTR e RTL determinam o avanço nos modos paginados.
- `DOUBLE` deve preservar a ordem de leitura escolhida, formar pares sem repetir páginas e apresentar a última página sozinha quando a quantidade for ímpar.
- O ajuste de imagem aceita `WIDTH`, `HEIGHT` e `ORIGINAL`; nenhuma opção pode cortar conteúdo sem uma ação explícita de zoom ou pan da pessoa.
- Saturação deve aceitar valores inteiros de 0 a 100, espaçamento entre páginas de 0 a 32 e preload de 0 a 10 páginas adjacentes.
- O fundo aceita `BLACK`, `DARK`, `PAPER`, `LIGHT` e `WHITE` e afeta somente a superfície do leitor, sem alterar o tema global.
- A preferência de qualidade aceita `AUTO`, `LOW`, `MEDIUM`, `HIGH` e `ORIGINAL` no modelo sincronizado. O controle só pode aparecer quando a resposta ou o serviço de imagens oferecer fontes materialmente distintas para todas as opções exibidas; com apenas `imageUrl` e `thumbnailUrl`, a UI não deve prometer LOW/MEDIUM/HIGH.
- A pessoa autenticada deve retomar o título no capítulo e página retornados pelo progresso mais recente, oferecendo escolha entre continuar e iniciar o capítulo solicitado quando os dois diferirem.
- O progresso deve usar páginas numeradas a partir de 1, nunca exceder `totalPages` e ser enviado somente para pessoa autenticada. Falha de sincronização não deve interromper a leitura e deve permanecer indicada como pendente para nova tentativa.
- Com `autoMarkRead` ativo, alcançar a última página de um capítulo com total conhecido deve persistir `completed: true`; fora dessa condição, o leitor não pode marcar o capítulo como concluído.
- Alterações de preferências feitas dentro do leitor devem usar o mesmo contrato de `MOB-FEAT-001` e aparecer posteriormente nas configurações, sem estado paralelo.
- Em FSD, modelos e queries de capítulo/progresso pertencem a `entities`; ações de navegação, preferências e persistência pertencem a slices de `features`; a composição full-screen pertence a `pages` ou `widgets`; adaptadores de imagem, viewport e armazenamento agnósticos ao domínio ficam em `shared`.

## Casos de erro

- Capítulo inexistente, indisponível ou sem páginas prontas deve produzir estado localizado com saída segura para a obra, sem tela vazia ou conclusão automática.
- Falha de uma imagem deve manter a posição atual e oferecer nova tentativa daquela página; outras páginas já carregadas permanecem utilizáveis.
- Uma resposta de progresso inválida ou referente a página inexistente deve ser ignorada em favor da primeira página válida e registrada como erro observável, sem quebrar o leitor.
- Expiração da sessão durante a leitura deve preservar a leitura pública e interromper apenas a sincronização privada, seguindo o tratamento de sessão vigente.
- Mudança de conta deve descartar progresso em memória da conta anterior antes de consultar o progresso da nova conta.

## Critérios de aceite

### AC-001 — Capítulo e páginas ordenadas

Dado um capítulo publicado com páginas prontas recebidas fora de ordem, quando o leitor abrir, então ele deve renderizar cada página uma única vez em ordem crescente de `order` e mostrar um estado de indisponibilidade quando não houver página válida.

### AC-002 — Modos e direção de leitura

Dadas as mesmas páginas, quando a pessoa alternar entre `VERTICAL`, `PAGED` e `DOUBLE` e entre LTR, RTL e WEBTOON, então a sequência de conteúdo deve permanecer íntegra, WEBTOON deve usar fluxo vertical e a página ímpar final de DOUBLE deve aparecer sozinha.

### AC-003 — Preferências visuais

Quando fit, saturação, gap, fundo ou preload forem alterados, então o leitor deve aplicar valores dentro dos intervalos definidos, persistir pelo contrato único de settings e restaurá-los na próxima abertura.

### AC-004 — Qualidade com efeito comprovável

Dado que o contrato disponível fornece somente `imageUrl` e `thumbnailUrl`, quando as configurações do leitor forem exibidas, então opções LOW, MEDIUM e HIGH não devem ser selecionáveis; elas só podem ser liberadas por fontes distintas verificáveis.

### AC-005 — Leitura guest sem escrita privada

Dada uma sessão anônima, quando um capítulo público for lido, então nenhuma chamada a `/users/me/reading-progress` deve ocorrer e todas as funções locais do leitor devem continuar disponíveis.

### AC-006 — Retomada autenticada

Dado progresso recente válido de uma pessoa autenticada, quando ela reabrir o título, então deve poder continuar no `chapterNumber` e `currentPage` retornados; ao trocar de conta, nenhum progresso da conta anterior deve ser reutilizado.

### AC-007 — Progresso e conclusão

Dada uma pessoa autenticada, quando uma página válida se tornar a posição corrente, então o payload salvo deve usar índices entre 1 e `totalPages`; ao alcançar a última página com `autoMarkRead` ativo deve enviar `completed: true`, e em qualquer outra situação não deve concluir automaticamente.

### AC-008 — Falha não destrutiva

Quando uma imagem ou a sincronização de progresso falhar, então a leitura e a posição corrente devem ser preservadas, a falha deve ser comunicada de forma localizada e deve existir uma tentativa posterior sem duplicar páginas ou regredir progresso mais novo.

### AC-009 — Acessibilidade e rotação

Quando leitor de tela, escala de fonte, redução de movimento ou rotação do dispositivo estiverem ativos, então controles devem manter nomes e alvos acessíveis, transições não essenciais devem respeitar a preferência e a posição lógica da página deve ser preservada.

## Estratégia de evidência

| Critério | Teste/evidência esperada                                                                         |
| -------- | ------------------------------------------------------------------------------------------------ |
| AC-001   | Teste de integração do mapper/query e da renderização ordenada, incluindo capítulo vazio         |
| AC-002   | Testes de unidade da sequência por modo/direção e testes de interação do leitor                  |
| AC-003   | Testes de integração com o store de settings e testes visuais funcionais por valor limite        |
| AC-004   | Teste de capacidade que oculta opções sem variantes e as libera somente com fontes distintas     |
| AC-005   | Teste de integração com sessão guest e as chamadas HTTP inspecionadas                            |
| AC-006   | Testes de integração de retomada, capítulo divergente e mudança de conta                         |
| AC-007   | Testes de payload nos limites, auto-mark ativo/inativo e total desconhecido                      |
| AC-008   | Testes de falha de imagem e de rede com retry, preservação e rejeição de resposta obsoleta       |
| AC-009   | Teste de acessibilidade automatizado e matriz manual iOS/Android para rotação e leitores de tela |

## Gate de implementação

- Estado: `blocked`
- Dependências: `MOB-FEAT-001`, `MOB-FEAT-004`
- Motivo: o leitor depende da fundação de preferências e da política efetiva de idiomas de conteúdo.

O gate só pode ser aberto quando as duas dependências estiverem `implemented`.

## Fora de escopo

- Download offline de capítulos ou biblioteca offline.
- Comentários, avaliações ou navegação de catálogo ao redor do leitor.
- Zoom, recorte ou processamento destrutivo das imagens no servidor.
- Opções de qualidade sem variantes reais no contrato de conteúdo.
- Alterações nos endpoints ou no processamento editorial de páginas.

## Aprovação humana

- Aprovador: pendente
- Data: pendente

Não criar `tasks.md` antes de status `approved`, aprovação preenchida e `implementation_gate: open`.
