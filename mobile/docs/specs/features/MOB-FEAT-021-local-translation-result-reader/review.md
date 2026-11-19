# Review — MOB-FEAT-021

- Spec revisada: `spec.md`
- Implementação/revisão: commit 34c4a1e27a9c86e0c90c7a3c3889a172c34ac5a6
- Gate na entrada do planejamento: `open` (aberto em 2026-11-18 por decisão do proprietário)
- Dependências verificadas: `MOB-FEAT-020` em `verification-pending`
- Verdict: `verification-pending`

## Findings

- **Média — ponta a ponta real não executada.** O gateway local não assina URLs de `storage.googleapis.com`, e o
  schema do contrato só aceita esse host. Download, commit e ACK foram exercitados com transporte e arquivos falsos,
  não contra GCS. Fica aberto na TASK-006.
- **Baixa — retry de página com falha.** O botão "Tentar novamente" para `FAILED` continua o da 017, que só
  reenvia página `DRAFT`. Depois de uma falha remota, a página exige a 022 (retry por página). A 021 declara "sem
  retry automático", então isso não é divergência.
- **Informativo — manifesto do render.** O `READY` entrega o manifesto do render `1.1`, não o de tradução 1.0. O
  parser novo (`remoteRenderManifest.ts`) valida o documento real, e a spec registra essa reconciliação.

## Critérios e evidências

| Critério | Implementado | Evidência verificada                                                                 | Resultado |
| -------- | ------------ | ------------------------------------------------------------------------------------ | --------- |
| AC-001   | sim          | `acquireRemoteResult.test.ts` (backoff, estágios) e `RemoteProcessingPanel.test.tsx` | pass      |
| AC-002   | sim          | `acquireRemoteResult.test.ts` (ordem) e `remoteResultCommit.test.ts` (transação)     | pass      |
| AC-003   | sim          | `acquireRemoteResult.test.ts` (abre uma vez) e `RemoteProcessingPanel.test.tsx`      | pass      |
| AC-004   | sim          | `remoteResultCommit.test.ts`: resultado `REMOTE` lido por `getByPage`                | pass      |
| AC-005   | sim          | Resultado em SQLite e arquivo privado, sem rede no leitor (051)                      | pass      |
| AC-006   | sim          | Hash divergente, `FAILED`, `RESULT_EXPIRED`, 404 e rede ausente                      | pass      |
| AC-007   | sim          | `remoteResultCommit.test.ts`: manifesto sem regiões aceito                           | pass      |
| AC-008   | parcial      | RNTL da barra nos três locales; matriz física Android pendente                       | pending   |

## Gates

| Comando                                    | Resultado                                                      |
| ------------------------------------------ | -------------------------------------------------------------- |
| `npx jest --pool=forks`                    | pass: 119 suítes, 941 testes                                   |
| `npx tsc --noEmit`                         | pass, salvo o erro já existente de `SessionGate.tsx`           |
| `node scripts/checks/validate-fsd.mjs`     | pass                                                           |
| `node scripts/checks/validate-specs.mjs`   | só os checksums divergentes que já existiam em outras features |
| `eslint`/`prettier` nos arquivos alterados | pass                                                           |

O `pnpm check` integral não roda neste ambiente: o pnpm exige reinstalação (`enableGlobalVirtualStore` mudou), e o
README proíbe instalar implicitamente.

## Mudanças fora da spec

- `refresh()` no controller de start: recarrega o estado local depois de cada rodada, sem rede.

## Conclusão

O código atende AC-001 a AC-007 em testes. O AC-008 e a ponta a ponta real dependem do aparelho e do GCS. Verdict
`verification-pending`, com a TASK-006 aberta.
