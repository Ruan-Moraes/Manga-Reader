# Review — MOB-FEAT-014

- Spec revisada: `spec.md`
- Implementação/revisão: working-tree sha256:cb2e5226cae5289175f02ef3243e0e048890a91e89ff1da21764db1ee89ab84e
- Gate na entrada da implementação: `open`
- Dependência verificada: `MOB-FEAT-013` implementada
- Verdict: `approved`

## Findings

Nenhum finding bloqueante permanece. O domínio expõe sete códigos e deriva os
42 pares direcionais sem tabela duplicada. Origem e destino continuam
independentes, com PT-BR priorizado apenas visualmente no destino.

A migration SQLite v6 reconstrói atomicamente os CHECKs do draft e dos projetos.
`zh` legado vira provisoriamente `zh-Hans`; confirmação do draft é limpa e
projetos recebem `language_review_required = 1`, impedindo a transição para
`QUEUED`. Falha no `foreign_key_check` executa rollback antes de avançar a versão.

## Critérios e evidências

| Critério | Implementado | Evidência verificada                                                              | Resultado |
| -------- | ------------ | --------------------------------------------------------------------------------- | --------- |
| AC-001   | sim          | teste parametrizado aceita exatamente sete códigos e 42 pares direcionais         | pass      |
| AC-002   | sim          | RNTL mantém JA→PT-BR editável, prioridade visual e copy sem detecção              | pass      |
| AC-003   | sim          | repository persiste os códigos independentes e restaura o par após reload         | pass      |
| AC-004   | sim          | modelo, UI, repository e CHECK rejeitam par igual ou código desconhecido          | pass      |
| AC-005   | sim          | confirmação exige revisão válida e não inicia processamento fictício              | pass      |
| AC-006   | sim          | alteração do par/páginas invalida confirmações corretas preservando escolhas      | pass      |
| AC-007   | sim          | controller serializa ações, restaura estado seguro e oferece retry localizado     | pass      |
| AC-008   | sim          | seleção permanece isolada de UI locale, conteúdo, `Accept-Language`, conta e Core | pass      |
| AC-009   | sim          | RNTL valida 14 opções acessíveis e labels distintos nos três locales              | pass      |
| AC-010   | sim          | testes v5→v6 preservam dados, revisam `zh`, verificam FKs e exercitam rollback    | pass      |

## Gates

| Comando             | Resultado                             |
| ------------------- | ------------------------------------- |
| `pnpm specs:check`  | pass; zero drift/undocumented         |
| `pnpm typecheck`    | pass                                  |
| `pnpm lint`         | pass                                  |
| `pnpm lint:fsd`     | pass; zero problemas                  |
| `pnpm format:check` | pass                                  |
| `pnpm test:ci`      | 80 suítes, 401 testes, zero snapshots |
| `pnpm check`        | pass                                  |

## Mudanças fora da spec

Nenhuma. OCR, detecção real, gateway, upload, tradução, renderização, quota,
biblioteca final, conta e Core permanecem fora do escopo.

## Conclusão

Os sete idiomas, 42 pares e upgrade v6 satisfazem o contrato aprovado. Não há
task normativa ou verificação manual aberta; a feature retorna a `implemented`.

Revalidação global de 2026-08-30: checksum da working tree atualizado após a
manutenção dos TODOs de auth/review local. A referência é global por definição
do validador; não representa nova inspeção nativa desta feature.

Rebase documental de performance (2026-09-05): checksum global atualizado pela inclusão da auditoria e da MOB-DEC-007; runtime preservado por comparação SHA-256. Não representa nova verificação física nem alteração de verdict.

Rebase C01/C03/C04 (2026-09-06): checksum global atualizado após correções de numeração do leitor, persistência da validação e limite de resposta. Escopo e validações em [review de performance](../../../active/performance-evidence/corrections-2026-09-06/review.md). Não representa nova verificação física das demais features.

Rebase C02/C05 (2026-09-06): checksum global atualizado após virtualização do leitor e download de exportação para arquivo. [Escopo e validação](../../../active/performance-evidence/corrections-c02-c05-2026-09-06/review.md). Não representa nova verificação física das demais features.

Consolidação documental (2026-09-06): checksum global atualizado após reconciliar o estado de performance; runtime e verdict preservados. [Registro](../../../active/performance-evidence/consolidation-2026-09-06/review.md). Sem nova validação física.

Preparação de commit (2026-09-06): rebase global após excluir scripts avulsos de ensaio, listagens Git e metadados do sistema dos arquivos versionados, conforme solicitação humana. Resultados históricos preservados; runtime e verdict inalterados.
