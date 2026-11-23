# Preparação offline do host N2 — 24/10/2026

Fotografia da preparação posterior à
[décima primeira rodada encerrada](worker-isolation-quota-operator-2026-10-24.md).
A 020 permanece `in-progress/open` e a 021 `approved/blocked`. Nenhuma VM N2,
credencial, instalação, envio de mídia ou reserva financeira foi feita nesta
parcela. Os resultados abaixo são testes locais; não são prova de boot ou de
isolamento operacional.

## Entrega local

Pacote privado, ignorado pelo Git:
`.local/worker-isolation/mount-n2-preparation.zTf6Xd/`.

| Componente               | Resultado comprovado                                                                               | Limite                                                                          |
| ------------------------ | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Claim de contexto        | Criação exclusiva, persistente, 0600/0700; concorrência entre chamadas e processos tem um vencedor | Helper ainda não integrado ao próximo core; não reutilizar o operador encerrado |
| Décima primeira retirada | Fontes, captura, operação VM com erro, sete deletes e onze alvos revalidados localmente por hash   | Não é consulta de ausência atual                                                |
| Guard agregado           | Dez registros, 108 URLs únicas, dois ramos limitados, GETs sem retry e validade de 60 s            | Transporte falso nos testes; consulta real fresca ainda obrigatória             |
| Perfil N2                | `n2-highmem-2`, 2 vCPUs, 16.384 MiB, Standard e Cascade Lake/Ice Lake explícitos                   | Catálogo/metadados anteriores não provam capacidade física                      |
| Composição de runtime    | Grafo com 53 módulos: 24 cópias com imports remapeados e 29 fontes compartilhados intactos         | Regressão integral CAS/admission/native da composição N2 ainda pendente         |
| Cotação N2               | Parser, cálculo e leitor puros testados com preços sintéticos e contrato próprio                   | Nenhuma cotação N2 real capturada; não reutilizar preço N1                      |

O claim `execution-intent.json` contém somente formato, hashes do core/launcher,
data e `permitsMutation=false`. Um arquivo existente, parcial ou symlink bloqueia
outra tentativa; não há remoção automática ou retomada. No próximo operador,
esse claim deve ocorrer no caminho do core, antes de SDK, consultas ou reserva.
`prepare` e `status` continuarão sem criar a intenção.

O guard da última retirada fixa os registros originais, o recibo de 102 testes,
o launcher de quatro testes, os journals, a reserva 11, a auditoria e a leitura
sanitizada da operação recusada. Os contextos anteriores e os locks históricos
de recuperação permanecem intactos. A ausência observada naquela rodada não foi
redatada como consulta real de hoje.

## Host e contenção do worker

A alteração do grafo se restringe ao perfil do host e ao caminho exato da leitura
do machine type. Imports remapeados admitem apenas formatação equivalente da
cláusula, incluindo vírgula final em import nomeado; alvos, ordem dos símbolos e
corpos funcionais continuam comparados. Não foi ampliada a allowlist de headers,
introduzido retry, relaxada a leitura de metadata ou alterado o pacote do disco.

Os testes comparam os oito corpos de criação com a proposta N1: a única mudança
no corpo da VM é `machineType` e `minCpuPlatform`. Mantêm-se sem IP público,
sem conta de serviço, disco de entrada somente leitura, controles Shielded,
Standard sem reinício automático e exclusão após no máximo 600 segundos.
O binding efetivo rejeita drift desses controles e CPUs fora da lista explícita.

**16 GiB do host não equivalem a 16 GiB para o worker.** O teto experimental
separado de 8 GiB deve permanecer contido, com margem para SO/Docker. A medição
real conjunta de JVM, nativo, fontes, tmpfs e pipeline continua aberta. Defaults
de produção não foram elevados nem admitidos por este teste.

## Preço e orçamento

CPU `8F60-4F60-EE56` e RAM `6487-C110-BE19` são as identidades listadas para N2
predefinido em São Paulo na
[lista oficial de SKUs on demand](https://cloud.google.com/skus/sku-groups/on-demand-vms).
Identidade do SKU não é preço observado. O parser exige captura própria,
`n2-api-pricing-observation-1`, perfil N2 e zona B; recusa cotação N1, reetiquetagem,
SKUs estrangeiras, respostas parciais ou mudança de moeda.

O cenário usa **duas CPUs e 16 GiB por uma hora de host**, além das quantidades
auxiliares conservadoras anteriores. Valores usam inteiros/BigInt, arredondamento
para cima, BRL/USD da mesma captura e TTL de uma hora. O leitor tem 14 GETs fixos,
sem retry; nenhuma execução autenticada foi adicionada neste pacote. Valores e
estimativas das fixtures são exclusivamente vetores sintéticos, sem valor de
cotação, fatura ou autorização.

O ledger permaneceu byte a byte com onze reservas: USD 55 reservados e USD 70
contabilizados com folgas, de USD 100 autorizados. Margem normal de USD 30, sem
fatura verificada, estorno presumido ou teto financeiro imposto ao Google.

## Evidências e verificações

Execução offline entre **10:52:48.079 e 10:52:54.412 UTC**:

- 113 testes aprovados, zero falhas, skips ou cancelamentos; rede/SDK bloqueados
  no processo de testes, nenhum token real, consulta cloud ou reserva.
- 541 entradas de fontes/evidências conferidas antes e depois. Recibos históricos
  foram revalidados por hash; seus testes dependentes do ledger antigo não foram
  reexecutados nem apresentados como execução nova.
- Recibo `verification.json`:
  `a41315ed23f5d78df408d74da7695e0c9ffaea559e2e6fb436800b060e606392`.
- Grafo selecionado:
  `2e3388bbb70347fe4ba9aeee4781e2027497fe51c2ded0c4bdacfdd5fe91a4b9`.
- Conjunto dos 108 alvos:
  `bae079f455f7ccbecf81354078fc987c53605036b46a942e3032023de3ce10f0`.

Os fontes técnicos do gateway continuam 419, checksum
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`.
Migrations, contratos Java, task, APIs e defaults permanecem intactos. O checksum
mobile não representa cobertura Java.

Uma primeira tentativa dos pré-requisitos globais parou antes dos gates por
caminho Docker inexistente. Após confirmar `/usr/local/bin/docker`, a execução
verificou Docker 29.4.0, pnpm 11.10.0 e hashes das três imagens em cache, sem
instalação/download. Os três gates encerraram com código zero:

| Gate                            | Período UTC               | Evidência                                                                              |
| ------------------------------- | ------------------------- | -------------------------------------------------------------------------------------- |
| Maven global offline com Docker | 10:51:12.754–10:53:45.419 | Sete módulos `SUCCESS`; gateway 1.297 testes, zero falhas/erros e 104 skips explícitos |
| Type-check web `tsc -b`         | 10:51:12.754–10:51:21.802 | Zero erros                                                                             |
| `pnpm check` mobile completo    | 10:51:12.754–10:52:10.294 | Inclui SDD; 116 suítes e 892 testes Jest aprovados                                     |

Logs e hashes ficam no pacote privado. Não houve reinstalação, formatação global
ou modificação de validadores SDD. A primeira comparação de fontes também barrou
a vírgula de formatação no import remapeado, antes de iniciar os testes; a
comparação da cláusula foi explicitada, mantendo a verificação dos corpos e dos
alvos. O recibo de 113 testes corresponde somente à execução posterior aprovada.
Esses gates não substituem a regressão integral futura do coordenador N2 nem
comprovam execução do worker em cloud.

## Próximos requisitos antes de cloud

Continuação posterior: [leitores e coordenador N2](worker-isolation-n2-coordinator-2026-10-24.md)
tratam a composição offline descrita abaixo. Essa evidência nova não altera o
recibo ou as limitações desta fotografia da preparação inicial.

1. Criar preflight e verificador de quota próprios: exigir `N2_CPUS >= 2` e quota
   global para dois cores; não usar a admissão N1 para autorizar N2.
2. Integrar perfil, guard de 108 alvos, preço N2 e claim persistente no próximo
   core/launcher. Testar o coordenador completo com CAS, cancelamento, confirmação
   perdida e cleanup antes de selecionar a entrada para cloud.
3. Obter captura financeira própria e consultas frescas, dentro do orçamento.
   Somente então executar uma rodada temporária e retirar seus recursos.
4. Validar boot/montagem, isolamento e limites totais do worker, falhas,
   integração privada, retenção e resultado visual. A aprovação da 020 depende
   desses itens, não apenas de o pedido de VM ser aceito.

Não há alteração de performance, publicação, mobile, tradução real, upload
público ou habilitação operacional nesta preparação.
