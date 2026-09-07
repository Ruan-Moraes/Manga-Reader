# Drift audit — MOB-FEAT-012

Data: 2026-08-12

- Implementação auditada: working-tree sha256:cb2e5226cae5289175f02ef3243e0e048890a91e89ff1da21764db1ee89ab84e
- Status da feature: `implemented`

| Severidade | Evidência                                                                                                    | Classificação    | Artefato      | Ação recomendada |
| ---------- | ------------------------------------------------------------------------------------------------------------ | ---------------- | ------------- | ---------------- |
| —          | `pnpm specs:check`, coverage e review AC-001–AC-010                                                          | sem divergência  | MOB-FEAT-012  | nenhuma          |
| —          | “Não manter atividades” ativo: lote de 100 substituído exatamente por 4 imagens, sem perda ou duplicação     | evidência física | AC-006        | nenhuma          |
| —          | 100 imagens variadas importadas em Android, sem lentidão; draft persistiu após fechar e remover dos recentes | evidência física | AC-005/AC-009 | nenhuma          |

## Contadores

- `mismatch`: 0
- `undocumented`: 0
- arquivos runtime descobertos: 0
- caminhos obsoletos: 0
- violações de gate: 0
- verificações físicas abertas: 0

## Escopo auditado

Spec, tasks, registry, coverage, dependência e gate; configuração Expo/Android;
adapter do picker; arquivos privados; schema e repositório SQLite; registro de
dados locais; controller/hook/UI; rota, launcher, i18n, testes e boundaries FSD.

Não houve ampliação para OCR, tradução, provider remoto, idioma, review/reorder,
biblioteca final, conta ou Core. A escolha futura de origem e destino continua
independente e pertence a `MOB-FEAT-014`.

Revalidação global de 2026-08-30: checksum da working tree atualizado após a
manutenção dos TODOs de auth/review local. A referência é global por definição
do validador; não representa nova inspeção nativa desta feature.

Rebase documental de performance (2026-09-05): checksum global atualizado pela inclusão da auditoria e da MOB-DEC-007; runtime preservado por comparação SHA-256. Não representa nova verificação física nem alteração de verdict.

Rebase C01/C03/C04 (2026-09-06): checksum global atualizado após correções de numeração do leitor, persistência da validação e limite de resposta. Escopo e validações em [review de performance](../../../active/performance-evidence/corrections-2026-09-06/review.md). Não representa nova verificação física das demais features.

Rebase C02/C05 (2026-09-06): checksum global atualizado após virtualização do leitor e download de exportação para arquivo. [Escopo e validação](../../../active/performance-evidence/corrections-c02-c05-2026-09-06/review.md). Não representa nova verificação física das demais features.

Consolidação documental (2026-09-06): checksum global atualizado após reconciliar o estado de performance; runtime e verdict preservados. [Registro](../../../active/performance-evidence/consolidation-2026-09-06/review.md). Sem nova validação física.

Preparação de commit (2026-09-06): rebase global após excluir scripts avulsos de ensaio, listagens Git e metadados do sistema dos arquivos versionados, conforme solicitação humana. Resultados históricos preservados; runtime e verdict inalterados.
