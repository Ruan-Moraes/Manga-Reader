---
id: MOB-FEAT-042
type: feature
title: Select com folha de escolha
status: implemented
implementation_gate: open
blocked_by: []
created: 2026-08-28
updated: 2026-08-29
supersedes: [MOB-FEAT-041]
superseded_by: []
---

# MOB-FEAT-042 — Select com folha de escolha

## Objetivo

Transformar o `SelectField` em um controle inequivocamente interativo e abrir
suas opções em uma folha de escolha que sobe a partir do rodapé. A experiência
deve parecer uma superfície temporária de seleção, e não um menu flutuante ou
um diálogo central.

## Contexto e contratos relacionados

- O menu ancorado entregue em 2026-08-28 foi rejeitado pelo aprovador por não
  corresponder à experiência desejada.
- A solicitação explícita de 2026-08-29 reabre esta spec e autoriza sua revisão
  e implementação.
- A solução permanece genérica em `shared/ui`; fuso horário e qualidade não
  receberão variações locais.
- `Modal` nativo pode ser usado como mecanismo técnico de portal, back e foco,
  mas a apresentação visível deve ser uma folha inferior, nunca um modal
  central ou menu ancorado.

## Requisitos e regras

### Campo fechado

- O campo deve comunicar seleção por sua composição, não apenas por um chevron
  pequeno: ícone de lista, valor atual e affordance de expansão têm áreas e
  hierarquia próprias.
- A superfície deve ter altura mínima de 64 dp, borda estável de 2 dp e estados
  normal, pressionado, focado, aberto e desabilitado sem mudança geométrica.
- Label, descrição, valor, callbacks e acessibilidade pública são preservados.
- Copy longa deve encolher ou quebrar sem sobrepor os ícones.

### Folha de escolha

- A folha entra de baixo para cima e ocupa largura total, com cantos superiores
  arredondados, alça discreta e safe area inferior.
- A altura é derivada da viewport e do conteúdo: há presença mínima de tela,
  limite máximo de 82% e scroll interno quando as opções excederem o espaço.
- O cabeçalho contém título, valor atual como contexto e fechamento acessível,
  sem bloco ilustrativo ou decoração excessiva.
- As opções formam uma lista contínua, com alvo mínimo de 56 dp, padding `xl`
  (24 dp na densidade compacta e 32 dp na confortável), copy flexível e área
  fixa de 28 dp para seleção.
- A lista usa um único agrupamento visual e uma escala constante entre borda,
  opções, copy e indicador; opções não podem parecer cards desconectados.
- Seleção usa fundo sutil, texto destacado e check; pressão e foco não mudam
  altura, padding ou espessura da borda.
- Selecionar aplica imediatamente e fecha. Toque no scrim, back do Android e
  escape assistivo fecham sem chamar `onChange`.
- Rotação e redimensionamento recalculam a altura enquanto a folha estiver
  aberta. Paisagem curta prioriza scroll.
- Não será adicionada dependência externa.

## Casos de erro

- Viewport ou insets inválidos não podem gerar altura negativa ou maior que a
  área segura.
- Lista vazia deve abrir e fechar sem falhar.
- Texto a 200% não pode ocultar título, fechamento, valor ou opção selecionada.
- O scrim não pode ser o único mecanismo de fechamento.
- Cancelamento por qualquer mecanismo não pode alterar o valor.

## Critérios de aceite

### AC-001 — Affordance do campo

O campo fechado é reconhecível como seletor por ícone, valor e affordance de
expansão, com geometria estável em todos os estados.

### AC-002 — Apresentação inferior

As opções aparecem em folha que sobe do rodapé, ocupa largura total e não se
apresenta como menu ancorado ou diálogo central.

### AC-003 — Hierarquia das opções

Cabeçalho e lista possuem proporção clara, seleção inequívoca, alvos mínimos e
nenhuma ornamentação ou espaço morto desnecessário.

### AC-004 — Interação e acessibilidade

Selecionar aplica e fecha; scrim, escape e back cancelam; trigger expõe
`expanded` e as opções mantêm semântica de escolha exclusiva.

### AC-005 — Responsividade e contratos

Safe areas, rotação, paisagem, font scale e conteúdo longo funcionam sem mudar a
API, a persistência, os valores ou a i18n dos consumidores.

### AC-006 — Qualidade verificável

Testes dirigidos, inspeção no Simulator e `pnpm check` passam integralmente.

## Estratégia de evidência

| Critério | Evidência esperada                           |
| -------- | -------------------------------------------- |
| AC-001   | teste estrutural e inspeção do campo         |
| AC-002   | teste da apresentação e inspeção da animação |
| AC-003   | teste das opções e auditoria visual          |
| AC-004   | testes de seleção, cancelamento e semântica  |
| AC-005   | resolvedor de altura, rotação e consumidores |
| AC-006   | review, drift audit e gates completos        |

## Gate de implementação

- Estado: `open`.
- Dependências ativas: nenhuma; `MOB-FEAT-041` é a antecessora supersedida.
- Escopo autorizado: `SelectField`, testes, specs, registry e coverage.

## Fora de escopo

- Busca, seleção múltipla, agrupamento ou rota dedicada.
- Alterar as opções de qualidade ou fuso horário.
- Adicionar biblioteca externa de bottom sheet.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data da revisão: 2026-08-29
- Decisão: resultado anterior rejeitado; folha inferior aprovada e solicitada.
