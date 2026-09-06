# Evidência automatizada — MOB-FEAT-045

Data: 2026-08-31.

## Testes

- Suíte focada: 5 suítes e 79 testes aprovados para validação, repository,
  picker e integração da página.
- Suíte completa: 87 suítes e 508 testes aprovados, sem snapshot removido ou
  teste desabilitado.
- Cobertura de risco: lote válido/misto, filtro inicial, detalhe local,
  metadado de origem processing, substituição única, reset `PENDING`,
  preservação das demais páginas, CTA de correção e avanço explícito.

## Gates

- `pnpm typecheck`: pass.
- ESLint focado nos arquivos alterados: pass.
- Prettier focado nos arquivos alterados: pass.
- `pnpm lint:fsd`: pass; 5 testes do validador, Steiger e validador local.
- `pnpm specs:check`: os 23 testes de integridade passaram; o comando final
  permanece bloqueado por checksums históricos divergentes em 21 features já
  modificadas na working tree compartilhada.

Os avisos `act(...)` da suíte completa já existiam em testes de organização e
ícones; todas as suítes terminaram com sucesso.

## Preview compartilhado — 2026-09-01

- Componente, Ordenação e Validação: 3 suítes / 43 testes aprovados.
- Suíte completa: 88 suítes / 511 testes aprovados.
- Typecheck, lint FSD e formatação: aprovados.
- Os 23 testes SDD passaram; a etapa final continua bloqueada por 22 checksums
  divergentes no worktree compartilhado.
- Detalhe local/processing e substituição continuam cobertos pelos testes da
  Validação; o componente compartilhado cobre cache, fallback, reset e slots.
