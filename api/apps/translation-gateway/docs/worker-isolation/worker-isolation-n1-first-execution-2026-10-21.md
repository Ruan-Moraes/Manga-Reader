# Primeira rodada N1/COS73916: retirada sem prova de montagem — 2026-10-21

Continuação da [preparação offline do operador](worker-isolation-n1-operator-2026-10-21.md).
O caminho nativo foi executado, mas **a prova de montagem não foi observada**.
A 020 permanece `in-progress/open`; a 021 continua bloqueada. Não houve VM,
POST Compute, OCR, tradução, instalação, alteração de IAM/API ou ativação de
uploads. Houve criação temporária de bucket privado e envio do archive técnico
previamente aprovado, seguido de retirada restrita.

## Leituras e admissão efetivamente realizadas

- Faturamento: dois GETs HTTP 200 confirmaram projeto vinculado, conta aberta
  e moeda BRL. SDK e fontes permaneceram inalterados; token somente em memória.
  Não foram guardados identificador da conta, resposta bruta ou dados de pagamento.
- Preços: sete linhas de 16 células foram relidas individualmente na tabela
  autenticada do [Console](https://console.cloud.google.com/billing/pricing?project=toonlira-rm),
  atualizada em 21/10/2026. Observação de 16:59:46.249 a 17:02:04.777 UTC;
  validade até 17:59:46.249 UTC. Não houve redatação da cotação histórica.
  A primeira extração vazia foi descartada; todas as linhas completas foram
  verificadas, incluindo célula geográfica vazia das operações globais A/B.
- A prévia local passou com 419 fontes conferidos e estimativa conservadora de
  **USD 2,11**, com as premissas registradas. Não é fatura, cotação completa,
  garantia tributária ou teto técnico do Google.
- Preflight novo: cinco GETs de 17:02:51.725 a 17:02:54.806 UTC confirmaram
  projeto, metadata herdada vazia, COS73916 não depreciado, máquina e zona.
- Quota: dois GETs posteriores confirmaram os limites necessários, sem garantir
  capacidade. Os 33 alvos das três rodadas anteriores foram confirmados ausentes.
- Somente depois dessas verificações houve reserva de USD 5, vinculada ao novo
  run ID e ao hash do plano, e admissão da composição concreta.

`approved-finance.json` foi criado como entrada operacional privada, com hashes
dos novos recibos. Não houve alteração dos fontes selados ou de seus gates.

## Rodada real e falha conservadora

Rodada privada `mount-check-20261021-54f856b2`, em `mount-n1-operator.xZjwLo`.
O staging criou bucket privado, enviou 62.359.506 bytes e confirmou o hash do
archive por leitura. O checkpoint passou a `delivered`. Em seguida a composição
retornou `staging-cycle-unconfirmed`; o operador terminou com exit 2,
`requiresRecovery=true` e quiescência confirmada. Os 419 fontes continuaram iguais.

O recibo contém 57 requisições da composição: dois POSTs de Storage, todos os
demais métodos GET. **Zero POST Compute**. O journal Compute foi selado com
somente o intent `network`, sem dispatch, handle ou terminal. Sua interpretação
`insertNotSent` decorre desse journal, não de presumir ausência a partir de um
contador ou de fabricar resposta Google. Não foi criado terminal remoto.

Não se reaproveitou o run ID nem se repetiu a criação. O lock original e todos
os recibos permanecem preservados. O código sanitizado não identifica qual
predicado interno recusou a preparação; a causa exata continua em investigação.

## Recuperação concluída

O candidato privado `mount-n1-storage-recovery.ffLkkL` reutilizou o contrato de
retirada parcial e o journal Storage da própria rodada. Antes dos DELETEs:

- verificou os hashes de falha, eventos, source e Compute, a reserva existente,
  os contratos e a reconstrução exata do bundle N1;
- exigiu journal selado sem dispatch, ausência dos oito nomes Compute e duas
  consultas vazias de operações pelo request ID do intent;
- limitou a autoridade por método e hash da URL, sem permissão de criação ou
  exclusão de recursos Compute;
- validou projeto, labels, geração/metageração e bucket sem outros objetos.

A primeira preparação da recuperação falhou **localmente, com zero requisições**:
a ordem de inserção das propriedades diferia da usada no hash do bundle original.
A revisão `recover-v2.mjs` preservou o primeiro código/recibo e reconstruiu a mesma
ordem do contrato, sem relaxar o hash ou alterar journals anteriores.

A revisão concluiu com **52 requisições: 50 GETs e dois DELETEs condicionais**,
zero POSTs e zero reservas novas. Os quatro ciclos de verificação das dependências
passaram. Objeto e bucket não estão ativos; os nomes Compute continuam ausentes.
Bytes de source/Compute e lock original foram preservados. Soft delete de sete
dias continua aplicável: ausência ativa não é confirmação de remoção física.

Conforme `database-design`, foram usados somente recibos locais privados,
ledger em centavos e journals CAS existentes. Nenhum schema, migration, índice,
contador ou cache de produto foi criado.

## Hipótese reproduzida, ainda não diagnóstico nativo

Em `mount-n1-ticket-diagnostic.nDARSE`, dois testes exercitaram o driver existente
com CAS Java real local, relógio por tempo transcorrido e HTTP/identidade falsos:

| Cenário sintético              | Resultado                                         |
| ------------------------------ | ------------------------------------------------- |
| Sem atraso adicional           | Um POST falso; operação associada ao journal      |
| 550 ms por snapshot do journal | Nenhum grant/POST; intent selado como não enviado |

O ticket atual tem validade de um segundo; leituras acumuladas depois da sua
preparação podem provocar a recusa observada. O experimento demonstra esse
mecanismo, **não comprova que foi a causa da rodada real**. Não houve aumento
de timeout, remoção de guard, alteração do contrato ou ajuste de produção.

Próximo trabalho: identificar o predicado por replay/diagnóstico sanitizado,
incluindo tempo entre preparação e dispatch, e corrigir a composição caso a
causa seja confirmada. Nova tentativa precisa de nova admissão, reserva e run ID;
não há retomada automática da rodada encerrada.

## Orçamento e rastreabilidade

O ledger passou de quatro para **cinco reservas de USD 5: USD 25 reservados**.
Restam USD 60 na parcela normal não reservada; o restante do limite de USD 100
inclui as provisões históricas e contingência. Esses números são controle
conservador local, **não gasto faturado, saldo bancário ou hard cap**. A reserva
da tentativa não foi estornada automaticamente após a limpeza.

| Recibo privado          | SHA-256                                                            |
| ----------------------- | ------------------------------------------------------------------ |
| Cotação nova            | `79f0e563f68c6659e896b406a5fdeae5feb7ac41102d841fc1d6747af0a4e137` |
| Faturamento novo        | `8100cebd716e52860c327ff4c0e542279d77be1c4591ff0e1011f04b16e23343` |
| Falha nativa            | `8b5f36de72e1d3b71c973387d83eeabd007c05c285771884e72536a2c6458531` |
| Recuperação completa    | `82215f0bc6780ba4d2753369180f2c83090dd1093fe827412ac08ea34c367208` |
| Confirmação de retirada | `1804ef1b07629947b72c2d3b3d00424429fdb8245f1feef5346e0faef32159fc` |
| Regressão final         | `9eff6717749c833ae4226e34ecacfd874c4298b01d2011efe7ab12f53a709737` |
| Auditoria local final   | `0d0d5b7b3ff6fefc565a7a3774ac31023a936d66305ba559c89f5d9181d79c87` |

Os testes de leitores financeiros passaram em 92 casos; recuperação parcial e
política restrita, em 21; o diagnóstico de latência, em dois. São testes locais
com fixtures sintéticas, distintos das observações cloud acima. Maven global,
type-check web e `pnpm check` aprovados no snapshot anterior do mesmo dia não
foram apresentados como prova de operação cloud. Não houve alteração Java,
mobile ou dos arquivos de auditoria de performance nesta execução.

A regressão final combinada passou em **102 testes**, sem falhas, skips ou
cancelamentos, sob bloqueador de HTTP/CLI reais. Inclui os testes anteriores do
operador; não representa 102 cenários novos. A auditoria local reconferiu 133
fontes do tooling e, separadamente, os 419 fontes do gateway. Confirmou os hashes
de source/Compute preservados e a recusa de uma nova aquisição pelo lock existente,
sem criar arquivos de rodada. Os 229 links relativos e a formatação/diff dos
documentos alterados passaram. O diff global continua vermelho somente pela
linha em branco preexistente em `PlatformBadge.tsx:44`, fora do escopo.

A cotação registrada já expirou ao encerrar a auditoria local; é evidência da
janela original, não admissão para nova execução. Uma futura tentativa exige
renovar os insumos expirados, além de resolver o diagnóstico e validar novamente
a ausência do escopo desta rodada. Não apagar o lock para contornar esses gates.

Boot, runtime/CVEs, isolamento do processo nativo, memória do worker completo,
renderização, qualidade e retenção continuam abertos. Mesmo uma futura prova
mount-only bem-sucedida não concluirá a 020.

## Continuação do diagnóstico

A [correção local de dispatch](worker-isolation-dispatch-freshness-2026-10-21.md)
registra o defeito reproduzido e sua revisão, preservando esta evidência histórica
e distinguindo dados atuais, fixtures e a próxima prova cloud ainda pendente.
