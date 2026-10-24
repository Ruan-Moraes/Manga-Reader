---
id: MOB-FEAT-044
type: feature
title: Campos de idiomas da tradução
status: verification-pending
implementation_gate: open
blocked_by: [MOB-FEAT-014, MOB-FEAT-028, MOB-FEAT-042]
created: 2026-08-31
updated: 2026-09-01
supersedes: []
superseded_by: []
---

# MOB-FEAT-044 — Campos de idiomas da tradução

## Objetivo

Trocar os quadradinhos da etapa 3 por dois campos empilhados de origem e destino,
com seleção por folha inferior, preservando o contrato local de idiomas.

## Contexto e contratos relacionados

- Refina somente a apresentação da MOB-FEAT-014 e da etapa de idiomas da MOB-FEAT-028.
- Reutiliza a folha inferior da MOB-FEAT-042 sem alterar a variante padrão das configurações.
- A inspeção inicial de specs encontrou somente checksums globais antigos em reviews;
  cobertura, referências e reconciliação brownfield não apresentaram divergências.
  Essas aprovações históricas não serão renovadas por este trabalho.
- Referência: anatomia de campo de seleção do Material Design, adaptada aos tokens do app.

## Requisitos e regras

- Manter progresso 3/5, título “Como você quer ler?” e descrição da etapa. Remover
  título secundário “Escolha os idiomas” e separador redundante do painel.
- Mostrar origem primeiro e destino depois, cada um com label permanente, nome
  localizado e chevron discreto. Sem teclado, busca, bandeiras ou blocos de ícones.
- Adicionar `variant="input"` opcional ao SelectField; default permanece intacto.
  Usar inputBg, inputBorder, radii.control (12), altura mínima `layout.controlHeight`
  (52), espaçamento md
  (16 na densidade confortável), contorno focus ao abrir/focar e altura expansível.
- Separar campos por seta decorativa para baixo de 28 px, sem ação de inverter.
- Nota: “A seleção inicial é uma sugestão. O app ainda não analisou as imagens.”
  Confirmar idiomas permanece em largura total no fluxo, após nota e mensagens.
- Folha inferior reutiliza título, fechar, scrim, scroll, safe area e opção
  selecionada. Selecionar fecha e atualiza apenas aquele campo; cancelamento por
  fechar, scrim, voltar ou escape não altera valores. Foco acessível deve retornar
  ao campo; apresentação respeita movimento reduzido.
- PT-BR continua primeiro no destino, com descrição “Recomendado” somente na lista.
  No campo fechado, mostrar só Português (Brasil).
- Preservar sete códigos, 42 pares, sugestão JA → PT-BR, persistência e retomada,
  confirmação explícita, invalidação, busy, rollback e retry existentes. Não
  alterar controller, banco nem navegação após confirmar.
- Usar tokens e i18n pt-BR/en-US/es-ES, labels e estados acessíveis, sem clipping
  de nomes com fonte ampliada e largura compacta. Alterações genéricas em shared/ui;
  composição específica no slice select-translation-languages via barrel público.

## Casos de erro

- Mesmo idioma permanece visível e inválido, sem persistir ou corrigir outro campo.
- Falha de gravação restaura o último par seguro e mantém retry localizado.
- Operação pendente bloqueia campos e confirmação; fechar lista não confirma idiomas.

## Critérios de aceite

### AC-001 — Dois campos e hierarquia

A etapa mostra origem, destino, nota e confirmação, sem quadradinhos, cabeçalho
duplicado ou separador; variante input não altera o default de SelectField.

### AC-002 — Folha inferior e seleção independente

Cada campo abre suas sete opções, reflete a seleção atual, fecha ao escolher ou
cancelar e preserva o outro valor. PT-BR tem prioridade e recomendação só na lista.

### AC-003 — Contrato local preservado

Par inválido, persistência, restauração, confirmação, invalidação, busy e retry
mantêm as regras de MOB-FEAT-014 sem nova API, migration ou navegação.

### AC-004 — Acessibilidade e localização

Três idiomas, temas claro/escuro, fonte ampliada, tela compacta, foco acessível,
seleção/disabled e movimento reduzido são suportados e verificáveis.

### AC-005 — Evidência e rastreabilidade

Executar testes focados e pnpm check, registrar evidências reais, review e drift;
verificação nativa ou gate aberto mantém verification-pending e task aberta.

## Estratégia de evidência

- RNTL do painel: AC-001..004; integração da página: AC-001 e AC-003.
- RNTL shared/ui: variantes, fechamento, semântica, foco e movimento: AC-001/002/004.
- Auditoria visual iOS/Android, temas/locales/fontes; gates e limitações: AC-004/005.

## Gate de implementação

Open: 014 e 042 implementadas; 028 verification-pending, dependência executada
válida conforme AGENTS.md. Nenhum serviço remoto é necessário.

## Fora de escopo

Novos idiomas, busca, detecção, OCR, troca automática, dependências, banco, API,
reformulação das configurações e renovação de aprovações históricas.

## Aprovação humana

Ruan autorizou explicitamente em 2026-08-31: “PLEASE IMPLEMENT THIS PLAN”,
reproduzindo integralmente o plano de redesign. Este documento registra essa
aprovação e suas escolhas; não adiciona requisitos de produto ao plano aprovado.
