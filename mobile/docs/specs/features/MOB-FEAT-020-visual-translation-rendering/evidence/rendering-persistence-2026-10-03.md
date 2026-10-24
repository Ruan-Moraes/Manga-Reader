# Evidência parcial — persistência do renderer, 2026-10-03

Parcela de TASK-005/006/007, sob o gate aberto da MOB-FEAT-020. Status continua
`in-progress`; a 021 permanece bloqueada. Não é evidência de página traduzida
produzida pelo pipeline completo, qualidade ou operação cloud.

## Plano e implementação

O [plano de banco anterior ao código](../../../../../../api/apps/translation-gateway/docs/rendering-persistence.md)
seguiu database-design: PostgreSQL para estados/metadados, storage privado para
conteúdo. BCNF preservada por `(job_id, stage)`; V6 aditiva reutiliza a etapa,
com chave/hash/bytes da imagem WebP e referência existente para manifesto.
Sem tabela, índice, contador, cache ou texto novo no banco. PK/FK cascade e
CHECKs existentes são preservados; sucesso exige os dois artefatos.

RenderingJobRepository, RenderingPersistenceUseCase e JdbcRenderingJobRepository
implementam leitura com joins, reserva única, commit atômico, falha possuída
versus pré-reserva e expiração de RUNNING. Transações ficam no wrapper; nenhum
decode, pintura, upload, provider ou remoção ocorre no repository.

Confirmação futura de commit pode consultar os dois vínculos mesmo após ACK
e RESULT_EXPIRED. Isso prepara a proteção contra confirmação perdida; ainda
não comprova recuperação no futuro use case de upload/arquivos.

Claims de ACK incluem imagem e manifesto finais. Cleanup expira rendering
abandonado sem reexecutá-lo, remove apenas os originais devolvidos pelo claim
fora da transação e mantém cleanup absoluto de uma hora. Erro de remoção
best effort não impede o failsafe. Retenção do original no fluxo OCR/tradução
ainda será ajustada; não foi entregue por esta fronteira.

## Testes e regressões

Os testes precederam as novas classes (fase vermelha de compilação registrada).
Testes PostgreSQL reproduziram ausência do WebP no claim de ACK e cancelamento
indevido do rendering ativo por reentrega de OCR. Após os guards, uma regressão
adicional reproduziu o mesmo problema em complete/fail de etapa anterior;
essas operações agora só confirmam CANCELLED quando não há outra etapa RUNNING.
Os cenários continuam nos testes; nenhum requisito/teste foi removido.

RenderingPersistenceTest cobre cadeia limpa V1–V6 e upgrade V5→V6,
concorrência de 16 reservas (uma STARTED), commit conjunto, rollback,
cancelamento antes/durante execução, disputa entre validação e reserva,
expiração/limite de lote/SKIP LOCKED, ACK, cascade, metadados inválidos,
vínculo com inputs, isolamento e preservação das referências após expiração.
As referências de objetos são sintéticas: não representam uploads reais.

RenderingArtifactsTest cobre teto exato/limites inválidos, representação
sanitizada e ausência de causas. CleanupGatewayUseCaseTest acrescenta expiração
do renderer e preservação do TTL em falha de remoção de um original.
Fixture antiga de ACK agora guarda imagem e manifesto distintos e comprova
remoção dos dois, preservando arquivo de outro job.

31 testes PostgreSQL e 13 de metadados passaram; cleanup acrescenta uma
regressão (quatro cenários totais existentes/novos). A query real de stale
cleanup foi inspecionada com EXPLAIN ANALYZE no teste: Limit → LockRows → Sort
→ Nested Loop; scans sequenciais foram escolhidos para um job/três etapas.
Essa fixture não prova custo em volume nem necessidade de outro índice. PK e
índice parcial disponíveis foram conferidos; não desabilitar seqscan para
fabricar uma aprovação de performance.

No teste de upgrade, asserções iniciais incluíam o marcador de criação de schema
como migration e índices de dois schemas. Foram corrigidas para versões
Flyway numeradas e índice do schema público; nenhuma constraint foi relaxada.

## Matriz parcial

| Critério | Evidência desta parcela                                            | Pendência integral                              |
| -------- | ------------------------------------------------------------------ | ----------------------------------------------- |
| AC-001   | cancelamento/rollback não publicam artefato incompleto             | retenção e processamento no worker              |
| AC-002   | compositor/fontes não alterados; evidência anterior preservada     | qualidade visual/linguística e integração       |
| AC-003   | metadados do manifesto commitados com a imagem, sem texto no banco | upload/validação do fallback e consumo final    |
| AC-004   | estado válido admite resultado dos contratos existentes            | fluxo worker da página vazia                    |
| AC-005   | hash/bytes e manifesto gravados atomicamente; ACK inclui ambos     | upload/URLs/TTL integrado e confirmação perdida |
| AC-006   | claims limitados, locks e SKIP LOCKED; falha isolada entre jobs    | processamento, memória/disco/deadline/profiling |

## Fotografia técnica

237 arquivos: `802dab1768cab01dfbaa6816fb9c42ccf75489008826a70f9c5dab47db864c93`.
SHA-256 de path relativo + NUL + bytes + NUL, em ordem: src/scripts/openapi,
pom.xml e Terraform tf/tfvars.example. Exclui docs, build e artefatos privados.
Snapshots históricos de OCR, tradução, contratos, codec, fontes e arquivos
não foram renovados; checksum mobile cobre governança, não código Java.

## Validação reproduzível

```bash
cd api
./mvnw -o -q -pl apps/translation-gateway -am test \
  -Dtest=RenderingPersistenceTest,RenderingArtifactsTest,CleanupGatewayUseCaseTest,GatewaySchemaMigrationTest \
  -Dsurefire.failIfNoSpecifiedTests=false
```

PostgreSQL 17 local/Testcontainers, sem credencial, provider ou rede Google.
Resultados dos gates integrais são registrados na review após execução, sem
presumir aprovação futura. Os testes novos não carregam fontes/codec nativo.
Runtime mobile não mudou: MOB-DEC-007 é não aplicável nesta parcela Java;
medição física e profiling integral permanecem pendentes na TASK-008.

## Próxima parcela

Ligar o adapter ao use case do worker, revalidar arquivos/manifestos, fazer
uploads privados create-only e proteger seus objetos em confirmação perdida.
Alterar e testar o ciclo de vida do original; depois disponibilizar URLs curtas.
READY consultável/publicamente íntegro não existe somente por testar commit no
repository. Defaults, task `{jobRef}`, OCR `1.0`, `/v1` e infraestrutura continuam
inalterados. Nenhuma chamada paga, imagem nova, chave privada ou deploy.
