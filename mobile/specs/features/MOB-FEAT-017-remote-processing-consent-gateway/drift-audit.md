# Drift audit — MOB-FEAT-017

Data: 2026-09-03

- Implementação auditada: working-tree sha256:38172ac139f24be05ddf591a77830ea02b9586b8729bba5be6c131da60bffe58
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
