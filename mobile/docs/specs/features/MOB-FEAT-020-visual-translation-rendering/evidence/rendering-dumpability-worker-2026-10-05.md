# Dumpabilidade da filha e harness Spring — 2026-10-05

Fotografia histórica preservada. A
[execução posterior de 2026-10-07](rendering-worker-linux-2026-10-07.md)
registra recuperação sem restart, correções do harness e resultados observados;
não renova a aprovação ou o hash desta rodada anterior.

Parcela de TASK-002/007/008 após os
[limites Linux](rendering-native-limits-2026-10-05.md). Mantém libwebp
lossless/exact e orçamento total medido. 020 in-progress/open,
verdict changes-requested; 021 approved/blocked. Sem provider/ADC, imagem
real, cloud, deploy, aquisição, migration ou runtime mobile.

## Proteção comprovada

[Guard Java](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/infrastructure/rendering/LinuxNativeProcessGuard.java)
aplica PR_SET_DUMPABLE=0 e confirma PR_GET_DUMPABLE antes de limites/fontes/mídia.
Recusa ou releitura diferente encerra a filha sanitizadamente. Não altera
sysctl/coletor nem usa C próprio ou FFM no pai. Argumentos variádicos usam long
na ABI LP64, conforme [prctl](https://man7.org/linux/man-pages/man2/prctl.2.html)
e [dumpable](https://man7.org/linux/man-pages/man2/PR_SET_DUMPABLE.2const.html).

[Testes puros](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/rendering/NativeProcessLimitsTest.java)
precederam a implementação (RED de métodos ausentes). Ordem antes de write,
recusa e alteração ignorada conferidas; mínimo unsigned/limites conservados.
[Teste Linux](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/rendering/RenderLinuxLimitsTest.java)
e [probe](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/rendering/RenderLinuxLimitsProbe.java)
confirmaram baseline dumpable=1, guard=0, limites/mmap/arquivo/CPU e crash nativo
sem dump no staging. Campo ausente não vira zero aprovado.

Experiência inicial com raise não provou a terminação esperada; o teste passou
a abort nativo não retornante com checkpoint. Runtime fixado: exit 139,
OOMKilled=false, nenhum retorno/core/crash file. Causa interna do sinal não
presumida; expectativa SIGABRT substituída pela observação reproduzida, mantendo
asserts estritos de terminação/dumpabilidade/arquivos/OOM. Foco final: dez casos,
exit 0. Rodada anterior de 21 casos reprovou somente a expectativa de sinal;
máximos e bean relocável passaram com a proteção nova. Não é gate global.
Protege contra core automático sob esse atributo, não administrador ou coleta
independente da plataforma; bootstrap do pai/operação continuam sem admissão.

## Harness preparado, sem resultado aprovado

[Plano anterior ao código](../../../../../../api/apps/translation-gateway/docs/rendering-worker-linux.md),
[teste](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/rendering/NativeRenderingWorkerLinuxTest.java)
e [main](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/rendering/NativeRenderingWorkerProbe.java)
preparam Spring/Flyway V1–V7/PostgreSQL 17, MockMvc/filtros, storage/renderer reais.
Providers sintéticos, bootstrap disabled/sem ADC, diretórios 0700 e original
readonly sem alias gravável no export. Nada desse fixture entra no artefato
de produção. Pequeno/vazio, 80M/1.024 regiões, 64 regiões com expansão máxima,
reentrega e sequência são **cenários planejados, não resultados observados**.

Harness inicial: 2 GiB experimental, heap pai 512 MiB/filha 256 MiB, uma CPU,
64 PIDs, swap zero e tmpfs 512 MiB. SQL separado/rede interna/sem portas;
motor SQL fora de memory.peak do worker. SDKs cloud/layout residentes e fault
injection completos não são aprovados. Suporte cacheado readonly fixado:

| JAR                        | SHA-256                                                            |
| -------------------------- | ------------------------------------------------------------------ |
| spring-test 6.2.3          | `349eaa7d8d496a3b68490ccc722f04cbd711ce4308300c5922a13bb207469bc6` |
| spring-security-test 6.4.3 | `a2ddc2152dbf50604d1777bcb63b7e5dd94079e271f9be0ebf0c3b1688a29914` |

## Ambiente, gates e snapshot

Testcontainers aguardava bootstrap do client, handle vivo/sem resultado.
OrbStack status Running; ping no socket em três segundos: timeout 28/zero bytes;
docker info aguardava resposta. Não presumir fim por ausência de output nem
iniciar segunda rodada. Nenhum restart/reset/remoção abrangente executado.
Reinício do engine solicitado à pessoa: pode interromper cargas desconhecidas.

Suíte leve e foco de contratos/launcher/configuração exit 0; Node 91 pass/um
opt-in não selecionado/zero falhas; web typecheck exit 0. Maven global/harness
completo pendentes, verde anterior não valida esse código. Gates mobile/SDD/
links/formato/diff correntes registrados na [review](../review.md) após execução.

333 fontes/testes/configurações, **incluindo harness ainda não executado**:
SHA-256 `f04346735eef71029732e89ec75302130425b3a661422cd2695fbaca3ea7d174`.
Boot JAR `b40013ebf925148975d95828e34425493c7cf7fce19252cbc3abb6151f7bca5b`.
Receita anterior: paths relativos ordenados src/scripts/openapi, pom.xml e
Terraform .tf/.tfvars.example; path+NUL+bytes+NUL, exclui docs/target/.DS_Store/
.terraform/lock local. Separado do checksum mobile, sem renovar histórico ou
implicar execução de todos os fontes.

AC-006 parcial: core automático protegido, recursos/operação abertos.
AC-001/004/005 têm regressões focais anteriores preservadas, não resultado novo
do worker; AC-002/003 sem aprovação visual. TASK-002/006/007/008 abertas,
021 bloqueada e defaults/RAM cloud intactos. Performance mobile não aplicável
à governança; Java não aprova Android ou legibilidade.
