---
id: MOB-FEAT-037
type: feature
title: Layout seguro entre copy e switch nas configurações
status: implemented
implementation_gate: open
blocked_by: [MOB-FEAT-036]
created: 2026-08-26
updated: 2026-08-26
supersedes: []
superseded_by: []
---

# MOB-FEAT-037 — Layout seguro entre copy e switch nas configurações

## Objetivo

Impedir que títulos ou descrições das preferências booleanas sejam renderizados
sob o switch nas telas de configurações, em qualquer largura ou escala de fonte.

## Contexto e contratos relacionados

- Refina `MOB-FEAT-031..036` sem alterar valores, stores ou persistência.
- A imagem e a clarificação fornecidas pelo aprovador em 2026-08-26 confirmam
  que o defeito está no `SwitchRow`, não nos controles de rádio.
- A solicitação explícita de correção constitui aprovação humana.

## Requisitos e regras

- Copy e switch devem participar do fluxo normal de layout, em colunas irmãs.
- A copy deve usar largura flexível e permitir wrap sem passar sob o switch.
- O switch deve possuir largura intrínseca reservada e nunca encolher.
- Em font scale elevado, o layout pode empilhar o switch abaixo da copy para
  preservar legibilidade e alvo de toque.
- A linha inteira permanece acionável e o switch mantém semântica, foco,
  seleção e estado desabilitado.
- Nenhuma tela consumidora deve implementar compensações locais.

## Casos de erro

- Título ou descrição longos não podem continuar por baixo do switch.
- Ausência de descrição não pode quebrar o alinhamento entre título e controle.
- Font scale elevado não pode comprimir o switch nem ocultar a copy.
- Estado desabilitado não pode perder label ou semântica assistiva.

## Critérios de aceite

### AC-001 — Ausência de sobreposição

Título e descrição nunca ocupam a área horizontal ou vertical reservada ao
switch.

### AC-002 — Responsividade

O controle funciona em telas estreitas e com font scale de 200%, permitindo
wrap ou empilhamento sem perda de conteúdo.

### AC-003 — Interação e semântica

A linha inteira alterna o valor uma única vez; o switch expõe `checked`,
`disabled`, foco e label acessível.

### AC-004 — Compatibilidade

Todos os consumidores atuais de Aparência, Acessibilidade, Leitor e Privacidade
mantêm callbacks, i18n e persistência existentes.

### AC-005 — Arquitetura

A correção permanece em `shared/ui/SwitchRow`, usa tokens públicos e não cria
duplicações nas features.

### AC-006 — Qualidade

Testes dirigidos, análise visual, gates FSD e `pnpm check` passam integralmente.

## Estratégia de evidência

| Critério | Evidência esperada                         |
| -------- | ------------------------------------------ |
| AC-001   | teste estrutural de colunas e flex         |
| AC-002   | teste de font scale e wrap                 |
| AC-003   | testes de pressão, foco e estado assistivo |
| AC-004   | testes dos consumidores                    |
| AC-005   | coverage e lint FSD                        |
| AC-006   | auditoria e gates completos                |

## Gate de implementação

- Estado: `open`.
- Dependência: `MOB-FEAT-036` implementada.
- Escopo autorizado: `SwitchRow`, testes, consumidores sem mudança de contrato,
  cobertura e documentação desta correção.

## Fora de escopo

- Alterar o significado ou valor padrão das preferências.
- Substituir o switch nativo por dependência externa.
- Modificar rádios, selects, sliders ou steppers.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-08-26
- Decisão: defeito demonstrado e correção solicitada.
