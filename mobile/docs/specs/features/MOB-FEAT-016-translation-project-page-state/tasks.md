# Tasks — MOB-FEAT-016

- Spec: `spec.md`
- Status da spec no planejamento: `approved`
- Gate no planejamento: `open`
- Dependências implementadas: `MOB-FEAT-013`, `MOB-FEAT-014`, `MOB-FEAT-015`

## Rastreabilidade

| Critério | Tasks    | Evidência planejada                                        |
| -------- | -------- | ---------------------------------------------------------- |
| AC-001   | TASK-001 | Matriz de readiness e proteção contra draft obsoleto       |
| AC-002   | TASK-002 | Round-trip de IDs, ordem, idiomas e snapshot validado      |
| AC-003   | TASK-003 | Cópia para namespace próprio e independência do draft      |
| AC-004   | TASK-004 | Fault injection, rollback, limpeza e recovery após restart |
| AC-005   | TASK-005 | SQLite limpo/v4→v5, constraints, FK e versão monotônica    |
| AC-006   | TASK-006 | Matriz completa de transições e concorrência otimista      |
| AC-007   | TASK-007 | READY/cancelamento agregado e rollback atômico             |
| AC-008   | TASK-008 | Duplo toque, idempotência, conflito e stale write          |
| AC-009   | TASK-009 | Reload e getLatest determinístico local                    |
| AC-010   | TASK-010 | UI acessível e i18n pt-BR/en-US/es-ES                      |
| AC-011   | TASK-011 | Ausência de HTTP/Core e mensagens sem dados privados       |
| AC-012   | TASK-012 | Coverage, review e prova de ausência de pipeline fictício  |

## Checklist

- [x] TASK-001 — Validar todas as pré-condições correntes sem mutação parcial.
- [x] TASK-002 — Modelar projeto/página e persistir snapshot com identidade estável.
- [x] TASK-003 — Transferir ownership dos originais para namespace privado próprio.
- [x] TASK-004 — Tornar conversão recuperável antes e depois do commit local.
- [x] TASK-005 — Evoluir SQLite v4→v5 com constraints e `user_version` monotônico.
- [x] TASK-006 — Implementar política pura e repository de transições canônicas.
- [x] TASK-007 — Garantir invariantes agregadas de READY e CANCELLED em transação.
- [x] TASK-008 — Implementar idempotência, single-flight e concorrência otimista.
- [x] TASK-009 — Restaurar projeto/páginas e reconciliar arquivos sem rede/login.
- [x] TASK-010 — Integrar CTA/resumo honesto, acessível e trilíngue à page.
- [x] TASK-011 — Registrar participante local e provar isolamento/privacidade.
- [ ] TASK-012 — Atualizar SDD/coverage, executar testes, review e drift audit.

## Ordem de execução

1. `shared/storage` e `shared/files`.
2. `entities/translation-page` e `entities/translation-project`.
3. `features/create-translation-project`.
4. Composição na page e i18n.
5. Coverage, gates, review e drift.

## Riscos e bloqueios

- O gate está aberto e a implementação foi aprovada em 2026-08-15.
- TASK-012 permanece aberta somente para confirmar em Android físico a criação,
  o encerramento forçado e a restauração do resumo persistido.
- Nenhuma task pode introduzir rede, OCR, tradução, renderização ou leitor.
