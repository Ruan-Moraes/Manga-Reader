# Consolidação técnica da tradução — 2026-10-03

Confronto da spec, tasks, código e testes da 019 pelos métodos `sdd-reviewer`,
`sdd-drift-auditor` e `mobile-performance`, sob os guardrails atuais. A dependência
018 permanece `verification-pending`; nenhuma verificação OCR foi renovada.
Esta evidência é local e sanitizada: não contém imagem, texto reconhecido,
credencial, job privado, chave de objeto ou resposta real de tradução.

## Escopo e classificação

- Implementação: contratos Java, pares operacionais, adapter global, worker,
  manifesto privado, transações PostgreSQL, ACK durável e contratos/SQLite locais.
- Testes: fixtures sintéticas, client oficial com gRPC local, PostgreSQL 17 via
  Testcontainers, SQLite real em testes Node e testes mobile com doubles.
- Tradução real: nenhuma chamada registrada por este marco. O fake gRPC ecoa
  texto fonte e comprova transporte/associação, nunca qualidade ou naturalidade.
- Revisão linguística e operação cloud: pendentes na TASK-006. Não houve ADC,
  IAM, deploy, habilitação, configuração cloud ou custo de provider.
- Layout experimental, OCR real anterior e simulador mobile: evidências distintas,
  não são usados como aprovação da tradução ou da renderização.

## Matriz de critérios

| Critério | Implementação e evidência automatizada                                                                                                                                                                    | Verificação externa aberta                                                       |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| AC-001   | `TranslationValidatorTest`, `ConfiguredTranslationPairsTest`, capabilities, submissão e worker: 42 pares representáveis, somente subconjunto explícito, nenhum alias/troca ou habilitação vazia implícita | configuração operacional e disponibilidade real dos pares                        |
| AC-002   | `CloudTranslationAdapterTest`, `TranslationGrpcTransportTest` e fluxo PostgreSQL: um envelope de página; validação integral e restauração somente da ordem por ID                                         | preservação dos marcadores/contexto pelo provider, naturalidade e nomes próprios |
| AC-003   | fixtures Java/mobile de `zh-Hans`, `zh-Hant` e `pt-BR`, manifestos, mapper e SQLite v9; seleção existente mantém as variantes distintas                                                                   | qualidade efetiva de ambas as variantes e revisão competente                     |
| AC-004   | validadores e readers estritos Java/mobile: bytes/hash/UTF-8, metadados, IDs, ordem e limites; falhas não avançam para `RENDERING`; geometria OCR preservada                                              | consumo do resultado validado pelo renderer pertence à 020, não à 019            |
| AC-005   | aplicação/PostgreSQL/gRPC: vazio sem RPC, claim único, timeout/indisponibilidade, cancelamento seguro, falha pré-reserva isolada e reentrega sem segunda chamada                                          | falhas/lifecycle no ambiente implantado                                          |
| AC-006   | preflight da página inteira, retries SDK/transporte desabilitados, primeira página única, storage privado create-only, ACK/TTL, leases e erros sem texto/cause bruta                                      | IAM, retenção efetiva, logs, custo e operação cloud                              |

## Fontes inspecionadas e regressões adicionais

Os caminhos Java abaixo são relativos ao [gateway](../../../../../../api/apps/translation-gateway/README.md):

- `domain/translation/TranslationValidator`: limites UTF-16, identidade integral,
  coleções defensivas; idioma habilitado validado inclusive para página vazia.
- `infrastructure/translation/TranslationEnvelopeCodec`, `CloudTranslationAdapter`
  e `TranslationClientFactory`: envelope inteiro com HTML escapado, preflight de
  30.000 pontos de código incluindo marcadores, modelo/global explícitos,
  deadline de 60 s e máximo de uma tentativa, sem chunking ou fallback.
- `application/ProcessTranslationTaskUseCase`, `TranslationManifestService` e
  `infrastructure/persistence/JdbcTranslationJobRepository`: leitura/hash antes
  da reserva, I/O fora de transação, commit etapa/job/artefato, cancelamento,
  rollback e conservação do artefato após confirmação perdida mesmo com job avançado.
- ACK e cleanup: revisão do proprietário, lock, pedido durável, claims
  `SKIP LOCKED`, lease antiga recusada e remoção somente das chaves do job.
  A cadeia Flyway V1–V5 é exercitada no PostgreSQL, não apenas em H2.
- Mobile: parser de bytes/objetos, mapper puro e
  [escrita de regiões](../../../../../../mobile/src/entities/local-translation-result/api/remoteTranslationRegionsStorage.ts)
  em transação exclusiva fornecida pelo chamador, com FK ligada, parent/job/par
  corretos, flags explícitas e rejeição de replay/overwrite. Metadados opcionais
  SQLite v9 não duplicam o destino do projeto.

Na auditoria, a escolha da primeira página já existia em runtime, mas faltava
uma regressão com projeto multipágina fora de ordem. Foram acrescentados dois
testes em
[startRemoteProcessing.test.ts](../../../../../../mobile/src/features/start-remote-processing/model/__tests__/startRemoteProcessing.test.ts):
array invertido envia apenas a página de menor posição, sem mutar o array;
primeira página inválida impede envio, sem fallback para a segunda. O teste
verifica uma tentativa, um upload e nenhum acesso ao arquivo seguinte. Nenhum
runtime, slice, barrel ou schema foi alterado para obter esse resultado.

## Fronteiras não entregues pela 019

TASK-005 entrega validação, associação, metadados e escrita local da tradução;
não entrega o fluxo de aquisição. O adapter não possui chamador de produção até
a 021, que cria o resultado pai, baixa e verifica arquivos, realiza move/commit,
promove `READY` local e envia/recupera ACK. Não há resultado real no aplicativo.

A 020 ainda precisa gerar a imagem e metadados finais, expor URLs assinadas,
incluir todos os objetos na projeção do ACK e reter o original privado até
render/terminal com failsafe absoluto de uma hora. Deve proteger a etapa
`RENDERING` em execução contra cancelamento disparado por reentregas de etapas
anteriores. Esses requisitos serão testados na integração da 020; não existe
producer `READY` de produção nesta fotografia. O ACK foi validado com fixtures
de banco, não com imagem renderizada real.

Não foi encontrada lacuna funcional normativa restante da 019 no escopo
auditado. Compatibilidade do envelope com respostas reais, nomes próprios,
qualidade, revisão linguística, medição física e operação permanecem pendentes,
sem serem renomeadas para critérios aprovados. Se uma resposta real contrariar
o contrato, será finding funcional e exigirá correção/revisão, não aprovação
automática ou flexibilização do parser.

## Performance proporcional

A mudança desta auditoria é documental e de testes: não acrescenta custo ao
runtime. Na fundação existente, entrada limita 1.024 regiões; a escrita local
usa lotes de 64 regiões/200 vértices, no máximo 800 bindings por statement e 37
escritas para o caso máximo, comprovado em teste. Isso demonstra trabalho
limitado, não latência, consumo nativo ou ausência de regressão física. Android,
release e desempenho do futuro renderer continuam sem medição nesta evidência.

## Referência técnica reproduzível do gateway

191 arquivos; SHA-256:
`989dc085cd0880b3f54f255b9380d271c8253eb4bd00fb9fff165b8c1ef55738`.
Reconfirmado antes da decisão; corresponde à fotografia do ACK, sem alterações
Java posteriores. Não é o checksum SDD mobile nem renova o snapshot OCR anterior.

Na raiz do repositório:

```sh
node --input-type=module -e '
import { readdirSync, readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, relative } from "node:path";
const root = "api/apps/translation-gateway", files = [];
function walk(path) {
  for (const entry of readdirSync(path, { withFileTypes: true })) {
    const file = join(path, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (entry.isFile()) files.push(file);
  }
}
for (const directory of ["src", "scripts", "openapi"]) walk(join(root, directory));
files.push(join(root, "pom.xml"));
for (const file of readdirSync(join(root, "infra/terraform"))) {
  if (file.endsWith(".tf") || file.endsWith(".tfvars.example"))
    files.push(join(root, "infra/terraform", file));
}
files.sort((a, b) => relative(root, a) < relative(root, b) ? -1 : 1);
const hash = createHash("sha256");
for (const file of files)
  hash.update(relative(root, file)).update("\0").update(readFileSync(file)).update("\0");
console.log(JSON.stringify({ files: files.length, sha256: hash.digest("hex") }));
'
```

Exclui documentação, build, cache, modelos e capturas privadas. O checksum SDD
é registrado nos headers correntes de review/drift, após estabilizar a árvore.
Rebase mecânico de outras reviews não renova seus verdicts ou medições.

## Gates e decisão

Comandos executados localmente sem credenciais ou chamadas Google:

| Verificação                                                                                                                                       | Resultado observado                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `cd api && ./mvnw -o -q test` com Docker/loopback autorizados                                                                                     | exit 0; gateway: 352 testes/43 classes, zero falhas, erros ou skips                                                    |
| Suíte leve do gateway (`-Dtest.excludedGroups=testcontainers`)                                                                                    | fotografia ACK: 305 testes/42 classes aprovados; hash Java reconfirmado igual, sem nova alteração Java nesta auditoria |
| `node --test api/apps/translation-gateway/scripts/ocr-{samples,evaluation,layout,diagnostic,columns,calibration,calibration-evaluation}.test.mjs` | 85 aprovados, zero falhas, um opt-in de fonte não executado                                                            |
| `cd web/toonlira && ./node_modules/.bin/tsc -b`                                                                                                   | exit 0                                                                                                                 |
| `cd mobile && pnpm check`                                                                                                                         | antes e depois da transição: cadeia integral aprovada; 116 suítes/859 testes, 30 performance, 24 SDD e seis FSD        |
| `cd mobile && pnpm specs:check`                                                                                                                   | 67 artefatos normativos; zero arquivos descobertos/caminhos obsoletos/referências inválidas; links aprovados           |
| Prettier direcionado e `git diff --check`                                                                                                         | aprovados; nenhuma formatação automática global ou reinstalação                                                        |

A agregação do gateway considera os `*Test` selecionados pelo Surefire padrão,
não os XMLs antigos de `*IT` preservados em `target`. O opt-in Node exige
`OCR_CALIBRATION_FONT`, não configurado; não é prova de fonte/licença/glyph da 020. Avisos `act` já existentes no mobile não foram alterados fora do escopo.

Decisão após gates e auditoria: 019 `verification-pending/open`, TASK-006
aberta e seis tasks técnicas concluídas. Matriz atual, review e drift correspondem
a esse estado; as fotografias anteriores `changes-requested` são preservadas.
Não é aprovação linguística, operacional ou promoção a `implemented`.

A autorização de Ruan para execução incremental autônoma até a renderização
permite abrir a 020 depois de satisfeita a dependência. Estado entregue:
020 `approved/open`, oito tasks derivadas e integralmente abertas. Não há
review fictícia da 020, renderer entregue ou antecipação da 021. Defaults
continuam desabilitados; nenhum provider, deploy ou upload é autorizado pelo gate.
