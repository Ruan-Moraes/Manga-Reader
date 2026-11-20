# Review — MOB-FEAT-023

- Spec revisada: `spec.md`
- Implementação/revisão: commit 5a93c040f36dc0c942e09d8bdb4af0de18fc2375
- Gate na entrada do planejamento: `open`
- Dependências verificadas: `MOB-FEAT-022` em `verification-pending`
- Verdict: `verification-pending`

## Findings

- **Média — ponta a ponta no app não executada.** Faltam o Android e as URLs assinadas do GCS, como na 021 e na 022. O mesmo fluxo foi validado pelo gateway-tester contra o gateway real, com a memória apagada antes de cada
  página. Ver `api/apps/translation-gateway/docs/architecture/chapter-memory.md`, "Validação real":
    - lotes `b8q6` (com glossário) e `i8wn` (sem);
    - 3 inconsistências de nome caem para 0.
- **Baixa — nomes comuns no glossário.** A revisão do gateway também lista palavras comuns com maiúscula
  ("Gentlemen", "Aquí"). Elas agora duram o projeto inteiro. O filtro continua sendo o do gateway; o app só guarda o
  que o resultado reporta.
- **Informativo — disclosure.** O texto mudou nos três idiomas e a versão local foi para `2026-11-20.v1`. A revisão
  jurídica continua pendente antes de produção.

## Critérios e evidências

| Critério | Implementado | Evidência verificada                                                           | Resultado |
| -------- | ------------ | ------------------------------------------------------------------------------ | --------- |
| AC-001   | sim          | `remoteResultCommit.test.ts`: 1.1 e 1.2, primeira decisão, rollback sem termos | pass      |
| AC-002   | sim          | `startRemoteProcessing.test.ts`: `glossary` só com termos                      | pass      |
| AC-003   | sim          | `projectTerms.test.ts`: v12, ordem, limite de 256, cascade e CHECKs            | pass      |
| AC-004   | sim          | `RemoteProcessingPanel.test.tsx` nos três locales                              | pass      |

## Gates

| Comando                                  | Resultado                                                      |
| ---------------------------------------- | -------------------------------------------------------------- |
| `npx jest --pool=forks`                  | pass: 121 suítes, 965 testes                                   |
| `npx tsc --noEmit`                       | pass, salvo o erro já existente de `SessionGate.tsx`           |
| `node scripts/checks/validate-fsd.mjs`   | pass                                                           |
| `node scripts/checks/validate-specs.mjs` | só os checksums divergentes que já existiam em outras features |

## Mudanças fora da spec

- Nenhuma.

## Conclusão

AC-001 a AC-004 passam em testes. Falta a verificação física (TASK-006). Verdict `verification-pending`.
