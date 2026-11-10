# Audit parcial da 020 — candidata6, 2026-11-03

Revisão documental e da fronteira código/contrato, sem edição de runtime,
status/gate, registry ou checksum. A intenção corrente de 017–021 e DEC-008
permanece: conteúdo somente em memória no servidor, entrega na sessão,
persistência privada no aparelho e logs/recibos sanitizados separados.

## Evidência corrente

A [prova c6 do gateway](../../../../../../api/apps/translation-gateway/docs/volatile-runtime-candidate-6-verification-2026-11-03.md)
identifica JAR/imagens e cenários. Foram lidos o log combinado, estados dos
clientes e métricas dos oito cenários nativos em
`.local/mob020-volatile-20261101/pipeline-local-20261103-2/`.
HTTP e restart têm exit0; a matriz registra oito passed/22 renders. O JAR local
foi conferido por SHA-256: fb07569a75535dbfa6db8698ad01f762250207cf097bb13954b28fc3aa244386.

| AC020 | Conferência corrente                                                                                                                                                                                          | Pendência/limite                                                                                        |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| 001   | Matriz c6 e visual c6: pixels preservados fora do OCR; original/servidor sem gravação de conteúdo.                                                                                                            | Alcance das fixtures e ambiente local explicitados.                                                     |
| 002   | Nove WebPs c6 byte-idênticos aos c5 inspecionados; sete destinos/fontes, sem glyph/clipping observado nessas amostras.                                                                                        | Não generaliza qualidade humana ou qualquer layout.                                                     |
| 003   | Manifesto c6 conserva integralmente os 4860 caracteres, overflow=true/fontSizePx=0. Reader021 técnico já revalidado.                                                                                          | Ciclo no aplicativo ainda sem prova; marcador de três pontos sozinho é insuficiente para UX.            |
| 004   | Vazio c6 integralmente equivalente; nove OCR/oito traduções no visual.                                                                                                                                        | Prova sintética, não benchmark de Vision real.                                                          |
| 005   | HTTP c6 de 12 OCR/11 traduções, 12 recibos, limites/hash/vínculos e zero conteúdo/arquivos/jobs legados; restart real.                                                                                        | Integração no Simulador iOS e admissão pública não comprovadas.                                         |
| 006   | Pipe em worker plataforma; timeout real SIGSTOP/deadline de 90s, ASfault/recovery e página seguinte passaram na c6. Pico HTTP 1800118272; máximo nativo 1448869888; PIDs/CPU/AS/swap conferidos nos cenários. | Alvo AMD64/COS125 permanece sem prova/autorização de nova rodada; fechamento documental final pendente. |

## Contraponto c5 e aderência ao código

A [revisão de timeout/autorização anterior](volatile-timeout-and-authorization-review-2026-11-02.md)
continua válida como fotografia do bloqueio c5: a rodada11 atingiu timeout do
cliente de 120s no cenário nativo configurado para 90s. Não foi apagada nem
convertida em sucesso. A c6 é uma correção posterior com prova própria.

A causa específica no scheduler/JDK permanece hipótese, sem dump comprobatório;
o resultado concreto é o cenário c6 aprovado com a troca de worker.
A inspeção atual encontrou ThreadFactory configurável no RenderCallSupervisor
e worker daemon de plataforma no IsolatedMemoryRenderAdapter. O código mantém
admissão única, fence após etapas bloqueáveis, término da filha e join do writer
antes de cleanup/devolução da capacidade. A evidência real c6 agora cobre a
janela de pipe/SIGSTOP que os focados isolados não provavam.

Na fronteira mobile, aquisição021 continua usando take único, validação, lease
com reconcileFiles e commit2.0/FINISHED com sinal; a busca não encontrou retorno
a URL/poll/ACK na ação corrente. O gate mobile 128/1016 e review independente
permanecem provas técnicas, não prova de execução nativa ou offline em aparelho.

Não foi encontrada nova divergência de intenção ou retorno de persistência de
conteúdo no código examinado. Não é auditoria universal de syscalls/APM ou de
todo caminho do repositório. O resultado negativo c5 era divergência técnica
de contenção, e a prova c6 demonstra a correção no cenário local reexecutado.

## Divergências documentais corrigidas nesta rodada

- Review/tasks/audit anteriores ainda apresentavam c5 como prova vigente de
  deadline completo. Foram reconciliados para c6, mantendo a contraevidência.
- O audit antigo ainda orientava executar cloud pela autorização condicional
  histórica. Essa instrução foi retirada da orientação corrente: houve
  rejeição automática antes da execução e não houve retry/criação de recursos.
- O roadmap mobile ainda dizia 018–021 bloqueadas. O README foi alinhado aos
  estados/gates registrados, sem alterar requisitos ou promover aceites.

## Autorização e conclusão

O ambiente operacional originalmente admitido continua restrito ao Compute
privado AMD64/COS125/e2-highmem-2 e seus limites. As provas locais ARM64 não o
substituem. A existência de imagem AMD64 c6 preparada offline também não o prova.

O usuário informou só Simulador iOS no Mac; enumeração via framework existente
foi bem-sucedida, mas as tentativas DeviceHub/CUA deram timeout. Não há prova
do fluxo nativo da aplicação. Proposta cloud offline precisa de autorização
vigente explícita antes de mutação; não se pode contornar a rejeição por outra
ferramenta ou inferir permissão da hipótese técnica nova.

Root7 foi concluído com 2863 testes, zero falhas/erros, 116 skips e 470 XMLs novos;
o fechamento documental técnico continua aberto nesta fotografia.
TASK-005/006/007 seguem pendentes; TASK-004 é reaberta para consolidar referência/coverage e gates documentais
da c6. A 020 continua in-progress/open com review changes-requested. Nenhum
AC ou implemented foi aprovado por este audit; qualidade humana/políticas e
admissão pública não foram declaradas verificadas.

## Consolidação pelo integrador em 2026-11-03

A revisão independente acima foi recebida e reconferida contra a decisão,
as specs020/021 e as provas. TASK-004 foi concluída para a consolidação local
da c6; TASK-005/006/007 permanecem abertas. Coverage e referência de checksum
foram reconciliadas; os resultados dos gates constam da review corrente.
A busca no código principal do gateway não encontrou escrita de imagem, raster,
OCR, tradução ou manifesto; a confirmação técnica de AS não contém mídia.
Esse recorte não substitui inspeção de proxy/APM na implantação admitida.

Backend raiz7 passou2863 testes (116 skips), sem falhas/erros. Web tsc-b passou;
FSD passou com polling após EMFILE do watcher, sem alterar código/regras.
Inventário cloud apenas de leitura em09:47:26Z confirmou zero recursos mob020
nas oito categorias e IAM inalterado. A proposta privada revisável está no
[documento do gateway](../../../../../../api/apps/translation-gateway/docs/volatile-private-verification-proposal-2026-11-03.md);
a reserva adicional proposta de US$2 ainda não foi autorizada.

O usuário dispõe somente do Simulador iOS; a tentativa CUA pelo caminho real
do DeviceHub também expirou, sem executar o fluxo do aplicativo, instalar
componentes ou alterar seus dados. Não há dispensa inferida da prova física.

## Rodada privada AMD64 posterior — 2026-11-03

O proprietário autorizou explicitamente a rodada c6 vinculada ao pacote SHA-256
`6a60443c436a32b4e3ae4b897e4221ff1caf6045fec0106917381affd200219f`,
com reserva adicional de US$ 2 e até quatro horas. O inventário inicial e a
consulta atual de preços confirmaram as condições da proposta. Os 213 arquivos
de código, nove scripts e três imagens AMD64 coincidiram com o pacote.

A execução privada `mob020-1102-v5-374bb591` terminou com código 0 em
x86_64/COS125/Docker 27.5.1/cgroup2. A prova HTTP autenticada passou com
12 OCR/11 traduções simuladas, máximo de 12 MiB, falha nativa, falha de AS,
SIGSTOP/deadline e recuperação, e restart real. O pico HTTP registrado foi
1.737.723.904 bytes; limite 8 GiB, swap zero, PIDs 64 e CPU 2. As oito
medições nativas passaram, com 22 renders, scratch 512 MiB, sem arquivos de
conteúdo, sem OOM registrado e pico nativo de 1.437.667.328 bytes.

A coleta original retornou HTTP 404 porque usava `getSerialPortOutput` como
caminho REST; a mesma leitura limitada, com validação de cursor e integridade,
foi feita pelo caminho oficial `serialPort`, sem alterar o pacote fixado. Os
33 arquivos recebidos, recibo de autorização, digests, métricas e registros
operacionais estão em `.local/mob020-volatile-20261101/compute-repro-20261102-1/`.
Cleanup terminou sem falhas; inventário final de 10:25:59 UTC encontrou zero
recursos nas oito categorias, inclusive discos, e IAM SHA-256
`c4941313cdd4802ea8357ff1ef3f53ba9ad8b1cd1e5436081b29cd67f7945452`,
igual ao inicial. Preços não são fatura.

**Limites:** o harness executado não testa cancelamento explícito no alvo
AMD64; interrupção de processo e timeout não devem ser promovidos a essa
prova. TASK-006 permanece aberta para esse requisito e auditoria completa.
Device Hub/CUA novamente retornou `-10005: timeoutReached`; não há nova prova
iOS ou física. TASK-005/007 permanecem abertas e 020 `in-progress`.
