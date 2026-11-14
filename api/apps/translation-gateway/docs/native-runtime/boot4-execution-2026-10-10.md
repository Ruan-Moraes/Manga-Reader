# Execução local Boot 4 — 2026-10-10

Parcela em andamento do [plano autorizado](boot4-migration-plan.md), somente no
gateway. Sem ADC, providers reais, imagens de usuário, deploy ou alterações cloud.
O usuário autorizou executar o plano e seus downloads/testes locais; instalações
adicionais fora dele e a etapa final de ativação/publicação exigem confirmação.
Não apresentar esta parcela como conclusão da 020 ou admissão operacional.

## Conjunto resolvido

Os BOMs oficiais foram comparados em preparação local separada, ignorada pelo
Git. Escolhido Boot **4.1.1**; Core/jobs/testing-support permanecem Boot 3.4.3,
Java 23. O gateway conserva JDK 25, bytecode 69, toolchains e agent Byte Buddy
explícito, sem bypass experimental. Parent `api/pom.xml` inalterado:
`81cf609acf875daa9a01275a58a3f6860fb2dfa83188b1a849f311ed4d6f7734`.

| Família                                  | Versão resolvida na preparação    |
| ---------------------------------------- | --------------------------------- |
| Spring Framework                         | 7.0.9                             |
| Spring Security                          | 7.1.1                             |
| Jackson próprio / transitivo Google      | 3.1.7 / 2.21.7                    |
| Tomcat                                   | 11.0.26                           |
| PostgreSQL JDBC                          | 42.7.13                           |
| Bouncy Castle                            | 1.85                              |
| Google libraries BOM / gRPC Netty shaded | 26.90.0 / 1.83.0                  |
| OpenTelemetry API                        | 1.62.0                            |
| Byte Buddy / JUnit Jupiter               | 1.18.11 / 6.0.3                   |
| Testcontainers                           | 1.21.4, preservado explicitamente |

Jackson e Tomcat recebem overrides coordenados porque o BOM Boot consultado
ainda não incorpora todos os patches candidatos da triagem. Jackson 2 continua
como dependência dos SDKs, não como mapper HTTP ou compatibilidade definitiva.
Testcontainers foi mantido: já funcionava com JDK 25, evitando trocar sua API
somente por estar disponível um major novo.

SHA-256 das fontes da preparação:

- BOM Boot 4.1.1: `1c929eeccb48f8ee12225e9fec725177170b89575754bd903f184c185db77775`.
- BOM Boot 4.0.8: `64ee29cc143cb36e5ec83dc3ca5a99c9313693b2e7cfc9a0d0cb3a77ab4a837d`.
- Effective POM da preparação: `b35cca5d0db3cb3191772647ccf90dcddfaa4c43b7d018748e2732aa49e01588`.
- Dependency tree da preparação: `4c736ea5b8ff05b4a0a18e3df69ae41574c84616fa9331114562066763af3eb3`.

Esses dois últimos arquivos descrevem o POM de preparação, não substituem o
inventário do JAR final. Downloads vieram do Maven Central; não houve nova
instalação de JDK, codec, modelo, tooling JS ou configuração global.

## Alterações e regressão

- Starters MVC, testes de segurança e Flyway adaptados à modularidade Boot 4;
  exclusão de usuário default ajustada para o novo namespace.
- Codecs, HTTP e harness/probes próprios migrados para Jackson 3. Anotações
  Jackson conservaram seu namespace suportado; domínio permaneceu sem SDK/Spring.
- `GatewayJsonMapper` fixa ordem de propriedades, escapes UTF-8/slashes e
  rejeição de campos desconhecidos; `GatewayJsonConfiguration` fornece o mapper
  para HTTP e casos de uso. Readers estritos usam builders imutáveis, mantendo
  rejeição de coerção, duplicatas, trailing tokens e campos obrigatórios.
- Launcher nativo passa a admitir exatamente Boot 4.1.1 e rejeitar versões
  anteriores/vizinhas. Hashes de suporte das fixtures renovados a partir dos
  JARs resolvidos, mantendo rejeição de hash incorreto:
  Spring Test `6ce8fc116f5d309b9ac50a6738bd1b15ea4012a4a5563c0ee89b795bfc9af0dc`;
  Security Test `85a8804e13e47186c86ce224954645b20df9d340e8c000e158050adc61c61d5a`.
- Sem alteração de SQL, migrations, estados, regiões/textos, imagem original,
  OpenAPI, task ou defaults operacionais.

## Comandos e resultados observados até aqui

Da raiz `api/`, fornecer `-t <toolchains.xml>` com o JDK 25 já preparado.
O arquivo pessoal fica fora do Git. `-o` proíbe download Maven durante validação.

```bash
./mvnw -B -ntp -o -t <toolchains.xml> -pl apps/translation-gateway test -Dtest=ManifestSerializationCompatibilityTest
./mvnw -B -ntp -o -t <toolchains.xml> -pl apps/translation-gateway test -Dtest=GatewayRuntimeTest
./mvnw -B -ntp -o -t <toolchains.xml> -pl apps/translation-gateway test -Dtest.excludedGroups=testcontainers
```

1. Antes da troca do stack, três fixtures sintéticas de OCR/tradução/render
   passaram com bytes esperados e SHA-256. Nenhuma captura privada foi usada.
2. O teste exigindo Boot 4.1.1 falhou no stack 3.5.16, como esperado.
3. Duas tentativas offline encontraram cache incompleto de plugins/launcher
   JUnit; preparação online explicitamente autorizada completou esses artefatos.
   Não removeram gates nem ativaram providers.
4. Primeira compilação encontrou imports Boot removidos e APIs JsonNode antigas;
   ajustados sem remover as verificações. Fontes e testes passaram a compilar.
5. Quatro testes focalizados passaram no novo stack, incluindo as três fixtures
   byte a byte. ISO Instant e shape/ordem/URI dos problemas também foram testados.
6. Novo teste encontrou aceitação de campo desconhecido no default Jackson 3;
   corrigida explicitamente. Primeiro gate leve: 993 testes, zero failures,
   um error por pin antigo na fixture, 18 skips. Essa execução não é aprovada.
7. Gate leve final: **996 testes, zero failures/errors, 18 skips opt-in**,
   concluído às 19:07:40 em America/Sao_Paulo. Não substitui PostgreSQL/nativo.
8. Node tooling: 109 testes, 108 pass, um skip, zero failures. Type-check web:
   exit 0, sem instalação de dependências.

Avisos Unsafe do protobuf e logs de fechamento de streams nos fakes gRPC
permanecem visíveis; não foram suprimidos para obter gates verdes. Resultados
simulados não comprovam qualidade de OCR/tradução/render em mídia real.

## Verificações ainda abertas nesta parcela

Maven global offline com Docker passou nos sete módulos, sem compilação Maven
concorrente, às 19:12:32 em America/Sao_Paulo: **2.737 testes em 845 classes,
zero failures/errors, 103 skips opt-in**. Gateway: 1.266 testes em 129 classes.
Contagens incluem somente XMLs Surefire renovados desde o início desta rodada,
não os relatórios de tentativas anteriores. Core executou Java 23/Boot 3.4.3;
gateway executou Java 25/Boot 4.1.1. Testes opt-in pulados não são cobertura nativa.

`pnpm check` mobile integral passou: 116 suítes, 892 testes, incluindo SDD,
type-check, lint, FSD e formatação; avisos `act(...)` foram preservados.
Não houve instalação JS. Links locais dos documentos alterados e formatação
direcionada passaram; `git diff --check` do gateway passou. O gate global mantém
a linha em branco adicional preexistente em
`web/landing-page/src/shared/component/PlatformBadge.tsx:44`; superfície externa
preservada, sem correção automática para aprovar este incremento.

## Empacotamento e scan observados

JAR Boot 4 empacotado com sucesso: 235.911.209 bytes, SHA-256
`6c6a8703aad2f52839790b7a95852544cc75a3328e2709bc4032dfcd63eee29e`.
A primeira tentativa offline de package encontrou cache incompleto dos novos
plugins; preparação online autorizada completou somente o cache necessário.
`-DskipTests` nessa fase não é evidência de testes, que foram executados antes.

Novas imagens locais, sem push e com preflight `admitted-not-operational`:

- ARM64: `sha256:ce0e7b7958aa7fcba79e573ad77ba94a1960264cc8428bf0128159cda50ef841`.
- x86_64 emulado: `sha256:169e23ab51f42084145cd66f490ebeac0f5285ab1ded645cdbf4f94315748d24`.
- Contextos: ARM64 `38e43ad61b27a4b4466618f18face6ff32e9776513e6e81a0d82662c185e1b31`;
  x86_64 `2252d752f1bb700d71cfb6980150caf4bb2f91e86c28487ad16c0e16af199274`.

Bases Java 25 previamente preparadas foram conferidas no daemon antes do build.
Builds usaram `--pull=false --network=none`, config Docker sem credenciais,
pacotes de codec readonly e pins anteriores. O aviso do builder legado foi
preservado; buildx não foi instalado automaticamente. Nenhuma base/codec/modelo
foi substituída silenciosamente.

Codec glibc/worker SDK: **seis testes, zero failures/errors/skips**, ARM64 e
x86_64 emulado, PostgreSQL e providers falsos. Conclusão às 19:17:24 local.
Matriz completa das novas imagens: **40 testes, zero failures/errors/skips**,
concluída às 19:45:17 local em 2026-10-10, incluindo formatos, dimensões, sete
destinos, falhas/recuperação, SDKs falsos, layout real local e bootstrap HTTP
pelo ENTRYPOINT de produção. A observação foi retomada no mesmo handle após
uma falha do mecanismo de revisão de permissões; nenhum teste foi reiniciado
por essa interrupção. Preflight e os seis testes anteriores não substituem
essa matriz. Compatibilidade Argon2 foi ampliada com fixture
sintética criada nas bibliotecas antigas, sem credencial real; dois testes
de tokens passaram nas bibliotecas novas.

Relatório XML da matriz preservado privadamente, SHA-256
`2fa7cc81bbf80146de1b095539ed4ab4dde61caafc55f6ce18bdd9826ebb1ba1`;
resumo sanitizado `9322e7dc52142d8d6ee94eb61a405bb3df7067feb5bc1941b0d2b4549478c0c5`.
São 38 arquivos de métricas originais preservados com hashes correspondentes,
mais os dois controles HTTP; não foram copiados imagens ou textos OCR.

| Controle SDK falso                | ARM64: pico cgroup em bytes | x86_64 emulado: pico cgroup em bytes |
| --------------------------------- | --------------------------: | -----------------------------------: |
| Worker máximo                     |               1.676.939.264 |                        1.893.048.320 |
| Worker com layout local residente |               2.805.592.064 |                        2.847.383.552 |

Esses controles usaram cgroup diagnóstico de 8 GiB e não registraram OOM kill.
Máximo observado nos 38 diagnósticos: 2.847.383.552 bytes. Isso não admite o
teto cloud de 1 GiB, hardware x86_64 nativo, SLA ou consumo com providers reais.
Os estados de falhas induzidas não são reclassificados como processamento real
bem-sucedido; testes verificam a recuperação/isolamento conforme cada caso.

Revalidação musl posterior: cinco testes aprovados, zero failures/errors/skips,
em ARM64/x86_64 emulado, preservando codec, configuração do worker e limites
confirmados pelo kernel. Nenhuma biblioteca nova foi adquirida para esse gate.

Trivy 0.75.0, mesmas DBs previamente adquiridas em 2026-10-10, offline e
ignorefile vazio. Duas tentativas `fs` (arquivo JAR e diretório do contexto)
identificaram **zero pacotes**: não são scans aprovados nem evidência “sem CVEs”.
Scan da imagem exportada reconheceu 108 pacotes Ubuntu e 195 Java:

| Superfície | Baseline anterior                                    | Nova imagem                      |
| ---------- | ---------------------------------------------------- | -------------------------------- |
| Java       | 25 ocorrências: sete CRITICAL, oito HIGH, dez MEDIUM | Zero ocorrências na DB utilizada |
| Ubuntu     | 18 ocorrências: 14 MEDIUM, quatro LOW                | As mesmas 18 ocorrências         |

Export x86_64 SHA-256:
`47ecc4a467dc79b7b1f63f0da1977b333781e51a4d64d1afc614b8818eeecb03`.
Relatório JSON SHA-256:
`449f4f3b78272d22c27e66e5417b86ab0ca1e796dff2f350ae11ec352df6474b`.
Artefatos ficam na rodada privada ignorada pelo Git. Zero alertas Java nessa DB
não é prova de ausência de vulnerabilidades; JRE embarcado/codec manual mantêm
análise separada. Não há waiver, supressão, aprovação de publicação ou correção
dos alertas OS nesta parcela.

Os patches OS identificados e os limites da próxima instalação estão no
[follow-up da base nativa](native-base-security-follow-up.md). Sua execução
exige confirmação própria, sem bloquear os testes Boot 4 já autorizados.

## Próximas verificações

Reexecução final após o teste de compatibilidade Argon2: **sete módulos SUCCESS,
2.738 testes em 845 classes, zero failures/errors, 103 skips opt-in**. Gateway:
1.267 testes em 129 classes. Contagens conferidas somente nos XMLs renovados
nessa reexecução; a matriz opt-in anterior foi preservada antes de seus relatórios
serem substituídos pelos skips da execução padrão. Nenhuma compilação concorrente.

Checksum técnico final: 398 arquivos,
`81dc03adcf3a10898ccd66945038fe9d6ee746d5430d049cbf10f4401b4736ef`.
Reproduzir o escopo/algoritmo da [verificação anterior](java25-verification-2026-10-10.md):
paths relativos ordenados, NUL, bytes completos, NUL; `src`, `scripts`, `openapi`,
`pom.xml` e `.tf`/`.tfvars.example` diretamente em `infra/terraform`. Exclui
docs, Dockerfiles, build, caches e capturas privadas. Não substitui os hashes
históricos nem representa cobertura do checksum SDD mobile.

Resumo das 38 métricas preservadas: SHA-256
`206c4fcd803c2edf4f76218359b222ef137dacff71948b13c2a5575718fc46b9`.
Leitura limitada aos diagnósticos dos testes desta rodada; a busca inicial no
temporário encontrou pastas de serviços macOS inacessíveis. Não foram abertas
nem houve escalada para acessá-las. A coleta foi restringida aos diretórios
JUnit, cenários e janela da matriz, sem modificar ou apagar os originais.

Terraform `fmt -check` e `validate` passaram com plugins já instalados, sem
`init`, `plan`, `apply`, instalação ou credenciais. A primeira validação no
sandbox falhou no handshake dos plugins; reexecução restrita fora dele passou.
Resultados Java 25 anteriores não são usados para aprovar o JAR Boot 4.

Após esses gates, revalidar inventário técnico e documentar findings residuais
OS/JRE/codec. Memória/cloud e revisão humana da 020 permanecem abertas, sem
alteração de status para conclusão nem desbloqueio automático da 021.

A instalação dos dois patches OS foi solicitada separadamente; permanece
pendente de resposta. Enquanto isso, nenhuma instalação adicional é executada.
