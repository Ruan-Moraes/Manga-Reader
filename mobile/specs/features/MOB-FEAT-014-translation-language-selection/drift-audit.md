# Drift audit — MOB-FEAT-014

Data: 2026-08-15

- Implementação auditada: working-tree sha256:165b3899fb4db6adc0ea16e02d8cd3d1aeb9e3c8465375590d9d5096cdfae49b
- Status da feature: `implemented`

## Divergências

Nenhuma divergência normativa. O runtime, schema v6, i18n, cobertura, tasks,
review e registry refletem os sete idiomas e 42 pares aprovados.

## Contadores

- `mismatch`: 0
- `undocumented`: 0
- arquivos runtime descobertos: 0
- caminhos obsoletos: 0
- violações de gate: 0
- verificações abertas: 0

## Escopo auditado

Spec, tasks, registry, coverage, dependência e gate; domínio e repositories de
draft/projeto; migration SQLite v6; controller/hook/UI; i18n pt-BR/en-US/es-ES;
testes de 42 pares, upgrade, FK e rollback; boundaries FSD.

Não houve ampliação para detecção automática, OCR, processamento remoto,
provider, tradução, renderização, biblioteca final, conta ou Core.

Revalidação global de 2026-08-30: checksum da working tree atualizado após a
manutenção dos TODOs de auth/review local. A referência é global por definição
do validador; não representa nova inspeção nativa desta feature.
