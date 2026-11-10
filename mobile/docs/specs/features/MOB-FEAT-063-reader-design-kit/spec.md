---
id: MOB-FEAT-063
type: feature
title: Leitor no padrão do kit mobile
status: verification-pending
implementation_gate: open
blocked_by: [MOB-FEAT-055, MOB-FEAT-057, MOB-FEAT-062]
created: 2026-11-08
updated: 2026-11-08
supersedes: []
superseded_by: []
---

# MOB-FEAT-063 — Leitor no padrão do kit mobile

## Objetivo

Levar ao leitor de imagens o padrão de barras, folha de ajustes, navegação entre capítulos e estados do kit mobile do
Toonlira Design System (`ui_kits/mobile/ReaderScreen.jsx`), sem perder nenhum comportamento contratado do leitor. O
kit é referência visual e de comportamento, não código para copiar.

## Contexto e contratos relacionados

- Contratos que **não mudam**: MOB-FEAT-005 (modos, direção, ajuste, qualidade, saturação, espaçamento,
  pré-carregamento, progresso), MOB-FEAT-051 (leitor unificado, overlay de demonstração, erro por página),
  MOB-FEAT-052 (gestos e modos de exibir controles), MOB-FEAT-053 (leitor de texto), MOB-FEAT-055 (zoom, marcador de
  falha, retry seletivo) e MOB-DEC-008 (sem reenvio automático).
- Contrato alterado (D2, opção A): MOB-FEAT-054/AC-001 (abas e lembrança da aba) e AC-002 (agrupamento por abas) dão
  lugar à folha única desta spec no leitor de imagens; os demais requisitos da 054 continuam valendo.
- Reutiliza `BottomSheet`, `ListRow`, `ChoiceRow`, `StateView`, `TextAction` e os tokens `metrics`, `shadows` e
  `motion` de `shared/ui`/`useTheme()` (057) e a página Configurações > Leitor (062).
- Estado atual conferido em 2026-11-08: o painel (`widgets/content-reader/ui/ReaderPanel.tsx`) usa abas; o botão
  "Mostrar original/resultado" (`ContentReader.tsx`, `comparisonControls`) fica dentro da aba Aparência; nenhum leitor
  (`pages/reader`, `pages/offline-translation`) tem lista de capítulos ou capítulo anterior/próximo.
- A lista de capítulos e o anterior/próximo dependem dos capítulos da obra da 055 (TASK-003, ainda aberta).

## Requisitos e regras

### Onde cada controle aparece (decisão D21)

| Controle                          | Leitor de capítulo de obra (055) | Resultado avulso ("Sem obra", 021) | Leitor da plataforma (`pages/reader`) |
| --------------------------------- | -------------------------------- | ---------------------------------- | ------------------------------------- |
| Barras superior e inferior do kit | sim                              | sim                                | sim                                   |
| Folha "Ajustes do leitor"         | sim                              | sim                                | sim                                   |
| Lista de capítulos                | sim                              | não                                | não                                   |
| Capítulo anterior/próximo         | sim                              | não                                | não                                   |
| Alternador Traduzido/Original     | sim, com resultado               | sim, com resultado                 | não                                   |
| Fim de capítulo                   | sim                              | só "Voltar"                        | não (mantém o comportamento da 005)   |
| Estados bloqueantes de tradução   | sim                              | sim                                | não                                   |

Controle que não se aplica a um leitor **não aparece** (não fica desabilitado sem motivo nem ganha capacidade
fictícia).

### Barra superior

- Voltar à esquerda; no centro, nome do capítulo e, abaixo, nome da obra, com elipse.
- À direita, "Ajustes do leitor" (ícone `options-outline`) e, quando aplicável, "Lista de capítulos"
  (`list-outline`), desabilitado com menos de 2 capítulos na obra.
- "Lista de capítulos" abre `BottomSheet` com os capítulos da obra na ordem da 055, o atual marcado e anunciado como
  selecionado; tocar em outro capítulo troca o capítulo no leitor e fecha a folha.

### Barra inferior

- Linha de progresso com barra e "p / T" (`accessibilityRole="progressbar"` com valor atual e máximo).
- Capítulo anterior e próximo nas pontas, desabilitados quando não existem.
- Alternador segmentado "Traduzido / Original" no centro, só quando existe resultado traduzido. Ele substitui o botão
  "Mostrar original/resultado" da aba Aparência e preserva a âncora de leitura ao alternar.
- As duas barras mostram e escondem conforme os modos de exibir controles e os gestos da 052; o kit não altera essa
  arbitragem.

### Fim do capítulo (vertical e webtoon)

- Ao fim do conteúdo: rótulo "Fim do capítulo", título do próximo capítulo ou "Você está em dia com <obra>", e ação
  primária "Ler próximo capítulo" ou "Voltar para a obra".
- O fim do capítulo não marca leitura sozinho; o progresso e a conclusão seguem a 005/AC-007.

### Estados bloqueantes do modo traduzido

- Com o capítulo em processamento: "Tradução em andamento", explicação e ação "Ler original".
- Com falha do capítulo: "Não foi possível traduzir", causa localizada, "Tentar de novo" e "Ler original".
- "Tentar de novo" usa o retry explícito e seletivo da 055 (só páginas com falha, consentimento vigente, chave por
  tentativa); nunca reenvia automaticamente (DEC-008). Resposta ambígua continua como "incerta", sem retry pago
  automático.
- Falha de página isolada continua com o marcador discreto e o retry individual da 055; o estado bloqueante só cobre
  o capítulo inteiro sem resultado legível.
- Estados usam `StateView` da 057 e tokens; nada de cores fixas.

### Folha "Ajustes do leitor"

- `BottomSheet` da 057 (raio `feature`), cabeçalho com título "Ajustes do leitor", descrição "As mudanças valem na
  hora e ficam salvas nas configurações" e botão fechar. Fecha por botão, fundo e voltar do Android.
- Rodapé com "Todos os ajustes do leitor", que fecha a folha e abre Configurações > Leitor (062).
- Conteúdo (D2, opção A): folha única com Modo, Direção, Ajuste, Fundo, Saturação e Espaçamento; Gestos,
  Pré-carregamento, Marcação e Qualidade ficam em Configurações > Leitor, a um toque pelo rodapé. Além disso: ajuste inclui "Original" (D18); qualidade segue a 005/AC-004 (D19);
  espaçamento só aparece onde a 005 o aplica; limites, commit de sliders, erros e retry da 054/AC-002 preservados.
- Abrir, fechar ou mudar ajuste não remonta o viewport nem perde a âncora (054/AC-003).

### Tema, i18n e acessibilidade

- Barras usam tokens temáticos do leitor (051), não a paleta fixa do kit (D20); contraste AA sobre qualquer fundo do
  leitor.
- Textos por i18n em `pt-BR`, `en-US` e `es-ES`; alvos de 44 pt (iOS) / 48 dp (Android); nomes acessíveis em todos
  os ícones; fonte ampliada sem corte; RTL espelha anterior/próximo; redução de movimento remove a animação das barras.

## Casos de erro

- Falha ao carregar a lista de capítulos: a folha mostra erro localizado com "Tentar de novo"; a leitura atual
  continua.
- Capítulo vizinho removido ou indisponível: a navegação o ignora e anuncia o motivo; não abre tela vazia.
- Falha ao gravar um ajuste: mensagem e retry da 054, valor anterior preservado.
- Recusa de consentimento no "Tentar de novo": nada é enviado; o estado de falha permanece.

## Critérios de aceite

### AC-001 — Barra superior

Dado um capítulo aberto, quando os controles estiverem visíveis, então a barra superior mostra voltar, capítulo e
obra com elipse, "Ajustes do leitor" e, só no leitor de capítulo de obra, "Lista de capítulos", desabilitado com menos
de 2 capítulos.

### AC-002 — Lista de capítulos

Dada uma obra com 2 ou mais capítulos, quando a pessoa abrir a lista, então a folha mostra os capítulos na ordem da
055 com o atual marcado e anunciado, e escolher outro capítulo o abre no leitor e fecha a folha.

### AC-003 — Barra inferior

Quando os controles estiverem visíveis, então a barra inferior mostra progresso "p / T" acessível, capítulo
anterior/próximo (desabilitados sem vizinho, ausentes fora do leitor de obra) e, só com resultado traduzido, o
alternador "Traduzido / Original", que preserva a âncora e substitui o botão de comparação da aba Aparência.

### AC-004 — Fim do capítulo

Dado o modo vertical ou webtoon, quando a pessoa chegar ao fim do conteúdo, então aparece "Ler próximo capítulo"
quando há próximo e "Voltar para a obra" quando não há, sem concluir leitura fora da regra da 005/AC-007.

### AC-005 — Estados bloqueantes do modo traduzido

Dado o modo traduzido com o capítulo em processamento ou com falha total, então o leitor mostra o estado
correspondente com "Ler original" e, na falha, "Tentar de novo", que só envia páginas com falha, após consentimento,
e nunca reenvia automaticamente.

### AC-006 — Folha de ajustes

Quando a pessoa tocar em "Ajustes do leitor", então abre `BottomSheet` com título, descrição, fechar e rodapé "Todos
os ajustes do leitor" que leva a Configurações > Leitor, com Modo, Direção, Ajuste, Fundo, Saturação e Espaçamento, sem abas (D2).

### AC-007 — Contratos do leitor preservados

Modos, direção, ajuste com "Original", qualidade só com fontes distintas, saturação, espaçamento, pré-carregamento,
progresso, gestos e modos de exibir controles, zoom, marcador de falha e retry individual continuam como em 005, 051,
052, 053 e 055; abrir ou fechar folhas não remonta o viewport.

### AC-008 — Tema, idiomas e acessibilidade

Barras e estados usam só tokens; textos completos nos três idiomas; alvos 44/48; fonte ampliada sem corte; RTL
espelha a navegação; redução de movimento desativa a animação das barras.

### AC-009 — Qualidade e regressão

Testes de `ContentReader`, `ReaderPanel` e das pages de leitor passam com os novos casos; testes de 051–055
continuam verdes; `coverage.json` e registry atualizados; `typecheck`, `lint`, `lint:fsd` e `test:ci` verdes.

## Estratégia de evidência

| Critério | Teste/evidência esperada                                                     |
| -------- | ---------------------------------------------------------------------------- |
| AC-001   | `ContentReader.test.tsx` por tipo de leitor; captura iOS                     |
| AC-002   | teste da folha de capítulos e troca de capítulo na page do leitor local      |
| AC-003   | teste das barras, `progressbar`, vizinhos e alternador com âncora preservada |
| AC-004   | teste de fim de capítulo com e sem próximo                                   |
| AC-005   | teste dos estados, consentimento e ausência de chamada sem aceite            |
| AC-006   | `ReaderPanel.test.tsx` com cabeçalho, fechar, voltar Android e rodapé        |
| AC-007   | suítes existentes de 005/051/052/053/055 sem alteração de expectativa        |
| AC-008   | testes de i18n por chave, RTL e redução de movimento; capturas claro/escuro  |
| AC-009   | gates do mobile e review                                                     |

## Gate de implementação

- Estado: `open` (2026-11-08).
- Dependências: MOB-FEAT-055, MOB-FEAT-057 e MOB-FEAT-062, todas em `verification-pending`.
- Abertura: Ruan Moraes, mensagem “Vamos fazer tudo, depois eu verifico se esta oK”, depois de a 055 chegar a
  `verification-pending`. Antes disso o gate estava `blocked` porque a 055 mexia nos mesmos arquivos
  (`widgets/content-reader`, `ZoomableSurface` e leitor local).

## Fora de escopo

- Leitor de texto (053): seu painel não muda nesta spec.
- Novas preferências, API, gateway, migrações e políticas de consentimento.
- Não portar do kit: páginas simuladas (`PagePlaceholder`), limite de 30 páginas, retry roteirizado (3500 ms), toasts
  de protótipo ("Você chegou ao fim", "Início do capítulo") e a paleta fixa do leitor (`PANEL`, `INK`, `DIM`).

## Decisões registradas na aprovação

As propostas abaixo foram aceitas como redigidas; em D2 vale a opção A.

- **D2 — abas ou folha única.**
    - **A (kit):** folha única com Modo, Direção, Ajuste, Fundo, Saturação e Espaçamento; Gestos, Pré-carregamento,
      Marcação e Qualidade passam a ficar só em Configurações > Leitor (rodapé). Altera explicitamente a 054/AC-001
      (abas e lembrança da aba) e AC-002 (agrupamento por abas).
    - **B (manter 054):** mantém as abas Leitura, Aparência e Gestos dentro do `BottomSheet` da 057, com cabeçalho e
      rodapé do kit; a 054 não muda.
    - **Escolhida: A.** Motivo: é o objetivo do kit (menos rolagem durante a leitura) e nenhum ajuste se perde: todos
      continuam em Configurações > Leitor, a um toque.
- **D18 — ajuste "Original":** o kit removeu. Aceito: manter (005).
- **D19 — qualidade:** o kit mostra as cinco opções sempre. Aceito: manter a regra da 005/AC-004.
- **D20 — cores das barras:** o kit usa hex fixos escuros. Aceito: tokens temáticos (051).
- **D21 — controles por leitor:** aceito conforme a tabela "Onde cada controle aparece".

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-11-08
- Evidência: resposta “Aprovo as duas” à apresentação das Target Specs 063 e 056 (revisão D3), aceitando as
  recomendações como redigidas. O gate de implementação segue `blocked`.

Não criar `tasks.md` antes de status `approved` e aprovação preenchida.
