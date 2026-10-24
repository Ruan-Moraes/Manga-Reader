# Diagnóstico cloud real — 2026-10-12

**Resultado: execução concluída, admissão operacional não aprovada.**
Parcela da validação da 020; não é OCR, renderização ou execução do worker.
020 continua `in-progress/open`, 021 bloqueada. Complementa o
[roteiro](rendering-cloud-validation.md) e a
[revisão/autorizações](diagnostic-publication-review-2026-10-12.md).
**Recursos temporários retirados após aprovação em 12/10; evidências preservadas.**

## Escopo executado

Ruan respondeu «Vamos.» ao pedido de uma única execução diagnóstica paga e
coleta de resultados, sem mídia/providers. Job existente privado
`toonlira-isolation-diag-20261012`, São Paulo, geração 1, imagem por digest
`sha256:cf73e5c4241a96a095dcec030296dfea3269a3c50d6152466a09802fe17b0c02`,
conta dedicada, 1 task/paralelismo, retries 0, timeout 60 s, 2 CPU/8 GiB,
scratch em memória 512 MiB. Nenhum override, grant, chave ou recurso novo.

Pré-flight reconfirmou geração/configuração, identidade existente, herança
somente projeto e ausência de grants públicos. Um único POST Node/fetch para
a [API oficial run v2](https://docs.cloud.google.com/run/docs/reference/rest/v2/projects.locations.jobs/run),
com ETag do Job conferido, intent exclusivo e retries do gatilho não implementados.
Token da identidade existente só em memória, sem arquivo/argumento/recibo.
Sem SDK/provider novo ou `gcloud auth login`/troca ADC/impersonação.

Operação retornada capturada antes do acompanhamento; duas consultas GET à
mesma operação, sem outro POST. Listagem passou de zero a **uma execução**;
uma task e `Completed=CONDITION_SUCCEEDED`, `succeededCount=1`,
`failedCount=cancelledCount=0`. O task result não expôs exitCode explicitamente;
não inventar esse campo. Sucesso da plataforma não aprova os requisitos.

Horários UTC reportados pela execução: create 20:04:06.985084,
start 20:04:13.081406, completion 20:04:22.572460. Probe observado às
20:04:20.418119131; rodada local 20:04:00–20:04:31, quinze ações concluídas.
Esses timestamps **não** são medição de tempo faturado ou pico de memória.

## Observações do probe, não simulação

Relatório `1.0`, Java 25, 18 checks: **9 PASS / 3 FAIL / 6 UNKNOWN**,
`status=requirements-not-met`. Campos `operationalApproval=false` e
`nativeOperationsTested=false` mantidos. Um relatório único capturado dos logs
da execução exata; logs de outras rodadas/recursos não consultados.

| Check                   | Resultado | Observação sanitizada |
| ----------------------- | --------- | --------------------- |
| linux                   | PASS      | matched               |
| cloud_run_amd64_abi     | PASS      | matched               |
| pid_one                 | PASS      | 1                     |
| private_cgroup_v2       | FAIL      | different             |
| memory_at_least_8gib    | UNKNOWN   | unavailable           |
| swap_disabled           | UNKNOWN   | unavailable           |
| pids_1_to_64            | UNKNOWN   | unavailable           |
| oom_group_disabled      | UNKNOWN   | unavailable           |
| supervisor_oom_score    | PASS      | 0                     |
| scratch_tmpfs           | PASS      | matched               |
| scratch_at_most_512mib  | PASS      | 536870912             |
| scratch_noexec          | FAIL      | different             |
| scratch_nosuid          | PASS      | matched               |
| scratch_nodev           | PASS      | matched               |
| address_limit_3gib      | FAIL      | -1                    |
| virtual_size_below_3gib | PASS      | 2430300160            |
| fixed_ceiling_budget    | UNKNOWN   | unavailable           |
| current_launch_headroom | UNKNOWN   | unavailable           |

`UNKNOWN` significa leitura ausente/inacessível ou formato não admitido pelos
parsers, não prova ausência física de memória/limite. `different` não revela
qual texto de cgroup foi retornado: não inferir cgroup v1 ou hierarquia concreta.
RAM declarada de 8 GiB não substitui releitura do controle autoritativo.

O limite de endereço ilimitado (`-1`) era esperado no probe sem bootstrap;
não foi exercitado `prlimit`/`prctl`. `scratch_noexec` é observação adicional,
não critério novo de admissão. Não atribuir o bloqueio apenas a esses dois FAILs.

## Decisão fundamentada

Bloqueiam avanço nesta configuração: identificação incompatível com `0::/` e
ausência de observação admitida de controles de memória/swap/PIDs/OOM/orçamento.
Código autoritativo relido, sem alteração:
[LinuxWorkerMemoryAdmission](../src/main/java/com/toonlira/translationgateway/infrastructure/rendering/LinuxWorkerMemoryAdmission.java)
e [LinuxOomPolicy](../src/main/java/com/toonlira/translationgateway/infrastructure/rendering/LinuxOomPolicy.java).
Ambos exigem cgroup/controles específicos e recusam estado desconhecido.

**Inferência limitada:** se o worker receber essas mesmas observações, a
admissão atual recusará o ambiente. Não executamos bootstrap Spring/helper/
codec/modelo, portanto não afirmar falha observada do worker. Tampouco afirmar
incompatibilidade universal de toda configuração Cloud Run/Service.
Ver [limites da ferramenta](worker-isolation-probe.md) e
[contrato de memória](rendering-memory-admission.md).

Etapas de bootstrap nativo/stack SQL/GCS/Tasks **não iniciadas**. Sem retry,
waiver de guard, aumento de recursos, deploy, uploads ou migração automática
para VM/GKE. Próximo trabalho exige decisão arquitetural; qualidade/segurança
de OCR/layout/tradução não são aprovadas por esse diagnóstico.

## Evidências e custos

Somente recibos/probe validados mantidos em rodada privada exclusiva ignorada;
sem políticas/tokens integrais, respostas OCR ou mídia. Operação e execution
IDs completos ficam nesses recibos, não nos documentos versionados.

| Artefato           | SHA-256                                                            |
| ------------------ | ------------------------------------------------------------------ |
| Probe capturado    | `c5e441615842d6793e3c3dd1e99aacec8e2a3e1e476cf03d785d77126fd3ee2b` |
| Estado da execução | `dc33555f39c02335bcafbd907beb08de79d349a5e65b52eb5bfd4518a39c72a2` |
| Recibo final       | `f2b5a5a321d7bfa45e06530dcbc8bf5df9657c9cd0670da56f5440490ed61e11` |

Execução paga foi autorizada com estimativa USD 0,003744 por 60 segundos
faturados, sem teto/extras/free tier presumido. **Custo efetivamente faturado e
pico de memória não medidos**; não converter duração start/completion em fatura.
Na conclusão do diagnóstico, registry/artefato permaneciam armazenados e
sujeitos a cobrança; a retirada posterior foi confirmada abaixo.
Nenhuma consulta adicional de billing ou alteração de orçamento.

Manifests dos componentes CLI idênticos antes/depois. Tokens não persistidos;
cache/logs normais da credencial existente podem ter sido atualizados pelo CLI.
Sem nova instalação/base CVE/imagem; arquivos de performance preservados.

## Retirada autorizada e confirmada — 2026-10-12

Ruan respondeu «Sim» ao pedido delimitado de retirada. Pré-flight conferiu
datas/identidade/configuração e etiquetas dos alvos, uma única execução já
concluída, registry com um pacote/uma versão/tag aprovada e conta sem chaves
de usuário/grants diretos. Listagens Cloud Run de todas as regiões retornaram
somente o Job diagnóstico e zero Services; zero outro consumidor da conta ou
imagem nesses recursos. Não é inventário universal de todos os produtos cloud.

Cada comando de exclusão foi invocado uma vez, sem repetição pelo executor,
seguido de listagem autorizada bem-sucedida para confirmar ausência:

- Job `toonlira-isolation-diag-20261012`: exclusão aceita às 20:17:54 UTC;
  listagem global posterior sem Jobs. A execução concluída não foi repetida;
  seus estados, probe e recibos locais continuam disponíveis.
- Registry `toonlira-diag-20261012`: exclusão aceita às 20:17:59 UTC;
  listagem regional sem repositórios. A única imagem remota foi retirada junto.
- Conta dedicada `toonlira-diag-20261012@toonlira-rm.iam.gserviceaccount.com`:
  exclusão aceita às 20:18:01 UTC; ausente da listagem de contas ativas.

IAM do projeto byte-idêntico antes/depois, cinquenta APIs habilitadas sem
alteração e três demais contas com identidades/estado iguais, incluindo
`ocr-eval`. APIs/agentes gerenciados não foram removidos. Nenhuma ação dirigida
ao bucket OCR, site, logs/auditoria ou performance; nenhuma limpeza abrangente.
Sem criação, execução paga, provider, instalação ou mudança dos defaults.

Tentativa inicial preservada, **zero exclusões**: o comando GA retorna o nome
curto do pacote dentro do registry explicitamente selecionado, não o caminho
completo esperado pelo verificador. Consulta somente leitura confirmou
`isolation-probe`; nova rodada exclusiva revalidou todos os alvos antes de
excluir. Inventário global reconfirmado com avisos de incompletude detectáveis;
nenhuma falha de permissão tratada como prova de ausência.

| Recibo privado                                       | SHA-256                                                            |
| ---------------------------------------------------- | ------------------------------------------------------------------ |
| Pré-flight interrompido sem exclusões                | `850988626ffcf87439db9d4186c250765a77e6e250e68176d45e19e26387008d` |
| Retirada final, 25 ações entre 20:17:33–20:18:06 UTC | `3fa3f7be4d1099ebd40eaaec62f52b6f1e54c406d79e282498593cc7cd86c854` |

Imagem original ainda presente no Docker pelo digest aprovado e export local
com hash conferido. A imagem remota excluída não foi restaurada; esses arquivos
permitem uma **nova publicação autorizada**, não recuperar o histórico de execução.
A conta pode ser recuperada pela operação própria em até 30 dias, conforme
[documentação IAM](https://docs.cloud.google.com/iam/docs/service-accounts-delete-undelete);
recriá-la com o mesmo nome não preserva a identidade anterior. Nenhuma recuperação
executada. Exclusão não reverte cobranças passadas nem apaga automaticamente logs.

Comandos concretos e intents estão nos recibos privados; referências oficiais:
[delete Job](https://docs.cloud.google.com/sdk/gcloud/reference/run/jobs/delete) e
[delete repository](https://docs.cloud.google.com/sdk/gcloud/reference/artifacts/repositories/delete).

## Verificação local do diagnóstico e da retirada

Intent/recibo confirmam um POST, uma execução e hash do probe; contagens e
campos permanentes false validados. 419 fontes/testes/configurações continuam
byte-idênticos à fotografia técnica
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`.
Oito artefatos locais de evidência/export conferidos antes/depois da retirada;
fontes técnicos permanecem byte-idênticos. Links locais dos documentos
operacionais reconferidos após registrar o fechamento.

Oito testes locais existentes reexecutados após a retirada e aprovados,
zero falhas/skips, com JDK 23 já
instalado e sem Docker/download/rede/provider:

```bash
node --test api/apps/translation-gateway/scripts/worker-isolation-probe.test.mjs api/apps/translation-gateway/scripts/worker-isolation-image.test.mjs api/apps/translation-gateway/scripts/worker-resource-profile.test.mjs
```

Fixtures desses testes são sintéticas e não substituem os checks cloud reais.
Sintaxe JS/Prettier/diff-check do módulo aprovados. Diff-check global ainda
aponta blank EOF alheio em `web/landing-page/src/shared/component/PlatformBadge.tsx:44`,
preservado. Maven/mobile/web não reexecutados nesta operação sem mudança de
runtime; provas históricas não redatadas. Somente pequenos registros locais
adicionados para a retirada; nenhum cache grande ou arquivo de performance alterado.
