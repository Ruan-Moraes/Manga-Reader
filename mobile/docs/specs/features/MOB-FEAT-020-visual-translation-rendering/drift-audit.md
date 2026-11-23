# Drift audit — MOB-FEAT-020, candidata6

- Data: 2026-11-03.
- Implementação auditada: working-tree sha256:751f485409b07f18d689b9d6ab37b2b133be8503c09c2e2ca570a8c5ac7bf1d3
- Referência final consolidada; rebase restrito aos headers de checksum, preservando corpos e verdicts históricos.
- Status: in-progress; gate: open.
- Verdict: changes-requested.

| Item                                                             | Classificação                                          | Tratamento/próxima ação                                                                                                         |
| ---------------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| Retenção/URL/ACK antigos                                         | intenção substituída por direção humana                | Preservar história; usar DEC-008 e conteúdo somente em RAM.                                                                     |
| C5 HTTP11 sem resposta no SIGSTOP/deadline de 90s                | divergência técnica demonstrada                        | Contraevidência preservada; c6 reexecutou e passou o cenário real, sem aprovar retroativamente c5.                              |
| Pipe/supervisor c6                                               | correção e prova local atuais                          | ThreadFactory/worker plataforma, HTTP 12/11, restart, matriz 8/22 e visual 9 vinculados ao JAR atual; root7 passou.             |
| Audit anterior autorizava execução cloud pela condição histórica | orientação documental superada                         | Identificado como fotografia; corrente registra rejeição antes da execução, sem retry/criação e autorização vigente necessária. |
| AMD64/COS125                                                     | prova obrigatória ausente para a composição nova       | TASK-006 continua aberta; imagem pronta offline e ARM local não equivalem ao alvo admitido.                                     |
| Cliente021                                                       | código técnico revisado, prova de ciclo nativo ausente | TASK-005 aberta; enumeração do simulador/timeouts CUA não comprovam execução do app.                                            |
| Fechamento da árvore documental                                  | provas locais c6 e coverage consolidadas               | TASK-004 concluída; TASK-007 permanece aberta para conclusão da feature após suas provas pendentes.                             |

A inspeção corrente não encontrou nova contradição de intenção nem retorno de
persistência de conteúdo nas fronteiras examinadas. Isso não é varredura universal
ou prova de todo I/O/APM/infra. Não declarar mismatch=0 geral: há provas reais
obrigatórias de execução ainda abertas, embora o timeout c5 tenha
correção demonstrada localmente na c6.

O gate mobile de runtime permanece em 128 suites/1016 testes. A consolidação
documental passou specs:check11, com 991 arquivos classificados e links válidos.
Os novos documentos são classificados nesta rodada; gates e referência finais
são registrados na review. Não se repetem contadores de
paridade antigos como se fossem nova auditoria global.

[Aditamento c6](evidence/volatile-candidate-6-completion-audit-2026-11-03.md),
[timeout/autorização anterior](evidence/volatile-timeout-and-authorization-review-2026-11-02.md)
e [prova backend](../../../../../api/apps/translation-gateway/docs/volatile-runtime-candidate-6-verification-2026-11-03.md).

## Atualização posterior — 2026-11-03

A autorização humana nova e a execução c6 em AMD64/COS125 substituem a
fotografia de ausência de prova descrita acima. A [evidência atualizada](evidence/volatile-candidate-6-completion-audit-2026-11-03.md)
registra execução e cleanup. Permanece lacuna de cancelamento explícito no
alvo; TASK-006 continua aberta, assim como ciclo iOS/físico e auditoria final.

## Ensaio sintético no Android — 2026-11-04

Uma tradução sintética real foi recebida e reaberta offline no emulador após
reinício do app. A [evidência operacional](../../../../../api/apps/translation-gateway/docs/private-android-test-2026-11-04.md)
registra vestígios das letras originais no resultado. A prova não encerra a
análise de qualidade visual, cancelamento explícito ou matriz física; as tasks
e o status permanecem abertos.

## Integração da pilha do gateway — 2026-11-21

A pilha `feat/glossary-names-and-reader-fade` (commit `f0a6eb01`) registrou nestes arquivos a validação do renderer
no pipeline armazenado (v1): lotes pagos do corpus de 50 páginas, fontes Noto, WebP, manifesto com `quality`. Esse
registro continua no histórico do git (`git show f0a6eb01:mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/<arquivo>`).
Na integração com a branch do PR, o renderer passou a rodar na pipeline volátil (v2); ver
`api/apps/translation-gateway/docs/architecture/volatile-pipeline-port.md`.
