---
id: MOB-FEAT-045
type: feature
title: Galeria de validação e correção localizada
status: verification-pending
implementation_gate: open
blocked_by: [MOB-FEAT-015, MOB-FEAT-043]
created: 2026-08-31
updated: 2026-08-31
supersedes: []
superseded_by: []
---

# MOB-FEAT-045 — Galeria de validação e correção localizada

## Objetivo

Trocar a lista textual da etapa de validação por uma galeria virtualizada que
resume o lote, torna falhas localizadas visíveis e permite substituir somente a
página problemática sem perder resultados válidos.

## Contexto e contratos relacionados

- Refina a apresentação de `MOB-FEAT-015/AC-005`, `AC-009`, `AC-011` e
  `AC-012`, preservando a validação local, privada e sequencial.
- Reutiliza o preview e a identidade visual do grid de `MOB-FEAT-043`; a etapa
  de validação não permite reordenar nem remover páginas.
- O gateway e o processamento remoto permanecem fora de escopo enquanto
  `MOB-FEAT-017..020` não estiverem implementadas.

## Requisitos e regras

- A etapa mostra título dinâmico, card-resumo e grid virtualizado de miniaturas
  com página e estado acessível: aguardando, pronta ou ação necessária.
- Quando houver falhas, um alerta e os filtros `Com problema`/`Todas` aparecem;
  `Com problema` é selecionado inicialmente e a ação de correção focaliza a
  primeira página inválida.
- A miniatura inválida possui borda, badge textual e ação própria para substituir
  o arquivo. O detalhe abre em modal com preview, mensagem humana, origem e ação.
- A origem da falha é um modelo de apresentação `local | processing`. Falhas
  locais são derivadas dos códigos persistidos atuais. Consumidores futuros
  podem fornecer uma falha de processamento, sem que esta feature a fabrique.
- A substituição aceita exatamente uma imagem, promove a cópia privada, troca os
  metadados da mesma página atomicamente e redefine somente sua validação para
  `PENDING`. Posição, ordem, idiomas, confirmações e resultados das outras
  páginas são preservados.
- Durante validação o CTA informa progresso. Com falhas, corrige/focaliza o
  primeiro problema. Com todas as páginas válidas, avança para revisão.
- Toda copy possui paridade pt-BR/en-US/es-ES, usa tokens e mantém operabilidade
  com leitor de tela, tema, tela compacta e escala tipográfica.

## Plano de persistência

- Banco: SQLite privado existente; nenhum schema ou índice novo.
- A identidade `item.id` e a posição permanecem. Uma atualização transacional
  troca `local_filename`, `byte_size`, `mime_hint` e `created_at`, aplica
  `PENDING_MEDIA_VALIDATION` e avança `draft.updated_at` com proteção stale.
- O nome anterior é devolvido para limpeza após commit; falha remove a nova
  cópia promovida e preserva o último estado seguro.
- Falhas remotas futuras pertencem ao agregado do projeto de tradução e não são
  gravadas artificialmente no draft de importação.

## Casos de erro

- Cancelar o picker mantém modal, arquivo e draft sem alterações.
- Seleção vazia ou múltipla mostra erro localizado e permite repetir.
- Falha de picker, cópia, promoção, transação ou draft obsoleto preserva o
  arquivo anterior e os resultados já válidos.
- Falha de carregamento da miniatura mantém identificação, estado e ações
  acessíveis sem expor URI ou nome privado.

## Critérios de aceite

### AC-001 — Resumo e galeria escalável

Sucesso, progresso e lote misto são resumidos sem lista textual exaustiva e o
grid virtualiza dezenas de miniaturas com estados acessíveis.

### AC-002 — Falha localizada e detalhe honesto

Somente páginas problemáticas recebem destaque e detalhe com mensagem humana,
origem correta e orientação opcional, sem expor códigos internos.

### AC-003 — Substituição atômica por página

Uma imagem selecionada substitui apenas a página escolhida, volta a `PENDING` e
preserva ordem, confirmações e resultados válidos; cancelamento/falha não muda o
draft.

### AC-004 — Rodapé orientado ao estado

O CTA informa progresso, focaliza a primeira falha ou avança para revisão
somente quando a prontidão derivada for verdadeira.

### AC-005 — Responsividade, acessibilidade e i18n

Grid, modal, filtros e ações permanecem operáveis nos três idiomas, temas,
larguras suportadas e escala tipográfica, com labels e live regions adequados.

## Estratégia de evidência

| Critério | Teste/evidência esperada                                  |
| -------- | --------------------------------------------------------- |
| AC-001   | RNTL de sucesso, lote misto, filtros e FlatList           |
| AC-002   | RNTL de detalhe local e contrato de origem processing     |
| AC-003   | Unitário de controller/repository e RNTL de substituição  |
| AC-004   | Integração da page para progresso, correção e avanço      |
| AC-005   | RNTL trilíngue, labels acessíveis e gates TypeScript/Jest |

## Gate de implementação

- Estado: `open`
- Dependências: `MOB-FEAT-015` implementada e `MOB-FEAT-043`
  `verification-pending`.
- Motivo: validação, arquivos privados e grid já estão executados; a pendência
  física do gesto de ordenação não bloqueia uma galeria sem drag.

## Fora de escopo

- Detectar contorno branco, gerar transparência, executar OCR ou processamento.
- Persistir retorno remoto antes do agregado e gateway correspondentes.
- Reordenar, remover ou adicionar várias imagens dentro da etapa de validação.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-08-31

A implementação foi solicitada explicitamente a partir do plano aprovado nesta
conversa.

## Manutenção autorizada em 2026-09-01

Ruan aprovou extrair a visualização ampliada para um componente agnóstico em
`shared/ui` e adotá-lo também na Ordenação. A Validação permanece como referência
visual e preserva mensagem humana, origem, detalhe técnico, substituição por
página e fechamento. A extração cobre `AC-002` e `AC-005` sem alterar galeria,
persistência ou detecção de falhas.
