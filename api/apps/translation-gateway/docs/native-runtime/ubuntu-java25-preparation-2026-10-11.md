# Java 25 Ubuntu — preparação local, 2026-10-11

Fotografia anterior à autorização dos três pacotes de fontes. A continuação
está no [registro de fontes e worker Ubuntu](ubuntu-java25-fonts-2026-10-11.md);
as falhas/resultados abaixo permanecem históricos.

Execução após autorização de Ruan para instalar o candidato e suas nove
dependências somente em **novas imagens Docker locais**. Nenhuma instalação no
macOS, alteração de imagem antiga/default de produção, credencial, provider,
imagem real, publicação ou deploy. A 020 permanece `in-progress`, a 021 bloqueada.

## Entrega e limite

Dois candidatos preparados com `openjdk-25-jre-headless`
`25.0.4.1+1-1~24.04.4` e as mesmas nove dependências da
[triagem anterior](native-residual-security-2026-10-11.md#candidato-separado-openjdk-25-do-ubuntu).
Inventário completo de 108 para 118 pacotes em cada arquitetura: **dez adições,
zero upgrades e zero remoções**. Arquivos Temurin anteriores têm hashes idênticos;
sua cópia não foi removida ou corrigida.

| Alvo           | Base anterior preservada                                                  | Nova candidata local                                                      | SHA-256 do recibo de instalação                                    |
| -------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| ARM64          | `sha256:b28e3ece85f8cf9aea505c878ee1cbb89789abb28a7bbb29e3675462f853af55` | `sha256:5e272352e4b2aa1762b08b2a1c65e42731995595a46df5f778cb7b2c495ef70f` | `4711fb603a15c3f3b4fcebbad0f90f55ec7d19219bb8c6b1b1b15dfb92a32762` |
| x86_64 emulado | `sha256:6ea68fc01f01400ee64252f9e316f92496e996881f240392d4f9392c427c2380` | `sha256:0a5b895826541767083894989d03bb489489457ced2774c4f766d56b4b4164bf` | `f336e23b36f616dbe766e1fa0bae0a03d64197f78e341c481da0f549824de85e` |

São bases diagnósticas, não imagens worker admitidas. Env, user, working directory,
entrypoint e cmd preservados. `command -v java` continua resolvendo
`/opt/java/openjdk/bin/java`; o Ubuntu é selecionado explicitamente por
`/usr/lib/jvm/java-25-openjdk-<arch>/bin/java`. Esse executável confirmou Ubuntu
`25.0.4.1+1-1-24.04.4-Ubuntu`; seu `release` tem `SOURCE` vazio, sem revisão
upstream do binário presumida.

SHA-256 do `.deb` JRE ARM64:
`eb589488ad510795bde0c30b10e0468bd63c59c7febf99372334e32c9894f296`;
x86_64: `69ea4a11058674dcaf9953bcee61e6a39ae3715b304c58767f92e84753343ce8`.
Recibos privados registram versão, arquitetura, bytes, filename e SHA-256 de
todos os dez `.deb`, não apenas do JRE.

## Autenticação, exclusividade e falhas preservadas

Preparador JavaScript privado com quatro testes puros aprovados: plano exato,
arquiteturas `all`/alvo, cache exclusivo, inventário sem mudanças preexistentes,
controle `.deb`, hashes/bytes/paths. Não modifica o preparador dos dois patches
nem relaxa sua allowlist. Nenhum download em task/teste comum.

- Config Docker isolada sem credenciais/helper/proxy/context remoto; daemon local.
- Bases já presentes por ID, `--pull=never`, containers temporários próprios.
- APT recusa fontes fracas/inseguras, downgrade e pacote não autenticado.
- Update sem retries; quatro `InRelease` por alvo verificados por `gpgv`, com
  `VALIDSIG` Ubuntu `F6ECB3762474EDA9D21B7022871920D1991BC93C`.
- Simulação exige dez novas instalações pinadas, sem extra/upgrade/remoção.
- Download-only e hashes/controles comparados aos metadados APT autenticados.
  Rede desconectada antes da instalação `--no-download --no-remove`.
- Inventário, hashes Temurin e configuração das novas imagens conferidos;
  containers de preparação removidos depois dos recibos, imagens preservadas.

As duas tentativas iniciais falharam **antes de instalar**: o cache herdado
continha dois `.deb` dos patches anteriores e dez novos downloads; o guard
recusou 12 arquivos. Não havia resolução de 12 novas instalações. Usou-se novo
cache exclusivo e destinos separados, sem apagar ou admitir arquivos extras;
logs/failures iniciais permanecem preservados.

## Vínculos nativos e bootstrap de fontes

`ldd` somente em binários oficiais verificados, containers readonly sem rede.
A primeira inspeção herdou `LD_LIBRARY_PATH` Temurin e resolveu sua `libjvm`;
isso não comprova o vínculo efetivo de um processo Ubuntu. Repetição explícita
com caminhos `lib` e `lib/server` do Ubuntu resolveu a `libjvm` Ubuntu, sem
alterar a imagem. Nos dois alvos:

- `libfontmanager.so` referencia FreeType do sistema e libpng transitivamente,
  nos pacotes Ubuntu corrigidos anteriormente. É dependência estática, não
  renderização bem-sucedida; nenhuma substituição manual de `.so`.
- `libzip.so` referencia zlib do sistema, cujo finding continua aberto.
- **`libharfbuzz.so.0 => not found`**; nenhuma biblioteca extra foi instalada.
- `libsplashscreen.so` não existe no pacote headless. A inspeção inicial terminou
  exit 1; isso não exige instalar o pacote desktop completo para renderizar.

Probe Java temporário montou o JAR preservado readonly, chamou
`BundledRenderingFonts` real como UID 1000 e usou o executável Ubuntu explícito.
Root readonly, rede none, capabilities removidas, heap 256 MiB/cgroup 512 MiB,
tmpfs limitado. Nenhum Spring/worker, ADC, provider ou mídia real.
**Ambos falharam: exit 2 / `font-bootstrap-unavailable`**, sem exceção bruta.
O JDK também emitiu mensagem fixa recomendando pacotes do runtime headless.
Classificador testado antes da implementação com dados sintéticos.

O erro sanitizado não prova que HarfBuzz seja a única causa possível. A ausência
estática está confirmada; bootstrap/pipeline precisam de novas provas após a
preparação adicional. Não atribuir ao Ubuntu os 40 controles/gates Maven que
passaram com Temurin.

## Scan: comparação histórica, não aprovação atual

Trivy 0.75.0 existente, offline, ignorefile vazio; nenhuma atualização de DB ou
instalação. Cada export da base mostrou 118 pacotes Ubuntu, **16 ocorrências**:
12 MEDIUM e quatro LOW, os mesmos findings residuais anteriores. Bases sem JAR:
zero arquivos language-specific não equivale a zero vulnerabilidades Java/JRE.
Temurin e suas cópias nativas continuam presentes.

DB OS atualizada `2026-10-10T12:33:35Z`; próximo update `2026-10-11T12:33:35Z`,
**já vencido nestes scans** (15:18–15:19 UTC). Fotografia serve somente à
comparação, não à aprovação corrente ou garantia de ausência de novos findings.
Sem supressão; datas da análise anterior não foram renovadas.

JSON ARM64: `fbb7f16016936be6ab64014d4cc63ffc58334d35ff246dac4504a4fbd126a109`;
x86_64: `c92e0ffb9244904d5d554e64735b0bd28928c15c93747de1ae563ea3e1d5a4d8`.

## Instalação adicional proposta, não executada

O [HarfBuzz oficial](https://packages.ubuntu.com/noble/libharfbuzz0b) fornece
shaping OpenType. Simulações APT readonly sem rede resolveram, nas duas bases:

| Pacote novo exigido | Versão simulada           |
| ------------------- | ------------------------- |
| `libharfbuzz0b`     | `8.3.0-2build2`           |
| `libglib2.0-0t64`   | `2.80.0-6ubuntu3.9`       |
| `libgraphite2-3`    | `1.3.14-2ubuntu0.24.04.1` |

**Três adições, zero upgrades/remoções.** Nenhum dos três foi instalado ou
baixado. Requer aprovação específica. O plano APT assinado usa GLib t64 nos
dois alvos; não substituir pela variante inexistente que o site possa mostrar.

Uma captura intermediária x86_64 foi reconstruída de partes do console; não é
log bruto. Foi preservada, mas nova captura readonly integral, exit zero, é
autoritativa: `9fbbbb53f0db4f08920e38d591b4422330e0eb103229cbbe8606b44a6b7a58aa`.

## Rastreabilidade e decisão

Recibo dos fontes temporários, observações, scans e resumo:
`f287df510aa4c633f2c712f5f87b0b5095763d5eacfeefdb06bb514127b49637`.
Resumo de pacotes/findings:
`122c001a119e11f99a7bcb46ac2a7a68209eb695cd0ce77733941ae313bd5be6`.
Font bootstrap probe:
`bc6d7785a99b7f9f1cf607342e4cc30c96df6d607b8c93023e7e991ff770cf98`.
Hashes das bibliotecas oficiais preservados separadamente dos hashes dos `.deb`.
Nenhum conteúdo OCR, jobRef ou credencial nos registros.

**Entrega parcial:** instalação autorizada concluída; runtime para renderização
não admitido porque bootstrap de fontes falhou. Nada habilitado; status/gates
preservados. A aprovação recebida não permite os três pacotes adicionais ou
trocar o default. Depois de autorizados, conferir hashes/vínculos/scan e repetir
fontes e testes do pipeline. Nenhuma melhoria de qualidade ou memória presumida.

Validação documental: quatro testes do preparador e checks do classificador
aprovados; 85 links relativos, Prettier direcionado e diff do gateway passaram.
`pnpm specs:check`: 24 testes, validação SDD e links mobile aprovados. Diff global
mantém a falha externa em `PlatformBadge.tsx:44`, sem correção automática.
Fonte/teste/configuração gateway permanece em 400 arquivos, checksum
`40c140568670d3ac826a40e485bf533d1f95a10da32c528cc4e76f44aea149b6`;
JAR preservado `6c6a8703aad2f52839790b7a95852544cc75a3328e2709bc4032dfcd63eee29e`.
Probes/preparador privados e documentos não entram nesse checksum. Nenhuma
mudança mobile ou renovação do seu checksum; sem reexecução dos gates globais
históricos, que não validam o candidato cujo bootstrap de fontes falhou.
