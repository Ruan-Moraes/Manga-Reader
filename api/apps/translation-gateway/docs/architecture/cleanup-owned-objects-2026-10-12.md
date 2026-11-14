# Cleanup de referências de um job — 2026-10-12

Parcela de 020/TASK-006, distinta do
[purge por idade](cleanup-isolation.md). A 020 continua `in-progress/open` e a
021 bloqueada. Nenhum provider real, credencial, instalação, ativação ou recurso
cloud foi usado nesta correção.

## Finding e correção

No ACK e no cleanup de ciclo de vida, a primeira falha de remoção interrompia
as demais referências do mesmo job. O retry durável existia, mas os arquivos
saudáveis aguardavam desnecessariamente outra rodada. Três regressões unitárias
reproduziram esse comportamento antes da correção.

[ClaimedObjectCleanup](../src/main/java/com/toonlira/translationgateway/application/ClaimedObjectCleanup.java)
tenta cada chave já autorizada pelo claim, isolando falhas de storage. Se qualquer
remoção falhar, o job continua pendente e é reagendado; sucesso parcial não
preenche `completed_at`. Nenhum erro bruto, texto ou chave é registrado. Não há
retry de OCR/tradução nem enumeração ampla do bucket.

## Persistência e transações

O plano conforme `database-design` preserva PostgreSQL para estados e storage
privado para arquivos. `job_id` continua determinante/chave primária das
intenções de ACK e ciclo de vida, com FK cascade e CHECKs existentes. Os índices
parciais de pendências, leases de cinco minutos e CAS de confirmação continuam
inalterados. Sem migration, índice, tabela por objeto, cache ou contador novo.

Storage permanece fora de transação. O retry de um minuto conserva a intenção
persistida; falha de reagendamento deixa a lease recuperável. A confirmação
continua condicionada à posse da lease, sem sucesso presumido por uma remoção
parcial ou por releitura incerta.

## Verificação executada

- Unitários: três regressões falharam antes do fix; depois, 17 testes passaram.
- PostgreSQL 17: 106 testes passaram, incluindo três novos cenários de ACK,
  lote e cleanup imediato. Todas as referências saudáveis são tentadas, nenhuma
  confirmação ocorre após falha, o prazo persistido impede retry antecipado,
  o retry confirma somente após todas as remoções e o job ativo vizinho é preservado.
- Cadeia Flyway V1–V9 e testes existentes de concorrência, rollback e leases
  executados no banco temporário; nenhuma alteração de SQL.
- Maven global offline com Docker: sete módulos aprovados; 2.768 testes
  contabilizados, zero falhas/erros e 104 skips de testes opt-in. Estes skips
  não são prova da matriz nativa, que é executada separadamente.
- Tooling Node: 146 testes aprovados e um skip; type-check web aprovado.
- Suíte leve offline: 1.023 testes contabilizados, zero falhas/erros e 18 skips
  opt-in. A primeira execução no sandbox teve binds gRPC locais negados e um
  subprocesso indisponível; reexecução autorizando loopback local passou sem
  alterar código, testes ou exclusions. As duas tentativas foram preservadas.
- `pnpm check` mobile integral: specs/links, type-check, lint, FSD, formatação
  e Jest aprovados; 116 suítes/892 testes. Warnings `act(...)` preexistentes
  continuam visíveis, não foram tratados como falha nem corrigidos neste escopo.
- Prettier direcionado e `git diff --check` do escopo aprovados. O diff global
  ainda aponta linha vazia extra no fim de `PlatformBadge.tsx` do landing page,
  externo a esta correção; não foi alterado para produzir gate verde.

A primeira tentativa dos testes novos encontrou um erro de compilação no próprio
teste (asserção de retorno em método `void`); foi corrigido, preservando o log
da tentativa. Não foi uma falha do cleanup em execução.

Comando focalizado, na raiz `api`, com JDK/toolchain já preparados:

```bash
./mvnw -o -t /caminho/toolchains.xml -pl apps/translation-gateway -am test \
  -Dtest=RenderingPersistenceTest,CleanupAcknowledgedResultsUseCaseTest,CleanupLifecycleObjectsUseCaseTest,ClaimedObjectCleanupTest \
  -Dsurefire.failIfNoSpecifiedTests=false
```

## Novo pacote e evidência ainda aberta

O JAR reconstruído tem SHA-256
`69a9ae7baaaa285068aabe1ad0b9928d66b0ae5df90aa18e158856072d5d9059`.
As imagens locais reconstruídas usam exclusivamente as bases/codecs já selados,
com `--pull=false` e `--network=none`:

- ARM64: `sha256:db24fa6bf51994837bbd8144177864a67d3ee6f67dca97d0376d4c794f3dc0e9`.
- x86_64: `sha256:94c72a7496b4dbc073412a1fd42b8d9ab984f5e2af107d871831cfb3be3dcc7f`.

Ambas passaram no probe readonly UID 1000, capabilities zeradas, sem rede,
JRE Ubuntu 25 e defaults desabilitados. Isso não aprova segurança ou operação.
A [matriz anterior](native-metadata-runtime-2026-10-11.md) e a
[galeria anterior](rendering-visual-review-2026-10-12.md) são fotografias do JAR
anterior: não constituem validação automática desta correção.

A repetição com o pacote novo concluiu 40 testes, zero falhas/erros/skips,
em 1h04min. XML terminal foi capturado antes de outros comandos Maven;
IDs das imagens, propriedades, 40 casos e 38 diagnósticos foram conferidos.
Cada arquitetura teve 19 diagnósticos, 32 READY, três FAILED e um CANCELLED
esperados pelas injeções. Fontes/scripts, formatos/dimensões, SDKs loopback,
layout local separado, timeout/cancelamento/falhas e ENTRYPOINT foram exercitados.

Picos observados: ARM64 2.764.263.424 bytes; x86_64 emulada 2.836.910.080 bytes,
sob cgroup diagnóstico 8 GiB, swap zero e AS de 3 GiB no pai/filha. Zero OOM
observado não prova contenção agregada em outro ambiente nem admite 1 GiB cloud.
Uma rodada não é mediana ou benchmark comparativo. Retenção cloud, qualidade,
segurança e admissão operacional continuam abertas.

SHA-256 do relatório nativo conferido:
`0912449ea707398d845bd5b6727294bd45f547b25848a8f835fa5f005c4b6bbe`.
XML terminal:
`73dd9367d59c50a790e27408d9128bc134cc64c23d69607bb68d7846a4c93ea9`.
Log:
`6fab0f9cd75ee34b977b31967680a0deef9895cf06b5f978601682dd91bbff55`.

## Snapshot técnico e rastreabilidade

Snapshot desta correção: 419 arquivos; SHA-256
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`.
Escopo reproduzível: todos os arquivos de `src`, `scripts` e `openapi`,
`pom.xml`, arquivos diretos `infra/terraform/*.tf` e `*.tfvars.example`;
ordenar os caminhos relativos e alimentar SHA-256 com caminho, NUL, bytes
integrais e NUL. Documentos, `target` e dados privados não entram no checksum.
É um checksum técnico do gateway, não cobertura do checksum mobile/SDD.

Os logs red/green, XMLs focalizados capturados antes de outros comandos Maven e
o JAR histórico foram preservados em artefatos locais ignorados pelo Git.
SHA-256 do recibo desta parcela:
`9185305bdd8cf67083843cb7a8e4742c776a5714708edfad5b4451f6646f0896`.
Esse recibo foi emitido quando a matriz nativa ainda estava pendente. O relatório
nativo terminal acima é separado e resolve essa pendência local, sem sobrescrever
o checkpoint histórico nem aprovar operação.

Recibo final separado com 22 artefatos, matriz terminal, check mobile final e
suíte leve autorizada: SHA-256
`a2a326330fd01143529d77fee97b96ed00c971c1a6b10ac405f7cf28fdde7b42`.
Source e JAR foram relidos integralmente; checksum mobile foi reconfirmado
com escopo independente. Nenhuma flag de qualidade/segurança/operação foi
promovida pelo fechamento dessa parcela.
