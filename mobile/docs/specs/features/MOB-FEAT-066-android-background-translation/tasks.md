# MOB-FEAT-066 — Tarefas

| Critério | Tarefa   | Evidência                                                                    |
| -------- | -------- | ---------------------------------------------------------------------------- |
| AC-001   | TASK-001 | Testes de painel, estados e acessibilidade.                                  |
| AC-002   | TASK-002 | Execução Android nativa e integração em aparelho.                            |
| AC-003   | TASK-003 | Notificação e permissão em aparelho.                                         |
| AC-004   | TASK-004 | Migração SQLite, interrupção e retomada segura.                              |
| AC-005   | TASK-005 | Testes de integridade, privacidade e revisão.                                |
| AC-006   | TASK-006 | chapterBatch.test.ts e ChapterBatchPanel.test.tsx; validação Android física. |

- [ ] TASK-001 — Redesenhar painel, resumo e ações.
- [ ] TASK-002 — Implementar controlador durável e serviço Android.
- [ ] TASK-003 — Implementar notificações, controles e permissão.
- [ ] TASK-004 — Persistir seleção e recuperação segura após interrupção.
- [ ] TASK-005 — Executar gates, testes físicos, review e drift.

## Plano de dados

SQLite privado existente: `chapter_batch_runs` identifica a execução pela chave
`id`, referencia `translation_projects` com exclusão em cascata e guarda somente
estado, solicitação de parada e timestamps. Índice único parcial garante uma execução não terminal por
aparelho. `chapter_batch_items` tem chave `(run_id,page_id)`, posição única por
execução, FKs para execução e página e estado validado por CHECK; não armazena
imagens ou tokens. Cada item depende da chave completa, sem dados de página
duplicados; índices existentes ou a chave composta cobrem as FKs e a ordem.
O pertencimento da página ao projeto é verificado na transação de criação.
Migration SQLite v11 aditiva, com `foreign_keys` ativado, não altera tabelas nem
dados preexistentes. Tentativas e recibos permanecem autoridade para retry.

## Evidência parcial — 2026-11-11

- Tipos, lint e boundaries FSD passaram; suíte mobile: 169 suítes e 1.271 testes aprovados.
- Serviço `dataSync` compilado; emulador Android executou tarefa sintética por 45 segundos
  após sair do aplicativo e apresentou notificação de conclusão. Nenhuma chamada paga foi feita.
- APK experimental com `EXPO_PUBLIC_TRANSLATION_BACKGROUND=true`: pacote `com.toonlira.app`,
  Android mínimo 24, assinatura de teste existente e gateway HTTPS temporário conferidos; abriu no emulador.
  SHA-256: `06677d76a31394addac9630fffa8753102affbd2828ce6308dd9078735c47839`.
- `pnpm check` permanece bloqueado por 17 checksums de reviews anteriores divergentes;
  a verificação de formatação também aponta arquivos preexistentes e alterados nesta rodada.
- Ainda faltam teste de tradução real em segundo plano no aparelho, controles e abertura da
  notificação, interrupção, retomada, acessibilidade física e revisão dos critérios. A feature
  permanece em andamento; o APK é exclusivamente para teste.

Atualização da notificação: o serviço exibe o estado localizado de parada imediatamente após
o toque e o mantém durante as atualizações de progresso. Compilação Kotlin, tipos, lint e testes
do adaptador passaram; a apresentação da nova mensagem em aparelho permanece por verificar.

- [ ] TASK-006 — Miniaturas, fila e cancelamento. Código e regressões preparados. Validar em Android físico.
