# Drift audit — MOB-FEAT-021, aquisição volátil no aparelho

- Data: 2026-11-02.
- Implementação auditada: working-tree sha256:751f485409b07f18d689b9d6ab37b2b133be8503c09c2e2ca570a8c5ac7bf1d3
- Status: `verification-pending`; gate: `open`.
- Verdict: `verification-pending`.

| Item                                           | Classificação               | Resolução/evidência                                                                       |
| ---------------------------------------------- | --------------------------- | ----------------------------------------------------------------------------------------- |
| URL/poll/ACK no consumidor antigo              | código divergente corrigido | consumidor sem rede; helpers/schema retirados de runtime, fixtures históricas preservadas |
| Foreground retomado durante COMMIT abandonado  | código divergente corrigido | regressão red/green, um take/commit, retomada local ready                                 |
| Corrupção/I/O indeterminado                    | código divergente corrigido | invalidação somente da própria linha corrompida; I/O preserva verdade durável             |
| Reconciliação concorrente com aquisição        | código divergente corrigido | lease no slice local e teste de leitura fresca após commit                                |
| Progresso antes de posse da entrega            | código divergente corrigido | inicial -1, callback após take/binding, dois marcos confirmados                           |
| Prova física/lifecycle/offline/accessibilidade | verificação real aberta     | TASK-007; Jest/Node/SQLite não comprovam Expo/aparelho                                    |

No escopo técnico021: mismatch=0,undocumented=0,arquivos runtime sem mapa=0.
Coverage individual inclui a lease; testes/helper e review independentes estão
classificados. Nenhum schema/enum/migration novo; preservação de resultados
legados confirmada sem reativar transporte1.0. Plano criado após dependências
executadas e gate documental verde, sob autorização sequencial DEC-008.
`pnpm check` passou integralmente; governança final é revalidada após este registro.

## Integração da pilha do gateway — 2026-11-21

A pilha `feat/glossary-names-and-reader-fade` (commit `f0a6eb01`) implementou a 021 sobre o contrato armazenado (v1):
acompanhar o job até READY, baixar resultado e manifesto por URL assinada, gravar e confirmar (ACK), na feature
`acquire-remote-result`. Na integração com a branch do PR, essa implementação foi substituída pela do PR sobre o
contrato volátil (v2), `acquire-remote-translation-result`, que recebe página e manifesto na mesma resposta. O que
a v1 da pilha acrescentava e continua valendo foi levado à v2: o leitor parcial (página sem resultado mostra o
original, atualização a cada 4 s), o manifesto 1.2 e os termos do capítulo (MOB-FEAT-023). O registro anterior
continua no histórico (`git show f0a6eb01:mobile/docs/specs/features/MOB-FEAT-021-local-translation-result-reader/<arquivo>`).
