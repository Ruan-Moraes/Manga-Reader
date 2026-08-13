# Spec-Driven Development no Mobile

Este diretório é o contrato comportamental do Manga Reader Mobile. O README do módulo continua sendo referência técnica; comportamento observado e intenção futura ficam separados aqui.

## Artefatos

- `baseline/`: fotografia verificável do comportamento existente, identificada por `OBS-*`.
- `features/`: Target Specs futuras, identificadas por `AC-*`.
- `decisions/`: decisões duráveis de produto, arquitetura ou processo.
- `_templates/`: formatos obrigatórios de spec, tasks, review e decisão.
- `registry.md`: índice de todos os artefatos normativos.
- `coverage.json`: mapa verificável de cada arquivo runtime e classificação dos arquivos de suporte.

Relatórios informativos não criam requisitos. O histórico útil da migração brownfield, conflitos baseline/target e superfícies placeholder foi consolidado neste workflow, no registry e nos próprios contratos; relatórios intermediários redundantes foram removidos em 2026-08-09.

## Paridade brownfield

Enquanto o código existente é a fonte real, cada arquivo de `app/` e `src/` possui uma entrada individual no manifesto. Arquivos `behavior` apontam para observações de baseline; testes `evidence` apontam para as mesmas observações. Infraestrutura, recursos e governança exigem uma justificativa, mas não viram requisitos de produto.

Paridade zero significa simultaneamente:

- nenhum arquivo runtime descoberto;
- nenhum caminho obsoleto no manifesto;
- nenhuma referência a spec ou observação inexistente;
- zero verdicts `mismatch` e `undocumented` no relatório de reconciliação.

Patterns são proibidos para `app/` e `src/`, evitando que um novo slice seja considerado coberto por acidente. Depois da paridade inicial, código novo pode ser ligado a `AC-*` somente durante a execução de uma Target Spec aprovada.

## Ciclo de uma feature

```text
Reverse Spec (quando necessário)
  → Target Spec draft
  → aprovação humana
  → Target Spec approved
  → tasks
  → implementação + evidências
  → review
  → auditoria de drift persistida
```

Uma feature usa `features/MOB-FEAT-###-slug/` com `spec.md`, `tasks.md`, `review.md` e, quando implementada ou em verificação, `drift-audit.md`. O Task Planner e o Executor recusam specs `draft`. Somente uma pessoa pode mudar `draft` para `approved`.

### Gate de implementação

Toda Target Spec declara `implementation_gate` e `blocked_by`. `draft`/`approved` representam maturidade e aprovação do contrato; o gate representa prontidão das dependências. Uma spec `blocked` pode ser aprovada, mas não recebe `tasks.md` e não entra em execução. Para abrir o gate, todas as Target Specs listadas em `blocked_by` devem estar `implemented` ou `verification-pending`; este último significa código executado, ainda não concluído por uma verificação real pendente. O validador rejeita dependências inexistentes, autorreferências, ciclos, execução bloqueada e desbloqueio prematuro.

## Status

| Tipo     | Status permitidos                                                                       |
| -------- | --------------------------------------------------------------------------------------- |
| baseline | `observed`, `superseded`                                                                |
| feature  | `draft`, `approved`, `in-progress`, `verification-pending`, `implemented`, `superseded` |
| decision | `proposed`, `accepted`, `superseded`                                                    |

Ao substituir um contrato, preencher `supersedes`/`superseded_by` nos dois artefatos e no registry. Mudança parcial deve listar os `OBS-*` afetados na Target Spec sem marcar todo o baseline como superseded.

## Bugs e mudanças

- **Código divergente:** a spec continua correta; corrigir o código e adicionar evidência de regressão.
- **Spec divergente:** a intenção mudou ou estava incorreta; atualizar/criar Target Spec e obter nova aprovação antes do código.
- **Sem spec:** executar Reverse Spec e documentar apenas o comportamento demonstrável.

## Critérios e evidências

Target Specs usam critérios `AC-001`, `AC-002`, etc. Cada critério precisa de exatamente uma linha em `tasks.md`, uma linha em `review.md` e ao menos uma entrada `evidence` no manifesto. Evidência manual só existe após execução real; nunca é inferida ou fabricada. Baselines usam `OBS-*`; seus testes preservam uma fotografia substituível, não uma promessa futura. Não existe meta percentual arbitrária de cobertura.

`implemented` exige checklist integralmente concluído, verdict `approved`, drift persistido e referência imutável. `verification-pending` exige ao menos uma task aberta, verdict homônimo e descrição explícita do que falta. Reviews apontam para commit completo ou checksum SHA-256 reproduzível da implementação em `app/` e `src/`.

Mappings exatos em `coverage.json` prevalecem sobre patterns. Isso permite que testes, índices e capturas dentro de diretórios de governança sejam classificados como `evidence` sem perder o pattern geral de suporte.

## Comandos

```bash
pnpm specs:check
pnpm test:ci
pnpm check
```

`specs:check` valida metadados, registry, estrutura, mapa arquivo→contrato e rastreabilidade. Consulte [o registry](registry.md) e [o manifesto](coverage.json) antes de iniciar qualquer trabalho.
