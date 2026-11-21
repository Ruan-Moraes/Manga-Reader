# Identidade e transporte nativos do operador

Data: 2026-10-18. Continuação da
[composição concreta](worker-isolation-composition-2026-10-18.md).
020 continua `in-progress/open`; 021 bloqueada. Não é admissão cloud.

## Implementação

O tooling privado em `.local/worker-isolation/mount-native-io.prwTIM/` acrescenta:

- loader lazy para a CLI existente, com pin dos manifests, conta/TLS verificados,
  ambiente whitelist, argv sem shell e somente `config list` e
  `auth print-access-token`; sem login, alteração de ADC, instalação ou config;
- uma aquisição de token por instância, com falha não retomada automaticamente,
  cache somente em memória e erros/estado sem token ou identidade bruta;
- transporte baseado no fetch nativo, com origens/projeto/zona/bucket delimitados,
  validação de método/headers/query, recusa de redirect e nenhuma repetição HTTP;
- autorização de I/O separada por identidade, leitura, criação e exclusão, com
  hashes/janela e default deny; criação não herda prazo de cleanup;
- streaming limitado de JSON e do archive, upload sem buffer integral e
  preservação da capacidade por toda a vida útil dos requests/responses/SDK;
- ligação com o supervisor/journals concretos. Fechar processamento não aborta
  automaticamente uma limpeza autorizada; término real fecha também os ports.

O allowlist HTTP não substitui os drivers vinculados ao journal: body canônico,
requestId, gerações, hashes e posse continuam obrigatórios. Callbacks de teste
não viram ticket operacional. Dependências falsas só são injetadas por código
de teste, não por JSON/CLI.

`operator.mjs execute` continua bloqueado. O bridge está codificado, mas nenhum
loader nativo foi autorizado/usado contra sua conta nesta entrega. Não se afirma
renovação de token, permissão efetiva ou segurança do SDK inteiro apenas por
conferir hashes de seus manifests. Credenciais de provider nunca entram no app.

## Evidências offline

```bash
node --test --test-concurrency=2 .local/worker-isolation/mount-native-io.prwTIM/native.test.mjs .local/worker-isolation/mount-native-io.prwTIM/integration.test.mjs
node .local/worker-isolation/mount-native-io.prwTIM/verify.mjs
```

O primeiro comando é repetível. O segundo grava recibo exclusivo e não
sobrescreve evidência. As fixtures de SDK/identidade/HTTP são sintéticas; a
política real de identidade também é exercitada para recusar conta sintética.
Não houve acesso à ADC, CLI, conta ou token reais durante os testes.

O fluxo completo usa produtor, supervisor, handoff, ciclo/retirada v3, journals
Java e archive de runtime reais; HTTP, conta, gerações e prova serial são falsos.
Isso não é OCR, tradução ou montagem cloud observada. O caso sem autorização
de I/O comprova que aprovar outras fases não inicializa SDK/transporte.

A primeira integração falhou porque o novo allowlist omitia o parâmetro IAM
`optionsRequestedPolicyVersion=3`, já exigido pelo produtor. A correção permite
somente GET versão 3 no bucket da rodada, sem escrita IAM. A semântica foi
conferida na [referência oficial de getIamPolicy](https://docs.cloud.google.com/storage/docs/json_api/v1/buckets/getIamPolicy).
O uso de argv, AbortSignal e fetch segue as referências de
[child_process](https://nodejs.org/download/release/v22.23.1/docs/api/child_process.html)
e [fetch](https://nodejs.org/download/release/v22.23.1/docs/api/globals.html#fetch).

Os testes cobrem deny/revogação, scope/hash/prazo/identidade/SDK inválidos,
comandos fixos, abort/erro sem segunda tentativa, token tardio, streaming,
resposta não consumida, origem/opções indevidas, limites e mutação de entrada.
O verificador agrega as regressões anteriores, confere fontes/recibos e
snapshot/ledger antes/depois, links, formato e diff direcionado. Não redata
recibos anteriores nem anuncia gates globais aprovados sem reexecutá-los.

## Pendências

1. Reconciliar custo/tributos atuais e revisão COS para um ticket real, limitado
   à montagem mínima; o teto autorizado de US$ 5 permanece total, sem reserva nova.
2. Ligar esse ticket e o bootstrap ao CLI, revalidar identidade/permissões no
   ambiente real autorizado e somente então executar/retirar a prova.
3. Admitir e validar separadamente o worker completo e seus controles. Montagem
   mínima não executa renderer, OCR ou tradução e não conclui a 020.

Nenhum recurso, IAM, API, upload cloud, provider, instalação, migration ou
default foi alterado. O estudo híbrido urgente e a auditoria de performance
continuam preservados. Erros/globals históricos ficam abertos separadamente.
