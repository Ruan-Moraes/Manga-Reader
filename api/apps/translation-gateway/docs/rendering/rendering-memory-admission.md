# Pré-requisito de memória do modo nativo — 2026-10-07

Parcela funcional de `supervised-native`, ainda experimental. O bean do worker
agora recusa um ambiente insuficiente ou desconhecido no bootstrap e revalida
o orçamento depois de adquirir a capacidade única, antes de staging/decode/filha.
Default continua disabled; Terraform continua 1 GiB, sem apply/deploy. Não é
aprovação para aumentar RAM cloud ou habilitar uploads.

## Política experimental

- JVM pai PID 1 no namespace cgroup v2 `0::/`; política OOM anterior permanece.
- `memory.max` finito, pelo menos 8 GiB; swap zero, `pids.max` finito até 64.
- Pai com soft/hard RLIMIT_AS iguais, finitos e exatamente 3 GiB; VmSize deve caber.
- Filha com teto AS até 3 GiB e heap de 64..128 MiB, default 128 MiB no modo nativo;
  demais limites preservados. Reserva maior é recusada, nunca reduzida silenciosamente.
- Staging em tmpfs de capacidade positiva e até 512 MiB.
- Soma dos tetos pai/filha, scratch e reserva de 1 GiB deve caber no cgroup.
- Cobrança corrente do cgroup mais teto da filha, scratch e reserva também deve
  caber; leituras ausentes, `max`, unidades/overflow ou limites divergentes falham.

O piso 8 GiB pertence ao diagnóstico já executado com dois caps de 3 GiB;
não é estimativa comercial ou orçamento operacional aprovado. A checagem é
somente leitura; não cria cgroups, instala codec/modelo ou carrega FFM no pai.
O bootstrap selecionado agora prepara o próprio pai por helper Java curto:
pré-checagem de PID 1/cgroup/scratch/margem/VmSize, getppid=1, mesmo executável
e cgroup privado. Só aperta o próprio pai; jamais eleva limite herdado ou
aceita PID/path de job. Pai relê o cap real após a confirmação binária e o
término da filha. Helper tem CPU/heap/AS/FD/arquivo/dumpabilidade limitados e
ambiente vazio. Não há FFM no pai, privilégio, shell/C próprio, fallback para
1/2/4 GiB ou troca de qualidade. Cap herdado menor não validado recusa bootstrap.

## Limites da garantia

A releitura não é reserva atômica contra outras cargas, pressão posterior,
ancestrais ocultos ou OOM global do host. AS não representa RAM residente, e
reserva/cap não provam custo máximo de kernel, sockets e cache. Ainda exigem
auditoria e fault injection integrais; não fechar AC-006 pelo bootstrap verde.
O [controle OOM restrito de 2026-10-11](rendering-worker-oom.md#controle-restrito-da-preferência-oom--2026-10-11)
observa recuperação e falhas em containers pequenos sem worker; não substitui
essa auditoria nem admite outro teto operacional.
RenderPort, manifesto, limites de mídia/texto, lossless/exact e estados não mudam.

A admissão é obrigatória no bean gerenciado `NativeRenderingConfiguration`.
Construções diretas de adapters e beans primários exclusivos dos probes antigos
não são admissão de operação. Os experimentos anteriores são preservados como
histórico; seus ambientes sem teto do pai/sem orçamento suficiente não passam
mais pela configuração gerenciada atual. Não remover suas asserções para verde.

## Verificação local

Testes puros cobrem escopo, pressão mutável, limites, parsers e erros sanitizados.
Supervisor revalida antes de lançar/copiar; recusa deixa original e capacidade
íntegros. Probes em ARM64 e x86_64 emulado usam pacote válido e cgroup real de
1 GiB para exigir recusa do bean, sem imagem, provider ou ADC.

O cenário `parent-bounded` existente prova o caminho positivo: Spring/SQL/storage
reais, três máximas READY, OCR/tradução sintéticos e hashes WebP anteriores.
Não confundir providers falsos com qualidade real. Receita/pins do
[experimento do pai](rendering-parent-address.md); selecionar também
`LinuxWorkerMemoryAdmissionTest,IsolatedRenderAdapterTest,NativeWorkerMemoryAdmissionLinuxTest`.

Resultados, fotografia técnica e gates:
[evidência](../../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/rendering-memory-admission-2026-10-07.md).
Fontes primárias: [cgroup v2](https://www.kernel.org/doc/html/latest/admin-guide/cgroup-v2.html)
e [RLIMIT_AS](https://man7.org/linux/man-pages/man2/getrlimit.2.html).

## Seleção do port no bootstrap — 2026-10-08 (UTC)

O default nativo só é construído quando selecionado; um RenderPort primário
fornecido não deve preparar um default que nunca será usado. Um callback
SmartInitializingSingleton resolve o port selecionado antes de encerrar
bootstrap. Não apenas tornar tudo lazy: default inválido ainda deve impedir
refresh antes de uma task potencialmente cobrada. Ports próprios de teste
continuam diagnóstico, não bypass operacional admitido.

Regressão reproduzida/corrigida e probes preventivos inalterados conferidos;
finding de orçamento/OOM agregado continua aberto. Referência:
[callback de bootstrap](https://docs.spring.io/spring-framework/docs/current/javadoc-api/org/springframework/beans/factory/SmartInitializingSingleton.html).
