# Admissão do renderer no JAR Boot — 2026-10-04

Parcela de TASK-002/007 da MOB-FEAT-020. Plano escrito antes do código, preservado
abaixo; a execução e os limites correntes estão na seção final. O JAR Maven foi empacotado offline
antes da alteração do launcher: contém JarLauncher, PropertiesLauncher e
RenderChildMain em BOOT-INF/classes. Não há dependência nova ou install.

## Implementação prevista antes do código

- Admitir somente um JAR Boot 3.4.3, manifest Main-Class JarLauncher e Start-Class
  do gateway, com classes/libs e RenderChildMain presentes. Mistura com classpath
  externo, loader ausente/versão inesperada/configuração Loader-\* falha fechada.
- Selecionar explicitamente RenderChildMain por PropertiesLauncher, nunca usar
  java -jar/Start-Class para a filha. Preservar o bootstrap normal do serviço.
- Fixar loader.home no staging próprio, loader.path somente nos diretórios
  internos Boot e loader.config.location em recurso inexistente controlado;
  recusar o artefato se esse recurso existir. Não ler loader.properties do
  diretório atual/home nem aceitar argumentos/main de configuração externa.
- Continuar classpath plano de desenvolvimento, ambiente removido, stdout/stderr
  descartados, heap limitado e ausência de dados de negócio nos argumentos.
- Provar execução no artefato empacotado via opt-in separado, sem Spring/DB/Google,
  com libwebp local e fixtures sintéticas; comparar manifestos/pixels e página vazia.
- Revalidar integridade do JAR contra classes/recursos atuais antes desse teste;
  um JAR antigo não comprova o fonte corrente. Gerar package offline primeiro.

Nenhum schema, migration, interface RenderPort, manifesto público, variável de
runtime ou bean novo. A etapa não admite Linux/codec/cgroup ou orçamento nativo/
disco: esses continuam próximos trabalhos funcionais. O worker continua no
adapter anterior em local opt-in e os defaults permanecem disabled.

## Testes e gates

Testes antes do código: flat/Boot, mistura, manifest/versão/loader/child ausentes,
seleção de main indevida, wildcard/path ausente, ambiente/args e configuração
externa. Opt-in nativo do JAR: equivalência dos sete destinos e página vazia,
fontes licenciadas empacotadas e original preservado. Falhas não expõem saída
bruta ou tentam outro launcher. Testes comuns não dependem de JAR preexistente.

Maven módulo/global offline com Docker, package offline + teste do artefato, Node,
web typecheck, pnpm check, SDD/links/formato/diff. Mantém 020 in-progress e 021
blocked. Não baixar imagem/container/modelo, chamar provider, usar credencial,
alterar Termos ou criar recurso cloud.

## Entrega local e reprodução

RenderJvmLauncher admite o artefato Boot isoladamente e mantém o classpath plano.
Manifest e conteúdo incompletos/inesperados falham com render-configuration;
nenhuma saída bruta ou tentativa de outro launcher. A configuração externa
loader.properties não participa do bootstrap da filha. O teste real inclui
um arquivo hostil no staging para provar isso. A aplicação normal continua com
JarLauncher/Start-Class anteriores; nenhuma configuração Spring ou bean foi alterado.

O classpath do Surefire termina com separador vazio. A primeira execução revelou
regressão ao tratá-lo como entrada inválida; teste red/green preserva o tratamento
anterior: remover o sufixo, nunca adicionar cwd. Entradas vazias internas/na
origem continuam recusadas. Um JAR com BOOT-INF mas sem manifest válido não
pode ser classificado silenciosamente como plano.

Gate opt-in do artefato (a partir de api, sem install/rede):

```bash
./mvnw -o -q -pl apps/translation-gateway -am package -DskipTests
./mvnw -o -q -pl apps/translation-gateway -am test \
  -Dtest=RenderJvmLauncherTest,RenderArchiveNativeTest,IsolatedRenderAdapterNativeTest,IsolatedRenderAdapterTest,RenderSubprocessProtocolTest \
  -Dsurefire.failIfNoSpecifiedTests=false \
  -Drenderer.archive.enabled=true -Drenderer.native.enabled=true \
  -Drenderer.cwebp.path=/caminho/absoluto/cwebp \
  -Drenderer.cwebp.sha256=HASH_VERIFICADO_DO_ENCODER \
  -Drenderer.dwebp.path=/caminho/absoluto/dwebp \
  -Drenderer.dwebp.sha256=HASH_VERIFICADO_DO_DECODER
```

Os placeholders exigem preparação explícita do libwebp 1.6.0, não são comandos
de aquisição. RenderArchiveNativeTest verifica todos os bytes de classes e
recursos compilados do módulo contra BOOT-INF/classes antes de executar. Mudança
de main/resource exige novo package; JAR antigo não é evidência do fonte novo.
renderer.archive.path permite apontar explicitamente para o artefato local;
o default de teste é target/translation-gateway-0.0.1-SNAPSHOT.jar. Isso não
adiciona variável operacional. Testes comuns não criam ou baixam JAR/tool.

As fixtures sintéticas dos sete destinos e páginas PNG/WebP vazias comparam
manifestos e pixels com a composição anterior; original e staging conferidos.
Não são revisão linguística, benchmark ou prova de memória nativa no limite.
Os testes de processo requerem permissão local de supervisão no macOS.

Boot admitido não significa distribuição Linux admitida. A imagem Docker Java/
codec Linux não existe no cache local; não foi baixada. Contenção atômica dos
processos nativos, orçamento de memória/disco, deadline integral do chamador e
integração supervisionada no worker continuam trabalho funcional aberto.
020 in-progress/open e 021 blocked; defaults disabled. A
[evidência datada](../../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/rendering-archive-2026-10-04.md)
guarda comandos efetivos, hashes e resultados; conclusões históricas preservadas.

Esta fotografia antecede a aquisição e a [prova Linux ARM64 local](rendering-linux.md)
autorizadas posteriormente em 2026-10-04. A evidência Boot anterior permanece
histórica; a prova posterior não conclui distribuição ou contenção de produção.
