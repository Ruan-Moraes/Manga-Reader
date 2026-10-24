# Worker completo em Linux — 2026-10-07

Parcela de TASK-002/005/007/008 posterior ao
[harness preparado](rendering-dumpability-worker-2026-10-05.md).
020 `in-progress/open`, verdict `changes-requested`; 021 `approved/blocked`.
Sem imagem/captura real, ADC, Google, download, cloud ou runtime mobile.
Produção, contratos, qualidade, migrations, defaults e RAM cloud inalterados.

## Recuperação e regressões do harness

Docker voltou a responder sem restart/reset. Handle anterior concluído antes
de nova execução; autorização de reinício não presumida. Dois bugs de teste:

- Classes aninhadas têm nome binário com `$`, não getSimpleName(). Cópia do
  recurso absoluto pelo nome binário agora limitada, com recusa se ausente.
  Teste RED precedeu helper; magic CAFEBABE/classes/providers conferidos.
- Boot 3.4.3 mantém Connector configurado na porta 0 com server.port=-1.
  Isso não significa listener. Fonte oficial cacheada de
  TomcatServletWebServerFactory/TomcatWebServer confirma autoStart=false.
  Teste exige ambiente -1 e getLocalPort()=-1 para todos os connectors.
  Observado: configuredPorts=[0], localPorts=[-1], zero listeners.
  Nenhuma porta publicada; filtros reais recusam /v1/capabilities com 403.

Nenhum filtro/listener foi retirado para obter verde. Falhas anteriores de
bootstrap/assert são diagnóstico, não resultado real ou gate aprovado.

## Ambiente e resultados medidos

[Teste](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/rendering/NativeRenderingWorkerLinuxTest.java),
[probe](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/rendering/NativeRenderingWorkerProbe.java)
e [fixture](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/rendering/LinuxRenderContainerFixture.java):
Boot JAR real, Spring/worker, Flyway V1–V7/PostgreSQL 17 privado, MockMvc/filtros,
storage/renderer reais. Somente OCR/tradução são fakes de teste, nunca clientes.
Jobs/outbox pelos casos de uso existentes; task `{jobRef}`. Classes de teste
não são empacotadas; bootstrap disabled não busca ADC.

Java 23.0.2+7 Alpine ARM64, pacote libwebp 1.6.0 readonly/pinado, non-root,
cap-drop ALL/no-new-privileges, uma CPU, 64 PIDs, swap zero, tmpfs /work 512 MiB
e /tmp 64 MiB. Heap pai 512 MiB/filha 256 MiB; guard/dumpable=0 preservados.
SQL separado em rede interna, sem portas. memory.peak inclui JVMs/nativo/cache/
tmpfs do worker, **não o motor SQL**. VmHWM abaixo mede somente o pai.

| Rodada                     | Cenário                       | Teto local | Resultado                        | memory.peak                     |
| -------------------------- | ----------------------------- | ---------- | -------------------------------- | ------------------------------- |
| Primeira execução conjunta | pequena, dois jobs            | 2 GiB      | READY/3 etapas SUCCEEDED por job | 685.596.672 bytes               |
| Primeira execução conjunta | máxima 80M, texto máximo      | 2 GiB      | falha: Docker OOMKilled=true     | métrica final indisponível      |
| Diagnóstico explícito      | máxima, três jobs sequenciais | 4 GiB      | READY/3 etapas SUCCEEDED por job | 2.407.153.664 bytes (~2,24 GiB) |
| Diagnóstico explícito      | pequena, dois jobs            | 4 GiB      | READY/3 etapas SUCCEEDED por job | 725.565.440 bytes               |

Diagnóstico focal 4 GiB: 14 testes, exit 0. Máxima durou 56.557.636.512 ns,
pai VmHWM 274.156 KiB; pequena 9.977.208.801 ns, pai 258.308 KiB. Uma rodada,
não SLA/estatística. Métrica ausente após OOM não vira zero aprovado.

**2 GiB não foram aprovados para o worker completo.** Opção de teste
renderer.worker.memoryMiB=4096 é diagnóstico funcional. Default continua 2048;
apenas 2048/4096 admitidos, com teste de recusa antes de Docker. Não altera
1 GiB Terraform nem admite produção. Não reduz mídia/texto/qualidade, muda
compression method ou aumenta deadline para fazer o teste passar.

## Integridade, limites e reentrega

Pequena PNG 320×220, 160.942 bytes, hash
`06985649f58a3c7d55cce5dcdd8ed60416ab67ce846a6f4b36694f3ebaba59a2`.
Zero/uma região; WebP 88/9.734 bytes respectivamente.

Máxima PNG multicolor 10.000×8.000, 7.322.972 bytes, hash
`15e8bc69f58a1905ecd2805ce56267ee652e6dd6a69674663662ae8d5b25469c`.
Mesma mídia reutilizável em três jobs sequenciais no mesmo contexto:

| Regiões | Origem/destino UTF-16 por região | Bytes WebP | SHA-256 WebP                                                       |
| ------- | -------------------------------- | ---------- | ------------------------------------------------------------------ |
| 1.024   | 256/512; totais 262.144/524.288  | 132.976    | `260a8b2b25a78c7c3f585dbc58ae71d47bbe34f41b51dd625e749d57a206cb77` |
| 64      | 4.096/8.192; mesmos totais       | 130.480    | `20f8a7520fc336c860788a3e65d763e2050cd5a1e9360caaa5b14ce678412534` |
| 0       | vazios                           | 24.738     | `07d6f608433046d70748047730c61374557ea86fc0fe8eac37bd0342a31d1d3e` |

Assertions: READY/3 etapas SUCCEEDED, hashes reais dos dois arquivos iguais ao
banco, manifesto vinculado ao job/hash original, IDs/ordem/texto sintético
integral. HTTP 204 não basta. Reentrega conserva artefatos e não chama fakes
novamente; vazio nunca chama tradução. Original remoto por job removido,
fonte readonly preservada, staging possuído limpo depois de sucesso.
Manifest hashes variam por job; não alegar determinismo entre jobs.

Não aprova idioma, tradução real, pixel diff integral desta rodada, GCS/IAM,
SDK/layout residente, OOM/cancelamento seguros ou todos os formatos no Spring.
Provas anteriores de pixels/round-trip são complementares, não substituídas.

## Reprodução e fotografia

Preparação offline já existente, sem install/pull automático:

```text
cd api
/usr/bin/caffeinate -i ./mvnw -o -q -pl apps/translation-gateway -am test
  -Dtest=LinuxRenderContainerFixtureTest,NativeRenderingWorkerLinuxTest
  -Dsurefire.failIfNoSpecifiedTests=false
  -Drenderer.worker.resources.enabled=true
  -Drenderer.worker.memoryMiB=4096
  -Drenderer.linux.docker.host=unix:///Users/ruan/.orbstack/run/docker.sock
  -Drenderer.linux.codec.directory=<binários locais conferidos>
  -Drenderer.distribution.directory=<pacote readonly conferido>
  -Drenderer.distribution.sha256=b2c1ce7b18b69fede9a556d18423858455003d3bf82c252263b6eb550b8a4209
```

Passar argumentos na mesma invocação, sem script shell novo. Retirar memoryMiB
ou passar 2048 reproduz a hipótese menor, **não um gate aprovado**.
Caffeinate é temporário, sem alterar preferências do sistema.

333 fontes/testes/scripts/configurações auditados, SHA-256
`b535a43b29a6d60759f6af70fab32f66f8e565d1f4cf70786b7c09f43a871fee`.
Boot JAR `b40013ebf925148975d95828e34425493c7cf7fce19252cbc3abb6151f7bca5b`;
produção inalterada, classes/recursos revalidados pelo harness. Receita: paths
relativos ordenados src/scripts/openapi, pom.xml e Terraform .tf/.tfvars.example,
path+NUL+bytes+NUL; exclui docs/target/.DS_Store/.terraform/lock local. Checksum
mobile é governança separada; fotografia anterior preservada.

## Gates concluídos e limites da contagem

Maven global offline/Docker exit 0: 2.548 testes/815 classes, zero falhas,
erros ou ignorados. Gateway: 1.077 testes/99 classes. XMLs frescos após
`2026-10-07T08:24:01.944Z`, contados antes da suíte leve; quatro XMLs antigos
de harness manual excluídos, não apagados. Flags native/archive/Linux/resources/
shared/distribution anteriores mantidas, mais worker.resources.enabled=true e
worker.memoryMiB=4096. Esse verde **não aprova o orçamento de 2 GiB**.
Também revalidou o guard de dumpabilidade e cadeia V1–V7 PostgreSQL 17.

Repetição global: máxima 2.397.622.272 bytes de memory.peak e
56.996.717.099 ns, pequena 566.300.672 bytes e 10.087.459.130 ns.
Não média/percentil, nem atribuição causal da variação. Hashes das imagens
iguais aos da rodada focal, bindings dos manifestos distintos por job.

Suíte leve do módulo (`./mvnw -o -q -pl apps/translation-gateway -am test
-Dtest.excludedGroups=testcontainers`) exit 0; warnings de gRPC closed stream
e restrição futura de FFM preservados. Node (`node --test scripts/*.test.mjs`
no gateway): 91 pass/um opt-in não selecionado/zero falhas. Web
(`./node_modules/.bin/tsc -b` no app): exit 0. Links documentais, Prettier
direcionado e git diff --check aprovados. pnpm check integral e SDD/checksum
correntes ficam registrados na [review](../review.md) após execução.

Não reinstala dependências nem enfraquece validadores/asserções/deadline;
nenhuma conclusão histórica renovada. Snapshot técnico reconferido idêntico
após os testes. Resultados são locais, sem qualidade linguística/cloud/mobile.

## Decisão parcial

AC-001/003/004/005 têm prova funcional adicional; AC-006, medição de contexto
completo com providers sintéticos. Finding AC-006 confirmado: candidato de
memória insuficiente; falta contenção de OOM que proteja o pai e provas de
cancelamento/timeout/scratch no worker. TASK-002/006/007/008 continuam abertas.
Qualidade, distribuição operacional e SDKs residentes não aprovados.
Performance mobile não aplicável à governança. Não promove 020, abre 021
ou anuncia uploads reais.
