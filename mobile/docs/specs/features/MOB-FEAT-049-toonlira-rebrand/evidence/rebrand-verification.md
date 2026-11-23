# Evidência do rebrand Toonlira — 2026-09-08

- `node --test scripts/tests/brand.test.mjs`: pass na raiz do monorepo.
- `node scripts/brand.mjs generate --check`: pass na raiz do monorepo.
- `node scripts/brand.mjs rebrand --check`: pass na raiz do monorepo.
- `app.json`: nome, slug, scheme e identificadores nativos Toonlira conferidos.
- Persistência local usa banco, SecureStore e diretórios privados Toonlira sem
  migração da marca anterior, conforme decisão aprovada.
- Locales pt-BR, en-US e es-ES passam no teste de paridade do mobile.

O gate funcional está satisfeito. A promoção para `implemented` permanece
pendente apenas do `format:check`, sem relação com comportamento do rebrand.
