# Cotas e preços da tradução por assinatura

Proposta de produto para web, Android e iOS, registrada em 2026-11-10. A entrega
exige cotas aplicadas pelo servidor e divulgadas nos planos antes da primeira
cobrança. Preços, margens e franquias comerciais dependem da medição de custos e
da aprovação do catálogo.

## O que o assinante verá

- Na comparação de planos e antes da confirmação de compra, exibir valor final
  e moeda, periodicidade da cobrança, renovação, benefícios e quantidade de
  páginas de tradução incluídas por ciclo. Mostrar validade das páginas, regra
  de acúmulo e, se oferecido, valor e condições de créditos extras.
- No gerenciamento da assinatura e antes de enviar um lote, mostrar páginas
  disponíveis, usadas, reservadas e data de renovação da franquia. Indicar
  quantas páginas o lote pode processar. Uma página já traduzida e aberta no
  aparelho não consome nova unidade. Reprocessar exige confirmação explícita.
- Aplicar o mesmo direito de uso à conta nos três clientes. Conferir a compra,
  renovação, cancelamento, restauração e reembolso no servidor, com eventos
  idempotentes. O valor mostrado deve vir do canal de compra aplicável. A web e
  os apps devem ler os benefícios e a franquia da mesma versão do catálogo.
- Ao esgotar o saldo, exibir a data de renovação. Excedente só pode ser cobrado
  após o usuário ver o preço e confirmar a compra. Uma indisponibilidade
  temporária deve ter mensagem distinta de saldo esgotado.

## Contabilização

Usar a assinatura verificada da Core como fonte dos benefícios. Definir uma
unidade como **uma página para um idioma de destino**. Reservar a unidade
atomicamente antes do primeiro provider, vinculada à tentativa idempotente.
Consumir uma vez quando o gateway produzir o resultado. Liberar em recusas
confirmadas antes do processamento. Falhas com custo do provider devem ser
registradas no custo operacional e a política proposta devolve a unidade
quando o resultado falha. Em uma entrega ambígua, consultar o recibo e resolver
a reserva pelo estado confirmado, sem novo envio automático. O recibo
`FINISHED` informa que houve resultado remoto. A leitura no aparelho depende
do salvamento local. Explicar essa diferença na política de reprocessamento e
prever ajuste de saldo auditável.

O desenho da implementação deve prever versões imutáveis de oferta, saldo por
conta e ciclo, eventos idempotentes de reserva/consumo/liberação e
reconciliação de eventos das lojas. Usar PostgreSQL para os dados operacionais e
valores monetários em centavos e moeda. Preparar o plano de schema e a
estratégia transacional entre Core e gateway antes da implementação. Preservar
a separação de conteúdo volátil. A contabilidade requer apenas metadados de
operação e volumes agregados. Limites globais, prevenção de abuso e proteção
financeira operam separadamente da franquia do assinante.

## Custos a recuperar

O gateway usa Vision `DOCUMENT_TEXT_DETECTION` e Cloud Translation Advanced
`general/translation-llm`. Na faixa paga inicial do Vision, a referência é
US$ 1,50 por 1.000 unidades de OCR. O Translation LLM cobra US$ 10 por milhão de
caracteres de entrada e US$ 10 por milhão de saída. Uma página com 1.000
caracteres enviados e 1.000 recebidos custa aproximadamente US$ 0,0215 só nesses
dois serviços, antes de créditos e descontos. Medir caracteres efetivamente
enviados e recebidos pelo adapter, inclusive contexto, para estimar páginas
densas e pares com expansão de texto. Conferir com o faturamento do projeto.
[Vision](https://cloud.google.com/vision/pricing) · [Cloud Translation](https://cloud.google.com/products/translate/pricing)

Incluir no custo completo do ciclo o consumo da franquia inteira em um cenário
conservador, falhas cobradas, OCR, tradução, CPU e memória de renderização,
saída de rede, VM, PostgreSQL, observabilidade, suporte, manutenção, câmbio e
reserva operacional. Ratear os custos fixos por um número conservador de
assinaturas ativas. Medir custos típicos, p95 e uso integral da franquia. Rever
o custo realizado por ciclo antes de ampliar a oferta.

No preço de venda, incluir impostos aplicáveis, comissões das lojas ou do
processador web, tarifa fixa de cobrança e provisão para estornos. Google Play
publica 15% para assinaturas com renovação automática. A App Store informa
repasse de 70% no primeiro ano e 85% depois, antes dos impostos aplicáveis,
com 85% desde o início para participantes elegíveis do Small Business Program.
Na web, usar o contrato do processador efetivamente adotado, inclusive eventual
tarifa adicional de cobrança recorrente.
[Google Play](https://support.google.com/googleplay/android-developer/answer/112622?hl=pt-BR) · [App Store](https://developer.apple.com/app-store/subscriptions/) · [Exemplo de tarifas web](https://stripe.com/br/pricing)

## Quatro cenários de preço

Definir margem sobre o preço bruto após os custos e deduções. Se as deduções
forem todas calculadas sobre o bruto, usar
`preço mínimo = (custo completo por ciclo + tarifa fixa) / (1 − deduções percentuais − margem)`.
Se comissões ou tributos incidirem sobre bases diferentes, calcular o repasse
líquido por canal e buscar o primeiro preço que atinja a margem. Arredondar
para cima e validar os pontos de preço das lojas.

| Cenário | Margem de simulação | Exemplo com custo de R$ 10,00 e deduções de 15% |
|---|---:|---:|
| A custo | 0% | R$ 11,77 |
| Lucro baixo | 5% | R$ 12,50 |
| Lucro médio | 20% | R$ 15,39 |
| Lucro alto | 35% | R$ 20,00 |

Os percentuais e valores da tabela são hipóteses de simulação, com tarifa fixa
zero no exemplo. Para aprovar cada oferta, registrar moeda, franquia, custo
completo, taxa por canal, preço, margem prevista e margem com consumo integral.
Acompanhar margem realizada por canal e por plano após o lançamento.
