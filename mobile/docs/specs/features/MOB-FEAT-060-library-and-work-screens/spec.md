---
id: MOB-FEAT-060
type: feature
title: Biblioteca em grade e tela da obra
status: approved
implementation_gate: blocked
blocked_by: [MOB-FEAT-055, MOB-FEAT-057]
created: 2026-11-08
updated: 2026-11-08
supersedes: []
superseded_by: []
---

# MOB-FEAT-060 — Biblioteca em grade e tela da obra

## Objetivo

Reorganizar a biblioteca local e dar à obra uma tela própria, conforme o kit mobile do Toonlira Design System: abrir
um capítulo em no máximo dois toques, retomar a leitura sem procurar, e trocar a pilha de botões de largura total por
ações no lugar certo (menu "⋯", folhas e confirmação descritiva).

## Contexto e contratos relacionados

- **Altera a apresentação da MOB-FEAT-055** (obras, capas, capítulos e itens anteriores sem obra) e da MOB-FEAT-025
  (biblioteca local). Regras de dados, migração, lote, retry, consentimento e leitor da 055 continuam vigentes e são
  reutilizadas sem mudança: esta spec só muda onde e como as ações aparecem.
- Mantém 025/AC-002 (abrir na posição válida; vazio leva à importação), 025/AC-003 e 055/AC-002 (exclusão com
  confirmação clara, sem afetar outras obras) e 055/AC-003 (capítulos sem alterar os irmãos).
- Usa primitivas da MOB-FEAT-057 (`SectionHeader`, `SectionAction`, `ActionSheet`, `ConfirmSheet`, `BottomSheet`,
  `StateView`, `ListSkeleton`, `ListRow`, `StickyActionBar`).
- Referência visual: `LibraryScreen.jsx`, `WorkScreen.jsx`, `ManageScreen.jsx` e `WorkCard`/`NewWorkTile`/
  `LibrarySkeleton` de `kit-parts.jsx` (kit, versão 42). Glossário do kit: Obra > Capítulo > Página; o usuário não vê
  "projeto".

## Requisitos e regras

### Biblioteca (`/translation-library`)

- **Carregando:** esqueleto com o formato da biblioteca (bloco de "Continuar lendo" e grade de capas).
- **Continuar lendo:** quando existir progresso de leitura, um cartão no topo mostra a capa, o eyebrow "Continuar
  lendo", o nome da obra (ou do capítulo sem obra) e "Capítulo N · página X de Y"; tocar abre o leitor na última
  página válida (025/AC-002). Sem progresso, o cartão não aparece.
- **Obras:** `SectionHeader` "Obras" com a contagem e as ações:
    - "Recentes" / "A–Z": alterna a ordem (por atualização mais recente ou alfabética no idioma da interface). Só aparece
      com mais de uma obra. A escolha vale para a sessão (decisão D14).
    - "Selecionar" / "Concluir": entra e sai do modo seleção.
- **Grade:** duas colunas de cartões de obra com capa 2:3 (capa do usuário ou capa padrão da 055, decisão D15), barra
  de progresso quando houver leitura, selo de estado quando algum capítulo falhou ou está em processamento, nome (até
  duas linhas), resumo ("Parou no cap. N", "N capítulos" ou "Sem capítulos") e botão "⋯".
- **Nova obra:** último item da grade, abre a folha "Nova obra" com campo de nome obrigatório (o botão "Criar obra"
  fica desabilitado com nome vazio). O formulário fixo no topo deixa de existir.
- **Menu da obra (ActionSheet):** Abrir obra · Editar nome · Escolher capa / Alterar capa · Excluir obra (destrutiva).
- **Sem obra:** seção com os capítulos anteriores ainda não vinculados (055), como linhas compactas com miniatura,
  título, meta (idiomas e páginas prontas) e "⋯". Título exibido: "Capítulo de <data de criação>" (decisão D16).
  Menu: Abrir no leitor · Mover para obra · Excluir (destrutiva).
- **Mover para obra:** folha com a lista de obras; tocar vincula o capítulo àquela obra usando a operação de vínculo
  da 055.
- **Modo seleção:** cartões mostram marcador de seleção; o rodapé troca para "Cancelar" e "Excluir N obras"
  (desabilitado sem seleção), que abre a confirmação em lote.
- **Rodapé fixo:** fora do modo seleção, um único botão primário "Traduzir capítulo".
- **Vazio:** sem obras e sem capítulos anteriores, `StateView` vazio com "Criar obra"; o atalho para traduzir fica no
  rodapé.

### Tela da obra (nova rota `/work/[workId]`)

- Cabeçalho: voltar, título curto e ação "Gerenciar obra".
- Topo: capa (toque abre a folha de capa), nome no papel `title`, "N capítulos · N páginas", idiomas, selos "N
  falharam" e "N em tradução" quando houver, e a ação textual "Editar nome".
- **Capítulos:** `SectionHeader` com contagem e as ações "1 → N" / "N → 1" (ordem de exibição, só com mais de um
  capítulo) e "Novo", que abre o fluxo de tradução já vinculado à obra.
- **Linha de capítulo (64):** tile com o número (em acento no capítulo atual), nome, meta ("Parou na página X de Y"
  no atual, senão "N páginas · atualizado"), selo de estado quando não estiver traduzido, pílula "Continuar", "Ler" ou
  "Ver" (falhou) e "⋯". Tocar abre o leitor.
- **Menu do capítulo:** Abrir no leitor · Tentar traduzir de novo (só com páginas falhas; segue 055/AC-005 e o
  consentimento vigente, sem reenvio automático) · Renomear · Excluir capítulo (destrutiva).
- **Vazio:** `StateView` vazio inline com "Nenhum capítulo ainda" e, quando houver capítulos sem obra, a ação
  "Vincular capítulo anterior".
- **Rodapé fixo:** "Continuar · cap. N, pág. X" com progresso, "Começar a ler" com capítulos e sem progresso, ou
  "Novo capítulo" sem capítulos.

### Gerenciar obra (nova rota `/work/[workId]/manage`)

- Resumo com capa, nome e "N capítulos".
- Grupo "Informações": Nome (abre a folha de renomear) e Capa ("Personalizada" ou "Sem capa"; abre a folha de capa).
- Grupo "Capítulos": "Vincular capítulo anterior" ("N disponíveis em Sem obra" ou "Nenhum disponível"), que abre a
  folha de vínculo com seleção múltipla; e "Ver capítulos", que volta à obra.
- Grupo "Zona de risco": "Excluir obra".

### Folhas e confirmações

- **Capa:** prévia, "Escolher da galeria", "Remover capa" (só com capa personalizada) e "Cancelar"; imagem inválida
  não substitui a anterior (055).
- **Renomear obra e capítulo:** campo obrigatório; "Salvar" desabilitado com valor vazio ou igual ao atual.
- **Vínculo:** lista dos capítulos sem obra com seleção múltipla; "Vincular N capítulos"; sem itens, estado vazio
  "Nada para vincular".
- **Exclusão (obra, capítulo, item sem obra, lote):** `ConfirmSheet` com o que será removido (capítulos e páginas,
  traduções salvas no aparelho, progresso de leitura) e o aviso de que não pode ser desfeito. Os `Alert` atuais da
  biblioteca deixam de ser usados.

### Selo de estado

- Primitiva `StatusChip` em `shared/ui` com os estados aguardando, processando, salva, falhou e incerta (ícone,
  rótulo e cor semântica com superfície suave da 057), reutilizável pela 056.

### Navegação, i18n e acessibilidade

- Rotas novas registradas em `ROUTES`, com cascas em `src/app` e páginas em `src/pages`; voltar e Home seguem 029 e
  055/AC-008.
- Obra ou capítulo inexistente (excluído) leva de volta à biblioteca sem tela vazia.
- Todos os textos em `localTranslation` nos três idiomas; nada de "projeto" na interface.
- Cada ação por item tem rótulo acessível próprio; o modo seleção anuncia o estado selecionado.

## Casos de erro

- Falha de banco ou arquivo ao criar, renomear, mudar capa, vincular ou excluir: erro recuperável perto da causa,
  sem afirmar sucesso nem perder dados (055).
- Exclusão concorrente com processamento segue a regra da 055 (impede commit em item removido).
- Lista de capítulos ou obras falha ao carregar: `StateView` de erro com "Tentar de novo".

## Critérios de aceite

### AC-001 — Biblioteca em grade

Dadas obras salvas, quando a biblioteca abrir, então aparecem esqueleto durante a carga, a seção "Obras" com contagem,
a grade de duas colunas com capa, progresso, selo, resumo e "⋯", e o item "Nova obra" no fim.

### AC-002 — Continuar lendo

Dado progresso de leitura, quando a biblioteca abrir, então o cartão "Continuar lendo" mostra obra, capítulo e página
e abre o leitor na última página válida; sem progresso, ele não aparece.

### AC-003 — Ordem e seleção

Dadas várias obras, quando o usuário alternar "Recentes"/"A–Z" ou entrar no modo seleção, então a grade reordena na
sessão, a seleção é anunciada e "Excluir N obras" só fica disponível com seleção, pedindo confirmação em lote.

### AC-004 — Ações da obra em menu e folhas

Dado o "⋯" de uma obra, quando o usuário escolher abrir, renomear, mudar capa ou excluir, então a ação acontece em
folha própria e a exclusão só ocorre após `ConfirmSheet` descritivo, sem afetar outras obras.

### AC-005 — Capítulos sem obra

Dados capítulos sem obra, quando a biblioteca abrir, então aparecem como linhas compactas com título derivado da data,
e o menu permite abrir, mover para uma obra existente e excluir com confirmação.

### AC-006 — Tela da obra

Dada uma obra, quando ela abrir, então mostra capa, nome, metadados, selos, a lista de capítulos em linhas de 64 com
pílula de ação e "⋯", a ordem "1 → N"/"N → 1" e o rodapé com a ação de leitura adequada ao progresso.

### AC-007 — Ações do capítulo

Dado o "⋯" de um capítulo, quando o usuário escolher abrir, tentar de novo, renomear ou excluir, então "Tentar
traduzir de novo" só aparece com páginas falhas e segue o retry explícito e o consentimento da 055, e a exclusão pede
confirmação.

### AC-008 — Gerenciar obra e vínculo

Dada a tela de gerenciamento, quando o usuário renomear, mudar capa, vincular capítulos anteriores ou excluir a obra,
então cada ação usa a operação existente da 055 e o vínculo aceita seleção múltipla.

### AC-009 — Abrir capítulo em dois toques

Dada a biblioteca, quando o usuário tocar numa obra e depois num capítulo, então o leitor abre; e "Continuar lendo"
abre em um toque.

### AC-010 — Estados e falhas

Dados biblioteca vazia, obra sem capítulos, falha de carga e falha de operação, quando ocorrerem, então aparecem o
estado vazio com a ação que resolve, o erro com "Tentar de novo" e mensagens perto da causa, sem perda de dados.

### AC-011 — Selo de estado reutilizável

Dado um `StatusChip` em cada estado, quando renderizado, então mostra ícone, rótulo e cor semântica distintos e não
depende só da cor.

### AC-012 — Navegação, idiomas e acessibilidade

Dadas as rotas novas, os três idiomas, claro, escuro, alto contraste, fonte a 200% e 320 pt, quando as telas
renderizarem, então voltar e Home funcionam, obra inexistente volta à biblioteca, e não há texto fixo, cor solta,
corte ou ação inalcançável.

### AC-013 — Contratos e qualidade

Dados os AC da 025 e da 055, quando os testes rodarem, então continuam verdes, e os testes de páginas, widgets, rotas,
i18n e FSD desta spec passam, com arquivos mapeados no `coverage.json`.

## Estratégia de evidência

| Critério | Teste/evidência esperada                                                                                     |
| -------- | ------------------------------------------------------------------------------------------------------------ |
| AC-001   | RNTL da biblioteca (esqueleto, grade, contagem, nova obra)                                                   |
| AC-002   | RNTL com e sem progresso; navegação para o leitor                                                            |
| AC-003   | RNTL da ordenação e do modo seleção com exclusão em lote                                                     |
| AC-004   | RNTL do menu da obra, folhas e `ConfirmSheet`                                                                |
| AC-005   | RNTL da seção "Sem obra" e da folha "Mover para obra"                                                        |
| AC-006   | RNTL da tela da obra e do rodapé nos três casos                                                              |
| AC-007   | RNTL do menu do capítulo, com e sem páginas falhas                                                           |
| AC-008   | RNTL da tela de gerenciamento e da folha de vínculo                                                          |
| AC-009   | Teste de navegação ponta a ponta em RNTL                                                                     |
| AC-010   | RNTL dos estados vazio e de erro e das falhas de operação                                                    |
| AC-011   | RNTL do `StatusChip`                                                                                         |
| AC-012   | Testes de rotas e chaves nos três locales; RNTL com `fontScale` 2; capturas no iOS Simulator; Android físico |
| AC-013   | Testes da 025 e da 055 verdes; `pnpm lint:fsd`, `pnpm typecheck`; `coverage.json`                            |

## Gate de implementação

- Estado: `blocked`
- Dependências: MOB-FEAT-055 (`in-progress`) e MOB-FEAT-057 (`verification-pending`).
- Motivo: a 055 está implementando obras, capítulos e lote nos mesmos arquivos (`widgets/local-translation-library`,
  `features/manage-local-works`). O gate só abre quando a 055 chegar a `implemented` ou `verification-pending` e uma
  pessoa abrir o gate.

## Fora de escopo

- Regras de dados, migração, lote, consentimento, gateway e leitor (055, 017–021).
- Fluxo de tradução em 3 etapas (056) e leitor (063).
- Sincronização com conta, busca e filtros.

## Decisões registradas na aprovação

As propostas abaixo foram aceitas como redigidas.

- **D7 — dependência da 055.** Proposta: esperar a 055 (gate bloqueado). A alternativa é revisar a 055 para absorver
  este redesenho.
- **D14 — ordem da grade.** Proposta: escolha válida só na sessão. A alternativa é persistir nas preferências locais.
- **D15 — capa ausente.** A 055/AC-002 pede capa padrão empacotada; o kit usa iniciais do nome sobre listras. Proposta:
  manter a capa padrão da 055. Usar iniciais exige revisar a 055.
- **D16 — título dos capítulos sem obra.** A 055 proíbe nomes inventados. Proposta: exibir "Capítulo de <data de
  criação>", derivado de dado real e nunca persistido.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-11-08
- Evidência: resposta “Aprovo as cinco” à apresentação das Target Specs 058–062, aceitando as propostas dos pontos em aberto como redigidas. O gate de implementação segue `blocked`.

Não criar `tasks.md` antes de status `approved` e aprovação preenchida.
