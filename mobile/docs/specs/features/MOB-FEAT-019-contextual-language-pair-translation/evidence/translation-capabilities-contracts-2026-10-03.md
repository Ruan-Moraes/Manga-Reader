# Pares operacionais e contrato local — 2026-10-03

Parcela da `MOB-FEAT-019`, que continua `in-progress/open`. Evidência técnica
offline, não avaliação linguística nem integração operacional Google. Nenhuma
credencial, imagem privada ou resposta de tradução real foi utilizada.

## Decisão e implementação

O catálogo representa 42 pares possíveis. O conjunto operacional é explícito,
validado pelo mesmo parser em capabilities, submissão e worker. Aliases,
duplicatas, idiomas desconhecidos e origem igual ao destino falham fechados.
Modo de tradução desabilitado publica zero pares; o gateway não pode ser
habilitado com conjunto vazio. Disclosure inválido continua causando `503`.
O ETag agora inclui os pares em ordem canônica: é estável ante reordenação da
configuração, mas muda ao remover um par. Campos/versionamento HTTP permanecem
os mesmos; OpenAPI permite zero pares somente com gateway desabilitado.

Submissão não publicada é rejeitada antes de inspecionar/enviar a mídia ou
reservar quota. O mobile rejeita o par removido antes de consentimento, sessão,
tentativa e acesso ao arquivo. Isso não habilita uploads nem altera o par escolhido.

O parser local consome o manifesto Java traduzido `1.0`, com job, idiomas,
hash do OCR, modelo `general/translation-llm` e regiões sem geometria. Recebe
uma referência esperada de OCR já verificada pelo chamador futuro; exige IDs
únicos/exatos, ordem original `0..n−1`, idiomas distintos e vínculo de hash/job.
Resposta fora de ordem é associada por ID, sem modificar texto. Saída limitada
a 1.024 regiões, 8.192 unidades UTF-16 por região e 524.288 por página; excesso
falha sem truncamento. Página vazia exige saída vazia. Erros não expõem conteúdo.

Aplicação da skill `fsd-architecture`: reutilização da entity
`local-translation-result` e API pública `@x` para o catálogo de idiomas.
Aplicação proporcional de `mobile-performance`: uma passagem limitada para
IDs/soma e associação por `Map`, sem rede, SQL, loops quadráticos ou trabalho
em componentes. Não houve medição nativa; limites não equivalem a ganho comprovado.
Nenhuma migration, dependência, UI, rota `/v1`, task ou manifesto OCR mudou.

## Testes e fontes

- Gateway: `ConfiguredTranslationPairsTest`, `GetCapabilitiesUseCaseTest`,
  `SubmitPageUseCaseTest`, `TranslationConfigurationTest` e
  `TranslationGatewayOpenApiTest`, em
  [`src/test`](../../../../../../api/apps/translation-gateway/src/test).
- Mobile: [parser local](../../../../../src/entities/local-translation-result/model/localTranslationManifest.ts)
  e [seus testes](../../../../../src/entities/local-translation-result/model/__tests__/localTranslationManifest.test.ts).
- Regressões de [capabilities](../../../../../src/entities/remote-processing-capability/model/__tests__/remoteProcessingCapability.test.ts)
  e [submissão](../../../../../src/features/start-remote-processing/model/__tests__/startRemoteProcessing.test.ts).

Fase vermelha registrada antes do código: 10 falhas Java por publicação/aceitação
indevidas; mobile recusava a lista vazia e não possuía o parser. Após implementação,
testes focados passaram. Fixtures Unicode, emoji, HTML e variantes chinesas são
sintéticas, não retorno de provider ou aprovação de qualidade.

## Gates e snapshot

Maven global offline com Docker (`./mvnw -o -q test`) aprovado: gateway com 43
reports, 286 testes, zero falhas/erros/ignorados. Inclui Flyway V1–V4 em
PostgreSQL 17 e testes de concorrência/cleanup. Type-check web `tsc -b` aprovado.
`pnpm check` integral aprovado: 111 suítes/716 testes Jest, 30 de performance,
24 SDD e seis de boundaries; specs, links, type-check, ESLint, FSD e Prettier
aprovados. A primeira execução parou por três erros de ordenação de
imports/exports nos arquivos novos; corrigidos pontualmente, sem autofix global.
Avisos `act` existentes nos testes de UI continuam fora desta parcela.

Tooling Node (`node --test api/apps/translation-gateway/scripts/*.test.mjs`):
85 testes aprovados, zero falhas; um teste opcional de renderização tipográfica
Java foi ignorado por ausência de `OCR_CALIBRATION_FONT` explícito. Isso não
é evidência de nova calibração nem de OCR/tradução reais. `git diff --check`
aprovado. Nenhuma reinstalação automática ou alteração de lockfile pela validação.
Os checks SDD/links são repetidos após estabilizar esta evidência e renovar os
headers de checksum, sem modificar verdicts históricos.

Snapshot técnico do gateway: 180 arquivos,
`66b3afda0f26e5cd64705f47292b04b69f3722aa2310a457cd01891784933e63`.
Algoritmo reproduzível: ordenar caminhos relativos de `src`, `scripts`,
`openapi`, `pom.xml` e `.tf`/`.tfvars.example` diretamente em `infra/terraform`;
para cada arquivo, atualizar SHA-256 com caminho, NUL, bytes e NUL. Docs,
artefatos privados e build ficam fora. O checksum SDD mobile é separado, registrado
na review; os snapshots históricos OCR/TASK-001/worker não foram substituídos.

TASK-005 continua aberta: hashing de bytes recebidos, download, gravação remota
transacional, resultado final e ACK não foram implementados nesta parcela.
TASK-006/007 continuam abertas para qualidade/operação e review integral.
Parser testado não é capacidade de leitura de um resultado remoto ativo;
o gate da 021 continua bloqueado. Nenhuma chamada paga ou alteração de defaults.
