# FFM supervisionado — evidência parcial, 2026-10-05

TASK-002/007/008, AC-001..006. Ruan autorizou implementação incremental até
a 020 e escolheu manter libwebp com orçamento total medido. 020 open/in-progress,
verdict changes-requested; 021 approved/blocked. Sem chamada paga, credencial,
mídia privada, alteração cloud ou ativação.

## Fontes e testes

- [Plano/implementação delimitada](../../../../../../api/apps/translation-gateway/docs/rendering-supervised-native.md).
- [IPC](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/infrastructure/rendering/RenderSubprocessProtocol.java):
  CLI TRN1 preservado, FFM TRN2 explícito; TRS1/contratos públicos iguais.
- [Adapter da filha](../../../../../../api/apps/translation-gateway/src/main/java/com/toonlira/translationgateway/infrastructure/rendering/NativeFileRenderAdapter.java):
  valida mídia antes de carregar libs, capacidade antes de decode, ARGB único,
  ownership/close antes da transferência e cleanup somente de arquivos possuídos.
- [Testes leves](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/rendering/NativeFileRenderAdapterTest.java):
  mocks exclusivos de falhas/lifetime, não qualidade do codec.
- [Configuração explícita](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/rendering/NativeRenderIntegrationTest.java):
  paths/hashes/prazo, IPC sem fallback e native access só na filha escolhida.
- [Linux empacotado](../../../../../../api/apps/translation-gateway/src/test/java/com/toonlira/translationgateway/infrastructure/rendering/IsolatedNativeRenderLinuxTest.java):
  supervisor/RenderChildMain reais no Boot JAR; harness não empacotado em produção,
  Spring/ADC/provider não inicializados.

NativeWebpCodec separa teto de decode original do teto de verificação da saída.
Probe real testa WebP original com maxOutputBytes=1, sem limitar entrada
silenciosamente. Encode conserva caps/lossless/exact/qualidade.

## Execução e correções das fixtures

RED inicial de compilação antes dos tipos/overload do launcher: configuração
nativa ausente. RED adicional de seam decodeOriginalInto antes de implementá-lo.
Não são bugs no algoritmo de pintura ou alegação de ganho de RAM.

Primeiro foco: path /var da fixture não correspondia ao diretório canônico
/private/var. Corrigido na fixture, sem admitir path divergente. Teste de
processos no sandbox também falhou na supervisão; reexecução local autorizada
passou mantendo enumeração/terminação, sem desabilitar proteção.

Primeiro Linux: renders/medidas passaram, mas comparador usava ImageIO.read sem
ARGB admissível. Corrigido para o decoder validado existente; asserções de todos
os pixels, alpha e original preservadas. Reexecução dos seis casos passou.
Não exigiu mudança do compositor.

## Medição local

Mesmo cgroup pai/filha: teto experimental 2 GiB, heap pai 128 MiB/filha 256 MiB,
scratch /work tmpfs 128 MiB, swap zero, uma CPU, 64 PIDs, root/libs/inputs
readonly, network none, Java 23.0.2+7/Linux ARM64. Bibliotecas oficiais 1.6.0
intactas e pins anteriores; sem pull, instalação ou download.

memory.peak agrega processos/nativo/cache/tmpfs; VmHWM é só do pai. /export é
bind com saída limitada, não quota global do disco. Uma região sintética pequena
nas máximas não prova volume textual máximo, qualidade ou SLA.

Rodada global com o código final, após correção do comparador:

| Caso                                   | Pico cgroup (bytes) | Tempo (s) | Saída (bytes) | Prova                                    |
| -------------------------------------- | ------------------- | --------- | ------------- | ---------------------------------------- |
| PNG pintado/alpha, 320 × 220           | 348352512           | 6,443     | 2956          | todos os pixels iguais ao compositor/CLI |
| JPEG pintado, 320 × 220                | 315695104           | 6,444     | 2222          | todos os pixels iguais ao compositor/CLI |
| WebP pintado/alpha, 320 × 220          | 343805952           | 6,443     | 2956          | todos os pixels iguais ao compositor/CLI |
| PNG plano pintado, 10.000 × 8.000      | 1307865088          | 9,154     | 26738         | arquivo/hash/manifesto/original válidos  |
| PNG multicolor pintado, 10.000 × 8.000 | 1326178304          | 16,079    | 31184         | arquivo/hash/manifesto/original válidos  |

Hash da lib adulterado e scratch de 4 KiB falharam sem resultado; página
independente seguinte concluiu (88 bytes, SHA-256
`ae2f0d485b59ba43decc64c21bf7012a5ebb499dc695d30f29bb80a7ee83ef5c`).
Original metadata/hash conferidos após todas as rodadas. Observações individuais
não são melhoria causal sobre o probe anterior.

## Integridade e gates

Snapshot técnico: 313 arquivos,
`440dbd5e20ed8676da8d61ac5496555bd7b3cfcf683bf49b9da1adac8cf1e887`.
Receita: src/scripts/openapi/pom.xml e Terraform .tf/terraform.tfvars.example,
paths relativos ordenados `/` NUL bytes NUL, SHA-256 cumulativo; exclui docs,
target, .DS_Store e .terraform/lock local. Hash do Boot JAR atual:
`7ce32a8e1ea1564cbc5a1fe6482f53ff03192675c1e3cc478f88e91cf083fc92`.
Package offline exit 0; empacotamento conferido contra todas as classes e
resources compiladas, não somente por data. Hash histórico anterior preservado.

Maven global offline/Docker com opt-ins native/archive/Linux/resources/shared/
shared.resources: exit 0. XMLs frescos desde `2026-10-05T09:33:10.333Z` UTC,
contados antes da suíte leve: 1.048 testes gateway/93 classes, zero failures,
errors ou skipped. Quatro XMLs de harness manual antigos excluídos, não apagados;
nenhuma captura real regenerada. V1–V7/PostgreSQL 17 revalidados. Os seis casos
IsolatedNativeRenderLinuxTest passaram (67,777 s); primitivas de supervisão e
deadlines/cancelamento continuam cobertas pelos testes anteriores.

Suíte leve gateway/reactor com `-Dtest.excludedGroups=testcontainers`: exit 0,
sem misturar seus XMLs com o global. Node `node --test scripts/*.test.mjs`:
85 pass/um opt-in não selecionado, zero failures, exit 0. Web `pnpm exec tsc -b`:
exit 0. Mobile `pnpm check` integral: exit 0, 116 suítes/892 testes. Performance
tooling, SDD/links, type-check/lint/FSD e formatação passaram. Warnings existentes
de act/SQLite/nativo preservados, sem reinstalação ou mudança de lockfile.

Headers correntes de reviews/drifts rebaseados mecanicamente, sem alterar
verdict/histórico. SDD/links e formatação dirigida/diff-check passaram após
estabilização, sem enfraquecer validadores. Nenhum container exclusivo
toonlira-render- permaneceu após os testes (consulta read-only confirmou vazio).

Históricos não foram sobrescritos ou hashes históricos renovados. SDD cobre
governança mobile separadamente do Java. Matrizes tasks/review têm uma linha
por AC e TASK-002/006/007/008 abertas. Não renova conclusões de outras features.

## Review e pendências

Inspeção conferiu seleção explícita, IPC limitado, ARGB emprestado confinado,
lifetime até retorno nativo/close, revalidação/transferência e descarte após
close falho. Defaults/bean CLI, fontes/polígonos/texto, estados, HTTP, manifesto
e V1–V7 preservados. Sem schema/SQLite/infra/dependência nova.

FFM supervisionado é implementação explícita, não integração ativa do bean.
Contenção de OOM agregado/árvore, RUNPATH/distribuição/deps/ABI, profiling do
worker Spring/OCR/layout/storage/volume/sequência e orçamento operacional
permanecem trabalho funcional. 2 GiB não configura Cloud Run; 1 GiB atual
continua não admitido no máximo multicolor. Sem revisão linguística ou
performance Android; runtime mobile não mudou.

TASK-002/006/007/008 abertas. Não fecha AC-006 integral ou desbloqueia 021.
Próximo incremento: distribuição fixada e integração supervisionada explícita,
seguida de medição/falhas do caminho completo, sem cloud/provider.
