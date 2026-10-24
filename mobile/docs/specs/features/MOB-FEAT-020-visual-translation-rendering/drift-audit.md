# Drift parcial — MOB-FEAT-020, 2026-10-03

- Implementação auditada: working-tree sha256:0197e775ac2875fd2619dc4a8a1a68162b97aa1591d460593588c2932c2d51b2
- Estado: `in-progress/open`, TASK-001/003/004/005 técnicas entregues; TASK-002/006/007/008 abertas.
- Dependência: 019 `verification-pending/open`; 021 continua bloqueada.
- Escopo: contratos/validadores, serialização, codec, fontes, composição, arquivos, transações e worker local opt-in. Não é auditoria operacional completa.
- Parcela corrente: reconciliação Java 25/Boot 4, matriz das bases Ubuntu atualizadas e entrega/retenção privadas locais; admissão/retenção operacional continuam pendentes.

## Reconciliação corrente — 2026-10-12

[Consolidação atual](evidence/rendering-consolidation-2026-10-12.md): fonte
419/1925cc08…cf82a, JAR 69a9ae7b…d9059 e imagens novas conferidos. Cleanup
de referências do mesmo job corrigido após três regressões red; foco PostgreSQL
106 e Maven global 2.768 aprovados. Matriz do pacote novo: 40 testes/38
diagnósticos aprovados após XML/IDs conferidos. Galeria/replay anteriores
mantêm seus hashes/JAR, sem aprovação retroativa ou linguística.

| Artefato/local                                                   | Drift e tratamento                                                                                          | Classificação                          | Estado                                              |
| ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------- | --------------------------------------------------- |
| CleanupAcknowledgedResultsUseCase/CleanupLifecycleObjectsUseCase | falha de um delete interrompia outras referências; isolamento por objeto corrigido, retry/lease preservados | código divergente corrigido            | três regressões red e foco PostgreSQL aprovado      |
| review/AC-005 e resumos                                          | código atualizado não era coberto pela fotografia antiga; nova fonte/JAR/gates explicitados                 | evidência/resumo obsoleto reconciliado | não transfere matriz antiga ao JAR novo             |
| galeria/XML inicial                                              | XML copiado após outro Maven continha skip; quarentena e replay com XML exclusivo                           | evidência inválida isolada             | histórico preservado, somente replay válido contado |

No incremento: mismatch funcional confirmado e corrigido **1**, evidência
inválida isolada **1**, undocumented novo **0**, runtime mobile descoberto **0**,
gate violado **0**. Não é drift zero/aceite integral: F-020-01..04 continuam
abertos por segurança/distribuição, orçamento/operação e qualidade. Sem alteração
de intenção, schema ou runtime mobile; performance N/A, sem medição Android
presumida. Tasks/verdict/020/021 conservados. Guardrails atuais aceitam
018/019 em verificação; não se alterou validador para promover a 020.

Fechamento desta parcela: `pnpm check` integral aprovado após estabilização,
116 suítes/892 testes, SDD/links 67/1.534/362/246, Prettier dirigido e diff do
escopo aprovados. Checksum mobile corrente
`43d6fae8dc16997f2e4e032e837dbc22be6b590eee424ee41218423ed03ad065`;
62 headers rebaseados sem modificar conclusões históricas; referência histórica
da 028 preservada. Checksum gateway 419/1925cc08…cf82a é independente.

Suíte leve offline aprovada com permissão de loopback: 1.023 testes, zero
falhas/erros, 18 skips opt-in. Execução anterior sob sandbox tem 18 erros de
bind local negado e um subprocesso indisponível; é tentativa inválida de
ambiente, preservada, não um teste ignorado ou source corrigido silenciosamente.
Nenhum comportamento mobile novo, código/spec divergente novo ou gate violado
por esta atualização. O diff global externo permanece pendente; não foi
enfraquecido nem transformado em verde. Verdict/status/tasks permanecem iguais.

Recibo final de 22 artefatos conferidos:
`a2a326330fd01143529d77fee97b96ed00c971c1a6b10ac405f7cf28fdde7b42`.
Source 419, JAR e checksum mobile relidos sem divergência. Aprovação de
qualidade/segurança/operação permanece false; a pendência de diff externo
também permanece explícita. Não há nova conclusão sobre outras features.

Suplemento de [segurança das imagens novas](../../../../../api/apps/translation-gateway/docs/rendering-security-refresh-2026-10-12.md):
scans offline ligados ao config exportado e aos sete hashes de camada, sem
reutilizar o scan do JAR antigo. Em cada alvo: 18 ocorrências OS, 13 MEDIUM/
cinco LOW e zero nas 195 dependências Java identificadas; conjunto coincide
com o anterior. DBs válidos na execução, snapshots readonly, sem alteração dos
originais. Cobertura incompleta JRE/codec e ausência de análise de exploração
continuam explícitas; F-020-01 não aprovado por contagem ou exit 0.

Guard de memória relido: não houve lacuna funcional nova confirmada; ancestrais,
pressão global e serviço alvo continuam fora da garantia. Código divergente
novo **0**, undocumented novo **0**, gate violado **0**, runtime mobile novo
**0** nesta inspeção restrita. Isso não fecha F-020-01..04 nem é drift zero
integral. Próxima fase operacional depende de decisão humana e autorização
antes de recursos/custo/credenciais/envio; não ampliar o loop por suposição.

Fechamento: 116 suítes/892 testes mobile aprovados após o suplemento, checks
SDD/links/FSD/formatação e diff do escopo válidos. Fonte e checksums inalterados.
Recibo sanitizado de 18 artefatos:
`6e7fc65c63b770d949ceb99596f2176103d87c65fa853473892a1ca5ecac9a6b`.
Pendência operacional/qualidade permanece nas três parcelas consecutivas
registradas; não promover o gate ou criar cloud por repetição de checks locais.

## Fotografia da reconciliação — 2026-10-11

[Evidência sanitizada](evidence/runtime-consolidation-2026-10-11.md) e fonte
técnica 400/40c14056…149b6 reconferidas: XML/diagnósticos, resumo Maven e scans
mantêm hashes; IDs locais ARM64/x86_64 e usuário 1000 existem no daemon.
Java 25/Boot 4 substituem a fotografia Java 23 na interpretação corrente, sem
reescrever medições antigas. A matriz atual tem 40 pass/zero fail/error/skip;
SDK/layout locais e entrega/retenção não são genericamente ausentes.

| Artefato/local  | Drift detectado                                                                 | Classificação             | Ação/responsável                                                                                   |
| --------------- | ------------------------------------------------------------------------------- | ------------------------- | -------------------------------------------------------------------------------------------------- |
| review/F-020-01 | candidata corrente descrita pela base Java 23 histórica                         | evidência/resumo obsoleto | Reviewer reconcilia com fontes/artefatos Java 25 e patches locais; segurança permanece aberta      |
| review/AC-006   | SDK/layout aparecem como pendência técnica genérica apesar de prova local atual | evidência/resumo obsoleto | Reviewer distingue prova entregue de orçamento/OOM/operação pendentes, sem promover o experimental |
| README/roadmap  | diagnóstico antigo apresentado sem parcela atual nem limites correspondentes    | evidência/resumo obsoleto | Executor documental acrescenta referência corrente; preserva a fotografia anterior                 |

No escopo: resumos obsoletos tratados **3**, novos mismatches funcionais
confirmados **0**, undocumented novo **0**, arquivos runtime mobile descobertos
**0**, gate violado **0**. Não é drift zero integral: F-020-01..04 continuam
abertos para distribuição/segurança, orçamento/operação e qualidade.

Nenhuma spec, API, task ID/checkbox, source Java/mobile, migration, imagem,
capture ou infraestrutura é alterada por esta auditoria. 020 `in-progress/open`,
verdict `changes-requested`, 021 `approved/blocked` conservados. Guardrails atuais
aceitam 018/019 em verificação como dependências executadas. Performance mobile
N/A por ausência de impacto plausível de runtime; não inferir perfil Android
dos diagnósticos Linux ou Node/Jest. A skill não autoriza otimização adicional.

Gates anteriores da mesma fonte e os hashes técnicos permanecem datados no
registro próprio. Check mobile integral reexecutado: exit 0, 116 suítes/892 testes,
warnings `act(...)` preservados; SDD/links 67/1.533/362 behavior/245 evidence.
Formatação direcionada/diff mobile aprovados. Rebase dos headers correntes não
renova conclusões/datas de outras features; o header dentro da seção histórica
da 028 foi preservado. Nenhum validador ou gate foi enfraquecido; a divergência
intermediária de checksum foi resolvida após a estabilização documental.

Check final integral após estabilização: exit 0, 116/892; checksum mobile
`e5f84e3e646ab95f4bd9e3ecf32051625243272726e7b6e10a63046bf0f6b56c`.
62 headers correntes, sem rebase do trecho histórico da 028. Fonte Java e
relatórios privados reconferidos intactos, type-check web exit 0 e seis linhas
únicas de AC nas tasks/review. Diff global externo ainda vermelho, preservado.

## Auditoria corrente de conclusão — 2026-10-10 UTC

Parcela de [diagnóstico independente](evidence/rendering-native-image-2026-10-10.md):
ferramenta Java de suporte, fora do runtime, testes/relatórios próprios sem rede,
ADC ou bibliotecas extras. Null na soma corrigido após red; UNKNOWN distinto de
FAIL e aprovação false. ARM64 16/2, x86_64 emulado 17/1 PASS/FAIL, sem UNKNOWN;
falhas AS/ABI esperadas, não regressão de bootstrap do worker. Fonte 390/a820f8de…abdc
e JAR 40f03530…fb906 intacto. F-020-02 continua aberta: configuração candidata
e valores/syscalls do Cloud Run ainda não validados, sem redução dos guards.
Undocumented novo 0, runtime mobile novo 0, gate violado 0 no escopo, não drift
zero integral. Reviewer/Drift Auditor preservam tasks/verdict/020/021;
performance mobile N/A. Node 105 pass/um skip e web type-check exit 0.

Gates do diagnóstico: global Maven offline/Docker exit 0, XMLs novos desde
2026-10-10T16:14:21.270Z, 2.723 testes/842 classes, gateway 1.252/126,
zero failures/errors, 103 skips. Probe/fixtures compilados por Node/javac,
separadamente do reactor; Node completo aprovado. `pnpm check` integral
exit 0, 116 suítes/892 testes. Falta de exclusão Git da pasta local foi
corrigida após regressão red, sem conteúdo privado versionado. SDD/links/
formatação dirigida/diff rechecados após registros finais; headers rebaseados
sem renovar conclusões históricas ou admitir Cloud Run.

Parcela de [perfil candidato local](evidence/rendering-native-image-2026-10-10.md):
2 CPUs/8 GiB/concorrência 1 preparados somente em arquivos, baseline 1 CPU/1 GiB
preservado. Deploy normal do candidato bloqueado por lifecycle preconditions;
configuração não prova IAM, Cloud Run, OOM ou custo. F-020-02 atualizada, sem
reduzir guards nem admitir operação. Cinco testes estruturais HCL red→green,
fmt/validate locais aprovados, sem plan/apply, aquisição ou credenciais.
Fonte 387/04f3c1f9…6c24, JAR 40f03530…fb906 intacto. Maven offline/Docker
2.723 testes/842 classes, gateway 1.252/126, zero failures/errors, 103 skips;
XMLs novos desde 2026-10-10T15:42:20.612Z. Web aprovado. Undocumented novo 0,
runtime mobile novo 0, gate violado 0 neste escopo, não drift zero integral.
Reviewer/Drift Auditor preservam tasks/verdict/020/021; performance mobile N/A.

Fechamento do perfil local: suíte leve exit 0; Node 104 pass/um skip, zero
failures. `pnpm check` integral exit 0, 116 suítes/892 testes, com warnings act/
SQLite sem falha. SDD/links/formatação dirigida/diff aprovados. Checksum SDD
`d1560f9308220c45ee08287aa8dba5abd4bf26d3b72f22cecf56d4102fccb810`,
63 headers rebaseados sem renovar conclusões históricas; fonte/JAR íntegros.
Nenhuma reinstalação, chamada real, alteração cloud ou promoção operacional.

Perfil [combinado local](evidence/rendering-native-image-2026-10-10.md): dois
workers/oito READY/layout SUCCEEDED, clients oficiais loopback, ONNX/renderer
reais e mesmas imagens/JAR. Hashes visuais máximos preservados; JNI/modelo
readonly externos à imagem, não pacote operacional entregue. F-020-03 atualizado.
Fonte 385/106ea74c…1efb6; JAR 40f03530…fb906. Cleanup da pasta própria readonly
tratado, undocumented novo 0, runtime mobile novo 0, gate violado 0. Não é drift
zero integral: orçamento, distribuição/segurança, qualidade e operação abertos.
Reviewer/Drift Auditor preservam tasks/verdict/020/021; performance mobile N/A.

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

Ampliação da [matriz da imagem](evidence/rendering-native-image-2026-10-10.md):
34 provas aprovadas, 50 READY e falhas/cancelamentos esperados, mesmos JAR/IDs.
Formatos, dimensões, sete destinos pintados e recovery foram reconferidos no
artefato. A ausência de tipos no classpath refletido era mismatch do harness,
corrigido e reexecutado; não era falha de produção nem OOM. No escopo: mismatch
do harness tratado, undocumented novo 0, runtime mobile novo 0, gate violado 0.
Fonte 383/3f3152ad…c703a e JAR 40f03530…fb906, sem mudança de intenção/defaults.
Matriz normativa complementar, não todas as combinações, SDKs/layout residentes
ou orçamento cloud aprovado. Findings/verdict/tasks/020/021 continuam conservados;
não declara drift zero integral. Reviewer/Drift Auditor usados; performance mobile N/A.

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

Parcela de [imagem nativa candidata](evidence/rendering-native-image-2026-10-10.md):
empacotamento local entregue com contexto pinado/exclusivo, preflight Java e
artefatos glibc com JAR/libs. Quatro provas passaram, incluindo entrypoint
real privado e seis READY SDK loopback, UID 1000/defaults disabled, sem host
JAR/libs. Fonte 383/8303a7a3…1f7b9, JAR 40f03530…fb906, Dockerfile.native
separado por hash suplementar. Helper Alpine do primeiro bind TC registrado
e preparação implícita removida, sem ocultar rede. No escopo: mismatch de
empacotamento tratado, undocumented novo 0, runtime mobile novo 0, gate violado 0.
F-020-01 agora distingue candidata entregue de admissão operacional pendente;
não declara drift zero integral: base/segurança, publicação, orçamento, matriz
ampliada e verificação externa abertos. Tasks/status/verdict/021 conservados;
review/drift usados sem mudar intenção; performance mobile N/A.

Gates terminais da imagem: global Maven offline/Docker exit 0, XMLs novos
desde 2026-10-10T11:31:09Z: 2.718 testes/841 classes, gateway 1.247/125,
zero failures/errors, 101 skips opt-in. Relatórios preservados antes da suíte
leve, também exit 0. Node 99 pass/um skip; web type-check e check mobile
integral exit 0 (116 suítes/892 testes). SDD/links: 67 artefatos, 1.532 arquivos,
362 behavior/244 evidence; checksum 729ac983…855a6, 63 headers rebaseados sem
renovar conclusões históricas. Fonte/JAR/Dockerfile.native e pins conferidos;
formatação dirigida/diff aprovados, sem reinstall, cloud, deploy ou provider real.

Atualização de [integração glibc](evidence/rendering-glibc-integration-2026-10-10.md):
alvos/ELF/runtime e política de arenas codificados/testados, com musl conservado.
Doze READY em quatro workers SDK loopback, treze provas nativas selecionadas,
zero OOM observado, hashes/estados/reentrega/cleanup conferidos. Picos não admitem
1 GiB cloud, OOM combinado, qualidade ou ONNX residente. Dois testes antigos
do bean foram alinhados aos guards, após red; nenhum limite foi afrouxado.
Fonte 377/03be9e34…1efdf e JAR 4981e13f…62852; fotografias anteriores separadas.
No escopo: mismatch de seleção/preparação tratado, undocumented novo 0,
runtime mobile novo 0, gate violado 0. Não declara drift zero integral:
imagem/orçamento operacional e verificação externa permanecem abertos.
F-020-03 agora distingue bootstrap glibc aprovado localmente de perfil combinado
pendente. Reviewer/Drift Auditor aplicados sem mudar intenção/status/verdict/021;
performance mobile N/A. Registro inicial abaixo é histórico, não estado atual da glibc.

Gates terminais da parcela glibc: global offline/Docker exit 0, 2.714/839
classes e gateway 1.243/123, zero failures/errors, 99 opt-ins não selecionados;
XMLs frescos desde 2026-10-10T10:41:31Z antes da suíte leve (exit 0). Node
94 pass/um skip, web e check mobile completos exit 0 (116/892). SDD/links
aprovados: 67 artefatos/1.531 arquivos/362 behavior/243 evidence; checksum
13c22450…24748, 63 headers rebaseados sem aprovação histórica renovada.
Fonte/JAR/suplementos intactos após as provas; formato dirigido e diff aprovados.

Inspeção direta do Dockerfile, admissão nativa, Terraform, fonte técnica e
evidências confirmou: pacote operacional não integrado à imagem, configuração
cloud 1 GiB não admitida pelo guard atual e layout opcional sem bootstrap válido.
São lacunas de integração/preparação/decisão, não apenas benchmark ausente.
Revisão humana e validação de ambiente permanecem externas. O layout experimental
não foi promovido a critério normativo da 020. Findings F-020-01..04 na review
indicam localização, classificação e próximo trabalho, sem nova intenção.

A expressão histórica “consolidação terminal não implementada” ficou obsoleta
após V8/V9 e purge por objeto. Review distingue isso dos itens efetivamente
abertos; não apaga conclusões/snapshots anteriores nem fecha TASK-006 integral.
No escopo deste ajuste documental: evidência/resumo obsoleto tratado 1,
undocumented runtime novo 0, arquivos runtime descobertos 0, gate violado 0.
Isso não declara mismatch zero da feature: imagem/orçamento operacional ainda
não satisfazem o marco integral. Donos: Executor após decisão do operador;
Reviewer para qualidade/validação e Spec Architect se a solução mudar intenção.

Fonte/JAR atuais conferidos, sem novo build: 373/62ef09e4…5c4e e 954b42c2…91cd.
Dockerfile/POM pai têm hashes suplementares na review; não estão no checksum
técnico histórico. Gates Java/web/Node prévios da mesma fonte não são nova
execução. Check mobile integral exit 0, 116 suítes/892 testes; SDD/links/
formatação dirigida/diff reconferidos. Checksum não muda porque
review/drift são autorreferentes excluídos. Status/tasks/verdict/021 mantidos,
sem nova mídia, ADC/provider, cloud, mobile, requisito ou modelo. Performance mobile N/A.

## Resolução documental de memória — 2026-10-05

Parcela de [SDKs residentes Linux](evidence/worker-sdk-resources-2026-10-10.md):
seis READY em dois workers e três controles puros aprovados; RPCs por worker
3/2 após reentregas, hashes/estados/original/cleanup íntegros, zero OOM observado.
Teto diagnóstico 8 GiB/AS 3 GiB, picos 1.753.382.912/2.086.715.392 bytes.
Source 373/62ef09e4…5c4e, runtime JAR 954b42c2…91cd inalterado; fotografia ARM
anterior à nova classe unitária explicitamente reconstruída/separada.
Red inicial de scaffolding e dependência transitiva de teste tratada no harness,
sem mudança de intenção/produção. No escopo: mismatch runtime novo 0,
undocumented 0, runtime mobile novo 0, gate violado 0. Não declara drift zero
integral: ONNX/Linux, orçamento completo/OOM agregado, qualidade e operação abertos.
Global padrão offline/Docker exit 0: 2.700/836 classes, gateway 1.229/120,
zero failures/errors, 96 opt-ins não selecionados; XMLs frescos desde
2026-10-10T02:45:49Z antes da suíte leve. Web/check mobile exit 0 (116/892),
Node 92 pass/um skip, SDD/links exit 0: 67 artefatos/1.530 arquivos/362 behavior/
242 evidence; checksum 546333ef…cb87. Históricos/verdict/tasks/020/021/cloud/
defaults preservados; performance mobile N/A.

Suíte leve completa exit 0; hashes/checksum/links/formatação dirigida/diff
reconferidos após os registros, sem renovar conclusões históricas.

Parcela de [clients oficiais com gRPC local](evidence/worker-sdk-loopback-2026-10-09.md):
evidência complementar do pipeline existente, não correção de produção. Quatro
cenários e 27 casos selecionados desta classe aprovados: SDKs/loopback, SQL,
renderer, vazio, falha, redelivery, hashes/original/logs conferidos. Source
371/98702c9d…f0c6; JAR 954b42c2…91cd inalterado. Global padrão offline/Docker
exit 0: 2.695/835 classes, gateway 1.224/119, zero failures/errors, 94 opt-ins
não selecionados; XMLs frescos desde 2026-10-09T16:08:57Z antes da suíte leve.
Web/check mobile exit 0 (116/892); SDD/links/formato dirigido/diff aprovados,
67 artefatos/1.529 arquivos/362 behavior/241 evidence; checksum 0f14f16c…6fea.
No escopo destes testes: mismatch novo 0, undocumented 0, runtime mobile novo 0,
gate violado 0. Não declara drift zero da feature: lacuna Linux ONNX registrada,
profiling SDK/layout/orçamento, qualidade e operação continuam abertos.
Tasks/verdict/status/021/cloud/defaults/históricos conservados; performance mobile N/A.

Suíte leve completa exit 0; hashes/checksum/links/formatação dirigida/diff
reconferidos após os registros terminais, sem renovar conclusões históricas.
Tooling Node exit 0: 92 pass/um opt-in não selecionado, sem provider/credencial.

Parcela de [bootstrap ONNX](evidence/layout-runtime-bootstrap-2026-10-09.md):
uma lacuna de preparação de plataforma confirmada nos dois runtimes Linux:
`FAILED/runtime-load/missing-libstdcxx`, sem sessão, inferência ou prova de
memória. GLIBC é pista estática, não solução comprovada. Executor deverá
preparar runtime compatível somente após aprovação específica, depois repetir
bootstrap antes do profiling. Fonte/testes/config 371/d740e0aa…08a37 e JAR
954b42c2…91cd inalterado, sem nova matriz de produção.
No escopo: mismatch de plataforma 1, undocumented 0, runtime mobile novo 0,
gate violado 0. Não declara drift zero da feature ou aprovação de AC-006.
Global padrão offline/Docker exit 0: 2.694/835 classes, gateway 1.223/119,
zero failures/errors e 93 opt-ins não selecionados. XMLs frescos desde
2026-10-09T15:57:06Z antes da suíte leve, também exit 0. Web/check mobile exit 0
(116/892); SDD/links exit 0, 67 artefatos/1.528 arquivos/362 behavior/240 evidence.
Checksum d9d9b86d…d44d, formato dirigido/diff/hashes reconferidos. Histórico,
tasks/verdict/status/021/cloud/defaults conservados; performance mobile N/A.

Parcela de [purge por objeto](evidence/cleanup-isolation-2026-10-09.md): finding
reproduzido em oito casos e corrigido somente nos adapters. Falha individual
não bloqueia elegíveis nem oculta rodada incompleta. 28 casos dos adapters,
23 integrais e dois workers Linux frios aprovados; seis READY/zero OOM.
Source 369/74f73fe4…d311/JAR 954b42c2…91cd separados dos históricos. Node/web/check
mobile completos exit 0 (116/892); SDD/links exit 0 e checksum 78203f9e…167b.
No escopo do finding: mismatch tratado, undocumented 0, runtime mobile novo 0,
gate violado 0. Não aprova retenção/operação/orçamento integrais, não altera
prazos/qualidade/schema e não renova conclusões anteriores. Tasks/verdict/020/021 mantidos.

Global padrão da parcela: exit 0, 2.692 testes/834 classes, gateway 1.221/118,
zero failures/errors e 93 opt-ins não selecionados. XMLs frescos desde
2026-10-09T15:36:47Z preservados antes da suíte leve; não é aceite integral.
Suíte leve completa exit 0; hashes/checksum/links/formato dirigido/diff
reconferidos, sem renovar conclusões históricas.

Parcela de [resultado com prazo imutável](evidence/result-retention-snapshot-2026-10-09.md):
código divergente corrigido após dois testes red; política/deadline de READY
não dependem de posterior aumento de configuração. V9 e oito provas PostgreSQL,
23 casos integrais com codec real e seis workers Linux aprovados. Dez READY,
quatro FAILED esperados, sem provider real ou OOM observado. Fontes 369/b2da9964…30bb,
JAR c3d1bfbc…f2e1; snapshots históricos não reatribuídos.
Global padrão offline/Docker: 2.682/834 classes, gateway 1.211/118, zero failures/
errors e 93 opt-ins não selecionados; XMLs frescos desde 2026-10-09T10:54:31Z.
Web typecheck/Node aprovados. Checksum 80a290f6…09cb, sem renovar conclusões antigas.
No escopo do finding: mismatch de ampliação tratado, undocumented 0, runtime
mobile novo 0, gate violado 0. Não declara drift zero da feature ou aprovação
de retenção/operação/orçamento integrais. Tasks/verdict/status/021 conservados.

Suíte leve e check mobile integral exit 0 (116/892). SDD/links aprovados:
67 artefatos/1.526 arquivos/362 behavior/238 evidence. Checksum/hash/formatação
dirigida/diff reconferidos depois dos registros; nenhuma conclusão histórica renovada.

Auditoria posterior de [retenção](evidence/original-retention-audit-2026-10-09.md):
cinco provas adicionais aprovadas, foco 269 e global padrão 2.653/832 classes,
gateway 1.182/116, zero failures/errors e 93 opt-ins não selecionados. Suíte leve
e web typecheck exit 0; fontes/testes 365/05469d60…8b32, JAR ae90689a…57a7.
Upgrade/plano SQL/purge original deixam de ser provas ausentes, mas há um
mismatch funcional de READY: política corrente ampliou o vencimento do mesmo
snapshot de 60 para 3600 segundos no probe sintético sem provider/rede.
Executor deve modelar e implementar retenção de resultado imutável na TASK-006.
No escopo desta auditoria: mismatch 1, undocumented 0, runtime mobile novo 0,
gate violado 0. Orçamento/operação/qualidade adicionais não estão aprovados.
Checksum 6b519e1e…320f; históricos não renovados. Tasks/status/verdict/021 mantidos.

Parcela de [snapshot de retenção original](evidence/original-retention-snapshot-2026-10-09.md):
código divergente do prazo abreviado corrigido na admissão, guards e purge.
264 testes focais aprovados, com 12 casos PostgreSQL; seis workers Linux novos
com dez READY/quatro FAILED esperados e zero OOM observado. Source 365/61d5ca49…0e52,
JAR ae90689a…57a7, sem reatribuir matrizes históricas. Web/check mobile integral
exit 0 (116/892), SDD/links exit 0 e checksum 8d9acc60…9511. No escopo deste
finding: mismatch do prazo tratado, undocumented 0, runtime mobile novo 0,
gate violado 0. Isso não declara drift zero ou retenção integral aprovada:
upgrade V7/plano de query/fronteiras adicionais de cleanup, orçamento total e
operação permanecem abertos. TASK-002/006/007/008/estado/verdict/021 preservados.
Performance mobile N/A; fotografias anteriores abaixo não foram renovadas.

Global padrão desta parcela: exit 0, 2.648 testes/832 classes, gateway
1.177/116, zero failures/errors e 93 opt-ins não selecionados. XMLs frescos
desde 2026-10-09T10:00:34Z, contados antes da suíte leve; nenhuma transferência
de aprovação à suíte opt-in completa ou renovação de conclusão histórica.
Suíte leve completa exit 0; SDD/links/formatação dirigida/diff e hashes
reconferidos depois da documentação terminal, sem mudança do checksum.

Parcela corrente de [submissão ambígua](evidence/submission-original-ownership-2026-10-09.md):
remoção do original aceito reproduzida (três failures) e corrigida com consulta
de posse exata sob lock/snapshot independente. Foco final 69 aprovado; quotas,
outbox, índice existente, snapshot antigo, replay e consumo OCR falso conferidos.
Source 359/f0e1627e…9c3d/JAR 0280988e…d9cc separados dos históricos. Global padrão
offline/Docker exit 0: 2.610 testes/830 classes, gateway 1.139/114, zero failures/
errors e 93 opt-ins não selecionados; não aprova extended. XMLs frescos desde
2026-10-09T01:27:36Z preservados antes da suíte leve, também exit 0. Check mobile
integral exit 0, 116 suítes/892 testes; SDD/links/formato dirigido/diff reconferidos.
Checksum d170aa0d…9c25, sem renovação de verdicts históricos. No escopo da
correção: mismatch de descarte resolvido, undocumented 0, arquivos runtime mobile
novos 0, gate violado 0. Resta mismatch funcional de retenção abreviada do original,
confirmado por config publicada e regra fixa; orçamento/operação/qualidade também
abertos. 020 in-progress/open, tasks/verdict/021 conservados; performance mobile N/A.

Parcela corrente de [commit pendente](evidence/commit-resolution-2026-10-09.md):
um mecanismo divergente reproduzido nos três workers, seis testes red antes
da correção. Executor alterou somente a ordem de resolução/remoção, sem mudar
intenção: lock de falha condicional → releitura → preservação por chave/hash ou
descarte comprovado. Código e teste atual conferidos depois da mudança.
84 casos locais/zero falhas, incluindo seis interleavings reais e seis fronteiras
SQL indisponíveis. Seis workers Linux com JAR novo passaram: dez READY, quatro
FAILED esperados, sem repetir provider ou OOM observado. Source 358/ecb35f24…f09b
e JAR 32106912…6140 separados dos históricos. Web/check mobile completos exit 0,
116 suítes/892 testes; checksum cf69fa13…97a1. Global padrão offline/Docker
exit 0: 2.599 testes/829 classes, gateway 1.128/113, zero failures/errors,
93 opt-ins não selecionados. XMLs frescos desde 2026-10-09T00:57:32Z preservados
antes da suíte leve, também exit 0. SDD/links/formatação dirigida/diff aprovados,
sem inferir aprovação do extended ou renovar conclusões históricas.
No escopo desse finding: mismatch resolvido, undocumented 0, arquivos runtime
mobile novos 0, gate violado 0. Não aprova retenção integral, orçamento agregado,
pipeline SDK/layout, qualidade ou operação. Tasks/verdict/status/021 conservados;
performance mobile N/A.

Parcela corrente de [JPEG/política 1.1](evidence/rendering-jpeg-headroom-2026-10-08.md):
finding técnico de encode/ALLOCATION corrigido na configuração/política e
revalidado nos dois alvos, não reclassificado em benchmark. Método 0 mantém
lossless/exact, mídia/limites/deadlines/geometria/textos; política 1.1 explícita
e legado 1.0/método 4 preservado. Não há downgrade silencioso, nova migration,
SDK/credencial/provider real ou mudança de RAM cloud. Foco 19/zero falhas,
12 READY máximos, source/JAR separados. Matriz ampliada terminal exit 0:
67 testes/zero failures/errors/skips; 52 workers, 74 READY, 12 FAILED e quatro
CANCELLED esperados. Todos os READY usam 1.1, imagens por cenário iguais entre
alvos, pintura sem overflow separada de fallback. Injeções AS/disco/timing
recuperaram a página seguinte sem repetir providers; zero OOM observado não
aprova recuperação de OOM agregado. Resumo sanitizado local preservado antes
do Maven global; fonte 358/508c647f…b2da/JAR 9498d055…7d24 separados do foco
19/1f22ddad…d100. Node/web/check mobile completos exit 0 (116 suítes/892 testes),
SDD/links aprovados e checksum 81472cd8…fdca. Global padrão offline/Docker
exit 0: 2.592 testes/829 classes, gateway 1.121/113, zero failures/errors e
92 opt-ins não selecionados. XMLs frescos desde 2026-10-09T00:34:03Z capturados
antes da suíte leve, também exit 0; green padrão não aprova extended. Formatação
dirigida/diff e SDD/links/checksum reconferidos após registro terminal; headers
preservam o checksum corrente sem renovar verdicts históricos.
No escopo da correção: mismatch JPEG resolvido, undocumented 0, runtime mobile novo 0,
gate violado 0; aceite integral não comprovado. TASK-002/006/007/008/status/verdict/
021 conservados; performance mobile N/A. Auditoria preserva falhas e hashes
anteriores, sem atribuí-los à política nova.

Gates padrão finais da parcela de formatos, 2026-10-08: global offline/Docker
exit 0, 2.580 testes/828 classes, zero failures/errors, 87 opt-ins não
selecionados (gateway 1.109/112), XMLs frescos desde 18:23:00Z antes da suíte
leve. Não substitui os failures da matriz: primeiro foco seis/dois failures;
diagnóstico ARM64 quatro/um failure, RENDERING FAILED/internal-error.
WebP passou nos dois alvos; JPEG válido ainda é mismatch funcional aberto.
Node/web e `pnpm check` integral exit 0, 116 suítes/892 testes; SDD/links/
formato/FSD/lint incluídos. Rebase mecânico de 63 headers não renova verdicts
históricos. Source/JAR separados de SDD; não aprova extended, causa interna
do JPEG, orçamento/SDK/layout/qualidade/retenção/operação ou AC-006 integral.
Suíte leve completa exit 0; formato dirigido/diff e SDD/links finais reconferidos. Nenhum
runtime mobile, requisito, schema, default ou RAM cloud alterado neste incremento.

Parcela corrente de [formatos máximos](evidence/rendering-maximum-formats-2026-10-08.md):
WebP de 80M pixels concluiu seis READY nos dois alvos; JPEG válido falhou no
primeiro job em ambos. Foco exit 1, seis testes/dois failures. Finding funcional
AC-006 permanece aberto; não reclassificar como benchmark ausente ou assumir
causa a partir do pico/código sanitizado. Observabilidade de estados/erros
test-only foi acrescentada após a primeira rodada, com snapshots separados.
Reprodução ARM64 exit 1: quatro testes/um failure, OCR/TRANSLATING SUCCEEDED,
RENDERING FAILED/internal-error, job FAILED; WebP repetido passou. Não identifica
a causa interna da filha ou transfere a nova observação ao x86_64 anterior.
Neste incremento: mismatch funcional identificado 1 (JPEG máximo), undocumented
0, arquivos runtime mobile novos 0, gate violado 0. Não é zero de aceite integral.
Verdict changes-requested/status/tasks/021/RAM cloud preservados. Nenhuma spec,
runtime, schema, credencial ou qualidade foi alterada; performance mobile N/A.

Gate final scripts/dimensões, 2026-10-08: 30 testes no source intermediário,
depois 22 no source novo, com oito leves reexecutados. 58 READY em 36 workers,
14 pintados/overflow zero e 44 nos limites/dimensões. Source/hashes separados,
sem transferir medição antiga ao source posterior. Global padrão offline/
Docker 2.576 testes/827 classes, zero failures/errors, 85 opt-ins não
selecionados (gateway 1.105/111), não extended integral. Suíte leve/Node/web
e check mobile integral exit 0: 116 suítes/892 testes, SDD/links/formato incluídos.
Rebase mecânico dos headers correntes preserva histórico/verdicts. Source Java
354/c17871c6…59b5/JAR inalterado separados de SDD. Zero novo runtime mobile,
schema/API/cap/qualidade/budget cloud ou gate violado no incremento; requisitos
integrais, JPEG/WebP máximos/SDK/layout, retenção/operação/qualidade ainda abertos.

Parcela corrente: [scripts/dimensões no worker](evidence/rendering-scripts-dimensions-2026-10-08.md).
Cobertura ampliada somente nos testes: códigos exatos, UTF-16, fonte textual
completa nos limites e dimensões extremas. Fallback não foi promovido em
evidência de glyph; teste distinto exige pintura/overflow zero. Primeiro
reactor mede source intermediário: 30 testes/44 READY. Após término/captura,
source novo foi compilado e controles passaram: 22 testes/14 READY pintados,
overflow zero nos sete destinos por alvo e hashes iguais entre plataformas.
Source intermediário/atual separados, sem renovar fotografias históricas.
Sem novo runtime mobile, requisito alterado ou gate violado nesta parcela;
aceitação integral/gates gerais finais ainda não comprovados.

Gate final timing/posse, 2026-10-08: 49 focados + 20 positivos exit 0; global
padrão offline/Docker 2.562 testes/826 classes, zero failures/errors, 79 opt-ins
não selecionados (gateway 1.091/110). XMLs frescos desde 16:20:17Z UTC antes
da suíte leve, também aprovada. Node/web e check mobile integral exit 0,
116 suítes/892 testes, SDD/links/formatação/FSD incluídos. Rebase mecânico
preserva verdicts históricos. Fonte gateway/JAR separados; fix de posse
reproduzido/validado, zero novo runtime mobile ou gate violado na parcela.
Feature/AC-006 integrais não aprovados: orçamento/OOM agregado, extremos/SDK/
layout, retenção, qualidade e operação permanecem findings/pendências.

Parcela corrente: [timeout/cancelamento e posse da entrada](evidence/rendering-admitted-timing-2026-10-08.md).
Finding funcional reproduzido e corrigido, não reclassificado em benchmark:
snapshot da filha deixou de pertencer ao chamador que retorna cedo. Limitado/
hash, sem cópia raster ou mudança de requisito. Provas ARM64/x86_64 emuladas de busy/input
após timeout, CANCEL_PENDING em RUNNING, estados terminais sem artefatos e
sucessora READY com cleanup/provider/original íntegros. Falha de agendamento
artificial não diagnostica fase/hang nativo. Foco 49 aprovado; gates na evidência;
sem gate violado, novo runtime mobile ou alteração de defaults/RAM cloud.
Orçamento/OOM agregado/retenção/qualidade/operação e verdict conservados.

Gate final do incremento scratch, 2026-10-08: 18 focados aprovados; global
padrão offline/Docker 2.555 testes/826 classes, zero failures/errors, 75
opt-ins não selecionados (gateway 1.084/110). Suíte leve/Node/web e check
mobile integral após estabilização exit 0, 116 suítes/892 testes, SDD/links/
formatação incluídos. Rebase mecânico de headers correntes não renova verdicts
históricos. Source/JAR separados, sem mudança de produção. Zero arquivos runtime
mobile novos ou gate violado nesta parcela; limitações normativas integrais
preservadas. Extended completo e AC-006 continuam não aprovados.

Parcela corrente: [scratch esgotado no worker admitido](evidence/rendering-admitted-disk-fault-2026-10-08.md).
Somente testes: escrita limitada/create-only no staging tmpfs; filesystem do
computador recusado antes da criação. Prova ARM64/x86_64 emulada de espaço útil zero e
FAILED → READY com processos, original, providers e cleanup conferidos.
Sem mudança de requisito/runtime/default/RAM cloud ou violação de gate.
Foco 18 aprovado; gates registrados na evidência após término. Não aprova AC-006 integral;
timeout/cancelamento/orçamento/OOM/retenção/qualidade/operação continuam pendentes.

Parcela corrente: [falha controlada com admissão real](evidence/rendering-admitted-memory-fault-2026-10-08.md).
Fábrica compartilhada é o caminho do bean padrão; teste só fornece launcher,
sem bypass de cap/admissão ou propriedade de operação. Integridade do IPC,
processos reais encerrados e duas etapas de job conferidos em quatro execuções
aprovadas, providers falsos. 13 focados green, depois fortalecidos/revalidados;
primeiro erro de comparação por identidade preservado. Não inferir exceção
do codec/kernel OOM do erro sanitizado. Global padrão exit 0, 2.552 testes,
gateway 1.081/110, zero failures/errors e 73 opt-ins não selecionados; XMLs
frescos desde 2026-10-08T09:35:54Z. Source atual 352/JAR separados de SDD;
extended completo e falhas agregadas/disco/timeout/cancelamento/operação ainda
abertos. Zero undocumented/gate violado no incremento, não aceite integral.
Status/tasks/verdict/021 e defaults/RAM cloud conservados; performance mobile N/A.

Gates independentes desta parcela: leve/Node/web e pnpm check integral exit 0
(116 suítes/892 testes), SDD/links/formato/diff revalidados. Node 92 pass/um
opt-in não selecionado; rebase mecânico de 63 headers sem novo verdict histórico.
Não zero de aceite integral: faltam falhas admitidas adicionais e orçamento/OOM.

Parcela corrente: [bootstrap do próprio pai](evidence/rendering-parent-bootstrap-2026-10-08.md)
codificado, não apenas helper de teste. Escopo/limites/confirmação/readback e
reaping/limpeza conferidos; worker frio dos dois alvos, 49 casos focados green
após reparar parser do probe. Primeiro failure de verificação preservado;
zero alteração de asserção/budget/qualidade. Recusas 1 GiB preservam limites
reais do pai; suíte leve completa exit 0. Source/JAR separados da governança.
Global padrão novo exit 0: 2.548 testes/825 classes, gateway 1.077/109,
zero failures/errors, 71 opt-ins não selecionados; XMLs frescos desde
2026-10-08T01:50:48Z. Node 92 pass/um opt-in não selecionado, web/pnpm check
integral exit 0 (116 suítes/892 testes); SDD/links/formato/diff revalidados,
rebase mecânico sem renovar histórico. Gate experimental não aprovado. Cap aplicado
não é garantia de RAM/OOM ou operação. Pendências integrais/status/tasks/021
conservadas; zero undocumented/gate violado neste incremento, não aceite integral.

Correção corrente de bootstrap, 2026-10-08: global anterior exit 1,
2.586 testes/823 classes, gateway 1.115/107, 12 failures/zero errors/skips.
XMLs frescos antes dos novos focos. Recusa de ambiente antigo não prova recovery;
três failures preventivos mostraram regressão ao preparar default nativo
mesmo com port primário fornecido. Red unitário confirmou; seleção corrigida
por default lazy e callback eager antes do refresh concluir. Não transforma
validação de memória em erro tardio após provider. Ver
[evidência](evidence/rendering-memory-admission-2026-10-07.md).

21 puros e cinco Linux posteriores exit 0; preventivos inalterados recuperam
seguinte READY sem kernel OOM e recusas slim ainda bloqueiam default em 1 GiB.
Suíte leve completa exit 0, cache preservado/sem renderer container ativo.
Source/JAR novos separados do SDD; global padrão exit 0, 2.536 testes/823
classes, gateway 1.065/107, zero failures/errors e 69 opt-ins não selecionados.
XMLs frescos desde 2026-10-08T00:27:55Z; extended atual não aprovado. Node 92
pass/um opt-in não selecionado, web/pnpm check integral exit 0 (116 suítes/892
testes); SDD/links/formato/diff revalidados. Rebase mecânico sem renovar histórico.
Bootstrap corrigido não prepara o cap do pai ou fecha orçamento,
fault injection integral, qualidade/operação. Status/tasks/verdict/021 mantidos.

Parcela corrente [pré-requisito de memória](evidence/rendering-memory-admission-2026-10-07.md):
runtime do bean nativo agora exige/revalida orçamento/caps/scratch/escopo.
Recusa real com pacote válido em 1 GiB e máximo positivo no runtime novo, nos
dois alvos locais; zero mudança de qualidade/mídia/contratos/defaults/cloud.
É proteção parcial anterior ao decode, não reserva contra pressão posterior
ou garantia de OOM/recuperação. Cap do pai só preparado no helper de testes;
launcher/operação e AC-006 ainda abertos. 20/22 casos focados green fora das
restrições de processo; primeira falha restrita preservada. Dois negativos
fortalecidos e dois pipelines reais com banco/storage/renderer revalidados,
providers sintéticos. Global novo ainda pendente; não reutilizar verde antigo.
Configurações históricas insuficientes passam a ser recusadas no bootstrap,
sem remover seus testes para verde. Source técnico/JAR novos separados de SDD;
status/tasks/verdict/021 conservados. Performance do aplicativo N/A.

Gates independentes atuais: Node 92 pass/um opt-in não selecionado, web e pnpm
check integral exit 0 (116 suítes/892 testes). SDD/links/formato/diff válidos,
67 normativos/1.514 classificados/362 behavior/226 evidence; 63 headers
rebaseados mecanicamente sem renovar histórico. Global offline/Docker novo
iniciado em 2026-10-07T23:54:18Z terminou reprovado, conforme registro posterior
acima; relatórios frescos contados antes dos focos/leve. Fotografia preservada.

Parcela posterior [AS do pai](evidence/rendering-parent-address-2026-10-07.md):
helper exclusivamente de testes limita o próprio worker no container, com
escopo e readback estritos. Máximos íntegros em dois alvos; não é runtime,
negação real do cap do pai, garantia de orçamento/OOM ou aprovação cloud.
Zero undocumented/gate violado no experimento; finding AC-006 permanece aberto.
Gate global concluído abaixo, sem trocar testes antigos ou inferir resultado do foco.

Global da parcela anterior concluído em 2026-10-07, Maven offline/Docker exit 1:
2.576 testes/821 classes; gateway 1.105/105 classes, três failures, zero errors
ou skips. XMLs frescos desde 2026-10-07T23:11:49Z contados antes do leve.
Três repetições do OOM original reprovaram: exit 137/OOMKilled=true, sem recovery.
Confirma finding funcional AC-006 não resolvido; experimento do pai não muda
runtime. Máximos/novo experimento passaram nos dois alvos sem mudar hashes;
pico x86_64 no experimento global 2.732.404.736 bytes. Não reiniciar para verde.
Node 92 pass/um opt-in não selecionado, web/pnpm check integral exit 0
(116 suítes/892 testes); suíte leve final exit 0. SDD/links/formato/diff
revalidados após o registro final; source técnico 342 arquivos/JAR separados da
governança. Headers rebaseados sem nova validação histórica. Performance do
app N/A; status/tasks/verdict/021 e RAM/defaults cloud conservados. Nenhum
container possuído do renderer ativo após os gates, cache/toolchain preservados.
Warnings existentes mantidos; gates independentes não resolvem o global reprovado.

Parcela x86_64 posterior: [evidência](evidence/rendering-amd64-2026-10-07.md).
Alvos/ELF/runtime compatíveis exigidos antes do load, sem fallback ou mudança
de qualidade/caps/contratos. Codec, guard, bean e worker com banco/storage reais
passaram localmente sob emulação, providers falsos. Não reinterpretar as provas
ARM64 anteriores como AMD64 nem usar o pico emulado como orçamento cloud.
Zero undocumented/gate violado nessa parcela; OOM/AC-006 e operação continuam
findings abertos. Gate global posterior executado, não inferido do foco:
exit 0, 2.569 testes/820 classes, gateway 1.098/104 classes sem falhas/erros/skips.
XMLs frescos desde 2026-10-07T16:13:37Z, anteriores preservados/fora da contagem.
Node 92 pass/um opt-in não selecionado, web e pnpm check integral exit 0
(116 suítes/892 testes); SDD/links/formato/diff válidos. Source técnico/JAR
separados da governança mobile, rebase mecânico de headers sem renovar
conclusões anteriores. Nenhum container renderer ativo após o gate; toolchain
parado, cache/source/package preservados. Suíte leve final exit 0; warnings
existentes preservados. Performance do app N/A.

Parcela corrente: [OOM/recuperação](evidence/rendering-worker-oom-2026-10-07.md).
Flag OOM sozinho não provava pai morto; global instrumentado mostrou exit 137
sem recovery. Preferência self-only/recusa após RED confirmadas, mas novas
repetições continuaram falhando. Zero undocumented/gate violado nesse escopo;
finding funcional AC-006 confirmado, sem aprovação de isolamento/orçamento.
Global anterior reprovado, verde posterior não elimina suas falhas. Source/JAR separados,
hardening parcial e status/tasks/verdict/021 conservados. Sem alteração cloud/mobile.

Parcela posterior `address-bounded` inspecionada: somente harness, teto AS de
1.536 MiB e três repetições sem kernel OOM, máximo FAILED/sucessora READY.
Não atende o máximo nem modifica runtime/política; prova antiga de kernel OOM
preservada. Nenhum requisito reescrito para aceitar falha como processamento.
Distribuição ARM64 versus alvo Cloud Run x86_64 é lacuna operacional explícita,
sem provar compatibilidade por documentação. Finding AC-006 permanece aberto;
gates desta parcela não foram inferidos do foco. Zero undocumented/gate violado
no experimento, não zero de aceite da feature.

Gates posteriores executados: Maven global offline/Docker exit 0, 2.561 testes;
gateway 1.090/101 classes, zero falhas/erros/skips nos XMLs frescos antes do leve.
Kernel OOM/recovery e preventivo passaram três vezes cada nessa rodada, sem
apagar as falhas anteriores ou mudar o runtime. Node/web e pnpm check integral
exit 0 (116 suítes/892 testes); suíte leve do módulo exit 0 e
SDD/links/formato/diff válidos. Source técnico
336 arquivos separado, JAR inalterado, rebase mecânico de headers sem nova
aprovação histórica. Nenhum container renderer ativo depois do global.
Performance do aplicativo N/A: não houve alteração de runtime mobile.

Suíte leve, Node/web e pnpm check integral exit 0 (116 suítes/892 testes);
SDD/links/formato/diff válidos, rebase mecânico sem renovar histórico.
Sem containers renderer ativos ao término. Gates independentes não substituem
o global reprovado nem resolvem o finding funcional de isolamento.

Fotografia anterior: [worker Spring Linux](evidence/rendering-worker-linux-2026-10-07.md).
Fixtures binários e ausência de listener/filtros reais conferidos; Docker
recuperou sem restart. Resultado funcional observado, não só código preparado:
pequena a 2 GiB; máximo com texto OOM a 2 GiB e READY no diagnóstico 4 GiB.
Não admitir 1 GiB cloud, promover feature ou reclassificar memória como simples
benchmark externo. Zero undocumented/gate violado nessa parcela; finding
funcional AC-006 confirmado e aberto. Fotografia técnica separada/históricos
preservados. Gates correntes: global offline/Docker exit 0 (2.548 testes;
gateway 1.077/99 classes, zero falhas/erros/ignorados), worker em diagnóstico
4 GiB, não aprovação do candidato 2 GiB. Suíte leve, Node/web e pnpm check
integral exit 0 (116 suítes/892 testes); SDD/links/formato/diff revalidados.
Headers rebaseados mecanicamente sem renovar conclusões históricas. Nenhum
container renderer ativo ao término. Performance mobile N/A; finding funcional
de recursos permanece aberto, não zero de aceite integral.

Fotografia anterior: [dumpabilidade/harness](evidence/rendering-dumpability-worker-2026-10-05.md)
inspecionada. Guard/releitura/negação/crash conferidos sem sysctl/coletor/C
próprio. Zero mismatch/undocumented/gate violado nessa proteção, não aceite
operacional. Harness completo preparado/compilado, sem resultado; Docker
indisponível/tentativa viva. Maven global pendente, não reutilizar verde
anterior. Status/tasks/verdict e 021 bloqueada preservados; hash Java separado.

Gates históricos da parcela anterior: suíte leve/foco de contratos, Node/web e
pnpm check integral exit 0 (116 suítes/892 testes); SDD/links/formato/diff
aprovados. Rebase mecânico preserva conclusões históricas. Nenhuma promoção
baseada em mock/compilação ou benchmark não executado. Naquela tentativa,
reinício aguardava autorização por afetar cargas que não puderam ser inventariadas;
na execução posterior o engine recuperou sem essa ação.

Gates correntes da parcela de limites: Maven global offline/Docker repetido
exit 0, gateway 1.070 testes/98 classes sem falhas/erros/skips; primeira rodada
com seis timeouts/clock leaps registrada, não apagada nem aprovada. Nenhum prazo
ou validador alterado. Suíte leve, Node, web e pnpm check integral aprovados;
checksum técnico separado e mobile rebaseado mecanicamente. SDD/links/formato/diff
reexecutados, sem renovar verdicts históricos. Não há aprovação operacional
ou mobile nativa; findings remanescentes/status/tasks e 021 bloqueada mantidos.
Coletor de crash externo por pipe não foi admitido por RLIMIT_CORE/flags;
ressalva documentada, sem mudança de sysctl/host. Não alegar proteção não provada.

Parcela corrente: [limites da filha](evidence/rendering-native-limits-2026-10-05.md).
Guard self-only via Java/FFM, TRN3 explícito, reservas controladas e seleção
guardada do bean conferidos; CLI/TRN2 históricos conservados. Zero mismatch,
undocumented ou gate violado nesta parcela. Limites de endereço/CPU/arquivo
não são RAM agregada, quota de staging ou contenção atômica da árvore.
Máximos guardados excedem 1 GiB cloud; perfil Spring/DB/storage/layout e falhas
completas continuam findings funcionais. Não houve redução de qualidade,
mudança de contrato/default/RAM ou aprovação mobile. Status/tasks/021 mantidos.

Parcela posterior: [distribuição relocável](evidence/rendering-native-distribution-2026-10-05.md).
Package readonly externo/pinado, parser ELF limitado e opt-in supervisionado
do worker conferidos com provas Linux de relocation e bean mínimo. Nenhum
download em task/teste, fallback, alteração de defaults/RAM/contrato ou runtime
mobile. Zero mismatch/undocumented/gate violado nesta parcela, não aceite integral.
Contenção, worker completo/recursos totais e operação permanecem findings;
020 in-progress/open, verdict changes-requested, tasks abertas e 021 blocked.

Parcela subsequente: [FFM supervisionado](evidence/rendering-supervised-native-2026-10-05.md)
inspecionado. IPC CLI preservado, FFM explícito/sem fallback, ARGB confinado e
close antes da transferência; prova Boot/Linux e cgroup pai/filha, sem ligação
ao bean. Zero mismatch/undocumented/gate violado na parcela, não aceite integral.
Contenção/distribuição/integração e recursos totais seguem findings funcionais.
Tasks/status/verdict/021 e históricos preservados, sem inferir performance mobile.

Ruan escolheu manter libwebp com orçamento total medido; Spec Architect registrou
a revisão de AC-006 antes da nova prova. A proibição absoluta de buffers internos
foi substituída por contabilidade/limite total, sem autorizar cópias redundantes
da aplicação, perda de pixels ou redução silenciosa dos limites.
Ver o [plano](../../../../../api/apps/translation-gateway/docs/rendering-memory-policy.md).

A decisão antes pendente está resolvida. OOM no teto cloud atual de 1 GiB,
integração supervisionada, distribuição/contenção e perfil completo continuam
findings de implementação, não simples benchmark externo. Os diagnósticos
históricos abaixo mantêm sua redação/data e não são aprovações retroativas.
020 in-progress/open, verdict changes-requested e 021 blocked preservados.

[Prova local](evidence/rendering-memory-policy-2026-10-05.md) inspecionada:
plano/spec antecedem testes, 2 GiB apenas candidato do harness, round-trip exact
e preservação do original. Metadata de saída foi omitida no probe, reproduzida
por red e acrescentada sem alterar produção. Zero undocumented/gate violado
nesse incremento; findings de OOM cloud/integração/contenção/distribuição e
recursos completos permanecem abertos. Sem nova aprovação de performance mobile.

Parcela posterior inspecionada: [assinatura privada](evidence/private-download-adapter-2026-10-04.md).
Contratos/porta/adapter e opt-in disabled/gcs são fundamentados no plano; nenhuma
URL é exposta no HTTP, nenhum parser mobile modificado e nenhuma migration/IAM
aplicada. Zero mismatch/undocumented/gate violado nesse escopo. TASK-006 segue
aberta para integração e retenção. O hash técnico novo é fotografia separada do
checksum de governança; evidências anteriores e 021 bloqueada são preservadas.

Gates locais dessa parcela: Maven global offline/Docker e suíte leve, Node,
type-check web e pnpm check completo aprovados. 48 testes sintéticos novos;
volume global Java não inferido de XMLs sobrescritos pela execução leve.
Rebase mecânico e checks SDD/links/formato/diff não constituem aprovação das
pendências funcionais ou externas. Nenhum gate/validador foi enfraquecido.

## Prazo e posse da chamada — parcela posterior, 2026-10-04

[Plano](../../../../../api/apps/translation-gateway/docs/rendering-call-deadline.md)
e [evidência](evidence/rendering-call-deadline-2026-10-04.md) conferidos contra
supervisor e adapter. O prazo monotônico original cobre a espera completa do
chamador; operação, descarte e sinalização ficam sob posse privada. Uma chamada
recusada não cria fila/thread; saída aceita tem transferência única, saída tardia
é removida pelo proprietário. Cleanup não confirmado mantém capacidade ocupada.
Reprodução de launcher bloqueado precedeu o código. As asserções anteriores de
morte/limpeza foram preservadas como confirmação eventual, não como morte
instantânea garantida no instante em que timeout retorna.

Zero mismatch/undocumented/gate violado no escopo inspecionado. Não altera
contratos, schema, configuração de produção ou runtime mobile. Não admite
contenção atômica, memória nativa/disco, distribuição/licenças, integração do
bean ou profiling. 020 in-progress/open, tasks e verdict parcial conservados;
021 blocked, snapshots históricos preservados. Governança mobile não é
aprovação de performance nativa.

Gates correntes: foco 19 casos, Maven global offline/Docker/native/Boot/Linux
exit 0 (gateway 960 testes/79 classes, zero falhas/erros/ignorados), suíte leve,
Node e web type-check aprovados. pnpm check integral exit 0, 116 suítes/892
testes. Contagens por XML fresco antes da suíte leve; harnesses históricos não
reexecutados não entram. Hash técnico separado, checksum de governança
rebaseado mecanicamente, sem renovar verdicts históricos ou abrir a 021.

## Linux ARM64 local — parcela posterior, 2026-10-04

Auditoria de locks stale: [evidência](evidence/lifecycle-stale-locks-2026-10-04.md).
Hipótese de lock retido sobre etapa de job skipped não confirmada na interleaving
PostgreSQL parametrizada: NOWAIT passou com TX de cleanup ainda aberta. Zero
mismatch/undocumented/gate violado no cenário, sem alterar SQL ou runtime.
Recuperação/estado/intenção/storage conferidos, não prova de retenção operacional
ou de todas as interleavings. Cópias/orçamento do codec e tasks continuam abertos;
status/verdict/021 e fotografias anteriores preservados, performance mobile N/A.

Política do codec posterior: [evidência](evidence/rendering-native-policy-2026-10-04.md).
Mismatch funcional de classificação de dimensões foi reproduzido e corrigido,
sem mudar contrato/política/default ou ligar codec ao worker. Teste Linux exige
invalid-media/cause ausente/source e arquivos intactos. Zero undocumented/gate
violado nessa correção; finding de cópias/orçamento permanece funcional e aberto.
Alternativas pesquisadas não são implementação/admissão. Tasks/status/verdict,
histórico técnico e 021 bloqueada preservados; performance mobile não inferida.

Recursos FFM posteriores: [evidência](evidence/rendering-native-resources-2026-10-04.md)
e testes/source audit conferidos. Harness mede pipeline completo em superfície
nativa e preserva contratos/defaults/runtime do worker. Sem undocumented/gate
violado no incremento. Finding funcional AC-006 remanescente confirmado: VP8L
mantém transform copy e máximo multicolor tem OOM com 1 GiB. Não reclassificar
como benchmark externo nem restringir requisito a JVM. Executor/Reviewer devem
resolver a arquitetura antes da admissão operacional. Status/tasks/021 e hashes
históricos preservados; performance mobile não inferida dessas provas.

Incremento de recursos: [evidência](evidence/rendering-linux-resources-2026-10-04.md).
Probe/harness exclusivos de testes, métricas reais cgroup/proc/tmpfs, sem
produção, rede ou imagens privadas. Nenhum mismatch/undocumented novo no
harness; findings funcionais preexistentes agora confirmados: 80M falha com
1 GiB e encode PAM mantém cópias nativas integrais. Não é simples pendência
externa nem prova de AC-006 integral. Build oficial local autorizado em parcela
separada, não declarado como correção. Tasks/status/verdict conservadores e
fotografias históricas preservados; performance mobile não aplicável.

Preparação subsequente: [build oficial](evidence/rendering-native-build-2026-10-04.md).
Fonte 1.6.0 sem modificações, apenas upstream/toolchain aprovado em container,
smoke Java e controle de hash locais. Nenhum mismatch/gate novo no escopo;
isso não é implementação de codec/ABI/buffers nem resolução dos findings de
AC-006. Runtime/schema/defaults e status conservadores preservados.

Parcela subsequente: [raster nativo](evidence/rendering-native-raster-2026-10-04.md)
e plano anterior aos testes/código conferidos. Superfície confinada de quatro
bytes/pixel, decode JPEG/PNG e compositor compartilham memória nos testes,
sem alterar RenderPort/manifestos/HTTP ou conectar novo codec ao worker.
Finding premultiplied ARGB reproduzido e corrigido com validação explícita.

Zero mismatch/undocumented/gate violado no escopo inspecionado. Alias/lifetime
não comprovam ABI/encode WebP, ausência de cópias internas ou orçamento
operacional. Profiling global continua sendo do CLI; lacunas funcionais de
AC-006 permanecem abertas. Não há runtime mobile/schema/default ou ativação.
TASK-002/006/007/008, status/verdict e 021 blocked preservados, sem renovar
fotografias técnicas/históricas anteriores ou aprovação de performance Android.

Codec FFM subsequente: [evidência](evidence/rendering-native-codec-2026-10-04.md)
e plano anteriores ao código/testes conferidos. Libs preparadas explicitamente,
ABI LP64 por DWARF oficial, ponteiros emprestados e writer limitado testados
em Linux sem rede/provider. No worker ainda roda o CLI; snapshots anteriores
não foram alterados para parecerem usar FFM. Zero mismatch/undocumented/gate
violado no escopo inspecionado. Buffers internos, orçamento/containment e
integração/distribuição continuam lacunas funcionais; nenhum requisito
relaxado para aprovar. Runtime mobile/defaults/schema/gates preservados.

[Plano](../../../../../api/apps/translation-gateway/docs/rendering-linux.md)
e [evidência](evidence/rendering-linux-2026-10-04.md) conferidos. Harness Java
opt-in de testes reutiliza o protocolo/JAR sem alterar runtime; aquisição
autorizada separadamente e execução sem rede/pull/credenciais. Nenhum dado do
piloto foi montado. Pins, originais e cleanup conferidos, sem fallback de modelo/
codec ou alteração de spec para fazer testes passarem.

Zero mismatch/undocumented/gate violado no incremento inspecionado. A prova
local Linux não fecha distribuição, assinatura/licenças transitivas, contenção
atômica, quota de staging, memória/deadline/profiling ou retenção integral.
Performance mobile não aplicável; snapshots anteriores preservados. 020
in-progress/open, TASK-002/006/007/008 abertas e 021 blocked, sem promoção.

## Admissão Boot — parcela posterior, 2026-10-04

[Plano](../../../../../api/apps/translation-gateway/docs/rendering-archive.md)
e [evidência](evidence/rendering-archive-2026-10-04.md) conferidos. O novo launcher
admite explicitamente o JAR compatível sem mudar bootstrap normal ou bean; não
há fallback para main/configuração externa. Fixtures sintéticas revalidam o
artefato atual e preservam pixels, manifestos e originais. Regressão do separador
Surefire e classificação de BOOT-INF malformado corrigidas com testes red/green.

Zero mismatch/undocumented/gate violado no incremento inspecionado. Não há
runtime mobile, migration, instalação/rede Google ou dependência nova. Linux,
contenção atômica, caps nativos/disco, prazo integral, profiling e retenção
continuam lacunas funcionais/operacionais explícitas; não promover como mera
verificação externa. 020 in-progress/open, tasks abertas e 021 blocked preservados.
Hash técnico do gateway separado da governança; fotografias históricas mantidas.

## Isolamento explícito de JVM — parcela posterior, 2026-10-04

[Plano](../../../../../api/apps/translation-gateway/docs/rendering-isolation.md)
e [evidência](evidence/rendering-isolation-2026-10-04.md) conferidos contra fontes
e testes. Adapter explícito, IPC privado, validação integral, heap/prazo e
limpeza por propriedade não mudam contratos públicos, schema, defaults ou
worker ativo. O manifesto usa a requisição original do pai e não modifica texto.
Zero mismatch/undocumented/gate violado nesse escopo; não há runtime mobile novo.

Admissão Boot/Linux, contenção atômica de filhos nativos, memória/disco e prazo
integral ainda são lacunas funcionais de AC-006; revisão visual/profiling também
abertos. Nenhuma task promovida ou verificação operacional presumida.
020 in-progress/open, review parcial changes-requested e 021 blocked preservados.

## Limpeza imediata dos workers — parcela posterior, 2026-10-04

Parcela posterior de posse/locks do dispatch:
[evidência](evidence/dispatch-ownership-2026-10-04.md). Código divergente do
contrato foi reproduzido e corrigido, não convertido em nova intenção ou simples
falta de benchmark. CAS pela tentativa, job/cleanup condicionados, locks explícitos
e limite de criação de task inspecionados contra testes/SQL. Schema/contratos
públicos/defaults preservados. Zero mismatch/undocumented/gate violado no
escopo corrigido; auditoria integral/operacional e recursos/qualidade abertos.
020 in-progress/open e 021 blocked, sem aprovação de código mobile novo.

Incremento posterior de controles pós-commit inspecionado:
[evidência](evidence/lifecycle-controls-cleanup-2026-10-04.md). Cancelamento e
dispatch terminal mantêm estado/intenção atômicos e tentativa depois do commit;
rollback e ativos não excluem objetos. V5/V7/índices preservados. Bug ACK com TX
externa foi reproduzido e corrigido com regressão PostgreSQL, sem mudança da spec.
Zero mismatch/undocumented/gate violado identificado nesse escopo. Não é prova
de todas as interleavings ou SLA cloud; tasks e status permanecem abertos,
021 blocked e snapshots técnicos históricos preservados.

[Evidência](evidence/lifecycle-worker-cleanup-2026-10-04.md) e implementação
inspecionadas: V7/PK reaproveitadas, claim por job, tentativa nos três workers,
falha sanitizada/diferida, storage fora de transação e nenhum I/O em job ativo.
Retry preserva READY sem ACK; órfão não referenciado eliminado por idade mesmo
após erro SQL. Não há alteração de contratos públicos, task/manifestos, defaults,
runtime mobile ou gate. Fotografias técnicas históricas preservadas.

Zero mismatch/undocumented/gate violado encontrado no escopo desta parcela.
Auditoria integral das transições fora do worker, operação e recursos/qualidade
continuam abertas; não transformar falta funcional em mera verificação externa.
020 in-progress/open e 021 approved/blocked, sem nova aprovação de outras specs.

## Entrega privada nas consultas — parcela posterior, 2026-10-04

[Evidência](evidence/result-query-delivery-2026-10-04.md) e plano anterior
conferidos. GET expõe result aditivo conforme AC-005, sem nova rota/versão.
Owner/READY/TTL conferidos antes/depois de assinatura, sem transação durante
I/O. V1–V6 e índices preservados; sem URL/texto no banco. Parser mobile
classificado em AC-005, sem download/ACK/READY local, slice novo ou gate violado.
Zero mismatch/undocumented identificados nesse escopo; não é aceite integral
de qualidade, retenção terminal, distribuição ou recursos. 021 segue blocked.
Hash técnico corrente registrado na nova evidência, separado do checksum
SDD; fotografias históricas não recebem nova aprovação.

Gates da consulta: Maven global offline/Docker com opt-in nativo e suíte leve
exit 0, Node e web type-check aprovados; pnpm check integral exit 0 com
116 suítes/892 testes. Gateway global: 808 testes/68 classes, zero falhas/erros/
ignorados nessa execução, XMLs frescos antes da suíte leve. Sem contagem mista
de harness histórico. Formatação/diff válidos, headers rebaseados mecanicamente;
SDD/links finais revalidados sem modificar gates/validadores.

## Fila de ciclo de vida — parcela posterior, 2026-10-04

[Evidência](evidence/lifecycle-retention-2026-10-04.md) e plano inspecionados:
fila original/terminal separada do ACK, V7 BCNF com cascade e índice parcial,
transições individuais atômicas, reconciliação limitada e deletes fora de TX.
Estados ativos excluídos; leases/CAS cobrem crash sem retry cobrado. Nenhuma
mudança em task, OCR/TranslationPort, manifesto, rotas ou defaults. Nenhum
arquivo runtime mobile novo/modificado.

Zero mismatch/undocumented/gate violado identificado no escopo inspecionado.
Não comprova remoção imediata integral de todos os workers, distribuição,
profiling ou qualidade; TASK-006 e 017/TASK-017 permanecem abertas. 020 segue
in-progress/open; 021 approved/blocked. Fotografia técnica separada do checksum
de governança e conclusões históricas preservadas.

## Inspeção anterior preservada

Contratos preservam texto, IDs, ordem, variantes, geometria e limites; manifesto
estrito não modifica OCR `1.0`, task `{jobRef}` ou `/v1`. Porta possui adapter
de arquivos integrado ao worker opt-in. O codec Java nativo exige preparação
explícita, sem downloads automáticos, e só carrega no perfil worker/local.
V6 amplia metadados da etapa
existente, sem texto no banco; não altera runtime mobile, defaults ou infraestrutura.
A aprovação humana abriu o gate antes
dos testes/código; dependências em verificação são admitidas pelos guardrails.

Não há mismatch funcional identificado no contrato implementado; os seis ACs
integrais permanecem parciais, explicitamente na review. Não são reclassificados
como verificação externa para liberar a 021.

| Categoria                         | Contagem no escopo inspecionado | Ação                                                            |
| --------------------------------- | ------------------------------- | --------------------------------------------------------------- |
| mismatch                          | 0                               | conservar testes e não interpretar como aceite integral         |
| undocumented                      | 0                               | contrato técnico e evidência classificados                      |
| gate violado                      | 0                               | 020 aberta; 021 bloqueada                                       |
| critérios integrais ainda abertos | 6                               | concluir integração/recursos e verificações, depois nova review |

## Expiração consultável — parcela posterior, 2026-10-04

[Evidência](evidence/result-expiration-2026-10-04.md) e plano conferidos:
V1–V6 preservadas, sem texto/deadline duplicado no banco. READY expira por
owner na consulta ou em batch limitado; estado/fila atômicos. Timestamp de
render e prazo de resultado não ampliam o failsafe do original. A fila por TTL
não é evidência de download pelo aplicativo. Falhas reais de delete não são
silenciadas, e cleanup local é restrito ao prefixo privado, sem seguir symlinks.
Rotas/JSON e defaults permanecem compatíveis; consultas no-store.

Zero mismatch/undocumented/gate violado no incremento inspecionado. Pendências
integrais continuam de implementação/verificação, não são reclassificadas como
apenas benchmark: URLs, retenção terminal, distribuição e recursos. TASK-006
não fechada; 020 in-progress/open e 021 approved/blocked. Históricos preservados.

Gates da parcela encerrados: Maven global offline/Docker com nativo opt-in e
suíte leve aprovados; gateway 721 testes/62 classes na execução global, zero
falhas/erros/ignorados. Node 85 pass/um opt-in de fonte não executado; web tsc -b
e pnpm check integral passaram, com SDD/links/formato/diff aprovados. Headers
rebaseados mecanicamente, sem nova aprovação de outras features. Detalhes e
exclusão dos XMLs históricos de harness estão na review corrente.

## Gates e fotografia

Gates locais aprovados, com resultado na
[evidência](evidence/rendering-contracts-2026-10-03.md). Headers SDD são rebases
mecânicos da árvore corrente, sem renovar conclusões históricas de outras
features. Snapshot técnico do gateway separado do checksum mobile.

Parcela posterior TASK-002: [codec nativo e limites](evidence/rendering-codec-2026-10-03.md).
Round-trip exato não aprova fontes, pintura ou memória do pipeline. Binários
Homebrew não são confundidos com distribuição reproduzível de produção; essas
lacunas continuam abertas. Nenhum gate foi antecipado.

Gates desta parcela encerrados: Maven global offline/Docker com opt-in nativo
(473 testes gateway, zero falhas/erros/ignorados), suíte leve, Node, web type-check
e `pnpm check` integral aprovados. A review corrente registra as contagens e
as limitações. Rebase de 62 headers preserva seus verdicts/históricos; não é
nova auditoria das outras features nem promoção da 020.

## Fontes e composição — parcela posterior

[Evidência de fontes/pintura](evidence/rendering-paint-fonts-2026-10-03.md):
verificação das revisões/blob IDs/licenças e classpath; caixa limpa e texto
inerte nos sete destinos, recorte pixel-center, cores anteriores à escrita,
fallback inteiro e ordem de sobreposição preservada. Os testes de WebP final
confirmam pixels exatos, inclusive o exterior das regiões. Surefire configura
headless explicitamente para desenho offscreen; não muda defaults Spring/cloud.
TASK-003/004 técnicas foram entregues, sem promover os seis ACs integrais.

Nenhum mismatch identificado no escopo local inspecionado; regiões e texto
não são transformados. Não há consumo do layout experimental, provider ou
chamador no worker. Adapter de arquivos, commit, retenção, distribuição e
profiling permanecem implementação/verificação abertas, não aprovação tácita.
Fontes e testes do gateway possuem checksum técnico separado e atualizado;
fotografias históricas acima e verdicts de outras features são preservados.

Revalidação desta parcela: Maven global offline/Docker e suíte completa gateway
com opt-in nativo passaram (542 testes, zero falhas/erros/ignorados). Suíte leve,
Node, web type-check e pnpm check integral passaram; links/formato/diff válidos.
Nenhum código mobile foi alterado, sem inferir aprovação nativa do aplicativo
ou do consumo de memória do renderer. TASK-002/005/006/007/008 permanecem abertas.

## Arquivos — parcela posterior

[Evidência de arquivos](evidence/rendering-files-2026-10-03.md): RenderPort tem
adapter local explícito, revalidação/decode e saída WebP/manifesto vinculados,
sem bean ou chamador no worker. As variantes e os arquivos finais foram
inspecionados contra testes locais/nativos, preservando original e geometria.
Não há promoção indevida de READY, nova migration ou consumo mobile antecipado.
Zero mismatch/undocumented/gate violado no escopo entregue; seis critérios
integrais ainda abertos. TASK-005 não foi fechada pela parcela de arquivos.

Históricos acima são preservados. Pendências atuais: integração worker/commit,
retenção, URLs/ACK, empacotamento do codec, deadline global, profiling e qualidade.
Nenhuma alteração de requisito ou enfraquecimento de teste/validador observado.

## Persistência — parcela posterior

[Evidência](evidence/rendering-persistence-2026-10-03.md) e plano anterior ao
código conferidos: PostgreSQL, BCNF da etapa, V6 aditiva, constraints e PK/FK
existentes, commit conjunto, cancelamento, falhas, ACK e cleanup. Os guards
anteriores foram corrigidos com regressões; um delivery de outra etapa não
confirma cancelamento enquanto rendering está RUNNING.

Nenhum mismatch/undocumented/gate violado identificado nessa fronteira.
Os seis ACs integrais continuam abertos; o repository não é produção de READY
com arquivos reais. Orquestração, retenção, URLs e confirmação perdida integral
ainda são código pendente, não somente validação externa. Históricos preservados;
TASK-005/006 permanecem abertas, 020 in-progress/open e 021 approved/blocked.

## Worker — parcela posterior, 2026-10-04

[Evidência](evidence/rendering-worker-2026-10-04.md) e plano anteriores ao código
conferidos. Defaults disabled preservados; novo modo local somente worker,
sem provider/ADC, instalação ou fonte nativa no modo desabilitado. APIs/task e
manifestos OCR/tradução compatíveis. TASK-005 entregue com revalidação,
reserva/commit, uploads privados, cancelamento/rollback e confirmação perdida
após ACK. O resultado WebP é real nos testes; OCR/tradução são falsos locais.

Zero mismatch/undocumented/gate violado no incremento inspecionado. Lacunas
integrais não são reclassificadas como qualidade externa: URLs/expiração,
consolidação terminal/TTL, distribuição e recursos continuam abertas.
TASK-006/007/008 e 017/TASK-017 ainda pendentes, sem promover feature ou 021.
Maven global offline/Docker e suíte completa gateway passaram: 689 testes/59
classes, sem falhas/erros/ignorados, com opt-in nativo. Suíte leve, Node, web e
pnpm check integral passaram; detalhes na review. SDD/links/formato/diff
válidos. Rebase mecânico dos headers não renova aprovação de outras features;
históricos preservados e checksum técnico/mobile separados.
