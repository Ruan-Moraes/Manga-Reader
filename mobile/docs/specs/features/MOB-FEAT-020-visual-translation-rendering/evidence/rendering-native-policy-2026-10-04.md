# Política do codec nativo — evidência parcial, 2026-10-04

TASK-002/007/008, AC-006. 020 in-progress/open, verdict changes-requested;
021 approved/blocked. Preparação/testes locais autorizados, sem mídia real,
provider, ADC, Google, cloud ou alteração de defaults. Integração em Java;
source upstream intacto, sem C próprio/Python. Nenhum runtime mobile alterado.

## Finding reproduzido e correção

[NativeWebpCodec](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/infrastructure/rendering/NativeWebpCodec.java)
aceitava uma superfície criada sob a política original, mas classificava como
`codec-unavailable` a rejeição de suas dimensões por uma política mais restrita
na chamada de encode. A IOException do validador de dimensões caía no catch
genérico. É classificação funcional incorreta, não falha de storage/provider.

Regressão acrescentada primeiro ao
[probe Linux](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/rendering/NativeWebpCodecProbe.java):
largura, altura e pixels rejeitados separadamente nas fixtures 13×17 e 320×220.
Exige `codec-invalid-media`, cause ausente, mesmo endereço/pixels do original
e nenhuma criação de arquivo. O teste nativo falhou antes da correção; o harness
expôs apenas process-failed, sem imprimir stderr nativo ou dados sensíveis.
A causa foi confirmada pela inspeção do catch e pela regressão após a mudança.

Helper restrito converte somente a rejeição de dimensões em INVALID_MEDIA;
IOException de I/O do encoder continua UNAVAILABLE. Decode usa o mesmo helper,
mantendo sua classificação anterior. Sem mudança de contrato público, política,
manifesto, SQL ou ligação ao worker/RenderPort. Capacidade e cleanup preservados.

Package offline exit 0 antes da repetição, pois o harness usa o Boot JAR.
Foco WebpNativeAbiTest/NativeWebpCodecTest/NativeWebpWriterTest/
NativeWebpCodecLinuxTest: **9 testes**, exit 0. Asserções novas dentro do probe,
não classes/testes fictícios adicionais. Round-trip/alpha/RGB invisível, decoder
CLI independente, adulteração, writer limitado, busy/interrupção e cleanup
anteriores permanecem ativos. Warning Java 23 de native access preservado;
filha recebe a opção explícita, sem supressão global.

## Decisão de arquitetura ainda necessária

A [prova anterior de recursos](rendering-native-resources-2026-10-04.md)
continua válida como fotografia anterior: cópia integral interna VP8L e OOM
com 1 GiB são findings funcionais. Esta correção não reduz a memória.

Pesquisa somente em fontes primárias, sem adquirir dependências:

- [Formato lossless oficial](https://developers.google.com/speed/webp/docs/webp_lossless_bitstream_specification):
  transforma/codifica pixels; não promete que uma implementação mantenha apenas
  uma imagem integral. Um encoder Java de memória limitada seria engenharia
  nova, com auditoria de formato, segurança e compatibilidade, não um switch
  comprovado de libwebp. Não foi implementado nem aprovado neste incremento.
- [TwelveMonkeys — formatos](https://github.com/haraldk/TwelveMonkeys#readme):
  WebP tem leitura, não escrita. Não resolve o encoder por simples substituição.
  [Decoder VP8L](https://github.com/haraldk/TwelveMonkeys/blob/master/imageio/imageio-webp/src/main/java/com/twelvemonkeys/imageio/plugins/webp/lossless/VP8LDecoder.java)
  pode reutilizar raster de destino em determinadas condições, mas ainda mantém
  mapas/estado de transforms. A compatibilidade com DataBuffer nativo, VP8,
  limites e propriedade do buffer não foi provada. Inspeção de master não é
  versão pinada, teste executado ou admissão de dependência.

Nenhuma alternativa foi baixada ou ligada ao pipeline. Não restringir a entrada,
trocar lossless/exact, liberar memória emprestada em downcall, excluir WebP ou
relaxar AC-006 para obter aprovação. Aumentar teto experimental não autoriza
memória cloud e não elimina a cópia. Próxima decisão deve preservar o requisito
e planejar um codec comprovadamente compatível, ou revisar explicitamente o
requisito antes de qualquer implementação diferente; não há escolha presumida.

## Snapshot técnico

306 arquivos: `c7d7813874ab8323ee38fb1bf4e96da6916292d56ccb95b04aa81977bb4734d2`.
Receita anterior preservada: src/scripts/openapi/pom.xml e Terraform `.tf`/
terraform.tfvars.example; paths ordenados, path relativo `/` NUL bytes NUL,
SHA-256 cumulativo. Exclui docs/target/.DS_Store/.terraform/lock local ignorado.
Checksum SDD mobile é separado; nenhuma fotografia histórica foi renovada.

Boot JAR após a correção:
`9070df558ffef96ed808d7b18c5701e7d4926a581aca49979850fcf83b55e0ec`.
Fixtures/classes src/test não são disponibilizadas no artefato de produção.
Bibliotecas/hash/imagem Docker são os pins da preparação anterior; sem download
durante testes comuns, provider ou instalação/reinstalação de dependências.

## Gates e limites

Node `node --test scripts/*.test.mjs`: 85 pass, um opt-in de fontes não
selecionado, zero failures, exit 0. Web `pnpm exec tsc -b`: exit 0.
Maven global `./mvnw -o -q test` com Docker e opt-ins native/archive/Linux/
resources/shared/shared.resources: exit 0. **1.027 testes gateway/90 classes**,
zero failures/errors/skipped. XMLs frescos desde `2026-10-05T00:01:05.387Z`
(UTC, execução iniciada em 2026-10-04 local), contados antes da suíte leve.
Quatro XMLs históricos de harness manual não reexecutados foram excluídos;
nenhuma captura/relatório anterior sobrescrito. V1–V7/PostgreSQL 17 revalidados,
sem migration nova. Suíte leve reactor/gateway com
`-Dtest.excludedGroups=testcontainers`: exit 0.

Reprodução de recursos preservou exact no máximo multicolor: pico cgroup
1285160960 bytes/VmHWM 1164268 KiB/15,031 s, mesmo teto experimental de 4 GiB.
Com 1 GiB houve kernel OOM/sem result; fault 128 MiB também. Scratch 16 KiB
falhou antes do decode/sem result; página seguinte passou. Não atribuir memória
a uma função isolada nem transformar essa repetição em aprovação do codec.

Mobile `pnpm check` integral: exit 0, 116 suítes/892 testes, incluindo SDD,
links, typecheck, lint/FSD, formatação e performance tooling. Warnings anteriores
act/SQLite e native access/thread starvation preservados; nenhum validador,
gate ou dependência modificado para obter resultado verde. Formatação dirigida
e diff-check passaram. Headers correntes rebaseados mecanicamente após
estabilização, sem renovar verdict/histórico de outras features; SDD/links
finais reexecutados. Sem instalação/reinstalação ou mudança de lockfile.

TASK-002/006/007/008 seguem abertas. Resolver arquitetura/cópias/orçamento,
integração supervisionada, distribuição/contenção, retenção integral e qualidade
continua necessário. Não promove 020 nem abre 021; teste Java não comprova
performance Android ou revisão visual/linguística.
