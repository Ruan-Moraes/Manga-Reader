---
id: MOB-FEAT-015
type: feature
title: Validação de mídia local
status: verification-pending
implementation_gate: open
blocked_by: [MOB-FEAT-012, MOB-FEAT-013, MOB-FEAT-014]
created: 2026-08-14
updated: 2026-08-15
supersedes: []
superseded_by: []
---

# MOB-FEAT-015 — Validação de mídia local

## Objetivo

Validar localmente cada imagem privada de um draft antes de qualquer envio ou
processamento, usando os bytes reais para identificar formato, integridade e
dimensões seguras, persistindo resultados por página e permitindo que falhas
localizadas sejam corrigidas sem perder páginas válidas.

## Contexto e contratos relacionados

- Depende de `MOB-FEAT-012`, `MOB-FEAT-013` e `MOB-FEAT-014`, todas
  `implemented`: arquivos privados duráveis, revisão/ordenação e idiomas
  confirmáveis já existem.
- Atende RF-VAL-001..005 e RF-SEC-005..008 do mapa informativo, além do gate de
  validação de entrada privada entre M2 e M3.
- Controla RSK-010 (memória com imagens grandes) e RSK-024 (página sem texto não
  pode virar falha). Também reforça RSK-009 ao validar somente a cópia privada,
  nunca a URI transitória do picker.
- `mimeHint` permanece apenas metadado não confiável do sistema. O formato
  canônico deriva da assinatura real e não de extensão, nome ou MIME declarado.
- `MOB-FEAT-016` poderá consumir somente páginas `VALID`; esta feature não cria
  projeto de tradução nem máquina de processamento.
- Segue `MOB-DEC-002` para evidência baseada em risco e `MOB-DEC-004` para a app
  layer FSD.

## Requisitos e regras

### Formatos iniciais

- O conjunto aceito é JPEG estático (`image/jpeg`), PNG estático (`image/png`)
  e WebP estático (`image/webp`).
- GIF, APNG animado, WebP animado, HEIC/HEIF, AVIF, SVG, PDF, vídeo e formatos
  desconhecidos são rejeitados com mensagem localizada. Suporte futuro exige
  nova spec e evidência do pipeline real.
- A identificação usa assinaturas e estrutura mínima:
    - JPEG: marcadores SOI/SOF e encerramento estrutural compatível;
    - PNG: assinatura, IHDR válido e IEND;
    - WebP: contêiner RIFF/WEBP, tamanho coerente e chunk estático reconhecido.
- Divergência entre `mimeHint` e assinatura não invalida uma imagem decodificável:
  o MIME detectado vence, fica persistido e a interface não expõe detalhes
  técnicos desnecessários.

### Limites de segurança locais

- A política inicial versionada usa os seguintes limites por página:
    - tamanho maior que zero e no máximo 25 MiB (`26_214_400` bytes);
    - largura e altura entre 1 e 16.384 pixels;
    - no máximo 40.000.000 pixels (`width × height`).
- Esses valores são limites defensivos do dispositivo, não critérios de OCR,
  qualidade, provider, preço, latência ou SLO. Toda alteração exige atualização
  de spec, versão da política e revalidação explícita.
- Tamanho é lido novamente do arquivo privado. Divergência com `byteSize`
  persistido é tratada como arquivo alterado/corrompido, sem confiar no valor do
  draft.
- A inspeção lê somente prefixos, headers/chunks necessários e cauda limitada;
  não converte o arquivo inteiro em Base64 nem mantém várias imagens decodificadas
  simultaneamente.
- Antes de decode nativo, tamanho e dimensões declaradas no formato passam pelos
  limites. O decode de verificação usa dimensão de trabalho limitada e libera a
  referência antes de avançar para a próxima página.

### Resultado por página

- Cada item possui `PENDING`, `VALID` ou `INVALID` e uma versão da política.
- `VALID` exige formato detectado, largura, altura e instante de validação.
- `INVALID` exige um código estável entre:
  `MISSING_FILE`, `EMPTY_FILE`, `FILE_CHANGED`, `UNSUPPORTED_FORMAT`,
  `CORRUPTED` ou `DIMENSIONS_UNSAFE`.
- Falha operacional transitória de filesystem/decode não sobrescreve um
  resultado seguro anterior; a ação termina com erro localizado e permite retry.
- Uma página inválida não apaga, reordena nem invalida resultados das demais.
  O usuário pode abrir seu preview, removê-la ou adicionar substituta pelas ações
  já existentes.
- A validação processa sequencialmente apenas itens `PENDING`, `INVALID` ou com
  versão de política desatualizada. Uma ação explícita permite revalidar todos.
- Um draft está pronto para a próxima etapa somente quando é não vazio, ordem e
  idiomas estão confirmados e todos os itens estão `VALID` na política corrente.
  A prontidão é derivada; não cria coluna, contador ou sucesso de processamento.

### Ciclo de edição

- Importação ou substituição cria todos os itens como `PENDING`.
- Adicionar páginas preserva resultados das existentes e cria somente as novas
  como `PENDING`.
- Remover página remove seu resultado junto com o item.
- Reordenar preserva os resultados porque não altera os bytes.
- Alterar idiomas preserva resultados porque validação de mídia não depende do
  par linguístico.
- Como edição de páginas já limpa confirmações de ordem/idiomas, o painel de
  validação volta a ficar indisponível até essas etapas serem confirmadas; os
  resultados seguros continuam persistidos.

### Interface e privacidade

- O painel aparece depois da confirmação dos idiomas e mostra progresso local,
  quantidade válida/inválida/pendente, ação de validar/revalidar e resultado por
  página no contexto da lista existente.
- A composição usa slot/render prop na revisão: a feature de validação não
  importa outras features. A page coordena os slices.
- Estados e ações têm paridade pt-BR/en-US/es-ES, tokens de tema, labels
  acessíveis, estado busy/disabled e área de toque do design system.
- A validação funciona sem login e sem rede. Não faz HTTP, upload, OCR, detecção
  de idioma, analytics de conteúdo ou leitura de URI original.
- Logs e mensagens podem conter apenas ID interno, posição, código de erro,
  formato e dimensões; nunca bytes, imagem, texto, URI, path ou nome privado.

## Plano de persistência local

### 🗄️ Banco escolhido

SQLite privado já adotado pelo draft. O resultado pertence à cópia local da
página, precisa sobreviver ao reinício e deve ser removido atomicamente com o
item. PostgreSQL, MongoDB, Core e JSON não participam.

### 📐 Modelo em BCNF

`local_media_import_items` recebe:

- `media_validation_status TEXT NOT NULL DEFAULT 'PENDING'`;
- `media_validation_error TEXT NULL`;
- `detected_mime_type TEXT NULL`;
- `width_px INTEGER NULL`;
- `height_px INTEGER NULL`;
- `validated_at INTEGER NULL`, epoch ms;
- `validation_policy_version INTEGER NULL`.

Dependências funcionais: `item.id → atributos do item e resultado`. `id` é chave
candidata; `(draft_id, position)` continua chave candidata da ordem corrente.
Não existe tabela de formatos ou erros porque os conjuntos são fechados,
versionados e não possuem atributos próprios. A prontidão do draft é derivada
dos itens e das confirmações já existentes, evitando cache desnormalizado.

### 🔗 Integridade

- `media_validation_status` possui `CHECK` em
  `('PENDING', 'VALID', 'INVALID')`.
- `media_validation_error` possui `CHECK` nullable nos seis códigos definidos.
- `detected_mime_type` possui `CHECK` nullable em
  `('image/jpeg', 'image/png', 'image/webp')`.
- `width_px`, `height_px`, `validated_at` e `validation_policy_version`, quando
  presentes, são positivos.
- Constraint composta:
    - `PENDING`: campos de resultado são nulos;
    - `VALID`: erro nulo e MIME/dimensões/instante/versão não nulos;
    - `INVALID`: erro/instante/versão não nulos; MIME/dimensões podem existir
      somente quando descobertos antes da falha.
- A FK existente `items.draft_id → drafts.id ON DELETE CASCADE` permanece e é
  validada após migração.

### ⚡ Índices

Nenhum índice novo. A consulta de validação carrega os itens pela chave única
existente `(draft_id, position)`, cujo prefixo cobre `draft_id`; índices isolados
para status de baixa cardinalidade seriam redundantes no único draft ativo.

### 🧮 Derivados

Contagens de status e prontidão são calculadas da lista carregada. Não há
contador persistido, hash, cache ou job de reconciliação.

### 🛠️ Migração e código

- Migração local `v3 → v4`, forward-only e atômica, recria a tabela de itens com
  as novas constraints, copia todos os itens como `PENDING`, preserva IDs,
  `draft_id`, posição, filename privado, tamanho, MIME hint e timestamps, recompõe
  a FK e executa `foreign_key_check` antes de gravar `user_version = 4`.
- Instalação nova cria diretamente schema v4.
- Mudança coordenada: migrator/repository/model de
  `entities/local-media-import`, adapter binário em `shared/media-inspection`,
  feature, page, i18n, coverage e testes de schema limpo, upgrade e rollback.

## Arquitetura FSD planejada

```text
shared/files + shared/media-inspection + shared/ui + shared/i18n
  → entities/local-media-import
    → features/validate-local-media
      → pages/offline-translation
        → src/app/offline-translation.tsx
```

- `shared/media-inspection` conhece bytes, assinaturas e decode genérico, mas não
  conhece drafts, páginas ou tradução.
- `entities/local-media-import` contém status/códigos persistíveis, readiness
  derivada e operações atômicas de resultado por item.
- `features/validate-local-media` implementa a ação sequencial, concorrência,
  retry, progresso e UI específica.
- `pages/offline-translation` compõe importação, revisão, idiomas e validação por
  props/slots; nenhum slice de feature importa outro.
- A execução futura seguirá `shared → entities → features → pages → app`, com
  barrels públicos e sem deep imports.

## Casos de erro

- Arquivo ausente, vazio, alterado, formato não suportado, estrutura corrompida
  ou dimensões inseguras geram `INVALID` somente para a página correspondente.
- MIME hint ausente ou divergente não é falha quando os bytes formam imagem
  aceita e decodificável.
- Falha de I/O inesperada, encerramento do app ou erro de persistência mantém o
  último estado transacional seguro; itens ainda não concluídos permanecem
  pendentes e retry não repete páginas válidas na política atual.
- Toques repetidos compartilham uma única execução. Remoção/reordenação
  concorrente torna o draft antigo obsoleto e impede commit sobre item inexistente.
- Imagem estática sem texto, balão ou região é mídia válida; esta etapa não usa
  conteúdo semântico como critério.

## Critérios de aceite

### AC-001 — Formato pelos bytes reais

JPEG, PNG e WebP estáticos válidos são reconhecidos pela assinatura/estrutura e
persistem MIME canônico mesmo com hint ausente ou divergente; formatos fora do
conjunto e animações são rejeitados por página.

### AC-002 — Limites antes do decode

Tamanho e dimensões reais respeitam a política v1 (25 MiB, lado máximo 16.384 e
40 MP), com testes nas fronteiras; itens fora dela ficam inválidos sem decode
integral ou alocação desnecessária.

### AC-003 — Corrupção e ausência localizadas

Arquivo ausente, vazio, alterado ou estruturalmente/visualmente indecodificável
recebe código localizado estável, sem apagar/reordenar páginas nem vazar dados.

### AC-004 — Resultado durável por página

Status, erro, MIME, dimensões, instante e versão válidos sobrevivem ao reinício;
constraints rejeitam combinações impossíveis e a migração v3→v4 preserva todo o
draft existente como `PENDING`.

### AC-005 — Falha parcial e correção

Em lote misto, páginas válidas permanecem válidas e inválidas ficam identificadas
individualmente; remoção/substituição permite continuar sem reimportar o lote.

### AC-006 — Edição preserva somente o que continua verdadeiro

Adicionar, remover, reordenar e alterar idiomas produzem exatamente as
preservações/invalidações definidas, sem associar resultado ao item ou posição
errados.

### AC-007 — Página sem texto é válida

Uma imagem aceita e decodificável sem texto detectável passa na validação de
mídia, sem OCR, heurística de balão ou mensagem de falha semântica.

### AC-008 — Memória e execução sequencial

Headers são lidos de forma limitada, imagens são verificadas uma por vez e
referências nativas são liberadas; profiling Android com lote misto e imagem nos
limites não apresenta travamento, ANR ou crescimento contínuo de memória.

### AC-009 — UX acessível e trilíngue

Progresso, resumo, resultados por página, ações e erros possuem paridade
pt-BR/en-US/es-ES, tokens e semântica acessível, permanecendo operáveis no
grid e scroll em tela compacta.

### AC-010 — Privacidade e isolamento

Todo o fluxo lê apenas arquivos privados, funciona guest/offline, não realiza
HTTP/Core/upload e não registra URI, path, nome, bytes ou conteúdo.

### AC-011 — Concorrência, interrupção e retry

Duplo toque, falha transitória, persistência interrompida ou draft concorrente
preservam o último resultado consistente; retry continua dos itens necessários
sem revalidar silenciosamente os já válidos.

### AC-012 — Prontidão honesta

Somente draft não vazio, com ordem/idiomas confirmados e todos os itens válidos
na política corrente é apresentado como pronto para a próxima etapa, sem CTA,
navegação ou sucesso fictício de OCR/tradução.

## Estratégia de evidência

| Critério | Teste/evidência esperada                                                                         |
| -------- | ------------------------------------------------------------------------------------------------ |
| AC-001   | Fixtures binárias mínimas de assinaturas/estruturas, animação e hints divergentes                |
| AC-002   | Unitários de política/fronteiras e spy provando rejeição anterior ao decode                      |
| AC-003   | Arquivos truncados/ausentes/alterados + repository/RNTL de erro por página                       |
| AC-004   | SQLite v3→v4/schema v4/constraints/FK/reload/rollback                                            |
| AC-005   | Integração de lote misto, remoção e adição de substituta                                         |
| AC-006   | Repository/integração de append/remove/reorder/language preservando identidade                   |
| AC-007   | Fixture autorizada arte-only decodificável sem qualquer detector de texto                        |
| AC-008   | Teste de leitura limitada/sequencial e profiling em Android modesto                              |
| AC-009   | RNTL nos três locales, grid/scroll, progresso, erro, toque e tela compacta                       |
| AC-010   | Integração offline com HTTP mock vazio e inspeção de mensagens/logs                              |
| AC-011   | Testes de duplo toque, interrupção, stale draft, falha transacional e retry seletivo             |
| AC-012   | Teste de readiness para matriz de confirmações/status e ausência de processamento/navegação fake |

AC-008 exige profiling real em Android antes de `implemented`; código completo
sem essa evidência usa `verification-pending`.

## Gate de implementação

- Estado: `open`
- Dependências: `MOB-FEAT-012`, `MOB-FEAT-013`, `MOB-FEAT-014`
- Motivo: arquivos privados, revisão, idiomas, SQLite e evidências físicas das
  etapas anteriores estão implementados; validação local não depende de provider
  remoto.

## Fora de escopo

- OCR, detecção automática de idioma, texto/regiões/balões ou avaliação de
  legibilidade/qualidade artística.
- Consentimento, gateway, upload, tradução, renderização, progresso remoto,
  reader, custo, quota, conta ou Core.
- Correção, compressão, resize, rotação EXIF, crop, conversão ou recuperação de
  arquivo corrompido.
- GIF/APNG/WebP animado, HEIC/HEIF, AVIF, SVG, PDF, câmera, URL e webtoon longo.
- Hash/deduplicação obrigatória, antivírus, moderação, copyright ou classificação
  de conteúdo.
- Limites de provider, critérios de OCR/tradução, latência ou SLO.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-08-15

Aprovação humana registrada por solicitação explícita; a feature está liberada
para planejamento e execução enquanto o gate permanecer `open`.
