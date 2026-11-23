---
id: MOB-FEAT-052
type: feature
title: Controles imersivos e gestos do leitor
status: verification-pending
implementation_gate: open
blocked_by: [MOB-FEAT-051]
created: 2026-09-09
updated: 2026-09-09
supersedes: []
superseded_by: []
---

# MOB-FEAT-052 — Controles imersivos e gestos do leitor

## Objetivo

Refinar MOB-FEAT-051 exclusivamente no mobile, preservando suas alterações locais,
progresso, virtualização, modos, comparação, erros e identidade visual. Preferências
locais refinam MOB-FEAT-009 sem alterar o contrato remoto ou schema SQLite.

## Contexto e contratos relacionados

MOB-FEAT-051, MOB-FEAT-009 e MOB-DEC-007. Mantém arquitetura FSD e aprovação
humana do plano, sem substituir evidências históricas dessas features.

## Aprovação humana

- Aprovador: usuário desta tarefa (Ruan).
- Data: 2026-09-09.
- Evidência: mensagem “PLEASE IMPLEMENT THIS PLAN”, reproduzindo integralmente o
  plano aprovado. A opção visível oculta ao rolar e reaparece no repouso por escolha
  explícita do usuário na etapa de planejamento.

## Requisitos e regras

Os critérios abaixo constituem o contrato aprovado. A viewport permanece independente
da visibilidade; preferências de gestos pertencem somente ao dispositivo.

## Critérios de aceite

### AC-001 — Estado e arbitragem

Toque, deslize e toque-ou-deslize começam ocultos. Arraste/momentum ocultam ambas
as barras, sem reaparecer ao parar. VISIBLE mostra em repouso e oculta enquanto
arraste ou momentum estiver ativo. Mudanças manuais preservam visibilidade;
selecionar VISIBLE revela apenas em repouso. Cancelamento, multitouch, movimento
e toque que interrompe momentum não alternam. Botões, retry e painel são isolados.
Um controlador central recebe eventos; não há listeners concorrentes de toque.

### AC-002 — Gestos e acessibilidade

Toque habilitado alterna. Deslize só revela a partir de região central inferior
reservada acima da área de gestos do sistema, com subida >=24 dp, desvio horizontal
<=16 dp e duração <=400 ms, nunca durante momentum. Fora dela, scroll não revela.
Áreas laterais (25% por lado) são opcionais, inicialmente desligadas, somente
PAGED/DOUBLE efetivos, com RTL e pares. Toque na obra com barras visíveis oculta
antes de navegar. Ação acessível e acesso focável por leitor de tela permanecem;
preferências podem ser abertas pela tela global sem gestos precisos.

### AC-003 — Preferências duráveis

ReaderGesturePreferences separa controlsMode (TAP, SWIPE, TAP_OR_SWIPE, VISIBLE) e
sideTapNavigation boolean do DTO sincronizado. Defaults TAP_OR_SWIPE/false.
Envelope v3 migra v1/v2, normaliza dados inválidos, preserva dirtyPaths v2 e escolhas
em login/logout/sync. Atualização imediata reutiliza a fila local e expõe erro de
gravacão; não envia gestos à API. UI no painel e configurações com descrição,
seleção explícita e pt-BR/en-US/es-ES. Opção lateral indisponível em vertical/texto.

### AC-004 — Apresentação e geometria

Barras sobrepostas compactas: voltar, título disponível truncado, capítulo e
configurações no topo; progresso/página e navegação existente embaixo. Preservar
comparação e overflow no painel e erros acessíveis. Não inventar título da obra ou
destinos de capítulos. Tokens, safe areas, alvos 44/48 dp, fonte ampliada e alto
contraste. Animar juntas opacity/translate em 160 ms, respeitando redução de
movimento. Ocultas não capturam toque/foco. Não remonta viewport nem muda geometria,
offset, proporção ou barras do sistema ao alternar; preservar prefetch/virtualização.

### AC-005 — Verificação

Testes de estados/gestos/migração/sync, integrações de páginas, RTL/duplo/limites,
geometria e virtualização. Executar pnpm check, distinguir baseline. Matriz nativa
de temas/fontes/dimensões/orientações/leitor de tela e comparação frames/memória
antes/depois em 10/67/200 imagens. Pendência real mantém verification-pending.

## Casos de erro

Preferência inválida usa padrão seguro; falha local mantém escolha em memória e
expõe diagnóstico/retry. Erro de imagem, progresso e retorno preservam fluxos atuais.

## Gate de implementação

Open: MOB-FEAT-051 está executada em verification-pending, dependência permitida
pelo AGENTS mobile. Aprovação de execução registrada acima.

## Fora de escopo

API/web, navegação nova de capítulos, banco relacional, qualidade de imagem menor,
reforma do design system, gestos de sistema e expansão de orientações suportadas.

## Estratégia de evidência

| Critério | Evidência                                        |
| -------- | ------------------------------------------------ |
| AC-001   | reducer/hook e integração RNTL                   |
| AC-002   | helpers, Gesture Handler e acessibilidade nativa |
| AC-003   | store, migração, API mock e controles            |
| AC-004   | RNTL, geometria, inspeção visual                 |
| AC-005   | gates e matriz nativa separada                   |
