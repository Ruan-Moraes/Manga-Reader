# Histórico anterior à revisão volátil — MOB-FEAT-020 / review.md

> Fotografia preservada em 2026-11-01. Este registro descreve o desenho
> substituído, inclusive seus estados, conclusões e restrições da época. Não é
> contrato vigente nem evidência de implementação do processamento em memória.
> Contrato atual: [spec](../spec.md). Os materiais de prova citados são históricos.

# Review parcial — MOB-FEAT-020

## Auditoria final de conclusão — 2026-11-01

[Auditoria por AC e obrigação do handoff](completion-audit-2026-11-01.md)
realizada sobre código, relatórios e decisões atuais. Verdict `changes-requested`:
AC-005 continua contradito pela retenção absoluta; AC-006 conserva pendência de
admissão do novo pipeline no Compute restrito. A revisão desta fotografia não
é aprovação operacional. 020 `in-progress/open`, 6/8, TASK-006/008 abertas,
021 preservada. Não foi alterado requisito nem criada nova rodada cloud.

## Provas da sessão — continuação de 2026-11-01

Falhas locais por pressão de endereçamento e scratch esgotado agora possuem
[evidência na sessão nova](session-resource-faults-2026-11-01.md), com
FAILED sem artefatos, limpeza e página seguinte READY. A confirmação final dos
gates consta na evidência. Nenhum requisito ou default operacional foi alterado.
Retenção absoluta, matriz adicional/admissão do Compute e revisão permanecem
pendentes: 020 `in-progress/open`, 6/8 tasks, `changes-requested`, 021 preservada.
As fotografias abaixo conservam as pendências anteriores a esta prova.

## Continuação por processo — estado corrente

020 `in-progress/open`, review `changes-requested`, **6/8 tasks**.
TASK-006 continua aberta por retenção absoluta. TASK-008 foi reaberta somente
para revalidar a nova composição storage/render na filha; o aceite humano do
pacote anterior permanece histórico, sem transferência automática.
A 021 permanece `implemented`, com runtime e requisitos preservados.
Ver [evidência da sessão](storage-process-session-2026-10-30.md).
As fotografias abaixo são anteriores a esta mudança.

Estado corrente de 2026-10-30: verdict **`changes-requested`**, 020
`in-progress/open`, **7/8 tasks**. TASK-006 permanece aberta; TASK-008 foi encerrada após admissão humana;
a 021 permanece `implemented`. Correções e novas provas estão na
[evidência da continuação](deadline-restart-android-2026-10-30.md). As seções datadas anteriores são históricas.

## Scan OS da imagem local — 2026-10-27

Trivy 0.76.1 com DB atualizada encontrou 30 ocorrências em 24 CVEs nos pacotes
Ubuntu da imagem diagnóstica; duas ocorrências têm versão corrigida indicada.
O scan foi restrito a pacotes OS e não avalia JRE, Java ou codec manual. Não é
prova de exploração nem aprovação de segurança. Relatório e DB compactada foram
preservados; hashes, versão e limites estão no
[registro técnico](../../../../../../api/apps/translation-gateway/docs/worker-reproducibility-2026-10-26.md).

## Integridade durante montagem — 2026-10-27

Uma regressão reproduziu adulteração temporária de insumo durante a cópia,
sem alteração nos hashes antes e depois. A receita agora valida os bytes lidos
para o archive; três testes passaram e nova montagem reproduziu o mesmo hash.
Detalhes no [registro técnico](../../../../../../api/apps/translation-gateway/docs/worker-reproducibility-2026-10-26.md).

## Montagem determinística do archive nativo — 2026-10-27

A receita e o lock versionados geraram dois archives idênticos e verificaram
insumos fixados. O conteúdo do archive reproduziu codec e contexto em diretório
novo; o JAR era cópia verificada e o daemon já tinha o builder. A segunda
cópia, a extração e o pacote manual anterior foram removidos. A prova não
aprova o JRE nem operação; hashes e limites estão no
[registro técnico](../../../../../../api/apps/translation-gateway/docs/worker-reproducibility-2026-10-26.md).

## Distribuição portátil da base corrigida — 2026-10-27

O archive portátil agora inclui a base corrigida e sua prova, além do builder,
fonte e verificador corrigido. Após extração em diretório novo, codec e contexto
reproduziram os hashes esperados; build sem cache e o worker com READY/ACK
passaram. O JAR veio de cópia local verificada, e o daemon já possuía as
imagens. A imagem temporária e o archive portátil anterior foram removidos.
Isso não aprova o JRE nem operação; hashes e limites no
[registro técnico](../../../../../../api/apps/translation-gateway/docs/worker-reproducibility-2026-10-26.md).

## Associação de manifests OCI — 2026-10-27

Uma regressão reproduziu aceitação de configuração e camadas de manifests
distintos. O verificador foi corrigido; três testes passaram e os archives do
builder, parent e base corrigida foram revalidados. O pacote portátil foi
atualizado e o anterior removido para liberar espaço. O codec foi reconstruído
sem rede a partir do archive novo e reproduziu o manifesto; daemon vazio e outro
host não foram testados. Hashes e limites no
[registro técnico](../../../../../../api/apps/translation-gateway/docs/worker-reproducibility-2026-10-26.md).

## Janela entre ACK e exclusão — 2026-10-27

A prova local mostrou que URLs previamente emitidas ainda baixam os objetos
após ACK 202 e antes do cleanup; depois da exclusão, falham. O ACK registra uma
intenção, não revoga por si uma URL direta já assinada. Isso pode divergir da
exigência de expiração após ACK se ela significar bloqueio imediato, sobretudo
quando o delete falha. TASK-006 permanece aberta; é necessária uma garantia
compatível com o contrato e a semântica de falha. A inferência sobre GCS e o
XML da fixture constam no [registro técnico](../../../../../../api/apps/translation-gateway/docs/worker-reproducibility-2026-10-26.md).

## URLs após cleanup — 2026-10-27

Na prova local do worker, após ACK e cleanup, as URLs de imagem e manifesto
foram solicitadas novamente ainda dentro do prazo e receberam 403. Isso não
comprova revogação antes do cleanup ou comportamento GCS real. Detalhes e XML
estão no [registro técnico](../../../../../../api/apps/translation-gateway/docs/worker-reproducibility-2026-10-26.md).

## ACK durante assinatura — 2026-10-27

Com a cadeia servlet e PostgreSQL locais, uma consulta foi pausada durante a
assinatura e outra requisição confirmou ACK. A consulta retomada retornou
`RESULT_EXPIRED` sem URLs; uma intenção durável foi registrada. Dez testes
passaram sem skips. O assinador nesta interleaving é simulado; detalhes e XML
estão no [registro técnico](../../../../../../api/apps/translation-gateway/docs/worker-reproducibility-2026-10-26.md).
Maven global passou nos sete módulos após a regressão; gateway com 1.319 testes,
zero falhas/erros e 106 skips opt-in. Validação SDD e links também passou.

## Assinatura SDK no gateway — 2026-10-27

No contexto servlet completo, o adapter GCS real e o SDK assinaram duas URLs
com chave RSA efêmera, metadados simulados e sem credenciais ou rede. As
assinaturas foram verificadas e vinculadas às URLs; posse e ACK também passaram
com PostgreSQL. Nove testes passaram sem skips. Não é teste de IAM, GCS ou
transporte HTTPS reais; limitações e XML no
[registro técnico](../../../../../../api/apps/translation-gateway/docs/worker-reproducibility-2026-10-26.md).
Maven global foi repetido após integrar o SDK: sete módulos aprovados, gateway
com 1.318 testes e 106 skips opt-in, sem falhas ou erros.

## Cadeia de segurança do gateway — 2026-10-27

O contexto servlet completo com filtros de segurança e PostgreSQL confirmou
sessões separadas, rejeição cross-owner sem chamar o assinador, READY, ACK
idempotente e RESULT_EXPIRED. O assinador é simulado; não é prova de GCS real.
Nove testes passaram sem skips; hash do XML e limites no
[registro técnico](../../../../../../api/apps/translation-gateway/docs/worker-reproducibility-2026-10-26.md).
Maven global repetido após a alteração passou nos sete módulos; o gateway teve
1.318 testes, zero falhas/erros e 106 skips opt-in.

## Posse na entrega privada — 2026-10-27

Na imagem ARM64 de base corrigida, sessões de duas instalações foram conferidas
com PostgreSQL: consulta e ACK por outra instalação retornaram 404 sem criar
URL ou intenção; a proprietária concluiu downloads, ACK idempotente e cleanup.
Passaram também 176 regressões focadas sem skips. O transporte assinado segue
fixture local; detalhes e hash do XML estão no
[registro técnico](../../../../../../api/apps/translation-gateway/docs/worker-reproducibility-2026-10-26.md).
TASK-002/006/007/008 e o verdict permanecem abertos.
Após essa regressão, Maven global offline passou nos sete módulos (gateway:
1.317 testes, 106 skips opt-in); `tsc -b` e `lint:fsd` web passaram; e
`pnpm check` mobile passou com 121 suítes e 953 testes.

## Triagem do JRE — 2026-10-27

Temurin 25.0.5+8 foi publicado, mas sua disponibilidade não comprova correção
dos findings das bibliotecas embarcadas. A comparação das notas oficiais e do
advisory, com limites e próximos passos, está no
[registro técnico](../../../../../../api/apps/translation-gateway/docs/worker-reproducibility-2026-10-26.md).
O runtime da imagem não foi trocado e o finding segue aberto.
Inspeção posterior do archive oficial ARM64 confirmou os avisos de FreeType
2.14.3 e libpng 1.6.58; a fonte declarada não apresenta o contador do patch
FreeType examinado. Essa observação não prova alcance nem ausência de correção
alternativa. Metadados e hashes foram preservados no registro técnico.

## Base corrigida local — 2026-10-27

A base ARM64 foi preparada com os dois pacotes corrigidos e JRE inalterado;
archive e prova foram preservados. A imagem derivada passou no preflight e em
duas provas locais de entrega/ACK e falha de memória. O archive offline anterior
continua contendo o parent histórico. Não houve scan atual nem aprovação do
FreeType embarcado no JRE; segurança e admissão operacional permanecem abertas.
IDs, hashes e limites constam no [registro técnico](../../../../../../api/apps/translation-gateway/docs/worker-reproducibility-2026-10-26.md).

## Limpeza de intermediários — 2026-10-27

A pedido do usuário, foram removidos archives preliminares e diretórios
extraídos de trabalho após confirmar os hashes dos dois archives finais. Os
insumos fixados, lock inicial, logs e XMLs de evidência foram preservados. As
referências históricas aos archives preliminares preservados descrevem o estado
anterior a esta limpeza. Detalhes no [registro técnico](../../../../../../api/apps/translation-gateway/docs/worker-reproducibility-2026-10-26.md).

## Segurança da imagem reproduzida — 2026-10-27

A inspeção da imagem ARM64 reconstruída encontrou pacotes Ubuntu FreeType e
libpng anteriores a correções publicadas; o font manager também aponta para
FreeType dentro do JRE. A base histórica corrigida não estava no daemon local.
A reprodução permanece válida como prova de integridade, mas não é admissão de
segurança. Versões, hashes, fontes e limites estão no
[registro técnico](../../../../../../api/apps/translation-gateway/docs/worker-reproducibility-2026-10-26.md).
Nenhum default mudou; o finding de segurança continua aberto.

## Sessão na prova integrada — 2026-10-27

O worker da imagem reconstruída voltou a produzir `READY`, dois downloads
íntegros, ACK repetido e cleanup. O harness agora usa o filtro e a autenticação
de sessão reais com PostgreSQL local, e rejeita consulta e ACK sem token. O
controller é standalone e a assinatura é fixture loopback; a cadeia HTTP
completa, TLS e IAM/GCS reais não foram exercitados. Detalhes e hash do XML no
[registro técnico](../../../../../../api/apps/translation-gateway/docs/worker-reproducibility-2026-10-26.md).
O verdict e as tasks abertas permanecem inalterados.
Após a alteração do harness, `./mvnw -o test` passou nos sete módulos; gateway
com 1.317 testes, zero falhas/erros e 106 skips opt-in. O teste do worker foi
executado separadamente, sem skip. `pnpm check` mobile passou novamente com
121 suítes e 953 testes. A tentativa inicial de Maven dentro do sandbox foi
interrompida após falha de attach do agente Mockito; o gate foi repetido com
acesso local adequado e passou.
Na auditoria seguinte, a suíte Node teve 149 passagens e um opt-in pulado;
`RenderingWorkerIntegrationTest`, pulado no global, passou separadamente com
27 casos em PostgreSQL local. O registro técnico documenta a recusa inicial
dos hashes antigos do codec Homebrew e os hashes usados na repetição.

## Reprodutibilidade offline — 2026-10-27

[Evidência](worker-offline-bundle-2026-10-27.md): archives locais fixam
fontes, JDK, Maven, repositório, builder e runtime. JAR e codec foram
reconstruídos a partir de arquivos extraídos, sem ler os caches originais;
imagem sem cache de camadas passou no preflight e no worker com providers
falsos. A prova não inclui outro host, daemon vazio, qualidade ou operação
cloud. Os findings externos permanecem abertos; 020 `in-progress/open`.
Gates de 27/10: Maven global offline/Docker aprovou os sete módulos, com 2.728
testes, zero falhas/erros e 106 skips opt-in do gateway; o worker da imagem
reconstruída foi testado separadamente. Web `tsc -b` e FSD passaram; mobile
`pnpm check` passou com 121 suítes/953 testes. Os nove testes Python dos
verificadores e inventário passaram. Checksum SDD corrente:
`371a046b00743391d3b4f91cdeceef2cec380ee4566d6067b6d31f8910d604e5`.

## Parcela técnica — 2026-10-26

[Evidência atual](worker-private-repro-2026-10-26.md): codec e JAR
reproduzidos; consulta, download local, ACK idempotente e cleanup passaram na
mesma execução do worker. Falha controlada de memória e recuperação passaram.
O transporte assinado é fixture loopback e a autenticação injeta principal de
teste; IAM/GCS, TLS operacional e identidade real não foram exercitados.
Os findings de segurança, orçamento no ambiente alvo e qualidade permanecem
abertos. Verdict `changes-requested`, 020 `in-progress/open`; 021 `implemented`.
O contexto local posterior copia o pacote reconstruído e os metadados corretos;
preflight, hashes da imagem e READY/download/ACK foram revalidados.
Após essa continuação, `pnpm check` passou com 121 suítes e 953 testes;
checksum SDD daquela execução `b33d2ca0e71cfe3e4c1914f5d93e3b494849eafcc6933be3609a56040e1aaeb2`.
Maven global offline/Docker passou nos sete módulos, com zero falhas/erros;
106 skips opt-in do gateway permanecem distintos das duas provas nativas.
Após a atualização documental, `pnpm check` passou novamente: 121 suítes,
953 testes, SDD/links/FSD e formatação aprovados. Os avisos existentes de
`act(...)` permanecem nos logs. Checksum SDD daquela execução:
`f3679136d933f72d4138f7cff40454789fb2d318092fc964df374945deeadca7`.

- Spec revisada: `spec.md`
- Implementação/revisão: working-tree sha256:640b79285c9494534ee21b64e3df6ccb7d4f9b3f7dd5402650cd2032965d7b17
- Gate na entrada do planejamento: `open`
- Dependências verificadas: 019 e 018 em `verification-pending`; validação externa aberta.
- Verdict: `changes-requested`

## Findings atuais — 2026-10-12

[Consolidação atual](rendering-consolidation-2026-10-12.md): fonte
419/1925cc08…cf82a, JAR 69a9ae7b…d9059, novas imagens locais e correção de
cleanup conferidos. Foco PostgreSQL 106 e Maven global 2.768/zero falhas/erros
aprovados; 104 skips opt-in não são a matriz nova, executada separadamente:
40 testes/38 diagnósticos aprovados após XML/IDs conferidos, no novo JAR.
Galeria sintética anterior preservada com replay/XML válidos; não é revisão
humana nem resultado real de tradução. Check mobile integral anterior à
mudança documental aprovado, sem inferir o check final desta árvore.

Finding funcional do cleanup foi corrigido com três regressões red e retry/
isolamento no PostgreSQL. Não reclassificar a descoberta como simples falta
de benchmark nem ocultá-la pelo purge por idade já entregue. F-020-01..04
permanecem abertos: segurança/distribuição, orçamento/admissão, operação e
qualidade não aprovados. Verdict `changes-requested`, tasks/status/gates intactos.
Reviewer/Drift Auditor usam os guardrails atuais de dependências em verificação;
mobile-performance N/A por ausência de alteração de runtime mobile.

Checks finais após estabilização documental: `pnpm check` integral exit 0,
116 suítes/892 testes; SDD/links 67 artefatos, 1.534 classificados, 362 behavior
e 246 evidence. Prettier dirigido/diff do escopo aprovados, warnings `act(...)`
preservados. Checksum mobile corrente
`43d6fae8dc16997f2e4e032e837dbc22be6b590eee424ee41218423ed03ad065`;
62 headers correntes rebaseados mecanicamente, sem renovar verdicts/datas
históricos ou cobrir o Java. O header dentro do histórico da 028 foi preservado.

Suíte leve gateway offline: 1.023 testes contabilizados, zero falhas/erros,
18 skips opt-in. Primeira execução sob sandbox falhou em 18 binds gRPC falsos
(`Operation not permitted`) e um subprocesso indisponível; logs preservados.
Reexecução com loopback/subprocesso locais autorizados passou sem mudar source,
assertions ou grupos excluídos. Maven global e matriz nativa continuam com
seus resultados distintos; nenhum skip é convertido em aprovação operacional.
Diff global externo de `PlatformBadge.tsx` permanece vermelho, fora do escopo.

Recibo final separado, 22 artefatos conferidos, fonte 419/JAR íntegros e
checksum mobile reconfirmado: SHA-256
`a2a326330fd01143529d77fee97b96ed00c971c1a6b10ac405f7cf28fdde7b42`.
Flags de qualidade, segurança e operação continuam false; não é promoção da
feature nem substitui revisão humana ou controles no ambiente alvo.

Suplemento de segurança: [scan do pacote corrigido](../../../../../../api/apps/translation-gateway/docs/rendering-security-refresh-2026-10-12.md)
concluído offline nas imagens novas, DBs locais conferidos/read-only e válidos
na execução. Cada alvo: 121 pacotes OS, 18 ocorrências (13 MEDIUM/cinco LOW),
zero nas 195 dependências Java identificadas. Config exportado/scan e todas
as sete camadas comprimidas/descomprimidas foram vinculados aos IDs Docker;
resultados coincidem com a fotografia anterior, mas são execuções distintas.
Sem atualização, suppression, VEX ou credencial. JRE/codec manual têm cobertura
incompleta; exit 0 e zero ocorrências Java não aprovam F-020-01.

Leitura dos guards de memória não confirmou lacuna funcional nova: checagens,
caps e recusa de ambiente incompatível existem. A garantia declarada não inclui
reserva atômica contra ancestrais/pressão global nem admissão do serviço alvo;
F-020-02 continua aberta, sem ajuste silencioso de orçamento/qualidade.
Reviewer/Drift Auditor preservam status/verdict e separam essas verificações de
segurança/admissão externas. Runtime mobile e performance N/A; nenhum benchmark
Android ou aprovação humana é inferido do scan. Próxima fase operacional exige
decisão/autorização específica antes de recurso, custo, credenciais ou arquivos.

Fechamento do suplemento: check mobile integral reexecutado, 116 suítes/892
testes aprovados; SDD/links/FSD/formatação e diff do escopo aprovados. Checksum
mobile 43d6fae8…ad065 e source gateway 419/1925cc08…cf82a inalterados.
Recibo de 18 artefatos:
`6e7fc65c63b770d949ceb99596f2176103d87c65fa853473892a1ca5ecac9a6b`.
Nenhuma execução Java nova é presumida pela atualização documental.
As verificações operacionais e de qualidade permanecem abertas nas três
últimas parcelas; o próximo avanço depende de decisão humana, não de mais
uma repetição dos mesmos testes locais.

## Fotografia da reconciliação — 2026-10-11

O objetivo integral ainda não foi atingido. Os relatos de parcelas abaixo são
fotografias históricas; não tratar uma pendência antiga como código ainda ausente
quando uma parcela posterior a resolveu. A matriz única de critérios permanece
na seção própria, sem converter simulações em validação real.

A [consolidação corrente](runtime-consolidation-2026-10-11.md) reconfirma
fonte técnica 400/40c14056…149b6, artefatos privados íntegros e imagens locais
Java 25/Boot 4.1.1 com dois patches Ubuntu. Os gates Java da mesma fonte são
reutilizados com a data original; não são uma execução nova desta review.
Nenhuma mudança de intenção ou runtime mobile; performance mobile N/A.
O verdict continua `changes-requested`: segurança residual, orçamento/operação,
qualidade e o diff global externo não foram aprovados.

Check mobile integral desta auditoria: exit 0, 116 suítes/892 testes, sem
reinstalação; warnings `act(...)` preservados. SDD/links 67/1.533/362/245,
formatação dirigida/diff mobile aprovados. Checksum mobile rebaseado só nos
headers correntes após mapa/documentos estabilizarem; não aprova novamente
outras features nem atualiza hashes das fotografias anteriores. Fonte Java,
JAR e capturas continuam intactos; nenhum gate da 020/021 foi promovido.

Fechamento documental: `pnpm check` reexecutado integralmente após a última
estabilização, exit 0, mesmas 116 suítes/892 testes. Checksum mobile corrente
`e5f84e3e646ab95f4bd9e3ecf32051625243272726e7b6e10a63046bf0f6b56c`;
62 headers correntes rebaseados, header histórico da 028 preservado. Isso
não cobre o código Java nem renova aprovação de outras features. Type-check web
reexecutado exit 0; diff mobile/gateway passou, diff global externo continua
vermelho. A matriz única permanece com seis linhas, tasks abertas conservadas.

| Finding                                                                       | Evidência atual                                                                                                                                | Tipo e próximo trabalho                                                                                                                                                 |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| F-020-01/P2 — Candidata Java 25/Boot 4 entregue; segurança/admissão pendentes | JAR e imagens locais atuais, patches Ubuntu limitados e matriz de 40 testes conferidos na consolidação de 2026-10-11                           | Segurança residual OS/JRE/codec, assinatura/publicação e validação operacional abertas. Candidata local não é deploy.                                                   |
| F-020-02/P1 — Orçamento operacional não admitido                              | Baseline Terraform 1 GiB preservado; candidato 2 CPUs/8 GiB bloqueado para deploy normal. Matriz atual mede pico 2.840.174.592 bytes sob 8 GiB | Validar serviço alvo, controles/kernel, OOM agregado e orçamento antes de qualquer ativação separada; diagnóstico local não aprova custos.                              |
| F-020-03/P2 — Perfil opcional local entregue; distribuição/operação pendentes | ONNX real local, SDKs oficiais loopback e renderer das imagens atuais foram exercitados; JNI/modelo readonly externos                          | Bootstrap/perfil local não é ausência de implementação. Distribuição JNI/modelo e combinações operacionais seguem abertas; layout continua separado dos ACs normativos. |
| F-020-04/P2 — Qualidade e operação externas abertas                           | Fixtures/glyphs/hashes, SQL e providers falsos não substituem revisão dos sete destinos, hardware/serviço alvo e IAM/GCS/Tasks/retenção reais  | Revisão humana e validação operacional ainda necessárias. Nenhuma credencial, chamada paga, mídia nova ou aprovação fictícia nesta auditoria.                           |

Fotografia da auditoria anterior: source/test/config 373/62ef09e4…5c4e e JAR 954b42c2…91cd,
sem alteração desde as provas. O checksum técnico histórico tem escopo próprio:
não inclui Dockerfile nem POM pai. Suplemento desta inspeção, bytes íntegros:
Dockerfile SHA-256 `ac5b64ed175583bbddf24305892af91cb80a02f6def8b6d650781049d4ee4174`;
`api/pom.xml` SHA-256 `81cf609acf875daa9a01275a58a3f6860fb2dfa83188b1a849f311ed4d6f7734`.
Não reescrever hashes históricos como se cobrissem esses artefatos.

Reserva/commit, confirmação perdida, expiração imutável V8/V9 e purge por objeto
possuem implementação e regressões atuais; não são “consolidação terminal não
implementada”. TASK-006 continua aberta pela auditoria/validação operacional
integral, não por ausência de todo esse código. Fonts/codec/pacotes locais e
SDK loopback também foram entregues; pacote operacional e admissão completos não.
TASK-002/006/007/008 e 020/021 permanecem conservadas, sem promoção de gate.

A auditoria anterior usou os gates Java/web/Node terminais já registrados da mesma
fonte, sem executá-los novamente ou renovar sua data. Check mobile integral
reexecutado conforme o contrato de review: exit 0, 116 suítes/892 testes;
SDD/links/formatação dirigida/diff aprovados, checksum inalterado. Apenas review/
drift e registros locais mudam, sem runtime ou checksum SDD novo. Skills Reviewer/
Drift Auditor orientam a separação entre código, evidência e decisão externa;
performance mobile N/A. A autorização posterior de preparação foi executada;
resolução local glibc registrada abaixo, sem renovar conclusões anteriores.

## Parcelas verificadas e histórico

Parcela de [diagnóstico independente](rendering-native-image-2026-10-10.md):
Java/JDK puro separado do runtime, sem bibliotecas extras, rede ou ADC. Dezoito
observações sanitizadas; UNKNOWN não vira pass, relatório exclusivo e aprovação
sempre false. Testes escritos red, corrigiram null na soma antes da aprovação.
Docker local ARM64 16 PASS/2 FAIL; x86_64 emulado 17 PASS/1 FAIL. AS ilimitado
esperado, pois a ferramenta não executa bootstrap; ABI ARM não é alvo Cloud Run.
Não aprova F-020-02: segunda geração/tmpfs ainda ausentes do candidato e controles
exatos/syscalls/OOM precisam de prova no serviço. Fonte 390/a820f8de…abdc,
JAR 40f03530…fb906 intacto. Node 105 pass/um skip e web type-check exit 0.
Reviewer/Drift Auditor preservam tasks/verdict/020/021; performance mobile N/A.

Gates do diagnóstico: Maven global offline/Docker exit 0, XMLs frescos desde
2026-10-10T16:14:21.270Z, 2.723 testes/842 classes, gateway 1.252/126,
zero failures/errors e 103 skips opt-in. Testes do probe são executados por
Node/javac, não pelo reactor Maven. `pnpm check` integral exit 0, 116 suítes/
892 testes; web e Node completos aprovados. Exclusão da nova pasta local no Git
faltava e foi corrigida com regressão red→green; relatórios não entram no Git.
SDD/links/formatação dirigida/diff rechecados após os registros finais;
headers rebaseados sem renovar conclusões históricas. Não admite F-020-02.

Parcela de [perfil candidato local](rendering-native-image-2026-10-10.md):
aprovação de 2026-10-10 limitada a arquivos, sem recursos/deploy. Baseline
1 CPU/1 GiB preservado; candidato 2 CPUs/8 GiB, concorrência 1, escala 0–1,
imagem worker opcional por digest e modos disabled. Preconditions fatais no
gateway incondicional e worker impedem o deploy normal do módulo com o candidato;
não são proteção IAM ou contra bypass por edição/target. F-020-02 continua aberta.
Cinco testes estruturais HCL escritos red e aprovados após implementação;
fmt/validate locais aprovados, sem plan/apply. Fonte 387/04f3c1f9…6c24,
JAR 40f03530…fb906 inalterado. Maven global offline/Docker: 2.723 testes/842
classes, gateway 1.252/126, zero failures/errors, 103 skips opt-in; XMLs frescos
desde 2026-10-10T15:42:20.612Z. Type-check web aprovado. Reviewer/Drift Auditor
preservam tasks/verdict/020/021; performance mobile N/A. Checks finais abaixo.

Fechamento do perfil local: suíte leve exit 0; Node 104 pass/um skip, zero
failures. `pnpm check` integral exit 0, 116 suítes/892 testes; warnings de act
e SQLite registrados sem alterar testes alheios. SDD/links/formatação dirigida/
diff aprovados. Checksum de governança `d1560f9308220c45ee08287aa8dba5abd4bf26d3b72f22cecf56d4102fccb810`;
63 headers rebaseados mecanicamente sem renovar conclusões históricas. Fonte
técnica e JAR reconferidos intactos; nenhuma reinstalação, cloud ou chamada real.

Parcela de [perfil combinado](rendering-native-image-2026-10-10.md):
dois workers com ONNX real, clients oficiais loopback e renderer da imagem,
oito READY/layout SUCCEEDED, quatro/três RPCs por worker após reentrega. Hashes
visuais máximos coincidem com baseline sem layout; picos 2.639.970.304 e
2.877.677.568 bytes sob 8 GiB diagnóstico, sem OOM observado. Três controles
puros e dois integrais aprovados após corrigir cleanup da própria pasta readonly.
Fonte 385/106ea74c…1efb6; JAR 40f03530…fb906 inalterado. F-020-03 distingue
perfil local entregue de distribuição JNI/modelo e operação pendentes.
Reviewer/Drift Auditor aplicados sem promoção; performance mobile N/A.

Gates combinados: Maven global offline/Docker exit 0, XMLs frescos desde
2026-10-10T15:14:59.479Z, 2.723 testes/842 classes, gateway 1.252/126,
zero failures/errors, 103 skips opt-in. Foco cinco testes sem failures/errors/skips.
Node 99 pass/um skip e type-check web exit 0; fonte/JAR reconferidos.

Fechamento combinado: suíte leve exit 0; `pnpm check` integral exit 0,
116 suítes/892 testes. SDD/links/Prettier dirigido/diff aprovados, 67 artefatos,
1.532 classificados/362 behavior/244 evidence. Checksum de governança
`bbd76c19ad644dae005074d2418434f8826be123df5c4029fa87cb0f0efd4ae6`;
63 headers rebaseados sem renovar verdicts históricos. Containers de render
encerrados; modelo reutilizável não foi removido ou modificado.

Ampliação da [matriz da imagem](rendering-native-image-2026-10-10.md):
34 casos terminais aprovados nas mesmas imagens/JAR, 50 READY, seis FAILED e
dois CANCELLED esperados pelas injeções. JPEG/WebP máximos, quatro dimensões,
pintura dos sete destinos e recuperação após AS/scratch/timeout/cancelamento.
Hashes visuais coincidem entre alvos; zero OOM observado não prova OOM agregado.
Bootstrap red por classe de teste ausente foi corrigido no harness, sem relaxar
assertions ou guards. Fonte 383/3f3152ad…c703a; JAR 40f03530…fb906 inalterado.
Providers sintéticos, uma execução por cenário e x86_64 emulado: não são SDKs
residentes, aprovação linguística, mediana ou sizing cloud. Tasks/verdict/gates
conservados; esta parcela não transforma F-020-02 em simples benchmark externo.
Skills Reviewer/Drift Auditor separam evidência e aceite; performance mobile N/A.

Gates da ampliação: global Maven offline/Docker exit 0, XMLs frescos desde
2026-10-10T12:07:37.224Z, 2.719 testes/841 classes, gateway 1.248/125,
zero failures/errors e 102 skips opt-in; matriz de 34 executada separadamente.
Node 99 pass/um skip e type-check web exit 0. Hash técnico/JAR reconferidos
após execução; checksum mobile de governança é separado do código Java.

Fechamento desta parcela: suíte leve exit 0 e `pnpm check` final integral
exit 0 (116 suítes/892 testes); SDD/links/formatação dirigida/diff aprovados.
Checksum SDD `8af6e8fa00d796ee01b77909127d5120627ea9465bb4307eea6f90f4194d27f4`,
67 artefatos/1.532 classificados/362 behavior/244 evidence. Os 63 headers
foram rebaseados mecanicamente, sem renovar conclusões históricas. Fonte/JAR
e registro local da matriz íntegros; nenhum container renderer ficou ativo.

Parcela de [imagem nativa candidata](rendering-native-image-2026-10-10.md):
contexto exclusivo de nove arquivos, pins/hash streaming, Dockerfile opt-in e
preflight Java de JAR/Boot/ELF/runtime/carga do codec entregues. Imagens locais
ARM64/x86_64 construídas sem pull no build, RUN network none e usuário 1000.
Quatro testes completos passaram: seis READY com SDKs loopback sem mounts
de JAR/libs do host e entrypoint real health=200/public=403/OCR=503, sem portas
publicadas e cap do pai 3 GiB confirmado. Fonte 383/8303a7a3…1f7b9,
JAR 40f03530…fb906, Dockerfile.native suplementar 36b07b4d…936f5.
Helper Alpine (~3 MB) do primeiro bind TC adquirido implicitamente: desvio
informado/documentado, harness corrigido para bind direto e reexecuções verdes.
Não reescrever a rodada original como toda offline. Base histórica/builder
deprecated, publicação, orçamento cloud, matriz ampliada/ONNX/OOM e qualidade/
operação permanecem abertos. Tasks/verdict/020/021 mantidos; performance mobile N/A.

Gates terminais da imagem: global Maven offline/Docker exit 0, XMLs novos
desde 2026-10-10T11:31:09Z: 2.718 testes/841 classes, gateway 1.247/125,
zero failures/errors, 101 skips opt-in. Relatórios preservados antes da suíte
leve, também exit 0. Node 99 pass/um skip; web type-check e check mobile
integral exit 0 (116 suítes/892 testes). SDD/links: 67 artefatos, 1.532 arquivos,
362 behavior/244 evidence; checksum 729ac983…855a6, 63 headers rebaseados sem
renovar conclusões históricas. Fonte/JAR/Dockerfile.native e pins conferidos;
formatação dirigida/diff aprovados, sem reinstall, cloud, deploy ou provider real.

Parcela de [integração glibc](rendering-glibc-integration-2026-10-10.md):
alvos explícitos/ELF/interpretador do Java, deps exatas e política de arenas no
pai/helper/filha entregues. Contratos red antes do suporte; bootstrap do worker
falhou antes de OCR até fixar política do allocator sem alterar caps/qualidade.
Treze provas nativas selecionadas passaram, quatro workers SDK/12 READY,
hashes visuais iguais, 3/2 RPCs por worker após reentrega e zero OOM observado.
Glbc e musl ARM64/x86_64 emulado, diagnóstico 8 GiB/AS 3 GiB, não orçamento cloud.
Dois testes slim obsoletos foram alinhados à admissão real, sem bypass; uma
seleção ARM musl com flag incorreta ficou skip e foi executada separadamente.
Fonte/testes/config 377/03be9e34…1efdf, JAR 4981e13f…62852. Fotografia anterior
7f83f648…54f44/mesmo JAR separada. Modelos/SDKs/APIs/migrations/mobile/defaults
preservados. Pacote operacional, perfil ampliado/ONNX/OOM combinado, decisão
de orçamento e revisão externa continuam abertos; tasks/verdict/020/021 conservados.
Skills reviewer/drift usadas para separar entrega de verificação; performance mobile N/A.

Gates da parcela: Maven global offline/Docker exit 0, 2.714 testes/839 classes,
gateway 1.243/123, zero failures/errors e 99 skips opt-in; XMLs frescos desde
2026-10-10T10:41:31Z preservados antes da suíte leve, também exit 0.
Node 94 pass/um skip, web type-check e check mobile integral exit 0
(116 suítes/892 testes). SDD/links: 67 artefatos, 1.531 arquivos classificados,
362 behavior e 243 evidence; checksum 13c22450…24748. 63 headers rebaseados,
sem renovar conclusões históricas. Fonte/JAR e Dockerfile/POM pai conferidos;
formatação dirigida/diff aprovados. Não reinstalou dependências nem executou
provider real, deploy, cloud ou imagens privadas.

Parcela de [SDKs residentes Linux](worker-sdk-resources-2026-10-10.md):
cinco testes selecionados aprovados, incluindo dois workers e três controles
puros. Seis READY, zero OOM observado e três RPCs OCR/dois Translation por
worker após reentregas; hashes visuais iguais entre alvos. PNG sintética 80M,
saída máxima total/per-região, fonte/codec/política preservados. Primeiras 64
regiões usam fallback íntegro; pintura e vazio são controles distintos.
Picos cgroup 1.753.382.912/2.086.715.392 bytes sob diagnóstico 8 GiB/AS 3 GiB.
Inclui servidores locais; não admite cloud 1 GiB, ONNX, GCS/Tasks, outros
formatos/scripts/falhas, OOM agregado ou qualidade/produção. Red inicial era
scaffolding; ausência transitiva de classe de teste corrigida no harness,
não finding de runtime. Somente testes/governança mudaram: source 373/62ef09e4…5c4e,
JAR de produção 954b42c2…91cd inalterado; ARM anterior à nova classe unitária
tem fotografia reconstruída separada. Não reatribui matrizes antigas.

Global padrão offline/Docker exit 0: 2.700 testes/836 classes, gateway 1.229/120,
zero failures/errors e 96 opt-ins não selecionados. XMLs frescos desde
2026-10-10T02:45:49Z contados antes da suíte leve. Web/check mobile completos
exit 0, 116 suítes/892 testes; Node 92 pass/um opt-in skip. SDD/links exit 0:
67 artefatos/1.530 arquivos/362 behavior/242 evidence; checksum 546333ef…cb87.
63 headers rebaseados sem renovar conclusões históricas. O green padrão não
substitui as cinco provas selecionadas ou aprova a suíte nativa integral.
Tasks/status/verdict/021/defaults/cloud mantidos; performance mobile N/A.

Suíte leve completa exit 0; hashes/checksum/links/formatação dirigida/diff
reconferidos após os registros, sem reinstall/formato global ou conclusão renovada.

Parcela de [clients oficiais com gRPC local](worker-sdk-loopback-2026-10-09.md):
quatro cenários atravessam controller/SQL/storage/renderer reais com os dois
SDKs, transports loopback e nenhuma credencial. READY/vazio/falhas/redelivery,
hashes/original e ausência de referências sensíveis nos logs conferidos.
Suíte opt-in completa desta classe: 27 testes/zero failures/errors/skips.
Não é qualidade de tradução, bootstrap cloud ou profiling; respostas sintéticas
ecoam texto. Só testes/governança mudaram: source 371/98702c9d…f0c6 e JAR
954b42c2…91cd inalterado, sem nova matriz Linux ou admissão de memória.

Global padrão offline/Docker exit 0: 2.695 testes/835 classes, gateway 1.224/119,
zero failures/errors e 94 opt-ins não selecionados. XMLs frescos desde
2026-10-09T16:08:57Z contados antes da suíte leve. O global padrão não executa
a classe opt-in; seus 27 casos são a execução selecionada separada acima.
Web typecheck/check mobile exit 0, 116 suítes/892 testes. SDD/links/formato dirigido/
diff aprovados: 67 artefatos/1.529 arquivos/362 behavior/241 evidence.
Checksum 0f14f16c…6fea; 63 headers rebaseados sem renovar conclusões históricas.
Tasks/status/verdict/021/defaults/cloud preservados; performance mobile N/A.
ONNX Linux, orçamento/OOM agregado, qualidade e operação continuam pendentes.

Suíte leve completa exit 0; hashes/checksum/links/formatação dirigida/diff
reconferidos após os registros terminais, sem reinstalação ou formato global.
Tooling Node exit 0: 92 pass/um opt-in não selecionado. Nenhuma chamada Google.

Parcela de [bootstrap ONNX](layout-runtime-bootstrap-2026-10-09.md):
os dois runtimes Linux pinados produziram diagnóstico `FAILED/runtime-load`
por `missing-libstdcxx`. Exit 0 do probe só confirma registro do diagnóstico;
nenhuma sessão/inferência foi executada ou memória admitida. Referências GLIBC
no binário são pista estática separada, não prova de solução por libstdc++.
Preparação alternativa Java 23/glibc apresentada para aprovação, ainda não executada.
Somente testes/governança mudaram: fonte/testes/config 371/d740e0aa…08a37;
JAR de runtime 954b42c2…91cd inalterado. Não reatribuir matrizes nativas anteriores.

Global padrão offline/Docker exit 0: 2.694 testes/835 classes, gateway 1.223/119,
zero failures/errors e 93 opt-ins não selecionados. XMLs frescos desde
2026-10-09T15:57:06Z contados antes da suíte leve, também exit 0. Web typecheck
exit 0; check mobile completo exit 0, 116 suítes/892 testes. SDD/links exit 0:
67 artefatos/1.528 arquivos/362 behavior/240 evidence. Checksum d9d9b86d…d44d;
63 headers rebaseados mecanicamente, sem renovar conclusões históricas.
Formatação dirigida/diff/hashes reconferidos. Não é admissão de SDK/layout,
OOM agregado, qualidade ou operação; cloud 1 GiB/defaults/TASK-002/006/007/008/
status/verdict/021 preservados. Performance mobile N/A.

Parcela de [purge por objeto](cleanup-isolation-2026-10-09.md): oito
regressões red/zero errors antes do fix. Falha individual não bloqueia outros
objetos elegíveis; erro final/enumeração incompleta nunca reconhecem sucesso
parcial. 28 casos dos adapters e 23 casos do fluxo integral aprovados.
Source/test/config 369/74f73fe4…d311 e JAR 954b42c2…91cd revalidados em dois
workers Linux frios, seis READY, zero OOM observado e V1–V9. Picos dos controles
1.702.391.808/2.006.630.400 bytes, sob cgroup diagnóstico 8 GiB/AS 3 GiB;
não é admissão cloud 1 GiB, perfil SDK/layout ou prova de OOM agregado.
Não reatribui os quatro FAILED intencionais da matriz anterior a esta seleção.
Web typecheck, Node (92 pass/um opt-in skip) e check mobile completo exit 0,
116 suítes/892 testes. SDD/links exit 0: 67 artefatos/1.527 arquivos,
362 behavior/239 evidence. Checksum 78203f9e…167b; 63 headers rebaseados sem
renovar conclusões históricas. Sem migration, novo índice/cache, alteração de
prazo/qualidade/contrato, cloud ou mídia real. TASK-002/006/007/008/status/verdict/
021 conservados; performance mobile N/A. Gates globais terminais abaixo.

Global padrão desta parcela: exit 0, 2.692 testes/834 classes, gateway
1.221/118, zero failures/errors e 93 opt-ins não selecionados. XMLs frescos
desde 2026-10-09T15:36:47Z contados antes da suíte leve. Green padrão não
aprova a suíte opt-in integral ou a operação cloud.
Suíte leve completa exit 0; SDD/links/formato dirigido/diff e hashes
reconferidos após os registros terminais. Nenhuma reinstalação ou formato global.

Parcela de [resultado com prazo imutável](result-retention-snapshot-2026-10-09.md):
finding P1 reproduzido em dois testes antes do fix. V9 congela política no job
e deadline comum aos dois uploads; guards/projeção/assinatura/purge preservam
o limite aceito. Oito provas PostgreSQL novas incluem upgrade V8→V9, rollback
e espera real de lock até o vencimento. Fluxo com codec/SQL reais: 23 casos
aprovados, zero failures/errors/skips. Seis workers Linux frios: dez READY,
quatro FAILED esperados, recuperação e zero OOM observado. Picos máximos
1.741.434.880/1.941.741.568 bytes, sob cgroup diagnóstico 8 GiB/AS 3 GiB;
não admitem cloud 1 GiB ou OOM agregado. Provider permanece falso.

Fonte/teste/config 369/b2da9964…30bb e JAR c3d1bfbc…f2e1 correspondem à prova,
sem reatribuir matrizes anteriores. Global padrão offline/Docker exit 0:
2.682 testes/834 classes, gateway 1.211/118, zero failures/errors e 93 opt-ins
não selecionados. XMLs frescos desde 2026-10-09T10:54:31Z contados antes da
suíte leve. Web typecheck exit 0; tooling Node exit 0, 92 pass/um opt-in skip.
Checksum SDD 80a290f6…09cb; rebase mecânico de 63 headers não renova verdicts.
Finding de ampliação do prazo tratado, sem reduzir a configuração a uma hora
ou alterar contratos públicos/qualidade/defaults/cloud. Auditoria integral,
orçamento SDK/layout, qualidade, operação/backfill/soft delete seguem abertos.
TASK-002/006/007/008/status/verdict/021 preservados; performance mobile N/A.

Gates terminais desta parcela: suíte leve completa exit 0; check mobile integral
exit 0, 116 suítes/892 testes. SDD/links exit 0, 67 artefatos/1.526 arquivos,
362 behavior/238 evidence. Formatação dirigida/diff e hashes reconferidos após
os registros, sem reinstalar dependências ou formatar globalmente.

Auditoria posterior de [retenção](original-retention-audit-2026-10-09.md):
upgrade V7→V8, EXPLAIN real, SKIP LOCKED, publicação tardia e purge físico sem
SQL aprovados. Foco 269/11 classes, zero failures/errors/skips. Só três arquivos
de testes Java mudaram; source/test/config 365/05469d60…8b32 e JAR de runtime
ae90689a…57a7 preservado. Não há nova execução nativa ou reatribuição de snapshot.
Global padrão offline/Docker exit 0: 2.653 testes/832 classes, gateway 1.182/116,
zero failures/errors e 93 opt-ins não selecionados. XMLs frescos desde
2026-10-09T10:10:52Z contados antes da suíte leve, também exit 0. Web typecheck
exit 0. Checksum corrente 6b519e1e…320f, sem renovação de conclusões históricas.

Finding P1 confirmado em probe Java sintético: mesmo snapshot READY passou de
60 para 3600 segundos ao mudar a configuração. Signer falso, zero provider/rede;
não prova incidente ou purge cloud. `GetJobResultUseCase` e
`ResultExpirationUseCase` ainda usam política corrente; prazo imutável de
resultado precisa de plano/implementação próprios na TASK-006, não de simples
benchmark. Prazo original foi tratado; retenção integral não está concluída.
Tasks/status/verdict/021 preservados; performance mobile N/A.

Gates terminais desta auditoria: check mobile completo exit 0, 116 suítes/892
testes; SDD/links exit 0, 67 artefatos/1.525 arquivos/362 behavior/237 evidence.
Checksum e hashes reconferidos, formatação dirigida e diff aprovados.
Plano da correção de READY registrado no gateway antes de código/V9;
essa preparação não resolve o finding ou promove a feature.

Parcela de [snapshot de retenção original](original-retention-snapshot-2026-10-09.md):
prazo abreviado publicado agora acompanha job/locator, não configuração futura.
V8 aditiva e guards sob lock, sem renovar por replay ou afetar TTL de READY.
Foco recompilado: 264 testes/11 classes, zero failures/errors/skips; 12 casos
PostgreSQL novos. Seis workers Linux frios com JAR novo passaram: dez READY,
quatro FAILED esperados e zero OOM nos controles observados. Picos dos controles
máximos: ARM64 1.737.158.656 e x86_64 emulado 1.899.909.120 bytes, sob cgroup
diagnóstico 8 GiB/AS 3 GiB. Não é aprovação de orçamento agregado/cloud 1 GiB.
Source/test/config 365/61d5ca49…0e52 e JAR ae90689a…57a7 separados dos históricos.
Web typecheck e check mobile integral exit 0, 116 suítes/892 testes.
SDD/links exit 0, 67 artefatos/1.524 arquivos/362 behavior/236 evidence.
Checksum corrente 8d9acc60…9511; rebase mecânico de 63 headers não renova verdicts.
Prazo abreviado deixa de ser lacuna funcional não implementada; auditoria
integral, upgrade especificamente V7, query/cleanup adicionais, qualidade e
operação seguem pendentes. TASK-002/006/007/008/verdict/status/021 preservados;
performance mobile N/A. Gates globais terminais são registrados nesta review;
não transferir green focal à feature inteira.

Global padrão offline/Docker da parcela: exit 0, 2.648 testes/832 classes,
zero failures/errors; gateway 1.177/116 e 93 opt-ins não selecionados.
XMLs frescos desde 2026-10-09T10:00:34Z contados antes da suíte leve.
Esse green padrão não aprova a suíte opt-in nativa integral ou operação cloud.
Suíte leve completa também exit 0. SDD/links, formatação dirigida, diff e
hashes reconferidos após os registros terminais; nenhuma reinstalação ou
formatação global. As pendências explícitas na evidência continuam abertas.
Tooling Node: exit 0, 92 testes aprovados e um opt-in não selecionado, sem rede
Google, ADC ou chamadas de provider.

Parcela de [original da submissão](submission-original-ownership-2026-10-09.md):
finding funcional anterior ao worker, três testes red antes do fix. Confirmação
perdida da reserva apagava mídia já aceita ou ainda sob commit pendente.
Resolução escalar nova aguarda o lock da instalação em REQUIRES_NEW/READ_COMMITTED,
com timeout 30 s, e confere o vínculo exato antes de qualquer descarte. Ausência
provada remove órfão; estado desconhecido preserva arquivo e erro inicial.
Nenhuma nova reserva, quota, task, migration, API, output/qualidade ou ativação.

Foco final recompilado: 69 testes, zero failures/errors/skips. Inclui cinco
casos PostgreSQL, original consumido pelo OCR falso sem segunda chamada,
snapshot antigo do chamador, seis campos divergentes, EXPLAIN e quotas/Flyway.
Source/test/config 359/f0e1627e…9c3d e JAR 0280988e…d9cc, separados dos históricos
ecb35f24/32106912 e das matrizes nativas, não reatribuídas ao JAR novo.
Global padrão offline/Docker exit 0: 2.610 testes/830 classes, zero failures/errors,
93 opt-ins não selecionados; gateway 1.139/114. XMLs frescos desde
2026-10-09T01:27:36Z contados antes da suíte leve. Web typecheck exit 0.
Checksum SDD d170aa0d…9c25; rebase mecânico de 63 headers não renova conclusões.
Check mobile completo exit 0, 116 suítes/892 testes; suíte leve completa exit 0.
SDD/links/formatação dirigida/diff e checksum reconferidos após os registros
terminais. Nenhuma reinstalação, formato global ou renovação de conclusão histórica.

Lacuna funcional adicional confirmada estaticamente: prazo de original menor
publicado pelo disclosure não é aplicado pelo render/varredura de uma hora.
Exige implementação e prova próprias, não simples revisão externa. TASK-006
e 017/TASK-017 permanecem abertas, assim como orçamento SDK/layout, operação e
qualidade. Status/verdict/021 preservados; performance mobile N/A.

Parcela de [commit pendente](commit-resolution-2026-10-09.md), 2026-10-09 UTC:
finding funcional reproduzido nas três etapas, seis failures/zero errors/skips.
Snapshot MVCC anterior ao commit removia uploads antes do lock de falha; não é
benchmark ausente. Correção conserva o fast path por chave/hash e, nos casos
não provados, resolve a falha condicional sob o lock existente antes de reler
vínculos ou descartar. Falha do lock/releitura conserva os uploads, sem retry
de provider ou complete. Sem migration, portas novas, I/O de storage em TX ou
alteração de requisitos, arquivos mobile, APIs, limites ou qualidade.

Suíte integral local recompilada: 84 testes, zero failures/errors/skips, incluindo
seis interleavings PostgreSQL e seis falhas SQL. JAR novo revalidado em seis
workers frios ARM64/x86_64: dez READY e quatro FAILED intencionais, recuperação,
reentrega/integridade/original/limpeza conferidas e zero OOM observado. Não é
prova de OOM agregado ou da suíte nativa integral. Picos do controle máximo
1.740.894.208/1.937.022.976 bytes, somente observações locais sob cgroup diagnóstico
8 GiB/AS 3 GiB; RAM cloud 1 GiB permanece inalterada.

Fonte/config/tests 358/ecb35f24…f09b, JAR 32106912…6140, separados da matriz
67/508c647f…b2da e JAR anterior; nenhuma medição antiga reatribuída. Resumo nativo
sanitizado preservado localmente antes do global. Web typecheck e check mobile
integral exit 0 (116 suítes/892 testes). Checksum cf69fa13…97a1; 63 headers correntes
rebaseados mecanicamente, sem renovar conclusões históricas. Global padrão
offline/Docker exit 0: 2.599 testes/829 classes, zero failures/errors e 93
opt-ins não selecionados; gateway 1.128/113. XMLs frescos desde
2026-10-09T00:57:32Z contados antes da suíte leve. Não transfere o green padrão
à suíte nativa integral. SDD/links separados exit 0: 67 artefatos, 1.522 arquivos,
362 behavior/234 evidence. Formatação dirigida, inclusive o guia de testes,
diff e checksum reconferidos; suíte leve completa exit 0. Checagens documentais
finais não modificaram o checksum ou os fontes auditados.
TASK-002/006/007/008/status/verdict/021 conservados; performance mobile N/A.

Parcela corrente de [headroom JPEG/política 1.1](rendering-jpeg-headroom-2026-10-08.md):
finding de JPEG máximo reproduzido no encode, com razão ALLOCATION sanitizada
e decode concluído. Heaps menores resolveram ARM64, não x86_64; não aprovar pelo
alvo mais fácil. Método 0 lossless/exact preservou todos os pixels no experimento,
com mesmos caps/mídia/deadlines. Política corrente 1.1 versiona esforço, 1.0
conserva método 4; construtor experimental de override retirado. Heap nativo
64..128/default 128 validado antes da preparação. Foco de integração recompilado
exit 0, 19 testes/zero failures/errors/skips, 12 READY JPEG/WebP nos dois alvos,
hashes visuais iguais; schema, geometria, textos e formato de manifesto inalterados.
Matriz ampliada terminou exit 0: 67 testes, zero failures/errors/skips, 52 workers,
74 READY, 12 FAILED e quatro CANCELLED esperados pela injeção de falhas. Doze
testes puros e três provas independentes de codec/limites não são workers extras.
Todos os READY observados usam 1.1; hashes de imagem por cenário coincidiram
entre alvos. Sete destinos pintados com overflow zero são controles separados
dos dois formatos máximos de texto com fallback completo. AS/scratch/timeout/
cancelamento recuperaram a página seguinte, sem outra chamada de provider,
processo vivo ao liberar capacidade ou OOM de kernel nos controles observados.
Isso não é prova de recuperação de OOM agregado nem aprovação da suíte opt-in
integral. Tasks/status/verdict/021 preservados; performance mobile N/A. Capturas/falhas históricas abaixo
permanecem vinculadas aos seus snapshots; não renovar a evidência 1.0 como 1.1.

| Matriz 1.1     | Workers | READY | FAILED esperados | CANCELLED esperados | Pico cgroup (bytes) |
| -------------- | ------: | ----: | ---------------: | ------------------: | ------------------: |
| ARM64          |      30 |    41 |                9 |                   3 |       1.717.071.872 |
| x86_64 emulado |      22 |    33 |                3 |                   1 |       1.991.606.272 |

Execução ampliada de 2026-10-08T23:57:24Z a 2026-10-09T00:33:40Z. Fonte
358/508c647f…b2da e JAR 9498d055…7d24 correspondem à evidência, sem atribuir
a essa fonte o foco anterior 19/1f22ddad…d100. Resumo sanitizado local ignorado
preservado antes de sobrescrever Surefire, 133.714 bytes, SHA-256
`0ff547482e249c7e8a5c87e773a69a9ef4e2b6268a2c3082da97f29f8daacd78`.
Gates independentes correntes: Node 92 pass/um opt-in não selecionado; web
typecheck exit 0; `pnpm check` completo exit 0, 116 suítes/892 testes.
SDD/links separados exit 0: 67 artefatos, 1.521 arquivos, 362 behavior/233 evidence.
Checksum corrente 81472cd8…fdca; rebase mecânico de 63 headers não renova
verdicts históricos. Maven global padrão offline/Docker exit 0: 2.592 testes/
829 classes, zero failures/errors e 92 opt-ins não selecionados; gateway
1.121/113. XMLs frescos desde 2026-10-09T00:34:03Z capturados antes da suíte
leve. O green padrão não substitui nem amplia os 67 casos nativos selecionados.
Suíte leve completa exit 0. Formatação dirigida/diff e SDD/links/checksum
reconferidos após os registros terminais, sem formatar globalmente, reinstalar
dependências, renovar conclusões históricas ou alterar status/tasks/021.

Gates padrão da parcela de formatos máximos, 2026-10-08: Maven global offline/
Docker exit 0, 2.580 testes/828 classes, zero failures/errors e 87 opt-ins não
selecionados; gateway 1.109/112. XMLs frescos desde 2026-10-08T18:23:00Z,
contados antes da suíte leve. **Não aprova a matriz nativa:** primeiro foco exit 1,
seis testes/dois failures JPEG nos dois alvos; diagnóstico ARM64 exit 1,
quatro testes/um failure JPEG, localizado em RENDERING FAILED/internal-error.
WebP concluiu seis READY iniciais e três na repetição, com hashes visuais
iguais. Causa interna do JPEG continua pendente, não resolvida por zero oom_kill.
Node 92 pass/um opt-in não selecionado, web typecheck exit 0. Depois de
estabilizar evidência/tasks/mapa e rebase mecânico de 63 headers, `pnpm check`
integral exit 0, 116 suítes/892 testes, SDD/links/lint/FSD/formatação incluídos.
SDD separado: 67 artefatos, 1.520 arquivos, 362 behavior/232 evidence; links
aprovados. Source diagnóstico 357/d4da86db…cf3b separado do snapshot inicial
357/4dc108ea…f338 e do checksum SDD; JAR 9d0c6357…9131 inalterado. Nenhuma
aprovação retroativa, enfraquecimento de asserção ou alteração de runtime/cloud.
Suíte leve completa exit 0; formato dirigido/diff e SDD/links finais
reconferidos. Performance mobile N/A. TASK-002/006/007/008, status/verdict/021 conservados.

Parcela corrente de [formatos máximos](rendering-maximum-formats-2026-10-08.md):
somente testes/harness/governança. JPEG e WebP reais sintéticos de 80M pixels
preparados isoladamente, sem download/credenciais. Primeiro foco exit 1: seis
testes, dois failures JPEG, zero errors/skips. WebP passou em ambos os alvos,
seis READY com original/hash/texto/ordem/reentrega/cleanup conferidos;
vazio, pintura sem overflow e limite com fallback separados. JPEG válido
falhou no primeiro job em ambos: finding funcional AC-006, não revisão externa.
Não aceitar green padrão como correção do finding ou reduzir a fixture/limites.
Observação diagnóstica de estado/erro foi adicionada somente aos testes,
com snapshots separados. Foco ARM64 repetido exit 1, quatro testes/um failure:
OCR/TRANSLATING SUCCEEDED, RENDERING FAILED/internal-error e job FAILED;
WebP repetido concluiu três READY. Causa dentro do renderer ainda não validada.
Gates finais nesta parcela
serão registrados após execução terminal. Tasks/status/verdict/021 e RAM cloud
conservados; performance mobile N/A, nenhuma produção/API/schema/default alterado.

Gates finais de scripts/dimensões, 2026-10-08: primeira matriz 30 testes,
22 workers/44 READY (source intermediário); controle novo recompilado 22
testes, 14 workers/14 READY pintados, todos overflow zero. Oito leves
reexecutados, não oito capacidades extras. Textos/IDs/ordem/par/bytes/hash,
original/staging/reentrega conferidos; imagens de cada controle iguais entre
alvos, diferentes do vazio. Componentes têm comparação pixel a pixel separada;
não é revisão visual/linguística ou benchmark de todas as mídias/SDKs/layout.
Global padrão offline/Docker exit 0: 2.576 testes/827 classes, zero failures/
errors, 85 opt-ins não selecionados; gateway 1.105/111. XMLs frescos desde
2026-10-08T17:42:10Z contados antes da suíte leve, também exit 0. Não aprova
extended integral. Node 92 pass/um opt-in não selecionado, web typecheck exit 0.
Após estabilizar documentos, `pnpm check` integral exit 0: 116 suítes/892 testes,
SDD/links/lint/FSD/formatação incluídos. Rebase de 63 headers é mecânico, sem
renovar verdicts/históricos. Formatação dirigida/diff reconferidos; source
gateway 354/c17871c6…59b5 separado de governança, JAR 9d0c6357…9131 inalterado.
Zero alteração de runtime, schema, API, limites, qualidade ou RAM cloud.
Matriz PNG não fecha JPEG/WebP máximos, SDK/layout, retenção/operação/qualidade;
TASK-002/006/007/008/status/verdict/021 conservados. Performance mobile N/A.

Parcela corrente: [scripts/dimensões sintéticos](rendering-scripts-dimensions-2026-10-08.md).
Somente testes/harness/governança, sem mudança de contrato/runtime/budget.
Primeiro reactor, 30 testes: onze por alvo concluíram 44 READY com conteúdo
completo/par/IDs/ordem/hash, original/reentrega/staging conferidos. Há distinção
essencial: os limites com muitas quebras produzem fallback e não provam glyphs
desenhados. Controles de texto que cabe foram acrescentados; segundo reactor
recompilou source, 22 testes aprovados: 14 READY pintados, overflow zero,
hashes iguais entre alvos. Oito leves reexecutados não são nova capacidade.
Source intermediário 1877d15b…7cfb/atual c17871c6…59b5 separados; produção/JAR
inalterados. Gates gerais em finalização. Tasks/status/verdict/021 preservados;
performance mobile N/A. Não é aprovação visual, de SDK/layout ou orçamento cloud.

Gates finais da parcela timing/posse, 2026-10-08: 49 focados e 20 positivos
exit 0, zero failures/errors/skips. Oito rodadas timing e oito regressões
AS/scratch passaram; positivas incluem formatos/pixels e três READY máximos
sequenciais por alvo com factory/preparação reais, sem fault nesse cenário.
Global padrão offline/Docker exit 0: 2.562 testes/826 classes, zero failures/
errors e 79 opt-ins não selecionados; gateway 1.091/110. XMLs frescos desde
2026-10-08T16:20:17Z contados antes da suíte leve, também exit 0. Não é aprovação
do extended completo. Node 92 pass/um opt-in não selecionado; web typecheck exit 0.
Depois de estabilizar os documentos e rebase mecânico de 63 headers, `pnpm check`
integral exit 0: 116 suítes/892 testes, SDD/links/formatação/FSD/lint incluídos.
Formatação dirigida/diff e checksum reconferidos; histórico não renovado.
Source/tests/config gateway: 352/66e42dbb…eab3; JAR 9d0c6357…9131, separados
do checksum mobile. Correção é runtime Java, sem schema/API/default/budgetcloud.
Performance mobile N/A; ausência de hang específico provado e orçamento/
extremos/SDK/layout/retenção/qualidade/operação conservados como pendências.

Parcela corrente: [timeout/cancelamento com admissão real](rendering-admitted-timing-2026-10-08.md).
Código divergente de posse reproduzido: filha usava entrada emprestada que
chamador remove após timeout. Fix mantém snapshot comprimido próprio limitado/
hash até morte/cleanup, sob capacidade/admissão. Três ARM64 e um x86_64 emulado por cenário
conferiram timeout sem liberar input/capacidade de filho vivo e cancelamento
transacional durante RUNNING, sem READY/artefatos; sucessora íntegra, reentrega
sem provider e zero OOM. SIGSTOP/CONT é falha artificial exclusiva dos testes,
não diagnóstico de hang nativo. Foco 49 aprovado; gates conforme evidência terminal.
API/manifestos/migrations/defaults/RAM cloud inalterados; performance mobile N/A.
Status/verdict/tasks/021 conservados; orçamento/SDK/layout/extremos,
interleavings/retenção/qualidade/operação ainda exigem provas.

Verificação final da parcela scratch em 2026-10-08: foco 18 exit 0, incluindo
quatro execuções de disco e quatro regressões de AS, com providers sintéticos.
Maven global padrão offline/Docker exit 0: 2.555 testes/826 classes, zero
failures/errors e 75 opt-ins não selecionados; gateway 1.084/110. XMLs frescos
desde 2026-10-08T10:23:31Z, contados antes da suíte leve, também exit 0.
Node 92 pass/um opt-in não selecionado, web typecheck exit 0. Após estabilizar
documentos e rebases de headers, `pnpm check` integral final exit 0, 116 suítes/
892 testes; SDD/links/formatação/FSD/typecheck/lint incluídos. Formatação dirigida
e diff-check aprovados. Recusas intermediárias de checksum/formato preservadas
na evidência, sem reinstalação, enfraquecimento de gates ou renovação de verdicts
históricos. Snapshot gateway 352/9003da67…d7e e JAR 6c824691…13f separados
do checksum de governança; produção inalterada. Não é aprovação de extended,
OOM compartilhado, orçamento operacional ou AC-006 integral.

Parcela corrente: [falta de espaço no worker admitido](rendering-admitted-disk-fault-2026-10-08.md).
Injeção somente no staging tmpfs test-only, com limite/recusa do host comprovados;
fábrica/admissão/caps/qualidade reais preservados. Três ARM64 e um x86_64 emulado observaram FAILED
sem artefatos → READY, filhas reais encerradas, reentrega/original/limpeza intactos.
Foco 18 aprovado; gates conforme resultados terminais da evidência; não inferir aprovação
de requisito integral. Nenhum runtime mobile alterado; performance N/A.
TASK-002/006/007/008/status/verdict/021 conservados. Pendências de timeout,
cancelamento admitidos, orçamento/OOM agregado, retenção/qualidade/operação.

Parcela corrente: [falha controlada por AS no worker admitido](rendering-admitted-memory-fault-2026-10-08.md).
Fábrica de produção compartilhada mantém pacote/cap do pai/admissão; launcher
de teste não cria flag operacional ou bypass. IPC altera somente oito bytes
do cap da primeira filha, com prova byte a byte e conteúdo sintético não vazio.
13 casos focados green; três repetições ARM64 e uma AMD64 emulada, uma injeção,
duas filhas reais exit 1 → 0, nenhuma viva, FAILED sem saída → seguinte READY.
Reentrega/original/limpeza/cap do pai e zero oom_kill conferidos. Comparação
por identidade no primeiro teste de integridade foi corrigida por campos,
sem alteração de domínio ou asserções de runtime. Não inventar causa bruta
ou chamar isso kernel OOM recuperado. O teste real de kernel OOM está intacto.
Global padrão da fábrica exit 0, 2.552 testes/826 classes, gateway 1.081/110,
zero failures/errors e 73 opt-ins não selecionados; XMLs frescos desde
2026-10-08T09:35:54Z. Testes de processos depois fortalecidos e foco revalidado;
JAR inalterado, source técnico atual 352 arquivos, f2d75d6d…0986. Gate extended
completo não aprovado. Orçamento/falhas integrais/qualidade/operação e tasks/
status/verdict/021/RAM cloud conservados; performance mobile N/A.

Gates independentes correntes: suíte leve completa exit 0, Node 92 pass/um
opt-in não selecionado, web typecheck e pnpm check integral exit 0 (116 suítes/
892 testes). SDD/links/formato/diff revalidados; checksum técnico do gateway
separado de SDD, 63 headers rebaseados mecanicamente sem renovar histórico.
Não transferir green padrão para o extended ou para OOM agregado.

Parcela corrente: [preparação do próprio pai no runtime](rendering-parent-bootstrap-2026-10-08.md).
Pré-checagem antes de helper, alvo PID 1/getppid/mesmo executável/cgroup estritos,
sem elevar limite herdado, FFM no pai ou dados de job no IPC. Pai relê cap kernel;
timeout/interrupção aguardam término antes de limpeza. Inherited cap menor
não validado recusado. Porta selecionada continua validada antes de task.

Foco 49 casos passou após reparar referência indevida do probe ao parser do
helper histórico: primeiro foco teve dois failures NoClassDefFoundError após
três READY, preservados. Prova fria atual confirma unlimited inicial → cap
3 GiB de produção, zero helper vivo, três READY por alvo e hashes anteriores.
Recusas 1 GiB depois fortalecidas/passaram, limites do pai idênticos antes/depois.
Suíte leve completa exit 0. Source 350 arquivos/JAR novos separados de SDD;
global padrão novo exit 0: 2.548 testes/825 classes, gateway 1.077/109,
zero failures/errors, 71 opt-ins não selecionados; XMLs frescos desde
2026-10-08T01:50:48Z. Não é aprovação do extended. Node 92 pass/um opt-in
não selecionado, web e pnpm check integral exit 0 (116 suítes/892 testes).
SDD/links/formato/diff revalidados, hashes técnico/mobile separados e rebase
mecânico sem renovar histórico. Orçamento,
fault injection admitido, extremos/SDK/layout, retenção/qualidade/operação
continuam abertos; não usar cap aplicado como aprovação de AC-006.
Status/tasks/verdict/021 e RAM/defaults cloud conservados; performance mobile N/A.

Correção corrente de bootstrap em 2026-10-08, na
[evidência de admissão](rendering-memory-admission-2026-10-07.md):
global anterior terminou exit 1, 2.586 testes/823 classes, gateway 1.115/107,
12 failures/zero errors/skips. XMLs frescos contados antes de novos testes.
Oito probes ARM64 recusaram bootstrap; três eram preventivos com port primário
fornecido, mas o default nativo não usado também estava sendo preparado.
Isso é regressão de configuração confirmada, não falta de benchmark externo.

Regressão red reproduzida/corrigida: default lazy, callback eager no bootstrap
resolve port selecionado. Default sem preparação continua falhando no refresh;
não adiar guard até uma chamada potencialmente cobrada. 21 casos puros e cinco
Linux passaram depois do fix, incluindo os três preventivos sem modificar
asserts/budgets e as duas recusas reais do default em 1 GiB. Preventivos são
diagnóstico com port próprio, não admissão operacional ou prova de kernel OOM.
Suíte leve completa exit 0; nenhum container próprio do renderer ativo após
focos, cache preservado. Source 346 arquivos, 636a8e57…adf4; JAR 70a9f47f…cc57.
Maven global padrão posterior exit 0, sem filtros adicionais: 2.536 testes/823
classes, gateway 1.065/107; zero failures/errors, 69 opt-ins não selecionados.
XMLs frescos desde 2026-10-08T00:27:55Z. Não confundir default com extended
do JAR corrigido, ainda não aprovado. Node 92 pass/um opt-in não selecionado,
web typecheck e pnpm check integral revalidados exit 0 (116 suítes/892 testes).
SDD/links/formato/diff revalidados; headers mecanicamente rebaseados sem
renovar histórico. Fotos/sourcehash mobile e gateway separados.
Cap do próprio pai ainda só preparado por helper de teste; admissão/falhas
integrais/operação e AC-006 abertos. Tasks/verdict/020/021 conservados.

Parcela corrente: [pré-requisito de memória](rendering-memory-admission-2026-10-07.md)
integrado ao bean `supervised-native`, com releitura sob capacidade antes de
staging/filha. Recusa de ambiente desconhecido/insuficiente, caps pai/filha e
scratch finitos, pressão corrente e erros sanitizados conferidos. Não altera
limites do kernel, prepara cap do pai, cria recursos ou muda defaults/RAM cloud.
Não é reserva atômica ou aprovação operacional; AC-006 continua aberto.

Gates focados atuais: 20 casos puros/supervisor/configuração exit 0 fora do
sandbox de processos, depois 22 com a recusa real nos dois alvos. Relatório
negativo fortalecido/reexecutado, dois casos exit 0; valores/tipos presentes.
Sete puros mais dois pipelines máximos exit 0: três READY por alvo, hashes
anteriores, providers falsos, teto local 8 GiB. Primeira falha de deadline no
sandbox preservada; nenhum teste/prazo removido ou enfraquecido.
Global do JAR novo ainda pendente; não transferir verde anterior. Native bean
recusa agora os ambientes antigos de 1/2/4 GiB sem admissão; reconciliar suas
provas sem apagar teste de falha ou aceitar bootstrap recusado como READY.
Source técnico 346 arquivos, 817853e6…a018; JAR 6690a0db…46bf, separados da
governança mobile. Status/tasks/verdict/021 preservados; performance app N/A.

Gates independentes desta parcela: Node 92 pass/um opt-in não selecionado,
typecheck web e pnpm check integral exit 0 (116 suítes/892 testes).
SDD revalidado: 67 normativos/1.514 classificados/362 behavior/226 evidence;
links/formato direcionado/diff válidos. Rebase mecânico de 63 headers, sem
renovar datas/verdicts/conclusões históricas. Maven global offline/Docker com
todos os opt-ins iniciado em 2026-10-07T23:54:18Z terminou reprovado conforme
registro posterior acima. Não reinterpretar esta fotografia como gate corrente.

Experimento posterior: [AS do próprio pai](rendering-parent-address-2026-10-07.md).
Somente helper/fixtures de teste, escopo PID 1/getppid/executável/cgroup privados,
mínimo herdado/recusa/readback kernel. Pai/filha AS 3 GiB no diagnóstico 8 GiB;
três máximas READY em ARM64 e x86_64 emulado, hashes anteriores preservados.
Não há FFM no pai, integração de produção ou garantia de RAM/OOM. Gates globais
concluídos abaixo, não inferidos do foco; tasks/verdict/021 conservados.

Gate global da parcela anterior concluído em 2026-10-07: Maven offline/Docker exit 1,
2.576 testes/821 classes; gateway 1.105/105 classes, três failures, zero errors
ou skips. XMLs frescos desde 2026-10-07T23:11:49Z contados antes da suíte leve.
As três repetições do teste original de OOM reprovaram, container exit 137 e
OOMKilled=true, sem recovery/métricas finais. O helper novo só está no cenário
dedicado: passou em ambos os alvos, mas não corrigiu o runtime. Máximos x86_64
no global mantiveram três READY e os hashes anteriores; pico no experimento
do pai 2.732.404.736 bytes. Não repetir a suíte somente para obter verde.
Finding funcional AC-006, status/tasks/verdict/021 e RAM cloud conservados.

Gates independentes correntes: Node 92 pass/um opt-in não selecionado, web
typecheck e pnpm check integral exit 0 (116 suítes/892 testes). SDD/links e
formato/diff revalidados após o registro final; suíte leve final exit 0.
Source técnico 342 arquivos, ca4acff0…b8426; JAR dba01c8b…5145 inalterado.
Checksum mobile separado; 63 headers rebaseados mecanicamente, sem renovar
conclusões históricas. Nenhum container possuído do renderer ativo após os
gates; cache/toolchain preservados. Warnings gRPC/Mockito existentes mantidos.
Performance do aplicativo N/A. Gates independentes não apagam o global reprovado.

Parcela posterior: [x86_64 local](rendering-amd64-2026-10-07.md).
Metadados/pacotes vinculados ao ELF e runtime, mix/arquitetura desconhecida
rejeitados; codec real com alpha/RGB invisível e decoder ARM64 independente.
Bean/guard e worker Spring/PostgreSQL/storage passaram com providers falsos,
pequena e três máximas a 4 GiB, sob emulação local. Não é hardware nativo/cloud,
admissão operacional ou solução do OOM compartilhado. Matriz/verdict/tasks e
021 conservados.

Gates da parcela x86_64: Maven global offline/Docker exit 0, 2.569 testes/820
classes; gateway 1.098/104 classes, zero falhas/erros/skips. XMLs frescos desde
2026-10-07T16:13:37Z contados antes do leve, relatórios anteriores preservados.
Inclui os cinco probes x86_64 novos e regressões ARM64/contratos/persistência.
Worker máximo x86_64 repetido no global: três READY/pico 2.695.577.600 bytes,
sem OOM, mesmos hashes WebP. Isso não apaga as mortes históricas do pai ou
admite o orçamento de produção. Node 92 pass/um opt-in não selecionado,
web typecheck e pnpm check integral exit 0 (116 suítes/892 testes).
SDD/links/formato/diff válidos; source técnico 340 arquivos/JAR separados do
checksum mobile, 63 headers rebaseados mecanicamente sem renovar histórico.
Nenhum container possuído do renderer ativo após o global; toolchain parado e
cache preservado. Suíte leve final exit 0; warnings gRPC/Mockito existentes
preservados. Checks finais após os registros, sem nova validação histórica.

Parcela corrente: [OOM/recuperação](rendering-worker-oom-2026-10-07.md).
Foco passou três repetições, mas global reproduziu morte do pai (exit 137/sem
recovery). Política self-only depois do RED confirmou +1000 na filha e pai
inalterado/recusa fail-closed; não resolveu a falha: foco Linux posterior teve
dois failures em vinte casos. Não aprovar por testes puros ou repetições verdes.
Finding funcional AC-006 aberto; source/JAR novos têm hardening parcial, não
admissão de runtime. Gates abaixo são fotografias, não verde corrente.
Status/tasks/verdict/021 e RAM/defaults cloud conservados.

Experimento posterior exclusivo do harness: `address-bounded` limita endereço
virtual da filha a 1.536 MiB, mantendo container 2.048 MiB e inputs/codec/política.
Três repetições passaram sem OOM de kernel: máximo FAILED sem saída e seguinte
READY, hashes/limpeza/reentrega conferidos. Não alterou runtime/JAR ou resolveu
atendimento do máximo. O teste de OOM real permanece íntegro e obrigatório.
Pacote ARM64 local não demonstra suporte Cloud Run x86_64; orçamento/prevenção
total e distribuição do alvo continuam abertos. Não transformar fail-fast em
aprovação de AC-006.

Gates da parcela preventiva concluídos em 2026-10-07: Maven global offline com
Docker exit 0, 2.561 testes/817 classes; gateway 1.090/101 classes, zero falhas,
erros ou skips. XMLs frescos desde 10:14:30 UTC contados antes da suíte leve;
relatórios manuais antigos preservados/fora da contagem. Kernel OOM/recovery
passou as três repetições nesta rodada; as falhas anteriores com o mesmo runtime
não foram apagadas nem resolvidas pelo verde. Preventivo passou outras três
repetições no global. Máximo a 4 GiB: três READY e pico total 2.340.634.624 bytes,
sem aprovar produção. Node 91 pass/um opt-in não selecionado, web typecheck e
pnpm check integral exit 0 (116 suítes/892 testes); suíte leve do módulo exit 0,
SDD/links/formato/diff válidos. Warnings existentes de gRPC/Mockito preservados.
Source técnico 336 arquivos, 27d521…3aa80; JAR 848b2b…be82d inalterado. Checksum
mobile separado, headers correntes rebaseados mecanicamente sem renovar
conclusões históricas. Nenhum container renderer ativo após o global.
Performance mobile não aplicável: somente governança, sem código do aplicativo.

Gates independentes do finding: suíte leve do módulo exit 0, Node 91 pass/um
opt-in não selecionado, web typecheck exit 0 e pnpm check integral exit 0
(116 suítes/892 testes). SDD/links/formato/diff válidos; 63 headers rebaseados
mecanicamente, sem renovar conclusões históricas. Source técnico 336 arquivos
e JAR novos separados do checksum mobile. Nenhum container renderer ativo
ao término. Esses gates históricos não resolvem as falhas de isolamento ou fecham AC-006.

Fotografia anterior: [worker Spring Linux](rendering-worker-linux-2026-10-07.md).
Nome binário dos fixtures e ausência de listener efetivo conferidos.
SQL/MockMvc/filtros/storage/renderer reais: pequena passou a 2 GiB e máxima
com texto terminou em OOM; diagnóstico explícito a 4 GiB chegou a READY em
três jobs máximos, sem repetir providers sintéticos. Orçamento insuficiente
é finding funcional AC-006, não apenas revisão externa; 1 GiB cloud intacto.
Gates correntes concluídos: Maven global offline/Docker exit 0, 2.548 testes
globais/815 classes; gateway 1.077 testes/99 classes sem falhas/erros/ignorados.
Worker usou diagnóstico explícito 4 GiB; hipótese 2 GiB continua reprovada.
Contagem fresca antes da suíte leve, quatro XMLs manuais antigos excluídos,
não apagados. Suíte leve, Node (91 pass/um opt-in não selecionado), web
typecheck e pnpm check integral exit 0 (116 suítes/892 testes).
SDD/links/formato/diff aprovados, rebase mecânico de 63 headers sem renovar
conclusões históricas. Hash técnico 333 fontes separado da governança;
nenhum container renderer ativo ao término. Warnings existentes de act/mocks,
gRPC closed stream e restrição futura de FFM preservados.
Tasks/verdict/021 conservados; esse verde não é orçamento/qualidade aprovados.

Fotografia anterior: [dumpabilidade/harness](rendering-dumpability-worker-2026-10-05.md).
PR_SET/GET_DUMPABLE=0 confirmados antes de fontes/mídia, recusa sem fallback
e terminação nativa sem dump no staging. Não altera sysctl/coletor nem protege
contra administrador/coleta independente. Harness Spring completo aguarda
Docker com handle vivo: OrbStack Running, ping timeout/zero bytes, sem restart
ou nova rodada. Maven global/recursos completos não aprovados nesta parcela.
Suíte leve, foco de contratos/launcher/configuração, Node e web aprovados.
pnpm check integral exit 0, 116 suítes/892 testes; SDD (67 normativos/1.509
classificados/362 behavior/221 evidence), links e formato/diff aprovados.
Warnings existentes de act/mocks mantidos. Hash técnico 333 fontes separado
da governança, headers rebaseados mecanicamente sem renovar histórico.
Maven global/harness continuam pendentes, verdict preservado.

## Histórico de findings e limites por parcela

Gates da parcela de limites concluídos: repetição Maven global offline/Docker
exit 0, gateway 1.070 testes/98 classes, zero falhas/erros/ignorados. XMLs frescos
após `2026-10-05T23:35:44.435Z`, quatro harnesses manuais históricos fora da
contagem, não apagados. Primeira rodada com seis timeouts e avisos de clock leap
permanece na evidência; nenhuma asserção/prazo foi enfraquecido. A proteção de
inatividade foi temporária e não eliminou todos os avisos; tempos não são SLA.
Suíte leve, Node (91 pass/um opt-in não selecionado), web typecheck e pnpm check
integral (116 suítes/892 testes, perf/SDD/type/lint/FSD/formato) exit 0.
V1–V7 PostgreSQL 17 revalidadas; 11 novos casos Java. Snapshot técnico 331
arquivos separado do checksum mobile, reconferido sem alteração. Defaults e
RAM cloud intactos. Formato/diff aprovados; SDD/links finais reexecutados.
Warnings existentes de act/SQLite/mocks e restrição futura de FFM preservados.
Nenhum container local do renderer ativo ao término; cache/package preservados.

Parcela corrente: [limites da filha](rendering-native-limits-2026-10-05.md)
inspecionada. TRN3 só na variante explícita, limites self-only confirmados antes
de fontes/decode, mínimos unsigned herdados, recusa sanitizada sem fallback.
JVM da filha tem reservas controladas; pai não recebe FFM. Provas Linux de
negação de mmap/arquivo/CPU e máximos guardados passaram. Não elimina OOM
compartilhado nem prova RAM/temporários/árvore do worker inteiro; pico máximo
continua acima de 1 GiB. TASK-002/006/007/008 e verdict preservados.

Gates da distribuição concluídos: Maven global offline/Docker (1.059 testes
gateway, 96 classes, zero falhas/erros/ignorados na rodada fresca), suíte leve
após superar restrições de localhost/supervisão do sandbox, Node, web typecheck
e pnpm check integral (116 suítes/892 testes) aprovados. SDD/links/checksums e
formato/diff revalidados; detalhes e snapshot técnico separados na evidência.

- Parcela [distribuição relocável](rendering-native-distribution-2026-10-05.md):
  package readonly/pin externo/licenças/ELF efetivo e seleção local explícita
  supervisionada conferidos. Prova real relocável e bean mínimo/filha Boot,
  sem native access no pai, rede ou fallback. Distribuição operacional,
  contenção/recursos totais e worker completo continuam findings abertos.

- Parcela [FFM supervisionado](rendering-supervised-native-2026-10-05.md):
  IPC explícito, filha Boot real, buffer confinado e close antes da transferência
  conferidos. PNG/JPEG/WebP pintados com diff completo e máximo pintado/metadata
  medidos no cgroup pai/filha. Não seleciona FFM no bean ou prova worker inteiro;
  contenção/distribuição/integração e recursos totais continuam findings.

- Decisão humana corrente, 2026-10-05: manter libwebp com orçamento total
  medido. AC-006 foi revisado antes da nova prova, não durante esta review para
  aprovar o código. Buffers internos deixam de ser proibidos em absoluto,
  mas OOM a 1 GiB, integração/contenção/distribuição e recursos completos
  continuam findings abertos. Os registros de 2026-10-04 abaixo são históricos.
- [Prova local de memória](rendering-memory-policy-2026-10-05.md):
  teto experimental 2 GiB, duas fixtures máximas sem redução, pixel hash e
  original íntegros. Limite kernel conferido; metadata de saída coberta por
  regressão red/green. Fontes de produção/JAR inalterados, sem novo bean/default.
  Não é admissão do worker completo; verdict changes-requested preservado.

- TASK-001 implementa somente contratos, política e serialização. Inspeção dos
  tipos/porta/codec e testes não encontrou divergência funcional nesse escopo.
- Parcela TASK-002: adapter Java de libwebp local e PAM por linha inspecionados;
  testes de round-trip nativo, bytes exatos, transparência, timeout, concorrência,
  hash/versão, falhas e limpeza. Não há instalação nem uso de provider.
- Fontes físicas verificadas e composição raster foram entregues no incremento
  posterior. TASK-003/004 técnicas foram conferidas contra fixtures e arquivo
  WebP real; isso não fecha a feature integral.
- Adapter de arquivos local entregue e revalidado no incremento posterior,
  incluindo variantes de PNG/JPEG, snapshot e saída WebP verificável. O worker
  local opt-in agora integra sua execução, uploads e commit.
- Fronteira transacional entregue: V6, reserva única, commit de dois artefatos,
  cancelamento/rollback, expiração e ACK incluindo a imagem. Há chamador opt-in
  no worker local opt-in; confirmação perdida foi exercitada após commit real
  e ACK, preservando os vínculos e arquivos referenciados.
- A feature integral ainda não atende os ACs: faltam empacotamento do codec,
  consolidação terminal, distribuição reproduzível e provas de memória/qualidade.
  São implementações pendentes, não apenas verificações externas; por isso
  status `in-progress`, sem promover para `verification-pending`.
- Consulta owner-scoped aplica TTL de READY e enfileira remoção atomicamente;
  falhas reais de delete são sanitizadas e não confirmadas como sucesso.
- O hash técnico Java anterior está na [evidência de assinatura privada](private-download-adapter-2026-10-04.md),
  separado deste checksum de governança mobile. O snapshot histórico da 019 é preservado.

## Limpeza imediata dos workers — parcela posterior, 2026-10-04

[Evidência](lifecycle-worker-cleanup-2026-10-04.md) e plano inspecionados.
Claim individual usa V7/PK, sem novo schema ou duplicação de referência. Três
workers executam tentativa após reserva/processamento, sem I/O em TX ou remoção
de ativos. Falhas não substituem outcome; fila/lease recuperam delete. READY
mantém saída íntegra e não cria ACK. Upload órfão com delete falho é removido
pela varredura por idade mesmo quando fase SQL falha. Confirmação perdida de
render após ACK continua preservando as duas referências.

Nenhuma divergência funcional encontrada nesta parcela. TASK-006 permanece
aberta para auditoria integral de transições fora do worker e operação real.
Não fecha distribuição/caps/deadline/profiling/revisão visual. Verdict parcial
`changes-requested`, status in-progress/open e 021 bloqueada preservados.
Runtime mobile não alterado; performance nativa não inferida de testes Java.

## Isolamento explícito de JVM — parcela de 2026-10-04

[Plano](../../../../../../api/apps/translation-gateway/docs/rendering-isolation.md)
e [evidência](rendering-isolation-2026-10-04.md) inspecionados. IPC
sem desserialização arbitrária, contagens/tamanho/EOF limitados, reconstrução
pelos validadores e revalidação do arquivo conferidos. Processo Java filho tem
heap/ambiente próprios; timeout/cancelamento e OOME não corrompem original.
Uma falha real de enumeração macOS no finally foi reproduzida e corrigida;
teste negativo mantém mensagem sanitizada e confirma morte da filha.
Equivalência pixel a pixel dos sete destinos é regressão funcional, não
aprovação linguística/profiling. Não há bean novo ou ligação ao pipeline ativo.

Finding funcional remanescente: supervisor por snapshots não é contenção
atômica de árvore; I/O do pai não é preemptível. Boot/Linux, orçamento nativo,
disco e integração supervisionada ainda precisam implementação/provas.
Não classificar essas lacunas como simples benchmark externo. Verdict
changes-requested e tasks abertas preservados; performance mobile não aplicável.

## Critérios e evidências

Locks stale: [evidência](lifecycle-stale-locks-2026-10-04.md) e teste
parametrizado PostgreSQL inspecionados. Barreiras mantêm TX de cleanup aberta;
NOWAIT da etapa pelo dono passou nos três estágios. Hipótese não confirmada,
sem alteração de SQL/produção. Estado e intenção/storage preservados; recuperação
posterior observada. Nenhuma divergência funcional nesse cenário, não revisão
integral de retenção. TASK-006/007, verdict/status e 021 bloqueada preservados.

Política do codec subsequente: [evidência](rendering-native-policy-2026-10-04.md).
Classificação incorreta de dimensões no encode reproduzida e corrigida; scope
do catch, ausência de causa, source e arquivos preservados conferidos no Linux.
Round-trip/limites/cleanup anteriores continuam ativos. Nenhuma divergência
funcional remanescente nesse fix. Pesquisa de alternativas é estática e não
admite dependência, novo encoder ou alteração de AC-006. Cópias/OOM e pendências
de integração continuam abertas; status/verdict/tasks/021 conservados.

Recursos FFM subsequentes: [evidência](rendering-native-resources-2026-10-04.md)
e plano anteriores aos testes. Contrato/worker/defaults inalterados; classes
novas somente no harness. Decode/compositor/encode/decode e pixel hash completo
conferidos no máximo sintético, compositor/CLI independente na pequena pintada.
Fonte preservada após OOM/scratch e recuperação da página seguinte provada.
Source VP8L confirma transform copy integral; máximo multicolor excede 1 GiB
e falha nesse teto. Não aprovar AC-006, promover 020 ou alterar limite/qualidade
para acomodar implementação. Verdict changes-requested mantido; integração
supervisionada/distribuição/contenção/retenção/qualidade ainda abertas.

Profiling de recursos de 2026-10-04 inspecionado:
[evidência](rendering-linux-resources-2026-10-04.md) e harness com
cinco execuções reais. Cgroup/proc/tmpfs e OOM/scratch são observações locais,
não recursos de produção. PNG máximo uniforme passa com 4 GiB experimental
e falha com 1 GiB atual. Source upstream confirma buffers nativos integrais
simultâneos; a afirmação de raster Java único não cobre todo o pipeline.
Finding de AC-006 aberto, sem alterar requisito ou escondê-lo como benchmark.
Build oficial local foi autorizado separadamente, ainda sem troca do codec.
Status/verdict/tasks conservados, nenhuma aprovação de performance Android.

Preparação subsequente inspecionada:
[build oficial](rendering-native-build-2026-10-04.md). Source upstream
intacto, build/install local, hashes/dependências e smoke Java de versão
conferidos; controle negativo rejeitado. Sem C próprio ou runtime alterado.
Não comprova buffers/ABI/alpha/round-trip nem corrige AC-006; warnings e RUNPATH
local preservados como limites. Nenhum finding funcional fechado por esse smoke.

Parcela subsequente inspecionada:
[raster nativo](rendering-native-raster-2026-10-04.md). Uma Arena
confinada é compartilhada por segmento/DataBuffer/BufferedImage; testes
verificam bounds, canais, aliases, close e thread proprietário. Decode JPEG/PNG
direto e composição nos sete destinos preservam pixels/placements/overflow.
Regressão real: tipo ARGB sozinho não rejeitava imagem premultiplicada; fix
explícito mantém rejeição e teste reproduzível. Arbitrary custom não foi admitido.

Nenhuma divergência funcional identificada nesse seam. Não há integração do
codec/worker, validação de ABI WebP, medição de seu pico ou resolução do finding
de cópias/1 GiB. Global Linux ainda exerce o CLI anterior, não a alternativa
nativa. AC-006 continua parcial; tasks/verdict/status e 021 bloqueada conservados.
Runtime mobile não alterado; prova Java não é performance Android.

Codec FFM local subsequente inspecionado:
[evidência](rendering-native-codec-2026-10-04.md). DWARF upstream,
layouts, pins/init/versão, ARGB emprestado e BGRA externo conferidos. Prova
Linux real com decoder CLI independente preserva pixels/alpha/RGB invisível;
writer limita bytes, sanitiza callbacks e respeita ownership/cleanup.
Nenhuma divergência encontrada nesse escopo funcional; não é aprovação integral
de AC-006. Buffers internos VP8L, 80M/orçamento, contenção/distribuição e
integração supervisionada continuam abertos; não há novo bean, runtime mobile
ou ativação. Tasks/status/verdict e 021 bloqueada conservados.

Parcela de posse/locks do dispatch inspecionada em 2026-10-04:
[evidência](dispatch-ownership-2026-10-04.md). Findings confirmados e
corrigidos: falha tardia encerrava job DISPATCHED, conclusões antigas alteravam
lease nova, locks invertidos podiam bloquear cancelamento e recuperação podia
criar nona task. Regressões red preservadas como diagnóstico; CAS pela tentativa,
condicionamento do job/cleanup e ordem explícita de locks conferidos após fix.
Storage local confirma original intacto e zero delete na falha obsoleta.
Não há mudança de requisitos, HTTP, task/manifestos, schema, defaults ou mobile.
Nenhum desses findings permanece aberto no escopo testado; revisão integral
das interleavings/recursos/operação continua pendente. Verdict parcial mantido.

Parcela de controles pós-commit inspecionada em 2026-10-04:
[evidência](lifecycle-controls-cleanup-2026-10-04.md). Callback após
commit, rollback sem exclusão/intenção, CANCEL_PENDING e retry não terminal
preservados, falha diferida e recuperação por lease conferidos no PostgreSQL.
Storage de arquivos real confirma isolamento e preservação da amostra e de
outro job ativo. A regressão ACK foi reproduzida antes da correção:
`NOT_SUPPORTED` impede herdar a TX do chamador durante delete e mantém
confirmação independente. Nenhuma migration ou API pública alterada.
Nenhuma divergência funcional identificada nesta parcela; auditoria integral
das interleavings/retenção operacional continua pendente, sem promoção de tasks.
Distribuição/caps/deadline/profiling/qualidade não foram aprovados.

| Critério | Implementado                                                                            | Evidência verificada                                                                                                                                                    | Resultado                                                                                                                                              |
| -------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC-001   | raster/worker e locks entregues                                                         | diff externo, preservação, cancelamento/rollback e posse; [galeria histórica e pacote atual](rendering-consolidation-2026-10-12.md)                                     | auditoria integral/interleavings e retenção operacional pendentes                                                                                      |
| AC-002   | fontes e composição no worker entregues                                                 | Sete destinos, glyphs/wrapping/contraste e aprovação de Ruan da aparência das fixtures em 28/10, com hashes preservados no registro visual                              | Comprovado nas fixtures aprovadas; não estende aprovação a páginas reais ou outra fotografia                                                           |
| AC-003   | composição, contrato e worker entregues; leitor 021 implementado                        | Overflow completo por ID, marcador seguro, testes e aparência das fixtures aprovados; evidências históricas preservadas                                                 | Fallback comprovado nas fixtures e testes; sem aprovação genérica de conteúdo real                                                                     |
| AC-004   | worker vazio entregue                                                                   | JPEG/PNG/WebP equivalentes após decode, manifesto vazio/READY; [matriz atual](rendering-consolidation-2026-10-12.md)                                                    | operação/qualidade reais pendentes                                                                                                                     |
| AC-005   | Consulta privada, ACK, cleanup e recuperação do JAR definitivo verificados com GCS real | [Continuação de 30/10](deadline-restart-android-2026-10-30.md): versões, hashes, ACK 202/503, retry durável e JVMs distintas; deadline/read-close/restart com red/green | Parcial: retenção absoluta e I/O que ignora cancelamento ainda sem garantia; observação anterior confirmou delete 966 ms após o prazo                  |
| AC-006   | Worker agregado x86 na VM e pacote atual ARM64 medidos; Android máximo aceito perfilado | [Continuação de 30/10](deadline-restart-android-2026-10-30.md): VM 8 GiB, máxima 80 MP, falhas de memória/disco/timeout e Android 40 MP com VmHWM 848.548 KiB           | Aceite histórico preservado; revalidação do novo pipeline em processo pendente (TASK-008 reaberta). Sem admissão automática ou habilitação operacional |

Além da matriz de contratos, o [codec](rendering-codec-2026-10-03.md)
comprova preservação dos pixels ARGB nas fixtures nativas, metadados do arquivo
e limites de stdout, sem prova de pintura, fontes ou pico de memória. Não
substitui revisão visual/operacional nem altera o verdict parcial.

## Entrega privada nas consultas — parcela posterior, 2026-10-04

[Plano](../../../../../../api/apps/translation-gateway/docs/result-query-delivery.md)
e [evidência](result-query-delivery-2026-10-04.md) inspecionados.
Projeção bloqueante owner-scoped, snapshots curtos e NOT_SUPPORTED no
coordenador mantêm assinatura fora de TX. ACK/TTL durante I/O, mudança de
referência e metadata inválida não produzem URL parcial ou READY fictício.
Consultas exigem par completo, no-store e prazos efetivos; versão e oito rotas
preservadas. Parser estrito no slice existente não persiste/baixa arquivos,
não altera READY local e não abre a 021. Sob mutação/replay, omissão dos
downloads permanece explícita e aquisição futura exige GET.

Nenhuma divergência funcional encontrada no escopo inspecionado. URLs já
emitidas não recebem promessa de revogação instantânea. Retenção terminal
integral, distribuição, deadline/caps, profiling e revisão visual continuam
implementação/verificação abertas. TASK-006 não fechada; verdict e gate
conservadores preservados. Métricas nativas não presumidas por testes JS.

Gates da consulta concluídos: Maven global offline/Docker com nativo opt-in
exit 0; 808 testes gateway/68 classes, zero failures/errors/skipped nessa rodada.
Contagem por XML fresco antes da suíte leve, excluindo quatro harness históricos.
Suíte leve exit 0; Node 85 pass/um opt-in de fonte não selecionado; web tsc -b
exit 0; pnpm check integral exit 0, 116 suítes/892 testes. Formatação direcionada
e diff-check aprovados. Rebase dos headers é mecânico, sem renovar verdicts de
outras features. Nova evidência guarda checksum técnico separado e limitações;
SDD/links finais reexecutados após estabilização, sem instalação/cloud/provider.

## Fila de ciclo de vida — parcela posterior, 2026-10-04

[Plano](../../../../../../api/apps/translation-gateway/docs/lifecycle-retention.md)
e [evidência](lifecycle-retention-2026-10-04.md) inspecionados.
BCNF, FK cascade, CHECKs e índice parcial da V7 preservam V1–V6. Intenção
individual acompanha estado na transação; reconciliador limitado cobre históricos
e stales. Elegibilidade exclui ativos/CANCEL_PENDING; READY elimina só original,
sem confirmar download. ACK posterior continua independente. Deletes idempotentes
ocorrem fora de transação mesmo com chamador transacional; leases/CAS recuperam
crash e erro de storage sem conteúdo em logs. Não há retry de provider.

Nenhuma divergência identificada nesse escopo. Remoção imediata integral dos
workers/upload tardio, distribuição, caps/deadline, profiling e revisão visual
continuam abertos. Não promove TASK-006/TASK-017 nem a feature. Nenhum runtime
mobile alterado: avaliação de performance mobile não aplicável neste incremento,
sem inferir ganho nativo por testes Java/Node. Matriz de seis ACs permanece parcial.

Gate global offline/Docker/nativo aprovado (829 testes gateway, 69 classes,
zero falhas/erros/ignorados na rodada fresca). pnpm check integral exit 0,
116 suítes/892 testes; suíte leve, Node e web typecheck aprovados. Formatação
direcionada/diff válidos e SDD final reexecutado após evidência. Falha SQL antes
da varredura e prova de upload tardio ainda exigem incremento funcional, não
são reclassificados como mera falta de benchmark. Detalhes na evidência.

## Admissão Boot — parcela posterior, 2026-10-04

[Plano](../../../../../../api/apps/translation-gateway/docs/rendering-archive.md)
e [evidência](rendering-archive-2026-10-04.md) conferidos contra launcher
e testes. Admissão de um único JAR Boot com manifest/conteúdo allowlisted;
configuração externa, mistura de classpath ou main indevida falham fechadas.
Props fixas selecionam a filha, não o bootstrap Spring. O teste do artefato
exige bytes atuais de todas as classes/recursos e conserva originais/manifestos.
Regressão Surefire reproduzida e corrigida sem admitir cwd; detecção de BOOT-INF
malformado não cai silenciosamente para classpath plano.

Nenhuma divergência funcional identificada nesta parcela. Não declara containment
kernel, distribuição Linux ou segurança por heap. Não muda worker ativo/defaults,
schema/API ou runtime mobile; performance mobile não aplicável. ACs e tasks
integrais permanecem parciais, verdict changes-requested, 020 in-progress e 021
blocked. A prova do JAR não substitui recursos/deadline/profiling/retenção pendentes.

## Linux ARM64 local — parcela posterior, 2026-10-04

[Plano](../../../../../../api/apps/translation-gateway/docs/rendering-linux.md)
e [evidência](rendering-linux-2026-10-04.md) conferidos. Aquisição
explicitamente autorizada, pins de imagem/binaries e ausência de pull/rede/
credenciais em teste. Docker CLI local com configuração vazia, mounts mínimos,
original read-only e cleanup do nome exclusivo; falha de processo não inventa
manifesto. O JAR corresponde às classes/recursos auditados. Seven-script/vazio
é prova funcional local, não qualidade linguística ou volume máximo.

Regressão do launcher multicall OrbStack tratada somente no harness; hash e
no-follow dos codecs preservados. Nenhum código de produção, schema, contrato,
default ou runtime mobile mudou. Performance mobile não aplicável.
Não foi identificada divergência funcional nesta parcela. Assinatura e licenças
transitivas não validadas, staging bind sem quota, distribuição/containment e
recursos/deadline/profiling/retenção continuam lacunas abertas. Verdict parcial
changes-requested e tasks/status/gate conservadores preservados; 021 blocked.

## Prazo e posse da chamada — parcela posterior, 2026-10-04

[Plano](../../../../../../api/apps/translation-gateway/docs/rendering-call-deadline.md)
e [evidência](rendering-call-deadline-2026-10-04.md) conferidos contra
código/testes. Regressão real de launcher travado foi reproduzida antes da
implementação; espera limitada, transferência única e descarte tardio conferidos.
Cancelamento conserva interrupt do chamador e não espera limpeza/sinalização
potencialmente bloqueadas. Capacidade permanece retida enquanto houver posse
pendente, inclusive no teste de sinalização travada; erro bruto não é propagado.
Asserções originais de morte/limpeza foram mantidas com espera eventual explícita.

Nenhuma divergência funcional encontrada nessa parcela; não é aprovação integral
de AC-006. Há limites funcionais ainda abertos de contenção kernel, memória/disco,
distribuição/licenças e integração do worker, além de profiling/revisão visual e
retenção integral. Não fecha tasks nem promove status/verdict. Runtime mobile
inalterado; performance Android não é inferida dos testes. 021 continua blocked.

Gates da parcela: 19 casos focados passaram; Maven global offline/Docker incluiu
native/Boot/Linux e o pacote atualizado, exit 0, 960 testes/79 classes frescas
gateway, zero failures/errors/skipped. Suíte leve, Node e web type-check aprovados;
pnpm check integral exit 0, 116 suítes/892 testes, com SDD/links/formato/FSD.
Não houve instalação, credencial, mídia real ou provider. Hash técnico separado
na evidência; rebase dos headers não renova conclusões de outras features.

## Gates da prova Linux local — 2026-10-04

Focalizado: 21 testes/zero failures/errors/skipped; Maven global offline/Docker
incluiu os opt-ins native/Boot/Linux: exit 0, 947 testes/77 classes frescas no
gateway. Contagem feita antes da suíte leve, sem inferir resultados de XMLs
históricos. Node e web typecheck aprovados; relatório guarda comando/pins/hash
técnico e limites. Não há código de produção novo nem aceite operacional por
container local. Defaults/status/verdict integral permanecem conservadores.

Suíte leve passou com permissão local para gRPC falso/supervisão; o sandbox
restrito bloqueava esses recursos, sem alteração ou exclusão de testes para
aprovar. pnpm check integral passou: 116 suítes/892 testes, cadeia SDD/links/
formato/FSD preservada. Headers correntes rebaseados mecanicamente; conclusões
históricas de outras specs não renovadas. Evidência final guarda as limitações.

## Gates anteriores preservados

Maven global offline/Docker, suíte leve do gateway, testes Node e type-check web
aprovados. `pnpm check` integral aprovado, incluindo SDD, links, formato e
116 suítes/859 testes. Rebase dos headers é mecânico e não renova conclusões
históricas de outras features; resultados na evidência.
Não inferir aprovação integral dos ACs a partir de contratos/testes sintéticos.

## Mudanças fora da spec

O envelope GET foi estendido com resultado privado conforme AC-005, sem rota
nova ou mudança de versão. Nenhum default habilitado. O worker integra render em
modo local opt-in; disabled não prepara fontes/native nem acessa arquivos.
V6 acrescenta
metadados privados à etapa existente, conforme database-design, sem novo estado
público, tabela/índice ou texto no banco.
Os contratos do renderer são internos e não carregam fontes/biblioteca nativa.
O codec exige preparação explícita e chama somente binários locais previamente
verificados; o bean é restrito ao perfil worker e modo local configurado.

O compositor exige fonts verificadas e raster de trabalho explícito;
o adapter posterior implementa a porta de arquivos e a entrada do worker opt-in. Testes do
módulo fixam headless para Java2D; nenhuma configuração operacional é ativada.

## Conclusão

TASK-001/003/004/005 técnicas concluídas; TASK-002/006/007/008 abertas.
Handoff para retenção integral e distribuição, sem afirmar
distribuição/profiling completos. A 020 continua `in-progress`, gate aberto; a 021
permanece `approved/blocked`. A review parcial não é aprovação visual ou operacional.

## Expiração consultável — parcela posterior, 2026-10-04

Parcela seguinte inspecionada: [adapter privado](private-download-adapter-2026-10-04.md),
contratos/porta/SDK e configuração opt-in sem chamador HTTP. 48 testes sintéticos
comprovam assinatura GET/generation com criptografia local, limites, prazo
efetivo, falhas sanitizadas e disabled sem ADC. Nenhuma mudança de schema,
runtime mobile ou endpoint. AC-005 segue parcial: ainda falta exposição segura
owner-scoped e retenção terminal integral. Matriz conserva uma linha por AC;
verdict changes-requested e gates/pendências da feature não são promovidos.

Gates da assinatura concluídos: Maven global offline/Docker com codec opt-in,
suíte leve, Node e web tsc -b exit 0. pnpm check integral passou (116 suítes/859
testes); SDD/links/formato/diff aprovados. Os 48 casos novos passaram; XMLs
Java sobrescritos pela suíte leve não são usados como contagem global. Nenhuma
credencial/chamada Google, instalação, mudança legal ou deploy. Nova evidência
classificada em AC-005; fotografias anteriores e matriz parcial preservadas.

[Evidência](result-expiration-2026-10-04.md) e plano anteriores ao código
conferidos. Timestamp do render, prazo do disclosure até uma hora, lookup por
owner, lock e enfileiramento atômico; TTL não é confirmação de download do app.
Consulta JSON compatível e no-store. ACK e expiração preservam vínculos/hash
para confirmação perdida. Lote SKIP LOCKED e I/O fora do TX; falhas de delete
propagadas sanitizadas. Cleanup privado não segue symlinks nem apaga fontes
reutilizáveis. PostgreSQL 17 confirmou rollback, concorrência e deleção/retry.

Nenhuma lacuna funcional identificada nessa parcela. TASK-006 ainda precisa
de URLs/metadados e retenção terminal integral; distribuição, deadline global,
profiling e qualidade continuam abertas. Verdict changes-requested, 020
in-progress/open e 021 blocked são preservados. Sem ativação/cloud/provider.

Gates desta parcela concluídos: Maven global offline/Docker com codec nativo
opt-in passou; gateway 721 testes/62 classes, zero falhas/erros/ignorados nesta
execução. Quatro XMLs antigos de harness manual foram excluídos da contagem por
data, não confundidos com testes reexecutados. Suíte leve passou, com opt-ins
nativos não selecionados. Node 85 pass/um opt-in de fonte não executado; web
tsc -b passou. pnpm check integral passou: 116 suítes/859 testes, 30 performance,
24 SDD e seis FSD; type-check/lint/formato/links aprovados.

SDD classificou 1487 arquivos, 362 behavior e 199 evidence, com 67 artefatos
normativos. Formatação direcionada e git diff --check passaram. Rebase mecânico
dos 62 headers não altera verdict ou conclusões históricas de outras features.
Nenhum teste/validador/dependência foi removido ou reinstalado. Resultados
históricos abaixo continuam fotografias, não aprovação de qualidade corrente.

## Revalidação do codec — 2026-10-03

42 testes focados aprovados, incluindo dez nativos opt-in com libwebp 1.6.0
local; nenhuma instalação, credencial ou envio. Maven global offline/Docker
reexecutado após a última adição: exit 0, gateway 473 testes/48 classes, zero
falhas/erros/ignorados. Suíte leve aprovada; Node 85 aprovados/um opt-in de fonte
não executado. Web `tsc -b`, `pnpm check` integral (116 suítes/859 testes,
30 performance/24 SDD/seis FSD), links, Prettier direcionado e `git diff --check`
passaram. Fonte/script não avaliados não são aprovados por esses gates.

A evidência registra o novo hash técnico; os históricos de contratos/019 não
foram renovados. TASK-002 permanece aberta até fontes e empacotamento; não há
renderer integrado, nova migration ou produção de `READY` real.

## Revalidação de fontes e pintura — 2026-10-03

[Evidência da parcela](rendering-paint-fonts-2026-10-03.md): 79 testes
focados passaram, incluindo 19 nativos opt-in e desenho nos sete destinos.
Suíte leve, suíte completa gateway e Maven global offline/Docker passaram após
estabilizar os fontes e testes. Gateway: 542 testes/51 classes, zero
falhas/erros/ignorados com opt-in nativo. Cadeia V1–V5 e cenários gRPC/SQL
reexecutados; nenhum provider pago ou credencial.

Node: 85 pass/um opt-in não executado. Web tsc -b e pnpm check integral:
116 suítes/859 testes, 30 performance/24 SDD/seis FSD, type-check, lint,
formato e links passaram. Fonte/modelo de calibração opt-in não executado
não é prova de novos glyphs ou qualidade. O loader Noto tem testes próprios.
Checksum gateway inclui recursos/fonts; mobile permanece governança separada.
Rebases mecânicos dos headers não renovam conclusões históricas.

TASK-003/004 estão tecnicamente entregues em composição local; qualidade visual,
profiling e integração permanecem abertos. Verdict changes-requested e 021
bloqueada são preservados. Nenhuma afirmação de ganho de memória ou qualidade
linguística é derivada das fixtures.

## Persistência — parcela posterior, 2026-10-03

[Evidência de persistência](rendering-persistence-2026-10-03.md):
inspeção de schema/SQL/wrapper confirma BCNF e operações transacionais, sem
I/O de arquivos no repository. Os testes reproduziram e corrigiram os guards
de cancelamento de etapas anteriores e a omissão do WebP no ACK. Nenhum teste
ou constraint foi removido; o upgrade V5→V6 preserva dados válidos anteriores.

TASK-005/006 não foram fechadas por essa prova de metadados. Upload/commit
ambíguo, retenção desde OCR, URLs e READY do pipeline precisam de testes com
os artefatos efetivos. Verdict changes-requested, 020 in-progress/open e 021
blocked são preservados. Fonte/testes/config do gateway têm checksum próprio
na nova evidência; fotografias históricas acima não são renovadas.

## Worker — parcela posterior, 2026-10-04

[Evidência](rendering-worker-2026-10-04.md): código e testes inspecionados
contra a spec. Reserva após revalidação, arquivos fora do TX, commit conjunto,
failure ownership, cancelamento, rollback e confirmação perdida depois de ACK
foram exercitados no PostgreSQL com codec real. OCR/tradução dos testes são
sintéticos; não há alegação de qualidade ou provider real.

TASK-005 técnica entregue. A retenção após OCR e a confirmação perdida baseada
em referências foram corrigidas com regressões. TASK-006 e TASK-017 da 017
continuam abertas para disponibilização/expiração consultável e consolidação
terminal/TTL. TASK-002 exige distribuição por plataforma; TASK-008 exige recursos
e qualidade. A 020 permanece in-progress/open, verdict changes-requested;
021 approved/blocked. Sem implantação ou habilitação de uploads.

Gates deste incremento: suíte leve aprovada; Maven global offline/Docker com
opt-in nativo passou, gateway 689 testes/59 classes, zero falhas/erros/ignorados.
Node 85 pass/um opt-in de fonte não executado, web tsc -b aprovado. pnpm check
integral passou: 116 suítes/859 testes, 30 performance/24 SDD/seis FSD, type-check,
lint, links e formatação. git diff --check sem erros. Rebase mecânico de 62
headers preserva verdicts e conclusões históricas de outras features, sem nova
aprovação delas. Checksum técnico na nova evidência; mobile cobre governança.

## Incremento local de reprodutibilidade — 2026-10-27

Base ARM64 diagnóstica atualizada em duas bibliotecas de OS e pacote nativo
montado duas vezes com o mesmo hash; extração, verificação OCI e reconstrução
do codec foram conferidas. A imagem local resultante passou nos dois testes de
entrega privada/ACK e falha controlada de memória com recuperação. Node: 151
passaram e um opt-in foi ignorado. Detalhes, hashes e limites estão no
[registro técnico](../../../../../../api/apps/translation-gateway/docs/worker-reproducibility-2026-10-26.md).
O JRE continua sem aprovação de segurança, o daemon não estava vazio e a URL
assinada já emitida permanece válida na janela antes do cleanup. TASK-002,
TASK-006, TASK-007 e TASK-008 seguem abertas; 020 permanece in-progress.

Gates desta rodada: `pnpm check` mobile passou (121 suítes, 953 testes), web
`tsc -b` passou e `lint:fsd` passou com polling após `EMFILE` no watcher nativo.
O teste de estilo Prettier aplicado adicionalmente aos seis scripts Node do
incremento apontou divergências; ele não integra o gate do gateway. Os arquivos
fixados no pacote não foram reformatados após a prova de hash.

## Pins dos pacotes da base — 2026-10-27

A receita da base diagnóstica passou a exigir os SHA-256 fixos dos dois debs
antes da instalação, além dos metadados apt autenticados. A regressão cobre os
dois pacotes; 152 testes Node passaram e um opt-in foi ignorado. O pacote
portátil foi remontado duas vezes e seu verificador extraído foi exercitado.
Hashes e limites estão no [registro técnico](../../../../../../api/apps/translation-gateway/docs/worker-reproducibility-2026-10-26.md).
A base existente e o JRE não mudaram; as quatro tasks abertas permanecem.

## Auditoria de fontes e codec — 2026-10-27

Com Maven offline, `BundledRenderingFontsTest`, `PageRasterPainterTest`,
`NativeCodecDistributionTest`, `NativeCodecElfTest` e `NativeCodecPlatformTest`
executaram 64 casos, sem falhas ou skips. Fontes e pintura incluem as fixtures
já existentes dos sete destinos; os testes de distribuição usam fixtures e
verificam a recusa de metadados e arquivos inválidos. Isso não é revisão
linguística, aceite de segurança do JRE nem distribuição operacional do codec.
Os XMLs desta execução estão em `.local/worker-isolation/repro-020-2026-10-26/`
`fonts-codec-audit-2026-10-27/`, com hashes, respectivamente:

- fontes: `43189cfd61a17d306e07250c974cf09e73dc10e32d6953a8d3624ed5b08cb132`;
- pintura: `ec91e50559d0920803fe13872db7cb24b7bd1d1678476231c0c5ecca73f24a96`;
- distribuição: `60c317ea8af330fb29490f0896761a759d1d070dd053316d538a57233131ae28`;
- ELF: `f81e0a0dcfa857039fb324613902b1c5badfd6247b453957ac571d39c73fe9ea`;
- plataforma: `5dcad0ac529534875e0095b264f4ad83f2daf306ad5d9a9f8ee442d8e4191e3f`.

TASK-002 segue aberta para distribuição/admissão; TASK-006 para a janela entre
ACK e exclusão e a verificação integral do ciclo de vida; TASK-007 acompanha
TASK-001..006 e não substitui as evidências das tasks abertas; TASK-008 exige
revisão e profiling apropriados. O escopo autorizado não inclui publicação,
qualidade multilíngue ampliada ou ambiente operacional externo.

## ACK após exclusão — 2026-10-28

A decisão do usuário foi aplicada: a intenção é registrada duravelmente antes do
storage, e `202` exige exclusão e confirmação da lease; falha parcial ou lease
concorrente retorna `503` para retry. PostgreSQL local comprovou 503 em falha,
retry idempotente, outro ACK enquanto delete está em curso e storage fora de
transação. A cadeia de retenção/cleanup e os testes focados passaram: 159 casos.
A imagem ARM64 `sha256:1b704bcfd32ba1db395a913c9b0d064958b0de7582de7c3d222685c8ade3fabc`
com JAR `3c7eecb06e6ca2f48c1ec48259efcaff6212bb9aa294e3b096e91d5eced1c366`
produziu READY, dois downloads íntegros, dois ACKs e URLs locais recusadas após
`202`; também passou na falha de memória e recuperação. XML preservado em
`.local/worker-isolation/repro-020-2026-10-26/ack-delete-2026-10-28/worker.xml`,
SHA-256 `590debc9ffb1bf5901ae1c0ee1a06460f09b9eb019480240084b165a3dfa83db`.
Maven global passou nos sete módulos; gateway 1.324 testes, 106 opt-ins
ignorados, zero falhas/erros. Web tipos/FSD e mobile `pnpm check` passaram.

A prova usa storage local. O adapter GCS apaga pelo nome, enquanto o assinador
inclui geração; ausência da geração assinada após delete ainda não está provada
em bucket versionado. TASK-006 permanece aberta até resolver/verificar essa
fronteira. JRE, operação e qualidade também não foram aprovados. O checksum
mobile foi rebaseado mecanicamente após atualização de tasks, sem alterar os
verdicts históricos. [Plano](../../../../../../api/apps/translation-gateway/docs/ack-delete-before-202-2026-10-28.md).

## Gerações GCS — 2026-10-28

O adapter agora lista versões, apaga por geração somente o objeto exato e
confirma por nova listagem; excesso de itens ou erro mantêm retry. O sweep por
prazo inclui versões não atuais. Passaram 68 testes focados de SDK simulado,
assinatura e ACK/PostgreSQL, sem skips. Isso não verifica IAM ou comportamento
do bucket real, e soft delete pode reter conteúdo recuperável. Os limites e as
fontes oficiais constam no [plano](../../../../../../api/apps/translation-gateway/docs/ack-delete-before-202-2026-10-28.md).
A TASK-006 permanece aberta até a auditoria integral do ciclo de vida.

Após a mudança de gerações, Maven global passou nos sete módulos; gateway:
1.326 casos, zero falhas/erros e 106 opt-ins ignorados. A imagem ARM64 local
`sha256:2c515d83ffff52627e2a699965d1502f194b3ef4b5c62331c3123e9a3dbd0610`
continha o JAR `569f649ff2a4dcca9e433eeb5f70f6dafb2b87b0dd39ae4af3e58616b28b0070`.
Ela passou novamente nos dois testes de READY/download/ACK e falha controlada
de memória; XML local `gcs-generation-2026-10-28/worker.xml` SHA-256
`ca5d9aeed1cb9ea575f4bf671a83826c0a6ecf57d65fe327c7ae5bad39a33d53`.
O teste do worker usa storage local, enquanto a semântica por geração foi
exercitada com SDK simulado. O checksum mobile foi rebaseado mecanicamente após
atualizar tasks; nenhum verdict histórico foi promovido.

## JAR offline atualizado — 2026-10-28

O pacote Java foi atualizado após os ajustes de ACK e GCS e recompilou o JAR
atual fora do checkout e do cache Maven. Uma montagem inicial com tempos
normalizados gerou hash diferente e foi recusada; preservá-los reproduziu o
JAR após extração. O lock v2 detecta alteração dos timestamps em segundos e
continua verificando o hash final. Sete testes do verificador passaram. Hashes,
logs e limites estão no [registro técnico](../../../../../../api/apps/translation-gateway/docs/worker-reproducibility-2026-10-26.md).
As quatro tasks abertas permanecem; a prova não aprova operação ou qualidade.

## Paginação da exclusão — 2026-10-28

Duas regressões com SDK simulado verificaram listagem interrompida antes do
primeiro delete e falha da listagem de confirmação após delete: ambas propagam
erro temporário sanitizado, sem confirmar cleanup. Junto das regressões de ACK
e ciclo de vida em PostgreSQL, passaram 130 casos sem skips. XML do adapter:
`.local/worker-isolation/repro-020-2026-10-26/gcs-pagination-2026-10-28/storage.xml`,
SHA-256 `b7da2444628066281f22a1d1e34ecf71d589ecf2e4ef1ffa7e27298ef1d8ee90`.
Não houve chamada GCS real, mudança de runtime ou aprovação operacional.

## ACK HTTP com adapter GCS simulado — 2026-10-28

Uma regressão local combinou HTTP autenticado, PostgreSQL e o adapter GCS com
SDK simulado. A consulta READY emitiu URLs sintéticas para geração 7; falha no
delete do manifesto retornou 503 e manteve a intenção pendente. Após retry,
ambas as gerações dos objetos conhecidos foram removidas antes dos dois ACKs
202; um objeto vizinho foi preservado e a intenção permaneceu única. O
assinador é simulado e não houve transferência ou bucket GCS real nesta prova.
Passaram 42 testes focados sem skips; XML de retenção:
`.local/worker-isolation/repro-020-2026-10-26/gcs-http-ack-2026-10-28/retention.xml`,
SHA-256 `e28632df19b40b24a1e55df94792bc45d3b515b8b8b0e9faa5de0374cf2edcda`.
A primeira tentativa falhou na configuração do mock e foi corrigida antes da
execução válida. Soft delete e operação real continuam sem aprovação.

## Fotografia dos checksums — 2026-10-28

O checksum do gateway abrange 201 arquivos de `src/main`, `pom.xml` e
`openapi/translation-gateway-v1.yaml`: caminhos relativos ordenados e bytes,
separados por NUL, SHA-256
`fa53e441b4d6a54e5ce7c37c5d61cca12939210c0f1c1d6efe3f7c4a6105ee6c`.
Não inclui testes, scripts, Dockerfiles ou POM pai. O checksum de governança
mobile, calculado por `implementationChecksum`, é
`4b555440881c99816d7cd3810fb4e1298ed7911a85619adf74a8d0f8bf2d92ac`.
A matriz AC-005/006 foi atualizada com as provas atuais e suas limitações; a
021 permanece `implemented`. Essa fotografia não conclui TASK-007 nem aprova os
critérios externos de operação ou qualidade.

## Consolidação da TASK-007 — 2026-10-28

Gates globais, Flyway/PostgreSQL, testes determinísticos, cobertura classificada,
matriz com uma linha por AC e drift foram conferidos para esta fotografia. O
verdict segue `changes-requested`, preservando as pendências de TASK-002/006/008
sem aprovar qualidade por fixture. A TASK-007 está encerrada; futuras alterações
exigem repetir os gates aplicáveis. Após atualizar tasks e evidências, o checksum
mobile de governança passou a
`b315c026c4d89ad14c0a7ce2bc01940ca0365da9f4e93f8eb7660033beabaaac`;
os 65 cabeçalhos foram rebaseados mecanicamente sem promover outros verdicts.

O `pnpm check` final passou após corrigir links relativos: 121 suítes/953
casos, além de SDD, links, tipos, lint, FSD e formatação. Node gateway: 152
passaram e um opt-in foi ignorado; verificador Python: sete passaram. Logs
preservados em `.local/worker-isolation/repro-020-2026-10-26/`
`task007-review-2026-10-28/`. As duas tentativas anteriores do gate mobile
falharam na validação de links e foram corrigidas antes do resultado válido.

## Composição dos pacotes atuais — 2026-10-28

JAR e codec foram reconstruídos na mesma execução a partir dos dois arquivos
portáteis extraídos; o contexto reproduziu o hash daquele usado no worker já
verificado. Sem rede, com checkout e cache Maven bloqueados para o build Java.
O daemon já possuía as imagens; a base e o JRE permanecem diagnósticos e sem
admissão operacional. Hashes e log estão no
[registro técnico](../../../../../../api/apps/translation-gateway/docs/worker-reproducibility-2026-10-26.md).
TASK-002 continua aberta para distribuição/admissão integrais.

## Consolidação da TASK-002 — 2026-10-28

Os critérios da task foram conferidos: fontes e licenças estão no JAR atual com
versões, atribuições e hashes; libwebp/libsharpyuv e licenças compõem pacote
local fixado; fontes e codec inválidos são recusados antes do render; as
fixtures existentes cobrem os sete destinos; decode/encode limitado e o worker
foram exercitados com insumos locais. [Evidência classificada](worker-offline-bundle-2026-10-27.md).
A TASK-002 é encerrada para a preparação e validação local solicitadas.
Referências anteriores que a mantinham aberta para distribuição operacional são
históricas: não se concluiu nem se autorizou implantação. A base diagnóstica e o
JRE não têm aprovação de segurança; AC-002/006 e TASK-006/008 permanecem abertos
nas dimensões indicadas na matriz. A 020 continua `in-progress`, a 021 está
`implemented` e o verdict permanece `changes-requested`. O checksum mobile de
governança após atualizar tasks e evidência é
`98b246aa30550e384eb858730c620b29669c0dea88e0c10fd6b42c3fcfb1d249`;
os 65 cabeçalhos foram rebaseados sem promover outros verdicts.

Após a consolidação da TASK-002, `pnpm check` passou com 121 suítes e 953
casos, incluindo specs, links, tipos, lint, FSD e formatação. Dois testes do
inventário do JAR passaram. O gate Maven global e os gates web da mesma fonte
estão registrados na consolidação da TASK-007; não houve mudança de runtime
nesta auditoria. O log mobile foi preservado em
`.local/worker-isolation/repro-020-2026-10-26/task002-review-2026-10-28/`.

## Profiling Android emulado — 2026-10-28

A pedido de Ruan, foi usado o AVD existente `Medium_Phone_API_37.0`, Android 17
ARM64 com 2 GiB, iniciado em modo `-read-only` e sem salvar snapshot. O APK
debug local SHA-256 `1b1accf5de0aba5106fe92027231d68471fbc1944911072694a41e558e94508e`
carregou o harness e a fixture de aquisição já existentes pelo Metro loopback;
não houve gateway ou provider real. O recibo registrou READY, dois downloads
simulados, SQLite v9 e zero violações de FK. A página tinha 900 × 600 pixels.

Duas capturas pontuais de `dumpsys meminfo` observaram PSS 556.788 e 552.261
KiB; não são pico. Após reset de `gfxinfo` e dois swipes e um toque, o Android
reportou 62 quadros, seis janky (9,68%), percentis 50/90 de 16/30 ms. O sistema
do emulador exibiu ANR de System UI no início; o app ficou visível após esperar.
APK debug, Metro, renderer gráfico por software, uma amostra e fixture pequena
impedem extrapolar para release, aparelho físico ou imagem máxima. O emulador
foi encerrado sem salvar seu estado. Capturas, métricas e recibo sanitizado
estão em `.local/worker-isolation/repro-020-2026-10-26/`
`android-emulator-2026-10-28/`. TASK-008 segue aberta para revisão visual dos
sete destinos e validação restante do ambiente adequado; nenhuma aprovação de
qualidade ou orçamento operacional decorre desta medição.

## Deadline e galeria ARM64 — 2026-10-28

Uma regressão reproduziu leitura do original após o deadline enquanto os
manifestos eram carregados. O worker revalida antes de abrir o original e após
a inspeção, antes da reserva; testes cobrem vencimento nos dois intervalos e
139 testes focados passaram. Um stream já iniciado não é interrompido no instante
do deadline, e a remoção física pontual continua sem garantia operacional.
Detalhes e logs no [plano de retenção](../../../../../../api/apps/translation-gateway/docs/ack-delete-before-202-2026-10-28.md).

A pedido do usuário, as sete fixtures foram regeneradas com a imagem local
histórica já existente; o relatório e seus limites estão em
[galeria visual](../../../../../../api/apps/translation-gateway/docs/rendering-visual-review-2026-10-12.md).
Dez testes passaram, mas a revisão humana permanece pendente; o JAR dessa
imagem é anterior à alteração do deadline. A nova fonte foi reconstruída em
pacote offline separado; hashes no
[registro de reprodutibilidade](../../../../../../api/apps/translation-gateway/docs/worker-reproducibility-2026-10-26.md).
O checksum de 201 arquivos `src/main`, POM e OpenAPI é
`c966d3fe0bc9f322a22a203b8691bb73091b1c05a685fbd294ea503978eafed8`;
não inclui testes, scripts ou POM pai. TASK-006/008 e a feature continuam abertas.

Gates após essa mudança: Maven global offline aprovou os sete módulos; gateway
1.332 testes, zero falhas/erros e 107 opt-ins ignorados. A galeria ARM64 foi
executada separadamente, sem skip. Node: 153 passaram e um opt-in ignorado;
web `tsc -b` e FSD com polling passaram; `pnpm check` mobile passou com 121
suítes/953 testes. Logs em `.local/worker-isolation/repro-020-2026-10-26/`
`retention-deadline-2026-10-28/`. A primeira tentativa da galeria foi recusada
antes da renderização por caminho não canônico; a execução válida usou outro
diretório privado, sem sobrescrever artefatos anteriores.

## Confirmação humana das fixtures — 2026-10-28

Ruan respondeu à pergunta sobre legibilidade, contraste, quebras e marcador de
overflow da galeria ARM64: “Aprovo a aparência das fixtures”. A resposta se
refere às sete páginas sintéticas do relatório SHA-256
`4e69aec0bef5d892c4be93db54a88c4a56aa58533db0295f2b4edd36fa23da00`.
Não é avaliação linguística independente, qualidade em página real ou
aprovação operacional. A imagem da galeria usa JAR histórico; hashes e limites
constam no [registro visual](../../../../../../api/apps/translation-gateway/docs/rendering-visual-review-2026-10-12.md).
TASK-008 continua aberta para as demais verificações exigidas.

## Leitura durante expiração — 2026-10-28

Uma regressão reproduziu nova leitura do original após o prazo. O worker agora
verifica o menor prazo entre a expiração da chave e uma hora antes e depois de
cada bloco; o snapshot parcial é limpo e não há reserva ou renderização. Foram
aprovados 42 testes focados, incluindo uma expiração embutida mais curta. A
evidência e os limites estão no [registro de retenção](../../../../../../api/apps/translation-gateway/docs/ack-delete-before-202-2026-10-28.md).
Uma leitura bloqueada não é interrompida, e exclusão física pontual depende do
storage real; TASK-006 permanece aberta.

Uma regressão posterior demonstrou abertura de storage mesmo com prazo menor
da chave já vencido. A abertura agora é precedida pela conferência desse prazo;
145 testes focados passaram, incluindo PostgreSQL. O XML e os limites constam
no [registro de retenção](../../../../../../api/apps/translation-gateway/docs/ack-delete-before-202-2026-10-28.md).
A prova de imagem descrita abaixo usa o JAR anterior a essa correção pontual.
O pacote Java atualizado foi reconstruído após extração, com os hashes e as
condições no [registro de reprodução](../../../../../../api/apps/translation-gateway/docs/worker-reproducibility-2026-10-26.md).
O Maven global passou nos sete módulos; gateway teve 1.336 testes, zero falhas
ou erros e 108 opt-ins ignorados. O log está em
`.local/worker-isolation/repro-020-2026-10-26/expired-key-2026-10-28/`.

Uma regressão posterior confirmou com um stream bloqueado que o worker aguarda
até ele retornar; quando isso ocorre após o prazo, falha sem claim ou render e
remove o snapshot temporário. Não demonstra interrupção nem exclusão remota
pontual. Os 44 testes focados passaram; evidência no registro de retenção.
Uma segunda regressão cobriu abertura bloqueada: ao retornar após o prazo, o
stream foi fechado e não houve claim, render ou resultado. Os 42 testes da
classe passaram no gate global, sem afirmar interrupção da operação bloqueada.
O Maven global passou nos sete módulos: gateway teve 1.338 testes, zero falhas
ou erros e 108 opt-ins ignorados. Log e XML estão em
`.local/worker-isolation/repro-020-2026-10-26/blocked-read-2026-10-28/`.
Inspeção posterior confirmou que o SDK expõe timeouts gerais, mas o port de
storage atual não recebe deadline nem oferece cancelamento. Os testes de
cleanup e o scheduler existente não demonstram exclusão física pontual; detalhes
estão no registro de retenção. Nenhum runtime ou recurso externo foi alterado.
Em um probe HTTP loopback posterior, uma leitura bloqueada do SDK encerrou com
`ClosedByInterruptException` após interrupção. É uma observação pontual com
timeouts e retries explícitos, não prova de cancelamento de todo I/O ou do GCS
real; os detalhes constam no registro de retenção.

## Worker anterior e falhas locais — 2026-10-28

Com autorização específica, foi construída sem rede uma imagem ARM64 local
`sha256:111f11f1c109df034fb2497b36a5e3fd999fdd2a7ec0eff5fff4d92f5857ed9a`
com JAR `e0b0b7dd1c22e647673435e8a84b5a1e9bea62aa0fda06bbdd92af2103ffcd93`.
Três testes passaram sem skips: página sintética `READY`, downloads íntegros,
dois ACKs e uma intenção com cleanup; falhas de memória da filha e de scratch
produziram `FAILED` sem artefatos, encerraram processos e permitiram página
seguinte `READY`. Picos agregados foram 498.655.232, 1.122.799.616 e 866.680.832
bytes, respectivamente; limite diagnóstico 8 GiB, swap zero e nenhum OOM do
kernel. O XML em `.local/worker-isolation/repro-020-2026-10-26/`
`retention-stream-2026-10-28/image-tests.xml` tem SHA-256
`ce920d6ab88dcadd0e482f23a4bb35e4d3ea0396052514d0fa93a03147b38f09`.

O pacote Java foi reproduzido offline após extração, com checkout e cache
bloqueados; hashes e condições estão no [registro de reprodução](../../../../../../api/apps/translation-gateway/docs/worker-reproducibility-2026-10-26.md).
O Maven global passou nos sete módulos; gateway 1.335 testes, 108 opt-ins
ignorados. Node teve 153 aprovados e um opt-in ignorado; web `tsc -b` e FSD
passaram; mobile `pnpm check` teve 121 suítes e 953 testes aprovados. A primeira
tentativa Maven, dentro do sandbox, falhou por bloqueio de socket e attach do
Mockito; a repetição com acesso local passou. Logs estão na mesma pasta.
Estas provas usam providers sintéticos e limites locais: não aprovam qualidade
em página real, retenção física, nem operação cloud. TASK-006/008 seguem abertas.

## Prova da versão atual — 2026-10-28

A imagem local ARM64 `sha256:629a1280a127223c4cf8f13caf0cddd8380eb44b2bd89425f1801ce87f78df76`
contém o JAR atual `daf71ef92af80cc573aa11a848e14b03adda88535aa1a8c77e4c119bd6eace65`,
reconstruído do archive com rede, checkout e cache Maven bloqueados. Três testes
passaram sem skips: página `READY` com downloads íntegros e dois ACKs para uma
intenção concluída; falhas controladas de memória e scratch sem artefatos e com
página seguinte `READY`. Picos agregados respectivos: 519.921.664, 873.938.944
e 865.923.072 bytes; limite diagnóstico 8 GiB, swap zero e zero OOM do kernel.
O XML está em `.local/worker-isolation/repro-020-2026-10-26/`
`current-worker-2026-10-28/worker.xml`, SHA-256
`a55b7780b8959ea8d63a250db25885d60e865b89d986db428441b2ff0b07a86d`.
Providers e transporte são locais e sintéticos. Não aprova operação cloud,
retenção física ou qualidade real; TASK-006/008 permanecem abertas.

## Sinal de deadline no worker — 2026-10-28/29

O worker sinaliza a thread que possui o I/O no menor prazo entre a expiração
da chave e uma hora, incluindo a leitura dos manifestos. O timer é fechado
antes de o worker prosseguir, evitando sinal tardio; se disparou, não há claim
nem render. Testes cobrem interrupção, limpeza de snapshot, operação que ignora
o sinal e persistência de falha por thread interrompida em PostgreSQL local.
O sinal é cooperativo: I/O que o ignore continua bloqueado e mantém a posse até
retornar. A exclusão física pontual e a operação em GCS continuam sem prova.

O JAR `d49b970de2608c815e1df24dde8027bc20e6b0a0af040061eb1b8dc0d8e36bb2`
foi reconstruído a partir do archive isolado. A imagem local
`sha256:5ff6afd5fec0a66f2eb1dc8c6763cb263ddea1586997a0874a61fd38a4234d8e`
passou nos três testes de entrega privada/ACK, falha de memória e falha de
scratch. A entrega chegou a `READY`, com dois downloads e ACKs repetidos;
as falhas produziram `FAILED` sem artefatos e a página seguinte chegou a
`READY`. Picos agregados: 500.973.568, 1.127.137.280 e 980.553.728 bytes;
limite diagnóstico 8 GiB, swap zero e nenhum OOM kernel. O XML local
`read-watchdog-2026-10-28/image-tests.xml` tem SHA-256
`899958512db3969ac16f4be6d2444cc55da67f7810a8392cb3b18c0683197b9e`.

O Maven global passou nos sete módulos; gateway 1.344 testes, zero falhas ou
erros e 108 opt-ins ignorados. Node teve 153 aprovados e um opt-in ignorado;
web `tsc -b` e FSD passaram. Hashes do archive e condições de reprodução estão
no [registro técnico](../../../../../../api/apps/translation-gateway/docs/worker-reproducibility-2026-10-26.md).
O `pnpm check` mobile passou com 121 suítes e 953 testes.
As provas são locais com providers sintéticos, não admissão operacional ou
qualidade em página real. TASK-006/008 permanecem abertas.

## Falha de exclusão local — 2026-10-29

A exclusão recusada deixou um snapshot em disco no probe inicial. Os serviços
de inspeção no mesmo carregador de classes compartilham até 64 referências em memória e tentam
novamente antes de admitir outra inspeção; falha pendente é sanitizada. O retry
recusa identidade substituída ou indisponível. Caso a capacidade seja excedida
e a exclusão falhe, a instância continua fechada para inspeções. O worker tenta
os demais arquivos locais mesmo se um falhar. Um teste com commit simulado
preservou os resultados aceitos enquanto reportou erro temporário de cleanup.
Submissão e OCR compartilham o serviço e também são afetados enquanto a limpeza
permanece pendente. Comparação e delete não são atômicos; a lista é volátil e
não comprova recuperação após reinício. Após saturação, a instância permanece
fechada mesmo depois da limpeza manual; é necessário reiniciar o processo.
Um timer virtual único por estado compartilhado também tenta o backlog a cada
30 segundos durante ociosidade; uma fixture com intervalo reduzido confirmou
remoção após a permissão voltar sem nova inspeção. O timer não recupera a
referência não registrada em caso de saturação nem sobrevive ao processo.
Detalhes e regressões red/green estão
no [registro de retenção](../../../../../../api/apps/translation-gateway/docs/ack-delete-before-202-2026-10-28.md).

O JAR `f2338b783950362e0444ea8ccc7ae39f6c3bbbdb8821035093aa9ac4838191c0`
foi reconstruído offline após extração. A imagem local ARM64
`sha256:813bcdba1785f773aefa8ae83c83964bdf475385616cebd0247eb9c6d8d8fc0a`
passou em três testes: `READY`, downloads íntegros e dois ACKs para uma intenção;
falhas de memória e scratch sem artefatos, seguidas de página `READY`. Picos
agregados: 497.807.360, 1.105.580.032 e 915.656.704 bytes, respectivamente;
limite diagnóstico 8 GiB, swap zero e nenhum OOM kernel. O XML local
`local-delete-failure-2026-10-29/image-tests.xml` tem SHA-256
`5eeefb730d91bb25b7ea94ad6063cdbb70c3e49ad5d03cb491d35cdc5845c7c0`.

Maven global passou nos sete módulos; gateway 1.348 testes, zero falhas/erros
e 108 opt-ins ignorados. Node teve 153 aprovados e um opt-in ignorado; web
`tsc -b` e FSD passaram; `pnpm check` mobile teve 121 suítes e 953 testes
aprovados. Providers e transporte são sintéticos. TASK-006/008
permanecem abertas para I/O não cooperativo, retenção física e verificações
externas, sem aprovação de qualidade real ou operação cloud.

Os testes de compartilhamento cobrem serviços criados separadamente e seus
construtores padrão; 225 testes focados passaram. O estado de uma JVM filha é
separado do estado do pai e não há transferência de backlog na saída da filha.
Uma regressão posterior confirmou que, ao terminar a filha com erro, o pai
remove seu diretório privado contendo um snapshot observado e preserva arquivos
externos. A prova não cobre perda simultânea do pai ou filesystem que continue
recusando exclusão; os detalhes estão no registro de retenção.
Um probe Docker separado observou tmpfs vazio após stop/start do mesmo
container local; não executou o worker nem demonstra comportamento cloud.
O Maven global posterior passou nos sete módulos; gateway teve 1.352 testes,
zero falhas ou erros e 108 opt-ins ignorados. O log está em
`.local/worker-isolation/repro-020-2026-10-26/child-orphan-2026-10-29/`.
Uma execução global intermediária falhou na compilação porque a alteração
ainda estava incompleta; sua repetição consolidada é registrada separadamente.
O conjunto posterior, incluindo retry ocioso, passou com 226 testes focados.

## Validação do retry ocioso — 2026-10-29

O JAR `59326c5827c3237b7dcfb3a5c4f811922cafac7bbb63b5da47dd5ffc2a191325`
foi reconstruído após extração com rede, checkout e cache Maven bloqueados. A
imagem ARM64 local `sha256:85995ba5926d6dc118b39584481514bb59b2e0c0bd3a6febaaf54cd278c65760`
passou nos três testes de entrega privada/ACK e falhas de memória e scratch.
A página chegou a `READY`, dois downloads e dois ACKs foram verificados com
uma intenção; as falhas não produziram artefatos e a página seguinte chegou a
`READY`. Picos agregados: 501.592.064, 1.121.267.712 e 904.814.592 bytes;
limite diagnóstico 8 GiB, swap zero e nenhum OOM kernel. O XML local
`local-delete-failure-2026-10-29/idle-image-tests.xml` tem SHA-256
`5cf04b9561c77951d19e2c1328e38d4356a3782a579d55645758e5c010f806bc`.

Maven global passou nos sete módulos; gateway 1.351 testes, zero falhas/erros
e 108 opt-ins ignorados. Node teve 153 aprovados e um opt-in ignorado; web
`tsc -b` e FSD passaram; `pnpm check` mobile teve 121 suítes e 953 testes
aprovados. A prova usa providers sintéticos e não aprova GCS, retenção física,
qualidade real ou operação cloud. TASK-006/008 permanecem abertas.

## Consulta cloud somente de leitura — 2026-10-29

Ruan autorizou inspecionar o bucket e o scheduler existentes. No projeto
histórico `toonlira-rm`, o bucket previsto do gateway não foi encontrado e a
listagem do scheduler retornou `SERVICE_DISABLED`. As políticas de retenção,
permissões e agendamentos reais continuam sem verificação. Nenhuma API foi
habilitada, nenhum objeto acessado e nenhum recurso alterado. O
[registro sanitizado](../../../../../../api/apps/translation-gateway/docs/cloud-readonly-gateway-2026-10-29.md)
detalha o alcance e os limites. TASK-006/008 e a 020 permanecem abertos.

## Validação prioritária GCS/VM — 2026-10-30

A [evidência classificada](cloud-priority-validation-2026-10-30.md)
registra a autorização financeira, o ambiente privado, a correção reproduzida
de seleção do construtor GCS, as execuções e as limitações. Não há nova API,
migration, habilitação pública ou mudança de defaults. O renderer/políticas
e a aprovação visual histórica foram preservados.

Entrega e ACK já passaram com GCS real: consulta autenticada, dois downloads
HTTPS íntegros, assinatura efetivamente alterada rejeitada, duas respostas 202
para uma intenção e ausência das gerações antes da manutenção explícita. As
URLs anteriores foram negadas ainda dentro da validade e o vizinho preservado.
A recuperação alvo do ACK concluiu duas intenções e oito referências em outra
JVM; a última manutenção agregada com fixture canônica terminou com sucesso
e foi confirmada por verificador separado. Falhas anteriores do harness ficam registradas.

A observação usou 3.600 segundos reais: seis gerações presentes dois segundos
antes e no início do delete, zero restantes após a exclusão, confirmada 966 ms
após o deadline. Não comprova exclusão pontual nem scheduler em produção.
O I/O que ignora interrupção continua mantendo a posse até retornar, conforme
a regressão existente. TASK-006/008 e verdict `changes-requested` permanecem
abertos; a 021 segue `implemented`.

## Gates e aceite da rodada — 2026-10-30

Maven global atual passou nos sete módulos: gateway 1.361 testes, zero falhas/
erros e 109 opt-ins ignorados; as provas cloud são separadas desses skips.
Node 153 pass/um skip; web `tsc -b` e FSD com polling exit 0; `pnpm check`
mobile final exit 0, 121 suítes/953 testes, incluindo SDD/links/format/FSD.
`git diff --check` global exit 0. Logs e hashes em
`.local/mob020-validation-20261029/final-gate-receipts.json`.

Checksum SDD corrente `2bb43cddb4b24cc3d22c29f6691c758cb4195da2c1942753128771368c7c136c`. O rebase mecânico de
64 cabeçalhos preservou verdicts e referências de commit históricas; nas
62 alterações de cabeçalho de outras features, recolocar o hash anterior
reproduz exatamente os hashes da fotografia inicial. Auditoria: 133 arquivos
iniciais intactos, nove alterações esperadas, zero alterações inesperadas e
zero remoções. Nenhum teste foi removido, gate enfraquecido ou dependência
reinstalada.

Manutenção agregada, ACK/gerações e recuperação em outra JVM passaram na
última execução com controle canônico. Recursos cloud retirados e ausência
confirmada; IAM do projeto inalterado. Limite superior estimado de compute/
disco/registry US$ 0,46 e projeção conservadora com provisões US$ 2,96,
sem confirmação de fatura.

Verdict da feature permanece `changes-requested`: retenção absoluta/I/O não
cooperativo e limites operacionais da TASK-008 continuam abertos, detalhados
na evidência com estimativa restante. A validação autorizada não promove a
020 a `implemented`; a 021 permanece `implemented`.

## Revisão da continuação — 2026-10-30

As quatro regressões foram observadas antes dos fixes: três streams que
respondem a close, timer ausente durante render, snapshot abandonado admitido
por nova JVM e retorno prematuro durante close concorrente. As correções
mantêm posse até o término real e não mascaram um I/O arbitrário que continue
bloqueado. O diretório privado conserva somente lock sem conteúdo depois do
cleanup; legado/symlink/entrada inesperada/lock ocupado/exclusão recusada fecham
a admissão. Não houve migration, mudança de contrato HTTP, raster, qualidade,
fontes, defaults ou runtime mobile. O índice de evidências foi atualizado.

Verificação do pacote definitivo 7f86d559…: três cenários Linux com renderer e
PostgreSQL reais passaram; entrega/ACK e duas falhas controladas recuperaram a
página seguinte. A rodada privada x86 com GCS real passou em entrega normal,
ACK recusado e recuperação da fila por outra JVM. Todas as gerações autorizadas
foram verificadas ausentes depois do ACK 202, URLs anteriores negadas e controle
vizinho preservado. O verificador separado encontrou duas intenções concluídas,
zero pendentes e oito referências ausentes. Todas as fases terminaram PASS.

O perfil Android agora inclui máximo aceito de 40 MP, aquisição nova/SQLite/FKs,
imagem exibida, 45 amostras e VmHWM do mesmo PID desde o arranque; PSS amostrado
não foi tratado como pico. O APK/harness debug/AVD e fixture compressível limitam
a extrapolação. Não houve alteração na 021 para conseguir o resultado.

Findings correntes:

- **P1 / TASK-006:** requisito de remoção absoluta continua aberto. O timer de
  fechamento não prova fim de I/O que ignore cancelamento; storage/filesystem
  que recusa delete conserva dados. O sweep inicia no deadline ou depois e a
  prova GCS de uma hora confirmou ausência 966 ms depois. Lifecycle assíncrono
  e URL expirada não corrigem esse resultado. Não há tolerância aprovada.
- **P1 / TASK-008:** o pico Android anteriormente ausente foi entregue. Resta a
  admissão operacional: o perfil 8 GiB foi medido em ambientes explícitos e não
  altera/admite o baseline cloud de 1 GiB ou os guards incompatíveis de outro
  serviço. A aprovação visual das sete fixtures continua válida em seu escopo.

Gates do runtime definitivo: Maven global, sete módulos, zero falhas/erros;
gateway 1.374 testes, 109 skips opt-in. Os três opt-ins da imagem foram executados
separadamente com zero skips. Foco 70/70, Node 153 pass/1 skip, web tsc e FSD
exit 0. Gate mobile final registrado após a atualização dos checksums.

Retirada verificada em 2026-10-30T16:39:17.871315Z: zero VMs, discos, imagens,
contas, buckets, redes/subnets e registries da rodada; IAM do projeto inalterado.
Não houve deploy/publicação da feature, chamada paga de OCR/tradução ou troca
de ADC. O custo acumulado conservador é US$ 4,98, incluindo provisões; não é
faturamento confirmado. Verdict permanece `changes-requested`, sem promover
critério pendente ou renovar aprovação de outras features.

## Revisão do aceite de orçamento e fechamento da TASK-008 — 2026-10-30

Ruan admitiu explicitamente o orçamento de 2 CPUs/8 GiB somente no ambiente
Compute privado verificado, com host e2-highmem-2/16 GiB e todos os guards
registrados. A aprovação visual anterior das sete fixtures foi preservada.
A revisão confere os requisitos integrais da TASK-008: revisão visual,
profiling gateway/Android, falhas/recuperação e autorização operacional
condicionada ao ambiente medido. A task foi encerrada, sem alterar a spec ou
os defaults. O finding anterior de admissão do orçamento está resolvido nesse
escopo; não é aprovação automática de outro alvo ou de segurança global.

Gates: Maven global sete módulos verde, gateway 1.374 testes/109 opt-ins
ignorados; 70 focados e três opt-ins de imagem executados sem skip. Node
153 pass/1 skip; web tsc/FSD exit 0. `pnpm check` passou com 121 suítes e 953
casos, incluindo os gates documentais/FSD/tipos/lint/formato. Um link relativo
novo falhou na primeira execução e foi corrigido antes do gate verde.

Estado corrente: **7/8 tasks**, apenas TASK-006 aberta. Verdict
`changes-requested` por AC-005/retenção absoluta e I/O não cooperativo.
021 `implemented`; recursos temporários retirados e IAM preservado.

## Decisão humana de retenção — 2026-10-30

Ruan escolheu **«Manter requisito atual e bloqueio no GCS»** após receber o
[diagnóstico e a proposta exata](../../../../../../api/apps/translation-gateway/docs/retention-deadline-feasibility-2026-10-30.md).
Nenhum requisito ou disclosure foi alterado; a proposta não foi aprovada.
Permanece TASK-006 aberta por retenção absoluta/I/O não cooperativo, com
7/8 tasks, 020 `in-progress/open` e verdict `changes-requested`. TASK-008
encerrada somente no ambiente Compute admitido; 021 `implemented` preservada.
Gates passam e os recursos cloud foram retirados; esses fatos não substituem
a garantia faltante. A conclusão integral da 020 permanece não comprovada.

## Verificações da sessão candidata

Maven global final e 102 testes nas nove classes focadas passaram; quatro opt-ins
Linux executaram (entrega/máximas da sessão e memória/disco do caminho anterior).
Os resultados e limites estão na [evidência corrente](storage-process-session-2026-10-30.md).
TASK-006 e TASK-008 permanecem abertas, sem aprovação da nova admissão operacional.
Este fechamento de implementação é um handoff ao Reviewer, não verdict de aceite.
