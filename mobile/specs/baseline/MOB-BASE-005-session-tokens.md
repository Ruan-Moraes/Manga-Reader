---
id: MOB-BASE-005
type: baseline
title: Sessão, armazenamento e rotação de tokens
status: observed
created: 2026-08-08
updated: 2026-08-08
supersedes: []
superseded_by: []
---

# MOB-BASE-005 — Sessão, armazenamento e rotação de tokens

## Contexto

Fotografia do estado Zustand, SecureStore, interceptors Axios e expiração de auth.

## Comportamento observado

### OBS-001 — Armazenamento sensível

Access e refresh tokens usam chaves separadas no Expo SecureStore. `setTokens` grava ambos e `clear` remove ambos.

### OBS-002 — Hidratação da sessão

O store marca a sessão autenticada apenas quando encontra os dois tokens. A hidratação não busca `/auth/me` e mantém `user` nulo.

### OBS-003 — Login e logout local

Login persiste tokens antes de publicar usuário/sessão autenticada. Logout limpa o SecureStore e zera usuário, tokens e flag.

### OBS-004 — Autorização de requests

Cada request lê o access token diretamente do SecureStore, não de `sessionStore.tokens`, e, quando presente, envia `Authorization: Bearer`.

### OBS-005 — Refresh single-flight

O primeiro 401 elegível chama `/api/auth/refresh` com refresh token no body. Outros 401 enquanto o refresh está ativo aguardam a mesma operação; sucesso persiste tokens rotacionados e repete os requests com o novo access token. O snapshot `sessionStore.tokens` não é sincronizado pelo interceptor.

### OBS-006 — Falha e expiração

401 de endpoint auth (exceto `/auth/me`) não tenta refresh. Falha de refresh limpa tokens, rejeita a fila e notifica listeners; `SessionGate` responde executando logout local. Se a limpeza do SecureStore rejeitar, a rejeição da fila e a notificação não são alcançadas.

## Evidências

| Observação      | Código/teste/comando                                   | Resultado esperado                                |
| --------------- | ------------------------------------------------------ | ------------------------------------------------- |
| OBS-001–OBS-003 | `src/shared/store/__tests__/sessionStore.test.ts`      | Hidratação, login e logout verificados            |
| OBS-004–OBS-006 | `src/shared/api/__tests__/apiClient.test.ts`           | Headers, single-flight, retry e falha verificados |
| OBS-006         | `src/application/gates/__tests__/SessionGate.test.tsx` | Listener de expiração dispara logout              |

## Desconhecidos

- O comportamento em encerramento do app durante escrita de um dos tokens não é coberto.
- Não existe política aprovada para sessão offline futura.
- Rejeição do SecureStore durante `hydrate()` mantém o SessionGate bloqueado porque não há tratamento de erro.

## Conflitos com intenção futura

- O estado atual trata tokens armazenados como autenticação suficiente, mesmo sem usuário hidratado.

## Não garantias

- O mecanismo não é contrato para uma futura experiência guest/offline.
- Tempos de expiração pertencem à Core e não são especificados aqui.
- Operações sequenciais no SecureStore não possuem rollback transacional.
