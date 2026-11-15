# Tasks — MOB-FEAT-067

- Spec: `spec.md`
- Status da spec no planejamento: `approved`
- Gate no planejamento: `open`
- Dependências implementadas: `MOB-FEAT-017` e `MOB-FEAT-055`, ambas `verification-pending`

## Rastreabilidade

| Critério | Tasks              | Evidência planejada                                                                                                                                    |
| -------- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| AC-001   | TASK-001, TASK-002 | `ChapterBatchPanel.test.tsx`: controller falha na montagem e responde na nova consulta; seleção igual, botão ativo, mensagem ausente.                  |
| AC-002   | TASK-001, TASK-002 | `ChapterBatchPanel.test.tsx`: consulta pendente deixa a ação indisponível com texto de verificação; segunda falha devolve a ação.                      |
| AC-003   | TASK-003           | Teste com refocus simulado (`useScreenRefocus`) consultando uma vez; simulador com gateway desligado e religado.                                       |
| AC-004   | TASK-001, TASK-002 | Testes sem ação para `quota-exceeded`, lote em execução, outro lote e lote interrompido; `batchController.run` não chamado e consentimento não pedido. |
| AC-005   | TASK-002           | Chaves nos três `remoteProcessing.json`; consulta por papel `button` e nome no teste.                                                                  |

## Checklist

- [x] TASK-001 — Em `widgets/remote-processing/model/useChapterBatch.ts`, expor `retryCapabilities` e um estado de verificação. Refazer só `startController.initialize` com `AbortController` próprio, sem chamadas concorrentes. Em sucesso, atualizar capabilities e limpar `capabilities-unavailable` de `stoppedBy`. Em falha, manter ou trocar para `quota-exceeded`. Preservar `selected`. Não rodar com lote ativo, outro lote ou lote interrompido. Cancelar ao desmontar.
- [x] TASK-002 — Em `ChapterBatchPanel.tsx`, acrescentar "Tentar novamente" à mensagem de indisponível, exceto para `quota-exceeded` e nos estados bloqueados do AC-004. Durante a verificação, esconder a ação e mostrar o texto de verificação. Criar chaves de ação e verificação em pt-BR, en-US e es-ES.
- [x] TASK-003 — No refocus do painel, chamar `retryCapabilities` uma vez quando as capabilities estiverem indisponíveis e nenhum lote estiver em execução, junto do `reload` existente.
- [x] TASK-004 — Escrever os testes da matriz acima e atualizar `coverage.json` para apontar `useChapterBatch.ts`, `ChapterBatchPanel.tsx` e os locales para `MOB-FEAT-067/AC-*`.
- [x] TASK-005 — Rodar os testes de `src/widgets/remote-processing`, `pnpm typecheck`, `pnpm lint:fsd`, Prettier nos arquivos tocados e `pnpm specs:check`.
- [x] TASK-006 — Verificar no simulador: gateway desligado mostra a ação; religado, "Tentar novamente" e a volta do leitor liberam o botão. Feito em 2026-11-13 com o gateway apontado para um endereço que recusa conexão: a mensagem com "Tentar novamente" aparece, "Traduzir" fica desativado e uma nova falha devolve a ação. O caminho de sucesso (gateway voltando com a tela aberta) não dá para reproduzir no simulador, porque o endereço só muda ao reiniciar o Metro; fica coberto pelos testes de AC-001 e AC-003.

`implemented` exige todos os checkboxes concluídos. Se só a TASK-006 ficar aberta, usar `verification-pending`.

## Riscos e bloqueios

- `pnpm specs:check` já falha antes desta feature por checksums de reviews anteriores e por `BatchStatusStrip.tsx` sem coverage. Esses erros não são desta spec e não devem ser corrigidos aqui.
- `startController.initialize` também reconcilia tentativas ambíguas na montagem. A nova consulta não deve repetir a reconciliação nem reenviar páginas.

## Evidência parcial — 2026-11-13

- `ChapterBatchPanel.test.tsx` cobre AC-001 a AC-005 (cinco testes novos); suíte mobile com 170 suítes e 1.301 testes aprovados.
- `pnpm typecheck` e `pnpm lint:fsd` passaram; Prettier limpo nas linhas novas (o restante de `useChapterBatch.ts` já vinha fora do padrão no working tree).
- `validate-specs` sem erros desta spec; continuam os 17 checksums anteriores e `BatchStatusStrip.tsx` sem coverage.
- TASK-006 aberta: o gateway é remoto e não foi desligado nesta sessão, então o estado indisponível não foi visto no simulador.
