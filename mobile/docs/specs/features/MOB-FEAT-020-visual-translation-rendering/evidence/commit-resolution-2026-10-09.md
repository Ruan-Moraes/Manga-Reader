# Commit pendente e proteção dos uploads — 2026-10-09 UTC

Parcela de TASK-005/006/007 e AC-001/005/006. Correção do pipeline Java,
sem mudança de intenção, APIs, task, manifestos, provider, modelo ou qualidade.
020 permanece in-progress/open, verdict changes-requested; 021 approved/blocked.
017/018/019 continuam em verificação. Não há runtime mobile novo.

## Finding reproduzido

A leitura comum de estado não aguardava uma transação concorrente que já
gravara o sucesso, mas ainda não confirmara o commit. A confirmação perdida
podia observar a versão anterior, apagar os uploads e somente depois tentar
falhar a etapa sob lock. Se a transação inicial confirmasse, o job preservava
referências para arquivos removidos. Não é simples ausência de benchmark.

`RenderingWorkerIntegrationTest#unresolvedCommitMustSettleBeforeDeletingUploadedArtifacts`
usa PostgreSQL 17, arquivos/codec/fontes reais e OCR/tradução sintéticos.
A transação concorrente mantém o job bloqueado após completar a etapa. Barreiras
controlam o commit/rollback; `pg_stat_activity` confirma espera de lock antes
de liberar a transação. Não usa um sleep fixo como prova de ordenação.

Seis casos antes da correção, seis failures, zero errors/skips: OCR, tradução
e renderização, cada uma com final confirmado e rollback. Em todos houve
exclusão prematura. Snapshot anterior, já com o teste: 358 arquivos,
`4b6440d734b0eda618465deb16f969ae087cd105f6b24af245e4a984d8aa990e`;
JAR anterior `9498d055c6b02021537d127ac4bf50738c284d0a8f21a29338305960a6da7d24`.
Esse JAR não contém a correção; a reprodução usa classes recompiladas do reactor.

## Plano de integridade anterior à correção

Conforme database-design:

- PostgreSQL para estados/referências; bucket privado para mídia e manifestos.
- `(job_id, stage)` continua determinante em BCNF; job e filas mantêm suas PKs.
- Mesmas FKs cascade, CHECKs, unicidades, timestamps e códigos sanitizados.
- Locks e leituras usam as consultas existentes pelas chaves; nenhum índice novo.
- Nenhum texto, região, contador, cache, jsonb ou fonte paralela no banco.
- Nenhuma migration; cadeia V1–V7 preservada.
- Coordenar os três use cases e seus testes de aplicação/integração. Storage
  continua fora de transação; não repetir provider, render ou complete.

## Correção

Referências já confirmadas continuam sendo preservadas pelo fast path existente,
inclusive após avanço de estado/ACK. Se a primeira leitura não provar o commit,
o worker tenta a falha condicional existente: ela bloqueia o job e aguarda a
transação pendente. Depois relê as referências e compara chave/hash.

Commit vencedor: a falha é no-op e os uploads aceitos permanecem intactos.
Rollback vencedor: a etapa é encerrada, e os uploads não referenciados são
descartados somente depois da resolução. Banco/lock/releitura indisponíveis:
nenhuma exclusão especulativa, com órfãos elegíveis ao failsafe privado por idade.
Layout experimental segue a mesma proteção no catch OCR, sem controlar OCR ou
render. Nenhuma nova chamada externa, retry cobrado ou transação com I/O de arquivo.

## Verificação local

Primeiro foco corrigido: 61 testes, zero failures/errors/skips, incluindo os seis
casos PostgreSQL. Após acrescentar seis fronteiras SQL indisponíveis, suíte
integral dos três use cases e do worker local opt-in: 84 testes, zero
failures/errors/skips (15 OCR, 13 tradução, 33 render e 23 integração).

Os seis casos com lock/releitura indisponível preservam uploads e original.
Os casos PostgreSQL confirmados exigem hashes recuperados, estado correto e
redelivery até READY sem outra chamada de provider. Rollback exige FAILED e
limpeza dos objetos conhecidos; a imagem reutilizável permanece íntegra.

Snapshot final recompilado/empacotado, 358 arquivos:
`ecb35f24ab7d40fff70d17a0b3c62fdcef98eefa872881b93baaf27ba2e4f09b`.
JAR `32106912689063870f996e15422e05021dd1f081d90d19571e9c941323b16140`.
A receita técnica é paths relativos ordenados + NUL + bytes + NUL, separada
do checksum mobile. A matriz anterior da
[política 1.1](rendering-jpeg-headroom-2026-10-08.md) pertence à fonte anterior,
não foi reatribuída a este JAR. Provas Linux e gates finais desta parcela ficam
na [review](../review.md), somente após término dos comandos.

## Reprodução e limites

Em `api/`, usar Maven offline/reactor, Docker local e os mesmos pins do
[worker local](../../../../../../api/apps/translation-gateway/docs/rendering-worker.md).

```text
./mvnw -o -q -pl apps/translation-gateway -am test
  -Dtest=RenderingWorkerIntegrationTest,ProcessOcrTaskUseCaseTest,ProcessTranslationTaskUseCaseTest,ProcessRenderingTaskUseCaseTest
  -Dsurefire.failIfNoSpecifiedTests=false
  -Drenderer.native.enabled=true
  -Drenderer.cwebp.path=<cache-absoluto> -Drenderer.cwebp.sha256=<pin>
  -Drenderer.dwebp.path=<cache-absoluto> -Drenderer.dwebp.sha256=<pin>
```

As linhas formam um único comando; nenhuma aquisição implícita. A prova usa
codec local explícito e provedores falsos, não OCR/tradução reais. Os limites
Linux do renderer supervisionado são verificados separadamente com o JAR novo.
Não há conclusão de retenção integral, orçamento agregado, revisão independente
ou operação. TASK-002/006/007/008 permanecem abertas. Performance mobile N/A;
gateway/worker cloud/rendering continuam desabilitados e RAM cloud inalterada.
