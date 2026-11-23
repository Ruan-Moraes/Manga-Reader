# Tasks — MOB-FEAT-054

- Status da spec no planejamento: `approved`
- Gate no planejamento: `open`
- Dependências: MOB-FEAT-051/052/053 em verification-pending.

| Critério | Tasks    | Evidência planejada  |
| -------- | -------- | -------------------- |
| AC-001   | TASK-001 | Jest/RNTL e inspeção |
| AC-002   | TASK-002 | Jest/RNTL e inspeção |
| AC-003   | TASK-003 | Jest/RNTL e inspeção |
| AC-004   | TASK-004 | Jest/RNTL e inspeção |

- [x] TASK-001 — Painel parcial e categorias.
- [x] TASK-002 — Preferências compactas.
- [x] TASK-003 — Integração e imersão.
- [ ] TASK-004 — Acessibilidade e verificação.

## Verificação aberta

TASK-004: capturas e expansão/recolhimento no iPhone 17/iOS 26.5 executados. Android sem aparelho conectado; matriz de temas, fontes, acessibilidade e medições de frames/memória/abertura com 10/67/200 imagens continuam abertas. Não inferir performance nativa de testes Jest.

Gates: TypeScript, ESLint, FSD e Jest passam. pnpm check interrompe em oito checksums históricos divergentes, já presentes na entrada. format:check permanece vermelho; não executar formatadores globais para colapsar o JSX do projeto.
