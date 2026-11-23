# Preços da conta e cenário em BRL — 2026-10-17

Continuação da
[preparação do operador](worker-isolation-operator-preparation-2026-10-17.md).
020 permanece `in-progress/open`; 021 bloqueada. Não houve nova reserva, recurso,
upload, provider, instalação, chave de API, grant ou habilitação de serviço.

## Observação real na tabela de preços

A tabela do Console vinculada ao projeto `toonlira-rm` mostrou preços BRL,
coluna USD e **0,168607297 USD por BRL**. Não inverter a taxa. A observação
foi feita em 17/10 entre 23:33 e 23:35 UTC, com tabela datada de 17/10/2026.
Não é cotação de câmbio comercial nem taxa inferida a partir do crédito gratuito.

Foram selecionadas sete linhas Default, com região/unidade/quantidade/tier:

| SKU              | Item                                                  | BRL por unidade indicada | USD por unidade indicada |
| ---------------- | ----------------------------------------------------- | -----------------------: | -----------------------: |
| `0442-C445-D66A` | E2 Core São Paulo, hora                               |              0,205354101 |                0,0346242 |
| `C3E6-8086-831A` | E2 RAM São Paulo, GiB-h                               |               0,02752105 |               0,00464025 |
| `0F70-EC05-BA70` | Custom image São Paulo, GiB-mês                       |              0,444820605 |                    0,075 |
| `DF49-E005-E705` | PD Standard zonal São Paulo, GiB-mês                  |              0,355856484 |                     0,06 |
| `6B9B-6AB4-AC59` | Storage Standard São Paulo, GiB-mês                   |              0,207582949 |                    0,035 |
| `4DBF-185F-A415` | Regional Standard Class A, 1.000 operações, tier pago |              0,029654707 |                    0,005 |
| `7870-010B-2763` | Regional Standard Class B, 1.000 operações, tier pago |              0,002372376 |                   0,0004 |

A [tabela oficial](https://docs.cloud.google.com/billing/docs/how-to/pricing-table)
documenta moeda da conta, taxa para USD e preços USD. O snapshot privado é
transcrição das linhas DOM observadas, não captura bruta de API/CSV. Não contém
ID/nome da conta, e-mail, saldos, faturas ou quantidades de uso.

A navegação inicial passou pela visão geral de billing; seus valores não foram
exportados nem usados no cenário. Não foi aberto relatório de uso/fatura ou
perfil para pagamentos. Filtros, colunas e paginação temporários foram restaurados;
a aba criada foi fechada. O SDK/ADC não foi usado neste incremento.

Não usar o preço `Micro Instance` de F1, Spot, custom ou CUD no lugar de E2.
A conferência aritmética `0,25 × E2 Core + 1 GiB RAM` coincide com o bundle público
USD da e2-micro; não prova quantidade faturada ou substitui a tarifa do bundle.
O [contrato de shared-core](https://docs.cloud.google.com/compute/docs/general-purpose-machines)
é explícito sobre o preço combinado de CPU/memória. As tarifas horárias públicas
do [suplemento anterior](worker-isolation-cost-supplement-2026-10-17.md) continuam
pinadas; a relação mensal/horária é somente conferência, não regra nova de billing.

## Cenário, não cobrança observada

Ferramenta privada JS em `.local/worker-isolation/mount-account-pricing.59OFxj/`.
O plano `design.md`, anterior ao código, segue `database-design`: arquivo local
deliberado para rastreabilidade, não banco/ledger; sem migration, índice ou cache.
Valores textuais são convertidos em BigInt/nanos, com moeda explícita e
arredondamento conservador para centavos; nenhum cálculo monetário usa float.

```bash
node .local/worker-isolation/mount-account-pricing.59OFxj/scenario.mjs --report
```

Esse comando reconstitui o resultado histórico dos snapshots locais, verificando
hashes dos fontes e referências públicas. Não atualiza preços, renova validade,
obtém credenciais, acessa rede ou reserva dinheiro. `--write` foi usado uma vez
para gravar `scenario.json`; repetição recusa sobrescrever.

O cálculo mantém uma hora de VM, 480 GiB-h de discos, 240 GiB-h de imagem e
archive de 62.359.506 bytes por 192 h, incluindo sete dias de soft delete.
Acrescenta cenário de 1.000 operações A e 10.000 B nas tarifas pagas, sem free tier.
Estas quantidades não são uso medido nem limites globais implantados.

Com folga genérica equivalente a USD 0,25, reserva **hipotética** adicional de
30% e fator de segurança 2, o resultado é **R$ 5,20**, com equivalente USD
arredondado conservadoramente para **US$ 0,88** pela taxa observada. Cabe no
slot normal de US$ 1 do modelo, mas **não o reserva**. O teto permanece US$ 5
total, incluindo parcelas anteriores/emergência. Não há teto imposto pelo Google.
O limite de 600 s da VM não expira disco, imagem ou staging.

## Incerteza tributária explícita

A [visão atual de tributos](https://docs.cloud.google.com/billing/docs/resources/vat-overview)
informa SKUs sem impostos e cita 14% para contratação local brasileira. Já o
[FAQ de migração](https://support.google.com/cloud/answer/7522866?hl=en) descreve
preços BRL inclusivos. Não foi determinada a aplicabilidade fiscal à conta.
O [catálogo público](https://cloud.google.com/skus?hl=pt-br) também descreve
surcharge local; ele não foi somado novamente aos preços BRL observados.

Os 30% são hipótese de planejamento, não conclusão fiscal, garantia ou nova taxa
de produção. `taxTreatmentConfirmed=false`, `quoteComplete=false`,
`billVerified=false`, `providerHardCap=false`, `permitsMutation=false`.
Retenção/retirada efetivas, quantidades internas, tráfego e admissão financeira
integral continuam próprios. Não houve alteração para enfraquecer esses gates.

## Verificação

```bash
node .local/worker-isolation/mount-account-pricing.59OFxj/verify.mjs
```

O recibo registra testes atuais do parser/cálculo, regressões do calculador/parser
públicos, reprodução offline, recusa de overwrite, hashes, links, formato e diff
direcionado. Não redata os gates anteriores. Dinheiro/agrupamento, arredondamento,
moeda/taxa invertida, SKU/região/modelo/tier incorretos, snapshots incompletos ou
velhos e imutabilidade são verificados com dados locais; corrupção em testes é
sintética, a leitura de preços descrita acima foi real.

Os 419 paths do gateway e as duas reservas foram reconferidos. Maven, web, mobile,
SDD e prova COS não foram reexecutados por este incremento privado. Defaults,
migrations e arquivos de performance permanecem intactos. A composição nativa
do operador e a revisão COS da prova mínima continuam sendo o próximo trabalho;
essa prova não equivale ao ambiente admitido do renderer completo.
