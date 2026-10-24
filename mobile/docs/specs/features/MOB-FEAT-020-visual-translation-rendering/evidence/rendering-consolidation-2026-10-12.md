# Consolidação local, galeria e cleanup — 2026-10-12

Parcela de TASK-006/007/008. 020 `in-progress/open`, verdict
`changes-requested`, 021 `approved/blocked`. Não houve alteração de requisito,
runtime mobile, API, manifesto, migration ou defaults. Preparação e testes
locais não autorizam publicação, recursos cloud, credenciais ou provider pago.

## Fontes e artefatos distintos

O [registro técnico do cleanup](../../../../../../api/apps/translation-gateway/docs/cleanup-owned-objects-2026-10-12.md)
documenta a correção, o plano sem mudança de schema e os testes executados.
Snapshot técnico atual: 419 arquivos, SHA-256
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`.
Escopo: `src`, `scripts`, `openapi`, `pom.xml` e arquivos Terraform diretos,
ordenando caminho relativo + NUL + bytes + NUL; não inclui documentos,
`target` ou dados privados. Não é o checksum de governança mobile.

JAR atual: `69a9ae7baaaa285068aabe1ad0b9928d66b0ae5df90aa18e158856072d5d9059`.
Imagens locais novas:

- ARM64: `sha256:db24fa6bf51994837bbd8144177864a67d3ee6f67dca97d0376d4c794f3dc0e9`.
- x86_64 emulada: `sha256:94c72a7496b4dbc073412a1fd42b8d9ab984f5e2af107d871831cfb3be3dcc7f`.

Bases e codecs reutilizados após conferência dos recibos, sem instalação,
download, push ou mudança do default Temurin. Build sem rede/pull; probes
readonly UID 1000/capabilities zeradas e modos disabled aprovados. Isso não
constitui assinatura/publicação, segurança ou admissão operacional.

Comparação direta do conteúdo dos dois JARs fixados: somente as três classes
top-level de cleanup e seus dois records internos diferem. As demais classes,
recursos/fontes e bibliotecas são byte-idênticos. Os dois records têm bytecode,
campos e assinaturas iguais no `javap -c -p -s` independente. A primeira
invocação do javap por classpath Boot não localizou as classes e **não** foi
aceita como prova; a conferência válida usou os arquivos extraídos do ZIP.
Essa igualdade não substitui a repetição do worker com o pacote novo.

## Cleanup corrigido e testes atuais

Três regressões unitárias falharam antes do fix: uma falha de delete impedia
as tentativas das demais referências do mesmo job. A correção tenta cada objeto
já autorizado pelo claim e mantém a intenção pendente quando qualquer remoção
falha. Não confirma sucesso parcial, altera lease/prazo ou repete provider.

[Testes unitários](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/application/ClaimedObjectCleanupTest.java)
e [PostgreSQL](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/persistence/RenderingPersistenceTest.java)
aprovados: 17 testes de aplicação e 89 de persistência, 106 no comando focal.
Três cenários novos cobrem ACK, lote e cleanup imediato: storage fora de TX,
delete dos objetos saudáveis, ausência de confirmação parcial, retry persistido
somente após um minuto, confirmação final e isolamento de um job ativo.
BCNF, PK/FK cascade, índices e CHECKs V1–V9 permanecem inalterados.

Maven global offline/Docker: sete módulos aprovados, 2.768 testes contabilizados,
zero falhas/erros, 104 skips opt-in. Node: 146 pass/um skip. Type-check web e
`pnpm check` mobile integral aprovados antes desta atualização documental;
116 suítes/892 testes mobile, warnings `act(...)` preservados. Checks após
estabilização documental devem ser registrados separadamente, não presumidos.
Prettier/diff do escopo aprovados; diff global externo aponta linha vazia extra
em `PlatformBadge.tsx`, que não foi corrigida automaticamente.

## Galeria sintética, não aprovação humana

A [galeria anterior](../../../../../../api/apps/translation-gateway/docs/rendering-visual-review-2026-10-12.md)
contém 14 casos nos sete destinos/duas arquiteturas, quatro regiões por imagem,
contraste claro/escuro, polígono inclinado e overflow completo. Onze testes de
fixtures/harness passaram; exterior dos polígonos intacto e WebP/PNG iguais
entre alvos. Texto é sintético, não OCR/tradução real. Executa a filha renderer,
não o pipeline Spring/SQL completo; usa o JAR anterior explicitamente.

Inspeção técnica dos PNGs não equivale a revisão independente dos sete idiomas.
Marcador pequeno de overflow e arte residual fora do polígono permanecem visíveis;
o texto completo está no manifesto. Créditos Noto corrigidos para SIL OFL 1.1,
HTML escapado e imagens embutidas verificadas. Navegador recusou `file://`;
não houve contorno da política. Revisão manual do HTML continua pendente.

O XML inicial foi copiado após outro Maven e continha skip: foi quarantinado,
não contado como aprovação. Replay separado concluiu os 11 testes e preservou
XMLs antes de outros comandos; hashes dos 14 casos coincidiram integralmente.
SHA-256 do recibo válido da galeria:
`dacec4ff286f4586826fbfd6912d2711776c1079af8fd9cc3cd608563f15fd5f`.
Nenhum artefato histórico foi sobrescrito ou aprovado retroativamente.

## Matriz nativa conferida e decisão integral ainda aberta

A matriz das imagens novas concluiu 40 testes, zero falhas/erros/skips, em
1h04min. XML capturado antes de outro Maven, 40 casos, IDs das imagens,
propriedades e 38 diagnósticos conferidos. Por arquitetura: 19 diagnósticos,
32 READY, três FAILED e um CANCELLED esperados pelas injeções. JPEG/PNG/WebP,
dimensões extremas, sete destinos pintados, vazio, SDKs loopback, layout local,
falhas de memória/disco, timeout/cancelamento e ENTRYPOINT foram exercitados.
Picos ARM64/x86_64: 2.764.263.424/2.836.910.080 bytes sob 8 GiB, swap zero,
AS pai/filha 3 GiB e zero OOM observado. Não é benchmark comparativo, hardware
x86_64 nativo, contenção agregada operacional ou admissão do baseline 1 GiB.
Nenhuma chamada paga, OCR/tradução real, cloud ou mudança de defaults.

SHA-256 do relatório conferido:
`0912449ea707398d845bd5b6727294bd45f547b25848a8f835fa5f005c4b6bbe`.
XML terminal:
`73dd9367d59c50a790e27408d9128bc134cc64c23d69607bb68d7846a4c93ea9`.
Log:
`6fab0f9cd75ee34b977b31967680a0deef9895cf06b5f978601682dd91bbff55`.
As provas anteriores mantêm seus JARs/datas próprios; não foram transferidas
ao pacote novo. O recibo inicial do cleanup, emitido antes do término da matriz,
permanece histórico; o relatório terminal distinto resolve a pendência local.

| Critério | Evidência localizada                                                              | Limite da conclusão                                                             |
| -------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| AC-001   | galeria anterior com diff completo, preservação e testes de worker/locks          | revisão e operação integrais ainda abertas; galeria não executa worker completo |
| AC-002   | fontes/pintura nos sete destinos e galeria sintética anterior                     | sem aprovação linguística/humana; HTML manual pendente                          |
| AC-003   | manifesto completo, escape HTML e região estreita com overflow                    | marcador não implica tradução legível dentro da área insuficiente               |
| AC-004   | worker vazio na matriz atual com JPEG/PNG/WebP e manifesto íntegro                | vazio sintético não substitui validação operacional                             |
| AC-005   | cleanup atual com regressões, PostgreSQL, retry e isolamento; URLs/TTL existentes | IAM/GCS/Tasks, retenção operacional e demais interleavings abertas              |
| AC-006   | guards, matriz atual de 40 testes/38 diagnósticos e recuperação após falhas       | orçamento/OOM agregado, segurança/distribuição e profiling alvo não admitidos   |

Reviewer/Drift Auditor preservam os guardrails atuais que aceitam 018/019 em
`verification-pending`, mantendo a 021 bloqueada. Mobile-performance: não
aplicável a runtime nesta parcela documental; nenhum componente, fluxo ou
consumo no aparelho foi alterado ou medido. Não inferir performance Android
de Jest, Linux ou galeria sintética.
