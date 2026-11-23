# Java Ubuntu e fontes — validação local, 2026-10-11

Fotografia da candidata com dois JREs. A evolução posterior, sem nova instalação,
está no [experimento de distribuição com um JRE](single-jre-runtime-2026-10-11.md).
Resultados abaixo continuam vinculados às imagens originais desta parcela.

Continuação da [preparação Java Ubuntu](ubuntu-java25-preparation-2026-10-11.md),
após autorização específica de Ruan para **três pacotes adicionais em novas
imagens Docker locais**. Não houve instalação no macOS, alteração das imagens
antigas, deploy, credenciais, mídia real ou chamadas pagas. Defaults e Terraform
permanecem inalterados; 020 `in-progress/open`, 021 `approved/blocked`.

## Instalação e proveniência

| Pacote adicional  | Versão exata              |
| ----------------- | ------------------------- |
| `libharfbuzz0b`   | `8.3.0-2build2`           |
| `libglib2.0-0t64` | `2.80.0-6ubuntu3.9`       |
| `libgraphite2-3`  | `1.3.14-2ubuntu0.24.04.1` |

Cada arquitetura passou de 118 para 121 pacotes: **três adições, nenhum upgrade
ou remoção**. O preparador JavaScript privado mantém allowlist/versionamento
exatos, simulação sem recomendações, cache exclusivo, controles dos `.deb`,
bytes/hashes e assinatura APT `gpgv` verificadas. Rede desconectada antes da
instalação `--no-download --no-remove`. Não modifica o preparador público dos
dois patches nem relaxa a prova aceita por `render-native-image.mjs`.

Os hashes de todos os arquivos dos JREs Temurin e Ubuntu permaneceram iguais.
As bases anteriores e seus relatórios foram preservados. Os 25 arquivos
referenciados em cada recibo foram revalidados localmente por SHA-256.

| Alvo           | Base com fontes, local                                                    | SHA-256 do recibo de instalação                                    |
| -------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| ARM64          | `sha256:6dcfc270d76a73891193ca389773180e363e72f1b4f97ecadc84083336a56363` | `352306ad9c74568b551b6a93c66f2d57cc1e5aa8ff7fdde2f8de9349efe75076` |
| x86_64 emulado | `sha256:9d15008ebe9ed7a3bab1155f609bd054f1a7317f8611bc5317040bad45f92101` | `fc44c51cd264da45599e7087fca3ec881ae94232c8f187b4f466e23558a68de2` |

## Bootstrap e candidatas worker separadas

Repetiu-se exatamente o probe de fontes anterior, fonte SHA-256
`bc6d7785a99b7f9f1cf607342e4cc30c96df6d607b8c93023e7e991ff770cf98`,
com `BundledRenderingFonts` real, JAR readonly, UID 1000, sem rede, cgroup de
512 MiB, heap 256 MiB e scratch limitado. **Ambos passaram: exit 0,
`status=initialized`**. Essa prova carrega as fontes e verifica o controle
português; isoladamente não aprova pintura dos sete idiomas ou qualidade.

Um probe Java privado separado, sem Spring/rede/providers, conferiu depois
os arquivos efetivamente mapeados em `/proc/self/maps`. Nos dois alvos:
`libjvm`/`libfontmanager` do Ubuntu e FreeType/libpng/HarfBuzz/GLib/Graphite
do sistema; nenhuma biblioteca da árvore Temurin na allowlist observada.
Isso confirma o vínculo usado nessa inicialização, não ausência de vulnerabilidades.
Uma leitura anterior do pai do worker mostrou somente `libjvm`; não foi
apresentada como cobertura do render child, cujo acesso externo aos mapas é
restrito. Nomes dos arquivos `.so` não substituem versão/hash dos pacotes.

Criaram-se dois contextos diagnósticos privados, separados do empacotador
público: metadata `local-ubuntu-worker-experiment-1`, hash do recibo de base,
JAR e pacote nativo conferidos, sem checkout, credenciais ou imagens de teste.
Não se apresentou a instalação de treze pacotes como prova dos dois patches.

| Alvo           | Worker diagnóstico local                                                  |
| -------------- | ------------------------------------------------------------------------- |
| ARM64          | `sha256:eeea93473058ff28a3353583f71c65590d8a3344797a0cc8f70ed40e9d65aba8` |
| x86_64 emulado | `sha256:e8aa7a50c4ab9d9c45fa66e2ff86e8bbc4e013d8081e7c3af09b25b094862d19` |

Somente esses contextos selecionam `JAVA_HOME`, `PATH` e `LD_LIBRARY_PATH`
Ubuntu. Não há symlink sobre o Temurin ou troca do Dockerfile/runtime default.
Build clássico local `--pull=false --network=none`, bases já presentes, CPU 1
e memória 1 GiB; nenhum pacote adicional. Avisos de builder deprecated e
emulação foram preservados. Ambos passaram o preflight real do codec:
`admitted-not-operational`, zero imagens/provider calls.

JAR preservado, 235.911.209 bytes:
`6c6a8703aad2f52839790b7a95852544cc75a3328e2709bc4032dfcd63eee29e`.
Manifesto nativo ARM64:
`bfe9572c3113f805c15634c8e3106b74a2b925735767424269b5e81fc46a3a58`;
x86_64: `0103ab2d4d789b5244371bbb276550a81a77797c583591b008fdba64f683dae5`.

## Harness e execução do pipeline

Mudanças somente em testes Java: seletor `NativeImageTestRuntime`, três testes
puros e asserções da identidade efetiva. O default continua Temurin. Para o
diagnóstico, `renderer.native.image.runtime=ubuntu` exige ambos os IDs imutáveis
distintos, seleciona o executável pela arquitetura e rejeita configuração
desconhecida/ambígua sem expor inputs. O probe verifica vendor `Ubuntu` e versão
`25.0.4.1+1-1-24.04.4-Ubuntu`; o teste HTTP confere também `/proc/1/exe`.

O teste novo foi escrito antes da implementação e falhou por ausência do
seletor; depois os nove testes focalizados passaram. Uma primeira invocação
da matriz recebeu um ID AMD64 transcrito com um dígito extra; o guard rejeitou
o pin. Log/XML foram preservados e a repetição usa o ID do arquivo do Docker,
sem enfraquecer o validador. Nenhuma chamada externa decorreu desse erro.

Comando pelo reactor `api/`, após preparação explícita e cache disponível:

```text
JAVA_HOME=<JDK-23-local> DOCKER_CONFIG=<config-isolada> DOCKER_HOST=<socket-local>
TESTCONTAINERS_RYUK_DISABLED=true ./mvnw -o -t <toolchains.xml>
  -pl apps/translation-gateway -am test
  -Dtest=NativeRenderingWorkerImageLinuxTest
  -Dsurefire.failIfNoSpecifiedTests=false
  -Drenderer.native.image.enabled=true
  -Drenderer.native.image.runtime=ubuntu
  -Drenderer.native.image.arm64.id=<worker-arm64-acima>
  -Drenderer.native.image.amd64.id=<worker-amd64-acima>
  -Drenderer.glibc.arm64.sha256=<manifesto-arm64-acima>
  -Drenderer.glibc.amd64.sha256=<manifesto-amd64-acima>
  -Drenderer.linux.docker.host=<socket-local>
  -Drenderer.linux.docker.path=<docker-local>
  -Drenderer.linux.codec.directory=<decoders-pinados-em-cache>
  -Drenderer.native.image.layout.model=<modelo-pinado-em-cache>
```

O bloco representa um comando; os marcadores não são argumentos executáveis.
PG17/rede interna, providers sintéticos ou SDKs oficiais contra loopback com
NoCredentials, imagens sintéticas, nenhuma porta publicada. Containers próprios
são removidos pelos fixtures; Ryuk desabilitado evita download implícito, mas
interrupção exige conferir manualmente os recursos próprios. Não remover
containers alheios. Cgroup diagnóstico 8 GiB, scratch 512 MiB, caps removidas,
UID 1000, AS pai/filha 3 GiB. Não é admissão do baseline cloud de 1 GiB.

**Matriz integral aprovada:** 40 testes, zero falhas/erros/skips, 1.479,033
segundos. São 19 probes de pipeline por alvo mais um teste HTTP por alvo:
SDKs loopback, SDKs com layout real local, JPEG/WebP, quatro formas/dimensões,
falhas de memória/scratch, timeout/cancelamento com recuperação e pintura
explícita dos sete idiomas. Todos confirmaram Java Ubuntu; os 38 probes
registraram zero OOM kills, UID 1000 e defaults desabilitados.

Picos observados de cgroup: ARM64 2.601.480.192 bytes (~2,42 GiB); x86_64
emulado 2.695.532.544 bytes (~2,51 GiB). Uma rodada por cenário em orçamento
diagnóstico de 8 GiB não estabelece teto operacional nem cobre toda combinação
formato × idioma × limite. Resultados `READY` vêm de providers falsos, não de
avaliação linguística real. Layout é inferência local nova sobre fixture sintética.

XML preservado SHA-256:
`3dd994b6f94af2557c1baa4e49a312f24e216f42a27045feda2ddcb69f337e69`;
log: `a3b491165d8d03f7d2c9a0274a9b3365d17e2bf8fbeaa05cbc60f079d33538be`.
Não se atribuem ao Ubuntu controles Temurin anteriores. A leitura allowlisted
de bibliotecas após bootstrap também foi preservada: fonte do probe
`421fe8b204be9f651cd39b835f5fec516211759e569742309bfaa9c0f340a9e0`;
JSON ARM64 `54470862e47f85aac6290dd94f33bf46f99f714f12a5dd8cb41b19c89d21652d`;
x86_64 `0aa44a45a3cad0a347b1f7a1e6ae800c1e2f614dff956e4cac8bfd612894a6f5`.

## Segurança: comparação offline, não aprovação

Trivy 0.75.0 existente, sem atualização/instalação, environment isolado,
ignorefile vazio, sem filtros de severidade, `--offline-scan --skip-db-update
--skip-java-db-update --skip-check-update --skip-vex-repo-update`, telemetry e
version check desligados. Base OS `UpdatedAt=2026-10-10T12:33:35Z`,
`NextUpdate=2026-10-11T12:33:35Z`: **vencida nos scans de 15:52–15:53 UTC**.

Em ambos: 121 pacotes OS, 18 ocorrências (13 MEDIUM, cinco LOW); 195 dependências
JAR identificadas, nenhuma ocorrência nesse índice histórico. Isso não cobre
integralmente JRE/cópias nativas nem comprova ausência de vulnerabilidades atuais.
O delta frente às bases anteriores é de duas ocorrências:

- GLib `CVE-2026-86469` (MEDIUM): condição de corrida na substituição de arquivo;
  Ubuntu lista Noble com correção adiada. [Fonte primária](https://ubuntu.com/security/CVE-2026-86469).
- HarfBuzz `CVE-2026-22693` (LOW na classificação Ubuntu): falha em condição de
  alocação; Noble permanece vulnerável. [Fonte primária](https://ubuntu.com/security/CVE-2026-22693).

As classificações não dispensam análise de alcance, mitigação, scan atualizado
e decisão de segurança. Não houve supressão, cherry-pick ou nova instalação.
As páginas oficiais foram consultadas em 2026-10-11, separadamente do snapshot
Trivy. Dois opens da página HarfBuzz falharam por timeout; o resultado indexado
oficial foi recuperado, não apresentado como download local autenticado.

O ID da configuração exportada é diferente do ID local Docker. Conferiram-se
configuração efetiva, arquitetura, data, todos os 14 diff IDs, SHA-256 de cada
blob comprimido e sua camada descomprimida, e vínculo do scan ao config hash.
Não se presumiu equivalência somente pelo nome do arquivo.

| Alvo   | SHA-256 do export                                                  | SHA-256 do scan JSON                                               |
| ------ | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| ARM64  | `83e86bab61eac2eef40de9fb0f804c619e795cd1131fbf64611aca6a9b2924e2` | `621e6fa4cb34d31aa7f27295394c219b037f3c978b3db4c8765359a252d8410a` |
| x86_64 | `412a4cbd38f998f3e3dfbb3382b0e12ffb4a4c49b9b67ab63e4b529eecd9a28e` | `b76805957a58b0a60e5883d1558f04657e6886af205bb793a28cb6f7631e4e7e` |

Uma invocação AMD64 tinha path de config inexistente e falhou antes de escanear;
a repetição correta é a fotografia acima. Os exports/recibos privados são
preservados; nenhum conteúdo OCR ou segredo foi incluído.

### Repetição com dados correntes

Depois da comparação histórica, atualizou-se **somente o banco público de
vulnerabilidades**, sem instalar software, em cache separado. Scanner anterior
e dados anteriores preservados; ambiente sem credenciais, repositório explícito
`ghcr.io/aquasecurity/trivy-db:2`. O índice Java existente foi copiado ao novo
cache, sem mudança de bytes, e ainda estava dentro de sua validade.

- DB OS: `UpdatedAt=2026-10-11T13:06:05Z`,
  `NextUpdate=2026-10-12T13:06:05Z`, SHA-256
  `80395a349960522ea33bb01e35ff87d3a59ce9ecff0a1a8793e1383566d1ee29`.
- Índice Java: `UpdatedAt=2026-10-10T00:59:51Z`,
  `NextUpdate=2026-10-13T00:59:51Z`, SHA-256
  `6c1859b93bb33ff808b5b02eb31f1e79b91a521d3aec2af92fdb0368d4abe699`.
- Scans das mesmas exportações às 16:06 UTC, sem rede/update durante a análise:
  **18 ocorrências OS em cada alvo, 13 MEDIUM/cinco LOW; zero nas 195 dependências
  JAR identificadas**. Identidade dos config hashes conferida novamente.
- SHA-256 JSON corrente ARM64:
  `865f4c3f6204ef9977e002e85fce0ed9bdb05ee8ffaf6204bffd76dce75b89a4`;
  x86_64: `e4c5d8e5cd8e642fb567311ac67edbbc047c0a4da2a331ad90a84c4ef9bb2215`.
- Recibo corrente, incluindo lista integral das ocorrências e metadata dos DBs:
  `898aa69a5d2c0ab64dfe86a9e032c84e64bc206caf8ef30b86df35a32b7a4868`.

Dados correntes não ampliam a cobertura do scanner a todo o JRE nem aprovam o
risco operacional. Os dois findings adicionais e os anteriores permanecem
abertos; nenhuma supressão ou instalação de correção.

## Rastreabilidade e pendências

Checksum técnico gateway: 402 arquivos, paths relativos ordenados, sequência
`path + NUL + bytes + NUL`, em `src`, `scripts`, `openapi`, `pom.xml` e
`.tf`/`.tfvars.example` diretos do Terraform:
`25f52c11e40f137e7b924038c1d6a7888a10debdd9e20acfeb8b6c37f7a16f7a`.
Diferença contra a fotografia anterior: somente harness/testes. Documentos,
Dockerfiles, artefatos privados e `target` não entram nesse checksum.
O hash anterior de 400 arquivos continua sendo registro histórico, não é
renovado nas reviews antigas. Sem mudança mobile/checksum SDD.

Gates desta execução:

- Preparador privado: quatro testes puros; focalizados Java: nove testes,
  incluindo três novos controles do seletor. Sem falhas.
- Tooling Node do gateway: 114 aprovados, um skip opt-in, nenhuma falha.
- Maven global offline com Docker, sete módulos `SUCCESS`: 2.741 testes
  contabilizados, zero falhas/erros, 103 skips opt-in; gateway 1.270.
  Não soma os 40 controles nativos como se estivessem ativos no comando comum.
  Matriz nativa aprovada separadamente e XML preservado antes da execução global.
- `pnpm check` mobile completo: SDD, links, type-check, lint/FSD, formatação
  e 116 suítes/892 testes passaram, sem reinstalação. Warnings `act(...)`
  existentes não são ocultados como ausência de warnings.
- Web `tsc -b` passou usando o executável instalado, sem aquisição via `npx`.
- Links do gateway: 76 documentos/253 referências relativas, nenhuma quebrada;
  Prettier somente nos três documentos alterados, diff do gateway aprovado.
- Diff global mantém a falha externa `PlatformBadge.tsx:44` (linha vazia no EOF),
  sem correção automática de arquivo alheio.

Doze containers identificados no log Maven foram conferidos após a suíte:
nenhum permaneceu. Não se removeu container alheio, imagem histórica ou arquivo
real. Recibos privados guardam comandos/logs/hashes; nenhum conteúdo sensível
foi copiado para Git. Não foi executado Terraform remoto, provider ou deploy.

Segurança residual e runtime mínimo continuam abertos: ambas as cópias JRE
permanecem nas imagens diagnósticas. Compatibilidade do Java Ubuntu não autoriza
trocar o default, aceitar risco operacional, publicar a imagem ou habilitar
uploads. Memória agregada/ambiente alvo, distribuição reproduzível admitida,
qualidade dos sete destinos e revisão humana continuam pendentes.
