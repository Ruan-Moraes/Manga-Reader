# Auditoria de conclusão — MOB-FEAT-020 — 2026-11-01

**Resultado: conclusão contradita; feature aberta.** Esta auditoria não modifica
requisitos, não aprova operação e não equivale a `implemented`.
Estado: 020 `in-progress/open`, TASK-006/008 abertas, 6/8, review
`changes-requested`. A 021 permanece `implemented`.

## Base da revisão

Foram conferidos spec, tasks, registry, review, drift, cobertura, decisão humana
de retenção e os registros de 30/10 e 01/11. O gate estava aberto antes do código;
a 019 continua `verification-pending`, dependência admitida pelo workflow normativo
atual. Não foi aplicado o texto antigo das skills que exige exclusivamente
`implemented` contra o contrato atual de `mobile/AGENTS.md` e `docs/specs/README.md`.

Os 210 hashes main/POM conferem com o pacote da sessão; os ajustes recentes são
no harness e em governança. JAR: SHA-256
`44ed5c4ed44c8808cde61a6e1426685119961f056bdb319c795647303511fe3c`.
Foram lidos os relatórios existentes de pintura (13 e 21 testes), manifesto
(32), supervisor (12), protocolo (3), processo (2) e recuperação (3), todos sem
falhas/erros/skips. Esses números confirmam o escopo de cada relatório, não um
aceite integral por contagem. A execução global e os seis opt-ins atuais estão
na [evidência de recursos](session-resource-faults-2026-11-01.md).

## Matriz por critério

| Critério | Fonte e prova inspecionadas                                                                                            | Conclusão                                                                             |
| -------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| AC-001   | Pintura recortada, testes externos à união, fonte preservada; renderer sem mudança e fixtures históricas classificadas | Evidência reutilizável no escopo das fixtures; não amplia a aprovação a páginas reais |
| AC-002   | Noto versionada/licenciada, sete destinos e aprovação visual humana registrada                                         | Evidência mantida no corpus aprovado; sem nova aprovação inferida                     |
| AC-003   | Validação do manifesto, fallback completo e testes de overflow; consumo 021 preservado                                 | Evidência reutilizável; sem truncamento introduzido nesta parcela                     |
| AC-004   | Fixture sem regiões e terceiro READY da máxima na sessão; política lossless/exact preservada                           | Evidência local comprovada; operação permanece separada                               |
| AC-005   | Hash/bytes/MIME/dimensões, ACK/fila/gerações; observação remota anterior 966 ms após deadline e recusa de delete       | **Não atendido integralmente:** exclusão absoluta inclusive falha não demonstrada     |
| AC-006   | Sessão pequena, três máximas e falhas/recovery reais locais; orçamento e guards medidos                                | **Parcial:** não transfere admissão ao novo pipeline no Compute com GCS real          |

## Checklist integral do handoff

| Obrigação                                                                     | Evidência ou limitação atual                                                                                                           | Situação                                                                 |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Retenção original, saídas e manifestos dentro dos deadlines, inclusive falhas | Decisão humana mantém contrato; exclusão tardia e cenário de recusa contradizem aceite                                                 | Não cumprida                                                             |
| I/O não cooperativo, posse, término e recuperação                             | JVM possuída, deadline/cancelamento, locks, reinício e fault injection; kernel/SQL/FS sem término confirmado mantêm limites explícitos | Parcela local comprovada; sem promessa remota                            |
| ACK, gerações, integridade, owner e vizinho                                   | Provas anteriores e testes atuais preservados; não há alteração dos adapters/protocolos públicos                                       | Reutilizável nos ambientes registrados                                   |
| Hora real sem ACK e scheduler de produção                                     | Experimento anterior invocou adapter e confirmou ausência depois do prazo; cron não foi promovido a prova                              | Não cumprida                                                             |
| Pipeline novo no orçamento admitido                                           | Perfil local atualizado; admissão anterior limitada a outro pacote/ambiente                                                            | Pendente                                                                 |
| Gates, review e drift                                                         | Maven/web/Node/mobile e seis opt-ins passaram; revisão atual mantém findings                                                           | Gates locais aprovados; aceite recusado                                  |
| Evidências e 021                                                              | Classificação exata, headers derivados pelo workflow, runtime mobile preservado                                                        | Comprovada no escopo auditado                                            |
| Retirada e custo                                                              | Imagem própria e containers ausentes por nova consulta; cloud não provisionada nesta continuação                                       | Local cumprida; US$ 4,98 histórico, sem fatura ou inventário cloud atual |

## Finding bloqueante — retenção absoluta

A decisão humana de [manter o contrato](../../../../../../api/apps/translation-gateway/docs/retention-deadline-feasibility-2026-10-30.md)
continua vigente. O contraexemplo independe de ajustar timers:

1. Um upload termina com uma geração autorizada e deadline imutável D.
2. O storage recusa delete através de D, sem garantia de purge autônomo pontual.
3. No instante D não existe confirmação de ausência; a geração pode continuar
   presente. Leitura/listagem também indisponíveis não constituem confirmação.

A [consistência documentada](https://docs.cloud.google.com/storage/docs/consistency)
é condicional ao sucesso do delete. [Retries](https://docs.cloud.google.com/storage/docs/retry-strategy)
e [lifecycle assíncrono](https://docs.cloud.google.com/storage/docs/lifecycle)
não fornecem a garantia temporal faltante. A inferência é restrita ao GCS e ao
modelo de falhas aprovado: o worker não pode transformar a recusa em ausência
confirmada até D. Antecipar tentativas ou repetir uma rodada positiva não
elimina esse contraexemplo. Expiração de acesso ou chave não é o aceite aprovado.

Sem mecanismo novo com garantia verificável que cubra esse cenário, B2 não tem
desenho viável aprovado para implementar. Não há nova hipótese que justifique
repetir GCS, criar Compute ou gastar a reserva para a mesma garantia inexistente.
O pedido de concluir a feature não foi interpretado como revogação da decisão
humana nem autorização para afrouxar requisitos ou habilitar operação.

## Revisão e condição para avançar

- **P1 / TASK-006 / AC-005:** é necessária arquitetura/garantia externa verificável
  de exclusão confirmada no prazo sob o mesmo modelo de falhas. O contrato atual
  permanece; a proposta anterior recusada não foi reaplicada.
- **P2 / TASK-008 / AC-006:** após uma solução compatível e justificativa operacional,
  validar a matriz afetada com cliente GCS real e pipeline novo no Compute privado
  restrito. A admissão antiga não substitui essa prova. Nenhuma nova rodada cloud
  foi iniciada nesta auditoria.
- O caminho anterior permanece cooperativo; a contenção nova é opt-in e continua
  desabilitada por padrão. Código candidato local não é capacidade operacional
  admitida nem motivo para promover status.

A revisão documental/técnica desta fotografia está realizada, com verdict
`changes-requested`. Não resta aprovação local que possa substituir a garantia
externa faltante. Os trabalhos locais válidos e suas limitações estão preservados;
a feature e seu gate não são marcados como concluídos ou alterados para simular aceite.
