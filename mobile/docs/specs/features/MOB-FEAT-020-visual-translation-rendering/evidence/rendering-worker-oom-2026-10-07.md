# OOM real e recuperação do worker — 2026-10-07

Parcela de TASK-002/005/007/008, AC-001/005/006. 020 in-progress/open,
verdict changes-requested; 021 approved/blocked. Primeira prova: continuação da
[medição Spring](rendering-worker-linux-2026-10-07.md), sem mudar produção,
contratos, schema, qualidade, deadlines, RAM cloud ou defaults.
Somente Java/Node e dados sintéticos; nenhum provider/ADC/download/deploy.

O hardening de runtime posterior, ainda insuficiente, está separado no fim
deste registro; a frase acima não apresenta essa tentativa como só documental.

## Diagnóstico anterior e correção da interpretação

O teste anterior parava no assert OOMKilled antes de ler as métricas finais.
Logo, seu flag não provava morte do pai ou inexistência de relatório. Nova
reprodução do máximo a 2 GiB: container exit=1, OOMKilled=true, pai gravou
outcome=failed/phase=processing, memory.peak=2.147.483.648 bytes e VmHWM
267.300 KiB. A hipótese de pai morto não foi confirmada nessa execução.
É reprovação do orçamento, não OCR real ou sucesso do job.

[Moby ProcessEvent](https://github.com/moby/moby/blob/master/daemon/monitor.go)
atualiza OOMKilled no evento OOM, separadamente de exit. Fonte upstream é
contexto, não comprovação da vítima na versão local. A
[documentação Linux](https://www.kernel.org/doc/html/latest/admin-guide/cgroup-v2.html)
define memory.events e memory.oom.group; grupo=1 pode matar toda a carga.
Nenhuma política do kernel/host foi alterada para produzir o resultado.

## Prova implementada e limites

[Protocolo](../../../../../../api/apps/translation-gateway/docs/rendering-worker-oom.md),
[teste](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/rendering/NativeRenderingWorkerLinuxTest.java)
e [probe](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/rendering/NativeRenderingWorkerProbe.java):
mesmo Spring/worker, SQL/locks/Flyway V1–V7, MockMvc/filtros, storage/renderer
reais; OCR/tradução falsos e bootstrap sem clientes/credenciais.

Cgroup privado a 2 GiB, uma CPU, 64 PIDs, swap zero, tmpfs finito; banco
PostgreSQL 17 separado em rede interna/sem porta publicada. Java 23.0.2+7
ARM64 Alpine/libwebp 1.6.0/package pinado e readonly, pai sem FFM, filha
guardada. Imagens diferentes readonly, fora do export gravável:

- máxima 10.000×8.000, 7.322.972 bytes, SHA-256
  `15e8bc69f58a1905ecd2805ce56267ee652e6dd6a69674663662ae8d5b25469c`;
  1.024 regiões, origem/destino com totais 262.144/524.288 UTF-16;
- seguinte 320×220, 160.942 bytes, SHA-256
  `06985649f58a3c7d55cce5dcdd8ed60416ab67ce846a6f4b36694f3ebaba59a2`;
  uma região, fonte/destino 16/32 UTF-16.

Testes precederam helpers/cenário: RED por métodos ausentes; contador com
duplicata malformada retornava zero incorreto, regressão RED antes da correção.
[Parser de métricas](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/rendering/RenderResourceMetricsTest.java)
exige arquivo limitado/linhas canônicas, chave allowlisted, contador único e
numérico. Campo ausente, excessivo ou inválido é null, nunca zero fabricado.
Novos dados do OS são exclusivamente escalares; nada de texto, jobRef,
objetos/URLs/credenciais ou causas brutas.

## Resultados focais observados

Primeiro cenário novo terminou sem arquivo final de métricas, com erro de
leitura no host; exit/vítima/causa dessa tentativa não foram coletados. Não
inferir morte do pai, falha de serializer ou corrupção; rodada inconclusiva
preservada. Depois, marcadores sanitizados antes/depois da recuperação e assert
com exit/flag distinguem essas situações. Nada da rodada ausente vira aprovação.

Rodada instrumentada passou. Em seguida, três repetições obrigatórias, mesmo
código/contexto por sequência e sem restart/reset/pull, passaram:

| Repetição | Duração do probe (ns) | VmHWM pai (KiB) | Kernel OOM kills | Job pesado / seguinte |
| --------- | --------------------- | --------------- | ---------------- | --------------------- |
| 1         | 29.981.798.661        | 271.828         | 1                | FAILED / READY        |
| 2         | 29.716.853.478        | 264.988         | 1                | FAILED / READY        |
| 3         | 29.722.991.317        | 265.212         | 1                | FAILED / READY        |

Todas: container exit=0 ao fim do **protocolo de teste**, OOMKilled=true,
memory.peak=2.147.483.648 bytes, memory.oom.group=0, oom_group_kill=0.
Não houve SIGKILL artificial ou redução de mídia/texto. Um processo foi morto
pelo kernel e o pai chegou à recuperação/fim; isso não garante a escolha da
vítima em outro ambiente. Zero portas HTTP bindadas, rota pública 403.

Assertions exigem job/RENDERING FAILED, internal-error sanitizado, ausência
de artefatos finais, remoção do original remoto e limpeza de staging possuído.
Hashes das duas imagens reutilizáveis preservados. Reentrega conserva FAILED
sem repetir OCR/tradução; a seguinte atinge READY com três etapas SUCCEEDED,
hash/vínculo/IDs/texto íntegros e nova reentrega sem segunda chamada.
WebP seguinte 9.734 bytes, hash
`25bf96a61025d14bef4290977c65cd32654c5ef57842a7da75dcd8df81db72c9`.
Asserts posteriores também conferem exclusão dos objetos OCR/tradução do
job terminal; sua revalidação integral fica nos gates correntes da review.

Outcome=succeeded significa **protocolo de falha/recuperação verificado**,
nunca render máximo bem-sucedido. A insuficiência de 2 GiB continua finding;
1 GiB cloud inalterado/sem admissão, 4 GiB apenas diagnóstico funcional.
Não prova kill agrupado seguro, SDKs/layout residentes, outros formatos,
cancelamento/timeout/scratch integrais, distribuição/qualidade/operação.

## Reprodução e fotografia

Reutilizar os pins/caches/comando da [rodada Spring](rendering-worker-linux-2026-10-07.md).
No gateway, selecionar no reactor:

```text
-Dtest=RenderResourceMetricsTest,NativeRenderingWorkerLinuxTest#kernelOomFailsOnlyCurrentJobAndFollowingPageCompletesWithoutReplayingProviders
-Dsurefire.failIfNoSpecifiedTests=false
-Drenderer.worker.resources.enabled=true
```

O cenário de fault fixa explicitamente 2.048 MiB mesmo se o diagnóstico positivo
selecionar worker.memoryMiB=4096. @RepeatedTest(3) não flexibiliza as assertions.
Gates locais correntes, não contagens históricas, ficam na [review](../review.md).

334 fontes/testes/scripts/configurações, SHA-256
`cf21ba5274e708f88ec75775ee5b34d6c0fcec6f54d58b49a7441ce51b506dd4`.
Boot JAR `b40013ebf925148975d95828e34425493c7cf7fce19252cbc3abb6151f7bca5b`.
Receita de paths relativos ordenados path+NUL+bytes+NUL da evidência anterior;
checksum mobile é governança separada. Produção não mudou: não apresentar
esses testes como correção de runtime ou melhoria de memória.

Performance mobile não aplicável; nenhuma task/gate promovida. Falta prova
integral/admissão operacional, não somente benchmark externo. Próxima parcela:
timeout/cancelamento no worker real, com barreiras/estados e recuperação, sem
provider ou alteração cloud. Históricos e alterações externas preservados.

## Gate posterior: finding funcional e tentativa insuficiente

Global subsequente exit 1: gateway 1.082 testes, uma falha, zero erros/skips.
Uma repetição: container exit=137/OOMKilled=true, nenhum marcador de
recuperação/relatório final. Outras duas e máximo a 4 GiB passaram, mas não
aprovam confiabilidade. Não apagar a falha ou repetir apenas até obter verde.
Snapshot desse código: cf21ba5274e708f88ec75775ee5b34d6c0fcec6f54d58b49a7441ce51b506dd4.

Após RED por métodos ausentes, acrescentada a
[política self-only](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/infrastructure/rendering/LinuxOomPolicy.java):
pai somente inspecionado no bean/lançamento, cgroup v2 privado 0::/, grupo=0,
score pai <=0. Filha eleva próprio score a +1000 e confirma antes de
dumpable=0/fontes/mídia; recusa/campo desconhecido/write ignorado falham
sanitizadamente, sem fallback/privilégios/alterações no host/cloud.
[Testes puros](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/rendering/LinuxOomPolicyTest.java)
de parent-read-only, grupo/namespace/valor/recusa/ordem passaram.

[oom_score_adj](https://man7.org/linux/man-pages/man5/proc_pid_oom_score_adj.5.html)
é preferência, não quota RSS/cgroup delegado; escrita própria antes de
[dumpable](https://man7.org/linux/man-pages/man2/PR_SET_DUMPABLE.2const.html)
evita depender de privilégio sobre ownership de proc.

Foco Linux posterior: vinte casos, dois failures, zero errors/skips. Kernel
confirmou baseline score=0, guard score=1000/dumpable=0/limites anteriores;
bean/pacote passaram. Duas repetições ainda terminaram em exit 137 antes de
recovery. Uma passou com score pai=0 no começo/fim. **Não resolveu AC-006.**
Não atribuir ao sinal causa mais específica do que a evidência permite.

Observação limitada por ps/cat dos próprios containers, sem argumentos,
conteúdo ou credenciais: pai PID 1/score=0 e filha PID 40 ou 46/score=1000
coexistiam antes do evento. Confirma a preferência na filha real, não a vítima
final/origem exata. RSS/VSZ com sufixos do ps não foram interpretados: desconhecidos,
não zero/métrica válida. Outra rodada observada reprovou duas repetições.
Handles confirmados terminais antes de nova rodada; nenhum restart de Docker.

Snapshot de 336 fontes/testes/configurações:
`0d3a0e281af89bb1e4332dfdf3b0ecb882782b4746e1c3d69d595f3f90514027`.
Boot JAR rebuilt offline:
`848b2b7641975f1a51cb7e5c2658b7f099305bbbdd02930a8fb71b06f9fbe82d`.
Inclui **hardening parcial não admitido**, não substitui hash anterior nem
afirma gate global verde para esse runtime. Gates leves/governança correntes
ficam na review depois de executados; não compensam a falha funcional.

Próximo: impedir OOM do orçamento pesado no cgroup compartilhado ou conter a
filha em fronteira efetiva compatível com o alvo. Preferência/grupo=0 não são
prova suficiente; investigar controles/orçamento sem inventar margem aprovada,
reduzir mídia/qualidade ou aumentar RAM cloud para verde. Timeout/cancelamento,
retenção integral, qualidade/operação e TASK-002/006/007/008 continuam abertos.

## Experimento preventivo posterior, sem mudança do runtime

Regressão escrita antes do novo cenário: três errors por cenário não admitido
no harness. A tentativa inicial anterior foi bloqueada pelo socket Docker no
sandbox, não por comportamento da aplicação; repetição com acesso local já
autorizado confirmou o RED. Nenhum restart/reinstall/pull ou acesso Google.

O cenário `address-bounded` adiciona somente um bean de teste para construir
o mesmo supervisor/codec com RLIMIT_AS de 1.536 MiB. A produção continua com
3 GiB; JAR/política/qualidade/heap/deadline/imagem/textos/caps/cloud não mudam.
Não troca o teste de OOM real ou seleciona repetições até ficar verde.

Três repetições consecutivas do protocolo preventivo passaram:

| Repetição | memory.peak total (bytes) | VmHWM pai (KiB) | OOM kills | Job máximo / seguinte |
| --------- | ------------------------- | --------------- | --------- | --------------------- |
| 1         | 1.082.957.824             | 271.208         | 0         | FAILED / READY        |
| 2         | 910.606.336               | 272.356         | 0         | FAILED / READY        |
| 3         | 888.537.088               | 269.256         | 0         | FAILED / READY        |

Todas: container exit=0, OOMKilled=false, grupo=0, swap=0, limite 2.048 MiB,
score pai=0 inalterado, sem listener HTTP e rota pública 403. Job máximo e
RENDERING FAILED/internal-error sem artefatos; limpeza remota e staging,
hashes originais e reentrega sem segunda chamada foram exigidos. A seguinte
atingiu READY, três etapas SUCCEEDED e mesmo hash WebP 25bf96…72c9 da prova
anterior. Nenhum resultado OCR/tradução real ou conteúdo privado foi usado.

**Isso não processou a página máxima com sucesso.** Demonstra falha/recuperação
preventivas nesse cenário, não cota RSS, orçamento total garantido, política de
admissão ou solução de AC-006. A negação não foi observada por trace de malloc;
o guard confirma RLIMIT_AS, mas a causa interna exata da falha sanitizada não
é identificada pelo relatório. Não inventar errno, vítima ou fase do codec.

Fonte primária [getrlimit](https://man7.org/linux/man-pages/man2/getrlimit.2.html)
distingue endereço virtual de RSS. O
[contrato Cloud Run](https://docs.cloud.google.com/run/docs/container-contract)
exige Linux x86_64, conta filesystem como memória e encerra a instância que
ultrapassa seu limite. O pacote/prova ARM64 não valida o alvo AMD64, cgroup
delegado ou contenção cloud. Não houve inspeção da conta/credenciais ou deploy.

Para reproduzir, usar os pins e comandos anteriores, substituindo somente:

```text
-Dtest=NativeRenderingWorkerLinuxTest#preventiveAddressCeilingFailsMaximumWithoutKernelOomAndRecoversSmallPage
```

Snapshot técnico de 336 arquivos:
`27d5215803a7ea764135bb2e9f3197aae402a183fba2f692c5d6e7dec543aa80`.
Boot JAR inalterado:
`848b2b7641975f1a51cb7e5c2658b7f099305bbbdd02930a8fb71b06f9fbe82d`.
Governança mobile separada; hashes históricos não foram substituídos.
Gates globais desta parcela ficam na [review](../review.md), registrados somente
após terminarem, não presumidos pelo foco. 020 in-progress/open, verdict changes-requested, tasks abertas e
021 blocked; próxima decisão técnica é atendimento máximo com proteção total
compatível com o alvo, não promoção por fail-fast nem aumento de RAM cloud.
