# Snapshot de retenção original — 2026-10-09 UTC

Parcela de 017/TASK-017 e 020/TASK-006. A 020 continua `in-progress/open`,
verdict `changes-requested`; 021 `approved/blocked`. Não fecha operação,
orçamento agregado ou qualidade. Nenhum provider, mídia real, credencial,
deploy ou configuração cloud foi usado. Performance mobile não se aplica:
somente runtime Java e documentação foram alterados.

## Finding e correção

O disclosure permite 1..3600 segundos, mas o código anterior aplicava somente
uma hora. Essa era uma divergência funcional, não falta de benchmark.
O [plano anterior ao código](../../../../../../api/apps/translation-gateway/docs/original-retention.md)
define PostgreSQL/BCNF, snapshot escalar e deadline derivado, sem índice,
contador ou cache novo. V8 adiciona `original_retention_seconds` com CHECK;
V1–V7 permanecem intactas. Default legado 3600 é ancorado à criação original,
não à migration; não prova conformidade retroativa com disclosures abreviados.

Submissão usa o prazo publicado, precisão de microssegundos compatível com SQL
e locator privado com deadline/UUID. Upload vencido não reserva quota/job.
Claim/complete consultam o snapshot sob lock, usando o relógio após a espera;
expiração fecha etapa/job/outbox e intenção ALL atomicamente. READY preserva
o TTL próprio. Replays não renovam o snapshot. Workers revalidam antes/depois
do provider, sem retry cobrado. Purge local/GCS usa o locator ou máximo legado,
independente do SQL, sem incluir resultados ou fonte reutilizável.

## Evidência local

- Teste de locator na submissão falhou antes do fix nos três prazos 1/900/3600.
- Teste de purge local falhou antes da implementação da nova fase física.
- `OriginalRetentionPersistenceTest`: 12 casos PostgreSQL 17 aprovados,
  cobrindo prazo exato nas três etapas, commit atrasado pelo lock, rollback,
  expiração concorrente, cancelamento, snapshot do replay e CHECKs.
- Use cases OCR/tradução exercitam provider exclusivamente falso, incluindo
  expiração durante a chamada sem novo artefato ou segunda tentativa.
- Storage local/GCS mockado cobre deadline, upload tardio, namespace privado,
  locator inválido, mtime alterado, symlink e erro sanitizado.
- Cleanup exerce falhas independentes de SQL e purge, mantendo a varredura
  máxima por idade e remoção de metadados.
- Cadeia limpa V1–V8 e upgrade sintético V5–V8 aprovados no foco de persistência.

Snapshot técnico dos fontes/testes/configuração do gateway: 365 arquivos,
SHA-256 `61d5ca4962d57660b6ff1b6278910461b4a02a3c28c5b1c2265780303d1e0e52`.
JAR Boot recompilado offline:
`ae90689a80d40ae10ec935d8f5ff92c954479f66111903a8da38832acc2257a7`.
O checksum SDD mobile não representa o código Java. Matrizes anteriores
continuam ligadas aos seus snapshots, não ao JAR novo.

Comando focal: reactor `api/`, `./mvnw -o -q test -pl apps/translation-gateway -am`,
selecionando `OriginalRetentionPersistenceTest`, `GatewaySchemaMigrationTest`,
`RenderingPersistenceTest`, `SubmitPageUseCaseTest`, os três testes de use case
worker, `OriginalObjectKeyTest`, os dois adapters de storage e
`CleanupGatewayUseCaseTest`, com `-Dsurefire.failIfNoSpecifiedTests=false`.
Docker usa somente caches locais; nenhuma migration em banco compartilhado.
Resultados terminais dos gates e nova prova Linux são registrados na
[review](../review.md), sem modificar esta fotografia ou os históricos.

## Pendências

Ainda conferir upgrade especificamente V7–V8, plano da query de expiração e
barreiras adicionais de upload/cleanup. Bootstrap/scheduler/storage cloud,
soft delete/backups e políticas legadas abreviadas exigem validação operacional
e eventual backfill auditado antes de deploy. Prova local não é SLA de exclusão
nem autorização de aumentar RAM ou habilitar uploads. Tasks permanecem abertas.
