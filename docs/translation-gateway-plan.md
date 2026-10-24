# Plano arquitetural do gateway de tradução

> Documento de arquitetura aprovado em 2026-08-15. A fundação server-side de
> `MOB-FEAT-017` está implementada de forma fail-closed, mas não está implantada.
> A fundação do worker e o adapter Vision de `MOB-FEAT-018` estão codificados com
> validação offline e piloto real controlado, sem ativação operacional. A tradução
> está codificada e auditada offline, com qualidade/operação em verificação; a
> renderização possui contratos, renderer e integração ao worker exercitados
> localmente. Distribuição, segurança, orçamento/isolamento operacional e qualidade
> continuam abertos; isso não representa execução integral real ou entrega ao app.
> Os contratos e o estado mobile permanecem nas Target Specs
> `MOB-FEAT-017..021`.

## Objetivo e limites

Entregar o primeiro slice real `uma página → OCR → tradução → renderização →
leitura`, sem login obrigatório e sem colocar credenciais de provider no APK.
O gateway será um serviço Spring Boot separado da Core existente; não reutiliza
sessão da plataforma, não publica conteúdo e não altera o catálogo.

O slice processa somente a primeira página ordenada do projeto. Scheduler,
concorrência e retry de lotes continuam em `MOB-FEAT-022..024`.

## Decisões aprovadas

Direção adicional em 2026-10-18: continuar a implementação no servidor e tratar
a [investigação híbrida](../api/apps/translation-gateway/docs/hybrid-rendering-options-2026-10-18.md)
como urgente/P1 ([DT-76](tech-debt.md#dt-76-renderização-híbrida-de-tradução--urgentep1)).
Instruções de desenho e patches seletivos são candidatos a protótipo, sem mudança
da topologia/contratos aprovados abaixo nem implementação mobile neste marco.

- Cloud Vision `DOCUMENT_TEXT_DETECTION` fornece OCR e polígonos.
- Cloud Translation Advanced com `general/translation-llm` traduz todas as
  regiões da página em uma chamada contextual, preservando associação por ID.
- Providers ficam atrás de portas substituíveis; o mobile nunca os chama.
- Gateway, banco e objetos temporários ficam em `southamerica-east1`; Vision usa
  endpoint regional `us` e Cloud Translation Advanced
  `general/translation-llm` usa o endpoint global `translate.googleapis.com`.
  O parent e o recurso do modelo usam `locations/global`, sem fallback para
  NMT. A localização do processamento da tradução não é garantida nos EUA. O
  consentimento e a política devem distinguir o OCR regional da tradução global
  antes de qualquer upload; a publicação anterior não satisfaz esse requisito.
- A imagem original remota será mantida privada até o renderer concluir, pois
  ele precisa reabrir os pixels validados. O cleanup preserva o limite absoluto
  de uma hora mesmo em interrupção, falha ou cancelamento. O worker conserva
  o original depois do OCR e o renderer local opt-in remove-o após commit ou
  terminal confirmado. URLs, operação e gates integrais continuam pendentes;
  uploads seguem desabilitados.
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

## Parcela de expiração consultável — 2026-10-04

READY expira na consulta owner-scoped ou no cleanup, usando o timestamp de
conclusão do render e o prazo de resultado do disclosure (máximo uma hora).
Não amplia o failsafe do original desde upload. A expiração grava o estado e
uma solicitação durável de remoção no mesmo TX; essa fila atende ACK ou TTL,
sem afirmar que o app recebeu resultado. Deletes permanecem fora do TX.

Falhas reais de remoção são sanitizadas e recuperáveis; o adapter não as
confirma como sucesso. Consulta por jobRef/idempotência responde no-store.
Schema V1–V6/manifestos/rotas preservados; URLs e retenção terminal integral
ainda pendentes. Ver [plano anterior ao código](../api/apps/translation-gateway/docs/result-expiration.md).

## Topologia Google Cloud planejada

```text
Mobile
  → Cloud Run Gateway público
      → Cloud SQL PostgreSQL (identidade, jobs e idempotência)
      → Cloud Storage privado (mídia efêmera)
      → Cloud Tasks
          → Cloud Run Worker privado
              → Cloud Vision OCR (US)
              → Cloud Translation Advanced LLM (endpoint global)
              → renderer JVM
```

O mesmo container pode operar com profiles `gateway` e `worker`, mas os serviços
Cloud Run e suas service accounts são separados. Cloud Tasks chama o worker com
OIDC. Credenciais ficam em workload identity/service accounts e Secret Manager,
nunca em arquivo versionado.

Decisão revisada por Ruan em 2026-09-27: abandonar a exigência de tradução nos
EUA, sem alterar a região do OCR ou do armazenamento temporário. O adapter da
tradução está codificado e testado offline; antes de uma chamada, rejeita a requisição
completa acima de 30.000 pontos de código Unicode, sem fragmentar a página ou trocar de
modelo. Capabilities e consentimento mobile foram reconciliados em 2026-10-02;
os textos legais publicados ainda precisam de revisão, nova versão e
republicação. Gateway e uploads permanecem desabilitados.

Base da decisão: [endpoints globais e multirregionais](https://docs.cloud.google.com/translate/docs/advanced/endpoints),
[localização dos dados](https://docs.cloud.google.com/translate/data-usage),
[recurso do modelo v3](https://docs.cloud.google.com/translate/docs/reference/rest/v3/projects/translateText)
e [limites por requisição](https://docs.cloud.google.com/translate/quotas).

A fundação de infraestrutura já está declarada em Terraform: APIs, Artifact
Registry, service accounts/IAM, Cloud Run, Cloud Run Jobs, Cloud Tasks, Cloud
SQL, bucket, Secret Manager, Scheduler e alerta de 5xx. O worker e o destino
operacional continuam desabilitados. `terraform apply`, billing e deploy são
ações externas e exigem aprovação no momento da execução.

### Estado OCR consolidado — 2026-09-27

A auditoria dos seis critérios técnicos e a revalidação local de 15 rodadas reais
do catálogo nos sete idiomas e quatro controles tipográficos foram concluídas.
A primeira transição candidata falhou no SDD porque 019 `approved/open` exige
tasks, excluídas daquele marco; o fallback foi `in-progress`/`blocked`.
O marco documental seguinte, autorizado por Ruan, reconferiu hashes e resolveu
o bloqueio: 018 `verification-pending`, 019 `approved/open`, com sete tasks
planejadas e ainda não executadas naquele marco. O incremento seguinte entregou
apenas [contratos e validadores Java](../api/apps/translation-gateway/docs/translation-contracts.md):
019 `in-progress/open`, TASK-001 concluída. Em 2026-10-02, iniciou-se a etapa
offline seguinte: adapter global, worker, manifesto privado e V4 codificados,
com testes leves aprovados. O bloqueio inicial de Docker foi resolvido e a
cadeia V1–V4, concorrência/cancelamento e Maven global passaram em 2026-10-02.
Em 2026-10-03, a parcela local acrescentou SQLite v9 com metadados de tradução
na entity existente, sem gravação de resultado remoto; ver a
[evidência local](../mobile/docs/specs/features/MOB-FEAT-019-contextual-language-pair-translation/evidence/translation-local-metadata-2026-10-03.md).
Nenhuma chamada real de tradução foi executada; TASK-002..007 continuam
abertas até a verificação integral e a revisão correspondente.
Na parcela seguinte do mesmo dia, capabilities/submissão/worker passaram a
conferir os mesmos pares operacionais configurados, com ETag canônico sensível
ao conjunto. O mobile valida o manifesto de tradução `1.0` contra o OCR esperado,
sem integração de download, gravação remota ou ACK; ver a
[evidência dos pares e contrato local](../mobile/docs/specs/features/MOB-FEAT-019-contextual-language-pair-translation/evidence/translation-capabilities-contracts-2026-10-03.md).
Na continuação, foram corrigidas as janelas de falha pré-reserva e confirmação
perdida da tradução, com testes concorrentes e rollback reais em PostgreSQL,
conforme [evidência de segurança de reentrega](../mobile/docs/specs/features/MOB-FEAT-019-contextual-language-pair-translation/evidence/translation-delivery-safety-2026-10-03.md).
O fechamento server-side seguinte acrescenta ACK idempotente por proprietário,
pedido durável e cleanup com lease por job, em V5. A aquisição/commit e envio de
ACK pelo aplicativo continuam na 021; `READY` aparece apenas em fixtures deste
incremento. O renderer deverá incluir seus objetos finais na projeção de cleanup.
Ver [plano de persistência](../api/apps/translation-gateway/docs/result-acknowledgement.md)
e [evidência da retenção](../mobile/docs/specs/features/MOB-FEAT-019-contextual-language-pair-translation/evidence/translation-result-ack-2026-10-03.md).
Benchmark independente,
qualidade vertical, página vazia real e operação completa continuam pendentes.

Em 2026-10-03, a auditoria integral da tradução e os gates locais resolveram a
prontidão técnica da 019: `verification-pending/open`, tasks técnicas concluídas
e TASK-006 aberta para provider/qualidade/revisão/operação reais. O gate da 020
foi aberto conforme autorização de Ruan para implementar autonomamente até a
renderização; suas tasks foram derivadas sem começar antecipadamente a 021.
O incremento seguinte entrega contratos imutáveis/validadores e manifesto final
estrito, com a 020 `in-progress/open`, sem fontes, codec ou pintura. Ver
[contratos da renderização](../api/apps/translation-gateway/docs/rendering-contracts.md).
Esse era o limite da parcela inicial. Em 2026-10-04, fontes, codec, composição,
arquivos e worker local opt-in produzem WebP/manifesto privados e READY nos
testes com OCR/tradução falsos e PostgreSQL. Não é execução real de tradução
nem resultado publicado/baixado no aplicativo. URLs assinadas, distribuição,
profiling e qualidade permanecem abertos. Ver
[plano do worker](../api/apps/translation-gateway/docs/rendering-worker.md),
[consolidação da 019](../mobile/docs/specs/features/MOB-FEAT-019-contextual-language-pair-translation/evidence/translation-consolidation-2026-10-03.md)
e [planejamento da 020](../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/tasks.md).
[Evidência e limites](../mobile/docs/specs/features/MOB-FEAT-018-multilingual-ocr-regions/evidence/ocr-consolidation.md).
Preservar ordem estrutural do Vision e índices contíguos após filtragem, sem
heurística de direção ou consumo de layout experimental. Sem mudança de runtime mobile,
defaults habilitados, recursos cloud, Termos ou exposição pública. A V6 adiciona
metadados privados aos artefatos finais; nenhum texto é persistido no PostgreSQL.

### Memória do renderer — decisão corrente de 2026-10-05

Ruan escolheu manter libwebp com orçamento total medido: buffers internos são
permitidos, mas cópias redundantes pela aplicação não. WebP lossless/exact,
limites defensivos e original íntegro permanecem obrigatórios. Ver o
[plano incremental](../api/apps/translation-gateway/docs/rendering-memory-policy.md).
Os experimentos locais não mudam Terraform ou orçamento cloud de 1 GiB.
Pacote readonly e seleção supervisionada foram codificados/testados opt-in;
[prova Spring de 2026-10-07](../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/rendering-worker-linux-2026-10-07.md)
concluiu o fluxo máximo com texto a 4 GiB e confirmou OOM a 2 GiB.
Admissão de orçamento, contenção, distribuição operacional, SDKs residentes
e qualidade continuam abertos. 020 in-progress/open, 021 blocked.

### Incremento OCR offline — histórico de 2026-09-26

O perfil `worker` recebe somente `jobRef`; sua porta OCR recebe internamente
chave persistida, origem e dimensões verificadas. O adapter Vision v1 envia a
referência GCS ao endpoint `us`, uma imagem por chamada, deadline de 60s e
retries de SDK/transporte desligados. `gateway.ocr.mode=disabled` não cria o
client ou procura ADC. `vision` exige perfil worker, projeto e storage GCS
válidos; o Terraform mantém esse modo desabilitado.

Parágrafos de `fullTextAnnotation` formam regiões ordenadas, com IDs estáveis
por job/posição, quebras explícitas e geometria normalizada. O manifesto `1.0`
e as rotas `/v1` não mudam. Região isolada inválida é descartada; excesso de
limites ou associação insegura falha a etapa. Fixtures não provam qualidade
real de reconhecimento horizontal/vertical.

PostgreSQL mantém a V2: `(job_id, stage)` determina estado, timestamps, erro,
chave e hash; texto não entra no banco. Não há migration, índice ou contador
novo. Uma consulta pontual pela PK da etapa protege `CANCEL_PENDING`: redelivery
não encerra nem apaga o original de um OCR ainda `RUNNING`. A chamada ativa ou
o cleanup de abandono confirma o cancelamento, sem segunda chamada ao provider.

### Extensão experimental de layout — 2026-09-27

Shadow opcional, desabilitado por padrão, usa portas próprias para geometria e
detecção local ONNX. Não altera manifesto OCR, tradução ou estados públicos. V3
guarda apenas metadados por job, FK composta para etapa OCR, cascade e CHECKs;
referências compartilham o commit OCR/job, sem inferência dentro de transação.
Contrato, replay e limites em
[layout experimental](../api/apps/translation-gateway/docs/layout-experimental.md).
Extensão não amplia nem conclui os critérios atuais da `MOB-FEAT-018`.
O layout `1.1` acrescenta auditoria de supressão determinística de caixas quase
idênticas (IoU ≥ 0,95) antes da associação; ambiguidades entre candidatos distintos
permanecem explícitas. Contrato OCR e schema V1–V3 não mudam. Relatórios `1.0`
continuam legíveis, sem reescrita de evidências históricas.

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
  constraints. A cadeia V1–V5 foi executada com PostgreSQL 17; a
  [evidência datada](../mobile/docs/specs/features/MOB-FEAT-019-contextual-language-pair-translation/evidence/translation-result-ack-2026-10-03.md)
  registra os resultados.

## Processamento

1. Gateway valida sessão, quota, capabilities, consent/disclosure e mídia,
   reserva um job idempotente, grava o original privado e enfileira a tarefa.
2. Worker revalida assinatura/dimensões e executa Vision online com hint da
   origem. Blocos/parágrafos viram regiões opacas com polígono e ordem estável.
3. No pipeline completo, o original remoto permanece privado até o commit do
   render, falha/cancelamento ou cleanup de uma hora. O worker OCR atual ainda o
   apaga ao terminar; essa divergência planejada bloqueia a ativação de uploads.
4. Regiões ordenadas seguem juntas ao Translation LLM; quantidade e associação
   por ID são validadas antes de aceitar o resultado.
5. Renderer headless usa Noto Sans/Noto Sans CJK, neutraliza somente a região,
   calcula contraste, quebra linhas e reduz fonte até o mínimo legível.
6. Texto que não couber permanece no manifesto como fallback. Página sem texto
   é `READY` com resultado visual equivalente ao original.
7. Resultado WebP e manifesto recebem hash, expiração de uma hora e URL assinada
   curta. ACK ou cleanup remove ambos; original remoto também é removido.

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
- URLs públicas: `https://toonlira-rm.firebaseapp.com/legal/terms` e
  `https://toonlira-rm.firebaseapp.com/legal/privacy`; domínio, HTTPS e acesso
  direto estão publicados. Os documentos ainda dependem de revisão jurídica
  antes de constituírem políticas vinculantes.
- Atualizar termos e privacidade web nos três locales antes do primeiro upload
  real, incluindo Google Cloud, gateway/armazenamento no Brasil, OCR regional
  `us`, tradução global sem residência garantida, finalidade, copyright,
  retenção e cancelamento. O rascunho não é publicação nem aprovação jurídica.
- Metadados técnicos sanitizados do gateway expiram em sete dias; métricas
  agregadas sem conteúdo podem permanecer.
- Logs/eventos nunca incluem imagem, texto, filename, path/URI, token, URL
  assinada ou resposta bruta.
- URLs legais estão publicadas em HTTPS. O disclosure operacional histórico
  `2026-09-07.v1` registra a política de treinamento, mas não descreve a
  tradução global; o gateway o recusa. O exemplo de configuração mantém versão
  vazia até uma nova aprovação. Ausência ou mudança não revisada dessas
  configurações mantém o gateway fail-closed.
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
