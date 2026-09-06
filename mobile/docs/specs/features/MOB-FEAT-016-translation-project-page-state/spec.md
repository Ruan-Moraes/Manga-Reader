---
id: MOB-FEAT-016
type: feature
title: Estado do projeto e das páginas de tradução
status: verification-pending
implementation_gate: open
blocked_by: [MOB-FEAT-013, MOB-FEAT-014, MOB-FEAT-015]
created: 2026-08-15
updated: 2026-08-15
supersedes: []
superseded_by: []
---

# MOB-FEAT-016 — Estado do projeto e das páginas de tradução

## Objetivo

Converter um draft local integralmente revisado, com idiomas confirmados e todas
as mídias válidas, em um projeto privado durável com páginas ordenadas, identidade
estável e máquina de estados persistível. A conversão prepara a fundação local do
pipeline sem iniciar rede, OCR, tradução ou renderização.

## Contexto e contratos relacionados

- Depende de `MOB-FEAT-013`, `MOB-FEAT-014` e `MOB-FEAT-015`: ordem, originais
  privados e validação segura estão implementados; `MOB-FEAT-014` voltou a
  `verification-pending` apenas pelo delta aprovado das variantes chinesas.
- Atende RF-INC-001 e fecha o `ARCHITECTURE_GAP` de projeto/página necessário
  para `MOB-FEAT-017..024`.
- Controla parte de RSK-007, RSK-008, RSK-021 e RSK-023 por identidade, estados,
  escrita recuperável e retomada local; não declara esses riscos mitigados antes
  do pipeline real.
- O estado de processamento é diferente de `mediaValidationStatus`: uma página
  validada vira página de projeto em `DRAFT`, não em `READY`.
- O projeto local não é `Chapter` de `MOB-FEAT-005`; não reutiliza status
  editorial, endpoints ou identidade da plataforma.
- O schema v6 aceita sete códigos/42 pares e bloqueia projeto `zh` legado até
  revisão explícita, conforme `MOB-FEAT-014`.
- `MOB-FEAT-017` consumirá projetos `DRAFT` e poderá realizar a primeira
  transição real para `QUEUED`, após consentimento e contrato remoto aprovados.

## Requisitos e regras

### Conversão do draft

- A ação **Preparar projeto** aparece somente quando o draft está pronto segundo
  a política corrente de `MOB-FEAT-015`: lote não vazio, ordem e idiomas
  confirmados e todas as páginas `VALID`.
- A conversão preserva identidade: `project.id = draft.id` e
  `translationPage.id = importItem.id`. A posição, o par linguístico, MIME real,
  dimensões, tamanho, instante e versão da validação são copiados como snapshot.
- O projeto e todas as páginas nascem em `DRAFT`. Nenhum timer, progresso,
  processamento ou resultado é simulado.
- O snapshot do projeto é imutável quanto a ordem, idiomas e arquivo original.
  Mudanças futuras exigem operação normativa própria, não edição silenciosa do
  draft já convertido.
- A criação é idempotente por `project.id`. Repetir a operação retorna o mesmo
  projeto se o snapshot persistido for equivalente; conteúdo divergente com o
  mesmo ID é conflito e não sobrescreve dados.
- Depois de o projeto estar durável, o draft de origem é consumido. Uma nova
  seleção cria outro draft sem remover projetos anteriores.

### Ownership e recuperação dos arquivos

- Originais do projeto ficam no namespace privado
  `translation-projects/{projectId}/{pageId}`. O projeto nunca referencia URI do
  picker nem depende do namespace temporário `local-media-imports`.
- A operação copia primeiro todos os originais para staging do projeto, promove
  o lote privado, persiste projeto/páginas em uma transação SQLite e somente
  depois remove metadados/arquivos do draft.
- Falha antes do commit do projeto preserva o draft e remove staging/cópias sem
  dono. Falha depois do commit nunca apaga o projeto; a inicialização reconhece o
  draft já convertido e conclui sua limpeza de forma idempotente.
- Reconciliação remove diretórios de projeto sem metadado e preserva todo
  diretório referenciado. Cache não é fonte de originais.
- Limpar dados offline remove projetos, páginas e arquivos coordenadamente pelo
  registry; nenhum arquivo é exportado ou incluído em backup por esta feature.

### Máquina de estados

- Estados canônicos de projeto e página:
  `DRAFT`, `QUEUED`, `PROCESSING`, `READY`, `FAILED`, `CANCELLED`.
- Transições base permitidas:
    - `DRAFT → QUEUED | CANCELLED`;
    - `QUEUED → PROCESSING | FAILED | CANCELLED`;
    - `PROCESSING → READY | FAILED | CANCELLED`;
    - `FAILED → QUEUED | CANCELLED`, reservada para retry explícito futuro;
    - `READY` e `CANCELLED` são terminais.
- MOB-FEAT-016 implementa e testa o contrato de transição, mas a única criação
  exposta ao usuário termina em `DRAFT`. Não há CTA para avançar estado sem a
  feature proprietária do processamento.
- Toda transição exige estado esperado e `updatedAt` esperado, rejeita escrita
  obsoleta e grava estado/timestamp juntos em transação.
- `READY` no projeto exige todas as páginas `READY`.
- Cancelar projeto torna `CANCELLED` todas as páginas ainda não terminais na
  mesma transação; páginas `READY` permanecem `READY` para preservar fato
  concluído. O comportamento de descarte de resultados pertence a spec futura.
- Falha de uma página não torna automaticamente o projeto `FAILED`. A semântica
  agregada de falha/retry será definida em `MOB-FEAT-024`.

### Leitura e interface local

- A página mostra resumo do projeto recém-preparado ou do projeto mais recente:
  quantidade de páginas, par linguístico e estado local.
- A tela comunica **Projeto preparado no aparelho** e que o processamento ainda
  não começou. Não exibe sucesso de tradução, porcentagem inventada, ETA ou CTA
  de leitor.
- A consulta `getLatest` usa ordem determinística por `updated_at DESC, id DESC`.
  Ela não constitui biblioteca, busca, paginação, rename ou exclusão; essas
  capacidades pertencem a `MOB-FEAT-025`.
- O usuário pode iniciar uma nova importação mesmo com projetos existentes. A
  UI da feature não bloqueia conta, sessão ou conectividade.
- Estados, mensagens e ações possuem paridade pt-BR/en-US/es-ES, tokens de tema,
  semântica acessível e busy/disabled contra toques repetidos.

### Privacidade e observabilidade

- A feature é integralmente local e funciona offline. Não importa o cliente HTTP,
  não acessa Core e não envia mídia, metadados ou estado.
- Erros visíveis são estáveis e localizados: `prerequisite-required`,
  `stale-draft`, `file-copy-failed`, `storage-unavailable` e
  `project-conflict`.
- Mensagens e logs não contêm URI, path, filename privado, bytes ou conteúdo. IDs
  internos, posição, estado e código de erro são a allowlist máxima.

## Plano de persistência local

### 🗄️ Banco escolhido

SQLite privado já usado pelo mobile. Projeto, páginas e transições exigem
integridade relacional e transações locais; PostgreSQL, MongoDB, Core e JSON não
participam.

### 📐 Modelo em BCNF

`translation_projects`:

- `id TEXT PRIMARY KEY NOT NULL`;
- `source_language TEXT NOT NULL`;
- `target_language TEXT NOT NULL`;
- `status TEXT NOT NULL DEFAULT 'DRAFT'`;
- `created_at INTEGER NOT NULL`;
- `updated_at INTEGER NOT NULL`;
- `status_updated_at INTEGER NOT NULL`.

Dependência funcional: `id → idiomas, status, timestamps`; `id` é chave
candidata. Não há `page_count`, progresso ou status agregado em cache.

`translation_pages`:

- `id TEXT PRIMARY KEY NOT NULL`;
- `project_id TEXT NOT NULL`;
- `position INTEGER NOT NULL`;
- `original_filename TEXT NOT NULL`;
- `original_byte_size INTEGER NOT NULL`;
- `original_mime_type TEXT NOT NULL`;
- `width_px INTEGER NOT NULL`;
- `height_px INTEGER NOT NULL`;
- `media_validated_at INTEGER NOT NULL`;
- `media_validation_policy_version INTEGER NOT NULL`;
- `status TEXT NOT NULL DEFAULT 'DRAFT'`;
- `created_at INTEGER NOT NULL`;
- `updated_at INTEGER NOT NULL`;
- `status_updated_at INTEGER NOT NULL`.

Dependências funcionais: `id → atributos da página`; e
`(project_id, position) → página`. Ambas são chaves candidatas. O nome do arquivo
é único dentro do projeto. Dados de validação são snapshot deliberado do original
copiado; não dependem de tabela removível do draft.

Projeto e página são tabelas separadas porque idioma/lifecycle do projeto e
posição/arquivo/lifecycle da página têm determinantes diferentes. Regiões,
resultados e attempts não são JSON nem colunas antecipadas: specs posteriores
criarão tabelas próprias quando seus contratos existirem.

### 🔗 Integridade

- `translation_pages.project_id → translation_projects.id ON DELETE CASCADE`.
- `UNIQUE (project_id, position)` e
  `UNIQUE (project_id, original_filename)`.
- `position >= 0`, bytes/dimensões/instantes/versão positivos.
- O CHECK v6 usa os sete códigos e `source_language <> target_language`, sem
  promover `zh` legado como escolha confirmada.
- Status de ambas as tabelas usa CHECK nos seis valores canônicos.
- Timestamps satisfazem `updated_at >= created_at` e
  `status_updated_at BETWEEN created_at AND updated_at`.
- Projeto exige ao menos uma página na operação de criação. SQLite não expressa
  essa cardinalidade por CHECK cross-table; repository e transação a garantem e
  os testes provam rollback integral.

### ⚡ Índices

- A UNIQUE `(project_id, position)` cobre leitura ordenada e FK por
  `project_id`; não criar índice isolado redundante.
- `idx_translation_projects_latest(updated_at DESC, id DESC)` atende `getLatest`.
- Não indexar status nesta fase: baixa cardinalidade e nenhuma consulta por
  status foi aprovada.

### 🧮 Derivados

Quantidade de páginas e prontidão são calculadas das páginas carregadas. Não há
contador, porcentagem ou job de reconciliação.

### 🛠️ Migração e código

- Schema local `v4 → v5`, forward-only e atômico, cria as duas tabelas,
  constraints e índice; dados v4 permanecem intactos.
- `user_version` passa a avançar monotonicamente por helper genérico em
  `shared/storage`; inicializar um repository antigo nunca pode rebaixar v5 para
  v4.
- Mudança coordenada: helper/migration, entities, repository, conversão,
  namespace de arquivos, registry, page, i18n, coverage e testes de instalação
  limpa, upgrade v4→v5, FK, constraints, rollback e recovery.

## Arquitetura FSD planejada

```text
shared/storage + shared/files + shared/ui + shared/i18n
  → entities/local-media-import (@x controlada para idioma/snapshot)
  → entities/translation-page
  → entities/translation-project
    → features/create-translation-project
      → pages/offline-translation
        → src/app/offline-translation.tsx
```

- `translation-page` contém o modelo e a política pura de transição da página.
- `translation-project` contém o agregado, repository SQLite e leitura do projeto;
  referências entre entities usam API `@x` explícita, sem deep import.
- `create-translation-project` é a ação do usuário: coordena draft, projeto e
  arquivos por APIs públicas, sem importar outra feature.
- A page compõe import/review/idioma/validação/conversão e resumo via props. Não
  surge widget até existir bloco reutilizado entre rotas.
- A execução futura segue `shared → entities → features → pages → application`,
  com barrels públicos e boundaries automatizadas.

## Casos de erro

- Draft ausente, vazio, não confirmado, idioma inválido ou página não validada
  impede criação sem mutação.
- Arquivo privado ausente/alterado durante a cópia interrompe a operação, preserva
  draft/projeto anterior e remove staging.
- Falha SQLite após promover arquivos remove cópia sem metadado; se o processo
  morrer, a reconciliação faz a mesma limpeza no próximo início.
- Commit de projeto seguido de encerramento antes de limpar draft é retomado de
  forma idempotente, sem duplicar projeto ou arquivo.
- Duplo toque compartilha uma operação. Draft editado em concorrência falha por
  `updatedAt` obsoleto.
- ID existente com snapshot diferente retorna conflito; nunca faz upsert
  destrutivo.
- Estado desconhecido, transição ilegal ou tentativa de sair de terminal é
  rejeitada sem atualização parcial.

## Critérios de aceite

### AC-001 — Pré-condições verdadeiras

Somente draft não vazio, ordem/idiomas confirmados e todas as páginas válidas na
política corrente pode ser convertido; qualquer divergência preserva o estado.

### AC-002 — Identidade e snapshot estáveis

Projeto/páginas preservam IDs, ordem, par linguístico e metadados validados sem
depender do draft após conversão.

### AC-003 — Originais privados com ownership próprio

Todos os originais são copiados para o namespace do projeto antes do commit; uma
nova importação ou limpeza do draft não remove arquivos referenciados pelo
projeto.

### AC-004 — Criação atômica e recuperável

Falhas antes/depois do commit e encerramento intermediário preservam ao menos um
estado completo recuperável, sem perda, projeto parcial ou duplicação.

### AC-005 — Persistência relacional v5

Schema limpo e upgrade v4→v5 preservam dados, aplicam FK/CHECK/UNIQUE e nunca
rebaixam `user_version` quando repositories inicializam em ordens diferentes.

### AC-006 — Estados canônicos e transições válidas

Projeto e página aceitam apenas os seis estados e transições permitidas, com
estado esperado, timestamps monotônicos e terminais protegidos.

### AC-007 — Consistência projeto/páginas

Projeto `READY` exige todas as páginas `READY`; cancelamento atualiza páginas não
terminais atomicamente e falha localizada não destrói páginas concluídas.

### AC-008 — Idempotência e concorrência

Repetição/duplo toque retorna o mesmo projeto equivalente; snapshot conflitante,
draft obsoleto ou escrita concorrente falha sem sobrescrever estado seguro.

### AC-009 — Retomada e consulta local

Após encerrar/reabrir, o projeto mais recente, suas páginas ordenadas e estados
são restaurados deterministicamente sem rede ou login.

### AC-010 — UX honesta e trilíngue

CTA, busy, erros e resumo possuem acessibilidade e paridade pt-BR/en-US/es-ES;
sucesso comunica projeto local preparado, nunca tradução/processamento concluído.

### AC-011 — Privacidade e isolamento

Conversão e leitura usam apenas SQLite/filesystem privados, sem HTTP/Core, e não
expõem URI, path, filename, bytes ou conteúdo em UI/logs.

### AC-012 — Escopo incremental preservado

A feature termina com projeto/páginas `DRAFT`, sem OCR, gateway, consentimento,
attempt, progresso fictício, reader, biblioteca ou transição remota exposta.

## Estratégia de evidência

| Critério | Teste/evidência esperada                                                           |
| -------- | ---------------------------------------------------------------------------------- |
| AC-001   | Matriz de readiness incluindo política desatualizada e draft concorrente           |
| AC-002   | Repository round-trip de IDs, ordem, idiomas e snapshot                            |
| AC-003   | Integração de cópia, substituição posterior do draft e reconciliação de namespaces |
| AC-004   | Fault injection antes/depois de file promotion/commit/cleanup e restart            |
| AC-005   | SQLite limpo, v4→v5, constraints, FK check e ordens distintas de initialize        |
| AC-006   | Tabela completa de transições válidas/inválidas para projeto e página              |
| AC-007   | Transações READY/cancelamento com lote misto e rollback                            |
| AC-008   | Duplo toque, idempotência equivalente, conflito e optimistic concurrency           |
| AC-009   | Reload/getLatest determinístico após encerramento simulado                         |
| AC-010   | RNTL nos três locales, estados acessíveis, loading, erro e sucesso honesto         |
| AC-011   | HTTP mock vazio, allowlist de mensagens e inspeção de imports                      |
| AC-012   | Ausência de rede/OCR/resultado/reader e páginas criadas exclusivamente em DRAFT    |

## Gate de implementação

- Estado: `open`
- Dependências: `MOB-FEAT-013`, `MOB-FEAT-014`, `MOB-FEAT-015`
- Motivo: revisão, idiomas, validação, arquivos privados e SQLite estão
  implementados. A criação local do projeto não depende do contrato remoto.

## Fora de escopo

- Consentimento, rede, gateway, job remoto, polling/stream, idempotência
  server-side ou provider.
- OCR, texto, regiões, ordem de leitura, tradução, renderização ou arquivo final.
- Scheduler incremental, prioridade de leitura, porcentagem, ETA, retry remoto ou
  consumo/quota.
- Reader, biblioteca completa, rename, busca, paginação, exclusão individual,
  compartilhamento, export, sync, backup ou conta.
- Attempts e erros por etapa; os contratos agora estão aprovados em
  `MOB-FEAT-017..021`, mas permanecem fora desta implementação histórica.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-08-15

Implementação autorizada explicitamente pelo aprovador após revisão da Target
Spec e confirmação do gate técnico aberto.
