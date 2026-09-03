---
id: MOB-FEAT-013
type: feature
title: Revisão e ordenação da importação
status: implemented
implementation_gate: open
blocked_by: [MOB-FEAT-012]
created: 2026-08-14
updated: 2026-08-14
supersedes: []
superseded_by: []
---

# MOB-FEAT-013 — Revisão e ordenação da importação

## Objetivo

Permitir que uma pessoa revise visualmente o draft privado importado, acrescente
ou remova imagens, defina a ordem das páginas e confirme o lote que seguirá para
a escolha independente dos idiomas, sem login, rede ou processamento simulado.

## Contexto e contratos relacionados

- Depende de `MOB-FEAT-012`, que está `implemented` e fornece picker pontual,
  arquivos privados, draft ativo durável e persistência SQLite.
- Revisa o limite de `MOB-FEAT-012/AC-007`: preview, adição, remoção, reorder e
  confirmação deixam de estar fora do estado visível do draft.
- Atende RF-IMP-004..008 e UX-REV-001..005 do mapa informativo de requisitos.
- Segue `MOB-DEC-002` para evidência baseada em risco e `MOB-DEC-004` para o
  mapeamento da app layer no FSD.
- A confirmação produz somente um draft revisado. `MOB-FEAT-014` continua
  responsável por origem e destino independentes e não é simulada nesta entrega.

## Requisitos e regras

- `/offline-translation` continua público e, quando existe draft ativo, mostra
  uma revisão ordenada de todas as imagens usando apenas arquivos privados do app.
- Cada item exibe miniatura, posição atual e ações para remover e reordenar. A
  implementação pode oferecer gesto de arrastar, mas deve sempre possuir uma
  alternativa acessível e determinística para mover o item antes/depois.
- A revisão oferece duas apresentações da mesma ordem: `grid`, uma grade
  virtualizada de duas colunas e modo padrão ao abrir a tela, e `scroll`, uma
  lista vertical virtualizada. Alternar o modo não altera itens, posições,
  confirmação ou arquivos e a escolha permanece apenas durante a sessão da tela.
- Tocar na miniatura abre a imagem privada em um modal ampliado com ajuste
  proporcional, identificação da página e ação explícita de fechar. Back do
  sistema fecha o modal; o preview não oferece compartilhamento, exportação nem
  revela URI, path ou nome privado.
- A remoção usa affordance destrutiva inequívoca com ícone, texto localizado,
  cor de perigo, label acessível e alvo mínimo. A apresentação pode adaptar sua
  largura entre grid e scroll, mas a ação e seu estado disabled são equivalentes.
- A lista preserva a ordem crescente de `position`, usa renderização virtualizada
  e thumbnails dimensionadas; não decodifica simultaneamente todas as imagens em
  resolução integral.
- “Adicionar imagens” abre o mesmo picker pontual de `MOB-FEAT-012` e acrescenta
  `1..N` itens ao final da ordem atual. Cancelamento ou ausência de resultado não
  altera o draft.
- Adição só se torna visível após todas as novas imagens serem copiadas para a
  área privada e os metadados serem persistidos. Falha parcial preserva integralmente
  itens, ordem e confirmação anteriores e limpa staging recuperável.
- Remover um item elimina seus metadados e recompõe posições contíguas na mesma
  transação. O arquivo privado é apagado após o commit ou por reconciliação segura.
- Remover o último item elimina o draft ativo e retorna ao estado inicial de
  importação, sem manter confirmação vazia ou arquivo privado referenciado.
- Reordenar preserva os IDs e arquivos dos itens, grava posições contíguas e
  únicas `0..N-1` em uma transação e sobrevive ao fechamento/reabertura do app.
- A interface pode sinalizar “possível duplicata” por heurística local sobre
  metadados privados disponíveis. O aviso admite falso positivo/negativo, não
  bloqueia confirmação, não remove item automaticamente e não expõe nome/URI.
- Confirmar exige ao menos um item, persiste o instante de confirmação e apresenta
  estado honesto de lote revisado. Não navega para idioma, OCR ou tradução enquanto
  as respectivas specs não estiverem implementadas.
- Adicionar, remover ou reordenar um lote confirmado limpa sua confirmação e o
  devolve ao estado de revisão; confirmar novamente é uma ação explícita.
- Enquanto uma mutação está em andamento, ações conflitantes ficam indisponíveis.
  Repetição rápida não duplica adição, remoção, reorder ou confirmação.
- Erros são localizados, preservam o último estado persistido e permitem retry
  quando aplicável. Logs, analytics e mensagens não incluem imagem, URI, path,
  nome original ou outro conteúdo privado.
- Textos visíveis existem em pt-BR, en-US e es-ES. Cores usam tokens; miniaturas
  têm descrição acessível e ações possuem label, estado disabled e alvo de toque
  compatíveis com o design system.

## Plano de persistência local

### 🗄️ Banco escolhido

SQLite privado já adotado por `MOB-FEAT-012`, pois confirmação, remoção e ordem
precisam compartilhar a mesma transação local. Os bytes continuam no diretório
privado; nenhuma imagem ou lista é armazenada como JSON/Base64 no banco.

### 📐 Modelo em BCNF

`local_media_import_drafts` recebe:

- `confirmed_at INTEGER NULL`, epoch ms; `NULL` significa “em revisão” e valor
  presente significa “confirmado”. Não existe coluna de status redundante.

As demais colunas permanecem iguais. Em `local_media_import_items`, `position`
continua a ordem normativa e `UNIQUE (draft_id, position)` continua sendo chave
candidata. As dependências funcionais seguem `id → atributos`, `slot → draft` e
`(draft_id, position) → item`; todo determinante permanece chave candidata.

### 🔗 Integridade

- `confirmed_at` é nullable porque todo draft novo começa em revisão.
- `draft_id` mantém FK `ON DELETE CASCADE`; remover o último item também remove
  explicitamente o draft na mesma transação.
- Após qualquer edição, `confirmed_at` volta a `NULL` e `updated_at` é atualizado.
- A confirmação exige existência de ao menos um item, validada dentro da mesma
  transação que grava `confirmed_at`.
- Posições são atualizadas em duas fases dentro da transação para não colidir com
  o `UNIQUE` intermediário, terminando obrigatoriamente contíguas em `0..N-1`.

### ⚡ Índices

Nenhum índice novo. `UNIQUE (draft_id, position)` já cobre leitura ordenada e o
prefixo da FK; um índice isolado em `draft_id` seria redundante. `slot UNIQUE`
continua cobrindo a consulta do único draft ativo.

### 🧮 Derivados

Quantidade, ordem visual, estado de confirmação e possíveis duplicatas são
derivados das linhas atuais. Não há contador, hash obrigatório ou cache persistido.

### 🛠️ Migração e código

- Migração local versionada `v1 → v2`: `ALTER TABLE
local_media_import_drafts ADD COLUMN confirmed_at INTEGER` e somente depois
  `PRAGMA user_version = 2`.
- Instalação nova cria diretamente o schema v2; upgrade preserva draft e itens v1,
  que passam a estar em revisão (`confirmed_at = NULL`).
- Mudança coordenada: database migrator, modelo/repositório da entity, operações
  de arquivos privados, feature de revisão, page, i18n, coverage e testes de
  upgrade/rollback/reordenação.

## Arquitetura FSD planejada

```text
shared/files + shared/storage + shared/ui
  → entities/local-media-import
    → features/review-local-media-import
      → pages/offline-translation
        → app/offline-translation.tsx
```

- `entities/local-media-import` mantém modelo, leitura e operações persistíveis do
  draft, sem UI de ação.
- `features/review-local-media-import` implementa adicionar, remover, mover e
  confirmar. Ela não importa `features/import-local-media`; a page compõe os dois
  slices e propaga o draft atualizado por contratos públicos.
- UI genérica reutilizável só entra em `shared/ui`; miniatura ou ação específica
  da revisão permanece no slice da feature.
- A execução seguirá a ordem `shared → entities → features → pages → app`, com
  barrels públicos e sem deep imports ou dependências horizontais.

## Casos de erro

- Arquivo privado ausente/corrompido mostra placeholder e erro localizado no item;
  os demais continuam revisáveis e nenhuma URI/path é exibida.
- Cancelar “Adicionar imagens” mantém lista, ordem e confirmação exatamente como
  estavam.
- Falha de cópia, falta de espaço ou erro SQLite durante adição remove artefatos
  novos e preserva integralmente o draft anterior.
- Falha de persistência ao remover, reordenar ou confirmar restaura visualmente o
  estado persistido e permite tentar novamente.
- Falha ao apagar arquivo depois do commit não reverte a edição válida; a
  reconciliação posterior remove o órfão sem tocar arquivos referenciados.
- Toques/gestos concorrentes durante uma mutação não geram posições repetidas,
  itens duplicados ou confirmação sobre estado antigo.

## Critérios de aceite

### AC-001 — Revisão visual privada

Um draft ativo aparece como lista virtualizada de miniaturas privadas na ordem
persistida, com posição e quantidade corretas, sem depender das URIs originais.

### AC-002 — Adição incremental e atômica

Adicionar imagens pelo picker acrescenta as escolhidas ao final e persiste o novo
lote; cancelamento ou falha preserva integralmente itens, ordem e confirmação
anteriores, sem arquivos parciais ativos.

### AC-003 — Remoção coordenada

Remover um item recompõe e persiste posições contíguas sem afetar os demais; ao
remover o último, o draft e seus arquivos deixam de existir e a tela retorna ao
estado inicial.

### AC-004 — Reordenação persistente

Mover itens por controle acessível ou gesto preserva IDs/arquivos, grava exatamente
a ordem escolhida sem posições duplicadas e a restaura após reabrir o aplicativo.

### AC-005 — Aviso não destrutivo de duplicidade

Itens considerados possíveis duplicatas recebem aviso localizado e identificável,
mas permanecem no lote e podem ser reordenados, removidos ou confirmados normalmente.

### AC-006 — Confirmação honesta e durável

Confirmar um lote não vazio persiste seu estado revisado; qualquer edição posterior
volta ao estado de revisão, e nenhuma ação de idioma/processamento é simulada.

### AC-007 — Resiliência e concorrência

Falhas e ações repetidas preservam o último estado persistido, não criam arquivos
órfãos ativos, duplicações ou posições inválidas e apresentam retry localizado sem
expor dados privados.

### AC-008 — Escala e memória limitada

Um draft com 100 imagens variadas continua rolável e operável usando lista
virtualizada e thumbnails dimensionadas, sem decodificar o lote inteiro em memória.

### AC-009 — Interface acessível e trilíngue

Preview, posição, duplicidade, adicionar, remover, mover, confirmar, estados e erros
possuem paridade pt-BR/en-US/es-ES, tokens de tema e semântica acessível completa.

### AC-010 — Upgrade local sem perda

Abrir uma instalação com schema v1 migra para v2 preservando draft, IDs, arquivos e
ordem; o lote existente inicia em revisão e continua editável.

### AC-011 — Preview ampliado privado

Tocar em qualquer miniatura abre somente sua imagem privada em modal proporcional,
com posição atual e fechamento por ação acessível ou back; fechar retorna à revisão
sem alterar ordem, confirmação ou arquivos e nenhum identificador privado é exibido.

### AC-012 — Grid padrão e scroll alternativo

A revisão inicia em grid virtualizado de duas colunas e permite alternar para
scroll vertical e voltar, preservando exatamente itens, ordem e ações. O modo ativo
é perceptível e acessível, não é persistido e não compromete a escala de 100 imagens.

## Estratégia de evidência

| Critério | Teste/evidência esperada                                                   |
| -------- | -------------------------------------------------------------------------- |
| AC-001   | RNTL da lista e integração que invalida a URI original                     |
| AC-002   | Controller/repositório/filesystem com sucesso, cancelamento e rollback     |
| AC-003   | Integração de remoção intermediária/última e limpeza/reconciliação         |
| AC-004   | Testes de reorder, unicidade/contiguidade e reload do SQLite               |
| AC-005   | RNTL do aviso e teste que prova ausência de bloqueio/remoção automática    |
| AC-006   | Testes de confirmação, reabertura após edição e ausência de CTA futuro     |
| AC-007   | Testes de erro/duplo toque, rollback, sanitização e reconciliação          |
| AC-008   | Teste de virtualização/thumbnail e execução física Android com 100 imagens |
| AC-009   | RNTL de labels/ações, paridade i18n, tema e auditoria de toque             |
| AC-010   | Teste de migração SQLite v1→v2 com draft real e schema novo limpo          |
| AC-011   | RNTL abrindo/fechando modal, imagem privada, posição e back                |
| AC-012   | RNTL do default grid, troca scroll↔grid e preservação da ordem             |

AC-008 exige execução em aparelho Android com lote de 100 imagens antes do status
`implemented`; código completo sem essa evidência usa `verification-pending`.

## Gate de implementação

- Estado: `open`
- Dependências: `MOB-FEAT-012`
- Motivo: o draft privado, picker, SQLite e arquivos duráveis necessários estão
  implementados e possuem evidência física; não há dependência remota.

## Fora de escopo

- Escolha de origem/destino, que permanece independente e pertence a
  `MOB-FEAT-014`.
- Validação de assinatura, formato, dimensão, corrupção ou texto
  (`MOB-FEAT-015`).
- OCR, tradução, upload, consentimento remoto, renderização, reader e progresso.
- Rotação automática por EXIF, edição/corte de imagem, PDF, câmera, URL import e
  browser integrado.
- Deduplicação exata obrigatória, remoção automática ou persistência de nome/URI
  original.
- Biblioteca final, múltiplos projetos, conta, sync, backup, analytics e Core.
- Persistência da preferência grid/scroll, zoom gestual, compartilhamento ou
  exportação pelo modal.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-08-14

Aprovação humana e ampliação de AC-011/AC-012 registradas por solicitação explícita;
a feature está liberada para planejamento e execução enquanto o gate permanecer
`open`.
