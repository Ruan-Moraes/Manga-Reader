# Segurança de reentrega da tradução — 2026-10-03

Parcela de correção da `MOB-FEAT-019`, `in-progress/open`. Sem chamadas Google,
ADC, arquivos privados, deploy, tradução real ou alterações de defaults.
Provider e conteúdo dos testes são sintéticos; os locks/transações são reais
em PostgreSQL 17 temporário via Testcontainers.

## Problemas reproduzidos antes da correção

1. Uma segunda entrega lia o job como `TRANSLATING`, mas falhava ao abrir o
   manifesto enquanto a primeira já estava no provider. O tratamento genérico
   marcava a etapa da primeira entrega como `FAILED`. Teste vermelho observou
   `FAILED` onde deveria permanecer `TRANSLATING`/`RUNNING`.
2. Se o cancelamento chegasse durante essa leitura, a entrega repetida encerrava
   prematuramente a etapa ativa. Teste vermelho observou `CANCELLED` onde deveria
   permanecer `CANCEL_PENDING`/`RUNNING` até a fronteira segura da primeira chamada.
3. Após confirmação perdida de um commit válido, a recuperação considerava
   sucesso somente em `RENDERING`. Testes vermelhos com estado posterior ou
   cancelamento apagavam o manifesto já referenciado no banco. `READY` nesse
   teste é somente fixture de timing; nenhum renderer ou produtor de `READY`
   foi implementado.

## Plano de dados aplicado antes do código

### Banco escolhido

PostgreSQL: metadados e locks transacionais; bucket privado continua contendo
os manifestos. Nenhum texto é introduzido no banco ou logs.

### Modelo BCNF

Reutilizados `processing_jobs` e `processing_job_stages`. O determinante
`(job_id, stage)` continua sendo PK de todos os atributos da etapa; `id` e
`job_ref` continuam chaves do job. Nenhuma coluna ou estrutura paralela.

### Integridade

Preservadas FKs `ON DELETE CASCADE`, CHECKs de estado/timestamps/hash e
unicidades. `failUnclaimed` bloqueia o job e só grava falha se conseguir
inserir a etapa sem conflito. Se outra entrega já tiver reservado a PK, não
altera etapa/job. Cancelamento não é confirmado enquanto OCR/tradução estiver
`RUNNING`; o proprietário ou cleanup continua responsável pela fronteira segura.

### Índices

PK do job, UNIQUE de `job_ref` e PK `(job_id, stage)` atendem aos predicados
existentes. Consultas por job são limitadas e não carregam coleção de mídia.
Nenhum índice redundante ou query por região foi criado.

### Derivados

Nenhum contador, cache, texto remoto ou nova fonte de dados.

### Migration e implementação coordenada

Nenhuma migration: V1–V4 permanece íntegra. Porta, caso de uso transacional,
adapter JDBC e worker foram ajustados conjuntamente com testes. O lock não
abrange leitura de storage nem chamada ao provider; o teste verifica ausência
de transação ativa durante a chamada sintética.

## Proteções e testes

`ProcessTranslationTaskUseCase` usa `failUnclaimed` somente antes da reserva;
as falhas da execução reservada usam o tratamento próprio. Um par removido é
rejeitado antes de abrir storage. Confirmação perdida considera chave/hash
persistidos como prova do commit, independentemente de transição posterior do
job; falha de leitura do banco mantém o órfão incerto sob o cleanup de uma hora.
Não há segunda chamada automática, reprocessamento da etapa ou retry pago novo.

- `GatewaySchemaMigrationTest`: duas entregas com provider bloqueado; falha
  de leitura e cancelamento na janela crítica; somente uma chamada; resultado
  íntegro ou descarte na fronteira segura. Corrida entre reserva/falha anterior
  à reserva em quatro execuções; rollback atômico; falha inicial idempotente;
  preservação de etapa reservada/concluída e seus timestamps/hash.
- `ProcessTranslationTaskUseCaseTest`: entrada adulterada/par removido,
  manifesto inválido, storage/commit, confirmação perdida com estados posteriores,
  reentrega, cancelamento e vazio sem provider.
- Fontes/testes em
  [`src` do gateway](../../../../../../api/apps/translation-gateway/src).

Comando vermelho/verde focalizado, a partir de `api/`:

```bash
./mvnw -o -q -pl apps/translation-gateway -am test \
  -Dtest=GatewaySchemaMigrationTest,ProcessTranslationTaskUseCaseTest \
  -Dsurefire.failIfNoSpecifiedTests=false
```

Os cenários PostgreSQL e aplicação passaram após as correções. Os testes de
confirmação perdida foram ampliados e repetidos antes da correção correspondente.
Validação corrente, sem chamadas externas nem reinstalação de dependências:

- `api/`: `./mvnw -o -q test`, com Docker, terminou com exit 0. No gateway:
  43 relatórios, 295 testes, zero falhas, erros ou skips; PostgreSQL 17 e Flyway V1–V4.
- `web/toonlira/`: `./node_modules/.bin/tsc -b`, exit 0.
- `mobile/`: `pnpm check` completo, exit 0; 111 suítes/716 testes Jest,
  30 testes de performance, 24 SDD e seis de boundaries. Incluiu specs,
  links, TypeScript, ESLint, FSD e formatação. Warnings preexistentes de
  `act` não foram corrigidos neste escopo.
- Raiz: `node --test api/apps/translation-gateway/scripts/*.test.mjs`,
  85 aprovados, zero falhas e um skip opcional de calibração Java por ausência
  de `OCR_CALIBRATION_FONT`. Esse skip não comprova qualidade tipográfica.
- Checks SDD/links, formatação dirigida e `git diff --check` foram repetidos
  após estabilizar a evidência e atualizar os checksums correntes.

Nenhum lockfile ou contrato público foi alterado por esta correção. Os resultados
acima não substituem avaliação real de tradução ou validação operacional.

## Snapshot técnico e limites

Gateway, 180 arquivos:
`e5c89f79c460b4d5b0a482aed1e72f4875b108ead5527b0469f785c6aa9d8c98`.
Algoritmo: SHA-256 de caminhos relativos ordenados de `src`, `scripts`, `openapi`,
`pom.xml`, `.tf`/`.tfvars.example` diretamente em `infra/terraform`, cada caminho
e conteúdo separados por NUL. Build/docs/artefatos privados ficam fora.
Checksum SDD mobile separado na review; fotografias históricas preservadas.

Esta entrega corrige código divergente, não apenas falta de benchmark.
TASK-003/004/007 recebem evidência adicional sem conclusão integral: retorno/ACK,
download/gravação remota e qualidade/operação ainda pendentes. Gates 020/021
continuam bloqueados. O ciclo de vida do original até o renderer pertence ao
marco futuro já documentado; não foi antecipado nem usado para habilitar uploads.
