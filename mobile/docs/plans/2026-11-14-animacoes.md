# Animações: padronização, desempenho e novas transições

Este plano define como as animações do app mobile vão ficar mais consistentes, mais leves e um pouco mais expressivas, sem exagero. Ele cobre os tempos padrão, o feedback de toque e de hover, as transições entre páginas, o desempenho e algumas animações novas.

O plano é informativo. Cada etapa passa pelo mesmo rito da [revisão tela a tela](2026-11-13-revisao-tela-a-tela.md): análise, plano, aprovação e só então código. Mudanças de comportamento, como o tipo de transição de uma rota ou um gesto novo, precisam de Target Spec em `docs/specs`. Os critérios de medição de FPS e de taxa de atualização continuam no [roteiro de auditoria de design](auditoria-design-mobile.md) (seções 2 e 3).

## Princípios

1. **A animação explica, não enfeita.** Ela mostra de onde algo veio, para onde foi ou que o toque foi recebido. Se não faz nada disso, não entra.
2. **Curta e interrompível.** Nada passa de 300 ms, exceto ciclos de carregamento. Um toque no meio da animação nunca espera ela terminar.
3. **Só `opacity` e `transform`.** Altura, largura, margem e cor animadas forçam layout ou pintura a cada quadro. Quando precisar crescer, usar `scale`; para barras, usar `scaleX` com origem à esquerda.
4. **Fora da thread JS.** Usar driver nativo (`useNativeDriver: true`) ou Reanimated na UI thread. Nenhuma animação depende de `setState` por quadro.
5. **Respeitar o movimento reduzido.** A regra de MOB-FEAT-002 continua valendo: `effectiveReduceMotion` zera transições espaciais, e `decorativeMotionEnabled` desliga animações decorativas. Feedback de toque por cor ou opacidade continua mesmo com movimento reduzido, porque não desloca nada.
6. **Um lugar para os tempos.** Nenhum número de duração solto em componente; tudo vem da escala de movimento do tema.

## Como está hoje

### Tempos

A escala existe em `src/shared/theme/appearance.ts`: `MOTION_DURATIONS = { fast: 140, base: 180, sheet: 240, pulse: 700 }`. Com movimento reduzido, `resolveMotionDurations` zera todos os valores. Parte do app, porém, ignora a escala:

| Onde | Valor | Problema |
| --- | --- | --- |
| `shared/ui/BottomSheet.tsx` | entrada `motion.sheet`, saída `motion.base` | Usa a escala. Curvas `out(cubic)` e `in(cubic)`. |
| `shared/ui/CenterDialog.tsx` | `motion.base` | Usa a escala. |
| `shared/ui/toast/ToastHost.tsx` | `motion.base` | Usa a escala. |
| `shared/ui/Skeleton.tsx` | 700 + 700 fixos | Repete o valor de `motion.pulse` em vez de ler o token. |
| `widgets/content-reader/ui/ContentReader.tsx` | `CONTROLS_ANIMATION_MS = 160` | Fora da escala (fica entre `fast` e `base`). |
| `features/review-local-media-import/config/reviewLayout.ts` | 120, 160, 180, 100 | Constantes próprias do arrastar e soltar. Algumas são de gesto e fazem sentido locais; as de entrada e saída deveriam vir da escala. |
| `widgets/local-translation-library/ui/LibraryShelf.tsx` | `SHEET_CHAIN_DELAY_MS = 350` no iOS | Espera fixa para abrir uma folha depois de fechar outra. Deveria derivar da duração de saída da folha, ou ser substituída pelo fim real da animação. |

### Feedback de toque e hover

Cada componente reage ao toque de um jeito, e nenhum anima a transição:

| Componente | Feedback atual |
| --- | --- |
| `Button` | cor de fundo + `scale 0.985` |
| `BackButton` | cor de fundo + `scale 0.96` |
| `IconButton` | cor de fundo; na versão `bare`, opacidade 0.6 |
| `ListRow` | só cor de fundo |
| `ChoiceRow` | opacidade 0.72 |
| `ChoiceGroup`, `ChoiceCards`, `ActionSheet` | cor de fundo |

- O estado de pressionado é guardado com `useState` (`PressableBox`, `Button`, `BackButton`, `IconButton`, `ListRow`). Cada toque re-renderiza o componente inteiro duas vezes; em listas longas isso pesa.
- **Hover não funciona.** `PressableBox` declara `hovered` no tipo, mas nunca o preenche. Só `WorkDetail` trata hover por conta própria. Com mouse ou trackpad no iPad, ou com teclado e foco, nada indica o item sob o ponteiro.
- Não há ripple no Android (`android_ripple` não é usado em lugar nenhum).

### Transições entre páginas

| Navegador | Arquivo | Transição |
| --- | --- | --- |
| Raiz (seletor, auth, plataforma, tradução, leitor, configurações) | `application/navigation/RootNavigator.tsx` | `fade` |
| Configurações | `app/settings/_layout.tsx` | `slide_from_right` |
| Auth (entrar, cadastro, recuperar) | `app/(auth)/_layout.tsx` | `slide_from_right` |
| Plataforma | `app/platform/_layout.tsx` | `slide_from_right` |
| Abas da plataforma | `app/platform/(tabs)/_layout.tsx` | nenhuma (troca seca) |
| Leitor e prévia do leitor | `READER_SCREEN_OPTIONS` | herda `fade` da raiz |
| `translation-library`, `work`, `translation-reader` | rotas sem `Stack.Screen` próprio | herdam `fade` da raiz |

Todas as pilhas já trocam para `'none'` quando `decorativeMotionEnabled` é falso. O problema é de critério: entrar na biblioteca de traduções, abrir uma obra e abrir um capítulo são navegações para dentro, mas aparecem com `fade`, como uma troca de módulo.

## Escala de movimento proposta

Substitui `MOTION_DURATIONS`, mantendo os nomes atuais para não quebrar quem já usa:

| Token | Duração | Uso | Curva |
| --- | --- | --- | --- |
| `instant` | 0 | Movimento reduzido e mudanças sem transição. | — |
| `fast` | 120 ms | Toque, hover, foco, troca de ícone, check de caixa. | `out(quad)` |
| `base` | 200 ms | Aparecer e sumir: toast, diálogo, controles do leitor, troca de conteúdo. | entrada `out(cubic)`, saída `in(cubic)` |
| `sheet` | 280 ms | Entrada de folha inferior e elementos que viajam distância. | `out(cubic)` |
| `exit` | 180 ms | Saída de folha e diálogo; saída é sempre mais curta que a entrada. | `in(cubic)` |
| `pulse` | 1200 ms | Ciclo completo do esqueleto de carregamento (ida e volta). | `inOut(sine)` |

- Gestos que seguem o dedo (arrastar, fechar folha puxando) usam mola, não duração: `withSpring` com uma configuração única do tema (`damping` alto, sem quicar).
- As curvas também viram tokens (`motionEasing.enter`, `motionEasing.exit`, `motionEasing.standard`), para ninguém reescrever `Easing.out(Easing.cubic)` em cada arquivo.
- Os valores acima são a proposta inicial e devem ser conferidos no aparelho antes de fechar a etapa 1.

## Feedback de toque e hover padronizado

Uma regra por tipo de controle, aplicada pelos componentes de `shared/ui`:

| Tipo | Pressionado | Hover e foco (ponteiro, teclado) |
| --- | --- | --- |
| Botão com fundo (`Button`, `IconButton` com superfície, `BackButton`) | fundo `surfacePressed` + `scale 0.97` (no `Button` primário, o tom de pressionado da cor de destaque) | fundo `surfaceHover` (token novo, entre `surface` e `surfacePressed`); no `Button` primário, o mesmo tom do pressionado |
| Ícone sem fundo (`IconButton bare`) | opacidade 0.6 | círculo `surfaceHover` atrás do ícone |
| Linha e cartão (`ListRow`, `ChoiceRow`, `ChoiceGroup`, `ChoiceCards`, `ActionSheet`, linhas de capítulo) | fundo `surfacePressed`, sem escala | fundo `surfaceHover` |
| Item selecionável | o mesmo da linha; a seleção continua com borda e cor de destaque | o mesmo da linha |

- A transição entre os estados usa `motion.fast`. Entrar no pressionado pode ser imediato (o toque precisa parecer instantâneo); a volta anima em 120 ms.
- O estado vai para a UI thread: `Pressable` + Reanimated (`useSharedValue` atualizado em `onPressIn` e `onPressOut`, estilo em `useAnimatedStyle`) ou as transições CSS do Reanimated 4. Assim o toque não re-renderiza o componente.
- `PressableBox` passa a repassar `hovered` e `focused` de verdade (`onHoverIn`, `onHoverOut`, `onFocus`, `onBlur`).
- **Decidido na etapa 2:** o `BackButton` é botão com fundo (quadrado com borda), não ícone sem fundo. `Button`, `IconButton`, `BackButton` e `ListRow` usam `usePressFeedback` (Reanimated, sem re-render). `ChoiceGroup`, `ChoiceCards`, `ChoiceRow` e as linhas do `ActionSheet` usam `PressableBox`: um toque re-renderiza só a opção tocada. As linhas de capítulo do `WorkDetail` mantêm o hover na linha inteira (`onPointerEnter`), porque a linha tem mais de um botão; só trocam o hover para `surfaceHover`.
- **Android:** sem `android_ripple` por enquanto. O fundo animado já responde ao toque nas duas plataformas, e o ripple somaria um segundo efeito nas linhas.
- Foco de teclado sempre visível, com anel de foco, mesmo sem animação. Nos componentes novos o anel usa `outline` (não muda o layout).

## Transições entre páginas

A transição deve dizer que tipo de mudança aconteceu:

| Tipo de navegação | Exemplos | Transição |
| --- | --- | --- |
| Trocar de módulo ou de contexto | seletor → plataforma, seletor → tradução local, entrar → plataforma depois do login | `fade` curto (`base`) |
| Ir mais fundo na hierarquia | Configurações → Aparência, biblioteca → obra → capítulo, Entrar → Cadastro | deslizar da direita, com gesto de voltar pela borda |
| Fluxo que abre e fecha | Traduzir capítulo, importar páginas | subir de baixo (`slide_from_bottom`); fecha descendo |
| Entrar no leitor | abrir capítulo | `fade`, para a leitura começar sem o conteúdo atravessar a tela |
| Trocar de aba | Início, Biblioteca, Fórum, Perfil | `fade` curto ou `shift` das abas do React Navigation 7, conferindo o desempenho no Android |
| Movimento reduzido ou animações desligadas | todas | `none` (já é assim) |

- Declarar `Stack.Screen` com opções explícitas para `translation-library`, `work` e `translation-reader`, em vez de herdar `fade` da raiz.
- Centralizar as opções num lugar só (`shared/navigation/transitions.ts`, por exemplo), com funções como `drillIn(decorativeMotionEnabled)` e `modalFlow(...)`. Hoje cada `_layout.tsx` repete a mesma condição.
- Com `fullScreenGestureEnabled` no iOS, o gesto de voltar funciona a partir de qualquer ponto da tela nas telas de hierarquia, exceto no leitor, onde o gesto horizontal pertence à leitura.
- `animationDuration` só vale no iOS (em `fade`, `slide_from_bottom` e parecidos); no Android a duração é a do sistema.
- **Decidido na etapa 3** ([MOB-FEAT-069](../specs/features/MOB-FEAT-069-page-transitions/spec.md)): a biblioteca de traduções é troca de módulo (`fade`); Configurações é ir mais fundo; o fluxo "Traduzir capítulo" sobe de baixo com gesto só pela borda (puxar para baixo brigaria com a rolagem); o fade dura `motion.base` no iOS (o padrão do sistema era 500 ms); os leitores desligam o gesto em tela inteira, que o iOS 26 liga por padrão.

## Desempenho

1. **Pressionado sem re-render**: ver a seção de toque. Medir antes e depois numa lista longa (biblioteca e capítulos) com o React DevTools Profiler.
2. **Esqueleto com um relógio só.** Hoje cada `Skeleton` cria um `Animated.loop` próprio; uma tela com 12 esqueletos roda 12 laços. Passar a um valor compartilhado (contexto ou `useSharedValue` em módulo) para todos piscarem juntos, o que também fica mais calmo visualmente.
3. **Folha e diálogo na UI thread.** `BottomSheet` e `CenterDialog` usam `Animated` com driver nativo, o que já é bom para a animação, mas o fechamento ainda depende de `setState` no fim. Migrar para Reanimated permite fechar puxando a folha (gesto acompanhando o dedo) e trocar a espera fixa `SHEET_CHAIN_DELAY_MS` pelo fim real da animação.
4. **Nada de layout animado.** Revisar barras de progresso (`ProgressSteps`, faixa de status do lote) e qualquer `height` ou `width` que mude com animação; trocar por `scaleX` ou `translate`.
5. **Imagens.** `expo-image` já está no projeto; usar `transition={motion.base}` nas capas e miniaturas para entrar com fade em vez de aparecer de uma vez, e `recyclingKey` nas listas para não piscar a imagem antiga.
6. **Listas.** Animações de entrada só no primeiro carregamento, nunca ao rolar ou reciclar células.
7. **Medição.** Seguir a seção 3 do roteiro de auditoria: Perf Monitor no iOS e no Android, release build, aparelho de 120 Hz e de 60 Hz. Uma etapa só fecha sem quadro perdido visível nas animações que ela tocou.

## Animações novas (poucas e discretas)

Só entram as que explicam alguma coisa:

| Onde | Animação | Por quê |
| --- | --- | --- |
| Carregamento → conteúdo | troca do esqueleto pelo conteúdo com fade (`base`) | Evita o salto seco quando os dados chegam. |
| Capas e miniaturas | fade de entrada da imagem (`expo-image`) | Evita o pisca-pisca de imagem carregando. |
| Caixa de seleção e escolha | check com `scale` de 0.8 para 1 (`fast`) | Confirma o toque nos termos e nas listas de escolha. |
| Controle segmentado e abas | indicador desliza até a opção escolhida (`base`) | Mostra de onde para onde a seleção mudou. |
| Toast | entra subindo 8 pt com fade; fecha arrastando para baixo | Hoje só aparece; o gesto deixa dispensar sem esperar. |
| Progresso do lote e das etapas | barra avança suave (`scaleX`, `base`) | Hoje pula de valor em valor. |
| Item removido ou adicionado em lista | fade e recolhimento (Reanimated `Layout` com `exiting`) | Mostra o que sumiu, por exemplo ao excluir um capítulo. |
| Erro de formulário | mensagem entra com fade (`fast`), sem tremer o campo | Chama atenção sem ser agressivo. |

Fica de fora: paralaxe, animação contínua em repouso, confete, quique, mascote animado e qualquer coisa que rode sozinha sem ação da pessoa (MOB-FEAT-057 já exclui animações decorativas novas do leitor).

## Etapas

Cada etapa tem análise, plano aprovado, código, testes e verificação no simulador, como na revisão tela a tela.

1. **Escala de movimento.** Novos tokens de duração e curva em `shared/theme`, com testes de `resolveMotionDurations`. Trocar os números soltos (`Skeleton`, `ContentReader`, `SHEET_CHAIN_DELAY_MS`) pelos tokens.
2. **Toque e hover.** `PressableBox` com `hovered` e `focused`, token `surfaceHover`, estado pressionado na UI thread e a tabela de feedback aplicada aos componentes de `shared/ui`. Decidir o ripple no Android.
3. **Transições de página.** Módulo de transições compartilhado, `Stack.Screen` explícito para as rotas de tradução local, tabela de tipos aplicada. Precisa de Target Spec (muda comportamento visível de navegação).
4. **Desempenho.** Esqueleto com relógio único, folha e diálogo em Reanimated com fechar puxando, barras em `scaleX`, medição antes e depois.
    - **4a (2026-11-14, feita):** relógio único, `ProgressFill` com `scaleX`, folha encadeada pelo `onClosed` e fade nas imagens da biblioteca. Falta medir no aparelho.
    - **4b (2026-11-14, feita, [MOB-FEAT-070](../specs/features/MOB-FEAT-070-sheet-drag-to-close/spec.md)):** fechar a folha puxando, com Reanimated e gesture-handler. Falta conferir no aparelho. O `CenterDialog` fica em `Animated`, porque não tem gesto e migrar não traria ganho.
5. **Animações novas.** Uma por vez, na ordem da tabela, cada uma aprovada antes.

## Verificação de cada etapa

- `pnpm typecheck`, `npx jest --ci`, `pnpm lint:fsd` e Prettier `--check` nos arquivos tocados.
- Testes com relógio controlado (`jest.useFakeTimers`) para durações e para o caminho com movimento reduzido (duração 0, sem deslocamento), como pede a estratégia de evidência de MOB-FEAT-002 (AC-009 e AC-010).
- Simulador iOS nos temas claro e escuro, com "Reduzir movimento" ligado e desligado.
- Android em aparelho físico ou emulador para ripple, transições nativas e taxa de quadros.
- Registro do que mudou no documento da revisão tela a tela.

## Fora de escopo

- Trocar a biblioteca de navegação ou de animação (React Navigation, Reanimated 4 e `Animated` continuam).
- Haptics (`expo-haptics` não está instalado); pode virar uma proposta separada.
- Animações do leitor de páginas além dos controles que já existem.
- Mudar o fluxo de qualquer tela; aqui só muda como as transições aparecem.
