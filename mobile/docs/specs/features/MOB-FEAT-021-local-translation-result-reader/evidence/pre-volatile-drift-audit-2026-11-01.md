# Histórico anterior à revisão volátil — MOB-FEAT-021 / drift-audit.md

> Fotografia preservada em 2026-11-01. Este registro descreve o desenho
> substituído, inclusive seus estados, conclusões e restrições da época. Não é
> contrato vigente nem evidência de implementação do processamento em memória.
> Contrato atual: [spec](../spec.md). Os materiais de prova citados são históricos.

# Drift audit — MOB-FEAT-021

- Data: 2026-10-26
- Implementação auditada: working-tree sha256:640b79285c9494534ee21b64e3df6ccb7d4f9b3f7dd5402650cd2032965d7b17
- Status da feature: `implemented`

## Escopo auditado

Spec revisada por decisão humana, tasks, review, coverage, parser/arquivos/SQLite,
foreground polling, widget e leitor unificado. Dependências em verificação são
admitidas pelo AGENTS.md atual; orientação antiga da skill não altera esse contrato.

## Divergências

| Severidade | Evidência                                              | Classificação             | Ação                      |
| ---------- | ------------------------------------------------------ | ------------------------- | ------------------------- |
| —          | runtime, contratos, dependências e paths classificados | sem divergência conhecida | conservar escopo e status |

## Contadores derivados

- `mismatch`: 0
- `undocumented`: 0
- arquivos runtime descobertos: 0
- caminhos obsoletos: 0
- violações de gate: 0

## Fechamento da verificação

TASK-009/AC-008 concluídos por matriz física, foco visível e confirmação humana
de fala/gestos/Ver original. TalkBack desligado e estado conferido por ADB.
Limites documentados: não prova retorno específico ao controle de origem, áudio
gravado nem build release. Nenhuma task aberta na 021.
`pnpm check` completo passou: 121 suítes, 953 testes, com specs/tipos/lint/FSD/format verdes.
Nenhuma evidência histórica da 020 ou de outras specs é promovida por este piloto.
