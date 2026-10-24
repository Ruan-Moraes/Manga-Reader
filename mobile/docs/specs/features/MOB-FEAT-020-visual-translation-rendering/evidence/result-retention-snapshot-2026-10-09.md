# Resultado com prazo imutável — 2026-10-09 UTC

Continuação da [auditoria de retenção](original-retention-audit-2026-10-09.md),
parcela de 020/TASK-006 e 017/TASK-017. 020 continua `in-progress/open`,
verdict `changes-requested`; 021 `approved/blocked`. Sem mídia real, ADC,
provider, deploy, cloud ou mudança de qualidade. Performance mobile N/A:
somente Java e governança, sem runtime/UI do aplicativo.

## Finding, plano e implementação

Dois testes falharam antes do fix do use case: configuração posterior ampliava
o limite armazenado e o repassava ao signer. A nova regressão usa deadline
explícito da referência persistida, não o construtor legado de uma hora.
O probe anterior permanece histórico; não deve ser convertido em prova da
nova semântica ou sobrescrito.

O [plano antes do código](../../../../../../api/apps/translation-gateway/docs/result-retention-snapshot.md)
usa PostgreSQL em BCNF e V9 aditiva: `id → result_retention_seconds` e
`(job_id, stage) → result_expires_at`. Prazo é congelado na admissão; replay
não renova. Deadline dos dois arquivos é capturado antes do primeiro upload,
transportado nos locators privados e gravado junto de chaves/hashes/READY.
O deadline inclui o tempo de upload, não começa de novo ao confirmar o commit.
Nenhum índice, contador, cache, texto ou geometria foi acrescentado ao banco.

Complete revalida depois do lock; prazo vencido ou maior que o snapshot não
publica READY. Falha/rollback/cancelamento/confirmação perdida mantêm a proteção
de artefatos existente, sem retry de provider. Projeção verifica deadline contra
ambos os locators; assinatura não pode ultrapassar o limite aceito. Política
operacional menor pode encerrar antes, mas nunca aumenta o prazo persistido.
Purge dos resultados é fase independente do SQL e da varredura de originais.

Legacy usa a duração histórica de 3600, desde sua conclusão, não a migration.
Locators antigos não são admitidos para jobs abreviados. Dados antigos com
políticas menores/inconsistências exigem auditoria/backfill antes de deploy;
não foi aplicada migration em banco compartilhado.

## Provas locais

- V1–V9 e upgrade V8→V9; constraints de prazo/deadline e dados anteriores.
- Oito casos PostgreSQL em `ResultRetentionPersistenceTest`: aumento/redução
  operacional, replay, prazo exato, metadados incompatíveis, rollback e commit
  esperando um lock até o vencimento. Sem acesso a URI ou provider.
- Dois uploads demorados conservam o mesmo deadline; ao vencê-lo, não há
  complete nem artefato parcial aceito, e a fonte reutilizável permanece íntegra.
- Domínio valida locators/versionamento, limite de uma hora, pares com prazos
  divergentes e metadados de READY; representações e erros são sanitizados.
- Storage local/GCS mockado: boundary inclusiva, upload tardio, namespace,
  falha de delete, create-only e ausência de nova duração por mtime/publicação.
- Fluxo integral com PostgreSQL, codec/arquivos reais e OCR/tradução falsos:
  23 casos aprovados, zero failures/errors/skips. Inclui confirmação perdida,
  interleavings, cancelamento, limpeza e reentrega.
- Seis workers Linux frios, ARM64/x86_64 emulado, JAR novo e migrations nove:
  dez READY e quatro FAILED esperados, recuperação da página seguinte e
  zero OOM observado. Não é prova de OOM agregado ou suíte opt-in completa.

Os picos dos controles máximos foram 1.741.434.880 bytes ARM64 e 1.941.741.568
bytes x86_64, sob cgroup diagnóstico 8 GiB/AS 3 GiB. Cloud 1 GiB inalterado e
não admitido; não alegar melhoria de memória por este incremento de retenção.
SDK/layout residentes e operação/qualidade continuam abertos.

Fonte/teste/configuração gateway: 369 arquivos,
SHA-256 `b2da9964a33decae678214fa9c259c6e98a29ab04f09b1cad4ba3d5d8ce130bb`.
JAR Boot recompilado offline:
`c3d1bfbcffb3f340055a2184bbd94e248c4acc741807f82f7fcc289d9f25f2e1`.
Esse checksum técnico não é o checksum SDD mobile. Matrizes anteriores continuam
ligadas aos seus artefatos, sem aprovação retroativa.

Reprodução: reactor `api/`, Maven `-o`, seleção de
`ResultRetentionPersistenceTest`, `GetJobResultUseCaseTest`, `ReadyResultReferenceTest`,
`ResultObjectKeyTest`, `RenderingArtifactsTest`, `ResultExpirationUseCaseTest`
e regressões de submissão/OCR/tradução/render/storage/Flyway/cleanup.
Fluxo nativo exige flags/pins já documentados; não baixar durante execução.
Gates globais terminais e checksum corrente ficam na [review](../review.md).

## Pendências

SLA cloud de exclusão, indisponibilidade de bootstrap/scheduler/storage,
soft delete/backups e backfill legado; auditoria integral de retenção,
admissibilidade do orçamento agregado e perfil SDK/layout, revisão de qualidade
e operação. Isso não habilita uploads nem fecha TASK-006/020 ou abre a 021.
