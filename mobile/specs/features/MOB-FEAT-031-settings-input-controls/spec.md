---
id: MOB-FEAT-031
type: feature
title: Controles contextuais das configurações
status: implemented
implementation_gate: open
blocked_by: [MOB-FEAT-030]
created: 2026-08-22
updated: 2026-08-22
supersedes: []
superseded_by: []
---

# MOB-FEAT-031 — Controles contextuais das configurações

## Objetivo

Substituir a aplicação indiscriminada de opções quadradas nas subtelas de
configurações por controles coerentes com a natureza de cada dado, melhorando
hierarquia, distribuição, interação, responsividade e personalidade visual sem
alterar contratos, stores, persistência, requests ou navegação.

## Contexto e contratos relacionados

- Refina `MOB-FEAT-001..009`, `MOB-FEAT-011`, `MOB-FEAT-028..030` sem substituir
  regras funcionais existentes.
- Preserva tipos e normalização de `UserSettings`, preferências de privacidade,
  idiomas priorizados, confirmações destrutivas e estados de sincronização.
- A implementação segue `shared → features → widgets → pages`; controles
  agnósticos pertencem a `shared/ui` e features apenas escolhem sua composição.
- A solicitação explícita de execução em 2026-08-22 constitui aprovação humana
  para esta evolução de UI e acessibilidade.

## Requisitos e regras

### Mapeamento dos controles

- Tema e modo de leitura usam cards de escolha com apoio visual e descrição.
- Tamanho do texto, densidade, direção, ajuste e visibilidades curtas usam
  seletores segmentados quando os rótulos couberem de forma legível.
- Idioma da interface, formato de data e opções sensíveis com explicação usam
  cards de escolha; fuso horário e qualidade usam campo de seleção em sheet.
- Saturação usa slider ajustável e apresenta valor atual; espaçamento e
  pré-carregamento usam steppers com incremento/decremento.
- Animações, reduzir movimento, alto contraste, marcar como lido e analytics são
  booleanos apresentados como switches.
- Fundo do leitor usa amostras visuais selecionáveis, mantendo label textual.
- Idiomas de conteúdo permanecem uma lista ordenada, com posição, fallback e
  ações acessíveis; adicionar idioma é uma ação distinta, não um radio.
- Limpeza, exportação e histórico são ações, não campos; ficam agrupados por
  finalidade e preservam confirmação, loading e tom destrutivo.

### Composição e estados

- Formulários usam seções com título, descrição e superfície compartilhada.
- Normal, pressionado, foco, selecionado, desabilitado, loading e erro são
  visíveis e semanticamente anunciados.
- Nenhum estado depende somente de cor; seleção combina borda, ícone e estado
  assistivo.
- Labels, descrições e valores crescem em 200% sem sobreposição ou perda de ação.
- Controles usam tokens públicos, alvo mínimo e i18n em pt-BR, en-US e es-ES.

## Casos de erro

- Uma opção indisponível fica desabilitada sem desaparecer nem aceitar mudança.
- Fuso ou qualidade selecionados continuam visíveis ao reabrir o sheet.
- Slider responde a toque, gesto e ações assistivas de incremento/decremento,
  mantendo o valor entre os limites.
- `DO_NOT_TRACK` mantém sua confirmação e desabilita analytics com explicação.
- Falhas de sync permanecem persistentes e oferecem retry sem desfazer a escolha
  local verdadeira.
- Operações destrutivas continuam exigindo confirmação e não mudam de contrato.

## Critérios de aceite

### AC-001 — Primitivas contextuais

`shared/ui` oferece seções de formulário, segmentos, cards de escolha, campo de
seleção, slider e steppers reutilizáveis, tokenizados e acessíveis.

### AC-002 — Aparência e acessibilidade

Tema, texto, densidade e os três booleanos usam controles adequados e hierarquia
editorial, preservando sync e retry.

### AC-003 — Idioma e região

Idioma, formato de data e fuso usam composições distintas, com labels e valores
localizados e persistência equivalente.

### AC-004 — Preferências do leitor

Modo, direção, ajuste, qualidade, fundo, saturação, espaçamento,
pré-carregamento e marcar como lido possuem controles apropriados e equivalentes.

### AC-005 — Privacidade e conteúdo

Visibilidades, conteúdo adulto e analytics usam controles coerentes; idiomas de
conteúdo permanecem ordenáveis e o fallback obrigatório não pode ser removido.

### AC-006 — Dados e ações

Controles de dados são agrupados por finalidade e distinguem ações normais e
destrutivas, preservando confirmações, autenticação, loading e erros.

### AC-007 — Responsividade e acessibilidade

320×568, 390×844, 600×960, 840×600, temas e font scale 200% preservam conteúdo,
ordem assistiva, foco, seleção e alvos mínimos.

### AC-008 — Compatibilidade e qualidade

Rotas, stores, requests, persistência e regras permanecem equivalentes; testes e
`pnpm check` passam integralmente.

## Estratégia de evidência

| Critério | Evidência esperada                                |
| -------- | ------------------------------------------------- |
| AC-001   | testes dirigidos das primitivas e estados         |
| AC-002   | testes da feature de aparência e auditoria nativa |
| AC-003   | testes de idioma/região e sheet de seleção        |
| AC-004   | testes do leitor, slider, steppers e switch       |
| AC-005   | testes de privacidade e idiomas priorizados       |
| AC-006   | testes dos controles de dados e confirmações      |
| AC-007   | matriz nativa responsiva e assistiva              |
| AC-008   | regressão completa, FSD, review e drift audit     |

## Gate de implementação

- Estado: `open`.
- Dependência: `MOB-FEAT-030` está implementada.
- Escopo autorizado: componentes de entrada, composição visual, copy de apoio,
  acessibilidade e testes das configurações existentes.

## Fora de escopo

- Criar novas preferências sem contrato existente.
- Alterar payloads, banco, API, persistência ou política de sincronização.
- Expor tabs, catálogo, processamento remoto ou funcionalidades futuras.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-08-22
- Decisão: aprimoramento e implementação solicitados explicitamente.
