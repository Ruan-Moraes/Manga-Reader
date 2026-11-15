# Tasks — MOB-FEAT-018, revisão volátil

- Spec: `spec.md`, intenção aprovada por Ruan em 2026-11-01.
- Status atual: `verification-pending`; gate `open` em 2026-11-02.
- Dependência 017: `verification-pending`, após revisão independente e gates.
- A autorização sequencial consta de DEC-008. Backend está fora do workflow
  mobile; integração/contratos e provas desta feature seguem sua intenção atual.

## Rastreabilidade

| Critério | Tasks                                  | Evidência planejada                                                                        |
| -------- | -------------------------------------- | ------------------------------------------------------------------------------------------ |
| AC-001   | TASK-001, TASK-004                     | Sete hints e Vision online regional com bytes; nenhuma entrada URI de conteúdo na produção |
| AC-002   | TASK-002, TASK-004                     | ID/ordem/geometria limitados e estáveis por operação, associação em memória                |
| AC-003   | TASK-002, TASK-005                     | Fixtures horizontal/vertical/sete códigos; referências e revisão humana de qualidade real  |
| AC-004   | TASK-003, TASK-004                     | Sem texto como vazio válido, sem tradução paga desnecessária                               |
| AC-005   | TASK-003, TASK-004                     | Erros hostis/timeouts/cancelamento sanitizados e nenhuma etapa seguinte inválida           |
| AC-006   | TASK-001, TASK-003, TASK-004, TASK-006 | Ausência de gravação/log de conteúdo, replay/restart sem OCR novo e configuração alvo      |

## Checklist

- [x] TASK-001 — Isolar adapter inline produtivo e retirar construção antiga de requests GCS/URI e wiring worker legado do artefato de produção, preservando fixtures/histórico em suporte de teste.
- [x] TASK-002 — Conferir mapper reutilizado sem alterar algoritmo/ordem, hints, normalização e limites; vincular testes ao código produtivo vigente.
- [x] TASK-003 — Conferir contrato de sessão, vazio, validação integral, falhas/cancelamento/retorno tardio e observabilidade sem conteúdo.
- [x] TASK-004 — Executar testes focados e gate backend; revalidar artefato com HTTP privado + gRPC sintético e manter evidências Linux vinculadas à candidata atual; revisar por AC, coverage e drift/checksum.
- [ ] TASK-005 — Concluir benchmark com referências/revisão humana independente, incluindo japonês vertical, imagem real sem texto e sete códigos; avaliar provas históricas sem herdar aceites do transporte antigo.
- [ ] TASK-006 — Conferir provider/configuração efetiva, políticas publicadas e admissão operacional no ambiente alvo antes da ativação pública.

## Arquivos prováveis e limites

- Backend: adapter/factory/configuração Vision, mapper e testes; portas em memória
  e orquestração já exercitadas na 017 serão auditadas, sem redesenhar algoritmo.
- Mobile: contratos de conteúdo/regiões existentes só serão alterados se houver
  lacuna técnica comprovada nesta fronteira. Não iniciar aquisição 021 ou simular
  resultado pronto para satisfazer a 018.
- Nenhuma migration nova prevista nesta etapa: servidor usa buffers; recibos de
  metadados pertencem à 017. Mudança real de dados exige plano próprio prévio.
- Nenhuma chamada paga, mídia de usuário, deploy público ou nova infraestrutura
  é autorizada por este plano. Usar fixtures sintéticos locais na verificação.
- TASK-005/006 são verificações reais abertas; não podem esconder código ausente.
  `verification-pending` exige código/testes concluídos e revisão independente.

## Gates

Na raiz `api/`, testes focados via reactor e `./mvnw test`. No mobile,
`pnpm specs:check` após planejamento e `pnpm check` após qualquer mudança runtime;
provas locais não substituem benchmark/aparelho/políticas/produção.

## Resultado técnico e verificações abertas

Revisão independente dos seis ACs confirmou runtime pronto após migrar os testes
de falha à entrada inline. [Evidência atual](evidence/volatile-inline-verification-2026-11-02.md).
Raiz backend: 2848 testes, zero falhas/erros, 115 skips; provas privadas opt-in
atuais sem skips. TASK-005/006 permanecem abertas e não são substituídas por
fixtures sintéticos. A 021 continua fora deste fechamento técnico.
