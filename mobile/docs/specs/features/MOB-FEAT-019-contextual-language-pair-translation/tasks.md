# Tasks — MOB-FEAT-019

- Spec: [spec.md](spec.md)
- Status da spec no planejamento: `approved`
- Gate no planejamento: `open` (2026-09-27, autorização de Ruan para transição documental)
- Dependência executada: `MOB-FEAT-018`, em `verification-pending`, com revisão linguística e operacional abertas.
- Método: `sdd-task-planner`; os guardrails atuais admitem dependências em verificação, prevalecendo sobre o trecho antigo da skill que só cita `implemented`.

Estado corrente: `verification-pending/open`. A auditoria de 2026-10-03 fechou
as parcelas técnicas das TASK-002..005 e TASK-007. TASK-006 permanece aberta
para provider/qualidade reais, revisão linguística, medição física e operação.
Contratos e escrita local não equivalem ao fluxo de aquisição da 021. Ver
[consolidação e fronteiras](evidence/translation-consolidation-2026-10-03.md).

## Histórico incremental preservado

Após a TASK-001, Ruan autorizou prosseguir com
o plano em quatro etapas. Adapter global, orquestração e V4 foram codificados
offline; a [evidência parcial](evidence/translation-worker-offline-2026-10-02.md)
registra testes leves e lacunas. Os gates PostgreSQL/Flyway V1–V4 e Maven global
passaram com Docker em 2026-10-02; o bloqueio inicial foi resolvido. A parcela
local de 2026-10-03 acrescenta SQLite v9 e leitura dos metadados da tradução,
conforme [evidência local](evidence/translation-local-metadata-2026-10-03.md).
Em seguida, foram entregues a publicação/rejeição de pares operacionais e o
parser local estrito do manifesto traduzido, conforme
[evidência dos contratos locais](evidence/translation-capabilities-contracts-2026-10-03.md).
Na continuação, falhas pré-reserva foram isoladas da execução ativa e a
confirmação perdida passou a usar o vínculo persistido de chave/hash,
conforme [evidência de reentrega](evidence/translation-delivery-safety-2026-10-03.md).
Agora a fronteira de bytes confere SHA-256 e UTF-8 estrito antes do parser,
conforme [evidência de integridade](evidence/translation-manifest-byte-integrity-2026-10-03.md).
TASK-002..007 continuam abertas para as integrações e review correspondentes. Sem tradução real,
credenciais ou deploy nesta parcela.

## Rastreabilidade

| Critério | Tasks                                            | Evidência planejada                                                                          |
| -------- | ------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| AC-001   | TASK-001, TASK-002, TASK-007                     | parametrização dos 42 pares, capabilities parciais e par removido sem troca silenciosa       |
| AC-002   | TASK-001, TASK-002, TASK-003, TASK-006, TASK-007 | contrato com todas as regiões ordenadas, IDs preservados e revisão de contexto da página     |
| AC-003   | TASK-001, TASK-002, TASK-005, TASK-006, TASK-007 | fixtures das duas variantes chinesas em request, resultado e contratos locais/UI             |
| AC-004   | TASK-001, TASK-002, TASK-003, TASK-007           | respostas ausentes, extras, duplicadas, excedentes ou incompatíveis falham antes do renderer |
| AC-005   | TASK-003, TASK-007                               | lista vazia sem provider, timeout, indisponibilidade e cancelamento entre etapas             |
| AC-006   | TASK-002, TASK-003, TASK-004, TASK-006, TASK-007 | contagem de chamadas, primeira página, inspeção de banco/logs, ACK e retenção                |

## Checklist

- [x] TASK-001 — Preparar contratos e validadores de tradução contextual para pares habilitados, IDs, ordem, limites e variantes chinesas.
- [x] TASK-002 — Implementar o adapter Cloud Translation Advanced `general/translation-llm` com endpoint/parent/modelo `global` explícitos, preflight de 30.000 pontos de código Unicode da requisição completa, testes determinísticos de contexto/associação e ausência de retry cobrado; sem fallback regional, NMT implícito ou fragmentação silenciosa.
- [x] TASK-003 — Orquestrar a etapa: vazio sem provider, falhas/cancelamento e avanço para `RENDERING` somente após resultado íntegro persistido.
- [x] TASK-004 — Implementar manifesto efêmero, metadados, integridade transacional, retenção e observabilidade sem texto remoto em banco/logs.
- [x] TASK-005 — Implementar persistência e contratos locais previstos na spec, preservando variantes chinesas e FSD, sem renderer.
- [ ] TASK-006 — Avaliar qualidade real e operação com referências humanas e autorização específica de processamento/custo.
- [x] TASK-007 — Executar gates automatizados, classificar evidências, revisar os seis critérios e persistir auditoria de drift da implementação.

## Responsabilidades, sequência e conclusão

Fechamento técnico de 2026-10-03: TASK-002/003 verificadas no client oficial com
gRPC local e no PostgreSQL; TASK-004 inclui a correção ACK/V5 e cleanup durável;
TASK-005 inclui a escrita transacional local, sem aquisição/parent/READY/ACK do
aplicativo, responsabilidades da 021. TASK-007 fecha a auditoria e os gates
automatizados, não a avaliação real da TASK-006. Os parágrafos incrementais
seguintes preservam fotografias anteriores e suas pendências na data da parcela.

Parcela entregue: [evidência dos contratos](evidence/translation-contracts.md).
O catálogo dos sete idiomas continua compatível. O subconjunto operacional já
foi ligado à publicação e ao ETag canônico; submissão e worker usam a mesma
validação. A etapa
posterior acrescentou adapter de produção desabilitado por default, teste fake,
reserva no worker, storage e cleanup. A V4 e os cenários de concorrência e
cancelamento foram executados com Docker. ACK final,
integração/gravação remota mobile e validação operacional ainda não
foram concluídos; os testes aprovados não encerram essas tasks integralmente.
SQLite v9 preserva dados demonstrativos e prepara versão/modelo/timestamp local,
sem gravação remota ou integração com renderer. Os limites de saída 2× permanecem.
O parser local valida job/hash/idiomas/modelo/IDs e ordem contra a referência
OCR fornecida, preserva texto e rejeita excessos integralmente. Não faz hashing
durante download nem grava resultado remoto; a nova entrada de bytes já
adquiridos confere o hash esperado, copia bytes/referência antes da operação
assíncrona e rejeita UTF-8 inválido. TASK-005 permanece parcial e aberta.
TASK-003/004/007 recebem regressões de reentrega, cancelamento seguro, disputa
de reserva, rollback e confirmação perdida. Não são aprovação de qualidade ou
operação; nenhum checkbox adicional é concluído nesta parcela.

Parcela seguinte da TASK-005/007: o envelope mobile aceita os seis erros de
OCR/tradução já publicados e consulta/cancelamento vinculam o receipt ao job
conhecido e à versão persistida antes de mutação. Regressões preservam recovery
por idempotência, coalescing e cancelamento ambíguo. Não grava erro do provider,
resultado remoto ou ACK; o schema local permanece inalterado. Ver
[evidência dos receipts](evidence/translation-job-receipts-2026-10-03.md).
Uma tentativa incompatível com a versão das capabilities não é consultada ou
reenviada, inclusive no caminho de recuperação por `404` confirmado.

Parcela seguinte da TASK-005/007: mapper puro associa o manifesto traduzido
à referência OCR, preservando texto, ordem e geometria em snapshots imutáveis
com versão/modelo/timestamp local. Valida fonte/saída integralmente antes de
produzir regiões. Não escreve dados, decide overflow, promove `READY`, baixa
arquivos ou envia ACK. A persistência final dependente de renderer/021 continua
aberta; nenhuma task adicional foi encerrada. Ver
[evidência da associação](evidence/translation-region-association-2026-10-03.md).

Parcela seguinte da TASK-005/007: adapter de escrita de regiões remotas dentro
da transação exclusiva do chamador, com associação ao pai/attempt/job/par,
flags de overflow explícitas, inserts em lotes e rollback. Não cria resultado,
não muda estado, não baixa arquivos nem executa ACK; não há chamador de produção
até a aquisição da 021. Ver
[evidência de escrita](evidence/translation-region-storage-2026-10-03.md).
TASK-005 continua aberta para o fechamento da integração prevista, sem encerrar
automaticamente a 019 ou abrir 020/021.

Parcela seguinte da TASK-004/007: leitura estrita do manifesto traduzido no
gateway, vinculada ao SHA-256, job, par, hash OCR e IDs/ordem da requisição.
Rejeita JSON ambíguo, coerções e UTF-8 inválido sem alterar o mapper compartilhado.
O futuro renderer poderá consumir o resultado validado; nenhum renderer ou
novo chamador foi criado. Ver
[evidência da leitura](evidence/translation-manifest-reader-2026-10-03.md).

Parcela seguinte da TASK-002/003/007: client oficial com servidor gRPC local
comprova tentativa única, timeout, limites e rejeição de fallback. Integração
com PostgreSQL e leitura do artefato cobre oito cenários de conclusão/falha,
incluindo rollback, confirmação perdida e reentrega. O fake ecoa texto fonte,
sem evidência de tradução real. Ver
[evidência do transporte](evidence/translation-grpc-integration-2026-10-03.md).

Parcela seguinte da TASK-004/007: ACK server-side idempotente, V5 com pedido
durável, lock por proprietário e limpeza de artefatos com lease. PostgreSQL
cobre concorrência, rollback, isolamento, falha parcial e confirmação perdida;
filtros HTTP permanecem ativos. Nenhum resultado `READY` real foi criado.
Download, commit integral e envio/recovery do ACK pelo aplicativo continuam na 021. Ver [evidência da retenção](evidence/translation-result-ack-2026-10-03.md).
Checkboxes e status permanecem até a revisão integral da 019.

Responsável técnico: executor designado no futuro marco de implementação.
Ruan decide autorizações operacionais e de custo; anotadores/revisores por idioma
ainda precisam ser designados, sem presumir competência ou aprovação humana.

| Task     | Dependências e área provável                                     | Critério de conclusão                                                                                                                                    |
| -------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TASK-001 | 018 executada; domínio/aplicação e testes do gateway             | contratos derivados da spec e testes de pares, IDs, limites e variantes; nenhuma decisão ausente inventada                                               |
| TASK-002 | TASK-001; adapter e configuração do gateway                      | transporte falso comprova envio contextual e associação integral, erros/timeout sem segunda chamada; sem fallback de modelo                              |
| TASK-003 | TASK-001/002/004; casos de uso e testes de integração do worker  | reserva e persistência consistentes, vazio sem cobrança, cancelamento honesto e nenhuma renderização de resultado inválido                               |
| TASK-004 | TASK-001; storage/persistência/cleanup do gateway                | integridade e falhas de commit/upload cobertas, artefato privado efêmero e remoção por ACK ou limite de uma hora; texto fora de banco/logs               |
| TASK-005 | TASK-001/004; contratos e persistência locais existentes         | vínculo e metadados definidos na spec preservados, variantes distintas, leitura local/fallback testados; não duplicar estrutura já existente             |
| TASK-006 | TASK-002/003/004/005; avaliação e operação autorizadas           | resultados reais rastreáveis e revisão competente; limitações explicitadas, sem transformar fixtures em evidência de qualidade                           |
| TASK-007 | incremental sobre TASK-001..006; testes, coverage e documentação | gates aprovados, uma linha por AC na review, evidências classificadas e drift/checksum; pendências externas mantêm tasks abertas e impedem `implemented` |

Ordem técnica prevista: TASK-001 → TASK-002/004 → TASK-003/005 → TASK-006;
TASK-007 acompanha cada parcela. Planejar concretamente cada incremento antes de
executá-lo, sem tratar esta lista como autorização de implementação ou chamadas.

## Riscos e bloqueios remanescentes

- Validar a compatibilidade do provider escolhido com o contexto de página e a
  preservação de IDs antes do adapter. Se divergir da spec, voltar à revisão e
  aprovação humana; não trocar provider, fragmentar silenciosamente ou alterar
  requisitos nas tasks.
- A decisão de endpoint global retira a promessa de residência da tradução
  nos EUA, não a obrigação de informar isso antes do upload. A TASK-002 não
  autoriza chamadas pagas; a TASK-001 da 017 e os contratos de capabilities e
  consentimento ainda precisam ser reconciliados.
- Não definir aqui payloads, códigos de erro, limites numéricos adicionais,
  migrations ou nomes de slices ausentes do contrato. Decisões necessárias ao
  código serão registradas no planejamento do incremento correspondente.
- Antes de entidade/migration/repository, aplicar `database-design` e os guias
  de modelagem/ORM. Antes da parcela frontend, aplicar `fsd-architecture` e
  consultar o schema local atual; nenhuma estrutura paralela será presumida.
- Qualidade do OCR de entrada, sobretudo vertical/japonês histórico, ainda está
  em verificação. Layout experimental não substitui a ordem normativa do OCR.
- A persistência final local precisa respeitar os contratos relacionados da
  021, sem abrir seu gate ou implementar reader/renderização por antecipação.
- Texto vazio para região não vazia é inválido salvo exceção expressa no
  contrato aprovado; não inventar código de conteúdo intraduzível.
- APIs, permissões, políticas, credenciais e custo cloud exigem validação e
  autorização separadas. Este planejamento não habilita uploads ou processamento.

## Gates da implementação futura

Testes focados de domínio, adapter e integração com PostgreSQL; Node quando
tooling for alterado; Maven global com Docker; type-check web; `pnpm check`
mobile completo; SDD, links, formatação direcionada e `git diff --check`.
Testes comuns devem usar doubles, sem provider pago ou aquisição automática.
Review de implementação só existirá após trabalho executado; este documento é
governança, não evidência de tradução funcional.
