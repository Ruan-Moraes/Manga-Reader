# Migração local do gateway/worker para Java 25

Fotografia histórica do incremento Java 25/Boot 3.5.16. A evolução autorizada
para Boot 4 está no [registro próprio](boot4-execution-2026-10-10.md); versões,
hashes e resultados abaixo não são evidência do novo empacotamento.

Incremento autorizado em 2026-10-10. Sem deploy, push, ADC, chamadas pagas,
mudanças cloud ou ativação de uploads. A MOB-FEAT-020 permanece `in-progress`;
a 021 permanece bloqueada. Compatibilidade local não aprova operação cloud.

## Stack e isolamento do reactor

Somente `translation-gateway` passa a Java 25 e parent Spring Boot 3.5.16.
O reactor continua agregando-o, com as mesmas coordenadas Maven. Core,
testing-support e jobs mantêm Java 23 e o parent compartilhado Boot 3.4.3.
Não importar um BOM novo sobre o parent antigo: o parent próprio evita mistura
implícita das versões gerenciadas e dos plugins.

O parent fixa Framework 6.2.19, Security 6.5.11, Mockito 5.17.0, Byte Buddy
1.17.8, Compiler 3.14.1 e Surefire 3.5.6. Não usar
`net.bytebuddy.experimental`. O BOM Google 26.58.0 e ONNX Runtime 1.24.2 não
mudam neste incremento. Avisos de uso de `Unsafe` por dependências não foram
suprimidos nem confundidos com autorização para atualizar providers.

Fontes oficiais: [requisitos Boot 3.5](https://docs.spring.io/spring-boot/3.5/system-requirements.html),
[parent publicado](https://repo.maven.apache.org/maven2/org/springframework/boot/spring-boot-starter-parent/3.5.16/spring-boot-starter-parent-3.5.16.pom)
e [release Temurin](https://github.com/adoptium/temurin25-binaries/releases/tag/jdk-25.0.4.1%2B1).

## Preparação explícita e execução

Instalar/adquirir JDK 25 separadamente. No macOS ARM64 deste registro, o
archive oficial `OpenJDK25U-jdk_aarch64_mac_hotspot_25.0.4.1_1.tar.gz` possui
SHA-256 `61979887f7506a24a57439ff99adb8b3a7fc89977d9cfe3b8984f58a981b7b9d`,
conferido contra o digest dos assets da release. Isso não equivale a validação
independente de assinatura. Não instalar chave de service account.

Maven do reactor pode continuar em JDK 23. Fornecer um arquivo pessoal
`toolchains.xml` fora do Git, apontando à instalação própria do JDK 25:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<toolchains>
  <toolchain>
    <type>jdk</type>
    <provides><version>25</version></provides>
    <configuration><jdkHome>/caminho/absoluto/ao/jdk-25</jdkHome></configuration>
  </toolchain>
</toolchains>
```

Pelo diretório `api/`, depois da aquisição explícita das dependências:

```text
./mvnw -B -ntp -o -t <toolchains.xml> -pl apps/translation-gateway test -Dtest.excludedGroups=testcontainers
./mvnw -B -ntp -o -t <toolchains.xml> test
./mvnw -B -ntp -o -t <toolchains.xml> -pl apps/translation-gateway package -DskipTests
```

O segundo comando exige Docker e valida também os módulos Java 23. Um cache
Maven incompleto falha em modo offline; não autoriza download automático ou
troca de versão. Para `spring-boot:run`, iniciar o próprio Maven em JDK 25,
além de configurar a toolchain quando necessária. Nenhum path pessoal entra
no POM. `GatewayRuntimeTest` confere JVM 25, bytecode 69 e Boot 3.5.16;
o teste Node `gateway-runtime.test.mjs` protege o escopo do reactor.

## Imagens e admissão nativa

Bases JRE oficiais Temurin 25.0.4.1+1, obtidas por arquitetura no manifest
público em 2026-10-10:

| Alvo                | Digest `eclipse-temurin@sha256:`                                   |
| ------------------- | ------------------------------------------------------------------ |
| ARM64/glibc, Noble  | `c31e783e090e5bcf4ddee2bfbce5bf78b5d832daae66767cb9a2315b8d4802b5` |
| x86_64/glibc, Noble | `78498f30dd330b06755c1b134039dcbf8324bedb385136819dd519b842a3816a` |
| ARM64/musl, Alpine  | `f1286b7530a3ae2f9a9bad98a08fb99e2b4524afe508384fbb892bc8e37c86c1` |
| x86_64/musl, Alpine | `2f9d7b671dd5f7acc9ced625afb7f90916c81668b905c9d03f52d3c8544c7db3` |

O Dockerfile padrão fixa o index Maven
`8e5fbd12216e289fe87356e3f534f17188f6fa9bd08ffe29e745fb6bd29e9ae3`
(`3.9.11-eclipse-temurin-25-alpine`) e o index JRE Alpine
`3c0a9084927a221ccd1d007fcaf614465672c0af37aaa834c5184483afe56d61`.
Não foi construído/publicado esse caminho com downloads no build neste marco.
O caminho nativo local usa bases já em cache e `--network=none`/`--pull=false`.

O codec exige **exatamente Java 25**, Linux little-endian e ABI/interpreter
admitidos. Java 23/24/26 continuam recusados. Pacote libwebp 1.6.0,
ELF, hashes/licenças, allocator, cgroup, staging, limits, isolamento e ambiente
sanitizado não são relaxados. O launcher admite exatamente Boot 3.5.16;
outras versões, loader config externo e classpath misto seguem rejeitados.
O preparador não baixa, não invoca Docker e não ativa providers. Registra
`runtimeMajor=25` e `javaVersion=25.0.4.1+1`; admissão real continua no preflight.

Contexts e imagens anteriores Java 23 e o probe independente ficam preservados.
O probe diagnóstico permanece bytecode Java 23 executável no JRE 25; ele não é
o artefato do worker, nem evidência da migração Spring.

## Segurança: OS, JDK e codec são superfícies distintas

Inventário read-only/sem rede do JRE x86_64 fixado: `release` declara Temurin
25.0.4.1+1-LTS, source `520406d87195`, com licenças de FreeType 2.14.3,
libpng 1.6.58 e zlib 1.3.2. São cópias embarcadas, não necessariamente as
bibliotecas dos pacotes Ubuntu. Atualização APT do probe anterior não prova
correção dessas cópias nem foi propagada silenciosamente à imagem do worker.

| Arquivo em `/opt/java/openjdk/` | SHA-256                                                            |
| ------------------------------- | ------------------------------------------------------------------ |
| `release`                       | `8bb46d751a83532c061d59d528b84488786406ce0ea3dcca4b04dca52dca9cda` |
| `lib/libfreetype.so`            | `169f4e7e4e811549c263818dfe90af822bfe168932287f3c448e46268ab6d0e5` |
| `lib/libfontmanager.so`         | `4a7be6d7139b00e8b1cdf703071ed92763efe6dd9e1555137d56a82a5f528ab5` |
| `lib/libzip.so`                 | `9a3f692fa775419fd42d54bd27ffac6d12ff7f323a81b2ec9ac95ae38d06095b` |
| `lib/libjava.so`                | `4b31a8942a1a7eebdfa1505875ce8827dae4e8fa6dd99427bbb65653ed9febc2` |
| `lib/libawt.so`                 | `24543cd49e2de4dc52b18b0efdb6120198d885083792cb20dd881a0dfd79da46` |

Os hashes identificam bytes, não ausência de vulnerabilidades. O
[inventário por alvo](java25-native-inventory.json) registra também as leituras
independentes ARM64/glibc e ARM64/x86_64 musl; não reaproveita hashes entre
arquiteturas. O scanner de OS não cobre sozinho
essas cópias nem o libwebp copiado manualmente. A
[CVE-2026-85091](https://ubuntu.com/security/CVE-2026-85091) exige triagem
de reachability/backports do zlib embarcado; versão ou símbolo isolado não
prova nem descarta explorabilidade. Não há supressão, VEX de fornecedor
validado ou aprovação de produção neste registro.

## Evidência e pendências

Resultados e hashes da rodada ficam em
[registro de verificação](java25-verification-2026-10-10.md). Registros privados
usam diretórios novos em `.local/worker-isolation/`, ignorados pelo Git, sem
sobrescrever capturas OCR, diagnósticos ou imagens históricos. Repetir os gates
após estabilização, sem executar duas compilações sobre o mesmo `target/`.

Mesmo após gates locais aprovados, permanecem separados: revalidação completa
de orçamento/OOM, cobertura adicional dos alvos, segurança JDK/OS/codec,
hardware x86_64 nativo, operação cloud e qualidade humana. Nada aqui habilita
gateway, worker cloud, layout, tradução ou renderização por default.
