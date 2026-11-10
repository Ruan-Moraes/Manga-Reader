# Planejamento de limite operacional — teste público controlado

Estado: plano elaborado antes do código e implementado localmente; não autoriza
ativação de provider nem comprova um teto financeiro. O projeto mantém o contrato de capabilities
e os limites atuais de 20 tentativas por instalação e 100 globais por dia.

## Banco e modelo

Usar o PostgreSQL já proprietário de instalações e recibos. Uma possível barreira
adicional de teste deve conservar apenas um contador agregado da janela, sem
imagem, texto, identidade ou referência ao conteúdo. Proposta: tabela
`volatile_test_budget_window`, chave primária `window_key varchar(64)` e
`attempts_reserved bigint NOT NULL CHECK (attempts_reserved >= 0)`. A única
dependência funcional é `window_key → attempts_reserved`; o determinante é a
chave candidata e a relação está em BCNF. Não há FK: o agregado permanece após
o purge obrigatório de recibos individuais. A PK atende a única consulta e não
exige índice adicional.

O contador é uma reserva irreversível, não um cache dos recibos, pois estes
expiram em sete dias e a janela de teste é maior. Deve ser incrementado sob
lock transacional na mesma transação que insere o recibo, antes de qualquer
provider. Falha ou ambiguidade após o commit não devolve a reserva. Não usar
trigger. Ao esgotar a janela ou se o banco estiver indisponível, bloquear novos
providers. Configuração desabilitada mantém o comportamento histórico.

## Migration e validação necessárias

A migration V11 adiciona a tabela. O repository reserva seu contador na mesma
transação do recibo. A configuração só ativa o controle mediante flag explícita,
limite positivo e deadline UTC; a checagem também usa o relógio do PostgreSQL
depois da espera por locks. O registro agregado é conservado até a retirada do
ambiente de teste, independentemente do purge de recibos individuais. Não há
migration destrutiva nem alteração de APIs, entities, DTOs ou seeds existentes.

Os testes em PostgreSQL real cobrem esgotamento, concorrência, rollback,
replay, prazo vencido e permanência após exclusão dos recibos. Revalidar ainda
a candidata em AMD64 e inspecionar a resolução de commit ambíguo em execução
real antes de admitir o ambiente. As quotas públicas existentes permanecem.

## Questão financeira ainda aberta

O contador limita chamadas, não o valor de cada resposta. O modelo
`translation-llm` cobra entrada e saída, e a documentação do Google não define
quota de conteúdo para ele. Mesmo uma resposta rejeitada pelo cliente pode já
ter sido faturada. Um teto financeiro global requer orçamento de margem,
verificação de saldo/cobrança e controle operacional adicional; não declarar
que um número de chamadas ou alerta de orçamento seja teto rígido em dólares.

## Prova na composição privada — 2026-11-04

A rodada `mob020-meta-b9e43cd2` ativou o contador V11 com limite de uma
reserva na composição AMD64/COS125, usando imagem sintética de 1×1 e bloqueio
de saída para providers. A primeira tentativa autenticada reservou a vaga e
terminou em 503 com o provider inacessível; outra tentativa com nova chave
recebeu 429. A consulta do contador agregado retornou `1`. O resultado foi
`synthetic-attempt-limit-passed`. Não houve chamada paga bem-sucedida e isso
não comprova custo máximo, orçamento financeiro, resposta de provider real ou
concorrência além dos testes de banco já documentados.

Evidências em `.local/toonlira-public-test-20261103/amd64-attempt-limit/`;
pipeline SHA-256
`c74eacafe36a18e9b11d60f8459a8035bd803b53723c88b18c630658fcc630d0`;
resultado SHA-256
`4321c28aab4b43771cf34395a9c813c94bd9049fac3710d197d3df89137beeec`;
contador SHA-256
`4355a46b19d348dc2f57c046f8ef63d4538ebb936000f3c9ee954a27460dd865`.
O diário registra a remoção dos recursos temporários com `cleanupErrors: []`.
