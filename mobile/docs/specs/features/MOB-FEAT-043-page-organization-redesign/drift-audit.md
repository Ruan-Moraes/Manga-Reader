# Drift audit — MOB-FEAT-043

Data: 2026-08-30

- Implementação auditada: working-tree sha256:9df90bc58827359dd921a48f537f3c111a755991b5615f70601e493896b0f41e
- Status da feature: `verification-pending`

## Resultado

O refinamento aprovado foi reconciliado com a MOB-FEAT-043: parâmetros em config,
geometria/sessão em model e apresentação em ui. Todos os arquivos runtime e a
nova evidência possuem mapeamento individual em coverage. Contratos públicos,
versões, banco e API não mudaram. TASK-012 a TASK-014 implementadas; TASK-010 e
TASK-015 abertas para a validação física completa e o abort antigo de worklet.

Gesto estável na viewport, overlay independente, histerese, auto-scroll gradual,
fases/tokens e handoff por callback mais medição substituem o reset antecipado.
O teste nativo detectou `_measure(null)` e ref tardia em célula da Lista;
ambos corrigidos com regressões anteriores à correção. Grade/Lista retornaram ao
repouso no reteste de callbacks. Isso não comprova 20 gestos físicos por modo,
virtualização nativa de 100 imagens ou ausência de frames perdidos.

O clipping do iOS permanece desligado. O terceiro abort das 14:49:14 não foi
atribuído ao clipping nem ao novo diagnóstico sem evidência. Revisão e status
continuam `verification-pending`, conforme o plano aprovado.

## Contadores

- `mismatch`: 0
- `undocumented`: 0
- arquivos runtime sem mapa: 0
- caminhos obsoletos: 0
- violações de gate: 0
- tarefas de verificação abertas: 2

## Escopo

Configuração de layout, geometria, hook de sessão/gesto, overlay/wrappers,
painel/cartão, testes, spec/tasks/coverage e evidências. A working tree contém
manutenções anteriores dos TODOs; elas foram preservadas. O checksum global é
recalculado sobre o snapshot completo, sem renovar aprovações de outras features.

## Refinamento auditado em 2026-09-01

O preview compartilhado está coberto por `AC-005..007`, possui entrada individual
em `coverage.json` e não introduz import horizontal entre features. Ordenação e
Validação consomem somente a API pública de `shared/ui`; copy e ações continuam
nos slices proprietários. Cards, gestos, controllers, banco e API não mudaram.
TASK-016 foi concluída sem fechar as duas pendências físicas anteriores.

Rebase documental de performance (2026-09-05): checksum global atualizado pela inclusão da auditoria e da MOB-DEC-007; runtime preservado por comparação SHA-256. Não representa nova verificação física nem alteração de verdict.

Rebase C01/C03/C04 (2026-09-06): checksum global atualizado após correções de numeração do leitor, persistência da validação e limite de resposta. Escopo e validações em [review de performance](../../../active/performance-evidence/corrections-2026-09-06/review.md). Não representa nova verificação física das demais features.

Rebase C02/C05 (2026-09-06): checksum global atualizado após virtualização do leitor e download de exportação para arquivo. [Escopo e validação](../../../active/performance-evidence/corrections-c02-c05-2026-09-06/review.md). Não representa nova verificação física das demais features.

Consolidação documental (2026-09-06): checksum global atualizado após reconciliar o estado de performance; runtime e verdict preservados. [Registro](../../../active/performance-evidence/consolidation-2026-09-06/review.md). Sem nova validação física.

Preparação de commit (2026-09-06): rebase global após excluir scripts avulsos de ensaio, listagens Git e metadados do sistema dos arquivos versionados, conforme solicitação humana. Resultados históricos preservados; runtime e verdict inalterados.
