# Segurança residual do runtime — 2026-10-11

Continuação da [atualização limitada da base](native-base-update-2026-10-11.md).
Esta parcela contém somente consultas públicas e diagnósticos locais. Nenhum
pacote adicional foi instalado, nenhuma imagem antiga foi modificada e não houve
ADC, chamada de provider, imagem real, push ou deploy. Defaults continuam
desabilitados; a MOB-FEAT-020 permanece `in-progress` e a 021 bloqueada.

Resolução posterior: Ruan autorizou o candidato e as nove dependências.
A [preparação local](ubuntu-java25-preparation-2026-10-11.md) concluiu exatamente
dez adições em cada arquitetura, preservando Temurin/defaults. Bootstrap de
fontes falhou e HarfBuzz adicional exige outra aprovação. As seções abaixo
preservam a triagem anterior à instalação, não aprovam a candidata posterior.

## Findings Ubuntu: fotografia, não aprovação

O scan offline preservado das novas imagens contém 16 ocorrências em 11 pacotes,
correspondentes a dez CVEs: 12 ocorrências MEDIUM e quatro LOW. As duas arquiteturas
têm o mesmo conjunto. A contagem vem da DB identificada na evidência anterior;
não foi executado um scan novo nem atualizada a DB nesta parcela.

As páginas do fornecedor consultadas em 2026-10-11 ainda classificam Noble como
vulnerável, algumas com correção adiada. `FixedVersion` ausente no scan não prova
que nunca haverá correção. As condições abaixo orientam investigação, não
constituem VEX, waiver ou autorização para suprimir findings.

| Finding e fonte primária                                     | Pacotes / ocorrências        | Condição a investigar                                                                                            | Situação Noble consultada    |
| ------------------------------------------------------------ | ---------------------------- | ---------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| [CVE-2026-18374](https://ubuntu.com/security/CVE-2026-18374) | libc-bin, libc6, locales / 3 | Modo `fopen` controlado pelo atacante com `,ccs=` vazio; nome de arquivo não é equivalente ao argumento de modo. | Vulnerável.                  |
| [CVE-2026-89092](https://ubuntu.com/security/CVE-2026-89092) | libc-bin, libc6, locales / 3 | Resposta DNS excessiva processada por `nscd` habilitado.                                                         | Vulnerável.                  |
| [CVE-2025-66382](https://ubuntu.com/security/CVE-2025-66382) | libexpat1 / 1                | XML especialmente construído causando consumo excessivo de CPU.                                                  | Vulnerável; correção adiada. |
| [CVE-2026-86145](https://ubuntu.com/security/CVE-2026-86145) | libpcre2-8-0 / 1             | Recursão DFA, expressão controlada pelo atacante e workspace/heap insuficiente.                                  | Vulnerável.                  |
| [CVE-2026-89161](https://ubuntu.com/security/CVE-2026-89161) | libpcre2-8-0 / 1             | Caminho JIT do PCRE2 e liberação incorreta de memória do subject/contexto.                                       | Vulnerável.                  |
| [CVE-2026-40228](https://ubuntu.com/security/CVE-2026-40228) | libsystemd0, libudev1 / 2    | `journald`, encaminhamento `ForwardToWall` e sequências de terminal.                                             | Vulnerável; correção adiada. |
| [CVE-2024-56433](https://ubuntu.com/security/CVE-2024-56433) | login, passwd / 2            | Sobreposição de faixas de IDs subordinados em configuração apropriada ao ataque.                                 | Vulnerável; correção adiada. |
| [CVE-2026-18477](https://ubuntu.com/security/CVE-2026-18477) | tar / 1                      | Restore incremental com `dumpdir` e corrida de filesystem.                                                       | Vulnerável.                  |
| [CVE-2026-18508](https://ubuntu.com/security/CVE-2026-18508) | tar / 1                      | Extração `--one-top-level`, hardlink e symlink preexistente.                                                     | Vulnerável.                  |
| [CVE-2026-85091](https://ubuntu.com/security/CVE-2026-85091) | zlib1g / 1                   | Escrita `gz*` não bloqueante e buffer antigo reutilizado.                                                        | Vulnerável; correção adiada. |

No controle x86_64 local, `nscd` está `not-installed`; não existem os executáveis
verificados de `journald`, `systemd`, `newuidmap` ou `newgidmap`. Isso restringe
precondições nesse controle, mas não remove bibliotecas instaladas nem demonstra
ausência de caminhos equivalentes em outro ambiente. Busca no Java próprio não
encontrou chamadas explícitas às APIs nativas citadas; os subprocessos encontrados
são o launcher Java e o codec fixos. Não é auditoria exaustiva de SDKs/binários.

## Observação dinâmica restrita: fontes e PNG sintéticos

Um probe Java temporário, exclusivo do diagnóstico, carregou as fontes pinadas
do JAR com `BundledRenderingFonts`, desenhou sete textos sintéticos conhecidos e
codificou/decodificou um PNG de 320 × 80 em memória. Não iniciou Spring, worker,
SDK, codec ou ONNX e não recebeu páginas reais. Cache ImageIO em disco desligado.

O parser de `/proc/self/maps` teve teste vermelho antes da implementação e depois
passou nos controles de allowlist, deduplicação, imutabilidade e rejeição de
traversal, espaços, arquivos removidos e paths privados desconhecidos. Leitura
limitada a 1 MiB; hashes de bibliotecas limitadas a 128 MiB. Saída contém somente
origem, basename e hash, nunca endereços de memória ou paths pessoais.

Os containers usaram rede desligada, filesystem readonly, usuário da imagem,
capabilities removidas, `no-new-privileges`, memória 512 MiB e heap 256 MiB. Nas
duas arquiteturas, exit code zero: 17 bibliotecas observadas, 11 do JRE e seis OS,
sem localização desconhecida. **O FreeType usado foi o embarcado no JRE**, não o
pacote Ubuntu corrigido. Seu hash coincide com o inventário anterior.

| Evidência privada preservada | SHA-256                                                            |
| ---------------------------- | ------------------------------------------------------------------ |
| Probe Java                   | `e99e833604f05411053b3f69d3470b70391ef5973428fe504740d5d1fb1789d6` |
| Testes do parser             | `65527fc2c99395f6eabae45a82a0be187a081103707789cb3ce1efa07235b063` |
| Observação x86_64            | `e34affc8255c814e9b8bbe1d5bd867ab1667199650e3598bf69fdd7cd1de2c79` |
| Observação ARM64             | `b6d42b60d8c35a12f4e2a7ff8474a746d8748b4a57892b89289e736cd08aee93` |

As seis bibliotecas OS são libc, libm, libdl, libpthread, librt e loader. Não foram
observados libpng/FreeType do sistema, expat, PCRE2 ou systemd nesse pequeno
exercício. **Não extrapolar ausência observada para o pipeline completo.**
O probe não explora CVEs nem certifica equivalência fonte/binário ou segurança.

Para repetir, compilar os dois fontes temporários com o JDK 25 já instalado;
invocar `RuntimeLibrariesProbeChecks` e `RuntimeLibrariesProbe --inspect` pelo
`PropertiesLauncher` no container, usando o JAR preservado, classes readonly e
`loader.path` explícito. O launcher não recebe configuração externa. Nenhuma
task ou teste comum instala, baixa ou executa esse diagnóstico automaticamente.

## Candidato separado: OpenJDK 25 do Ubuntu

O [pacote oficial](https://packages.ubuntu.com/source/noble-updates/openjdk-25)
publica `25.0.4.1+1-1~24.04.4`. Foram lidos somente metadados públicos do source,
não um novo runtime. SHA-256 do `.dsc`:
`d69581aeaa6c0bb49cdfc853c73a2d46155c5f9373278c457664bbfe56db12c5`.
O arquivo contém assinatura, mas **essa assinatura do source não foi verificada**.
O arquivo de packaging, 385.976 bytes, corresponde ao hash anunciado no `.dsc`:
`1bcd117fd9b1637db848279adb1885dbd31a2bc77cc8c32dd88e95104e71192e`.
Isso registra integridade entre metadados obtidos por HTTPS, não substitui
autenticação APT/GPG numa instalação futura.

Leitura estática de `debian/rules` identifica `--with-libpng=system`,
`--with-zlib=system`, `--with-libjpeg=system` e outras bibliotecas do sistema.
As regras não foram executadas. Não foi confirmado ainda como o binário resolve
FreeType; dependências de build não provam vínculo ou uso no binário instalado.
Esse runtime é **candidato de investigação**, não correção aprovada.

Simulações APT nas duas novas bases, sem rede e sem escrita persistente:

```text
apt-get --simulate --no-install-recommends --no-remove install openjdk-25-jre-headless=25.0.4.1+1-1~24.04.4
```

Ambas terminaram com exit code zero: **dez novas instalações, zero upgrades e
zero remoções**. Recomendados/sugeridos não entram na instalação simulada.

| Pacote novo simulado    | Versão                 |
| ----------------------- | ---------------------- |
| openjdk-25-jre-headless | `25.0.4.1+1-1~24.04.4` |
| ca-certificates-java    | `20240118`             |
| java-common             | `0.75+exp1`            |
| libsqlite3-0            | `3.45.1-1ubuntu2.8`    |
| libjpeg-turbo8          | `2.1.5-2ubuntu2`       |
| libjpeg8                | `8c-2ubuntu11`         |
| liblcms2-2              | `2.14-2ubuntu0.1`      |
| libnspr4                | `2:4.35-1.1build1`     |
| libnss3                 | `2:3.98-1ubuntu0.2`    |
| libpcsclite1            | `2.0.3-1build1`        |

A autorização anterior cobre somente os dois patches Ubuntu, **não esses dez
pacotes**. É necessária aprovação específica antes de preparar o candidato.
Não usar o preparador dos dois patches para contornar sua allowlist. Se aprovado,
usar outra imagem diagnóstica, verificar resolução/assinaturas/hashes e inventário,
inspecionar bibliotecas efetivas e depois comparar renderização e segurança.
Qualquer pacote adicional ou remoção requer nova decisão. Manter Temurin ao lado
do candidato não produz automaticamente uma imagem mínima ou livre de findings;
nenhum default, pin operacional ou runtime de produção será trocado nesta parcela.

## Rastreabilidade, falhas e decisão

Recibo derivado dos artefatos privados preservados, sem conteúdo de usuário:
`be7daa955712b5dad735675ffb5d1426ec321a31764236958a86287a69ef418c`.
Inclui os HTMLs das dez fontes, hashes dos probes, observações e metadados.
A primeira consulta pública da CVE-2026-18374 falhou; retry separado teve sucesso,
preservando o recibo inicial. Uma consulta `dpkg-query` por shell falhou por
substituição inválida; foi corrigida para argv direto, sem mudança no container.
Uma saída intermediária da simulação ARM64 não ficou recuperável; foi repetida
somente a simulação readonly e o exit code final zero foi conferido.

Revalidação técnica local: os mesmos 400 arquivos, checksum
`40c140568670d3ac826a40e485bf533d1f95a10da32c528cc4e76f44aea149b6`.
O escopo/algoritmo continua o da evidência anterior. Probe temporário, docs e
artefatos privados não entram nesse checksum. Os resultados da matriz nativa e
Maven anteriores não são uma execução nova nem aprovação de outro runtime.

Validação desta parcela documental: parser sintético aprovado; 86 links relativos
dos três documentos conferidos; Prettier direcionado e `git diff --check` do
escopo passaram. O diff global continua falhando na linha em branco adicional
externa de `web/landing-page/src/shared/component/PlatformBadge.tsx:44`, preservada.
`pnpm specs:check` também passou: 24 testes, validação das specs e links mobile.
Sem alteração de fonte/configuração mobile, não foi renovado seu checksum SDD.

**Decisão:** nenhum finding suprimido; segurança e admissão operacional abertas.
O candidato exige nova aprovação de instalação e verificação própria. Memória,
cloud e qualidade humana continuam gates independentes. Não instalar bibliotecas
por substituição manual de `.so` nem declarar aprovação com base apenas no scan.
