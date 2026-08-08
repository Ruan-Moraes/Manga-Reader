---
id: MOB-BASE-007
type: baseline
title: Componentes compartilhados de interface
status: observed
created: 2026-08-08
updated: 2026-08-08
supersedes: []
superseded_by: []
---

# MOB-BASE-007 — Componentes compartilhados de interface

## Contexto

Fotografia dos componentes públicos em `src/shared/ui`. Eles são infraestrutura visual existente, não um compromisso de design futuro.

## Comportamento observado

### OBS-001 — Avatar

`Avatar` renderiza imagem circular quando recebe `src`; caso contrário, usa até os dois primeiros caracteres trimados e em maiúsculas do nome, ou `?`, sobre o token de destaque. O tamanho padrão é 40.

### OBS-002 — Button

`Button` possui variantes primary, ghost e outline, ocupa a largura total por padrão e desabilita interação quando `loading` ou `disabled`. Loading substitui o conteúdo por indicador; cores, altura e raio vêm do tema.

### OBS-003 — Card e EmptyState

`Card` aplica superfície, borda, raio e padding opcional. `EmptyState` centraliza ícone, título, descrição opcional e ação opcional usando tokens e fontes do tema.

### OBS-004 — Input

`Input` controla foco local, prioriza a cor de erro sobre foco, desabilita autocorreção e encaminha valor, teclado, capitalização, blur, multiline e entrada segura. Label e erro são opcionais.

### OBS-005 — PageContainer

`PageContainer` aplica fundo, safe areas e padding horizontal. Com `scroll`, envolve o conteúdo em KeyboardAvoidingView e ScrollView, usando `padding` no iOS e `height` nas demais plataformas.

### OBS-006 — Skeleton

`Skeleton` anima continuamente a opacidade entre 0,3 e 1 em ciclos de 700 ms, usa largura total e altura 16 por padrão e interrompe a animação no unmount.

### OBS-007 — API pública

O barrel de `shared/ui` exporta Avatar, Button, Card, EmptyState, Input, PageContainer e Skeleton.

## Evidências

| Observação       | Código/teste/comando                        | Resultado esperado                                |
| ---------------- | ------------------------------------------- | ------------------------------------------------- |
| OBS-001–OBS-006  | `src/shared/ui/*.tsx`                       | Props, branches e defaults correspondem ao código |
| OBS-002, OBS-004 | `src/shared/ui/__tests__/sharedUi.test.tsx` | Loading/disabled e prioridade de erro verificados |
| OBS-007          | `src/shared/ui/index.ts`; `pnpm typecheck`  | API pública resolve sem deep import               |

## Desconhecidos

- Não há catálogo visual automatizado nem teste de fidelidade em dispositivo.
- Acessibilidade explícita não é configurada por esses componentes além do comportamento nativo.

## Conflitos com intenção futura

- Nenhum contrato futuro de design system foi aprovado.

## Não garantias

- Valores visuais, props e composição atuais podem ser substituídos por Target Specs futuras.
- Este baseline não exige snapshot ou cobertura visual pixel a pixel.
