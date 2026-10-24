# Teto de endereço do próprio pai — 2026-10-07

Parcela de TASK-002/005/007/008, AC-001/004/005/006. Somente testes e documentação;
produção/JAR, contratos, migrations, caps, qualidade e defaults/RAM cloud intactos.
020 in-progress/open, changes-requested, 021 approved/blocked.

[Protocolo](../../../../../../api/apps/translation-gateway/docs/rendering-parent-address.md),
[helper](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/rendering/OwnedParentAddressProbe.java)
e [testes puros](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/rendering/OwnedParentAddressProbeTest.java).
Não há nova dependência, download, credencial, provider pago, mídia privada,
arquivo mobile, privilégio, C/shell/Python próprio ou operação cloud.

## Controle e escopo

Um JVM helper curto recebe FFM; o JVM worker pai continua sem native access.
getppid deve ser 1 no container privado, executável deve coincidir e ambos os
cgroups devem ser 0::/. Somente PID 1 fixo pode receber prlimit; nenhum PID de
job, argumento ou processo arbitrário é aceito. PID 1 é o worker da fixture,
não o init do computador. Helper não é distribuído no JAR de produção.

AS do pai é apertado para o mínimo unsigned do limite herdado e 3 GiB, nunca
elevado. Reservas existentes acima do teto impedem alteração; write/confirmacão
ignorados ou recusados falham sanitizadamente. Score/CPU/FD do pai não mudam.
O helper encerra antes do bootstrap Spring e antes de lançar o renderer.
As próprias limitações/score/dumpabilidade do helper não são proteção do pai.

Parser de VmSize e readback de /proc/limits limitados, únicos/canônicos;
ausência, overflow, unidades divergentes, infinito ou soft/hard diferentes
não são aprovação. Testes precederam implementação: RED por tipos/métodos
ausentes, depois cinco testes puros green. Escopo/recusa/alvo/mínimo herdado
e dados malformados cobertos sem syscall no host.

## Pipeline máximo observado

Cenário específico `parent-bounded`: container diagnóstico 8 GiB, swap zero,
uma CPU, 64 PIDs, scratch 512 MiB; caps virtuais pai/filha 3 GiB. Os budgets
comuns 2/4 GiB e seus testes de OOM/recuperação continuam intactos. Não aprova
8 GiB operacional ou altera Terraform 1 GiB. Fixture/package/JAR anteriores
reutilizados; fonte máxima multicolor 10.000×8.000 e 7.322.972 bytes.

Spring/SQL/Flyway V1–V7/MockMvc/filtros/storage/renderer reais; OCR/tradução
sintéticos. Rota pública 403, zero listener HTTP, rede somente SQL interna.
Três jobs máximos no mesmo contexto: 1.024 regiões com 256/512 UTF-16; 64 com
4.096/8.192; zero regiões. Todos READY/três etapas SUCCEEDED, referências/hashes,
texto/ordem/vínculo, original íntegro, staging e redelivery sem segunda chamada.

| Ambiente       | memory.peak total (bytes) | VmSize pai antes do cap (bytes) | VmSize pai ao finalizar (bytes) |
| -------------- | ------------------------- | ------------------------------- | ------------------------------- |
| ARM64          | 2.392.866.816             | 1.215.070.208                   | 1.358.929.920                   |
| x86_64 emulado | 2.717.626.368             | 1.637.945.344                   | 1.803.882.496                   |

Kernel confirmou soft/hard AS do pai em 3.221.225.472 bytes antes do Spring e
ao finalizar; score pai 0 inalterado, OOMKilled=false e oom_kill=0. Nenhuma
imagem/limite textual/qualidade reduzido. Hashes WebP coincidem com as provas
anteriores dos mesmos três casos:
260a8b2b25a78c7c3f585dbc58ae71d47bbe34f41b51dd625e749d57a206cb77,
20f8a7520fc336c860788a3e65d763e2050cd5a1e9360caaa5b14ce678412534,
07d6f608433046d70748047730c61374557ea86fc0fe8eac37bd0342a31d1d3e.

## Reprodução, fotografia e limites

Usar os pins/caches da [prova x86_64](rendering-amd64-2026-10-07.md), JAR atual
e reactor offline; selecionar:

```text
-Dtest=OwnedParentAddressProbeTest,NativeRenderingWorkerLinuxTest#ownedParentAndRendererHaveFiniteAddressCeilingsAndMaximumJobsStillComplete,NativeRenderingWorkerAmd64LinuxTest#parentBoundedAmd64WorkerCompletesMaximumJobsWithoutChangingQuality
-Dsurefire.failIfNoSpecifiedTests=false
-Drenderer.worker.resources.enabled=true -Drenderer.amd64.enabled=true
```

Diretórios/pins separados de cada arquitetura e socket/decoder locais já
documentados. O cenário fixa 8 GiB; não aceita esse valor no seletor genérico.
Nenhuma instalação ou pull automático, reinício de Docker ou chamada Google.

342 fontes/testes/configurações, receita path+NUL+bytes+NUL:
ca4acff0fb4c2b401616b6db5723324f2c82aa12ebcc072263eb8639036b8426.
JAR inalterado dba01c8b4d03b250ce1d20914dc6717208921bef739ae4e7b86a7eda7f4c5145.
Checksum mobile separado; gates correntes na [review](../review.md).

Isso demonstra possibilidade de limitar o pai por helper possuído e de manter
os máximos nesse cenário. Não é integração de produção, prova de negação real
do cap no pai, orçamento agregado garantido, recuperação de OOM ou contenção
cloud. Limite virtual não substitui RSS, scratch/cache/socket/kernel; cap do pai
também pode causar falha do próprio JVM. Não apresentar como resolução de AC-006.
Históricos de morte do pai mantidos. Timeout/cancelamento/retention integrais,
qualidade/operação e admissão do runtime continuam abertos; performance mobile N/A.
