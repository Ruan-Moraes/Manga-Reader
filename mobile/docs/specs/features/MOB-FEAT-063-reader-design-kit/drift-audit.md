# Drift audit — MOB-FEAT-063

- Data: 2026-11-08
- Implementação auditada: working-tree sha256:98927951b96bb378a2a7e13172a5ab5ccd45d7def6e2a6ad48c612013e7a39f0
- Status da feature: `verification-pending`

## Escopo auditado

- Spec, tasks, review, `widgets/content-reader` (`ContentReader`, `ReaderPanel`, `ImageViewport`),
  `features/configure-chapter-reader`, `pages/offline-translation` (leitor local), `pages/reader`, locales `reader`,
  `coverage.json` e registry.

## Divergências

| Severidade | Evidência | Classificação             | Ação    |
| ---------- | --------- | ------------------------- | ------- |
| —          | —         | sem divergência conhecida | nenhuma |

Verificações feitas:

- Categorias `reading`, `appearance`, `navigation`, `image` e `behavior` do `ReaderSettingsControls` inalteradas.
- Barras e estados usam só tokens do tema; nenhuma cor fixa do kit foi portada.
- Não portados: páginas simuladas, limite de 30 páginas, retry roteirizado, toasts e paleta fixa.

## Contadores derivados

- `mismatch`: 0
- `undocumented`: 0
- arquivos runtime descobertos: 0
- caminhos obsoletos: 0
- violações de gate: 0

## Pendências de verificação

- TASK-010: escuro e RTL do leitor local no iPhone 18 Pro feitos em 2026-11-09 (barras e folha de ajustes em
  `docs/ui-captures/dark/design-kit-phase2-iphone18pro/`); faltam o leitor da plataforma, claro, fonte ampliada,
  redução de movimento e Android físico.
