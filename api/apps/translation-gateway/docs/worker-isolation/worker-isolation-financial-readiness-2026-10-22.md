# Reconferência financeira e pré-requisitos N1 — 2026-10-22 UTC

Continuação do [operador com dispatch corrigido](worker-isolation-fixed-operator-2026-10-22.md).
Esta parcela fez inspeções reais somente de leitura. **Nenhuma VM, reserva,
mutação cloud, upload, chamada OCR/tradução, chave ou instalação foi feita.**
A 020 continua `in-progress/open`, e a 021 `approved/blocked`.

## Fatos observados

O diretório privado `mount-n1-finance-refresh.JPNz2q` guarda os novos recibos,
sem sobrescrever os da execução anterior. Os formatos financeiros existentes,
os cálculos inteiros, os prazos e o ledger foram preservados. O planejamento
de integridade antecedeu a persistência, conforme `database-design`; não há
tabela, migration, índice, contador ou cache novo.

| Inspeção real                                         | Resultado                                                                             |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Vínculo do projeto e moeda, dois GETs                 | Ambos 200; conta aberta, faturamento ativo, BRL; SDK e fontes reconferidos            |
| Console autenticado, sete SKUs e 16 células por linha | Valores e câmbio reobservados; modelo `Default`, faixas pagas e geografia preservados |
| Preflight, cinco GETs                                 | Projeto/metadata, COS73916, tipo N1 e zona corresponderam                             |
| Quotas, dois GETs                                     | Metadados observados e validados; não garantem capacidade futura                      |
| Quatro escopos anteriores, 43 GETs                    | Todos 404; nenhuma referência ativa encontrada                                        |
| Sondagem de uma SKU pela API oficial                  | Um GET 200, preço BRL da CPU correspondente ao Console, sem nova chave/permissão      |

O scanner novo foi usado com portas nativas e identidade existente, de
00:36:23.377 a 00:36:58.031 UTC. A fotografia dos pré-requisitos já não serve
como admissão futura: os mesmos gates frescos deverão ser repetidos antes da
reserva. O lock original, os journals e as cinco reservas anteriores continuam
preservados. São USD 25 **reservados**, não gasto faturado ou hard cap Google.

| Recibo privado                               | SHA-256                                                            |
| -------------------------------------------- | ------------------------------------------------------------------ |
| Billing, `native-read/result.json`           | `8cfcf99c2149cbe86ee0567fced3bf60d35fe124f216547b269b7be5273b32ce` |
| Pré-requisitos, `readiness-read/result.json` | `9eb7d847a658eedf69b1ab962b50418709180738e636eedda3b4cc8310941e18` |
| Linhas reais, `observations.json`            | `bc96d1293c82011f62ff53168f533ed8f27537644b22709e48e658e8da9d1527` |
| Regressão financeira, `regression.json`      | `9b4251bfb1018f81c0d46079d6a749ae7e325b4cfd52483e321c6b374c13ee28` |
| Uma SKU, `price-probe.json`                  | `12e5488ad041a130c66966198043c4f4eac083d34e0852c6b1fe1974692a3154` |

## Cotação recusada, sem correção silenciosa

A coleta das sete linhas terminou às 00:33:23.831 UTC. O limite inicial usado
foi 00:29:31 UTC, anterior às consultas. O Console publicou a data **21/10/2026**,
enquanto o instante da coleta em UTC já era **22/10/2026**. O parser pinado exige
igualdade com o dia UTC e recusou esses dados, mesmo com billing válido.

O relógio local estava em 21/10, UTC−03. Isso sugere um problema de calendário,
mas o elemento visível do Console não informa fuso ou instante subjacente.
**A causa de fuso permanece hipótese**, não justificativa para converter a
data publicada, redatar a coleta ou relaxar o validador.

A regressão passou em **96 testes**: 92 casos financeiros existentes e quatro
casos adicionais. Ela comprova a recusa da observação real, a preservação dos
bytes e dos limites/expiração. Alterar somente a data em uma cópia **sintética**
isola a condição que recusa o dado; essa cópia não foi gravada como cotação
aprovada e não autoriza criação. Nenhuma regra do parser ou guard foi alterada.

## Alternativa oficial investigada

A documentação do Google oferece uma
[API para o preço mais recente de uma SKU](https://docs.cloud.google.com/billing/docs/reference/pricing-api/rest/v1beta/skus.price/get).
A sondagem fixou somente `E4B6-CD20-6438`, moeda BRL, um GET, sem retry,
redirecionamento ou alteração de acesso. O endpoint retornou 200 de
00:39:22.851 a 00:39:24.944 UTC. O valor retornado foi igual ao da CPU na
tabela autenticada, com identidade/SDK existentes.

Isso comprova acesso àquela resposta, **não uma cotação completa**, equivalência
de câmbio para as demais SKUs ou aprovação do operador. O método é parte de uma
[API em Preview](https://docs.cloud.google.com/billing/docs/how-to/get-pricing-information-api);
essa limitação deve ser considerada em qualquer adaptação posterior. Nenhuma
credencial, conta de faturamento ou resposta de erro bruta foi armazenada.

## Próxima implementação e limites

Preparar um leitor completo e determinístico da API, com esquema explícito,
SKUs/moedas/faixas/unidades exatos, respostas limitadas, identidade pinada,
tempos de coleta UTC e testes de integridade/expiração. A evidência da API deve
ter contrato próprio, sem se apresentar como uma data publicada pelo Console.
Só depois de verificar esse contrato e sua integração poderá haver nova
admissão do operador. Não criar chave, ampliar IAM ou habilitar API como fallback.

O operador selado continua sem configuração financeira aprovada. A coleta real
recusada e os testes não foram ligados ao caminho de criação. Não houve alteração
Java, mobile, performance, infraestrutura publicada, contratos públicos ou defaults.
Os [gates globais anteriores](worker-isolation-fixed-operator-2026-10-22.md)
continuam como fotografia separada; estes testes financeiros não substituem
Maven ou validação operacional do worker completo.

Continuação posterior: o [contrato API e sua captura completa](worker-isolation-api-pricing-2026-10-22.md)
foram implementados e testados separadamente. Isso não altera a recusa do Console
ou os recibos desta fotografia, e ainda não admite execução nativa.
