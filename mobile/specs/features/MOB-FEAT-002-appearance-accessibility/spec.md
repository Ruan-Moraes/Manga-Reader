---
id: MOB-FEAT-002
type: feature
title: Aparência e acessibilidade globais
status: implemented
created: 2026-08-08
updated: 2026-08-08
implementation_gate: open
blocked_by: [MOB-FEAT-001]
supersedes: [MOB-BASE-002]
superseded_by: []
---

# MOB-FEAT-002 — Aparência e acessibilidade globais

## Objetivo

Permitir que a pessoa configure tema, escala tipográfica, densidade, animações,
movimento reduzido e alto contraste no aplicativo mobile, com efeito global,
imediato, acessível e consistente com a identidade visual da versão web.

Esta Target Spec adapta o contrato web ao contexto nativo. Ela não promove as
limitações técnicas observadas na web — aplicação parcial de fonte/densidade e
autoplay que ignora a opção manual de movimento — a comportamento desejado.

## Contexto e contratos relacionados

- Depende de `MOB-FEAT-001`, que define o contrato canônico de preferências,
  hidratação, persistência local, sincronização autenticada e estados de erro.
- Afeta `MOB-BASE-002/OBS-001` a `MOB-BASE-002/OBS-004`: o mecanismo atual de
  tema passa a consumir o contrato completo de aparência e acessibilidade.
- Preserva `MOB-BASE-003`: textos e rótulos devem existir em `pt-BR`, `en-US` e
  `es-ES`, sem alterar o contrato de idioma desta feature.
- Preserva `MOB-BASE-007`: componentes compartilhados continuam consumindo
  tokens semânticos em vez de cores literais.
- Segue `MOB-DEC-001`: a implementação foi iniciada após aprovação humana e
  desbloqueio de `MOB-FEAT-001`.

### Referência web não normativa

A versão web fornece a origem de produto para os valores e opções desta spec:

- `entities/user/model/userSettings.types.ts` — contrato e defaults;
- `entities/user/lib/accessibility.ts` — resolução e aplicação global;
- `styles/index.css` — tokens, escalas, temas e variantes de contraste;
- `pages/settings/ui/parts/AppearanceTab.tsx` e `AccessibilityTab.tsx` —
  controles apresentados à pessoa;
- `pages/settings/model/useSettingsSync.ts` — atualização local e sync;
- `app/providers/UserSettingsHydrator.tsx` — aplicação após hidratação.

## Requisitos e regras

### Preferências de aparência

- Tema oferece `SYSTEM`, `LIGHT` e `DARK`. O default mobile é `SYSTEM`.
- `SYSTEM` acompanha o esquema claro/escuro do sistema operacional, inclusive
  mudanças ocorridas enquanto o aplicativo está aberto. `LIGHT` e `DARK` são
  overrides estáveis e não mudam quando o esquema do sistema muda.
- Tamanho de fonte oferece `COMPACT`, `DEFAULT` e `COMFORTABLE`.
- Densidade oferece `COMFORTABLE` e `COMPACT`.
- Animações podem ser habilitadas ou desabilitadas sem desabilitar feedback
  funcional necessário para indicar carregamento, sucesso, erro ou progresso.

### Escala tipográfica

As variantes alteram todos os estilos tipográficos semânticos, e não somente
uma tela ou subconjunto de componentes:

| Variante      |  H1 |  H2 |  H3 |  H4 | Corpo | Pequeno | Mínimo |
| ------------- | --: | --: | --: | --: | ----: | ------: | -----: |
| `COMPACT`     |  30 |  22 |  18 |  15 |    13 |      11 |     10 |
| `DEFAULT`     |  32 |  24 |  20 |  16 |    14 |      12 |     11 |
| `COMFORTABLE` |  34 |  26 |  22 |  17 |    15 |      13 |     12 |

- Os valores da tabela são tamanhos base em unidades lógicas do React Native.
- A preferência da aplicação compõe com a escala de fonte do sistema; ela não
  desabilita nem substitui a acessibilidade tipográfica nativa.
- Componentes devem permitir reflow e crescimento vertical. Textos essenciais,
  labels e valores de controles não podem ser ocultados por altura fixa.

### Densidade

| Token de espaço | `COMFORTABLE` | `COMPACT` |
| --------------- | ------------: | --------: |
| `xs`            |             4 |         4 |
| `sm`            |             8 |         6 |
| `md`            |            16 |        12 |
| `lg`            |            24 |        18 |
| `xl`            |            32 |        24 |
| `2xl`           |            48 |        36 |
| `3xl`           |            64 |        48 |

- A densidade é global, mas não reduz safe areas, legibilidade ou alvos
  interativos abaixo de 44 pontos no iOS e 48 dp no Android.
- Métricas que não representam densidade — tamanho de ícone semântico, raio da
  marca e espessura de focus ring, por exemplo — não mudam automaticamente.

### Movimento e animação

- Movimento reduzido efetivo é verdadeiro quando a preferência do sistema
  operacional **ou** a preferência manual `reduceMotion` estiver ativa.
- Com movimento reduzido efetivo, autoplay, carrosséis temporizados, paralaxe,
  pulsação decorativa e transições espaciais são interrompidos ou substituídos
  por atualização imediata sem deslocamento.
- Com `animations` desabilitado, animações decorativas e autoplay também são
  desativados, mesmo que o sistema não solicite movimento reduzido.
- Alterações na preferência do sistema são refletidas durante a sessão.

### Alto contraste

- Alto contraste efetivo é verdadeiro quando o sistema operacional **ou** a
  preferência manual `highContrast` estiver ativo.
- A variante é combinada com o tema efetivo; alto contraste claro não reutiliza
  a paleta de alto contraste escura e vice-versa.
- A variante escura usa, no mínimo, fundo `#000000`, superfície `#181818`,
  superfície discreta `#0d0d0d`, borda `#8c8c8c`, borda forte `#b0b0b0`, texto
  `#ffffff`, texto secundário `#f2f2f2`, texto discreto `#d8d8d8` e foco/link
  `#fff86a`.
- A variante clara usa, no mínimo, fundo/superfície `#ffffff`, superfície
  discreta `#f5f5f5`, borda `#1f1f1f`, borda forte/separador `#333333`, texto
  `#000000`, texto secundário `#1f1f1f`, texto discreto `#333333`, accent/foco
  `#4d4a00` e link `#333100`.
- Estados de foco, erro, sucesso, seleção, desabilitado e conteúdo sobre overlay
  permanecem distinguíveis sem depender somente de cor.

### Aplicação e interface

- Preferências hidratadas são aplicadas antes de liberar a interface principal,
  evitando a exibição transitória do tema ou escala default.
- Toda alteração produz preview global imediato e é entregue à fundação de
  preferências de `MOB-FEAT-001` para persistência/sincronização.
- Falha de sincronização não desfaz silenciosamente o preview local; a interface
  apresenta estado de erro e ação de tentar novamente conforme `MOB-FEAT-001`.
- A tela de configurações apresenta seções de Aparência e Acessibilidade, com
  controles nativos que anunciam label, valor/estado selecionado, habilitação e
  erro aos recursos assistivos.
- Todos os rótulos, descrições, confirmações e erros usam i18n nos três idiomas
  suportados. Nenhuma cor ou string de produto é literal em componentes.

### Arquitetura FSD futura

- `shared/theme` contém somente tipos visuais genéricos, escalas, resolução de
  tokens e integração agnóstica com APIs de aparência/acessibilidade da plataforma.
- O contrato e os seletores de preferências vêm da API pública do slice de
  domínio definido por `MOB-FEAT-001`; consumidores não fazem deep imports.
- A ação de alterar aparência/acessibilidade e seus controles pertence a um
  slice de `features/` orientado à ação. A rota em `pages/` apenas compõe essa
  feature; providers e bootstrap globais permanecem em `application/`/`app`.
- Componentes de `shared/ui` recebem tokens resolvidos e não importam entities,
  features ou estado de negócio.
- Não são permitidos imports horizontais entre features nem dependências de
  camadas inferiores para `pages`, `widgets`, `application` ou `app`.

## Casos de erro

- Valor persistido desconhecido ou incompleto é normalizado pela fundação para
  um contrato válido; tema inválido resulta em `SYSTEM` e não impede o boot.
- Indisponibilidade da detecção de contraste do sistema preserva a preferência
  manual; indisponibilidade da detecção de esquema usa o esquema claro como
  fallback de `SYSTEM`, sem alterar a preferência persistida.
- Falha ao observar uma mudança do sistema mantém o último estado efetivo e não
  corrompe o valor escolhido pela pessoa.
- Textos ampliados ou densidade compacta não podem tornar uma ação inacessível;
  conteúdo deve reflowar ou permitir rolagem.

## Critérios de aceite

### AC-001 — Tema e default mobile

Dado um perfil sem preferência anterior, quando as configurações forem
hidratadas, então `SYSTEM` será a preferência selecionada e o tema efetivo será
o esquema atual do sistema operacional.

### AC-002 — Override e mudança do sistema

Dado `SYSTEM`, quando o esquema do sistema mudar entre claro e escuro durante a
sessão, então os tokens efetivos mudarão sem reiniciar o app; dado `LIGHT` ou
`DARK`, a mesma mudança não alterará o tema efetivo.

### AC-003 — Aplicação antes da interface

Dada uma preferência persistida diferente do fallback de boot, quando o app for
aberto, então nenhuma tela da interface principal será exibida com tema, fonte,
densidade ou contraste incorretos antes da hidratação.

### AC-004 — Tokens semânticos por tema

Dadas as variantes normal clara e escura, quando um componente compartilhado
for renderizado, então fundo, superfície, texto, borda, accent, estado e foco
serão derivados do resolvedor semântico e corresponderão à variante efetiva,
sem cor literal no componente.

### AC-005 — Alto contraste combinado

Dado alto contraste solicitado manualmente ou pelo sistema, quando o tema
efetivo for claro ou escuro, então a paleta correspondente desta spec será
aplicada; desativar somente a preferência manual não removerá a variante enquanto
o sistema continuar solicitando alto contraste.

### AC-006 — Escala tipográfica global

Dada cada opção de tamanho, quando ela for selecionada, então H1, H2, H3, H4,
corpo, pequeno e mínimo usarão os valores base da tabela em todas as rotas, e a
escala de fonte do sistema continuará sendo aplicada sobre esses valores.

### AC-007 — Reflow com fonte ampliada

Dada fonte `COMFORTABLE` combinada com fonte ampliada no sistema, quando a tela
de configurações e os componentes compartilhados forem renderizados, então
labels e ações essenciais permanecerão legíveis, alcançáveis e sem corte por
altura fixa.

### AC-008 — Densidade global segura

Dada densidade `COMPACT`, quando telas e listagens forem renderizadas, então os
tokens de espaço usarão a coluna compacta da tabela, enquanto alvos interativos
manterão no mínimo 44 pontos no iOS e 48 dp no Android.

### AC-009 — Movimento reduzido efetivo

Dada solicitação de movimento reduzido pelo sistema ou pela preferência manual,
quando uma superfície com animação, transição espacial ou autoplay estiver
ativa, então o movimento decorativo e o avanço temporizado cessarão e a ação
funcional continuará disponível.

### AC-010 — Animações desabilitadas

Dado `animations=false` sem movimento reduzido do sistema, quando uma animação
decorativa ou autoplay puder iniciar, então ela permanecerá desativada, sem
eliminar indicadores essenciais de carregamento, sucesso, erro ou progresso.

### AC-011 — Controles acessíveis e traduzidos

Dada a tela de configurações em qualquer idioma suportado, quando uma tecnologia
assistiva navegar pelos controles, então cada opção anunciará nome, valor ou
estado selecionado, habilitação e erro usando o idioma ativo.

### AC-012 — Preview, persistência e erro de sync

Dada uma alteração válida, quando a pessoa mudar um controle, então o resultado
global será visível imediatamente e será enviado à fundação de preferências;
se a sincronização falhar, o valor local permanecerá ativo e a tela mostrará erro
com ação de tentar novamente.

### AC-013 — Mudanças de acessibilidade durante a sessão

Dado o app aberto em `SYSTEM`, quando o sistema alterar esquema, movimento
reduzido, alto contraste ou escala de fonte, então o estado efetivo e as
superfícies montadas serão atualizados sem exigir logout ou reinício.

### AC-014 — Fronteiras FSD

Dada a implementação desta feature, quando o gate de arquitetura for executado,
então não haverá import invertido, import horizontal entre features ou deep
import externo, e `shared/ui` não dependerá do estado de preferências.

## Estratégia de evidência

| Critério        | Teste/evidência esperada                                                             |
| --------------- | ------------------------------------------------------------------------------------ |
| AC-001 a AC-003 | Testes de integração do bootstrap com storage e esquema de plataforma simulados      |
| AC-004, AC-005  | Testes unitários do resolvedor cobrindo a matriz tema × contraste e tokens esperados |
| AC-006, AC-007  | Testes de integração da tipografia com as três escalas e font scale do sistema       |
| AC-008          | Testes de tokens de densidade e dimensões mínimas por plataforma                     |
| AC-009, AC-010  | Testes com relógio controlado para transições, animações e autoplay                  |
| AC-011, AC-012  | React Native Testing Library: semântica dos controles, preview, erro e retry         |
| AC-013          | Testes de subscriptions das preferências da plataforma durante a sessão              |
| AC-014          | `pnpm lint:fsd`, `pnpm typecheck` e revisão das APIs públicas dos slices             |

Não usar snapshots como evidência. Fidelidade visual deve ser verificada por
asserts sobre tokens/estados e inspeção manual dirigida da matriz de variantes.

## Gate de implementação

- Estado: `open`
- Dependências: `MOB-FEAT-001`
- Motivo: aparência e acessibilidade precisam da fundação de hidratação, persistência e sincronização antes de produzir controles reais.

O gate só pode ser aberto quando `MOB-FEAT-001` estiver `implemented`.

## Fora de escopo

- Preferências do leitor de capítulos, idiomas de interface/conteúdo, timezone,
  formato de data, dados, atalhos ou telas de perfil.
- Reproduzir CSS, seletores HTML, Tailwind ou workarounds específicos do fórum web.
- Redesenhar a identidade visual, adicionar novos temas ou permitir paletas
  personalizadas pela pessoa.
- Definir novamente precedência local/servidor, debounce, logout ou migração de
  preferências; esses contratos pertencem a `MOB-FEAT-001`.

## Aprovação humana

- Aprovador: usuário responsável pelo produto
- Data: 2026-08-08

`implementation_gate` está `open` porque `MOB-FEAT-001` está `implemented`.
