# AGENTS.md — Manga Reader Mobile

Este diretório usa Spec-Driven Development (SDD). O escopo deste contrato é somente `mobile/`.

## Fontes de verdade

- Target Specs normativas: `specs/features/`
- Baselines observados: `specs/baseline/`
- Decisões: `specs/decisions/`
- Índice obrigatório: `specs/registry.md`
- Mapa obrigatório código → contrato: `specs/coverage.json`
- Processo e status: `specs/README.md`

Baseline descreve o código atual; não é intenção futura. Feature nova ou mudança comportamental exige Target Spec `approved` por uma pessoa antes de tasks ou código.

## Fluxo obrigatório

1. Reverse Spec quando a área tocada não tiver baseline.
2. Spec Architect cria Target Spec `draft` com critérios `AC-*`.
3. Uma pessoa aprova a spec e atualiza spec + registry para `approved`.
4. Se `implementation_gate` estiver `blocked`, aguardar todas as Target Specs de `blocked_by` chegarem a `implemented`; somente então uma pessoa abre o gate.
5. Task Planner deriva `tasks.md` sem inventar requisitos.
6. Executor implementa somente spec aprovada e com gate aberto, cria evidências e não edita requisitos.
7. Reviewer compara spec, código e testes e registra `review.md`.
8. Drift Auditor verifica divergências, gates, dependências e supersession.

Antes de criar uma Target Spec, a paridade brownfield deve estar verde: zero arquivos runtime sem mapa, zero observações sem evidência e zero divergências no relatório de reconciliação.

## Regras

- Mudança de comportamento atualiza a spec antes do código.
- Bug com spec correta é código divergente; corrigir com teste de regressão.
- Mudança de intenção é spec divergente; voltar ao Spec Architect e à aprovação humana.
- Código sem spec é comportamento não documentado; aplicar Reverse Spec antes de alterá-lo.
- Todo arquivo em `app/` e `src/` deve possuir entrada individual em `specs/coverage.json`; patterns são permitidos somente para suporte não-runtime.
- Entradas `behavior` e `evidence` devem apontar para `MOB-BASE-###/OBS-###` ou, após aprovação, `MOB-FEAT-###/AC-###` existente.
- Testes, configs, scripts, assets e governança devem ser classificados sem serem promovidos artificialmente a comportamento do produto.
- Review é obrigatório. Tasks e código não podem preencher lacunas da spec.
- Toda Target Spec declara `implementation_gate: open | blocked` e `blocked_by`. Feature bloqueada pode ser aprovada, mas não pode possuir `tasks.md`, entrar em execução ou ser marcada `in-progress`/`implemented`.
- O gate bloqueado só pode ser aberto quando todas as Target Specs em `blocked_by` estiverem `implemented`; dependências inexistentes, próprias ou circulares são inválidas.
- Capacidade visível sem implementação real, como controle sem efeito ou dependência funcional inexistente, deve permanecer bloqueada. Não criar UI fictícia para contornar o gate.
- Preservar FSD, APIs públicas dos slices, tokens de tema e i18n nos três idiomas.
- Não aplicar este workflow a `api/` ou `web/` nesta migração.

## Skills SDD

- `sdd-auditor`: auditar cobertura, registry, gates e prontidão.
- `sdd-reverse-spec`: capturar comportamento brownfield como `OBS-*`.
- `sdd-spec-architect`: criar ou alterar Target Specs.
- `sdd-task-planner`: derivar tasks de spec humanamente aprovada.
- `sdd-executor`: implementar tasks aprovadas com testes.
- `sdd-reviewer`: validar aderência e emitir verdict.
- `sdd-drift-auditor`: detectar divergências entre specs e código.

Antes de concluir, executar `pnpm check` dentro de `mobile/`.
