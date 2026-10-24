# Evidência parcial — worker de tradução offline — 2026-10-02

Esta parcela acrescenta código e testes determinísticos. Não há chamada real ao
Cloud Translation, uso de ADC, imagem enviada, deploy ou habilitação do gateway.
O provider em testes é falso; isso não demonstra qualidade linguística nem
compatibilidade operacional do envelope HTML com o modelo real.

## Implementação observável

- [Adapter global](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/infrastructure/translation/CloudTranslationAdapter.java)
  e [testes](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/translation/CloudTranslationAdapterTest.java):
  uma operação por página, modelo explícito, pares direcionais e preflight de
  30.000 pontos de código. Resposta sem IDs íntegros ou de outro modelo falha.
- [Worker](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/application/ProcessTranslationTaskUseCase.java)
  e [testes](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/application/ProcessTranslationTaskUseCaseTest.java):
  hash OCR conferido, claim único, página vazia sem provider, manifesto privado,
  cancelamento e falha sem segunda chamada.
- [V4](../../../../../../api/apps/translation-gateway/src/main/resources/db/migration/V4__translation_stage_artifact.sql),
  [SQL transacional](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/infrastructure/persistence/JdbcTranslationJobRepository.java)
  e [cenários PostgreSQL](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/persistence/GatewaySchemaMigrationTest.java):
  código escrito para atomicidade, concorrência e expiração. Esses cenários
  não foram executados na tentativa inicial, pois Docker/OrbStack não estava
  acessível. A revalidação abaixo resolveu esse bloqueio.

## Matriz parcial

| Critério | Evidência desta parcela                                                      | Ainda pendente                                    |
| -------- | ---------------------------------------------------------------------------- | ------------------------------------------------- |
| AC-001   | configuração interna de pares explícitos; request preserva direção           | capabilities publicar apenas pares operacionais   |
| AC-002   | request HTML único e IDs de duas regiões em teste fake                       | qualidade contextual real do LLM                  |
| AC-003   | `zh-Hant`→`zh-Hans` no request fake, sem alias                               | contratos/UI locais e revisão competente          |
| AC-004   | rejeição de IDs faltantes/duplicados, modelo distinto e excesso; V4 validada | renderização segura                               |
| AC-005   | vazio sem provider, cancelamento, reentrega e claims PostgreSQL              | operação real                                     |
| AC-006   | um RPC, retries desabilitados, hash e storage efêmero                        | ACK final, IAM, retenção operacional e custo real |

## Gates e limites

Na tentativa inicial, testes focados e suíte leve do gateway passaram com loopback local autorizado.
A tentativa no sandbox falhou em sete binds gRPC `127.0.0.1`, sem falha de
assertion. `docker info` falhou por ausência de
socket local do OrbStack; a cadeia V1–V4, claims concorrentes
e Maven global com Testcontainers continuam sem validação. Nenhuma conclusão
histórica da 018 ou aprovação da 019 é derivada desta evidência.

### Revalidação com Docker — 2026-10-02

O daemon Docker do OrbStack (29.4.0) respondeu. A tentativa de abertura da
interface gráfica continuou falhando; isso não impediu o Testcontainers.

- `./mvnw -q -pl apps/translation-gateway -am test -Dtest=GatewaySchemaMigrationTest -Dsurefire.failIfNoSpecifiedTests=false`:
  exit 0, PostgreSQL 17 e Flyway V1–V4, claims concorrentes, transições e cancelamento.
- `./mvnw -q -pl apps/translation-gateway -am test`: exit 0; reports do gateway
  registram 272 testes, zero falhas/erros/ignorados.
- `./mvnw -q test`: exit 0, suíte Maven global com Docker.

O checksum técnico abaixo foi reconferido em 2026-10-03 e permaneceu idêntico.
O bloqueio PostgreSQL está resolvido; publicação de pares operacionais,
contratos locais, retorno/ACK final e operação real continuam pendentes.

## Checksum técnico

Gateway: `c4cd6f96ab748dcc0a80a5bdff7ad9ee404bd4848c6952ab1c3c463614ea7e01`,
178 arquivos. Mesmo algoritmo de paths/bytes separados por NUL da
[consolidação OCR](../../MOB-FEAT-018-multilingual-ocr-regions/evidence/ocr-consolidation.md#checksum-técnico-reproduzível):
`src`, `scripts`, `openapi`, `pom.xml` e `.tf`/`.tfvars.example` diretamente em
`infra/terraform`, ordenados; sem docs, build, modelos ou artefatos privados.
Esse hash é do código/configuração Java auditado e não substitui o checksum SDD
mobile. Alterações posteriores exigem recalculá-lo.
