# Admissão local do JAR Boot — 2026-10-04

Parcela de TASK-002/007, AC-001..006, especialmente empacotamento e isolamento.
020 in-progress/open, review changes-requested e 021 blocked. Não é ativação
operacional ou aceite integral de AC-006.

## Implementação e escopo

[Plano antes do código](../../../../../../api/apps/translation-gateway/docs/rendering-archive.md).
RenderJvmLauncher admite somente um arquivo Boot 3.4.3 com manifest/classes/libs
esperados e seleciona RenderChildMain por PropertiesLauncher. loader.home/path/
config.location controlados impedem consultar loader.properties de cwd/home;
nenhuma main/argumento customizado ou classpath externo é aceito no modo Boot.
Mantém ambiente vazio, heap/ExitOnOutOfMemoryError, staging privado e logs da
filha descartados. Não modifica o bootstrap normal, worker, defaults, manifesto,
RenderPort, banco, migration ou API.

Fonte alterado: infrastructure/rendering/RenderJvmLauncher. Testes novos:
RenderJvmLauncherTest e RenderArchiveNativeTest; helpers existentes de
IsolatedRenderAdapterNativeTest compartilhados sem remover cenários/asserts.
Sem dependência nova, instalação, credencial, imagem nova ou chamada Google.

## Testes e diagnóstico

Testes escritos antes da implementação (red por ausência da sobrecarga/helpers).
Primeira execução real: nove cenários Boot passaram, mas launcher plano falhou
porque Surefire termina java.class.path com separador vazio. A regressão foi
reproduzida em teste antes do fix: sufixo descartado como anteriormente, nunca
admitido como cwd. Entrada vazia inicial/interna continua recusada. Outro red
comprovou que BOOT-INF sem manifest/directory marker precisava detecção explícita;
agora falha fechada, sem classificar silenciosamente como JAR plano.

Rodada focalizada final: 53 testes, zero failures/errors/skipped:

- RenderJvmLauncherTest: 23, classpath plano/Boot, manifest/versão/conteúdo,
  loader ausente, configuração externa, mistura, main indevida, path/wildcard,
  ambiente, separador Surefire e BOOT-INF malformado. Fixtures JAR não inferem
  funcionamento; a prova real está no teste seguinte.
- RenderArchiveNativeTest: nove, sete destinos e PNG/WebP vazios. Antes da
  execução, compara SHA-256 de cada classe/recurso atual com BOOT-INF/classes;
  artefato antigo não aprova o fonte corrente. Cada staging recebe configuração
  hostil que iniciaria Spring/acrescentaria argumentos se consultada. A filha
  entrega somente o resultado raster esperado, sem Spring/DB/provider.
- Regressões anteriores: IsolatedRenderAdapterNativeTest nove, supervisionado
  seis e protocolo seis. Pixels, manifesto, hashes, permissões, cleanup e original
  intacto preservados. Textos/imagens são sintéticos; não é tradução real ou
  aprovação linguística/volume/RSS.

## Integridade

Gateway: 281 fontes/testes/configurações em src/scripts/openapi, pom e Terraform;
caminhos relativos ordenados, SHA-256 de caminho + NUL + bytes + NUL:
`9af3a1d1852eebc9de32e2dbcdb929c1ff22d9aa473e07e4bab3411e72ab436e`.
Snapshot histórico do isolamento anterior preservado; checksum mobile é
governança, não cobertura de código Java.

JAR efetivamente empacotado/testado (target ignorado, snapshot desta rodada):
`0fa19173e32a2e65950b2c3d0c45713443fa9154b4e5f327a7befc73f92e9f5d`.
Esse hash identifica o artefato, não promete builds byte a byte reproduzíveis.

## Comandos e gates

Package offline: `./mvnw -o -q -pl apps/translation-gateway -am package -DskipTests`,
exit 0. Focalizado: comando do plano com os cinco testes, opt-ins archive/native
e codec previamente instalado; exit 0. Pins usados:

- encoder `/opt/homebrew/Cellar/webp/1.6.0/bin/cwebp`,
  `b31070342821b6316c756e22a336a72bbde4a6e4f2a9cabb22ffd49a73cc89cf`;
- decoder `/opt/homebrew/Cellar/webp/1.6.0/bin/dwebp`,
  `0fea0ca571920dac090ca32f4e4559b5125b92e33963b314f27c6757c1c1201c`.

Maven global `./mvnw -o -q test`, com archive/native enabled e os quatro pins
acima: exit 0. Iniciado em `2026-10-04T17:58:16.168Z`: XMLs frescos confirmaram
926 testes/75 classes no gateway, zero failures/errors/skipped. Quatro harnesses
históricos excluídos por data; contagem feita antes da suíte leve, sem Maven
sobreposto. RenderingPersistence 83, worker 17, schema 49 e dispatch três.
Os nove testes Boot foram executados, não inferidos do package -DskipTests.

Suíte leve `./mvnw -o -q -pl apps/translation-gateway -am test
-Dtest.excludedGroups=testcontainers`: exit 0, opt-ins nativos não selecionados.
Node: exit 0, 85 pass/um opt-in de fonte ignorado. Web pnpm exec tsc -b: exit 0.
Mobile pnpm check integral: exit 0, 116 suítes/892 testes; cadeia performance,
SDD/links, typecheck/lint/FSD/formato preservada. Warnings preexistentes de act/
ícones Expo não foram convertidos em novas provas ou suprimidos.
Nenhuma JVM filha de renderer/fixture permaneceu na inspeção exata pós-teste.

Prettier somente nos documentos/mapa alterados e git diff --check: exit 0.
Headers SDD rebaseados mecanicamente após estabilização, sem renovar conclusões
históricas; validação final de SDD/links/formato reexecutada sobre essa árvore.

## Limitações e próximo trabalho

O adapter supervisionado não é bean do worker. Distribuição Linux/codec/licenças
transitivas, contenção atômica de árvore nativa, orçamento de memória/disco,
deadline integral do pai e profiling no limite continuam implementações/provas
pendentes. Docker local não contém imagem JDK/codec Linux; não houve pull.
Retenção integral e revisão visual também permanecem abertas.

Performance mobile não aplicável: apenas documentação/governança mobile alterada.
Não inferir métricas Android de testes Java. Skills SDD mantêm exatamente uma
linha por AC e vínculo de evidência; não alteram critérios ou validators.
TASK-002/006/007/008 continuam abertas; nenhum gate da 021 foi aberto.
