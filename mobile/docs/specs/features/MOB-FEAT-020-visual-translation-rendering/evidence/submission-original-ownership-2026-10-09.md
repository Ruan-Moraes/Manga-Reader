# Original da submissão e confirmação perdida — 2026-10-09 UTC

Parcela de 020/TASK-005/006/007 e 017/TASK-017. Testes locais sintéticos,
sem upload externo, provider real, credenciais, deploy ou alteração legal.
020 in-progress/open, 021 approved/blocked e defaults desabilitados preservados.

## Finding e reprodução

`SubmitPageUseCase` apagava o original ao receber uma falha da reserva, sem
conferir se job/outbox haviam sido aceitos. A correção de confirmação perdida
nos [workers](commit-resolution-2026-10-09.md) não cobria essa fronteira anterior.

`SubmissionCommitResolutionTest` usa PNG real sintética de 8 × 8, storage local
privado, PostgreSQL 17 e nenhuma porta de dispatch/provider externa. Reserva
concorrente mantém instalação/job/outbox em transação aberta; barreiras controlam
commit/rollback. A consulta de `pg_stat_activity` observa a espera real do lock;
um contador detecta exclusão anterior à resolução, sem usar sleep fixo como prova.

Três testes antes da correção: três failures, zero errors/skips. Original já
confirmado foi removido; os dois finais pendentes tiveram remoção prematura.
Source/test/config anterior com o teste: 359 arquivos,
`7b195d51d8d6e3c6a11a902c00269906c4d788fe828ee7f7b4c9ad2b5e1e54a5`.
JAR anterior `32106912689063870f996e15422e05021dd1f081d90d19571e9c941323b16140`;
a reprodução usa classes recompiladas do reactor, não esse JAR anterior.

## Plano de banco anterior ao código

Conforme database-design:

- PostgreSQL mantém metadados; bucket privado mantém bytes.
- `id`, `job_ref`, instalação+idempotência e instalação+attempt permanecem
  chaves candidatas existentes; todo atributo do job depende dessas chaves.
- Preservar FKs cascade, CHECKs, unicidades, timestamps e V1–V7.
- Lock pela PK da instalação, seguido de projeção booleana pela PK do job;
  índices existentes suficientes, sem índice redundante ou N+1.
- Nenhum contador, cache, jsonb, região ou texto novo no banco.
- Nenhuma migration. Coordenar porta, JDBC, wrapper e submissão com testes.
- Storage fora da transação; consulta não reserva job, lê quotas, insere outbox
  ou dispara task. Falha inicial continua a mesma para o chamador.

## Correção e invariantes

`ReserveJobUseCase.ownsOriginal` tem transação independente `REQUIRES_NEW`,
`READ_COMMITTED` e timeout de 30 segundos. Bloqueia a instalação na mesma ordem
da reserva. A declaração seguinte observa o commit resolvido e verifica id,
instalação, idempotência, chave, SHA-256 e fingerprint. Retorna apenas booleano,
sem materializar job/etapas ou expor referências.

Commit confirmado preserva o original. Ausência comprovada após rollback
autoriza best effort de descarte. SQL/lock/estado desconhecido preserva o upload
para o failsafe privado por idade. Erro inicial não é substituído por erro de
limpeza/resolução; nenhum novo código HTTP ou receipt de sucesso é inventado.
Replay posterior usa a mesma identidade e não duplica job, outbox ou quota.

## Evidência verificada

Primeiro foco: oito testes aprovados. Ampliação intermediária: 68. Foco final:
69 testes, zero failures/errors/skips — cinco integração, oito submissão,
sete reserva e 49 cadeia Flyway/quota/idempotência.

- Três cenários de confirmação demonstram commit, espera e rollback; arquivo
  reutilizável intacto, original aceito/hash e job/outbox atômicos conferidos.
- Replay confirma a mesma referência no commit ou cria uma única reserva após
  rollback; quota e outbox contam um único job.
- Original preservado é revalidado pelo worker OCR real com adapter falso;
  avança para TRANSLATING e reentrega não repete a chamada.
- Seis campos divergentes recusam posse; EXPLAIN confirma caminho de índice
  existente. Plano bruto não é logado porque pode conter identificadores.
- Snapshot REPEATABLE READ do chamador continua antigo, mas a resolução
  independente reconhece o commit novo. Não depender de configuração implícita.
- Testes unitários limitam a resolução a lock+consulta, sem inserção/quota,
  preservam uploads desconhecidos e mantêm erro/cleanup local do chamador.

Fonte final recompilada: 359 arquivos,
`f0e1627ec1db06f8cdd68ce26e0a5cd9cd817ffb0c9aeac6db2af184718a9c3d`.
JAR `0280988efa0fc1a1444a1c14667f2287e90cd87b9bc79cd43e4ea7787166d9cc`.
Receita técnica: paths relativos ordenados + NUL + bytes + NUL, separada do
checksum SDD. Gates finais ficam na [review](../review.md), após término.
Matrizes nativas anteriores continuam associadas a seus próprios snapshots;
esta parcela não altera renderer, codec, qualidade, memória ou infraestrutura.

## Reprodução

Em `api/`, com Docker PostgreSQL 17 já preparado, sem reinstalação:

```text
./mvnw -o -q -pl apps/translation-gateway -am test
  -Dtest=SubmissionCommitResolutionTest,SubmitPageUseCaseTest,ReserveJobUseCaseTest,GatewaySchemaMigrationTest
  -Dsurefire.failIfNoSpecifiedTests=false
```

As linhas formam um único comando. Os testes não aceitam banco compartilhado.
Nenhuma imagem do catálogo, transcrição privada ou resposta de provider é usada.

## Pendências preservadas

A auditoria também confirmou estaticamente que `originalRetentionSeconds`
admite 1..3600 no OpenAPI/capabilities, mas render/varredura por idade usam uma
hora fixa. Prazo menor publicado ainda exige implementação e prova integral;
não foi reclassificado como validação externa. Metadados já usam o prazo
configurado em `metadata_expires_at`. Retenção final, orçamento SDK/layout,
operação e qualidade continuam pendentes; TASK-002/006/007/008 e 017/TASK-017
não são fechadas. Performance mobile N/A.
