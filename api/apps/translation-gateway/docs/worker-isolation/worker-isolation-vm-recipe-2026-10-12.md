# Receita candidata de diagnóstico em VM — 2026-10-12

**Preparação local, não provisionada nem aprovada operacionalmente.**
Complementa a [decisão de ambiente](worker-isolation-target-options-2026-10-12.md).
020 continua `in-progress/open`, 021 bloqueada. Nenhum guard, runtime, migration,
Terraform, default, site ou arquivo da auditoria de performance foi alterado.
Continuação: [launcher/core de coleta preparados offline](worker-isolation-vm-preparation-2026-10-12.md),
com revisão de segurança parcial e adapter Google ainda pendente. As seções
abaixo preservam o estado da receita anterior à preparação.

## 1. Pré-flight observado, não garantia de criação

Consultas GA com a credencial existente, autorizadas por Ruan, entre
**18:43:43–18:43:54 de Brasília**. Nove ações somente leitura, nenhuma mutação.
SDK/manifests e IAM do projeto iguais antes/depois. Cache/logs usuais do CLI
podem ser atualizados; nenhum login, troca ADC, impersonação ou chave gerada.

| Item                | Fato observado                                                              | Limite da conclusão                                                   |
| ------------------- | --------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Projeto/API         | `toonlira-rm`, Compute habilitado; 52 APIs.                                 | Nenhuma API habilitada nesta parcela.                                 |
| Região/zonas        | São Paulo `southamerica-east1`; região e zonas a/b/c `UP`.                  | Estado do catálogo não reserva capacidade física.                     |
| Máquina             | `e2-highmem-2`, 2 vCPUs, 16.384 MiB, não shared-core; consultada na zona a. | Zona a não foi selecionada para criação. Container continua em 8 GiB. |
| Quota E2 regional   | 24 vCPUs, uso 0.                                                            | Não garante criação futura ou ausência de concorrência.               |
| Quota instâncias    | 24, uso 0.                                                                  | Limite regional, não inventário global novo.                          |
| Quota disco padrão  | 4.096 GB, uso 0.                                                            | Não é aprovação de armazenamento.                                     |
| Quota CPU global    | 32, uso 0.                                                                  | Reconfirmar junto à quota regional antes de criar.                    |
| Quota redes         | 5, uso 1.                                                                   | A rede default existente não será usada/modificada.                   |
| IAM                 | 10 bindings; hash igual antes/depois.                                       | Roles não foram concedidos nesta parcela.                             |
| Metadata do projeto | OS Login não explicitamente configurado; chave SSH ausente.                 | Não prova segurança de uma VM futura ou de políticas herdadas.        |

O campo de quota `SUBNETWORKS` reporta uso 0, mas o inventário anterior
encontrou uma subnet auto na região. Não substituir inventário por esse contador
nem concluir inexistência da subnet. Rede default/PGA/regras permissivas observadas
no [registro anterior](worker-isolation-target-options-2026-10-12.md#9-compute-habilitado-e-efeitos-conferidos--2026-10-12)
permanecem intocadas.

### Pin de SO candidato

- Projeto de imagem `cos-cloud`; nome **`cos-125-19216-739-5`**.
- Família consultada `cos-125-lts`; estado `READY`, arquitetura `X86_64`.
- Disco mínimo reportado 10 GB; imagem criada em 12/10 às 17:10 de Brasília.
- Hash da resposta de metadata sanitizada na origem:
  `dcf7b0075c22fa20bac720b74d8564f31994ca090d8b9e97e3c14f0ed211b115`.
  **Não é hash dos bytes do SO.** ID exato permanece no recibo privado.
- Imagem não baixada. Não criar usando uma família móvel ou trocar revisão
  automaticamente. Reconfirmar nome/ID/estado antes da proposta de criação.
- Publicação recente e milestone suportado não comprovam patches, kernel,
  Docker/runc, cgroup v2 ou admissão. Revisão de segurança/freshness ainda aberta.

Recibo privado: `compute-candidate.I8elN2/candidate.json` sob o diretório local
ignorado de isolamento; SHA-256
`f59125fb72c00a7668397a35189ad8db107caa5e71e8d31d86299c7044e54109`.
Comandos exatos e resultados sanitizados estão nele, sem credenciais, IAM
integral, endereços ou conteúdo de metadata.

## 2. Inventário proposto, dependente de aprovação

Nenhum dos itens abaixo foi criado. Nomes exclusivos, CIDR IPv4, disponibilidade
e permissões por recurso serão resolvidos antes de apresentar a ação de criação.
Não reutilizar identidade/recurso desconhecido ou a conta histórica já retirada.

| Recurso     | Proposta mínima                                                                                     | Preservação                                                                          |
| ----------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| VPC         | Uma rede dedicada, modo custom; sem peering, VPN ou conectividade com a default.                    | Não alterar rede/rotas/firewalls compartilhados.                                     |
| Subnet      | Uma subnet IPv4 em São Paulo, PGA habilitado; CIDR ainda pendente.                                  | Não habilitar PGA na subnet default.                                                 |
| Rota/egress | Configuração básica PGA com rota default e DNS padrão, a revisar.                                   | Sem NAT, IP externo, IPv6, proxy ou endpoint extra.                                  |
| Ingress     | Nenhuma regra allow nova; conferir deny implícito e políticas efetivas.                             | Sem SSH, RDP, IAP, porta HTTP ou binding público.                                    |
| Registry    | Um repo Docker privado regional temporário, scanner automático desabilitado; uma imagem por digest. | Sem Cloud Build, download/rebuild ou reutilização automática.                        |
| Identidade  | Uma SA dedicada sem chave; `roles/artifactregistry.reader` somente nesse repo.                      | Não anexar default/Editor ou `ocr-eval`; sem roles de provider, SQL, bucket ou logs. |
| VM          | Uma x86_64 on-demand `e2-highmem-2`, sem auto-restart, MIG, schedule ou Spot.                       | Não mover site/worker completo, nem tentar outra zona automaticamente.               |
| Disco       | Um boot disk zonal `pd-standard` de 10 GiB, sujeito a suficiência; sem snapshots.                   | Sem cache grande no Mac; auto-delete somente como parte de retirada autorizada.      |
| Coleta      | Leitura da saída serial pela API, restrita ao operador; sem console interativo.                     | Sem Cloud Logging adicional, túnel, chave SSH ou credencial no container.            |

PGA permite ao **host** acessar APIs Google sem IP externo. A configuração básica
usa rota via default internet gateway; esse nome não implica tráfego Google saindo
da rede Google. **Não é uma allowlist de egress exclusiva do registry** nem VPC
Service Controls. Se políticas impedirem o pull, registrar bloqueio: não criar
NAT, allow ingress ou outra identidade como fallback.
[Configuração PGA](https://docs.cloud.google.com/vpc/docs/configure-private-google-access).

Identidade anexada e escopo OAuth serão revisados juntos; scopes não substituem
IAM. O acesso concedido permite leitura do repo diagnóstico, não de todo o projeto.
O host obterá autenticação pelo helper já incluído no COS, sem token em argumentos
ou logs. Configuração estática `credHelpers` e `DOCKER_CONFIG` dedicada poderão
evitar redefinir variáveis do sistema; nenhuma configuração de credenciais será
montada na aplicação. Não instalar helper ou copiar ADC para a VM.
[Helper COS](https://docs.cloud.google.com/container-optimized-os/docs/how-to/run-container-instance).

## 3. Launcher a preparar localmente

**Não existe ainda launcher executável aprovado para esta receita.**
Preparar configuração declarativa cloud-init/systemd e coletor Node, sem próprio
script Python/C ou helper shell de aplicação. Usar comandos explícitos do SO
existente, sem instalação de pacotes, `create-with-container` ou konlet.

1. Reservar diretório/ID de rodada exclusivo e registrar intent antes de qualquer
   mutação. No host, marcador persistente antes do probe; reboot/restart não pode
   repetir a execução. Unidade e container com `Restart=no`/`--restart=no`.
2. Revalidar a imagem diagnóstica preservada e sua segurança, sem reconstrução
   ou download implícitos. Digest candidato histórico:
   `sha256:cf73e5c4241a96a095dcec030296dfea3269a3c50d6152466a09802fe17b0c02`.
   Nova publicação exige revisão e confirmação própria; caminho do registry antigo
   não existe mais. Não levar worker, mídia, modelo ou repo completo.
3. Pull explícito no host, depois `docker run --pull=never` de digest conferido.
   Sem retry da execução ou segundo lançamento diante de erro/timeout ambíguo.
4. JVM como PID 1, UID/GID `1000:1000`, `--network=none`, `--cgroupns=private`,
   rootfs readonly, `--cap-drop=ALL`, `no-new-privileges`; sem ports, binds,
   sockets Docker, secrets ou credenciais. Recursos: 2 CPUs, memória 8 GiB,
   memory-swap 8 GiB, PIDs 64, `/work` tmpfs 512 MiB noexec/nosuid/nodev.
5. Coletar kernel/Docker/runc/cgroup do host em campos allowlisted, e saída JSON
   original do probe entre marcadores exclusivos. Preservar estados/hashes e
   limitações reais; não fabricar leitura de controles com mounts/escrita no host.
6. Coletor com limite de bytes/prazo e polling espaçado, sem imprimir resposta
   serial bruta, tokens ou comandos de autenticação. Ausência de marcador,
   truncamento, timeout ou confirmação perdida mantém resultado inconclusivo.
7. Conferir recibo/output local **antes de parar a VM**. Configurar limite de vida
   e ação de stop sob aprovação financeira própria; tempo do probe não limita
   billing. Nunca reiniciar automaticamente para recuperar uma captura perdida.

Saída serial via API e console serial **interativo** são mecanismos distintos.
Metadata proposta somente na VM: `serial-port-enable=false` e
`serial-port-logging-enable=false`; sem modificar metadata/políticas do projeto.
A API retorna somente o último 1 MB/porta de uma VM em execução; consulta após
stop não garante recuperação sem Cloud Logging. Não instalar agente ou conceder
`logging.logWriter` por conveniência.
[Coleta serial](https://docs.cloud.google.com/compute/docs/troubleshooting/viewing-serial-port-output).

O probe não prepara AS=3 GiB: seu `unlimited`/FAIL continuará explícito na primeira
triagem. Não exigir relatório inteiramente PASS para esconder essa limitação nem
chamar a primeira execução de admissão nativa. Namespace/controles obrigatórios
UNKNOWN ou incompatíveis bloqueiam avanço, conforme o [contrato existente](rendering-memory-admission.md).
Prova com bootstrap, syscalls, filha/OOM e integração são parcelas posteriores.

## 4. Cotação pública, não orçamento aprovado

Consulta em **12/10/2026**, página pública oficial, tabela/região explicitamente
selecionada **Sao Paulo (southamerica-east1)**, coluna **Padrão (USD)** e unidade
por hora. Não comprar CUD, consultar saldo, contratar ou criar recurso.
O valor inicial de Iowa foi descartado; não usado como cotação regional.

| Item                | Tarifa observada                                   | Exemplo calculado                                                      |
| ------------------- | -------------------------------------------------- | ---------------------------------------------------------------------- |
| VM `e2-highmem-2`   | US$ 0,1434924/h                                    | 10 minutos: US$ 0,0239154; 1 hora: US$ 0,1434924.                      |
| `pd-standard` zonal | US$ 0,000082192/GiB-h                              | 10 GiB × 10 minutos: US$ 0,000136987; 24 h: US$ 0,01972608.            |
| Registry            | US$ 0,000136986/GiB-h acima da faixa compartilhada | 0,135875 GiB × 24 h ≈ US$ 0,000447. Não é tamanho faturado confirmado. |

Fontes: [tarifas Compute/disco por região](https://cloud.google.com/products/compute/pricing/general-purpose)
e [Artifact Registry](https://cloud.google.com/artifact-registry/pricing).
Registry→Compute na mesma região tem transferência publicada gratuita; não
presumir disponibilidade da faixa gratuita de armazenamento compartilhada por
conta de faturamento, nem transformar soma de camadas em espaço faturado.

**Exemplo de VM+disco por dez minutos ≈ US$ 0,02405**, não cobrança real ou teto.
Inclui somente as duas tarifas × tempo suposto. Boot/pull/coleta/espera contam;
parar VM mantém custo do disco e registry. Impostos, moeda de faturamento,
eventuais itens extras e atraso de retirada não foram cotados como custo total.
Não assumir créditos/free tier. Uma hora VM+disco ≈ US$ 0,144315.

Captura pública local privada `pricing-e2-sao-paulo.jpg`, SHA-256
`33757a5f1a2e293a9a727cd455470724dd6ce7dfc42a39042c933392697e728c`;
tarifas e fórmula registradas separadamente da consulta autenticada. Nenhum
arquivo HTML integral/cookie/dado da conta foi copiado para Git.

## 5. Gates antes de ações externas

- **Validado:** catálogo/quotas atuais, pin de metadata, IAM/SDK sem drift e
  cotação pública São Paulo. Nenhuma capacidade reservada.
- **Pendente local:** launcher e coletor testados offline, anti-repetição, revisão
  da imagem diagnóstica e patches/kernel/runtime do COS, limites/retirada completos.
- **Pendente antes da criação:** nomes/CIDR, políticas efetivas, permissões por
  recurso, flags GA e escopo OAuth/IAM; revalidar pin/quota/cotação.
- **Bloqueado por autorização:** instalar/baixar, publicar imagem, criar rede,
  SA/grant, registry/VM/disco e iniciar computação paga. Nenhum solicitado agora.
- **Não comprovado:** isolamento efetivo, bootstrap/nativo, OOM agregado, operação
  worker/SQL/GCS/Tasks e conclusão da 020. Não promover gate da 021.

Próximo trabalho seguro: preparar/revisar launcher+coletor **localmente**, sem
chamar gcloud mutante. Só apresentar a aprovação de criação/publicação/execução
quando os alvos, a revisão e a retirada estiverem suficientemente delimitados.
Após prova, retirar somente recursos exatos autorizados, em ordem de dependências,
preservando output, recibos, imagem/export local, OCR, site e performance.

## 6. Verificação local desta parcela

Oito testes Node de probe/imagem/perfil aprovados, zero failures/skips, usando
JDK 23 já instalado; fixtures locais/sintéticas, nenhuma VM ou native bootstrap.
Comando reproduzível, com `JAVA_HOME`/PATH do JDK existente:

```bash
node --test api/apps/translation-gateway/scripts/worker-isolation-probe.test.mjs api/apps/translation-gateway/scripts/worker-isolation-image.test.mjs api/apps/translation-gateway/scripts/worker-resource-profile.test.mjs
```

Recibo, ações, IAM/SDK e captura pública conferidos por hash; scanner de padrões
de token/chave sem achados, não auditoria exaustiva de segurança. Sintaxe do
coletor de inventário válida; 24 links locais nos três documentos conferidos,
Prettier direcionado e `git diff --check -- api/apps/translation-gateway` aprovados.

419 fontes/testes/configurações permanecem byte-idênticos à fotografia técnica
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`,
incluindo conferência do conjunto de caminhos. Maven/web/mobile/SDD não
reexecutados para redatar gates por inventário/receita sem mudança técnica.
Global mantém o EOF externo em `web/landing-page/src/shared/component/PlatformBadge.tsx:44`;
não corrigido fora de escopo. Registros locais pequenos, sem novo cache grande,
modelo, imagem de SO, instalação ou alteração da auditoria de performance.
