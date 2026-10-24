# Tasks — MOB-FEAT-020

- Spec: [spec.md](spec.md)
- Status no planejamento: `approved`
- Gate: `open` em 2026-10-03, após execução/auditoria da 019.
- Dependência executada: `MOB-FEAT-019`, em `verification-pending`, com qualidade,
  provider real e operação pendentes; a 018 também permanece em verificação.
- Método: `sdd-task-planner`, sob os guardrails atuais que aceitam dependências
  em verificação. O trecho antigo da skill não restringe o contrato corrente.
- Autorização: Ruan pediu execução incremental autônoma, com qualidade, até a
  renderização. Não há autorização derivada para chamadas pagas, deploy ou uploads.

O planejamento inicial é preservado; execução iniciada em 2026-10-03. Estado
corrente de 2026-10-07: worker local opt-in integra rendering e produz arquivos
reais nos testes, com OCR/tradução sintéticos. Expiração consultável de READY e
fila durável por TTL e entrega privada nas consultas estão codificadas. Retenção
integral/distribuição/profiling e
verificação integral permanecem abertos; a 021 permanece bloqueada.

## Rastreabilidade

Parcela de 2026-10-12: [cleanup por referência e galeria](evidence/rendering-consolidation-2026-10-12.md)
separam fonte/JAR atuais, correção de ACK/ciclo de vida, gates atuais e revisão
sintética histórica dos sete destinos. Três regressões red, foco PostgreSQL
106 aprovado e pacote/imagens reconstruídos; matriz nativa nova de 40 testes/
38 diagnósticos aprovada localmente após XML/IDs conferidos. TASK-002/006/007/008 continuam
abertas; defaults, qualidade, operação e 020/021 conservados.

Parcela posterior de 2026-10-04: cancelamento terminal e dispatch esgotado
tentam cleanup somente após commit, com intenção durável e rollback sem delete.
Regressão ACK corrigida para suspender TX externa durante storage; confirmação
própria sobrevive ao rollback do chamador. Ver
[evidência](evidence/lifecycle-controls-cleanup-2026-10-04.md).
TASK-006 continua aberta para auditoria integral das interleavings e operação;
TASK-002/007/008 permanecem abertas. Não habilita uploads nem desbloqueia a 021.

Incremento posterior: posse da tentativa na outbox, locks job → outbox e limite
de criação de task corrigidos após reprodução de falha atrasada/inversão real.
Conclusão antiga não altera lease nova nem limpa original de job confirmado;
cancelamento vencedor preservado e repetição não reabre intenção. Ver
[evidência](evidence/dispatch-ownership-2026-10-04.md). TASK-006/007 permanecem
abertas para auditoria integral, operação e gates da feature completa.

| Critério | Tasks                        | Evidência planejada                                                                       |
| -------- | ---------------------------- | ----------------------------------------------------------------------------------------- |
| AC-001   | TASK-001/003/005/007/008     | fixtures, diff fora da união dos polígonos, hash do original e cancelamento/rollback      |
| AC-002   | TASK-001/002/004/007/008     | fontes licenciadas/versionadas, sete destinos, glyphs, wrapping, direção e revisão visual |
| AC-003   | TASK-001/004/005/007/008     | região estreita/excesso, fallback completo por ID no manifesto, sem truncamento           |
| AC-004   | TASK-001/003/005/007/008     | zero regiões, equivalência visual ao original e ausência de caixa inventada               |
| AC-005   | TASK-001/002/005/006/007     | WebP final com bytes/hash/MIME/dimensões, URLs privadas, ACK e TTL, confirmação perdida   |
| AC-006   | TASK-002/003/004/005/007/008 | decode/encode limitado, inferência isolada, fault injection de disco/memória e profiling  |

## Decisão corrente de memória — 2026-10-05

Ruan escolheu manter libwebp com orçamento total medido. A revisão humana da
spec permite buffers internos contabilizados e mantém a proibição de cópias
redundantes da aplicação, concorrência antes do decode, lossless/exact e caps.
Ver o [plano anterior à prova](../../../../../api/apps/translation-gateway/docs/rendering-memory-policy.md).
O candidato de 2 GiB é somente experimento local: 1 GiB cloud/defaults/bean
permanecem inalterados. Integração supervisionada, distribuição e medição do
worker completo ainda exigem admissão e provas de falha, não apenas revisão externa.

Parcela posterior de 2026-10-07: [worker Spring Linux](evidence/rendering-worker-linux-2026-10-07.md)
executado com SQL/storage/renderer reais e providers sintéticos. Pequena passou
a 2 GiB; máxima com texto teve OOM. Diagnóstico explícito a 4 GiB concluiu
três jobs máximos sequenciais, reentrega/integridade/limpeza conferidas.
Orçamento candidato não aprovado; 1 GiB cloud intacto. TASK-002/006/007/008
permanecem abertas para contenção, operação, recursos completos e qualidade.

A escolha resolve a decisão arquitetural antes bloqueante; não fecha AC-006,
TASK-002/006/007/008 ou a 020. Históricos abaixo descrevem a redação anterior e
são preservados como fotografias, sem aprovação retroativa. A 021 segue bloqueada.

[Primeira evidência](evidence/rendering-memory-policy-2026-10-05.md): máxima
plana/multicolor passaram no teto local de 2 GiB com pixels exatos; 1 GiB
continua OOM no máximo multicolor. Metadados de saída acrescentados ao probe
após regressão red. Não altera codec/bean de produção ou prova worker completo.

## Checklist

Parcela de [diagnóstico independente](evidence/rendering-native-image-2026-10-10.md):
Java sem dependências adicionais, fora do JAR Spring, lê somente controles
permitidos e gera relatório local exclusivo. Testes sintéticos/CLI e duas provas
Docker sem rede concluídas; limite AS não aplicado pelo diagnóstico permanece
visível. Não testa syscalls nativas, worker completo ou Cloud Run. TASK-002/006/
007/008 e status/gates continuam conservados, performance mobile N/A.

Parcela de [perfil candidato local](evidence/rendering-native-image-2026-10-10.md):
aprovação de 2026-10-10 executada somente em arquivos. Baseline 1 CPU/1 GiB
preservado; candidato 2 CPUs/8 GiB/concorrência 1 com deploy normal bloqueado,
imagem worker opcional por digest e todos os modos desabilitados. Preparação
de configuração entregue, não admissão Cloud Run, orçamento ou publicação.
TASK-002/006/007/008 continuam abertas, 020 in-progress e 021 bloqueada.

Perfil [combinado local](evidence/rendering-native-image-2026-10-10.md): cinco
testes aprovados, oito READY/layout SUCCEEDED com SDKs loopback e ONNX real.
JNI/modelo externos verificados, mesma imagem/JAR, nenhuma configuração operacional
alterada. TASK-002/006/007/008 permanecem abertas para distribuição/admissão,
retenção/operação e qualidade; não promove 020 ou abre 021.

Ampliação da [matriz da imagem](evidence/rendering-native-image-2026-10-10.md):
34 cenários aprovados, mesmos JAR/pacotes/IDs, formatos máximos, dimensões,
sete destinos pintados e recuperação de falhas/cancelamento. Somente testes e
documentação; não é revisão linguística, profiling combinado ou orçamento cloud.
TASK-002/006/007/008 permanecem abertas, assim como 020/021 conservadas.

Parcela de [imagem nativa candidata](evidence/rendering-native-image-2026-10-10.md):
snapshot limitado/pinado, Dockerfile opt-in, preflight Java e imagens locais
com JAR/pacote readonly entregues. Quatro provas reais da imagem passaram:
seis READY com SDKs loopback e dois startups do ENTRYPOINT de produção.
Desvio de helper Alpine no primeiro bind Testcontainers registrado e
preparação implícita removida do harness. Publicação/segurança/orçamento e
matriz ampliada não aprovados; TASK-002/006/007/008, 020/021 conservadas.

Parcela de [integração glibc](evidence/rendering-glibc-integration-2026-10-10.md):
preparação aprovada, alvos/ELF/runtime explícitos, política de arenas fixada
no pai/helper/filha, codec e worker SDK loopback testados localmente.
Harness slim musl alinhado aos guards atuais após reprodução red, sem
alterar caps/qualidade/defaults. Distribuição operacional, orçamento integral
e qualidade continuam abertos; TASK-002/006/007/008 e 020/021 conservadas.

Parcela de [bootstrap ONNX](evidence/layout-runtime-bootstrap-2026-10-09.md):
modelo/SDK conferidos, mas JNI falhou nos dois Linux preparados por libstdc++
ausente. Não houve sessão/inferência ou modelo residente; não é medição de RAM
aprovada. Preparação alternativa de runtime/dependências foi apresentada para
decisão, sem troca silenciosa ou download. TASK-002/007/008 e 020/021 conservadas.

Parcela de [purge por objeto](evidence/cleanup-isolation-2026-10-09.md): oito
regressões red antes do fix. Erro de um objeto não bloqueia outros elegíveis;
rodada parcial/enumeração incompleta continuam falhando de forma sanitizada.
28 casos dos adapters e fluxo integral de 23 aprovados. Sem migration ou
mudança de prazo/qualidade/contrato. TASK-006/002/007/008 e 020/021 conservadas;
gates finais e prova Linux são registrados na review.

Parcela de [resultado com prazo imutável](evidence/result-retention-snapshot-2026-10-09.md):
regressão reproduzida em dois testes antes do fix; V9, admissão/replay, deadline
comum aos uploads, commit/consulta/assinatura e purge codificados. Oito provas
PostgreSQL novas, 23 casos integrais com codec real e seis workers Linux
aprovados, sem provider pago. Não reatribui matrizes antigas ao JAR novo.
TASK-006 continua aberta para retenção integral/operacional e demais fronteiras;
TASK-002/007/008/020/021 conservadas. Gates terminais ficam na review.

Parcela de [auditoria adicional de retenção](evidence/original-retention-audit-2026-10-09.md):
upgrade V7→V8, plano SQL real, SKIP LOCKED, publicação tardia e purge sem SQL
conferidos. Foco 269 aprovado, sem runtime ou migration nova. Diagnóstico
sintético confirmou que a configuração corrente pode ampliar o prazo de um
mesmo READY de 60 para 3600 segundos; fix de retenção imutável de resultado
permanece na TASK-006, não é verificação externa. Tasks/020/021 conservadas.

Parcela de [snapshot de retenção original](evidence/original-retention-snapshot-2026-10-09.md):
prazo publicado agora acompanha a primeira reserva, sem renovação por replay;
guards de claim/commit e purge independente do SQL testados localmente.
V8 aditiva, apenas em PostgreSQL temporário. A lacuna de prazo abreviado
registrada na fotografia anterior foi tratada; validação integral/operacional
e demais pendências permanecem abertas. Nenhuma task/status é encerrada por
essa parcela, e a 021 continua bloqueada. Gates terminais na review.

Parcela de [original da submissão](evidence/submission-original-ownership-2026-10-09.md):
três falhas reproduzidas antes da correção. Reserva ambígua agora resolve posse
sob lock da instalação e snapshot novo, sem repetir reserva/quota/dispatch.
Foco final 69 aprovado, com original lido pelo OCR falso, replay e índice
existente conferidos. Sem migration ou contrato novo. Prazo abreviado do original
publicado nas capabilities continua lacuna funcional; TASK-006/017-TASK-017 e
demais pendências não foram encerradas. Gates finais ficam na review.

Parcela de [commit pendente](evidence/commit-resolution-2026-10-09.md): seis
casos PostgreSQL reproduziram exclusão anterior à resolução do lock, nos três
workers. Correção usa a falha condicional existente antes de reler vínculos e
apagar órfãos. Suíte integral do fluxo local e use cases: 84 testes aprovados,
com seis fronteiras SQL indisponíveis preservando os objetos. Sem migration,
retry de provider, contrato ou intenção nova. Gates/provas Linux registrados
na review; TASK-002/006/007/008 e status/verdict/021 continuam conservados.

Parcela corrente de [headroom JPEG/política 1.1](evidence/rendering-jpeg-headroom-2026-10-08.md):
decode passou e encode falhou por alocação sob AS de 3 GiB. Controles mantiveram
pixels/hash; reduzir heap resolveu ARM64, mas não x86_64 emulado. Política 1.1
versiona método 0 lossless/exact, mantendo fontes/geometria/limites/deadlines;
1.0 conserva método 4. Heap nativo 64..128, default 128, sem coerção. Foco
recompilado concluiu 12 READY JPEG/WebP nos dois alvos, 19 testes/zero failures.
Schema/contratos públicos/manifesto 1.0/defaults disabled/RAM cloud preservados.
Resultados terminais da matriz ampliada e dos gates finais ficam na
[review](review.md), sem transferir green focal ao aceite integral;
TASK-002/006/007/008, verdict/status/021 conservados.

Parcela de [formatos máximos](evidence/rendering-maximum-formats-2026-10-08.md):
JPEG/WebP verdadeiros de 80M pixels preparados em containers isolados, sem
raster no supervisor ou aquisição externa. WebP concluiu seis READY nos dois
alvos; JPEG válido falhou no primeiro job em ambos. Foco de seis testes exit 1,
dois failures, zero errors/skips. Não fechar a cobertura ou trocar a fixture
para passar; causa/correção JPEG são trabalho funcional aberto. Observabilidade
diagnóstica exclusiva dos testes acrescentada depois, com snapshots separados.
Tasks/status/verdict/021, runtime/caps/qualidade e RAM cloud conservados.

Parcela corrente de [scripts/dimensões sintéticos](evidence/rendering-scripts-dimensions-2026-10-08.md):
fixtures UTF-16 dos sete destinos, variantes chinesas distintas e acentos,
duas formas máximas de texto, largura/altura 12.000 e extremos de um pixel.
Primeira rodada concluiu 44 READY em 22 workers dos dois alvos, 30 testes.
Fallback completo não comprova glyphs desenhados: rodada separada recompilou
o source e concluiu 14 READY pintados, sete destinos por alvo, overflow zero
e hashes iguais entre alvos; 22 testes, oito leves reexecutados. Histórico de
source intermediário e source atual separados. Gates gerais em finalização.
Não altera runtime/caps/qualidade/cloud ou fecha tasks; JPEG/WebP máximos,
SDKs/layout, retenção/qualidade/operação continuam pendentes.

Parcela de [timeout/cancelamento admitidos](evidence/rendering-admitted-timing-2026-10-08.md):
regressão de posse da entrada reproduzida antes do fix. Renderer mantém snapshot
comprimido próprio limitado/hash até terminação e cleanup; não duplica raster.
Três ARM64 e um x86_64 emulado por cenário provaram busy/posse no timeout e CANCEL_PENDING durante
RUNNING, descarte sem READY e sucessora READY sem repetir providers. Suspensão
é artificial/test-only, não hang específico do codec. Foco 49 aprovado;
gates conforme resultado terminal na evidência. Orçamento/retenção/qualidade/operação e
TASK-002/006/007/008 continuam abertos; 021 bloqueada.

Parcela de [falta de espaço no worker admitido](evidence/rendering-admitted-disk-fault-2026-10-08.md):
injeção exclusiva dos testes no staging tmpfs limitado, após preparação/admissão
reais. Três ARM64 e um x86_64 emulado observaram espaço zero, FAILED sem
artefatos e recuperação READY na mesma instância, original/reentrega/cleanup
preservados. Gates registrados conforme execução terminal na evidência. Timeout/cancelamento,
orçamento agregado/operação e tasks/verdict/021 permanecem abertos.

Parcela de [falha controlada no worker admitido](evidence/rendering-admitted-memory-fault-2026-10-08.md):
mesma fábrica/preparação/admissão da produção, com launcher/injeção só de testes.
Três ARM64 e uma x86_64 emulada aprovaram FAILED → READY, processos reais
exit 1 → 0, zero OOM de kernel e sem repetir provider. Só campo AS da primeira
filha alterado; input/output/qualidade normais preservados. OOM agregado,
disco/timeout/cancelamento e operação ainda abertos; não fecha AC-006/tasks/021.

Parcela posterior de [preparação no runtime](evidence/rendering-parent-bootstrap-2026-10-08.md):
helper de produção prepara somente o próprio pai no container e o pai relê
cap real antes de rendering. Worker frio com três máximas por alvo passou,
sem montar helper de teste ou alterar qualidade/caps/RAM cloud. Recusa em
1 GiB preservou os limites. Não fecha orçamento/falhas integrais/operação;
TASK-002/006/007/008 e 021 conservadas.

Parcela de [pré-requisito de memória](evidence/rendering-memory-admission-2026-10-07.md):
bean nativo gerenciado recusa ambiente sem orçamento/caps finitos e revalida
antes da filha sob capacidade única. Recusa real em 1 GiB e máximos íntegros
com o runtime novo em dois alvos, no diagnóstico 8 GiB. Não aplica cap no pai,
admite operação, altera RAM cloud ou prova recuperação de kernel OOM. Histórico
e testes de falha preservados; TASK-002/006/007/008 e 021 continuam abertas/bloqueada.

Experimento posterior de [teto virtual do pai](evidence/rendering-parent-address-2026-10-07.md):
helper Java de teste limita somente o próprio worker PID 1 no container, com
confirmação pelo kernel e recusa sanitizada. Máximos chegaram a READY em ambas
arquiteturas, sem nova produção/qualidade/caps/RAM cloud. Virtual não é RAM total,
e limite do pai pode falhar o próprio JVM; não fechar TASK-002/006/007/008.

Parcela x86_64 posterior de 2026-10-07:
[admissão/distribuição e worker local](evidence/rendering-amd64-2026-10-07.md)
codificados/testados com pacote fixado, ELF por alvo, rejeição de mix/runtime
divergente, codec real e decoder independente. Spring/PostgreSQL/storage reais,
providers falsos; pequena e três máximas chegaram a READY sob emulação local
em diagnóstico 4 GiB. Não admite recursos cloud, resolve OOM compartilhado,
aprova qualidade ou encerra TASK-002/006/007/008. Provas ARM64 preservadas.

Parcela corrente: [OOM/recuperação do worker](evidence/rendering-worker-oom-2026-10-07.md).
Três repetições locais observaram pai vivo, job pesado FAILED sem saída e
página seguinte READY no mesmo contexto; counters reais de kernel, limpeza,
hashes e reentrega conferidos. Primeira tentativa sem métricas permanece
inconclusiva, não aprovação. Não corrige runtime, altera orçamento ou fecha
TASK-002/006/007/008; timeout/cancelamento e admissão integral continuam abertos.

Global posterior reprovou a confiabilidade: pai morreu antes de recovery.
Hardening self-only confirmou score real, mas não resolveu em novas repetições.
Não fechar tasks pelo foco anterior; impedir OOM compartilhado ou conter
efetivamente a filha é implementação pendente, não somente benchmark.

Experimento posterior exclusivo do harness: teto AS de 1.536 MiB em container
de 2.048 MiB, três repetições sem kernel OOM, máximo FAILED sem artefatos e
sucessora READY. Não atende o máximo ou muda runtime/JAR/caps/qualidade;
teste real de OOM intacto. Distribuição do alvo Cloud Run x86_64 ainda não
validada pelo pacote ARM64. TASK-002/006/007/008 continuam abertas; não usar
fail-fast como aprovação do orçamento ou correção integral.

Fotografia anterior: [dumpabilidade/harness](evidence/rendering-dumpability-worker-2026-10-05.md).
Guard exige dumpable=0 antes de fontes/mídia, com recusa/crash sintético
conferidos no Linux. Harness Spring/SQL/storage preparado, sem resultado
aprovado: Docker sem resposta e tentativa ainda viva. Não reiniciar cargas
desconhecidas sem autorização. Maven global/recursos completos pendentes;
tasks/status/gates e defaults/RAM cloud mantidos.

Parcela posterior: [limites da filha](evidence/rendering-native-limits-2026-10-05.md)
acrescenta TRN3 e guard self-only antes de fontes/decode ao opt-in
supervised-native. CPU, endereço, arquivo e descritores finitos foram confirmados
no Linux sem privilégios. Máximos passaram no teto experimental de 2 GiB,
mas pico ainda excede 1 GiB; não é orçamento do worker completo ou contenção
atômica da árvore/staging. Defaults/RAM cloud e tasks abertas preservados.

Parcela posterior: [distribuição relocável](evidence/rendering-native-distribution-2026-10-05.md)
fixa package/licenças/metadata ELF e acrescenta opt-in `supervised-native` no
worker, com prova real do bean mínimo/supervisor/filha sem rede. Defaults/RAM
cloud e CLI existentes preservados. Contenção, worker completo e distribuição
operacional continuam pendentes. TASK-002/006/007/008 abertas.

Parcela posterior: [FFM supervisionado](evidence/rendering-supervised-native-2026-10-05.md)
integra codec/raster à filha Boot e ao supervisor como construção explícita,
com PNG/JPEG/WebP, pixels/pintura/hash, lifetime e falhas locais testados.
Medição inclui pai/filha, não worker Spring inteiro. Bean CLI/default/RAM cloud
não mudam; distribuição/contenção/integração operacional/perfil total pendentes.
TASK-002/006/007/008 permanecem abertas.

- [x] TASK-001 — Planejar concretamente e criar contratos/validadores de renderização, metadados e manifesto de fallback, sem alterar OCR `1.0` ou texto/IDs/ordem da tradução; registrar políticas versionadas de fonte mínima e qualidade/tamanho do WebP.

Parcela de [SDKs residentes Linux](evidence/worker-sdk-resources-2026-10-10.md):
seis READY em dois alvos, três testes puros, hashes/reentrega/limite comercial
conferidos. Cgroup diagnóstico 8 GiB inclui servidores locais; picos não admitem
cloud 1 GiB, ONNX, todos os formatos ou OOM agregado. Somente testes/governança;
TASK-002/006/007/008 e status/verdict/021 preservados.

- [ ] TASK-002 — Preparar fontes Noto Sans/Noto Sans CJK empacotadas, com licença/atribuição/versão/hash, e codec WebP; validar disponibilidade, cobertura e decode/encode limitado sem download em task/teste comum.
- [x] TASK-003 — Implementar caixa limpa geométrica determinística: clamp/recorte, cor de entorno, sobreposição estável e escrita somente dentro da união textual, preservando original e caso vazio.
- [x] TASK-004 — Implementar desenho de texto inerte, wrapping/alinhamento/direção/contraste nos sete destinos, redução até mínimo versionado e representação segura de overflow com texto completo no fallback.
- [x] TASK-005 — Integrar ao worker com reserva única, revalidação dos inputs, I/O fora de transação, commit consistente de etapa/job/artefatos e avanço remoto para `READY` somente após resultado válido; cobrir cancelamento, rollback e confirmação perdida.
- [ ] TASK-006 — Expor resultado/metadados por URLs assinadas curtas no contrato existente, integrar todos os objetos ao ACK/cleanup e reter original até render/terminal sem estender o failsafe absoluto de uma hora.
- [ ] TASK-007 — Executar testes determinísticos, cadeia Flyway, gates globais, classificação de evidências, review e auditoria de drift; conservar pendências externas sem aprovar qualidade por fixture.

Parcela de 2026-10-09: [clients oficiais com gRPC local](evidence/worker-sdk-loopback-2026-10-09.md)
atravessam o pipeline Spring/SQL/storage/renderer real. Quatro cenários e suíte
integral de 27 casos aprovados, com reentrega, hashes, vazio e falhas sanitizadas.
Só testes/governança; não é profiling de SDKs residentes ou aprovação operacional.
TASK-007/008 permanecem abertas, assim como orçamento agregado e layout Linux.

- [ ] TASK-008 — Registrar revisão visual dos sete destinos, profiling gateway/Android e falhas de memória/disco no ambiente adequado; exigir autorização separada caso a validação envolva provider, imagem nova ou operação cloud.

## Sequência, áreas e critérios de conclusão

Consolidação corrente de 2026-10-11: [evidência](evidence/runtime-consolidation-2026-10-11.md)
vincula os seis critérios à fonte Java 25/Boot 4 e à matriz das bases atualizadas.
SDKs loopback, ONNX local e retenção/entrega privadas têm implementação/provas
locais; não são genericamente ausentes. Segurança residual, distribuição/
admissão/operação e qualidade continuam abertas. TASK-002/006/007/008 permanecem
desmarcadas; a 021 não recebe gate aberto por essa reconciliação documental.

Parcela técnica de 2026-10-03: tipos imutáveis e porta Java sem implementação,
vínculo mídia/OCR/tradução, limites e falhas sanitizadas, política `clean-box-1.0`
e manifesto final UTF-8 estrito. Encoder limitado em bytes e decoder com
hash/vínculo/texto/geometria/ordem íntegros. Testes sintéticos precederam os
tipos/serviço. Não há fonte, codec, pintura, bean, mudança de schema ou chamada
ao provider. O [plano técnico](../../../../../api/apps/translation-gateway/docs/rendering-contracts.md)
e a [evidência parcial](evidence/rendering-contracts-2026-10-03.md) delimitam a
TASK-001; TASK-002..008 continuam abertas e a feature permanece `in-progress`.

| Task     | Dependências e área provável                                 | Critério de conclusão                                                                                                                                   |
| -------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TASK-001 | 019; domínio/aplicação do gateway e documentação técnica     | plano de incremento e contratos imutáveis testáveis, limites/falhas sanitizados e políticas explícitas; sem inventar requisito de produto               |
| TASK-002 | TASK-001; infrastructure/resources/pom do gateway            | recursos licenciados e fixados, fonte/codec inválidos falham antes de render, fixtures dos sete scripts sem glyph ausente conhecido                     |
| TASK-003 | TASK-001/002; domínio/adapters geométricos do gateway        | recorte correto, ordem estável, original intacto, nenhum pixel externo alterado e página sem regiões equivalente                                        |
| TASK-004 | TASK-001/002/003; renderer CPU do gateway                    | texto permanece dado, layout previsível, contraste e overflow honestos; toda tradução conserva associação no fallback                                   |
| TASK-005 | TASK-001..004; application/ports/persistence do gateway      | reserva/commit/falha/cancelamento testados no PostgreSQL; nenhuma segunda chamada OCR/tradução por reentrega                                            |
| TASK-006 | TASK-005; storage/consulta/ACK/cleanup do gateway            | arquivo e manifesto privados íntegros, URLs curtas sem logs, eliminação de originais/parciais/resultado por ciclo de vida correto                       |
| TASK-007 | incremental sobre TASK-001..006; testes/SDD/documentação     | gates obrigatórios verdes, uma linha por AC, checksums técnico/mobile separados e verdict fiel às verificações executadas                               |
| TASK-008 | renderer executado; protocolo/evidências e ambiente adequado | medição/revisão real com versão/fixture/data, limitações explícitas; pendência não é aprovação nem bloqueio artificial do trabalho técnico independente |

Responsável técnico: executor deste marco. Ruan decide aprovação visual e
autorizações operacionais; competência linguística independente e aparelho
disponível não são presumidos.

Sequência: contratos/políticas → recursos/codec → geometria e composição textual
→ worker/persistência → disponibilização/retenção. Testes precedem cada parcela;
TASK-007 acompanha a execução, TASK-008 permanece aberta sem evidência adequada.

## Persistência e fronteira mobile

Parcela de TASK-002 em 2026-10-03: adapter Java do libwebp 1.6.0 local, com
PAM por linha, WebP lossless/exact, hashes, timeout, concorrência sem fila e
limpeza. Testes nativos explícitos passaram sem instalação/rede/provider;
fontes licenciadas, distribuição por plataforma e profiling permanecem
pendentes. TASK-002 não foi marcada concluída. Ver
[evidência do codec](evidence/rendering-codec-2026-10-03.md).

Antes de alterar entidade, migration, repository ou contrato persistido, aplicar
`database-design` e os guias de modelagem/ORM. Inspecionar V1–V5 e a projeção ACK
atual; escolher schema/metadados de saída no plano concreto, preservando BCNF,
FKs/constraints e atomicidade. Não inventar migration, coluna ou tabela nas tasks.
Imagem, OCR e traduções remotas permanecem no bucket, nunca no PostgreSQL/log.

O SQLite atual já possui resultados/regiões e metadados v9: não recriar estrutura
pela previsão antiga de versão na spec. Qualquer mudança futura exige inspeção
e modelagem próprias. Download, criação do resultado pai, commit/`READY` local,
envio/recovery de ACK e navegação pertencem à 021, que continua bloqueada; a 020
não implementará antecipadamente novo slice, UI ou reader.

## Fontes e composição raster — 2026-10-03

Parcela posterior de TASK-002: fontes oficiais Noto Sans/CJK foram adquiridas
explicitamente e verificadas contra as revisões/blob IDs upstream, com pins
SHA-256, licenças exatas e loader classpath. A task permanece aberta para
distribuição do codec por plataforma. Esta execução local não depende dessa
distribuição de produção, nem a declara entregue.

TASK-003/004 técnicas entregues em adapters locais explícitos: neutralização
por spans, cores anteriores à escrita, desenho inerte nos sete destinos,
caixa interna, wrapping/contraste, redução até mínimo e overflow integral por
ID. Um raster de trabalho e buffers de linha; nenhum arquivo original é aberto
ou sobrescrito pelo compositor. Testes nativos comprovam pixels finais após
WebP, inclusive página vazia. Nenhum layout experimental é consumido.
Ver [evidência de fontes/pintura](evidence/rendering-paint-fonts-2026-10-03.md).

TASK-005/006 continuam abertas: o adapter de arquivos e revalidação/decode
foram entregues na parcela posterior; faltam reserva/commit/READY, retenção do original, URLs e cleanup dos
artefatos finais. TASK-007 acompanha os gates/auditoria; TASK-008 exige revisão
visual e profiling adequados. Fixtures não aprovam qualidade geral.

## Arquivos locais — parcela posterior de TASK-005

Adapter explícito de RenderPort entregue: snapshot limitado/hash/MIME/dimensões,
decode estático JPEG/PNG/WebP em um buffer, composição existente, WebP final e
manifesto íntegro. Não cria bean, migration, chamada paga ou estado READY.
Uma capacidade cobre decode/pintura/encode, sem fila; limpeza é por arquivo
possuído, com original preservado. Os testes nativos fazem o caminho real de
arquivo, incluindo vazio, overflow e diff externo ao polígono.
Ver [evidência de arquivos](evidence/rendering-files-2026-10-03.md).

TASK-005 permanece aberta para integração transacional/worker e confirmação
perdida; TASK-006 para retenção/URLs/ACK. TASK-002 ainda exige distribuição do
codec. Não houve alteração de OCR/TranslationPort, task ou defaults. Revisão
visual, deadline global e profiling em volume permanecem pendentes.

## Persistência — fotografia de 2026-10-03

Parcela transacional posterior de TASK-005/006: V6 aditiva, porta/wrapper/JDBC,
reserva única, commit de imagem/manifesto, cancelamento, falhas e expiração
foram entregues e testados no PostgreSQL 17. ACK inclui os dois artefatos;
cleanup trata RUNNING abandonado. Guards OCR/tradução conservam o rendering
ativo mesmo diante de entregas atrasadas. Ver
[evidência de persistência](evidence/rendering-persistence-2026-10-03.md).

TASK-005/006 continuam abertas: faltam orquestração de arquivos/uploads,
configuração do renderer, confirmação perdida no fluxo completo, retenção do
original e URLs. Não há produtor ativo de READY. TASK-017 da 017 não foi
concluída; a 021 não foi antecipada. A fronteira transacional não aprova imagem
ou manifesta qualidade que não foi observada.

## Worker — parcela de 2026-10-04

Configuração disabled/local exclusiva do worker, sem carregamento de fontes/
native quando disabled. ProcessRenderingTaskUseCase valida originais e
manifestos antes de reservar, processa/upload fora de transação e grava os
dois vínculos com READY. Falhas de storage/commit, cancelamento e confirmação
perdida após ACK foram testados com PostgreSQL e codec real; nenhuma nova
chamada OCR/tradução ocorre por reentrega. OCR conserva o original após sucesso
e usa referências exatas, não estado intermediário, na confirmação perdida.
Falha anterior à reserva OCR não encerra outra entrega RUNNING.

Ver [plano](../../../../../api/apps/translation-gateway/docs/rendering-worker.md)
e [evidência](evidence/rendering-worker-2026-10-04.md). TASK-005 técnica entregue
e conferida na review deste incremento; TASK-006 ainda exige URLs/
expiração consultável e consolidação de retenção/cleanup em todos os caminhos.
TASK-017 da 017 continua aberta para essa verificação integral. TASK-002/007/008
não foram fechadas por fixtures, e nenhum gate da 021 foi aberto.

## Expiração consultável — parcela posterior de TASK-006, 2026-10-04

Consulta owner-scoped por referência/idempotência expira READY no prazo da
conclusão de render; ACK e TTL enfileiram a mesma remoção durável, atomicamente.
Cleanup usa lotes SKIP LOCKED e remove objetos fora de transação. Falhas reais
de delete agora são reportadas pelos adapters, sem conteúdo/causa; não são
confirmadas como limpeza bem-sucedida. Prefixo privado e symlinks preservam
arquivos reutilizáveis. JSON/rotas permanecem iguais, com no-store nas consultas.

Ver [evidência](evidence/result-expiration-2026-10-04.md) e
[plano](../../../../../api/apps/translation-gateway/docs/result-expiration.md).
TASK-006 permanece aberta para URLs/metadados e retenção terminal integral;
TASK-002/007/008 e 017/TASK-017 continuam abertas. Não há aquisição mobile,
assinatura real, credencial ou ativação. A 020 permanece in-progress e a 021
bloqueada. Históricos anteriores são fotografias preservadas.

## Riscos e invariantes atuais

Parcela posterior da TASK-006 em 2026-10-04: porta e adapter privado de assinatura
GET V4 preparados/testados offline, sem chamador HTTP. Default disabled não usa
ADC. Hash/MIME/tamanho/generation e prazo efetivamente assinado são conferidos.
Ver [evidência](evidence/private-download-adapter-2026-10-04.md). Não fecha a
TASK-006: projeção/HTTP/OpenAPI/parser, retenção terminal e operação permanecem
pendentes. Nenhuma migration, configuração IAM ou aquisição mobile antecipada.

- Codec com perdas pode modificar pixels fora dos polígonos mesmo sem pintura:
  a política precisa satisfazer AC-001 no arquivo decodificado, não só no buffer
  antes do encode. Não enfraquecer o diff para obter aprovação.
- Fontes ausentes, variantes chinesas, limites de bytes/pixels e decode/encode
  podem consumir memória nativa; verificar comportamento real, sem declarar
  segurança ou legibilidade apenas por mocks. Não adotar fallback silencioso de fonte.
- OCR conserva original após sucesso. Consolidar ainda terminal/crash e o
  failsafe de uma hora em todos os caminhos, sem fechar gates externos apenas
  pelo happy path do renderer. Esse trabalho também atende TASK-017 da 017.
- Reentrega de OCR/tradução não pode cancelar/encerrar uma etapa `RENDERING`
  possuída por outra execução. Revisar guards/locks de todas as etapas envolvidas.
- Artefatos precisam sobreviver à confirmação perdida de commit e ser removidos
  quando não referenciados. Não apagar um resultado confirmado por observar
  estado posterior nem fazer cleanup abrangente no bucket.
- `READY` remoto não é `READY` local. Não publicar resultado parcial nem
  reutilizar sucesso demonstrativo para liberar o fluxo real.
- Layout/balões/onomatopeias experimentais não controlam os polígonos OCR nem
  ampliam a estratégia de caixa limpa. Sem inpainting, edição ou múltiplas páginas.
- Caso uma decisão técnica necessária contrarie a spec, voltar à revisão/aprovação
  humana. As tasks não flexibilizam requisitos nem autorizações de custo.

## Entrega privada nas consultas — parcela posterior de TASK-006, 2026-10-04

Projeção owner-scoped dos metadados V1–V6, snapshots transacionais curtos e
assinatura fora do TX integrados às duas consultas GET. Resultado READY contém
WebP e manifesto completos com bytes/hash/MIME, dimensões e prazos; nova leitura
de estado/TTL suprime URLs após ACK/expiração. Disabled falha com 503, sem ADC
ou fallback. OpenAPI e parser mobile estritos alinhados, sem aquisição,
persistência de URLs ou READY local. Plano anterior em
[result-query-delivery](../../../../../api/apps/translation-gateway/docs/result-query-delivery.md).

TASK-006 continua aberta para retenção terminal integral; TASK-002/007/008 e
017/TASK-017 não são concluídas por esta parcela. Nenhuma migration, chamada
Google, credencial ou ativação operacional. 020 in-progress, 021 blocked.

## Fila de ciclo de vida — parcela posterior de TASK-006, 2026-10-04

V7 aditiva e fila separada do ACK entregues: sucesso de render enfileira somente
original; falha/cancelamento terminal enfileira todos os objetos conhecidos.
Transições individuais e intenção compartilham transação. Reconciliação limitada
cobre históricos/crash e stale RUNNING, sem segunda chamada de provider.
Claims SKIP LOCKED, leases e confirmação CAS mantêm retry de exclusão fora de
transação; varredura privada de uma hora continua cobrindo órfãos não registrados.
Default/runtime mobile e gates permanecem inalterados.

Ver [plano](../../../../../api/apps/translation-gateway/docs/lifecycle-retention.md)
e [evidência](evidence/lifecycle-retention-2026-10-04.md). TASK-006 e 017/TASK-017
continuam abertas para remoção imediata/falhas integrais dos workers, incluindo
uploads órfãos posteriores ao terminal. TASK-002/007/008 permanecem abertas;
não confundir prova de fila/recuperação com aceite integral. 021 bloqueada.

## Limpeza imediata dos workers — parcela posterior, 2026-10-04

Claim por job na V7 e tentativa ao finalizar OCR/tradução/render entregues;
modo desabilitado não acessa limpeza. Sucesso READY remove somente original;
terminal de falha/cancelamento remove objetos conhecidos. Falha de delete mantém
retry, sem substituir resultado ou enviar ACK. Jobs ativos/concorrentes são
preservados. Upload sem referência após intenção concluída é coberto por
best effort e varredura privada de uma hora, exercitada com falha SQL de outra
fase. Nenhuma V8, alteração HTTP, aquisição mobile ou provider real.

Ver [evidência](evidence/lifecycle-worker-cleanup-2026-10-04.md).
TASK-006/017-TASK-017 mantidas abertas para auditoria integral das transições
fora dos workers e validação operacional, inclusive bootstrap/scheduler/storage
indisponível. Empacotamento/caps/deadline/profiling/qualidade permanecem abertos;
020 in-progress/open e 021 approved/blocked. Fotografias anteriores preservadas.

## Isolamento de JVM — parcela de TASK-002/007/008, 2026-10-04

Fronteira explícita de subprocesso Java preparada: IPC limitado/revalidado,
heap próprio, prazo supervisionado, staging privado, ambiente sem credenciais,
terminação e limpeza por propriedade. Testes com codec real comparam os sete
destinos e páginas vazias com o renderer atual, sem mudar qualidade/manifesto.
Não é bean nem substitui o worker local: faltam admissão Boot/Linux, contenção
atômica dos processos nativos, memória nativa/disco e profiling no limite.
Não declarar deadline integral do chamador ou isolamento kernel por -Xmx.
Ver [evidência](evidence/rendering-isolation-2026-10-04.md).
TASK-002/006/007/008 permanecem abertas; 020 in-progress e 021 blocked.

## Admissão do JAR Boot — parcela posterior, 2026-10-04

Launcher explícito admite somente o JAR Boot compatível, usa PropertiesLauncher
com main filha e configuração interna controlada, sem iniciar Spring ou herdar
loader.properties. Classpath plano preservado; regressão do sufixo Surefire e
Boot malformado reproduzida/corrigida com testes. Prova real do JAR revalida seus
bytes contra classes/recursos atuais e compara pixels/manifestos nos sete destinos
e páginas vazias, com codec local e textos sintéticos.
Ver [evidência](evidence/rendering-archive-2026-10-04.md).

Não integra bean/novo modo ao worker. Distribuição Linux/codec, contenção atômica,
memória nativa/disco, prazo integral, profiling e retenção integral continuam
abertos. TASK-002/006/007/008 preservadas; 020 in-progress e 021 blocked.

## Linux ARM64 local — parcela posterior de TASK-002/007, 2026-10-04

Aquisição da imagem Temurin 23 e libwebp 1.6.0 autorizada explicitamente para
preparação/testes locais. Binários ELF static-pie e imagem fixados; harness
Java exclusivo de testes executa o JAR Boot sem rede/pull/credenciais, com
originais sintéticos read-only e containers próprios removidos ao final.
Sete destinos, PNG/WebP vazios, hashes/fallback e falhas por mídia/codec são
conferidos. Ver [evidência](evidence/rendering-linux-2026-10-04.md).

Não é distribuição nem integração operacional: assinatura/licenças transitivas,
empacotamento, contenção atômica no worker, memória/disco/deadline integral,
profiling/revisão visual/retenção integral seguem abertos. Os limites do container
de teste não aprovam AC-006 em produção. TASK-002/006/007/008 preservadas;
020 in-progress/open e 021 blocked. Não altera banco/runtime/defaults.

## Prazo e posse da chamada — parcela posterior, 2026-10-04

Regressão de launcher bloqueado por mais de dois segundos, apesar de deadline
de 250 ms, foi reproduzida antes do fix. RenderCallSupervisor cobre a chamada
inteira com uma capacidade, thread possuída sem contexto herdado e espera
limitada do chamador. Sinalização de interrupt também ocorre fora dele. Saída
tardia não é entregue; operação, limpeza e sinalização precisam terminar antes
de devolver capacidade. Falha de cleanup mantém capacidade indisponível.

Ver [plano](../../../../../api/apps/translation-gateway/docs/rendering-call-deadline.md)
e [evidência](evidence/rendering-call-deadline-2026-10-04.md). Não modifica
RenderPort, manifesto, banco, estados, defaults ou configuração do worker.
TASK-002/006/007/008 permanecem abertas: contenção kernel, caps nativos/disco,
empacotamento/licenças, integração supervisionada, retenção integral e profiling
ainda não foram admitidos. 020 in-progress/open, 021 blocked. Runtime mobile
inalterado; governança não é evidência de performance Android.

## Gates da feature

Auditoria de locks stale: [evidência](evidence/lifecycle-stale-locks-2026-10-04.md).
Hipótese de lock retido sobre etapa de job skipped não confirmada no PostgreSQL:
NOWAIT passou nas três etapas enquanto cleanup TX permanecia aberta. Estado,
ausência de intenção/storage e recuperação posterior conferidos. Somente teste
e documentação alterados; nenhuma correção SQL presumida. TASK-006/007 e demais
pendências continuam abertas; não aprova operação cloud ou codec/memória.

Parcela Linux de recursos em 2026-10-04:
[plano](../../../../../api/apps/translation-gateway/docs/rendering-linux-resources.md)
e [evidência](evidence/rendering-linux-resources-2026-10-04.md). Cinco casos reais
de sucesso/fault injection, sem rede/mídia real. Máximo uniforme de 80 milhões
de pixels passa com teto experimental de 4 GiB e falha por OOM com o orçamento
atual de 1 GiB. Scratch insuficiente falha sem resultado; próximas execuções
independentes passam. Profiling não é aprovação operacional ou qualidade.

Finding funcional: CLI mantém raster Java, arquivo integral, RGB e importação
nativa simultâneos. Não restringir AC-006 a cópias Java para aprová-lo.
Build oficial local autorizado separadamente, sem C próprio; correção de
cópias/ABI/ownership e distribuição requer próxima parcela. TASK-002/006/007/008
seguem abertas, 020 in-progress/open e 021 blocked. Runtime/defaults preservados.

Preparação oficial concluída posteriormente:
[evidência](evidence/rendering-native-build-2026-10-04.md). Build shared upstream
intacto e smoke de versão Java em container original sem rede passaram; SHA
adulterado rejeitado. Não é redução de cópias, validação de ABI/buffers ou
substituição do codec. Inventory/hashes preservados; toolchain container removido.

Parcela subsequente: [raster nativo](evidence/rendering-native-raster-2026-10-04.md).
Arena confinada/DataBuffer compartilham quatro bytes por pixel sem int[] da
página. Decode JPEG/PNG e pintura dos sete destinos usam o mesmo buffer nos
testes; lifetime/threads e rejeição de ARGB premultiplicado conferidos. Não há
chamador desse seam no worker, encode/decode WebP FFM ou novo bean. CLI/cópias,
orçamento de 1 GiB, ABI/distribuição/contenção e retenção integral continuam
pendentes. TASK-002/006/007/008 permanecem abertas; 020 in-progress/open e 021
blocked. Nenhum código mobile, schema/default ou recurso cloud mudou.

Codec FFM subsequente: [evidência](evidence/rendering-native-codec-2026-10-04.md).
Layouts LP64 conferidos no DWARF upstream, versão/init verificados e encode
empresta o ARGB da Arena sem PAM/Import/Alloc. Decode escreve BGRA externo;
round-trip exact/alpha/RGB invisível, writer limitado, hash e cleanup conferidos
em Linux ARM64 isolado sem rede e por decoder CLI independente. Não há ligação
ao worker, ABI para outra plataforma ou nova medição do pipeline completo.
Memória interna VP8L, orçamento 1 GiB, contenção/distribuição/retenção e qualidade
continuam abertos; tasks/status/gates não mudam por esse teste funcional.

Parcela subsequente: [recursos FFM](evidence/rendering-native-resources-2026-10-04.md).
Decode/compositor/encode/decode no mesmo buffer exercitados em filha Linux
sem rede. Pixel hash completo, CLI independente na pequena pintada, metadata
e manifesto conferidos. Máxima multicolor válida passou no teto experimental
4 GiB e teve OOM com 1 GiB; scratch/memória não corrompem source/página seguinte.
Source VP8L confirma cópia integral de transform, apesar de eliminar PAM/import
no wrapper. TASK-002/006/007/008 continuam abertas: é lacuna funcional de
AC-006, não simples revisão externa. Sem mudança de requisito/runtime/default.

Parcela subsequente: [política do codec](evidence/rendering-native-policy-2026-10-04.md).
Regressão Linux reproduzida antes do fix: dimensões rejeitadas no encode eram
classificadas unavailable. Agora invalid-media, sem causa/arquivo/source alterado;
demais regressões permanecem ativas. Não reduz cópias internas ou memória,
integra ao worker, muda requisito ou aprova alternativa de codec. Pesquisa
primária é informativa; decisão arquitetural ainda aberta. Tasks/status/gates
e snapshots históricos preservados, sem provider/cloud/runtime mobile.

Testes Java de domínio/aplicação/adapters/HTTP e PostgreSQL 17 com Docker; Node
quando tooling for alterado; suíte leve e completa do gateway; Maven global
offline; type-check web; `pnpm check` mobile integral; SDD, links, formatação
direcionada e `git diff --check`. Não reinstalar dependências ou alterar gates
para aprovar. Fixtures sintéticas não provam qualidade linguística e testes
comuns não inicializam credenciais ou provider pago.

Registrar execução, ambiente e hashes em evidência datada. `implemented` exige
todos os itens concluídos; código executado com verificação externa aberta usa
`verification-pending`, review homônimo e tasks realmente pendentes.
