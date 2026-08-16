---
id: MOB-FEAT-014
type: feature
title: Seleção de idiomas da tradução
status: implemented
implementation_gate: open
blocked_by: [MOB-FEAT-013]
created: 2026-08-14
updated: 2026-08-15
supersedes: []
superseded_by: []
---

# MOB-FEAT-014 — Seleção de idiomas da tradução

## Objetivo

Permitir que uma pessoa escolha e confirme, sem login, os idiomas de origem e
destino de um draft revisado como decisões independentes, locais e duráveis,
preparando o lote para validação e processamento futuros sem simular OCR,
detecção automática ou tradução.

## Contexto e contratos relacionados

- Depende de `MOB-FEAT-013`, que está `implemented` e fornece draft privado,
  ordenado, confirmável e persistido em SQLite.
- Atende RF-LNG-001/002 e UX-LNG-001..004 do mapa informativo de requisitos,
  reconciliados com a decisão explícita de produto de não limitar a origem a
  japonês nem o destino a português.
- `MOB-FEAT-003` controla somente o idioma da interface e `Accept-Language`.
  `MOB-FEAT-004` controla somente idiomas de conteúdo da plataforma. Nenhum dos
  dois contratos é reutilizado como preferência de tradução.
- A seleção persistida será consumida futuramente por `MOB-FEAT-016` e validada
  contra capacidades reais de OCR/gateway em `MOB-FEAT-017..019`; esta feature
  não afirma disponibilidade de provider.
- Segue `MOB-DEC-002` para evidência baseada em risco e `MOB-DEC-004` para o
  mapeamento da app layer no FSD.

## Requisitos e regras

- A seleção aparece no fluxo público `/offline-translation` somente para um
  draft não vazio cuja revisão de ordem esteja confirmada.
- Origem e destino são campos separados. Alterar um nunca altera, troca ou
  redefine silenciosamente o outro.
- O conjunto inicial selecionável é exatamente:
    - japonês (`ja`);
    - inglês (`en`);
    - espanhol (`es`);
    - coreano (`ko`);
    - chinês simplificado (`zh-Hans`);
    - chinês tradicional (`zh-Hant`);
    - português brasileiro (`pt-BR`).
- Qualquer par direcionado com idiomas diferentes é válido, totalizando 42
  combinações. Isso inclui JA → PT-BR, EN → PT-BR, ES → EN e seus demais pares;
  nenhum desses exemplos se torna default obrigatório ou restrição global.
- Chinês simplificado e tradicional são escolhas explícitas. Alterar entre
  `zh-Hans` e `zh-Hant` nunca ocorre por detecção ou fallback silencioso.
- Um draft novo ou migrado recebe apenas a sugestão editável JA → PT-BR.
  Português brasileiro aparece com prioridade visual no seletor de destino, sem
  impedir que seja usado como origem nem que outro destino seja escolhido.
- A sugestão de origem é estática e explicitamente editável. A interface não
  deve alegar que analisou ou detectou o idioma da imagem enquanto a detecção
  real estiver fora de escopo.
- Origem igual ao destino permanece visível como estado inválido: a interface
  explica o problema, desabilita a confirmação e não persiste uma confirmação
  inválida. A escolha de um campo não corrige o outro automaticamente.
- Cada alteração válida de campo é persistida atomicamente no draft ativo,
  atualiza `updatedAt` e limpa a confirmação anterior dos idiomas. Fechar,
  remover o app dos recentes e reabrir restaura exatamente as duas escolhas.
- “Confirmar idiomas” exige revisão de ordem confirmada, draft não vazio, valores
  pertencentes ao conjunto inicial e origem diferente do destino. A confirmação
  persiste um instante próprio e apresenta estado honesto, sem navegar ou exibir
  sucesso de validação, OCR, upload ou tradução ainda inexistentes.
- Alterar qualquer idioma após confirmar mantém o outro valor, limpa somente a
  confirmação de idiomas e exige confirmação explícita novamente.
- Adicionar, remover ou reordenar páginas preserva as escolhas de idioma, mas
  limpa tanto a confirmação da revisão quanto a confirmação dos idiomas. A
  seleção volta a ficar indisponível até a nova ordem ser confirmada.
- Enquanto uma gravação está em andamento, ações conflitantes ficam
  indisponíveis. Toques repetidos não produzem estado parcial, confirmação com
  par antigo ou divergência entre memória e SQLite.
- Falhas restauram o último draft persistido e exibem erro localizado com retry.
  Logs e mensagens não incluem imagem, URI, path, nome privado ou conteúdo.
- Labels de idioma são localizados conforme o idioma da interface, mas os códigos
  canônicos persistidos não mudam com a UI. Textos existem em pt-BR, en-US e
  es-ES; controles usam tokens, estado selecionado/disabled/erro perceptível,
  labels acessíveis e alvo mínimo do design system.
- A tela comum não expõe provider, modelo, OCR, prompt, preço, quota nem opções
  técnicas de processamento.

## Plano de persistência local

### 🗄️ Banco escolhido

SQLite privado já adotado por `MOB-FEAT-012/013`. Idiomas e confirmações pertencem
ao mesmo draft ativo e precisam ser atualizados atomicamente com seu estado
local. Não há motivo para Postgres, Mongo, Core ou armazenamento JSON.

### 📐 Modelo em BCNF

`local_media_import_drafts` recebe:

- `source_language TEXT NOT NULL DEFAULT 'ja'`;
- `target_language TEXT NOT NULL DEFAULT 'pt-BR'`;
- `languages_confirmed_at INTEGER NULL`, epoch ms.

Na migration global v6, `translation_projects` também recebe
`language_review_required INTEGER NOT NULL DEFAULT 0 CHECK
(language_review_required IN (0, 1))`. O campo não duplica o status do projeto:
ele registra exclusivamente a decisão humana ainda pendente para valores
legados ambíguos de chinês.

As dependências funcionais continuam `id → atributos` e `slot → id`; `id` e
`slot` são chaves candidatas. Os idiomas são propriedades independentes do draft,
não uma lista, entidade compartilhada ou preferência global. Não há
desnormalização nova.

### 🔗 Integridade

- `source_language` e `target_language` possuem `CHECK` limitado a
  `('ja', 'en', 'es', 'ko', 'zh-Hans', 'zh-Hant', 'pt-BR')`.
- Um `CHECK (source_language <> target_language)` impede par sem tradução também
  fora da UI.
- `languages_confirmed_at` é nullable; `NULL` significa “seleção ainda não
  confirmada” e evita coluna de status redundante.
- O repositório só grava `languages_confirmed_at` quando existe ao menos um item,
  `confirmed_at` da revisão não é nulo e o par passa pelas constraints.
- Edições de páginas preservam as duas colunas de idioma e gravam
  `confirmed_at = NULL, languages_confirmed_at = NULL` na mesma transação.

### ⚡ Índices

Nenhum índice novo. O app consulta idiomas apenas pela PK/`slot` do único draft
ativo; indexar colunas de sete valores ou timestamps sem predicado seria
redundante e sem caso de leitura.

### 🧮 Derivados

Labels, lista de 42 pares, validade do par e estado visual são derivados dos
códigos canônicos. Não há tabela de pares, contador, cache ou enum duplicado no
banco. O conjunto canônico fica no modelo de domínio e é espelhado pelos `CHECK`.

### 🛠️ Migração e código

- A implementação original `v2 → v3` permanece evidência histórica. A evolução
  aprovada entra na migration global SQLite v6: rebuild dos checks, `zh` legado
  mapeado provisoriamente para `zh-Hans` e confirmação limpa para exigir escolha
  consciente da variante. Projetos legados com `zh` recebem
  `language_review_required = 1` e não podem iniciar processamento até uma
  escolha explícita zerar o marcador.
- Instalação nova nasce diretamente com os sete códigos.
- Mudança coordenada: migrator SQLite, tipos e repository de
  `entities/local-media-import`, feature de seleção, page, i18n, coverage e testes
  de instalação limpa, upgrade, rollback e reload.

## Arquitetura FSD planejada

```text
shared/storage + shared/ui + shared/i18n
  → entities/local-media-import
    → features/select-translation-languages
      → pages/offline-translation
        → app/offline-translation.tsx
```

- `entities/local-media-import` expõe códigos, par, timestamps e operações
  persistíveis do draft por sua API pública.
- `features/select-translation-languages` contém seleção, validação da ação,
  confirmação, estado de erro/retry e UI específica.
- A nova feature não importa `features/review-local-media-import`,
  `features/manage-settings` nem `features/manage-content-languages`; a page
  recebe o draft atualizado e compõe os slices sem acoplamento horizontal.
- Nenhuma primitive genérica nova é criada em `shared/ui` sem reuso demonstrado.
- A execução futura seguirá `shared → entities → features → pages → app`, com
  barrels públicos e sem deep imports.

## Casos de erro

- Draft ausente, vazio ou revisão não confirmada não permite confirmar idiomas.
- Código persistido fora do conjunto suportado é tratado como dado inválido: a
  migração/repository não o promove silenciosamente e a UI oferece recuperação
  para a sugestão JA → PT-BR sem alegar seleção confirmada.
- Origem igual ao destino produz validação localizada e não grava confirmação.
- Falha SQLite ao alterar ou confirmar restaura o último par persistido, mantém o
  draft e suas imagens intactos e permite retry.
- Mudança concorrente do draft invalida a operação baseada em estado antigo; não
  confirma idiomas para ordem não confirmada.
- Toques repetidos durante gravação não duplicam operações nem alternam um campo
  implicitamente.

## Critérios de aceite

### AC-001 — Seleções independentes e matriz inicial

Um draft revisado permite escolher separadamente origem e destino entre `ja`,
`en`, `es`, `ko`, `zh-Hans`, `zh-Hant` e `pt-BR`; os 42 pares direcionais diferentes podem
ser confirmados sem que a alteração de um campo modifique o outro.

### AC-002 — Sugestão inicial honesta e PT-BR prioritário

Drafts novos ou migrados apresentam JA → PT-BR como sugestão editável, destacam
PT-BR entre os destinos e não alegam detecção automática nem restringem outras
combinações.

### AC-003 — Persistência independente e retomada

Alterações válidas de origem/destino persistem códigos canônicos independentes e,
após fechar e reabrir o aplicativo, o mesmo par é restaurado sem depender do
idioma da interface, da conta ou da rede.

### AC-004 — Validação do par

Origem igual ao destino ou código fora do conjunto inicial bloqueia confirmação
com explicação localizada; o banco e o repository também rejeitam o estado
inválido sem alterar o último draft válido.

### AC-005 — Confirmação local e honesta

Um par válido só é confirmado para draft não vazio com ordem confirmada; o
instante persiste e a UI não inicia nem simula validação, OCR, provider, upload,
tradução ou custo.

### AC-006 — Invalidação coordenada após edição

Mudar um idioma limpa a confirmação dos idiomas preservando o outro valor;
editar páginas preserva o par, limpa as confirmações de ordem e idiomas e exige
nova revisão antes de reconfirmar.

### AC-007 — Resiliência e concorrência

Falhas, retry, toque repetido ou mudança concorrente preservam o último estado
SQLite consistente, não confirmam um par antigo e não afetam itens ou arquivos
privados.

### AC-008 — Separação dos contratos de idioma

Trocar idioma da interface ou cadeia de conteúdo da plataforma não altera origem
ou destino da tradução; a seleção também não muda `Accept-Language` nem payloads
da Core.

### AC-009 — Interface acessível, responsiva e trilíngue

Origem, destino, sugestões, opções, estado inválido, confirmação, erro e retry
possuem paridade pt-BR/en-US/es-ES, tokens de tema, labels/estado acessíveis e
layout operável em telas compactas sem expor opções técnicas.

### AC-010 — Upgrade local sem perda e revisão do chinês legado

Instalações anteriores preservam draft, projeto, IDs, arquivos e posições. `zh`
legado é convertido de forma recuperável, mas perde confirmação e bloqueia
processamento até escolha explícita entre simplificado/tradicional; instalação
limpa nasce diretamente com os sete códigos e passa em verificação de FK.

## Estratégia de evidência

| Critério | Teste/evidência esperada                                                                       |
| -------- | ---------------------------------------------------------------------------------------------- |
| AC-001   | Unitário parametrizado dos 42 pares e RNTL provando independência dos controles                |
| AC-002   | RNTL de defaults, prioridade de PT-BR e copy sem alegação de detecção                          |
| AC-003   | Integração repository/UI com alteração, reload SQLite e variação do idioma da interface        |
| AC-004   | Unitário/UI/repository para mesmo idioma, código inválido, constraint e rollback               |
| AC-005   | Integração de confirmação com pré-condições e ausência de qualquer CTA/estado de processamento |
| AC-006   | Repository/RNTL alterando idioma e depois itens, verificando preservação e invalidações        |
| AC-007   | Testes de falha, retry, duplo toque e estado concorrente                                       |
| AC-008   | Integração variando UI/content locales e inspecionando `Accept-Language`/ausência de Core      |
| AC-009   | RNTL nos três locales, semântica, disabled, erro, toque e layout compacto                      |
| AC-010   | Teste SQLite legado→v6, revisão de `zh`, `foreign_key_check`, schema limpo e rollback          |

## Gate de implementação

- Estado: `open`
- Dependências: `MOB-FEAT-013`
- Motivo: o draft privado, revisão, confirmação, SQLite e evidências necessários
  estão implementados; seleção e persistência de idiomas não dependem do gateway
  remoto.

## Fora de escopo

- Detecção automática do idioma na imagem, OCR ou análise de escrita.
- Verificação de que um provider real suporta/processa cada par; isso pertence ao
  gateway e ao pipeline futuros.
- Validação de formato, assinatura, dimensão, corrupção ou texto da mídia
  (`MOB-FEAT-015`).
- Consentimento remoto, upload, tradução, renderização, progresso, reader, custo,
  quota, conta ou Core.
- Idiomas além de `ja`, `en`, `es`, `ko`, `zh-Hans`, `zh-Hant` e `pt-BR`, variantes regionais adicionais, múltiplas origens no
  mesmo draft ou detecção por página.
- Preferência global de tradução, sincronização entre aparelhos ou acoplamento ao
  idioma da interface/conteúdo.
- Seleção de provider, modelo, prompt, glossário, formalidade ou qualidade.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-08-14

A implementação dos seis códigos permanece histórica. Em 2026-08-15, Ruan Moraes
aprovou e autorizou implementar a evolução para sete códigos/42 pares e a revisão
obrigatória de `zh` legado. O delta foi implementado e verificado conforme o
review e o drift audit correntes.
