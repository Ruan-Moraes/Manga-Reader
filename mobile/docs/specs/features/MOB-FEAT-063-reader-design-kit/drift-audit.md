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

## Revisão de 2026-11-11

AC-010 mapeado a tasks, review e evidências. Primeira tradução e retry no leitor revisado por inspeção e testes automatizados. A verificação física permanece aberta.

O APK final foi instalado por atualização no emulador Android API 37 e preservou o capítulo sintético. O leitor anunciou Página original, apresentou a indicação neutra e abriu consentimento para uma única página. O envio foi recusado.
