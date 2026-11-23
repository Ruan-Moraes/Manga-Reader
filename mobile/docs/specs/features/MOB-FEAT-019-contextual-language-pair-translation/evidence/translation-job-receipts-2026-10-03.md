# Receipts do worker no mobile — 2026-10-03

Parcela incremental da TASK-005/007 da `MOB-FEAT-019`, `in-progress/open`,
com a 018 em `verification-pending`. Também corrige a fronteira de respostas
não confiáveis/recovery/cancelamento da 017, sem alterar seu verdict.
TASK-002..007 da 019 permanecem abertas; gates 020/021 bloqueados.

## Plano e findings reproduzidos

Confronto dos contratos atuais pelo método `sdd-executor`/`sdd-reviewer`:

- O enum Java/OpenAPI publica seis erros sanitizados do worker que o parser
  mobile não admitia. A consulta descartava envelopes `FAILED` legítimos,
  mantendo a observação remota anterior.
- Consulta e cancelamento validavam o shape, mas não vinculavam o receipt ao
  `remoteJobRef` conhecido nem à versão persistida da tentativa. Uma resposta
  válida de outro job podia alterar a tentativa ou confirmar cancelamento.

Os testes foram escritos antes do runtime: três suítes, 45 testes, sendo 23
vermelhos e 22 aprovados. Reproduziram rejeição dos seis códigos, observação
indevida e cancelamento indevido. Após a correção, os 45 passaram, incluindo
os cenários preexistentes de coalescing e recuperação com a mesma chave.
A revisão final acrescentou um teste inicialmente vermelho para `404` em
tentativa de versão incompatível: o recovery podia reenviar bytes antes de
rejeitar o receipt. O filtro por gateway e versão agora impede consulta/replay
dessa tentativa. A suíte focalizada final inclui 46 testes.

## Implementação e contratos preservados

O parser fechado admite exatamente os códigos já publicados:
`ocr-invalid-media`, `ocr-invalid-response`, `ocr-unavailable`,
`translation-invalid-request`, `translation-invalid-response` e
`translation-unavailable`. Não aceita erro arbitrário, mensagem, texto OCR
ou resposta bruta do provider. O enum de erros locais e seu CHECK SQLite não
mudam; o incremento observa o status remoto, não persiste o erro do provider.

Consulta exige versão compatível e, quando já conhecida, referência idêntica
antes de qualquer mutação. Uma tentativa ainda sem referência pode vincular
o job retornado pela consulta autenticada por sua chave de idempotência,
desde que a versão corresponda. Não cria outra identidade nem upload.
Tentativa cuja versão não corresponde às capabilities é excluída antes da
consulta por job/chave, incluindo o ramo de reenvio após `404` confirmado.
Cancelamento exige sempre referência e versão correspondentes; incompatibilidade
retorna `cancellation-unavailable` sem confirmação, observação ou marcação
`CANCEL_PENDING`. Uma falha de rede continua ambígua como antes.

Fontes/testes:

- [Contrato e allowlist](../../../../../src/entities/remote-processing-attempt/model/remoteProcessingAttempt.ts).
- [Testes do envelope](../../../../../src/entities/remote-processing-attempt/model/__tests__/remoteProcessingAttempt.test.ts).
- [Recovery](../../../../../src/features/start-remote-processing/model/startRemoteProcessing.ts) e
  [regressões](../../../../../src/features/start-remote-processing/model/__tests__/startRemoteProcessing.test.ts).
- [Cancelamento](../../../../../src/features/cancel-remote-processing/model/cancelRemoteProcessing.ts) e
  [regressões](../../../../../src/features/cancel-remote-processing/model/__tests__/cancelRemoteProcessing.test.ts).
- [Contrato público existente](../../../../../../api/apps/translation-gateway/openapi/translation-gateway-v1.yaml).

FSD: contrato na entity existente, ações nas features existentes, sem importação
horizontal, slice novo ou mudança de barrels. Sem UI nova, textos ou traduções
de interface. Não há schema, migration, repository ou contrato HTTP novo:
SQLite v9, PostgreSQL V1–V4 e manifestos `1.0` permanecem intactos.

## Validação

Comando focalizado em `mobile/`:

```bash
./node_modules/.bin/jest --ci --runInBand --runTestsByPath \
  src/entities/remote-processing-attempt/model/__tests__/remoteProcessingAttempt.test.ts \
  src/features/start-remote-processing/model/__tests__/startRemoteProcessing.test.ts \
  src/features/cancel-remote-processing/model/__tests__/cancelRemoteProcessing.test.ts
```

Gates executados nesta parcela, sem reinstalar dependências:

| Verificação                                            | Resultado corrente                                                                                                                  |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Jest focalizado                                        | três suítes, 46 testes aprovados na rodada final                                                                                    |
| `mobile/`: `pnpm check`                                | exit 0; 114 suítes/782 testes Jest, 30 performance, 24 SDD e seis boundaries; TypeScript, ESLint, FSD, links e formatação aprovados |
| `web/toonlira/`: `./node_modules/.bin/tsc -b`          | exit 0                                                                                                                              |
| Confronto da allowlist com OpenAPI                     | 23 códigos em cada lado; nenhuma ausência ou extensão                                                                               |
| `api/`: `./mvnw -o -q test`, com Docker/loopback local | exit 0; gateway com 43 relatórios/295 testes, zero falhas, erros ou skips; PostgreSQL 17 e V1–V4 validados                          |

A cadeia mobile foi reexecutada integralmente após o filtro de versão; a
primeira rodada tinha 781 testes e a final 782. Após estabilizar a evidência,
SDD/links, formatação direcionada e `git diff --check` foram revalidados.
As referências correntes de checksum foram renovadas, sem alterar verdicts,
checkboxes ou conclusões históricas de outras features.

O type-check focalizado inicialmente apontou `headers: {}` em dois novos mocks;
os mocks passaram a usar `Headers`, sem cast ou mudança de contrato. Avisos `act`
preexistentes não foram corrigidos fora do escopo. Testes funcionais não
comprovam qualidade de tradução nem medições nativas.

## Performance, privacidade e pendências

Aplicada `mobile-performance`/MOB-DEC-007 proporcionalmente ao impacto: duas
comparações constantes depois do parser já limitado pelo transporte, nenhuma
requisição, retry, cache ou fila adicional. Recovery coalescido e donos de
cancelamento separados foram preservados nos testes. Jest não é medição
física/nativa; nenhuma afirmação de ganho ou ausência de regressão em aparelho.

Fixtures são sintéticas, sem ADC, arquivos privados, rede Google ou tradução
real. Nenhum log com conteúdo remoto foi adicionado. Downloads, promoção/gravação
do resultado local, retorno/ACK, qualidade independente e operação continuam
pendentes. Não se habilitaram gateway, uploads, worker cloud ou tradução.

Snapshot técnico do gateway revalidado, sem alterações nesta parcela: 180 arquivos,
`e5c89f79c460b4d5b0a482aed1e72f4875b108ead5527b0469f785c6aa9d8c98`.
Checksum mobile não comprova cobertura Java; somente referências correntes
SDD são rebaseadas, sem renovar conclusões históricas de outras features.
