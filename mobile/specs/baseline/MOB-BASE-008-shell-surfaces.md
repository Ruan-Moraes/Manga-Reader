---
id: MOB-BASE-008
type: baseline
title: Superfícies do shell e placeholders
status: observed
created: 2026-08-08
updated: 2026-08-08
supersedes: []
superseded_by: []
---

# MOB-BASE-008 — Superfícies do shell e placeholders

## Contexto

Fotografia mínima das pages fora dos fluxos de auth. A existência de uma page placeholder não implica que sua funcionalidade de domínio esteja implementada ou aprovada.

## Comportamento observado

### OBS-001 — Home, Library e Forum

As três pages renderizam `PageContainer` e `EmptyState`, com título de navegação e descrição “coming soon” traduzidos. Não carregam dados, não executam queries e não oferecem ações.

### OBS-002 — Profile

Profile mostra nome e e-mail apenas quando há usuário em memória. O logout tenta a chamada remota e, com sucesso ou falha, limpa a sessão local e substitui a rota por login.

### OBS-003 — Modal

Modal renderiza somente um `EmptyState` com título traduzido, sem caso de uso ou ação.

### OBS-004 — Not found

Not found define o título do Stack, mostra o mesmo título no conteúdo e oferece link traduzido para `/`.

### OBS-005 — Cascas de rota e APIs públicas

Arquivos de rota delegam renderização às pages correspondentes. Cada slice de page exporta sua page pelo `index.ts`; não há lógica de domínio nos wrappers.

## Evidências

| Observação | Código/teste/comando                      | Resultado esperado                     |
| ---------- | ----------------------------------------- | -------------------------------------- |
| OBS-001    | `src/pages/{home,library,forum}/ui`       | Somente estado vazio traduzido         |
| OBS-002    | `src/pages/profile/ui/ProfilePage.tsx`    | Render condicional e logout em finally |
| OBS-003    | `src/pages/modal/ui/ModalPage.tsx`        | Estado vazio sem ação                  |
| OBS-004    | `src/pages/not-found/ui/NotFoundPage.tsx` | Título e link para raiz                |
| OBS-005    | `app/`; `src/pages/*/index.ts`            | Wrappers finos e barrels observados    |

## Desconhecidos

- Não existe intenção aprovada para conteúdo, persistência ou integrações dessas superfícies.
- A rota `/` depende dos redirects do SessionGate e da resolução do Expo Router.

## Conflitos com intenção futura

- O roadmap menciona catálogo, biblioteca, fórum e perfil completos, mas nenhum desses itens possui Target Spec aprovada.

## Não garantias

- Placeholders não constituem features de catálogo, biblioteca ou fórum entregues.
- Textos “coming soon”, composição e rotas atuais não são requisitos futuros.
