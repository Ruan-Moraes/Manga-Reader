# Cancelamento, dispatch e limpeza pós-commit — 2026-10-04

Parcela de TASK-006/007 da 020 e TASK-017 da 017. Não conclui retenção
operacional, distribuição do renderer, qualidade ou a feature integral. A 020
permanece `in-progress/open`; a 021, `approved/blocked`.

## Plano e implementação inspecionados

O [plano de ciclo de vida](../../../../../../api/apps/translation-gateway/docs/lifecycle-retention.md)
foi registrado antes dos testes/código. PostgreSQL continua dono do estado e
das intenções duráveis; bytes permanecem no storage privado. V5 e V7, BCNF,
FKs/cascade, CHECKs, PKs e índices existentes preservados. Nenhuma V8, texto,
URL, chave duplicada ou fila em memória nova.

`LifecycleCleanupAfterCommit` registra somente o ID interno em um callback
Spring `afterCommit`. Cancelamento terminal e esgotamento de dispatch
persistem estado/intenção na mesma transação antes de agendar a tentativa.
Rollback não executa o callback. O proxy de `executeForJob`, com
`NOT_SUPPORTED`, suspende os recursos transacionais antes de abrir os claims
próprios e acessar storage. Crash ou falha mantém a fila/lease recuperáveis;
falha de limpeza não substitui o resultado já aceito. Cancelamento ativo
`CANCEL_PENDING` e dispatch reagendável não removem o original.

Na auditoria foi reproduzida outra falha: `CleanupAcknowledgedResultsUseCase`
herdava uma transação externa durante delete. O teste com proxy Spring falhou
porque `isActualTransactionActive()` era verdadeiro. Aplicado
`NOT_SUPPORTED`: claim e confirmação passam pelas transações próprias, fora
da transação do chamador; rollback posterior do chamador não desfaz a
confirmação de uma exclusão já executada. Nenhum contrato público de ACK mudou.

Fontes: `application/LifecycleCleanupAfterCommit.java`, `CancelJobUseCase.java`,
`DispatchPersistenceUseCase.java` e `CleanupAcknowledgedResultsUseCase.java`,
sob `api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/`.
Não muda reserva OCR/tradução/render, retries cobrados, defaults, task,
manifestos, rotas HTTP, runtime mobile ou configuração cloud.

## Provas e limites

Testes anteriores ao código; erros de compilação por tipo ausente na rodada
red foram esperados. A colisão entre o método de setup `reset` e o import
Mockito foi corrigida renomeando o setup, sem remover teste ou enfraquecer gate.
Regressão transacional ACK red foi reproduzida no PostgreSQL antes da correção.

- `LifecycleCleanupAfterCommitTest`: cinco casos de callback somente pós-commit,
  rollback, falha isolada, transação obrigatória e ID nulo sanitizado.
- `RenderingPersistenceTest`: cancelamento/dispatch após commit e fora de TX,
  rollback sem intenção/delete, estado ativo preservado, retry não terminal,
  falha de delete recuperada pela fila e regressão ACK com rollback do chamador.
- `RenderingWorkerIntegrationTest`: storage de arquivos real e PostgreSQL
  confirmam remoção somente do original do job terminal após commit, preservando
  original reutilizável e outro job ativo; zero chamadas OCR/tradução.
- Rodada focalizada das cinco classes: 104 testes, exit 0, incluindo
  `CleanupAcknowledgedResultsUseCaseTest` e `DispatchPendingJobsUseCaseTest`.
  Cadeia Flyway V1–V7 validada no banco temporário PostgreSQL 17.

As provas de armazenamento são locais, não chamadas Google. Fixtures sintéticas
não comprovam qualidade linguística ou SLA cloud. Runtime mobile não mudou;
performance mobile não aplicável, sem inferência sobre frames/memória nativa.
Não é auditoria exaustiva de todas as interleavings de cancelamento/dispatch.
Bootstrap SQL, scheduler/storage indisponíveis e retenção operacional integral
continuam pendências. Caps/deadline, distribuição do codec e profiling/qualidade
permanecem trabalho próprio da 020.

## Integridade e validação

Checksum técnico corrente do gateway: 271 arquivos de src/scripts/openapi,
pom e Terraform (.tf/tfvars.example), ordenados por caminho relativo;
SHA-256 de caminho + NUL + bytes + NUL:
`d74929bc87db963aaa0ba43022a2a3ea238425176bab778d303663f95fe5cd5e`.
Separado do checksum SDD mobile. Fotografias históricas da
[fila](lifecycle-retention-2026-10-04.md) e dos
[workers](lifecycle-worker-cleanup-2026-10-04.md) preservadas.

Maven global offline com Docker e opt-in nativo: exit 0, iniciado em
`2026-10-04T16:08:53.523Z`. Gateway: 863 testes/70 classes, zero failures/errors/
skipped. XMLs frescos contados antes de outras execuções; quatro harnesses
históricos excluídos. RenderingPersistenceTest 75 casos,
RenderingWorkerIntegrationTest 16, LifecycleCleanupAfterCommitTest cinco e
LocalFileRenderAdapterTest 12.

Comando global em `api/`, usando somente codec local já instalado:

```bash
./mvnw -o -q test \
  -Drenderer.native.enabled=true \
  -Drenderer.cwebp.path=/opt/homebrew/Cellar/webp/1.6.0/bin/cwebp \
  -Drenderer.cwebp.sha256=b31070342821b6316c756e22a336a72bbde4a6e4f2a9cabb22ffd49a73cc89cf \
  -Drenderer.dwebp.path=/opt/homebrew/Cellar/webp/1.6.0/bin/dwebp \
  -Drenderer.dwebp.sha256=0fea0ca571920dac090ca32f4e4559b5125b92e33963b314f27c6757c1c1201c
```

Esses caminhos não representam empacotamento de produção. Node tooling
`node --test scripts/*.test.mjs`: 85 pass e um opt-in de fonte não selecionado,
exit 0. Web `pnpm exec tsc -b`: exit 0. Mobile `pnpm check` integral exit 0:
116 suítes/892 testes, além de 30 testes de performance, 24 SDD e seis FSD;
typecheck/lint/formato/links aprovados. Warnings existentes de act dos ícones
Expo não ocultados. A execução mobile precedeu as últimas alterações documentais;
SDD e links revalidados após o rebase mecânico dos headers: exit 0, 67 artefatos
normativos, 1.492 arquivos classificados, 362 behavior e 204 evidence.
Prettier direcionado e `git diff --check`: exit 0. Rebase não renova conclusões
históricas de outras specs. Suíte leve posterior
`./mvnw -o -q -pl apps/translation-gateway -am test -Dtest.excludedGroups=testcontainers`:
exit 0. Contagens globais não vêm de XMLs sobrescritos. Uma execução adicional
com exclusão da tag inexistente `integration` também passou, mas não é
classificada como suíte leve; a tag correta foi reexecutada explicitamente.
