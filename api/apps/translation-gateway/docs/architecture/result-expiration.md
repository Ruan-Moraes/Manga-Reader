# Expiração consultável — plano anterior ao código

Parcela de TASK-006 da MOB-FEAT-020 e retenção da 017. Somente execução
local/offline, sem assinatura de URLs, credenciais, provider ou ativação.

## Banco e modelo — database-design

- PostgreSQL conserva estados/locks; arquivos continuam no storage privado.
- BCNF: `job_id` determina estado do job e a solicitação durável de remoção;
  `(job_id, stage)` determina os timestamps e vínculos dos artefatos. Reutilizar
  V5/V6, sem duplicar texto, hashes, chaves ou deadline no banco.
- Integridade: preservar PKs, unicidades, CHECKs e FKs `ON DELETE CASCADE`.
  `READY → RESULT_EXPIRED` e enfileiramento da remoção são uma transação.
  O registro da V5 passa a representar remoção por ACK **ou TTL**, não prova de
  que o aplicativo recebeu o resultado. Nenhum ACK do aplicativo será inventado.
- Índices: consulta por owner/jobRef usa a unicidade existente; lookup da etapa
  e fila usam suas PKs e claims usam o índice parcial da V5. Avaliar a query de
  TTL em PostgreSQL: lote máximo 100, join pela PK da etapa, sem novo índice
  redundante ou migration neste incremento. Não há contador/cache derivado.
- Migration/código: nenhuma V7. Coordenar porta de remoção, JDBC, use case de
  expiração, consulta e cleanup; validar novamente V1–V6 em PostgreSQL 17.

## Política e concorrência

O prazo do resultado começa no `completed_at` da etapa RENDERING bem-sucedida,
não na submissão: resultado e manifesto expiram até uma hora após READY.
O original continua com failsafe separado de uma hora desde aquisição.
Usar o prazo de resultado configurado no disclosure, limitado a 1..3600
segundos; valor inválido fecha a disponibilidade (expiração imediata), nunca
estende o máximo. Para READY legado sem etapa bem-sucedida, o `updated_at` do
job é fallback defensivo; não autoriza disponibilizar artefato inexistente.

Consulta por referência ou idempotência expira apenas job da instalação
autenticada. Igualdade ao deadline já é expiração. Lock no job serializa ACK,
TTL e commit do renderer; batch usa `FOR UPDATE SKIP LOCKED`. Enfileiramento e
estado fazem rollback juntos. Repetição não muda a data original da fila.

Cleanup enfileira expirados antes de consumir a fila durável. Objetos incluem
original, OCR, tradução, layout, WebP e manifesto. Deletes e I/O ficam fora
da transação. Falha real de delete deve ser reportada de forma sanitizada,
nunca tratada pelo adapter como sucesso; objeto ausente continua idempotente.
Cleanup genérico local limita-se ao prefixo privado, não aos arquivos de
entrada reutilizáveis. Consultas de job recebem `Cache-Control: no-store`.

## Testes e próximas parcelas

Testes primeiro: limite exato/antes/depois, owner e idempotência, prazo reduzido,
configuração inválida, estado não READY, rollback, ACK concorrente, claims e
locks concorrentes, exclusão de todos os artefatos e falha parcial recuperável.
Adapters: delete ausente idempotente, falha propagada sem causa, limpeza restrita.

URLs assinadas/metadados HTTP e retenção terminal integral ainda pendentes.
TASK-006 permanece aberta, 020 in-progress e 021 bloqueada. Este incremento não
implementa download, persistência final ou ACK pelo aplicativo.
