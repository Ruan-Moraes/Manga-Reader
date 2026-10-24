# Posse do dispatch e retenção sob concorrência — 2026-10-04

Parcela de TASK-006/007 da 020 e TASK-017 da 017. Bugs do código contra o
contrato existente, não mudança de intenção/spec. 020 `in-progress/open`,
017 `verification-pending/open` e 021 `approved/blocked` preservadas.

## Diagnóstico reproduzido antes da correção

Cinco testes red foram executados no PostgreSQL 17 e em adapter falso:

- Falha terminal atrasada, após dispatch confirmado: outbox ficava DISPATCHED,
  mas job QUEUED virava FAILED; isso permitia remover seu original.
- Falha da lease antiga encerrava job/outbox mesmo depois de outra claim.
- Confirmação da lease antiga mudava PENDING para DISPATCHED na lease nova.
- Dispatch terminal segurava outbox enquanto esperava o job. O teste observou
  `pg_blocking_pids` e depois recebeu SQLSTATE `55P03` ao tentar lock NOWAIT da
  outbox: inversão real de locks, não hipótese baseada em sleep/contagem.
- Recuperação de uma nona claim ainda chamava criação de task, além das oito
  tentativas permitidas. Nenhum provider real participou da reprodução.

## Plano e correção

[Plano registrado antes dos testes/código](../../../../../../api/apps/translation-gateway/docs/lifecycle-retention.md).
PostgreSQL continua dono do estado/locks; `job_id` determina a outbox e `id`
determina o job. Reutilizados `attempt_count`, PKs/índice pending e intenção V7,
sem contador/cache/coluna duplicados. FKs cascade e CHECKs preservados; nenhuma
V8 ou alteração da cadeia V1–V7.

Confirmação/reagendamento recebem agora a tentativa possuída na porta interna
e só alteram PENDING quando `attempt_count` coincide e é positivo. Retornam se
a atualização foi aceita. Falha terminal só muda job/enfileira cleanup depois
de aceitar essa atualização; callback pós-commit continua usando a fila durável.
Uma conclusão obsoleta não possui a outbox nem inicia limpeza.

Cancelamento e dispatch terminal adquirem explicitamente job → outbox.
Cancelamento filtra proprietário/job antes de bloquear a outbox. Confirmação e
retry não terminal, que só alteram outbox, não adquirem job depois dela.
Nenhuma transação fica aberta durante criação de task ou storage.

O dispatcher encerra uma claim recuperada acima do limite sem chamar TaskDispatchPort.
`attempt_count` conta claims; recuperação após crash pode registrar claim acima
de oito, mas não autoriza uma nona criação de task. Não é retry de OCR/tradução.
Task name determinístico/ALREADY_EXISTS e reservas únicas dos workers preservados.

Fontes coordenados, sob `api/apps/translation-gateway/src/main/java/`:
`application/port/GatewayRepository`, `DispatchPersistenceUseCase`,
`DispatchPendingJobsUseCase` e `infrastructure/persistence/JdbcGatewayRepository`.
Harnesses exclusivos dos testes agora adquirem uma claim real antes da
confirmação; fixtures de exaustão modelam a tentativa já adquirida, sem criar
atalho de produção. HTTP, task `{jobRef}`, manifestos e defaults inalterados.

## Provas pós-correção

- PostgreSQL: confirmação/falha atrasadas rejeitadas; lease atual, estado e
  next_attempt_at preservados. Retry não terminal e exaustão antigos cobertos.
- Tentativa zero não conclui outbox não adquirida. Repetição de falha terminal não
  reabre intenção concluída nem faz segundo delete.
- Concorrência com job bloqueado: PostgreSQL confirma o dispatcher aguardando;
  cancelamento obtém outbox imediatamente, confirma CANCELLED e remove somente
  seu original. Dispatcher então rejeita falha sem substituir cancelamento.
- EXPLAIN ANALYZE de locks/predicados pontuais e PKs existentes conferidos,
  sem índice redundante. Planos brutos novos não são impressos, pois podem
  conter referências privadas. Não é benchmark de produção nem prova de SLA.
- Storage de arquivos real: falha após confirmação preserva o original e a
  amostra reutilizável, sem intenção/delete, OCR ou tradução.
- Teste unitário garante zero criação de task na recuperação acima do limite.
  Testes de sucesso/falha preservam passagem da tentativa correta.
- Suites de persistência, worker real/local, schema e dispatch focalizadas:
  exit 0. Nenhum teste existente removido ou validador enfraquecido.

Runtime mobile não mudou; performance mobile não aplicável neste incremento.
Fixtures locais não comprovam qualidade linguística, memória nativa ou operação
cloud. Auditoria integral de retenção/concorrência, bootstrap/scheduler/storage,
distribuição do codec e caps/deadline/profiling/qualidade permanecem abertos.

## Integridade e gates

Checksum técnico do gateway, separado do SDD mobile: 271 arquivos de
src/scripts/openapi, pom e Terraform (.tf/tfvars.example), ordenados por caminho
relativo; SHA-256 de caminho + NUL + bytes + NUL:
`6ea90274f12a97ee1606646a297c881ea43a5eee4a2313216588412daf109204`.
Fotografias históricas da [parcela pós-commit](lifecycle-controls-cleanup-2026-10-04.md)
e dos [workers](lifecycle-worker-cleanup-2026-10-04.md) preservadas.

Primeiro Maven global offline/Docker, com opt-in nativo: exit 0. Suíte leve
`./mvnw -o -q -pl apps/translation-gateway -am test -Dtest.excludedGroups=testcontainers`:
exit 0. O contador local de relatórios teve erro de escaping e retornou zero;
esse valor não foi aceito como evidência. Como a suíte leve já sobrescrevera
XMLs, o Maven global foi reexecutado sem sobreposição: exit 0, iniciado em
`2026-10-04T16:38:28.053Z`. Relatórios frescos: 873 testes/70 classes no gateway,
zero failures/errors/skipped; quatro harnesses históricos excluídos.
RenderingPersistenceTest 83 casos, RenderingWorkerIntegrationTest 17,
GatewaySchemaMigrationTest 49 e DispatchPendingJobsUseCaseTest três.
Nenhuma outra execução Maven sobrescreveu esses XMLs antes da contagem.
O comando global e pins locais são os da
[parcela anterior](lifecycle-controls-cleanup-2026-10-04.md#integridade-e-validação);
caminhos Homebrew não representam pacote de produção.

Node `node --test scripts/*.test.mjs`: exit 0, 85 pass e um opt-in de fonte não
selecionado. Web `pnpm exec tsc -b`: exit 0. Mobile `pnpm check` integral:
exit 0, 116 suítes/892 testes, além de 30 testes de performance, 24 SDD e seis
FSD. Typecheck/lint/formato/links aprovados nessa rodada; warnings existentes
de act dos ícones Expo não ocultados. Documentos/mapeamento revalidados após
rebase mecânico dos headers: SDD/links exit 0, 67 artefatos normativos, 1.493
arquivos classificados, 362 behavior e 205 evidence; Prettier direcionado e
`git diff --check` exit 0. Checks finais reexecutados após estabilizar este
registro; não renovam medições nativas ou conclusões históricas de outras features.

Nenhuma credencial, chamada paga, instalação, alteração legal, recurso cloud,
upload público ou deploy ocorreu.
