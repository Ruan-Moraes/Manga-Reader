---
id: MOB-BASE-003
type: baseline
title: Internacionalização e preferência de idioma
status: observed
created: 2026-08-08
updated: 2026-08-08
supersedes: []
superseded_by: []
---

# MOB-BASE-003 — Internacionalização e preferência de idioma

## Contexto

Fotografia dos locales, hidratação de idioma e propagação para requests.

## Comportamento observado

### OBS-001 — Idiomas e namespaces

O app registra `pt-BR`, `en-US` e `es-ES`, com `pt-BR` como idioma e fallback padrão. Os namespaces registrados são `common` e `auth`.

### OBS-002 — Paridade estrutural

Cada idioma contém os dois namespaces e a mesma estrutura de chaves dos demais idiomas.

### OBS-003 — Persistência e fallback

O settings store aceita apenas idiomas suportados. Na hidratação, valor ausente ou inválido volta para `pt-BR`; mudanças válidas são persistidas no SecureStore.

### OBS-004 — Aplicação do idioma

Após hidratação, o `SettingsGate` chama `i18n.changeLanguage` quando o idioma persistido difere do idioma ativo.

### OBS-005 — Idioma em requests

O interceptor adiciona o idioma corrente ao header `Accept-Language`; valor ativo não suportado é normalizado para `pt-BR`.

## Evidências

| Observação                | Código/teste/comando                               | Resultado esperado                        |
| ------------------------- | -------------------------------------------------- | ----------------------------------------- |
| OBS-001, OBS-002, OBS-005 | `src/shared/i18n/__tests__/i18n.test.ts`           | Registro, paridade e fallback verificados |
| OBS-003                   | `src/shared/store/__tests__/settingsStore.test.ts` | Hidratação e persistência verificadas     |
| OBS-005                   | `src/shared/api/__tests__/apiClient.test.ts`       | Header verificado em request              |

## Desconhecidos

- Não existe tela atual para o usuário alterar idioma ou tema.

## Conflitos com intenção futura

- Chaves traduzidas para funcionalidades ainda inexistentes não constituem roadmap aprovado.

## Não garantias

- Presença de uma chave não garante que exista uma rota, tela ou comportamento correspondente.
