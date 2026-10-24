# Locks de limpeza stale — evidência parcial, 2026-10-04

TASK-006/007, AC-005/006. 020 in-progress/open, verdict changes-requested;
021 approved/blocked. Auditoria e testes locais autorizados. Sem mídia real,
provider, ADC, Google, download, infraestrutura, C próprio ou Python. Nenhum
runtime mobile alterado; performance Android não aplicável nem inferida.

## Hipótese e teste

O [plano anterior ao teste](../../../../../../api/apps/translation-gateway/docs/lifecycle-retention.md)
levantou a hipótese de um scan SKIP LOCKED pular job possuído por outra entrega,
mas conservar lock da etapa dele. Retorno vazio sozinho não prova o isolamento.
Inspeção de consultas não foi tratada como bug confirmado nem motivo para fix.

[Teste PostgreSQL](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/persistence/RenderingPersistenceTest.java)
`staleScanCannotLockTheStageOfAJobItSkipped`, parametrizado OCR/TRANSLATING/
RENDERING. A primeira TX mantém lock do job; a segunda faz failStale e permanece
aberta após o scan, por latch. Antes de liberar a segunda, a primeira obtém lock
da etapa com NOWAIT. Esse ponto observaria o lock indevido, sem depender de
sleep, timeout de deadlock ou tempo de conclusão de uma TX já encerrada.

Nos três casos: scan vazio, NOWAIT passou, estado do job e etapa RUNNING preservados,
nenhuma intenção de lifecycle criada e zero interação com storage. Após liberar
o dono, a varredura recupera o job e o encerra como FAILED. Fixtures de
metadados sintéticas; não afirmar comparação de bytes de imagem a partir
desse teste. Claims/providers não foram reexecutados pelo scan.

**Hipótese não confirmada no cenário exercitado.** Foco inicial: três testes,
zero errors/failures/skipped, exit 0. Nenhum red foi inventado; teste precedeu
qualquer mudança potencial e não exigiu correção. Nenhum fonte de produção,
SQL, política, HTTP, task, manifesto ou default mudou neste incremento.
Não é prova de todas as interleavings, disponibilidade de scheduler/storage,
retenção cloud por SLA ou performance Android.

## Banco e revisão

Aplicado database-design antes da auditoria de integridade. PostgreSQL mantém
estado e intenção; bytes privados fora do banco. Determinantes jobs.id e
(job_id, stage), PKs, FKs cascade, CHECKs e índices existentes preservados.
Nenhuma migration V8, coluna, índice, cache ou contador. NOWAIT é diagnóstico
de teste por PK, não endpoint/consulta nova de produto. Transações são proxies
Spring reais; o teste observa concorrência entre conexões distintas.

Os [repositórios](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/infrastructure/persistence/JdbcRenderingJobRepository.java)
e wrappers das três etapas foram inspecionados, junto a claims/intenção,
ACK/TTL e cleanup fora de TX. Nenhuma divergência funcional identificada
nesse cenário. Não promover a inspeção parcial a auditoria integral da retenção.
Findings anteriores de memória/cópias do codec continuam abertos e separados.

## Hashes e gates

Snapshot técnico 306 arquivos:
`16f84f1a3447e0c67fb95dc33d705343d79106ca0ed5b3bec12862e9c3ab3a27`.
Receita histórica preservada: src/scripts/openapi/pom.xml e Terraform `.tf`/
terraform.tfvars.example, paths ordenados, path relativo `/` NUL bytes NUL,
SHA-256 cumulativo; exclui docs/target/.DS_Store/.terraform/lock local ignorado.
Checksum mobile de governança separado, sem renovar snapshots históricos.

Boot JAR permanece
`9070df558ffef96ed808d7b18c5701e7d4926a581aca49979850fcf83b55e0ec`:
somente src/test mudou, não foi introduzido harness no artefato de produção.
Node `node --test scripts/*.test.mjs`: 85 pass/um opt-in não selecionado,
zero failures, exit 0. Web `pnpm exec tsc -b`: exit 0.
Maven global `./mvnw -o -q test`, Docker e opt-ins native/archive/Linux/resources/
shared/shared.resources: exit 0. XMLs frescos desde `2026-10-05T00:39:19.661Z`
(UTC, execução de 2026-10-04 local), contados antes da suíte leve e excluindo
quatro harnesses manuais históricos não reexecutados. Nenhuma captura/relatório
de OCR real foi regenerado. **1.030 testes gateway/90 classes**, zero
failures/errors/skipped; três casos novos da auditoria. Cadeia V1–V7/PostgreSQL 17
revalidada. Suíte leve gateway/reactor com `-Dtest.excludedGroups=testcontainers`:
exit 0, sem inferir sua contagem a partir dos XMLs da execução global.

Mobile `pnpm check` integral: exit 0, 116 suítes/892 testes. SDD/links,
type-check/lint/FSD, formatação e performance tooling incluídos; warnings
act/SQLite/native access anteriores preservados, sem gates enfraquecidos,
reinstalação ou alteração de lockfile. Formatação dirigida/diff-check aprovados.
Headers correntes rebaseados mecanicamente após estabilização, sem renovar
verdict/histórico de outras features; SDD/links finais reexecutados.

TASK-002/006/007/008 seguem abertas: retenção operacional/integral, codec,
integração supervisionada, distribuição/contenção e qualidade continuam sem
aceite integral. 020 e 021 conservam status/gates; nenhuma autorização de
provider/cloud ou de nova arquitetura foi derivada desta prova.
