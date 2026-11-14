# Plano de prova de isolamento no Cloud Run

Data: 2026-10-10. Estado: **pré-flight e habilitação solicitada da API Cloud Run realizados após aprovações específicas; criação/execução não autorizadas por este arquivo**.
O pedido «vamos indo» autoriza esta preparação documental, não publicação,
credenciais, recursos, cobrança ou execução. Guards e defaults permanecem intactos.

Continuação preparada em 2026-10-12: o [roteiro operacional da 020](rendering-cloud-validation.md)
usa este histórico para planejar inventário, diagnóstico, admissão nativa e
integração privada. Nenhuma nova consulta autenticada, publicação ou execução
nessa preparação; as parcelas datadas abaixo permanecem históricas.

## Objetivo e limites

Executar o [diagnóstico independente](worker-isolation-probe.md) uma vez em um
Cloud Run Job temporário, sem endpoint HTTP. Não é implantação do gateway.
Não usar seu módulo Terraform, remover preconditions ou criar SQL/bucket/Tasks/VPC.
Job termina após produzir o relatório. [Contrato](https://docs.cloud.google.com/run/docs/container-contract).

Projeto proposto: `toonlira-rm`, a confirmar por consulta autorizada. Região
proposta: `southamerica-east1`, preservando a escolha corrente do gateway.
Não mover região silenciosamente. Jobs usam segunda geração, mas não validam
automaticamente um Cloud Run **Service**: lifecycle e carga exigem prova própria.

Contexto da imagem conterá somente probe compilado, runtime Java e licenças.
Não copiar repositório, JAR Spring, imagens de mangá, capturas OCR, modelo, SDKs,
credenciais ou arquivos `.local`. Sem OCR/tradução/render/metadata pelo programa.
Rede cloud não equivale a Docker `--network none`; código sem chamadas não é
bloqueio de egress da plataforma.

## Quatro etapas, aprovação antes de cada ação externa

### 1. Pré-flight autenticado — somente leitura

Pedir confirmação para usar a identidade já autenticada, sem login novo ou troca
de ADC. Conferir projeto, billing vinculado, APIs Run/Artifact Registry,
permissões necessárias e eventual registry privado de diagnóstico existente.
Não habilitar APIs, conceder papéis, criar conta ou reutilizar recurso desconhecido.

Comandos sugeridos para aprovação, **não executados**: `gcloud projects describe
toonlira-rm`, `gcloud billing projects describe toonlira-rm`, `gcloud services
list --enabled --project=toonlira-rm` e consultas específicas do Artifact Registry.
Usar saída restrita: status/existência, sem tokens, chaves ou dump integral de
IAM/billing. IDs operacionais/identidade ficam no registro privado, não no Git.
Permissão ausente exige apresentar grant mínimo antes de qualquer alteração.

### 2. Imagem mínima — preparar localmente, depois aprovar o push

Compilar Java em contexto exclusivo, conferir lista exata de arquivos e fixar
base Linux x86_64 por digest; registrar hashes de fonte/classes/imagem.
Entrypoint Java direto, UID numérico não root, heap 64 MiB, SerialGC e
ActiveProcessorCount=2. Sem servidor web ou fixtures de teste na imagem.
O [preparador/Dockerfile local](worker-isolation-probe.md#imagem-local-exclusiva-do-diagnóstico)
foi entregue posteriormente, conforme registro abaixo; nada foi publicado.

Revisar a base antes de publicar: Java 23 cacheado é histórico, não aprovado
para segurança por passar em Docker. Atualização/download ou aceitação de risco
exige decisão própria; aquisição não é implícita. Não usar Cloud Build, scanner
pago ou assinatura remota automaticamente.

Pedir aprovação específica para publicar somente essa imagem em registry
privado, apresentando região, bytes e retenção/custo. Resolver digest publicado;
ID local Docker não é referência publicada.

### 3. Recursos mínimos — criar sem executar

Após confirmação por ação, habilitar somente APIs ausentes, criar registry
privado se necessário e conta dedicada sem chave ou papéis de dados. Não usar
`ocr-eval` ou identidade do worker de negócio. Conferir papéis herdados: conta
nova não prova ausência de acesso. Grants do operador/service agent também
precisam de aprovação; não conceder papéis administrativos por conveniência.

Job de nome exclusivo, digest fixado, 2 CPUs/8 GiB, uma task, paralelismo 1,
retries **0**, timeout de task **60 segundos**, volume em memória `/work`
de 512 MiB. Sem schedule, trigger, porta ou execução junto à criação.
[Retries](https://docs.cloud.google.com/run/docs/configuring/max-retries),
[timeout](https://docs.cloud.google.com/run/docs/configuring/task-timeout).
Não inventar flags Docker para cloud: PIDs/noexec/rootfs/capabilities precisam
de suporte e observação comprovados. Diferenças ficam visíveis, sem reduzir guards.

Cloud Run fornece identidade/metadata ao ambiente; o probe não os consulta.
Nenhuma mídia ou dado de negócio é disponibilizado à conta. Descrever o Job
criado e conferir parâmetros antes da aprovação seguinte.

### 4. Uma execução — coletar, decidir e limpar

Apresentar configuração/digest/custo e pedir aprovação para **uma execução**.
Registrar ID antes de acompanhar; confirmação perdida não autoriza outra rodada.
Consultar a execução original, sem retries manuais ou overrides. Timeout ou
JSON ausente/inválido é inconclusivo, nunca aprovação.

Recuperar somente logs dessa execução autorizada. Guardar JSON original/hash,
metadados, comandos, datas UTC e observações em diretório exclusivo de
`.local/worker-isolation/`, sem sobrescrever relatórios. Sem output de credenciais.
Exit 0 indica término do programa; avaliar 18 checks e flags de aprovação false.

Execução pendente: pedir aprovação antes de cancelar; cobrança passada não é
revertida. Depois da coleta, apresentar alvos exatos para exclusão confirmada:
Job, digest/repositório exclusivo e conta criada pela prova. Preservar recursos
reutilizados e evidência local. Não apagar logs/configuração geral de retenção;
registrar retenção e possíveis custos residuais. Nenhuma limpeza ampla ou automática.

## Custo — referência, não teto ou cotação regional

Consulta pública em 2026-10-10, sem billing da conta. Jobs cobram CPU/RAM durante
a vida da instância, mínimo de um minuto. Free tier é compartilhado por billing;
não presumir saldo. [Preço oficial](https://cloud.google.com/run/pricing).

Referência **us-central1**, sem descontos: USD 0,000018/vCPU-s e
USD 0,000002/GiB-s. Para 2 CPUs/8 GiB:

`compute = segundos faturados × (2 × 0,000018 + 8 × 0,000002)`.

| Tempo ilustrativo | Compute de referência USD |
| ----------------- | ------------------------: |
| 60 s              |                   0,00312 |
| 180 s             |                   0,00936 |

Não é cotação de São Paulo: `southamerica-east1` é Tier 2; confirmar tarifa
regional/moeda antes de publicar/criar/executar. [Regiões](https://docs.cloud.google.com/run/docs/locations).
180 s é cenário, não duração garantida; timeout não limita a fatura integral
de startup/retenção/logs/ações do operador. Não prometer teto total.

Registry cobra conforme bytes/tempo e possíveis transferências/opcionais;
medir imagem antes do push e separar quota grátis disponível.
[Preço do registry](https://cloud.google.com/artifact-registry/pricing).
Logs, transferência, impostos e câmbio não entram nos números de compute.
Não configurar billing, budget/spend cap, scanner ou recursos adicionais automaticamente.

## Critérios de decisão

- **Validado:** probe local sanitizado e testado; não é medição cloud.
- **Hipótese:** controles do Job podem coincidir com os guards. Nenhum resultado
  Cloud Run está registrado.
- **Triagem favorável:** observações coincidem, mas não promovem 020/021.
- **Bloqueio observado:** valor incompatível no alvo; sem heurística ou redução
  de guard para aprovar.
- **Esperado:** AS pode continuar unlimited, pois probe não executa bootstrap;
  exige prova nativa separada, não falso pass.
- **UNKNOWN:** leitura indisponível mantém verificação aberta.

Mesmo triagem favorável exige syscalls, startup do worker, pipeline/falhas/OOM/
retenção, segurança e qualidade em marcos próprios. Gateway/worker/layout cloud
continuam desabilitados. O aceite deste plano é clareza de escopo/custo/gates,
não execução da prova.

## Resultado do pré-flight — 2026-10-10

Após a pergunta específica sobre projeto, billing, APIs e registry, Ruan
respondeu «Sim». Consultas autenticadas somente leitura executadas entre
16:45:38 e 16:47:15 UTC. CLI 583.0.0, uma identidade ativa, sem impersonação,
credential override ou token-file configurados; nenhum identificador privado
ou token publicado. ADC/configuração/permissões não foram alteradas.

| Item                        | Resultado comprovado                                               |
| --------------------------- | ------------------------------------------------------------------ |
| Projeto `toonlira-rm`       | ID corresponde e lifecycle ACTIVE                                  |
| Faturamento vinculado       | billingEnabled=true; não comprova saldo grátis ou teto             |
| API Cloud Run               | desabilitada                                                       |
| API Artifact Registry       | desabilitada                                                       |
| APIs Vision/IAM Credentials | já habilitadas; nenhuma chamada OCR realizada                      |
| Registry privado            | não consultado: API desabilitada; existência/privacidade pendentes |
| Criar/push/executar/excluir | permissões ainda não validadas; nenhum grant efetuado              |

Flags das APIs confirmadas pela consulta filtrada e por listagem sem filtro,
com saída sanitizada. Registro exclusivo `preflight.json` na pasta local
ignorada de diagnóstico contém comandos/datas/resultados, não segredos.
Não habilitar API para destravar consulta automaticamente. Próxima ação
proposta: pedir aprovação para habilitar somente `run.googleapis.com`, sem
Job/execução; Artifact Registry terá confirmação própria depois.
Custos regionais/publicação/recursos continuam pendentes, sem promoção de gates.

## Habilitação solicitada de Cloud Run — 2026-10-10

Após aprovação específica de Ruan («Sim»), executado somente
`gcloud services enable run.googleapis.com --project=toonlira-rm --quiet`,
entre 16:57:20 e 16:57:31 UTC, exit 0. Nenhum comando de habilitação direta
do Artifact Registry foi enviado. Nenhum Job, registry, imagem publicada,
execução, grant manual ou alteração de credencial foi realizado nesta ação.

Conferência somente leitura em 16:58:16–16:58:18 UTC comprovou
`runEnabled=true` **e** `artifactRegistryEnabled=true`, embora ambos fossem
false no pré-flight anterior. Não atribuir causa sem evidência: dependência
automática é hipótese; também não excluir alteração concorrente. A documentação
descreve ativação automática de dependências no mecanismo hierárquico,
não comprova a causa desta operação do CLI estável.
[Dependências de serviços](https://docs.cloud.google.com/service-usage/docs/hierarchical-service-activation/overview).

Registro local exclusivo `enable-run-api.json` preserva comando, aprovação,
datas e resultado sanitizado, sem substituir `preflight.json`. Não habilitar
Artifact Registry novamente nem desabilitá-la como rollback automático.
Efeitos automáticos sobre outras dependências/identidades ainda não auditados.
Próxima proposta: investigação e inventário do registry somente leitura, com
confirmação antes de novo uso de credenciais. Publicação, custo e Jobs continuam
sem autorização; flags do gateway/worker e gates de produto permanecem intactos.

## Investigação e inventário regional — 2026-10-10

Após aprovação de Ruan para investigar e consultar somente leitura, audit logs
Service Usage/Service Management foram consultados no intervalo
16:44:00–17:01:00 UTC. Eles mostram uma única operação de `EnableService`
para `run.googleapis.com`, com início/fim correlacionados e mesma identidade
existente, sem publicar sua identificação. Registros repetidos de término e
polls não contam como nova habilitação. Não foi encontrado pedido explícito
para Artifact Registry nesse recorte. Isso não comprova a causa de sua mudança
de estado, nem exclui caminhos automáticos, retenção/visibilidade ou concorrência.

Consulta do Artifact Registry em `southamerica-east1` terminou exit 0 e
retornou **zero repositórios** às 17:05:29 UTC. Não estender esse resultado a
outras regiões. Existência de registry privado e autorização de criação/push
continuam pendentes; nenhuma imagem ou dado de negócio foi consultado.

Consulta de dependências com `gcloud beta services groups list-members
run.googleapis.com dependencies --project=toonlira-rm --format=json` terminou
exit 0, mas não forneceu JSON parseável no wrapper: resultado indisponível,
não ausência comprovada de dependência.
[Procedimento oficial](https://docs.cloud.google.com/service-usage/docs/hierarchical-service-activation/list-dependencies).
O trecho de resultado de busca sobre habilitação automática da documentação
antiga de transição do registry redireciona para página atual que não responde
a essa causalidade; não usar o snippet antigo como prova.

**Desvio local:** o CLI instalou o componente `beta` ao invocar a consulta.
O manifest do componente foi modificado às 14:07:18 America/Sao_Paulo,
dentro da execução de 17:07:16–17:07:33 UTC. A instalação não havia sido aprovada;
desabilitar prompts/update-check não impediu esse comportamento. A checagem de
componentes deveria ter ocorrido antes. Novas consultas foram interrompidas;
nenhum uninstall, habilitação/desabilitação de API, grant, push ou recurso
cloud foi feito nesta investigação. Não declarar esta parcela sem mutações:
há alteração local do SDK, embora as consultas cloud tenham sido somente leitura.

Registro local exclusivo `investigation-api-registry.json` guarda comandos,
datas, resultados sanitizados e o desvio, preservando os dois registros anteriores.
Causa do Artifact Registry continua inconclusiva. Próxima decisão humana:
manter ou remover o componente beta; só então avançar com preparação local
da imagem, sem publicação ou nova alteração cloud. Dados de qualidade, guards,
defaults, status/gates de produto e custos operacionais permanecem conservados.

## Preparação local da imagem — 2026-10-10

Ruan aprovou manter `beta` instalado e preparar somente a imagem local, sem
publicação ou recursos cloud. Nenhum uso de gcloud/credenciais nesta parcela.
Preparador JS e testes escritos antes da implementação. Primeiro red por módulo
ausente; depois teste recusado por caminho temporário não canônico no macOS,
corrigido na fixture sem relaxar validação de symlink/canonical path.
Concorrência reserva um único contexto; hash ruim falha antes da reserva.

Imagem local x86_64/glibc construída com base cacheada, ONBUILD ausente,
builder legado explícito, pull=false e RUN network none (Dockerfile sem RUN).
Contexto exclusivo, oito classes JDK 23 verificadas; entrypoint Java, UID 1000,
sem portas expostas, fonte/testes/Spring/modelo/codec/SDK/credencial no pacote.
Licença Java herdada conferida como legível pelo usuário da imagem. Nenhum
download, scanner, Cloud Build, push ou alteração de APIs/IAM/billing.

ID local `sha256:71c2f8512c82ebd26fe9bfd927b05e6b001cec8258a008d6193b23f0b0188b51`;
tamanho descompactado 216.412.568 bytes, não medida de transferência/storage
faturado. Não é digest publicado. Fonte do probe
SHA-256 `cf1333b84776a298cf4206b0b9e518b99c67c38f88286ebc3e42a35dcc711a11`;
contexto `0ce1eb2d736303c1076ba84640265e8c6220dd70d73a4995ec02d76773d4e20c`.
Dockerfile fonte SHA-256
`0378bdc81847a5255ad434599094ca0d681226e693fc33895f365b59f8086d22`
é suplemento separado do checksum técnico dos scripts/Java.

Uma execução local da própria imagem, sem bind/rede/credenciais, em x86_64
emulado; CPUs 2, memória 8 GiB/swap extra zero, PIDs 64, cgroup privado,
rootfs readonly, cap-drop ALL/no-new-privileges, tmpfs 512 MiB noexec/nosuid/nodev.
Em 17:18:18 UTC: 17 PASS/1 FAIL, endereço unlimited esperado porque probe não
executa bootstrap. `operationalApproval=false`, `nativeOperationsTested=false`.
Inspeção inicial de ExposedPorts via template falhou por campo inexistente;
rechecagem JSON confirmou ausência de porta, sem alterar imagem/configuração.

Node completo: 107 pass/um skip, zero failures; type-check web exit 0.
Gates globais e hashes finais ficam no recibo local exclusivo de build/teste.
JAR de produção não foi modificado. Dados e classes compiladas permanecem na
pasta ignorada de diagnóstico, sem sobrescrever evidências anteriores.
Base histórica continua sem revisão/aprovação de segurança; não publicar ou
implantar. Tarifa São Paulo, registry privado, conta dedicada e Jobs continuam
pendentes. A causa de Artifact Registry e os gates de produto não foram promovidos.

## Revisão pública da base e preços — 2026-10-10

Escopo somente leitura: documentação pública e descoberta local dos executáveis
de scanner. Sem gcloud, ADC, consultas à conta de faturamento, instalação,
download de imagem, scanner, push ou alteração cloud. O seletor público de
preços foi ajustado para São Paulo; isso não altera a região de nenhum recurso.
Os registros anteriores acima permanecem fotografias históricas.

**Base histórica:** o runtime local observado é Temurin `23.0.2+7`.
A tabela oficial marca Java 23 como EOSL, com fim de disponibilidade em março
de 2025: não há novos builds planejados para essa linha. Isso impede tratá-la
como base mantida, mas não identifica por si só CVEs exploráveis da imagem.
Trivy e Grype não estão disponíveis no PATH consultado; nenhuma varredura foi
executada. Vulnerabilidades do sistema base e das dependências continuam
pendentes, sem contagem presumida ou aprovação de segurança.
[Suporte Temurin](https://adoptium.net/support/).

**Proposta, não executada:** baixar uma base oficial Temurin 25 LTS Linux
amd64, fixar o digest e reconstruir/testar somente a imagem de diagnóstico.
A linha 25 está mantida; a compatibilidade das classes atuais precisa de teste.
Não migrar o Java do projeto/worker nem alterar guardrails neste incremento.
Download exige aprovação própria e envolve rede, disco e CPU locais, sem
credenciais Google, mídia, provider ou publicação. A imagem histórica não será
sobrescrita; sua aprovação operacional continua false.

**Jobs em São Paulo (`southamerica-east1`):** a página pública selecionada
mostra tarifa padrão USD `0,0000216/vCPU-segundo` e
`0,0000024/GiB-segundo`, sem desconto por compromisso. Para uma task com
2 vCPUs e 8 GiB: `compute = segundos faturados × 0,0000624`.

| Cenário ilustrativo | Compute bruto USD |
| ------------------- | ----------------: |
| 60 segundos         |          0,003744 |
| 180 segundos        |          0,011232 |

O mínimo é um minuto por instância; a vida faturada inclui startup/encerramento.
Não presumir disponibilidade do nível gratuito compartilhado pela conta.
Os cenários não são teto, autorização de cobrança ou estimativa da duração real.
Valores na moeda de faturamento, impostos, logs e outros serviços ficam fora.
[Preços Cloud Run](https://cloud.google.com/run/pricing).

**Artifact Registry:** armazenamento tem 0,5 GiB-mês gratuitos por conta;
acima disso, USD `0,000136986/GiB-hora`, aproximadamente `0,10/GiB-mês`
em 730 horas. A tarifa vale para repositórios regionais e multirregionais.
Exemplo bruto sem crédito gratuito: 0,25 GiB por 730 horas ≈ USD 0,025.
Não equiparar esse exemplo aos bytes faturáveis da imagem: o tamanho local
descompactado não mede as camadas armazenadas. Transferência dentro da mesma
localização é gratuita conforme a tabela; outros destinos e scanners habilitados
podem cobrar separadamente. Nenhum scanner foi habilitado ou executado.
[Preços Artifact Registry](https://cloud.google.com/artifact-registry/pricing).

Esta revisão resolve a consulta pública da tarifa regional, não valida billing,
segurança da base, registry privado, IAM ou operação Cloud Run. Nenhum status
de produto, runtime, checksum técnico ou evidência anterior foi promovido.

## Nova imagem local Temurin 25 — 2026-10-10

Após confirmação de Ruan («Vamos indo») ao pedido específico de download e
rebuild/teste local, consultado o catálogo público Docker Official Images:
`25-jre-noble` aponta para `25.0.4.1_1-jre-noble`, revisão Adoptium
`511f9356dc4d50932a0a5f8cfb0f87ed1aef4f07`, diretório `25/jre/ubuntu/noble`.
Manifesto Linux amd64 fixado em
`sha256:78498f30dd330b06755c1b134039dcbf8324bedb385136819dd519b842a3816a`.
[Catálogo oficial](https://github.com/docker-library/official-images/blob/master/library/eclipse-temurin),
[fonte fixada](https://github.com/adoptium/containers/tree/511f9356dc4d50932a0a5f8cfb0f87ed1aef4f07/25/jre/ubuntu/noble).

Download explícito via Docker com configuração temporária sem autenticação,
somente do registry público. Sem gcloud, ADC ou dados do projeto no contexto.
Primeira consulta pública via Node falhou por DNS no sandbox; reexecução com
acesso à rede autorizado obteve o catálogo. Teste de regressão primeiro falhou
contra o digest antigo; após alteração do Dockerfile/preparador, passou.
Compilação/major das oito classes continuam Java 23/67, sem mudar o projeto,
JAR Spring, fonte do probe ou controles. Metadado novo `runtimeMajor=25`.

Novo contexto exclusivo e tag `toonlira-local/worker-isolation:java25-20261010-a`;
imagem local
`sha256:f0a21b78653c6d2620b0a41cdebb34c1a41409565b512265e62452642053eeaf`.
Docker reportou 106.728.501 bytes; não é medida de storage cloud faturado.
Imagem/relatórios históricos preservados, sem overwrite ou publicação.
Contexto SHA-256 `33d1fa93a3f9366571e086741f39f1e744c1b367305b90320e42466a7e53ad6e`.

Inspeção por template falhou porque ONBUILD era campo ausente. O build foi
iniciado antes da inspeção JSON corrigida; essa sequência não deve ser repetida.
A inspeção JSON confirmou ONBUILD ausente antes de executar a imagem; build
sem RUN e sem rede, usando a base adquirida. Licença Java legível como UID 1000,
entrypoint Java direto, nenhuma porta exposta; versão efetiva `25.0.4.1+1-LTS`.

Execução local em 17:37:12 UTC, sem rede, binds, credenciais ou mídia, manteve
os controles anteriores: 17 PASS/1 FAIL. FAIL é endereço ilimitado, pois o
probe não aplica o bootstrap nativo; não afrouxar guard nem promover aprovação.
VmSize observado 2.860.695.552 bytes. `operationalApproval=false` e
`nativeOperationsTested=false`. É emulação amd64, não prova cloud ou de syscalls.

Registro exclusivo de aquisição/build/teste e relatório sanitizado ficam na
pasta ignorada de diagnóstico. Nenhuma instalação de scanner, alteração cloud,
push, provider ou uso de credenciais Google. Segurança por CVEs e publicação
continuam abertas; base mantida não equivale a imagem livre de vulnerabilidades.

Checksum técnico desta fotografia: 392 arquivos de fontes/testes/configuração,
SHA-256 `445f9830a2ae120d15b2af4d5b2e50c36670a5b655eee9728c1d50343872dbb2`.
Dockerfile específico, separado desse escopo:
`8746f718f0cb045cbdececc3c56db86b13e07e6fac07a133f5434bc067ef2d6f`.
JAR de produção preservado:
`40f035309f927f718978c47ebbd2ef064924df50022905baf2873d48692fb906`.
Nenhum checksum/evidência histórica substituído; nenhum arquivo mobile alterado.

Gates desta execução: Node completo 107 pass/um skip; Maven global offline com
Docker, exit 0 (2.723 testes, zero failures/errors; 103 opt-ins skipped), incluindo
1.252 do gateway. Os skips não são evidência de testes nativos/cloud executados.
Type-check web, validação SDD, 83 links documentais relativos, formatação dos
cinco arquivos alterados e diff-check aprovados. Resultados XML conferidos
somente a partir de 17:37:00 UTC; registro local mantém hashes e comandos.

## Varredura local de vulnerabilidades — 2026-10-10

Ruan confirmou («Vamos continuando») o pedido específico de aquisição do Trivy
oficial/base de vulnerabilidades e análise somente da imagem local. Binário
macOS ARM64 `0.75.0` e checksum obtidos do release oficial; SHA-256 do arquivo
`4a77108cccf8e55c8d6823e1e759939a622277e66cd0daa3c1fc621ed69e4568`
corresponde ao asset e ao checksum publicado. Binário extraído na pasta ignorada,
sem Homebrew, instalação global, sudo ou mudança do PATH. Não houve validação
independente de assinatura; checksum por HTTPS é evidência de integridade.
[Release oficial](https://github.com/aquasecurity/trivy/releases/tag/v0.75.0),
[instalação oficial](https://trivy.dev/docs/latest/getting-started/installation/).

Exportada somente a imagem de diagnóstico `f0a21b7…` para arquivo local,
SHA-256 `1da5a53148cde134374385684e540c49a405a4a7469496a623e583acb10974ac`.
Manifesto/configuração conferidos por hash; o `ImageID` do relatório é o digest
da configuração `b47a322…`, vinculado ao manifesto anterior, não outro alvo.
O scanner não recebeu socket Docker, arquivos do projeto, mídia ou credenciais.

Bases públicas de CVEs e índice Java baixadas explicitamente do GHCR Aquasecurity
em cache exclusivo, sem fallback para registry Google. Ambiente limpo, configuração
e ignorefile explícitos vazios; telemetria desabilitada. A primeira tentativa
offline falhou por índice Java ausente e não criou relatório. Erro preservado
em `attempt-001.json`; após aquisição do índice, segunda tentativa criou
`report-002.json`, sem sobrescrever evidência. Não interpretar falha como zero CVEs.

Execução completa em 17:47:03 UTC: Trivy detectou Ubuntu 24.04 e 108 pacotes,
**18 ocorrências pacote/CVE, 12 CVEs distintos**. Severidades selecionadas pelo
scanner: 14 MEDIUM, quatro LOW, zero HIGH/CRITICAL. Sem filtros de severidade,
ignore-unfixed ou supressões configuradas. Exit 0 indica scan terminado, não
imagem segura. Banco de CVEs atualizado em 12:33:35 UTC; índice Java em 00:59:51 UTC.
As bases descompactadas ocupam aproximadamente 3 GB no cache local preservado.

| Pacote com correção indicada no banco | Instalado              | Versão corrigida indicada |
| ------------------------------------- | ---------------------- | ------------------------- |
| libfreetype6, CVE-2026-95512          | 2.13.2+dfsg-1ubuntu0.1 | 2.13.2+dfsg-1ubuntu0.2    |
| libpng16-16t64, CVE-2026-46675        | 1.6.43-5ubuntu0.6      | 1.6.43-5ubuntu0.7         |

Correção libpng Noble confirmada na [fonte Ubuntu](https://ubuntu.com/security/CVE-2026-46675).
A página Ubuntu de FreeType falhou por timeout em duas consultas; sua versão
corrigida continua evidência do banco Trivy, não confirmação pública independente.
As outras 16 ocorrências não informam versão corrigida nessa fotografia; isso
não prova inexistência de patch. Explorabilidade e disponibilidade efetiva no
repositório apt ainda não verificadas. Nenhum pacote/imagem foi atualizado.

**Limite de cobertura:** o relatório contém somente `os-pkgs`; nenhum pacote
Temurin/JDK ou resultado de aplicação Java foi reconhecido. O download do índice
Java não comprova cobertura do runtime. Não estender o resultado às classes do
probe, ao JAR Spring ou aos codecs/modelos ausentes. Não executados scanners de
segredos/configuração/licença. [Cobertura Java](https://trivy.dev/docs/latest/coverage/language/java/).

Scan usou `--input`, `--scanners vuln`, `--offline-scan`, skips de atualizações
dos bancos/checks/VEX e de version-check, além de `--disable-telemetry`.
Downloads separados do scan; nenhuma imagem/relatório enviada, SDK/ADC utilizado
ou recurso cloud alterado. [Opções do scanner](https://trivy.dev/docs/latest/references/configuration/cli/trivy_image/).
SHA-256 do relatório `3a85583c90b57fcaa6f1f8cbdf63bc0cf958241d9bba615164cda548f89106c4`;
`scan-receipt.json` local guarda hashes dos bancos/binário/exportação e findings.

Conclusão: triagem e correções locais propostas permanecem abertas;
`securityApproved=false`, sem publicação, operação cloud ou promoção de gates.
Fontes/runtime/imagens e checksum técnico do gateway não mudaram nesta parcela.

## Correções APT na candidata local — 2026-10-10

Após confirmação específica de Ruan («Sim»), construída **nova** candidata local
com atualização dos pacotes da base; nenhuma imagem anterior substituída.
Receitas `Dockerfile.index` e `Dockerfile.patch`, simulação, exportação, relatórios
e recibo permanecem no diretório exclusivo ignorado de diagnóstico. A receita
versionada/preparador offline não foi transformada em download automático:
ela ainda reproduz a imagem anterior, não esta candidata corrigida.

Primeiro conferidas as origens APT da imagem: `archive.ubuntu.com` e
`security.ubuntu.com`, Noble/updates/security/backports, com keyring oficial.
Assinaturas preservadas, sem allow-unauthenticated/insecure ou Ubuntu Pro.
`apt-get update` em imagem intermediária baixou 33,5 MB de índices. Simulação
sem rede/rootfs readonly falhou porque APT precisa de arquivo temporário;
repetida com tmpfs `/tmp` de 64 MiB, mantendo readonly/cap-drop/no-new-privileges.
Não reduzir os controles do diagnóstico por causa dessa necessidade da preparação.

Simulação e instalação confirmaram quatro upgrades, zero pacotes novos/removidos
ou retidos. `apt-get --yes --no-remove --no-install-recommends upgrade` baixou
645 kB; não foi usado full-upgrade/dist-upgrade. `apt-get clean` removeu apenas
o cache temporário de pacotes dessa construção, não evidências ou arquivos do host.
Builder legado informou depreciação e emulação amd64 em host ARM64, sem instalação
de Buildx. [Gerenciamento APT](https://documentation.ubuntu.com/server/how-to/software/package-management/).

| Pacote          | Antes                  | Depois                 |
| --------------- | ---------------------- | ---------------------- |
| libaudit-common | 1:3.1.2-2.1build1.1    | 1:3.1.2-2.1ubuntu0.1   |
| libaudit1       | 1:3.1.2-2.1build1.1    | 1:3.1.2-2.1ubuntu0.1   |
| libfreetype6    | 2.13.2+dfsg-1ubuntu0.1 | 2.13.2+dfsg-1ubuntu0.2 |
| libpng16-16t64  | 1.6.43-5ubuntu0.6      | 1.6.43-5ubuntu0.7      |

Imagem candidata local:
`sha256:cf73e5c4241a96a095dcec030296dfea3269a3c50d6152466a09802fe17b0c02`,
tag `toonlira-local/worker-isolation:java25-patched-20261010-a`.
Docker reportou 145.905.173 bytes, sem equivalência com storage cloud faturável.
Usuário final `1000:1000`, entrypoint Java/sem portas, ONBUILD ausente,
Temurin `25.0.4.1+1-LTS` e licença legível. Oito hashes de classes idênticos
à candidata anterior; nenhum source Java, JAR, SDK, mídia, modelo ou worker novo.

Diagnóstico em 18:00:27 UTC: 17 PASS/1 FAIL, ainda endereço unlimited esperado
sem bootstrap nativo; VmSize 2.860.691.456 bytes. Mesmos controles locais de
rede/binds ausentes, readonly, cap-drop, cgroup privado, PIDs 64, 8 GiB/2 CPUs e
tmpfs `/work` limitado. `operationalApproval=false`/`nativeOperationsTested=false`.
Relatório SHA-256 `a4d36e104cc7db373473da49cb0a6ac94a9c1b8949f5f972874aca730d0c922c`.

Varredura offline em 18:01:03 UTC, **mesmos binário/bancos/flags da rodada anterior**:
108 pacotes Ubuntu, 16 ocorrências em 10 CVEs distintos, 12 MEDIUM/quatro LOW;
zero HIGH/CRITICAL e nenhuma ocorrência nova. CVE-2026-95512/FreeType e
CVE-2026-46675/libpng deixaram de aparecer. Sem filtros/supressões; nenhuma
versão corrigida informada pelo scanner para os achados restantes, sem presumir
inexistência de patch ou ausência de explorabilidade. Java continua não coberto.
SHA-256 do scan `89b27cc4c90c2d2fed0da704498e499128680c46bdc9c283022e4b9c9fa54aba`;
exportação `7f73fe0fe203ea1b37bd0d57a3da135f351afb3beca870bc4866eedc87c19ca5`.
Configuração `9f19c1a…` vinculada ao manifesto conferido. Comparação inicial
omitiu Release/Epoch dos pacotes e falhou; corrigida na verificação local,
confirmou as quatro versões completas, sem mudar qualquer resultado Trivy.

Gates reexecutados: Node 107 pass/um skip; Maven global offline/Docker exit 0,
2.723 testes, zero failures/errors, 103 opt-ins skipped; gateway 1.252 testes.
XMLs considerados somente a partir de 17:57:00 UTC. Type-check web e SDD
aprovados. Skips não comprovam operação cloud/nativa. Checksums técnico do gateway
e JAR permanecem os da fotografia anterior; nenhum arquivo mobile alterado.

Recibo local registra alvos, comandos, hashes, versões, comparação e limitações.
Nenhuma credencial Google, cloud, provider, publicação ou troca do Java do projeto.
Não concedida aprovação de segurança: investigar achados restantes e cobertura
do Java antes de propor publicação; defaults/status/gates continuam intactos.
