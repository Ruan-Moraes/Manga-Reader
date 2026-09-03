# Drift audit — MOB-FEAT-043

Data: 2026-08-30

- Implementação auditada: working-tree sha256:38172ac139f24be05ddf591a77830ea02b9586b8729bba5be6c131da60bffe58
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
