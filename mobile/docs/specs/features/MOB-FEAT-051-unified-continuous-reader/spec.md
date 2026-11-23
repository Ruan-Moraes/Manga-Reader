---
id: MOB-FEAT-051
type: feature
title: Leitor unificado e contínuo
status: verification-pending
implementation_gate: open
blocked_by: [MOB-FEAT-005, MOB-FEAT-026, MOB-FEAT-050]
created: 2026-09-08
updated: 2026-09-08
supersedes: []
superseded_by: []
---

# MOB-FEAT-051 — Leitor unificado e contínuo

## Objetivo

Unificar capítulos publicados, resultados locais e previews textuais em uma
viewport imersiva, virtualizada e orientada ao conteúdo.

## Contexto e contratos relacionados

- Refina `MOB-FEAT-005`, `MOB-FEAT-026` e `MOB-FEAT-050` sem apagar seu
  histórico.
- Não implementa nem desbloqueia o pipeline real de `MOB-FEAT-018..021`.
- Não altera API, MongoDB, PostgreSQL ou schema SQLite.

## Requisitos e regras

- `IMAGE_SEQUENCE` usa IDs estáveis, preserva proporção e ocupa a largura exata
  do viewport no modo vertical, sem card, margem lateral ou gap obrigatório.
- `PAGED` e `DOUBLE` permanecem disponíveis para imagens; `TEXT_FLOW` é sempre
  contínuo e aceita heading, paragraph, dialogue, divider e image.
- A localização é `{ itemId, index }`; o item de maior interseção visível vence,
  com desempate pelo menor índice, e a restauração prefere ID.
- Resultados `DEMO` desenham cobertura clara e texto traduzido somente dentro da
  caixa simulada normalizada. O texto fonte e o antigo painel textual não são
  exibidos. Resultados remotos não recebem overlay.
- Original/resultado alterna o documento inteiro sem perder item ou offset e só
  aparece quando todos os itens aplicáveis possuem original.
- A integridade local é validada apenas quando uma página entra na janela; uma
  falha ocupa somente o espaço da página e oferece reparo localizado.
- Controles sobrepostos respeitam safe areas e alternam por toque sem scroll.
- O preview de novel e sua fixture existem apenas em desenvolvimento e mantêm
  progresso somente durante a sessão.
- Pages controlam rede, autenticação, SQLite e progresso. O widget não importa
  esses domínios.

## Casos de erro

- Documento vazio permanece responsabilidade da page e não monta a viewport.
- URI ou hash inválido apresenta reparo somente no item correspondente.
- Localização cujo ID desapareceu usa o índice limitado e, depois, o primeiro ID.
- Rota textual em produção redireciona para a raiz sem criar a fixture.

## Critérios de aceite

### AC-001 — Fluxo visual de imagens

O modo vertical renderiza páginas ordenadas em largura integral e proporção
original, com virtualização limitada e erro isolado.

### AC-002 — Continuidade e modos preservados

A página atual é calculada por visibilidade, restaurada por ID e os modos
paginado/duplo continuam funcionais.

### AC-003 — Resultado demonstrativo honesto

Somente resultados demo recebem overlay simulado recortado; não há painel ou
texto fonte, e a comparação global preserva a localização.

### AC-004 — Fluxo textual

Todos os blocos estruturados são virtualizados, respeitam escala tipográfica e
não exibem controles de imagem.

### AC-005 — Integrações e isolamento

Leitores publicado e local adaptam seus domínios na page, progresso local é
debounced em 350 ms com flush, e o preview é recusado em produção.

### AC-006 — Qualidade e plataformas

Specs, TypeScript, ESLint, FSD, Jest e diff-check passam; iOS Simulator, Android
físico e cenários 10/67/200 registram evidência sem inferir performance nativa de
testes unitários.

## Estratégia de evidência

## Refinamento aprovado em 2026-09-09

Aprovação humana: solicitação explícita de Ruan para implementar o plano
“Refinamento do leitor mobile da Toonlira”. Mantém os AC existentes e detalha:

- AC-001/002: geometria medida e estável durante loading/retry; restauração
  assíncrona e âncora por ID/posição relativa durante mudanças de layout.
- AC-003: máscara clara independente do tema e falhas isoladas por variante.
- AC-004: restauração textual com alturas variáveis e extremos acessíveis.
- AC-005: barras temáticas responsivas, painel modal com fechamento explícito,
  toque cancelado por scroll e alternativa acessível para revelar os controles.
- AC-006: contraste e responsividade em temas/tamanhos/orientações; medições
  antes/depois sem equiparar testes Jest a performance nativa.

Não adiciona API, schema, modo ou navegação para capítulos adjacentes.

### Matriz de evidência

| Critério | Evidência esperada                                       |
| -------- | -------------------------------------------------------- |
| AC-001   | testes puros e RNTL da sequência/erro/virtualização      |
| AC-002   | helpers de visibilidade/ID e RNTL paginado/duplo         |
| AC-003   | RNTL de overlay, comparação e ausência de texto fonte    |
| AC-004   | RNTL dos blocos e teste do contrato textual              |
| AC-005   | integração das pages, debounce/flush e guard de produção |
| AC-006   | gates automatizados e evidência nativa separada          |

## Gate de implementação

- Estado: `open`, aprovado explicitamente pelo solicitante.
- Dependências: leitores e simulador anteriores executados.
- Verdict corrente: `verification-pending` até Android e métricas nativas.

## Fora de escopo

- OCR, tradução e renderização reais (`MOB-FEAT-018..021`).
- API, migration, persistência/editorial de novels e importação EPUB/HTML.
- Leitor web.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-09-08
