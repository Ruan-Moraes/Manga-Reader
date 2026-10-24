# Próximo ambiente de isolamento — 2026-10-12

**Recomendação: uma VM Compute Engine temporária com Docker/cgroup v2 para
diagnóstico. Não é escolha aprovada de produção nem autorização de criação.**

Ruan pediu continuar a decisão de ambiente para a 020, mantendo o renderizador
atual. Esta parcela usa apenas código/evidências locais e documentação pública.
Nenhuma credencial, instalação, upload, habilitação de API, criação ou execução
cloud. Não testar tradução de PDF, substituir Vision ou migrar o site.
020 continua `in-progress/open`; 021 permanece bloqueada. Defaults inalterados.
Continuação autorizada: Compute habilitado e efeitos conferidos; quotas,
catálogo/COS e cotação pública São Paulo consultados, sem VM/disco.
Launcher/core de coleta posteriormente preparados
[offline, com limites explícitos](worker-isolation-vm-preparation-2026-10-12.md).
Continuação corrente: [adapter preparado e COS identificado por metadata pública](worker-isolation-vm-reader-2026-10-12.md);
segurança/validação no host e criação ainda pendentes.
O [registro posterior](#10-quota-catálogo-e-receita-privada--2026-10-12)
é o estado corrente; seções anteriores preservam suas fotografias históricas.

## 1. Fatos e limites

O [diagnóstico Cloud Run](diagnostic-cloud-result-2026-10-12.md) observado teve
9 PASS, 3 FAIL e 6 UNKNOWN. Seus três recursos temporários foram retirados
com aprovação; arquivos/evidências locais permanecem. Não republicá-los ou
recuperar a conta por pressuposição.

O bloqueio observado foi namespace divergente de `0::/` e controles obrigatórios
não observáveis pelos parsers atuais. AS ilimitado era esperado no probe sem
bootstrap; `noexec` é defesa adicional, não critério novo da 020. Não concluir
que toda configuração Cloud Run ou todo serviço gerenciado seja incompatível.

Requisitos vêm de
[LinuxWorkerMemoryAdmission](../src/main/java/com/toonlira/translationgateway/infrastructure/rendering/LinuxWorkerMemoryAdmission.java),
[LinuxOomPolicy](../src/main/java/com/toonlira/translationgateway/infrastructure/rendering/LinuxOomPolicy.java)
e do [contrato de memória](rendering-memory-admission.md), não da plataforma
que for mais conveniente. Esta proposta não altera código, contratos, migrations,
Terraform, aceites SDD ou garantias. Não transforma OOM score em imunidade.

## 2. Alternativas e recomendação

| Caminho                    | Evidência / obstáculo                                                                                                                        | Decisão proposta para a próxima prova                                                                      |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| Repetir o Cloud Run atual  | Configuração testada não admitida; sem mudança concreta comprovada que exponha os controles faltantes.                                       | Não pagar outra rodada idêntica. Nova variante exige hipótese/configuração específica e aprovação.         |
| VM Compute Engine + Docker | Docker documenta cgroup v2, namespace privado e limites de recursos; podemos selecionar host/runtime e flags. Ainda não há prova nesse alvo. | **Primeiro candidato de diagnóstico**, não aprovação operacional.                                          |
| GKE                        | `podPidsLimit` documentado aceita 1.024..4.194.304, diferente de `pids.max≤64`; namespace e política OOM também exigem prova própria.        | Não abrir cluster neste marco. Não resolver com Pod privilegiado, escrita no host ou relaxamento do guard. |

Fundamento público: [Docker/cgroup v2](https://docs.docker.com/engine/containers/runmetrics/),
[limites Docker](https://docs.docker.com/engine/containers/resource_constraints/)
e [configuração de nós GKE](https://docs.cloud.google.com/kubernetes-engine/docs/how-to/node-system-config).
O limite de Pod não prova impossibilidade universal de outro runtime/configuração
Kubernetes; comprova que essa configuração documentada não atende diretamente
nosso contrato. A prioridade da VM é uma inferência de menor distância para o
harness existente, não benchmark de preço, segurança ou desempenho.

## 3. Candidata mínima, ainda não provisionada

- Projeto pretendido `toonlira-rm`; manter `southamerica-east1`. Zona, quota,
  organização/políticas e existência de recursos ainda não conferidas para Compute.
- VM x86_64 dedicada à rodada, on-demand, não Spot; sem auto-restart do
  diagnóstico, grupo gerenciado, autoscaling ou schedule. Não reutilizar VM do site.
- Candidata de catálogo `e2-highmem-2`: 2 vCPUs e 16 GB publicados. O container
  continua em **2 CPUs / 8 GiB**, não 16 GiB. Memória restante é margem proposta
  para SO/daemon/cache do host, não reserva atômica ou orçamento aprovado.
  [Catálogo E2](https://docs.cloud.google.com/compute/docs/general-purpose-machines?hl=en).
  Confirmar bytes/memória disponível e concorrência real no host; RAM do host
  não pode substituir `memory.max/current` dentro do container.
- Candidato de SO Container-Optimized OS LTS suportado, x86_64; COS 125 aparece
  no [catálogo de versões](https://docs.cloud.google.com/container-optimized-os/docs/concepts/versioning)
  com suporte até fevereiro de 2028. Resolver uma revisão exata e revisar
  kernel/Docker/runc/patches antes de criar. Não usar família móvel como pin
  definitivo, nem assumir cgroup v2/controles apenas pelo nome COS.
- Não usar `create-with-container`/`gce-container-declaration`/konlet: a
  [documentação de depreciação](https://docs.cloud.google.com/compute/docs/deprecations/container-startup-agent-on-compute)
  registra desligamento em 31/07/2026. Preparar posteriormente configuração
  explícita de inicialização, sem daemon restart que repita o probe.
- Sem IP externo, porta de aplicação, endpoint público ou chave SSH/SA gerada.
  Identidade dedicada sem papéis de mídia/provider; somente permissões revisadas
  para imagem de diagnóstico e canal de coleta. Não anexar conta default ou `ocr-eval`.
- Pull no host, antes da execução, de uma única imagem por digest. A imagem
  local preservada é candidata histórica, não nova aprovação CVE/runtime.
  Validar novamente segurança/freshness antes de republicar; aquisição/cache
  grande não é implícita. Não copiar `.local`, credenciais, mídia ou repositório.
- Sub-rede/rotas/DNS/Private Google Access e canal privado de administração/coleta
  serão identificados no pré-flight, sem alterar rede compartilhada. O acesso
  privado ao registry não é automático por remover o IP externo.
  [Private Google Access](https://docs.cloud.google.com/vpc/docs/configure-private-google-access).
  Não criar NAT, IP, túnel ou regra de firewall por conveniência sem escopo/custo.

O programa não recebe credenciais ou acesso à metadata da VM: primeira execução
usa `--network=none`, sem sockets Docker ou binds do host no container.
Administração do Docker pertence ao host; isso não autoriza `--privileged`,
root na aplicação ou capabilities adicionais. Instrumentação própria continua
em Node/Java; este marco não adiciona Python/C, ferramenta ou SDK novo.

## 4. Controles a configurar e comprovar

Flags são proposta de configuração Docker, **não comandos executados ou garantia
de observação no alvo**. Não montar `/sys/fs/cgroup` do host para falsificar o
namespace privado, escrever controles durante a task ou alterar política global OOM.

| Requisito                         | Configuração candidata / prova necessária                                                                                                             |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| JVM PID 1, cgroup privado `0::/`  | Entrypoint Java direto, sem init intermediário; `--cgroupns=private`; conferir dentro do container.                                                   |
| Memória finita ≥8 GiB e swap zero | `--memory=8g --memory-swap=8g`; reler `memory.max/current` e `memory.swap.max`. Igualar os flags não dispensa suporte/observação do kernel.           |
| PIDs finitos ≤64                  | `--pids-limit=64`; reler `pids.max`, incluindo threads/filhas no orçamento.                                                                           |
| Grupo OOM=0; supervisor score≤0   | Ler valores reais antes do bootstrap; não mudar grupo do host ou tornar o pai imune. Escrita self-only da filha +1000 é prova posterior.              |
| Scratch tmpfs ≤512 MiB            | `/work` dedicado de 512 MiB; noexec/nosuid/nodev como defesa adicional. Conferir tipo, capacidade e flags. Memória de tmpfs conta no mesmo orçamento. |
| Pai AS=3 GiB; filha AS≤3 GiB      | Usar bootstrap Java existente na prova nativa posterior e reler limites; não rodar `prlimit` privilegiado ou escolher PID arbitrário.                 |
| Orçamento e margem corrente       | Tetos pai/filha + scratch + reserva de 1 GiB dentro do cgroup; releitura antes do lançamento. Não equivaler AS/heap/RSS a RAM total.                  |
| Aplicação restrita                | UID/GID numéricos não root, rootfs readonly, cap-drop ALL, no-new-privileges, sem rede/portas/binds na prova independente.                            |

Docker documenta que `--memory-swap` igual a `--memory` impede swap no container;
`free` não prova esse limite. Não usar `--oom-kill-disable`, `--pid=host`,
namespace cgroup host ou escrita de `memory.oom.group` para fabricar aprovação.

## 5. Sequência incremental e aceites separados

1. **Pré-flight autenticado somente leitura, sujeito a confirmação:** projeto,
   API Compute, quotas, zonas/tipo de máquina, imagem SO exata, recursos/rede e
   permissões da identidade existente. Registrar comandos/resultados sanitizados.
   API desligada ou permissão ausente vira pendência; não habilitar/grantar.
   Não gerar token/chave como artefato, trocar ADC ou instalar componente CLI.
2. **Receita e orçamento locais:** preparar launcher/configuração revisável,
   inventário exato dos recursos novos, coleta privada, pins/hashes, limites e
   retirada. Cotar VM, disco, registry, rede e logs; aprovação financeira antes
   de qualquer criação/push/execução. Só baixar/instalar após autorização própria.
3. **Uma prova independente na VM, após aprovação:** usar o probe Java existente,
   sem Spring, SQL, codecs/modelo/providers/mídia. Diretório/ID exclusivo;
   captura original, estados e hashes antes da retirada. Não refazer diante de
   confirmação perdida, restart ou timeout. AS ilimitado pode permanecer nessa
   primeira triagem sem bootstrap; manter seu FAIL visível, sem chamar o relatório
   de admissão. Namespace/controles obrigatórios UNKNOWN/FAIL bloqueiam avanço.
4. **Admissão nativa separada:** somente com triagem favorável e autorização
   própria, levar pacote/harness revisado para preparar pai, provar syscalls,
   limites/score da filha, orçamento e recuperação. Usar fixture sintética e
   providers falsos, nunca nova chamada Vision/Translation para esse teste.
   Um teste positivo não fecha contenção agregada ou o AC-006 inteiro.
5. **Integração e produção, fora desta decisão:** só depois tratar transporte
   de tasks/IAM, SQL/GCS, retenção, falhas e ciclo de vida do worker. Não inventar
   aqui endpoint VM, split de serviços ou consumo do renderer pela 021.
   Promover status/gates somente mediante evidências e workflow SDD próprios.

Apenas escolher a VM para prova não migra o worker operacional, gateway ou site.
O plano Terraform Cloud Run permanece preservado/desabilitado; não usar apply,
`-target`, waiver ou mudança de default para destravar este diagnóstico.

## 6. Custos, recuperação e preservação

**Cotação regional e custo real pendentes.** O valor histórico do Job Cloud Run
não vale para a VM. Separar tempo de inicialização/execução/coleta de retenção
de disco/registry/logs/rede; budget/deadline não é teto de cobrança. Não prometer
free tier ou que desligar uma VM retire todos os custos.
[Preços Compute](https://cloud.google.com/products/compute/pricing).

Antes de criar: aprovar os alvos novos e sua retirada, definir prazo de operação,
donos e lista exata de objetos a preservar. Após prova: coletar resultados, conferir
terminalidade e excluir somente recursos temporários explicitamente autorizados.
Preservar logs, capturas, imagem original/export local, site, OCR e performance.
Falha parcial exige recibo e ação pontual, nunca limpeza global do projeto/bucket/
Docker/disco. Não reconstruir caches grandes no Mac para este marco documental.

## 7. Estado desta entrega

| Item                                                 | Estado                                                                              |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Requisitos do código e evidência Cloud Run           | Reconciliados localmente; guards intactos.                                          |
| Próximo candidato                                    | VM recomendada apenas para diagnóstico; não provisionada/aprovada operacionalmente. |
| Documentação Docker/GKE/Compute/COS                  | Consultada publicamente; suporte documental não substitui teste.                    |
| Projeto Compute/quota/zonas/SO/rede/IAM              | Pendentes de pré-flight autorizado.                                                 |
| Cotação/criação/publicação/execução                  | Não realizadas; aprovações específicas pendentes.                                   |
| Worker/renderer na VM, OOM agregado e stack completa | Não testados; permanecem abertos.                                                   |

Validação local: quinze links relativos nos dois documentos alterados conferidos,
formatação direcionada e diff-check do gateway aprovados. Probe histórico com hash
íntegro e contagens 9/3/6; 419 fontes/testes/configurações byte-idênticos à fotografia
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`.
Oito testes Node existentes aprovados, zero falhas/skips, JDK 23 local, sem
Docker/downloads/providers: `worker-isolation-probe.test.mjs`,
`worker-isolation-image.test.mjs` e `worker-resource-profile.test.mjs`.
As fixtures são sintéticas, não novas observações na VM.

Diff-check global mantém a linha em branco EOF alheia em
`web/landing-page/src/shared/component/PlatformBadge.tsx:44`, preservada.
Maven/web/mobile/SDD não reexecutados ou redatados por esta análise documental
sem código/contratos alterados. Conclusões e recibos históricos mantidos;
nenhuma nova promoção de gate.

## 8. Pré-flight autorizado, bloqueado pela API — 2026-10-12

Ruan respondeu «Sim» ao uso da credencial existente para consultas somente
leitura de Compute, quotas, zona, imagem, rede e permissões. Rodada principal
entre **18:09:38–18:09:49 de Brasília** (America/Sao_Paulo; 21:09 UTC), nove
ações validadas, sem mutações. Fonte de credencial corresponde à conferência
anterior; sem login, troca ADC, impersonação ou chave gerada pelo executor.

| Item                                                          | Resultado / estado                                                                                               |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Projeto                                                       | `toonlira-rm`, lifecycle ACTIVE; validado.                                                                       |
| Faturamento                                                   | Vinculado/habilitado; validado, sem afirmar crédito, free tier ou teto.                                          |
| Hierarquia                                                    | Um projeto, zero pastas/organizações na consulta; validado.                                                      |
| API Compute                                                   | **Desabilitada; bloqueia inventário de Compute.** Nenhum pedido de enable enviado.                               |
| API IAM / Artifact Registry                                   | Habilitadas; não modificadas pelo executor.                                                                      |
| API IAP / Org Policy v2                                       | Desabilitadas; não habilitadas automaticamente. Não bloqueiam esta consulta IAM v1.                              |
| Permissões do operador no projeto                             | 34 solicitadas/34 retornadas por `testIamPermissions`; nenhuma ausente nessa lista.                              |
| Quotas, zonas e `e2-highmem-2`                                | Não consultados após detectar API desligada; pendentes, não zeros ou indisponibilidade comprovada.               |
| COS exato e suporte/cgroup/patches no alvo                    | Não consultados/testados; pendentes.                                                                             |
| VMs/discos, rede, rotas, firewall/NAT e Private Google Access | Não consultados; pendentes. Nenhum recurso reutilizado por pressuposição.                                        |
| Conta Compute padrão / conta OCR                              | Consulta complementar confirmou conta Compute padrão já existente/ativa e conta OCR presente; nenhuma alteração. |

O teste de permissões fez um POST **semanticamente somente leitura** à
[API Resource Manager `testIamPermissions`](https://docs.cloud.google.com/resource-manager/reference/rest/v1/projects/testIamPermissions),
com token da credencial existente só em memória. Não é criação, grant ou prova
de sucesso futuro de `instances.create`: políticas/condições de recurso, quotas,
API e identidade runtime continuam separadas. A lista cobriu leitura, criação/
remoção futura de VM/disco, metadata/conta anexa, rede, leitura de imagem,
conta de serviço e habilitação de API; **consultar não autoriza essas ações**.

IAM do projeto manteve o mesmo hash antes/depois, oito bindings sem públicos.
Manifests dos componentes CLI mantidos em todas as consultas; comandos GA
existentes, sem `alpha`/`beta` ou instalação. Cache/logs usuais da credencial
podem ser atualizados pelo CLI. Recibos não contêm tokens, e-mails pessoais,
corpos integrais de IAM, IPs ou conteúdo de metadata da VM.

### Conferência complementar das políticas, sem alteração

Via Resource Manager v1 já disponível, consultas efetivas de
`iam.automaticIamGrantsForDefaultServiceAccounts` e
`compute.skipDefaultNetworkCreation` terminaram exit 0 e retornaram o constraint
esperado e `booleanPolicy` sem campo `enforced`. Verificador inicial exigia
boolean explícito e registrou ambas como inconclusivas; inspeção sanitizada de
formato esclareceu o motivo, preservando o recibo inicial. Não foi falha de
permissão nem API desligada nessa consulta.

O [contrato BooleanPolicy](https://docs.cloud.google.com/resource-manager/reference/rest/v1/Policy)
define enforcement pelo boolean; valores default podem ser omitidos no
[formato Protobuf JSON](https://protobuf.dev/programming-guides/json/).
Não tratar esse retorno como `enforced=true` ou comprovação de proteção contra
grant automático/rede padrão. Políticas managed/condicionais adicionais não
foram inventariadas, portanto não alegar auditoria integral ou alterar controles.

Conta Compute padrão existente não será anexada à VM por conveniência. A
[documentação Compute](https://docs.cloud.google.com/compute/docs/access/service-accounts)
descreve criação automática/default e possíveis grants de Editor conforme as
políticas; o estado concreto dos grants dessa conta não foi inferido do seu
nome/existência. A [rede default](https://docs.cloud.google.com/vpc/docs/vpc)
pode ter regras pré-populadas, mas rede/firewalls reais do projeto seguem sem
consulta enquanto Compute está desligado. Não presumir inexistência ou privacidade.

### Recibos e próximo pedido

| Recibo privado                 | SHA-256                                                            |
| ------------------------------ | ------------------------------------------------------------------ |
| Principal, nove ações          | `c8375d6e1b97435f6466ea0ba57cc12bc41d3c91e1f2a7b7a3ce5ee8c9c65b30` |
| Contas/políticas, quatro ações | `9e742207811ab2898c2ece92d315f6abe49f909e74bcb1fb527d63734a1f389e` |
| Esclarecimento do formato      | `cf5798cdbf0d17a6885b83d17a30515dfe3a09c3d0765bded7c778b772e31837` |

Estado final: `blocked-compute-api-disabled-no-enable`. Próxima ação proposta
exige autorização específica: enviar **somente** pedido de habilitação de
`compute.googleapis.com`, seguido de consultas para registrar estado de APIs,
identidades/IAM e rede. Serviços podem ter efeitos automáticos; apresentar
diferenças e interromper se inesperadas, sem grant/revogação, exclusão de conta,
rede ou API como rollback automático. Esta aprovação não cobre habilitar IAP/
Org Policy v2, criar VM/disco/registry/firewall, publicar imagem ou usar provider.

A habilitação proposta não inicia uma VM; nenhuma aprovação financeira de
computação foi concedida por este pré-flight. Cotação, segurança, receita/pins
e aprovação da criação/execução continuam marcos separados. 020/021 inalteradas;
site, OCR, arquivos da auditoria de performance e evidências históricas preservados.

Fechamento desta operação: três recibos/hashes e status/bloqueio/34 permissões
conferidos, scan de padrões de token/chave sem achados, três scripts JS com
sintaxe válida, dezesseis links locais e Prettier direcionado aprovados.
419 arquivos técnicos ainda byte-idênticos à fotografia anterior. Diff-check
do gateway aprovado; global conserva o EOF externo já registrado. Nenhum Maven,
web/mobile/SDD ou teste cloud foi reexecutado para redatar gates por este inventário.
Somente registros pequenos adicionados, sem recriar caches ou tocar performance.

## 9. Compute habilitado e efeitos conferidos — 2026-10-12

Ruan respondeu «Sim» ao pedido de habilitar somente `compute.googleapis.com`
e conferir efeitos em APIs, identidades/IAM e rede, sem VM/disco/OCR. Uma
invocação CLI de `services enable compute.googleapis.com --project=toonlira-rm`,
às **18:27:28 de Brasília**, atingiu timeout local de 55 s. Primeira listagem
ainda sem Compute: recibo inicial preservado como inconclusivo, não falha terminal.
Não repetir, cancelar, desabilitar API ou executar rollback por suposição.

Reconciliada a **mesma operação**, cuja referência foi recuperada somente do log
local desse comando, delimitado pelo horário e pelos argumentos. Sem copiar/expor
log bruto, token, credencial ou ID operacional no Git. GET da operação original
confirmou `done=true`, ausência de erro e `EnableServiceResponse` às 18:33:45–50;
listagens posteriores confirmaram Compute habilitado. Não foi outro enable.
[Consulta oficial da operação](https://docs.cloud.google.com/service-usage/docs/reference/rest/v1/operations/get).

Duas limitações do tooling registradas: campo inicial de `gcloud info` para logs
não existia (correto `logs.logs_dir`), e regex inicial truncou a referência no
ponto. Ambas corrigidas somente em novas parcelas de consulta; recibos anteriores
preservados. Consulta com referência completa resolveu a confirmação perdida.
Não alterar código de produção ou repetir mutação para resolver erros de coleta.

### Diferenças observadas e preservação

| Item                    | Observação confirmada                                                                                                                                       |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| APIs                    | 50 → 52; adicionadas Compute e `oslogin.googleapis.com`, nenhuma anterior removida. Só houve pedido explícito de Compute.                                   |
| IAM do projeto          | 8 → 10 bindings; duas memberships adicionadas, zero removidas e zero bindings públicos.                                                                     |
| Roles adicionados       | `roles/compute.serviceAgent` no agente Compute do projeto e `roles/compute.instanceGroupManagerServiceAgent` no Google APIs Service Agent do mesmo projeto. |
| Contas listadas         | Três, com hashes de identidade/IDs/estado iguais antes/depois. Agentes gerenciados não são inventário equivalente à listagem de contas user-managed.        |
| Conta Compute padrão    | Já ativa com `roles/editor` **antes** do enable; papel mantido, não grant do executor nem identidade admitida para a VM.                                    |
| Conta OCR               | Presente; memberships/roles do projeto inalterados. Bucket, credencial de avaliação e mídia não foram tocados.                                              |
| VMs / discos no projeto | Listagens globais bem-sucedidas: zero / zero. Nenhum criado ou reutilizado.                                                                                 |

Memberships comparadas por role, condição e hash do principal, não só contagem.
Hashes dos dois novos principals conferidos contra os nomes exatos dos service
agents do projeto já identificado. São compatíveis com os papéis gerenciados
descritos em [tipos de service accounts](https://docs.cloud.google.com/iam/docs/service-account-types)
e [IAM Compute](https://docs.cloud.google.com/compute/docs/access/iam).
Nenhum `add-iam-policy-binding`, chave ou grant manual pelo executor.

O aumento de APIs/IAM foi observado após a operação; não foi auditada causalidade
integral de cada mudança/dependência ou concorrência. Não afirmar que solicitamos
OS Login, que ele implica OS Login configurado na VM, ou que não houve efeitos
automáticos só porque a ferramenta não enviou grants. APIs/agentes não serão
removidos automaticamente, nem a conta padrão alterada sem analisar consumidores.

### Rede observada, não admitida para a prova privada

Conferência entre **18:34:46–18:34:57 de Brasília**: uma rede `default`, modo
auto, roteamento regional; uma sub-rede consultada em São Paulo, IPv4,
`privateIpGoogleAccess=false`. Quatro regras clássicas de ingress ativas:
ICMP, interno, RDP e SSH. Regras ICMP/RDP/SSH incluem origem Internet e todos os
targets; não expõem por si só uma VM inexistente nem comprovam alcance efetivo
sem verificar políticas hierárquicas, interfaces/rotas e endereços.

Quarenta e três rotas listadas; uma default via default-internet-gateway e
42 outras, sem persistir ranges/IPs nos recibos. Rede não tinha baseline legível
antes do enable, pois Compute estava desligado. **Não atribuir a criação desses
objetos exclusivamente a esta operação**, nem presumir que sejam temporários.
[Rede padrão e regras](https://docs.cloud.google.com/vpc/docs/vpc).

Não alterar/excluir a rede default, sub-rede, regras ou rotas para tornar a prova
verde. A candidata sem IP externo precisa de receita privada própria, incluindo
DNS/rota/PGA e coleta, antes de criação autorizada. Ausência de PGA observado não
prova ausência de todo outro acesso possível; comprova que esse campo não está
habilitado nessa sub-rede. Não criar NAT/firewall/IAP ou conceder acesso por impulso.

### Recibos, limites e próxima etapa

| Recibo privado                       | SHA-256                                                            |
| ------------------------------------ | ------------------------------------------------------------------ |
| Enable único com timeout, sete ações | `488cc91e939c4eee8f2a2c09f4e771cd3ee8dca83b5c213a49695edc2bf50d75` |
| Primeira reconciliação incompleta    | `79ab3cbc713a40f951f9d3932e649c59971607bddf75bb06d628ec15203efb88` |
| Estado habilitado/ref truncada       | `0a69f7468089e1bd6f15195bfecdc6747a020c8cb34d5a5bf91e59b7507c8b7f` |
| Operação completa/estado, sete ações | `321544402d1d979bdffe2776ebdf0ebd210bd27fb6c87ac91777caf9c83b2e4e` |
| Efeitos atuais, dez ações            | `67a166bb1f1cf8bc12a48df029caa5c7ab0773941bf95556d6d47194de04dc1e` |

Estado corrente: **Compute habilitado, efeitos inventariados, provisionamento
não iniciado**. SDK/manifests iguais em todas as parcelas; sem instalação, login,
troca ADC/impersonação, nova chamada paga, upload, alteração de performance ou
cleanup abrangente. Cache/logs usuais do CLI podem ser atualizados. Esta ação
não mediu cobrança real nem aprovou orçamento de VM/armazenamento.

Próxima etapa: concluir as consultas de quotas/zona/COS que estavam bloqueadas
e preparar receita/pins, rede/identidade privadas, segurança e cotação. Aprovações
de criação/publicação/instalação/execução continuam próprias; não aproveitar a
permissão de enable para iniciar VM, SQL/GCS/Tasks, native bootstrap ou providers.
Nenhum requisito de isolamento foi rebaixado; 020 aberta, 021 bloqueada.

Fechamento local: cinco recibos/hashes conferidos; uma invocação de enable,
operação original terminal sem erro, inventário de efeitos íntegro e scan de
padrões de token/chave sem achados. Cinco scripts JS com sintaxe válida,
dezessete links locais, Prettier direcionado e diff-check do gateway aprovados.
419 arquivos técnicos continuam byte-idênticos à fotografia registrada. Global
conserva o EOF externo em `PlatformBadge.tsx:44`; Maven/web/mobile/SDD não
reexecutados para redatar gates por esta operação cloud/documental. Registros
pequenos preservados, sem novo cache grande ou alteração da auditoria de performance.

## 10. Quota, catálogo e receita privada — 2026-10-12

Retomada da autorização somente leitura após habilitação de Compute. Nove ações
GA entre **18:43:43–18:43:54 de Brasília**: quotas regional/projeto, zonas,
`e2-highmem-2`, metadata da família COS e conferências IAM/API/SDK. Quota E2
regional 24 vCPUs/uso 0; global 32/uso 0; três zonas `UP`; catálogo da zona a
confirma 2 vCPUs/16.384 MiB. Não reservar capacidade ou selecionar zona por isso.

COS candidato fixado por metadata: `cos-cloud/cos-125-19216-739-5`, x86_64,
`READY`, disco mínimo 10 GB. Nenhum download; nome/ID não é aprovação de
patches/kernel/runtime/cgroup. Recibo SHA-256
`f59125fb72c00a7668397a35189ad8db107caa5e71e8d31d86299c7044e54109`.
IAM permanece com 10 bindings/hash igual antes/depois; SDK/manifests iguais.

Preparada [receita privada e cotação](worker-isolation-vm-recipe-2026-10-12.md):
VPC/subnet próprias com PGA, host com leitura restrita do registry, container
sem rede e coleta serial via API enquanto a VM estiver running. Sem SSH/IAP,
IP externo, NAT, ingress ou credenciais na aplicação. PGA básico não é allowlist
de egress; permissões/políticas/launcher ainda requerem revisão antes de criar.

Cotação pública regional verificada na tabela São Paulo: VM US$ 0,1434924/h,
disco zonal padrão US$ 0,000082192/GiB-h. Exemplo de dez minutos VM+10 GiB
≈ US$ 0,02405, sem impostos/outros custos/garantia de tempo. Não é orçamento
aprovado ou cobrança real; armazenamento continua após stop. Captura e fórmula
privadas, sem dado financeiro da conta no Git.

Estado: **pré-flight/cotação preparados; launcher, segurança e autorização de
provisionamento/execução pendentes**. Nada criado, instalado, enviado ou pago
nesta parcela; nenhum provider ou bootstrap iniciado. Não alterar guards,
defaults, 020/021, rede default, site, OCR ou auditoria de performance.

Fechamento: recibo/captura conferidos, oito testes leves verdes, 24 links locais,
Prettier direcionado e diff-check do gateway aprovados. Conjunto e bytes dos
419 arquivos técnicos iguais à fotografia anterior. Sem redatar Maven/web/mobile/
SDD; EOF global alheio preservado. [Detalhes de verificação](worker-isolation-vm-recipe-2026-10-12.md#6-verificação-local-desta-parcela).

## 11. Launcher local e revisão parcial — 2026-10-12

Após «Vamos indo», gerador cloud-init/systemd e core de coleta preparados em
parcela local exclusiva/ignorada, sem gcloud, credenciais, instalação ou rede de
serviço. Testes sintéticos cobrem colisão/concorrência, injection, chunks/cursor,
timeout/interrupção, frames ambíguos, campos sensíveis e FAILs não escondidos.
Marcador stateful antes do pull/probe impede retomada automática; sem mudar
guard/runtime/default. Sintaxe YAML validada pelo Prettier já instalado.

[Relatório desta preparação](worker-isolation-vm-preparation-2026-10-12.md)
preserva hashes e limites: onze testes novos e oito leves existentes, security
review parcial; imagem/scan histórico íntegros, caches descartados ausentes,
sem novo scan. Fonte/pacote/COS/Linux/devices e adapter Google continuam com
verificações próprias abertas. Não confundir geração local com execução em VM.

Estado corrente: **preparação offline avançou; provisionamento/execução e
aprovação operacional não iniciados**. Não criar rede/registry/SA/VM ou emitir
grants antes de delimitar revisão, custo e alvos e obter confirmação. 020 aberta,
021 bloqueada; site, OCR e arquivos da auditoria de performance preservados.

## 12. Adapter read-only e metadata de componentes — 2026-10-12

Após «Vamos indo», adapter GA preparado com consultas fixas, validação de fonte,
VM/disco/metadata antes/depois, serial 2 bounded, cancelamento e sanitização.
31 testes leves aprovados, nenhum runner/credencial real ou mutação cloud.
Configuração SDK consultada somente por leitura dos fontes vendor, sem execução
ou instalação. Não confundir adapter implementado com consulta operacional.

JSON público COS do build `19216.739.5` obtido sem auth às 19:58–19:59 de
Brasília: nomes/ebuilds de kernel, Docker, runc, containerd, systemd e helper
identificados, com hash conferido; zero software adquirido/instalado. Primeiro
parser não selecionou campos separados e ficou registrado, depois esclarecido.
Ainda não é attestation do host, patches ou aprovação CVE.

[Relatório corrente](worker-isolation-vm-reader-2026-10-12.md) separa a entrega
offline dos gates restantes: revisão CVE/backports/JRE, unidade Linux, nomes/
IAM/PGA/políticas e confirmação específica de criação/publicação/execução/custo.
Não alterar guard/default/status ou tocar recursos/credenciais/performance para
resolver essas pendências. 020 aberta, 021 bloqueada, nenhuma VM iniciada.

## 13. Segurança da candidata: pull bloqueado — 2026-10-13

Revisão pública de advisories, ebuilds e fontes pinados encontrou a lógica
associada à CVE-2026-92543 ainda nos fontes Docker selecionados pelo COS.
Não é somente comparação de versão; patches de outros CVEs foram identificados
sem atribuir a eles correção do registry. Não houve exploit ou atestação binária.

**Receita candidata não aprovada para criação/execução.** O pull do host usa
credencial, e digest/container sem rede/PGA não comprovam mitigação do risco de
DNS/TLS. Investigar pin corrigido ou mitigação própria de DNS/egress antes de
aprovação financeira; nenhuma troca de SO ou alteração cloud foi realizada.

[Relatório corrente de segurança](worker-isolation-vm-security-2026-10-13.md)
preserva os hashes, limitações de containerd/kernel/helper, JRE atual versus
cobertura de scan e unidade apenas conferida documentalmente. 27 testes locais
aprovados, sem credencial/SDK, pacote, VM, provider ou arquivo de performance.
020 aberta/021 bloqueada; globals e histórico SDD não redatados.

## 14. Alternativa LTS e mitigação privada preparada — 2026-10-13

Outra revisão LTS publicada, COS 133 `19999.44.106`, foi conferida por metadata,
ebuild e fonte correto. Também mantém a lógica DNS/TLS problemática; nenhuma
troca de pin, instalação ou alegação de que todos os builds foram auditados.
Tentativas preparatórias de seleção/caminho incorretos preservadas e esclarecidas.

[Rascunho corrente do pull privado](worker-isolation-private-pull-2026-10-13.md)
propõe DNS privado exato e egress TCP 443 ao VIP restrito, sem internet geral,
perímetro VPC-SC presumido ou garantia de acesso exclusivo ao repo. Sete testes
novos passaram; 34 com regressões. Modelo somente local, não request executável
ou implementação do guard Linux. Launcher/leitor anteriores permanecem iguais.

A proposta adicionaria uma API/zona Cloud DNS com cobrança própria, ainda não
habilitada/criada/autorizada. Antes de qualquer credencial/provisionamento,
completar validação do host/políticas e apresentar alvos/custo/retirada. 020 aberta,
021 bloqueada; nenhuma ação na cloud, site, performance ou pipeline ativo.

## 15. Guard Java e integração local antes do pull — 2026-10-13

[Verificador pré-pull preparado](worker-isolation-prepull-guard-2026-10-13.md):
Java checa endereços observados e TLS sem HTTP/ADC; camada do gerador acrescenta
hashes e prazo externo antes do pull, preservando intent/limites/coleta anteriores.
Fixtures passaram no Java 23/25 e seis checks Linux sem rede verificaram falhas
de integridade, ausência e timeout. Não é consulta real, instalação ou prova COS.

Runtime do host não preparado. Próxima confirmação proposta: preparar localmente
JRE dedicado a partir da imagem existente (cerca de 191 MiB, limite adicional
512 MiB), sem downloads/instalação no macOS/cloud; auditar bindings e compatibilidade
antes de instalação/upload futuro. Nenhum custo/API/zona/VM foi aprovado por esta
parcela. Risco residual de DNS/daemon, segurança do runtime e operação permanecem
abertos; 020 aberta, 021 bloqueada. Fonte de produção e performance preservadas.

## 16. JRE dedicado copiado e vinculado — 2026-10-13

Após continuação ao pedido delimitado, [runtime preparado localmente](worker-isolation-prepull-runtime-2026-10-13.md):
122 arquivos, 142 links internos e licenças preservados; hashes conferidos contra
origem. Archive + árvore usam aproximadamente 381 MiB, abaixo dos 512 MiB
autorizados. Sem downloads, pacote novo, instalação no Mac/cloud ou credencial.

Novo pacote local tem bindings reais e foi testado com o JRE original oculto:
truststore de 118 entradas, fixtures e checksums passaram. 44 testes Node,
cinco checks do pacote e 50 fixtures Java; não são prova COS ou aprovação geral.
Runtime/Gateway anteriores e auditoria de performance preservados.

Entregar JRE à VM antes do Docker pull exige bootstrap privado independente,
ainda não preparado. Não criar loop baixando o guard pelo pull vulnerável,
reusar OCR ou expor URL/objeto público. Próximo: desenhar essa entrega/retirada
e completar segurança/preflight antes de ações cloud confirmadas. 020 aberta,
021 bloqueada; nenhuma imagem ou metadata foi publicada.
