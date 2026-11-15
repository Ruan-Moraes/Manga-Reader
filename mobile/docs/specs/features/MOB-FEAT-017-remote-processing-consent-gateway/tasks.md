# Tasks — MOB-FEAT-017

- Spec: `spec.md`, revisão humana de 2026-11-01.
- Status: `verification-pending`; gate no planejamento: `open`.
- Dependência: `MOB-FEAT-016` executada/em verificação.
- Plano anterior preservado em [histórico](evidence/pre-volatile-tasks-2026-11-01.md).
- Nenhuma task anterior de objetos/URLs/fila/remoção comprova o fluxo volátil.

## Rastreabilidade

| Critério | Tasks                  | Evidência planejada                                                      |
| -------- | ---------------------- | ------------------------------------------------------------------------ |
| AC-001   | TASK-001, TASK-016     | comparação disclosure/capabilities/políticas e contrato volátil          |
| AC-002   | TASK-002, TASK-014/015 | RNTL aceitar/recusar/reconsentir e round-trip SQLite                     |
| AC-003   | TASK-003, TASK-014     | spy de zero bytes por pré-condição inválida                              |
| AC-004   | TASK-004, TASK-014     | contract tests de versão, autenticação, limites, redirects e truncamento |
| AC-005   | TASK-005, TASK-017     | secret scan, autorização revogável e isolamento owner-scoped             |
| AC-006   | TASK-006, TASK-017     | concorrência, replay e falhas de confirmação sem segundo provider        |
| AC-007   | TASK-007, TASK-014     | fault injection receipt/commit e ausência de READY prematuro             |
| AC-008   | TASK-008, TASK-014     | restart/UNKNOWN consultam metadados sem recuperar conteúdo               |
| AC-009   | TASK-009, TASK-014     | abort/retorno tardio sem falso cancelamento ou sucesso                   |
| AC-010   | TASK-010, TASK-017     | inspeção de I/O/logs e ausência de conteúdo persistido                   |
| AC-011   | TASK-011, TASK-015     | RNTL nos três locales e matriz de acessibilidade                         |
| AC-012   | TASK-012               | teste arquitetural de primeira página e ausência de provider no cliente  |

## Checklist

- [x] TASK-001 — Reconciliar disclosure, capabilities e políticas com o contrato volátil e nova versão.
- [x] TASK-002 — Manter aceite afirmativo escopado/versionado e exigir novo consentimento.
- [x] TASK-003 — Revalidar todas as pré-condições antes de enviar a primeira página.
- [x] TASK-004 — Implementar contrato autenticado limitado de execução binária e consulta de recibos.
- [x] TASK-005 — Preservar autorização anônima revogável, SecureStore e isolamento proprietário.
- [x] TASK-006 — Efetivar reserva durável e replay sem nova chamada paga, com testes concorrentes.
- [x] TASK-007 — Mapear recibos e entrega para estados locais coerentes sem READY prematuro.
- [x] TASK-008 — Reconciliar ambiguidade e restart por metadados sem reenvio/processamento oculto.
- [x] TASK-009 — Implementar interrupção e descarte tardio com mensagens honestas sobre cancelamento.
- [x] TASK-010 — Comprovar ausência de persistência de conteúdo e logs sanitizados.
- [x] TASK-011 — Reconciliar cópia, acessibilidade e erros nos três idiomas.
- [x] TASK-012 — Preservar limite da primeira página e fronteiras das etapas 018–021.
- [x] TASK-013 — Executar testes focados, pnpm check, revisão e auditoria desta revisão.

## Riscos e critérios de conclusão

- Contratos/estados SQLite antigos podem exigir migration; produzir plano antes
  de alterar schema, sem apagar originais, consentimentos ou histórico.
- Dados de produção/recursos antigos exigem encerramento operacional próprio;
  modificar código não comprova remoção de objetos anteriores.
- Não ativar o fluxo enquanto transporte/contrato, disclosure e provider
  estiverem incompatíveis. Não usar simulação como evidência real.
- `verification-pending` só após código/testes técnicos desta revisão concluídos,
  com task específica para cada verificação real restante. Review independente
  e checksum atual são obrigatórios; nenhuma conclusão é inferida deste plano.

## Verificação real ainda aberta

A revisão independente de 2026-11-02 confirmou código técnico pronto para a
ponte 017; a aquisição 021 continua fora desta execução. Os checkboxes técnicos
acima não declaram validação física, publicação ou admissão operacional.

- [ ] TASK-014 — Verificar o transporte Expo real e lifecycle em aparelho: preflight, SQLite, perda de rede, restart/background/unmount, recibos sem replay e ausência de READY prematuro, com servidor privado e fixture autorizada.
- [ ] TASK-015 — Verificar foco, leitor de tela, layout e disclosure/estados nos três locales em aparelho.
- [ ] TASK-016 — Conferir as políticas efetivamente publicadas, operador/contato e práticas atuais dos subprocessadores antes da ativação pública; textos-fonte novos não comprovam publicação.
- [ ] TASK-017 — Admitir configuração efetiva do serviço alvo: autorização/revogação, reservas/quotas, proxies/APM sem corpos, logs sanitizados, swap/dumps, limites e ausência de gravação de conteúdo; provas Docker locais não aprovam implantação pública.

## Evidências executadas

- [Correções e validação local](evidence/volatile-fixes-and-local-validation-2026-11-02.md).
- Revisão independente: 8 suites/80 testes, sem blocker técnico remanescente;
  verificação geral: `pnpm check`, 126 suites/987 testes, exit 0.
- Backend: 2839 testes, zero falhas/erros, 114 skips; duas provas HTTP privadas
  e 8 cenários/22 renders nativos executados sem skip, conforme documento vinculado.
- A auditoria/checksum corrente fica no review e drift-audit. Nenhuma etapa
  seguinte pode tratar conteúdo perdido como recuperável ou prometer 021 pronta.
