# Drift audit — MOB-FEAT-012

Data: 2026-08-12

- Implementação auditada: working-tree sha256:165b3899fb4db6adc0ea16e02d8cd3d1aeb9e3c8465375590d9d5096cdfae49b
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
