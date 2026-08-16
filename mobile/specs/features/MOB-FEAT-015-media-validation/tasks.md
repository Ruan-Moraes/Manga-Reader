# Tasks — MOB-FEAT-015

- Spec: `spec.md`
- Status da spec no planejamento: `approved`
- Gate no planejamento: `open`
- Dependências implementadas: `MOB-FEAT-012`, `MOB-FEAT-013`, `MOB-FEAT-014`

## Rastreabilidade

| Critério | Tasks    | Evidência planejada                                                        |
| -------- | -------- | -------------------------------------------------------------------------- |
| AC-001   | TASK-001 | Parser/fixtures JPEG, PNG, WebP, animações e MIME hint divergente          |
| AC-002   | TASK-002 | Política/fronteiras e prova de rejeição antes do decode                    |
| AC-003   | TASK-003 | Fixtures ausente, vazia, alterada e corrompida com erro por página         |
| AC-004   | TASK-004 | SQLite v3→v4, constraints, FK, reload e rollback                           |
| AC-005   | TASK-005 | Integração de lote misto, remoção e substituição                           |
| AC-006   | TASK-006 | Repository para append/remove/reorder/language preservando identidade      |
| AC-007   | TASK-007 | Fixture arte-only válida sem detector de texto                             |
| AC-008   | TASK-008 | Leitura limitada/sequencial e profiling físico Android                     |
| AC-009   | TASK-009 | RNTL trilíngue nos modos kanban/scroll e estados acessíveis                |
| AC-010   | TASK-010 | Integração offline, sem HTTP e sanitização de mensagens/logs               |
| AC-011   | TASK-011 | Duplo toque, interrupção, stale draft, falha transacional e retry seletivo |
| AC-012   | TASK-012 | Matriz de readiness e ausência de processamento/navegação fictícios        |

## Checklist

- [x] TASK-001 — Criar adapter genérico de inspeção binária com assinaturas/estrutura de JPEG, PNG e WebP estáticos.
- [x] TASK-002 — Aplicar política v1 de tamanho/dimensões antes do decode e testar todas as fronteiras.
- [x] TASK-003 — Mapear arquivos ausentes, vazios, alterados, não suportados e corrompidos sem vazamento.
- [x] TASK-004 — Evoluir modelo/repository/SQLite v3→v4 em BCNF com constraints e preservação integral.
- [x] TASK-005 — Implementar validação sequencial de lote misto e correção localizada.
- [x] TASK-006 — Coordenar resultados por identidade nas edições existentes sem invalidação excessiva.
- [x] TASK-007 — Provar que arte-only decodificável é válida sem OCR ou heurística semântica.
- [x] TASK-008 — Limitar leituras/memória e executar profiling Android com lote misto e imagem de fronteira.
- [x] TASK-009 — Criar UI acessível e i18n pt-BR/en-US/es-ES integrada a kanban e scroll.
- [x] TASK-010 — Provar operação guest/offline, sem HTTP/Core e com mensagens/logs sanitizados.
- [x] TASK-011 — Implementar serialização, stale protection, rollback e retry seletivo.
- [x] TASK-012 — Derivar prontidão honesta, atualizar coverage/README, executar gates, review e drift audit.

## Ordem de execução

1. `shared/media-inspection` e testes puros.
2. SQLite v4 e `entities/local-media-import`.
3. `features/validate-local-media`.
4. Composição na page, slots na revisão e i18n.
5. Coverage, gates, profiling físico, review e drift.

## Riscos e bloqueios

- O gate está aberto porque todas as dependências estão implementadas.
- TASK-008 foi concluída em Android físico com 67 imagens; revalidação,
  persistência, responsividade, memória e ausência de crash/ANR foram confirmadas
  pelo aprovador em 2026-08-15.
- Nenhuma task pode introduzir OCR, rede, provider, tradução ou Core.
