# Verificação Java 25 — 2026-10-10

Registro local complementar, não admissão operacional. [Escopo, versões,
comandos e inventário](java25-migration.md). Sem provider remoto, ADC, deploy,
cloud ou ativação de defaults. A 020 continua `in-progress` e a 021 bloqueada.

## Artefatos identificados

- JDK macOS ARM64 oficial 25.0.4.1+1: SHA-256 do archive
  `61979887f7506a24a57439ff99adb8b3a7fc89977d9cfe3b8984f58a981b7b9d`.
- JAR Boot 3.5.16/bytecode 69: 222.613.422 bytes,
  SHA-256 `e2548cc6acc1e40b7e2f66640da9179785a15e8a0761edab1d733be267677283`.
- Checksum técnico: 394 arquivos,
  `e04aebeb4813b7d5701417bb8787636181640c4f8b515d5dada3aaea88281264`.
  Reproduzir o comando de hashing da
  [consolidação OCR](../../../../mobile/docs/specs/features/MOB-FEAT-018-multilingual-ocr-regions/evidence/ocr-consolidation.md#checksum-técnico-reproduzível):
  paths relativos ao gateway ordenados, NUL, bytes completos, NUL. Escopo:
  `src`, `scripts`, `openapi`, `pom.xml`, `.tf`/`.tfvars.example` diretamente em
  `infra/terraform`. Exclui Dockerfiles, docs, build, caches e artefatos privados.
  Não renova ou substitui o checksum técnico histórico da 018 nem o SDD mobile.
- Imagem nativa ARM64/glibc local:
  `sha256:d4a3f31ca1d016d8dae005915022df0783da3f52b85ae3268f8701f7eb47c409`.
- Imagem nativa x86_64/glibc local:
  `sha256:4cd6de6c1fce72250a5295b3ce2c122c4e4bd152c27c4c837829a83c21d8d454`.
- Hashes dos contextos novos: ARM64
  `e6db59e950e220c52f3f214311f462ee6808b58d88c7db78a82368062d7b2440`;
  x86_64 `6fd6fda846d41134546d6cdafb017635b5d1e615158c501a04f4fcca40a1fd9d`.

São IDs locais, não imagens publicadas/assinadas. Preflight nos dois builds:
`admitted-not-operational`, sem imagens/provider. Contextos da primeira
tentativa que encontrou o pin Boot antigo permanecem preservados, sem serem
reclassificados como aprovados.

## Evidência já observada

- TDD: admissão Java 25 falhou na implementação Java 23; depois passou.
  Fixtures Boot 3.5.16 falharam no launcher 3.4.3; atualização do pin exato
  preservou rejeição de versões diferentes, loader config e classpath misto.
- Gates focalizados: 46 testes Java aprovados, sem skips, antes da última
  ampliação da asserção de bytecode. A compilação principal é major 69;
  Core continua major 67, Boot 3.4.3 e JVM 23 no reactor.
- Suíte leve inicial Java 25: 983 testes, zero failures/errors, 18 skips
  opt-in. Primeira tentativa no sandbox falhou por bind loopback e subprocesso;
  reexecução fora do sandbox passou, sem mudança nos validadores.
- Codec glibc e worker SDK: seis testes aprovados, sem skips, em ARM64 e
  x86_64 emulado. PostgreSQL 17, migrations atuais, storage local e SDKs
  oficiais somente em fakes internos. Cada worker gerou três READY sintéticos,
  três chamadas Vision falsas e duas Translation falsas; reentrega não
  repetiu provider. Nenhuma dessas saídas é OCR/tradução real nova.
- Codec/bootstrap/guard musl: cinco testes adicionais aprovados, sem skips,
  em ARM64 e x86_64 emulado. Mantêm validação independente dos pixels, alpha,
  RGB sob transparência, kernel limits e ausência de native access no pai.
- Pico cgroup do worker SDK: ARM64 1.671.634.944 bytes, x86_64
  2.000.338.944 bytes, em cgroup diagnóstico 8 GiB. Pai/filha AS 3 GiB,
  scratch 512 MiB, sem swap adicional/OOM observado. Isso não admite o teto
  cloud de 1 GiB, hardware x86_64 nativo ou todas as combinações do pipeline.
- Node: 109 testes, 108 pass, um skip e zero failures. Type-check web passou.
- `pnpm check` mobile integral: aprovado; 116 suítes/892 testes, sem alteração
  de dependências ou lockfile. Avisos `act(...)` de testes foram preservados.

Formatação direcionada usou o binário Prettier já instalado no mobile. Uma
tentativa anterior de `npx` fora do workspace falhou ao resolver o registry por
DNS, sem instalação; não foi repetida com acesso ampliado. Não houve
reinstalação de dependências JS ou formatação automática global.

O primeiro Maven global não é evidência de aceite: coincidiu com uma
recompilação focalizada sobre o mesmo `target/`, gerando classes ausentes e
fixtures em transição. Reexecução final deve ocorrer sem compilação concorrente.
Falhas reais de configuração encontradas antes disso (pins de Spring Test,
Security Test e launcher Boot) foram corrigidas com verificação estrita,
nunca com remoção de checks.

## Scan local e triagem

Trivy 0.75.0 com DB e Java DB previamente adquiridas em 2026-10-10, execução
offline sem atualização/rede e ignorefile vazio. Export da imagem x86_64
SHA-256 `5c833b4fdc1523b47cf2af8904aabf3614e9755ceac0879dbdd3ee4d0eecb66b`;
relatório SHA-256 `bfc656e9fd3ea946f25e577cf8cf12f47d088d47b94b3d19827ce04d0d2014f7`.
Estão no diretório privado ignorado `.local/worker-isolation/` desta rodada.

| Superfície reconhecida pelo scanner | Pacotes | Ocorrências                              |
| ----------------------------------- | ------: | ---------------------------------------- |
| Ubuntu 24.04                        |     108 | 18: 14 MEDIUM, quatro LOW                |
| JAR Java                            |     169 | 25: sete CRITICAL, oito HIGH, dez MEDIUM |

Essas são classificações do scanner/DB, não prova de exploração no projeto.
Não há supressões nem conclusão “imagem segura”. O scan do probe sem aplicação
não tinha a mesma cobertura Java e não substitui este relatório.

Famílias com alertas Java: Jackson core/databind, gRPC Netty shaded,
OpenTelemetry API, Commons Lang3, Log4j API, Tomcat embed, Bouncy Castle,
PostgreSQL JDBC e Spring MVC. O arquivo JSON privado mantém todos os IDs,
versões, fontes e versões sugeridas; não atualizar essas famílias ou migrar
silenciosamente para Boot 4 neste incremento.

Para Spring, a fonte primária difere da severidade do scanner:
[CVE-2026-47884](https://spring.io/security/cve-2026-47884/) é MEDIUM no vendor
e envolve `XsltView` com mapping de view implícito; a
[CVE-2026-47890](https://spring.io/security/cve-2026-47890/) é LOW no vendor e
envolve SSE com fragments. Busca local não encontrou configuração/uso explícito
dessas APIs no gateway. **Inferência limitada:** as condições descritas não
foram identificadas no código; não há VEX validado nem waiver de produção.
Os dois pacotes continuam afetados no inventário. Spring informa correção
6.2.20 enterprise ou 7.0.9 OSS, exigindo decisão própria para a próxima parcela.

Os três alertas Tomcat classificados CRITICAL pelo scanner correspondem,
na [fonte primária Apache](https://tomcat.apache.org/security-10.html), a
constraints de paths, replay DIGEST e redirect FORM com constraints por método.
Não foram provadas condições de exploração; divergência de classificação não
autoriza remover os alertas. Correções/triagem das outras famílias continuam
pendentes, inclusive APIs que processam JSON e segurança criptográfica.

JRE embarcado e pacote manual libwebp não são cobertos integralmente pela
contagem OS/JAR. O [inventário separado](java25-migration.md) registra hashes e
versões de FreeType/libpng/zlib. Backports e reachability da CVE do zlib
embarcado permanecem pendentes; ausência em Trivy não prova ausência de risco.

## Fechamento de gates

A matriz da imagem executou 40 controles: 38 aprovados, zero failures e dois
errors, sem skips. Os dois errors ocorreram antes da inferência porque a
invocação usou `renderer.layout.model` em vez de
`renderer.native.image.layout.model`. A correção é na chamada do teste, não
no código/validador. A rodada inicial fica preservada. Reexecução com a
propriedade correta: dois testes aprovados, zero failures/errors/skips. Todos
os 40 controles distintos ficaram validados, sem promover a invocação inicial
que falhou a comando verde.

Maven global final offline, com Docker e toolchain 25 somente no gateway:
**sete módulos SUCCESS**, 2.728 testes em 843 classes, zero failures/errors,
103 skips opt-in. Gateway: 1.257 testes em 127 classes; os skips não são
promovidos a cobertura. Os gates opt-in de codec/worker/imagem acima foram
executados separadamente. Conclusão às 21:38:17 UTC, sem recompilação concorrente.
O resumo JSON privado registra somente relatórios Surefire renovados nessa
execução, sem reutilizar a primeira rodada global inválida.

Reexecução leve final após o global: 987 testes, zero failures/errors,
18 skips opt-in, exit 0. Node final mantém 109/108 pass/um skip/zero failures;
type-check web, SDD, links e formatação direcionada continuam aprovados.
O checksum SDD mobile permanece
`9d3be06f307186703a915fc5f4d8500e4e02d57900e8ae875a8cd185a3f15551`;
ele não cobre nem aprova o Java. Suplementos técnicos: Dockerfile padrão
`dd4c47b699bf1a53e0d71ffdad07dc631f4e5267312ee697cb17c8ce119e6c39`,
Dockerfile nativo inalterado
`36b07b4d1fc30c445858ca94519222c1aa49b0ef662f6f4d5355b1bad8a936f5`.

Os 38 controles aprovados incluem SDKs falsos, bootstrap pelo ENTRYPOINT de
produção com UID 1000, HTTP privado/503 do OCR desabilitado, formatos,
dimensões, pintura dos sete destinos, falhas de memória/disco, timeout,
cancelamento e recuperação. Nenhuma rodada simulada aprova qualidade real.
A aprovação técnica local, quando obtida, não fecha a triagem de segurança,
a admissão cloud ou a qualidade humana da feature.

`git diff --check` no escopo do gateway passou. O gate global encontra uma
linha em branco adicional em `web/landing-page/src/shared/component/PlatformBadge.tsx:44`,
alteração externa preservada. Não formatar ou corrigir essa superfície para
aprovar a migração.
