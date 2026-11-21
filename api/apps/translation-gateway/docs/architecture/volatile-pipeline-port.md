# Porte da pipeline armazenada para a volátil — 2026-11-21

Em 2026-11-21, na integração da pilha `feat/glossary-names-and-reader-fade` na branch do PR
(`feat/auth-refresh-rotation`), Ruan escolheu "portar para a volátil": o contrato de produção é o v2
(`/v2/page-translations`, a página entra e a página traduzida sai na mesma resposta, nada fica guardado), e o
que a pilha tinha construído sobre o v1 armazenado passa a rodar nele. O v1 continua só como código de teste
(`src/test/.../application/Process*TaskUseCase.java`), para os testes legados.

## O que passou para o v2

| Recurso da pilha | Onde estava (v1) | Onde está (v2) |
| --- | --- | --- |
| Agrupamento por balão (layout `grouping`) | `ProcessOcrTaskUseCase` + `ShadowLayoutService` | `VolatilePagePipeline.read` |
| Recuperação e releitura de fala duvidosa | `OcrRereadService` sobre arquivo | o mesmo serviço, sobre a página em memória |
| Montagem e reparo de letreiro (`OcrAssembly`) | `ProcessOcrTaskUseCase` | `VolatilePagePipeline.read` |
| Tipo de região do layout para o Gemini | `LayoutHints.read` do storage | `LayoutHints.of` do layout em memória |
| Memória do capítulo (`contextRef`) | `ProcessTranslationTaskUseCase` | `VolatilePagePipeline.translate`, cabeçalho `X-Context-Ref` |
| Glossário do cliente | campo multipart `glossary` do v1 | `PUT /v2/page-translations/chapter-contexts/{contextRef}/glossary` |
| Revisão Gemini (nomes, `FragmentJoiner`) | `ProcessTranslationTaskUseCase` | `VolatilePagePipeline.translate` |
| Termos e qualidade no manifesto (1.2) | `ProcessRenderingTaskUseCase` | `ProcessVolatilePageUseCase` + `RenderManifestService` |
| Dicas de render (balões, legenda, letreiro, desenho) | `RenderSubprocessProtocol` (arquivo) | `VolatileRenderProtocol` (pipe) |
| Inpainting LaMa em duas passadas | `InpaintExchange` por arquivos | `InpaintExchange` pelo pipe; segunda filha só quando há janelas |
| `kept` por região | protocolo v1 | protocolo v2 |
| Divulgação da revisão por modelo de linguagem | `/v1/capabilities` | `/v2/capabilities` (`languageModelLocation`) |

O disclosure volátil que nomeia a revisão e a memória do capítulo é `volatile-2026-11-21.v1`
(`VolatileGatewayPolicy.LANGUAGE_MODEL_DISCLOSURE_VERSIONS`): com o Gemini ligado, outro disclosure torna as
capabilities indisponíveis.

## Decisões e limites

- **Layout no processo HTTP.** A política volátil exigia `layout = disabled`. O porte permite o layout, que roda
  na página já decodificada em memória e não grava nada (`VolatileRuntimePolicy`). O detector ONNX é código nativo
  no processo HTTP; o LaMa já rodava no processo pai no v1. Revisar se a isolação deve ir além disso antes da
  produção.
- **WebP fora da análise.** O processo HTTP só decodifica PNG e JPEG (JDK). WebP não confiável continua sendo
  decodificado só pela filha do render, então uma página WebP é traduzida sem agrupamento por balão e sem releitura.
- **Uma página por vez.** A volátil renderiza uma página por instância e responde `503 capabilities-unavailable`
  (retryable) às outras. O cliente espera e tenta de novo (o testador faz isso).
- **Memória do capítulo no servidor.** Os nomes ficam em `translation_context_terms` até a retenção divulgada
  (1 hora, renovável até 1 dia). É o único dado de conteúdo que sobrevive à sessão, e o disclosure o nomeia.

## Banco e testes

- As migrações da pilha foram renumeradas depois das do PR: V10/V11 são do PR (recibos e janela de teste),
  V12/V13 são as contagens de texto renderizado (usadas pelo caminho legado) e V14 é a memória do capítulo.
- Testes do v1 que cobriam recursos portados foram reescritos sobre o v2 (`VolatilePagePipelineTest`,
  `VolatileTranslationControllerTest`); os demais testes legados continuam sobre a cópia do v1 em `src/test`.
- `InpaintExchange` de produção só troca janelas pelo pipe; a versão por arquivo ficou em teste
  (`InpaintFileExchange`), como exige `ProductionContentBoundaryTest`.

## Rodar localmente

1. Distribuição nativa do libwebp (uma vez): baixar o source oficial 1.6.0 (hash fixado em
   `NativeCodecDistribution.SOURCE_HASH`), compilar compartilhado num `ubuntu:24.04` com as opções de
   [`rendering-native-distribution.md`](../rendering/rendering-native-distribution.md) e empacotar com
   `scripts/native-image/render-native-package.mjs --platform linux-x86_64-glibc` em `.local/native-build/dist`.
2. `scripts/local/dev-volatile.sh`: reaproveita `gateway-real.env` e sobrescreve o que o runtime volátil exige
   (sem storage, dispatch, URLs ou multipart; orçamento HTTP pequeno; sem core dump), usa um banco local separado
   (`manga_translation_gateway_v2`) e o orçamento de teste sem cota de um dia.
3. O testador (`web/apps/gateway-tester`) já fala v2: uma chamada por página, glossário antes e espera quando o
   gateway está ocupado.
