# Review — MOB-FEAT-022

- Spec revisada: `spec.md`
- Implementação/revisão: commit cbe01c36da794b52c154aca887e128517a26d457
- Gate na entrada do planejamento: `open` (2026-11-18)
- Dependências verificadas: `MOB-FEAT-021` em `verification-pending`
- Verdict: `verification-pending`

## Findings

- **Média — ponta a ponta real não executada.** É a mesma limitação da 021: sem URLs assinadas do GCS no
  ambiente local, a ordem, a janela e o `contextRef` não foram vistos nos logs do gateway com um capítulo real.
- **Baixa — testes da 017 substituídos.** "Envia só a primeira página" e "não passa para a próxima página"
  descreviam a regra que esta spec substitui. Os dois testes foram reescritos para a regra nova: ordem de leitura,
  e falha isolada não para a fila.
- **Informativo — pausa.** A retomada automática depois da meia-noite UTC acontece com o app aberto (timer) ou na
  volta ao primeiro plano. Não há execução em background, que está fora de escopo.

## Critérios e evidências

| Critério | Implementado | Evidência verificada                                                            | Resultado |
| -------- | ------------ | ------------------------------------------------------------------------------- | --------- |
| AC-001   | sim          | `remoteQueue.test.ts` (ordem, janela de 2) e `startRemoteProcessing.test.ts`    | pass      |
| AC-002   | sim          | `startRemoteProcessing.test.ts` (`contextRef` sorteado uma vez e enviado)       | pass      |
| AC-003   | sim          | `remoteQueue.test.ts` (lote de 5); polling só de jobs ativos (`listActive`)     | pass      |
| AC-004   | sim          | `startRemoteProcessing.test.ts` e `remoteQueue.test.ts` (pausa e retomada UTC)  | pass      |
| AC-005   | sim          | Lifecycle (reabrir página) e controller (`retryPage`); cancelamento por projeto | pass      |
| AC-006   | sim          | `remoteResultCommit.test.ts` (projeto continua `PROCESSING`) e "Ler" parcial    | pass      |
| AC-007   | parcial      | `RemoteProcessingPanel.test.tsx` nos três locales; Android físico pendente      | pending   |

## Gates

| Comando                                  | Resultado                                                      |
| ---------------------------------------- | -------------------------------------------------------------- |
| `npx jest --pool=forks`                  | pass: 120 suítes, 957 testes                                   |
| `npx tsc --noEmit`                       | pass, salvo o erro já existente de `SessionGate.tsx`           |
| `node scripts/checks/validate-fsd.mjs`   | pass                                                           |
| `node scripts/checks/validate-specs.mjs` | só os checksums divergentes que já existiam em outras features |
| `TranslationGatewayOpenApiTest`          | pass, com o texto do `info` atualizado                         |

O `pnpm check` integral não roda: o pnpm exige reinstalação, e o README proíbe instalar implicitamente.

## Mudanças fora da spec

- Nenhuma. Os textos do OpenAPI `info`, do `translation-gateway-plan.md` e do `chapter-memory.md` deixaram de
  dizer "primeira página".

## Conclusão

AC-001 a AC-006 passam em testes. AC-007 e a ponta a ponta real dependem do aparelho e do GCS. Verdict
`verification-pending`, com a TASK-006 aberta.
