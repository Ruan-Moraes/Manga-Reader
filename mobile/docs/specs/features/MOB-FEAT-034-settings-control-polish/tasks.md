# Tasks — MOB-FEAT-034

- Spec: `spec.md`
- Status: `verification-pending`
- Gate: `open`

## Rastreabilidade

| Critério | Task     | Evidência                        |
| -------- | -------- | -------------------------------- |
| AC-001   | TASK-001 | SwitchRow e testes               |
| AC-002   | TASK-002 | ChoiceCards e aparência          |
| AC-003   | TASK-003 | SwatchPicker e leitor            |
| AC-004   | TASK-004 | RangeSlider e regressão de gesto |
| AC-005   | TASK-005 | SettingsSyncStatus e páginas     |
| AC-006   | TASK-006 | auditoria nativa e gates         |

## Checklist

- [x] TASK-001 — Reposicionar e estabilizar controles booleanos.
- [x] TASK-002 — Reorganizar conteúdo dos cards com preview.
- [x] TASK-003 — Implementar faixa contígua de amostras de cor.
- [x] TASK-004 — Substituir o slider nativo pelo gesto compartilhado no UI thread; cobrir extremos, âncora Android, coordenada terminal e estabilidade após o release.
- [x] TASK-005 — Ocultar estados locais/sincronizados não acionáveis.
- [ ] TASK-006 — Confirmar no aparelho Android físico o gesto compartilhado após a validação no emulador; os gates automatizados e a matriz do emulador já foram executados.
