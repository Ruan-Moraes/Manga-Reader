# Tasks — MOB-FEAT-028

- Spec: `spec.md`
- Status da spec no planejamento: `implemented`
- Gate no planejamento: `open`
- Dependências executadas: `MOB-FEAT-011..016`

## Rastreabilidade

| Critério | Tasks    | Evidência planejada                    |
| -------- | -------- | -------------------------------------- |
| AC-001   | TASK-001 | tokens e busca de literais             |
| AC-002   | TASK-002 | primitivas e auditoria de consumidores |
| AC-003   | TASK-003 | jornada de cinco etapas                |
| AC-004   | TASK-004 | transições e retomada                  |
| AC-005   | TASK-005 | estados interativos RNTL               |
| AC-006   | TASK-006 | estados de conteúdo RNTL               |
| AC-007   | TASK-007 | migração das superfícies               |
| AC-008   | TASK-008 | ausência de capacidades fictícias      |
| AC-009   | TASK-009 | resolvedor e matriz responsiva         |
| AC-010   | TASK-010 | font scale 200% manual                 |
| AC-011   | TASK-011 | contraste e alvos mínimos              |
| AC-012   | TASK-012 | continuidade do reader                 |
| AC-013   | TASK-013 | paridade i18n                          |
| AC-014   | TASK-014 | regressão funcional                    |
| AC-015   | TASK-015 | gates completos                        |
| AC-016   | TASK-016 | matriz visual física                   |

## Checklist

- [x] TASK-001 — Evoluir tokens semânticos e seus testes.
- [x] TASK-002 — Criar/evoluir primitivas compartilhadas e migrar duplicações.
- [x] TASK-003 — Implementar a jornada visual de cinco etapas.
- [x] TASK-004 — Provar transições e retomada determinísticas.
- [x] TASK-005 — Cobrir estados interativos e semântica assistiva.
- [x] TASK-006 — Padronizar estados de conteúdo e retry.
- [x] TASK-007 — Migrar superfícies atuais por camada FSD.
- [x] TASK-008 — Provar ausência de tabs e processamento fictício.
- [x] TASK-009 — Implementar e testar responsividade.
- [x] TASK-010 — Auditar font scale de 200% em simulador/dispositivo.
- [x] TASK-011 — Verificar contraste e alvos mínimos.
- [x] TASK-012 — Cobrir continuidade do reader em dimensão/controles.
- [x] TASK-013 — Atualizar e validar i18n trilíngue.
- [x] TASK-014 — Executar regressão dos contratos preservados.
- [x] TASK-015 — Executar `pnpm check` e corrigir regressões da feature.
- [x] TASK-016 — Registrar matriz visual em simulador/dispositivo.

## Riscos e bloqueios

- A matriz física foi executada no iPhone Simulator; estados dependentes de uma
  sessão/API indisponível permanecem cobertos por testes sem fabricar sessão.
- APIs compartilhadas permanecem compatíveis até a migração de todos os consumidores.
- O diretório `design/` pertence ao usuário e não será alterado.
