# MOB-FEAT-065 — Tarefas

| Critério | Tarefa   | Evidência prevista                                    |
| -------- | -------- | ----------------------------------------------------- |
| AC-001   | TASK-001 | Ativação, desativação e persistência no aparelho.     |
| AC-002   | TASK-002 | Modal, cópia e teste nativo de clipboard.             |
| AC-003   | TASK-003 | Testes com modo ativado e desativado.                 |
| AC-004   | TASK-004 | Testes de gateway, implantação e ausência de retry.   |
| AC-005   | TASK-005 | SettingsAboutPage.test.tsx; validação Android física. |

- [ ] TASK-001 — Verificar modo em aparelho físico e reinício.
- [ ] TASK-002 — Verificar modal e clipboard em aparelho físico.
- [ ] TASK-003 — Completar regressões de visibilidade e privacidade.
- [ ] TASK-004 — Testar, implantar gateway e conferir diagnóstico real.

## Progresso — 2026-11-10

O APK `artifacts/toonlira-android-diagnostic-test.apk`, SHA-256
`a34ed8762cd6b381f29ab399a0854bcd4dc904e48a90c2471ebc897b1c4b14ae`,
foi gerado com a assinatura do APK anterior e a origem HTTPS de teste.
A cópia usa `expo-clipboard`; o modal e o controle de visibilidade foram
testados em componentes, e o tratamento do gateway foi testado localmente.
As alterações do gateway **não foram implantadas**: o acesso GCP disponível
não está autenticado. Erros do gateway anterior podem apresentar somente o
status HTTP. A consulta aos logs existentes e os testes no aparelho físico
continuam pendentes. Os detalhes de erro do lote atual são mantidos em memória;
não há diagnóstico retroativo garantido após fechar a tela.

- [ ] TASK-005 — Sequência e controle persistente. Código e regressões preparados. Validar em Android físico.
