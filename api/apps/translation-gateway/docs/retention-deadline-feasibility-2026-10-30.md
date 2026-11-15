# Garantia de retenção: bloqueio mantido — 2026-10-30

Decisão humana de Ruan em 2026-10-30: **«Manter requisito atual e bloqueio no GCS»**.
Estado: **nenhuma mudança de requisito aprovada ou aplicada**. A 020 continua
`in-progress/open`, 7/8 tasks. TASK-008 foi encerrada após as provas e o aceite
humano do orçamento no Compute privado. Este documento delimita o bloqueio da
TASK-006; não autoriza publicação ou habilitação de uploads.

## Contrato que continua valendo

A [020](../../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/spec.md)
exige limite absoluto de uma hora e remoção de saída/manifesto por ACK ou TTL.
A [017](../../../../mobile/docs/specs/features/MOB-FEAT-017-remote-processing-consent-gateway/spec.md)
é ainda explícita: original removido após no máximo uma hora, inclusive em
falha, com retenção real correspondente ao disclosure. A
[018](../../../../mobile/docs/specs/features/MOB-FEAT-018-multilingual-ocr-regions/spec.md)
e a [019](../../../../mobile/docs/specs/features/MOB-FEAT-019-contextual-language-pair-translation/spec.md)
também conservam esse failsafe/remoção. A interpretação usada nesta validação
é ausência confirmada de todas as gerações via API, não apenas URL expirada.

## Evidência que impede o aceite atual

- A observação real de 3.600 s confirmou seis gerações removidas 966 ms depois
  do deadline. O teste executou o adapter diretamente, sem provar o scheduler.
- A manutenção declarada roda a cada cinco minutos. Enumerar e excluir objetos
  vencidos depois do deadline não constitui remoção anterior ou simultânea.
- GCS confirma ausência depois de um delete bem-sucedido, mas admite erros
  transitórios e retries. Uma recusa que persista através do deadline deixa as
  gerações presentes; nenhuma mudança no timer do cliente torna esse delete
  confirmado. O lifecycle também é assíncrono.
- As correções já executadas fecham streams responsivos e mantêm posse até o
  término real. I/O arbitrário que ignore interrupção e fechamento continua
  retendo sua posse. Recuperação após reinício foi corrigida e testada; não foi
  chamada de interrupção pontual de uma leitura ainda ativa.

Fontes: [consistência GCS](https://docs.cloud.google.com/storage/docs/consistency),
[retries](https://docs.cloud.google.com/storage/docs/retry-strategy),
[lifecycle](https://docs.cloud.google.com/storage/docs/lifecycle) e
[evidência integral](../../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/deadline-restart-android-2026-10-30.md).

Antecipar timestamps, ignorar gerações, tomar expiração de URL como exclusão,
limitar o timeout do cliente ou remover o original antes do commit para obter
um teste verde não comprova o contrato. Isolar o leitor em processo pode
melhorar contenção local; não elimina objetos quando a API remota recusa delete.

## Alternativas apresentadas antes da decisão

**Manter o contrato atual.** Preserva a instrução vigente de não alterar
requisitos para acomodar limitações. TASK-006 e 020 permanecem abertas até uma
arquitetura/garantia externa verificável atender à remoção no prazo, inclusive
nas falhas exigidas. Não há estimativa honesta de conclusão com o GCS atual.
Uma nova observação de uma hora, sem mudança dessa garantia, não resolve o bloqueio.

**Aprovar expressamente a revisão abaixo.** Muda a intenção de retenção; exige
harmonizar 017/018/019/020, disclosure e evidências antes de concluir a feature.
O texto proposto para essa decisão é:

> A autorização para novas consultas, assinaturas e leitura do original ou
> resultado expira no deadline imutável de no máximo uma hora. Após commit,
> estado terminal, ACK ou TTL, os objetos entram em exclusão e recuperação
> durável até confirmação da ausência de todas as gerações. A confirmação pode
> ocorrer depois do deadline devido ao ciclo de manutenção, latência ou falha
> do storage; não se promete limite físico pontual de uma hora. ACK 202 continua
> exigindo exclusão confirmada antes da resposta. Retentativas não renovam a
> autorização nem autorizam nova chamada cobrada de provider.

Esse texto é uma proposta de mudança de contrato, não uma descrição de aceite
já concedido. Uma resposta humana deve escolher explicitamente essa intenção
antes de qualquer mudança normativa. Defaults, implantação desabilitada, teto
de custo, escopo privado e 021 implementada continuam preservados em ambos os
caminhos. A proposta não inclui um novo prazo máximo de exclusão física que o
backend não possa garantir.

## Resultado da decisão

Foi escolhida a manutenção do contrato original. A revisão proposta acima foi
recusada; seu texto é histórico e não deve ser aplicado como requisito.
017/018/019/020 e disclosure permanecem com a exigência aprovada. A TASK-008
foi concluída por seu aceite próprio de orçamento e evidências. TASK-006 segue
aberta, 020 `in-progress/open`, 7/8, review `changes-requested`, 021 `implemented`.

Não resta nova execução GCS justificada para repetir a mesma observação sem
alteração da garantia disponível. Uma arquitetura/garantia externa verificável
que satisfaça o contrato é condição para novo avanço nessa pendência. Nenhum
recurso cloud da validação permanece provisionado.
