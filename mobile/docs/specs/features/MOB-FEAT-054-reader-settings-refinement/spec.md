---
id: MOB-FEAT-054
type: feature
title: Refinamento do leitor e das configurações mobile
status: verification-pending
implementation_gate: open
blocked_by: [MOB-FEAT-051, MOB-FEAT-052, MOB-FEAT-053]
created: 2026-09-10
updated: 2026-09-10
supersedes: []
superseded_by: []
---

# MOB-FEAT-054 — Refinamento do leitor e configurações

## Objetivo

Reduzir a rolagem e o peso visual dos ajustes durante a leitura mantendo identidade Toonlira e comportamento das preferências.

## Aprovação humana

Ruan, 2026-09-10: mensagem “PLEASE IMPLEMENT THIS PLAN” com o plano integral “Refinamento do leitor e das configurações mobile”. Este registro transcreve a aprovação explícita; não constitui aprovação autônoma da IA.

## Contexto e contratos relacionados

MOB-FEAT-051/052/053 executadas em verification-pending; gate open conforme AGENTS mobile. MOB-DEC-007 rege performance. Cobertura existente inspecionada; validador inicial aponta somente oito checksums históricos divergentes (025/026/027/049/050/051/052/053). Não renovar reviews antigas sem revisão de suas evidências.

## Requisitos e regras

Aplicar exclusivamente o plano humano aprovado. O estado das preferências permanece nos donos existentes e o painel usa tokens, i18n e APIs públicas FSD.

## Critérios de aceite

### AC-001 — Painel parcial e categorias

Folha em 70% da altura útil, expansível, com expansão automática para fonte ampliada ou pouca altura. Cabeçalho e abas fixos, conteúdo rolável. Fechar por botão, backdrop e voltar Android. Iniciar em Leitura e lembrar aba na sessão do documento. Safe area aplicada uma vez.

### AC-002 — Preferências compactas

Leitura agrupa modo, direção, ajuste, espaçamento, preload e marcação; Aparência agrupa qualidade, fundo, saturação e comparação disponível; Gestos agrupa controles e toque lateral. Seletores compactos, descrição selecionada, ajuda expansível e amostras separadas. Preservar limites, commit de sliders, erros e retry; configurações globais mantêm apresentação.

### AC-003 — Integração e imersão

Seções tipadas no ContentReader e fallback controlsContent textual. Barras sobrepostas alinhadas com separadores e tokens. Não remontar viewport nem perder âncora ao abrir/fechar/trocar abas. Preservar gestos, modos, RTL, comparação, overflow, progresso e persistência.

### AC-004 — Acessibilidade e verificação

i18n pt-BR/en-US/es-ES, alvos 44/48 dp, fonte ampliada, contraste e redução de movimento. Testes de painel, categorias e integrações; pnpm check; capturas iOS/Android e medições comparáveis de abertura/rolagem. Pendências nativas mantêm verification-pending.

## Casos de erro

Manter erros e retry existentes; opções indisponíveis não ganham capacidade fictícia.

## Fora de escopo

API, web, migrações, novas preferências, dependências e expansão funcional do leitor textual.

## Estratégia de evidência

| Critério | Evidência                                                        |
| -------- | ---------------------------------------------------------------- |
| AC-001   | ReaderPanel.test.tsx e inspeção iOS                              |
| AC-002   | ReaderSettingsControls.test.tsx e ReaderGestureControls.test.tsx |
| AC-003   | ContentReader.test.tsx e integrações das pages                   |
| AC-004   | Gates, capturas iOS e matriz nativa/performance pendente         |

## Gate de implementação

Open na entrada: MOB-FEAT-051/052/053 estão executadas em verification-pending. A solicitação de implementação registra aprovação humana do plano; nenhuma dependência bloqueada é executada.
