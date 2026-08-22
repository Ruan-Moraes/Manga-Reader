# Review — MOB-FEAT-012

- Spec revisada: `spec.md`
- Implementação/revisão: working-tree sha256:1dd45235243ecfc27d4eec289f36a307310311ed09e03dc5129f0f3c067384a6
- Gate na entrada do planejamento: `open`
- Dependência verificada: `MOB-FEAT-010` implementada
- Verdict: `approved`

## Findings

Nenhum finding bloqueante no código ou nas evidências automatizadas. O aprovador
validou em Android um lote de 100 imagens de tamanhos variados, sem lentidão
perceptível e com o draft preservado após fechar o aplicativo e removê-lo da
lista de recentes. A recriação real da Activity também foi validada com “Não
manter atividades”: o lote anterior de 100 imagens foi substituído exatamente
pelas 4 imagens escolhidas, sem perda ou duplicação.

## Critérios e evidências

| Critério | Implementado | Evidência verificada                                                                                              | Resultado |
| -------- | ------------ | ----------------------------------------------------------------------------------------------------------------- | --------- |
| AC-001   | sim          | rota pública, page RNTL, launcher guest-first e ausência de dependência HTTP no slice                             | pass      |
| AC-002   | sim          | adapter ImagePicker, seleção múltipla, config Android sem câmera ou permissões amplas e testes                    | pass      |
| AC-003   | sim          | controller preserva draft no cancelamento; teste de resultado neutro                                              | pass      |
| AC-004   | sim          | staging/promote sequencial, transação SQLite, rollback e testes com filesystem/repositório fake                   | pass      |
| AC-005   | sim          | modelo persiste somente filename privado e teste abre/lista sem reutilizar URI de origem                          | pass      |
| AC-006   | sim          | `getPendingResultAsync`, consumo único, testes e Android real com “Não manter atividades”: 100 → 4 sem duplicação | pass      |
| AC-007   | sim          | page informa quantidade/substituição e teste rejeita controles futuros                                            | pass      |
| AC-008   | sim          | erros localizados, retry, preservação, limpeza e mensagens sem URI/path/nome                                      | pass      |
| AC-009   | sim          | cópia sequencial, `base64: false`, testes e ensaio físico Android com 100 imagens variadas sem lentidão           | pass      |
| AC-010   | sim          | i18n pt-BR/en-US/es-ES, tokens, roles, labels e Button do design system                                           | pass      |

## Gates

| Comando                               | Resultado                                      |
| ------------------------------------- | ---------------------------------------------- |
| `pnpm exec expo config --type public` | pass; configuração Expo resolvida              |
| `pnpm specs:check`                    | pass; 25 artefatos, 455 arquivos classificados |
| `pnpm typecheck`                      | pass                                           |
| `pnpm lint`                           | pass                                           |
| `pnpm lint:fsd`                       | pass; zero problemas                           |
| `pnpm format:check`                   | pass                                           |
| `pnpm test:ci`                        | 68 suítes, 289 testes, zero snapshots          |
| `pnpm check`                          | pass                                           |

## Mudanças fora da spec

Foi corrigido o validador editorial para exigir review/drift/evidência somente
quando uma spec entra em execução (`implemented` ou `verification-pending`). Um
teste de regressão cobre o comportamento de specs `draft` e `approved`; a
mudança não relaxa nenhum gate de execução.

## Conclusão

Os dez critérios possuem implementação e evidência proporcional ao risco. O
ensaio físico fecha AC-009 e também confirma a persistência do draft após a
remoção do app da lista de recentes. A execução com “Não manter atividades”
fecha AC-006; todas as tasks e evidências obrigatórias estão concluídas, portanto
o verdict é `approved`.
