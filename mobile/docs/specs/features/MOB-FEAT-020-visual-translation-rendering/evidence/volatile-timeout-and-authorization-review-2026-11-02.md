# Revisão de timeout real, autorização e limites — 2026-11-02

## Escopo e estado

Registro independente solicitado pelo integrador, sem alterar runtime, status,
tasks, coverage ou checksums. A [spec020](../spec.md) permanece o contrato;
esta evidência não promove AC, gate, implemented ou operação pública.

O requisito aprovado continua coerente entre 017–021 e DEC-008: imagem, raster,
OCR, tradução e manifesto somente em memória no servidor; retorno autenticado
na sessão; validação e armazenamento privado no aparelho; logs operacionais e
recibos sanitizados separados do conteúdo. A retenção remota antiga não deve
ser reintroduzida para resolver falha de transporte ou de processo.

A 021 está verification-pending, com revisão independente e provas físicas
explícitas abertas. O gate mobile mais recente conferido foi pnpm check em
`/private/tmp/toonlira-volatile-mobile-check-20261102-6.log`: 128 suites/1016
testes aprovados. Specs:check rodada10 também terminou verde, com validação de
specs e links. Esses resultados não aprovam a nova candidata backend posterior.

## Provas válidas e seu alcance

O receipt de `.local/mob020-volatile-20261101/root-tests-20261102-6/receipt.json`
registra `./mvnw -o test`, exit0, 2863 testes, zero falhas/erros, 116 skips e
470 XMLs sem relatórios antigos na contagem. É prova daquele estado testado,
não resultado retroativo da correção candidata6.

Restart real da candidata5 passou no log
`/private/tmp/toonlira-volatile-http-native-restart-20261102-2.log`. O resultado
registra arquitetura aarch64, conteúdo/arquivos regulares/jobs legados zero,
PIDs max0, swap zero e orçamento do pai/CPU conferidos. Prova restart local com
providers sintéticos; não é validação AMD64/Compute ou provider pago.

As provas anteriores positivas c5 de formatos/80MP/12MiB, matriz nativa e visual
continuam identificadas por seus artefatos e cenários. Não anulam o contraexemplo
novo, nem são automaticamente provas da candidata6.

## Contraevidência que deve permanecer preservada

O opt-in HTTP ampliado c5, rodada11, está em
`/private/tmp/toonlira-volatile-http-native-integration-20261102-11.log`.
O cliente passou pelo cenário de falha de address space da filha e recuperação
antes de chegar ao cenário `owned-noncooperative-native-timeout`.

Nesse cenário, a filha foi pausada com SIGSTOP. O renderer deveria responder
pela contenção no limite configurado de 90 segundos, mas o future do cliente
atingiu sua espera de 120 segundos. O log registra:

```text
volatile-gateway-client-failed:owned-noncooperative-native-timeout:TimeoutException
```

O relatório externo apresenta ContainerLaunchException porque Testcontainers
envolve o término do cliente de diagnóstico. Isso não transforma a falha em
sucesso ou simples ausência de ambiente: o estágio identificado pelo próprio
cliente é a contenção do timeout nativo. A rodada termina negativa; não usar
sucesso de cenários anteriores ou de outros testes para aprovar AC-006.

Não estender o timeout do teste nem retirar SIGSTOP para converter o caso em
verde. A posse deve continuar conservadora, sem liberar buffers/capacidade
enquanto o processo/writer ainda puder usá-los. É preciso comprovar retorno,
término/cleanup confirmados, recusa da concorrente e página válida seguinte.

## Correção candidata6: hipótese e prova ainda necessária

O código candidato acrescentou ThreadFactory ao RenderCallSupervisor e usa um
worker de plataforma dedicado para o I/O Pipe do IsolatedMemoryRenderAdapter,
em vez de depender do worker virtual compartilhado para essa operação
bloqueável. É uma correção candidata para a contenção observada, não prova
concluída da causa ou da resolução em Linux real.

Os focados RenderCallSupervisor, IsolatedMemoryRenderAdapter,
SupervisedVolatileSession, VolatileStageDeadline e ProcessVolatilePageUseCase
passaram. Os XMLs conferidos mostram respectivamente 12, 4, 4, 3 e 12 testes,
zero falhas/erros/skips; o log está em
`/private/tmp/toonlira-volatile-native-pipe-worker-20261102-1.log`.
Eles não equivalem ao cenário real de 90 segundos com pipe, SIGSTOP e processo.

Na fotografia desta revisão, o JAR candidato6 está em empacotamento e a prova
Linux real de timeout ainda NÃO foi validada. Depois do pacote, vincular a
nova execução aos hashes exatos de fontes/JAR/imagem; comprovar os cenários
afetados e recuperar a página seguinte sob os limites admitidos. Reavaliar
memória/threads/PIDs e os demais gates atingidos pela mudança. Não promover
AC-006 ou implemented por inferência a partir dos focados.

## Autorização histórica versus autorização corrente

O handoff original continha uma autorização condicional de rodada privada
Compute dentro de envelope estrito: COS 125/x86_64, e2-highmem-2/host 16 GiB,
worker 2 CPUs/8 GiB, AS pai/filha 3 GiB, PIDs 64, swap zero, scratch 512 MiB, sem IP público,
ingresso/NAT ou providers pagos. Ela não era autorização irrestrita de cloud,
novo IAM ou publicação. O custo histórico estimado de US$4,98 não reinicia o
limite acumulado de US$20, a parada preventiva em US$15 ou a reserva de US$5.

Nesta continuidade, a revisão automática rejeitou a chamada de
`cloud_round.py prepare` antes de CreateProcess. Conforme o relato do integrador,
o motivo foi o escopo de autorização anterior de **contenção local sem nova
rodada cloud**. A ação não foi executada e nenhum recurso cloud foi criado por
ela. Não houve retry; esta evidência não autoriza repetir a chamada, trocar de
ferramenta ou dividir a operação para contornar essa rejeição.

Portanto, a hipótese técnica nova e a proposta condicional histórica não
substituem autorização explícita vigente para provisionar a rodada pretendida.
O pacote/proposta offline pode ser preparado e apresentado de forma concreta;
uma rodada cloud continua dependendo da autorização correspondente e de
inventário/budget atuais antes de qualquer mutação. Esta revisão não solicita
nem concede essa autorização.

Foi conferido o resumo de inventário somente leitura de
`compute-repro-20261102-1/inventory-20261102T222217Z/summary.json`, sob
`.local/mob020-volatile-20261101/`: timestamp
2026-11-02T22:22:30.681899Z, zero recursos da rodada consultados em buckets,
discos, firewalls, instâncias, rede, registry, subnet e worker. O hash IAM
registrado é `c4941313cdd4802ea8357ff1ef3f53ba9ad8b1cd1e5436081b29cd67f7945452`.
Não foi lida configuração bruta de credenciais nem foi feita nova consulta
cloud pelo reviewer. O inventário é uma fotografia datada, não garantia de
ausência futura ou autorização para criar recursos.

## Escopo solicitado pelo usuário: Simulador iOS existente no Mac

A resposta corrente do usuário delimita a verificação a Simulador iOS no Mac.
Não a interpretar como autorização cloud, instalação de SDK, aparelho físico
Android/iOS ou publicação.

O recibo `ios-existing-framework-inventory-20261102.json`, no mesmo diretório
local de evidências, registra exit0 para o comando direto do framework
CoreSimulator existente:

```text
/Library/Developer/PrivateFrameworks/CoreSimulator.framework/Versions/A/Resources/bin/simctl
list devices booted --json
```

Foi encontrado iPhone 18 Pro booted/disponível; o framework existente é 1174.9.2.
Isso evita a exigência de runFirstLaunch/instalação 1174.21 do wrapper Xcode
mais novo. Não foi instalado ou atualizado SDK para obter esse inventário.
O integrador relatou duas tentativas DeviceHub/CUA encerradas por timeout;
elas não são evidência de execução do fluxo no aplicativo.

A disponibilidade do simulador não comprova que o app novo foi executado,
que transporte/SQLite/arquivos/offline/foreground/restart funcionaram nele,
ou que foco/leitor de tela estão adequados. É um caminho local existente para
a próxima prova dentro do escopo solicitado. Mesmo uma execução positiva no
simulador deve permanecer identificada como simulador, sem virar prova física.

## Pendências e critérios de conclusão preservados

| Pendência                         | Natureza                                                       | Condição de avanço                                                                                                             |
| --------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Timeout nativo real da c5         | Falha técnica demonstrada da 020/AC-006                        | Validar candidata6 no cenário real de 90s, com morte/cleanup, capacidade e página seguinte; preservar o resultado negativo c5. |
| Provas do artefato candidato6     | Verificação técnica ainda aberta                               | Pacote/hashes e repetição dos gates/cenários afetados, sem herdar aprovação c5.                                                |
| Execução do app no Simulador iOS  | Verificação local solicitada pelo usuário                      | Usar runtime já instalado e registrar fluxo, falhas, persistência/offline e navegação com seu alcance real.                    |
| Reprodução AMD64/Compute admitida | Prova real pendente, sem autorização corrente para nova rodada | Apresentar proposta concreta e obter autorização explícita antes de mutação; não substituir por ARM64 ou remover o critério.   |
| Qualidade humana de OCR/tradução  | Verificação de 018/019                                         | Referências e revisão independentes; fixtures sintéticos não comprovam naturalidade/nomes/vertical real.                       |
| Políticas e admissão pública      | Operação ainda não aprovada                                    | Conferência efetiva de políticas/providers/infra, separada de gates locais.                                                    |

Os contratos continuam coerentes; a falha de timeout é divergência técnica a
resolver sob o contrato, não motivo para enfraquecê-lo. A 020 permanece aberta.
Nenhum resultado deste documento declara implemented, ativa ambiente público
ou considera a candidata5 aprovada no cenário que falhou.
