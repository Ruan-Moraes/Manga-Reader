# Plano de migração isolada do gateway para Boot 4

**Execução autorizada pelo usuário em 2026-10-10.** Preparada nessa data a
partir do código atual e da [triagem](security-triage-2026-10-10.md).
A autorização abrange a migração isolada e seus downloads/testes locais.
Instalações adicionais fora deste plano e a etapa final de ativação/publicação
exigem confirmação. O registro da preparação abaixo é histórico; execução e
resultados ficam em evidência própria. ADC, chamadas pagas e deploy estão fora.

## Objetivo e invariantes

Remediar as dependências do gateway sem migrar Core/jobs nem reduzir as
proteções da renderização. A conclusão desta parcela não equivale à conclusão
da 020: admissão de memória/cloud e qualidade humana continuam separadas.

- Manter Java 25 e bytecode 69 somente no gateway; reactor e demais módulos
  conservam suas versões e coordenadas.
- Preservar as oito rotas `/v1`, os erros `application/problem+json`, a task
  `{jobRef}`, perfis privados, manifestos existentes e defaults desabilitados.
- Não reescrever capturas, relatórios, hashes históricos ou dados compartilhados.
- Não criar migration, mudar SQL/estados/quota ou chamar providers para testar.
- Preservar isolamento da JVM filha, admissões exatas, hashes e limites nativos.
- Não adquirir suporte enterprise, alterar infraestrutura cloud ou publicar imagem.

O [guia oficial](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-4.0-Migration-Guide)
identifica mudanças em Framework, Servlet, módulos/starters e Jackson. Essas
mudanças justificam testes de contrato e bootstrap, não apenas troca do parent.
A [documentação consultada](https://docs.spring.io/spring-boot/4.0/upgrading.html)
lista 4.0.8 e 4.1.1 como estáveis. São candidatos, não versões admitidas: a
escolha deve comparar BOMs e correções, sem snapshot ou intervalo dinâmico.

## Etapa 1 — Fixar baseline e conjunto de dependências

Após aprovação dos downloads locais:

1. Registrar hashes de fontes, migrations, Dockerfiles, POMs dos outros módulos
   e artefatos atuais, sem alterar a árvore externa. Preservar o scan anterior.
2. Resolver os BOMs candidatos em preparação local separada e registrar o
   effective POM/dependency tree. Não sobrescrever `target/` durante outro build.
3. Escolher uma versão exata Boot 4 que forneça correções Spring abertas.
   Confirmar Tomcat, Jackson, JDBC, Bouncy Castle, Log4j, Commons e OpenTelemetry.
4. Resolver Google libraries BOM/gRPC coordenadamente. Conferir Vision, Tasks,
   Storage e Translation, deadlines e retry settings com fakes locais.
5. Conferir Testcontainers, JUnit, Mockito, Byte Buddy e plugins com JDK 25;
   não atualizar por conveniência dependências sem relação com a migração.

**Saída:** inventário antes/depois, versões exatas e lista de downloads.
Compatibilidade ou correção não confirmada é pendência explícita; não excluir
dependências transitivas para esconder CVEs.

## Etapa 2 — Migrar bootstrap e JSON com regressão primeiro

Antes de alterar o parent, adicionar fixtures sintéticas com bytes esperados,
SHA-256 e resposta HTTP atual. O teste de nova versão deve falhar no stack antigo.

| Superfície observada no código                                              | Trabalho previsto                                                                          | Prova requerida                                                                                  |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `pom.xml`, `TranslationGatewayApplication`, `application.yml`               | Ajustar starters e imports/propriedades removidos; revisar exclusão de UserDetailsService. | Bootstrap gateway/worker/job, sem usuário default ou inicialização de provider desabilitado.     |
| `OcrManifestService`, `TranslationManifestService`, `RenderManifestService` | Migrar codecs para Jackson 3, com configuração explícita.                                  | Bytes sintéticos estáveis, leitura de formatos anteriores, hashes, limites e rejeições estritas. |
| `ShadowLayoutService`, `BundledRenderingFonts`                              | Migrar JSON sem mudar contrato experimental ou admissão das fontes.                        | Artefatos válidos e adulterados, geometria, limites e hash dos recursos.                         |
| `SessionAuthenticationFilter`, controllers e capabilities                   | Migrar serialização HTTP sem mudar autenticação ou disclosure.                             | Shape/status/headers, datas, omissão de campos, JSON de erro e ETag inalterados.                 |
| Testes MVC, harness e probes                                                | Ajustar módulos de teste e imports Boot removidos.                                         | Filtros continuam ativos nos testes de segurança; providers permanecem falsos.                   |
| Repositórios JDBC/Flyway                                                    | Conferir autoconfiguração e transações.                                                    | Migrations atuais, constraints, locks, reserva única e atomicidade em PostgreSQL 17.             |

Estratégia proposta: Jackson 3 nos codecs/controladores/harness próprios; não
adotar o módulo de compatibilidade Jackson 2 como solução definitiva. Se SDKs
exigirem Jackson 2 transitivo, manter suas versões corrigidas e verificar
separação dos mappers. Anotações devem seguir os namespaces realmente suportados,
não uma substituição mecânica de todos os imports.

Preservar em particular UTF-8, BOM quando permitido, datas, UUIDs, nulls,
ordem dos campos/regiões, números/escapes e cálculo de hash sobre bytes efetivos.
Testar CJK, emoji, HTML como texto, chaves duplicadas, desconhecidas, trailing
tokens, coerção, creator fields, total de bytes e exceções sem conteúdo privado.
Uma propriedade de compatibilidade não será considerada prova de equivalência.

O ETag de capabilities é calculado da configuração canônica em
`GetCapabilitiesUseCase`, não de Jackson; preservar esse algoritmo e testar
também o JSON servido. Para persistência, os adapters observados usam
`JdbcClient`; o POM ainda inclui JPA. Não remover JPA/Hibernate nesta migração
sem análise própria nem permitir DDL automático. Mudança de dados/schema, se
necessária, interrompe esse escopo e exige plano `database-design` antes do código.

**Saída:** testes leves e integração PostgreSQL aprovados, sem alteração de
contratos públicos ou conteúdo histórico. Incompatibilidade exige investigação,
não relaxamento de parser ou troca silenciosa de formato.

## Etapa 3 — Revalidar empacotamento e fronteira nativa

- Atualizar o pin exato Boot de `RenderJvmLauncher`, suas fixtures, o teste
  `GatewayRuntimeTest` e `scripts/gateway-runtime.test.mjs` para a versão escolhida.
  Preservar rejeição de versões vizinhas, loader/config externos e classpath misto.
- Regenerar hashes de suporte de `LinuxRenderContainerFixture` a partir dos
  JARs resolvidos e identificados, nunca aceitar hash genérico ou ignorar a comparação.
- Conferir o executável Boot, `BOOT-INF`, launcher e ENTRYPOINT reais. Construir
  novas imagens locais exclusivas; preservar as imagens antigas e seus relatórios.
- Testar codec glibc/musl ARM64 e x86_64, worker SDK falso, layout local quando
  habilitado no teste, HTTP de produção, cancelamento, timeout e confirmação perdida.
- Reexecutar matriz de formatos/dimensões/idiomas e falhas de memória/disco.
  Registrar picos e emulação; sucesso em diagnóstico de 8 GiB não admite 1 GiB cloud.

**Saída:** JAR/imagens identificados, pins estritos aprovados e evidência nativa
sem acesso Google. Não aproveitar a troca de Boot para trocar codec/modelo/fontes.

## Etapa 4 — Gates, novo scan e decisão

Executar serialmente, com comandos/ambiente registrados:

1. Node tooling, testes leves e todos os testes gateway com Docker.
2. Maven global offline com toolchain 25 no gateway e JDK 23 nos outros módulos.
   Não executar compilação focalizada concorrente sobre o mesmo `target/`.
3. Type-check web, `pnpm check` mobile, SDD, links, formatação direcionada e
   `git diff --check`, sem reinstalação implícita ou correção externa automática.
4. Scan das novas imagens com DB/versionamento identificados, sem supressões;
   comparar cada finding Java e inventários OS/JRE/codec com a fotografia anterior.
5. Atualizar README/evidência/checksum técnico com resultados realmente observados.
   Falha alheia, skip opt-in, CVE residual e falta de hardware nativo permanecem visíveis.

**Aceite técnico:** versões admitidas, invariantes e todos os gates aplicáveis
comprovados; nenhum alerta Java da triagem descartado sem remediação ou análise
fundamentada. CVEs OS/JRE não são resolvidas apenas por upgrade Java das bibliotecas.
Produção permanece bloqueada enquanto segurança, memória ou verificações externas
obrigatórias estiverem abertas. Não promover 020/021 automaticamente.

## Comandos-base sugeridos, ainda não executados

Da raiz do repositório, com JDKs/toolchains e caches previamente preparados:

```bash
cd api
./mvnw -B -ntp -o -t <toolchains.xml> -pl apps/translation-gateway test -Dtest.excludedGroups=testcontainers
./mvnw -B -ntp -o -t <toolchains.xml> -pl apps/translation-gateway test
./mvnw -B -ntp -o -t <toolchains.xml> test
```

Os placeholders precisam de paths locais reais fora do Git; esses comandos não
representam execução feita, não baixam caches ausentes em `-o` e não substituem
as matrizes opt-in. Falta de artefato offline pede preparação explícita, nunca
remoção de gate. Aquisição de pacotes, atualização da DB do scanner e builds
Docker serão ações locais identificadas após aprovação, sem cloud/credenciais.

## Verificação desta preparação

O checksum técnico foi reproduzido sobre 394 arquivos e permanece
`e04aebeb4813b7d5701417bb8787636181640c4f8b515d5dada3aaea88281264`,
igual à fotografia Java 25. Formatação dos dois documentos e quatro links
locais foram conferidos. Nenhum teste de runtime foi reexecutado nesta parcela;
os resultados anteriores não constituem evidência da migração Boot 4 proposta.
