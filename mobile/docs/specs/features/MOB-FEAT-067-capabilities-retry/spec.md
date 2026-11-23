---
id: MOB-FEAT-067
type: feature
title: Nova consulta ao serviço de tradução indisponível
status: in-progress
implementation_gate: open
blocked_by: [MOB-FEAT-017, MOB-FEAT-055]
created: 2026-11-13
updated: 2026-11-13
supersedes: []
superseded_by: []
---

# MOB-FEAT-067 — Nova consulta ao serviço de tradução indisponível

## Objetivo

Permitir que a pessoa tente de novo quando o serviço de tradução não responde ou recusa a consulta inicial,
sem sair e voltar à etapa 3 do fluxo de tradução nem à folha de nova tentativa.

## Contexto e contratos relacionados

- O painel de lote (`widgets/remote-processing`, MOB-FEAT-055 AC-004/AC-005, MOB-FEAT-066 AC-001) consulta
  as capabilities do gateway (MOB-FEAT-017) uma única vez, ao montar. Cada requisição espera até 15 s.
- Quando a consulta falha ou devolve capabilities não utilizáveis, o painel mostra "O processamento remoto está
  indisponível ou desativado." sem ação, e o botão de traduzir fica desativado.
- Voltar do leitor recarrega só o projeto e as tentativas; a consulta ao gateway não é refeita. Hoje só sair
  da tela e entrar de novo libera o botão.
- O estado de carregamento visível durante a consulta inicial (revisão tela a tela, 2026-11-13) é visual e
  não faz parte desta spec.

## Requisitos e regras

- Com capabilities indisponíveis, a mensagem do painel oferece a ação "Tentar novamente" nos três idiomas.
- A ação refaz só a consulta de capabilities. Nenhuma página é enviada, nenhum consentimento é pedido ou
  alterado, e a seleção de páginas é preservada.
- Enquanto a nova consulta está em andamento, a ação fica indisponível e a mensagem indica que a verificação
  está acontecendo. Não é possível disparar duas consultas ao mesmo tempo.
- Ao voltar para a tela (leitor ou outro app), se as capabilities estiverem indisponíveis e nenhum lote estiver
  em execução, o painel refaz a consulta automaticamente uma vez.
- Se a nova consulta trouxer capabilities utilizáveis, a mensagem some e o botão de traduzir volta a seguir as
  regras de MOB-FEAT-055, sem abrir o consentimento sozinho.
- Limite atingido (`quota-exceeded`) não oferece "Tentar novamente": a mensagem de limite continua como está.
- A ação não aparece durante um lote em execução nem enquanto outro lote ou um lote interrompido ocupa o
  serviço.

## Casos de erro

- A nova consulta falha de novo ou expira: a mensagem de indisponível volta, com a ação disponível outra vez.
- A nova consulta devolve `quota-exceeded`: a mensagem passa para a de limite atingido, sem ação.
- A pessoa sai da tela durante a consulta: a requisição é cancelada e nada é gravado.

## Critérios de aceite

### AC-001 — Ação de nova consulta

Dado o painel de lote com capabilities indisponíveis, quando a pessoa toca em "Tentar novamente" e o gateway
responde com capabilities utilizáveis, então a mensagem some, a seleção de páginas é a mesma de antes e o botão
de traduzir fica ativo se houver páginas elegíveis selecionadas.

### AC-002 — Consulta em andamento e nova falha

Dado que a nova consulta está em andamento, então a ação não pode ser tocada de novo e a mensagem indica a
verificação. Quando a consulta falha ou expira, a mensagem de indisponível volta com a ação.

### AC-003 — Nova consulta ao voltar para a tela

Dado o painel com capabilities indisponíveis e nenhum lote em execução, quando a pessoa volta do leitor ou de
outro app, então o painel refaz a consulta uma vez, sem ação da pessoa.

### AC-004 — Limites e segurança

A ação não aparece para `quota-exceeded`, durante lote em execução, com outro lote ativo ou com lote
interrompido. Nenhuma nova consulta envia páginas, pede ou altera consentimento.

### AC-005 — Idiomas e acessibilidade

A ação e o texto de verificação existem em pt-BR, en-US e es-ES, e a ação tem papel de botão e nome acessível.

## Estratégia de evidência

| Critério | Teste e evidência                                                                                       |
| -------- | ------------------------------------------------------------------------------------------------------- |
| AC-001   | Teste do painel com controller que falha e depois responde; seleção preservada.                         |
| AC-002   | Teste com consulta pendente (ação indisponível) e com segunda falha (ação de volta).                    |
| AC-003   | Teste do hook/painel com refocus simulado; verificação no simulador com o gateway desligado e religado. |
| AC-004   | Testes de `quota-exceeded`, lote em execução e lote interrompido; asserção de que nenhum envio ocorre.  |
| AC-005   | Paridade de chaves nos três idiomas e consulta por papel/nome no teste.                                 |

## Gate de implementação

Estado `open`, com dependências MOB-FEAT-017 e MOB-FEAT-055.

## Fora de escopo

- Novas tentativas automáticas em intervalo ou com backoff.
- Mudar o tempo limite de 15 s da requisição ou o contrato do gateway.
- Distinguir na mensagem gateway desligado, fora do ar ou sem rede.
- O estado de carregamento visual da consulta inicial.

## Decisões confirmadas na aprovação

A aprovação aceitou as três escolhas apresentadas, sem ajustes:

1. Refazer a consulta automaticamente ao voltar para a tela (AC-003), além da ação manual.
2. Não oferecer nova consulta para `quota-exceeded`.
3. Manter a mesma mensagem de indisponível, só acrescentando a ação, em vez de um texto novo.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-11-13
- Evidência: resposta “Eu aprovo” à apresentação do rascunho, aceitando as três decisões acima.
