---
id: MOB-FEAT-057
type: feature
title: Fundação visual do kit mobile do Design System
status: in-progress
implementation_gate: open
blocked_by: []
created: 2026-11-08
updated: 2026-11-08
supersedes: []
superseded_by: []
---

# MOB-FEAT-057 — Fundação visual do kit mobile do Design System

## Objetivo

Dar ao app as medidas, cores semânticas e primitivas de `shared/ui` que o kit mobile do
Toonlira Design System padronizou e que ainda não existem, para que as specs de tela
seguintes (estados, Início, Conta, Configurações, Biblioteca/Obra, Leitor) apenas
componham peças prontas, sem valores soltos nem componentes duplicados.

Esta spec não muda nenhuma tela por si só: ela cria tokens e primitivas e ajusta a
aparência de controles compartilhados já existentes. Consumidores mudam de aparência
apenas onde já usam esses controles; fluxos, opções, persistência e textos não mudam.

## Contexto e contratos relacionados

- Referência visual (não normativa e não dependência de runtime): kit mobile do Toonlira
  Design System, `ui_kits/mobile/kit-parts.jsx`, `tokens/*.css` e os componentes
  `BottomSheet`, `ActionSheet` e `ConfirmSheet`, conforme a versão publicada 42.
  O kit é um protótipo web; esta spec fixa a intenção, não o código do kit.
- Os tokens de cor, os oito papéis tipográficos, os raios, o gutter, o `sectionGap` e as
  alturas 52/44 do kit já são idênticos aos de MOB-FEAT-002/011/028 e **não mudam**.
- Mantém intactos MOB-FEAT-002 (escalas, alto contraste, movimento), 011/AC-003 (alvo
  mínimo 44 pt iOS / 48 dp Android), 028/AC-010/011 (fonte a 200%, WCAG 2.2 AA),
  032 (segmentos empilham em tela compacta ou fonte ampliada), 038 (espessura de borda
  constante entre estados), 039 (rádio centralizado), 042 (contrato do SelectField e da
  sua folha) e 054 (painel do leitor).
- **Substitui parcialmente MOB-FEAT-034/AC-003** (faixa de cinco quadrados contíguos):
  passa a valer o AC-010 desta spec. Os demais AC da 034 continuam vigentes.
- Baselines afetados: nenhum `OBS-*` é substituído.

## Requisitos e regras

### Tokens de medida

O tema passa a expor, por `useTheme()`, os grupos abaixo. Valores fixos independem da
densidade, exceto onde indicado. Nenhuma primitiva desta spec usa número literal para
estas medidas.

| Grupo | Papéis e valores |
| ----- | ---------------- |
| Ícones | `sm` 16 (inline e chips), `md` 20 (linhas, botões, controles), `lg` 24 (cabeçalhos e ações principais) |
| Tile de ícone | `default` 40, `feature` 48 |
| Altura de linha de lista | `single` 56, `double` 64 |
| Altura de controle visual | `compact` 40, `default` 44, `comfortable` 52 (os dois últimos são `compactControlHeight` e `controlHeight` existentes) |
| Chips e pílulas | `action` 36, `value` 28, `count` 24 |
| Ritmo | `itemGap` 12 (compacta 8), `groupGap` = `lg`, `cardPadding` = `md` |
| Barra de acento | 4 × 16, raio `pill` |
| Sombras | `card` (y 8, opacidade 0,12, raio 18) e `sheet` (y −8, opacidade 0,28, raio 22), sempre com `shadowColor` vindo de token |
| Movimento | `fast` 140, `base` 180, `sheet` 240, `pulse` 700 ms; zerados ou estáticos quando o movimento reduzido efetivo estiver ativo |

- **Altura visual × área de toque:** um controle pode ter altura visual 40, mas sua área
  de toque nunca fica abaixo de `minimumTouchTarget` (44 iOS / 48 Android). A diferença é
  coberta por área de toque estendida, sem sobrepor a área de controles vizinhos.

### Cores semânticas suaves

- `dangerSoft`, `successSoft` e `warnSoft` existem nas quatro paletas (claro, escuro e as
  duas de alto contraste).
- Claro/escuro: `danger`, `success` e `warn` com opacidade 0,06 (claro) e 0,14 (escuro).
  O kit usa 0,10 no claro, mas esse valor deixa o texto de perigo e de sucesso abaixo do AA
  (ver decisão D12). Nas paletas de alto contraste, a superfície suave é opaca e a borda
  mantém a cor sólida do tom, preservando contraste AA do texto sobre ela.
- `StatusMessage` passa a usar a superfície suave do seu tom (info e loading continuam em
  `surfaceSelected`), com a mesma borda e o mesmo layout atuais.

### Folhas

- **`BottomSheet`** (nova, em `shared/ui`): entra de baixo, largura total, cantos
  superiores com raio `feature`, alça, scrim `scrim`, sombra `sheet` e safe area inferior.
  Cabeçalho opcional com título (papel `section`), descrição (papel `caption`, tom muted)
  e botão de fechar acessível; corpo com ritmo vertical `lg` entre blocos; rodapé
  opcional separado por divisória `separator`. A altura máxima é parametrizável (padrão
  85% da altura útil) com rolagem interna. Fecha por botão, scrim e voltar do Android;
  o scrim nunca é o único meio de fechar. Abre sem animação com movimento reduzido.
- `SelectField` passa a montar sua folha sobre `BottomSheet`, **preservando integralmente
  MOB-FEAT-042** (82%, opções de 56 dp, padding `xl`, área de 28 dp, cancelamento sem
  `onChange`).
- **`ActionSheet`** (nova): título e subtítulo opcionais, grupo de ações normais e grupo
  separado de ações destrutivas, linhas com altura de controle `comfortable` e ícone `md`,
  e ação de cancelar. Tocar numa ação fecha a folha antes de executá-la.
- **`ConfirmSheet`** (nova): ícone de tom destrutivo em círculo `dangerSoft`, título,
  descrição, lista opcional "o que será removido" e dois botões separados (cancelar e
  confirmar destrutivo), com o destrutivo fora da posição do cancelar.
- Rótulos de fechar e cancelar vêm do consumidor ou de chaves i18n de `common` nos três
  idiomas; nenhuma primitiva tem texto fixo.
- O painel do leitor (`ReaderPanel`) **não** migra nesta spec.

### Estados

- **`StateView`** (nova): `kind` `empty` | `error` | `offline` | `notfound`, em modo tela
  cheia ou `inline`, com eyebrow opcional, título, texto e ações.
  - Ilustração por `kind`: `pensando` (vazio), `triste` (erro), `duvida` (sem conexão),
    `404` (não encontrada); substituível pelo consumidor.
  - Tela cheia: título no papel `title`, texto no papel `body` tom muted, conteúdo centrado
    e com largura máxima legível. Inline: título `label`, texto `caption`, superfície com
    raio `card` — vazio com borda tracejada `borderStrong`, erro com `dangerSoft` e borda
    `danger`, demais com borda `separator`.
  - `error` exige uma ação de repetir; `notfound` exige uma ação de voltar ao início. A
    exigência é imposta pela API (tipos), não só por convenção.
  - Semântica: `alert` em `error`, `status` nos demais.
  - Ilustrações são decorativas para leitores de tela e somem quando a altura útil é baixa
    ou a fonte está ampliada, sem esconder título nem ações.
- `EmptyState` continua exportado com o mesmo comportamento, para não alterar consumidores.
- **`LoadingBlock`** (nova): indicador de atividade com rótulo, em tela cheia ou inline,
  anunciado como status. Usado quando o formato do conteúdo é desconhecido.
- **`ListSkeleton`** (nova): cartão com N linhas de altura `double` (tile `default` +
  duas barras), composto do `Skeleton` existente e com rótulo acessível próprio.
- A detecção de conexão não faz parte desta spec; `offline` é apenas a apresentação.

### Seções e ações

- **`SectionHeader`** (nova): título no papel `section`, contagem opcional em pílula
  `count` (superfície muted, borda `separator`, texto `caption` em negrito, tom muted) e
  ações à direita, com altura mínima igual ao alvo de toque.
- **`SectionAction`** (nova): chip de altura `action` (36) e raio `pill`, ícone `sm`,
  dentro de área de toque mínima; tons `neutral` (superfície muted, texto muted, borda
  `separator`), `accent` (`accentSoft`, `accentText`) e `strong` (`accent`, `onAccent`).
- **`TextAction`** (nova): ação textual no papel `button`, ícone `sm` opcional, tons
  `accent` e `muted`, área de toque mínima sem deslocar o alinhamento do texto.

### Controles existentes

- **`SegmentedControl`:** um único contêiner (superfície muted, borda `separator`, raio
  `control`, padding `xs`, gap `xs`); segmentos com raio `sm` e altura visual `compact`;
  ativo em `accent`/`onAccent`, inativos transparentes em tom muted. A borda dos segmentos
  mantém espessura constante e só muda de cor (038). Regras de empilhamento da 032 e a
  semântica de rádio são mantidas.
- **`RangeSlider`:** pílula de valor com altura `value` em `accentSoft`/`accentText` e
  números tabulares; trilho de 6 em superfície muted com borda `separator` e preenchimento
  `accent`; polegar de 24 preenchido em `accent`, com borda `surface` e anel
  `accentBorder`; rótulos de mínimo e máximo no papel `caption`. Todo o contrato de
  interação da 034/AC-004 é mantido.
- **`SwatchPicker`:** ver AC-010.
- **`ChoiceGroup` empilhado:** opções com altura mínima `single` (56), padding vertical
  `itemGap` e horizontal `md`, raio `control`, rádio de 22 centralizado na opção (039),
  descrição opcional por opção no papel `caption`; selecionada com `surfaceSelected`,
  borda `accentBorder` de espessura constante e título em `accentText`.
- **`ListRow`:** ganha tile de ícone opcional (tamanho `default`, raio `control`,
  `accentSoft`, ou `dangerSoft` no tom danger) com ícone `md`; altura mínima `single` ou
  `double` conforme haja descrição; status com ponto de 6 e texto `caption` nos tons
  existentes. Variantes e props atuais continuam válidas.

### Assets

- As ilustrações `triste`, `duvida` e `404` entram em `assets/images` com nome no padrão
  `mascot-*`, a partir dos originais do Design System, otimizadas para mobile (resolução
  adequada a até 200 pt de exibição em 3×; cada arquivo deve ficar ordens de grandeza
  abaixo dos originais de 1,4–2,7 MB). `zangada` não entra: nenhum estado a usa.

### Acessibilidade, i18n e FSD

- Todas as primitivas novas ficam em `src/shared/ui` e são exportadas pelo barrel; nenhum
  import de camadas superiores.
- Labels, papéis e estados acessíveis em todos os controles; foco visível com borda
  `focus`; nada comunicado só por cor.
- Fonte do sistema a 200%, densidade compacta, telas de 320 pt de largura e alto contraste
  não cortam nem sobrepõem texto, ícone ou ação.
- Todo texto interno vem de i18n com chaves em `pt-BR`, `en-US` e `es-ES`.
- Nenhuma dependência nova.

## Casos de erro

- Folha aberta com conteúdo vazio abre e fecha sem falhar; altura nunca fica negativa nem
  passa da área segura.
- Fechar por qualquer meio não dispara a ação da folha (`ActionSheet`, `ConfirmSheet`) nem
  `onChange` (`SelectField`).
- `ConfirmSheet` não confirma com toque no scrim nem com voltar do Android.
- Ilustração que falha ao carregar não remove título, texto nem ações do `StateView`.
- Valores fora da faixa no `RangeSlider` continuam presos aos limites (034).

## Critérios de aceite

### AC-001 — Tokens de medida

Dado qualquer modo de densidade, quando o tema for lido por `useTheme()`, então ícones,
tiles, alturas de linha, alturas de controle, chips, ritmo, barra de acento, sombras e
durações terão os valores desta spec, e as primitivas desta spec não usarão literais para
essas medidas.

### AC-002 — Cores suaves de status

Dadas as quatro paletas, quando `dangerSoft`, `successSoft` e `warnSoft` forem resolvidos,
então existirão em todas elas, e `StatusMessage` de tom danger, success e warning usará a
superfície suave do próprio tom com texto em contraste AA.

### AC-003 — Folha genérica

Dado um `BottomSheet` aberto, quando for fechado por botão, scrim ou voltar do Android,
então fechará com cabeçalho, ritmo, rodapé, raio, safe area e limite de altura desta spec;
e `SelectField`, montado sobre ele, continuará cumprindo todos os critérios da 042.

### AC-004 — Ações e confirmação em folha

Dado um `ActionSheet` ou `ConfirmSheet`, quando o usuário escolher uma ação, cancelar ou
fechar, então só a ação escolhida executa, depois do fechamento; ações destrutivas ficam
em grupo ou botão separado; e cancelar, scrim e voltar nunca confirmam.

### AC-005 — Estados padrão

Dado um `StateView` de cada `kind`, em tela cheia e inline, quando renderizado, então
mostrará ilustração, superfície, tipografia e semântica desta spec; `error` não compila
sem ação de repetir e `notfound` sem ação de voltar ao início; e `EmptyState` continua
compatível com seus consumidores.

### AC-006 — Carregamento

Dado conteúdo de formato desconhecido ou de lista, quando estiver carregando, então
`LoadingBlock` ou `ListSkeleton` serão anunciados como status com rótulo, e o pulso do
esqueleto ficará estático com movimento reduzido.

### AC-007 — Cabeçalho de seção e ações

Dado um `SectionHeader` com contagem e ações, quando renderizado e acionado, então a
contagem aparece em pílula, cada `SectionAction` tem chip de 36 com área de toque mínima e
o tom pedido, e `TextAction` mantém o alinhamento do texto com área de toque mínima.

### AC-008 — Segmentado unificado

Dado um `SegmentedControl`, quando uma opção for selecionada, pressionada ou focada, então
o contêiner é único, o ativo fica em acento, a geometria não muda entre estados, a área de
toque de cada segmento é pelo menos o alvo mínimo da plataforma e o empilhamento da 032
continua valendo.

### AC-009 — Controle deslizante

Dado um `RangeSlider`, quando arrastado, tocado ou ajustado por acessibilidade, então
pílula de valor, trilho, polegar e rótulos de mínimo e máximo seguem esta spec, e o
comportamento da 034/AC-004 permanece.

### AC-010 — Amostras de cor de mesma largura

Dado um `SwatchPicker` de N opções, quando renderizado em qualquer largura, então as
amostras ficam separadas por gap `sm`, com a mesma largura calculada numericamente a
partir da medição do grupo, altura 48, raio `control` e borda de espessura constante
(`borderStrong`, ou `accent` na selecionada); a selecionada mostra check em círculo de
acento e o rótulo de cada opção aparece abaixo dela. Substitui a 034/AC-003.

### AC-011 — Escolhas empilhadas

Dado um `ChoiceGroup` empilhado com descrições, quando uma opção for selecionada, então
cada opção tem altura mínima de 56, rádio de 22 centralizado, descrição legível e
seleção por fundo, borda e estado assistivo, sem mudar a geometria (038/039).

### AC-012 — Linha de lista com tile

Dado um `ListRow` com tile, descrição e status, quando renderizado, então o tile tem 40
com ícone 20, a linha tem altura mínima de 56 sem descrição e 64 com descrição, e os
usos atuais de `ListRow` sem as props novas não mudam de aparência nem de comportamento.

### AC-013 — Ilustrações de estado

Dado o bundle do app, quando os estados forem renderizados, então `pensando`, `triste`,
`duvida` e `404` existem como assets otimizados e nenhum arquivo novo ultrapassa o limite
de tamanho registrado na evidência.

### AC-014 — Acessibilidade e responsividade

Dadas fonte a 200%, densidade compacta, 320 pt de largura, alto contraste e movimento
reduzido, quando cada primitiva for renderizada, então texto, ícones e ações permanecem
visíveis e operáveis, com alvos mínimos, foco visível e anúncios corretos.

### AC-015 — Compatibilidade e qualidade

Dados os consumidores atuais, quando a fundação for integrada, então opções, callbacks,
persistência, i18n e navegação não mudam; primitivas novas estão no barrel de
`shared/ui`, com chaves nos três idiomas, entradas individuais em `coverage.json` e
testes; `pnpm lint:fsd`, `pnpm typecheck` e os testes passam.

## Estratégia de evidência

| Critério | Teste/evidência esperada |
| -------- | ------------------------ |
| AC-001   | Teste unitário do tema por densidade; busca por literais nas primitivas novas |
| AC-002   | Teste unitário das quatro paletas e cálculo de contraste; teste de `StatusMessage` por tom |
| AC-003   | RNTL do `BottomSheet` (fechar por botão, scrim e back; altura limite); testes existentes da 042 verdes |
| AC-004   | RNTL de `ActionSheet` e `ConfirmSheet`: ordem fechar→executar, cancelar sem efeito |
| AC-005   | RNTL por `kind` e modo; teste de tipos (`@ts-expect-error`) para ações obrigatórias; testes de `EmptyState` verdes |
| AC-006   | RNTL de anúncio e rótulo; teste com movimento reduzido |
| AC-007   | RNTL de contagem, tons e área de toque |
| AC-008   | RNTL de seleção, geometria estável, área de toque e empilhamento |
| AC-009   | Testes existentes da 034 verdes e RNTL da apresentação |
| AC-010   | RNTL com largura medida simulada; captura iOS claro/escuro |
| AC-011   | RNTL de seleção, descrição e geometria |
| AC-012   | RNTL das alturas e regressão dos consumidores de `ListRow` |
| AC-013   | Verificação de presença e tamanho dos arquivos registrada em evidência |
| AC-014   | RNTL com `fontScale` 2 e largura 320; capturas no iOS Simulator; validação Android física pendente se não executada |
| AC-015   | `pnpm check` (ver nota do gate), `pnpm lint:fsd`, revisão do barrel e do `coverage.json` |

## Gate de implementação

- Estado: `open`
- Dependências: nenhuma. A spec só cria tokens e primitivas e ajusta controles de
  `shared/ui`; não depende de capacidade funcional em execução.
- Nota: em 2026-11-08, `pnpm specs:check` falha por checksums de review divergentes em
  MOB-FEAT-017, 018, 019, 021, 025, 026, 027, 049, 050, 051, 052, 053 e 054, anteriores a
  esta spec. Enquanto isso não for re-revisado por uma pessoa, `pnpm check` não fica
  verde; a execução desta spec deve registrar essa falha separadamente das suas próprias.

## Fora de escopo

- Qualquer mudança de layout de tela, navegação, rota, texto de produto ou opção de
  configuração (ficam nas specs de pacote seguintes).
- Migração do `ReaderPanel` e qualquer arquivo de `widgets/content-reader` (área da 055).
- Toast e seu provider na app layer; detecção de conexão e dependências como NetInfo.
- Capa com iniciais (`CoverArt`), cartões de obra e capítulo.
- Substituir `Alert` nos consumidores (as primitivas existem; a troca é de cada tela).
- Cores fixas do leitor do protótipo; novos temas, fontes ou animações decorativas.

## Decisões registradas na aprovação

- **D4 — altura visual 40:** aceita a proposta desta spec — altura visual 40 com área de
  toque ≥ 44 pt iOS / 48 dp Android.
- **D9 — ilustrações:** aceita a origem `~/Toonlira-Design-System/project/assets/illustrations/`,
  com otimização antes de entrar no repositório.
- **D12 — opacidade das superfícies suaves no tema claro (2026-11-08, durante a execução):**
  com 0,10 o texto ficava em 4,45:1 (perigo) e 4,27:1 (sucesso). Ruan Moraes escolheu
  reduzir para 0,06 no tema claro, mantendo o AA (4,71 / 4,51 / 5,36) e sem mudar as cores
  de texto.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-11-08
- Evidência: resposta “Aprovo a 057” à apresentação desta Target Spec, aceitando as propostas D4 e D9 como redigidas.

Não criar `tasks.md` antes de status `approved` e aprovação preenchida.
