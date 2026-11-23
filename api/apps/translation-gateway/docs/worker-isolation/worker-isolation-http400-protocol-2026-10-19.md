# Rejeição HTTP 400 e retirada conservadora — 2026-10-19

Consolidação offline registrada em 2026-10-20 UTC, ainda 2026-10-19 em São Paulo.
Complementa o [contrato Spot](worker-isolation-spot-contract-2026-10-19.md).
Não executa cloud nem aprova montagem, worker completo ou renderização.

## Implementação experimental local

O candidato privado `mount-rejection400.eoIzBd` usa contexto CAS5 e observação
`mount-http-rejection-2`, ambos separados dos journals anteriores. Preserva o
status real **400 ou 403**, requestId, URL, hash do corpo e instante; não grava
mensagem ou corpo remoto. Exige dispatch durável anterior e não cria terminal
DONE ou classificação NOT_SENT para uma requisição enviada.

Antes de qualquer DELETE de predecessor, o cleanup confirma a intenção e a
mesma observação no contexto selado, consulta recurso 404/lista filtrada vazia
de operações/recurso 404, espera um segundo e repete a conferência inteira.
Somente então retira predecessores com ownership e IDs comprovados. A VM
ausente não recebe intenção de exclusão inventada.

Se houver recurso/operação inesperada, erro de consulta ou cancelamento, a
limpeza automática para sem apagar os predecessores. Rejeição não persistida
permanece ambígua; ACK perdido depois da gravação permite recuperar a observação
durável. Em ambos os casos, **nenhum segundo POST é autorizado**. Outros status,
como 429/500/503, não viram rejeição comprovada por aproximação.

Isso não migra nem reclassifica o HTTP 400 real da
[quarta tentativa](worker-isolation-fourth-native-attempt-2026-10-19.md).
Seus registros, locks e a evidência da recuperação explícita permanecem intactos.
Não há mudança no PostgreSQL, migrations, contratos ou runtime do produto.

## Testes e proveniência

O teste inicial reproduziu a lacuna antes da implementação: dois casos,
um aprovado e um falho; fontes e TAP preservados em `contract-red.json`, hash
`bc0834fdbef58d217d29b38740205fb8120d9cca807f1184882e1261e726df4f`.

O gate final executou **131 testes, todos aprovados, sem skips/cancelamentos**:

- Contrato Spot, requests e metadata efetiva sem relaxar isolamento.
- Journal Java CAS real local, concorrência, contextos v4/v5 incompatíveis e
  ausência de mutação dos bytes quando o contexto é recusado.
- HTTP 400/403, perda de confirmação antes/depois de persistir, erro bruto não
  consumido e ausência de retry para resultados ambíguos.
- Composição completa com HTTP falso, preempção, drift e retirada segura.
- Interrupção da limpeza diante de recurso, operação na segunda conferência,
  erro de lista e cancelamento; nenhuma exclusão de predecessor nesses casos.

| Artefato             | SHA-256                                                            |
| -------------------- | ------------------------------------------------------------------ |
| `verification.json`  | `eee25475b7d2e785c92f5247a557bc722e5f67e98ec816ed2c09a1527937bee5` |
| `tests-e76e4177.tap` | `ed6e15d4ec72379404911fe23ae3d95b414d3cff572e5ac6dd9d34cb5cb2da8e` |
| `origins.json`       | `33fb06038469381f3cfa93d2f211444e66f74e393d972d484034970354ed086b` |

O verificador revalida 20 origens, cinco arquivos sem mudança de lógica além dos
imports/formatação, o grafo de 42 módulos, os recibos anteriores e o snapshot
técnico de 419 fontes do produto. Recusa backlink aos módulos CAS4 substituídos.
O grafo deste candidato **não contém executor nativo**.

As falhas focais intermediárias também permanecem descritas no plano privado:
um ancestral ainda apontava ao ciclo antigo; depois, a fixture de operações
ignorava o filtro/escopo da requisição. Corrigidos o vínculo e a fixture, sem
relaxar a exigência de lista vazia no guard. O recibo final é posterior a essas
correções, não uma alteração de evidência histórica.

## Regressões do repositório — 2026-10-20

O primeiro `./mvnw -o test` concluiu Core/jobs, mas parou antes dos testes do
gateway por ausência de toolchain 25 na configuração padrão. Não foi falha de
teste nem autorização para baixar JDK/dependências. Esse resultado permanece
preservado; não foi substituído por um recibo verde.

O JDK 25 e o arquivo pessoal de toolchains já preparados foram conferidos. A
nova execução integral `./mvnw -o -t <toolchains.xml existente> test` passou com
Docker local: **2.768 testes, zero falhas, zero erros e 104 skips**. No gateway,
foram 1.297 testes com os mesmos 104 skips. Isso não equivale à execução dos
controles condicionais ignorados nem à aprovação operacional.

| Evidência privada                           | SHA-256                                                            |
| ------------------------------------------- | ------------------------------------------------------------------ |
| Log da primeira execução, sem toolchain     | `4c4fd8b57fed598d9c131c737440d8df8ba34666ca9d8666d7fb169a7d8cdc8f` |
| Log integral com toolchain existente        | `4f94f38c4febab7a4b4ef3f52c1f568c124842b9a43c20bc5f4b9d4306539c7e` |
| Arquivo de toolchains utilizado, inalterado | `dbb7a93ce7a7c796b9ffcb1bfe241f0be908f9ead2b51c78a3348b443f1f00df` |

Type-check web, SDD, links locais e formatação direcionada passaram. O diff
dos documentos deste incremento não tem whitespace inválido. O
`git diff --check` global continua apontando somente a linha em branco
preexistente em `web/landing-page/src/shared/component/PlatformBadge.tsx:44`;
esse arquivo e a auditoria de performance não foram alterados neste incremento.
Não houve alteração no POM, configuração global, defaults ou dependências.

## Estado e avanço necessário

Não houve credencial real, instalação, chamada provider, criação cloud ou nova
reserva. O ledger mantém quatro reservas de USD 5; não é valor faturado.
As cotações/billing antigos estão vencidos e não são cotação Spot.

Próximo incremento: ligar o novo grafo a um runtime/admissão específico do perfil,
testar essa fronteira offline e renovar preços/billing/quota e ausência dos
três escopos anteriores. Somente depois cabe nova prova mount-only, com novo ID
e reserva exclusiva. Não reutilizar executores selados de STANDARD.

A inspeção da admissão histórica confirmou que ela reconstrói o bundle
STANDARD antigo e usa o cenário com SKUs On Demand anteriores. Portanto, a ligação não
se resume a trocar o import do runtime: será necessário vincular admissão ao
perfil Spot e aos hashes reais do bundle v2, recusando cotação Default como
se fosse Spot. A coluna de consumo `Default` também aparece nas SKUs Spot:
o [incremento posterior](worker-isolation-spot-admission-preparation-2026-10-20.md)
registra a distinção por código/descrição/taxonomia. Sem essa fronteira testada, o grafo atual não admite criação
cloud, mesmo com os testes de composição aprovados.

A **020 continua `in-progress/open`; 021 permanece bloqueada**. A prova de
montagem não substitui os gates do worker completo: isolamento no boot,
vulnerabilidades do runtime, memória, execução do renderer, qualidade e
validação operacional ainda exigem evidência própria.
