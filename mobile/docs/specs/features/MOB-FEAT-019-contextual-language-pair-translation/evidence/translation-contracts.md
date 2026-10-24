# Evidência parcial — contratos de tradução — 2026-09-27

Somente TASK-001. Fixtures sintéticas, fake local e nenhuma tradução real,
credencial, conexão Google ou aquisição de imagens. A 019 está `in-progress`,
não em verificação final. TASK-002..007 permanecem abertas.

## Fontes e cobertura

- [Contratos e limites](../../../../../../api/apps/translation-gateway/docs/translation-contracts.md).
- [Validador](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/domain/translation/TranslationValidator.java)
  e [testes](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/domain/translation/TranslationValidatorTest.java).
- [Porta sem adapter](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/application/port/TranslationPort.java).
- [Regressão das capabilities](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/application/GetCapabilitiesUseCaseTest.java).

AC-001: 42 pares e política parcial/recusa de par removido; sem integração da
política à configuração do worker. AC-002: página completa em chamada de fake,
associação integral e reordenação por ID; não comprova contexto linguístico.
AC-003: variantes/códigos preservados em contratos, sem UI nova. AC-004:
validação integral, limites UTF-16 e texto opaco; sem renderer integrado.
AC-005: contrato vazio validado, sem garantia operacional de evitar cobrança ou
cancelamento implementados. AC-006: erros/representações sanitizados e coleção
imutável; retenção, logs operacionais e ausência de retry cobrado ainda pendentes.

## Método e histórico

Teste das capabilities passou antes da extração do catálogo (cinco testes,
ETag e shape fixados). A primeira compilação dos testes novos falhou pela
ausência dos tipos; após implementação, testes focados passaram. A suíte leve
inicial foi bloqueada pelo sandbox em sete testes gRPC de loopback, sem falha de
assertion; foi reexecutada com permissão local, sem acesso ao provider.
Resultados finais ficam na [review](../review.md), excluída do checksum SDD.

## Checksum técnico

Gateway: `44e5cabcbd73c15612a3bd3dc3539deb1d1018e52b3cb6ff586faf99c1859948`,
164 arquivos: `src`, `scripts`, `openapi`, `pom.xml` e `.tf`/`.tfvars.example`
diretamente em `infra/terraform`. Mesmo algoritmo reproduzível publicado na
[auditoria OCR](../../MOB-FEAT-018-multilingual-ocr-regions/evidence/ocr-consolidation.md#checksum-técnico-reproduzível):
paths relativos ordenados, NUL, bytes, NUL, SHA-256. Exclui docs/build/modelos e
artefatos privados. O hash SDD não é cobertura do código Java.

O hash antigo da auditoria 018 permanece fotografia histórica, não hash do
gateway corrente. Daquela fotografia, apenas `GetCapabilitiesUseCase` e seu
teste existente mudaram; foram acrescentados nove fontes e um teste.
Os 448 artefatos privados anteriores foram reconferidos e preservados.
Isso não renova revisão linguística ou validação operacional da 018.
