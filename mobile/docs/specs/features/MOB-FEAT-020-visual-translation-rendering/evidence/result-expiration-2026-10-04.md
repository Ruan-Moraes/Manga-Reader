# Evidência parcial — expiração de resultados, 2026-10-04

Parcela da TASK-006, sem fechar 020 ou liberar 021. Nenhuma credencial,
chamada paga, imagem nova, download de dependências, deploy ou mudança legal.

## Plano e implementação

[Plano anterior ao código](../../../../../../api/apps/translation-gateway/docs/result-expiration.md):
PostgreSQL e BCNF existentes; reutilizar PK/FK/checks V5/V6. Sem nova migration,
índice, contador/cache ou conteúdo OCR/tradução no banco. O registro durável da
V5 representa remoção por ACK **ou TTL**, não aprovação/download do aplicativo.

ResultExpirationUseCase aplica prazo do disclosure de 1..3600 segundos desde
completed_at de RENDERING/SUCCEEDED. Configuração inválida usa disponibilidade
zero, nunca prazo maior. READY legado sem etapa usa updated_at defensivo, sem
inventar artefato. Original continua com failsafe separado desde aquisição.

Consulta por jobRef ou idempotência expira somente resultado da instalação
autenticada; igualdade ao prazo já é expiração. Estado RESULT_EXPIRED e fila de
remoção são uma transação com lock do job, serializando ACK/TTL. Lote máximo
100 com SKIP LOCKED; repetição preserva requested_at. Vínculos/hash do resultado
não são apagados, preservando a prova de commit depois de expiração.

Cleanup enfileira TTL antes de reclamar/deletar objetos. A fila reúne original,
OCR, tradução, layout, WebP e manifesto; I/O permanece fora da transação.
Adapters agora propagam falhas reais de delete de forma sanitizada, sem causa
ou conteúdo do provider. Objeto ausente é idempotente. A limpeza genérica local
limita-se a private/, rejeita root privado symlink e não segue links; só conta
remoções efetivas. Cópia reutilizável da avaliação permanece intacta.

Consultas HTTP passam a responder no-store; as oito rotas, JSON do envelope,
manifestos, defaults e runtime mobile permanecem inalterados. Nenhuma URL de
download é inventada/exposta. A próxima parcela entrega assinatura/metadados.

## Testes, findings e limites

32 casos novos, fixtures sintéticas e SDK GCS mockado sem ADC/rede Google:

- ResultExpirationUseCaseTest: sete casos, prazo/configuração e identidade.
- GetJobUseCaseTest: quatro casos, consulta/releitura e erro sanitizado.
- RenderingPersistenceTest: oito casos novos de deadline versus original,
  owner/idempotência, rollback, lote concorrente, lock ignorado, ACK/TTL,
  EXPLAIN e parâmetros inválidos. PostgreSQL 17 e V1–V6 preservados.
- GatewaySchemaMigrationTest: dois cenários TTL com arquivos locais reais,
  seis artefatos eliminados fora do TX, job alheio intacto e retry após falha.
- LocalObjectStorageAdapterTest: quatro casos, erro real/idempotência, limite
  exato, prefixo e symlinks sem apagar arquivos externos/reutilizáveis.
- GoogleCloudStorageAdapterTest: quatro casos novos, falha propagada sem
  segredos, ausência idempotente, prefixo/deadline e contagem efetiva.
- CleanupGatewayUseCaseTest: ordem TTL → fila → cleanup genérico.
- GatewayControllerTest/OpenApiTest: no-store e envelope expirado sem artefato.

Red inicial de compilação confirmou tipos/APIs ausentes. Depois, quatro
regressões falharam porque os adapters escondiam erro ou varriam arquivos fora
do prefixo privado; o teste HTTP reproduziu ausência de no-store. Correções
mantiveram asserts. O teste de parâmetros foi ajustado para o wrapper real
InvalidDataAccessApiUsageException gerado pelo proxy @Repository, mantendo
mensagem sanitizada, causa de validação e comprovação de nenhum write.

EXPLAIN executou a query real do lote: Limit/LockRows e lookup da etapa pelo
processing_job_stages_pkey; scan de jobs na fixture pequena é esperado. Não é
benchmark de volume nem prova de capacidade de produção. Nenhum índice foi
criado por uma medição pequena. Profiling/distribuição/qualidade continuam abertos.

## Rastreabilidade parcial

| Critério | Evidência desta parcela                                       | Pendência                                  |
| -------- | ------------------------------------------------------------- | ------------------------------------------ |
| AC-001   | cleanup preserva arquivos reutilizáveis e isolamento          | retenção terminal integral                 |
| AC-005   | expiração consultável, ACK/TTL atômicos e deleção recuperável | URLs/metadados e operação                  |
| AC-006   | locks/limites de lote e falhas isoladas                       | deadline global, memória/disco e profiling |

AC-002/003/004 não recebem nova aprovação de qualidade neste incremento.
TASK-002/006/007/008 abertas; 020 in-progress/open e 021 approved/blocked.

## Fotografia e comandos

246 arquivos técnicos, SHA-256
`c2ac31495664e6ba08d3ea68fb3c4e7798fdbfe49aca7ab3470998c9b2ffb87f`.
Algoritmo: ordenar paths relativos em src/scripts/openapi, pom.xml e Terraform
tf/tfvars.example; SHA-256 de path + NUL + bytes + NUL. Docs/build/artefatos
privados excluídos. Históricos anteriores preservados; checksum mobile é
governança, não cobertura do Java. Nenhum código mobile mudou neste incremento.

```bash
cd api
./mvnw -o -pl apps/translation-gateway -am test \
  -Dtest=RenderingPersistenceTest,GatewaySchemaMigrationTest,GatewayControllerTest,ResultExpirationUseCaseTest,GetJobUseCaseTest,CleanupGatewayUseCaseTest,LocalObjectStorageAdapterTest,GoogleCloudStorageAdapterTest,TranslationGatewayOpenApiTest \
  -Dsurefire.failIfNoSpecifiedTests=false
./mvnw -o test -Dtest.excludedGroups=testcontainers
```

Maven global offline/Docker com codec já preparado, Node, web e pnpm check
integral são registrados na review somente após término verificado. Não instalar
dependências nem habilitar upload para executar esses checks.
