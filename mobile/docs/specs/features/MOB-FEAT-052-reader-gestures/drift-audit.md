# Drift audit — MOB-FEAT-052

- Data: 2026-09-09
- Implementação auditada: working-tree sha256:751f485409b07f18d689b9d6ab37b2b133be8503c09c2e2ca570a8c5ac7bf1d3
- Status: verification-pending

## Auditoria

Spec aprovada, implementação, testes, barrels, cobertura e isolamento remoto conferidos.
Nenhum gate bloqueado foi ultrapassado. MOB-FEAT-009 continua histórica quanto ao
v2; MOB-FEAT-052 refina seu envelope para v3, preservando o contrato remoto.
MOB-FEAT-051 continua responsável pelas viewports; este refinamento governa chrome,
gestos e preferências. As pendências nativas anteriores não foram fechadas.

| Divergência       | Evidência                   | Ação                                           |
| ----------------- | --------------------------- | ---------------------------------------------- |
| Nenhuma conhecida | testes e inspeção de código | manter TASK-006 aberta para verificação nativa |

- mismatch: 0
- undocumented: 0
- arquivos runtime descobertos: 0
- violações de gate: 0

## Pendências

Matriz nativa, execução física de gestos e frames/memória em 10/67/200 imagens.
Formatação global preexistente permanece fora do escopo. Ver review.md e evidência.

Rebase C06 (2026-09-12): referência global recalculada para a árvore local com recuperação compartilhada. Escopo (arquivo externo: `perfomance_app/mobile/docs/active/performance-evidence/recovery-2026-09-12/review.md`). Não altera verdict nem valida implementações locais de outras tarefas ou medições físicas.

## Regressão de 2026-11-11

O teste de interação cobre a substituição da viewport paginada enquanto há movimento, incluindo descarte de eventos tardios e recuperação por toque. A reprodução física do relato Android permanece pendente.

No emulador Android API 37, o modo paginado recuperou as duas barras por toque. As setas funcionaram após rolar uma página alta e bloquear/desbloquear o emulador. A reprodução da falha original em aparelho físico permanece pendente.
