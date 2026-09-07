# Tasks — MOB-FEAT-012

- Spec: `spec.md`
- Status da spec no planejamento: `implemented`
- Gate no planejamento: `open`
- Dependências implementadas: `MOB-FEAT-010`

## Rastreabilidade

| Critério | Tasks    | Evidência planejada                                                    |
| -------- | -------- | ---------------------------------------------------------------------- |
| AC-001   | TASK-001 | RNTL guest-first e inspeção de requests                                |
| AC-002   | TASK-002 | Teste do adapter de picker/configuração Android                        |
| AC-003   | TASK-003 | Teste de cancelamento com estado e filesystem fakes                    |
| AC-004   | TASK-004 | Integração do repositório SQLite/filesystem com rollback               |
| AC-005   | TASK-005 | Teste de leitura após invalidar URI de origem                          |
| AC-006   | TASK-006 | Teste do pending result e execução Android com “Não manter atividades” |
| AC-007   | TASK-007 | RNTL de quantidade/substituição e ausência de controles futuros        |
| AC-008   | TASK-008 | Testes parametrizados de erro, preservação e sanitização               |
| AC-009   | TASK-009 | Teste de cópia sequencial/sem Base64 e profiling em aparelho modesto   |
| AC-010   | TASK-010 | RNTL trilíngue, tema, labels e área de toque                           |

## Checklist

- [x] TASK-001 — Substituir o shell por entrada guest-first real, sem HTTP.
- [x] TASK-002 — Criar adapter do picker do sistema para imagens e seleção múltipla com configuração de menor privilégio.
- [x] TASK-003 — Modelar cancelamento como resultado neutro que preserva o draft ativo.
- [x] TASK-004 — Implementar schema/repositório SQLite e cópia atômica para diretório privado com staging.
- [x] TASK-005 — Ler e medir o draft somente por referências privadas controladas pelo app.
- [x] TASK-006 — Recuperar resultado pendente no Android uma vez, automatizar o contrato e executar a verificação real.
- [x] TASK-007 — Exibir quantidade e substituição sem antecipar review, idiomas ou processamento.
- [x] TASK-008 — Implementar erros localizados, retry, rollback e sanitização de dados privados.
- [x] TASK-009 — Garantir cópia sequencial sem Base64 e executar validação física com lote grande em Android.
- [x] TASK-010 — Adicionar i18n trilíngue, tokens e semântica acessível.
- [x] TASK-011 — Atualizar `coverage.json`, documentação técnica e executar `pnpm check`.

## Ordem de execução

1. Configuração/dependências e adapters `shared`.
2. Persistência e modelo em `entities/local-media-import`.
3. Orquestração em `features/import-local-media`.
4. Composição em `pages/offline-translation` e casca Expo existente.
5. Evidências, coverage, gates, review e drift audit.

## Riscos e bloqueios

- O gate está aberto porque `MOB-FEAT-010` está `implemented`.
- `expo-image-picker` e `expo-sqlite` precisam ser instalados em versões compatíveis com Expo SDK 54.
- A recriação real da Activity durante o picker foi validada no Android pelo aprovador, sem perda ou duplicação do lote.
- Nenhum provider remoto, OCR, tradução ou Core integra estas tasks.
