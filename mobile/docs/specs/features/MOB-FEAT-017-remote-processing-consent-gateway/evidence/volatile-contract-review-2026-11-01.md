# Review independente parcial — contrato volátil, 2026-11-01

- Solicitante: integrador, após pedido de Ruan para revisar as specs ao final.
- Escopo: requisitos correntes 017–021, novo backend v2 e runtime mobile existente.
- Método: inspeção independente de código, contratos, testes e configuração;
  nenhum runtime foi alterado pelo reviewer.
- Verdict: `changes-requested`. A implementação está em andamento; este registro
  não encerra task/AC e não constitui aprovação operacional.
- Fotografia de fontes ao final desta inspeção: hashes no fim deste documento.
  Mudanças posteriores exigem nova conferência pelo integrador.

## Resultado sobre as especificações

As specs correntes substituem o desenho anterior de conteúdo remoto. Elas são
coerentes entre si quanto a processamento em memória, entrega na sessão,
armazenamento privado no aparelho, recibos duráveis sem conteúdo, ausência de
replay pago automático e perda de recuperabilidade remota após encerramento.
Nenhuma delas atribui ao EULA uma exoneração integral do operador.

O gate atual é coerente com a implementação incompleta: 017 `in-progress/open`;
018–021 `approved/blocked`, sem tasks ativas nas quatro dependentes. Os 38 IDs
AC foram preservados. Nas matrizes ativas, cada AC aparece uma vez; registros
históricos não herdam aceite para o novo ciclo de vida. A abertura sequencial
só cabe após evidência da revisão atual, sem promover código faltante a
`verification-pending`.

## Findings prioritários e tratamento

| ID  | Prioridade | Evidência concreta                                                                                                                                         | Estado nesta fotografia / ação                                                                                                                                                                                         |
| --- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F01 | P1         | Multipart global poderia escrever corpo de imagem antes do binding de outra rota pública, mesmo bloqueando as rotas antigas                                | `spring.servlet.multipart.enabled=false` foi confirmado após o finding; falta comprovação de ingress completo com corpo multipart real e diretório temporário observado                                                |
| F02 | P1         | `IsolatedMemoryRenderAdapter` fazia join interrompível após stop restaurar o interrupt, podendo zerar buffer e liberar capacidade antes do writer terminar | Corrigido no código inspecionado: join não interrompível e falha de cleanup preserva contenção; exigir teste de timeout com writer ainda ativo                                                                         |
| F03 | P1         | Timeout de sessão dependia só do interrupt; provider/stream que o consumisse poderia alcançar entrega tardia                                               | Corrigido no código inspecionado: fence atômico/deadline, checagens por fase/chunk e cancelamento das duas pontas; teste específico recém-adicionado exige execução e conferência final                                |
| F04 | P1         | `LocalObjectStorageAdapter.store`, `GoogleCloudStorageAdapter.store` e use cases antigos ainda têm lógica de gravação                                      | Pendente: retirar os gravadores/entradas legadas ou torná-los incapazes de gravar sob qualquer modo admitido. O novo v2 não os chama, mas isso não prova remoção integral da lógica solicitada                         |
| F05 | P1         | Mobile atual usa `/v1`, submissão multipart, polling, URLs privadas e ACK; o backend retira essas rotas com 410                                            | Pendente de integração 017/021: transporte shared isolado não conclui aquisição, persistência, retomada ou leitura do novo fluxo                                                                                       |
| F06 | P1         | i18n corrente ainda descreve original/resultado retidos por minutos e exclusão após cancelamento                                                           | Pendente nos três locales e consentimento: nova versão/disclosure antes de habilitar envio. Capabilities v2 e prefixo de versão não provam publicação/revisão legal                                                    |
| F07 | P1         | A reserva/idempotência agora depende de V10/JDBC/transação curta/advisory lock, que não é exercitada pelo teste mockado do use case                        | `VolatileAttemptPersistenceTest` foi criado para owner, replay concorrente, quota e constraints/cadeia; exigir resultado PostgreSQL real, incluindo falhas de confirmação/rollback relevantes, antes de atribuir prova |
| F08 | P1         | O serviço direto v2 executa providers e renderer nativo no perfil público, alterando a composição anteriormente admitida no worker separado                | Gate operacional permanece aberto: provar orçamento agregado, limites, máxima página, isolamento e configuração do novo serviço; não transferir admissão anterior do worker                                            |
| F09 | P2         | Recibo novo conserva STARTED/FINISHED/FAILED, mas não tem expiração/limpeza implementada na cadeia inspecionada                                            | Definir política de retenção dos metadados/logs antes do disclosure público; apagar uma barreira de idempotência não pode autorizar replay pago silencioso de chave antiga                                             |

### Observação posterior sobre ordem da sinalização

Na primeira inspeção do cancelamento revisado, `RenderCallSupervisor.abandon`
ainda chamava `cancellation.run()` antes de sinalizar interrupt ao worker.
Como o callback agora aguarda os helpers que fecham entrada e saída, um close
bloqueante pode atrasar indefinidamente esse interrupt. O fence evita início de
etapa tardia, mas não garante progresso do worker nessa ordem. Finding P2 enviado
ao integrador: sinalizar o worker antes de aguardar os closes, mantendo o latch
de posse/capacidade até ambos terminarem; comprovar com callback de cancelamento
bloqueante e worker que depende de receber interrupt. Este finding precisa ser
reconferido após a correção; não é aceitação de uma falha ainda existente.

F01–F03 foram comunicados durante o trabalho e tratados pelo integrador. A
correção no código não equivale a teste executado ou aprovação do pipeline.
F04–F08 impedem declarar a arquitetura completa nesta fotografia.

## Matriz da fundação 017

| Critério | Observação de código                                                                                                                   | Resultado              |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| AC-001   | Capabilities v2 descreve memória/aparelho/providers; políticas publicadas e UI/disclosure novo ainda não comprovados                   | parcial, não aceito    |
| AC-002   | Consentimento local existente permanece baseado no contrato antigo; nova versão volátil ainda sem integração                           | pendente               |
| AC-003   | Backend limita/valida bytes e mídia antes dos providers; precondições locais existem na rota antiga                                    | parcial, não aceito    |
| AC-004   | Endpoint binário v2 e consulta de recibo existem; aplicativo produtivo continua na porta v1                                            | parcial, não aceito    |
| AC-005   | Filtros e queries restringem por instalação; falta conferência integrada de autenticação/owner e bundle final                          | parcial, não aceito    |
| AC-006   | Reserva durável precede OCR, chave repetida é recusada, rede fora do TX; testes reais de concorrência/uncertainty devem ser conferidos | parcial, não aceito    |
| AC-007   | FINISHED é produzido antes da entrega e não significa commit local; mobile ainda não mapeia recibos v2                                 | pendente de integração |
| AC-008   | Consulta v2 retorna `contentRecoverable=false`; restart local ainda usa reconciliação v1                                               | pendente de integração |
| AC-009   | Fence/cancelamento do backend foram corrigidos; UI e teste ponta a ponta de retorno tardio ainda não comprovados                       | parcial, não aceito    |
| AC-010   | Novo fluxo usa bytes/IPC em memória e erros sanitizados; gravadores antigos e prova operacional ainda pendentes                        | parcial, não aceito    |
| AC-011   | i18n/estados ainda descrevem o contrato antigo; nenhuma matriz nova foi executada                                                      | pendente               |
| AC-012   | A fundação local limita primeira página e não chama provider direto; novo ciclo 018–021 ainda não integrado                            | parcial, não aceito    |

## Outras etapas

- 018: novo adapter envia bytes inline para Vision online; mapper e hints
  reaproveitam algoritmos anteriores. Revalidar integração, ausência de I/O,
  limite/erro e cancelamento; evidências de qualidade linguística antigas não
  aprovam esta composição.
- 019: adapter contextual e limites existentes podem ser reaproveitados; a
  chamada nova é síncrona na sessão e não grava manifesto. Revalidar associação,
  perda de sessão, replay e ausência de retry cobrado.
- 020: renderer em memória, pipes e geração de manifesto foram implementados,
  mas novo heap/IPC/composição exigem matriz nativa, máxima página e perfil
  total próprios. Não reutilizar como prova os pacotes que escreviam arquivos.
- 021: armazenamento privado, hash/manifesto, FK/transação e reader existentes
  são úteis, mas ainda adquirem pelo ciclo antigo. Abertura local uma vez e
  leitura offline precisam ser repetidas a partir da resposta direta real.

## Evidências e limites desta revisão

A revisão documental anterior deste agente executou 26 testes dos validadores,
check de links, Prettier dos arquivos tocados e `git diff --check`, todos sem
falha. O `specs:check` completo ficou somente com checksums globais antigos que
o integrador renovará depois de finalizar as mudanças. Não foram executados
novos testes de backend, Docker, provider, cloud ou dispositivo por este reviewer.
Os testes recém-criados foram inspecionados, sem atribuir resultados não vistos.

Os registros `evidence/pre-volatile-*` estão marcados históricos e seus links
foram ajustados. Relatos passados sobre TTL, objeto/URL ou ACK continuam verdade
sobre o desenho anterior e não criam conflito normativo atual. Há conflito
funcional explícito no runtime mobile/i18n antigo, mantido como pendência de
migração, não mascarado por alteração da spec.

## Checklist de revisão final do integrador

1. Conferir F01–F09 após as últimas mudanças e ligar cada correção à sua prova.
2. Executar cadeia V1–V10/concorrência no PostgreSQL real e confirmar isolamento
   proprietário, ausência de segunda chamada e comportamento em commit incerto.
3. Confirmar inexistência de gravador de mídia ainda admitido e ausência de
   spool em ingress, codec, IPC, proxy/APM e dumps/swap da implantação admitida.
4. Integrar e exercitar o fluxo mobile real; contrato compartilhado isolado não
   encerra 017/021. Validar consentimento, perda da resposta e leitura offline.
5. Renovar checksums, coverage e matrizes por AC com evidência corrente; executar
   gates antes de promover status ou abrir a próxima dependência.

## Fontes inspecionadas — SHA-256

```text
c3790b5b42d4427eca97db3b4e10a55082eb2753856daa55959714ea75f9c178  api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/application/ProcessVolatilePageUseCase.java
64e19b40e10c3ddf47a5eb8d9eebc4689e736a0d98275c021d5ee2622293f5d6  api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/application/VolatileAttemptUseCase.java
730c6b1239157269f8ce05261dbd55d16b3edf6d40ac1b3909f9246312c6e389  api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/application/VolatileGatewayPolicy.java
4baeb0d0a3d45d1675166fcee7251196e5e2e44bb796a17258455c520dbd5242  api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/infrastructure/persistence/JdbcVolatileAttemptRepository.java
29a02937481d9807d5d527876ec1f2370004c96da4fd431431bca2c99f73e8ac  api/apps/translation-gateway/src/main/resources/db/migration/V10__volatile_processing_receipts.sql
43cfeb432e9636dec54dc0bb7554f0266260e3a94d746dbecf48570c60290794  api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/presentation/VolatileTranslationController.java
f8ee6201b960594b402886ccea98a999b294d7dab0d8fb0b610a2aca9d124f85  api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/presentation/VolatileCapabilitiesController.java
f95fa130ad1de0cb4d459009c1ef397b060e898a410ffb827af65d46425c3c76  api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/infrastructure/security/SessionAuthenticationFilter.java
c17c757f4f28bfdad567ecc9f920f13ead7a9c40ca949e4639214d786ca0fd01  api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/infrastructure/security/RetiredContentRouteFilter.java
ec0baa22c9d9d1f72dfcb309f40985608ba093b906e1147b63c4bdad9bd3bae6  api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/infrastructure/rendering/SupervisedVolatileSession.java
eb548a5d0198d046fc683a002aee4e358f2c5a53824e340b27aebe59866fc288  api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/infrastructure/rendering/IsolatedMemoryRenderAdapter.java
e5f9f73940f69234ee7cc7e0e36fb4cc5b70ccc5ddf5040b8d1eb464be115f58  api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/infrastructure/rendering/NativeMemoryRenderAdapter.java
ec0ccf736bada56fb1eecc7a792b2330f62b7443c9702891a250074c1a9a76b8  api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/infrastructure/rendering/VolatileRenderChildMain.java
92fc546a9d53729c40e5d6e80c803535667fa598c6b6522a68e97901e8592c49  api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/infrastructure/rendering/VolatileRenderProtocol.java
bda947ab1fac9aceb44589ee0f29c0419f47c4919edcabac5a8f32adbd3a7463  api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/infrastructure/ocr/InlineVisionOcrAdapter.java
79f91f197c444916971efde6f11c5c4a54040ba71c22e2a591b3ee508e67cebc  api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/infrastructure/ocr/VisionOcrAdapter.java
6e0f9f8d6b429e5369adcbbde74ad87e7a16f09d131c0ff1834e376ebd3dbfe9  api/apps/translation-gateway/src/main/resources/application.yml
025f8cfc32d4b5fb29e9cc599de697191b75bd99305771b39bfbba00ad5ad607  mobile/src/features/start-remote-processing/model/startRemoteProcessing.ts
ced24c23eaf6c357d8574895d09b0c978866bf3e6d6f7d98865094baf4de7b24  mobile/src/shared/remote-gateway/remoteGatewayTransport.ts
a0bc9729bac5a9d2aea19250a1ab34b198d7a956ab59152f41f6ccb39c137294  mobile/src/features/acquire-remote-translation-result/model/acquireRemoteTranslationResult.ts
59a93b4c846ab9a7796f2e6212221c37b000252cf1384e72ae479821247fcc3b  mobile/src/shared/i18n/locales/pt-BR/remoteProcessing.json
```
