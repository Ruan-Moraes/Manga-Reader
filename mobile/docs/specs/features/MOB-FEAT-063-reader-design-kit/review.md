# Review — MOB-FEAT-063

- Spec revisada: `spec.md`
- Implementação/revisão: working-tree sha256:2339ec4bb7f8d942ab563185f86146c197170107c2e6b8ca6bc119986274ac87 (sem commit: árvore de trabalho da branch `feat/auth-refresh-rotation`)
- Gate na entrada do planejamento: `open`
- Dependências verificadas: MOB-FEAT-055, MOB-FEAT-057 e MOB-FEAT-062 (`verification-pending`)
- Verdict: `verification-pending`

## Findings

1. **Média — verificação visual parcial.** Validado só no tema escuro, iPhone 18 Pro (iOS Simulator), em direção RTL,
   contra o kit em 2026-11-09 (capturas em `docs/ui-captures/dark/design-kit-phase2-iphone18pro/`). Faltam claro, fonte ampliada, redução de movimento e
   Android físico; TASK-010 continua aberta.
2. **Baixa — redução de movimento sem teste novo.** A animação das barras já usava `decorativeMotionEnabled`; esta
   spec não acrescentou teste para isso.
3. **Informativa — D2 (folha única).** Leitor local e da plataforma usam a folha "Ajustes do leitor" com modo,
   direção, ajuste (inclui Original), fundo, saturação e espaçamento no fluxo vertical. Qualidade, pré-carregamento,
   marcação e gestos ficam em Configurações > Leitor, pelo rodapé. O leitor de texto (053) mantém as abas.
4. **Informativa — testes antigos alterados conforme a spec.** `LocalTranslationReaderPage.test.tsx` deixou de abrir a
   aba Aparência e passou a usar o alternador; `ReaderPage.test.tsx` (005) lê a página pelo rótulo acessível
   "Página p de T", porque o texto visível virou "p / T". A posição verificada é a mesma.
5. **Informativa — controles mantidos.** As setas de página do modo paginado e o botão de ocultar controles (052)
   continuam na barra inferior; a linha de capítulo e o alternador ficam abaixo deles.
6. **Informativa — estado bloqueante só para o capítulo inteiro.** Aparece quando nenhuma página tem resultado e o
   capítulo está em processamento ou falhou. Falha de página isolada segue com o marcador e o retry da 055.
   "Tentar de novo" abre o painel de lote da 055 (consentimento, só páginas com falha, sem reenvio automático).
7. **Informativa — contexto da obra.** O leitor local descobre a obra do capítulo pela visão geral da biblioteca
   (060); se ela falhar, os controles de obra simplesmente não aparecem.
8. **Informativa — review feita pelo implementador**, sem auditor externo.

## Validação visual (escuro, iPhone 18 Pro, 2026-11-09)

Comparação lado a lado com `ReaderScreen.jsx` do kit. Corrigido nesta rodada:

- **Alta — linha de capítulo quebrada.** "Anterior"/"Próximo" usavam `Button` com `fullWidth` padrão e ocupavam a linha
  inteira cada um. Viraram um botão compacto (`ChapterStepButton`, 44, cor do texto, 0,35 quando desabilitado); em RTL
  a seta fica do lado de fora ("‹ Próximo … Anterior ›").
- **Cores das barras:** voltar, ajustes e lista na cor do texto com ícone 24, como o `RBtn` do kit (D20: token `text`,
  não hex). `IconButton` ganhou `tone="default"` e `iconSize`, aditivos.
- **Folha de ajustes:** Modo e Direção em segmentados compactos com rótulos curtos ("Esq → Dir", "Dir → Esq"), só na
  categoria `quick`; Configurações > Leitor mantém os cartões.

Segunda rodada (a pedido, "o leitor não está igual"):

- **Barra superior em duas linhas, como no kit:** título do capítulo e, abaixo, a obra; o selo de demonstração entra
  na mesma linha ("Obra · DEMONSTRAÇÃO") e, sem obra, a segunda linha mostra "Capítulo N" (leitor da plataforma). A
  barra caiu de três linhas para duas (cerca de 61 pt; kit 60).
- **Título "Capítulo N":** rótulo só numérico da 055 vira "Capítulo N" no título e na lista de capítulos; nomes livres
  ficam como estão. O título é calculado fora do `useMemo` do documento para não remontar o viewport.
- **Folha de ajustes:** alça no topo, margem lateral da tela (20) e 24 entre grupos, sem o divisor entre "Ajuste" e
  "Fundo"; rótulo "Modo de leitura" (chave `settings.modeLong`). Só na folha do kit; abas da 052 inalteradas.

Terceira rodada (folha de ajustes dentro do leitor):

- Altura inicial da folha do kit em 88% da área útil (kit ~85%), para Modo, Direção, Ajuste e Fundo caberem sem
  rolar; o botão de expandir da 052 continua levando a 100%. Abas antigas seguem em 70%.
- 24 entre todos os grupos (sem o `SectionStack` de 32) e sem divisor no grupo de Espaçamento.
- Sem a ajuda "Sobre Saturação/Espaçamento" na folha do kit (o kit não tem); continua nas demais categorias compactas.

Desvios mantidos: botão de expandir o painel (052), "Original" no ajuste (D18), barras opacas com token `surface`
(o kit usa painel translúcido em hex; D20).

## Critérios e evidências

| Critério | Implementado | Evidência verificada                                                                    | Resultado                         |
| -------- | ------------ | --------------------------------------------------------------------------------------- | --------------------------------- |
| AC-001   | sim          | `ContentReaderKit.test.tsx`; `LocalTranslationReaderKit.test.tsx`                       | pass                              |
| AC-002   | sim          | `ContentReaderKit.test.tsx` (folha, atual marcado, troca); página do leitor local       | pass                              |
| AC-003   | sim          | `ContentReaderKit.test.tsx` (p / T, progressbar, vizinhos, alternador)                  | pass                              |
| AC-004   | sim          | `ContentReaderKit.test.tsx` (com e sem próximo, só vertical)                            | pass                              |
| AC-005   | sim          | `ContentReaderKit.test.tsx`; `LocalTranslationReaderKit.test.tsx` (processando, falhou) | pass                              |
| AC-006   | sim          | `ContentReaderKit.test.tsx`; `ReaderSettingsControls.test.tsx` (categoria `quick`)      | pass                              |
| AC-007   | sim          | suítes de 005, 051, 052, 053 e 055 verdes (ver finding 4)                               | pass                              |
| AC-008   | sim          | `i18n.test.ts`; RTL em `ContentReaderKit.test.tsx`                                      | pass em teste; capturas pendentes |
| AC-009   | sim          | gates abaixo; `coverage.json`                                                           | pass                              |
| AC-010   | parcial      | PageRetryIndicator.test.tsx                                                             | verificação física pendente       |

## Gates

| Comando             | Resultado                                                 |
| ------------------- | --------------------------------------------------------- |
| `pnpm typecheck`    | pass                                                      |
| `pnpm lint`         | pass                                                      |
| `pnpm lint:fsd`     | pass                                                      |
| `pnpm test:ci`      | pass — 165 suítes, 1249 testes (2026-11-10)               |
| `pnpm format:check` | fail — só arquivos com mudanças anteriores a esta feature |
| `pnpm specs:check`  | fail — só os 13 checksums anteriores (017–054)            |
| `pnpm check`        | fail — interrompido pelo `specs:check`                    |

## Ajustes pedidos em 2026-11-10

- AC-003: o rodapé tem só duas setas. No paginado elas viram a página e, na borda, trocam de capítulo. No vertical
  elas trocam de capítulo. O progresso fica numa linha própria e o alternador Traduzido/Original fica entre as setas.
  Sem paginação e sem lista de capítulos, as setas somem.
- AC-005: o marcador de página sem tradução virou um aviso preso à borda direita, abaixo da barra superior
  (`PageRetryIndicator`, `testID="page-retry-notice"`). O retry segue explícito e só da página.
- Título da barra no papel `heading` e voltar compacto (40 pt, alvo de toque mantido por `hitSlop`), iguais aos
  das outras telas. Conferido no iPhone 18 Pro, exceto o aviso de erro, que só tem teste automatizado.

## Ajustes de fluxo em 2026-11-10 (tarde)

- Consentimento "Antes de enviar" e confirmações viraram diálogo central (`CenterDialog`, `ConfirmDialog`); resultado de
  ação virou notificação temporária (`showToast`); folhas e diálogos sobem acima do teclado.
- Fluxo de tradução: cancelar/descartar, voltar do sistema guardado, parar após a página atual, cancelar agora,
  verificar páginas incertas, mover e tirar capítulo de obra. Mapa e lista de defeitos em
  `docs/references/translation-and-chapters-flow.md`.
- Conferido no iPhone 18 Pro: diálogo de limpeza, notificação, cards da biblioteca, teclado em "Editar nome", sair com
  descarte. Sem conferência visual: o diálogo "Antes de enviar" (precisa de envio real), cancelar durante o envio e
  Android (voltar físico, teclado dentro de `Modal`).

## Mudanças fora da spec

- Nenhuma preferência, rota, API ou regra de retry foi criada ou removida.

## Conclusão

Os 9 critérios estão implementados com evidência automatizada. Verdict `verification-pending` porque TASK-010
(verificação visual) continua aberta.
