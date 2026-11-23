# Transporte e integração offline de tradução — 2026-10-03

## Lacuna e execução autorizada

Na auditoria da TASK-002/003/007, os testes existentes verificavam configuração
do SDK e uma chamada por mock, mas não mediam tentativas no transporte gRPC.
A continuidade autorizada até o renderer permite fechar essa evidência sem
provider real, credencial, aquisição de dependência ou mudança de defaults.

Preparação: servidor sintético em loopback, usando os protobufs e SDK já
instalados, e PostgreSQL 17 temporário nos testes existentes. Nenhuma imagem,
resposta privada ou tradução real é utilizada. Não há alteração de persistência,
schema, transições, protocolo, migrations ou infraestrutura cloud.

O teste inicial não compilou porque o configurador de canal era privado. Sua
visibilidade foi reduzidamente ampliada para o mesmo pacote: testes e produção
agora usam o mesmo método que desabilita retry nativo e limita a resposta.
Endpoint, autenticação, deadline de produção e lógica permanecem inalterados.

## Transporte

O servidor falso conta cada RPC recebida pelo client oficial. O teste usa
`NoCredentialsProvider` e endpoint `127.0.0.1`; somente o prazo é reduzido nos
cenários de teste. A configuração de produção mantém 60 segundos, endpoint
global, modelo explícito, máximo de 4 MiB e nenhuma segunda tentativa.

- Uma operação contém todas as regiões e marcadores; jobRef não integra o texto.
- `zh-Hans`, `zh-Hant` e `pt-BR` permanecem targets distintos no request.
- `UNAVAILABLE`, timeout após aceitação e resposta acima de 4 MiB têm uma RPC.
- Modelo NMT inesperado falha sem fallback nem segunda RPC.
- Entrada vazia e requisição acima de 30.000 pontos de código geram zero RPCs.
- Exceções não possuem causa/conteúdo bruto; captura de logs não contém o
  marcador sensível sintético do cenário de indisponibilidade.

O servidor pode emitir diagnóstico gRPC de stream encerrado no teste de resposta
excessiva; o diagnóstico observado não contém texto, IDs ou resposta bruta.
Não se desabilitou observabilidade ou validação para obter resultado verde.

## Worker, adapter, manifesto e PostgreSQL

O teste de integração exercita o adapter real com gRPC falso, casos de uso e
transações PostgreSQL reais, storage local create-only e leitura estrita do
manifesto final. São oito cenários: sucesso, resposta inválida, indisponibilidade,
timeout, rollback, confirmação perdida, cancelamento e falha de upload.

Cada cenário entrega o mesmo job duas vezes e observa exatamente uma RPC. A
chamada ocorre fora de transação. Sucesso e confirmação perdida preservam hash,
IDs e artefato em `RENDERING`/etapa `SUCCEEDED`; falhas/cancelamento não deixam
artefato traduzido referenciado ou órfão local. A fonte OCR permanece intacta.

O fake devolve o texto fonte como resposta sintética: isso verifica transporte,
associação e integridade, **não qualidade ou tradução efetiva**. `RENDERING` é o
handoff confirmado, não renderer ou resultado `READY` implementado.

```bash
# Em api/
./mvnw -o -q -pl apps/translation-gateway -am test \
  -Dtest=GatewaySchemaMigrationTest#shouldProcessTranslationThroughGrpcAndPostgresWithoutRepeatingTheCall,TranslationGrpcTransportTest \
  -Dsurefire.failIfNoSpecifiedTests=false
```

O comando focalizado passou: oito casos de transporte e oito de integração,
zero falhas/erros. PostgreSQL aplicou e validou a cadeia V1–V4.

- [Servidor falso](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/translation/FakeTranslationServer.java).
- [Testes de transporte](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/translation/TranslationGrpcTransportTest.java).
- [Integração PostgreSQL](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/persistence/GatewaySchemaMigrationTest.java).
- [Configuração compartilhada](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/infrastructure/translation/TranslationClientFactory.java).

## Limites e próxima fronteira

TASK-006 continua sem execução real autorizada ou referência linguística.
Nenhum test double comprova que o provider real preservará marcadores, nomes
próprios ou naturalidade em todos os pares. Download, resultado local, navegação
e ACK terminal permanecem ausentes; 020/021 não foram abertas nesta parcela.
Gates integrais e snapshot técnico são registrados após a reexecução completa.

## Revalidação integral

- `api/`: Maven global `./mvnw -o -q test`, com Docker, exit 0. Gateway:
  41 relatórios/333 testes, zero falhas, erros ou skips; Flyway V1–V4.
- `web/toonlira/`: `./node_modules/.bin/tsc -b`, exit 0.
- Snapshot técnico do gateway: 183 arquivos,
  `937f50ceb766ce67ed60015dc6e5e6b3cc17df5a7ba807b6a11ac5d2952b2b69`,
  segundo o algoritmo descrito na
  [evidência da leitura](translation-manifest-reader-2026-10-03.md).

## Finding de retenção — fotografia anterior ao ACK

`GatewayController.acknowledge` retorna `job-state-conflict` incondicionalmente,
inclusive para um job `READY` inserido em fixture. Não há registro durável de
ACK ou cleanup antecipado associado. Isso foi apropriado à fundação inicial
da 017, na qual nenhum produtor de `READY` existia, mas não encerra a obrigação
de retenção da TASK-004 nem a futura integração com renderer/021.

Não se reclassifica esse finding como benchmark externo. A 019 continua
`in-progress`, e 020/021 permanecem bloqueadas enquanto a fronteira necessária
não estiver implementada e auditada. A aquisição/commit e emissão do ACK pelo
aplicativo pertencem à 021; a aceitação idempotente e remoção remota são
responsabilidades server-side. Nenhum resultado `READY` real existe nesta
fotografia.

Correção de contabilização: a soma inicial incluía quatro relatórios históricos
`*IT`, não selecionados pelo Surefire padrão. A execução integral desta fotografia
selecionou 333 testes em 41 classes, não 337/45. Nenhum relatório histórico foi
apagado. A implementação posterior do ACK é documentada separadamente na
[evidência de retenção](translation-result-ack-2026-10-03.md), sem atribuí-la
retroativamente a este snapshot.
