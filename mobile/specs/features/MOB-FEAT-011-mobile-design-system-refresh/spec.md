---
id: MOB-FEAT-011
type: feature
title: Sistema visual editorial premium
status: implemented
implementation_gate: open
blocked_by: [MOB-FEAT-002, MOB-FEAT-003, MOB-FEAT-005, MOB-FEAT-008, MOB-FEAT-010]
created: 2026-08-09
updated: 2026-08-09
supersedes: [MOB-BASE-007]
superseded_by: []
---

# MOB-FEAT-011 — Sistema visual editorial premium

## Objetivo

Padronizar todas as superfícies atualmente implementadas do Manga Reader Mobile
com uma identidade editorial premium, simples e acessível, usando o amarelo da
marca com moderação, neutros quentes, hierarquia tipográfica clara, controles
arredondados e componentes compartilhados consistentes nos temas claro e escuro.

## Contexto e contratos relacionados

- Substitui, quando implementada, a apresentação observada em
  `MOB-BASE-007/OBS-001` a `MOB-BASE-007/OBS-007`, sem remover as capacidades
  funcionais desses componentes.
- Altera a apresentação, mas preserva os fluxos descritos em
  `MOB-BASE-004/OBS-001` a `MOB-BASE-004/OBS-007` e as superfícies descritas em
  `MOB-BASE-008/OBS-001` a `MOB-BASE-008/OBS-005`.
- Preserva integralmente os contratos de tema, escala, densidade, movimento e
  contraste de `MOB-FEAT-002`.
- Preserva i18n e formatação regional de `MOB-FEAT-003`, o leitor de
  `MOB-FEAT-005`, a navegação de configurações de `MOB-FEAT-008` e o launcher de
  `MOB-FEAT-010`.
- Segue `MOB-DEC-001` e `MOB-DEC-002`: nenhuma implementação começa antes da
  aprovação humana, e cada critério recebe evidência proporcional ao risco.

## Requisitos e regras

### Identidade e tokens

- A paleta clara usa fundo `#F6F4EE`, superfície principal `#FFFEFA`, texto
  principal `#1B1A17` e accent `#DCD629`; a paleta escura usa fundo `#11110F`,
  superfície principal `#1B1B18`, texto principal `#F7F4EA` e accent `#E6E037`.
- Cores secundárias, bordas, estados e overlays são tokens semânticos derivados
  dessas bases. Nenhum componente de produto recebe cor literal nova.
- As paletas de alto contraste normativas de `MOB-FEAT-002` permanecem
  inalteradas.
- Raios formam a escala `8`, `12`, `16`, `24` e `999`: controles usam 12, cards
  usam 16, destaques usam 24 e badges circulares usam 999.
- O gutter de tela é 20 em densidade confortável e 16 em compacta; o gap de
  seção é 32 e 24, respectivamente. Controles padrão têm 52 pontos e nunca ficam
  abaixo do alvo mínimo da plataforma.

### Tipografia e hierarquia

- Os tamanhos base continuam sendo os papéis H1, H2, H3, H4, corpo, pequeno e
  mínimo definidos em `MOB-FEAT-002`, compondo com a escala nativa.
- Cada papel tipográfico também define família, peso, line-height e
  letter-spacing. Texto de leitura normal não usa espaçamento artificial entre
  letras.
- Caixa alta e tracking ampliado ficam restritos a eyebrows e badges curtos;
  botões, labels de formulário e navegação usam capitalização natural do idioma.
- Títulos, descrições, labels, helpers, erros, estados e ações usam componentes
  tipográficos semânticos em vez de combinações visuais ad hoc.

### Primitivas compartilhadas

- `shared/ui` expõe texto semântico, botão, input, card, seção, linha de lista,
  grupo de opções, linha com switch, container de página e scaffold de tela.
- `Button` suporta tamanhos, ícone opcional, largura, loading, disabled e tons
  necessários às superfícies existentes, com feedback de toque consistente.
- `Input` suporta label, helper, erro, ícone inicial, ação final, foco,
  multiline, entrada segura e as propriedades nativas já usadas nos formulários.
- Card, seção e linha de lista diferenciam agrupamento, navegação e elevação sem
  aplicar borda ou sombra redundante a todo conteúdo.
- Os wrappers visuais exclusivos de autenticação que duplicam Button e Input são
  removidos após a migração; componentes específicos do fluxo, como cabeçalho,
  checkbox, social e medidor de força, permanecem na feature de autenticação.

### Aplicação global

- A padronização cobre autenticação, launcher, estado conectado, configurações e
  suas subpáginas, controles e estados do leitor, placeholders, perfil, modal,
  not-found e tabs já existentes.
- Mascotes existentes podem ilustrar estados vazios, sucesso ou orientação
  quando isso reforçar o significado; não são usados como decoração repetitiva.
- Rotas, requests, stores, persistência, validações, permissões, sincronização e
  regras de acesso permanecem funcionalmente equivalentes.
- Nenhuma dependência visual, rota, funcionalidade de catálogo ou superfície
  fictícia é adicionada.
- Todo texto visível continua vindo de i18n em `pt-BR`, `en-US` e `es-ES`.

### Arquitetura

- Tokens, escalas e primitivas agnósticas permanecem em `shared/theme` e
  `shared/ui`, sem importar estado de negócio ou camadas superiores.
- Migração segue `shared → entities → features → widgets → pages → app`; cada
  slice mantém API pública por `index.ts` e não cria import horizontal proibido.
- Pages apenas compõem primitivas, widgets e features; variantes de negócio não
  são adicionadas ao kit compartilhado.

## Casos de erro

- Labels traduzidas longas, fonte confortável e font scale do sistema devem
  reflowar sem corte, sobreposição ou ação inacessível.
- Teclado e safe areas não podem ocultar campo focado, erro ou ação principal;
  formulários continuam roláveis quando necessário.
- Loading, disabled, foco, erro, sucesso, sincronização pendente e retry devem
  permanecer distinguíveis por semântica e forma, não somente por cor.
- Falha de imagem de mascote ou avatar mantém fallback textual/estrutural e não
  impede a ação principal.
- Movimento reduzido ou animações desabilitadas removem apenas decoração; o
  feedback funcional de progresso permanece disponível.

## Critérios de aceite

### AC-001 — Paleta editorial semântica

Dado cada tema normal, quando qualquer superfície implementada for renderizada,
então cores de fundo, superfície, texto, borda, accent e estados virão dos tokens
editoriais definidos nesta spec, sem cor literal nova no componente.

### AC-002 — Alto contraste preservado

Dado alto contraste efetivo nos temas claro ou escuro, quando o redesign for
aplicado, então a paleta normativa de `MOB-FEAT-002` será usada sem regressão e
estados interativos continuarão distinguíveis.

### AC-003 — Métricas consistentes e responsivas

Dada densidade confortável ou compacta, quando telas, cards e controles forem
renderizados, então gutters, gaps, alturas e raios usarão as escalas desta spec,
preservando safe areas e o alvo mínimo de 44 pontos no iOS e 48 dp no Android.

### AC-004 — Tipografia semântica global

Dada qualquer escala tipográfica suportada, quando textos forem renderizados em
qualquer rota, então tamanho, família, peso, line-height e tracking virão do papel
semântico correspondente, com caixa alta restrita a eyebrows e badges curtos.

### AC-005 — Botão unificado

Dadas as ações existentes, quando Button for usado em estado normal, pressionado,
loading ou disabled, então tamanho, tom, ícone, texto e feedback serão consistentes
e os wrappers duplicados de botão da autenticação não serão necessários.

### AC-006 — Campo unificado

Dado um campo de autenticação ou formulário compartilhado, quando estiver vazio,
focado, preenchido, inválido, desabilitado, seguro ou multiline, então label,
helper, ícones, borda, mensagem e semântica assistiva serão consistentes e o
wrapper duplicado da autenticação não será necessário.

### AC-007 — Controles de seleção consistentes

Dadas opções, switches e linhas navegáveis de configurações ou leitor, quando
forem renderizados e acionados, então usarão primitivas compartilhadas com estado
selecionado, descrição, foco, habilitação e anúncio assistivo coerentes.

### AC-008 — Migração de todas as superfícies existentes

Dadas todas as rotas e estados implementados no início desta feature, quando a
migração terminar, então autenticação, launcher, estado conectado, configurações,
leitor, placeholders, perfil, modal, not-found e tabs usarão o novo sistema sem
alterar sua disponibilidade ou comportamento.

### AC-009 — Comportamento e localização preservados

Dado qualquer fluxo existente em `pt-BR`, `en-US` ou `es-ES`, quando o redesign
for aplicado, então navegação, validação, requests, stores, persistência e textos
continuarão equivalentes ao contrato anterior.

### AC-010 — Reflow e contraste acessíveis

Dada fonte confortável combinada com escala ampliada do sistema e strings longas,
quando qualquer tela for usada, então conteúdo essencial permanecerá legível,
rolável e alcançável, e texto/controles atenderão contraste WCAG AA aplicável.

### AC-011 — Fronteiras FSD e API pública

Dada a implementação concluída, quando typecheck e lint FSD forem executados,
então não haverá import invertido, horizontal proibido ou deep import externo, e
os novos contratos serão expostos somente pelos barrels públicos.

### AC-012 — Evidência visual dirigida

Dado o baseline histórico verificável em código e diff, quando a matriz manual for
auditada, então haverá capturas finais para login, cadastro, recuperação, launcher,
estado conectado, índice/configurações, temas claro/escuro, fonte confortável,
densidade compacta e alto contraste, além do checklist manual executado. O registro
deve declarar explicitamente que capturas originais anteriores não existem; o diff
e a fonte histórica substituem somente essa parte impossível de reconstruir.

## Estratégia de evidência

| Critério        | Teste/evidência esperada                                                                                      |
| --------------- | ------------------------------------------------------------------------------------------------------------- |
| AC-001 a AC-004 | Testes unitários de tokens, tipografia, densidade, contraste e ThemeProvider                                  |
| AC-005, AC-006  | React Native Testing Library cobrindo variantes, estados, foco, erro, loading, disabled, ícones e alvo mínimo |
| AC-007          | Testes de interação e semântica assistiva dos controles compartilhados e consumidores                         |
| AC-008, AC-009  | Testes existentes das páginas/features, testes de integração afetados e revisão dirigida de equivalência      |
| AC-010          | Testes de reflow/tamanhos mínimos e auditoria manual com strings longas e font scale ampliado                 |
| AC-011          | `pnpm typecheck`, `pnpm lint:fsd`, revisão de barrels e `pnpm specs:check`                                    |
| AC-012          | Fonte/diff histórico, capturas finais, checklist manual e declaração de ausência das capturas originais       |

Snapshots pixel a pixel não são evidência normativa; a fidelidade visual é
validada por tokens/estados e pela auditoria manual dirigida.

## Gate de implementação

- Estado: `open`
- Dependências: `MOB-FEAT-002`, `MOB-FEAT-003`, `MOB-FEAT-005`, `MOB-FEAT-008`, `MOB-FEAT-010`
- Motivo: todas as fundações e superfícies afetadas estão implementadas; não há
  capacidade funcional ausente a bloquear o redesign.

## Fora de escopo

- Catálogo, busca, detalhes de obra, biblioteca real, fórum completo, perfil
  completo, notificações ou cache offline de capítulos.
- Alterações de backend, endpoints, persistência ou regras de negócio.
- Novos idiomas, nova família tipográfica, novos mascotes, animações decorativas
  ou dependência de UI/visualização adicional.
- Storybook, snapshots pixel a pixel ou uma rota pública exclusiva de catálogo
  visual.

## Aprovação humana

- Aprovador: Ruan-Moraes
- Data: 2026-08-09

- Emenda AC-012 aprovada explicitamente pelo responsável em 2026-08-09, sem fabricação de capturas anteriores.

Não criar `tasks.md` antes de status `approved` e aprovação preenchida.
