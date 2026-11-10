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
