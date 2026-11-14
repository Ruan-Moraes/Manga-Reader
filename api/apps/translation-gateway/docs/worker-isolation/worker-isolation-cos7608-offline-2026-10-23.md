# COS 7608: revisão explícita offline — 2026-10-23 UTC

Continuação da [recusa por depreciação](worker-isolation-route-operator-native-2026-10-23.md).
Este incremento prepara código e testes locais para a substituta observada.
Não criou recursos, baixou/instalou imagem ou usou credenciais. A 020 permanece
`in-progress/open`; a 021 permanece `approved/blocked`.

## Pin e isolamento histórico

Imagem concreta `cos-125-19216-760-8`, ID `671750716531408064`, projeto público
`cos-cloud`, arquitetura `X86_64`, disco de 10 GiB. O pin aponta ao recibo
observado às 00:23:19.178 UTC, SHA-256
`c309fdca5b8a0fa8f057cd3089ca8ab48300a755683a7c439389dedea8c06da5`.
Não há resolução por família/latest, fallback ou troca automática pelo campo
`replacement`. A observação de metadados não comprova segurança ou boot.

O plano antecedeu o código conforme `database-design`: nenhum schema, banco,
migration, índice, contador ou cache novo. O ledger não foi alterado. Os
journals CAS5 continuam vinculados ao hash integral do bundle; a revisão usa
binding e autorização de preflight próprios. Os journals das duas imagens
recusam adoção mútua sem reescrever bytes. Escopos retirados continuam usando
seus validadores históricos, nunca contratos convertidos para a nova imagem.

O grafo nativo selecionado mantém 52 módulos: 25 dependentes do pin receberam
revisão própria e 27 são reutilizados sem alteração. O teste reconstrói o fecho
de imports e verifica o conjunto exato: o pin antigo não pode ser alcançado.
Os fontes dos operadores anteriores e seus recibos permanecem intactos.

Além do preflight, a releitura privada anterior ao POST e o binding posterior
ao boot agora recusam qualquer propriedade `deprecated`, inclusive vazia/nula.
Não foram ampliados os prazos 10 s/30 s, o ticket de 1.000 ms, os grants ou as
permissões. O modo normal continua sem execução do worker completo.

## Testes e evidência

Pacote privado: `.local/worker-isolation/mount-cos7608-offline.Dobk4t/`.
O preflight nativo foi preparado, mas não foi executado. Sua importação e
argumentos/sinal inválidos são exercitados sob bloqueio de rede/CLI.

O RED inicial registrou 72 testes, 15 aprovados e 57 falhas esperadas contra
os contratos da imagem anterior. A primeira passagem após a implementação
teve duas falhas de fixture: plano sem `input` e nome temporário incompatível
com o store CAS. Foram corrigidas sem relaxar o contrato; os 16 testes focais
passaram, incluindo CAS Java real em diretório temporário.

A primeira regressão de rotas registrou 54/58: quatro falhas localizaram
referências de fixtures em diretório incorreto. A correção preservou as
leituras históricas em seus caminhos originais. Quatro cópias intermediárias
de validadores históricos, criadas nesta preparação e sem recibos próprios,
foram removidas; nenhum fonte/recibo antigo foi apagado. A nova execução dos
quatro cenários completos passou: sucesso, HTTP 400, confirmação perdida do
upload e controle negativo de contenção. HTTP, identidade e finanças são
sintéticos; CAS e leitor de reserva usam código real sobre cópia privada.

O primeiro TAP de rotas é exploratório: a formatação direcionada ocorreu
antes de seu término. Não é gate imutável. O gate final deve conferir os
hashes antes/depois da execução integral sobre a árvore estabilizada.

O gate integral encerrou de **00:39:56.368 a 00:42:45.314 UTC**, com
**145/145 testes**, zero falhas, skips ou cancelamentos. Conferiu 186 fontes
antes/depois, os 184 fontes do gate histórico de rotas e os 419 fontes de
produto. Grafo e ledger permaneceram iguais durante a execução. Não houve
credencial real, rede cloud, download, instalação ou reserva nova.

| Evidência privada                          | SHA-256                                                            |
| ------------------------------------------ | ------------------------------------------------------------------ |
| `verification.json`                        | `a560035b1c5692ba05ce02b0e1203fd759db35927386f45709ae659fc39fc01c` |
| `tests.tap`                                | `de77c2d92d8dac2f46b887313d057440d632769c7c3916d61df63f7c09ce6b30` |
| Grafo selecionado de 52 módulos            | `27d1c7e0885067c858f87922389bee516e017555878a47b6511606715c979409` |
| Fotografia técnica do produto, sem mudança | `1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a` |

Reprodução offline, a partir da raiz, em diretório novo de evidência: o pacote
usa `node .local/worker-isolation/mount-cos7608-offline.Dobk4t/verify.mjs`.
Esse comando reserva TAP/recibo com `wx`; não repetir no diretório já selado.
O comando não instala dependências. Fixtures usam o Java 23 existente e o
arquivo técnico local, não páginas ou providers. Importar o preflight não
inicializa credenciais; a execução nativa é ação distinta e não foi realizada.

Os gates globais da [continuação anterior](worker-isolation-route-barrier-offline-2026-10-23.md)
(Maven offline/Docker, type-check web e `pnpm check`) permanecem fotografia
recente com fontes de produto iguais; não foram reexecutados neste incremento.
Formatação e diff dos documentos alterados são gates locais separados. O diff
global ainda aponta somente a linha em branco preexistente em
`web/landing-page/src/shared/component/PlatformBadge.tsx:44`, não alterada aqui.

## Próximo trabalho e limites

Integrar este pacote ao operador novo com as 64 ausências anteriores; manter
as verificações financeiras e a reserva fresca/serial. Antes de qualquer VM,
revalidar metadados atuais e cotação vigente. Não reutilizar o contexto que
foi recusado nem fabricar uma oitava retirada: ele não reservou/criou nada.

Sete reservas reais continuam correspondendo a USD 35 reservados, não ao
consumo faturado. Nenhuma reserva foi acrescentada por testes locais.
Ainda faltam montagem comprovada, revisão de boot/CVEs, memória, isolamento,
rendering/qualidade e retenção/operação do worker completo. Sem providers,
uploads públicos, instalação, IAM/API, deploy, mobile ou arquivos de performance.

Continuação: [operador integrado, prova restrita e recuperação](worker-isolation-cos7608-operator-2026-10-23.md).
Os hashes e conclusões acima permanecem a fotografia offline anterior; não
foram reescritos para representar a execução cloud posterior.
