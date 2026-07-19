# Auditoria de configurações do Mangahost — 18/07/2026

> **Estado do documento.** As seções de auditoria abaixo preservam, de propósito, a
> fotografia anterior à correção e as reproduções que originaram A-01–A-12. A
> remediação foi executada no mesmo dia. O estado atual verificado está no adendo
> pós-remediação e na
> [`matriz de remediação`](2026-07-18-mangahost-remediation-matrix.md); o CSV foi
> atualizado para refletir a classificação final.

## Adendo pós-remediação

As doze frentes foram implementadas sem descartar alterações preexistentes. O
inventário final mantém 66 itens:

| Classificação final | Quantidade |
|---|---:|
| totalmente integrada | 58 |
| parcialmente integrada | 5 |
| somente persistida | 0 |
| somente visual | 1 |
| hardcoded | 0 |
| com defeito | 0 |
| não encontrada | 2 |

Os cinco itens parciais são: gêneros favoritos sem recomendação automática; tema e
idioma mobile sem tela/sincronização com o perfil web; capítulos administrativos sem
upload de páginas por ausência do serviço de mídia; e SMTP configurado, mas sem
servidor local. A preferência de idioma de conteúdo do convidado continua somente
visual. O prazo de reset de senha passou a vir do contrato público do backend e não
permanece hardcoded nos clientes. Importação e notificações estão explicitamente
indisponíveis, sem simular sucesso.

Provas finais: API atual com liveness/readiness 200/UP; 16 preferências alteradas,
recuperadas após restart e restauradas; autorização de capítulos 401/403/200; Mongo
com 49 capítulos e migrations/índices editoriais; rate limit distribuído observado no
Redis; web exercitado com `demo` e `admin`; login e recuperação de sessão comprovados
no iPhone Simulator. Tokens, valores seed, API/Metro temporários, Expo Go e artefatos
temporários foram removidos ao final. O processo antigo do usuário em `:8080` foi
preservado; por estar desatualizado, as provas da versão corrente usaram `:18080`.

Todos os gates finais passaram: API 1.364 testes; web 1.158 testes mais TypeScript e
FSD; landing 71 testes e build; mobile check completo; rating/orphan/trending com
11/12/15 testes. Detalhes e comandos estão na matriz de remediação.

## Resumo executivo

Na etapa original, esta auditoria avaliou o estado **observado no working tree**, não
apenas o último commit, e não implementou correções. Foram rastreadas 66 configurações desde a
interface até o consumidor final, cobrindo web, landing page, mobile, painel
administrativo, API, PostgreSQL, MongoDB, Redis, Docker e os três jobs.

| Classificação | Quantidade |
|---|---:|
| totalmente integrada | 30 |
| parcialmente integrada | 11 |
| somente persistida | 5 |
| somente visual | 5 |
| hardcoded | 4 |
| com defeito | 10 |
| não encontrada | 1 |

O núcleo de persistência das 16 preferências de sistema está bem modelado:
`user_system_settings` está em BCNF, tem uma linha por usuário, FK com cascade,
`NOT NULL`, defaults e `CHECK` para todos os enums e ranges. O mesmo vale para as
quatro preferências de privacidade em `user_profile_settings`. A prova dinâmica
confirmou validação, normalização, persistência e recuperação após restart.

O principal problema não é salvar a configuração, mas consumi-la corretamente.
Qualidade de imagem, preload, formato de data, timezone e conteúdo adulto são
recuperados sem efeito funcional. Marcação automática e tema claro têm comportamento
incorreto. O leitor ainda mantém uma segunda fonte em `reader:prefs`, fora do fluxo
central que sincroniza `mr.settings.v1` com a API.

Há ainda problemas operacionais comprovados: login concorrente/multi-instância pode
retornar 500 por refresh tokens JWT idênticos; caches de título, tag e planos não são
invalidados nas mutações; a API fica `DOWN` por depender do SMTP local no health; as
migrations Mongock do trending não estão materializadas no Mongo real; e o workaround
de Mongo 8 para kernel Linux 6.19+ existe no Compose, mas não nos Testcontainers.

O inventário filtrável e a evidência por item estão em
[`2026-07-18-mangahost-config-inventory.csv`](2026-07-18-mangahost-config-inventory.csv).

## Escopo e método

Foram incluídos:

- produto/usuário: 16 preferências do sistema, idioma de UI e conteúdo, gêneros,
  privacidade, conteúdo adulto e preferências mobile;
- produto/admin: vocabulários, planos, flags/status e a implementação provisória de
  capítulos;
- ações da área de configurações: cache, histórico, importação, exportação e
  notificações;
- operação: Spring profiles/env, clientes, CORS, JWT/cookies, SMTP, Redis/caches,
  rate limits, crons, retenção, pesos e tokens administrativos.

CRUD de conteúdo comum foi excluído, exceto quando o campo age como regra,
vocabulário ou flag reutilizável. Segredos foram redigidos; o relatório registra
apenas nomes de variáveis, defaults não sensíveis e propriedades.

Cada item foi rastreado por:

`interface → request → validação → persistência → recuperação → precedência → consumidor → efeito`.

A análise de persistência comparou Flyway/Mongock, entities/adapters e catálogos reais.
Para o frontend foi usada a ordem FSD `shared → entities → features → widgets → pages
→ app`; nenhuma mudança estrutural foi feita. Para dados persistentes, a avaliação
seguiu BCNF, constraints, índices e migrations forward-only.

## Linha de base

### Código e ferramentas

| Item | Valor observado |
|---|---|
| Commit | `3cfaafcf5113fd840b062964b512239a5015ffca` |
| Branch | `feat/auth-refresh-rotation` |
| Working tree | 185 entradas modificadas/não rastreadas; preservadas |
| Sistema | macOS 26.5.1, arm64 |
| Java | Corretto 23.0.2 |
| Maven | 3.9.9 |
| Node | 22.23.1 |
| pnpm | 11.10.0 |
| Docker / Compose | 29.4.0 / 5.1.2 |

Os achados refletem mudanças ainda não commitadas, especialmente feed de atividade,
privacidade e landing page. Falhas desses trechos foram registradas como baseline do
working tree e não atribuídas à auditoria.

### Processos e saúde inicial/final

| Componente | Estado |
|---|---|
| Web `:5173` | HTTP 200 |
| API `:8080` | escuta; health HTTP 503/DOWN |
| Rating aggregator `:8081` | não estava em execução |
| Orphan cleaner `:8082` | não estava em execução |
| Trending aggregator `:8083` | HTTP 200/UP |
| PostgreSQL 17 | container healthy |
| MongoDB 8.0.26 | container healthy |
| RabbitMQ 4.3.2 | container healthy |
| Redis 7.4.9 | container healthy |
| Neo4j 5.26.28 | container healthy |

O health autenticado mostrou PostgreSQL, MongoDB, Redis, RabbitMQ, Neo4j, disco e
SSL `UP`; somente `mail` estava `DOWN`, por conexão recusada em `localhost:1025`.

## Provas dinâmicas

### Preferências de sistema e recuperação

Na conta seed `demo`:

1. foi salvo o objeto original completo;
2. `reader.gap` foi alterado de 8 para 17, `fontSize` para `COMFORTABLE` e
   `dateFormat` para `MON_D`;
3. PATCH, GET posterior e consulta direta ao PostgreSQL retornaram os novos valores;
4. `gap=99` e `theme=NEON` retornaram HTTP 400; GET sem token retornou 401;
5. em uma segunda API em `:18080`, `gap=19` foi lido antes e depois do restart;
6. os valores originais foram restaurados (`gap=8`, `fontSize=DEFAULT`,
   `dateFormat=D_MON`).

Isso comprova `env/profile → YAML/default` para `SERVER_PORT`/datasource e comprova
que as preferências vêm do PostgreSQL após restart, não apenas de cache em memória.

### Idiomas e privacidade

- `contentLocales=["en-us","es-ES"]` foi normalizado para
  `["en-US","es-ES"]`, persistido e retornado por novo GET;
- lista vazia retornou HTTP 400;
- `commentVisibility=PRIVATE` manteve leitura do dono e retornou página vazia para
  terceiro autenticado e anônimo;
- enum de privacidade desconhecido retornou HTTP 400;
- a conta `demo` terminou novamente com `["pt-BR"]`, privacidades `PUBLIC` e
  conteúdo adulto `BLUR`.

Não foi alternado dinamicamente `viewHistoryVisibility` para `DO_NOT_TRACK`, pois a
implementação atual apaga projeções de histórico ao entrar ou sair desse estado. A
prova foi feita por fluxo estático e testes direcionados, evitando apagar o histórico
seed.

### Navegador

A sessão já aberta pertencia a “Codex Histórico QA”, não às contas seed. Ela foi usada
somente para observação e para uma ação sem efeito persistente:

- `/settings` exibiu as 16 preferências com `gap=8` e preload 3;
- a aba Dados exibiu cache invariável de `186 MB de 512 MB`;
- Exportar mostrou apenas o toast “Exportação iniciada”, sem download;
- `/notifications` mostrou somente “Estamos preparando as notificações”.

Nenhuma configuração da conta QA foi alterada. Na fotografia original, o simulador
iOS não estava operacional (CoreSimulator indisponível), portanto aquela etapa validou
o mobile por store, SecureStore, gate, tema/i18n e header HTTP. A prova posterior no
simulador está registrada no adendo.

### Restauração

Foram removidos exatamente 12 refresh tokens criados pelos logins da auditoria nas
contas seed e reativado o único token seed-admin pré-existente revogado por essas
provas. Nenhuma conta pessoal ou dado de conteúdo foi modificado. A instância
temporária `:18080` foi encerrada; os processos originais ficaram como encontrados.

## Schema, migrations e caches

### PostgreSQL/Flyway

O banco real está em Flyway V42. Para o escopo de configuração:

- `user_system_settings`: PK/FK `user_id`, 16 valores tipados, todos `NOT NULL`,
  defaults e 13 constraints `CHECK`; ranges `gap 0..32` e `preload 0..10`;
- `user_profile_settings`: PK/FK `user_id`, quatro valores `NOT NULL`, defaults e
  `CHECK`, incluindo `library_visibility` da V38;
- `users.content_locales` e `users.favorite_genres`: `jsonb NOT NULL` com defaults;
- V35/V36 migraram os JSONs legados para tabelas normalizadas e fizeram backfill;
- V37 adicionou gêneros favoritos e V38 a visibilidade da biblioteca.

As duas tabelas 1:1 estão em BCNF: cada atributo depende apenas da chave `user_id`.
Usar colunas tipadas aqui é preferível a um JSON genérico de configurações. Os arrays
`content_locales` e `favorite_genres` são pequenos e ordenados; a existência dos
gêneros, porém, é garantida no use case, não por FK física.

### MongoDB/Mongock

Foram inspecionadas 18 coleções e seus índices. Os índices de comentários, votos,
reviews, progresso, leitura e histórico estão presentes. `auto-index-creation=false`
é coerente com migrations explícitas.

Há drift comprovado no trending: `V001CreateTrendingIndexes` e
`V002CreateMetricRankingIndexes` declaram índices de ranking, métricas, sinais e TTL,
mas `title_trend_daily` possui apenas `_id_` e o `mongockChangeLog` real não registra
essas change units. O job responde health 200, portanto health não prova que migrations
operacionais foram aplicadas.

### Redis e frontend

O Redis usava 1,12 MB de 128 MB, política `allkeys-lru`, com duas chaves:
`public-stats::SimpleKey []` e `subscription-plans::SimpleKey []`. TTLs declarados:

| Cache | TTL |
|---|---:|
| default | 5 min |
| title | 10 min |
| rating average | 2 min |
| tag | 30 min |
| public stats | 30 min |
| subscription plans | 1 h |

Somente mutações de review têm `@CacheEvict`. Não há evict para título, tag,
estatísticas ou planos. TTL reduz duração do erro, mas não é garantia de consistência.

No web, configurações usam React Query, `staleTime` de cinco minutos, debounce de
400 ms e `localStorage mr.settings.v1`. O leitor também grava `reader:prefs`, criando
duas fontes. i18next usa `i18nextLng`. No mobile, tema/idioma e tokens usam
SecureStore.

## Achados comprovados

### A-01 — Refresh token colide em login concorrente/multi-instância

- **Prioridade:** alta; **complexidade:** S; **risco:** alto; **módulos:** auth/API.
- **Evidência:** `JwtTokenProvider.java:59-66`, `refresh_tokens.token_hash` único.
- **Reprodução:** iniciar API alternativa em `:18080`; autenticar o mesmo usuário no
  mesmo segundo nas duas instâncias.
- **Atual:** o JWT contém apenas subject, type, issuedAt e expiration; tokens do mesmo
  usuário no mesmo segundo são idênticos. O segundo insert retorna 500 por
  `uk_refresh_tokens_token_hash`.
- **Esperado:** cada emissão deve ser única e a colisão nunca deve escapar como 500.
- **Correção futura:** incluir `jti` aleatório/UUID no refresh JWT, manter hash único e
  testar concorrência/multi-instância.

### A-02 — Preferências persistidas sem consumidor e leitor com fonte dupla

- **Prioridade:** alta; **complexidade:** M; **risco:** médio; **módulos:**
  entities/user, pages/settings, pages/chapter.
- **Evidência:** `ReaderTab.tsx:67-126`, `useChapterReader.ts:25`,
  `userSettings.types.ts:17-21`.
- **Atual:** qualidade, preload, formato de data e timezone só são salvos; auto-mark é
  ignorado. O leitor altera `reader:prefs`, mas o sync autenticado pertence ao hook da
  página de configurações.
- **Esperado:** cada opção deve ter consumidor observável e uma única precedência.
- **Correção futura:** centralizar leitura/escrita em contrato tipado da entity user;
  o leitor consome esse contrato e mantém apenas estado efêmero de sessão quando
  explicitamente necessário.

### A-03 — Tema LIGHT é aplicado como DARK

- **Prioridade:** média; **complexidade:** XS; **risco:** baixo; **módulos:** web user.
- **Evidência:** `entities/user/lib/accessibility.ts:17,125`.
- **Atual:** qualquer tema diferente de `SYSTEM` recebe `mr-theme-dark`; LIGHT é
  aceito pela API/DB, mas a opção está desabilitada na UI.
- **Esperado:** LIGHT deve possuir classe/semântica própria ou não fazer parte do
  contrato persistido até existir.

### A-04 — Semântica de privacidade incompleta

- **Prioridade:** alta; **complexidade:** M; **risco:** alto; **módulos:** user,
  comments, catálogo web.
- **Evidência:** `VisibilitySetting.java:8`, `GetUserCommentsUseCase`,
  `AdultContentPreference.java`, `AuthController.java:187`.
- **Atual:** `commentVisibility=DO_NOT_TRACK` é tratado como privado, mas comentários
  continuam sendo coletados; `adultContentPreference` é retornado sem filtrar, ocultar
  ou borrar conteúdo.
- **Esperado:** DO_NOT_TRACK deve impedir a coleta definida pelo contrato; BLUR/SHOW/
  HIDE devem produzir efeito consistente em listas, cards, busca e leitor.
- **Dependência:** antes de alterar retenção/deleção, modelar comportamento e migração
  com `database-design`.

### A-05 — Ações da aba Dados são somente visuais

- **Prioridade:** média; **complexidade:** M; **risco:** médio; **módulos:** settings,
  library, history, cache.
- **Evidência:** `DataTab.tsx:13-14`, inspeção dinâmica e ausência de services.
- **Atual:** cache mostra 186/512 MB hardcoded; limpar cache/histórico, importar e
  exportar terminam em confirmação/toast.
- **Esperado:** ocultar ou marcar inequivocamente como futuro; quando implementadas,
  executar operações reais, reversíveis e observáveis.

### A-06 — Caches não são invalidados após mutações

- **Prioridade:** alta; **complexidade:** S; **risco:** médio; **módulos:** title, tag,
  subscription, stats.
- **Evidência:** `CacheConfig.java:38-50`; busca global encontra `@CacheEvict` apenas
  em Submit/Update/DeleteReviewUseCase.
- **Atual:** mutações podem servir título por 10 min, tag por 30 min e planos por 1 h.
- **Esperado:** persistir primeiro; somente após commit invalidar/atualizar as chaves,
  com métrica/log de falha.

### A-07 — API health DOWN por SMTP opcional de desenvolvimento

- **Prioridade:** média; **complexidade:** XS; **risco:** médio; **módulos:** operação.
- **Evidência:** `/actuator/health` autenticado: `mail=DOWN`, todos os demais `UP`.
- **Atual:** ausência de Mailpit/SMTP em `localhost:1025` torna toda a API 503.
- **Esperado:** alinhar Compose/README para subir o SMTP local ou criar grupo de
  readiness que não derrube a API por dependência opcional.

### A-08 — Workaround do Mongo 8 não cobre Testcontainers

- **Prioridade:** alta; **complexidade:** S; **risco:** baixo; **módulos:** testes API e
  jobs.
- **Evidência:** `docker-compose.yml` define `GLIBC_TUNABLES`, mas os containers de
  teste encerram com SERVER-121912 em kernel 6.19+.
- **Atual:** API completa, rating e orphan não fecham verdes neste Mac.
- **Esperado:** aplicar a mesma opção ao `MongoDBContainer` compartilhado e aos jobs,
  ou usar imagem corrigida; manter o workaround centralizado.

### A-09 — Índices Mongock do trending ausentes no banco real

- **Prioridade:** alta; **complexidade:** S; **risco:** alto; **módulos:** trending/Mongo.
- **Evidência:** `V001CreateTrendingIndexes.java:26-40`,
  `V002CreateMetricRankingIndexes.java`, `getIndexes()` e `mongockChangeLog` reais.
- **Atual:** ranking e TTL funcionam sem os índices declarados, com risco de scan e de
  retenção não aplicada.
- **Esperado:** change units executadas e verificadas no startup/health ou smoke.

### A-10 — Overrides documentados dos jobs não chegam pelo Compose prod

- **Prioridade:** média; **complexidade:** XS; **risco:** médio; **módulos:** deploy.
- **Evidência:** `docker-compose.prod.yml:80-157` versus os três READMEs.
- **Atual:** tokens/conexões e retenção são passados; crons, zone e pesos ficam nos
  defaults da imagem a menos que o Compose seja editado.
- **Esperado:** declarar explicitamente os envs suportados ou documentar que são
  imutáveis por release.

### A-11 — Parâmetros de segurança hardcoded/divergentes

- **Prioridade:** média; **complexidade:** S; **risco:** médio; **módulos:** security.
- **Evidência:** `RateLimitFilter.java:37-44`, `JwtTokenProvider.java:94`,
  `RefreshTokenCleanupJob.java`.
- **Atual:** rate limit é local por JVM, aceita forwarded headers sem lista de proxies,
  reset expira em 15 min enquanto a ajuda informa 30, e cron/retenção de refresh são
  constantes.
- **Esperado:** properties tipadas, validação de startup e documentação única.

### A-12 — Capítulos admin continuam locais

- **Prioridade:** baixa; **complexidade:** L; **risco:** médio; **módulos:** admin,
  chapter, Mongo.
- **Evidência:** `mr:chapters:admin:v1`, gateways locais e DT-57.
- **Atual:** CRUD, status, agendamento e métricas são simulações de navegador.
- **Esperado:** API real e coleção/migration conforme o plano já registrado em DT-57.

## Gates executados na fotografia original

Todos os comandos foram executados em 18/07/2026 sobre o mesmo working tree.

| Módulo/comando | Resultado |
|---|---|
| API `./mvnw test` | falhou: 1330 testes, 16 failures, 170 errors; cascata Mongo/Testcontainers e falhas reais do working tree (Clock nulo, classes ausentes e expectativas divergentes) |
| API direcionada a settings/privacy/i18n/cache/rate limit | 38/38 passaram |
| Web `npx tsc -b` | falhou em `useHideActivityEvent.ts:43` (`FeedCache` incompatível com updater `void`) |
| Web `pnpm lint:fsd` | passou, sem diagnósticos |
| Web `npx vitest run --pool=forks` | 1140/1145 passaram; 4 timeouts axe e 1 falha de cache do ActivityTab |
| Web testes direcionados de settings/i18n/a11y | 20/20 passaram |
| Mobile `pnpm check` | typecheck, eslint e FSD passaram; format falhou em `.expo/types/router.d.ts` e `README.md` |
| Landing `pnpm build` | passou |
| Landing testes | 68/69 passaram; `App.test.tsx` timeout de 5 s |
| Rating aggregator | 7/8 passaram; 1 erro de boot Mongo/Testcontainers |
| Orphan cleaner | 5/7 passaram; 2 erros de boot Mongo/Testcontainers |
| Trending aggregator | 13/13 passaram |

Os timeouts web/landing podem ser amplificados pela execução concorrente, mas foram
reproduzidos no gate solicitado e permanecem falhas do baseline. O erro de TypeScript
e a falha do ActivityTab estão nos arquivos não commitados pré-existentes.

## Plano de integração recomendado

### 0. Recuperar os gates e a observabilidade

- aplicar o workaround Mongo a todos os Testcontainers;
- corrigir os erros atuais de TypeScript/testes em mudanças focadas;
- separar liveness/readiness e tornar a causa do `DOWN` imediatamente visível;
- adicionar smoke que afirma a presença dos índices Mongock dos jobs.

### 1. Definir contratos tipados e precedência única

Não criar um JSON genérico de “todas as configurações”. Manter:

- `user_system_settings` para preferências tipadas 1:1;
- `user_profile_settings` para privacidade;
- tabelas próprias para vocabulários e planos;
- properties classes tipadas para operação/jobs.

Precedência recomendada:

1. leitor/sessão efêmera, somente para ajustes ainda não confirmados;
2. preferência autenticada persistida;
3. configuração global tipada;
4. default do domínio.

Convidado: armazenamento local tipado → default. Idioma de conteúdo:
usuário → `Accept-Language` → `pt-BR`. Operação: env/profile → YAML → default validado.

### 2. Unificar o fluxo frontend em ordem FSD

1. `shared`: primitives de storage, parsing e headers, sem regra de produto;
2. `entities/user`: contrato, query/mutation e aplicação de preferências;
3. `features`: comandos de alterar/exportar/importar/limpar;
4. `widgets`: painéis e menus que apenas compõem features;
5. `pages`: orquestração e estados de rota;
6. `app`: providers/hydration.

Preservar APIs públicas dos slices. Remover `reader:prefs` somente depois de uma
migração client-side idempotente para o contrato central.

### 3. Ligar cada configuração a um consumidor observável

- implementar qualidade/preload no pipeline de imagens;
- condicionar auto-mark antes de registrar conclusão;
- criar formatador central que aceite dateFormat/timezone;
- aplicar conteúdo adulto em consulta e apresentação, com semântica única;
- implementar tema claro ou remover LIGHT do contrato até a entrega.

Cada item deve ter teste `escrita → GET → reload/restart → efeito`, não apenas teste
de persistência.

### 4. Consistência e segurança operacional

- escrita de banco primeiro; invalidação de cache somente após commit bem-sucedido;
- adicionar `jti` único ao refresh token e teste concorrente;
- properties com `@ConfigurationProperties` + Bean Validation para crons, pesos,
  retenção, durações e limites;
- expor todos os overrides suportados no Compose prod;
- logar configuração efetiva sem segredos e rejeitar valores inválidos no startup.

### 5. Evoluções persistentes

Qualquer alteração futura de tabela/coleção deve passar por plano de schema, BCNF,
FKs/índices/constraints e migration forward-only. Backfills devem ser idempotentes e
compatíveis com dados antigos. Não usar TTL como mecanismo de correção; jobs de
reconciliação continuam sendo redes de segurança, não substitutos da consistência do
caminho quente.

## Limitações da fotografia original

- nenhum simulador mobile estava disponível;
- rating e orphan não estavam em execução, então crons foram provados por binding,
  código e testes, não por espera real até o horário;
- a API principal não foi interrompida; o restart foi provado em processo isolado;
- DO_NOT_TRACK do histórico não foi alternado na seed para evitar deleção destrutiva;
- nenhum segredo, token bruto, hash ou conteúdo pessoal foi incluído nos artefatos.

## Critério de encerramento da fotografia original

O critério acima descrevia a auditoria antes da autorização posterior para implementar
A-01–A-12. Ele é mantido como registro histórico e foi substituído, para o estado
corrente, pelos gates e critérios da matriz de remediação.
