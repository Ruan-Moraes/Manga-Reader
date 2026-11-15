# Orçamento antes da implantação — 2026-11-04

O console de faturamento, consultado na conta vinculada a `toonlira-rm`,
mostrou R$ 1.758 de R$ 1.761 em créditos de teste, 33 dias restantes e término
em 7 de dezembro. O resumo exibia custo de R$ 0,00 para 1–3 de novembro e
informava atraso de contabilização; isso não comprova ausência de consumo
recente nem substitui o acompanhamento durante a operação. A retirada está
programada antes do prazo, em 6 de dezembro.

O catálogo oficial consultado para São Paulo retornou por hora US$ 0,0346242
por vCPU E2 e US$ 0,00464025 por GiB de memória E2; para 2 vCPUs e 16 GiB,
US$ 0,1434924/h. Disco persistente padrão apareceu a US$ 0,06 por GiB-mês.
O [preço de IP externo](https://cloud.google.com/vpc/pricing) informa US$
0,005/h em uso por VM padrão e US$ 0,01/h reservado sem uso. Uma estimativa
para 33 dias contínuos, sem assumir créditos gratuitos, é cerca de US$ 117,61
para CPU, memória e IP em uso, mais cerca de US$ 1,32 para 20 GiB de disco;
rede, registry, controles, impostos e providers são adicionais. Os preços
podem variar, especialmente em moeda de faturamento diferente de USD.

O modelo de tradução usado cobra por entrada e saída; Vision e Translation
possuem preços por uso. A [documentação de orçamento](https://docs.cloud.google.com/billing/docs/how-to/budgets)
afirma que alertas não são teto financeiro. Antes de liberar a VM e tráfego,
conferir os IDs dos controles, saldo, preços, limite de tentativas, despesas
acumuladas e margem para cobrança tardia dentro do teto total de US$ 270.
