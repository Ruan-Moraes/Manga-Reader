# Limites da filha nativa — 2026-10-05

Parcela incremental de TASK-002/007/008, após a
[distribuição local](rendering-native-distribution.md). Mantém a decisão de
libwebp lossless/exact com orçamento total medido. Não admite o worker completo
nem altera RAM cloud/defaults: 020 in-progress/open, 021 blocked.

Parcela posterior: a filha aplica/relê PR_SET_DUMPABLE=0 antes de fontes/mídia.
A [evidência](../../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/rendering-dumpability-worker-2026-10-05.md)
separa essa proteção do harness Spring ainda aguardando Docker. Números/gates
abaixo permanecem a fotografia da parcela anterior, não aprovam o novo harness.

## Fronteira e política

`supervised-native` seleciona `BoundedNativeRenderChildSettings`. Na filha,
`LinuxNativeProcessGuard` reduz seus próprios soft/hard limits via FFM Java 23
para a libc da imagem Linux ARM64/musl controlada. Não usa código C próprio,
shell, privilégios, cgroup delegado ou acesso nativo no pai. Verifica retorno e
releitura; recusa/incompatibilidade termina a filha sem saída parcial válida.
Nunca eleva um limite herdado: usa o menor valor unsigned entre política,
soft e hard existentes. A política interna inicial é:

| Recurso       | Teto experimental | O que limita                                                           |
| ------------- | ----------------- | ---------------------------------------------------------------------- |
| RLIMIT_AS     | 3 GiB             | espaço virtual de cada filha, não RSS nem RAM agregada                 |
| RLIMIT_CPU    | 120 segundos      | CPU consumida pela filha; deadline monotônico do pai continua separado |
| RLIMIT_FSIZE  | 64 MiB            | um arquivo individual, não o total de staging                          |
| RLIMIT_NOFILE | 128               | descritores por processo                                               |
| RLIMIT_CORE   | 0                 | limita o arquivo core regular; coletor do host exige auditoria         |

Constantes/semântica: [header Linux](https://github.com/torvalds/linux/blob/master/include/uapi/asm-generic/resource.h)
e [getrlimit/setrlimit](https://man7.org/linux/man-pages/man2/getrlimit.2.html).
RLIMIT_RSS não foi usado como falsa proteção de RAM. RLIMIT_NPROC não foi usado
como isolamento por instância. Os testes têm adicionalmente cgroup/PIDs/tmpfs,
sem transferir essas garantias do harness para a implantação cloud.

O protocolo privado TRN3 adiciona os quatro limites explícitos; CLI TRN1,
probes FFM históricos TRN2, resposta TRS1 e contratos públicos não mudam.
O parse validado e limitado a 8 MiB ocorre antes da aplicação dos limites;
fontes, decode, pintura e codec só começam depois da confirmação do kernel.
A JVM já existe nesse instante: a proteção não cobre seu bootstrap como se
fosse uma sandbox externa. Uma falha não retorna manifesto ou imagem válidos.

Na configuração nativa corrente, a filha usa heap de 64..128 MiB (default 128 MiB),
metaspace 96 MiB, compressed class space 32 MiB, code cache 64 MiB, Serial GC,
uma CPU lógica e direct buffers NIO até 384 MiB. NIO/heap não limitam toda a
memória FFM ou interna do codec. A JVM usa flags para não gerar core/crash file
no staging; stdout/stderr continuam descartados e ambiente não é herdado. Não há novas
variáveis, download automático, fallback não limitado ou alteração de qualidade.

Atualização de 2026-10-08: a reserva anterior de 256 MiB foi reproduzida com
falha de alocação no encode do JPEG RGB válido de 80M pixels, apesar do decode
concluído e de zero OOM do kernel. Controles ARM64 com heaps de 64/128 MiB
passaram sob AS de 3 GiB, mas reduzir heap não resolveu o x86_64 emulado.
A política versionada `clean-box-1.1` seleciona método 0, mantendo lossless,
exact e quality 100; a 1.0 preserva método 4. Com heap 128 MiB e AS inalterado,
o foco do worker concluiu 12 READY máximos JPEG/WebP nos dois alvos, sem perda
de pixels no controle independente. O bean recusa reservas maiores, sem elevar
caps, reduzir mídia/qualidade ou modificar cloud. A
[evidência corrente](../../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/rendering-jpeg-headroom-2026-10-08.md)
separa controles, worker e regressão ampliada dos históricos abaixo; não é
admissão operacional do orçamento de produção.

Ressalva de segurança: o Linux pode ignorar RLIMIT_CORE quando
[core_pattern envia dumps a um coletor por pipe](https://man7.org/linux/man-pages/man5/core.5.html).
Os flags/limites aqui não comprovam isolamento desse coletor do host. A admissão
operacional exige proteção e prova de ausência de captura externa de memória;
nenhum sysctl, coletor ou configuração do computador foi alterado neste marco.

## Provas locais

Container Java 23.0.2+7 já fixado/cacheado, network none, root/package readonly,
non-root, cap-drop ALL, no-new-privileges, pull never. O teste de limites usa
1 GiB/uma CPU/64 PIDs; as páginas máximas usam 2 GiB experimentais, swap zero
e tmpfs de 128 MiB. Nenhuma imagem privada ou provider é usado.

- Baseline da JVM com reservas controladas: aproximadamente 596 MiB virtuais
  e 65 MiB residentes, antes de decode. É uma observação local, não SLA.
- Kernel confirmou os cinco limites; uma reserva mmap de 3 GiB adicionais
  foi negada, seguida de alocação de 1 MiB bem-sucedida, sem OOM do cgroup.
- Arquivo de 9 KiB sob teto de 8 KiB falhou, sem sucesso fabricado; loop CPU
  sob teto de dois segundos terminou com exit 137 e OOMKilled=false.
- Limite experimental de endereço insuficiente falhou somente a filha; o
  supervisor ficou vivo, preservou o original/sem saída e outra execução
  guardada produziu WebP íntegro. Isso não prova que o pai sobreviverá a OOM
  do cgroup inteiro nem uma sequência dentro do worker Spring residente.
- PNGs sintéticos de 10.000×8.000, uniformes e multicolor, passaram sem reduzir
  limites, com pintura, libwebp e guard ativos. Picos pai/filha observados na
  rodada focal: 1.334.992.896 e 1.308.106.752 bytes; tempos 9,31 e 16,18 s.
  São aproximadamente 1,24/1,22 GiB, acima dos 1 GiB cloud atuais.
- Bean mínimo real seleciona a variante guardada; pai sem native access,
  package relocável e página pequena vazia preservada. Não é worker completo.

## Reprodução e pendências

Preparar o JAR pelo reactor, explicitamente offline. O harness não adquire imagem
Docker, libwebp ou pacote. Com caches preparados:

```text
./mvnw -o -q -pl apps/translation-gateway -am package -DskipTests
./mvnw -o -q -pl apps/translation-gateway -am test
  -Dtest=RenderLinuxLimitsTest,IsolatedNativeRenderLinuxTest,NativeCodecDistributionLinuxTest
  -Dsurefire.failIfNoSpecifiedTests=false
  -Drenderer.distribution.enabled=true -Drenderer.shared.resources.enabled=true
  -Drenderer.linux.docker.host=<socket-local>
  -Drenderer.linux.codec.directory=<CLI-cache-absoluto>
  -Drenderer.shared.directory=<bibliotecas-historicas-absoluto>
  -Drenderer.distribution.directory=<pacote-relocavel-absoluto>
  -Drenderer.distribution.sha256=<pin-externo>
```

Flags da segunda execução representam um único comando. As bibliotecas
históricas ficam no harness de recursos, não na seleção do bean de produção.
Resultados/código auditados estão na
[evidência SDD](../../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/rendering-native-limits-2026-10-05.md).

Faltam profiling do worker Spring/PostgreSQL/storage/layout/fontes residentes,
volume textual máximo, sequência e fault injection completos; orçamento total
e contenção operacional de memória/disco/árvore. RLIMIT_AS não é cota RSS,
RLIMIT_FSIZE não é quota de diretório, snapshots de descendentes não são cgroup
atômico. O cgroup compartilhado ainda pode matar o pai. Não habilitar produção
com 1 GiB por extrapolar estas provas, não aumentar RAM sem decisão operacional,
não reclassificar lacunas funcionais como simples revisão externa.
