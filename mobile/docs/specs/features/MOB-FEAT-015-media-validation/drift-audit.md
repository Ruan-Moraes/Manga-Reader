# Drift audit — MOB-FEAT-015

Data: 2026-08-15

- Implementação auditada: working-tree sha256:9df90bc58827359dd921a48f537f3c111a755991b5615f70601e493896b0f41e
- Status da feature: `verification-pending`

## Divergências

Nenhuma. A verificação física de TASK-008 foi concluída após a correção dos
falsos `CORRUPTED` observados na primeira execução.

## Contadores

- `mismatch`: 0
- `undocumented`: 0
- arquivos runtime descobertos: 0
- caminhos obsoletos: 0
- violações de gate: 0
- verificações abertas: 1

## Escopo auditado

Spec, tasks, registry, coverage e dependências; inspeção binária; modelo e
repository SQLite v4; controller/hook/UI; composição na lista virtualizada;
i18n, testes e boundaries FSD.

Não houve ampliação para OCR, rede, provider, tradução, upload ou Core. Não há
trabalho ou verificação aberta nesta feature.

Revalidação global de 2026-08-30: checksum da working tree atualizado após a
manutenção dos TODOs de auth/review local. A referência é global por definição
do validador; não representa nova inspeção nativa desta feature.

Rebase documental de performance (2026-09-05): checksum global atualizado pela inclusão da auditoria e da MOB-DEC-007; runtime preservado por comparação SHA-256. Não representa nova verificação física nem alteração de verdict.

## Atualização C03 — 2026-09-06

A seção histórica acima descreve a execução anterior. Agora há uma verificação
aberta: TASK-014 para AC-008. Requisitos e schema preservados; apenas
projeções de leitura, retorno interno do comando e snapshot do controller mudaram.
Sem novos arquivos runtime ou critérios. Verificação física ainda não repetida.

Rebase C01/C03/C04 (2026-09-06): checksum global atualizado após correções de numeração do leitor, persistência da validação e limite de resposta. Escopo e validações em [review de performance](../../../active/performance-evidence/corrections-2026-09-06/review.md). Não representa nova verificação física das demais features.

Rebase C02/C05 (2026-09-06): checksum global atualizado após virtualização do leitor e download de exportação para arquivo. [Escopo e validação](../../../active/performance-evidence/corrections-c02-c05-2026-09-06/review.md). Não representa nova verificação física das demais features.

Consolidação documental (2026-09-06): checksum global atualizado após reconciliar o estado de performance; runtime e verdict preservados. [Registro](../../../active/performance-evidence/consolidation-2026-09-06/review.md). Sem nova validação física.

Preparação de commit (2026-09-06): rebase global após excluir scripts avulsos de ensaio, listagens Git e metadados do sistema dos arquivos versionados, conforme solicitação humana. Resultados históricos preservados; runtime e verdict inalterados.
