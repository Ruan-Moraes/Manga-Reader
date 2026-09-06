---
id: MOB-FEAT-028
type: feature
title: Evolução visual e migração de experiência mobile
status: verification-pending
implementation_gate: open
blocked_by: [MOB-FEAT-011, MOB-FEAT-012, MOB-FEAT-013, MOB-FEAT-014, MOB-FEAT-015, MOB-FEAT-016]
created: 2026-08-21
updated: 2026-09-03
supersedes: []
superseded_by: []
---

# MOB-FEAT-028 — Evolução visual e migração de experiência mobile

## Objetivo

Evoluir as superfícies mobile com a identidade editorial consolidada nos tokens
e componentes compartilhados, preservando contratos funcionais e transformando
`/offline-translation` em uma jornada clara de cinco etapas dentro da mesma rota:
importar, organizar, escolher idiomas, validar e revisar/preparar.

## Contexto e contratos relacionados

- Evolui a apresentação de `MOB-FEAT-011` sem substituir seus contratos de tema,
  densidade, tipografia, i18n ou acessibilidade.
- Preserva launcher, autenticação, settings, leitores e o fluxo local descrito em
  `MOB-FEAT-010..016`; capacidades de `MOB-FEAT-017..021` não são simuladas.
- Os contratos desta spec, os tokens de tema e as primitivas compartilhadas são
  a autoridade visual; persistência, navegação, privacidade e regras de domínio
  permanecem regidas por seus contratos próprios.
- A execução segue `shared → entities → features → widgets → pages → application`.

## Requisitos e regras

### Sistema visual e primitivas

- Manter Nunito Sans e as paletas editoriais de `MOB-FEAT-011`; componentes de
  produto não usam cores literais.
- Acrescentar tokens semânticos de superfície pressionada, selecionada,
  desabilitada e scrim, preservando as paletas normativas de alto contraste.
- Manter escalas existentes de tipografia, spacing, raios e alvos mínimos.
- `shared/theme` expõe breakpoints compact/regular/medium/expanded e resolução
  responsiva agnóstica ao negócio.
- `shared/ui` expõe Icon, IconButton, StatusMessage, ProgressSteps,
  StickyActionBar e AppDialog, e evolui Button, Input, ChoiceGroup e
  ScreenScaffold de forma compatível.
- Estados normal, pressionado, foco, selecionado, desabilitado e loading são
  distinguíveis visualmente e por semântica assistiva.

### Jornada local

- `/offline-translation` permanece uma única rota pública e mostra uma etapa por
  vez: importação, organização, idiomas, validação e revisão/preparação.
- A etapa ativa é derivada exclusivamente do draft persistido e de suas
  confirmações/status; estado local pode controlar somente apresentação.
- Voltar retorna à etapa anterior permitida; sair preserva o draft. Editar algo
  retorna à primeira etapa cuja confirmação deixou de ser verdadeira.
- O stepper não permite pular pré-condições. A ação primária respeita teclado e
  safe area e não cobre o conteúdo.
- O indicador de etapas ocupa toda a largura disponível do conteúdo, respeitando
  o padding da página; a primeira e a última etapa alinham-se às bordas dos demais
  itens, com espaçamento uniforme entre os marcadores.
- O resumo final antecede Preparar projeto e comunica somente fatos locais; não
  há porcentagem, ETA, processamento, tradução ou reader simulados.

### Superfícies, responsividade e acessibilidade

- Launcher, auth, estado conectado, settings, leitores, profile, placeholders,
  modal e not-found adotam as primitivas compartilhadas sem liberar tabs futuras.
- Breakpoints: compact `<360`, regular `360..599`, medium `600..839` e expanded
  `>=840`; formulários limitam-se a 440, conteúdo comum a 600/720 conforme classe.
- Review usa duas colunas somente quando cada item mantém ao menos 148 pontos;
  paisagem baixa prioriza scroll e ações alcançáveis.
- Reader ocupa a viewport, recalcula layout na rotação e preserva página lógica.
- WCAG 2.2 AA, font scale de 200%, ordem assistiva, estados não dependentes de
  cor, redução de movimento, safe areas e alvos de 44 iOS/48 Android são
  obrigatórios.
- Todo texto permanece localizado em pt-BR, en-US e es-ES.

### Arquitetura e compatibilidade

- Primitivas compartilhadas permanecem agnósticas ao domínio; variantes de
  tradução, auth ou reader ficam em seus slices.
- A composição das cinco features permanece em `pages/offline-translation`; não
  surge widget exclusivo de uma rota nem import horizontal entre features.
- Rotas, HTTP, SQLite, filesystem, stores, validações, privacidade e máquinas de
  estado permanecem funcionalmente equivalentes.

## Casos de erro

- Loading, erro recuperável, sucesso, vazio, aviso e conteúdo parcial preservam
  layout, foco e ação possível sem depender somente de cor ou toast.
- Strings longas, fonte ampliada, teclado, safe areas e orientação não podem
  ocultar campos, erros ou a ação principal.
- Falha de imagem mantém fallback e retry; erro por página não invalida itens
  válidos.
- Fechar dialog/preview ou usar back restaura a navegação lógica sem mutação
  acidental.
- Motion reduzido remove decoração, nunca progresso funcional.

## Critérios de aceite

### AC-001 — Tokens normativos

Valores visuais e estados vêm exclusivamente de tokens públicos.

### AC-002 — Primitivas sem duplicação

Controles cobertos por `shared/ui` não são recriados em consumidores.

### AC-003 — Cinco etapas verdadeiras

A tradução apresenta exatamente cinco etapas e respeita pré-condições persistidas.

### AC-004 — Retomada determinística

Voltar, sair, reabrir e editar retomam a etapa correta sem perder estado verdadeiro.

### AC-005 — Estados interativos

Estados interativos são verificáveis visualmente e pela árvore de acessibilidade.

### AC-006 — Estados de conteúdo

Vazio, loading, erro, aviso, sucesso e conteúdo parcial usam padrões comuns.

### AC-007 — Cobertura de superfícies

Todas as superfícies atuais adotam o sistema evoluído.

### AC-008 — Sem funcionalidade fictícia

Nenhuma capacidade futura é exposta pelo redesign.

### AC-009 — Matriz responsiva

Layouts funcionam em 320×568, 390×844, 600×960 e 840×600.

### AC-010 — Escala tipográfica

Font scale de 200% não oculta conteúdo ou ações essenciais.

### AC-011 — Contraste e toque

Contraste e áreas mínimas de toque atendem aos contratos definidos.

### AC-012 — Continuidade do leitor

Rotação e abertura dos controles preservam a posição lógica do leitor.

### AC-013 — Localização

Toda copy possui paridade em pt-BR, en-US e es-ES.

### AC-014 — Compatibilidade funcional

Rotas, persistência, privacidade, requests e máquinas de estado permanecem equivalentes.

### AC-015 — Qualidade e FSD

`pnpm check` e `pnpm lint:fsd` passam sem violações.

### AC-016 — Evidência visual

A matriz visual cobre temas, contraste, larguras e estados sem exigir comparação pixel a pixel.

## Estratégia de evidência

| Critério | Teste/evidência esperada                               |
| -------- | ------------------------------------------------------ |
| AC-001   | testes de tokens e busca por cores literais            |
| AC-002   | testes RNTL das primitivas e auditoria de consumidores |
| AC-003   | RNTL da page para as cinco etapas                      |
| AC-004   | testes de transição, edição e restauração de draft     |
| AC-005   | RNTL de pressed/focus/selected/disabled/loading        |
| AC-006   | RNTL de StatusMessage e consumidores                   |
| AC-007   | testes existentes e auditoria visual dirigida          |
| AC-008   | testes de ausência de tabs/processamento futuro        |
| AC-009   | testes do resolvedor responsivo e matriz manual        |
| AC-010   | auditoria manual com font scale 200%                   |
| AC-011   | testes de métricas e auditoria de contraste/toque      |
| AC-012   | testes do reader em mudança de dimensões/controles     |
| AC-013   | teste de paridade i18n                                 |
| AC-014   | suítes de regressão existentes                         |
| AC-015   | `pnpm check` e `pnpm lint:fsd`                         |
| AC-016   | capturas e checklist em simulador/dispositivo          |

## Gate de implementação

- Estado: `open`
- Dependências: `MOB-FEAT-011..016`, implementadas ou `verification-pending`.
- Motivo: fundação visual e jornada local existem; a mudança não depende do gateway.

## Fora de escopo

- Novas rotas funcionais, tabs, catálogo, biblioteca, fórum ou perfil completo.
- Gateway, OCR, tradução, renderização, progresso remoto ou leitor local fictício.
- Alterações de banco, backend, endpoints, persistência ou regras de domínio.
- Nova biblioteca visual, família tipográfica ou navegação inferior.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-08-21
- Decisão: implementação autorizada explicitamente.
- Refinamento aprovado em 2026-08-30: Ruan solicitou explicitamente o indicador
  de etapas com 100% da largura útil da página e alinhado aos demais itens.
