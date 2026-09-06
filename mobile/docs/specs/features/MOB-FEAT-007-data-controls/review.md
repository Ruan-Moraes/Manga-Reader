# Review — MOB-FEAT-007

- Spec revisada: `spec.md`
- Implementação/revisão: working-tree sha256:9df90bc58827359dd921a48f537f3c111a755991b5615f70601e493896b0f41e
- Gate na entrada do planejamento: `open`
- Dependências verificadas: `MOB-FEAT-001` (`implemented`)
- Verdict: `verification-pending`

## Findings

Revisão histórica do commit 177e7f3b5c97ee524227421dff075fe1a2fb8ebe abaixo; C05 reabre validação nativa.

Os findings das rodadas anteriores foram resolvidos:

1. A exportação usa `expo-sharing` com URI de arquivo, MIME JSON e UTI, sem DOM ou URL de objeto.
2. Arquivos temporários são removidos em sucesso, encerramento, indisponibilidade e troca de identidade.
3. Limpeza parcial preserva o resultado por categoria e informa falhas com traduções trilíngues.
4. Tokens, settings e estado pendente permanecem iguais em memória; os bytes correspondentes no SecureStore são comparados antes/depois e não há deleção.
5. Invalidação e refetch de recuperação usam `throwOnError: true`; testes com QueryClient/QueryObserver reais comprovam atualização bem-sucedida e remoção de stale quando as duas tentativas falham, sem repetir o DELETE.
6. O adapter de armazenamento mede somente exportações temporárias controladas pelo app; o painel apresenta bytes/escopo localizados e omite a métrica se a capability não existir ou rejeitar.
7. Confirmações, guest, busy/retry, tasks, baselines, coverage, registry e caminhos do widget `application-shell` estão reconciliados.

## Critérios e evidências

| Critério | Implementado | Evidência verificada                                                                                                        | Resultado |
| -------- | ------------ | --------------------------------------------------------------------------------------------------------------------------- | --------- |
| AC-001   | sim          | queries/imagens/temporários removidos; estado em memória e bytes SecureStore protegidos iguais antes/depois                 | pass      |
| AC-002   | sim          | alertas localizados de cache e histórico, incluindo remoções, preservações e irreversibilidade; cancelar não produz efeitos | pass      |
| AC-003   | sim          | GET autenticado, arquivo JSON datado e compartilhamento nativo por `expo-sharing` com MIME/UTI                              | pass      |
| AC-004   | sim          | cleanup em `finally`, indisponibilidade e gate por identidade removem temporários sem tratar cancelamento como erro         | pass      |
| AC-005   | sim          | chaves corretas, reading-progress preservado, DELETE único, recovery real e remoção de stale após dupla falha               | pass      |
| AC-006   | sim          | guest não alcança adapters privados; UI desabilita ações de conta e mantém limpeza local                                    | pass      |
| AC-007   | sim          | capability ausente/erro omite métrica; adapter real soma arquivos controlados e a UI explicita o escopo                     | pass      |
| AC-008   | sim          | busy termina, erros/categorias são localizados, concorrência é bloqueada e retry não duplica nem amplia operações           | pass      |

## Cobertura de arquivos

- Todos os arquivos runtime e de evidência próprios da MOB-FEAT-007 estão classificados em `coverage.json`.
- Os gates e providers estão em `src/application`, sem referências runtime aos shells intermediários removidos.
- A inspeção FSD confirmou dependências descendentes `pages/widgets → features → entities/shared` e APIs públicas por slice.
- MOB-BASE-001, MOB-BASE-009 e o relatório de reconciliação refletem a ordem do shell e o consumo atual das query keys.

## Gates

| Comando                               | Resultado                                                                                           |
| ------------------------------------- | --------------------------------------------------------------------------------------------------- |
| `CI=true pnpm check`                  | pass informado pela execução fresca: 37 suítes, 142 testes, 0 snapshots; 283 arquivos classificados |
| testes focados MOB-FEAT-007           | pass: 6 suítes, 24 testes, 0 snapshots                                                              |
| `pnpm lint:fsd` e `pnpm format:check` | pass no gate completo                                                                               |

## Auditoria de drift

| Indicador                                    | Resultado |
| -------------------------------------------- | --------: |
| `mismatch` da MOB-FEAT-007                   |         0 |
| `undocumented` da MOB-FEAT-007               |         0 |
| arquivos runtime descobertos da MOB-FEAT-007 |         0 |
| drift de baseline relacionado                |         0 |

## Mudanças fora da spec

- Nenhum comportamento extra de produto foi identificado.
- A composição global em `src/application` segue `MOB-DEC-004` e está reconciliada nos artefatos SDD.

## Conclusão histórica

O gate de entrada e a dependência estavam válidos. Todos os oito critérios possuem implementação e evidência proporcionais ao risco, incluindo falhas reais do TanStack Query, bytes persistidos, integração nativa de arquivos, capability de armazenamento e caminhos guest. Os gates técnicos, cobertura e auditoria de drift estão verdes. O verdict é `approved`; a feature pode seguir para ser marcada como `implemented` e liberar dependências posteriores conforme a política SDD.

## Review C05 — 2026-09-06

Exportação escreve diretamente no temporário nativo e retorna somente metadados ao JS.
Testes usam o cliente real com filesystem controlado: token, idioma, refresh concorrente,
erro HTTP, abort, timeout e conclusão tardia. Shared isola operações em subdiretórios
privados mantendo o nome datado; cancela preparação/download na troca de identidade,
preserva MIME/UTI e limpa em finally. Medição inclui arquivos legados e novos.

AC-003/004/008: testes automatizados verdes; integração e performance nativas pendentes
na TASK-007. AC-001/002/005/006/007 seguem cobertos pelos testes existentes e pelo teste
da medição em diretórios isolados. Nenhuma intenção funcional ou gate alterado.
Verdict atual: `verification-pending`; a conclusão histórica não aprova esta versão.
Ver [evidências](../../../active/performance-evidence/corrections-c02-c05-2026-09-06/review.md).

Rodada C02/C05: contratos aprovados e gates abertos preservados; runtime coberto e revisão registrada no [review da rodada](../../../active/performance-evidence/corrections-c02-c05-2026-09-06/review.md). Medição nativa permanece aberta. Contadores da revisão estática: mismatch 0, undocumented 0, arquivos descobertos 0; não substituem validação física.

Rebase C02/C05 (2026-09-06): checksum global atualizado após virtualização do leitor e download de exportação para arquivo. [Escopo e validação](../../../active/performance-evidence/corrections-c02-c05-2026-09-06/review.md). Não representa nova verificação física das demais features.

Gate completo C05: `pnpm check` passou, 95 suítes / 588 testes.

Consolidação documental (2026-09-06): checksum global atualizado após reconciliar o estado de performance; runtime e verdict preservados. [Registro](../../../active/performance-evidence/consolidation-2026-09-06/review.md). Sem nova validação física.

Preparação de commit (2026-09-06): rebase global após excluir scripts avulsos de ensaio, listagens Git e metadados do sistema dos arquivos versionados, conforme solicitação humana. Resultados históricos preservados; runtime e verdict inalterados.
