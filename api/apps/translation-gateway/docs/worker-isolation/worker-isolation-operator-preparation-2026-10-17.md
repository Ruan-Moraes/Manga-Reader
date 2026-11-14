# Preparação do operador e moeda observada

Data: 2026-10-17. Continuação do
[supervisor local](worker-isolation-supervisor-2026-10-17.md).
020 permanece `in-progress/open`; 021 bloqueada. Não é aceite do renderer.

## Fato observado, não simulação

Duas consultas GET autorizadas, com a identidade existente, retornaram 200:
o vínculo de faturamento de `toonlira-rm` e os campos `open,currencyCode` da
conta vinculada. Faturamento habilitado, conta aberta, moeda **BRL**. O hash do
SDK permaneceu inalterado. Não foram consultados saldos, faturas, listas de
contas ou preços personalizados.

Resultado sanitizado em
`.local/worker-isolation/mount-operator.EXf3is/billing-read/result.json`, SHA-256
`56da14cbb551d13438bbd1050520df56678724bffffa6e344ddd5e9bf1b3deed`.
Token e nome/ID bruto da conta ficaram apenas em memória. Intenção e resultado
são arquivos exclusivos 0600 em diretório 0700 ignorado pelo Git.

Foram usados os contratos oficiais de
[vínculo do projeto](https://docs.cloud.google.com/billing/docs/reference/rest/v1/projects/getBillingInfo)
e [campos da conta](https://docs.cloud.google.com/billing/docs/reference/rest/v1/billingAccounts).
Campo ausente, negação ou erro permaneceria pendente: não se presume USD.

O [envelope anterior](worker-isolation-cost-supplement-2026-10-17.md) é USD
provisório e não se tornou cotação aplicável a esta conta BRL. Não foi feita
conversão arbitrária. `quoteComplete`, `billVerified`, `providerHardCap` e
`permitsMutation` continuam falsos. O teto autorizado é US$ 5 **total**; as duas
reservas antigas não foram alteradas e nenhum slot novo foi consumido.

## Comandos efetivamente disponíveis

Tooling privado JS, sem instalação ou alteração de runtime:

```bash
node .local/worker-isolation/mount-operator.EXf3is/operator.mjs prepare
node .local/worker-isolation/mount-operator.EXf3is/operator.mjs report mount-check-20261017-fb9f957c
```

`prepare` ocupa um ID local exclusivo, sem reserva financeira, e valida:

- fotografia técnica dos 419 paths do gateway e ledger;
- recibos/fontes encadeados do supervisor;
- observação real sanitizada de billing, sem refazer a consulta;
- archive de runtime aprovado por stream/hash, sem cópia ou extração;
- inventário e manifests reais, regenerando primeiro o cloud-config histórico;
- novo plano fixo para o projeto/zona, sem gerações ou project number sintéticos.

Na rodada final preparada, arquivos, hashes, fontes do operador e commit local
estão em `rounds/mount-check-20261017-fb9f957c/`. A primeira preparação
`mount-check-20261017-0ef4f2dd` foi preservada como candidato anterior à inclusão
dos pins dos fontes do operador; não é a rodada aceita para regeneração atual.

`report` verifica integridade/versão e reconstitui o draft com a observação local
real. Não usa SDK, ADC ou rede, nem renova a janela de 15 minutos. Expiração exige
preparação nova; corrupção, ID repetido ou rodada incompleta não são retomados
automaticamente. O commit local não é transação distribuída nem proteção contra
um usuário que substitua simultaneamente o código e todos os arquivos.

**`execute` não está implementado/liberado.** Retorna erro explícito antes de
credencial, reserva ou supervisor. Não é uma simulação de sucesso. A composição
nativa e seu ticket de admissão ainda precisam ser implementados/revisados;
preparar arquivos não conclui o entrypoint operacional.

## Verificação e limites

```bash
node .local/worker-isolation/mount-operator.EXf3is/verify.mjs
```

Os testes do coletor usam respostas sintéticas e cobrem vínculo/conta inválidos,
moedas sem conversão, campos ausentes, 403/404/429/5xx sem retry, resposta
excessiva/malformada e sanitização. Não são prova de cobrança efetiva. Os demais
testes cobrem plano/prova reais, limites de janela, imutabilidade, exclusividade
concorrente, corrupção, symlink, paths inválidos e ausência de SDK/rede no comando
de execução bloqueado. As regressões do supervisor continuam separáveis no TAP.

O recibo registra contagens efetivas, hashes, links, formato e diff direcionado.
Não redata os recibos históricos de 845/26/36 casos. Maven, web, mobile e SDD
não são reexecutados por este incremento privado; fontes do produto, migrations,
defaults e arquivos de performance permanecem intactos.

## Trabalho ainda aberto

1. Cotação aplicável a BRL e reconciliação conservadora com o teto USD autorizado,
   incluindo retenção, operações, retirada e incertezas de cobrança.
2. Revisão de segurança COS para a prova mínima sem execução do payload.
3. Composição/admissão nativa do operador e retirada, antes de consumir o último
   slot normal; só depois, uma prova real autorizada dentro do escopo/teto.
4. Admitir e validar o worker completo em ambiente adequado. A montagem mínima
   não executa Java/renderer e não fecha AC-006, TASK-002/006/007/008 ou a 020.

Não houve POST/DELETE cloud, habilitação de API, IAM, instalação, upload, nova
reserva, provider ou boot. As únicas chamadas reais desta parcela foram os dois
GETs descritos acima. A skill `database-design` orientou o plano explícito de
arquivos locais e a preservação do ledger; não se criou banco, tabela ou migration.
