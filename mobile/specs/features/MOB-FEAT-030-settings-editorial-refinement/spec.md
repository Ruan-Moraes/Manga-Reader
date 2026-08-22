---
id: MOB-FEAT-030
type: feature
title: Refinamento editorial da tela de configurações
status: implemented
implementation_gate: open
blocked_by: [MOB-FEAT-029]
created: 2026-08-22
updated: 2026-08-22
supersedes: []
superseded_by: []
---

# MOB-FEAT-030 — Refinamento editorial da tela de configurações

## Objetivo

Aproximar a tela inicial de configurações da hierarquia editorial de
`design/manga-translation-mobile.html`, preservando as sete capacidades reais,
as subtelas, o controle de acesso e todos os contratos funcionais existentes.

## Contexto e contratos relacionados

- Refina `MOB-FEAT-008`, `MOB-FEAT-011`, `MOB-FEAT-028` e `MOB-FEAT-029` sem
  substituir seus contratos de navegação, tema ou componentes compartilhados.
- Preserva o manifesto `SETTINGS_SECTIONS`, stores, requests, persistência,
  controle de acesso e rotas das sete capacidades existentes.
- A implementação segue `shared → features → widgets → pages`, sem dependência
  horizontal entre features nem componente local duplicado.
- A solicitação explícita de execução em 2026-08-22 constitui aprovação humana
  do refinamento visual e das correções de acessibilidade relacionadas.

## Direção visual

- Preservar o retorno e o título compacto de navegação no topo; em escala nativa
  ampliada, omitir o título redundante e manter o heading editorial para evitar
  quebra artificial ou disputa com a ação de retorno.
- Adotar uma introdução editorial com eyebrow, título “Do seu jeito.” e descrição.
- Transformar cada categoria em um card com cabeçalho interno, eyebrow e contexto.
- Usar ícones semânticos em superfícies de accent suave para facilitar varredura.
- Mover o status para uma linha de apoio discreta, evitando competir com o título.
- Manter chevron, estados pressionados, tema, contraste e alvos mínimos existentes.
- Não copiar controles fictícios do HTML nem concentrar todas as preferências na
  página inicial; as subtelas continuam sendo a arquitetura de interação.

## Requisitos e regras

- Grupos Aplicativo, Leitura, Dispositivo e Conta mantêm ordem e destinos atuais.
- Cada grupo possui descrição localizada em pt-BR, en-US e es-ES.
- Cada uma das sete opções possui ícone semanticamente coerente.
- Login necessário continua visível e assistivamente anunciado nas opções privadas.
- Status local, pendente, syncing, synced e error permanece verdadeiro e legível.
- Títulos e descrições não colidem com status, ícone ou chevron em 320 px e font
  scale de 200%.
- `AppText` compõe a escala nativa em fonte e altura de linha uma única vez, sem
  recorte vertical ou limitação artificial da preferência do sistema.
- Nenhuma mudança é feita em stores, requests, persistência, acesso ou domínio.

## Casos de erro

- Sessão anônima mantém as opções privadas visíveis e encaminha ao login com o
  retorno correto, anunciando `Login necessário` como hint e status.
- Status de erro, pendente ou sincronizando usa texto e indicador sem depender
  somente de cor nem comprimir título e descrição.
- Textos longos e escala nativa de 200% crescem verticalmente sem recorte; o
  título compacto redundante pode ser omitido, preservando back e heading.
- Grupos vazios não são fabricados: a composição continua derivada do manifesto
  real e não expõe preferências futuras.

## Critérios de aceite

### AC-001 — Hierarquia editorial

A tela apresenta header compacto, introdução editorial e cards agrupados com
cabeçalhos internos, sem repetir “Configurações” como título display.

### AC-002 — Linhas escaneáveis

As sete opções usam ícone, título, descrição, status de apoio e chevron sem
colisão ou truncamento essencial.

### AC-003 — Contratos preservados

Ordem, rotas, fallbacks, controle de acesso e estados de sincronização permanecem
equivalentes a MOB-FEAT-008.

### AC-004 — Temas e responsividade

Claro, escuro, 320×568, 390×844, paisagem e font scale 200% preservam conteúdo e
ações alcançáveis.

### AC-005 — Acessibilidade

Grupos possuem headings, ações mantêm labels/hints corretos, estados não dependem
somente de cor e alvos atendem o mínimo da plataforma.

### AC-006 — Qualidade

Testes do widget e da página cobrem a nova composição e `pnpm check` passa.

## Estratégia de evidência

| Critério | Evidência esperada                                  |
| -------- | --------------------------------------------------- |
| AC-001   | teste da page e auditoria visual da composição      |
| AC-002   | teste do widget com sete linhas, ícones e status    |
| AC-003   | integração do manifesto, controle de acesso e rotas |
| AC-004   | matriz nativa de temas, retrato, paisagem e 200%    |
| AC-005   | árvore assistiva, labels, hints, headings e alvos   |
| AC-006   | gates completos, review e drift audit               |

## Gate de implementação

- Estado: `open`.
- Dependência: `MOB-FEAT-029` está implementada.
- Escopo autorizado: refinamento visual, responsividade e acessibilidade da tela
  inicial de configurações e primitivas compartilhadas estritamente necessárias.

## Fora de escopo

- Adicionar preferências, tabs ou controles demonstrativos da referência.
- Alterar subtelas de aparência, idioma, leitor, dados, privacidade ou sobre.
- Alterar autenticação, API, persistência ou regras de sincronização.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-08-22
- Decisão: refinamento e implementação solicitados explicitamente.
