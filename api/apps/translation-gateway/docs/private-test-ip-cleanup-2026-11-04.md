# Permissão de retirada do IP — 2026-11-04

A retirada automática do IP reservado continua sem autorização aplicável.
A revisão automática rejeitou a concessão proposta de
`compute.addresses.delete` no projeto à identidade de limpeza porque o alcance
poderia incluir outros IPs. A rejeição deve permanecer no histórico; não foi
aplicada nem contornada.

Foi consultada a [lista oficial de atributos de recurso para IAM Conditions](https://docs.cloud.google.com/iam/docs/conditions-resource-attributes)
em 2026-11-04: ela lista vários tipos de recurso Compute Engine, mas não lista
`compute.googleapis.com/Address` nem um formato de nome de endereço regional
para `resource.name`. Essa ausência não comprova que nenhuma alternativa
segura exista, mas impede presumir que uma condição por nome limitará a
permissão de apagar IPs. A [documentação de gerenciamento de acesso do Compute Engine](https://docs.cloud.google.com/compute/docs/access/managing-access-to-resources)
também exige consultar o suporte do tipo de recurso antes de atribuir uma
política a um recurso individual.

Até haver autorização explícita adequada ou solução comprovadamente limitada e
permitida pela revisão, não conceder a permissão rejeitada nem implantar uma
variante indireta para obter a mesma autoridade. O plano de prazo e orçamento
não substitui uma verificação efetiva de remoção do IP. A entrega permanece
pendente de gateway público, validações reais e APK com a URL efetiva.

## Autorização humana posterior

Em 2026-11-04, após ser informado de que `compute.addresses.delete` no projeto
pode atingir outros IPs, o usuário respondeu **“Sim”** à pergunta que autorizava
a concessão à identidade de limpeza. Esta resposta não apaga a rejeição
automática anterior nem altera a obrigação de interromper uma nova ação se a
revisão automática voltar a rejeitá-la. A proposta atual limita o papel às
permissões de leitura e exclusão de endereços e o período da concessão à janela
necessária; o alcance da permissão sobre endereços no projeto continua amplo.
O workflow preparado confere ID imutável, descrição, tipo e estado do endereço
antes de solicitar a exclusão. Essas verificações não reduzem o alcance IAM.

O papel `toonliraAddressExpiry1103` foi criado com `compute.addresses.get` e
`compute.addresses.delete` e concedido a `tl-test-expiry` no projeto, com
condição de término em 2026-12-07T03:00:00Z (fim de 6 de dezembro em São
Paulo). A política lida após a alteração confirmou o membro e a condição. A
concessão segue ampla sobre os endereços do projeto durante a validade.

O workflow `tl-translation-expiry-1103` foi atualizado para a revisão
`000003-af9`; ele exige ID e descrição esperados, endereço externo IPv4 e
estado `RESERVED` antes de excluir. A execução
`fbf1e564-691d-4e32-9f57-b9bab9947d06` em modo somente leitura terminou com
`dryRun=true`. Os IDs da VM e do IP ainda são provisórios (`1`); precisam ser
substituídos e testados antes de liberar o gateway. A prova de exclusão e a
remoção final de papel e binding continuam pendentes.
