---
id: MOB-FEAT-070
type: feature
title: Fechar a folha inferior puxando para baixo
status: in-progress
implementation_gate: open
blocked_by: []
created: 2026-11-14
updated: 2026-11-14
supersedes: []
superseded_by: []
---

# MOB-FEAT-070 — Fechar a folha inferior puxando para baixo

## Objetivo

Deixar a pessoa fechar uma folha inferior puxando-a para baixo, com a folha acompanhando o dedo. Hoje a folha tem a
alça de arrastar desenhada, mas ela não responde: só fecha pelo X, por um toque fora dela ou pelo voltar do sistema.

Etapa 4b do [plano de animações](../../../plans/2026-11-14-animacoes.md).

## Contexto e contratos relacionados

- MOB-FEAT-002: `decorativeMotionEnabled` falso (animações desligadas ou movimento reduzido) zera as animações.
- MOB-FEAT-057: escala de movimento (`sheet` 280, `exit` 180, `base` 200 ms) e a folha inferior compartilhada.
- `shared/ui/BottomSheet.tsx` serve de base para `ActionSheet`, `ConfirmSheet`, `MediaPreviewSheet`, `SelectField`,
  `ChoiceRow` e as folhas das telas (cerca de 20 pontos de uso). A mudança vale para todos ao mesmo tempo.
- `react-native-gesture-handler` (`GestureHandlerRootView` em `AppProviders`) e Reanimated 4 já estão instalados.

## Requisitos e regras

1. **Onde o gesto começa:** só na faixa da alça e no cabeçalho da folha (título, descrição e X). O corpo não inicia o
   gesto: a rolagem e controles de arrastar dentro dele (régua de valores, reordenar páginas) continuam como estão.
2. **Durante o arrasto:**
    - a folha desce junto com o dedo;
    - para cima ela não passa da posição aberta, apenas resiste um pouco e volta;
    - o fundo escuro clareia na mesma proporção.
3. **Ao soltar:**
    - a folha fecha se desceu mais de 30% da própria altura ou se foi solta com velocidade para baixo acima de
      800 pt/s;
    - senão, volta para a posição aberta em `motion.base`.
4. **Fechar pelo gesto é o mesmo que fechar pelo X:** chama `onClose` da folha. Quem já trata o fechamento (confirmar
   descarte de texto digitado, por exemplo) continua tratando do mesmo jeito.
5. **Com movimento reduzido ou animações desligadas:**
    - o gesto continua funcionando e a folha acompanha o dedo, porque é manipulação direta e não enfeite;
    - ao soltar, ela fecha ou volta sem animação.
6. **Animações de entrada e saída:** continuam com os tempos e curvas atuais (entrada `sheet`, saída `exit`). Passam
   a rodar em Reanimated para a folha e o gesto compartilharem o mesmo valor, sem pular de posição.
7. **Teclado aberto:** o gesto funciona igual; ao fechar a folha, o teclado fecha junto.
8. **Acessibilidade:** o gesto é um atalho. O X, o toque fora da folha, o voltar do sistema e o gesto de escape do
   leitor de tela continuam fechando a folha.
9. **Android:** o conteúdo do Modal fica envolvido em `GestureHandlerRootView`, que o gesture-handler exige dentro de
   Modal no Android.
10. **`onClosed`:** o aviso de fechamento (etapa 4a) continua disparando uma vez só, também quando o fechamento vem do
    gesto.

## Casos de erro

- Arrasto interrompido pelo sistema (ligação, alerta): a folha volta para a posição aberta.
- A folha some enquanto está sendo arrastada (o consumidor muda `visible` para falso): sai pela animação normal de
  saída, a partir de onde estava.
- Folha com altura fixa maior que a tela: o limite de 30% usa a altura que aparece na tela.

## Critérios de aceite

### AC-001 — Arrastar para fechar

Dada uma folha aberta, quando a pessoa arrasta a alça ou o cabeçalho para baixo além de 30% da altura e solta, então
`onClose` é chamado uma vez.

### AC-002 — Soltar antes do limite volta

Dada uma folha aberta, quando o arrasto para abaixo de 30% e a velocidade é baixa, então a folha volta para a posição
aberta em `motion.base`, e `onClose` não é chamado.

### AC-003 — Puxão rápido fecha

Dada uma folha aberta, quando a pessoa solta com velocidade para baixo acima de 800 pt/s, então `onClose` é chamado,
mesmo que o arrasto tenha ficado abaixo de 30%.

### AC-004 — O corpo não inicia o gesto

Dada uma folha com conteúdo que rola, quando a pessoa arrasta dentro do corpo, então a folha não se move, e a rolagem
e os controles de arrastar continuam funcionando.

### AC-005 — Movimento reduzido

Dada a preferência de movimento reduzido ou animações desligadas, quando a pessoa arrasta e solta, então a folha
acompanha o dedo e fecha ou volta sem animação, e a entrada e a saída continuam instantâneas.

### AC-006 — Outros meios de fechar continuam

Dada uma folha aberta, quando a pessoa toca no X, toca fora da folha, usa o voltar do sistema ou o escape do leitor de
tela, então a folha fecha como hoje, e `onClosed` dispara uma vez.

## Estratégia de evidência

| Critério | Teste/evidência esperada                                                                                 |
| -------- | -------------------------------------------------------------------------------------------------------- |
| AC-001   | Teste de componente com o gesto simulado (`fireGestureHandler` do gesture-handler) passando de 30%       |
| AC-002   | Teste de componente: arrasto curto e lento, `onClose` não chamado e volta em `motion.base`               |
| AC-003   | Teste de componente: arrasto curto com velocidade acima de 800 pt/s                                      |
| AC-004   | Teste de componente: o detector de gesto envolve só a alça e o cabeçalho; conferência manual com a régua |
| AC-005   | Teste de componente com movimento reduzido: duração 0 ao soltar, entrada e saída instantâneas            |
| AC-006   | Testes existentes do `BottomSheet`, `ActionSheet` e da folha encadeada continuam passando                |

Conferência manual no simulador iOS e no Android, temas claro e escuro, com "Reduzir movimento" ligado e desligado,
numa folha curta (menu "⋯"), numa folha com rolagem (configurações do leitor) e numa folha com teclado (renomear obra).

## Gate de implementação

- Estado: `open`
- Dependências: nenhuma
- Motivo: não aplicável

## Fora de escopo

- Arrastar para cima para expandir a folha (alturas intermediárias ou tela cheia).
- Iniciar o gesto pelo corpo da folha quando a rolagem está no topo.
- Migrar o `CenterDialog`, que não tem gesto, para Reanimated.
- Fechar o toast arrastando (etapa 5 do plano de animações).
- Háptico ao passar do limite (`expo-haptics` não está instalado).

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-11-14

Não criar `tasks.md` antes de status `approved` e aprovação preenchida.
