# Prazo e posse da chamada de render — plano, 2026-10-04

Parcela de TASK-002/007/008, AC-006 da MOB-FEAT-020. Prova Linux anterior
entregue; 020 in-progress/open, 021 blocked. Não ativar renderer/cloud/provider.

## Lacuna e implementação prevista

O IsolatedRenderAdapter usa prazo monotônico, mas executa criação da filha,
IPC, inspeção e transferência no chamador. Uma operação que não responde a
interrupção pode ultrapassar o prazo indefinidamente. Snapshots de processos e
heap limitado não resolvem esse problema, nem são contenção kernel.

Preparar um supervisor privado da chamada completa. Uma capacidade global,
sem fila, admitirá uma thread virtual possuída; não herdar ThreadLocals. O
chamador espera somente até o deadline monotônico original. Cancelamento ou
timeout abandona o resultado e interrompe a execução possuída, sem esperar
I/O/terminação arbitrariamente demorados no chamador.

Pedido de interrupção também será feito fora do chamador: a implementação do
JDK pode executar fechamento de canal no caminho de interrupt. Uma única
thread sinalizadora privada por chamada abandonada, sem fila/herança de contexto,
faz essa operação. A capacidade só volta após execução, limpeza e sinalização
terminarem; sinalização bloqueada não autoriza outra execução.

Capacidade permanece retida até finalizar a operação, confirmar morte dos
processos observados e remover arquivos próprios. Publicação do resultado é
handshake de posse: somente confirmação pelo chamador antes do prazo transfere
o WebP. Resultado tardio nunca retorna, é removido pelo proprietário e não
autoriza segunda execução enquanto cleanup estiver pendente. Falha cuja
terminação/limpeza não é confirmada mantém capacidade indisponível, sem retry
automático ou exclusão de arquivos alheios.

Reutilizar os contratos/IPC e o launcher já admitidos. Preservar reserva única,
conteúdo/pixels/manifesto e defaults; nenhum bean novo. O supervisor não cria
fila ilimitada nem thread por chamada recusada. Não alterar DB/migrations,
HTTP, RenderPort ou task.

## Testes antes do código

Reproduzir launcher que bloqueia ignorando interrupção: erro deve voltar no
prazo, capacidade continua busy, criação tardia é encerrada antes da liberação.
Cobrir I/O/delegate tardio, descarte do resultado, cancelamento com interrupt
preservado, sucesso com transferência única, falha sanitizada, limpeza não
confirmada e ausência de ThreadLocal herdado. Revalidar processos reais e
equivalência nativa/Boot/Linux, com novas classes empacotadas antes dos testes.

## Limites conservados

O erro ao chamador pode preceder a conclusão do cleanup; não alegar que um
timeout mata instantaneamente toda árvore. Uma thread Java presa pode manter
capacidade indisponível até restart. Contenção atômica Linux, orçamento nativo/
disco, empacotamento/licenças e profiling seguem pendentes antes de ligar o
worker supervisionado. Não converter essas lacunas em mero benchmark externo.

Gates: Maven offline/Docker, testes leves, nativos/Boot/Linux opt-in, Node, web
typecheck, pnpm check integral, SDD/links/formato direcionado/diff. Sem download,
nova mídia, Google, credenciais, chamadas pagas ou alteração legal.

## Implementação e reprodução

### Posse da entrada no timeout — correção de 2026-10-08

O worker pode liberar seu arquivo inspecionado quando o RenderPort retorna,
antes do término da operação privada. Uma regressão reproduziu que o IPC
ainda apontava para esse arquivo emprestado: apagar o arquivo após timeout
também removia a entrada da filha tardia. Isso era código divergente, não
pendência de benchmark. O IsolatedRenderAdapter agora cria `original.bin`
privado dentro do staging, sob capacidade/admissão e antes do launcher. Copia
por blocos de 8 KiB, limitando bytes pela política e metadata, conferindo tamanho
exato/SHA-256 e prazo/interrupção. Não copia raster, muda qualidade ou contrato.
A operação privada mantém/removerá o snapshot junto ao staging depois de
terminação confirmada; o chamador não recebe posse desse arquivo.

O teste leve exclui explicitamente a entrada emprestada após timeout e confere
que o snapshot próprio continua íntegro até a filha tardia ser encerrada,
depois desaparece. Bytes adulterados ou excedentes não iniciam filha e não
deixam staging. Limites de dimensão/MIME permanecem revalidados no codec.
O snapshot comprimido adicional participa do consumo de tmpfs/cgroup, não
autoriza orçamento operacional maior.

O harness admitido acrescenta pausas test-only via SIGSTOP/SIGCONT somente
na filha viva/possuída do worker PID 1, dentro do container privado preparado.
Não sinaliza processos do computador nem usa script/C próprio ou FFM no pai.
Timeout usa deadline experimental de 15 segundos e launcher que retém a filha
até a conferência de posse/capacidade; depois o supervisor termina/recolhe a
filha. Cancelamento passa pelo caso de uso transacional durante RUNNING e
retoma a filha: o codec termina, mas CANCEL_PENDING impede commit de READY,
descarta artefatos e termina CANCELLED. Não promete abort nativo imediato ou
identifica um hang real do libwebp. Providers continuam exclusivamente falsos.

RenderCallSupervisor executa a operação do IsolatedRenderAdapter numa thread
virtual privada, sem InheritableThreadLocals. Uma chamada recusada não cria
thread. O mesmo início monotônico é usado pelo supervisor e pelo adapter.
Saída só muda de dono via handshake antes do deadline; saída tardia é removida.
Cleanup não confirmado mantém a capacidade indisponível. Sinalização de
cancelamento é única, em outra thread privada; sua espera nunca roda no chamador.

A API de [Thread.interrupt no Java 23](<https://docs.oracle.com/en/java/javase/23/docs/api/java.base/java/lang/Thread.html#interrupt()>)
inclui fechar um InterruptibleChannel. Por prudência, esse caminho não é tratado
como uma operação de tempo constante; o teste de sinalização bloqueada é
sintético, não uma medição de filesystem ou uma afirmação de latência kernel.

Reprodução focalizada a partir de api, sem provider ou codec:

```bash
./mvnw -o -q -pl apps/translation-gateway -am test \
  -Dtest=RenderCallSupervisorTest,IsolatedRenderCallDeadlineTest,IsolatedRenderAdapterTest \
  -Dsurefire.failIfNoSpecifiedTests=false
```

A chamada pode devolver timeout/cancelamento antes de remover o staging/matar
a filha; testes confirmam depois a limpeza e liberação da capacidade. Isso não
enfraquece a garantia de posse nem admite duas operações simultâneas. Uma thread
presa ou limpeza sem confirmação exige recuperação explícita/restart, não retry.
O supervisor não modifica o bean local do worker nem defaults.

[Evidência datada](../../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/rendering-call-deadline-2026-10-04.md)
registra red/green, hashes e gates. A prova anterior Linux/Boot permanece
histórica; o JAR desta parcela foi reempacotado antes de ser revalidado.
