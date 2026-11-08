# Drift audit — MOB-FEAT-061

- Data: 2026-11-08
- Implementação auditada: commit b696499cf965420c938a0d5045e20b548cb0a963
- Status da feature: `verification-pending`

## Escopo auditado

- Spec, tasks, review, `pages/login`, `pages/register`, `pages/forgot`, `features/authenticate/ui`, locales `auth`,
  testes, `coverage.json`, registry, dependência da 057 e a substituição parcial da MOB-BASE-004/OBS-007.

## Divergências

| Severidade | Evidência | Classificação             | Ação    |
| ---------- | --------- | ------------------------- | ------- |
| —          | —         | sem divergência conhecida | nenhuma |

Verificações feitas:

- `features/authenticate/model` e `api` não foram alterados; OBS-001 a OBS-006 continuam válidos.
- Arquivos novos e alterados mapeados a `MOB-FEAT-061/AC-*` no `coverage.json`.
- As chaves `auth.rememberSession` e `auth.newsletterOptIn` seguem sem uso, como decidido (D6).

## Contadores derivados

- `mismatch`: 0
- `undocumented`: 0
- arquivos runtime descobertos: 0
- caminhos obsoletos: 0
- violações de gate: 0

## Pendências de verificação

- TASK-007: capturas das três telas e da tela de enviado no iOS Simulator (claro, escuro, fonte ampliada, 320 pt).
