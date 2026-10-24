# Prova local Linux/ARM64 — 2026-10-04

Parcela de TASK-002/007, AC-001..006. 020 in-progress/open; review
changes-requested; 021 blocked. Preparação/testes locais autorizados
explicitamente por Ruan. Não há chamada Google, ADC, imagem real ou deploy.

## Escopo e proveniência

[Plano antes do harness](../../../../../../api/apps/translation-gateway/docs/rendering-linux.md).
Somente testes/configuração ignorada/documentação mudam neste incremento.
Não altera domínio, runtime, banco, migration, worker ou defaults.

Aquisição oficial por HTTPS, sem credential helper: JRE existente no Dockerfile
e libwebp 1.6.0 aarch64. Arquivos ficam em .local/rendering-linux ignorado pelo Git.
Digest da imagem adquirida arm64:
`88593498863c64b43be16e8357a3c70ea475fc20a93bf1e07f4609213a357c87`.
O pull terminou com exit 0; esperas silenciosas anteriores não foram tratadas como
falha nem causaram retry.

Pins medidos sobre os bytes adquiridos:

- pacote Linux: `69f5eebe203e0f3942fe37986209a1725741be19c152950a4283b376c95ec798`;
- encoder: `c1cbc3d46a3beb3883359dc9b112d7f5d08ed213a6a5d954f958b6c8baee7fc8`;
- decoder: `9a4aab76f4597ef5f77363594d8772e5e26500036c2ca4d58904ec3b7805cbf5`;
- source upstream: `e4ab7009bf0629fd11982d4c2aa83964cf244cffba7347ecd39019a9e38c4564`.

Encoder/decoder identificados ELF static-pie ARM aarch64, não executados no
host macOS. Ambos confirmaram 1.6.0 em container Alpine isolado; encoder também
informou libsharpyuv 0.4.2. Assinatura .asc foi adquirida, mas não verificada:
nenhum gpg local, sem instalação silenciosa. Hash/TLS não são validação de
assinatura. O pacote binário não contém COPYING/PATENTS; source oficial foi
inspecionado para proveniência, sem compilar. Licenças transitivas permanecem
pendentes antes de distribuição. Não modificar Termos do produto por isso.

## Harness e diagnóstico

LinuxRenderContainerFixture, LinuxRenderContainerFixtureTest e
RenderLinuxNativeTest são exclusivos de testes. O helper de request sintética
existente passou a package-private; nenhum cenário anterior foi removido.
Teste de argumentos/endpoint/hash precedeu a fixture: red por tipo ausente.

O primeiro teste rejeitou o atalho Docker. OrbStack usa executável multicall:
o caminho canônico docker-tools não aceita esse argv[0]. Regressão específica
preserva o nome do launcher local, verificando o target; codecs continuam
no-follow e SHA-256 fixados. Configuração Docker própria vazia, ambiente do CLI
removido e endpoint unix explícito, sem contexto remoto ou credenciais pessoais.

Cada container tem nome UUID próprio e é removido no finally, inclusive diante
de erro/confirmação perdida de create. Sem pull, rede, portas ou capacidades;
root read-only, no-new-privileges, usuário do staging. Somente JAR, codecs,
original sintético read-only e staging próprio são montados. Limites de teste:
1 CPU, 1 GiB memória/swap, 64 PIDs, /tmp tmpfs 64 MiB, heap 512 MiB. Staging bind
não tem quota agregada: não inferir orçamento de produção ou isolamento do pai.

O JAR é conferido contra cada classe/recurso atual antes do teste; a filha
PropertiesLauncher/RenderChildMain não inicia Spring e ignora loader.properties
hostil no staging. Imagens/textos sintéticos dos sete destinos, páginas vazias
PNG/WebP, original preservado, manifestos completos, hashes/dimensões e decode
real. Páginas vazias exigem pixels idênticos; texto não presume pixels iguais
entre sistemas operacionais nem aprovação linguística.

## Integridade e execução

Checksum técnico: 284 arquivos src/scripts/openapi, pom e Terraform, ordenados
por caminho relativo; SHA-256 de caminho + NUL + bytes + NUL:
`a19484c2f7250a1fd209765f0dd40817f41dcd37a381d42bfb5c4c478f04d71a`.
Checksum mobile cobre governança, não fontes Java. Fotografias anteriores
permanecem históricas, sem alegar renovação de conclusões de outras features.

JAR reutilizado da parcela Boot, sem fonte main/resource alterado nesta rodada:
`0fa19173e32a2e65950b2c3d0c45713443fa9154b4e5f327a7befc73f92e9f5d`.
O gate compara bytes atuais com BOOT-INF/classes antes de executar. Não alegar
novo package nem reprodutibilidade byte a byte do snapshot.

Comando focalizado efetivo a partir de api:

```bash
./mvnw -o -q -pl apps/translation-gateway -am test \
  -Dtest=LinuxRenderContainerFixtureTest,RenderLinuxNativeTest \
  -Dsurefire.failIfNoSpecifiedTests=false \
  -Drenderer.linux.enabled=true \
  -Drenderer.linux.docker.host=unix:///Users/ruan/.orbstack/run/docker.sock \
  -Drenderer.linux.codec.directory=/Users/ruan/Documents/Projetos/Manga-Reader/.local/rendering-linux/extracted.YxhsxL/bin
```

Exit 0: 21 testes, zero failures/errors/skipped. Dez testes de admissão/argumentos
e onze de execução Linux, incluindo mídia adulterada/hash de codec divergente
sem saída falsa, pixels vazios equivalentes e cleanup. Docker usa o launcher
local padrão /usr/local/bin/docker; configurações anteriores rejeitadas ficaram
registradas, sem troca de imagem/codec ou relaxamento de seus pins.

Maven global offline com Docker: `./mvnw -o -q test`, acrescido dos pins nativos
macOS da evidência Boot, renderer.archive.enabled=true e os três flags Linux
do comando acima. Exit 0. Iniciado em `2026-10-04T18:39:06.238Z`; XMLs frescos
confirmaram 947 testes/77 classes no gateway, zero failures/errors/skipped.
Quatro harnesses históricos excluídos por data; contagem antes da suíte leve,
sem Maven sobreposto. RenderingPersistence 83, worker 17, schema 49, dispatch três.
Nenhum container toonlira-render-linux ficou na inspeção final escopada.

Node `node --test scripts/*.test.mjs`: exit 0, 85 pass/um opt-in de fonte ignorado.
Web `pnpm exec tsc -b`: exit 0.

## Gates e conclusão

Suíte leve `./mvnw -o -q -pl apps/translation-gateway -am test
-Dtest.excludedGroups=testcontainers`: exit 0. A primeira execução no sandbox
restrito falhou porque os servidores gRPC falsos não podiam abrir loopback e
a supervisão de processos estava limitada. Reexecução com permissão local
passou, sem mudar fonte, excluir testes ou acessar Google. O gate global já
havia passado com essa permissão; não classificar a restrição como falha de OCR.

`pnpm check` mobile integral: exit 0, 116 suítes/892 testes. Cadeia performance
(30), SDD (24)/links, typecheck/lint/FSD (6)/formato preservada. Warnings anteriores
de act/ícones Expo permanecem explícitos, sem supressão ou prova nativa derivada.
SDD: 67 artefatos normativos, 1.496 arquivos classificados, 362 behavior e
208 evidence; links aprovados. Checksums correntes rebaseados mecanicamente
depois de estabilizar a evidência; conclusões históricas não foram renovadas.
Formatação somente nos documentos/mapa alterados e git diff --check aprovados;
novos testes também verificados via diff no-index, sem whitespace errors.

Esta evidência não fecha TASK-002/006/007/008 ou AC-006 integral.
Assinatura/licenças transitivas, empacotamento final, contenção atômica,
memória/disco/deadline do worker, profiling no limite, retenção integral e
revisão visual seguem abertos. Performance mobile não aplicável: somente
governança mobile; nenhuma métrica Android inferida de teste Docker/Java.

O uso das skills SDD mantém vínculo por AC e verdict parcial; database-design
orientou a inspeção de retenção sem produzir alteração de schema nesta parcela.
