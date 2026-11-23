# Próximo perfil de prova restrita — plano, 2026-10-19

Este documento **não admite execução cloud**. Parte da
[quarta prova e diagnóstico real](worker-isolation-fourth-native-attempt-2026-10-19.md).
Os recursos ativos anteriores foram retirados; locks e evidências permanecem.

## Decisão de segurança

Descartar E2 padrão com `TERMINATE` como combinação impossível; não repetir a
tentativa e não substituir o guard por `MIGRATE` para obter aprovação. A
[restrição oficial de E2](https://docs.cloud.google.com/compute/docs/instances/setting-vm-host-options)
deve entrar no pré-flight antes de qualquer staging ou reserva.

Não confundir prova de montagem com escolha de produção. Prova de shell/mount
não executará Java, renderer ou provider, mesmo se a VM estiver disponível.

## Candidatos e progresso

O [contrato Spot offline](worker-isolation-spot-contract-2026-10-19.md) foi
implementado e testado sem executor nativo. O
[protocolo de rejeição HTTP 400](worker-isolation-http400-protocol-2026-10-19.md)
também foi validado offline, sem migrar contextos anteriores. Isso entrega as
parcelas locais dos passos 1–4 abaixo, mas não admite cloud: a ligação nativa,
a admissão financeira/quota e os gates desse conjunto continuam abertos.
A alternativa N1 permanece somente investigação.

Continuação de 2026-10-20: a [investigação N1](worker-isolation-n1-investigation-2026-10-20.md)
confirmou somente metadados via dois GETs e preços próprios do candidato.
Contrato de execução/admissão N1 permanece por preparar; não houve fallback,
reserva ou criação de VM. Esta evidência não altera a restrição de E2 STANDARD.

Continuação posterior: o [contrato/admissão N1 offline](worker-isolation-n1-contract-2026-10-20.md)
foram implementados e testados com CAS5 e transporte concreto. A quota STANDARD
foi observada por GET, sem aumento. Operador e preflight real N1 ainda precisam
ser preparados; não houve execução ou fallback cloud.

A [preparação posterior de preços e quotas](worker-isolation-spot-admission-preparation-2026-10-20.md)
validou o parser Spot e realizou somente dois GETs de quota. A métrica
preemptible com limite zero ainda não estabelece qual regime se aplica;
não foi liberado fallback nem criada VM para descobrir seu comportamento.

| Candidato                    | O que preserva                            | Gate adicional                                               |
| ---------------------------- | ----------------------------------------- | ------------------------------------------------------------ |
| E2 micro Spot, só mount-only | 1 GiB, tipo atual e término em manutenção | Wire schema, preempção, disponibilidade/quota e preço atual  |
| N1 custom 1 vCPU / 1 GiB     | RAM e modelo não interrompível            | Novo tipo/CPU, preço, disponibilidade e contrato de metadata |
| E2 padrão + MIGRATE          | Não é candidato neste marco               | Mudaria a política exigida; não usar fallback silencioso     |

E2 Spot é a primeira investigação para a prova curta por preservar a forma de
memória/CPU existente, não decisão de produção. Conforme a
[documentação Spot](https://docs.cloud.google.com/compute/docs/instances/spot),
pode haver preempção a qualquer momento. Interrupção deve produzir falha
explícita e retirada, nunca recriação automática ou repetição de provider.
O [contrato REST Spot](https://docs.cloud.google.com/compute/docs/instances/create-use-spot)
precisa ser conferido: não presumir que campos explícitos aceitos em STANDARD
podem ser enviados iguais em SPOT, nem presumir shape da resposta.

N1 custom com 1 vCPU/1 GiB é alternativa de investigação documentada nos
[limites de máquinas customizadas](https://docs.cloud.google.com/compute/docs/general-purpose-machines#n1_custom_machine_types).
Muda CPU, mas não amplia a RAM para mascarar o gate de memória. Disponibilidade
na zona, preço real e restante do contrato ainda não foram verificados.

## Execução incremental planejada

1. Implementar a rejeição antecipada da combinação conhecida e testes de
   compatibilidade. Versionar fontes novos; não editar operadores selados.
2. Preparar somente um perfil escolhido, com schema de request e validação
   de metadata efetiva. Manter sem SA/IP público/NAT/PGA, deny-all, prazo de
   600 s, sem restart e mount read-only/noexec/nosuid/nodev. Nenhum download.
3. Acrescentar observação sanitizada de rejeição HTTP real, preservando status,
   requestId/hash e distinção de dispatch/NOT_SENT. Não converter 400 em 403
   nem migrar journals v4 in-place para esconder a tentativa rejeitada.
4. Reexecutar gates integrais do grafo escolhido, incluindo preempção se Spot,
   ausência de segunda mutação, cleanup independente e integridade de fonte.
5. Antes de nova admissão: renovar preços/billing quando necessário para a
   janela completa, validar quota/modelo, ler os três escopos precedentes,
   conferir ledger e produzir review de escopo. Novo ID e reserva exclusiva.
6. Somente então executar uma prova mount-only e retirar seus recursos. Qualquer
   incompatibilidade nova volta ao diagnóstico; sem fallback ou retry implícito.

Os preços anteriores não serão redatados nem reaproveitados como cotação de
outro modelo/SKU. O teto autorizado continua USD 100, não um hard cap do Google.
Não haverá mudança legal/mobile, deploy ou chamada OCR/tradução nesse caminho.
O gate do worker completo continua separado e a 020 permanece aberta.
