# Tasks — MOB-FEAT-024

- Spec: `spec.md`
- Status da spec no planejamento: `approved` (2026-11-20)
- Gate no planejamento: `open`
- Dependências implementadas: `MOB-FEAT-022` (`verification-pending`)

## Rastreabilidade

| Critério | Tasks    | Evidência planejada                                        |
| -------- | -------- | ---------------------------------------------------------- |
| AC-001   | TASK-001 | `LocalTranslationReaderPage.test.tsx` (selo e remoção)     |
| AC-002   | TASK-002 | `ImageSurface.test.tsx` (fade e movimento reduzido)        |
| AC-003   | TASK-003 | `OfflineTranslationPage.test.tsx` (estados e três locales) |

## Checklist

- [x] TASK-001 — Selo "Traduzindo…" na página sem resultado de um projeto parcial; some quando o resultado chega.
- [x] TASK-002 — Fade de opacidade (~300 ms) quando a tradução substitui o original durante a leitura; troca
      imediata com "Reduzir movimento".
- [x] TASK-003 — Cartão do projeto com título e descrição por estado, nos três idiomas.
- [x] TASK-004 — Gates, `coverage.json`, review e drift.
- [ ] TASK-005 — Verificação no simulador iOS e no aparelho.

## Riscos e bloqueios

- Nenhum além da verificação física pendente das specs anteriores.
