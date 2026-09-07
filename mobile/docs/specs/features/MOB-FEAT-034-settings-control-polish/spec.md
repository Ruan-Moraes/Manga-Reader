---
id: MOB-FEAT-034
type: feature
title: Correção e acabamento fino dos controles de configurações
status: verification-pending
implementation_gate: open
blocked_by: [MOB-FEAT-033]
created: 2026-08-24
updated: 2026-09-05
supersedes: []
superseded_by: []
---

# MOB-FEAT-034 — Correção e acabamento fino dos controles de configurações

## Objetivo

Corrigir os problemas observados nas capturas reais das configurações: controle
booleano desalinhado, cards de tema com descrição fora do eixo do preview,
amostras de cor isoladas, gesto incorreto do slider e rodapé local repetitivo.

## Contexto e contratos relacionados

- Refina `MOB-FEAT-031..033` sem alterar os valores, stores, persistência ou
  requests das preferências.
- As quatro capturas fornecidas em 2026-08-24 são a evidência visual de entrada.
- A solicitação explícita de correção e implementação constitui aprovação
  humana desta Target Spec.
- A execução segue `shared → features → pages` e preserva APIs públicas.

## Requisitos e regras

- Switches permanecem no extremo oposto ao bloco textual, centralizados e sem
  colar na descrição, inclusive com texto ampliado.
- Cards com preview agrupam título e descrição ao lado do preview; o estado de
  seleção continua no extremo direito.
- Cores formam uma faixa única de segmentos quadrados contíguos; somente as
  extremidades externas são arredondadas. A seleção usa apenas o check e o
  estado assistivo, sem borda destacada ao redor da amostra.
- O `RangeSlider` compartilhado implementa o gesto com `Gesture.Pan`/
  `Gesture.Tap` e `react-native-reanimated`, sem depender do ciclo de eventos
  do `@react-native-community/slider`. A posição do thumb e da trilha evolui
  no UI thread; a API pública e a semântica ajustável permanecem as mesmas.
- O rail reserva lateralmente o raio do thumb visual (12 px). Assim, seus
  centros nos limites mínimo e máximo permanecem dentro da área interativa e
  o thumb de 24 px não ultrapassa o contêiner. Toques nas margens continuam
  representando os limites.
- Durante o gesto, o valor visual é otimista, limitado ao intervalo e
  arredondado pelo `step`. O pan ancora o offset entre dedo e thumb no início
  do toque, pois o Android pode zerar `translationX` quando o gesto ativa. No
  release, a coordenada terminal é calculada uma única vez no UI thread,
  inclusive se não houve evento de movimento final; somente esse valor é
  enviado ao callback externo e à persistência. Props antigas não podem mover
  o thumb depois do release; a reconciliação visual só ocorre após a
  confirmação do valor normalizado pelo pai.
- Saturação, espaçamento e pré-carregamento compartilham o slider; seus
  intervalos permanecem equivalentes ao web (`0..100`, `0..32` e `0..10`).
- Status locais ou já sincronizados não ocupam rodapé; erro, pending e syncing
  continuam visíveis e acessíveis.

## Casos de erro

- Drag iniciado em qualquer ponto do slider, inclusive sobre ambos os
  extremos, permanece limitado ao intervalo e arredondado pelo step.
- Mudança de props durante o gesto não pode inverter nem reiniciar o valor.
  Após soltar, uma prop atrasada não pode deslocar o thumb do valor liberado
  para um valor adjacente; o valor somente reconcilia quando o pai confirma o
  mesmo valor normalizado.
- Um `onUpdate` ausente ou coalescido antes do término não pode descartar a
  última coordenada do dedo: `onEnd` precisa calcular e capturar o valor final.
  Atualizações de movimento posteriores ao release e props anteriores não podem
  alterar o callback nem a posição visual já capturada.
- Labels longos e font scale de 200% não podem sobrepor switch, preview, check
  ou amostras.
- Ao rolar, rótulos e opções não podem atravessar a safe area superior nem
  ocupar a região do relógio, câmera ou Dynamic Island.
- Opções desabilitadas não recebem toque e preservam leitura assistiva.

## Critérios de aceite

### AC-001 — Booleanos alinhados

Switches ficam à direita do título e descrição com separação consistente e alvo
integral de toque.

### AC-002 — Cards de tema coesos

Preview, título e descrição formam uma única linha semântica; seleção permanece
visível e nenhum texto fica solto abaixo do ícone.

### AC-003 — Faixa de cores segmentada

Fundos do leitor aparecem como cinco quadrados contíguos com cantos somente no
primeiro e último, sem borda de seleção, com check contrastante e identificação
textual de cada opção. Todas as cinco células preservam largura equivalente
mesmo sem conteúdo interno selecionado. A largura deve ser calculada a partir
da medição real do grupo e aplicada numericamente às células, sem depender de
percentuais ou flex para a superfície colorida no iOS. Tocar uma amostra
atualiza e mantém o valor escolhido.

### AC-004 — Slider preciso

Toque e drag para esquerda/direita produzem valores monotônicos coerentes sem
recuar durante atualizações do componente ou depois do release. O thumb
permanece integralmente dentro do contêiner nos valores mínimo e máximo.
Saturação respeita step 5;
espaçamento e pré-carregamento respeitam step 1 e os limites equivalentes ao web.
O movimento permanece responsivo sem gravar no storage a cada frame.

### AC-005 — Status não intrusivo

Rodapés local/synced deixam de aparecer nas subtelas; estados operacionais e
erro/retry permanecem disponíveis.

### AC-006 — Responsividade, acessibilidade e qualidade

Tema claro/escuro, orientação, texto ampliado, i18n e semântica permanecem
válidos. A viewport rolável permanece contida entre as safe areas superior e
inferior, inclusive durante rolagem e abertura do teclado; `pnpm check` passa
integralmente.

## Estratégia de evidência

| Critério | Evidência esperada                                        |
| -------- | --------------------------------------------------------- |
| AC-001   | teste de layout/semântica do SwitchRow e auditoria nativa |
| AC-002   | teste de ChoiceCards e aparência no simulador             |
| AC-003   | teste de SwatchPicker e leitor no simulador               |
| AC-004   | regressões unitárias de extremos, release e prop atrasada |
| AC-005   | teste de SettingsSyncStatus e integração das subtelas     |
| AC-006   | matriz nativa e gates completos                           |

## Gate de implementação

- Estado: `open`.
- Dependência: `MOB-FEAT-033` implementada.
- Escopo autorizado: shared UI, composições consumidoras, testes, cobertura e
  documentação desta correção.

## Fora de escopo

- Criar novas preferências ou alterar payloads e persistência.
- Trocar o componente nativo `Switch`.
- Alterar o design de superfícies fora das configurações.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-08-24
- Decisão: correções solicitadas e implementação autorizada.

### Aditivo de regressão do slider

- Aprovador: Ruan Moraes
- Data: 2026-09-01
- Decisão histórica, supersedida em 2026-09-05: após a persistência do desvio
  no Android e a pesquisa técnica, foi autorizada a substituição do gesto
  manual pelo controle nativo do Expo para cumprir o AC-004, sem alterar a API
  pública ou as preferências.

### Correção do encerramento nativo

- Data: 2026-09-04
- Decisão supersedida: o término do gesto nativo não resolve de forma confiável
  o ciclo Android/Expo; a implementação foi substituída pela decisão abaixo.

### Substituição por gesto no UI thread

- Data: 2026-09-05
- Decisão: substituir o `NativeSlider` pelo padrão oficial de slider do
  Reanimated com Gesture Handler. O `Pan` preserva a âncora do toque em
  `onBegin`, calcula o ponto terminal em `onEnd` e cruza para o callback apenas
  uma vez. O `Tap` mantém a seleção direta no trilho. A decisão elimina a
  corrida conhecida do componente nativo não controlado no Android, mantendo
  Expo SDK 54 e as dependências já instaladas.
- Evidência externa: documentação do
  [slider Reanimated](https://docs.swmansion.com/react-native-reanimated/examples/slider/),
  do [Pan Gesture](https://docs.swmansion.com/react-native-gesture-handler/docs/2.x/gestures/pan-gesture/)
  e o relato correspondente do
  [react-native-slider #716](https://github.com/callstack/react-native-slider/issues/716).
