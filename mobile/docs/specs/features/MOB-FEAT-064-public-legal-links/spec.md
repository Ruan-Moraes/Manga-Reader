---
id: MOB-FEAT-064
type: feature
title: Links públicos de Termos de Uso e Política de Privacidade
status: in-progress
implementation_gate: open
blocked_by: [MOB-FEAT-008, MOB-FEAT-017, MOB-FEAT-061]
created: 2026-11-10
updated: 2026-11-13
supersedes: []
superseded_by: []
---

# MOB-FEAT-064 — Links públicos de Termos de Uso e Política de Privacidade

## Objetivo

Dar acesso aos documentos legais publicados no site do aplicativo Toonlira a partir da conta, das configurações
e do consentimento de tradução.

## Contexto e contratos relacionados

A spec substitui a regra de links legais como texto de MOB-BASE-004/OBS-006 e de MOB-FEAT-061/AC-005.
Aplica a configuração de links prevista em MOB-FEAT-008 e preserva o protocolo de MOB-FEAT-017.

## Requisitos e regras

- Login, Cadastro e Configurações → Sobre oferecem os destinos `https://toonlira-rm.web.app/legal/terms` e
  `https://toonlira-rm.web.app/legal/privacy` no navegador, com nomes acessíveis nos três idiomas do app.
- Os links são independentes da caixa de aceite do cadastro. Ao voltar do navegador, os dados do formulário e
  o estado da caixa são preservados. A caixa é obrigatória no cadastro.
- O consentimento de tradução individual e em lote usa os destinos da capability vigente. A migração preserva
  a versão do disclosure e os aceites existentes.

## Casos de erro

Em caso de falha de abertura, a tela dá feedback localizado e permite tentar novamente.

## Critérios de aceite

### AC-001 — Login

Cada link abre o documento correspondente no site do app. Ao voltar, os campos continuam preenchidos e o
login pode ser enviado com credenciais válidas.

### AC-002 — Cadastro

Cada link abre o documento correspondente sem alterar o aceite. O formulário impede o envio enquanto a caixa
está desmarcada.

### AC-003 — Configurações

Sobre abre ambos os documentos no site do app e oferece nova tentativa se o navegador falhar.

### AC-004 — Tradução

No consentimento de página única e de lote, ambos os links abrem os destinos recebidos da capability. Uma
capability com a versão já aceita preserva o aceite.

## Estratégia de evidência

| Critério | Teste e evidência                                                                      |
| -------- | -------------------------------------------------------------------------------------- |
| AC-001   | Teste do login e abertura real em Android e iOS.                                       |
| AC-002   | Teste da independência dos links e do aceite e abertura real em Android e iOS.         |
| AC-003   | Teste de Sobre e abertura real em Android e iOS.                                       |
| AC-004   | Testes de página única e lote, capability implantada e abertura real em Android e iOS. |

## Gate de implementação

Estado `open`, com dependências MOB-FEAT-008, MOB-FEAT-017 e MOB-FEAT-061.

## Fora de escopo

Alterações na API de autenticação, persistência de aceite da conta e revisão do texto jurídico.

## Aprovação humana

- Aprovador: Ruan Moraes
- Data: 2026-11-13
- Evidência: resposta "Aprovo a 064 inteira" na revisão tela a tela (tela 11), escolhendo implementar Login, Cadastro, Sobre e consentimento de tradução de uma vez.
