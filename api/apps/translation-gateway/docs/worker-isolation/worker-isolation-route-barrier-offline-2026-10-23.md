# Barreira de rotas: redução de latência offline — 2026-10-22/23 UTC

Continuação da [sétima prova restrita](worker-isolation-serial-reservation-2026-10-22.md).
Foi reproduzida uma recusa de prazo com latência controlada e preparado um
candidato que mantém os mesmos predicates, sem aumentar timers. Nenhuma chamada
cloud, credencial, instalação, novo recurso ou reserva financeira neste incremento.

## Reprodução e alteração

O teste usa CAS Java real e uma rota removida confirmada, com HTTP e identidade
sintéticos. Com GETs de 1.200 ms, o predecessor recusa a VM em `route-barrier`,
antes do ticket, sem POST. O candidato envia exatamente um POST sintético.
Controle sem latência também passa. Não se conclui que timeout tenha sido a
causa exclusiva da recusa histórica; a captura não guarda a causa bruta.

Cada lado da barreira agora consulta rede e ausência da rota em paralelo,
aguardando os dois resultados. Dentro do escopo, listas de rotas e routers
independentes são consultadas em paralelo; a paginação de cada lista continua
sequencial e integral. Permanece a ordem: fronteira inicial → escopo completo
→ fronteira final → reconferência dos journals. Nenhuma observação é cacheada.

Prazos preservados: I/O/preparação de dez segundos, driver de 30 segundos e
ticket de 1.000 ms. Corpo de resposta limitado, filtros de rede e predicates
de identidade/posse permanecem. Resposta inválida, rota reaparecida, rede
trocada, router inesperado ou journal alterado continuam impedindo criação.

## Vida útil e integração

O transporte de rotas mantém uma chamada pública ativa, com fan-out interno
limitado. O helper de prazo mantém capacidade e trabalho privado registrados
até o settlement, mesmo após devolver timeout/cancelamento. O cancel de bodies
também é aguardado; cancelamento de um irmão não autoriza ignorar outro iniciado.

O candidato foi ligado ao grafo local completo: runtime, composição, supervisor,
handoff, leitores, ciclo, HTTP, driver e transporte de rotas. Antes do cleanup,
o ciclo fecha os clientes e aguarda seu settlement. Não há CLI de provisionamento
nesta preparação. Operadores e recibos anteriores permanecem imutáveis.

Sem alteração em banco, migrations, valores financeiros, produto Java, APIs,
defaults, imagens reutilizáveis ou arquivos de performance. A preparação fica
em diretório privado ignorado pelo Git; esta documentação contém só o resumo.

## Testes

O gate foi executado de 2026-10-22 23:59:12.010 a 2026-10-23 00:01:56.583 UTC:
**58/58 testes**, zero falhas/skips/cancelamentos, 184 fontes reconferidas,
blocker de rede/credenciais ativo e ledger original inalterado. O controle
sequencial com latência recusou sem POST; o candidato enviou uma única criação
sintética, sem cancelamentos, mantendo os limites de concorrência.
As suítes cobrem leituras pareadas, todas as páginas/filtros, siblings com falha,
body/cancel pendentes, capacidade, fechamento, dados inválidos e alterações entre
fronteiras; conservam regressões de ticket, CAS/grant, cancelamento e erro HTTP.

O fluxo completo usa storage/CAS e leitor financeiro real sobre uma cópia
temporária do ledger, com identidade, preços e HTTP falsos. Cobre sucesso com
retirada, HTTP 400, upload com confirmação perdida e controle sem serialização
financeira. Não testa qualidade de renderização ou um worker operacional cloud.

Duas execuções de tempo real tiveram durações anormais e encerraram sem aprovar
o candidato. Foram registradas como tentativas não aprovadas; a causa desses
intervalos não foi estabelecida. A fixture de UTF-8/JSON inválidos foi corrigida
para encerrar o body, separando erro de parsing de stream propositalmente aberto.
Nenhum teste foi removido ou marcado como skip para obter resultado verde.

A auditoria posterior reconferiu o gate e o grafo selecionado de 52 fontes do
runtime. Os caminhos de criação anteriores não estão alcançáveis nesse grafo;
isso não equivale a teste nativo. Os 419 fontes do produto continuam iguais à
fotografia auditada, separadamente do checksum deste tooling.

| Recibo privado     | SHA-256                                                            |
| ------------------ | ------------------------------------------------------------------ |
| Gate offline       | `648c6a506cbd929295d44131681c14ea0695aaf21c3c21994e0df74aaf20b7c0` |
| TAP do gate        | `bf0a65f13e18b35163295c00d5dadc3e1d1ce0dd4397a0075cb480617adbcede` |
| Auditoria do grafo | `8d56358dc0b87ca8964a2bda3c6107b5868ef3e6ad33c50f99c07902c15bd294` |
| Grafo selecionado  | `484b2540d42e2a1e3a1cf507e666a0122541eb93ba8ffce0bda9a112a9da0530` |

Type-check web e `pnpm check` mobile completo passaram novamente. Maven global
offline com Docker terminou em 2026-10-23 00:05:23.983 UTC, exit 0 e
`BUILD SUCCESS`. Foram usados os JDKs e toolchains já instalados; Docker e as
três imagens necessárias já estavam presentes. Nenhuma dependência foi instalada.

Os logs e recibos separados foram salvos no mesmo diretório privado. O Maven
teve SHA-256 de log `5368c3a573817fd8df14005a1ca1637268ff51bc91b11ab4c116567539504b47`;
mobile `e443afc7dd4ce87714916d80994e38a69fdbe530217e8cd432efe5bd281c0477`.
Não houve nova validação linguística, de qualidade ou operação cloud.

## Próximos gates

Conferir recibo e grafo selecionado, gates locais/globais aplicáveis e preparar
outro operador com a ausência da sétima rodada também obrigatória. Cotação e
billing precisam estar válidos; os dados financeiros da rodada anterior já
expiraram. Não redatar recibos nem reutilizar contextos/operadores antigos.

O ledger continua com sete reservas, USD 35 reservados; não é gasto faturado.
020 permanece `in-progress/open`, 021 `approved/blocked`. Montagem nativa,
boot, segurança/CVEs, memória, isolamento, rendering/qualidade e retenção do
worker completo continuam abertos. Não substituir esses gates pelo teste do
operador; não habilitar uploads, providers ou deploy.

O [operador integrado posteriormente](worker-isolation-route-operator-native-2026-10-23.md)
preserva este snapshot offline e exige reconferência da última rodada retirada
antes de nova reserva. Não converte este gate em evidência de montagem cloud.
