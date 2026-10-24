# Memória total do libwebp — evidência parcial, 2026-10-05

TASK-002/007/008, AC-001/004/005/006. Decisão humana anterior à execução:
Ruan escolheu «manter libwebp, com orçamento total medido». A revisão da
[spec](../spec.md) admite buffers internos contabilizados, não cópias redundantes
na aplicação. 020 in-progress/open, verdict changes-requested; 021 blocked.
Não há aceite integral, mudança de orçamento cloud ou aprovação linguística.

## Escopo e prova

O [plano](../../../../../../api/apps/translation-gateway/docs/rendering-memory-policy.md)
precedeu os testes. Acrescentados dois casos parametrizados ao
[harness](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/rendering/NativeRenderResourceTest.java):
plana e multicolor, 10.000 × 8.000, 80M pixels, cgroup 2 GiB, heap 256 MiB,
scratch 128 MiB, swap zero, uma CPU, 64 PIDs, root/inputs readonly, network none.
Java 23.0.2+7, Linux ARM64 Alpine, libwebp oficial 1.6.0 intacto e pins anteriores.
Nenhum download, credencial, mídia real, provider ou runtime mobile. Performance
Android não aplicável; a skill mobile-performance não autoriza inferi-la de Java.

Reutiliza o probe FFM experimental: snapshot → decode → pintura/fontes → encode
lossless/exact → decode no mesmo raster → hash de todos os pixels → manifesto.
Controles máximos têm zero regiões; não demonstram pintura no máximo ou texto
legível. A pequena pintada compara compositor existente/CLI independente.
Testes anteriores de 4 GiB, OOM a 1 GiB/128 MiB, scratch insuficiente e página
seguinte foram preservados. Original conferido por metadata/hash após cada caso.

Primeira execução dos oito casos, antes de acrescentar metadados de saída:

| Caso              | Teto total | Pico cgroup (bytes) | VmHWM (KiB) | Tempo (s) | Resultado              |
| ----------------- | ---------- | ------------------- | ----------- | --------- | ---------------------- |
| Máxima plana      | 2 GiB      | 838795264           | 742348      | 8,501     | exact/manifesto válido |
| Máxima multicolor | 2 GiB      | 1252421632          | 1163664     | 14,925    | exact/manifesto válido |

Exit 0, oito testes. Observações individuais, não mediana, SLA ou melhoria
percentual; não comparar tetos diferentes como ganho causal. memory.peak
inclui JVM/nativo/cache/tmpfs, não somente encoder; Xmx não é limite agregado.

## Rastreabilidade da saída e red/green

A nova asserção exige outputBytes/outputSha256 coerentes com o manifesto
recuperado e o arquivo revalidado. Red focal em
`smallPageCompletesExactRoundTripWithoutNetwork`: um teste, exit 1, esperado
88 bytes mas campo ausente lido como zero. O round-trip existente já funcionava;
o defeito era a omissão na evidência do probe, não no codec de produção.

Depois do red, o
[probe exclusivo de testes](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/rendering/NativeRenderResourceProbe.java)
passou a registrar bytes/hash somente após export/resultado válido. Nenhum
texto, referência de job, path privado ou resposta de provider é registrado.
O harness exige pico positivo dentro do teto kernel. Ausência de métrica não
é tratada como aprovação. Codec, beans, CLI/FFM de produção, HTTP, manifestos,
schema V1–V7 e defaults permanecem iguais.

Green na reexecução global: NativeRenderResourceTest teve oito casos, zero
failures/errors/skipped. Asserções de bytes/hash passam contra arquivo/manifesto:

| Caso              | Teto total | Pico cgroup (bytes) | VmHWM (KiB) | Tempo (s) | Saída (bytes) |
| ----------------- | ---------- | ------------------- | ----------- | --------- | ------------- |
| Máxima plana      | 2 GiB      | 801316864           | 742928      | 8,640     | 3116          |
| Máxima multicolor | 2 GiB      | 1252888576          | 1164436     | 14,963    | 24738         |

SHA-256 das saídas: plana
`d3ed0f3896ca9ef2f86fa8e7be994b55f284cef0df539ca65e4191c4b0ecf67d`,
multicolor `07d6f608433046d70748047730c61374557ea86fc0fe8eac37bd0342a31d1d3e`.
JSON allowlisted no XML fresco da suíte, sem captura privada. OOM no máximo
multicolor com 1 GiB novamente observado; scratch falho não produziu resultado,
e página seguinte teve round-trip exact. Todos os testes anteriores preservados.

## Integridade e gates

Snapshot técnico: 306 arquivos,
`0b8c611bd94b0fcdebb986db708761d5f757ed79905759d8a4c9402f345fe4df`.
Receita: src/scripts/openapi/pom.xml e Terraform `.tf`/terraform.tfvars.example,
paths relativos ordenados `/` NUL bytes NUL, SHA-256 cumulativo; exclui docs,
target, .DS_Store, .terraform e lock local ignorado. Fotografia anterior
16f84f1a… preservada, não renovada. Checksum SDD cobre governança separadamente.

Boot JAR permanece
`9070df558ffef96ed808d7b18c5701e7d4926a581aca49979850fcf83b55e0ec`:
somente src/test mudou, sem harness no artefato de produção. Package offline
exit 0. Node `node --test scripts/*.test.mjs`: 85 pass/um opt-in não selecionado,
zero failures, exit 0. Web `pnpm exec tsc -b`: exit 0.

Maven global offline/Docker e opt-ins native/archive/Linux/resources/shared/
shared.resources: exit 0. XMLs frescos desde `2026-10-05T09:03:29.745Z` UTC,
contados antes da suíte leve: **1.032 testes gateway/90 classes**, zero
failures/errors/skipped. Quatro XMLs de harness manual anteriores excluídos
da contagem, não deletados; nenhuma captura OCR regenerada. V1–V7/PostgreSQL 17
revalidados. Suíte leve gateway/reactor com
`-Dtest.excludedGroups=testcontainers`: exit 0, sem misturar seus XMLs com o global.

Mobile `pnpm check` integral: exit 0, 116 suítes/892 testes, performance tooling,
SDD, type-check/lint/FSD, links e formatação incluídos. Warnings act/SQLite/native
anteriores preservados, sem reinstalação ou alteração de lockfile/validador.
Matrizes tasks/review têm exatamente uma linha por AC; quatro tasks abertas.
Containers do prefixo exclusivo toonlira-render- não permaneceram após os probes.
Formatação dirigida/diff-check e SDD/links finais revalidados após estabilização
e rebase mecânico dos headers correntes; verdicts/históricos não foram renovados.

## Revisão e próximo incremento

A hipótese de 2 GiB foi sustentada somente nessas duas fixtures do probe local.
Não inclui Spring/JVM pai, OCR/layout residentes, staging completo/upload,
ou todas as mídias aceitas. O teto cloud 1 GiB continua não admitido para o
máximo multicolor. Trocar a redação de AC-006 não resolve OOM automaticamente.

Próximo trabalho: adapter FFM supervisionado, capacidade antes do decode,
distribuição readonly/hash/ABI, contenção efetiva e medição integral/sequencial.
Orçamento operacional/margem serão propostos com essa prova, não fixados em
2 GiB por esta observação. Retenção integral e revisão de qualidade também
permanecem abertas. TASK-002/006/007/008, status/verdict e 021 blocked preservados.
