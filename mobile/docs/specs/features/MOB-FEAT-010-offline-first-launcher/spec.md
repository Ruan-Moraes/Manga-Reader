---
id: MOB-FEAT-010
type: feature
title: Launcher público e shell de tradução offline
status: implemented
implementation_gate: open
blocked_by: [MOB-FEAT-009]
created: 2026-08-09
updated: 2026-08-09
supersedes: []
superseded_by: []
---

# MOB-FEAT-010 — Launcher público e shell de tradução offline

## Objetivo

Iniciar o aplicativo em um seletor público de módulos, oferecendo configurações locais e um shell honesto de tradução offline, enquanto a plataforma de leitura futura permanece autenticada e indisponível.

## Contexto e contratos relacionados

- Substitui parcialmente `MOB-BASE-006/OBS-001`, `MOB-BASE-006/OBS-004` e `MOB-BASE-008/OBS-001..OBS-002`, sem implementar os domínios placeholder.
- Usa a autoridade local e os estados de sync de `MOB-FEAT-009` e as subrotas existentes de `MOB-FEAT-008`.

## Requisitos e regras

- `/` deve ser a rota inicial pública e renderizar um seletor após hidratação; splash/loading/erro recuperável substituem qualquer frame vazio.
- O seletor deve possuir cards localizados para plataforma e tradução offline, com status, descrição, CTA acessível e atalho para configurações.
- A plataforma deve ser indicada como em construção. Guest pode abrir login, e sucesso de login/cadastro retorna somente ao destino interno permitido `/platform/status`.
- `/platform/status` exige autenticação e mostra conta, sync de preferências, settings, logout e retorno ao seletor; tabs placeholders não ficam acessíveis.
- `/offline-translation` é público, local e sem HTTP, picker, importação, tradução, progresso ou sucesso simulados; deve expor estado indisponível, settings e retorno ao seletor.
- Rotas públicas são launcher, offline e settings conforme política da capacidade. Rotas privadas e deep links usam allowlist, sem open redirect ou loop.
- Back visual, back do sistema e histórico devem retornar à origem lógica sem perder preferências confirmadas.
- Toda UI nova usa tokens, i18n trilíngue, reflow, alvos mínimos e redução de movimento.

## Casos de erro

- Falha de hidratação deve apresentar fallback localizado e retry, mantendo acesso ao launcher após recuperação.
- Expiração/logout em `/platform/status` deve retornar ao launcher sem expor tabs ou dados anteriores.
- Destino externo ou desconhecido deve ser rejeitado e usar fallback interno seguro.

## Critérios de aceite

### AC-001 — Launcher como entrada pública

Guest ou usuário autenticado inicia em `/` e vê o seletor após estado explícito de hidratação, nunca um frame vazio.

### AC-002 — Cards verdadeiros e acessíveis

Os dois módulos exibem disponibilidade real, descrição e ações localizadas com tema, densidade e acessibilidade aplicados.

### AC-003 — Shell offline sem funcionalidade fictícia

Abrir tradução mostra somente estrutura e indisponibilidade honestas, sem request ou ação de domínio inexistente.

### AC-004 — Plataforma autenticada em construção

Guest é encaminhado ao login e usuário autenticado chega ao status conectado; tabs placeholder ficam inacessíveis.

### AC-005 — Return-to seguro

Login e cadastro consomem `/platform/status` uma vez; URLs externas e paths desconhecidos são rejeitados.

### AC-006 — Navegação e estado preservados

Back visual/sistema, deep links e retorno ao launcher são determinísticos e não perdem preferências persistidas.

### AC-007 — Status conectado recuperável

O status mostra identidade, sincronização, settings, logout e retorno; expiração remove conteúdo privado sem frame residual.

### AC-008 — Interface trilíngue e responsiva

Launcher, offline, status e estados de hidratação possuem paridade pt-BR/en-US/es-ES, reflow e sem valores visuais hardcoded.

## Estratégia de evidência

| Critério               | Teste/evidência esperada                                    |
| ---------------------- | ----------------------------------------------------------- |
| AC-001                 | Testes de root guest/auth e hidratação atrasada/falha       |
| AC-002, AC-008         | RNTL dos cards, i18n, tema e acessibilidade                 |
| AC-003                 | Teste do shell e ausência de cliente HTTP                   |
| AC-004, AC-005, AC-007 | Testes de gate, login/cadastro, return-to, tabs e expiração |
| AC-006                 | Integração de push/back/deep link e estado persistido       |

## Gate de implementação

- Estado: `open`
- Dependências: `MOB-FEAT-009`
- Motivo: `MOB-FEAT-009` está implementada.

## Fora de escopo

- Traduzir, importar ou armazenar capítulos.
- Implementar catálogo, leitura, comentários, avaliações ou tabs futuras.
- Alterar autenticação ou contratos da Core.

## Aprovação humana

- Aprovador: usuário
- Data: 2026-08-09

O usuário aprovou explicitamente o plano completo que definiu estes critérios antes da criação de tasks e código.
