# Retenção original por snapshot — plano anterior ao código

Parcela de 020/TASK-006 e 017/TASK-017. Não muda a intenção aprovada de reter
original até render/terminal, sempre limitado ao prazo publicado e a uma hora.
Sem mídia real, credenciais, novas chamadas, deploy ou runtime mobile.

## Banco escolhido

PostgreSQL para snapshot e estados transacionais; bucket privado para bytes.
O cleanup físico precisa reconhecer o vencimento mesmo quando o SQL falha.

## Modelo BCNF

Adicionar `processing_jobs.original_retention_seconds INTEGER NOT NULL`.
`id`, `job_ref`, instalação+idempotência e instalação+attempt continuam chaves
candidatas/determinantes. Deadline é `created_at + segundos`; não criar outra
coluna/tabela com esse derivado. Replay nunca altera o snapshot da primeira reserva.

O identificador privado original versionado contém esse deadline e um UUID
aleatório. É uma representação imutável no storage, não fonte paralela de estado
de job. Validação na gravação exige prazo positivo e até uma hora desde upload.
Chave não é exposta no HTTP/task/manifesto/log. Sem sidecar, texto ou imagem no banco.

## Integridade

CHECK de segundos 1..3600; FKs cascade, unicidades e CHECKs existentes preservados.
Claim e complete devem revalidar deadline sob lock do job; estado vencido não
inicia/aceita chamada cobrada ou resultado. Expiração cancela dispatch pendente,
fecha etapa pertinente e enfileira ALL atomicamente; resultado READY não é
expirado por prazo do original. ACK/TTL do resultado permanecem independentes.

## Índices

PK para guards individuais. Varredura limitada por `created_at`, status e deadline
usa índice existente de criação e PKs das filas/etapas. Conferir EXPLAIN no
PostgreSQL 17 antes de adicionar qualquer índice; nenhum redundante planejado.

## Derivados

Nenhum contador/cache. Deadline no locator é snapshot para purge sem SQL,
necessário também para upload tardio/orfão; mudança de configuração não o renova.
Formato antigo continua limitado ao máximo histórico, nunca ao tempo de migração.

## Migration e código coordenados

V8 aditiva com default/backfill 3600 para a implementação histórica de uma hora,
ancorada à criação original. Isso não inventa validação de disclosures menores
para legacy. Banco compartilhado com políticas não padrão exige backfill auditado
antes de implantação; nenhuma migration será aplicada fora do Testcontainers.

Coordenar candidato/INSERT, locator, storage local/GCS, wrappers e adapters de
OCR/tradução/render, expiração original e cleanup. `/v1`, task jobRef, manifestos,
idiomas, limite/qualidade de mídia e defaults desabilitados não mudam.

## Testes planejados

- 1/3600 segundos e valores inválidos; deadline exato e configuração posterior.
- Snapshot/locator da submissão; replay não renova; original expire durante upload.
- V1–V8 limpa e upgrade sintético V7; CHECKs, atomicidade e índice existente.
- Claim/complete antes/no/depois do limite; zero provider após prazo; cancelamento.
- Expiração de fila/etapa sem repetir provider, resultados READY preservados.
- Purge local/GCS mockado sem SQL, órfão tardio, namespace privado, symlink e legacy.
- Falhas independentes do cleanup; logs sanitizados e ausência de mídia/credenciais.
- Gates offline proporcionais do módulo/global, web/mobile, SDD/links/formato/diff.

Não afirmar SLA de exclusão cloud por teste local: bootstrap/scheduler/storage
indisponíveis, soft delete/backup e revisão operacional continuam gates distintos.

## Auditoria local posterior — 2026-10-09 UTC

Upgrade V7→V8, plano das consultas reais, SKIP LOCKED, upload publicado depois
de varredura e purge físico independente do SQL foram conferidos no foco de
269 testes. Ver a [evidência datada](../../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/original-retention-audit-2026-10-09.md).
O plano anterior e a primeira fotografia são preservados. O finding separado
de resultado READY com política corrente permanece a corrigir: mudar configuração
ampliou o prazo do mesmo snapshot no diagnóstico sintético. Isso não altera
esta V8 nem encerra retenção integral, TASK-006 ou verificação operacional.
O [plano de retenção de resultado](result-retention-snapshot.md) define a
próxima correção antes de qualquer V9/código, sem restringir os prazos publicados.
