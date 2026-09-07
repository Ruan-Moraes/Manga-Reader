# Drift audit — MOB-FEAT-017

Data: 2026-09-06

- Implementação auditada: working-tree sha256:cb2e5226cae5289175f02ef3243e0e048890a91e89ff1da21764db1ee89ab84e
- Status da feature: `verification-pending`

## Divergências

Nenhuma divergência normativa de código foi encontrada. As tasks abertas não
são implementação omitida: representam publicação legal/configuração cloud,
scan do AAB e auditoria Android física, que não podem ser substituídos por
fixtures ou testes unitários.

## Contadores

- `mismatch`: 0
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

Rodada de performance 2026-09-06: C04 / MOB-PERF-004 corrigido dentro do contrato existente, com testes de regressão. [Evidência](../../../active/performance-evidence/corrections-2026-09-06/review.md). Verificação nativa permanece aberta; nenhuma nova evidência física é atribuída a esta alteração.

Rebase C01/C03/C04 (2026-09-06): checksum global atualizado após correções de numeração do leitor, persistência da validação e limite de resposta. Escopo e validações em [review de performance](../../../active/performance-evidence/corrections-2026-09-06/review.md). Não representa nova verificação física das demais features.

Rebase C02/C05 (2026-09-06): checksum global atualizado após virtualização do leitor e download de exportação para arquivo. [Escopo e validação](../../../active/performance-evidence/corrections-c02-c05-2026-09-06/review.md). Não representa nova verificação física das demais features.

Consolidação documental (2026-09-06): checksum global atualizado após reconciliar o estado de performance; runtime e verdict preservados. [Registro](../../../active/performance-evidence/consolidation-2026-09-06/review.md). Sem nova validação física.

Preparação de commit (2026-09-06): rebase global após excluir scripts avulsos de ensaio, listagens Git e metadados do sistema dos arquivos versionados, conforme solicitação humana. Resultados históricos preservados; runtime e verdict inalterados.

Continuação (2026-09-06): `MOB-FEAT-016` está implementada e não bloqueia mais
esta feature. A auditoria FSD não encontrou deep import ou inversão entre os
slices do processamento remoto. A publicação legal continua indisponível por
HTTPS válido; os quatro gates externos/nativos permanecem abertos.
