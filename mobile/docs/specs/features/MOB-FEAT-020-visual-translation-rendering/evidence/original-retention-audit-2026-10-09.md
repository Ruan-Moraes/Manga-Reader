# Auditoria adicional de retenção — 2026-10-09 UTC

Continuação da [implementação do snapshot original](original-retention-snapshot-2026-10-09.md),
sem alteração de runtime, schema, imagens, credenciais ou cloud nesta parcela.
020 continua `in-progress/open`, verdict `changes-requested`; 021 bloqueada.
Performance mobile N/A: somente testes Java e governança foram alterados.

## Provas adicionais aprovadas

- Upgrade especificamente V7→V8 em PostgreSQL 17: uma migration nova,
  snapshot legado 3600, criação preservada, duas etapas de entrada SUCCEEDED
  e outbox PENDING intactas. Migration não renova o prazo a partir do upgrade.
  O marcador Flyway de criação de schema, sem versão, não é uma migration Vn.
- `EXPLAIN (ANALYZE, BUFFERS, TIMING OFF)` da consulta real de disponibilidade
  usa a PK existente. A consulta real de expiração contém Limit/LockRows;
  execução diagnóstica faz rollback e não deixa job/intenção alterados.
  Não imprime plano bruto, que pode conter identificadores. Isso não é
  benchmark de volume de produção nem motivo para criar índice redundante.
- Expiração com job bloqueado: SKIP LOCKED processa o outro job, não espera
  pelo dono e processa o restante depois da liberação, sem intenção duplicada.
- Original publicado depois de uma varredura: próximo purge usa o deadline
  imutável, não uma nova hora desde a publicação, sem consultar SQL.
- Cleanup com storage local real e fase SQL indisponível remove o original
  vencido e conserva a fonte reutilizável; erro final continua sanitizado.

Foco de 11 classes: 269 testes aprovados, zero failures/errors/skips. São
15 casos em `OriginalRetentionPersistenceTest`, 15 em `CleanupGatewayUseCaseTest`
e sete no adapter local, além das regressões existentes da seleção anterior.

Snapshot fonte/teste/config gateway: 365 arquivos,
SHA-256 `05469d6044f979104a5cee166b4f104db7c86d8fc92de94ff6dbb8879acc8b32`.
O JAR de runtime continua
`ae90689a80d40ae10ec935d8f5ff92c954479f66111903a8da38832acc2257a7`;
os seis workers Linux da parcela anterior pertencem àquele JAR, não são seis
execuções novas desta auditoria. Checks globais terminais na [review](../review.md).

## Finding de resultado READY: confirmado em diagnóstico sintético

`GetJobResultUseCase` calcula prazo com `GatewayProperties` corrente;
`ResultExpirationUseCase` também calcula o cutoff com a configuração corrente.
`ReadyResultReference` ainda não transporta um prazo de retenção congelado.
Um probe Java local, com snapshot imutável e signer exclusivamente mockado,
observou o mesmo resultado com vencimento de 60 segundos e, após mudar apenas
a configuração, de 3600 segundos. Não acessou URI, storage, SQL ou provider.

Saída sanitizada: `unchangedSnapshot=true`, `initialLifetimeSeconds=60`,
`afterConfigurationChangeSeconds=3600`, `providerCalls=0`, `networkCalls=0`.
Isso prova o mecanismo no use case, não ocorrência em produção ou exclusão
física cloud. A primeira tentativa usou locators/URI inválidos e foi rejeitada
pelos validadores; o probe foi corrigido, sem enfraquecer essas validações.
Código e resultado locais ficam na pasta ignorada de evidências da rodada.

O prazo abreviado está aplicado enquanto a configuração é estável, mas a
mudança posterior pode estendê-lo. Esse finding é código a corrigir na
TASK-006, não benchmark ou validação externa. Planejar snapshot/guards/storage
sob `database-design` antes de mudar o modelo; nunca resolver restringindo
silenciosamente a configuração legal ao máximo. Default/cloud continuam iguais.

## Pendências reais

Retenção de resultado imutável, admissibilidade do orçamento total,
SDK/layout residentes, operação e qualidade permanecem abertas. SLA de purge,
bootstrap/scheduler/storage indisponíveis, soft delete/backups e eventual
backfill de políticas legadas abreviadas continuam verificações operacionais.
Não promover a 020 ou abrir a 021 somente pelos testes verdes desta parcela.
