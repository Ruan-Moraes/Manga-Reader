---
id: MOB-DEC-002
type: decision
title: Evidência automatizada baseada em risco
status: accepted
created: 2026-08-08
updated: 2026-08-08
supersedes: []
superseded_by: []
---

# MOB-DEC-002 — Evidência automatizada baseada em risco

## Contexto

O mobile não possuía runner de testes. O workflow SDD precisa provar critérios relevantes sem adotar uma porcentagem arbitrária de cobertura ou criar uma suíte retroativa para placeholders.

## Decisão

Usar Jest com `jest-expo` e React Native Testing Library. Nesta migração, automatizar riscos centrais de tema/i18n, settings/session stores, contrato auth, interceptors/refresh e route protection. Cada Target Spec futura define sua estratégia de evidência por `AC-*`.

Adicionar `specs:check` para validar o contrato documental e incluir testes e validação de specs em `pnpm check`. Não usar snapshots como prova principal e não impor threshold percentual.

## Alternativas consideradas

- Somente smoke test: rejeitado por não proteger sessão, refresh e redirects já significativos.
- Cobrir todas as telas de auth: rejeitado por transformar a migração SDD em retrofit completo de testes.
- Vitest puro: rejeitado nesta etapa em favor do preset recomendado para módulos nativos Expo.

## Consequências

- Gates ficam mais lentos, mas executáveis sem dispositivo.
- Comportamentos brownfield testados continuam sendo observações substituíveis.
- E2E e publicação permanecem fora do escopo.
- `MOB-DEC-003` refina esta decisão: uma verificação manual explicitamente normativa permanece bloqueante para conclusão e usa `verification-pending` até sua execução real.

## Relações

- Evidencia MOB-BASE-002 a MOB-BASE-006 e rege futuras seções “Estratégia de evidência”.
