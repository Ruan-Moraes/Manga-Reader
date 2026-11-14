# Retenção terminal e original — plano de implementação

Incremento da 020/TASK-006 e 017/TASK-017, iniciado em 2026-10-04.
Não habilita processamento, assinatura, providers ou recursos cloud.

## Banco escolhido

Parcela posterior de 2026-10-09 UTC: reserva ambígua da submissão não autoriza
apagar o original. Consulta escalar de posse usa lock da instalação e snapshot
independente antes do descarte; estado desconhecido preserva o upload para
varredura privada. Sem migration/contador novo. Ver a
[evidência](../../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/submission-original-ownership-2026-10-09.md).
Retenção abreviada do original ainda exige execução própria; esta correção não
fecha a auditoria integral de prazo ou operação.

PostgreSQL: estado terminal e intenção de limpeza precisam de transações e
locks. Bytes continuam no storage privado; não há texto ou URLs no banco.

## Modelo (BCNF)

V7 aditiva: `processing_job_lifecycle_cleanups`, uma linha por job.
`job_id UUID` é PK e determina `cleanup_scope VARCHAR(16)` (`ORIGINAL|ALL`),
`requested_at`, `next_attempt_at` e `completed_at` (TIMESTAMPTZ).
Todo determinante é chave candidata. Nenhuma chave de objeto é duplicada:
claims projetam as referências já existentes em jobs, etapas e layout.

`ORIGINAL` é elegível somente depois de rendering SUCCEEDED com job READY ou
RESULT_EXPIRED; nunca elimina resultado entregue. `ALL` é exclusivo de
FAILED/CANCELLED. Nenhum estado ativo, inclusive CANCEL_PENDING, é elegível.
Essa fila não é reutilizada como ACK: remover o original não confirma download.

## Integridade

FK job_id → processing_jobs(id), ON DELETE CASCADE. Escopo obrigatório com
CHECK; timestamps obrigatórios, próximo intento/conclusão não anteriores à
solicitação. A aplicação reconsulta elegibilidade sob lock do job; conflitos
por PK não reiniciam limpeza concluída nem estendem retenção.

Transições terminais individuais enfileiram na mesma transação. Reconciliação
limitada cobre estados históricos e crash; stale RUNNING continua falhando sem
repetir provider. Uma referência não gravada por rollback/upload tardio continua
órfã e é coberta pelo failsafe privado absoluto de uma hora.

## Índices

PK cobre FK e lookup por job. Índice parcial (next_attempt_at, job_id) WHERE
completed_at IS NULL cobre lote SKIP LOCKED. Reconciliação usa o índice existente
created_at e anti-join na PK, com lote máximo 100. Conferir EXPLAIN antes de
considerar outro índice; nenhum índice redundante ou cache é planejado.

## Derivados

Nenhum contador, JSON, lista de regiões ou cache. A fila é intenção durável,
não cópia do estado do job. Leases de cinco minutos e retry de um minuto
controlam somente deletes idempotentes, nunca OCR/tradução.

## Migration e código coordenados

V1–V6 preservadas. V7, porta, JDBC, wrapper transacional e executor de limpeza
serão implementados juntos. Workers continuam processando fora de transação;
cleanup também suspende transação externa antes de acessar storage. ACK/TTL
mantêm sua própria fila. Varredura de uma hora e metadados de sete dias permanecem.

Testes primeiro: cadeia PostgreSQL 17, constraints/cascade, estados ativos
preservados, escopos, concorrência/leases, rollback, recuperação após crash,
falha de delete/commit, ausência de conteúdo nos erros, original após READY e
ACK posterior independente. Testes de aplicação verificam I/O fora de transação
e erros diferidos; gates completos/evidências acompanham a integração.

Não concluir TASK-006/TASK-017 enquanto transições, recuperação e limpeza
integral não tiverem evidência. Empacotamento do codec, profiling e qualidade
continuam trabalhos distintos e abertos.

## Incremento seguinte — tentativa imediata e independência do failsafe

Planejado em 2026-10-04, antes do código: reutilizar V7 e a PK job_id para claim
de um único job. PostgreSQL e BCNF/FK/CHECKs permanecem; nenhuma V8, índice,
campo, cache ou contador persistido. A projeção de referências segue a mesma
fonte, sem duplicação. Enqueue elegível e claim por ID compartilham transação
curta; leases/SKIP LOCKED/CAS conservam retry e isolamento. Jobs ativos não
produzem claim nem I/O de storage.

Cada worker habilitado, depois de localizar o job, tenta cleanup desse job ao
final, inclusive retorno/falha/cancelamento. Modo desabilitado não executa essa
tentativa nem acessa storage. A tentativa não altera o resultado da etapa; falha SQL ou
delete deixa intenção/lease ou estado terminal para reconciliação. Sucesso
READY continua removendo somente original e não significa ACK.

Cleanup de manutenção executa fases independentes, registrando somente falha
sanitizada ao final: erro em stale/expiração/claim não impede varredura privada
de uma hora; erro no storage não impede retenção de metadados. Não garante
disponibilidade cloud: falha de bootstrap SQL ou scheduler/storage indisponível
continuam riscos operacionais, não provas artificiais de SLA de exclusão.

Código coordenado: porta/JDBC e wrapper de claim por job, executor de cleanup,
três workers e testes/harness existentes; nenhum contrato HTTP/mobile alterado.
Testes anteriores ao código: escopo único, ausência de storage em job ativo,
lease concorrente, retry em delete/commit, falha SQL sem bloquear varredura,
sucesso/falha/cancelamento do pipeline e preservação na confirmação perdida.

## Implementação da tentativa imediata — 2026-10-04

Claim por job e integração dos três workers implementados e testados offline.
`executeForJob` não reconcilia nem consome a fila global; uma intenção concluída
não é reiniciada. READY remove somente original; falha/cancelamento terminal
remove referências conhecidas. Falha de claim/commit/delete deixa recuperação
durável ou reconciliação pelo estado terminal, sem substituir resultado da etapa.
Modo desabilitado e job inexistente não fazem limpeza. SQL no claim não mantém
transação aberta durante storage; teste com proxy Spring confirma suspensão de
transação externa.

Upload sem referência pode ocorrer após a intenção terminal ser concluída.
O worker tenta descartar as chaves que possui; falha desse delete não é tratada
como conclusão da remoção. Varredura por idade remove esse órfão sem depender
da fila concluída. Fixture real de arquivo/WebP e PostgreSQL exercita upload
com confirmação perdida, delete indisponível e falha SQL no cleanup. Nenhum
provider real participa dessa prova.

Cada fase de manutenção é tentada independentemente; o resultado final reporta
somente `storage-unavailable` ou `internal-error`, sem causas SQL/storage.
Isso não torna o serviço disponível se não conseguir inicializar por falha SQL,
nem garante scheduler/latência de delete em produção. Essas provas continuam
operacionais. Ver [evidência corrente](../../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/lifecycle-worker-cleanup-2026-10-04.md).

## Plano seguinte — cancelamento e dispatch após commit

Banco: PostgreSQL continua dono do estado/intenção, storage privado dos bytes.
Modelo BCNF: V7 inalterada, job_id PK determina escopo/timestamps; nenhuma cópia
de chave, URL ou texto. Integridade: mesmas FKs cascade, CHECKs e atomicidade da
intenção. Índices: PK e parcial pending preservados, sem nova consulta global.
Derivados: nenhum contador/cache/fila em memória; callback síncrono contém apenas
o ID interno e não substitui a fila durável. Migration: nenhuma V8.

Antes do código, em 2026-10-04: preservar CancelJobUseCase e DispatchPersistenceUseCase
transacionais. Após enfileirar terminal elegível, registrar callback Spring
afterCommit para executeForJob via proxy NOT_SUPPORTED. Nunca excluir antes
do commit, durante rollback ou em CANCEL_PENDING/RUNNING. Dispatch ainda
reagenda somente criação de task; nunca repete provider. Callback falho não
transforma commit aceito em falha nem reinicia intenção concluída; reconciliação
e retry recuperam eventual crash. Não usar callback beforeCommit, auto-invocação
transacional, thread/fila nova ou conexão compartilhada para I/O.

Código coordenado: helper pós-commit, cancelamento, persistência de dispatch e
testes unitários/PostgreSQL/storage. Provas anteriores ao código: não execução
antes do commit, rollback sem delete/intenção, execução sem TX externa, lease,
falha de delete/commit, repetição idempotente, concorrência e CANCEL_PENDING ativo
preservado. Cadeia V1–V7 e gates completos continuam obrigatórios. Não encerra
operação cloud, scheduler, distribuição/caps/deadline ou qualidade.

Auditoria do mesmo incremento: CleanupAcknowledgedResultsUseCase deve suspender
TX externa antes de claim/delete, como o executor de ciclo de vida. Um teste
com proxy Spring e chamador transacional será escrito antes dessa correção;
reutiliza V5/PK/lease, nenhuma migration ou mudança de ACK público. A finalidade
é não excluir em uma TX que possa depois reverter a confirmação de limpeza.

## Implementação pós-commit dos controles — 2026-10-04

Cancelamento terminal e esgotamento de dispatch agora registram tentativa
`afterCommit` após persistir a intenção. Rollback não executa delete; retry não
terminal e CANCEL_PENDING não agendam remoção. Falha pós-commit não substitui
o resultado aceito, e a fila continua sendo a fonte de recuperação, não o
callback. O proxy suspende os recursos transacionais durante storage.

A limpeza por ACK também suspende uma transação externa: regressão PostgreSQL
reproduziu delete dentro da TX do chamador antes da correção. Claim/confirmação
próprios não são revertidos por rollback posterior do chamador após exclusão.
Testes com arquivos reais confirmam isolamento do job, original reutilizável e
outro job ativo preservados. V5/V7 e contratos públicos inalterados. Ver
[evidência da parcela](../../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/lifecycle-controls-cleanup-2026-10-04.md).
Não é aceite de retenção operacional integral, interleavings exaustivas,
distribuição, caps/deadline ou profiling/qualidade.

## Plano de auditoria de dispatch atrasado — 2026-10-04

Antes da implementação, inspecionada a atualização terminal da outbox: o
UPDATE de job ocorre mesmo quando o UPDATE condicional da outbox não altera
linha. Hipótese a reproduzir: falha atrasada, após confirmação de dispatch,
transforma QUEUED em FAILED e remove original sem possuir a entrega pendente.

- Banco escolhido: PostgreSQL, dono dos estados/locks/intenção; bytes privados
  continuam no storage, sem conteúdo/logs novos.
- Modelo BCNF: `processing_job_dispatches.job_id` determina estado, tentativa
  e timestamps; `processing_jobs.id` determina estado do job. Reutilizar esses
  determinantes e a intenção V7, sem duplicação de referência ou contador novo.
- Integridade: preservar FKs cascade/CHECKs/NOT NULL/uniquidades. Atualização
  terminal só poderá encerrar job se ainda possuir a outbox pendente; nenhuma
  falha atrasada pode desfazer DISPATCHED, cancelamento ou worker ativo.
- Índices: PK por job nas duas tabelas e índice pending atuais; não criar
  índice redundante. Conferir EXPLAIN das consultas por PK/claim no PostgreSQL.
- Derivados: nenhum cache/fila/contador novo. Tentativa existente poderá atuar
  como CAS para rejeitar completions de uma lease substituída, se a reprodução
  demonstrar o risco. Callback pós-commit não substitui posse da outbox.
- Migration/código: nenhuma V8. Testes PostgreSQL primeiro; depois coordenar
  porta/JDBC/persistência/dispatch/harness quando necessária uma assinatura
  interna diferente. Preservar HTTP, task, manifestos e defaults. Usar ordem
  de locks explícita job → outbox em caminhos que alteram ambos, sem transação
  durante criação de task ou storage. Não depender de sleeps para provar ordem.

Aceite da parcela: falha depois de confirmação não muda job/limpeza;
completion/retry de lease antiga não encerra entrega nova; cancelamento e
dispatch terminal concorrentes convergem sem deadlock ou exclusão prematura.
Limitar testes com latches/deadlines, sem provider/credencial/rede Google.
Testes negativos não substituem benchmark, caps/deadline ou operação cloud.

## Implementação da posse do dispatch — 2026-10-04

Reproduzidos: falha após confirmação encerrava job sem alterar outbox;
completions/falhas de lease antiga sobrescreviam outra claim; dispatch terminal
segurava outbox enquanto aguardava job; recuperação acima do limite criava
nona task. Corrigidos com CAS pelo attempt_count existente, resultado de
atualização condicionando job/cleanup, locks explícitos job → outbox e ausência
de criação de task acima do limite. Tentativa zero ou substituída não é posse.
Claim acima do limite recupera estado, não faz chamada adicional.

Porta interna/persistência/dispatcher/JDBC e harnesses coordenados, nenhuma
migration/API pública/default alterados. Testes com pg_blocking_pids/NOWAIT
confirmam ordem e cancelamento vencedor, sem sleep artificial. Arquivos reais
confirmam original preservado após falha atrasada; repetição não reabre cleanup.
Ver [evidência](../../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/dispatch-ownership-2026-10-04.md).
Não encerra auditoria integral/operacional nem recursos/qualidade da 020.

## Próxima auditoria — locks de limpeza stale, 2026-10-04

Antes dos testes/código: confirmar que uma varredura SKIP LOCKED não conserva
lock da etapa quando o job correspondente pertence a outra transação. Retorno
vazio sozinho não prova ausência desse lock. A ordem precisa continuar compatível
com claim/complete/fail: job antes da etapa. Hipótese, ainda não finding confirmado.

- Banco: PostgreSQL, único dono dos estados/intenção; bytes no storage privado.
- BCNF: jobs.id e (job_id, stage) continuam determinantes dos atributos atuais;
  nenhum modelo/campo ou duplicação de referência planejados.
- Integridade: mesmas FKs cascade, CHECKs, PKs, atomicidade e reserva única.
  Etapa de job skipped não poderá ser encerrada, limpada ou bloquear o dono.
- Índices: PKs/índices de status/timestamps existentes; nenhuma consulta nova
  de produto, índice redundante ou otimização sem EXPLAIN.
- Derivados: nenhum contador/cache/fila ou tentativa de provider.
- Migration/código: nenhuma V8. Primeiro teste PostgreSQL nas três etapas,
  com TX do dono mantendo lock do job e TX de cleanup mantida aberta após scan;
  NOWAIT do dono na etapa deve passar. Só corrigir SQL/coordenação se a reprodução
  demonstrar a falha. Preservar limites, schema, HTTP, defaults e artefatos.

Testes com latches/deadlines e fixtures sintéticas, sem sleeps, credenciais ou
rede Google. Conferir resultado vazio, estado/intenção intactos e recuperação
da varredura após liberar o dono; não inferir qualidade ou retenção operacional.

Prova executada: a hipótese não se confirmou nas três etapas. NOWAIT da etapa
passou enquanto a TX de limpeza permanecia aberta; job/stage e ausência de
intenção/storage foram conferidos. Após liberar o dono, failStale recuperou o
job. Nenhuma correção SQL ou migration foi necessária. Ver
[evidência](../../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/lifecycle-stale-locks-2026-10-04.md).
Esta interleaving não aprova retenção operacional nem resolve memória do codec.
