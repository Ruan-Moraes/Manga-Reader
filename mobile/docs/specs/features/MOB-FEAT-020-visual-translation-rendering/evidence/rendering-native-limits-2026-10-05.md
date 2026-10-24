# Limites Linux da filha supervisionada — 2026-10-05

Parcela de TASK-002/007/008 posterior à
[distribuição relocável](rendering-native-distribution-2026-10-05.md).
Ruan escolheu manter libwebp lossless/exact e autorizou preparação/testes locais.
Não há C próprio, Python, provider/ADC, imagens privadas, rede no runtime,
cloud ou deploy. 020 in-progress/open, verdict changes-requested; 021 blocked.

## Implementação e evidências verificadas

- [Política/processo e reprodução](../../../../../../api/apps/translation-gateway/docs/rendering-native-limits.md).
- [Limites imutáveis](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/infrastructure/rendering/NativeProcessLimits.java),
  [variante explícita](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/infrastructure/rendering/BoundedNativeRenderChildSettings.java),
  [guard Linux Java/FFM](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/infrastructure/rendering/LinuxNativeProcessGuard.java).
- [IPC privado](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/infrastructure/rendering/RenderSubprocessProtocol.java),
  [launcher](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/infrastructure/rendering/RenderJvmLauncher.java),
  [ordem na filha](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/infrastructure/rendering/RenderChildMain.java),
  [seleção do bean](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/infrastructure/rendering/NativeRenderingConfiguration.java).
- [Política/negação/releitura](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/rendering/NativeProcessLimitsTest.java),
  [IPC/reservas/controlado](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/rendering/NativeRenderIntegrationTest.java),
  [Linux real](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/rendering/RenderLinuxLimitsTest.java),
  [máximos/falha/página seguinte](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/rendering/IsolatedNativeRenderLinuxTest.java).

RED dos contratos ausentes confirmado antes de implementar. Regressões CLI/TRN2
preservadas; TRN3 obrigatório no bean opt-in, sem fallback. Limites antes de
fontes/decode, sem FFM no pai. Hash/libc/ABI continuam verificados. Tentativa
inicial dos testes de supervisor dentro do sandbox falhou por restrição local
(timeout esperado tornou-se unavailable); repetida fora dele, sem enfraquecer
asserções. Contextos negativos continuam falhando com erro sanitizado.

## Observações locais, não aprovação operacional

Kernel confirmou soft/hard: CPU 120 s, arquivo 67.108.864 bytes, core 0,
descritores 128 e espaço virtual 3.221.225.472 bytes. Guard reduz somente seus
limites, nunca eleva os herdados. Uma reserva virtual adicional de 3 GiB
negada e uma alocação de 1 MiB aceita; arquivo de 9 KiB limitado a 8 KiB;
loop de CPU sob dois segundos terminado exit 137, OOMKilled=false.

Página máxima 80M/10.000×8.000, 2 GiB cgroup experimental, swap zero,
128 MiB tmpfs, pai 128 MiB heap/filha 256 MiB, limites guardados ativos:

| Fixture sintética | Pico agregado bytes |     Duração ns | Saída bytes | SHA-256 WebP                                                       |
| ----------------- | ------------------: | -------------: | ----------: | ------------------------------------------------------------------ |
| uniforme          |       1.334.992.896 |  9.305.097.897 |      26.738 | `ca529ce0673c3f69be16f0aa921792238fbb696b2bcbe6a07602ac36bea621fe` |
| multicolor        |       1.308.106.752 | 16.179.297.303 |      31.184 | `06d0e81d70b3f9ee77aa9b23c51798fe4eb81d0e31bb25e6353dada5d50ba4c4` |

Imagem reutilizável íntegra e política sem redução; metadata/manifesto conferidos.
Não é prova Spring/DB/storage/layout ou 1.024 regiões. VmHWM reportado pelo
harness é só pai; pico memory.peak é agregado. Reserva virtual não é RSS.
Limite insuficiente causou render-unavailable na filha e zero resultado;
outra execução guardada passou, sem afirmar recuperação do worker residente.
Bean mínimo/package relocável/filha também passaram em página vazia pequena.

Imagem Docker fixada já cacheada, Java 23.0.2+7/Alpine ARM64, root readonly,
network none/pull never, non-root, cap-drop ALL, no-new-privileges. Probes de
limites usam 1 GiB apenas para JVM pequena; máximos usam 2 GiB experimental.
Não alterou Terraform/defaults e não enviou amostras reais.

## Snapshot técnico

331 fontes/testes/configurações do gateway, SHA-256
`9a9e86239d339ce7fac8fe17dbc407e002166c4397c56dc6750d4d2a9edc942b`;
Boot JAR `fbb7aa2945d45288b76c3f1fc45d96816425855acea896a38081573f323cdfb5`.
Mesma receita anterior: paths relativos ordenados de src/scripts/openapi,
pom.xml e Terraform .tf/.tfvars.example, path + NUL + bytes + NUL em SHA-256
cumulativo, excluindo docs/target/.DS_Store/.terraform/lock local. Não é checksum
mobile nem renova hash/verdict histórico. Sem migration ou contrato público novo.

## Gates e findings

Foco completo de contratos/supervisor/Linux/pacote/máximos: exit 0. Onze novos
casos Java. Suíte leve fora da restrição de localhost: exit 0. Node: 91 pass,
um opt-in de fonte não selecionado, zero falhas; web typecheck: exit 0.

Primeira rodada global offline/Docker: 1.070 testes/98 classes no gateway,
seis falhas linux-render-test-timeout, zero errors/skips. Pausas/clock leaps
extensos foram observados no ambiente; quatro falhas no harness supervisionado
e duas no harness Linux de recursos, em comandos Docker. A rodada não foi
aprovada, deadlines/asserts não foram alterados. Repetição integral utiliza
`caffeinate -i` somente durante o comando, sem mudança de preferências ou código.
Os resultados terminais da repetição e do pnpm check integral são registrados na
[review corrente](../review.md); não inferir aprovação do histórico anterior.
Capture/count globais antes de nova sobrescrita dos relatórios; quatro XMLs
manuais históricos não pertencem à rodada e não são apagados. Hash técnico
reconferido sem divergência. Gates SDD/links/formato/diff são reexecutados após
estabilizar documentos e rebasear mecanicamente headers, sem renovar verdicts.

AC-001/004: regressões de original/página vazia mantidas. AC-006: prova parcial
de limites da filha, não orçamento/isolamento completos. AC-002/003 não recebem
nova aprovação visual; AC-005 permanece coberto por testes de retenção já
existentes, sem nova prova cloud. Qualidade geral e Android não inferidos.

Findings remanescentes: máximo agregado acima de 1 GiB, orçamento do worker
completo, staging total/árvore, OOM compartilhado e auditoria do coletor de
crash do host (RLIMIT_CORE pode ser ignorado por pipe; flags da JVM não aprovam
proteção externa). Não transformar teto virtual
em cota de RAM ou arquivo individual em quota de diretório. TASK-002/006/007/008
abertas; 020 in-progress/open e 021 bloqueada. Runtime mobile não alterado,
performance mobile não aplicável a esta parcela documental.
