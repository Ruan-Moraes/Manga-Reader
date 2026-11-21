# Cotação N1 por API: contrato e leitura real — 2026-10-22 UTC

Continuação da [reconferência financeira](worker-isolation-financial-readiness-2026-10-22.md).
Foi implementado e testado um leitor próprio para os preços públicos mais
recentes da API oficial. A captura real passou; **não foi ligada ao operador,
não reservou valores e não criou recursos**. A 020 continua `in-progress/open`,
e a 021 `approved/blocked`.

## Contrato separado, sem redatar o Console

O candidato privado é `mount-n1-api-pricing.ZZAy4H`. O formato
`n1-api-pricing-observation-1` registra a fonte API, os tempos UTC e 14 leituras
fixas: as sete SKUs do perfil N1 e serviços auxiliares, em BRL e USD. Não contém
data de tabela do Console, não converte aquela data e não altera o parser antigo.

Cada par SKU/moeda exige GET 200, uma tentativa, hash da URL, hash do preço,
ordem e tempos coerentes. O schema completo de `Price`, unidade, quantidade,
agregação e tiers precisa corresponder ao catálogo. Valores ausentes de zero
do protobuf são aceitos como zero; `null` explícito, tier pago ausente, faixa
gratuita incorreta, SKU/moeda/shape desconhecidos ou resposta parcial são recusados.

O leitor recebe portas explícitas. Seu import não cria SDK/ADC ou rede, e o
coletor nativo é uma entrada separada, sem override de destino, diretório ou
credencial pelo CLI. Usa a identidade existente, sem chave nova, login, IAM ou
API habilitada. Em falha conserva evidência sanitizada, sem fallback ou retry.

Limites: coleta de 60 segundos, request de 20 segundos, corpo de 16 KiB e
captura de 192 KiB. O TTL continua em uma hora desde o início, e toda a janela
futura de 15 minutos deve caber estritamente nele. Não foi aumentado prazo para
passar o gate. São metadados de preços, sem mídia ou chamada OCR/tradução.

## Dinheiro e integridade

O planejamento antecedeu o código, conforme `database-design`. Não há banco,
tabela, migration, FK, índice, contador ou cache novo. Recibos privados usam
diretórios 0700 e gravação exclusiva 0600; ledger e CAS5 permanecem inalterados.

Money é validado em `units/nanos` e calculado com BigInt. Os pares BRL/USD devem
admitir uma mesma razão cambial considerando o arredondamento a nanos. O cálculo
usa os limites racionais desse intervalo, sem float ou taxa presumida: allowance
de rede convertido conservadoramente, subtotal majorado pelos 30% hipotéticos e
fator 2 existentes, resultado convertido pela fronteira superior e arredondado
para cima em centavos. A fixture independente de razão 1/2 mantém o teto de 282
centavos, em vez de arredondar para baixo.

Mantêm-se as quantidades do cenário anterior: uma hora de 1 vCPU/1 GiB, sete
dias de discos/imagem, arquivo com soft delete e operações/allowance definidos.
Não é orçamento do worker completo nem afirmação sobre encargos tributários,
fatura, descontos contratuais ou hard cap do Google.

## Testes e revisão da entrada nativa

O primeiro gate passou em 66 testes, mas a revisão da entrada nativa encontrou
um limite incoerente: máximo de 100 fontes para um grafo de 139 entradas. Essa
versão e seu recibo foram preservados, sem uso de credenciais. Uma inspeção com
`--input-type` parou nos argumentos; a CLI seguinte confirmou a recusa no gate
local. A primeira inspeção não foi usada como prova da segunda causa.

A revisão selecionada é **`collect-v2.mjs`**, com `verification-v2.json`:
**68/68 testes**, zero falhas/skips/cancelamentos e 143 fontes reconferidas.
Preserva o limite finito de 400 entradas dos gates existentes, exigindo todos os
hashes, arquivos selecionados, paths locais, unicidade e hash do TAP. A regressão
de grafo de 139 fontes passou; excesso, omissão, duplicação e bytes alterados
continuam recusados. Nenhum validador de preço foi removido ou afrouxado.

Os demais testes cobrem moedas/faixas/unidades, virada de dia UTC, identidade,
SDK, ausência de repetição, abort/limites de relógio, corpo excessivo/inválido,
resposta parcial, imutabilidade, getters e retenção enquanto o cancelamento do
body termina. Fixtures e HTTP dos testes são sintéticos; os testes não aprovam
qualidade de renderização ou operação cloud.

## Captura real

De **00:51:52.326 a 00:52:05.645 UTC**, o coletor fez exatamente 14 GETs, todos 200. O schema e a interseção cambial passaram sem alterar os dados recebidos.
SDK, fontes e ledger foram reconferidos. A estimativa do cenário foi **USD 2,11**,
não cobrança. A captura expiraria às **01:51:52.326 UTC**; expiração não renova
silenciosamente a fonte nem autoriza usar o arquivo como cotação atual.

| Recibo privado                 | SHA-256                                                            |
| ------------------------------ | ------------------------------------------------------------------ |
| Gate V1 preservado, 66 testes  | `784ce3947aaa4bada200c3029d11f94762a9b6a1eba44162a41e61d5442af3e2` |
| Gate selecionado V2, 68 testes | `928ce77b24efde53b9962a48879e4332a704878d462873ac3a755b46a30ddcce` |
| `capture-v2/observations.json` | `703334e5a0376a62ee0de77a52a21d441099a58a80fcda395799f5597c9544ca` |
| `capture-v2/result.json`       | `6c990fc6f539bd16be894e1a3d2ec85ea147164b6cdb5138a4a56ed081deed23` |

Os testes selecionados podem ser repetidos, na raiz do repositório, com o Node
existente e o bloqueador de HTTP/CLI reais:

```bash
node --import "$PWD/.local/worker-isolation/mount-n1-cos-admission.y8ogL1/offline-network-v2.mjs" \
  --test \
  .local/worker-isolation/mount-n1-api-pricing.ZZAy4H/pricing.test.mjs \
  .local/worker-isolation/mount-n1-api-pricing.ZZAy4H/reader.test.mjs \
  .local/worker-isolation/mount-n1-api-pricing.ZZAy4H/entry-v2.test.mjs
```

Não repetir o verificador/coletor para sobrescrever recibos. A entrada nativa
adquire seu diretório exclusivamente e não retoma captura interrompida. A API
é [Preview](https://docs.cloud.google.com/billing/docs/how-to/get-pricing-information-api),
e seu [método latest](https://docs.cloud.google.com/billing/docs/reference/pricing-api/rest/v1beta/skus.price/get)
não comprova capacidade de VM ou custo efetivamente faturado.

## Próximo gate

Integrar o contrato API à leitura de configuração, guard financeiro e admissão
do operador em nova revisão, com regressão integral. A configuração antiga
continua vazia e seu parser do Console permanece preservado. Só depois renovar
os dados expirados, repetir os pré-requisitos frescos e admitir nova reserva
sob a autorização total de USD 100. As cinco reservas anteriores continuam
contabilizadas, sem estorno: USD 25 reservados, não gasto observado.

Não houve alteração Java, mobile, performance, migrations, manifesto, rotas ou
defaults; os 419 fontes do gateway continuam correspondendo ao checksum
anterior. Os [gates globais](worker-isolation-fixed-operator-2026-10-22.md) são
fotografia separada, não reexecução por este teste. A prova nativa de montagem e
os requisitos do worker completo continuam abertos.

Continuação posterior: a [integração e prova restrita do operador](worker-isolation-api-operator-native-2026-10-22.md)
passou nos gates locais, mas recusou criação em metadados. A retirada do staging
foi confirmada; a captura de preços não foi transformada em aprovação operacional.
