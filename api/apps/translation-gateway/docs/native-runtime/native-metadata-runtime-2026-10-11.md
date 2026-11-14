# Metadados Linux e imagens corrigidas — 2026-10-11

Continuação da [auditoria física do rootfs](rootfs-archive-audit-2026-10-11.md).
Registro local experimental, não admissão de produção. A 020 permanece
`in-progress/open` e a 021 `approved/blocked`. Temurin continua sendo o default;
gateway, worker cloud e processamento público permanecem desabilitados.
Nenhuma instalação nova, credencial, chamada paga ou recurso cloud foi usado.

## Escopo e evidência direta

O [probe Java exclusivo de testes](../src/test/java/com/toonlira/translationgateway/infrastructure/rendering/RootfsNativeMetadataProbe.java)
usa FFM para chamar `llistxattr`, `lgetxattr` e `getuid` da libc existente.
Não compila C, segue symlinks, lê payloads dos arquivos ou modifica atributos
das imagens. O self-check cria apenas seu próprio arquivo e link no tmpfs,
conferindo um atributo binário e a leitura sem seguir o link.

A lista de caminhos vem dos headers físicos do archive selado, pelo
`readRootfsPathInventory` do [auditor Node](../scripts/rootfs-archive-audit.mjs).
Não se normalizam nomes Unicode. Mounts do runtime (`dev`, `proc`, `sys`,
hostname/hosts/resolv.conf) são excluídos explicitamente; a raiz é incluída.
A leitura usa rootfs readonly, nenhuma capability, `no-new-privileges`,
nenhuma rede e saídas exclusivas no tmpfs. O relatório guarda hashes dos
valores, nunca os valores dos atributos.

Sem `CAP_DAC_OVERRIDE`, UID 0 não consegue atravessar `/home/ubuntu`, pertencente
ao UID 1000. A cobertura foi dividida entre esses dois usuários internos às
imagens, mantendo capabilities zeradas e conferindo a identidade efetiva.
Isso não usa identidades ou credenciais Google. O collector verifica também
o ID da imagem realmente usado pelo container, não apenas o ID solicitado.

| Arquitetura |  UID | Caminhos por filesystem | Atributos visíveis | Lacunas de listagem |
| ----------- | ---: | ----------------------: | -----------------: | ------------------: |
| ARM64       |    0 |                   5.811 |                  0 |                   5 |
| ARM64       | 1000 |                       4 |                  0 |                   0 |
| x86_64      |    0 |                   5.820 |                  0 |                   5 |
| x86_64      | 1000 |                       4 |                  0 |                   0 |

Cada linha foi comparada entre a base original com fontes e a base corrigida.
Listas, identidade, hashes de metadata e lacunas coincidiram. Os oito
self-checks (origem/destino, duas arquiteturas, dois UIDs) passaram.

**Não foi provada ausência de todos os atributos.** Em cada filesystem,
`llistxattr` consultou 44 bytes na raiz, 46 em `etc`, `etc/ssl` e
`etc/ssl/certs`, e 23 em `etc/ssl/certs/orbstack-root.crt`, mas retornou zero
bytes na leitura. Isso foi registrado como lacuna, não omitido ou contado
como prova de ausência. Namespace `trusted` e a causa dessas diferenças
continuam não verificados; atribuí-las a overlay/OrbStack é hipótese.
Nenhuma capability adicional foi concedida para obter um resultado verde.

O probe impõe limites de caminhos, atributos, bytes e relatório; relê nomes
e valores, falha com código sanitizado e não aprova segurança. Os testes
incluem orçamento para atributos vazios: eles também consomem espaço no
relatório. São 11 testes Java e uma regressão adicional do inventário Node.

## Imagens novas e proveniência

Os archives corrigidos foram importados em novas bases locais. As versões e
o inventário dos 121 pacotes autorizados, os hashes do JRE Ubuntu e as fontes
permaneceram iguais aos originais. O filtro não instala/remove pacotes.
As capturas históricas de listagem/mtree são evidência distinta da comparação
física obrigatória, que confere os nomes reais e os bytes retidos.

| Alvo   | ID da nova base                                                           | SHA-256 do recibo da base                                          |
| ------ | ------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| ARM64  | `sha256:d0987e9cea42b103ec2b72389271e9fe080ed5ac19832c6829045a53c65a9977` | `19521dcf922f25dc7385449ff95ef2a117c3cf96fa4c9d371c7511203180104b` |
| x86_64 | `sha256:0c80aaa36e50cf591d1f4ba0be36bc5044ea984e356a0e207976679511e145eb` | `a2aa6b3cb389d81cb75b35f62dce7f62efdb4eeeed3c7c282fd37988a53ab9b6` |

Os workers usam o JAR já construído, SHA-256
`6c6a8703aad2f52839790b7a95852544cc75a3328e2709bc4032dfcd63eee29e`,
e os mesmos pacotes nativos selados. Não se reconstruiu nem alterou runtime
Java do artefato de produção para essa investigação.

Conferência posterior somente de leitura do JAR: 179 arquivos Java de
produção correspondem às 316 classes empacotadas (incluindo internas), sem
classe top-level órfã. Os 19 recursos de produção estão presentes, sem recurso
extra; seus bytes compilados coincidem com os fontes. O harness nativo compara
também cada classe/recurso compilado com os bytes no JAR antes de iniciar a
infraestrutura. A inspeção não recompila Java nem prova equivalência semântica
fonte/bytecode por si só; o snapshot dos fontes permanece o da execução Maven
global já aprovada. Não há classes exclusivas dos probes nesse JAR.
SHA-256 do recibo privado da conferência:
`87cd97bd34a62aceb8c8c58d94998a1907489cb5f09f37d073700857143df15f`.

| Alvo   | ID do novo worker                                                         | Bytes da imagem local |
| ------ | ------------------------------------------------------------------------- | --------------------: |
| ARM64  | `sha256:887e1a818a97ac75b98500392631a55b72d1054f0babf3ea766275d6a49fe885` |           351.215.279 |
| x86_64 | `sha256:0a8a27a67cb05333c1c2de7e2f4e8ebc066d2b505cd6075b8ab80bd9add4ef15` |           352.823.408 |

Builds usam somente cache local, `--pull=false` e `--network=none`.
Ambos passaram no preflight `admitted-not-operational` e no probe readonly
UID 1000: versão Ubuntu `25.0.4.1+1-1-24.04.4-Ubuntu`, JRE duplicado ausente,
nomes de certificados preservados e defaults desabilitados. Isso não prova
TLS, memória operacional ou qualidade de renderização.

### Certificado com nome Unicode: checagem direta posterior

Um diagnóstico privado Java, separado do probe de atributos e do JAR, leu
somente o certificado público afetado e o truststore da imagem. Nas quatro
execuções (origem e base corrigida, duas arquiteturas), os links `.pem` e
`988a38cb.0` resolveram para o nome composto correto, o X.509 foi interpretado,
sua autoassinatura foi verificada e exatamente uma entrada correspondente
foi encontrada no truststore Ubuntu usado pelo Java.

O SHA-256 DER do certificado é
`6c61dac3a2def031506be036d2a6fe401994fbd13df9c8d466599274c446ec98`;
o SHA-256 do PEM original é
`40f60f2e2f83fb6c63ddefeba7939a7852b2d468183ea939cc4dcac8fe4cc87d`.
Ambos coincidiram nas quatro execuções. Os bytes do truststore coincidiram
entre cada origem/destino; são distintos entre arquiteturas e não se exigiu
igualdade de um store ARM64 com um x86_64.

Containers readonly, UID 1000, capabilities zeradas, `no-new-privileges`,
rede desligada, 256 MiB e heap 64 MiB; somente `java.base`, sem Spring ou SDK.
Não foi utilizada senha: a leitura com senha nula inspeciona certificados
públicos, **não verifica a integridade MAC do keystore**. Não testa conexão
TLS, validade da cadeia de um serviço, datas de validade ou atributos ocultos.
O resultado não aprova segurança geral.

SHA-256 do fonte diagnóstico privado:
`ac23d937fc4e396e5011fa841afb982160de1ea889c59a436f30f166c8e8bdee`;
SHA-256 do relatório comparativo:
`a8ea0ea7dfd56181423dada50fd45bea4c86852135f7a55845173e2b9eed5e17`.
O diagnóstico não integra o artefato publicado nem o checksum técnico do gateway.

## Falhas preservadas

- A coleta inicial tentou recuperar tmpfs após o container terminar; o
  transporte foi corrigido para capturar o relatório antes da saída.
- Leitura menor que o tamanho consultado foi inicialmente rejeitada. Agora
  fica explícita como lacuna, sem aprovação de segurança.
- O collector `h` usou o destino no self-check, mas a origem na coleta. Seus
  scans estão em quarentena e não sustentam comparação. O collector `i`
  corrigiu ambas as chamadas e validou Image/User efetivos.
- O primeiro build x86_64 falhou com `lease does not exist` no containerd.
  Uma repetição limitada, com os mesmos inputs, passou. Foi removido somente
  o container intermediário parado criado por esse build; nenhum prune,
  restart do daemon ou remoção de imagens anteriores ocorreu.

Logs, erros e artefatos históricos permanecem privados e preservados.

## Scan das imagens corrigidas

Trivy 0.75.0 já instalado, executado offline com os bancos locais verificados
por hash da [parcela anterior](ubuntu-java25-fonts-2026-10-11.md#repetição-com-dados-correntes).
DB OS válida até 2026-10-12T13:06Z e índice Java até 2026-10-13T00:59Z;
sem download, atualização, telemetry, filtros de severidade, VEX ou ignore de
findings. A configuração do scanner e o ignorefile desta análise estão vazios.
As execuções não receberam ambiente de credenciais nem acesso ao Docker.

Os exports foram obtidos somente das duas imagens locais identificadas acima.
Antes de aceitar os scans, conferiram-se arquitetura, configuração, sete
camadas, hash de cada blob comprimido e diff ID de cada camada descomprimida,
incluindo a base corrigida. O config hash exportado é distinto do ID Docker;
o vínculo de `Metadata.ImageID` do scan foi verificado explicitamente.

| Alvo   | SHA-256 do export                                                  | SHA-256 do scan JSON                                               |
| ------ | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| ARM64  | `38201fc507a51f5317cd1fc2b51ed8406deb676eea5aeaf61bd4748dc72754d4` | `e716f2581ec924ce235de53235cce726bfaac28b7218cb57ecb119d44d1fe1a4` |
| x86_64 | `58814c48080fe81989c2c1c6c65b3e156862979eca225b2deeec88770ddda1c2` | `66d734f6d8438ece7b2c506533374761952a0634abb90033e1245ada1edf5702` |

Em cada alvo: 121 pacotes OS, 18 ocorrências (13 MEDIUM/cinco LOW), zero
ocorrências nas 195 dependências Java identificadas. O conjunto de
CVE/pacote/versão instalada/fix/severidade coincide com a fotografia anterior,
mas estes são scans novos dos exports corrigidos, não reaproveitamento de
aprovação. O JRE e o codec manual não são integralmente cobertos pelo scanner;
zero ocorrências Java não significa ausência geral de vulnerabilidades.
**Segurança continua não aprovada.** Nenhum finding foi suprimido.

## Gates e pendências desta parcela

- Node: 140 aprovados, um skip opt-in, zero falhas.
- Maven global offline com Docker: sete módulos `SUCCESS`, 2.752 testes,
  zero falhas/erros, 103 skips opt-in, 3min32s.
  Reexecução após preservar a matriz terminal: mesmos totais e sete módulos
  `SUCCESS`, 2min51s. Os 103 skips da execução global não substituem os
  40 testes nativos selecionados e aprovados separadamente.
- Type-check web e `pnpm check` mobile integral passaram; 116 suítes/892
  testes mobile, incluindo SDD, links, FSD e formatação; sem reinstalação.
  Ambos passaram novamente após o fechamento da matriz, assim como os
  140 testes Node (um skip opt-in). Advertências React `act` existentes
  permanecem advertências, não aprovação de performance no dispositivo.
- Diff do gateway aprovado. Diff global ainda aponta o baseline externo de
  EOF em `web/landing-page/src/shared/component/PlatformBadge.tsx:44`.
- A matriz nativa completa terminou nas imagens novas com PostgreSQL 17
  isolado, providers oficiais em loopback falso e ONNX local real: 40 testes,
  zero falhas/erros/skips, `BUILD SUCCESS`, 26min55s. Esta é uma execução nova,
  não transferência da aprovação histórica das imagens anteriores.

Comando desta rodada: Maven offline pelo reactor, com seleção exclusiva de
`NativeRenderingWorkerImageLinuxTest`, `renderer.native.image.enabled=true`,
runtime `ubuntu` e os dois IDs novos acima. As propriedades de hash de codec,
diretório do decoder independente e modelo local são explícitas; o harness
rejeita JAR desatualizado e não adquire dependências/imagens automaticamente.
Durante uma rodada ativa, não abrir outras execuções Maven: os relatórios
Surefire são compartilhados. Esta rodada está terminal; XML, log, invocação e
resultado foram preservados separadamente antes de outra execução.

### Cobertura terminal e limites

O coletor exigiu exit zero, término do Maven, XML com exatamente 40 testes
sem skips/falhas/erros, pins das duas imagens na invocação e no XML, 38
diagnósticos únicos e dois controles HTTP. Cada arquitetura tem 19
diagnósticos: SDK, SDK+layout, JPEG/WebP, quatro dimensões extremas,
memória/disco/timeout/cancelamento e sete destinos pintados. Não aceita um
XML antigo ainda presente enquanto a nova execução está incompleta.

| Alvo           | Estados observados nos diagnósticos       | Pico de memória do cgroup |
| -------------- | ----------------------------------------- | ------------------------: |
| ARM64          | 32 READY, 3 FAILED injetados, 1 CANCELLED |       2.553.774.080 bytes |
| x86_64 emulado | 32 READY, 3 FAILED injetados, 1 CANCELLED |       2.809.131.008 bytes |

Falhas injetadas e cancelamento são os resultados esperados, seguidos pela
recuperação prevista; não foram escondidos como READY. Os testes conferem
integridade, reentrega, posse/limpeza, ausência de uma segunda chamada de
provider e defaults. Os dois startups HTTP de produção conferem health 200,
rota pública 403 e OCR desabilitado 503, sem portas publicadas.

SHA-256 XML terminal:
`f83e1f3d647771dffc50e819ee4d75372ec9706f64c9a9b5a8c73f7c5e151811`;
log:
`ac18a6251c4859a8938fae64f1786b97ecda66b15279538ac40447522b4353a8`;
relatório comparativo sanitizado:
`e178eda561022924336467e061c25ff1e3b9e972e359365db6e0cd36ab24a1dd`.

As imagens de teste continuam com teto de 8 GiB e uma CPU. Os picos observados
não são prova de um limite universal, contenção atômica, sobrevivência a OOM
agregado ou Cloud Run. O baseline cloud de 1 GiB continua não admitido;
não se redimensionou mídia, reduziu qualidade ou ampliou configuração cloud.
OCR/tradução são sintéticos; layout usa inferência local real em fixtures
sintéticas. Não houve chamada real de OCR/tradução, nova imagem licenciada
ou revisão visual/linguística independente.

Snapshot técnico: **412 arquivos**, SHA-256
`999c0f57544587822e7266cf1bb95115eba8a58f0bc015794450a0d7e460756a`.
Escopo: `src/`, `scripts/`, `openapi/`, `pom.xml` e `.tf`/`.tfvars.example`
diretos de `infra/terraform/`; caminhos relativos ordenados + NUL + bytes
completos + NUL. Documentos e artefatos privados não entram nesse checksum.
Snapshots anteriores permanecem históricos; o checksum mobile não cobre Java.

Segurança residual, atributos não verificados, orçamento de memória
operacional e revisão de qualidade continuam abertos. Nenhuma promoção da
020, abertura da 021, troca do runtime padrão ou ativação foi feita.
