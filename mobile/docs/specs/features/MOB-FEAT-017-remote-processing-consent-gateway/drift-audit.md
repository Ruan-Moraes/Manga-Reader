# Drift audit — MOB-FEAT-017

Data: 2026-09-06

- Implementação auditada: working-tree sha256:0197e775ac2875fd2619dc4a8a1a68162b97aa1591d460593588c2932c2d51b2
- Status da feature: `verification-pending`

## Divergências

Parcela posterior de [purge por objeto](../MOB-FEAT-020-visual-translation-rendering/evidence/cleanup-isolation-2026-10-09.md):
abort prematuro por erro individual reproduzido e tratado. Não presume sucesso
parcial ou inventário completo; namespace/bucket e fonte preservados. Nenhum
runtime mobile/schema/prazo/contrato foi alterado. TASK-017/gates/verdict mantidos.

Parcela posterior de [resultado com prazo imutável](../MOB-FEAT-020-visual-translation-rendering/evidence/result-retention-snapshot-2026-10-09.md):
ampliação por configuração reproduzida e corrigida na V9 e no limite aceito
por commit/consulta/purge. Sem novo contrato HTTP/task/manifesto ou runtime
mobile. Finding tratado, não promovido a ausência de benchmark; TASK-017 e
020/TASK-006/verdict/estado/gates permanecem conservados.

Parcela posterior de [snapshot de retenção original](../MOB-FEAT-020-visual-translation-rendering/evidence/original-retention-snapshot-2026-10-09.md):
prazo abreviado aplicado ao job/locator e às etapas, com guards sob lock e purge
independente do SQL. Foco 264/zero failures/errors/skips e 12 casos PostgreSQL.
Finding anterior tratado, não convertido em ausência de benchmark. TASK-017
e 020/TASK-006 continuam abertas para auditoria integral/operacional; status,
gates e conclusões históricas preservados. Nenhum runtime mobile foi alterado.

Parcela de 2026-10-09 UTC na 020:
[original da submissão](../MOB-FEAT-020-visual-translation-rendering/evidence/submission-original-ownership-2026-10-09.md).
Descarte de mídia com reserva confirmada/pendente reproduzido e corrigido;
foco 69 aprovado, sem novo contrato ou migração. Há ainda lacuna funcional
de prazo original abreviado publicado versus uma hora fixa no render/varredura,
que continua na integração/017-TASK-017 e 020-TASK-006. Não foi promovida a
verificação externa. Demais pendências/gates e conclusões históricas preservados.

Parcela incremental de 2026-10-03: a auditoria da fronteira com a 019
identificou allowlist incompleta para erros publicados do worker e ausência
de vínculo de receipt ao job/versão. Testes reproduziram os dois problemas;
correção mantém respostas incompatíveis sem mutação local. Ver
[evidência dos receipts](../MOB-FEAT-019-contextual-language-pair-translation/evidence/translation-job-receipts-2026-10-03.md).
Esse finding está corrigido, sem encerrar as pendências legais, de retenção
até renderer e de verificação física/operacional já documentadas.

Nenhuma divergência normativa de código foi encontrada. As tasks abertas não
são implementação omitida: representam publicação legal/configuração cloud,
scan do AAB e auditoria Android física, que não podem ser substituídos por
fixtures ou testes unitários.

Revisão de escopo de 2026-09-27: a afirmação acima é histórica. A nova decisão
de tradução pelo endpoint global introduz divergência normativa conhecida:
capabilities no gateway, enum OpenAPI/parser mobile, copy de consentimento e
textos legais publicados ainda pressupõem processamento da tradução nos EUA.
Corrigir e testar esses contratos, aprovar disclosure versionado e republicar
os textos aplicáveis antes de ativar uploads. Nenhum desses pontos foi marcado
como resolvido por esta alteração documental.

Auditoria incremental de 2026-10-02: contrato capabilities/OpenAPI/parser e
consentimento trilíngue foram reconciliados; o campo legado falha fechado e a
versão legal anterior não pode habilitar o gateway. Persistem divergências
conhecidas: a publicação legal ainda descreve a geografia anterior e o worker
OCR ainda apaga o original antes do renderer planejado. TASK-001 e TASK-017
registram o trabalho restante; não há alegação de integração completa.

## Contadores

- `mismatch`: 1
- `undocumented`: 0
- arquivos runtime descobertos: 0
- caminhos obsoletos: 0
- violações de boundary: 0
- verificações externas abertas: 4

## Escopo auditado

OpenAPI e serviço Spring Boot; Flyway/PostgreSQL, GCS, Cloud Tasks, cleanup e
Terraform; SQLite v7; entities de capability/attempt/identity; transporte HTTPS;
features de start/cancel; widget e composição na page/application; i18n,
coverage, testes e boundaries FSD.

O escopo não avançou para OCR, regiões, tradução, renderização, resultados,
scheduler multi-page, reader, Core ou provider no client.

Rebase documental de performance (2026-09-05): checksum global atualizado pela inclusão da auditoria e da MOB-DEC-007; runtime preservado por comparação SHA-256. Não representa nova verificação física nem alteração de verdict.

Rodada de performance 2026-09-06: C04 / MOB-PERF-004 corrigido dentro do contrato existente, com testes de regressão. Evidência (arquivo externo: `perfomance_app/mobile/docs/active/performance-evidence/corrections-2026-09-06/review.md`). Verificação nativa permanece aberta; nenhuma nova evidência física é atribuída a esta alteração.

Rebase C01/C03/C04 (2026-09-06): checksum global atualizado após correções de numeração do leitor, persistência da validação e limite de resposta. Escopo e validações em review de performance (arquivo externo: `perfomance_app/mobile/docs/active/performance-evidence/corrections-2026-09-06/review.md`). Não representa nova verificação física das demais features.

Rebase C02/C05 (2026-09-06): checksum global atualizado após virtualização do leitor e download de exportação para arquivo. Escopo e validação (arquivo externo: `perfomance_app/mobile/docs/active/performance-evidence/corrections-c02-c05-2026-09-06/review.md`). Não representa nova verificação física das demais features.

Consolidação documental (2026-09-06): checksum global atualizado após reconciliar o estado de performance; runtime e verdict preservados. Registro (arquivo externo: `perfomance_app/mobile/docs/active/performance-evidence/consolidation-2026-09-06/review.md`). Sem nova validação física.

Preparação de commit (2026-09-06): rebase global após excluir scripts avulsos de ensaio, listagens Git e metadados do sistema dos arquivos versionados, conforme solicitação humana. Resultados históricos preservados; runtime e verdict inalterados.

Continuação (2026-09-06): `MOB-FEAT-016` está implementada e não bloqueia mais
esta feature. A auditoria FSD não encontrou deep import ou inversão entre os
slices do processamento remoto. A publicação legal continua indisponível por
HTTPS válido; os quatro gates externos/nativos permanecem abertos.

C06 (2026-09-12): AC-003/006/008 preservados por testes de reconcile compartilhado, idempotência e cancelamento isolado. Evidências (arquivo externo: `perfomance_app/mobile/docs/active/performance-evidence/recovery-2026-09-12/review.md`). TASK-014 aberta; verdict e gates externos mantidos, sem nova validação nativa.

Rebase C06 (2026-09-12): referência global recalculada para a árvore local com recuperação compartilhada. Escopo (arquivo externo: `perfomance_app/mobile/docs/active/performance-evidence/recovery-2026-09-12/review.md`). Não altera verdict nem valida implementações locais de outras tarefas ou medições físicas.

## Posse/locks do dispatch — incremento de 2026-10-04

[Evidência da 020](../MOB-FEAT-020-visual-translation-rendering/evidence/dispatch-ownership-2026-10-04.md)
inspecionada no gate aberto: findings de código divergente reproduzidos antes
do fix (conclusão sem posse, inversão de locks e criação além do limite).
Porta/JDBC/dispatcher coordenados; CAS pela tentativa, ordem job → outbox e
nenhuma remoção em conclusão antiga conferidos. Nenhuma mudança de requisitos,
schema, contrato HTTP/task, defaults ou runtime mobile. Zero mismatch residual
nesse escopo corrigido, não zera achados históricos/legais ou certifica operação.
017 verification-pending/open e TASK-017 integral ainda aberta; 021 blocked.

## Multipart e recuperação controlada — 2026-09-13

TASK-015 corrige divergência do código ao contrato AC-004/006: expo/fetch 57
rejeitava o descritor uri antes do POST. Regressão compara multipart com conversor
real instalado. AC-003 continua exigindo consentimento; não houve mudança de
requisitos, identidade ou gates. Evidência e limites (arquivo externo: `perfomance_app/mobile/docs/active/performance-evidence/https-recovery-2026-09-13/review.md`).
TASK-014 e verdict verification-pending permanecem pelos cenários residuais.
