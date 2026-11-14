---
id: MOB-FEAT-066
type: feature
title: Tradução em segundo plano no Android e painel de lote
status: in-progress
implementation_gate: open
blocked_by: [MOB-FEAT-017, MOB-FEAT-055]
created: 2026-11-10
updated: 2026-11-10
supersedes: []
superseded_by: []
---

# MOB-FEAT-066 — Tradução em segundo plano no Android e painel de lote

## Objetivo

Permitir acompanhar e executar um lote no Android ao sair da aba ou bloquear o aparelho, com progresso e resultado nas notificações.

## Contexto e contratos relacionados

Estende MOB-FEAT-017 e MOB-FEAT-055, mantendo processamento volátil, commit privado e proibição de retry automático de tentativas incertas. Substitui a interrupção ao entrar em segundo plano apenas no Android com serviço autorizado.

## Requisitos e regras

Um lote ativo global, página por vez; somente Android nesta etapa. A aba agrupa resumo, lista e ações compactas. Fechar a aba ou abrir leitor não interrompe o lote. O serviço em primeiro plano mostra progresso e oferece abrir e parar após a página atual. Uma notificação final descreve sucesso, resultado parcial ou falha. Sem permissão de notificações, o processamento permanece em primeiro plano. Interrupção pelo sistema ou encerramento forçado preserva progresso e exige reabertura e ação explícita para continuar as páginas elegíveis. Conteúdo e dados pessoais não aparecem nas notificações.

## Casos de erro

Rede, tempo limite, parada, permissão negada e processo encerrado preservam resultados locais. Consultar recibos e nunca reenviar automaticamente tentativas incertas.

## Critérios de aceite

### AC-001 — Painel de lote

Resumo, status e ações compactas, sem três botões empilhados, preservam controles, acessibilidade, temas e três idiomas.

### AC-002 — Execução em segundo plano

Lote Android continua ao sair da aba, navegar e bloquear aparelho, com uma página em voo e commit privado anterior a READY.

### AC-003 — Notificações

Progresso contínuo oferece abrir e parar após página atual; resultado final correto. Permissão recusada impede execução em segundo plano e permite primeiro plano.
Ao solicitar a parada pela notificação, ela informa imediatamente que está parando até a página atual terminar.

### AC-004 — Interrupção e retomada

Persistir fila ordenada e progresso; após interrupção, aguardar abertura e ação do usuário para continuar páginas seguras, sem replay de tentativa incerta.

### AC-005 — Integridade e privacidade

Migração aditiva preserva dados existentes; seleção e execução são coordenadas; notificações e logs não contêm conteúdo privado ou credenciais.

## Estratégia de evidência

Testes SQLite, controladores, interface e serviço nativo; teste no Android físico e gates do mobile.

## Gate de implementação

Aberto; dependências em verification-pending.

## Fora de escopo

Execução em segundo plano no iOS; persistência de conteúdo no servidor; retry pago automático.

## Aprovação humana

- Aprovador: usuário Ruan, plano aprovado nesta conversa.
- Data: 2026-11-10.

## Revisão aprovada — 2026-11-11

Aprovação registrada pelo pedido de implementação do plano do leitor, capítulos e modo desenvolvedor.

### AC-006 — Fila visual e interrupção

Miniaturas privadas e virtualizadas acompanham o estado por página. Ações de interrupção permanecem acessíveis durante a rolagem. Cancelamento confirmado é distinto de tentativa incerta e parada após a página atual.
