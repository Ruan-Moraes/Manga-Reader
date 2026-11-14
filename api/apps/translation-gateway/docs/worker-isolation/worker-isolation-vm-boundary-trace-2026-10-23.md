# Diagnóstico passivo da fronteira VM — 2026-10-23 UTC

Continuação do [grafo de escopo VM pareado](worker-isolation-vm-scope-graph-2026-10-23.md).
A 020 permanece `in-progress/open`; a 021 permanece `approved/blocked`.
Este incremento não fez chamadas cloud, reserva, instalação ou download.

## Comportamento implementado

Um trace passivo distingue o escopo final de rede, o journal, a janela de envio,
a guarda/política nativa, a admissão, a invocação do fetch bruto e a validação
inicial da resposta. O snapshot aparece em `runtime.state().dispatchTrace`;
não é impresso em logs nem altera os contratos HTTP públicos.

O helper mantém no máximo 64 eventos imutáveis: ponto/status de allowlist,
sequência, milissegundos monotônicos relativos e booleano de sinal cancelado.
Não recebe texto livre, erro, URL, token, corpo, referência de job ou motivo de
cancelamento. Overflow é explícito; snapshots anteriores não mudam depois.

O vínculo é por referência exata do fetch e run, em WeakMap. O supervisor o
propaga explicitamente ao criar seus wrappers, sem acrescentar callback de
autoridade. O primeiro teste integral identificou a perda desse vínculo nos
wrappers; a asserção foi preservada e a propagação corrigida. Sem vínculo ou
com outro run, o observador é neutro e não mistura evidências.

Esse estado é **somente diagnóstico**: ausência de evento não prova `NOT_SENT`,
posse, quiescência ou ausência de recurso. `rawFetchInvoked=true` significa que
o delegado foi invocado, não que a rede transmitiu bytes ou a API criou algo.
Resposta inicial também não é corpo íntegro, operação terminal ou prova de boot.
O cleanup continua dependendo de seus próprios recibos, autoridade e leituras.

## Verificação

Gate consolidado: **45/45**, sem falhas, skips ou cancelamentos. Casos com
transporte, identidade, preços e observações de escopo sintéticos; CAS Java,
admissão e verificação serial/fresca sobre cópia privada do ledger são reais.
Não houve ADC, SDK nativo real ou acesso à rede durante os testes.

| Camada exercitada                                          | Casos |
| ---------------------------------------------------------- | ----: |
| Seleção do grafo e import inerte                           |     2 |
| Coordenador integral e confirmações perdidas               |     9 |
| Pontos de falha do I/O nativo                              |     6 |
| Regressões do I/O/SDK com comandos falsos                  |    23 |
| Isolamento, sanitização, imutabilidade e overflow do trace |     5 |

As falhas são diferenciadas sem afrouxar a proteção do grant:

| Cenário sintético                         | Ponto observado                         | Fetch bruto da VM |
| ----------------------------------------- | --------------------------------------- | ----------------- |
| Escopo final inválido                     | `scope-final / failed`                  | Não invocado      |
| Cancelamento no escopo final após grant   | `scope-final / failed`, sinal cancelado | Não invocado      |
| Admissão nativa negada após grant         | `native-admission / failed`             | Não invocado      |
| Delegado falha antes de devolver resposta | `raw-fetch / failed`                    | Invocado uma vez  |
| Resposta redirecionada                    | `native-response / failed`              | Invocado uma vez  |

O coordenador verifica também sucesso, HTTP 400, confirmação de upload perdida,
verificador financeiro não serializado e confirmação da criação perdida.
Falhas ambíguas mantêm grant gasto/selado e recuperação explícita, sem fabricar
`NOT_SENT`, rejeição ou terminal. A confirmação perdida é reconciliada pela mesma
operação via GET, sem segunda criação. O sinal real da requisição privada e o
alcance da falha pretendida são assertados, evitando falsos positivos por erros
engolidos em wrappers.

## Seleção e rastreabilidade

Grafo separado de 53 módulos: sete cópias de ancestrais afetados, um helper novo
e 45 módulos compartilhados com hashes preservados. Nem o leitor nem o I/O
nativo anteriores são alcançáveis; o pin COS depreciado continua fora da seleção.
Os operadores encerrados e seus recibos permanecem inalterados. Nenhuma CLI
nova de criação foi disponibilizada ou apontada para este pacote.

Pacote privado: `.local/worker-isolation/mount-vm-boundary-trace.EO5f9B/`.
O plano precedeu o código e o RED integral comprovou ausência do novo diagnóstico
no caminho anterior. Recibos usam escrita exclusiva; não repetir o verificador
no mesmo diretório nem sobrescrever capturas para obter um gate novo.

| Artefato                 | SHA-256                                                            |
| ------------------------ | ------------------------------------------------------------------ |
| Gate consolidado         | `502d7db337b2c070575607e8c468a0109e2ad8496b0f489bcb474242700cb8ab` |
| Grafo selecionado        | `43f0f503dc137ec90c6f3df4f0ca623d045a4d633c01c3fbc5d26ef365c8bc52` |
| Gate anterior preservado | `bc88aa647f50ea14c97e16dfe35d7a7a16ee41df5f1e7dae5a410d2cdc770043` |

O recibo contém inventário dos fontes e hash do TAP. Reconfere os 201 fontes do
gate anterior, os 186 da fundação COS7608, a captura histórica e os 419 fontes
técnicos do gateway. O ledger original permaneceu com oito reservas e USD 40
reservados, não faturados. Não houve nova reserva ou alteração de schema,
migrations, runtime Java, contratos públicos, defaults ou arquivos de performance.

Maven/web/mobile não foram reexecutados neste gate local; os resultados globais
anteriores permanecem [fotografias da execução registrada](worker-isolation-cos7608-operator-2026-10-23.md#auditoria-posterior-e-gates-globais),
não validação cloud renovada. A causa exclusiva da falha histórica tampouco pode
ser reconstruída retroativamente por este trace novo.

## Próximo trabalho

Integrar a captura sanitizada do snapshot a outro operador/contexto, com pins
e testes próprios. Preparar ausência dos oito escopos anteriores, preços e
admissões frescos antes de outra criação autorizada. Não reutilizar os contextos
encerrados ou a cotação vencida. Prova de montagem, boot/segurança, orçamento
total de memória, isolamento e worker completo na cloud continuam pendentes.
Não há habilitação de uploads, providers, produção ou avanço da 021 neste gate.

## Continuação posterior

A [integração e prova com operador próprio](worker-isolation-vm-trace-operator-2026-10-23.md)
foram executadas depois deste gate. O trace confirmou uma invocação da criação
VM; a operação foi recusada por capacidade e os recursos ativos foram retirados.
Os resultados offline acima permanecem fotografias próprias, não aprovação de
boot ou reinterpretação da oitava rodada.
