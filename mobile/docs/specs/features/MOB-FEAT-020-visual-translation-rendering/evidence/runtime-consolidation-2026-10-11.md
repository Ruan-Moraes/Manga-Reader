# Consolidação técnica corrente da 020 — 2026-10-11

Parcela documental de TASK-002/006/007/008, com gate `open`. A revisão não muda
requisitos, runtime, migrations, recursos cloud ou defaults. 020 continua
`in-progress`, verdict `changes-requested`; 021 continua `approved/blocked`.
018/019 em `verification-pending` satisfazem a dependência técnica conforme os
guardrails atuais, sem equivaler a aceite linguístico/operacional.

## Fontes e provas reconferidas

Foram inspecionados spec/tasks/registry/coverage, os caminhos de composição,
orquestração de render, entrega privada e respectivos testes. Os fontes, testes
e configuração do gateway continuam correspondendo a **400 arquivos** e
SHA-256 `40c140568670d3ac826a40e485bf533d1f95a10da32c528cc4e76f44aea149b6`.
O escopo técnico é o do [registro da base](../../../../../../api/apps/translation-gateway/docs/native-base-update-2026-10-11.md):
paths relativos ordenados/NUL/bytes/NUL; src/scripts/openapi/pom e Terraform
direto, excluindo docs/Dockerfiles/build/capturas. Não é o checksum mobile.

JAR Boot 4/Java 25: `6c6a8703aad2f52839790b7a95852544cc75a3328e2709bc4032dfcd63eee29e`.
As novas imagens locais ARM64/x86_64 existem no daemon com os IDs registrados,
usuário `1000:1000`; não são digests publicados ou artefatos assinados.
Hashes do XML/diagnósticos, resumo global e scans foram relidos e conferidos
contra os registros, sem regenerar relatórios ou iniciar outra inferência.

- [Migração Boot 4 e suas regressões](../../../../../../api/apps/translation-gateway/docs/boot4-execution-2026-10-10.md):
  parent standalone, Jackson compatível, Argon2 anterior, configuração HTTP,
  archive/launcher, JNI/musl/glibc e testes. Snapshots Java 23 permanecem históricos.
- [Base Ubuntu atualizada e matriz atual](../../../../../../api/apps/translation-gateway/docs/native-base-update-2026-10-11.md):
  exatamente dois upgrades autorizados; JRE íntegro, proveniência explícita,
  preflight e **40 testes nativos**, zero failures/errors/skips, terminados
  às 07:56:08 local. XML `e39b0d9fb9290064ffb7e49f2639e7a1154de4a1126529e4ee447b67daca7bfc`.
  Os 38 diagnósticos têm UID/defaults/rotas e limites verificados; máximo
  observado 2.840.174.592 bytes sob 8 GiB, não admissão cloud de 1 GiB.
- Global offline/Docker da mesma fonte, às 07:59:45 local: sete módulos SUCCESS,
  2.738 testes/845 classes, zero failures/errors, 103 skips opt-in. Resumo
  `8fb4c83e213676d8b87f4bf999db20d193c1b977c29143dcb7c5f291de56a2c1`.
  Relatório opt-in preservado antes dos skips; sem nova execução Java nesta auditoria.
- Node: 114 pass/um skip; web `tsc -b` aprovado; mobile `pnpm check` 116 suítes/
  892 testes aprovado na execução anterior. O check mobile também foi reexecutado
  nesta auditoria: exit 0, 116 suítes/892 testes, sem reinstalação e com warnings
  `act(...)` preservados. Não renova a data dos gates Java da mesma fonte.

SDD/links passaram com 67 artefatos, 1.533 arquivos classificados, 362 behavior
e 245 evidence. O novo documento é classificado como evidência dos seis ACs,
não como comportamento adicional. O checksum mobile foi recalculado após
estabilizar o mapa/documentos; somente headers correntes são rebaseados
mecanicamente, sem renovar verdicts/datas ou hashes históricos nas seções de corpo.

Nenhuma captura privada, texto OCR/traduzido, imagem, credencial, URL assinada
ou path pessoal é copiado para esta evidência. Scans/relatórios originais e
rodadas antigas permanecem preservados localmente.

## Critérios e força da evidência

| Critério | Implementação/prova verificável                                                                                                                                        | Limite ainda aberto                                                                                                 |
| -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| AC-001   | CleanBoxPainter/PageRasterPainter e testes de diff externo; ProcessRenderingTaskUseCase preserva inputs e resolve posse de artefatos; hashes/recovery na matriz atual  | Auditoria integral de interleavings e validação operacional de retenção                                             |
| AC-002   | Fontes físicas pinadas/licenciadas e fixtures realmente pintadas nos sete destinos; testes verificam glyphs, wrapping, contraste e pixels                              | Revisão visual/linguística independente e qualidade de página real                                                  |
| AC-003   | PageRasterPainterTest e RenderManifestServiceTest preservam todo o texto e sinalizam overflow; casos máximos/fallback na matriz atual                                  | Revisão visual do marcador e consumo final no leitor futuro                                                         |
| AC-004   | JPEG/PNG/WebP vazios equivalentes após decode; pipeline fake chega a READY sem chamada de tradução na entrada vazia                                                    | Qualidade/operação reais; não confundir fixture com página licenciada avaliada                                      |
| AC-005   | GetJobResultUseCase/GoogleCloudPrivateDownloadAdapter e testes de ownership, generation, prazos imutáveis, supressão pós-ACK; PostgreSQL V1–V9/cleanup/commit testados | IAM/assinatura/GCS/Tasks reais e retenção operacional; nenhum download mobile antecipado                            |
| AC-006   | Capacidade/posse, preflight, limites de kernel, 38 diagnósticos e recuperação após faults; SDKs oficiais loopback e ONNX local já executados                           | Orçamento/serviço cloud, OOM agregado, hardware x86_64 nativo e profiling Android; perfil local não aprova produção |

## Correções dos resumos, sem promoção de gate

Três resumos correntes estavam obsoletos: imagem ainda apresentada como Java 23;
pipeline SDK/layout tratado genericamente como ausente; roadmap descrito apenas
pelo diagnóstico antigo. São **evidências/resumos obsoletos**, não novos defeitos
de runtime nem aprovação dos critérios restantes. Os registros antigos conservam
suas versões, hashes e conclusões; somente os resumos correntes são reconciliados.

Segurança da candidata ainda não aprovada: 16 ocorrências Ubuntu na DB utilizada,
cópias JRE e codec manual têm análise distinta. Zero alertas Java de SCA não
significa runtime inteiro seguro. Distribuição/assinatura/publicação e gates
operacionais continuam abertos; não foi adquirido outro runtime ou aplicado VEX.

O diff-check do gateway passou, mas o global segue vermelho por linha adicional
externa em `web/landing-page/src/shared/component/PlatformBadge.tsx:44`.
Não corrigir superfície alheia nem omitir esse gate para promover a 020.

Skills SDD Reviewer/Drift Auditor usadas para separar implementação, evidência
local e verificação externa. Performance mobile **não aplicável ao incremento**:
nenhum componente, fluxo, armazenamento ou runtime React Native foi alterado;
as medições Linux não são evidência Android. Não foi criado benchmark fictício.

Próximas ações são fechar segurança/admissão/distribuição operacional e revisão
adequada, com aprovação própria antes de instalação, uso de credenciais,
chamadas pagas, publicação ou ativação. Não alterar requisitos para transformar
essas pendências em aceite presumido.
