---
id: MOB-FEAT-033
type: feature
title: Acabamento visual de produto das configurações
status: implemented
implementation_gate: open
blocked_by: [MOB-FEAT-032]
created: 2026-08-24
updated: 2026-09-03
supersedes: []
superseded_by: []
---

# MOB-FEAT-033 — Acabamento visual de produto das configurações

## Objetivo

Elevar as configurações de um conjunto funcional de controles para uma
experiência visual finalizada, editorial e coerente com a referência, corrigindo
composição excessivamente encaixotada, grids assimétricos, ações sem contexto
visível e escolhas visuais representadas por controles genéricos.

## Contexto e contratos relacionados

- Refina `MOB-FEAT-030..032`, preservando todos os contratos funcionais de
  preferências, autenticação, persistência, sincronização e navegação.
- A solicitação explícita de acabamento e implementação em 2026-08-24 constitui
  aprovação humana desta evolução visual.
- Ritmo editorial, grupos, linhas, superfícies e destaque amarelo seguem os
  contratos de `MOB-FEAT-028..032`, os tokens de tema e as primitivas
  compartilhadas; capacidades sem contrato continuam fora do aplicativo.
- A execução permanece incremental em `shared → features → widgets → pages`.

## Requisitos e regras

- Títulos e descrições de seção ficam fora das superfícies que agrupam os
  controles; cards internos são reservados às decisões ou ações.
- No índice e em todas as subtelas, grupos editoriais consecutivos usam o mesmo
  `SectionStack` com separação vertical `xl`, sem aumentar o espaço interno das
  linhas.
- Escolhas visuais e descritivas não usam grids assimétricos.
- Cada preferência preserva o controle contextual definido em `MOB-FEAT-032`.
- Estados e textos permanecem derivados dos stores existentes, sem estado de
  produto paralelo criado apenas para apresentação.
- Novos elementos visuais usam exclusivamente tema, i18n e primitivas públicas.

## Casos de erro

- Falha de persistência ou sincronização mantém mensagem persistente e retry.
- Ação indisponível permanece explicada e não aceita interação.
- Texto ampliado, tradução longa ou viewport baixa não pode sobrepor controles
  nem ocultar a única forma de concluir ou desfazer uma ação.
- Amostras claras e escuras preservam indicador de seleção contrastante.

## Critérios de aceite

### AC-001 — Seções leves e consistentes

Seções exibem título e descrição fora da superfície de controles, eliminando o
efeito de caixa dentro de caixa e preservando separação, alinhamento e leitura.

### AC-002 — Escolhas equilibradas

Escolhas com descrição não formam grids 2+1; usam linhas ou colunas equilibradas
com ícone, texto, estado selecionado e área de toque completa.

### AC-003 — Controles visualmente específicos

Tema possui preview reconhecível; fundos do leitor usam amostras dedicadas;
segmentos, selects, sliders, steppers e switches mantêm identidade própria e
feedback de foco, pressionado, selecionado e desabilitado.

### AC-004 — Ações explicadas

Ações de dados e links de informações mostram título, descrição, ícone, tom,
loading e disponibilidade diretamente na tela, sem depender apenas de hint.

### AC-005 — Índice e páginas coesos

O índice, todas as subtelas e o botão voltar compartilham o mesmo ritmo,
largura, hierarquia, estado de sincronização e tratamento responsivo.

### AC-006 — Responsividade e acessibilidade

Tema claro/escuro, alto contraste, densidades, 320×568, 390×844, 600×960,
840×600 e font scale de 200% preservam conteúdo, contraste, ordem e alvos.

### AC-007 — Compatibilidade e qualidade

Nenhuma preferência fictícia é criada; stores, requests e rotas permanecem
equivalentes, i18n mantém paridade e `pnpm check` passa integralmente.

## Estratégia de evidência

| Critério | Evidência esperada                                      |
| -------- | ------------------------------------------------------- |
| AC-001   | inspeção de `FormSection`, grupos e auditoria nativa    |
| AC-002   | ChoiceCards empilhados, resolvers e testes              |
| AC-003   | previews, SwatchPicker e testes de semântica/estado     |
| AC-004   | DataControls, About e testes de disponibilidade/loading |
| AC-005   | integração do índice, subtelas e back                   |
| AC-006   | auditoria de temas, contraste, orientação e font scale  |
| AC-007   | typecheck, i18n, boundaries, suíte e gates SDD          |

## Gate de implementação

- Estado: `open`.
- Dependência: `MOB-FEAT-032` implementada.
- Escopo autorizado: acabamento de composição, controles visuais, estados,
  responsividade, acessibilidade, testes e documentação das configurações reais.

## Fora de escopo

- Adicionar perfil de leitura, avanço automático, tradução experimental,
  downloads ou laboratório sem contrato funcional aprovado.
- Alterar payloads, banco, API, política de privacidade ou regras de sessão.
- Redesenhar autenticação, launcher, tradução local ou o viewport do leitor.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-08-24
- Decisão: acabamento completo e implementação solicitados explicitamente.
