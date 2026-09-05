# Plano arquitetural do gateway de tradução

> Documento de arquitetura aprovado em 2026-08-15. A fundação server-side de
> `MOB-FEAT-017` está implementada de forma fail-closed, mas não está implantada.
> Mobile, worker e providers continuam planejados. Os contratos normativos do
> aplicativo permanecem nas Target Specs `MOB-FEAT-017..021`.

## Objetivo e limites

Entregar o primeiro slice real `uma página → OCR → tradução → renderização →
leitura`, sem login obrigatório e sem colocar credenciais de provider no APK.
O gateway será um serviço Spring Boot separado da Core existente; não reutiliza
sessão da plataforma, não publica conteúdo e não altera o catálogo.

O slice processa somente a primeira página ordenada do projeto. Scheduler,
concorrência e retry de lotes continuam em `MOB-FEAT-022..024`.

## Decisões aprovadas

- Cloud Vision `DOCUMENT_TEXT_DETECTION` fornece OCR e polígonos.
- Cloud Translation Advanced com `general/translation-llm` traduz todas as
  regiões da página em uma chamada contextual, preservando associação por ID.
- Providers ficam atrás de portas substituíveis; o mobile nunca os chama.
- Gateway, banco e objetos temporários ficam em `southamerica-east1`; Vision usa
  endpoint regional `us` e Translation LLM usa `us-central1`. O consentimento e
  a política declaram essa transferência Brasil → EUA.
- A imagem original remota é removida depois do OCR. Em interrupção, cleanup
  garante remoção em até uma hora.
- Manifesto e imagem renderizada são removidos após ACK do aplicativo ou em até
  uma hora após `READY`.
- O alpha usa identidade anônima, bearer curto, 20 páginas por instalação/dia,
  limite global inicial de 100 páginas/dia e kill switch.
- Chinês simplificado (`zh-Hans`) e tradicional (`zh-Hant`) são opções distintas.
  Com japonês, inglês, espanhol, coreano e PT-BR, o produto passa a sete idiomas
  e 42 pares direcionais diferentes.
- A UI mostra uma barra de cinco marcos confirmados: fila, OCR, tradução,
  renderização e download. Ela não representa tempo restante nem exibe ETA.
- O leitor abre automaticamente uma única vez, somente depois que resultado e
  manifesto forem verificados e persistidos localmente.

## Topologia Google Cloud planejada

```text
Mobile
  → Cloud Run Gateway público
      → Cloud SQL PostgreSQL (identidade, jobs e idempotência)
      → Cloud Storage privado (mídia efêmera)
      → Cloud Tasks
          → Cloud Run Worker privado
              → Cloud Vision OCR (US)
              → Cloud Translation LLM (us-central1)
              → renderer JVM
```

O mesmo container pode operar com profiles `gateway` e `worker`, mas os serviços
Cloud Run e suas service accounts são separados. Cloud Tasks chama o worker com
OIDC. Credenciais ficam em workload identity/service accounts e Secret Manager,
nunca em arquivo versionado.

A fundação de infraestrutura já está declarada em Terraform: APIs, Artifact
Registry, service accounts/IAM, Cloud Run, Cloud Run Jobs, Cloud Tasks, Cloud
SQL, bucket, Secret Manager, Scheduler e alerta de 5xx. O worker e o destino
operacional continuam desabilitados. `terraform apply`, billing e deploy são
ações externas e exigem aprovação no momento da execução.

## Contrato HTTP v1

| Método | Rota                                            | Contrato                                                                                    |
| ------ | ----------------------------------------------- | ------------------------------------------------------------------------------------------- |
| `GET`  | `/v1/capabilities`                              | Versões, idiomas/pares, MIME/limites, regiões, retenção, etapas, URLs legais e kill switch. |
| `POST` | `/v1/anonymous/installations`                   | Cria instalação opaca e devolve uma credencial longa uma única vez.                         |
| `POST` | `/v1/anonymous/sessions`                        | Troca credencial do SecureStore por bearer curto.                                           |
| `POST` | `/v1/page-jobs`                                 | Multipart da primeira página, metadados mínimos e `Idempotency-Key`; retorna `202`.         |
| `GET`  | `/v1/page-jobs/by-idempotency/{idempotencyKey}` | Reconcilia timeout anterior ao receipt sem criar nova chave ou cobrança.                    |
| `GET`  | `/v1/page-jobs/{jobRef}`                        | Estado/etapa, erro sanitizado e manifesto terminal.                                         |
| `POST` | `/v1/page-jobs/{jobRef}/cancel`                 | Pedido idempotente de cancelamento.                                                         |
| `POST` | `/v1/page-jobs/{jobRef}/ack`                    | Confirma persistência local e solicita exclusão dos objetos remotos.                        |

O upload envia bytes, MIME detectado, dimensões e idiomas. Filename, URI/path,
ID de conta e IDs locais de projeto/página não saem do aparelho. Resultado
`READY` inclui URL GET assinada e curta, SHA-256, MIME, dimensões e manifesto de
regiões. Redirect, host, tamanho e schema são validados no client.

Estados do job:

```text
ACCEPTED → QUEUED → OCR → TRANSLATING → RENDERING → READY
                     └───────────────→ FAILED
                     └→ CANCEL_PENDING → CANCELLED
READY → RESULT_EXPIRED
```

Cloud Tasks pode redeliver, portanto o worker consulta o estágio persistido antes
de executar. Não existe retry automático de chamada cobrada; uma resposta de
provider é persistida antes da próxima etapa. Uma janela residual entre resposta
externa e commit será medida e tratada em `MOB-FEAT-024`.

## Persistência remota

### Banco escolhido

PostgreSQL/Cloud SQL. Identidade, quota, idempotência e máquina de estados são
relacionais e exigem transações, FKs, unicidade e concorrência segura. MongoDB e
a Core não participam. Conteúdo de imagem/OCR/tradução fica apenas no bucket
efêmero, nunca em colunas ou logs.

### Modelo em BCNF

`anonymous_installations`:

- `id UUID PRIMARY KEY`;
- `credential_hash VARCHAR NOT NULL UNIQUE` (Argon2id);
- `status VARCHAR NOT NULL`;
- `created_at`, `last_seen_at`, `revoked_at`.

Dependência funcional: `id → atributos`; `credential_hash → instalação`. Ambas
as determinantes são chaves candidatas.

`anonymous_sessions`:

- `id UUID PRIMARY KEY` e `installation_id UUID NOT NULL`;
- somente `token_hash CHAR(64) UNIQUE`, nunca o bearer opaco;
- `created_at`, `expires_at` e `revoked_at` com checks temporais;
- FK para a instalação com `ON DELETE CASCADE`.

`processing_jobs`:

- `id UUID PRIMARY KEY` e `job_ref UUID NOT NULL UNIQUE`;
- `installation_id UUID NOT NULL`;
- `idempotency_key UUID NOT NULL`;
- versões de contrato/disclosure;
- origem, destino, MIME, bytes e dimensões;
- status/etapa, chaves de objetos temporários, hashes e erro sanitizado;
- flags/timestamps de cancelamento, expiração e exclusão.

Dependências funcionais: `id → atributos`, `job_ref → job` e
`(installation_id, idempotency_key) → job`; todas são chaves candidatas. Idiomas
e atributos técnicos são snapshots imutáveis da submissão, não dados mestres.

`processing_job_stages`:

- `job_id UUID NOT NULL`;
- `stage VARCHAR NOT NULL`;
- status, timestamps, código de erro e unidade cobrável sanitizada;
- PK `(job_id, stage)`.

Dependência funcional: `(job_id, stage) → atributos`; a determinante é chave.
Não há contador diário desnormalizado: quota consulta jobs aceitos no dia UTC sob
lock da instalação e lock transacional global por dia, evitando corrida no limite
global sem introduzir contador derivado.

`processing_job_dispatches`:

- `job_id UUID PRIMARY KEY`;
- status, timestamps de tentativa, próxima execução e erro sanitizado;
- FK para `processing_jobs.id ON DELETE CASCADE`.

Dependência funcional: `job_id → atributos`; a PK é chave candidata. A tabela é
outbox transacional: aceitar o job e registrar o dispatch ocorre no mesmo commit;
um dispatcher idempotente cria a Cloud Task e reconcilia linhas pendentes.

### Integridade e índices

- FKs de jobs/etapas usam `ON DELETE CASCADE`.
- `UNIQUE(installation_id, idempotency_key)` impede cobrança duplicada pelo
  client.
- CHECKs espelham status, etapas, sete idiomas, origem diferente do destino,
  MIME e combinações de timestamps/erros.
- Índice `(installation_id, created_at)` atende quota e histórico.
- Índice parcial de jobs não terminais atende reconciliação/cleanup.
- Índice parcial de dispatches pendentes por `next_attempt_at` atende a outbox.
- UNIQUEs já cobrem `job_ref`, credential e idempotência; não criar índices
  redundantes nos mesmos prefixos.
- Flyway é forward-only; a suíte PostgreSQL Testcontainers cobre cadeia limpa e
  constraints, com execução real pendente enquanto Docker não estiver disponível.

## Processamento

1. Gateway valida sessão, quota, capabilities, consent/disclosure e mídia,
   reserva um job idempotente, grava o original privado e enfileira a tarefa.
2. Worker revalida assinatura/dimensões e executa Vision online com hint da
   origem. Blocos/parágrafos viram regiões opacas com polígono e ordem estável.
3. O original remoto é apagado em `finally` assim que OCR termina ou falha.
4. Regiões ordenadas seguem juntas ao Translation LLM; quantidade e associação
   por ID são validadas antes de aceitar o resultado.
5. Renderer headless usa Noto Sans/Noto Sans CJK, neutraliza somente a região,
   calcula contraste, quebra linhas e reduz fonte até o mínimo legível.
6. Texto que não couber permanece no manifesto como fallback. Página sem texto
   é `READY` com resultado visual equivalente ao original.
7. Resultado WebP e manifesto recebem hash, expiração de uma hora e URL assinada
   curta. ACK ou cleanup remove ambos.

## Fronteiras mobile FSD

```text
shared/remote-gateway (somente HTTPS, timeout, limites e redirects)
  → entities/remote-processing-capability (contrato e parser de domínio)
  → entities/remote-processing-attempt
  → entities/text-region
  → entities/translation-project (@x somente quando necessário)
    → features/start-remote-processing
    → features/cancel-remote-processing
      → pages/offline-translation
      → pages/local-translation-reader
        → application (bootstrap/reconciliação global somente se necessário)
```

`shared` contém apenas transporte, validação genérica e configuração. Estados do
job/resultado ficam em entities; start/cancel são features independentes e não se
importam horizontalmente; pages fazem a composição. O leitor local não estende
semanticamente Chapter nem importa a feature do leitor publicado.

## Persistência local planejada

SQLite v6 já fez o rebuild atômico dos checks de idioma. SQLite v7 adicionará:

- `remote_processing_consents`;
- `remote_processing_attempts`.

Resultados, regiões e vértices serão adicionados somente por
`MOB-FEAT-018..021`. `translation_projects.language_review_required` e a migração
de `zh` ambíguo já pertencem ao schema v6; projetos marcados continuam bloqueados
antes de upload até a escolha explícita de `zh-Hans` ou `zh-Hant`.

PKs, chaves candidatas e FKs usam `ON DELETE CASCADE`. Polígonos ficam
normalizados por vértice, não em JSON. Original e resultado permanecem no
FileSystem privado; cache nunca é fonte única. `READY` só é gravado depois de
download, hash e move atômico. Um `auto_opened_at` persistido evita reabrir o
leitor em loop.

## Privacidade, operação e gates

- Operador definido para a fase atual: Ruan Moraes, pessoa física, com contato
  público `ruanmoraessantosbarbosa@gmail.com`.
- URLs canônicas reservadas: `https://app.mangareader.com/legal/terms` e
  `https://app.mangareader.com/legal/privacy`; domínio, HTTPS e publicação ainda
  são pendências, portanto não constituem políticas públicas vigentes.
- Atualizar termos e privacidade web nos três locales antes do primeiro upload
  real, incluindo Google Cloud, transferência Brasil→EUA, finalidade, copyright,
  retenção e cancelamento.
- Metadados técnicos sanitizados do gateway expiram em sete dias; métricas
  agregadas sem conteúdo podem permanecer.
- Logs/eventos nunca incluem imagem, texto, filename, path/URI, token, URL
  assinada ou resposta bruta.
- URLs legais publicadas em HTTPS, versão aprovada e política de treinamento do
  provider são configuração obrigatória; ausência mantém o gateway fail-closed.
- Play Integrity e proteção forte contra reinstalação ficam em M7; o alpha usa
  quota por instalação, limite global e rate limit conservador.
- Qualidade permanece `verification-pending` até benchmark humano autorizado;
  nenhum SLO quantitativo será inventado antes da baseline.

## Evidência mínima do slice

- Fixtures autorizadas: JA vertical→PT-BR, EN→PT-BR, ES→EN, KO→EN,
  `zh-Hans`→PT-BR, `zh-Hant`→EN, arte sem texto e overflow.
- Testes mobile de migration, consent, timeout/restart, hash, expiração,
  cancelamento, barra por etapas, auto-open único e leitura offline.
- Testes do gateway por camada, contrato HTTP/OpenAPI, Flyway/PostgreSQL real,
  idempotência/concorrência, redelivery, cleanup e ausência de conteúdo em logs.
- Teste físico Android com background/rede degradada, memória, crash e ANR.
