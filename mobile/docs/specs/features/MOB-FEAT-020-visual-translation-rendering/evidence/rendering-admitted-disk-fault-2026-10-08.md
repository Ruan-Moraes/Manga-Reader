# Falta de espaço no worker admitido — 2026-10-08

Parcela de TASK-002/007/008, AC-001/005/006, após a escolha humana de manter
libwebp com orçamento total medido. Nenhuma mudança em runtime, codec, qualidade,
limites, migrations, provider, credencial, mídia real ou RAM cloud. 020 continua
`in-progress/open`, verdict `changes-requested`; 021 `approved/blocked`.

## Preparação e escopo

O teste usa a fábrica `NativeRenderingConfiguration.preparedRenderer`, com
preparação/admissão reais do pai. Só o launcher de testes injeta pressão após
a admissão. O helper `AdmittedRenderFaults.fillScratch` exige staging
`/work/render/render-jvm-*`, filesystem tmpfs positivo de até 512 MiB,
arquivo create-only/nofollow e escrita limitada. Um teste confirma recusa
antes de criar arquivo no filesystem do computador. Nunca preenche pasta
do repositório ou bucket. Pressão não é sparse: grava bytes até falta de
espaço, conferindo espaço útil real; outro erro de I/O não é aprovação.

O primeiro RED foi ausência de `fillScratch`; a nova fixture também precedeu
seu método de execução. Não houve mudança de requisito ou de asserção antiga.
São testes exclusivos de `src/test`, não incluídos no artefato de produção.

A mesma imagem PNG sintética multicolor de 10.000 × 8.000 (80M pixels),
7.322.972 bytes, SHA-256
`15e8bc69f58a1905ecd2805ce56267ee652e6dd6a69674663662ae8d5b25469c`
recebe 1.024 regiões e providers falsos. JAR/pacotes pinados, root/entradas
readonly, rede privada só com PostgreSQL 17, uma CPU, 64 PIDs, swap zero e
tmpfs 512 MiB. Pai inicialmente ilimitado recebe cap real 3 GiB antes de task;
filhas conservam seus caps normais 3 GiB. Cgroup 8 GiB é diagnóstico local,
não RAM cloud aprovada ou benchmark de consumo completo.

## Resultados observados

Três repetições ARM64 concluídas no mesmo fluxo Spring/SQL/storage/renderer:

| Rodada         | Pressão (bytes) | Espaço útil na falha | Pico cgroup (bytes) | Tempo total (s) |
| -------------- | --------------- | -------------------- | ------------------- | --------------- |
| ARM 1          | 520257536       | 0                    | 1000050688          | 10,783          |
| ARM 2          | 520257536       | 0                    | 907919360           | 9,728           |
| ARM 3          | 520257536       | 0                    | 858832896           | 9,444           |
| x86_64 emulado | 520257536       | 0                    | 1147908096          | 31,680          |

Em todas: uma injeção, duas filhas reais exit 1 → 0, nenhuma viva ao término,
zero `oom_kill`, job/etapa FAILED sem artefato → página seguinte READY com
três etapas SUCCEEDED. Original reutilizável preservado; reentrega não chamou
providers novamente; staging limpo. Ao final, 536.846.336 bytes livres no tmpfs.
Saída da sucessora: 9.734 bytes, SHA-256
`25bf96a61025d14bef4290977c65cd32654c5ef57842a7da75dcd8df81db72c9`.
Pai continua com cap real 3.221.225.472 bytes. Não inventar fase/errno nativo
a partir do erro sanitizado `internal-error`.

O caso x86_64 emulado também passou com a mesma recuperação, processos,
hashes, espaço final e zero OOM. Não é execução em hardware nativo/Cloud Run.
Foco completo: 18 testes, zero failures/errors/skips, exit 0. Inclui quatro
rodadas anteriores de falha de AS reexecutadas e dez testes leves/configuração.
Maven global padrão offline com Docker terminou exit 0: 2.555 testes/826
classes, zero failures/errors, 75 opt-ins não selecionados; gateway 1.084/110.
XMLs frescos desde `2026-10-08T10:23:31Z`, contados antes da suíte leve.
Não é aprovação do extended nativo completo. Comando: `./mvnw -o -q test`,
Docker local já preparado, sem instalação ou chamadas externas de providers.

Node `node --test scripts/*.test.mjs`: 92 pass/um opt-in não selecionado,
zero failures. Web `./node_modules/.bin/tsc -b`: exit 0. Primeiro `pnpm check`
integral passou com 116 suítes/892 testes antes da consolidação documental.
A checagem intermediária SDD recusou checksums após a nova entrada evidence;
63 headers correntes foram rebaseados mecanicamente, sem renovar conclusões
históricas, datas, verdicts ou alterar validadores. Outra execução integral
parou em Prettier após editar a matriz review; formatação foi dirigida somente
ao documento alterado, e exige execução final integral aprovada.

A edição posterior desta evidência voltou a invalidar o checksum antes da
estabilização: o hash SDD inclui documentos/evidências, exceto review/drift.
Nenhum validador foi alterado. Suíte leve do módulo/reactor com
`-Dtest.excludedGroups=testcontainers` terminou exit 0. Check final mobile,
SDD/links/formatação/diff serão registrados na
[review corrente](../review.md) após estabilizar a árvore e rebasear headers,
sem inserir o hash SDD na própria evidência ou criar autorreferência.
Sem containers `toonlira-render-*` vivos ao fim dos testes locais.

## Reprodução

Em `api/`, usar `./mvnw -o -q -pl apps/translation-gateway -am test`,
`-Dsurefire.failIfNoSpecifiedTests=false` e selecionar:

```text
-Dtest=AdmittedRenderFaultsTest,RenderingConfigurationTest,NativeRenderingWorkerLinuxTest#admittedWorkerCleansExhaustedScratchAndRecoversFollowingPage+admittedWorkerIsolatesAllocationFailureAndRecoversFollowingPage,NativeRenderingWorkerAmd64LinuxTest#admittedAmd64WorkerCleansExhaustedScratchAndRecoversFollowingPage+admittedAmd64WorkerIsolatesAllocationFailureAndRecoversFollowingPage
```

Reutilizar Docker/Java 23/codec/pacotes previamente preparados e pins da
[prova de memória admitida](rendering-admitted-memory-fault-2026-10-08.md).
Não baixar dependências/imagens automaticamente. Seleção inclui regressão
de memória; tests originais de OOM kernel/recusas não foram removidos.

## Integridade e pendências

Snapshot técnico, 352 arquivos source/tests/config do gateway, receita
paths relativos ordenados + NUL + bytes + NUL, SHA-256:
`9003da674343b9c54cd3178e920387cf23838dcc7b99a449bfd25e130c49dd7e`.
JAR de produção inalterado:
`6c8246919b0ef2151b7c273140202f0313ff7fe48b6f72ca715d71e623ec113f`.
Snapshots históricos, inclusive f2d75d6d…0986, não foram renovados.
Checksum SDD separado cobre governança mobile, não código Java.

Esta prova não resolve OOM kernel compartilhado, orçamento agregado em todos
os extremos/SDK/layout, timeout/cancelamento admitidos, retenção integral,
qualidade ou operação. Suíte padrão com opt-ins não selecionados não aprova
o gate extended inteiro. TASK-002/006/007/008 ficam abertas. Performance mobile
N/A: apenas governança modificada; métricas Linux não equivalem a Android.
