# Reconstrução local do worker ARM64 — 2026-10-26

Esta receita é uma prova local, sem publicação ou admissão operacional. O modo
de renderização e os providers continuam desabilitados por padrão. Os arquivos
locais abaixo são insumos privados ignorados pelo Git; o código-fonte e o
inventário versionado não substituem esses bytes.

## Revisão de segurança da imagem reproduzida — 2026-10-27

A imagem `sha256:8523c2b02c57ca42d7e69aa112c0b40692ee360842806b35cef58decdad0f41c`
é uma fotografia de reprodução, **não uma base de runtime aprovada**. Uma
inspeção local sem rede, com filesystem somente leitura, capabilities removidas
e `no-new-privileges`, confirmou UID/GID 1000, providers e renderização
desabilitados por padrão, JAR e manifesto do codec somente leitura e os hashes
das duas bibliotecas iguais aos pins abaixo. O runtime informa Temurin
25.0.4.1+1; o JDK 25.0.5 do archive de construção é um insumo diferente.

O `dpkg-query` nessa imagem encontrou `libfreetype6 2.13.2+dfsg-1ubuntu0.1`
e `libpng16-16t64 1.6.43-5ubuntu0.6`. Ambas precedem as correções publicadas
para Ubuntu 24.04: [CVE-2026-95512](https://ubuntu.com/security/CVE-2026-95512)
e [CVE-2026-46675](https://ubuntu.com/security/CVE-2026-46675), respectivamente.
Isto comprova versões instaladas anteriores às correções, não que os caminhos
vulneráveis sejam exploráveis no worker. A imagem patched histórica descrita em
[native-base-update](native-base-update-2026-10-11.md) não estava disponível no
daemon consultado; não foi substituída nem reconstruída nesta revisão.

`ldd /opt/java/openjdk/lib/libfontmanager.so` nessa imagem aponta para o
FreeType **incluído no JRE**, cujo SHA-256 é
`1013ee875408a025c669fcb65760385c9af70dbeeeae56d569ee069e8555d0a7`.
Atualizar o pacote Ubuntu de FreeType por si só não atualiza essa cópia. O
histórico de [segurança residual](native-residual-security-2026-10-11.md)
delimita essa questão; esta revisão não verifica o patch interno do JRE e não
aprova nem suprime findings. Os hashes dos archives comprovam integridade
relativa aos pins preservados, não autenticidade independente ou manutenção
futura. O builder e o parent exportados continuam sendo insumos obrigatórios.

O inventário é pontual: nenhum scanner ou base de vulnerabilidades atual foi
disponibilizado nesta revisão. Antes de admitir distribuição operacional,
preparar e verificar uma base corrigida, reavaliar o JRE e suas bibliotecas
embarcadas e executar avaliação de segurança atual; reconstruir o pacote e
repetir as provas após qualquer troca. Nenhuma imagem, default ou artefato
existente foi modificado por esta inspeção.

### Scan OS posterior — 2026-10-27

O worker diagnóstico de base corrigida
`sha256:0e168d30f64bd4b120f850a3221884fc2aa9d622cdc52f65b4ba660635c10343`
foi exportado localmente; seu archive temporário, SHA-256
`42408ade366cf5df5d704b1efbdb247574e0c0ce3591b3fb003bb77deef0ff44`,
passou no verificador OCI até o ID da imagem. Trivy 0.76.1 foi obtido em
diretório temporário, com archive SHA-256
`11a9b6cd2752011b54f01ea4bd0dbfa9f0c41dc6538d5a3f9d23955f471bf4e5`,
conforme release pública. A DB foi obtida sem credenciais; o scan da cópia
local usou `--input`, `--skip-db-update`, `--skip-java-db-update`,
`--offline-scan`, `--skip-check-update`, `--scanners vuln` e `--pkg-types os`.

A DB OS registra atualização `2026-10-27T19:17:44Z`, próxima atualização
`2026-10-28T19:17:44Z` e SHA-256 descompactado
`244d77b4ad3894e67dcee68a8b972a40f44111a5017ae6c87c7d41ef322cc037`.
O scan retornou **30 ocorrências em 24 CVEs**: 26 MEDIUM e quatro LOW segundo
classificação do scanner/Ubuntu. Destas, o scanner informa correção para
`libbrotli1` e `zlib1g`; as versões corrigidas para Noble também constam em
[CVE-2026-111497](https://ubuntu.com/security/CVE-2026-111497) e
[CVE-2026-85091](https://ubuntu.com/security/CVE-2026-85091). Nenhuma dessas
correções foi aplicada nesta medição. Não inferir exploração a partir de
inventário instalado ou aprovação pela ausência de findings HIGH/CRITICAL.

JSON bruto SHA-256
`e493e49f51c3707d1c68ad3f4f2aab239ea0bb6b8373a264c74a834d5a81877d`,
metadata, logs e DB compactada estão em
`.local/worker-isolation/repro-020-2026-10-26/security-scan-os-2026-10-27/`.
A DB compactada tem SHA-256
`255a7d100f2849c21aa8cdad47a548467b6f63d6d1764a9a5d9e0a67499889fb`;
o hash após descompactar foi conferido. Scanner temporário, cache expandido e
export da imagem foram removidos depois. O scan é restrito a pacotes OS: não
avalia as dependências Java, bibliotecas embutidas no JRE ou codec manual e
não é VEX, prova de alcance nem admissão de segurança. Não comparar contagens
com o scan histórico como se a mesma DB/ferramenta tivesse sido usada.

### Base corrigida local — continuação de 2026-10-27

Após a limpeza dos intermediários e com autorização do usuário para continuar,
o preparador existente usou a base pública fixada por digest e repositórios
Ubuntu autenticados para atualizar somente os dois pacotes. A prova em
`.local/worker-isolation/repro-020-2026-10-26/patched-base-2026-10-27/`
registra hashes dos pacotes e inventários antes/depois; o inventário do JRE foi
idêntico. A base local resultante é
`sha256:9b8d3a18dc0a468f690cd993a5de1e8020ba25c75d4d5c3dbb9c00f4edb5d82d`;
seu `result.json` tem SHA-256
`74bb87ebbb6df54f70c85aa2b7ef5de56c159ccb43a0a6a112b57a579e1de911`.
O archive local da base, `patched-base-arm64-2026-10-27.tar`, tem SHA-256
`079ef84cba0e4292730f3bfb468df4aec212ee795073c71833f0c6e79c126579`;
o verificador OCI conferiu os oito blobs e o grafo até o ID fixado.

O preparador de imagem verificou a prova, o JAR e o codec e produziu contexto
SHA-256 `6a3f33eb4ba284ece37bd8e03085fddcfa4c7e635e0f11721ad837f9633cf2fc`.
O build local sem cache, pull ou rede nos passos produziu
`sha256:0e168d30f64bd4b120f850a3221884fc2aa9d622cdc52f65b4ba660635c10343`;
preflight passou e `dpkg-query` confirmou FreeType `2.13.2+dfsg-1ubuntu0.2`
e libpng `1.6.43-5ubuntu0.7`. O contexto temporário foi removido após o build;
ele pode ser preparado novamente com os insumos e a prova preservados.

Na imagem nova, dois testes do worker passaram sem skips: READY, downloads
íntegros, ACK repetido e cleanup; falha controlada de memória, ausência de
resultado parcial e sucesso de uma página seguinte. XML preservado como
`worker-proof-patched-base-2026-10-27.xml`, SHA-256
`edf1430065676fac0c3b8fe548ee91ba687079b127a0317dcdbeb60b5c2dbcae`.
O cenário de memória usa teto local de 8 GiB, não admite orçamento cloud.
Não houve scan novo; as demais vulnerabilidades e o FreeType do JRE continuam
abertos. A imagem nova é diagnóstica, `baseSecurityApproved=false`, sem
publicação ou alteração de defaults. O archive offline então existente continha
o parent histórico e não representava esta base corrigida; foi substituído na
continuação documentada abaixo.

### Triagem do JRE posterior — 2026-10-27

O fornecedor publicou [Temurin 25.0.5+8](https://github.com/adoptium/temurin25-binaries/releases/tag/jdk-25.0.5%2B8)
em 22/10, posterior ao Temurin 25.0.4.1+1 da imagem diagnóstica. As
[notas Oracle de JDK 25.0.5](https://www.oracle.com/java/technologies/javase/25-0-5-relnotes.html)
listam FreeType 2.14.3 e libpng 1.6.58; o
[advisory de libpng](https://github.com/pnggroup/libpng/security/advisories/GHSA-qvg3-h654-xq3j)
aponta correção upstream em 1.6.59. As notas Oracle não são inventário do binário
Temurin nem provam presença ou ausência de backport; tampouco foi verificada
a correção de FreeType nessa versão. Portanto a disponibilidade de 25.0.5 não
encerra os findings das bibliotecas embarcadas.

Próximo passo concreto: obter inventário e proveniência verificáveis do binário
ARM64 candidato, conferir patches efetivos ou manifestação do fornecedor para
ambos os findings, e só então construir imagem isolada e repetir preflight e
provas do worker. Se houver backport, exigir evidência específica; versão ou
scan de pacotes Ubuntu isolado não é suficiente. Nesta triagem não foi baixado
ou instalado outro runtime, nem alterada a imagem anterior.

Na continuação, o JRE público ARM64 25.0.5+8 foi baixado para inspeção e seu
SHA-256 `963931723891302ebb2687178532c3d793d71e2577cd058061c7efb396140a86`
coincidiu com o checksum e os metadados publicados pelo fornecedor. O arquivo
`release` identifica fonte Adoptium `7ec19fb1eda7e42498b7ee4ebde29f77aa961a1c`;
os avisos legais do próprio archive declaram FreeType 2.14.3 e libpng 1.6.58.
O SBOM publicado, hash
`965962f1987f9cb2f1d69f199992f14bcef57e1d517d33be83dfbc5b2be104b1`,
também lista FreeType 2.14.3. Isso é inventário declarado, não certificação
do binário ou verificação de assinatura criptográfica independente.

Da revisão exata declarada, `png.h` identifica 1.6.58 (SHA-256
`1505d9140858e6a42c9088badc5474483cf481ad61a60aaa38aaa1fed03c3ca5`);
`cidload.c` (SHA-256
`2090df639d0e1400816bff67976c82b98c5c793b72e3b21927f9b2905784a1fe`)
não apresenta o contador `cum_len` do patch FreeType mencionado acima. Essa
comparação não exclui correção alternativa nem prova equivalência entre fonte
e binário ou alcance do caminho vulnerável. A configuração de build também
contém uma referência histórica a FreeType 2.9.1, distinta do SBOM e aviso
legal; não foi estabelecido que essa referência seja a biblioteca entregue.
Preservados os metadados, SBOM, avisos e dois fontes em
`.local/worker-isolation/repro-020-2026-10-26/jre-candidate-audit-2026-10-27/`;
o archive temporário foi removido a pedido do usuário para economizar espaço.
O candidato não foi instalado ou aprovado, e o finding permanece aberto.

## Insumos fixados

- Builder Linux ARM64: `sha256:a5e056701b09317d667148809010b63de2e5398aa3adf1cf85b599b6968c75b2`;
  GCC 13.3.0, CMake 3.28.3, binutils 2.42-4ubuntu2.10, libc6-dev
  2.39-0ubuntu8.9 e make 4.3-4.1build2. A imagem é a unidade imutável que fixa
  também as dependências transitivas do toolchain.
- Archive local do builder: `.local/worker-isolation/repro-020-2026-10-26/builder-arm64.tar`,
  SHA-256 `75914164b07694835ff2d7dc66a41e51a98351d73a4584a45e4c501e1e0c58d2`.
- Fonte oficial libwebp 1.6.0, `libwebp-1.6.0.tar.gz` no mesmo diretório,
  SHA-256 `e4ab7009bf0629fd11982d4c2aa83964cf244cffba7347ecd39019a9e38c4564`.
- Parent diagnóstico local: `sha256:c194a9f2a2c03113cbfd71f38b04f043e65ce25a8cf6dee5adfe19c7c36635a3`;
  archive `runtime-parent-arm64.tar` no mesmo diretório, SHA-256
  `0f5ba5646d3500e294a8d41f592c1f48b744b14cdf1049a0e234ebf0feb11c50`.
  Contém Temurin 25.0.4.1+1, pacote nativo anterior e JAR histórico. O JAR
  e os cinco arquivos do codec são sobrepostos pelos insumos reconstruídos;
  o preflight verifica os novos hashes e o runtime efetivo.
- O [inventário do JAR](worker-jar-inventory-2026-10-26.json) fixa SHA-256 de
  cada dependência e dos arquivos de fontes/licenças desta fotografia. O JAR
  reflete a working tree de 26/10, inclusive alterações preexistentes.

Se o cache Docker for limpo, conferir os hashes dos archives antes de `docker
load` e verificar os IDs resultantes. A reconstrução não baixa ou instala
pacotes. A receita não afirma reconstruir o builder desde os pacotes Ubuntu
individuais; a imagem exportada é insumo obrigatório, não substituto de um
repositório público de toolchain. Nesta rodada ambos os archives foram
carregados novamente e retornaram os IDs fixados acima.

## Codec e JAR

Executar o [rebuild](../scripts/rebuild-native-arm64.mjs) com o caminho absoluto
da fonte verificada e um diretório absoluto novo:

```sh
node scripts/rebuild-native-arm64.mjs /caminho/libwebp-1.6.0.tar.gz /caminho/novo
```

O script valida a fonte, usa somente a imagem fixada, `--pull=never`, rede
desligada e SOURCE_DATE_EPOCH fixo; compila nos caminhos internos `/build` e
verifica hashes independentes antes de empacotar. Não sobrescreve nem remove
tentativas anteriores. Duas execuções limpas produziram pacote byte a byte
idêntico; manifesto `bfe9572c3113f805c15634c8e3106b74a2b925735767424269b5e81fc46a3a58`.

O POM fixa `project.build.outputTimestamp`. Dois diretórios limpos de fonte,
Java 25.0.5 e Maven offline produziram o mesmo JAR SHA-256
`6aa86b3fe3a45137a6daf221a62dbdf728310fad754c4c3cc48a039cbe6eec9c`.
O inventário pode ser reproduzido com `python3 scripts/worker-jar-inventory.py
<jar-absoluto>` e comparado ao JSON versionado. São necessários os artefatos
Maven já presentes com os hashes listados; o teste não demonstra aquisição
futura ou disponibilidade do cache em outro host.

## Distribuição independente do cache — 2026-10-27

Uma prova posterior reuniu o código principal, JDK 25.0.5, Maven 3.9.9 e um
repositório offline selecionado a partir da resolução do build. O pacote não
contém settings, credenciais ou metadados de resolução do usuário; os arquivos
de configuração incluídos são exclusivamente offline. A seleção inclui BOMs
e parents necessários e não é apresentada como redução mínima de dependências.

Os dois archives locais, em `.local/worker-isolation/repro-020-2026-10-26/`, são:

| Archive                                          | Conteúdo                                                                 | SHA-256                                                            |
| ------------------------------------------------ | ------------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `offline-worker-java-final-darwin-arm64.tar.gz`  | fontes, JDK, Maven, repositório, verificador e lock                      | `7baa30d1196df0801e74c3c750df3020df26d630fb8f1da07b08ac7560e63515` |
| `offline-native-deterministic-2026-10-27.tar.gz` | fonte libwebp, builder, base corrigida, prova e receitas de reconstrução | `19446ac5b28951e295f99efdec61ec69d9860b294fd62a9990d5bd93675ad14a` |

O [lock Java](worker-offline-build-lock-2026-10-27.json) tem SHA-256
`ee425097441faf6b4aaaa6b903d2d609916eab197bdf874fb5c88ee253a8fba2` e registra
modos, tamanhos e hashes de 1.920 arquivos, além dos links internos. O
verificador exige settings offline conhecidos, rejeita alterações, arquivos
extras e links externos; tolera somente `.DS_Store` regular como metadata do
Finder. O archive exclui esses arquivos. A primeira prova detectou descritores
Maven incompletos e recusou o resultado. Em 27/10, a pedido do usuário, os
archives preliminares e diretórios extraídos de trabalho foram removidos para
liberar espaço; o lock inicial, os logs, os XMLs e os dois archives finais foram
preservados. As referências históricas à preservação dos archives preliminares
descrevem o estado anterior à limpeza.

Após verificar o SHA-256 do archive Java e extraí-lo em local novo, usar o
`README.txt` incluído e o `offline-worker-bundle.py` incluído. O comando `build`
verifica o lock antes e depois, cria diretório exclusivo, usa `sandbox-exec`
para bloquear rede, configura `user.home`, settings, toolchains e repositório
isolados e compara o SHA-256 final ao lock. Na prova, também foram bloqueados
os caminhos do checkout, do cache Maven e do JDK originais; verificações
separadas confirmaram os bloqueios. O JAR foi reproduzido sem avisos de POM
ausente; testes não foram compilados ou executados nesse build de embalagem.

O archive nativo inclui um verificador OCI que valida SHA-256 do archive, blobs
e referências até os IDs fixados. Os archives restauraram os mesmos IDs no
Docker local. Com os scripts extraídos e sem ler o checkout, o codec foi
reconstruído em container sem rede; o contexto resultante coincidiu com o hash
anterior e a imagem passou no preflight com `--no-cache`, sem pull e sem rede
nos passos. Os IDs Docker são índices OCI: o digest do config serializado pode
ser diferente, por isso ambos os níveis são verificados sem equipará-los.

Essa prova requer macOS ARM64 compatível, Python 3.9+, Node e Docker local;
essas ferramentas de sistema e o daemon não estão no archive. Os testes do
worker e a suíte Maven continuam separados. A restauração dos archives foi
feita no daemon existente; não se afirma teste em outro host ou daemon vazio.
O worker da imagem reconstruída sem cache de camadas também executou uma página
sintética até `READY`, download dos dois arquivos e ACK repetido, com cleanup.
O XML dessa execução foi preservado localmente, SHA-256
`bd19388724e2dc0ecb4565fa06599a67c6206c51b8ad1b7642a6948139b48aa9`.

Em uma execução posterior da mesma imagem, a consulta e os ACKs passaram pelo
`SessionAuthenticationFilter` e pelo `AuthenticateSessionUseCase` reais, com
token de teste e sessão persistida no PostgreSQL local. A consulta e o ACK sem
token retornaram 401; a sessão válida permitiu os downloads íntegros, dois ACKs
202, uma intenção durável e cleanup concluído. O controller e o transporte de
assinatura continuam montados no harness standalone: esta prova não executa a
cadeia completa de segurança HTTP nem autenticação, TLS ou GCS externos. O XML
local `worker-proof-session-filter-2026-10-27.xml` tem SHA-256
`38a250499911a45963f228c15db933bfab29c2880acb082d9c324e053e586a65`.

Na repetição seguinte, o transporte loopback também recusou com 403 uma URL
vencida e outra de geração diferente, ambas com HMAC válido para seus próprios
parâmetros. Assim, essas rejeições não dependem de uma assinatura inválida.
O worker, downloads, sessão, ACK e cleanup passaram novamente; XML local
`worker-proof-expiry-generation-2026-10-27.xml`, SHA-256
`d09f1138b3d2ed71824327456209482ee5908ccdabd412a689fa6d10f6334261`.
Trata-se da fixture local, sem afirmação adicional sobre GCS.

Na imagem de base corrigida, a prova integrada foi ampliada para duas sessões
persistidas no PostgreSQL: outra instalação recebe 404 em consulta e ACK, sem
geração de URL ou intenção de limpeza; a proprietária obtém os dois arquivos,
faz dois ACKs e conclui o cleanup. O filtro de sessão e a persistência são reais;
o controller é standalone e a assinatura/transferência continuam fixtures.
Um teste passou sem skip. XML `worker-proof-cross-owner-2026-10-27.xml`,
SHA-256 `cf68e78a40ce4a8a7c65813bb7461d4c478dac8b30130e6f3b03ba53c1089ef3`.
Também passaram 176 regressões focadas de fontes, codec, assinatura, retenção
e persistência PostgreSQL, sem skips; não substituem teste em GCS/IAM reais.

Outra regressão usa o contexto servlet completo do gateway com
`GatewaySecurityConfig`, filtro de sessão e PostgreSQL, com assinador simulado:
consulta sem sessão é 401; outra instalação recebe 404 na consulta e no ACK,
sem invocar o assinador ou gravar intenção; a proprietária recebe READY e dois
ACKs 202 geram uma intenção e `RESULT_EXPIRED`. Os nove testes de
`ResultRetentionPersistenceTest` passaram sem skips. XML final local
`gateway-security-postgres-final-2026-10-27.xml`, SHA-256
`a5b3bd4844023196e03c2dd1ef96a785d9094edc7e38333c11a4c18829d331ae`.
O transporte/assinatura real GCS e a transferência integral no mesmo processo
não são demonstrados por este teste.

Continuação: a regressão no contexto servlet completo passou a delegar ao
`GoogleCloudPrivateDownloadAdapter` real e ao SDK oficial com chave RSA efêmera
e `NoCredentials`. Metadados GCS são simulados; não há requisição externa.
As duas assinaturas foram verificadas com a chave pública e comparadas às URLs
retornadas; geração 7, posse, ACK repetido e expiração também foram conferidos.
Os nove testes passaram, sem skips; XML
`gateway-security-sdk-verified-2026-10-27.xml`, SHA-256
`87f14f7edca64b63b37392d7243ded8c8ab56d3de0bbf753b3d8a5c22362e88a`.
A primeira tentativa de configurar o mock falhou antes da prova, por executar
o stub anterior com argumento nulo; o mock foi resetado e a prova repetida.
Isso não comprova acesso IAM/GCS nem transporte HTTPS real.

Foi acrescentada regressão concorrente no contexto servlet completo com
PostgreSQL: uma consulta fica bloqueada na assinatura enquanto outra requisição
confirma o ACK; após liberar o assinador simulado, a resposta da consulta é
`RESULT_EXPIRED` sem URLs e há uma única intenção durável. Dez testes da classe
passaram sem skips. XML `gateway-ack-sign-race-2026-10-27.xml`, SHA-256
`1f62dbbbc56464ceaa051bd4a7433193171762d1e7b7207f3e89589177408280`.
O teste controla essa interleaving específica e não prova todas as ordens nem
serviços GCS/IAM reais.

Na prova integrada do worker, após ACK e cleanup concluído, foram novamente
solicitadas as duas URLs assinadas emitidas antes do ACK. Ambas ainda estavam
dentro do prazo e receberam 403 no transporte loopback porque os arquivos já
haviam sido removidos. Um teste passou sem skips; XML
`worker-proof-old-urls-2026-10-27.xml`, SHA-256
`c169209c8843ed6ceb61a20e3cbedb9db56d3535673144f0ff932e8cd1eb948f`.
Isto não demonstra revogação instantânea antes do cleanup, nem comportamento
de URLs em GCS real; falhas de delete mantêm retry durável.

Na continuação, a mesma prova mostrou a janela anterior: depois de dois ACKs
202 e antes de executar o cleanup, as duas URLs previamente emitidas ainda
baixaram os arquivos pelo transporte loopback; após cleanup, ambas falharam.
Um teste passou sem skips; XML `worker-proof-ack-window-2026-10-27.xml`,
SHA-256 `6283222dde41b44aab15fe35484daaba85dd68f7e343166024daa4f890a7c1e8`.
O ACK persiste a intenção; não executa delete sincronamente. A
[documentação de URLs assinadas do GCS](https://cloud.google.com/storage/docs/access-control/signed-urls)
descreve a URL como credencial utilizável durante seu prazo; deduz-se que
uma URL real previamente emitida não é revogada pelo registro SQL do ACK.
Não houve chamada a GCS para verificar essa hipótese no ambiente alvo. Se a
spec exigir bloqueio imediato da URL após o ACK, o fluxo atual não o comprova
e sua solução precisa conciliar o contrato 202, falhas de delete e o acesso
direto ao objeto. Não promover TASK-006 até resolver a interpretação/garantia.

Na auditoria posterior, o `RenderingWorkerIntegrationTest` opt-in foi executado
à parte com PostgreSQL temporário e codec local: 27 casos passaram, sem falhas
ou skips, incluindo cancelamento, rollback, confirmação perdida e uploads
parciais. A tentativa inicial usou pins históricos dos binários Homebrew e foi
recusada na inicialização; os arquivos atuais continuam declarando WebP 1.6.0,
mas seus hashes são `46f37f040f9f248ab5225a0dea0d92b697d08bdb712c8677f5cea922bde3b8e7`
para cwebp e `c549d49727bb6d06487114b0bfde6e56fdb2fbb8022201e1df1a03765778207a`
para dwebp. A repetição usou esses hashes; não altera os pins Linux do pacote.
XML local `worker-lifecycle-postgres-2026-10-27.xml`, SHA-256
`204bfe9aea7831c9235f27becaad85736e606dd604a2cea66340ea22298fe634`.
Os scripts Node também foram repetidos: 149 passaram e um opt-in foi pulado.

Na suíte global com PostgreSQL, `RenderingPersistenceTest` executou 89 casos.
O caso parametrizado de exclusão parcial cobre ACK e dois caminhos de ciclo de
vida: falha simulada em um objeto, tentativa dos demais, intenção pendente,
retry após 60 segundos e preservação de objeto ativo. Nesse caso o storage é
mockado; a prova não equivale a falha real de GCS. Na suíte opt-in, um upload
tardio não registrado foi criado no storage local e removido pelo failsafe
após uma hora simulada, inclusive quando a fase SQL falha. A mesma suíte usa
arquivos locais para confirmar retry de exclusão do original sem apagar os
resultados READY. Retenção/expiração também passou em 15 casos PostgreSQL.

### Associação dos manifests OCI — continuação de 2026-10-27

O verificador anterior aceitava um manifest legado composto pela configuração
de uma imagem e pelas camadas de outra, se ambos os blobs fossem alcançáveis
no mesmo índice. Uma fixture reproduziu a aceitação indevida; o verificador
agora exige que configuração e sequência de camadas correspondam ao mesmo
manifest alcançável. Os três testes passaram e os archives preservados do
builder, parent histórico e base corrigida foram revalidados.

O archive nativo portátil foi então substituído pelo arquivo `offline-worker-native-
verified-2026-10-27.tar.gz`, contendo o verificador corrigido e
os mesmos insumos fixados. Os hashes dos três insumos e do script foram
conferidos no archive, sem extração; seu README usa o caminho `tools/`. O
archive anterior de hash `22ee54ef38ea60f4313a9c4a0574e53764c13ca6b8762414246c75a3cbff91be`
foi removido a pedido do usuário para poupar espaço. O archive atualizado foi
extraído em diretório novo; seu verificador confirmou os dois archives OCI e
o rebuild do codec em container sem rede reproduziu o mesmo hash de manifesto
`bfe9572c3113f805c15634c8e3106b74a2b925735767424269b5e81fc46a3a58`.
A extração e o build temporários foram removidos após a conferência. O daemon
já possuía a imagem do builder; não é prova em daemon vazio ou outro host.
A primeira tentativa de empacotamento falhou ao resolver um `-C` relativo; o
arquivo parcial foi removido e o pacote válido foi criado em seguida.

### Archive portátil com base corrigida — 2026-10-27

O pacote então testado substituiu o archive `offline-worker-native-verified-
2026-10-27.tar.gz`, hash `49a8e1fa0b7b7196a33b47e3881244d7487c1e2b324e31efcc2a9159b64414b6`,
que continha somente o parent histórico e foi removido para poupar espaço. O
pacote novo contém o builder, fonte libwebp, archive da base Ubuntu corrigida,
prova readonly e scripts, incluindo o verificador OCI corrigido. O parent
histórico continua preservado separadamente para rastreabilidade.

Em diretório novo, os dois archives OCI e a prova foram verificados; o codec
foi reconstruído em container sem rede e o preparador do próprio pacote gerou
contexto `6a3f33eb4ba284ece37bd8e03085fddcfa4c7e635e0f11721ad837f9633cf2fc`.
O JAR usado foi uma cópia local conferida pelo hash, não uma nova reconstrução
Java nesta repetição. Build sem cache, pull ou rede nos passos passou no
preflight e gerou imagem local
`sha256:218fac18d0044f11df094b814653121611d901497f6695f1fbf949d4a4e77326`.
O worker nessa imagem passou em READY, downloads e ACK com cleanup; XML
`worker-proof-patched-portable-2026-10-27.xml`, SHA-256
`f3c4a97d9af613976a5302355f216b8a6e94a48ea9d37cde066d0f23a6c9aed0`.
Após a prova, a imagem temporária e a extração foram removidas. O daemon já
possuía as imagens necessárias; não é prova em daemon vazio. Não há afirmação
de OCI byte a byte, assinatura da distribuição, segurança do JRE ou admissão
operacional; publicação e defaults permanecem desabilitados.

### Montagem determinística — 2026-10-27

[Receita](../scripts/assemble-offline-native.py) e
[lock](offline-native-arm64-lock-2026-10-27.json) versionados fixam os hashes
dos scripts, Dockerfile, README e quatro insumos externos. O lock tem SHA-256
`d15b29f218076b49bc66a933acbe5857d3eef3a206d4db2b329108d9864419f2`.
A receita valida paths e hashes, rejeita nomes duplicados/traversal e saída
existente, fixa ordem, modos, UID/GID e timestamps e gera tar/gzip sem rede.
Calcula também o hash dos bytes lidos durante a cópia e verifica novamente os
insumos depois; falha após criar a saída pode deixar arquivo parcial, que não
constitui pacote válido. A regressão reproduziu alteração temporária restaurada
durante a cópia, que as verificações anteriores e posteriores não detectavam.

Duas montagens em destinos novos produziram SHA-256
`19446ac5b28951e295f99efdec61ec69d9860b294fd62a9990d5bd93675ad14a`.
O archive foi extraído em diretório novo: verificador OCI do próprio pacote
aprovou builder/base, o codec foi reconstruído sem rede e o contexto resultou
no hash `6a3f33eb4ba284ece37bd8e03085fddcfa4c7e635e0f11721ad837f9633cf2fc`.
O JAR foi cópia verificada e o daemon já possuía o builder. Três testes da
receita passaram, incluindo adulteração durante a cópia, traversal e saída
existente. Uma terceira montagem com o guard corrigido produziu o mesmo hash.
Não se afirma identidade entre versões diferentes de Python/zlib ou entre
hosts, nem nova aprovação operacional. O archive intermediário anterior de
hash `80c47c854d1cbb771f29092e19045ebe7c46d229721c6d9794688b7eb9a1f735`,
a segunda cópia e a extração foram removidos após as verificações.

Exemplo de montagem, com paths absolutos/canônicos e saída inexistente fora
das pastas de insumos:

```text
python3 scripts/assemble-offline-native.py <raiz-do-gateway> <insumos>
  <offline-native-arm64-lock-2026-10-27.json>
  d15b29f218076b49bc66a933acbe5857d3eef3a206d4db2b329108d9864419f2
  <archive-novo-absoluto>
```

O bloco representa um único comando. Após atualizar qualquer fonte da receita,
o lock precisa ser refeito e revisado; não se deve aceitar automaticamente um
novo hash. A prova das imagens e do worker permanece a da seção anterior.

## Imagem de teste

O [preparador local](../scripts/render-repro-image.mjs) recebe os mesmos
argumentos `--jar`, `--jar-sha256`, `--distribution`, `--manifest-sha256`,
`--platform linux-aarch64-glibc` e `--destination` do preparador original.
Ele verifica ambos os pins, prepara um diretório novo e inclui
[Dockerfile.repro-local](../Dockerfile.repro-local), o codec, o JAR e
`image-inputs.json` com o ID real do parent, sem executar Docker. O JAR desta
fotografia também está preservado como `gateway.jar` junto dos archives.

Conferir o ID do parent antes do build. Como `docker build` clássico recebe
uma tag, criar uma tag local exclusiva a partir do ID conferido; recusar uma
tag já existente e confirmar novamente seu ID antes do build. Usar
`--pull=false --network=none`, `RUNTIME_IMAGE` apontando para essa tag,
`GATEWAY_JAR_SHA256` para o JAR e `CODEC_MANIFEST_SHA256` para o pacote.
O primeiro build diagnóstico desta rodada produziu
`sha256:9b388f0a7eb2d1680f466a20d9d165060a5c1d429aef8413e134070abeceb313`;
a receita versionada produziu
`sha256:cfb22b702099051229cb59cd36d27d3bc9160349ec6902672ad8980be7c70682`.
Uma revisão posterior, com codec e metadata copiados do contexto reconstruído,
produziu `sha256:53cbed42631f5acbd8eff68e9e79f130a9b87a2141c861787450d5d3362c11d5`.
O ID da imagem é registrado separadamente: timestamps e metadados do builder
Docker não foram apresentados como reprodução byte a byte da imagem OCI.

O preflight `admitted-not-operational` comprova apenas JAR/codec/plataforma.
A assinatura do teste usa chave efêmera e servidor loopback exclusivo de teste;
não comprova IAM, GCS ou TLS operacional. O limite local de 8 GiB e os caps de
AS não são reserva atômica contra outras cargas ou admissão do limite cloud.

## Atualização diagnóstica Ubuntu e pacote offline — 2026-10-27

Uma base local derivada atualizou exclusivamente `libbrotli1` para
`1.1.0-2ubuntu0.1` e `zlib1g` para `1:1.3.dfsg-3.1ubuntu2.3`. O plano,
identidade e SHA-256 dos debs, inventário completo de pacotes e inventário do
JRE antes/depois foram conferidos pelo [preparador](../scripts/ubuntu-security-refresh.mjs).
O resultado é `sha256:befb9e4a225e7b5c98493f759d138275480e92c695319cffc158acd66b5cdff9`;
a prova local readonly tem SHA-256
`cf74729e761e995493ccb475609c3a3b0eef1fb5a8743e19fc00fbb629e2013d`.
O primeiro ensaio recusou o cache de pacotes preexistente antes de instalar;
a repetição usou `/tmp` isolado. A base anterior não foi alterada.

Com Trivy 0.76.1 e o mesmo banco offline, a comparação do scan de OS do worker
anterior com o da nova base encontrou 30 para 28 ocorrências (24 para 22 CVEs),
sem novas entradas de OS; apenas os dois achados corrigíveis acima saíram.
São alvos distintos (worker e base), e o JRE/codec não foram avaliados nessa
comparação. Permanecem 24 ocorrências médias e quatro baixas na base. O JRE
permanece inalterado; isso não é aprovação de segurança nem de produção.
O JSON e a prova ficam em `.local/worker-isolation/repro-020-2026-10-26/`
`security-refresh-retry-2026-10-27/`.

O [lock](offline-native-security-refresh-lock-2026-10-27.json) SHA-256
`b15411d3cff6fcd5ce32faa9d9657fd4e260abe68e50a993db15f9a4b4d8229f`
fixa esta receita separadamente da histórica. Duas montagens limpas produziram
`038515abda6daeab46c1258b1927f9a390bdc9564ee64fea24c9b81027b2e2c3`.
A extração validou integralmente ambos os arquivos OCI, recompilou o codec sem
rede e preparou contexto com SHA-256
`0ee0f06d5a143e2373676e173f3298a43791e3ffc36163ebfbf904363ba7a005`.
O daemon ainda possuía as imagens locais verificadas: isso prova reconstrução
com insumos portáteis extraídos, não um daemon vazio independente. O JAR é insumo
externo ao pacote nativo. A imagem diagnóstica foi construída sem rede e tem ID
`sha256:f6bafc617a13f019b20c602c3fd858b138697144ce931d502a3d3c208a066c36`;
IDs OCI não são apresentados como reprodução byte a byte.

Os dois testes ARM64 com PostgreSQL local passaram: página sintética READY,
download privado íntegro de WebP e manifesto, dois ACKs, uma intenção e limpeza;
a falha controlada de memória terminou sem resultados parciais, seguida de nova
página READY. O XML preservado tem SHA-256
`f25a4333ce4c429a8b01d62af762ece3f08c7cdf24c7b5c653e9f12a16062bbe`.
A URL já emitida ainda é utilizável entre ACK e cleanup assíncrono; a prova de
cleanup não resolve essa janela. Os testes Node das receitas passaram (151,
um opt-in ignorado). Nenhuma publicação ou provider foi habilitado.

### Hash fixo dos debs antes da instalação

O perfil de atualização agora exige, antes da instalação, que cada deb tenha o
SHA-256 fixado na receita **e** corresponda aos metadados apt autenticados. A
regressão verifica os dois pacotes e rejeita hash alterado mesmo quando os
metadados e o arquivo alterado concordam. A prova de base da seção anterior
já registrava esses mesmos hashes; esta mudança reforça a receita e não altera
ou reaplica a base. O renderizador também usa os pins da mesma política.

O [novo lock](offline-native-security-refresh-lock-v2-2026-10-27.json) tem
SHA-256 `06a42c09fb84fce47abd268ba595bdb145bd691c64dba84764a98dc4cca8b11a`.
Duas montagens geraram
`5e1cfcdc361656251a3a59dab3e89f853b6df3b85188cc691ef24ae9372378cf`;
o verificador extraído aceitou o hash fixado e recusou uma substituição,
e o contexto preparado reproduziu o hash anteriormente registrado. O pacote
anterior `038515ab...` foi removido após a comparação para liberar espaço; seu
lock e as provas históricas permanecem. O novo arquivo preservado é
`offline-native-security-refresh-pinned-2026-10-27.tar.gz` no diretório local
de insumos. Node: 152 testes passaram, um opt-in ignorado. Não houve novo build
da imagem, mudança do JRE ou teste com daemon vazio nesta rodada.

## JAR atualizado e timestamps do pacote — 2026-10-28

O pacote Java histórico precedia as alterações de ACK e storage. Uma nova
fotografia contém os seis fontes alterados e reproduziu o JAR do worker atual,
SHA-256 `569f649ff2a4dcca9e433eeb5f70f6dafb2b87b0dd39ae4af3e58616b28b0070`,
com checkout e cache Maven bloqueados e rede desabilitada. A prova não compilou
testes, não usou outro host e não substitui testes ou aprovação operacional.

A primeira montagem normalizou todos os tempos para zero. O Maven terminou,
mas o JAR resultante `4578dfd33600402a1db19e10c32e7a17b57c3b7f0720989b4072367c03ae135d`
foi recusado pelo verificador: entradas de dependências incorporadas tinham
metadados de tempo diferentes. Preservar os tempos dos insumos corrigiu a
reconstrução. O lock v2 inclui timestamps de arquivos em segundos e o
verificador mantém compatibilidade de leitura com o lock v1; sete testes Python
passaram, incluindo timestamp alterado e lock legado. Essa granularidade não
cobre toda precisão de timestamp; o hash final do JAR permanece obrigatório.

O [novo lock](worker-offline-build-lock-2026-10-28.json) tem SHA-256
`f1c447219f8089383551f0f628d1edcc72bdc1176b600eceafc560163cfdae14`.
Duas montagens locais do pacote tiveram SHA-256
`d126c06e1d9cd5b0c0ee7ae1b22330fadfce2b2124123902e48c4486702249ab`.
A extração do arquivo final, preservando os tempos, foi revalidada e recompilou
o mesmo JAR, bloqueando checkout, cache Maven e diretório de montagem. O arquivo
está em `.local/worker-isolation/repro-020-2026-10-26/` com nome
`offline-worker-java-current-darwin-arm64-2026-10-28.tar.gz`; os registros da
rejeição e da repetição estão em `java-repro-2026-10-28/`. Os arquivos e locks
históricos permanecem distintos e não são a fonte atual.

## Composição dos pacotes atuais — 2026-10-28

Os archives Java `d126c06e1d9cd5b0c0ee7ae1b22330fadfce2b2124123902e48c4486702249ab`
e nativo `5e1cfcdc361656251a3a59dab3e89f853b6df3b85188cc691ef24ae9372378cf`
foram extraídos na mesma execução local. Os dois archives OCI internos foram
verificados contra hashes e IDs. O JAR foi reconstruído offline com checkout e
cache Maven bloqueados; o codec foi reconstruído a partir da fonte verificada
em container sem rede. Os hashes do JAR e manifesto foram, respectivamente,
`569f649ff2a4dcca9e433eeb5f70f6dafb2b87b0dd39ae4af3e58616b28b0070` e
`bfe9572c3113f805c15634c8e3106b74a2b925735767424269b5e81fc46a3a58`.
O contexto obtido tem SHA-256
`c10878e713920c3f7b82d42824e986926d17ed0fcd01db500c161aede44775df`,
igual ao usado na prova integrada anterior do worker da seção de ACK. Não foi
feito novo build de imagem nesta repetição; o daemon já possuía as imagens
locais e o JRE segue sem aprovação de segurança. O log Maven tem SHA-256
`ce462c5da83e8b1e097294df321f9ea2186c61586835a8f5699635e6e7bac94f` e está
em `.local/worker-isolation/repro-020-2026-10-26/combined-offline-2026-10-28/`.
Não é teste em outro host, daemon vazio ou admissão operacional.

## JAR após correção de retenção — 2026-10-28

O JAR `132e00c53f8d423585283c52cda3165b387a717f0861bcd5db141aa152119879`
foi reconstruído offline, sem checkout ou cache Maven, antes e depois de extrair
o archive atualizado. O lock
[retention](worker-offline-build-lock-retention-2026-10-28.json) tem SHA-256
`86be7cf8efa2611171f7ab8f4251b341a7b33ffb368066757c69b6960b86a1fa`;
duas montagens do arquivo produziram
`907db7bdbeeaa982f3ce3f4b4b7592b92dfef2d6cbad739446d6847cc706af94`.
O archive está em `.local/worker-isolation/repro-020-2026-10-26/`
`offline-worker-java-retention-2026-10-28.tar.gz`. A galeria visual desta
rodada usou a imagem local anterior com outro JAR, registrada separadamente;
nenhum resultado dessa imagem foi transferido silenciosamente para este JAR.

## JAR após guard de leitura — 2026-10-28

Após a verificação do prazo em cada bloco, o JAR tem SHA-256
`e0b0b7dd1c22e647673435e8a84b5a1e9bea62aa0fda06bbdd92af2103ffcd93`.
O [lock](worker-offline-build-lock-stream-2026-10-28.json) tem SHA-256
`727c64e913f013c63e13b5c681a4fcbbea8842a1fa20ab78d6ae8033f1d1c696`.
Duas montagens do archive produziram
`d891de0f783ff48ae0f48bef5f91404d700e45613cbd999e068faaf83f9cc96f`;
uma foi preservada em `.local/worker-isolation/repro-020-2026-10-26/`
`offline-worker-java-stream-2026-10-28.tar.gz`. A construção isolada e a
repetição após extração em diretório novo reproduziram o JAR com rede, checkout
e cache Maven bloqueados. A prova é local macOS ARM64, não outro host.

## JAR após conferência antes da abertura — 2026-10-28

O JAR atualizado tem SHA-256
`daf71ef92af80cc573aa11a848e14b03adda88535aa1a8c77e4c119bd6eace65`;
o [lock](worker-offline-build-lock-key-2026-10-28.json) tem SHA-256
`b90c7ba6842d129fbf91e95859db1328a1310eac42ff180897578e6d535bd1de`.
Duas montagens do archive produziram
`ba0f6fed4dca654fc69b94b5317bfac6ddc8668c8542f86f08420540eb6ceb9d`;
uma foi preservada em `.local/worker-isolation/repro-020-2026-10-26/`
`offline-worker-java-key-2026-10-28.tar.gz`. O build isolado e a reconstrução
após extração em diretório novo bloquearam rede, checkout e cache Maven e
reproduziram o mesmo JAR. A imagem da prova anterior contém outro JAR; não foi
reconstruída nesta rodada nem usada como prova da alteração posterior.

Uma repetição posterior construiu sem rede a imagem ARM64 local
`sha256:629a1280a127223c4cf8f13caf0cddd8380eb44b2bd89425f1801ce87f78df76`
com este JAR e o codec pinado. As provas pontuais de entrega privada/ACK e de
falhas de memória e scratch passaram com providers sintéticos; o XML em
`.local/worker-isolation/repro-020-2026-10-26/current-worker-2026-10-28/worker.xml`
tem SHA-256 `a55b7780b8959ea8d63a250db25885d60e865b89d986db428441b2ff0b07a86d`.
Não é aprovação de segurança, operação cloud ou retenção física.

## JAR com sinal de deadline — 2026-10-28

O JAR atualizado tem SHA-256
`d49b970de2608c815e1df24dde8027bc20e6b0a0af040061eb1b8dc0d8e36bb2` e o
[lock](worker-offline-build-lock-watchdog-2026-10-28.json) tem SHA-256
`e5c3404a440fa9a344b499e303269485a187453412b0bf66fe243c4f493da178`.
Duas montagens do archive produziram
`0d71fb73577d02eb34167b219e0cb3dc373d3fc11a9e788568ae252c0339eb4e`.
Uma está em `.local/worker-isolation/repro-020-2026-10-26/`
`offline-worker-java-watchdog-2026-10-28.tar.gz`. O JAR foi reconstruído após
extração em diretório novo com rede, checkout e cache Maven bloqueados. A prova
é local em macOS ARM64 e não demonstra reconstrução em outro host.

A imagem local ARM64 `sha256:5ff6afd5fec0a66f2eb1dc8c6763cb263ddea1586997a0874a61fd38a4234d8e`
com este JAR passou nas três provas de entrega privada/ACK e falhas controladas
de memória e scratch. O XML em `.local/worker-isolation/repro-020-2026-10-26/`
`read-watchdog-2026-10-28/image-tests.xml` tem SHA-256
`899958512db3969ac16f4be6d2444cc55da67f7810a8392cb3b18c0683197b9e`.
Providers e transporte da prova são sintéticos; não é admissão operacional.

## JAR com retry limitado de limpeza — 2026-10-29

O JAR tem SHA-256
`f2338b783950362e0444ea8ccc7ae39f6c3bbbdb8821035093aa9ac4838191c0` e o
[lock atual](worker-offline-build-lock-bounded-cleanup-2026-10-29.json) tem
SHA-256 `b668ca6b2dd2fac6ea29ffc7750fd0dce67aace323fdfe6251bc220e70bd49cc`.
Duas montagens do archive produziram
`1605dce8b206eea3d9ce56e8e5041c5cec3c997db8892d24736f3d58922aed42`;
uma está em `.local/worker-isolation/repro-020-2026-10-26/`
`offline-worker-java-bounded-cleanup-2026-10-29.tar.gz`. O JAR foi reproduzido
após extração com rede, checkout e cache Maven bloqueados. O lock
`worker-offline-build-lock-cleanup-2026-10-29.json` anterior foi preservado e
descreve uma fotografia intermediária anterior ao limite de referências.

A imagem local ARM64 `sha256:813bcdba1785f773aefa8ae83c83964bdf475385616cebd0247eb9c6d8d8fc0a`
passou nas provas sintéticas de entrega privada/ACK e falhas de memória e
scratch; XML `local-delete-failure-2026-10-29/image-tests.xml`, SHA-256
`5eeefb730d91bb25b7ea94ad6063cdbb70c3e49ad5d03cb491d35cdc5845c7c0`.
Não é admissão de operação externa, segurança ou retenção física.

## JAR intermediário com estado por processo — 2026-10-29

O JAR `df43e3606235470989b213b517e05636ed8237ecf8ae492b439406c4588acea7`
foi reproduzido após extração com rede, checkout e cache bloqueados. O
[lock](worker-offline-build-lock-process-cleanup-2026-10-29.json) tem SHA-256
`23436df0e1e2391647a51fa72b9d6199d7770ae3d51760eac46d9c91604cbe9b`;
duas montagens do archive produziram
`f5ce0bd902d1a7efb1f689dfa9791de7a6efc4d617aa1e71aa29c491138b127d`.
Uma está em `.local/worker-isolation/repro-020-2026-10-26/`
`offline-worker-java-process-cleanup-2026-10-29.tar.gz`. Esta fotografia é
anterior ao retry durante ociosidade; sua imagem intermediária foi removida.

## JAR com retry ocioso — 2026-10-29

O JAR atual tem SHA-256
`59326c5827c3237b7dcfb3a5c4f811922cafac7bbb63b5da47dd5ffc2a191325` e o
[lock](worker-offline-build-lock-idle-cleanup-2026-10-29.json) tem SHA-256
`2b1f2b6f31bc555a14d624a82a91e8f55df3d33f008df99fd167bbb7a346a737`.
Duas montagens do archive produziram
`cf36839382b424a872e84fb22e7c553f7453bacd6f199f17122d48438dded198`;
uma está em `.local/worker-isolation/repro-020-2026-10-26/`
`offline-worker-java-idle-cleanup-2026-10-29.tar.gz`. O JAR foi reconstruído
após extração com rede, checkout e cache Maven bloqueados.

A imagem local ARM64 `sha256:85995ba5926d6dc118b39584481514bb59b2e0c0bd3a6febaaf54cd278c65760`
passou nas provas sintéticas de entrega privada/ACK e falhas de memória e
scratch. O XML `local-delete-failure-2026-10-29/idle-image-tests.xml` tem
SHA-256 `5cf04b9561c77951d19e2c1328e38d4356a3782a579d55645758e5c010f806bc`.
A prova não admite operação cloud, retenção física ou qualidade em página real.
