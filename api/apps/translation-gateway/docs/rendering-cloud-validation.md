# Validação operacional da 020 no Google Cloud

Preparado e atualizado em 2026-10-12. **Inventário, registry/push e conta dedicada
executados após autorizações delimitadas; uma execução diagnóstica concluída,
admissão não aprovada (9 PASS / 3 FAIL / 6 UNKNOWN).** Armazenamento e essa
execução foram autorizados, não implantação/cobrança da stack completa.
**Job, registry/imagem e conta temporários posteriormente retirados com
aprovação; evidências e imagem local preservadas.**
Próximo candidato de diagnóstico: [VM temporária com Docker](worker-isolation-target-options-2026-10-12.md),
recomendação ainda sem provisionamento/aprovação operacional; quotas, pin de
metadata e cotação preparados na [receita privada](worker-isolation-vm-recipe-2026-10-12.md).
Checklist e comandos iniciais preservam a preparação; os registros
cronológicos ao final indicam o estado corrente, sem substituir seus históricos.
020 permanece `in-progress/open`, 021 bloqueada. Complementa o
[histórico do diagnóstico cloud](worker-isolation-cloud-plan.md), sem substituir
resultados anteriores ou tocar os arquivos da auditoria de performance.

## Escopo e sequência

Validar primeiro se o Cloud Run suporta os controles exigidos pelo renderer.
Só depois considerar worker HTTP, SQL, GCS e Cloud Tasks. Não executar o módulo
Terraform inteiro como primeira prova: ele também cria gateway com binding
`allUsers`, banco, rede e manutenção. Não remover preconditions, usar `-target`
ou diminuir guards para implantá-lo.

Projeto proposto: `toonlira-rm`; região proposta: `southamerica-east1`, conforme
o planejamento corrente. Reconfirmar antes de ação autenticada. Não reaproveitar
automaticamente bucket OCR nos EUA, conta `ocr-eval` ou recursos desconhecidos.
Não mover região ou criar outro projeto para reduzir preço silenciosamente.

| Etapa              | Entrega                                              | Condição para avançar                                      |
| ------------------ | ---------------------------------------------------- | ---------------------------------------------------------- |
| 1. Inventário      | Projeto, billing, APIs, permissões e recursos atuais | Consulta autorizada, sem mutações; lacunas explícitas      |
| 2. Diagnóstico     | Um Job privado, sem mídia, banco ou provider         | Imagem revisada, custos aceitos e uma execução autorizada  |
| 3. Admissão nativa | Bootstrap, syscalls e falhas no alvo                 | Diagnóstico compatível e harness/pacote próprios revisados |
| 4. Integração      | Worker privado + SQL/GCS/Tasks e retenção            | Controles aprovados e orçamento separado da stack completa |

Autorizações executadas estão registradas ao final. Novo uso de credenciais,
instalação, publicação, grant, criação, execução paga ou exclusão cloud exigem
confirmação específica após apresentar escopo/impacto. Uma etapa incompleta
não autoriza a seguinte. Incompatibilidade exige relatório e decisão
arquitetural, não migração automática para VM/GKE ou waiver de guard.

## 1. Inventário autenticado, somente leitura

O pré-flight de 10/10 comprovou projeto ativo/billing vinculado e, depois,
APIs Run/Artifact Registry habilitadas. O inventário regional encontrou zero
repositórios naquela data. Não comprova estado atual, crédito gratuito, quota,
permissão de push ou ausência de recursos em outras regiões.

Antes: conferir CLI estável já instalada e identidade pretendida privadamente.
Não realizar login, trocar ADC, gerar chave ou imprimir token. Não usar
`alpha`/`beta` nem instalar componentes: há desvio histórico de instalação
implícita de `beta`. Desabilitar update-check não garante ausência de instalação.

Comandos propostos, **não executados**, após aprovação do uso da credencial:

```bash
gcloud projects describe toonlira-rm --format='json(projectId,lifecycleState)'
gcloud billing projects describe toonlira-rm --format='json(billingEnabled)'
gcloud services list --enabled --project=toonlira-rm --format='value(config.name)'
gcloud artifacts repositories list --project=toonlira-rm --location=southamerica-east1 --format='json(name,format,mode)'
gcloud run jobs list --project=toonlira-rm --region=southamerica-east1 --format='value(name)'
gcloud run services list --project=toonlira-rm --region=southamerica-east1 --format='value(metadata.name)'
```

Validar permissões de leitura e, separadamente, das ações futuras por recurso.
Listar nomes não valida IAM privado. Reutilização exige consulta autorizada da
configuração/IAM, com saída sanitizada e sem políticas/identidades integrais
publicadas. Permissão ausente, API desligada ou billing inválido impede avanço;
não corrigir automaticamente. Saída: checklist `validado|pendente|bloqueado`,
com UTC, comando e escopo. Estado atual permanece pendente nesta preparação.

## 2. Job mínimo de diagnóstico

Usar o [probe Java e preparador existentes](worker-isolation-probe.md).
Contexto: somente runtime/licenças e oito classes; nenhum Spring, modelo,
codec, SDK Google, captura, amostra ou segredo. Cache ausente exige aprovação
de aquisição, sem pull implícito. Nenhum build/push ocorreu nesta preparação.

Revisar segurança da **imagem exata** antes de propor publicação. O
[scan do worker de 12/10](rendering-security-refresh-2026-10-12.md) não cobre
a imagem de diagnóstico Temurin, nem aprova qualquer dos pacotes. Aprovação
restrita do diagnóstico não admite o worker. Não baixar scanner, banco CVE,
pacote ou modelo durante execução cloud; aquisição exige confirmação própria.

Proposta, sujeita a disponibilidade e aprovação por ação:

- Registry regional privado, exclusivo ou explicitamente reutilizado. Sem
  leitores públicos, scanner pago ou Cloud Build automático. Medir camadas
  antes do push e fixar digest do registry, não ID Docker local.
- Conta dedicada sem chave/papéis de dados, provider, SQL ou GCS. Conferir
  herança de IAM; não usar default, identidade pessoal ou `ocr-eval` no Job.
  Operador: writer apenas no registry para push, permissões de configuração
  do Job e `actAs` apenas na conta dedicada, invocação no Job para executar.
  Grants de pull do service agent são separados do runtime. Sem Owner/Editor
  por conveniência; criação/grants também precisam de aprovação.
- Job de nome exclusivo, Linux amd64 por digest, uma task, paralelismo 1,
  2 vCPUs/8 GiB, retries 0, timeout 60 s, volume `/work` em memória limitado
  a 512 MiB, entrypoint Java/UID 1000. Sem porta, segredo, schedule, Tasks
  ou `--execute-now` na criação.

Jobs usam gen2; o Service futuro deve selecioná-lo explicitamente. Job verde
não prova lifecycle do Service. [Ambientes](https://docs.cloud.google.com/run/docs/configuring/execution-environments).
Retries devem ser zero, pois o default é três.
[Retries](https://docs.cloud.google.com/run/docs/configuring/max-retries).
O volume consome RAM da cota, não acrescenta memória.
[Volumes de Jobs](https://docs.cloud.google.com/run/docs/configuring/jobs/in-memory-volume-mounts).

Após criação autorizada, conferir configuração efetiva antes de pedir **uma
execução**. Reservar registro local e capturar operação/execução antes de
acompanhar. Confirmação perdida exige consultar a rodada original, sem repetição
automática. Coletar somente logs/métricas dessa execução.
[Execução de Jobs](https://docs.cloud.google.com/run/docs/execute/jobs).

### Interpretar, sem aprovação automática

Avaliar os 18 checks, não apenas exit 0. Preservar JSON/hash e os campos
`operationalApproval=false` e `nativeOperationsTested=false`. UNKNOWN não é PASS.

| Controle                                     | Evidência           | Limite                                                                  |
| -------------------------------------------- | ------------------- | ----------------------------------------------------------------------- |
| Linux amd64, PID 1, cgroup `0::/`            | Leitura direta      | Diferente/indisponível bloqueia a admissão atual                        |
| Memória finita ≥ 8 GiB, swap zero, PIDs 1–64 | Arquivos legíveis   | Recursos declarados não substituem observação                           |
| Tmpfs ≤ 512 MiB, flags, budget/headroom      | Mount/cálculos      | Flags adicionais são diagnósticas; decidir pelo guard Java autoritativo |
| OOM group/score do pai                       | Controle observado  | Não prova preservação do pai em OOM cloud                               |
| AS exatamente 3 GiB                          | Probe sem bootstrap | Unlimited é esperado aqui; exige prova nativa na etapa 3                |

Cloud Run restringe privilégios/escrita em proc/sys. A API Container/Volume
consultada não expõe os knobs Docker de PIDs/mount flags. **Inferência:**
compatibilidade segue desconhecida; documentação não prova nossos guards.
[Contrato](https://docs.cloud.google.com/run/docs/container-contract),
[Container](https://docs.cloud.google.com/run/docs/reference/rest/v2/Container),
[Volume](https://docs.cloud.google.com/run/docs/reference/rest/v2/Volume).
Não usar root, mount próprio, privilégio ou leitura fictícia para aprovar.
Pré-requisito normativo incompatível interrompe a prova antes de SQL/Tasks.

## 3. Bootstrap nativo e admissão

Ainda depende de preparar/revisar harness Java/JS exclusivo de avaliação;
não é uma flag pronta de produção. Não publicar JAR de testes indiscriminadamente
ou substituir `RenderPort` para evitar o bootstrap gerenciado.
Pacote: imagem amd64 revisada, JAR pinado, libwebp/hash/licenças e fontes
licenciadas. ONNX/modelo só entram em prova combinada separada, se necessários
e autorizados para envio; não instalar dinamicamente no container.

Provar o que o probe não faz: helper aplica RLIMIT_AS 3 GiB ao pai, releitura,
teto da filha ≤ 3 GiB, mesmo UID/cgroup, limites próprios e preferência OOM.
Exercitar prlimit/prctl e helpers existentes, sem shell/C próprio, escrita
arbitrária em proc/sys ou novos privilégios. Negação de syscall é falha.
[Contrato de admissão](rendering-memory-admission.md).

Boot fail-closed antes de provider, capacidade única antes do decode, timeout/
cancelamento com término nativo, pressão/disco/filha morta e recuperação de rodada
seguinte. Começar com fixture sintética pequena; máximas/fault injection têm
aprovação própria de custo/escopo, sem expandir a matriz automaticamente.
Medir memória total cgroup, pai/filha/heap quando observáveis, CPU/duração,
scratch, OOM/restarts e cold start. AS não é RAM e amostragem não é reserva
atômica. Repetir no Service real; Job/local emulado não admitem HTTP.
Pai morto em OOM mantém decisão aberta, sem aumentar quota ou repetir provider.

Saída: prova de pacote/configuração exatos e decisão explícita de admissão;
nenhuma autorização derivada de uploads ou chamadas externas.

## 4. Stack privada, integração e recuperação

Depois da etapa 3, revisar configuração operacional separada da proposta
Terraform bloqueada. Antes de provisionar, apresentar inventário/diff, IAM,
custos recorrentes, responsáveis e retirada. Sem plan/apply remoto aqui.

- Service privado gen2, imagem por digest, concorrência 1, mínimo 0/máximo 1,
  scratch limitado e bootstrap real. Max instances não é teto financeiro.
  Gateway público desligado; `/v1` inacessível no perfil worker. HTTP 204 não
  prova sucesso: exigir estados/etapas e artefatos íntegros no banco/storage.
- PostgreSQL 17 privado, VPC/SQL revisados, migrations V1–V9, segredo versionado
  sem valor em tfvars/logs. Banco isolado, sem seed/reset compartilhado. Nenhuma
  mudança de schema; se necessária futuramente, usar `database-design` antes de código.
- Bucket de avaliação privado, acesso uniforme/bloqueio público e retenção/soft
  delete verificados. Não purgar bucket OCR ou imagens reutilizáveis. Lifecycle
  diário não comprova cleanup de uma hora.
- Tasks/OIDC com identidade dedicada, audience do worker, uma tentativa,
  task determinística e teste `ALREADY_EXISTS`. Runtime, invocação e manutenção
  separados; IAM mínimo e sem invoker público. Conferir configuração real.
  [Tasks/Run](https://docs.cloud.google.com/run/docs/triggering/using-tasks).

Primeira integração: fixtures e adapters OCR/tradução exclusivos do harness,
SQL/GCS/Tasks/renderer reais. Esse harness/seed ainda precisa de implementação
revisada; não existe no artefato de produção por suposição. Não adicionar seed
público ou habilitar `/v1`. Registrar composição/hashes: fakes não aprovam
provider/qualidade, nem substituem prova do pacote de produção com chamadas
reais quando especificamente autorizadas.

| Caso                        | Aceite esperado                                                                                     |
| --------------------------- | --------------------------------------------------------------------------------------------------- |
| IAM/rotas                   | Não autorizado negado; autorizado alcança task interna; sem `/v1`                                   |
| Pequeno/vazio               | Estados/etapas SQL corretos, READY e artefatos privados com bytes/hash/MIME/dimensões válidos       |
| Reentrega/concorrência      | Uma reserva/chamada por etapa; sem duplicação de provider/job/quota                                 |
| Cancelamento/commit ambíguo | Terminal correto, objeto ambíguo preservado/reconciliado; sem provider repetido                     |
| SQL/GCS/Tasks indisponíveis | Erro sanitizado, intenção durável e recuperação sem perder ownership                                |
| ACK/TTL                     | Expiração, delete por objeto autorizado, retry durável de falha parcial, isolamento de job ativo    |
| Retenção                    | Original/resultado conforme TTL, sessões expiradas e metadados de sete dias; cleanup real observado |
| Logs                        | Sem texto/body, credenciais, Authorization, jobRef, chave de objeto ou URL assinada                 |

Soft delete pode manter bytes recuperáveis/faturáveis após delete lógico;
separar objeto ativo inacessível de retenção física, sem afirmar destruição
imediata ou desativar proteção automaticamente.
[Soft delete](https://docs.cloud.google.com/storage/docs/soft-delete).
URLs assinadas só na validação autorizada, fora de logs/relatórios; verificar
bytes em rodada permitida, não só metadata. Não implementar a 021 para contornar
o gate. Provider real/mídia/revisão dos sete idiomas exigem aprovação de envio/
custo própria. Tradução real não autorizada; qualidade/legal/uploads continuam
gates separados da admissão operacional.

## Custos e paradas financeiras

Consulta pública em 12/10, sem billing. Jobs cobram vida da instância, mínimo
60 s. Referência default **us-central1**: USD 0,000018/vCPU-s e
0,000002/GiB-s. Para 2 vCPUs/8 GiB: `segundos faturados × 0,000052`,
60 s ≈ USD 0,00312; 180 s ≈ USD 0,00936. **Não é tarifa regional atual de São
Paulo**; a consulta regional histórica de 10/10 permanece no plano anterior e
será renovada antes de publicar/criar/executar. Startup/encerramento/rodadas
extras podem cobrar; timeout não é teto financeiro.
[Cloud Run](https://cloud.google.com/run/pricing).

Registry: USD 0,000136986/GiB-hora acima da faixa gratuita compartilhada de
0,5 GiB-mês; não presumir saldo. Medir camadas/tempo/transferência; scanner
opcional tem custo separado. [Artifact Registry](https://cloud.google.com/artifact-registry/pricing).

Etapa 2 não cria SQL/VPC/bucket/fila. Etapa 4 exige orçamento próprio de SQL,
disco/backups/PITR, Run/manutenção, registry, Storage/soft delete/operações,
Tasks, Secret Manager, logs, rede, providers, impostos e moeda de cobrança.
O custo pequeno do Job não é o custo da stack; total permanece pendente de
inventário/tarifas regionais/volumes e tempo de retenção.

Registrar valor/duração aceitos antes da ação. Budget de alertas não interrompe
gasto. Eventual spend cap é opção distinta, sujeita a suporte/escopo/permissões,
não garantia presumida; sua configuração também exige aprovação. Nada de
billing/budget/cancelamento automático silencioso.
[Budgets](https://docs.cloud.google.com/billing/docs/how-to/budgets).

## Registro, retirada e checklist

Usar o [modelo vazio](rendering-cloud-validation-record.example.json) como
registro privado por rodada, em diretório exclusivo ignorado sob
`.local/worker-isolation/`, sem regravar pastas da auditoria de performance.
Campos vazios/flags false não são resultado observado. Aprovação literal/escopo,
comandos sanitizados/UTC, Git/dirty, pacote/configuração/hashes, operação/execução,
checks, erros permitidos, limitações e custos devem ser registrados. Cada
observação distingue `fato-validado|hipotese|simulacao|pendente`. Sem mídia/texto,
segredo, URL assinada ou política IAM integral; IDs privados ficam fora do Git.

Timeout/interrupção: localizar a operação original, coletar e manter inconclusivo,
sem retry/provider/reinstalação/recriação automática. Excluir/cancelar somente
após aprovação dos alvos exatos. Preservar evidência antes de retirar Job,
digest/registry e conta exclusivos. Recursos reutilizados ficam intactos;
logs/backups/soft delete podem manter custo, exclusão não reverte cobrança.

| Item                                       | Estado nesta preparação                         |
| ------------------------------------------ | ----------------------------------------------- |
| Controles/código/provas locais             | Validado localmente; sem prova cloud            |
| Projeto/billing/APIs/registry/IAM atuais   | Pendente de consulta autenticada aprovada       |
| Preço regional/moeda/orçamento             | Pendente                                        |
| Imagem exata aprovada para publicação      | Bloqueado por revisão de segurança pendente     |
| Compatibilidade dos guards cloud           | Pendente de diagnóstico/syscalls                |
| Harness/seed operacional                   | Pendente de implementação/revisão próprias      |
| SQL/GCS/Tasks e retirada/custo recorrente  | Pendente; não provisionados por esta preparação |
| Admissão da 020/qualidade/liberação da 021 | Não aprovadas                                   |

Próxima ação proposta: autorizar **somente** inventário de leitura da etapa 1
com identidade existente. Sem autorização derivada de grants, APIs, push, Job
ou provider. Esta preparação não executou gcloud nem usou ADC.

## Verificação desta preparação — 2026-10-12

Somente documentos/modelo vazio e links de navegação foram alterados. Os 419
fontes/testes/configurações da fotografia técnica continuam byte-idênticos,
SHA-256 `1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`.
Nenhum status/checksum SDD, runtime, Terraform, dado privado ou arquivo de
performance foi modificado. Não renovar evidências de implementação por editar
um plano.

Oito testes de `worker-isolation-probe`, `worker-isolation-image` e
`worker-resource-profile` aprovados via `node --test`, com JDK 23 já instalado;
zero falhas/skips. A primeira invocação não localizou Node por PATH restrito
manualmente; corrigido somente o ambiente do comando, preservando o PATH
existente. Não houve instalação, alteração de teste ou relaxamento de guard.

Modelo JSON parseado, campos de execução/custo/aprovação vazios/false
conferidos; 99 links relativos nos documentos de navegação validados.
Prettier direcionado e `git diff --check` do módulo aprovados. Não reexecutados
Maven global, suíte mobile/web ou testes nativos completos nesta parcela
documental; as provas anteriores conservam suas datas/escopos. Nenhuma ação
autenticada ou prova cloud foi apresentada como executada.

## Inventário executado, somente leitura — 2026-10-12

Ruan respondeu «Autorizo» à consulta usando a credencial existente, sem
instalar componentes, alterar configurações ou executar Jobs. Nove comandos
estáveis do CLI 583.0.0 concluíram exit 0 entre 15:29:57 e 15:30:06 UTC:
versão, configuração da origem de credencial, identidade ativa e os seis
comandos de projeto/billing/APIs/registry/Run da etapa 1.

Uma identidade ativa existente, sem impersonação, token-file ou override de
credencial configurados. Conta/tokens não publicados; ADC pessoal não inspecionada
ou substituída. Manifests dos componentes do SDK byte-idênticos antes/depois;
nenhum componente instalado, login ou mudança de configuração solicitados.
O CLI pode atualizar seus logs/cache de autenticação ao usar a credencial;
isso não foi tratado como grant ou alteração da ADC.

| Item                      | Resultado validado nesta consulta                                                         | Limite                                         |
| ------------------------- | ----------------------------------------------------------------------------------------- | ---------------------------------------------- |
| Projeto                   | `toonlira-rm`, lifecycle ACTIVE                                                           | Não valida quota ou implantação                |
| Billing                   | `billingEnabled=true`                                                                     | Não comprova crédito gratuito, saldo ou teto   |
| APIs para diagnóstico     | Run e Artifact Registry habilitadas                                                       | Não valida criação/push/execução               |
| APIs existentes de OCR    | Vision, IAM Credentials e Storage habilitadas                                             | Nenhuma chamada OCR ou acesso a mídia          |
| APIs da integração futura | SQL Admin, Tasks, Secret Manager, Compute, Service Networking e Translation desabilitadas | Não habilitadas; não necessárias ao Job mínimo |
| Registry em São Paulo     | Zero repositórios                                                                         | Não cobre outras regiões ou permissões futuras |
| Jobs em São Paulo         | Zero Jobs                                                                                 | Nenhuma execução ou criação                    |
| Services em São Paulo     | Zero Services                                                                             | Não cobre outros produtos/regiões              |

Origem/região das listagens: projeto explícito e `southamerica-east1`.
Zero recursos listados não é validação de IAM privado, nem ausência de recursos
em todo o projeto. Permissões de leitura foram exercitadas; criação, push,
`actAs`, invocação, alteração IAM e exclusão continuam pendentes de avaliação.
Nenhuma política IAM integral foi consultada ou inferida.

Registro privado exclusivo `inventory.json`, com comandos/datas/resultados
sanitizados, SHA-256
`a1a614ca08f9e4632c7d88cb29268fbebb8fb9da08ab1fec18b045bcd69da04d`.
Não contém tokens; identidade representada por fingerprint privado, não
publicada. Erros de consulta: nenhum. Segurança, compatibilidade nativa,
orçamento e operação continuam sem aprovação, portanto o recibo registra
inventário concluído **com bloqueios das etapas futuras**, não falha das consultas.

Próxima parcela: revisar segurança da imagem exata de diagnóstico e renovar
a cotação regional antes de propor registry/push/conta/Job. As APIs da stack
completa ficam desligadas. Não há autorização derivada para recurso, download,
provider, imagem de mangá ou cobrança; nenhuma dessas ações ocorreu.

Continuação de 12/10: a [revisão prévia da imagem e cotação](diagnostic-publication-review-2026-10-12.md)
confirmou integridade da candidata de diagnóstico, mas exige base CVE válida
para nova varredura. Cotação regional também permanece inconclusiva; nenhuma
publicação/criação/execução foi autorizada ou realizada por essa revisão.

Parcela posterior, com autorização de download e remoção: scan local com base
OS válida concluído, mesmos achados residuais e cache temporário descartado.
Ver a seção de base atualizada da revisão. Isso resolve a pendência da varredura atual,
não cobertura/alcance de segurança, cotação ou autorização de publicação.

Continuação posterior: tarifa pública de **Jobs em São Paulo** confirmada por
leitura dos dados regionais embutidos no HTML oficial, sem credenciais. Para
2 vCPUs/8 GiB, computação bruta USD 0,0000624/s; 60 s ≈ USD 0,003744,
sem registry/rede/logs/impostos ou garantia de free tier/teto. Esse resultado
substitui a pendência de cotação regional, não a referência histórica de Iowa
acima. Triagem local verificou sete caminhos de executáveis, sem análise
dinâmica integral: achados residuais e cobertura do Java continuam abertos.
Ver a seção de triagem complementar na revisão. Nenhuma criação, publicação,
execução paga ou admissão do worker foi autorizada/realizada por essa conferência.

Decisão posterior: Ruan aceitou explicitamente o **risco residual restrito da
candidata de diagnóstico**, não produção ou execução paga. Preparado o próximo
pedido de criação do registry temporário `toonlira-diag-20261012` em São Paulo,
com pré-flight IAM/disponibilidade, scanner pago desabilitado e término vazio.
Nenhum uso de credenciais, criação ou push nesta parcela. Ver a seção final da
[revisão](diagnostic-publication-review-2026-10-12.md), que mantém achados,
cobertura incompleta e autorização financeira separados desse aceite.

Após autorização específica de criação e consultas, o registry temporário
foi criado em 12/10 às 18:49:32 UTC e verificado **vazio**, sem grants públicos
no IAM direto/projeto e com scanner `DISABLED/SCANNING_DISABLED`. Cadeia sem
pasta/organização. O papel padrão do service agent gerenciado foi observado
após aumento da contagem de bindings; não houve grant manual e o diff integral
anterior não foi preservado. Detalhes/recibos na seção final da revisão.
Nenhum push, conta de runtime, Job ou compute executado; recurso permanece
existente. Retirada e etapas seguintes ainda precisam de escopo/autorização.

Push posteriormente autorizado e concluído em 12/10 às 19:00:57 UTC, sem
Job. Digest remoto idêntico à candidata revisada; config e nove camadas
conferidos via manifesto remoto. Uma imagem, scanner desabilitado e IAM sem
grants públicos reconfirmados. Autenticação temporária e alias local removidos,
imagem original preservada; recurso/artefato cloud permanecem existentes e
armazenamento pode cobrar. Nenhuma conta de runtime ou execução preparada por
suposição. Próximo pedido será da conta dedicada sem chave/papéis; detalhes
na seção final da revisão, preservando as condições de retirada e custo.

Criação da conta dedicada autorizada posteriormente, mas pré-flight interrompido
em 12/10 às 19:24:21 UTC: `iam.googleapis.com` desligada. Zero tentativas de
criação, sem habilitação automática. Nome/IAM/chaves da conta ainda não
verificados; não tratar aprovação como recurso existente. Próxima confirmação
é somente para habilitar IAM API e então retomar a criação já autorizada.
Registry/imagem continuam presentes, sem Job ou execução. Recibo e bloqueio
na seção final da revisão.

Após confirmação específica, `iam.googleapis.com` habilitada e conta dedicada
criada em 12/10, com zero chaves de usuário e sem grants à conta no projeto/
registry consultados. Políticas desses escopos iguais antes/depois; nenhuma
impersonação/token da conta. Tentativa CLI preparatória não suportada preservada
separadamente, sem mutação; consulta corrigida para listagem GA existente.
Conta/artefatos permanecem existentes, sem Job ou execução. Próxima proposta
é somente criar o Job privado 1 task/2 CPU/8 GiB, retries zero, timeout 60 s,
scratch 512 MiB e imagem por digest, sem `--execute-now`; sujeito a aprovação
própria e readback. Não afirmar isolamento nativo por configuração declarada.

Job posteriormente autorizado e criado em 12/10 às 19:37:12 UTC; readback
confirmou digest, conta dedicada, 1 task/paralelismo, retries zero, 2 CPU/8 GiB,
timeout 60 s, Memory scratch 512 MiB em `/work`, gen2 declarado e nenhum
override/porta/secrets. IAM sem grants públicos e listagem de **zero execuções**;
política do projeto idêntica antes/depois. `Ready=True` não é execução ou
aprovação operacional. Próxima autorização será de uma única execução paga,
com captura da mesma rodada sem retry e coleta do probe; custo/limites e
recibo na seção final da revisão. Nenhuma prova nativa ou admissão da 020.

Execução posteriormente autorizada e concluída em 12/10 às 20:04:22 UTC,
sem overrides/provider/mídia e sem repetir o disparo. Probe real capturado:
**9 PASS / 3 FAIL / 6 UNKNOWN**, identificação de cgroup divergente e controles
obrigatórios não observáveis pelos parsers atuais. Não avançar para etapas
3–4, flexibilizar guards ou interpretar sucesso do Job como admissão. Limite
de endereço unlimited esperado no probe sem bootstrap; noexec é observação
adicional. Resultado, hashes, interpretação limitada e retirada proposta:
[diagnóstico cloud real](diagnostic-cloud-result-2026-10-12.md).

Job/registry/conta permanecem existentes; exclusão ainda não autorizada.

Retirada posteriormente autorizada e concluída em 12/10 entre 20:17–20:18 UTC:
somente Job, registry com sua única imagem e conta dedicada. Ausência confirmada
por listagens bem-sucedidas; zero outra dependência nas listagens globais Cloud
Run. IAM do projeto, APIs e demais contas preservados, incluindo `ocr-eval`;
nenhuma ação no site, bucket OCR, logs ou performance. Imagem/export e oito
artefatos locais conferidos por hash, sem apagar evidências. Pré-flight inicial
com formato de pacote incompatível preservado sem mutação, depois corrigido e
revalidado em rodada exclusiva. Oito testes leves continuam verdes; gates
globais não reexecutados e diff-check alheio continua documentado.

Estado corrente: **diagnóstico encerrado e recursos temporários retirados;
admissão operacional pendente de decisão arquitetural**. Não avançar para
bootstrap/integrar SQL/GCS/Tasks ou relaxar guards. 020/021 e defaults continuam
inalterados. Recibos, recuperação e limites no
[diagnóstico cloud real](diagnostic-cloud-result-2026-10-12.md).

Após pedido explícito para continuar a decisão de isolamento, comparação pública
e reconciliação do código recomendaram uma VM Compute Engine temporária com
Docker/cgroup v2 como próximo **candidato de prova**, não migração aprovada.
Container mantém 8 GiB; margem de RAM do host não substitui os guards. GKE tem
obstáculo no `podPidsLimit` documentado; não repetir Cloud Run idêntico sem nova
hipótese. Requisitos, sequência, pendências de custo e pré-flight somente leitura
estão na [proposta](worker-isolation-target-options-2026-10-12.md).
Nenhuma credencial, instalação, recurso novo, upload ou chamada paga nesta análise.
020/021 permanecem inalteradas; não confundir recomendação com observação na VM.

Pré-flight Compute posteriormente autorizado em 12/10: projeto/faturamento
ativos e 34/34 permissões solicitadas no projeto retornadas. **API Compute
desabilitada**; quota/zona/SO/rede não consultados, sem habilitação implícita.
Conta Compute padrão já existente/ativa; políticas efetivas consultadas via
Resource Manager v1 retornaram boolean sem campo explícito, com limitação do
verificador/formato preservada. Nenhuma proteção restritiva presumida, grant
ou troca de identidade. IAM do projeto/manifests CLI sem alteração; zero VM,
upload, chamada paga ou instalação. Recibos e próximo pedido delimitado de
habilitação constam na [proposta corrente](worker-isolation-target-options-2026-10-12.md#8-pré-flight-autorizado-bloqueado-pela-api--2026-10-12).

Após confirmação específica, um pedido de habilitação de Compute foi enviado
em 12/10 às 18:27 de Brasília. Timeout local não foi repetido; operação original
reconciliada por GET confirmou término sem erro. Compute habilitado e OS Login
também observado na lista; dois bindings de service agents adicionados, nenhum
removido/público. Roles OCR e conta padrão inalterados; Editor desta última era
preexistente, não grant novo do executor. Zero VMs/discos globais. Rede default
observada com regras permissivas e PGA desligado em São Paulo, sem baseline
anterior que prove criação nesta operação; nenhuma regra/rede alterada.
Recibos e limites na [continuação](worker-isolation-target-options-2026-10-12.md#9-compute-habilitado-e-efeitos-conferidos--2026-10-12).
Próximo passo ainda é quota/zona/SO e receita privada/cotação, não provisionamento.
020/021 e os guards permanecem inalterados; sem mídia/provider/compute iniciado.

Pré-flight retomado em 12/10 às **18:43 de Brasília**, somente leitura: quotas
com folga para a candidata, três zonas `UP`, catálogo `e2-highmem-2` com
2 vCPUs/16.384 MiB e metadata exata COS `cos-125-19216-739-5`. IAM/SDK sem
drift; nenhuma instalação/download, criação ou execução paga. Catálogo não é
reserva de capacidade nem prova de controles/patches do host.

[Receita candidata e cotação regional](worker-isolation-vm-recipe-2026-10-12.md)
registram VPC/subnet privadas próprias, PGA, SA somente reader do registry,
container sem rede e saída serial pela API sem SSH/IAP. Dez minutos hipotéticos
de VM+disco padrão 10 GiB ≈ US$ 0,02405, sem teto/autorizações ou custo total
presumido. Launcher/coletor local, segurança e alvos exatos ainda pendentes;
não criar recursos ou executar para resolver essas pendências. 020/021 e todos
os defaults permanecem inalterados, sem tocar performance/site/OCR.

Após «Vamos indo», [preparação local do launcher/core de coleta](worker-isolation-vm-preparation-2026-10-12.md)
gerou pacote exclusivo com hashes e testes sintéticos. Nenhum cloud-config
publicado, serviço iniciado, credencial usada, scan novo ou pacote instalado.
Adapter Google e prova Linux/device/boot/segurança do pin continuam abertos;
isto não é operação na VM ou nova autorização financeira. 020/021 inalteradas.

Posteriormente, [adapter de consulta preparado e COS identificado](worker-isolation-vm-reader-2026-10-12.md):
31 testes leves offline; somente metadata pública de pacotes lida via HTTPS,
sem credencial, software/instalação, recurso novo ou chamada a provider. Revisão
CVE/backports/JRE e prova Linux/host continuam próprias. Nenhuma autorização
de VM/publicação/grant/execução ou promoção da 020 foi inferida desta preparação.

Em 13/10, a [revisão parcial de segurança da VM](worker-isolation-vm-security-2026-10-13.md)
encontrou nos fontes Docker pinados a lógica associada ao risco DNS/TLS do pull
(CVE-2026-92543), sem correção comprovada. Criação/execução continuam bloqueadas;
container sem rede/digest fixo não protegem a credencial usada pelo daemon do
host. Nenhum exploit, SO novo, instalação, credencial ou recurso foi utilizado.
JRE coincide com o metadata oficial atual, mas cobertura integral do runtime e
prova Linux continuam pendentes. 27 testes locais passaram, sem promover a 020
ou abrir a 021; próxima parcela busca pin corrigido ou desenho de mitigação,
não publicação/provisionamento. Performance e gates históricos preservados.

Em continuação, [COS 133 e mitigação privada investigados](worker-isolation-private-pull-2026-10-13.md):
o fonte correto da segunda LTS também mantém a lógica de registry problemática,
sem trocar a candidata. Preparado/testado um rascunho puro de DNS privado e
egress ao VIP, não implantação ou prova de host. 34 testes locais aprovados,
sem credenciais/instalação/recursos/providers. API/zona DNS seriam custo novo
que exige confirmação específica futura; guard Linux e demais gates ainda
pendentes. Nenhuma criação, alteração do launcher anterior ou promoção da 020/021.

Em seguida, [guard Java e integração pré-pull preparados localmente](worker-isolation-prepull-guard-2026-10-13.md):
hashes/prazo precedem o pull, sem alterar o pacote anterior. Fixtures DNS/TLS e
falhas nativas passaram na imagem Linux existente com rede bloqueada; nenhuma
credencial, DNS/TLS real, instalação ou VM. JRE dedicado ainda aguarda autorização
de preparo; não presumir runtime presente no COS, prova operacional ou correção
do Docker. Cloud DNS, criação/custo e instalação no host continuam próprios.

Após continuação autorizada para o preparo local, [JRE dedicado copiado e testado](worker-isolation-prepull-runtime-2026-10-13.md):
aproximadamente 381 MiB adicionais, origem/topologia e bindings reais conferidos,
sem rede de serviço, pacote novo, instalação ou credencial. Teste ocultou o JRE
base e executou a cópia; não prova COS/segurança do runtime. Bootstrap privado
anterior ao pull ainda requer desenho/validação e ações próprias; nenhuma
publicação, reaproveitamento de OCR ou promoção da 020/021.

Na continuação, [entrega pré-pull desenhada e filesystem sintético verificado](worker-isolation-prepull-delivery-2026-10-13.md):
disco auxiliar read-only é candidato de entrega, não recurso provisionado.
53 testes Node aprovados; fixture ext4 local de 8 MiB criada/verificada com
utilitários existentes, sem instalação ou privilégio. Nenhuma credencial,
upload ou recurso cloud. Importação, topologia pré-Java, montagem/bindings,
segurança COS/JRE e orçamento/aprovação permanecem pendentes. 020/021 inalteradas.

Na mesma parcela, após autorização para adiantar e explicitar limite local,
o pacote real de dados foi montado/verificado offline: cerca de 251 MiB físicos
novos, pico de 383 MiB abaixo de 512 MiB. Readback de conteúdo/links e hash dos
1 GiB lógicos no archive aprovados; cópia temporária de conferência removida,
recuperável do disco preservado. Não houve upload, instalação, credencial ou
recurso cloud. Checker pré-Java, bindings, importação e prova COS continuam
necessários; pacote local não aprova operação ou corrige o risco do pull.

Em seguida, [montagem e inventário pré-Java integrados localmente](worker-isolation-prepull-mount-2026-10-13.md):
novo launcher exige source/tipo/opções read-only, compara inventário de 335
entradas e âncoras independentes antes de Java/pull. 61 testes Node e nove checks
nativos com fixtures sintéticas aprovados. Nenhum dispositivo montado, serviço
systemd iniciado, pacote instalado, credencial/upload/recurso cloud utilizado.
Importação, boot COS e gates de segurança/custo continuam abertos; 020/021
inalteradas, pacotes anteriores e performance preservados.

Em 14/10, [pré-flight documental de importação e IAM](worker-isolation-import-preflight-2026-10-14.md)
confirmou mínimo de 10 GiB para o disco auxiliar pd-standard, além do boot.
RAW direto continua candidato sem Cloud Build; aceitação do archive e principal
de leitura privado não foram comprovados. Divergência de preços na UI pública
foi registrada, sem inventar tarifa/total regional validado. Nenhuma consulta
autenticada ao projeto, upload, grant ou recurso criado; próximo passo é uma
consulta IAM/APIs somente leitura, sujeita à autorização de credencial. Segurança,
custos e boot reais permanecem próprios; 020/021 e defaults inalterados.

Após confirmação, [IAM/APIs/service agents consultados somente leitura](worker-isolation-import-iam-2026-10-14.md):
projeto ativo, APIs necessárias habilitadas, Compute Service Agent já vinculado
e IAM/SDK sem drift. 23 permissões retornadas em teste de projeto; seis de
Storage seguem pendentes por recurso, sem inferir ausência/grant necessário.
66 testes Node locais aprovados. Nenhuma criação, upload, instalação, grant,
API enable ou provider. Importação/custos/segurança/boot continuam próprios;
020 aberta e 021 bloqueada, performance e defaults preservados.

Na mesma data, [cotação regional e receita de entrega privada](worker-isolation-import-recipe-2026-10-14.md)
resolveram a divergência visual por dados públicos de São Paulo: disco zonal,
custom image e Storage. 72 testes Node locais aprovados; archive e fotografia
técnica inalterados. Staging privado é a próxima parcela proposta, sujeita à
autorização de credencial/upload/custo e retirada. Nenhum recurso, instalação,
grant ou provider. Aceitação do RAW, importação, montagem COS e segurança do pull
seguem abertas; não há autorização de VM ou promoção da 020/021.

Após «Sim», [staging privado do runtime comprovado](worker-isolation-private-staging-2026-10-14.md):
um bucket/objeto em São Paulo, SHA-256 local/remoto igual, acesso privado e
retirada ativa confirmados. O erro local no corpo 204 não causou novo delete
do objeto. Consulta do bucket soft-deleted recusada (403), sem alteração IAM;
retenção temporária não significa eliminação física. 83 testes locais aprovados,
runtime/fotografia técnica/performance preservados. Nenhum Compute/DNS/provider;
importação, boot/segurança e autorização das próximas parcelas continuam abertas.

Na continuação da meta, [preparação local da observação de importação](worker-isolation-image-import-preparation-2026-10-14.md)
entregou planner/observer JavaScript com IDs/UUIDs, prazo, cancelamento, confirmação
perdida, origem estável e retirada não executável. 99 testes locais aprovados;
fixture distingue operação simulada de archive local real. Seleção da geração
no RAW URL não está documentada claramente e permanece candidata, sem fallback.
Nenhuma credencial ou mutação cloud; execução real exige aprovação própria.
Segurança/admissão/qualidade/020/021 permanecem abertas, sem promover defaults.

Enquanto a autorização da imagem real permanece pendente, [transporte e journal de importação preparados offline](worker-isolation-import-execution-offline-2026-10-14.md):
uma tentativa, claims persistentes, handles/UUIDs e recuperação sem novo create;
retirada exige identidade/terminalidade/ausência e preserva origem na incerteza.
131 testes locais aprovados, com filesystem real e HTTP/credencial sintéticos.
Sem recursos/credenciais Google, instalação ou alteração de runtime/020/021.
Aceitação RAW/geração, operador real e todos os gates de segurança continuam abertos.

Após «Autorizo», a [tentativa real de importação direta](worker-isolation-image-import-real-2026-10-14.md)
criou nova origem privada, comprovou upload/readback e observou uma operação de
insert até DONE sem erro da API. A admissão estrita dos metadados não foi
confirmada; a captura local não preservou quais predicados divergiram. Não é
aprovação de READY/geração/filesystem nem evidência de rejeição do archive.
Imagem própria retirada por operação terminal e GET 404; objeto/bucket ativos
também removidos com precondições e confirmação. Retenção temporária permanece
separada de eliminação física. Diagnóstico offline adicional preparado, sem
recriação/fallback, grant, instalação, disco, VM ou provider. 151 testes locais
aprovados; 020 aberta, 021 bloqueada, defaults/runtime/performance preservados.

Com limite autorizado de US$ 5, [duas provas diagnósticas de origem](worker-isolation-source-echo-budget-2026-10-14.md)
confirmaram imagem READY, 1 GiB, região e arquitetura corretas. O único
predicado divergente foi o eco da origem: no GET detalhado, `rawDisk.source`
estava presente como string vazia. Isso não comprova seleção da geração ou
filesystem, mas distingue o finding de falha da API/ausência de READY. O
validador estrito e receipts anteriores foram preservados, sem fallback.
Ledger compartilhado reserva US$ 1 por rodada, margem histórica e contingência;
não é teto do provedor ou gasto faturado. Ambas as imagens e origens ativas
foram retiradas e confirmadas ausentes, com retenção temporária separada.
163 testes locais aprovados; sem novas importações para repetir o diagnóstico,
VM/disco, instalação, IAM ou provider. Próximo gate é a prova independente do
disco/montagem e segurança do host; 020/021/defaults permanecem inalterados.

Na continuação, [prova mínima de montagem/conteúdo preparada offline](worker-isolation-mount-only-preparation-2026-10-14.md):
sem executar Java/Docker/provider, preserva o path absoluto dos manifests e
separa a conferência do dispositivo RO, montagem noexec e inventário/hashes.
13 testes Node novos e 11 checks nativos com fixtures aprovados; nenhuma
montagem real, VM/disco/credencial Google ou nova reserva financeira.
YAML preserva os bindings, mas ferramenta systemd está ausente da imagem local;
instalação não iniciada. Sintaxe/runtime COS, binding por IDs, segurança,
cotação completa e criação/retirada continuam pendentes, sem ampliar aprovação
do worker ou promover 020/021.

Em 15/10, após aprovação da instalação local, a [verificação systemd em imagem descartável](worker-isolation-systemd-verification-2026-10-15.md)
conferiu os 19 pacotes oficiais pinados e verificou cinco unidades revisadas
sem avisos, com controles negativos. Corrigiu path do blockdev e retirou a
interpretação indevida do check antigo que aceitava comando ausente. Imagem
local acrescenta cerca de 21 MiB no tamanho Docker; container de instalação
removido. Nenhum Google Cloud, credencial, provider ou reserva nova; segurança
do host, utilitários/runtime COS, binding por IDs, cotação e montagem real
continuam pendentes. 020 aberta, 021 bloqueada e defaults preservados.

Ainda em 15/10, [binding e pré-flight da montagem](worker-isolation-mount-binding-2026-10-15.md)
acrescentam contrato de identidade/serial bounded e plano parcial de retirada,
testados com transporte falso. Consultas reais GET confirmam o mesmo projeto,
metadados comuns vazios, COS pinado READY e definição E2 candidata, sem recursos
criados ou reserva nova. A comparação inicial incorreta entre ID Compute e
project number foi corrigida sem mudar o pin Resource Manager. Fontes COS
retornaram 401 e a página de preço E2 excedeu o limite de leitura; revisão
do host, cotação completa, adapter agregado e lifecycle permanecem pendentes.
Exceção de metadata/DNS não é bloqueada pelo deny VPC; não anunciar rede
totalmente desligada ou aprovação do worker. 020/021 e defaults inalterados.

A cotação avançou por alternativa pública: após 403 no catálogo (sem habilitar
API), navegador com São Paulo selecionado e leitor de armazenamento existente
confirmaram as tarifas regionais. Envelope de planejamento de US$ 0,66 inclui
folgas explícitas, mas não é cotação completa, fatura ou teto do provedor.
Nenhum slot financeiro novo reservado; o executor continua não admitido por
segurança e lifecycle incompletos, não por falta de autorização repetida.

A [continuação de coleta HTTP e recuperação](worker-isolation-mount-transport-2026-10-15.md)
implementa a agregação de configuração/serial e retirada Compute por alvos
pinados, com journal durável, confirmação de ausência e proteção contra segundo
DELETE após resposta perdida. Testes usam somente API falsa e IDs sintéticos;
nenhuma credencial, instalação, criação ou reserva financeira nova. Conexão com
staging/gerações, criação e recuperação completas, revisão COS e cotação ainda
impedem admitir a VM. A 020 permanece aberta, 021 bloqueada e defaults intactos.

Na [retirada integrada com staging](worker-isolation-mount-lifecycle-2026-10-15.md),
o caminho de escopo completo conhecido passou a exigir criações Compute
terminais antes de liberar a fonte. Objeto/bucket têm ownership, versões,
tentativas duráveis e ausência ativa conferidos; testes integrados usam somente
API falsa. Não resolve criação parcial ou handle perdido, não executa a VM e
não comprova expurgo físico. Sem nova reserva, instalação ou credencial;
criação/recuperação completas, revisão COS e cotação seguem pendentes, sem
promoção da 020 ou liberação da 021.

A [continuação de registro progressivo](worker-isolation-progressive-recovery-2026-10-15.md)
distingue recurso não tentado de resposta perdida, fecha novos inserts antes da
recuperação e testa retirada parcial sem IDs fictícios. GETs reais confirmaram
filtro por UUID e envelope canônico sem `items` nas três listas de operações;
parser novo corrigido com regressão, sem transformar busca vazia em confirmação.
Naquela parcela, mutadores, integração parcial com staging e crash do mutex
continuavam pendentes, além de requests aprovados, revisão COS e orçamento.
Sem nova reserva/instalação ou chamada OCR/tradução; estados/defaults inalterados.

A [recuperação após interrupção](worker-isolation-crash-recovery-2026-10-15.md)
entrega o journal com lock do sistema operacional e publicação atômica, além da
ligação de staging ao plano parcial sem IDs fictícios. Testes locais com SIGKILL
e API falsa; nenhuma consulta/mutação cloud. Requests aprovados, mutadores Compute
HTTP, revisão COS e cotação completa continuam bloqueando uma nova VM real.

A [revisão dos requests e da barreira de rotas](worker-isolation-request-review-2026-10-15.md)
entrega composição semântica vinculada ao journal/staging e registra que criar a
VPC gera uma default route incompatível com o snapshot exigido. Plano de retirada
restrito à rede própria, testado com IDs sintéticos; ainda sem mutação ou journal
de execução dessa rota. A VM não foi liberada contando apenas com o firewall.

A [continuação do journal da rota](worker-isolation-route-journal-2026-10-15.md)
implementa envio único, transporte HTTP restrito e confirmação terminal/ausência
com API falsa e journal durável. Não executa DELETE real nem libera VM: falta
ligação ao driver completo, mutadores de criação, revisão COS e admissão de custo.

O [driver de criação com barreira](worker-isolation-guarded-driver-2026-10-15.md)
integra a confirmação da rota ao claim e ao encaminhamento da VM. Concorrência,
reaparecimento da rota e expiração durante as consultas são testados com journals
duráveis e transporte falso. Sem liberação cloud: faltam ligação do ciclo completo
à admissão real, revisão COS e cotação/reserva completas.

O [transporte HTTP de criação](worker-isolation-create-http-2026-10-15.md)
agora compõe o driver internamente e testa os oito POSTs canônicos contra API
falsa, com journal durável, verificações frescas e ausência de replay após falha.
Não executa nenhuma criação no Google nem entrega admissão operacional;
os gates de segurança e custo permanecem fechados.

A [retirada integrada de rota, Compute e origem](worker-isolation-teardown-2026-10-15.md)
fecha a composição de teardown com API falsa e journals duráveis. Resolve
operações DELETE antes de aceitar 404, sem replay, e preserva a origem quando
houver incerteza. Não remove recursos Google; integração do ciclo completo com
admissão real, revisão COS, cotação/reserva e prova operacional seguem pendentes.

O [ensaio do ciclo mínimo](worker-isolation-cycle-2026-10-16.md) compõe os
adapters existentes com captura validada pelos IDs do journal e cleanup
independente do cancelamento principal. HTTP, metadados e serial são sintéticos;
não executa montagem/renderer nem resolve os adapters de observação e admissão
reais. A origem é preservada se o contexto/encerramento continuar incerto.

A [ligação HTTP posterior](worker-isolation-http-readers-2026-10-17.md) reaproveita
o reader completo e acrescenta contexto inicial da rota e guards de escopo na
fronteira de envio. Detecta routers cross-region e policy efetiva antes de criar
a VM; todo o ensaio permanece com servidor falso e sem aprovação operacional.

O [pré-flight de leitura em 17/10](worker-isolation-read-preflight-2026-10-17.md)
renovou identidade/projeto/COS/máquina e observou Compute/Storage habilitados,
com as treze permissões de observação retornadas no teste IAM do projeto.
Não criou recursos nem ampliou papéis. Essa consulta real não é execução dos
endpoints de firewall nos recursos futuros, IAM completo, aprovação COS/custo
ou prova do worker. A admissão operacional continua fechada.

O [suplemento posterior](worker-isolation-cost-supplement-2026-10-17.md) renovou
preços regionais e conferiu a distinção entre importação manual, armazenamento,
operações e tráfego. O envelope segue provisório, sem reserva nova; a revisão
estática da prova mínima não corrige os findings ou admite o worker completo.

A [reconciliação de schema](worker-isolation-schema-reconciliation-2026-10-17.md)
preserva o pré-flight inconclusivo e registra o formato real dos agregados vazios
e da coleção de políticas omitida. A correção é local/versionada e não comprova
boot; permissões da imagem e acesso Storage ainda exigem resolução no escopo
correto, sem ampliar IAM automaticamente.

A [ligação do staging ao ciclo](worker-isolation-staging-handoff-plan-2026-10-17.md)
preserva o plano e a primeira parcela do journal. O
[produtor e handoff](worker-isolation-staging-transport-2026-10-17.md) posteriores
estão testados localmente em conjunto, com archive físico e HTTP falso. A ligação
codificada não aprova criação real, seletor de geração de importação ou boot COS.
Não executar o ciclo usando metadados de fixtures como observações de Storage.

A [recuperação parcial](worker-isolation-staging-recovery-2026-10-17.md)
acrescenta tooling local para falha anterior ao handoff, com dono realmente
encerrado e journal separado. Foi testada com efeitos falsos; não é
cleanup real, solução automática de crash ou aprovação operacional do COS.

A [revisão de admissão](worker-isolation-admission-review-2026-10-17.md)
corrige o resumo sobre o prazo: requests/binding já exigem DELETE após 600 s,
mas isso não expira data disk/imagem/staging. A consulta real da política COS
retornou 403, sem grant ou boot; acesso efetivo e admissão continuam pendentes.

A [reprodução de criação recusada](worker-isolation-rejected-create-2026-10-17.md)
preserva os dois testes vermelhos como baseline histórico do ciclo v2. A
[integração v3](worker-isolation-rejection-integration-2026-10-17.md) exercita
os mesmos aceites contra a retirada nova, com recusa separada de operação e
handoff compatível. Não é aprovação de boot ou recuperação automática de casos
ambíguos.

A [limpeza de fonte verificada](worker-isolation-verified-source-cleanup-2026-10-17.md)
separa o caso anterior ao handoff de upload parcial e ciclo entregue. O handler
de cleanup-only mantém admissão própria, claim exclusivo e proibição de criação
Compute. O [supervisor local](worker-isolation-supervisor-2026-10-17.md) conecta
os checkpoints e exige posse confirmada. A configuração/admissão do entrypoint
real e a validação operacional continuam pendentes.

A [preparação do operador](worker-isolation-operator-preparation-2026-10-17.md)
confere os arquivos reais e permite regenerar o resumo sem SDK/rede. Dois GETs
reais observaram billing ativo, conta aberta e BRL; não é cotação ou autorização
de criação. O envelope USD não foi convertido arbitrariamente. Composição nativa,
revisão COS, custo aplicável e validação do worker completo permanecem abertos.

A [tabela da conta e cenário BRL](worker-isolation-account-pricing-2026-10-17.md)
agora têm observação real dos SKUs/taxa e reprodução offline. O resultado é
cenário, não fatura/teto garantido: a divergência entre fontes tributárias fica
explícita e não foi resolvida por alterar booleans de aprovação.

### Composição local do operador — 2026-10-18

Os [journals nativos](worker-isolation-native-journals-2026-10-18.md) e a
[composição concreta](worker-isolation-composition-2026-10-18.md) agora ligam os
registros duráveis ao supervisor e às fases de criação/retirada em testes locais.
O fluxo completo usa HTTP/credenciais/IDs/serial sintéticos; não houve boot real,
nova reserva ou chamada autenticada. O archive físico continua sendo de runtime,
não uma imagem de manga.

Identidade/transporte nativos, tickets de admissão, revisão COS e premissas
financeiras ainda impedem o CLI real. Esta parcela resolve a ligação dos journals,
não o aceite operacional do worker completo. A 020 e seus critérios mantêm o
estado aberto anterior, sem alterar a investigação híbrida ou a auditoria mobile.

A [camada nativa de identidade e HTTP](worker-isolation-native-io-2026-10-18.md)
foi ligada à composição com autorização de I/O separada. Testes usam SDK/HTTP
sintéticos, não sua conta real; não há nova reserva, alteração de SDK ou recurso.
O ticket e a ligação ao CLI continuam bloqueados pela admissão operacional.

A [revisão de admissão de 18/10](worker-isolation-admission-status-2026-10-18.md)
reconfirma integridade e regressões focais sem criação cloud. A receita mínima
não faz pull nem executa o worker; isso não equivale a segurança observada no
host. Custo/tributos/retirada ainda são hipóteses, não teto financeiro garantido.
Nenhuma reserva ou autoridade operacional nova foi inferida dessas verificações.

A autorização humana posterior aumentou o teto para
[USD 100 no total](worker-isolation-budget100-2026-10-18.md). Ledger novo sem
reservas e quatro leituras autenticadas nativas confirmaram projeto/metadados,
imagem pinada e máquina. Não houve criação cloud, e essa leitura não fecha
segurança/custo da receita mínima nem a validação do worker completo.

A [primeira execução nativa](worker-isolation-native-attempt-2026-10-18.md)
teve staging verificado e VPC criada, mas parou antes da VM. A limpeza inicial
ficou inconclusiva; recuperação exclusivamente GET/DELETE confirmou ausência
ativa Compute/rota/staging, sem nova reserva ou criação. Dois regressivos
reproduzem a suposição incorreta de DELETE retornar imediatamente DONE; o fix
e nova validação permanecem necessários, sem promover a 020 ou abrir a 021.

A [revisão posterior do acompanhamento Compute](worker-isolation-operation-polling-2026-10-18.md)
implementa espera GET-only limitada e preserva a reprodução histórica. A correção
é do executor privado da prova restrita, não aprovação operacional do renderer.

A [segunda rodada real e recuperação](worker-isolation-second-native-attempt-2026-10-18.md)
confirmou avanço após a rota até imagem/disco, sem criar VM. Ausência ativa foi
confirmada em retirada explícita; intenção não enviada e lock foram preservados.
Normalização de campo vazio omitido e tratamento normativo dessa intenção
continuam necessários antes de nova admissão. Não houve promoção da 020/021.

A mesma evidência registra a normalização posterior integrada ao ciclo offline,
sem credenciais ou cloud. Ela não libera nova rodada: o desfecho normativo da
intenção não enviada e os gates integrais da revisão continuam pendentes.

A [revisão posterior do journal](worker-isolation-unsent-journal-2026-10-18.md)
integra grant CAS antes do POST e distingue NOT_SENT de confirmação ambígua.
A consolidação offline passou, preservando os contextos e locks históricos;
o próximo gate é o operador de execução com admissão e preços válidos durante
toda a rodada. Nenhum recurso cloud ou reserva foi criado nessa revisão.

O [preparo local v4 posterior](worker-isolation-v4-preparation-2026-10-18.md)
revalida esses recibos e os locks históricos, com preços e billing renovados
por consultas somente leitura. A validade financeira deve cobrir também o
cleanup. Esse preview local não admite execução; ausência atual do escopo
antigo e ligação do operador ao runtime continuam no próximo gate.

A [revisão posterior do executor v4](worker-isolation-v4-executor-2026-10-18.md)
liga o runtime, o preparo financeiro e a leitura atual do escopo anterior.
O gate integral offline passou após uma falha de timing preservada, de causa
ainda não comprovada. A admissão técnica é limitada à prova de montagem;
não admite worker, provider, renderer ou promoção da 020/021.

A [terceira rodada real](worker-isolation-third-native-attempt-2026-10-19.md)
ultrapassou o disco de dados e criou o disco de boot, sem enviar a VM. O v4
retirou os recursos automaticamente sem fabricar operação para a intenção
não enviada. A montagem não foi comprovada; nova tentativa depende da
investigação offline do gate pré-VM, preservando o resultado negativo.

O [diagnóstico posterior](worker-isolation-prevm-preflight-2026-10-19.md)
reproduz o disparo do prazo de IO com leituras sequenciais e descreve o
candidato de preparação separada/GETs limitados em paralelo. Ele não executa
cloud e não transforma o resultado negativo anterior em montagem aprovada.

A [quarta rodada e retirada explícita](worker-isolation-fourth-native-attempt-2026-10-19.md)
chegou ao POST da VM, que recebeu HTTP 400 sem repetição. A recuperação somente
GET/DELETE confirmou ausência ativa e preservou o journal Compute original.
O diagnóstico posterior confirmou incompatibilidade E2 padrão/`TERMINATE`.
O avanço pré-VM não constitui prova de montagem; validar um perfil compatível
precede qualquer nova admissão. A 020/021 mantém o estado conservador.

O [contrato Spot](worker-isolation-spot-contract-2026-10-19.md) foi validado
offline com HTTP sintético e CAS local. Ele não contém executor nativo e
preserva a rejeição da combinação E2 padrão/`TERMINATE`, sem fallback para
`MIGRATE`. Nova prova exige fechar as lacunas de recuperação e renovar a
admissão específica do perfil; não usar preços antigos como cotação Spot.

A [revisão HTTP 400](worker-isolation-http400-protocol-2026-10-19.md) fecha
a lacuna do protocolo local com status real e duas provas de ausência antes
da retirada. O grafo foi testado offline; sua ligação ao executor/admissão
nativos ainda precisa de implementação e verificação próprias.

A [preparação da admissão Spot](worker-isolation-spot-admission-preparation-2026-10-20.md)
acrescenta cotação verificável e leitura real de quotas, sem mutação cloud.
Limite preemptible zero não foi convertido em aprovação de fallback;
o regime precisa ser esclarecido antes da nova prova restrita.

A [admissão e integração offline](worker-isolation-spot-admission-offline-2026-10-20.md)
ligam a política concreta ao grafo CAS5 e ao wrapper de ports existentes.
Essa parcela fecha a divergência de hash observada no ensaio integrado;
não executa cloud, não admite quota zero e não aprova o worker completo.

A [investigação N1](worker-isolation-n1-investigation-2026-10-20.md) registra
metadados reais e nova cotação do candidato `custom-1-1024`, sem modificar quota
ou criar VM. O contrato/admissão próprios e a validação operacional permanecem
abertos; não se trata de fallback automático ou aprovação de produção.

O [contrato e a admissão N1 offline](worker-isolation-n1-contract-2026-10-20.md)
foram entregues posteriormente, com quota STANDARD observada por GET e teste
integral sob bloqueador de rede/CLI. Ainda não há VM ou operador operacional N1
admitido. O [preflight real posterior](worker-isolation-n1-preflight-2026-10-20.md)
foi implementado e encontrou depreciação da imagem COS pinada. A consulta da
substituta não altera os pins antigos nem aprova o worker completo.
A [continuação COS73916](worker-isolation-cos-revision-2026-10-21.md) separa a
nova revisão local dos contratos e as cinco consultas reais do preflight da
execução futura. Ainda não houve VM N1 ou aprovação operacional do worker.
O [operador específico](worker-isolation-n1-operator-2026-10-21.md) foi integrado
posteriormente e validado offline. Sua preparação ainda falha fechada por falta
de entradas financeiras atuais; o caminho de execução não foi invocado.

Esse é o snapshot da preparação offline. Na [primeira execução N1 posterior](worker-isolation-n1-first-execution-2026-10-21.md),
as entradas foram renovadas e houve admissão/reserva, mas a composição parou no
handoff sem POST Compute ou prova de montagem. O staging privado foi retirado;
a causa exata da recusa e os gates do worker completo continuam abertos.

A [continuação de dispatch](worker-isolation-dispatch-freshness-2026-10-21.md)
corrige um defeito de prazo reproduzido localmente, sem afirmar que ele foi a
causa histórica da recusa. A composição final preserva as janelas de preparo
e POST e os bloqueios de grant/cancelamento; não houve nova execução cloud.

O [operador novo com dispatch corrigido](worker-isolation-fixed-operator-2026-10-22.md)
liga essa revisão ao coordenador local e acrescenta a reconferência do staging
retirado da quinta rodada. Os locks originais permanecem preservados; a
preparação financeira e a prova nativa continuam pendentes.

A [reconferência financeira posterior](worker-isolation-financial-readiness-2026-10-22.md)
validou os GETs dos pré-requisitos e identificou divergência de calendário na
cotação. A leitura de uma SKU pela API oficial foi possível, mas não constitui
cotação completa nem admissão nativa; não houve reserva ou mutação cloud.

O [leitor completo de preços pela API](worker-isolation-api-pricing-2026-10-22.md)
foi implementado e validado posteriormente, com contrato próprio e captura real.
A adaptação da admissão/operador permanece aberta; cotação não equivale a
execução ou aprovação do worker.

A [integração do operador API](worker-isolation-api-operator-native-2026-10-22.md)
foi validada posteriormente e houve uma prova restrita com nova reserva. A recusa
ficou no gate de metadados, sem POST Compute; a recuperação confirmou ausência
ativa do staging e preservou os journals. A contenção local de leituras do ledger
precisa de correção/teste antes de outra criação.

A [correção serial de reserva](worker-isolation-serial-reservation-2026-10-22.md)
foi validada posteriormente com ledger temporário real e HTTP falso. O novo
operador acrescenta a reconferência da sexta rodada retirada; a prova nativa e
os gates do worker completo continuam separados desse resultado offline.

A mesma continuação registra a sétima prova: sete criações Compute anteriores
à VM passaram, mas `instance / route-barrier` interrompeu o envio. A retirada
automática confirmou ausência ativa; a recusa será investigada offline antes
de outra criação. Não houve montagem comprovada ou admissão do worker.

A [preparação offline da barreira de rotas](worker-isolation-route-barrier-offline-2026-10-23.md)
reduz espera sequencial entre GETs independentes e mantém os predicates/timers.
O candidato ainda exige operador novo e prova nativa; não habilita o worker.

A [integração posterior do operador](worker-isolation-route-operator-native-2026-10-23.md)
acrescenta a sétima retirada às ausências obrigatórias e liga o grafo selecionado
a dados financeiros novos. O resultado da prova e os gates do worker completo
continuam distintos da aprovação offline.

A tentativa com esse operador foi recusada no pré-flight por depreciação da
imagem COS fixada, sem nova reserva ou recurso. A candidata indicada pelo
publisher precisa de revisão/pins/testes próprios; nenhum gate foi relaxado.

A [revisão offline COS7608](worker-isolation-cos7608-offline-2026-10-23.md)
prepara posteriormente esses contratos e a seleção explícita do grafo. Não
executa a imagem, cria reserva ou transforma metadados em aprovação operacional.

A [integração do operador COS7608](worker-isolation-cos7608-operator-2026-10-23.md)
foi seguida de uma prova restrita e recuperação explícita. A ausência ativa dos
recursos foi confirmada; o envio da VM e a montagem não foram comprovados.
O próximo diagnóstico é offline, sem repetir criação ou reutilizar os contextos.

O [diagnóstico subsequente do envio da VM](worker-isolation-vm-send-diagnosis-2026-10-23.md)
identificou por hash o GET de espelhamentos e reproduziu a camada adicional
anterior ao transporte. O candidato sobrepõe somente leituras independentes;
passou os cenários locais, mas não foi selecionado no operador nem executado
na cloud. A causa exclusiva da rodada e a validação operacional seguem abertas.

A [seleção em grafo separado](worker-isolation-vm-scope-graph-2026-10-23.md)
passou posteriormente pelo coordenador integral com transportes sintéticos,
incluindo cancelamento após grant e confirmação da criação perdida. Preserva
recibos e operador anteriores; não constitui nova prova cloud ou admissão de produção.

O [trace passivo da fronteira VM](worker-isolation-vm-boundary-trace-2026-10-23.md)
foi acrescentado e verificado localmente no coordenador e no I/O nativo. Ele
distingue pontos de falha sem alterar grants, retries ou cleanup.

A [integração posterior do operador com trace](worker-isolation-vm-trace-operator-2026-10-23.md)
comprovou um envio real da criação VM, seguido de terminal com
`ZONE_RESOURCE_POOL_EXHAUSTED`. Recursos ativos foram retirados e a auditoria
conferiu os recibos e ausências, sem repetir a criação. A zona B da mesma região
passou por consultas de metadados, não por alocação ou boot. Preparar a seleção
consistente dessa alternativa é o próximo trabalho; montagem, isolamento e
integração operacional da 020 continuam abertos.

O [grafo candidato B](worker-isolation-zoneb-graph-2026-10-23.md) passou depois
pelo coordenador completo offline, incluindo recusa de capacidade, cancelamento
e confirmação perdida. O gate confere preservação das políticas e rejeição de
journals de outra zona, mas não seleciona novo operador ou autoriza repetir a
criação. A integração da nona retirada e os pré-flights frescos continuam necessários.

A [integração do operador B](worker-isolation-zoneb-operator-2026-10-23.md) foi
posteriormente executada com essa guarda e consultas frescas. A rodada encerrou
com retirada após GET 429 do Resource Manager, antes de criar a VM. A comparação
posterior com/sem projeto de cota explícito retornou 200 nos dois casos: não
reproduziu nem explicou definitivamente o erro histórico. Montagem e admissão
operacional continuam abertas; o contexto encerrado não deve ser repetido.

O [candidato seguinte do I/O nativo](worker-isolation-crm-quota-native-2026-10-23.md)
explicita o projeto de cota somente no GET admitido do Resource Manager, sem
aceitar override do chamador ou repetir requisições. Também verifica cancelamento
após a admissão. A validação é offline; não resolve por si a causa do 429 nem
seleciona nova execução cloud.

A [guarda da décima retirada](worker-isolation-tenth-retirement-2026-10-23.md)
integra depois os onze alvos desse contexto ao conjunto anterior e ao coordenador
offline. Preserva validade curta, consultas limitadas e bloqueio antes de reserva
quando a prova da décima rodada estiver incompleta. Ainda não há seleção em novo
operador cloud ou evidência de montagem real.

O [operador seguinte com cota explícita](worker-isolation-quota-operator-2026-10-24.md)
seleciona depois o guard de 97 alvos e o transporte atualizado em entrada nativa
própria, com gates e captura financeira separados. O resultado da prova é
registrado nesse documento: a VM retornou erro de capacidade, a retirada foi
auditada e um candidato N2 passou somente por consultas de metadados. Montagem e
admissão do worker completo de 8 GiB continuam pendentes.

A [preparação offline posterior do N2](worker-isolation-n2-preparation-2026-10-24.md)
testa o perfil de host de 16 GiB, o guard de 108 alvos, o claim persistente de
execução única e o contrato de preços próprio com fixtures sintéticas. Ainda não
integra novo operador ou captura cotação N2 real. O limite do worker permanece
separado; boot, contenção e admissão operacional continuam abertos.

Os [leitores e coordenador N2](worker-isolation-n2-coordinator-2026-10-24.md)
integram depois os contratos N2 de metadata/quota, preço e guard de 108 alvos ao
ensaio integral offline. Transporte simulado, consultas reais de metadados e
criação de VM são evidências distintas; não inferir boot/worker operacional a
partir dos dois primeiros.
