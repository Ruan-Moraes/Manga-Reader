---
id: MOB-FEAT-024
type: feature
title: Progresso da tradução no leitor e no projeto
status: verification-pending
implementation_gate: open
blocked_by: [MOB-FEAT-022]
created: 2026-11-20
updated: 2026-11-20
supersedes: []
superseded_by: []
---

# MOB-FEAT-024 — Progresso da tradução no leitor e no projeto

## Objetivo

Enquanto um capítulo é traduzido, o leitor deve deixar claro que página ainda está sendo traduzida, e a página
traduzida deve entrar no lugar do original sem um salto brusco. O cartão do projeto deve dizer em que estado o
projeto está.

## Contexto e contratos relacionados

- Complementa a `MOB-FEAT-022/AC-006`, a leitura parcial:
    - a página sem resultado mostra o original;
    - o leitor recarrega os resultados a cada 4 s.
- O leitor é o da `MOB-FEAT-051`, em `widgets/content-reader` e `LocalTranslationReaderPage`.
- O cartão "Projeto preparado" fica em `pages/offline-translation/ui/OfflineTranslationPage.tsx` e vem da
  `MOB-FEAT-016`.

## Requisitos e regras

- **Toast "Traduzindo":**
    - num projeto que ainda tem páginas sem resultado, o leitor mostra o toast do app, o mesmo do web
      (`web/apps/toonlira/src/shared/ui/toast`), com "Traduzindo…" e "X de N páginas prontas";
    - o toast fica no topo, encostado na borda direita da tela, como uma notificação: abaixo da área segura, sem
      margem à direita, arredondado só à esquerda, com até 320 de largura (sempre deixando uma faixa da página à
      esquerda), e entra deslizando da borda; superfície com borda, filete colorido à esquerda conforme o tom, ícone
      num quadrado tonal, título em negrito, descrição e botão de dispensar;
    - o toast fica enquanto faltarem páginas, a não ser que a pessoa o dispense;
    - quando todas as páginas ficam prontas, ele vira "Tradução pronta" e some sozinho em cerca de 4 s;
    - as páginas ainda em tradução mostram o original, sem selo sobre a imagem.
- **Fade:**
    - quando a tradução de uma página chega e substitui o original, a imagem traduzida entra por cima do original
      com um fade de opacidade de 0 a 1 em cerca de 300 ms, começando só depois que ela carregou;
    - com "Reduzir movimento" ativo no sistema, a troca é imediata;
    - páginas que já abrem traduzidas não animam.
- **Cartão do projeto:**
    - o título e a descrição seguem o estado do projeto;
    - preparado (`DRAFT`): o texto de hoje;
    - na fila ou em processamento: "Tradução em andamento", com as páginas protegidas localmente;
    - pronto: "Tradução pronta", que pode ser lida sem internet;
    - falhou ou cancelado: o estado, sem dizer que o processamento não começou;
    - tudo nos três idiomas.

## Casos de erro

- **A tradução não carrega:** o original continua visível e nada anima. O erro de página da 051 só aparece se a
  imagem traduzida falhar depois de pronta.

## Critérios de aceite

### AC-001 — Toast de tradução em andamento

Num projeto parcial, o leitor mostra o toast "Traduzindo…" com a contagem de páginas prontas; ele pode ser
dispensado e vira "Tradução pronta" quando a última página chega.

### AC-002 — Fade ao substituir o original

A página que recebe a tradução durante a leitura troca o original pela tradução com fade de opacidade (~300 ms),
e a troca é imediata com "Reduzir movimento".

### AC-003 — Cartão do projeto conforme o estado

O cartão mostra textos de "preparado", "em andamento", "pronto", "falhou" ou "cancelado" conforme o estado, nos três
idiomas.

## Estratégia de evidência

| Critério | Teste/evidência esperada                               |
| -------- | ------------------------------------------------------ |
| AC-001   | RNTL do toast e do leitor com projeto parcial          |
| AC-002   | RNTL do `ImageSurface` (animação e movimento reduzido) |
| AC-003   | RNTL da página nos três locales e estados              |

## Gate de implementação

- Estado: `open`; a `MOB-FEAT-022` está em `verification-pending`.
- Dependência: `MOB-FEAT-022`.

## Fora de escopo

- Notificação ou som quando a página fica pronta.
- Animações em outras telas.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-11-20

Aprovada no chat ("Aprovo a 024"), depois do resumo dos três itens. Em 2026-11-20, Ruan pediu que o "Traduzindo"
fosse um toast igual aos do app ("Gostaria que o traduzindo fosse um toast, igual aos toast da aplicação"), o que
substituiu o selo sobre a página. Ele esclareceu que é a barra de notificação colada no lado direito da tela, a do
web; o mobile não tinha toast, então o componente foi portado para `shared/ui/Toast`. Depois de vê-lo no simulador,
pediu o canto superior direito ("Coloque na parte do topo direito. Colado do lado direito.") e depois encostado na
borda, como as notificações ("Coloque ele colado no lado direito da tela. Semelhante as notificações").
