---
id: MOB-FEAT-029
type: feature
title: Segunda auditoria visual e navegação interna
status: implemented
implementation_gate: open
blocked_by: [MOB-FEAT-028]
created: 2026-08-22
updated: 2026-08-22
supersedes: []
superseded_by: []
---

# MOB-FEAT-029 — Segunda auditoria visual e navegação interna

## Objetivo

Revisar novamente todas as superfícies acessíveis do aplicativo em execução
nativa, corrigir acabamentos visuais e consolidar o retorno de telas internas em
componentes compartilhados, preservando regras de negócio, integrações e rotas.

## Contexto e contratos relacionados

- Refina `MOB-FEAT-028` sem substituir sua identidade editorial ou seus contratos.
- Preserva os comportamentos de `MOB-BASE-004..008` e `MOB-FEAT-001..016`.
- A execução segue `shared → entities → features → widgets → pages → application`.
- A solicitação explícita de implementação em 2026-08-22 constitui aprovação
  humana desta auditoria e de suas correções exclusivamente visuais/navegacionais.

## Requisitos e regras

### Navegação interna compartilhada

- `shared/ui` deve expor um botão de retorno e um cabeçalho reutilizável,
  agnósticos a rotas e domínio.
- O botão mantém ícone, alinhamento, estados, contraste, alvo mínimo e label
  assistiva em fundos claros, escuros, elevados, com imagem ou scrim.
- O cabeçalho admite ausência de título, título multilinha e ação à direita sem
  deslocar o título do centro geométrico nem reservar placeholders laterais.
- Cada página fornece seu callback. Quando `router.canGoBack()` for falso, a
  página usa um destino seguro coerente com o fluxo.
- Launcher raiz não exibe retorno. Telas internas não duplicam retorno e fechar.
- Modais e overlays usam fechar quando essa é a ação semântica; não fingem back.

### Refinamento visual

- Safe areas, teclado, conteúdo extenso e rotação não ocultam cabeçalhos, campos,
  mensagens ou ações essenciais.
- Títulos, descrições, grupos, linhas, chevrons, metadados, bordas, sombras e
  espaçamentos seguem tokens e primitivas públicas.
- Estados normal, pressionado, foco, selecionado, desabilitado, loading, vazio,
  erro, aviso, sucesso e parcial preservam hierarquia e ação alcançável.
- Fluxos auth, settings, tradução local, reader, status conectado e superfícies
  secundárias mantêm comportamento funcional equivalente.
- Textos novos possuem paridade em pt-BR, en-US e es-ES.

## Casos de erro

- Uma rota interna aberta por deep link retorna para seu fallback seguro.
- Um título longo cresce verticalmente sem sobrepor retorno ou ação direita.
- Font scale ampliada não corta o título; o cabeçalho pode usar mais de uma linha.
- A grade vazia ou com conteúdo parcial mostra estado compreensível e ações.
- Erros de formulário continuam associados aos campos e alcançáveis com teclado.
- Loading/desabilitado mantém tamanho e posição, sem salto de layout.

## Critérios de aceite

### AC-001 — Componente de retorno compartilhado

Existe uma única primitiva pública para retorno, com variantes de contraste,
alvo mínimo, pressed/focus/disabled e label obrigatória.

### AC-002 — Cabeçalho flexível

O cabeçalho suporta título ausente ou multilinha e ação direita sem deslocar o
título do centro geométrico.

### AC-003 — Retorno seguro

Toda tela interna acessível possui retorno superior esquerdo quando existe um
destino anterior válido e aplica fallback seguro quando não há histórico.

### AC-004 — Sem duplicações

Implementações antigas de voltar são removidas e nenhuma tela exibe ações
duplicadas para o mesmo destino.

### AC-005 — Safe area e teclado

Cabeçalhos, campos, erros e ações essenciais permanecem alcançáveis com safe
areas e teclado aberto.

### AC-006 — Refinamento das superfícies

Todas as telas acessíveis são reinspecionadas e os problemas adicionais de
layout, hierarquia, alinhamento e componentes são corrigidos.

### AC-007 — Estados visuais

Loading, vazio, erro, sucesso, parcial, selecionado e desabilitado usam padrões
consistentes e verificáveis.

### AC-008 — Responsividade e acessibilidade

A auditoria cobre 320×568, 390×844, 600×960 e 840×600, temas e escala tipográfica
de 200%, sem perda de conteúdo essencial.

### AC-009 — Compatibilidade funcional

Regras de negócio, integrações, persistência, requests e contratos de navegação
permanecem equivalentes.

### AC-010 — Qualidade e evidência

`pnpm check` e `pnpm lint:fsd` passam, e a matriz da segunda auditoria registra
telas, estados, dimensões, correções e pendências reais.

## Estratégia de evidência

| Critério | Evidência esperada                                   |
| -------- | ---------------------------------------------------- |
| AC-001   | testes RNTL de retorno e estados                     |
| AC-002   | testes de título ausente, multilinha e ação direita  |
| AC-003   | testes de páginas e auditoria nativa de navegação    |
| AC-004   | busca de implementações antigas e testes de ausência |
| AC-005   | matriz nativa de safe area e teclado                 |
| AC-006   | checklist e capturas por superfície                  |
| AC-007   | testes de componentes e inspeção de estados reais    |
| AC-008   | matriz responsiva, temas e font scale                |
| AC-009   | suítes de regressão existentes                       |
| AC-010   | gates completos e relatório persistido               |

## Gate de implementação

- Estado: `open`.
- Dependência: `MOB-FEAT-028` está executada como `verification-pending`.
- Escopo autorizado: somente design, experiência, acessibilidade e navegação.

## Fora de escopo

- Novas funcionalidades, tabs, catálogo, biblioteca, fórum ou perfil real.
- Mudanças em banco, APIs, requests, autenticação, persistência ou domínio.
- Alteração de destinos existentes quando o histórico atual já é válido.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-08-22
- Decisão: segunda auditoria e implementação autorizadas explicitamente.
