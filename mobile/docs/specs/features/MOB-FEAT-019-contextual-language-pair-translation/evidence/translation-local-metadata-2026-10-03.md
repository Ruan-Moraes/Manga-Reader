# Evidência parcial — metadados locais da tradução — 2026-10-03

Parcela da TASK-005 da `MOB-FEAT-019`, que permanece `in-progress/open`.
A implementação prepara a leitura e a persistência dos metadados em SQLite.
A gravação de um resultado remoto, download, ACK e renderer continuam pendentes.
Nenhum texto desta evidência é resultado de tradução real: os testes usam dados
sintéticos.

## Schema e fronteira FSD

O SQLite v9 acrescenta a `text_regions` os campos opcionais
`translation_contract_version`, `translation_model` e `translated_at`.
`id → texto/metadados` mantém BCNF; a chave existente, a FK cascade de página,
os vértices e a unicidade por página/ordem permanecem. Idiomas continuam no
projeto; não há coluna de idioma por região, índice, cache ou contador novo.

Registros antigos e demonstrativos mantêm metadados nulos. Os três campos só
podem ser preenchidos juntos: CHECK na base nova e triggers de integridade de
INSERT/UPDATE também na base migrada. Cada coluna valida tamanho/timestamp.
As colunas são acrescentadas após inspeção de `PRAGMA table_info`, dentro da
mesma transação que verifica FKs e avança `user_version` para 9. Reabrir não
repete ALTER TABLE; falha reverte schema, versão e dados juntos.

O [modelo](../../../../../src/entities/local-translation-result/model/localTranslationResult.ts)
expõe `TranslationMetadata` pelo barrel existente de `local-translation-result`.
O [repository](../../../../../src/entities/local-translation-result/api/localTranslationResultRepository.ts)
restaura esses metadados e rejeita valores incompletos/inválidos com erro
sanitizado. O gerador demonstrativo declara metadados nulos; `saveDemoResults`
rejeita metadados de provider, preservando a identificação da simulação.
Não há novo slice nem mudança de comportamento do reader.

## Evidência automatizada

- [Migration test](../../../../../src/entities/local-translation-result/api/__tests__/localTranslationMigration.test.ts):
  SQLite em memória, com execução real do SQL em `node:sqlite`. Confere base v8,
  instalação nova, reabertura v9, texto Unicode/HTML preservado, vértices, ordem,
  leitura dos metadados, cascade, INSERT/UPDATE incompletos, timestamp inválido,
  erro sanitizado e rollback da migração.
- [Repository test](../../../../../src/entities/local-translation-result/api/__tests__/localTranslationResultRepository.test.ts):
  ordem de inicialização, colunas aditivas/idempotentes, avanço de versão e
  preservação do ownership dos dados/arquivos.
- Regressões do gerador demonstrativo e reader continuam cobrindo o consumo do
  tipo local. `zh-Hans` e `zh-Hant` continuam códigos distintos no projeto; os
  textos chineses dos testes são fixtures, não aprovação linguística.

Ambiente da conferência: Node 22.23.1, SQLite 3.51.3. `node:sqlite` é utilizado
somente nos testes; o aplicativo continua usando Expo SQLite. Não foi feita
medição nativa ou aprovação de migração em aparelho físico nesta parcela.

## Performance e limites

Consulta à skill `mobile-performance` e à `MOB-DEC-007`: a nova inspeção de
colunas/triggers ocorre uma vez na inicialização do repository; as leituras
continuam materializando as mesmas regiões/vértices, sem query por região.
Não foi demonstrado ganho ou regressão de performance. Verificação física
continua necessária antes de release.

## Gates executados

- `pnpm check`: exit 0; 110 suítes/685 testes Jest, 30 testes de tooling de
  performance, 24 testes SDD, seis testes de boundaries, validação de specs/links,
  type-check, ESLint, FSD e Prettier aprovados.
- Web `./node_modules/.bin/tsc -b`: exit 0.
- Maven global `./mvnw -o -q test`, com Docker/Testcontainers: exit 0; inclui a
  suíte gateway e a cadeia Flyway V1–V4 em PostgreSQL 17.
- `git diff --check`: exit 0.

O checksum SDD corrente está na review. O rebase das referências correntes de
outras reviews/drifts é mecânico: preserva verdicts e evidências históricas,
sem declarar nova validação física ou funcional dessas features. O hash técnico
do gateway foi reconferido e permaneceu igual ao registrado na evidência do
worker de 2026-10-02.

TASK-005 permanece aberta: a gravação remota e o contrato final de consumo
dependem dos incrementos de renderer/resultado. As TASK-006/007 também
permanecem abertas; esta parcela não conclui qualidade, operação ou a feature.
