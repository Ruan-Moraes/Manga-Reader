---
id: MOB-BASE-008
type: baseline
title: Superfícies do shell e placeholders
status: observed
created: 2026-08-08
updated: 2026-08-09
supersedes: []
superseded_by: []
---

# MOB-BASE-008 — Superfícies do shell e placeholders

## Contexto

Fotografia mínima das pages fora dos fluxos de auth. A existência de uma page placeholder não implica que sua funcionalidade de domínio esteja implementada ou aprovada.

`MOB-FEAT-005` implementa uma rota de leitor independente. `MOB-FEAT-010` mantém Home, Library e Forum como código futuro sob a plataforma, mas impede que seus placeholders sejam expostos.

## Comportamento observado

### OBS-001 — Home, Library e Forum

As três pages preservadas renderizam `PageContainer` e `EmptyState`, com título e descrição traduzidos. Não carregam dados ou oferecem ações; seus wrappers ficam sob `platform/(tabs)` e são redirecionados para o status conectado.

### OBS-002 — Profile

Profile mostra nome e e-mail apenas quando há usuário em memória e expõe uma entrada para configurações. O logout remoto/local agora retorna ao launcher, embora a page permaneça inacessível pelas tabs enquanto a plataforma estiver em construção.

### OBS-003 — Modal

Modal renderiza somente um `EmptyState` com título traduzido, sem caso de uso ou ação.

### OBS-004 — Not found

Not found define o título do Stack, mostra o mesmo título no conteúdo e oferece link traduzido para `/`.

### OBS-005 — Cascas de rota e APIs públicas

Arquivos de rota delegam renderização às pages correspondentes. As três rotas do launcher usam o slice coeso `pages/launcher`; as demais pages mantêm barrels públicos e os wrappers não possuem lógica de domínio.

## Evidências

| Observação | Código/teste/comando                      | Resultado esperado                                          |
| ---------- | ----------------------------------------- | ----------------------------------------------------------- |
| OBS-001    | `src/pages/{home,library,forum}/ui`       | Somente estado vazio traduzido                              |
| OBS-002    | `src/pages/profile/ui/ProfilePage.tsx`    | Entrada de settings, dados condicionais e logout em finally |
| OBS-003    | `src/pages/modal/ui/ModalPage.tsx`        | Estado vazio sem ação                                       |
| OBS-004    | `src/pages/not-found/ui/NotFoundPage.tsx` | Título e link para raiz                                     |
| OBS-005    | `src/app/`; `src/pages/*/index.ts`        | Wrappers finos e barrels observados                         |

## Desconhecidos

- Não existe intenção aprovada para conteúdo, persistência ou integrações dessas superfícies.
- A rota `/` é o launcher público normativo em `MOB-FEAT-010`.

## Conflitos com intenção futura

- O roadmap menciona catálogo, biblioteca, fórum e perfil completos, mas nenhum desses itens possui Target Spec aprovada.

## Não garantias

- Placeholders não constituem features de catálogo, biblioteca ou fórum entregues.
- Textos “coming soon”, composição e rotas atuais não são requisitos futuros.
- A rota de leitor e seus contratos são normativos em `MOB-FEAT-005`, não neste baseline.
