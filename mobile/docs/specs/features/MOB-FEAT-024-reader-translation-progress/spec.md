---
id: MOB-FEAT-024
type: feature
title: Progresso da tradução no leitor e no projeto
status: draft
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

- **Selo "Traduzindo":**
    - num projeto que ainda tem páginas sem resultado, cada uma delas mostra o original com um selo discreto
      "Traduzindo…" sobre a imagem;
    - o selo usa tokens de tema e tem rótulo acessível;
    - o selo some quando a tradução chega;
    - em "Ver original", o selo não aparece.
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

### AC-001 — Selo na página ainda em tradução

Num projeto parcial, a página sem resultado mostra o original e o selo "Traduzindo…", e o selo some quando o
resultado chega.

### AC-002 — Fade ao substituir o original

A página que recebe a tradução durante a leitura troca o original pela tradução com fade de opacidade (~300 ms),
e a troca é imediata com "Reduzir movimento".

### AC-003 — Cartão do projeto conforme o estado

O cartão mostra textos de "preparado", "em andamento", "pronto", "falhou" ou "cancelado" conforme o estado, nos três
idiomas.

## Estratégia de evidência

| Critério | Teste/evidência esperada                               |
| -------- | ------------------------------------------------------ |
| AC-001   | RNTL do leitor com projeto parcial                     |
| AC-002   | RNTL do `ImageSurface` (animação e movimento reduzido) |
| AC-003   | RNTL da página nos três locales e estados              |

## Gate de implementação

- Estado: `open`; a `MOB-FEAT-022` está em `verification-pending`.
- Dependência: `MOB-FEAT-022`.

## Fora de escopo

- Notificação ou som quando a página fica pronta.
- Animações em outras telas.

## Aprovação humana

- Aprovador: pendente
- Data: pendente
