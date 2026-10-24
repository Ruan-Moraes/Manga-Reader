# ACK durável e cleanup do resultado — 2026-10-03

## Escopo e autorização

Parcela server-side da TASK-004/007 e AC-006 da 019. A continuidade autorizada
até o renderer permite fechar a lacuna de retenção: o endpoint antes retornava
`409` mesmo para `READY`. Não se deslocou essa obrigação ao cliente da 021.
Nenhum provider, credencial ou recurso cloud foi utilizado. `READY` existe
somente em fixtures de PostgreSQL temporário; renderer não está implementado.

## Plano anterior ao código

A skill `database-design` orientou o
[plano de schema](../../../../../../api/apps/translation-gateway/docs/result-acknowledgement.md):
PostgreSQL para metadados, uma linha por job com PK/FK cascade, timestamps e
índice parcial para claim. `job_id` determina todos os atributos (BCNF).
Instalação, objetos e estado são derivados das tabelas existentes; não há texto,
URLs, cache ou contador novo. V5 é aditiva e preserva V1–V4.

## Comportamento implementado

- Lock do job com instalação autenticada; outro proprietário ou ausência: `404`.
- Primeiro ACK somente de `READY`: pedido e `RESULT_EXPIRED` no mesmo commit.
- Repetição: `202` sem body, timestamp original e sem reabrir cleanup concluído.
- Estados não prontos sem ACK anterior: `409`, sem alteração de estado.
- Cleanup claim de até 100 pedidos com `SKIP LOCKED`, lease de cinco minutos.
- Uma consulta de lote reúne original e artefatos de etapas/layout, sem N+1.
- Storage fora da transação; exclusão somente desses objetos, sem varrer bucket.
- Falha parcial: próximo cleanup em um minuto; lease expirada também recuperável.
- Confirmação perdida ou executor antigo não reabre pedido concluído nem altera
  lease nova. Repetição da remoção é idempotente, sem OCR/tradução.
- TTL de uma hora e cascade com retenção de metadados continuam failsafes.

A integração da 020 deverá incluir todos os objetos finais que criar nessa
projeção antes de produzir `READY`. Nenhum nome/schema do renderer foi presumido.
ACK não comprova integridade de download: o cliente futuro só o envia após seu
commit local, conforme 021.

## Testes e regressões

Testes de aplicação cobrem owner/clock, coleção copiada e representação
sanitizada, falha de storage/commit, lease antiga, lote com falha isolada e vazio.
MockMvc mantém filtros ativos para `401` sem sessão e `202` com owner correto;
controller também cobre body vazio e conflitos. Cleanup principal continua TTL
e retenção de banco mesmo quando ACK exige nova tentativa, retornando erro
sanitizado.

PostgreSQL 17 aplica V1–V5: ACK concorrente único, isolamento, todos os estados
não prontos, rollback, constraints/FK/cascade/índices e claims concorrentes.
Storage local verifica cinco artefatos pertencentes ao job, preserva outro job,
recomeça após falha parcial e trata conclusão com confirmação perdida. Nenhuma
transação permanece aberta durante a exclusão.

O primeiro gate integral detectou três erros de contexto MockMvc por falta do
novo mock e um erro numa fixture OCR: `Instant.now()` na criação seguido por
truncamento do instante de claim podia produzir `updated_at < created_at`.
Correções: mock do caso de uso ACK e instante único na fixture. Não se
desabilitaram filtros, constraints, testes ou verificadores para passar.
Os testes focalizados de segurança e PostgreSQL passaram após a correção.

```bash
# Em api/, sem rede externa
./mvnw -o -q -pl apps/translation-gateway -am test \
  -Dtest=GatewaySecurityTest,GatewaySchemaMigrationTest \
  -Dsurefire.failIfNoSpecifiedTests=false
./mvnw -o -q test
```

- [Use case ACK](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/application/AcknowledgeResultUseCase.java).
- [Repository JDBC](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/infrastructure/persistence/JdbcResultAcknowledgementRepository.java).
- [Cleanup](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/application/CleanupAcknowledgedResultsUseCase.java).
- [Migration V5](../../../../../../api/apps/translation-gateway/src/main/resources/db/migration/V5__durable_result_acknowledgements.sql).
- [Integração PostgreSQL](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/persistence/GatewaySchemaMigrationTest.java).
- [Segurança HTTP](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/security/GatewaySecurityTest.java).
- [Falhas de cleanup](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/application/CleanupAcknowledgedResultsUseCaseTest.java).

## Limites e decisão

Retenção/ACK server-side não equivalem a operação cloud validada, tradução real
ou entrega mobile. Download, commit integral e envio/recovery do ACK são da 021.
Qualidade/contexto real, referências humanas e IAM/retensão em produção
continuam abertos. A 019 permanece `in-progress`; 020/021 continuam bloqueadas
até a decisão de gate completa. Defaults e habilitação de uploads não mudaram.

## Revalidação técnica e snapshot

- Maven global offline com Docker: `./mvnw -o -q test`, exit 0.
- Gateway completo, após o ajuste de imports do teste: 43 classes/352 testes,
  zero falhas, erros ou skips; cadeia Flyway V1–V5 em PostgreSQL 17.
- Gateway leve: `-Dtest.excludedGroups=testcontainers`, exit 0. Os testes
  PostgreSQL não são selecionados nesse comando; não somar seus relatórios
  históricos nem os quatro `*IT` antigos ao resultado leve. Foram 42 classes
  e 305 testes, zero falhas, erros ou skips.
- Tooling Node: 85 testes aprovados, zero falhas; um teste opt-in de renderização
  de controles tipográficos não executado por ausência de fonte local explícita.
  Isso não é evidência de renderização ou glyphs da 020.
- Type-check web: `./node_modules/.bin/tsc -b`, exit 0.
- Mobile `pnpm check` integral: exit 0; 116 suítes/857 testes Jest, 30 de
  performance, 24 SDD e seis de boundaries. Type-check, ESLint, FSD, links e
  Prettier passaram. Avisos preexistentes de `act` permaneceram sem alteração.
- Checksum SDD renovado mecanicamente nos headers correntes; conclusões
  históricas de outras features não foram revalidadas ou reescritas.

Snapshot técnico corrente do gateway: 191 arquivos,
`989dc085cd0880b3f54f255b9380d271c8253eb4bd00fb9fff165b8c1ef55738`.
Mesmo algoritmo da [evidência de leitura](translation-manifest-reader-2026-10-03.md):
caminhos relativos ordenados + NUL + conteúdo + NUL, SHA-256 de
`src`, `scripts`, `openapi`, `pom.xml` e Terraform `.tf`/`.tfvars.example`.
Documentos, build e artefatos privados não integram esse hash. Não substituir
snapshots anteriores, incluindo a auditoria OCR, nem apresentar o checksum
mobile como cobertura do Java.
