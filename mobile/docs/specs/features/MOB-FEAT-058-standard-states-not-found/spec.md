---
id: MOB-FEAT-058
type: feature
title: Estados padrão e página não encontrada
status: verification-pending
implementation_gate: open
blocked_by: [MOB-FEAT-057]
created: 2026-11-08
updated: 2026-11-08
supersedes: []
superseded_by: []
---

# MOB-FEAT-058 — Estados padrão e página não encontrada

## Objetivo

Aplicar os estados padrão do kit mobile do Toonlira Design System (vazio, erro, carregando e não encontrada) nas
telas que hoje improvisam esses estados fora das áreas em execução, para que o usuário sempre veja o que aconteceu e
tenha a ação que resolve.

## Contexto e contratos relacionados

- Usa as primitivas da MOB-FEAT-057 (`StateView`, `LoadingBlock`) sem alterá-las.
- **Substitui parcialmente MOB-BASE-008/OBS-004** (not found com título e link para `/`): passa a valer o AC-001 e o
  AC-002 desta spec. Os demais `OBS-*` da MOB-BASE-008 não mudam.
- Refina a apresentação dos estados do leitor de capítulos da plataforma (`pages/reader`), preservando os contratos
  da MOB-FEAT-005 (retomada, progresso, erros e saída).
- Mantém 028/AC-006 e 029/AC-007 (padrões comuns de estado) e 029 (regras de voltar e cabeçalho).
- Referência visual: `NotFoundScreen.jsx` e `StateView`/`LoadingBlock` de `kit-parts.jsx` (kit, versão 42).

## Requisitos e regras

### Página não encontrada

- Usa `StateView kind="notfound"` em tela cheia: ilustração 404, eyebrow "Erro 404", título "Página não encontrada" e
  texto explicando que o endereço não existe ou foi removido.
- Ação primária "Voltar ao início", sempre presente, que leva a `/` substituindo a rota atual.
- Ação secundária "Voltar" somente quando houver tela anterior na pilha; sem histórico, ela não aparece.
- O cabeçalho mantém o botão de voltar só quando houver histórico, sem título repetido (o título está no conteúdo).
- O título do Stack continua traduzido.
- Nenhuma ação "Buscar obras" ou outra capacidade inexistente.

### Leitor de capítulos da plataforma (`pages/reader`)

- Carregando: `LoadingBlock` com o rótulo atual de carregamento do capítulo, no lugar do `EmptyState`.
- Erro ao carregar: `StateView kind="error"` com o título e o texto atuais e a ação "Tentar de novo". Quando houver
  pedido de retomada, a ação atual de abrir o capítulo pedido continua disponível como ação secundária.
- Capítulo sem páginas: `StateView kind="empty"` com o texto atual e a ação de sair do leitor.
- A tela de escolha de retomada passa a usar `AppText` nos papéis `title` e `body`, sem `Text` cru.
- Erros de progresso (hidratação e sincronização) e falha de imagem por página continuam como estão.

### Fora do alcance desta spec

- Estado "sem conexão": a primitiva existe, mas detectar conexão exige dependência nova (decisão D5). Sem aprovação,
  nenhuma tela mostra esse estado.
- Biblioteca, obra, fluxo de tradução e leitor local (`pages/offline-translation`): ficam com a MOB-FEAT-060 e a
  MOB-FEAT-056, porque estão na área da MOB-FEAT-055.
- Toast: não há consumidor aprovado.

### i18n, tema e acessibilidade

- Textos novos (eyebrow, texto e "Voltar" da 404) em `common` nos três idiomas; os demais reaproveitam chaves
  existentes.
- Cores, tamanhos e ilustrações vêm da 057; nenhuma cor ou número solto nas páginas.
- Erro anunciado como alerta; carregando e vazio, como status.

## Casos de erro

- Rota inválida com histórico vazio (deep link): só "Voltar ao início" aparece e leva a `/` sem loop.
- Falha ao carregar ilustração não remove título, texto nem ações.
- Repetir no leitor dispara uma única nova tentativa da query, como hoje.

## Critérios de aceite

### AC-001 — Página não encontrada padrão

Dada uma rota inexistente, quando ela abrir, então aparecem ilustração 404, eyebrow, título, texto e a ação "Voltar
ao início", que leva a `/` substituindo a rota, sem nenhuma ação para capacidade inexistente.

### AC-002 — Voltar só com histórico

Dada a página não encontrada, quando houver tela anterior, então "Voltar" aparece e retorna a ela; sem tela anterior,
nem a ação nem o botão de voltar do cabeçalho aparecem.

### AC-003 — Carregamento do leitor

Dado um capítulo da plataforma carregando, quando a tela renderizar, então mostra `LoadingBlock` anunciado como status
com o rótulo traduzido.

### AC-004 — Erro do leitor com ação

Dado um erro ao carregar o capítulo, quando a tela renderizar, então mostra o erro como alerta com "Tentar de novo"
e, se houver pedido de retomada, a ação de abrir o capítulo pedido; tentar de novo refaz a carga uma vez.

### AC-005 — Capítulo vazio e retomada

Dado um capítulo sem páginas, quando a tela renderizar, então mostra o estado vazio com a ação de sair; e a escolha de
retomada usa os papéis tipográficos do tema.

### AC-006 — Idiomas, tema e acessibilidade

Dados os três idiomas, claro, escuro, alto contraste, fonte a 200% e 320 pt de largura, quando os estados desta spec
renderizarem, então não há texto fixo, cor solta, corte ou ação inalcançável.

### AC-007 — Qualidade

Dadas as telas alteradas, quando os gates rodarem, então os testes de página, i18n e FSD passam e os arquivos estão
mapeados no `coverage.json`.

## Estratégia de evidência

| Critério | Teste/evidência esperada                                                            |
| -------- | ----------------------------------------------------------------------------------- |
| AC-001   | RNTL da `NotFoundPage` (conteúdo, navegação para `/` com replace)                   |
| AC-002   | RNTL com e sem histórico (mock de `canGoBack`)                                      |
| AC-003   | RNTL da `ReaderPage` em loading                                                     |
| AC-004   | RNTL da `ReaderPage` em erro, com e sem retomada; contagem de refetch               |
| AC-005   | RNTL da `ReaderPage` sem páginas e na escolha de retomada                           |
| AC-006   | Teste de chaves nos três locales; RNTL com `fontScale` 2; capturas no iOS Simulator |
| AC-007   | `pnpm lint:fsd`, `pnpm typecheck`, testes e `coverage.json`                         |

## Gate de implementação

- Estado: `open`
- Dependências: MOB-FEAT-057 (`verification-pending`, primitivas executadas).

## Fora de escopo

- Detecção de conexão e qualquer dependência nova.
- Telas da área da MOB-FEAT-055 (biblioteca, obra, fluxo de tradução, leitor local).
- Mudanças em rotas, retomada, progresso ou queries do leitor.

## Decisões registradas na aprovação

As propostas abaixo foram aceitas como redigidas.

- **D5 — estado "sem conexão".** Proposta: fora desta spec até aprovar `@react-native-community/netinfo`.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-11-08
- Evidência: resposta “Aprovo as cinco” à apresentação das Target Specs 058–062, aceitando as propostas dos pontos em aberto como redigidas.

Não criar `tasks.md` antes de status `approved` e aprovação preenchida.
