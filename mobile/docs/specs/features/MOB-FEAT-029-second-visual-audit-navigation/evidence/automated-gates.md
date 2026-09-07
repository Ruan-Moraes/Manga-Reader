# Evidência automatizada — MOB-FEAT-029

Data: 2026-08-22

## Cobertura comportamental

- `src/shared/ui/__tests__/sharedUi.test.tsx`: safe area, teclado, Button,
  BackButton, NavigationHeader, estados e alvos mínimos.
- `src/shared/navigation/__tests__/back.test.ts`: histórico real e fallback de
  deep link.
- `src/shared/theme/__tests__/responsive.test.ts`: classes e matrizes 320×568,
  390×844, 600×960 e 840×600.
- `src/shared/theme/__tests__/ThemeProvider.test.tsx`: escala tipográfica até 2.
- suítes de auth, launcher, settings, offline e reader: regressão dos fluxos,
  persistência e navegação preservados.

## Gates

`pnpm check` passou integralmente. A suíte final contém 83 suítes e 416 testes,
sem falhas. O comando dirigido de fundação também passou com 3 suítes e 28
testes.
