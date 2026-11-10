# Estado dos controles do teste — 2026-11-04

Consulta de leitura ao projeto `toonlira-rm`: nenhuma VM com o nome
`tl-translate-test-1103` apareceu no inventário. O workflow de prazo estava
`ACTIVE`, com `VM_ID=1` provisório; o agendamento estava `ENABLED`, configurado
para 6 de dezembro entre 12h e 23h, fuso America/Sao_Paulo. O controlador de
orçamento estava pronto, mas também com `TARGET_INSTANCE_ID=1` provisório. Sua
política consultada não continha `allUsers` nem `allAuthenticatedUsers`; a
assinatura Pub/Sub consultada estava ativa e configurada com push autenticado.
A tentativa de consultar a política individual do workflow pelo comando usado
não foi suportada pelo CLI; esta consulta não prova sua política efetiva.

O ID `1` não identifica a futura VM. Antes de qualquer tráfego público, ambos
os controles precisam receber o ID imutável efetivo da VM, ter suas identidades
e permissões verificadas, e ser testados sem assumir que alertas de orçamento
sejam teto financeiro. O workflow não comprova a retirada do IP reservado; a
permissão correspondente continua pendente, como registrado em
[private-test-ip-cleanup-2026-11-04.md](private-test-ip-cleanup-2026-11-04.md).
A consulta não criou nem alterou recursos. Controles de longa duração e registry
existentes continuam sujeitos a custo e à retirada ao final da janela aprovada.

## Identidade dos providers

Consulta posterior somente de leitura: a conta
`tl-test-gateway@toonlira-rm.iam.gserviceaccount.com` existia, estava habilitada
e não possuía chaves gerenciadas pelo usuário. A política do projeto a vinculava
ao papel personalizado `toonliraGateway1103`, cujas permissões listadas eram
`cloudtranslate.generalModels.predict` e `serviceusage.services.use`; o registry
dedicado tinha uma vinculação `roles/artifactregistry.reader` para essa conta.
As APIs `vision.googleapis.com` e `translate.googleapis.com` apareciam como
habilitadas. A [documentação de permissões do Translation](https://docs.cloud.google.com/iam/docs/roles-permissions/cloudtranslate)
lista `cloudtranslate.generalModels.predict` para modelos gerais.

A consulta não demonstrou autorização efetiva ponta a ponta, acesso à imagem
por digest na VM definitiva, disponibilidade ou cobrança dos providers. Não
foram geradas chaves nem feitas chamadas pagas. É necessário validar essas
propriedades com a identidade e os recursos efetivamente implantados antes de
admitir mídia real.

O verificador local `infra/private-test/verify-control-readiness.mjs` recebe um
único JSON de evidências de leitura com `vm`, `controller`, `controllerIam`,
`subscription`, `workflow` e `scheduler`. Ele rejeita o ID provisório,
divergência entre VM/controlador/workflow, controlador público, push não
autenticado e agendamento diferente do aprovado. Os testes sintéticos passam.
Ele ainda não foi integrado à abertura do firewall e não prova efetividade do
IAM herdado, entrega de alerta, execução da parada, exclusão do IP, saldo ou
teto de cobrança; esses itens permanecem necessários antes da liberação.

## Retirada das regras de rede

A rede `default` tinha regras genéricas de SSH e RDP; a implantação foi
preparada com duas regras destinadas apenas à VM de teste: negação geral
`tl-translate-deny-1103` e liberação HTTP/HTTPS
`tl-translate-https-1103`, com prioridades explícitas. Elas ainda não foram
criadas. Para permitir sua retirada, foi criado o papel
`toonliraFirewallExpiry1103`, limitado a `compute.firewalls.get` e
`compute.firewalls.delete`. A vinculação proposta à identidade
`tl-test-expiry` tinha condição para os dois nomes exatos e prazo até
2026-12-07T03:00:00Z, mas foi rejeitada pela revisão automática por ausência
de autorização específica. A leitura posterior confirmou zero bindings para
essse papel. Não tentar contornar a rejeição.

O código local do workflow contém a verificação dos IDs e descrições dessas
regras, mas não foi publicado: a revisão ativa continua `000003-af9`, com os
IDs provisórios de VM e IP. A prova de provisionamento da configuração cifrada
foi executada em `mob020-meta-463c72ba`, com endereço e credenciais sintéticos;
o gateway respondeu a capacidades e identidade e o diário confirmou a
remoção da VM e dos recursos temporários (`cleanupErrors: []`). O mecanismo
não foi usado para provisionar o ambiente público.
