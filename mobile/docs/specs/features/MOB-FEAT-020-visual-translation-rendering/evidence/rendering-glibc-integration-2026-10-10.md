# Renderer glibc explícito — 2026-10-10

Parcela de TASK-002/007/008. Gate 020 `open`, status `in-progress`, dependência
019 `verification-pending`; 021 continua bloqueada. Autorização humana para
preparação local e implementação incremental até rendering, sem custo de
provider, cloud/credenciais, mídia privada, deploy ou habilitação de uploads.

## Fonte e escopo

- Fonte/testes/configuração gateway: 377 arquivos,
  SHA-256 `03be9e34304a1872f5837ee01c89575dc3b8244ced936b29ff84056dac81efdf`.
- JAR de produção: `4981e13f027d20cf77b7dae68d0c1d70d36a4584ca65a7bfbd62bd6d20762852`.
- A fotografia intermediária de seis provas glibc, antes do ajuste do harness
  slim musl, usou source `7f83f648d3e58f03f2565d8338fddff838ede57fb00635cd06647a2f43e54f44`,
  mesmo JAR. Foi preservada localmente, não reatribuída ao checksum terminal.
- Checksum técnico tem o mesmo escopo/método da parcela anterior: paths
  ordenados e bytes, separados por NUL, em src/scripts/OpenAPI/Terraform/exemplo
  e POM do módulo, sem target/docs/cache. Não é o checksum mobile nem cobre
  Dockerfile/POM pai. Históricos mantêm seus hashes próprios.

[Contrato/configuração/repetição](../../../../../../api/apps/translation-gateway/docs/rendering-glibc-integration.md)
e [preparação com pins upstream](../../../../../../api/apps/translation-gateway/docs/rendering-glibc-preparation.md).
Nova plataforma explícita glibc ARM64/x86_64 coexiste com musl, sem alias ou
fallback. `NativeRuntimeElf` verifica `PT_INTERP` do Java por I/O limitado,
sem FFM/subprocesso no pai. Pacote exige deps ELF específicas, licença, hash,
SONAME/RUNPATH e correspondência ao runtime antes de carga. Nenhuma migration,
contrato público, manifesto, idioma ou dado OCR foi alterado.

## Red, investigação e correção

1. Dois testes Node de plataforma glibc falharam antes do suporte; testes Java
   também ficaram red por ausência dos contratos/parser. Após implementação,
   contratos passaram. Uma posição de terminador incorreta na fixture de teste
   foi corrigida sem afrouxar o parser.
2. Quatro provas reais de codec/guard glibc passaram. Dois workers falharam no
   bootstrap antes de OCR/tradução, com código sanitizado; não houve READY falso.
3. Métricas mostraram reserva virtual no x86_64 acima de 3 GiB. Configurar
   arenas somente no pai reduziu a reserva, mas não preparou o helper, cujo
   ambiente era vazio. Isso era diagnóstico limitado, não uma aprovação.
4. Política fixa de `MALLOC_ARENA_MAX=2` no pai glibc selecionado e no launcher
   de helper/filha limitados resolveu a configuração testada. Pai sem valor
   exato é recusado; ambientes dos subprocessos continuam sem herança de
   tunables/JAVA/LD/credenciais. Musl conserva ambiente vazio.
5. Regressão musl revelou dois testes slim obsoletos: 1 GiB/disco, enquanto o
   guard atual exige 8 GiB/tmpfs. Somente o harness foi alinhado à admissão real,
   com export separado e reservas JVM explícitas. Os cinco testes legados
   passaram; nenhum guard/cap de produção foi reduzido ou removido.

Os caps AS continuam 3 GiB para pai/filha e 1 GiB para helper; CPU, PIDs,
scratch, heap e lossless/exact permanecem. Arenas não limitam RAM total nem
provam ganho de performance. Base Java 23 histórica é diagnóstico, não aprovação
de segurança ou escolha operacional automática. x86_64 é emulado.

## Cobertura verificada

- Puros: quatro alvos, aliases, origem de libc pelo interpretador, header/
  máquina/offsets inválidos, intérprete ausente/duplicado/não terminado,
  deps extras/ausentes/mistura, política do allocator e erros sem conteúdo.
- Node: packager registra glibc sem renomear para musl; legado, pins/licenças,
  create-only, concorrência, symlinks e arquivos readonly preservados.
- Codec real glibc: buffers ARGB emprestados, alpha/RGB invisível, round-trip
  e decoder ARM64/musl independente, dimensões/bytes/hash, capacidade,
  interrupt/timeout e cleanup. Não é apenas versão ou carga de biblioteca.
- Guards reais nos dois glibc: caps self-only kernel, dumpability zero,
  OOM adjustment da filha e ausência de OOM na execução.
- Worker frio: configuração/parent helper de produção, Spring/MockMvc filtros,
  PostgreSQL 17 V1–V9 e storage/renderer reais, SDKs oficiais Vision/Translation
  usando somente gRPC loopback e NoCredentials. Original, arquivos/manifestos,
  estados, reentrega sem segunda chamada, pipeline vazio e cleanup conferidos.

Cada worker recebe PNG sintética 10.000 × 8.000, 80M pixels e 7.322.972 bytes;
três jobs sequenciais: 64 regiões com saída total 524.288 UTF-16 (fallback
completo), uma região com 8.192 UTF-16 pintados e zero regiões. Cada worker
faz três RPCs OCR e dois Translation, sem aumento por reentrega. Texto é
sintético; SDK real não significa qualidade de provider real.

Resultados terminais com a fonte/JAR acima, uma execução SDK por alvo:

| Runtime              | READY | Pico cgroup em bytes | Tempo do worker em ns | RPCs OCR/Translation |
| -------------------- | ----- | -------------------- | --------------------- | -------------------- |
| ARM64/glibc          | 3     | 1.720.766.464        | 26.451.421.771        | 3/2                  |
| x86_64/glibc emulado | 3     | 2.037.833.728        | 67.353.829.121        | 3/2                  |
| ARM64/musl           | 3     | 1.786.359.808        | 26.826.265.225        | 3/2                  |
| x86_64/musl emulado  | 3     | 2.051.964.928        | 68.283.564.736        | 3/2                  |

Doze READY, zero OOM observado; hashes visuais de cada controle iguais nos
quatro alvos. Manifestos possuem jobs distintos, portanto seus hashes não
precisam coincidir. Flags/caps de produção confirmados e nenhum helper vivo
após bootstrap. O consumo inclui servidores falsos locais, não PostgreSQL
que roda em outro container.

Treze testes nativos selecionados passaram: seis glibc (codec/guards/worker),
cinco legados musl (codec/bean/guard) e dois workers SDK musl. Uma seleção
intermediária deixou ARM64/musl em skip por nome incorreto da flag; sua
execução específica com `renderer.worker.resources.enabled=true` passou.
O skip original foi preservado como tal, nunca contado como prova executada.
Gates globais são evidência separada, não substituem essas provas opt-in.

## Gates executados

- Maven global offline/Docker, pelo reactor `api/`: exit 0; XMLs novos desde
  `2026-10-10T10:41:31Z`, antes de executar a suíte leve: 2.714 testes/839
  classes, gateway 1.243/123, zero failures/errors, 99 skips opt-in. Skips
  parametrizados no global não representam todas as invocações nativas.
- Tooling Node: 94 pass, um opt-in não selecionado, zero fail.
- Type-check web `tsc -b`: exit 0.
- Links documentais e `git diff --check`: exit 0, após estabilizar esta parcela.
- Prettier dirigido, sem formatação global: documentos/scripts tocados
  verificados; formatação da review ajustada após novos findings.

Check mobile integral, suíte leve, checksum SDD e conferência terminal são
registrados na review/drift após suas execuções. Não são aprovação presumida.

## Limites e decisão

AC-004/005/006 recebem evidência complementar, não aceite integral. Perfil é
diagnóstico 8 GiB, AS 3 GiB e scratch tmpfs 512 MiB, CPU 1/PIDs 64, swap extra
zero; rootfs/mounts readonly e nenhum privilégio extra. Cada medição tem uma
execução por alvo; não há mediana/variabilidade ou hardware x86_64 nativo.

Não se admite cloud 1 GiB, OOM agregado, todas as formas/formatos/scripts,
ONNX residente, storage/IAM/Tasks reais ou qualidade visual/linguística geral.
Bootstrap/inferência ONNX da preparação resolveu aquela lacuna local na base
glibc, mas não prova seu orçamento junto do worker. Layout permanece
experimental, separado do manifesto OCR e dos critérios normativos.

Distribuição operacional, matriz ampliada/isolamento combinado, decisão de
recursos e validação externa continuam abertas. TASK-002/006/007/008,
verdict `changes-requested`, 020/021 e defaults/cloud preservados.
Performance mobile N/A: somente backend/testes/governança, sem alteração de
fluxo React Native ou alegação de benchmark Android. Reviews/drift seguem as
skills SDD sob os guardrails atuais de dependências em verificação.
