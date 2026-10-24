# Consolidação auditada OCR — 2026-09-27

Evidência sanitizada da implementação, não certificado de qualidade linguística
ou operação cloud. Auditoria local sem credenciais, chamadas Google, aquisição,
regeneração de relatórios antigos ou alteração de runtime. Implementação candidata
a `verification-pending`, mantendo TASK-004/005 abertas. A primeira transição foi
recusada pelo SDD sem tasks da 019 e adotou o fallback `in-progress`/`blocked`.
Após aprovação do marco documental seguinte, na mesma data, os hashes foram
reconferidos e as tasks autorizadas: estado corrente 018 `verification-pending`,
019 `approved/open`, sem implementação de tradução ou novas capturas.

## Inventário revalidado

| Categoria              | Evidência                                                                                                | Limite                                                               |
| ---------------------- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Automatizada/simulada  | gRPC falso, PostgreSQL 17 e fixtures de falhas/limites                                                   | comprova contrato/integração, não qualidade OCR                      |
| Catálogo licenciado    | 15 rodadas reais: duas por idioma nos sete idiomas e uma página histórica japonesa adicional             | 12 páginas iniciais repetem duas cenas; não é benchmark independente |
| Controles tipográficos | quatro rodadas reais, três imagens distintas: horizontal, vertical original/repetida e vertical espaçada | referência sintética conhecida; não é mangá nem revisão linguística  |
| Benchmark independente | 18 posições planejadas, nenhuma referência independente revisada registrada                              | piloto/controles não promovem posições automaticamente               |

Idiomas: `ja`, `en`, `es`, `ko`, `zh-Hans`, `zh-Hant`, `pt-BR`. Catálogo:
12 JPEGs iniciais, duas páginas ilustradas `zh-Hant` e a capa histórica japonesa.
As 19 capturas reais examinadas têm `OCR=SUCCEEDED`, job `TRANSLATING`, manifesto
válido e `cleanupPending=false`. Nenhuma delas tem manifesto vazio. O estado do
job não significa execução de tradução.

Validação: imagem contra catálogo/bundle (hash, MIME, dimensões e bytes),
request/result, captura protobuf (hash, tamanho, origem real), manifesto (hash,
associações e limites), replay do mapper com igualdade das regiões. Relatórios
do catálogo contêm identificador e hashes correspondentes; relatórios dos controles
correspondem exatamente ao renderer puro atual em memória, sem gravação.
448 arquivos anteriores, incluindo análises derivadas, permaneceram idênticos
por SHA-256. Isso é integridade local, não assinatura contra adulteração coordenada.

Inventário/hash por rodada e diagnósticos com conteúdo ficam somente no diretório
privado ignorado pelo Git. Nenhuma imagem, transcrição, credencial, referência
de job ou chave de objeto foi adicionada a esta evidência. O primeiro ensaio do
auditor exigia ID visível em todos os HTMLs; o relatório de calibração não exibe
esse campo. A asserção foi corrigida para comparar seu HTML ao renderer puro,
sem alterar os relatórios; tentativas diagnósticas anteriores foram preservadas.

## Matriz de critérios

| Critério | Implementação e teste                                                                                        | Execução real                                      | Revisão humana                                                     | Operação                                                  |
| -------- | ------------------------------------------------------------------------------------------------------------ | -------------------------------------------------- | ------------------------------------------------------------------ | --------------------------------------------------------- |
| AC-001   | `VisionOcrAdapter.languageHint`; `VisionResponseMapperTest.mapsOnlyExplicitHints` e `rejectsUnknownLanguage` | sete idiomas confirmados no inventário             | não comprova competência/referência independente                   | configuração de produção pendente                         |
| AC-002   | `VisionResponseMapper`, `OcrManifestService`; IDs estáveis, ordem/limites e `GatewaySchemaMigrationTest`     | 19 manifestos/capturas com replay exato            | associações sem referência independente completa                   | consumo pela tradução ainda não implementado, fora da 018 |
| AC-003   | `preservesProviderOrderAndStableIdsForHorizontalAndVerticalCjk`; fixtures e calibração                       | horizontal, capa histórica vertical e controles    | japonês histórico/vertical e benchmark pendentes                   | sem heurística direcional em produção                     |
| AC-004   | `acceptsEmptyPageButRejectsTextWithoutUsableRegions`; worker/manifesto vazio em testes                       | nenhuma página vazia real confirmada               | confirmação independente de página vazia pendente                  | cenário real ainda aberto                                 |
| AC-005   | `VisionOcrAdapterTest`, `ProcessOcrTaskUseCaseTest`, harness e testes transacionais                          | chamadas bem-sucedidas; não injetadas falhas pagas | não aplicável à mecânica de falhas                                 | falhas/redelivery no ambiente implantado pendentes        |
| AC-006   | metadados PostgreSQL sem texto; cleanup, captura privada, erros sanitizados, perfil worker e IAM declarativo | limpeza sem pendência reportada nas rodadas        | autorização das amostras não equivale a aprovação legal do produto | retenção efetiva, logs cloud e release pendentes          |

Fontes e testes auditados, relativos ao módulo
[gateway](../../../../../../api/apps/translation-gateway/README.md):

- [Mapper e limites](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/infrastructure/ocr/VisionResponseMapper.java)
  e [fixtures](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/ocr/VisionResponseMapperTest.java).
- [Processamento](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/application/ProcessOcrTaskUseCase.java),
  [reserva/commit](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/infrastructure/persistence/JdbcOcrJobRepository.java)
  e [testes PostgreSQL](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/persistence/GatewaySchemaMigrationTest.java).
- [Transporte e retry](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/infrastructure/ocr/VisionClientFactory.java),
  [testes do adapter](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/ocr/VisionOcrAdapterTest.java),
  [configuração fail-closed](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/ocr/OcrConfigurationTest.java).
- [Cleanup](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/application/CleanupGatewayUseCase.java),
  [perfil HTTP](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/presentation/OcrTaskControllerTest.java)
  e [IAM declarativo](../../../../../../api/apps/translation-gateway/infra/terraform/main.tf).

Reserva usa lock do job; execução do provider ocorre fora da transação. Commit
vincula etapa/manifesto/job, cancelamento não avança e confirmação perdida não
apaga artefato confirmado. Testes cobrem concorrência, rollback e ausência de
segunda RPC. Etapas abandonadas falham sem nova chamada potencialmente cobrada.

Worker não expõe `/v1`. A rota interna depende da autenticação IAM do Cloud Run;
o filtro Spring permite essa rota e não substitui a barreira de implantação.
Terraform concede invocação do worker somente à conta Tasks; não é evidência de
IAM efetivamente implantado. Semântica best-effort/cleanup não garante eliminação
de versões retidas por soft delete. Não afirmar observabilidade/retenção cloud
completas a partir de testes ou `cleanupPending=false`.

## Limitações e decisão normativa

O [controle de espaçamento](../../../../../../api/apps/translation-gateway/docs/ocr-evaluation/spacing-experiment-2026-09-27.md)
observou 15/16 no original/repetição e 16/16 na variante. Isso sugere influência
da disposição, não prova causa nem autoriza modificar mangás. A investigação
offline situou a omissão antes do mapper. Não inserir texto esperado.

A [análise histórica de colunas](../../../../../../api/apps/translation-gateway/docs/ocr-evaluation/experimental-columns-validation-2026-09-27.md)
permanece parcial. Layout/balões/colunas e onomatopeias não encerram AC-003.
Aprovações exploratórias de Ruan não são revisão independente por idioma; o
usuário declarou não poder validar japonês. Nenhuma nota CER ou meta inventada.

Ruan aprovou explicitamente a ordem estrutural Vision, sem desempate direcional,
e a abertura condicional da 019 após auditoria. Essa reconciliação da frase antiga
está registrada na spec; não mascara uma implementação de ordenação ausente.

TASK-004: referências independentes, qualidade multilíngue/vertical e página
genuinamente sem texto real. TASK-005: implantação privada, integração operacional,
retenção, logs, requisitos legais e gates de ativação. Responsáveis/revisores ainda
não designados não são presumidos; nenhuma destas verificações foi concluída aqui.

## Checksum técnico reproduzível

Gateway: `522476e3c138cf9adf62b4ed1593a8bbcd741a1049575647d18a628ab02ae7a0`,
154 arquivos. Inclui `src`, `scripts`, `openapi`, `pom.xml` e arquivos `.tf`/
`.tfvars.example` diretamente em `infra/terraform`. Exclui build/cache, modelos,
capturas privadas e documentação. Este hash não é o checksum SDD mobile.

Na raiz do repositório, comando somente leitura, sem Java/provider:

```sh
node --input-type=module <<'JS'
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
const root = path.resolve('api/apps/translation-gateway');
const walk = d => fs.readdirSync(d).flatMap(n => {
  const p = path.join(d, n), s = fs.lstatSync(p);
  if (s.isSymbolicLink()) throw Error('unexpected-symlink');
  return s.isDirectory() ? walk(p) : [p];
});
const files = ['src', 'scripts', 'openapi'].flatMap(n => walk(path.join(root, n)))
  .concat(path.join(root, 'pom.xml'), fs.readdirSync(path.join(root, 'infra/terraform'))
    .filter(n => n.endsWith('.tf') || n.endsWith('.tfvars.example'))
    .map(n => path.join(root, 'infra/terraform', n))).sort();
const hash = createHash('sha256');
for (const file of files) hash.update(path.relative(root, file)).update('\0')
  .update(fs.readFileSync(file)).update('\0');
console.log(files.length, hash.digest('hex'));
JS
```

## Gates desta consolidação

Bloqueio P1 histórico de processo: `validate-specs.mjs` exige tasks para uma feature
`approved` com gate aberto. A árvore candidata 018 em verificação + 019 aberta
falhou com `MOB-FEAT-019: status 'approved' exige tasks.md`; o `pnpm check`
candidato parou em specs. Criar tasks da 019 era proibido neste plano. Mantidos
validador e escopo, sem exceção, stub ou declaração fictícia de implementação.
Fallback aprovado aplicado naquele marco: 018 `in-progress`, 019 `blocked`.
O marco posterior foi autorizado por Ruan: reconferência de todos os hashes,
promoção da 018, abertura da 019 e então criação de suas sete tasks de governança,
todas pendentes. O finding de processo está resolvido sem alterar validadores.
Os resultados dos gates da transição ficam na [review](../review.md); as medições
abaixo pertencem à consolidação anterior, sem alegar nova execução OCR.

- Testes Node com fonte local: 86/86, nenhum ignorado.
- Maven global `./mvnw -o -B test` com Docker: sete módulos aprovados, 175 testes
  gateway, zero falhas/erros, 2 min 23 s; cadeia V1–V3 exercitada.
- Web `tsc -b`: exit 0.
- `pnpm check` mobile integral de entrada: passou, 109 suítes/674 testes; inclui perf:test,
  SDD, type-check, lint, FSD e formatação. Avisos `act` existentes não são falhas
  nem foram corrigidos neste marco.
- Revalidação integral na árvore conservadora: `pnpm check` passou novamente,
  109 suítes/674 testes. SDD/links aprovados; os 30 links locais dos quatro
  documentos gateway/plano também foram verificados. Formatação direcionada e
  `git diff --check` aprovados. Sem instalação ou enfraquecimento de validadores.
- Conferência final somente leitura: 154 arquivos técnicos e 448 artefatos
  anteriores mantêm os hashes do inventário auditado.

O checksum SDD corrente está registrado na review/drift. Referências
correntes de outras reviews baseadas na mesma árvore recebem rebase mecânico;
isso não altera seus verdicts ou renova evidências físicas. Os fontes auditados
do gateway e todo runtime permaneceram sem edição neste marco.
