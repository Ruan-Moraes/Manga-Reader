# Contrato Spot offline — 2026-10-19

Fotografia de implementação experimental local, concluída em
2026-10-20 00:12:36 UTC (2026-10-19 em São Paulo). Não é aprovação operacional
nem execução da VM ou do worker.

## Parcela entregue

O candidato privado `mount-spot-contract.8bOFxK` exige o perfil explícito
`e2-micro-spot-mount-v1`. O bundle v2 vincula perfil e hashes dos corpos reais.
O request usa `SPOT`, ação `DELETE` e duração máxima de 600 segundos, omitindo
opções de manutenção/restart configuradas automaticamente pelo serviço. A
resposta efetiva continua exigindo `TERMINATE` e restart desligado; os demais
guards de isolamento permanecem obrigatórios.

O grafo de composição tem 42 módulos e **não contém executor nativo**. Treze
arquivos copiados não mudaram de lógica: a comparação reproduzível aceita
somente reescrita de imports e a mesma formatação. Os contextos anteriores
continuam recusados sem migração ou alteração dos bytes.

## Evidência

- TDD inicial: 8 casos, 2 aprovados e 6 falhos; fotografia de fontes preservada
  em `contract-red.json`, SHA-256
  `84e1f9eae0180c4dba8d671402f96a22cd4716d626052709e6a777f080560339`.
- Consolidação: **95 casos aprovados, zero falhas, cancelamentos ou skips**.
  Inclui contratos, metadata estrita, CAS real local, composição com HTTP falso,
  preempção simulada, cleanup e ausência de segunda criação.
- `verification.json`: SHA-256
  `9d37737b168426989ab8d5c14e8b0baabc9472dd2d048d98568ead99b9460697`.
- TAP `tests-b99f04f4.tap`: SHA-256
  `03bd20d2784940b38537a4735102d67fc8d4bb1815f610000124a12249ee6298`.
- Snapshot técnico do produto revalidado: 419 arquivos, SHA-256
  `1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`.

O primeiro preflight da consolidação parou antes dos testes: o Prettier em
stdin respeitava o ignore de `.local`, diferentemente da formatação direcionada.
Foi alinhada apenas a invocação com `--ignore-path /dev/null`; a comparação
estrita de proveniência foi mantida. Não houve relaxamento dos guards cloud.

## Limites e próximo bloqueio

O estado abaixo é a fotografia do candidato CAS4 acima. A
[revisão posterior HTTP 400](worker-isolation-http400-protocol-2026-10-19.md)
fecha a lacuna **offline**, em outro grafo CAS5; a ligação nativa continua
pendente. Os recibos e resultados do candidato original não foram alterados.

HTTP 400 continua sendo uma **lacuna funcional explicitamente testada**, não
um comportamento aprovado: o candidato preserva dispatch e exige recuperação,
sem converter 400 em 403, NOT_SENT ou operação DONE. A próxima revisão deve
registrar o status real e confirmar ausência repetida de recurso/operação antes
de retirar predecessores, preservando os journals antigos.

Não foram usadas credenciais, criados recursos ou feitas novas reservas.
O ledger mantém quatro reservas de USD 5; isso não é gasto faturado.
As fontes antigas de preços/billing venceram em 2026-10-19 às 23:44 UTC e não
podem admitir nova execução nem servir como cotação Spot.

Depois da correção HTTP 400 ainda faltam gates integrais do novo grafo,
preço/quota/admissão atualizados e prova mount-only real. O worker completo
continua com validações próprias de isolamento, runtime, memória, renderização
e qualidade. **020 permanece aberta e 021 bloqueada.**

Ver [plano de perfil compatível](worker-isolation-compatible-profile-plan-2026-10-19.md)
e [tentativa anterior e retirada](worker-isolation-fourth-native-attempt-2026-10-19.md).
