# Review — MOB-FEAT-045

- Spec revisada: `spec.md`
- Implementação/revisão: working-tree sha256:cb2e5226cae5289175f02ef3243e0e048890a91e89ff1da21764db1ee89ab84e
- Gate na entrada do planejamento: `open`
- Dependências verificadas: MOB-FEAT-015 `implemented`; MOB-FEAT-043
  `verification-pending`.
- Verdict: `verification-pending`

## Findings

Nenhum finding funcional aberto no código do escopo. A persistência de falhas
remotas foi corretamente mantida fora do draft local porque o gateway ainda não
existe; o modelo de apresentação aceita a origem `processing` sem fabricar
resultado.

## Critérios e evidências

| Critério | Implementado | Evidência verificada                           | Resultado                 |
| -------- | ------------ | ---------------------------------------------- | ------------------------- |
| AC-001   | sim          | RNTL da galeria + auditoria iPhone 17          | pass                      |
| AC-002   | sim          | RNTL de origem local/processing e detalhe      | pass                      |
| AC-003   | sim          | Repository, controller, picker e RNTL          | pass                      |
| AC-004   | sim          | Integração da page e auditoria do CTA          | pass                      |
| AC-005   | parcial      | i18n, labels, lint/FSD e auditoria pt-BR clara | matriz assistiva pendente |

## Gates

| Comando             | Resultado                                                        |
| ------------------- | ---------------------------------------------------------------- |
| `pnpm typecheck`    | pass                                                             |
| `pnpm lint`         | pass                                                             |
| `pnpm lint:fsd`     | pass                                                             |
| `pnpm format:check` | pass                                                             |
| `pnpm test:ci`      | pass — 87 suítes, 508 testes                                     |
| `pnpm specs:check`  | 23 testes pass; bloqueio por 21 checksums históricos divergentes |

## Mudanças fora da spec

- Nenhuma capacidade de processamento, OCR ou detecção de artefato foi criada.
- A API do picker ganhou limite opcional reutilizável; o comportamento múltiplo
  existente permanece como default.

## Conclusão

O redesign e a correção localizada estão implementados e cobertos. O status é
`verification-pending` porque erro no picker real, tema escuro, fonte ampliada e
VoiceOver/TalkBack ainda precisam da matriz física registrada em TASK-005. O
gate SDD global continua vermelho por checksums concorrentes preexistentes e não
foi reapropriado por esta review.

## Revisão do preview compartilhado — 2026-09-01

A Validação passou a compor detalhe técnico e substituição nos slots de
`MediaPreviewSheet`; nenhuma regra de falha migrou para `shared`. O preview sem
falha manteve a aparência anterior e agora compartilha cache, fallback e
fechamento com a Ordenação. Testes dirigidos passaram 43/43 e a suíte completa
511/511; typecheck, FSD e formatação passaram. A inspeção no iPhone 17 confirmou
a paridade visual. TASK-006 está concluída e TASK-005 mantém o verdict
`verification-pending`.

Rebase documental de performance (2026-09-05): checksum global atualizado pela inclusão da auditoria e da MOB-DEC-007; runtime preservado por comparação SHA-256. Não representa nova verificação física nem alteração de verdict.

Rebase C01/C03/C04 (2026-09-06): checksum global atualizado após correções de numeração do leitor, persistência da validação e limite de resposta. Escopo e validações em [review de performance](../../../active/performance-evidence/corrections-2026-09-06/review.md). Não representa nova verificação física das demais features.

Rebase C02/C05 (2026-09-06): checksum global atualizado após virtualização do leitor e download de exportação para arquivo. [Escopo e validação](../../../active/performance-evidence/corrections-c02-c05-2026-09-06/review.md). Não representa nova verificação física das demais features.

Consolidação documental (2026-09-06): checksum global atualizado após reconciliar o estado de performance; runtime e verdict preservados. [Registro](../../../active/performance-evidence/consolidation-2026-09-06/review.md). Sem nova validação física.

Preparação de commit (2026-09-06): rebase global após excluir scripts avulsos de ensaio, listagens Git e metadados do sistema dos arquivos versionados, conforme solicitação humana. Resultados históricos preservados; runtime e verdict inalterados.
