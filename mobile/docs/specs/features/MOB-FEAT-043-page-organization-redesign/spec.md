---
id: MOB-FEAT-043
type: feature
title: Redesign e arraste direto da organização de páginas
status: verification-pending
implementation_gate: open
blocked_by: [MOB-FEAT-013, MOB-FEAT-015, MOB-FEAT-028]
created: 2026-08-29
updated: 2026-08-30
supersedes: []
superseded_by: []
---

# MOB-FEAT-043 — Redesign e arraste direto da organização de páginas

## Objetivo

Tornar a organização das páginas importadas mais simples, elegante e direta,
com imagens como elemento principal e ordenação por toque prolongado na própria
miniatura nos modos Grade e Lista, preservando persistência local, privacidade,
virtualização e acessibilidade.

## Contexto e contratos relacionados

- Refina `MOB-FEAT-013`, que já fornece revisão privada, duas apresentações,
  reordenação persistente e alternativa acessível determinística.
- Preserva os estados por página de `MOB-FEAT-015` e a linguagem visual,
  responsividade, temas e preferências de movimento de `MOB-FEAT-028`.
- Usa como direção visual as galerias minimalistas do Phollet e da Nixplay:
  miniaturas dominantes, poucos controles e instrução clara de reordenação.
- Segue a orientação da Apple HIG para feedback contínuo durante o arraste e
  alternativa equivalente para pessoas que não podem usar o gesto.
- Não altera bytes privados, modelo SQLite, confirmação, validação de mídia nem
  os contratos remotos ainda inexistentes.

## Requisitos e regras

- A etapa `organize` inicia em Grade (identificador interno `grid`) e permite
  alternar para Lista por um `SegmentedControl` do design system. A escolha dura
  apenas durante a sessão da tela e nunca altera itens ou ordem.
- A Grade usa somente miniaturas 3:4 em duas colunas no celular e até quatro em
  telas expandidas, com gaps, bordas e raios vindos do tema. Textos, estado,
  duplicidade, prévia e exclusão aparecem em uma folha contextual somente após
  toque curto na imagem. A Lista usa linhas horizontais com miniatura, posição,
  estado/duplicidade em pill junto da identificação e exclusão compacta com
  ícone semântico, alinhada ao início da linha, com alvo mínimo de toque.
- A imagem é a única superfície visual que inicia ordenação. Na Lista, toque
  curto abre a prévia privada; na Grade, abre a folha contextual, cuja ação de
  visualização abre a mesma prévia. Toque prolongado de 200 ms eleva a imagem e
  permite arrastá-la para qualquer posição nos dois modos.
- Não existem setas nem alça de reorder visíveis. A exclusão fica visível e
  inequívoca na Lista e contextual na Grade, sempre localizada, com alvo mínimo
  e sem iniciar o gesto de arraste.
- O item ativo recebe escala e elevação sutis, os demais não perdem legibilidade,
  e o destino recebe indicador baseado no token de destaque. O container faz
  auto-scroll nas bordas quando houver conteúdo fora da viewport.
- Animações de ativação, deslocamento e drop são desabilitadas ou reduzidas
  quando `effectiveReduceMotion` estiver ativo. Não há dependência obrigatória de
  haptics.
- Ao soltar, a UI aplica imediatamente a nova ordem em memória e chama exatamente
  uma vez `reorderItems(draft, orderedIds)` com todos os IDs na ordem visual.
  Somente o resultado persistido substitui o draft fornecido pela page.
- O destino é derivado da translação real do gesto e da rolagem, usando a
  geometria dos slots. Deslocamentos e auto-scroll permanecem na thread de UI,
  sem render React a cada mudança de destino. A proteção de sessão impede chamada
  duplicada e bloqueia preview/folha contextual logo após soltar.
- Falha de persistência recarrega o último draft seguro, desfaz a ordem otimista,
  exibe o erro localizado existente e mantém retry. Enquanto uma mutação estiver
  ativa, novo arraste e ações conflitantes ficam indisponíveis.
- `ReviewLocalMediaImportController.reorderItems` passa a ser obrigatório.
  `moveItem` permanece no contrato para ações customizadas de acessibilidade
  “mover antes/depois”, sem controles visíveis.
- Cada imagem expõe descrição, posição e ações acessíveis. Ações assistivas movem
  um slot por vez e respeitam os limites da primeira e da última página; abrir
  opções e visualizar continuam disponíveis sem depender do gesto de reorder.
- Todo texto novo ou renomeado existe em pt-BR, en-US e es-ES. “Scroll” passa a
  ser apresentado como “Lista”/“List”/“Lista”. Tema claro, escuro e alto contraste
  usam exclusivamente tokens existentes.
- A coleção continua baseada em `FlatList`/equivalente virtualizado, com lote de
  100 imagens limitado por janela de renderização. A troca de modo remonta apenas
  o layout, sem carregar imagens integrais ou expor URI, path ou nome privado.
- A implementação usa um sortable do próprio slice sobre Reanimated e Gesture
  Handler, sem wrappers que leiam `SharedValue.value` durante render. O item
  arrastado acompanha o dedo e todos os itens entre origem e destino deslocam um
  slot ainda durante o gesto. O provider técnico permanece na app layer. Painel,
  cartão e lista ordenável permanecem no slice
  `features/review-local-media-import`; apenas painel e contratos consumidos
  externamente são exportados pelo barrel.

## Casos de erro

- Soltar no mesmo índice não persiste nem altera `updatedAt`.
- Cancelamento ou interrupção do gesto restaura a posição inicial sem mutação.
- Falha de imagem mostra o placeholder atual e não impede reorder, remoção ou
  ação assistiva do item.
- Falha SQLite durante reorder restaura ordem e confirmação persistidas; retry
  repete somente a última operação segura.
- Troca de modo, rotação ou mudança de tema durante estado ocioso preserva ordem;
  enquanto um drag estiver ativo, a conclusão/cancelamento ocorre antes da
  remontagem do layout.

## Critérios de aceite

### AC-001 — Grade e Lista minimalistas

Dado um draft com páginas, Grade inicia selecionada com layout responsivo formado
somente por miniaturas; toque revela posição, estado, duplicidade, prévia e
exclusão em folha contextual. Lista apresenta linhas horizontais com status em
pill junto da identificação e exclusão compacta com alvo mínimo, sem setas ou alça
visíveis.

### AC-002 — Arraste direto na imagem

Na Lista, toque curto abre a prévia; na Grade, abre as opções contextuais e a
ação de visualização abre a prévia. Toque prolongado de 200 ms inicia reorder na
própria miniatura nos dois modos, com feedback de item ativo, destino e
auto-scroll quando necessário.

### AC-003 — Ordem otimista e persistente

Ao soltar em outro índice, a ordem visual muda imediatamente e exatamente uma
chamada recebe o conjunto completo de IDs ordenados; o resultado sobrevive à
saída e ao retorno à tela.

### AC-004 — Falha e concorrência seguras

Falha restaura o último draft persistido e apresenta retry localizado; mutação
ativa bloqueia novo drag e ações conflitantes, e drop no mesmo índice é no-op.

### AC-005 — Acessibilidade e localização

Imagens e ações possuem semântica/estado acessíveis, mover antes/depois continua
disponível por ações assistivas, alvos respeitam o mínimo e toda copy existe nos
três locales, incluindo o nome Lista.

### AC-006 — Responsividade, tema e desempenho

Lotes de 100 páginas permanecem virtualizados; 1, 2 e até 4 colunas respeitam a
viewport, e tema claro/escuro/alto contraste e redução de movimento não causam
corte, sobreposição ou perda de estado.

### AC-007 — Arquitetura e contratos

O slice é dividido em painel, cartão e lista ordenável sem deep imports; o
controller exige `reorderItems`, Gesture Handler é inicializado na app layer e
nenhum modelo SQLite, endpoint ou fluxo web é alterado.

### AC-008 — Evidência e inspeção nativa

Testes dirigidos, gates completos, review e drift audit ficam verdes, e uma
inspeção no iPhone 17 Simulator registra Grade, Lista, preview, reorder real,
persistência, rotação e temas claro/escuro.

## Estratégia de evidência

| Critério | Teste/evidência esperada                                        |
| -------- | --------------------------------------------------------------- |
| AC-001   | RNTL estrutural dos dois modos e ausência de controles antigos  |
| AC-002   | Teste do adapter sortable + inspeção gestual no Simulator       |
| AC-003   | RNTL/controller com ordered IDs, chamada única e persistência   |
| AC-004   | Testes de rollback, no-op, retry e estado busy                  |
| AC-005   | RNTL de accessibility actions e matriz pt-BR/en-US/es-ES        |
| AC-006   | Teste de virtualização/colunas + inspeção responsiva e de temas |
| AC-007   | typecheck, lint FSD e inspeção de API pública/providers         |
| AC-008   | `pnpm check`, review, auditoria visual e drift audit            |

## Gate de implementação

- Estado: `open`
- Dependências: `MOB-FEAT-013`, `MOB-FEAT-015`, `MOB-FEAT-028`
- Motivo: dependências satisfeitas e aprovação humana registrada; implementação
  liberada.

## Fora de escopo

- Dashboard web, backend, API remota e alteração de schema/migração SQLite.
- Seleção múltipla, reorder de múltiplos itens, undo visual e persistência da
  preferência Grade/Lista.
- Haptics obrigatórios, edição da imagem, crop, rotação ou exportação.
- Mudança nos cards, validação, confirmação ou fluxo de idiomas.

## Manutenção autorizada em 2026-08-30

Os TODOs e o pedido de Ruan autorizam renomear o identificador interno para
`grid`, separar geometria/estado gestual/apresentação, substituir a API depreciada
por `scheduleOnRN` e manter dimensões estáveis durante o arraste. O ícone de
exclusão da folha usa um token branco dedicado, sem alterar outros botões.
São correções dos AC-002, AC-005, AC-006 e AC-007 existentes, sem novo fluxo.

## Manutenção autorizada em 2026-09-01

Ruan aprovou padronizar somente a visualização ampliada da Ordenação com a
aparência introduzida por `MOB-FEAT-045`: folha clara, safe area, cabeçalho com
identificação da página, imagem em `contain`, fallback acessível e fechamento no
cabeçalho e no rodapé. Grade, Lista, cards, folha contextual, arraste, remoção e
persistência permanecem inalterados.

O preview passa a consumir um componente agnóstico em `shared/ui`, também usado
pela Validação. Cada feature continua responsável por copy, tom, detalhes e
ações de negócio. A extração cobre `AC-005`, `AC-006` e `AC-007` sem alterar
controllers, entidades, SQLite ou API.

## Aprovação humana

### Refinamento aprovado em 2026-08-30

Ruan aprovou explicitamente o plano de refinamento do arraste para Android e
iOS. O escopo é somente a interação de Grade/Lista, sem redesenho dos cartões,
folha, prévia, banco ou API e sem mudança de dependências.

- AC-002: ativação exclusiva na imagem em 200 ms; segundo dedo cancela. Item
  flutuante e reconhecedor independem da célula virtualizada. Inserção usa o
  centro do item, com histerese de 8 dp além da fronteira entre slots.
- AC-002/AC-006: elevação de 120 ms, vizinhos de 160 ms e encaixe/cancelamento
  de 180 ms, com desaceleração sem overshoot. Indicador absoluto; redução de
  movimento elimina escala e transições decorativas, preservando o gesto.
- AC-002/AC-006: auto-scroll em faixa de 56 dp com intensidade quadrática,
  máximo de 480 dp/s e aceleração de 100 ms; parar ao sair, soltar ou cancelar.
- AC-003/AC-004: ordem otimista e chamada única no drop válido; apresentação
  animada termina independentemente da persistência. Overlay só é removido
  após animação concluída e layout confirmado. No-op/cancelamento não salvam.
- AC-004: fases explícitas, identificador de sessão e bloqueio durante gesto,
  encaixe e persistência. Resize, rotação, saída e interrupção invalidam
  callbacks antigos. Falha preserva rollback e retry existentes.
- AC-006/AC-007: manter janela virtualizada e clipping iOS desativado; não usar
  animações de montagem/desmontagem. Novos tipos são internos ao slice.
- AC-008: testar 20 ciclos reais por modo em Android e iOS, registrar vídeo,
  logs, persistência e comparação de frames com baseline; o terceiro abort de
  worklet continua uma investigação distinta. Falta de evidência nativa
  mantém `verification-pending`.

- Aprovador: Ruan
- Data: 2026-08-29

Não criar `tasks.md` antes de status `approved` e aprovação preenchida.
