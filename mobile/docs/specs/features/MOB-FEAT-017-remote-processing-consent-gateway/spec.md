---
id: MOB-FEAT-017
type: feature
title: Consentimento e gateway de processamento remoto
status: verification-pending
implementation_gate: open
blocked_by: [MOB-FEAT-016]
created: 2026-08-15
updated: 2026-09-06
supersedes: []
superseded_by: []
---

# MOB-FEAT-017 — Consentimento e gateway de processamento remoto

## Objetivo

Permitir que o usuário autorize conscientemente o envio de uma página privada de
um projeto local para um gateway remoto substituível e iniciar a submissão de
forma segura, recuperável e idempotente. A feature estabelece a fronteira entre
o estado local e o serviço externo sem executar OCR, tradução ou renderização no
mobile e sem expor segredo de provider no aplicativo.

## Contexto e contratos relacionados

- Depende de `MOB-FEAT-016`, agora `implemented`, que fornece projeto,
  páginas, originais privados, estados canônicos e transições persistíveis.
- Atende RF-PRV-001..005, RF-THD-001..004 e RF-RET-001..003 e controla parte de
  RF-TRN-001..004 apenas na fronteira de submissão; o significado de OCR/regiões
  continua em `MOB-FEAT-018`.
- Reconcilia `CON-001`: conteúdo e resultados continuam local-first, mas a tela
  passa a declarar inequivocamente que o processamento precisa de internet e
  envia a página selecionada a um serviço remoto.
- Controla RSK-009, RSK-012, RSK-021 e RSK-023 por disclosure, isolamento de
  secrets, idempotência, timeout e estado recuperável. Retenção/provider não
  podem ser declarados mitigados antes da evidência contratual.
- O gateway não é o cliente Core existente. O plano aprovado autoriza criar um
  serviço Spring Boot separado e atualizar somente as páginas legais de `/web`;
  catálogo, auth da plataforma e endpoints da Core continuam fora.
- A arquitetura usa Cloud Run/Tasks/SQL/Storage em São Paulo, Cloud Vision OCR
  regional nos EUA e Cloud Translation LLM em `us-central1`, conforme
  [`docs/translation-gateway-plan.md`](../../../../../docs/translation-gateway-plan.md).
- `MOB-FEAT-018..020` interpretarão os resultados estruturados do job. Esta spec
  termina na submissão aceita e consulta/cancelamento do envelope remoto.

## Requisitos e regras

### Disclosure e consentimento contextual

- **Iniciar processamento** só aparece para projeto `DRAFT` íntegro, com ao
  menos uma página `DRAFT`, original privado disponível e par linguístico
  suportado pela matriz publicada pelo gateway.
- Antes de qualquer byte sair do aparelho, a UI informa em linguagem direta:
    - qual página será enviada e para qual finalidade;
    - que internet é obrigatória e o processamento não ocorre integralmente no
      aparelho;
    - categorias de dados/metadados enviados;
    - Toonlira/Google Cloud, gateway no Brasil, OCR/tradução nos EUA,
      retenção e política de treinamento conforme os contratos vigentes;
    - limite de cancelamento/exclusão depois que o processamento começar;
    - link para política/termos vigentes.
- O consentimento exige ação afirmativa explícita, não vem pré-marcado, não é
  confundido com termos gerais e é escopado ao projeto e à versão do disclosure.
- Fechar, voltar ou recusar mantém projeto/páginas em `DRAFT`, não cria attempt e
  não envia mídia. Uma versão de disclosure diferente exige novo consentimento.
- A aceitação guarda somente projeto, versão do disclosure, locale apresentado e
  instante. Não guarda conteúdo da mídia, nome de arquivo, URI, diálogo ou dados
  pessoais.

### Matriz de capacidade

- O gateway fornece configuração validada e versionada com pares origem/destino,
  MIME, limites de bytes/dimensões e capacidades disponíveis.
- Os sete idiomas de `MOB-FEAT-014` continuam selecionáveis localmente, mas a UI
  nunca promete que os 42 pares são processáveis. Par não suportado é bloqueado
  antes do consentimento/upload com ação para iniciar outro projeto.
- Configuração ausente, inválida, expirada ou incompatível fecha o gate de
  submissão. Não existe fallback otimista nem provider escolhido no client.

### Porta mobile do gateway

- A porta de domínio expõe operações equivalentes a:
    - `getCapabilities()`;
    - `createAnonymousInstallation()` e `createAnonymousSession()`;
    - `submitPage(request)`;
    - `getSubmission(idempotencyKey | remoteJobRef)`;
    - `cancelSubmission(remoteJobRef)`;
    - `acknowledgeResult(remoteJobRef)`.
- O request envia somente bytes da página, MIME real, dimensões necessárias,
  idioma de origem/destino e identificadores opacos da tentativa. Não envia
  filename, URI, path, ID de conta, diálogo, texto inexistente ou IDs locais
  brutos de projeto/página.
- O response mínimo possui versão do contrato, referência opaca do job, status
  canônico, instante do servidor e erro estruturado quando aplicável. Resultados
  de OCR/tradução/render ficam fora desta feature.
- `shared/remote-gateway` contém somente transporte agnóstico ao domínio:
  origem HTTPS validada, timeout, limites de request/response, política de
  redirects e cancelamento. Capabilities, estados, erros e parsers Zod do
  contrato remoto pertencem às entities de processamento remoto.
- Transporte exige HTTPS, timeout explícito, tamanho máximo, cancelamento do
  request local e parser de resposta não confiável. Redirect para origem não
  autorizada, downgrade de TLS, resposta excedente ou payload inválido falham
  fechados.
- O serviço externo autentica/autoriza o app sem chave estática privilegiada no
  bundle. API key de OCR/tradução, credencial de provider e segredo de assinatura
  nunca usam `EXPO_PUBLIC_*`, source, asset, log ou storage do mobile.
- A instalação anônima recebe credencial longa opaca uma única vez, armazenada no
  SecureStore, e a troca por bearer curto não reutiliza sessão de conta. O alpha
  limita 20 páginas por instalação/dia, 100 globalmente e possui kill switch.

### Idempotência, persistência e submissão

- Antes da primeira chamada, o app persiste um attempt `CREATED` com UUID opaco e
  `idempotencyKey` único. Repetir toque, restart ou retry de timeout usa o mesmo
  attempt e a mesma chave; nunca cria submissão paralela para a mesma tentativa.
- O estado local do attempt e o estado observado do job remoto são eixos
  separados. O primeiro descreve a coordenação/recovery do aplicativo; o segundo
  registra apenas o último estado remoto validado, sem antecipar resultado das
  specs seguintes.
- A ordem é:
    1. revalidar projeto, página, consentimento, capability e arquivo;
    2. persistir attempt `CREATED` e depois `SUBMITTING`;
    3. enviar a primeira página ordenada `DRAFT`;
    4. persistir receipt `ACCEPTED` e referência remota;
    5. transicionar atomicamente página e projeto de `DRAFT` para `QUEUED`.
- A UI não marca `QUEUED` antes do aceite remoto verificável. Rejeição explícita
  marca o attempt `REJECTED` e mantém o domínio em `DRAFT`.
- Timeout/desconexão após início do request produz `UNKNOWN`, preserva a mesma
  chave e agenda consulta segura. Enquanto ambíguo, nova submissão fica bloqueada
  e a UI comunica **Confirmando envio**, sem alegar falha ou sucesso.
- Na inicialização, attempts `SUBMITTING`/`UNKNOWN` são retomados por consulta. Um
  receipt aceito conclui a transição; inexistência remota confirmada permite
  reenviar com a mesma chave; resposta inconclusiva permanece ambígua.
- MOB-FEAT-017 submete somente a primeira página do projeto para o slice de prova.
  Scheduler multi-page e prioridade pertencem a `MOB-FEAT-022`.

### Cancelamento

- Cancelar request local antes de receipt não equivale a cancelar job remoto; o
  attempt vira `UNKNOWN` até reconciliação.
- Para receipt aceito, o app pede cancelamento remoto e só transiciona o domínio
  local para `CANCELLED` após confirmação terminal do gateway.
- Se o gateway disser que o trabalho já começou/terminou ou não pode ser
  cancelado, o estado local permanece verdadeiro e a limitação é comunicada.
- Cancelamento ambíguo usa `CANCEL_PENDING` e consulta idempotente. Nenhuma ação
  apaga original ou projeto nesta feature.

### UX, privacidade e observabilidade

- Estados visíveis desta feature: disclosure, enviando, confirmando envio, na
  fila, falha acionável e cancelamento pendente/concluído. O gateway também
  publica `OCR`, `TRANSLATING`, `RENDERING` e `READY` para as specs seguintes.
  Não há ETA nem percentual temporal fictício.
- Usuário pode sair da tela durante submissão; o attempt persiste e a retomada
  não depende de login. Sem rede, conteúdo/projeto continuam acessíveis, mas a
  ação remota explica a necessidade de conexão.
- Eventos/logs usam somente nome do evento, versão do contrato, código de erro,
  etapa, duração em bucket e IDs de correlação opacos. Imagem, texto, idiomas
  combinados com ID, filename, path, URI, response bruto, token e job ref ficam
  fora de analytics/logs.
- Erros visíveis estáveis: `consent-required`, `unsupported-pair`,
  `capabilities-unavailable`, `network-required`, `submission-unknown`,
  `gateway-rejected`, `cancellation-pending`, `cancellation-unavailable` e
  `storage-unavailable`.
- UI e mensagens têm paridade pt-BR/en-US/es-ES, foco/leitura acessíveis,
  loading/disabled e alvo de toque adequado.

## Plano de persistência local

### 🗄️ Banco escolhido

SQLite privado, no mesmo banco local do projeto. Consentimento e attempts são
relacionais, precisam de FK, unicidade, transação e recovery offline. Nenhuma
tabela é criada na Core; o estado server-side pertence ao serviço externo.

### 📐 Modelo em BCNF

Migração `v6 → v7`; v6 já pertence à separação `zh-Hans`/`zh-Hant` e ao campo
`language_review_required` executados por `MOB-FEAT-016`:

`remote_processing_consents`:

- `project_id TEXT NOT NULL`;
- `disclosure_version TEXT NOT NULL`;
- `presented_locale TEXT NOT NULL`;
- `accepted_at INTEGER NOT NULL`;
- PK `(project_id, disclosure_version)`.

Dependência funcional: `(project_id, disclosure_version) → locale, accepted_at`;
a determinante é chave candidata. Histórico por versão é preservado, sem
sobrescrever aceite anterior.

`remote_processing_attempts`:

- `id TEXT PRIMARY KEY NOT NULL`;
- `page_id TEXT NOT NULL`;
- `attempt_number INTEGER NOT NULL`;
- `idempotency_key TEXT NOT NULL UNIQUE`;
- `gateway_key TEXT NOT NULL`;
- `gateway_contract_version TEXT NOT NULL`;
- `status TEXT NOT NULL`;
- `remote_status TEXT` nullable;
- `remote_job_ref TEXT` nullable;
- `error_code TEXT` nullable e sanitizado;
- `created_at`, `updated_at` e timestamps opcionais de
  submissão/aceite/consulta/cancelamento.

Dependências funcionais: `id → atributos`; `(page_id, attempt_number) → attempt`;
`idempotency_key → attempt`; e `(gateway_key, remote_job_ref) → attempt` quando a
referência existe. Todas as determinantes são chaves candidatas. Projeto,
idiomas, MIME e filename não são duplicados: derivam das FKs/snapshot de
`MOB-FEAT-016`. `gateway_key` e `gateway_contract_version` são snapshots técnicos
deliberados necessários para reconciliar a tentativa contra a origem correta
mesmo após uma mudança de configuração.

### 🔗 Integridade

- consent `project_id → translation_projects.id ON DELETE CASCADE`;
- attempt `page_id → translation_pages.id ON DELETE CASCADE`;
- `UNIQUE(page_id, attempt_number)`, attempts numerados a partir de 1;
- índice `UNIQUE(page_id) WHERE status IN (...)` impede dois attempts locais
  ativos concorrentes para a mesma página;
- `UNIQUE(gateway_key, remote_job_ref)` impede colisão sem presumir que uma ref
  seja global entre gateways substituíveis;
- `presented_locale` restrito aos três locales da interface;
- status local restrito a `CREATED`, `SUBMITTING`, `ACCEPTED`, `REJECTED`,
  `UNKNOWN`, `FAILED`, `CANCEL_PENDING` e `CANCELLED`;
- `remote_status`, quando presente, restrito a `QUEUED`, `OCR`, `TRANSLATING`,
  `RENDERING`, `READY`, `FAILED`, `CANCEL_PENDING`, `CANCELLED` e
  `RESULT_EXPIRED`;
- remote ref obrigatório apenas em estados que receberam receipt, conforme CHECK
  final alinhado ao contrato;
- timestamps positivos/monotônicos e combinações de erro/status validadas.

### ⚡ Índices

- PK do consent cobre a FK `project_id` e busca por projeto;
- UNIQUE `(page_id, attempt_number)` cobre a FK e histórico ordenado da página;
- UNIQUE de `idempotency_key` e `(gateway_key, remote_job_ref)` cobre
  reconciliação;
- o índice parcial por página ativa é uma garantia de integridade, não uma
  otimização por baixa cardinalidade; nenhum índice geral de status será criado.

### 🧮 Derivados

Não há contador, progresso ou cache de resultado. A tentativa corrente é a maior
`attempt_number` da página; status do projeto/página continua no agregado da
`MOB-FEAT-016` e só muda após receipt verificável.

### 🛠️ Migration + código

- Migration SQLite v7 forward-only e transacional, limitada a consentimentos e
  attempts; resultados e regiões continuam pertencendo a `MOB-FEAT-018..021`.
- Mudança coordenada futura: migration/helper, entities de consent/attempt,
  repository, adapter gateway, feature, page, i18n, registry de dados locais,
  coverage e testes de instalação limpa/upgrade/restart.
- Estrutura FSD planejada, de baixo para cima:

```text
shared/remote-gateway (HTTPS, timeout, limites e redirects; sem domínio)
  → entities/remote-processing-capability (contrato Zod e leitura)
  → entities/remote-processing-attempt (estado, consent e SQLite v7)
  → entities/translation-project (@x controlada quando necessária)
    → features/start-remote-processing
    → features/cancel-remote-processing
      → pages/offline-translation
        → application (somente bootstrap/recovery global, se necessário)
```

- Features de start/cancel não se importam horizontalmente; a page injeta dados
  e callbacks ou um widget futuro compõe ambas quando houver reuso real.

## Contrato externo aprovado

Estado legal provisório definido em 2026-09-03:

- operador: Ruan Moraes, pessoa física responsável pelo projeto;
- contato público: `ruanmoraessantosbarbosa@gmail.com`;
- URLs canônicas pretendidas: `https://app.toonlira.com/legal/terms` e
  `https://app.toonlira.com/legal/privacy`;
- o domínio ainda não está publicado, os documentos permanecem em rascunho e a
  versão/política do provider continuam vazias; consequentemente o gateway deve
  responder `capabilities-unavailable` e não aceitar upload.

- API HTTP `/v1` com capabilities, instalação/sessão anônima, submit multipart,
  consulta por idempotency key ou job ref, cancel e ACK; OpenAPI será a
  referência executável.
- Gateway Spring Boot separado da Core, com adapters para providers e Terraform
  para Cloud Run/Tasks/SQL/Storage/Secret Manager/Scheduler.
- A aceitação do job e o pedido de dispatch usam outbox PostgreSQL. Criar Cloud
  Task não participa da transação do banco; dispatcher e reconciliação retomam
  linhas pendentes de modo idempotente antes de declarar a fila operacional.
- Conteúdo remoto efêmero: original apagado após OCR (failsafe de uma hora) e
  resultado/manifesto após ACK ou uma hora; metadados sanitizados por sete dias.
- Região e transferência: gateway/dados temporários em São Paulo; OCR e tradução
  nos EUA. Política e disclosure devem declarar isso antes do primeiro upload.
- Idempotência por instalação+chave; URL de resultado assinada curta com hash;
  nenhuma chamada cobrada possui retry automático.
- Limites, URLs legais, versões, matriz de 42 pares, quota e kill switch vêm de
  configuração validada. Ausência ou invalidade fecha o serviço.

Essas decisões abrem o gate de implementação. Deploy real continua condicionado
a billing, credenciais, publicação HTTPS das URLs legais, revisão jurídica,
disclosure versionado e ações externas explicitamente aprovadas.

## Casos de erro

- Projeto/página mudados, terminal ou sem arquivo recusam ação antes do consent.
- Pair/capability incompatível bloqueia envio sem alterar a seleção original.
- Recusa/fechamento do modal é neutro e não cria registro.
- Falha ao persistir consent/attempt impede request; falha ao persistir receipt
  mantém attempt ambíguo e reconcilia antes de repetir.
- Timeout, processo encerrado ou perda de rede nunca criam segunda submissão com
  chave diferente.
- Response inválido, grande, de versão desconhecida ou com transição impossível
  falha fechado e preserva estado local seguro.
- 401/403 não solicitam credencial ao usuário nem recorrem a secret embutido;
  bloqueiam o gateway e apresentam falha operacional sanitizada.
- Cancelamento não suportado ou tardio não mente sobre o estado remoto.

## Critérios de aceite

### AC-001 — Disclosure completo e contratualmente verdadeiro

O disclosure identifica envio, finalidade, rede, dados, operadores, região,
retenção, treinamento, cancelamento e políticas conforme evidência vigente; item
desconhecido impede liberar a ação.

### AC-002 — Consentimento explícito, versionado e escopado

Somente ação afirmativa cria aceite para projeto+versão+locale; recusa/saída não
muta estado nem envia dados e nova versão exige novo aceite.

### AC-003 — Zero upload antes das pré-condições

Projeto, página, arquivo, capability, par linguístico, consentimento e attempt
durável são revalidados antes do primeiro byte de mídia sair do aparelho.

### AC-004 — Gateway substituível e respostas não confiáveis

Capabilities/submit/status/cancel usam porta independente da Core/provider,
HTTPS e parsers/limites fechados contra contrato inválido ou incompatível.

### AC-005 — Secrets e autorização isolados

APK, source, assets, env pública, logs e storage não contêm credencial privada de
OCR/tradução/gateway; esquema de autorização é verificável e revogável.

### AC-006 — Submissão idempotente e persistível

Attempt e idempotency key existem antes da rede; duplo toque, timeout, restart e
retry usam a mesma identidade sem duplicar job ou consumo. No gateway, commit do
job e outbox de dispatch são atômicos.

### AC-007 — Estados locais refletem receipts reais

Página/projeto só chegam a `QUEUED` após aceite verificável e em transação com o
attempt; rejeição mantém `DRAFT` e nenhuma porcentagem/resultado é inventado.

### AC-008 — Ambiguidade e retomada seguras

`SUBMITTING`/`UNKNOWN` sobrevivem ao encerramento, bloqueiam nova submissão e são
resolvidos por consulta/replay idempotente antes de qualquer decisão local.

### AC-009 — Cancelamento verdadeiro e recuperável

Request local, pedido remoto e confirmação terminal são distinguidos;
`CANCEL_PENDING` é retomável e o domínio só cancela após confirmação remota.

### AC-010 — Privacidade, retenção e observabilidade minimizadas

Payload/log/event respeitam allowlist, não expõem conteúdo/paths/tokens e
retenção/deleção reais correspondem ao disclosure e à política publicada.

### AC-011 — UX acessível, trilíngue e honesta

Disclosure, rede obrigatória, envio, ambiguidade, fila, erros e cancelamento têm
paridade pt-BR/en-US/es-ES, acessibilidade e nunca afirmam tradução concluída.

### AC-012 — Primeiro slice e limites preservados

A feature submete no máximo a primeira página e termina em `QUEUED`/estado de
submissão; não implementa OCR, regiões, tradução, render, scheduler, retry de
processamento, quota pública, reader, Core ou provider direto.

## Estratégia de evidência

| Critério | Teste/evidência esperada                                                       |
| -------- | ------------------------------------------------------------------------------ |
| AC-001   | revisão jurídica/privacidade do disclosure contra contrato e policy fixtures   |
| AC-002   | RNTL de aceitar/recusar/fechar/reconsentir e round-trip SQLite                 |
| AC-003   | spy de transporte prova zero request em cada pré-condição ausente              |
| AC-004   | contract tests de capabilities/submit/status/cancel, TLS e payloads hostis     |
| AC-005   | secret scan de source/bundle/AAB e teste de expiração/revogação de autorização |
| AC-006   | duplo toque, replay, timeout e restart com uma única idempotency key/job       |
| AC-007   | fault injection entre receipt/commit e prova transacional de estado            |
| AC-008   | process kill em SUBMITTING/UNKNOWN e reconciliação sem segunda cobrança        |
| AC-009   | cancel antes/depois do receipt, tardio, ambíguo e restart                      |
| AC-010   | inspeção de request/log/event, retention/deletion e política publicada         |
| AC-011   | RNTL trilíngue, screen reader, foco, loading e cópia sem falso sucesso         |
| AC-012   | teste arquitetural sem OCR/provider/Core e somente primeira página submetida   |

## Gate de implementação

- Estado: `open`
- Dependência normativa: `MOB-FEAT-016`
- Motivo: `MOB-FEAT-016` está executada/`verification-pending` e contrato,
  provider, regiões, retenção, autorização e limites do alpha foram aprovados.
- Gate de verificação real: cloud configurada, páginas legais públicas, secret
  scan e teste Android; ausência mantém a implementação em
  `verification-pending`, não refecha o planejamento.

## Manutenção autorizada em 2026-09-01

Ruan autorizou iniciar o plano revisado após a auditoria do estado atual. A
revisão promove a migration local para v7, separa estado local/remoto, escopa a
unicidade da referência por gateway, adiciona proteção de attempt ativo e outbox
remota e corrige a fronteira FSD. O objetivo, os ACs e os limites de produto
permanecem os mesmos.

## Fora de escopo

- Modificar a Core ou áreas não legais de `/web`.
- OCR, regiões, ordem de leitura, tradução, glossário, renderização e resultados.
- Multi-page scheduler, prioridade, retry de processamento e progresso agregado.
- Conta obrigatória, identidade anônima de produção, billing de usuário ou
  proteção de beta baseada em Play Integrity.
- Biblioteca, reader, export, compartilhamento, sync ou backup.
- Chamar provider no client ou manter chave privada no APK.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-08-15

Aprovação humana registrada após planejamento de provider, infraestrutura,
regiões, retenção, quota e UX. Tasks podem ser criadas com o gate aberto;
implementação real deverá permanecer honesta sobre os gates externos.
