# Review — MOB-FEAT-014

- Spec revisada: `spec.md`
- Implementação/revisão: working-tree sha256:278ae7859c561b28cd18b9c93b437243612da58ac0e65c5866c3af4eeb03499e
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
