---
id: MOB-FEAT-069
type: feature
title: Transições entre páginas por tipo de navegação
status: in-progress
implementation_gate: open
blocked_by: []
created: 2026-11-14
updated: 2026-11-14
supersedes: []
superseded_by: []
---

# MOB-FEAT-069 — Transições entre páginas por tipo de navegação

## Objetivo

Fazer a transição de cada navegação dizer o que aconteceu: trocar de módulo, ir mais fundo, abrir um fluxo que
fecha ou entrar no leitor. Hoje a biblioteca de traduções, a obra e o fluxo "Traduzir capítulo" herdam o `fade` da
pilha raiz, como se fossem uma troca de módulo, e cada `_layout.tsx` repete a mesma regra de movimento.

Etapa 3 do [plano de animações](../../../plans/2026-11-14-animacoes.md).

## Contexto e contratos relacionados

- MOB-FEAT-002: `decorativeMotionEnabled` falso (animações desligadas ou movimento reduzido) zera transições.
- MOB-FEAT-057: escala de movimento `motion`. As trocas de tela usam tokens próprios, mais curtos que os dos elementos da
  tela: `screen` 140 ms (fade) e `screenSlide` 220 ms (deslize).
- MOB-FEAT-025 e MOB-FEAT-026: biblioteca local e leitor local (`translation-library`, `work`, `translation-reader`).
- MOB-FEAT-012: fluxo "Traduzir capítulo" (`offline-translation`) e o `useLeaveGuard`, que desliga o gesto de voltar
  enquanto há rascunho.
- Pilhas atuais: raiz `fade`; `settings`, `(auth)` e `platform` com `slide_from_right`; abas sem animação.

## Requisitos e regras

1. **Tipos de transição**, definidos num só módulo (`shared/navigation/transitions.ts`):

    | Tipo            | Animação nativa                               | Duração no iOS       | Gesto de voltar (iOS)                             |
    | --------------- | --------------------------------------------- | -------------------- | ------------------------------------------------- |
    | Troca de módulo | `fade`                                        | `motion.screen`      | padrão do sistema                                 |
    | Ir mais fundo   | iOS `simple_push`; Android `slide_from_right` | `motion.screenSlide` | tela inteira (`fullScreenGestureEnabled`)         |
    | Fluxo que fecha | `slide_from_bottom`                           | `motion.screenSlide` | só pela borda; nunca puxando para baixo           |
    | Leitor          | `fade`                                        | `motion.screen`      | só pela borda (`fullScreenGestureEnabled: false`) |

    Com `decorativeMotionEnabled` falso, todos os tipos usam `animation: 'none'`; os gestos continuam.
    No Android a duração é a do sistema (a opção de duração só vale no iOS).
    Ajuste de 2026-11-14 (pedido do aprovador, trocas de tela mais rápidas): antes eram `motion.base` (200 ms) no fade,
    `motion.sheet` (280 ms) no fluxo e o push nativo do iOS (cerca de 350 ms, sem duração ajustável) em ir mais fundo.
    O `simple_push` é o mesmo deslize da direita, sem a sombra do push nativo, e aceita duração; o gesto de voltar
    continua o nativo.

2. **Rotas da pilha raiz**, todas com `Stack.Screen` explícito:

    | Rota                                                         | Tipo            |
    | ------------------------------------------------------------ | --------------- |
    | `index`, `(auth)`, `platform`, `+not-found`                  | Troca de módulo |
    | `translation-library`                                        | Troca de módulo |
    | `settings`, `work/[workId]/index`, `work/[workId]/manage`    | Ir mais fundo   |
    | `offline-translation`                                        | Fluxo que fecha |
    | `reader`, `reader-preview`, `translation-reader/[projectId]` | Leitor          |

3. **Pilhas internas**: `settings`, `(auth)` e `platform` usam "Ir mais fundo" pelo mesmo módulo, sem repetir a regra.
4. **Abas da plataforma**: troca com `fade` em `motion.screen`; `none` com movimento reduzido.
5. **Leitor**: o gesto horizontal em tela inteira fica desligado, porque o deslizar lateral pertence à leitura (no
   iOS 26 ele vem ligado por padrão).
6. **Fluxo que fecha**: o `useLeaveGuard` continua desligando o gesto enquanto houver rascunho ou processamento.

## Casos de erro

- Rota nova sem `Stack.Screen` explícito na raiz: herda "Troca de módulo" (o padrão da raiz), sem quebrar.
- Mudar a preferência de movimento com uma tela aberta: a próxima navegação já usa o novo valor.

## Critérios de aceite

### AC-001 — Tipos de transição

Dado o módulo de transições, quando pedido cada tipo com animações ligadas, então devolve a animação, a duração e o
gesto da tabela, conforme a plataforma; com animações desligadas, devolve `animation: 'none'` para todos.

### AC-002 — Rotas da raiz

Dada a pilha raiz, então cada rota da tabela recebe o tipo indicado, incluindo `translation-library`, `work` e
`translation-reader`, que hoje herdam o padrão.

### AC-003 — Pilhas internas e abas

Dadas as pilhas de Configurações, Auth e Plataforma, então usam "Ir mais fundo"; as abas usam `fade`, e `none` com
movimento reduzido.

### AC-004 — Leitor sem gesto em tela inteira

Dado o leitor de capítulos, o leitor de tradução local ou a prévia, então `fullScreenGestureEnabled` é falso.

### AC-005 — Fluxo que fecha mantém a trava

Dado o fluxo "Traduzir capítulo" com rascunho, quando a pessoa tenta voltar pelo gesto, então o `useLeaveGuard`
continua impedindo a saída sem confirmação.

## Estratégia de evidência

| Critério | Teste/evidência esperada                                                               |
| -------- | -------------------------------------------------------------------------------------- |
| AC-001   | Teste unitário de `transitions.ts` com animações ligadas e desligadas                  |
| AC-002   | Teste de componente do `RootNavigator` lendo as opções de cada `Stack.Screen`          |
| AC-003   | Teste de componente dos layouts de Configurações, Auth, Plataforma e abas              |
| AC-004   | Coberto por AC-001 e AC-002; conferência manual no simulador iOS                       |
| AC-005   | Testes existentes do `useLeaveGuard` e do fluxo continuam passando; conferência manual |

Conferência manual no simulador iOS e no Android, temas claro e escuro, com "Reduzir movimento" ligado e desligado.

## Gate de implementação

- Estado: `open`
- Dependências: nenhuma
- Motivo: não aplicável

## Fora de escopo

- Transições compartilhadas de elemento (capa que cresce até a tela da obra).
- Trocar React Navigation, `expo-router` ou `react-native-screens`.
- Folha que fecha puxando (etapa 4 do plano de animações).
- Mudar o fluxo de qualquer tela; só muda como a troca aparece.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-11-14

Não criar `tasks.md` antes de status `approved` e aprovação preenchida.
