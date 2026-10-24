# Evidência — testes e gates automatizados

Data: 2026-08-22

## Cobertura dirigida

- `sharedUi.test.tsx`: seleção, foco, toque na linha e reflow em fonte ampliada.
- `AppearanceAccessibilityControls.test.tsx`: tema, escala, densidade, animação,
  redução de movimento, contraste e aplicação imediata.
- `InterfaceLanguageRegionControls.test.tsx`: idioma, formato de data, fuso e
  persistência via sheet.
- `ReaderSettingsControls.test.tsx`: modo, direção, ajuste, qualidade, fundo,
  saturação, espaçamento, pré-carregamento e marcação automática.
- `PrivacyControlsPanel.test.tsx`: visibilidades, histórico, conteúdo adulto,
  analytics, desabilitado e confirmação de `DO_NOT_TRACK`.
- `SettingsNavigation.integration.test.tsx`: retorno das sete subtelas.

## Resultado da suíte

| Comando        | Resultado                                 |
| -------------- | ----------------------------------------- |
| `pnpm test:ci` | pass; 84 suítes e 429 testes, zero falhas |

Os gates estáticos e de especificação são registrados no review final após a
atualização dos checksums de integridade.

Critérios cobertos: AC-001, AC-002, AC-004, AC-005, AC-006 e AC-008.
