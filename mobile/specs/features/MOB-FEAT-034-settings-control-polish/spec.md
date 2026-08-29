---
id: MOB-FEAT-034
type: feature
title: Correção e acabamento fino dos controles de configurações
status: implemented
implementation_gate: open
blocked_by: [MOB-FEAT-033]
created: 2026-08-24
updated: 2026-08-24
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
  extremidades externas são arredondadas e a seleção não depende apenas da cor.
- O slider deriva o valor da posição local absoluta do ponteiro durante todo o
  gesto, sem reutilizar valor inicial obsoleto.
- Status locais ou já sincronizados não ocupam rodapé; erro, pending e syncing
  continuam visíveis e acessíveis.

## Casos de erro

- Drag iniciado em qualquer ponto do slider permanece limitado ao intervalo e
  arredondado pelo step.
- Mudança de props durante o gesto não pode inverter nem reiniciar o valor.
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
primeiro e último, check contrastante e identificação textual da seleção.

### AC-004 — Slider preciso

Toque e drag para esquerda/direita produzem valores monotônicos coerentes com a
posição, respeitando 0..100 e step 5.

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
| AC-004   | regressão unitária do gesto do RangeSlider                |
| AC-005   | teste de SettingsSyncStatus e integração das subtelas     |
| AC-006   | matriz nativa e gates completos                           |

## Gate de implementação

- Estado: `open`.
- Dependência: `MOB-FEAT-033` implementada.
- Escopo autorizado: shared UI, composições consumidoras, testes, cobertura e
  documentação desta correção.

## Fora de escopo

- Criar novas preferências ou alterar payloads e persistência.
- Trocar o componente nativo `Switch` ou adicionar biblioteca de slider.
- Alterar o design de superfícies fora das configurações.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-08-24
- Decisão: correções solicitadas e implementação autorizada.
