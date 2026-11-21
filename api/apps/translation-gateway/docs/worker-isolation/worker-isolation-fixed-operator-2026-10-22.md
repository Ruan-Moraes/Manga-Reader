# Operador com dispatch corrigido — preparação offline de 2026-10-22

Continuação da [correção de dispatch](worker-isolation-dispatch-freshness-2026-10-21.md).
Esta parcela integra o candidato ao coordenador local, sem criar VM, enviar
objetos, usar credenciais ou reservar orçamento. A 020 continua `in-progress/open`;
a 021 permanece `approved/blocked`. Não é aprovação do worker completo.

## Implementação e isolamento das tentativas

O operador privado novo é `mount-n1-fixed-operator.Msmc7t`. Ele seleciona
`runtime-v3` da revisão de dispatch, com `driver-v4` e `http-v8`; não seleciona
as revisões intermediárias nem reexecuta o operador anterior. Os hashes dos
recibos finais de 53 testes e da comparação por tempo transcorrido de dois
testes são obrigatórios. As fontes transitivas e os TAPs são reconferidos;
alteração dos bytes impede a execução, sem procurar outra versão.

O coordenador mantém reserva/readback próprios, journals CAS5, archive pinado,
admissões independentes para criação/cleanup, cancelamento, quiescência e locks
por posse. Não cria schema, migration, índice ou contador. O planejamento dos
recibos e sua integridade antecedeu o código, conforme `database-design`.

O ticket continua em 1000 ms, preparo e POST em janelas distintas de 10 s e o
driver em 30 s. Criação continua limitada a 12 minutos e cleanup a 15 minutos.
Falha ou confirmação perdida não autoriza repetir a criação, estornar reserva,
adotar contexto anterior ou remover um lock de outra tentativa.

## Retirada anterior como pré-requisito

Os três escopos já consultados, com 33 referências, são acrescidos de dez alvos
da [quinta rodada, primeira N1](worker-isolation-n1-first-execution-2026-10-21.md):
oito nomes Compute e os nomes Storage de bucket e objeto. São **43 GETs de
ausência**, além de cinco metadados e duas quotas: **50 GETs antes da reserva**.

Não se inventa uma URL de rota para a quinta rodada. Seu journal Compute selado
contém somente contexto, intenção de network e seal, sem dispatch. Captura,
bundle, estado, retirada e recuperação estão ligados por hashes fixos. Isso
não fabrica uma operação terminal Google. O lock e os journals antigos são
preservados; o operador novo recebe diretório e reserva próprios.

Todos os alvos devem estar ausentes na janela de validade vigente. Uma leitura
nova dos últimos alvos não renova as anteriores. Uma resposta diferente de 404,
prazo vencido, evidência alterada, alvo omitido ou escopo duplicado impede a
reserva. A retirada histórica não substitui essa reconferência atual.

## Validação local e comandos

Os testes usam HTTP/identidade/finanças sintéticos e CAS Java concreto. Nenhum
resultado de teste é apresentado como consulta atual à cloud ou gasto real.
Foram acrescentadas regressões de quatro escopos, retirada incompleta/alterada,
pins de fonte transitiva e configuração ausente; os casos prévios do coordenador
e sua integração permanecem presentes.

O gate do núcleo foi selado em 22/10, de 00:24:52.498 a 00:25:51.855 UTC:
**96/96 testes**, zero falhas/skips/cancelamentos, 166 fontes reconferidas e
ledger sem alteração. O launcher passou separadamente em **3/3 testes**,
com 135 entradas de fonte. São testes offline, não uma nova rodada cloud.

O comando real do launcher `prepare`, sob bloqueador de rede/CLI, terminou
com exit 2 esperado por falta da configuração financeira. Os pins do núcleo,
dispatch e 419 fontes do gateway passaram antes dessa recusa. Não houve
credencial, mudança nos arquivos do operador, remoção do lock original ou
nova reserva. Esse resultado negativo é o comportamento fail-closed esperado,
não autorização para preencher valores fictícios.

| Recibo privado                       | SHA-256                                                            |
| ------------------------------------ | ------------------------------------------------------------------ |
| Núcleo, `offline-verification.json`  | `97bc47732ad689852c97f048ad61c56c5dee8eee8d73f36abf39a1fe899ee62c` |
| Launcher, `launch-verification.json` | `66896fa7bc16701e4867d688ca65cf5b57fde0db39ba66fce59f8d250e4acf3d` |
| Recusa local, `local-prepare.json`   | `9e256034bf9ca30cc71841e89dd7027916ee1a2149fa59c09faded1ae676608e` |

Na raiz do repositório, com o Node existente, os testes do núcleo podem ser
repetidos diretamente:

```bash
node --import "$PWD/.local/worker-isolation/mount-n1-cos-admission.y8ogL1/offline-network-v2.mjs" \
  --test --test-concurrency=1 \
  .local/worker-isolation/mount-n1-fixed-operator.Msmc7t/absence.test.mjs \
  .local/worker-isolation/mount-n1-fixed-operator.Msmc7t/dispatch-pins.test.mjs \
  .local/worker-isolation/mount-n1-fixed-operator.Msmc7t/engine.test.mjs \
  .local/worker-isolation/mount-n1-fixed-operator.Msmc7t/entry.test.mjs \
  .local/worker-isolation/mount-n1-fixed-operator.Msmc7t/fifth.test.mjs \
  .local/worker-isolation/mount-n1-fixed-operator.Msmc7t/files.test.mjs \
  .local/worker-isolation/mount-n1-fixed-operator.Msmc7t/finance.test.mjs \
  .local/worker-isolation/mount-n1-fixed-operator.Msmc7t/guard.test.mjs \
  .local/worker-isolation/mount-n1-fixed-operator.Msmc7t/integration.test.mjs
```

Os verificadores escrevem recibos exclusivos; não reexecutá-los para sobrescrever
os arquivos. O launcher acrescenta o guard de retirada da primeira tentativa
histórica antes do núcleo. `prepare` é uma inspeção local, não chama SDK/ADC ou
provider e não inicia uma rodada. `status` só lê registros e nunca retoma criação.
`execute` não deve ser usado como comando de diagnóstico ou para repetir uma
tentativa ambígua.

Os gates globais foram reconferidos nesta parcela:

| Gate                                           | Resultado observado em 22/10 UTC                                                       |
| ---------------------------------------------- | -------------------------------------------------------------------------------------- |
| Maven global offline, JDKs e Docker existentes | `BUILD SUCCESS`, todos os módulos aprovados, zero falhas/erros                         |
| Web, `tsc -b`                                  | Exit 0                                                                                 |
| Mobile, `pnpm check` integral                  | Exit 0, 116 suítes/892 testes Jest; inclui SDD, links, lint, FSD, formato e type-check |

O Maven foi executado de 00:25:40.241 a 00:28:08.591 UTC, sem reinstalação.
Skips e avisos existentes não representam validação cloud. A formatação e o
diff dos documentos desta parcela são conferidos separadamente do baseline
global: `git diff --check` ainda aponta a linha em branco de
`web/landing-page/src/shared/component/PlatformBadge.tsx:44`, fora do escopo;
ela não foi corrigida automaticamente. Nenhum validador foi enfraquecido.

## Próximo gate

O novo operador começa sem `approved-finance.json`, falhando fechado. A cotação
da rodada anterior está expirada; os recibos não serão redatados. Antes da
prova nativa será necessário renovar os insumos financeiros, preencher os vínculos
de hashes no diretório novo e passar novamente pelos pré-requisitos frescos,
reserva de USD 5 e readback. Isso não amplia a autorização total de USD 100.

As cinco reservas anteriores continuam contabilizadas como USD 25 reservados,
sem estorno. Reserva não é cobrança observada nem hard cap do Google. Nenhuma
nova reserva ou leitura de faturamento foi feita nesta parcela.

Ainda faltam a prova nativa de montagem e, depois, boot, runtime/CVEs, memória,
isolamento do processo nativo, renderização, qualidade e retenção do worker
completo. Mount-only não encerra a 020. Não houve mudança Java, mobile, performance,
infraestrutura publicada, APIs, manifesto ou defaults desabilitados.

Continuação posterior: a [reconferência financeira](worker-isolation-financial-readiness-2026-10-22.md)
fez leituras reais dos pré-requisitos sem executar o operador. A cotação atual
foi recusada e a API oficial recebeu uma sondagem separada; esta preparação
offline e seus recibos permanecem preservados como fotografia histórica.
