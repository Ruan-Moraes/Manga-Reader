# ACK e limpeza remota do resultado

## Plano anterior ao código — 2026-10-03

Parcela da TASK-004 da MOB-FEAT-019 e fronteira já declarada no OpenAPI v1.
O ACK hoje retorna `409` incondicionalmente. Preparar aceitação e remoção
idempotentes sem produzir `READY`, iniciar renderer ou implementar o cliente
da 021. Toda execução deste marco usa banco/storage temporários e fixtures.

### Banco escolhido

PostgreSQL para o pedido durável, locks e metadados. Objetos continuam no
bucket privado; não guardar texto, mídia, URLs assinadas ou resposta de provider.

### Modelo BCNF

Nova tabela `processing_job_result_acknowledgements`:

- `job_id UUID PRIMARY KEY` identifica o único pedido por job;
- `requested_at TIMESTAMPTZ NOT NULL` conserva o primeiro ACK;
- `next_attempt_at TIMESTAMPTZ NOT NULL` controla a disponibilidade/lease;
- `completed_at TIMESTAMPTZ NULL` comprova conclusão da limpeza.

`job_id → requested_at, next_attempt_at, completed_at`; o determinante é a
chave candidata. Não duplicar instalação, referência pública, status ou chaves
de objetos; derivá-los do job e dos artefatos já persistidos. Não há contador,
cache, lista JSON ou tabela de conteúdo.

### Integridade

FK para `processing_jobs(id)` com `ON DELETE CASCADE`. CHECK exige
`next_attempt_at >= requested_at` e conclusão nula ou posterior ao pedido.
Pedido e transição `READY → RESULT_EXPIRED` compartilham transação com lock
do job, escopo da instalação e unicidade por job. Outro proprietário recebe
`404`; estados não prontos recebem `409`. Repetição de ACK já registrado
retorna `202` sem substituir timestamp ou reabrir cleanup concluído.

`RESULT_EXPIRED` já existe: após ACK, o resultado remoto deixa de estar
disponível ao download; o resultado local futuro não é alterado por isso.
Não criar novo status HTTP/público ou etapa, nem promover uma página a `READY`.

### Índices

PK atende lookup por job e cascade. Índice parcial
`(next_attempt_at, job_id) WHERE completed_at IS NULL` atende claim ordenado
do cleanup; não criar índice simples redundante de FK ou contadores.

### Cleanup e falhas

Claim em lotes de até 100 pedidos com `FOR UPDATE SKIP LOCKED`, lease de cinco
minutos via `next_attempt_at` e leitura dos objetos conhecidos em uma consulta
de lote, sem N+1. Apagar somente original e artefatos das etapas/layout desses
jobs. Não varrer prefixos ou apagar outros jobs para atender um ACK.

Nenhuma transação permanece aberta durante storage. Exclusão é idempotente;
objeto ausente é aceito. Marcar conclusão somente após todas as exclusões;
falha mantém pedido pendente com próximo cleanup em um minuto. A gravação de
conclusão/reagendamento compara a lease, impedindo um executor antigo de
sobrescrever uma claim posterior. Não repetir OCR/tradução ou chamada de provider.

Falha/confirmação perdida de commit deixa metadados íntegros para repetição
segura. TTL absoluto de objetos e retenção de sete dias permanecem failsafes;
pedido acompanha cascade dos metadados. A integração da 020 deverá acrescentar
todos os artefatos finais que criar à projeção de cleanup antes de produzir
`READY`; este plano não presume nomes ou schema do renderer.

### Migration e implementação coordenada

Flyway V5 aditiva, preservando V1–V4. Porta própria e adapter JDBC, caso de uso
transacional de ACK, fronteira transacional de claim/complete/reschedule,
orquestrador de limpeza fora de transação, controller e cleanup existente.
Nenhuma mudança no shape `/v1`, corpo de task, manifesto ou defaults.

## Testes e gates planejados

- TDD: aceitação, conflito, isolamento, repetição, concorrência, rollback,
  constraints/FK/índice, lease concorrente e recuperação de lease expirada.
- Fixtures `READY` apenas em PostgreSQL temporário, sem inventar render real.
- Storage local: exclusão exata de original/OCR/tradução/layout, preservação de
  outro job, falha parcial e repetição, commit perdido e nenhum provider.
- Controller: `202` sem body e conflitos/404 sanitizados; worker mantém `/v1`
  inacessível. Defaults continuam desabilitados.
- Suítes leves/completas, cadeia V1–V5 em PostgreSQL 17, Maven global offline
  com Docker, type-check web, mobile/SDD/links/formatação direcionada e diff.

Planejamento não é evidência de implementação ou execução. Download e emissão
do ACK pelo aplicativo permanecem na 021. Operação cloud, custo e autorização
de uploads não são liberados por esta mudança.
