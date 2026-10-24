# Memória e scratch Linux — 2026-10-04

Parcela de TASK-002/007/008 e AC-006. 020 in-progress/open, review
changes-requested, 021 approved/blocked. Somente testes Java, fixtures sintéticas
e containers locais; sem mídia real, ADC, provider, aquisição nova ou cloud.

## Plano, testes e isolamento

[Plano anterior ao código](../../../../../../api/apps/translation-gateway/docs/rendering-linux-resources.md).
O harness existente recebeu um opt-in separado de profiling, não um bean de
produção. Input/request/JAR/codecs/probe são read-only; rede desligada, root
read-only, uma CPU, 64 PIDs, cap-drop ALL e no-new-privileges. Scratch é tmpfs
com capacidade explícita; export é bind exclusivo, sem quota agregada alegada.
A probe usa os adapters/fontes/protocolo atuais e não inicia Spring/provider.

PNG sintético é produzido por linhas em Java, sem raster integral no pai.
Testes precederam os tipos: compilação red por ausência de probe/budget/fixture.
Primeiro foco nativo teve quatro falhas de asserção por igualdade de identidade
de RenderManifest, após render bem-sucedido. A verificação foi substituída por
igualdade dos bytes canônicos encode/decode/encode, sem remover cenário ou
afrouxar conteúdo. Foco seguinte e novo caso de 1 GiB ficaram verdes.

Cinco testes puros de argumentos/status, dois de PNG e cinco de recursos reais
foram acrescentados. Original, manifesto, mídia, capacidade real, hash e falhas
são verificados; nenhuma métrica ausente é convertida em zero. OOM não produz
resultado fictício. Scratch de 16 KiB falha sem artefato; containers seguintes
renderizam a página pequena. Não alegar terminação ou quota do processo pai.

## Baseline medida, não aprovação geral

Global iniciado em `2026-10-04T19:48:28.534Z`; cinco casos nativos passaram.
JRE Temurin 23.0.2+7, Linux ARM64, libwebp 1.6.0 e pins da
[parcela Linux](rendering-linux-2026-10-04.md). Métricas cgroup/proc/tmpfs
sanitizadas, sem texto OCR, credencial, diagnóstico bruto ou dados do piloto.

| Cenário                                    | Resultado observado                                                                    |
| ------------------------------------------ | -------------------------------------------------------------------------------------- |
| PNG uniforme 320 × 220, 719 bytes          | sucesso; 6,020 s; pico cgroup 265.256.960 bytes                                        |
| PNG uniforme 10.000 × 8.000, 252.979 bytes | sucesso com teto de 4 GiB; 9,243 s; pico cgroup 1.892.970.496 bytes; VmHWM 534.984 KiB |
| Teto de 128 MiB, heap 512 MiB              | kernel OOM, sem resultado; original preservado; execução seguinte passou               |
| Máximo com teto de 1 GiB, heap 1 GiB       | kernel OOM, sem resultado; original preservado                                         |
| Scratch de 16 KiB                          | falha, sem resultado, sem OOM; original preservado; execução seguinte passou           |

No sucesso máximo, scratch 512 MiB teve 470.519.808 bytes disponíveis ao final;
swap.max zero. Pico inclui filhos/cache/tmpfs, não apenas heap Java. Primeira
rodada focalizada mediu 9,341 s/1.963.380.736 bytes no máximo: variação entre
duas execuções de uma fixture, não benchmark estatístico. Página uniforme não
representa conteúdo diverso, compressibilidade, transparência ou qualidade.

Hashes dos originais sintéticos: pequeno
`997ca919945cefd6bd07dda1fbfa0899fa637deee34862c7b629b937c07f9f61`;
máximo `51d600a40e9f25601fa91a8ebd98e55a18ad5b4c423756ee612783a8db94186b`.
Baseline local preservada, ignorada pelo Git:
`.local/rendering-linux/baselines/resources-20261004-a.json`.

## Findings funcionais e próxima parcela

- O worker cloud desabilitado declara 1 GiB. A fixture máxima falhou nesse
  orçamento. Não foi aumentado: teto experimental de 4 GiB não é autorização
  de custo/admissão de produção.
- Inspeção local confirmou cgroup2 read-only. Não há delegação gravável admitida,
  nem prova de sandbox Cloud Run. Não foram acrescentados privilégios.
- Source oficial libwebp 1.6.0, SHA-256
  `e4ab7009bf0629fd11982d4c2aa83964cf244cffba7347ecd39019a9e38c4564`,
  mostra ReadPicture lendo o arquivo integral, ReadPNM alocando RGB integral
  e importando para WebPPicture antes de liberar RGB. O Java ainda mantém o
  raster durante encode. Raster único Java não satisfaz sozinho a exigência
  de evitar cópias simultâneas. Não alterar AC-006 para esconder o finding.
- User autorizou preparação/build local do source oficial com compilador e
  headers somente em container. Aquisição/build serão registrados separadamente;
  esta evidência não os declara executados. Sem código C próprio; integração Java.

Distribuição/licenças, correção de cópias nativas, orçamento/contenção admitidos,
integração supervisionada, retenção integral e revisão visual continuam abertos.
Falta funcional não foi reclassificada como benchmark externo. TASK-002/006/007/008
permanecem abertas; nenhuma promoção da 020/021 ou alegação de performance mobile.

## Integridade e gates

Checksum técnico: 292 arquivos src/scripts/openapi, pom e Terraform, ordenados
por caminho relativo; SHA-256 de caminho + NUL + bytes + NUL:
`5f49d753e69776a2d4ab3a396100589f163fdd91a8d1d20b023dc3dfb01c838e`.
JAR permanece `8587cfeac7c4807287da15b2df9b758d0f78e85d8e33996b5666996fee49c28a`;
somente testes foram alterados. Guard de BOOT-INF confirmou classes/recursos
atuais. Hash mobile não é cobertura Java; fotografias históricas preservadas.

Comando global: `./mvnw -o -q test`, flags native/archive/Linux e pins da
[parcela Linux](rendering-linux-2026-10-04.md), mais
`-Drenderer.linux.resources.enabled=true`. Exit 0. XMLs frescos antes da suíte
leve: 972 testes/82 classes gateway, zero failures/errors/skipped. Quatro
harnesses manuais históricos excluídos por data. PostgreSQL 17 V1–V7,
RenderingPersistence 83, worker 17, schema 49 e dispatch três reexecutados.

Suíte leve offline exit 0; Node 85 pass/um opt-in de fonte ignorado; web
`pnpm exec tsc -b` exit 0. Warnings gRPC de stream fechado não foram ocultados.
`pnpm check` integral exit 0: 116 suítes/892 testes, 30 performance, 24 SDD,
seis FSD; typecheck/lint/formato/links aprovados. SDD: 1.499 arquivos, 362 behavior,
211 evidence, 67 artefatos normativos. Warnings anteriores act/ícones Expo
preservados. Nenhum lockfile/dependência/script reinstalado ou alterado.

Formatação direcionada e git diff --check aprovados; novos testes conferidos
com diff no-index (diferença esperada não é erro de whitespace). Headers SDD
correntes rebaseados mecanicamente após estabilização, sem renovar verdicts
históricos. Checks SDD/links/formato finais reexecutados. Inspeção escopada
não encontrou containers toonlira-render restantes. Não inferir performance
Android ou prontidão do worker por esses gates locais.

Checagem Prettier executada inicialmente no diretório Java falhou com
`ERR_PNPM_NO_PKG_MANIFEST`; pnpm tentou seu pré-check de instalação, mas parou
antes de scripts/alterações por ausência de package.json. Reexecutada pelo
workspace mobile existente, com caminhos direcionados: exit 0, sem instalação
ou arquivos package/lock/node_modules novos na raiz. Não é falha do renderer
nem autorização para reinstalar dependências.
