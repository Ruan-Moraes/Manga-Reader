# Review — MOB-FEAT-004

- Spec revisada: `spec.md`
- Implementação/revisão: commit 177e7f3b5c97ee524227421dff075fe1a2fb8ebe
- Gate na entrada do planejamento: `open`
- Dependências verificadas: `MOB-FEAT-001` (`implemented`) e `MOB-FEAT-003` (`implemented`)
- Verdict: `approved`

## Findings

Nenhum finding aberto.

Os três findings da revisão anterior foram resolvidos:

1. A conclusão das invalidações agora é condicionada ao mesmo `identityEpoch` e à mesma versão monotônica; regressões com promises pendentes cobrem troca de conta, logout, expiração e mutação posterior.
2. `ContentLanguagesIdentityBoundary` compara sincronamente a identidade da sessão com a da feature e bloqueia a subtree antes do efeito, impedindo qualquer render intermediário da cadeia anterior.
3. O retry de consumidores guarda somente as query keys que falharam, repete apenas essas invalidações sem novo PATCH, preserva a preferência confirmada e mantém feedback acessível em nova falha e sucesso.

## Critérios e evidências

| Critério | Implementado | Evidência verificada                                                                                             | Resultado |
| -------- | ------------ | ---------------------------------------------------------------------------------------------------------------- | --------- |
| AC-001   | sim          | normalização unitária e hidratação do gate com duplicatas, locale externo e fallback ausente                     | pass      |
| AC-002   | sim          | editor e modelo preservam a mesma ordem exibida, enviada e confirmada                                            | pass      |
| AC-003   | sim          | normalização garante `pt-BR`; remoção fica disabled e não produz PATCH                                           | pass      |
| AC-004   | sim          | Axios Mock Adapter confirma GET/PATCH e envelopes; gate guest confirma zero requests privados                    | pass      |
| AC-005   | sim          | invalidação seletiva preserva cache neutro; retry repete somente chaves falhas, sem novo PATCH ou rollback       | pass      |
| AC-006   | sim          | derivação parametrizada trilíngue, editor guest oculto e ausência de GET/PATCH remoto                            | pass      |
| AC-007   | sim          | boundary bloqueia render obsoleto; reset cancela operações e resultados tardios não atravessam identidade/versão | pass      |
| AC-008   | sim          | request comum e refresh enviam apenas o idioma efetivo da UI; a cadeia não é serializada no header               | pass      |
| AC-009   | sim          | falha de GET limpa confirmado, usa fallback da interface e apresenta retry identificável                         | pass      |
| AC-010   | sim          | versões monotônicas protegem PATCH e invalidações; retries preservam a edição ou preferência confirmada correta  | pass      |
| AC-011   | sim          | posição, idioma, fallback, ações, disabled, retry e alvo mínimo são perceptíveis no editor nativo                | pass      |

## Cobertura de arquivos e drift

| Indicador                    | Resultado |
| ---------------------------- | --------: |
| `mismatch`                   |         0 |
| `undocumented`               |         0 |
| arquivos runtime descobertos |         0 |

- `coverage.json` classifica individualmente os arquivos runtime e de evidência da feature; não há caminhos obsoletos nem referências `AC-*` desconhecidas.
- Registry, frontmatter e gate estão coerentes: MOB-FEAT-004 entrou `in-progress` somente após MOB-FEAT-001 e MOB-FEAT-003 estarem `implemented`.
- Steiger confirma dependências `pages/widgets → features → entities → shared`, APIs públicas e ausência de import horizontal entre features.
- MOB-BASE-001, MOB-BASE-008, MOB-BASE-009 e o relatório de reconciliação permanecem coerentes com a composição atual.

## Gates

| Comando                                       | Resultado                                                 |
| --------------------------------------------- | --------------------------------------------------------- |
| re-review focado de modelo, boundary e editor | pass: 3 suítes, 21 testes, 0 snapshots                    |
| `CI=true pnpm specs:check`                    | pass: 19 artefatos normativos, 284 arquivos classificados |
| `CI=true pnpm typecheck`                      | pass                                                      |
| `CI=true pnpm lint`                           | pass                                                      |
| `CHOKIDAR_USEPOLLING=1 pnpm lint:fsd`         | pass: zero problemas                                      |
| `CI=true pnpm format:check`                   | pass                                                      |
| `CI=true pnpm test:ci`                        | pass: 37 suítes, 151 testes, 0 snapshots                  |
| `CI=true pnpm check`                          | pass end-to-end                                           |

## Mudanças fora da spec

- Nenhuma mudança de produto fora de MOB-FEAT-004 foi identificada.
- A composição provisória no Profile não implementa a navegação reservada a MOB-FEAT-008.

## Conclusão

Todos os AC-001–AC-011 possuem implementação e evidência proporcionais ao risco. Contratos HTTP, normalização, guest, ordem, fallback, consumidores, isolamento temporal, concorrência, retry, `Accept-Language`, i18n, acessibilidade, cobertura e FSD estão conformes. O drift está zero a zero e o verdict é `approved`; MOB-FEAT-004 pode ser promovida para `implemented` e liberar MOB-FEAT-005 conforme a política SDD.
