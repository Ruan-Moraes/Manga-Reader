# Revisão prévia do diagnóstico cloud — 2026-10-12

Complemento do [roteiro operacional](rendering-cloud-validation.md). Parcela
local/pública, sem gcloud, credenciais, downloads, instalações, push ou recurso
cloud. Não é scan atualizado nem aprovação de segurança/operação. 020 continua
`in-progress/open`, 021 bloqueada. Arquivos de performance preservados.

A parte inicial preserva a revisão anterior ao download. A varredura posterior,
autorizada com remoção da base ao final, está registrada abaixo; não
substitui os relatórios históricos nem concede aprovação de publicação.
O aceite posterior do custodiante está na seção final: restrito ao risco do
diagnóstico, sem aprovação de produção ou autorização de ação cloud/cobrança.

## Identidade e integridade verificadas

Alvo exclusivo do diagnóstico, diferente do worker Spring/Ubuntu:
`sha256:cf73e5c4241a96a095dcec030296dfea3269a3c50d6152466a09802fe17b0c02`.
Inspeção Docker local confirmou Linux amd64, UID `1000:1000`, entrypoint Java
direto, ausência de ExposedPorts/ONBUILD e tamanho descompactado de 145.905.173
bytes. Não é digest publicado ou medida de bytes faturáveis no registry.

Oito classes no contexto local e fonte atual do probe conferidas contra o
recibo de construção. Fonte SHA-256:
`cf1333b84776a298cf4206b0b9e518b99c67c38f88286ebc3e42a35dcc711a11`.
Artefatos históricos revalidados, sem regravação:

| Artefato             | SHA-256                                                            |
| -------------------- | ------------------------------------------------------------------ |
| Export da imagem     | `7f73fe0fe203ea1b37bd0d57a3da135f351afb3beca870bc4866eedc87c19ca5` |
| Scan de 10/10        | `89b27cc4c90c2d2fed0da704498e499128680c46bdc9c283022e4b9c9fa54aba` |
| Probe local de 10/10 | `a4d36e104cc7db373473da49cb0a6ac94a9c1b8949f5f972874aca730d0c922c` |

O config do export/scan é
`sha256:9f19c1a43220798038bd89702b2d4ce8a64a8fe4acbcc6f8e5be13d98c5046bd`;
é vinculado pelo recibo ao ID local, não outro alvo. A primeira inspeção via
Go template falhou porque ExposedPorts era campo ausente; JSON conferido em
seguida, sem alterar a imagem. Não tratar o erro inicial como porta existente.

## Scan histórico não aprova publicação atual

Captura de 10/10: 108 pacotes Ubuntu, 16 ocorrências/10 CVEs únicos, 12 MEDIUM
e quatro LOW na severidade escolhida pelo scanner. Nenhuma FixedVersion nessa
captura; zero resultados de aplicação Java. Isso não cobre integralmente o
Temurin nem comprova ausência de vulnerabilidades ou atualizações disponíveis.
Não transferir o scan posterior do worker para este pacote de diagnóstico.

A base OS ainda disponível localmente tinha próximo update em
2026-10-12T13:06:05Z, anterior à revisão iniciada às 15:34:50Z. Está vencida
para uma nova rodada. O índice Java vence em 2026-10-13T00:59:51Z; deve ser
reconferido antes de usar. Não foi executado scan com base vencida nem atualização
automática. O cache antigo removido na limpeza não foi reconstruído.

Consulta pública às fontes Ubuntu separa prioridade do distribuidor de CVSS:
PCRE2 aparece MEDIUM no scan, mas as páginas oficiais apresentam CVSS HIGH
para [CVE-2026-86145](https://ubuntu.com/security/CVE-2026-86145)
(8,2) e [CVE-2026-89161](https://ubuntu.com/security/CVE-2026-89161)
(7,4). Não corrigir a captura histórica nem concluir que não existe risco alto
a partir de sua coluna de prioridade. A segunda página mantém Noble vulnerável;
nenhuma correção de pacote foi instalada nesta revisão.

### Triagem preliminar, não waiver

| Grupo do scan histórico      | Condição descrita pela fonte primária          | Pendência                                                                                      |
| ---------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| glibc — CVE-2026-18374       | Modo `fopen` com `ccs` controlado por atacante | Demonstrar alcance no runtime, não presumir segurança por ausência de endpoint                 |
| glibc — CVE-2026-89092       | nscd ativo com resposta DNS maliciosa          | Probe não inicia daemon; configuração/alcance precisam de prova própria                        |
| expat — CVE-2025-66382       | Custo excessivo ao processar arquivo malicioso | Revisar parsing/carregamento indireto; Noble indica correção adiada                            |
| pcre2 — CVE-2026-86145/89161 | Falhas em DFA/JIT sob condições específicas    | Alcance e correção atual pendentes, sem mudar filtros                                          |
| systemd — CVE-2026-40228     | journald/ForwardToWall e escapes ANSI          | Não inferir comportamento do daemon pela presença de bibliotecas                               |
| zlib — CVE-2026-85091        | Falha em operações gzip específicas            | CVSS HIGH; nota upstream/versões afetadas requer revisão, não deduzir só pelo número instalado |
| shadow — CVE-2024-56433      | Conflito de UIDs/subuid em contexto de rede    | Descrição consultada; status Noble não confirmado nesta tentativa                              |
| tar — CVE-2026-18477/18508   | Consulta direta indisponível                   | Não inventar causa, patch ou decisão de não aplicabilidade                                     |

Fontes diretamente consultadas:
[glibc/fopen](https://ubuntu.com/security/CVE-2026-18374),
[glibc/nscd](https://ubuntu.com/security/CVE-2026-89092),
[expat](https://ubuntu.com/security/CVE-2025-66382),
[systemd](https://ubuntu.com/security/CVE-2026-40228),
[zlib](https://ubuntu.com/security/CVE-2026-85091),
[shadow](https://ubuntu.com/security/CVE-2024-56433).
Para shadow, descrição confirmada pelo resultado primário da busca; abertura
direta falhou. As páginas tar falharam na abertura direta. Nenhuma evidência
de fórum/terceiro foi usada para preencher essas lacunas.

Contexto limitado do probe: sem HTTP, mídia, provider, arquivos fornecidos por
usuário ou execução de comandos recebidos. Isso reduz entradas pretendidas,
mas **não** prova inexploitatibilidade das bibliotecas, runtime ou sandbox.
Não gerar VEX de não afetado, remover pacotes ou conceder exceção automática.
Revisão de base mantida também não equivale a scan completo do runtime.
[Suporte Temurin](https://adoptium.net/support/).

## Cotação regional: tentativa inconclusiva

Página oficial de [Cloud Run](https://cloud.google.com/run/pricing) consultada
em 12/10. No navegador público, a tabela Jobs continuou selecionada em Iowa:
o seletor não expandiu após interação nativa, Space ou click Playwright.
Inspeção DOM confirmou `aria-expanded=false`; nenhum erro de console retornado.
Não houve uso de conta ou alteração de recurso. A API documentada foi usada,
sem inspeção de estado interno ou bypass de controles.

A tarifa visível de Iowa não foi apresentada como cotação de São Paulo.
Os números regionais de 10/10 no histórico continuam datados, sem alegar
reconfirmação atual. Antes de qualquer ação financeira, confirmar por seletor
funcional ou fonte oficial regional verificável, moeda e orçamento aceito.

Armazenamento público do [Artifact Registry](https://cloud.google.com/artifact-registry/pricing)
permanece USD 0,000136986/GiB-hora acima da faixa gratuita de 0,5 GiB-mês por
conta; saldo gratuito não consultado. Exemplo bruto: 0,15 GiB por 24 h ≈
USD 0,00049315, sem transferência/scanner/impostos. Não equiparar o tamanho
descompactado do Docker a 0,15 GiB armazenados ou usar esse exemplo como teto.

## Decisão e próxima ação

Integridade local verificada; publicação **bloqueada** por scan atualizado,
cobertura/alcance e revisão ainda pendentes. Cotação regional e aceite financeiro
também pendentes. Nenhum waiver, autorização de custo, push, grant ou Job.

Proposta antes do novo scan: pedir autorização para adquirir **somente a base
OS oficial do Trivy**, em cache local exclusivo ignorado pelo Git, reutilizando
scanner e índice Java existentes se ainda válidos. O banco OS atual expandido
ocupa aproximadamente 1,5 GB; tamanho da próxima versão deve ser conferido,
sem prometer um limite exato. Não adquirir nova imagem, scanner ou pacote de
sistema; não consultar Google/credenciais nem enviar a imagem. Preservar relatórios
e arquivos de performance, controlar espaço e interromper se exceder o escopo.
Esse download não foi iniciado e depende de aprovação específica.

Registro privado exclusivo `review.json` contém hashes, inspeção, findings
históricos e recusas; não substitui recibos anteriores. Nenhum runtime, fonte,
migration, Terraform, checksum técnico/SDD ou status de produto foi alterado.

## Base atualizada, scan e descarte confirmado — 2026-10-12

Ruan autorizou «Sim, mas depois remover». Somente a base OS foi adquirida;
scanner 0.75.0 e índice Java existentes foram reutilizados, sem novos pacotes,
imagens, binários, credenciais Google ou recursos cloud. Nenhuma execução da
imagem, provider, push ou mudança de IAM. Dados/arquivos de performance intactos.

A primeira aquisição pelo Trivy terminou exit 1 após três minutos, por
`context deadline exceeded`; nenhum scan iniciado. Cache/tmp/config temporários
removidos nessa tentativa, com recibo separado, sem substituir o erro por sucesso.

O mesmo artefato foi obtido diretamente em JavaScript pelo GHCR/CDN GitHub,
sem ferramenta adicional. Autorização anônima do registry somente em memória,
nunca publicada/persistida; nenhuma credencial do usuário. Manifesto fixado e
corpo conferidos por SHA-256, depois blob comprimido conferido integralmente.
Assinatura independente não verificada; HTTPS/hash não equivalem a essa prova.

- Manifesto OCI: `sha256:b49a9c5cd32fac41a782c7266155447fb600dbe5b48d7c1c53bfc66a0e96e9ca`.
- Blob: `sha256:da598de31aca09a317194f3e1ad07577e999fb15e3c7872b71cfec6d4688869d`,
  133.016.124 bytes comprimidos.
- Banco OS expandido: 1.606.103.040 bytes, SHA-256
  `b54be7a816b103cc3a0a82765e7b7ef6f4397608a68752da1717e5ef7a6b11be`.
- Metadata original: Version 2, UpdatedAt 12/10 13:18:23 UTC,
  NextUpdate 13/10 13:18:23 UTC. DownloadedAt zero preservado, sem adulterar
  datas; aquisição registrada separadamente. Válido durante todo o scan.

O tar existente do macOS listou somente dois membros regulares, tamanhos
limitados, `metadata.json` e `trivy.db`, antes de extrair em diretório exclusivo.
Nenhum código do pacote executado. Índice Java copiado localmente, hash
`6c1859b93bb33ff808b5b02eb31f1e79b91a521d3aec2af92fdb0368d4abe699`,
sem download; prazo/hash novamente conferidos antes/depois da leitura. Arquivos
dos bancos readonly durante scan; fontes originais e metadata não modificadas.

Scan configurado offline, input do export já pinado, config `{}` e ignorefile
vazio, sem suppressions/filtro de severidade/ignore-unfixed/VEX. Updates OS/Java,
checks, VEX/version-check e telemetria desabilitados. Sem socket Docker ou
ambiente de credenciais. Essa configuração não é prova de bloqueio de rede
no kernel. [Opções oficiais](https://trivy.dev/docs/latest/references/configuration/cli/trivy_image/).

Rodada válida: 16:01:24–16:01:26 UTC, exit 0. Config do alvo coincide com o
export anterior. 108 pacotes, 16 ocorrências em 10 CVEs: 12 MEDIUM/quatro LOW,
nenhum tuple CVE/pacote/versão/fix/severidade acrescentado ou removido em relação
à captura de 10/10. Nenhuma FixedVersion reportada. Isso não prova inexistência
de patch ou exploração; distinção prioridade/CVSS acima continua aplicável.
Somente resultado `os-pkgs`: cobertura integral do Temurin permanece pendente.
Zero HIGH/CRITICAL nesta classificação não é aprovação de segurança.

Relatório novo SHA-256:
`7f06cafb668a5f30000cbd16180efc154892c143e484eecffae04a23988ee46e`.
Recibo exclusivo da rodada:
`9e1cca452e74321b6acff92573a41f8d77e4d8a58a9418fc24b3d86c470c59fa`.

**Descarte concluído às 16:01:31 UTC:** sete arquivos temporários removidos,
3.289.893.729 bytes lógicos, incluindo banco OS, arquivo comprimido, cópia Java
e cache de análise. `cache`, `tmp` e `registry-config` ausentes, conferidos
independentemente. Não equiparar bytes lógicos ao ganho físico: a cópia Java
pode compartilhar blocos APFS e o volume tem outras atividades. O scanner,
export/imagem, índice Java original e relatórios permanecem íntegros.
Recibo de descarte:
`d24b6822258a76732449c1e0f15e424f6a15b5eff176d78bf23ec596ad3d8265`.

Somente cerca de 0,5 MB de relatório/metadata/recibos/script permanecem nessa
rodada local ignorada. Recuperar a base descartada exige nova aquisição
autorizada do digest; não alegar que ainda está cacheada. Nada foi removido
da auditoria de performance. Cotação regional, alcance/cobertura/revisão de
segurança e decisão de publicação permanecem abertos; nenhum gate promovido.

## Triagem complementar e tarifa regional confirmada — 2026-10-12

Continuação local e pesquisa pública, sem credencial Google, download de
dependências/base, alteração de imagem, push ou recurso cloud. O download da
base descartada **não** foi repetido. Fonte completa do probe relida; SHA-256
permanece `cf1333b84776a298cf4206b0b9e518b99c67c38f88286ebc3e42a35dcc711a11`.
Não houve alteração de fonte, performance, runtime, Terraform ou gate.

### Inspeção limitada da candidata

Shell local na imagem pinada acima, entre 16:37:46 e 16:37:47 UTC, exit 0:
`--pull=never --platform=linux/amd64 --network=none --read-only
--user=1000:1000 --cap-drop=ALL --security-opt=no-new-privileges
--pids-limit=32 --memory=128m --memory-swap=128m --cpus=1`.
Entrypoint substituído **somente nessa inspeção** por `/bin/sh`, sem mounts do
host; a imagem/entrypoint persistidos não mudaram. Não executou o probe Java,
renderer ou worker. Não apresentar os limites dessa inspeção como configuração
cloud ou prova de admissão nativa.

| Caminhos consultados                                                 | Resultado |
| -------------------------------------------------------------------- | --------- |
| `/usr/sbin/nscd`, `/usr/bin/nscd`                                    | Ausentes  |
| `/usr/lib/systemd/systemd-journald`, `/lib/systemd/systemd-journald` | Ausentes  |
| `/usr/bin/newuidmap`, `/usr/bin/newgidmap`                           | Ausentes  |
| `/usr/bin/tar`                                                       | Presente  |

São sete testes de existência, não busca completa do filesystem, processo
traceado, análise dinâmica de bibliotecas ou prova de inexploitatibilidade.
O fonte não inicia daemon, comando externo, parser de arquivo fornecido,
XML, gzip ou regex PCRE2; leituras pretendidas são controles locais fixos,
limitados em bytes. Isso delimita a superfície pretendida, **não** a totalidade
do comportamento nativo do JDK. Recibo privado `local-paths.json`, SHA-256
`e79c7c52258922c7087998f9d6e40fdbf9fd6b48602a6e5fcbacf49a0ac0320b`.

Os registros OSV públicos da Canonical preencheram as lacunas das consultas
anteriores, sem apagar aqueles erros:

- [tar/CVE-2026-18477](https://raw.githubusercontent.com/canonical/ubuntu-security-notices/main/osv/cve/2026/UBUNTU-CVE-2026-18477.json):
  race em restauração incremental; não exige arquivo adulterado. Diretório novo
  ou ausência de `-P` não mitigam por si. O diagnóstico não faz backup/restore,
  mas o pacote permanece presente e afetado na declaração Noble consultada.
- [tar/CVE-2026-18508](https://raw.githubusercontent.com/canonical/ubuntu-security-notices/main/osv/cve/2026/UBUNTU-CVE-2026-18508.json):
  extração `--one-top-level`, hardlinks e symlink preexistente permitem escapar
  da fronteira. Não há extração pelo probe; não declarar o GNU tar seguro.
- [shadow/CVE-2024-56433](https://raw.githubusercontent.com/canonical/ubuntu-security-notices/main/osv/cve/2024/UBUNTU-CVE-2024-56433.json):
  sobreposição de UIDs/subuid em ambiente administrado, incluindo uso de
  `newuidmap`. Declaração Noble inclui login/passwd da versão reportada no scan;
  helpers ausentes nos caminhos consultados não eliminam todas as condições.

Nas três entradas Noble consultadas não há evento `fixed`. Nenhum patch,
supressão, VEX de não afetado ou aceite de risco foi aplicado. Hashes dos corpos
primários/datas e extratos Noble estão no registro privado exclusivo; não
substituir ausência de evento por conclusão universal de patch inexistente.

### Runtime Java: suporte não equivale a cobertura de scanner

A [tabela oficial Adoptium](https://adoptium.net/support/?jvmVariant=hotspot)
consultada apresenta Java 25 LTS, `jdk-25.0.4.1+1` como release corrente e
25.0.5 prevista para outubro. A versão registrada da candidata coincide com
esse release; não foi instalada atualização. O
[anúncio CSPU](https://adoptium.net/en-GB/news/2026/09/eclipse-temurin-8u504-110321-170201-210121-25041-26021-available)
identifica 25.0.4.1+1 como atualização de segurança. A página de notas específicas
retornou somente «Loading release notes», sem lista verificável de fixes;
não inventar correspondência CVE/fix a partir desse carregamento incompleto.

Isso verifica manutenção/versão anunciada, não atestação do binário, cobertura
integral do JDK nem zero CVEs. Recibo histórico de imagem continua sendo a
fonte da versão instalada. A lacuna do scanner `os-pkgs` permanece explícita.

### Jobs em São Paulo, sem consulta de billing

Fonte: [preços públicos Cloud Run](https://cloud.google.com/run/pricing?hl=en),
HTTP 200 em 16:37:42 UTC. Em vez de repetir o seletor que falhou, JSON público
embutido no HTML foi lido com `JSON.parse`, **sem eval ou execução de scripts**.
Uma única seção identificada `jobs`, título Jobs, contém duas tabelas São Paulo:
default e descontos. Região, moeda, unidade e primeira coluna coincidem em
ambas; não usar tarifa de Services, Delayed Jobs ou Iowa.

| Recurso                 | Default USD — `southamerica-east1` |
| ----------------------- | ---------------------------------- |
| CPU por vCPU-segundo    | 0,0000216                          |
| Memória por GiB-segundo | 0,0000024                          |

Para **uma task, 2 vCPUs e 8 GiB**, computação bruta:
`segundos faturados × (2 × 0,0000216 + 8 × 0,0000024)`.
60 s ≈ USD 0,003744; 180 s ≈ USD 0,011232. Não presume free tier/CUD,
nem mede duração faturada real; startup/encerramento podem acrescentar tempo.
Sem registry, rede, logs, impostos ou moeda da conta. Não é teto de cobrança
ou cotação da stack SQL/GCS/Tasks completa.

Recibo privado com trechos/tabelas originais, método, hash do HTML e cálculo,
`pricing.json`, SHA-256
`405699f30feb9a43f410db339afbc8ab11703a3ec47e0e2a5a3fe13744e938a6`.
HTML de aproximadamente 3,4 MB mantido só em memória; nenhum cache grande
recriado. Artefatos desta triagem ocupam apenas dezenas de KB.

### Decisão corrente

Tarifa regional e triagem das consultas pendentes entregues; scan atualizado
permanece válido no escopo/data já registrados. **Publicação não aprovada**:
há achados residuais, cobertura incompleta do runtime e ausência de aceite
restrito pelo custodiante. Não confundir resultado do diagnóstico com segurança
do worker ou operação aprovada da 020.

O advisory OpenJDK de 18/08 e seu índice retornaram HTTP 403 nesta pesquisa.
A página Oracle 25.0.4.1 confirma o baseline dessa família, mas não é prova
binária do Temurin; nenhuma fonte secundária preencheu a lacuna. Não repetir
loops de consulta ou instalar ferramenta para transformar essa lacuna em PASS.

Próxima decisão proposta: **aceite explícito do risco residual somente para
diagnóstico temporário**, identificando essa candidata, achados e cobertura
incompleta. Não é condição já aprovada. Limites da proposta: sem mídia, banco,
provider, endpoints ou papéis de dados, identidade exclusiva e retirada
registrada. Esse aceite não se estende à produção, não remove guards e não
autoriza nova tecnologia ou correção por supressão. Se não aceito, manter
publicação bloqueada e revisar outra base/pacote em incremento aprovado.
Registry/push, conta/IAM, Job e execução financeira continuam sujeitos à
aprovação específica. Nada disso ocorreu nesta parcela.

### Verificação desta continuação

Os 419 arquivos da fotografia técnica novamente conferidos por tamanho e
SHA-256, sem divergência: fotografia
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`.
Sete links locais nos dois documentos operacionais conferidos; script privado
JS validado por `node --check`, coleta pública e inspeção local concluídas
exit 0, com asserts de identidade/seção/região/moeda/tabelas/hash do fonte.
Esses asserts não são teste do renderer ou scanner de vulnerabilidades.

Formatação apenas deste documento ajustada após `prettier --check` apontá-lo;
sem formatação global ou mudanças alheias. Rechecagem direcionada e
`git diff --check` do módulo aprovadas. Maven/mobile/web não reexecutados
nesta continuação documental, nenhum resultado anterior redatado. Artefatos
privados pequenos preservados para rastreabilidade; nenhuma nova limpeza
destrutiva, dependência instalada ou credencial utilizada.

## Aceite restrito e preparação de publicação — 2026-10-12

Ruan respondeu **«Aprovo.»** à pergunta sobre uso dessa candidata exclusivamente
num diagnóstico temporário privado, sem imagens/providers, reconhecendo os
achados residuais e a cobertura incompleta do Java. Registro local da decisão
às 18:27:23 UTC; essa é a hora do registro, não um timestamp atribuído à mensagem.

**Aceite de risco restrito recebido**, vinculado ao manifesto local
`sha256:cf73e5c4241a96a095dcec030296dfea3269a3c50d6152466a09802fe17b0c02`,
config/export/scan acima. Não equivale a imagem livre de vulnerabilidades, waiver
de produção, publicação já executada, IAM aprovado ou aceitação de custos.
16 ocorrências continuam no registro; nenhum finding/supressão foi alterado.
Outro pacote, rebuild, finalidade ou exposição exige revisão própria.
020 `in-progress/open`, 021 bloqueada; guards e defaults intactos.

Export integral novamente conferido por SHA-256, sem copiá-lo. Manifesto e
config recuperados pelo `tar -xOf` existente, somente em memória, e seus hashes
conferidos: Linux amd64, UID `1000:1000`, entrypoint Java, sem portas/ONBUILD.
Scan conferido contra seu hash e config. Nove descritores de camadas comprimidas
somam **145.894.434 bytes ≈ 0,135875 GiB**. Essa soma é informação do export
local; não prova tamanho faturado ou digest publicado no registry.

Preparação da **próxima ação**, ainda não autorizada/executada:

- Repositório exclusivo proposto `toonlira-diag-20261012`, projeto
  `toonlira-rm`, região `southamerica-east1`, formato Docker, modo Standard.
  Verificar disponibilidade; se existente, parar sem reaproveitar, sobrescrever
  ou escolher outro nome silenciosamente.
- Conferir identidade existente/permissões e IAM direto/herdado aplicável com
  saída sanitizada. Sem essa visibilidade, privacidade permanece pendente e
  criação não avança. Não criar bindings, leitores públicos ou grants amplos.
- `--disable-vulnerability-scanning` explícito somente no novo repositório,
  conforme [referência GA](https://docs.cloud.google.com/sdk/gcloud/reference/artifacts/repositories/create).
  Definição YAML da CLI 583.0.0 já instalada também contém esse flag e enum
  `DISABLED`; apenas fonte lido, nenhum comando gcloud executado nesta parcela.
  Não habilitar scanner pago/Cloud Build/APIs ou instalar componentes.
- Criação sem chave KMS própria; leitura do hook local confirmou retorno
  imediato sem essa chave, evitando seu fluxo interativo de grant KMS.
  Isso não prova inexistência de efeitos administrativos do serviço remoto.
- Após criação autorizada: ler operação/recurso, formato/localização/mode,
  scanner desabilitado, IAM e ausência de artefatos. Confirmação perdida exige
  consultar a operação original, sem recriação ou retry automático.
- Terminar a ação com repositório **vazio**: sem push, conta de serviço, Job,
  execução, mídia ou provider. As etapas seguintes precisam de aprovação própria.

Comando preparado, **não executado**, sujeito ao pré-flight acima:

```bash
gcloud artifacts repositories create toonlira-diag-20261012 \
  --project=toonlira-rm \
  --location=southamerica-east1 \
  --repository-format=docker \
  --mode=standard-repository \
  --disable-vulnerability-scanning \
  --labels=purpose=isolation-diagnostic,temporary=true \
  --description='Temporary standalone isolation diagnostic; no media or providers' \
  --quiet --verbosity=error --format=json
```

[Preço oficial do registry](https://cloud.google.com/artifact-registry/pricing)
reconfirmado publicamente: USD 0,000136986/GiB-hora acima da faixa compartilhada.
Com a soma local das camadas, armazenamento hipotético por 24 h ≈
**USD 0,000447**, sem assumir free tier e sem metadata/deduplicação, transferência,
logs, impostos ou moeda da conta. Não é fatura, garantia ou teto. O próximo
passo deixa o repositório vazio; armazenamento da imagem só começa após push
autorizado. Objetivo de retirada após diagnóstico, até 24 h, não é lifecycle
automático; atraso mantém recursos/custos. Exclusão do alvo exato será uma ação
autorizada e registrada, preservando recibos e recursos preexistentes.

Recibo privado exclusivo `preparation.json`: aprovação literal/contexto,
hashes/pacote, bytes de camadas, comando proposto, guardrails e flags de criação,
push/IAM/execução/exclusão **false**. Fonte JS `prepare.mjs` usa apenas built-ins
e ferramentas locais existentes; nenhum Python, instalação, nova imagem,
cache grande, credencial ou ação cloud. Erros de localização inicial do fonte
da CLI resolvidos por leitura do symlink/`rg --files`, sem rodar/alterar a CLI.

Verificação desta preparação: 419 fontes/testes/configurações novamente
byte-idênticos à fotografia técnica; oito links locais conferidos. Sintaxe JS,
escopo do recibo e flags de autorização validados. Recibo SHA-256
`f0caf6db47c4e1f269dfc1fd0e40363ba33a2de9b9d291b04c59321691f3040a`.
Prettier dos dois documentos e diff-check do módulo aprovados. O diff-check
global continua bloqueado pelo blank EOF preexistente em
`web/landing-page/src/shared/component/PlatformBadge.tsx:44`; arquivo alheio
não modificado. Maven/mobile/web não reexecutados para esta parcela documental.
Registro privado ocupa cerca de 20 KB, sem cópia de imagem ou cache grande.

## Registry criado e verificado vazio — 2026-10-12

Ruan respondeu **«Sim.»** ao pedido específico de criação do registry temporário
e consultas necessárias com a credencial existente. Escopo executado: somente
`toonlira-diag-20261012`, projeto `toonlira-rm`, `southamerica-east1`, vazio,
sem leitores públicos e scanner pago desabilitado. Não derivar autorização de
push, grant manual, conta de runtime, Job, provider ou exclusão desse aceite.

Pré-flight 18:47:26–18:47:37 UTC: nove comandos GA, todos exit 0. Identidade
existente coincide com o inventário anterior, sem override/impersonação;
nenhum token impresso. Projeto ativo, billing vinculado e API Artifact Registry
habilitada. Nome exato ausente, zero repositórios regionais. Consulta da cadeia
de ancestrais confirmou apenas o projeto, sem pasta/organização; IAM do projeto
com sete bindings, zero públicos. Corpo integral das políticas não copiado para
Git ou recibos; somente contagens/hashes sanitizados. Nenhum grant no pré-flight.

Uma tentativa de criação, seguida de readback, IAM direto/herdado e listagem,
entre 18:49:12 e 18:49:40 UTC: cinco comandos, todos exit 0. Sem `alpha`/`beta`,
instalação, habilitação de API, KMS própria, Cloud Build, retry de criação ou
comando de alteração IAM. Resource retornado:
`projects/toonlira-rm/locations/southamerica-east1/repositories/toonlira-diag-20261012`.
CreateTime do serviço: `2026-10-12T18:49:32.347710Z`.

| Verificação                  | Resultado observado                              |
| ---------------------------- | ------------------------------------------------ |
| Formato/mode                 | `DOCKER` / `STANDARD_REPOSITORY`                 |
| Labels                       | `purpose=isolation-diagnostic`, `temporary=true` |
| Scanner: configuração/estado | `DISABLED` / `SCANNING_DISABLED`                 |
| IAM direto                   | Zero bindings, zero grants públicos              |
| IAM do projeto no readback   | Oito bindings, zero grants públicos              |
| Imagens listadas             | Zero                                             |
| Campo sizeBytes              | Ausente; não tratar como medição de fatura       |
| Pacote publicado / compute   | Nenhum                                           |

Privado significa acesso IAM sem `allUsers`/`allAuthenticatedUsers` nos escopos
consultados, não endpoint de rede inacessível pela internet ou isolamento VPC.
Ausência de fatura/bytes retornados não comprova custo total zero nem free tier.
A observação de vazio corresponde à listagem nesta rodada, não garantia futura.

### Efeito gerenciado de IAM observado

A contagem do projeto mudou de sete para oito bindings. Conferência adicional,
somente leitura, às 18:50:36–18:50:39 UTC, confirmou a identidade esperada
`gcp-sa-artifactregistry` vinculada a `roles/artifactregistry.serviceAgent`,
sem condição; zero grants públicos permanece observado. Identificadores
pessoais/número do projeto/política integral não publicados.

A [documentação primária do service agent](https://docs.cloud.google.com/artifact-registry/docs/ar-service-account)
explica sua criação automática e papel ao criar o primeiro repositório.
**Inferência:** a diferença observada é compatível com esse efeito gerenciado;
como só hashes/contagens anteriores foram guardados, não demonstrar um diff
integral nem atribuir todas as mudanças do projeto por essa contagem. Nenhum
`add-iam-policy-binding`/`set-iam-policy` foi executado pelo tooling. Não remover
a identidade/role gerenciada automaticamente: pode servir ao produto e sua
retirada exige escopo/revisão próprios. Conta dedicada do diagnóstico ainda
não criada; não confundir com essa identidade Google.

Manifests de componentes da CLI byte-idênticos antes/depois do pré-flight e
criação. Nenhum login/ADC trocada/chave gerada; o CLI existente pode atualizar
seus logs/cache normais. Registros privados exclusivos:

| Recibo           | SHA-256                                                            |
| ---------------- | ------------------------------------------------------------------ |
| Pré-flight       | `10c20edb3a6ddcff032a2da5d4881b750f6d2fad9862e51421979907ed702ff2` |
| Criação/readback | `27310f80282f77e3221224700a2a147ed159252fb5a66239bda4a4363e8ad106` |
| Follow-up de IAM | `3c649215bc3047b849646f2eaca28fe70a266e2debe618683bba490654f31f49` |

Intent/journals create-only preservam tentativa e confirmação; não rerodar os
scripts no mesmo diretório ou reconstruir operação por nova criação. Nenhum
arquivo de performance, imagem reutilizável, fonte técnico, migration,
Terraform ou status SDD alterado. Repositório **permanece existente e vazio**;
remoção futura não executada. Custos de armazenamento da candidata só serão
relevantes após publicação autorizada; custo efetivo não medido nesta consulta.

Próxima ação proposta: autorizar separadamente a publicação dessa candidata
sem rebuild/download no registry exclusivo, autenticação temporária com a
credencial existente, e conferência do digest remoto/scanner/IAM. Camadas locais
≈ 0,136 GiB; exemplo de armazenamento por 24 h ≈ USD 0,000447, sem garantia
de fatura/teto ou retirada automática. Nada de envio de mangá, Job ou OCR nesse
push. Criação da conta/Job e execução ficam para passos posteriores aprovados.

Verificação local da parcela: recibos/configuração/escopo e sintaxe dos três
scripts conferidos; 419 fontes/testes/configurações byte-idênticos à fotografia
técnica e oito links locais válidos. Prettier direcionado e diff-check do módulo
aprovados. Diff-check global continua com o blank EOF alheio em
`web/landing-page/src/shared/component/PlatformBadge.tsx:44`, preservado.
Maven/mobile/web não reexecutados para esta operação de infraestrutura sem
mudança de runtime. Rodada privada ocupa cerca de 64 KB, sem cache de imagem
ou base CVE recriado; auditoria de performance intacta.

## Candidata publicada e digest verificado — 2026-10-12

Ruan respondeu **«Sim.»** ao push exclusivo da candidata, com autenticação
temporária e custo de armazenamento apresentado, **sem criar/executar Job**.
Rodada 19:00:26–19:01:09 UTC, vinte ações registradas concluídas exit 0.
Uma invocação do comando push, 19:00:38–19:00:57 UTC; sem rebuild, pull,
aquisição de dependências, grant, API habilitada, mídia ou provider.

Antes da publicação: identidade original/sem override, registry existente
Docker Standard, scanner desabilitado, cadeia somente projeto, IAM sem grants
públicos e zero imagens. Export/scan novamente conferidos por hash; prazos
NextUpdate dos índices OS/Java da rodada anterior ainda futuros durante essa
execução. Bases descartadas não foram reconstruídas ou usadas para novo scan;
isso é reconferência da evidência anterior, não nova varredura/atestado do JDK.

Imagem remota, a usar futuramente **por digest**, não pela tag mutável:

```text
southamerica-east1-docker.pkg.dev/toonlira-rm/toonlira-diag-20261012/isolation-probe@sha256:cf73e5c4241a96a095dcec030296dfea3269a3c50d6152466a09802fe17b0c02
```

Tag de publicação: `reviewed-20261012-a`. Digest reportado pelo push coincide
exatamente com o manifesto local aprovado. Manifesto remoto consultado sem
baixar camadas: config SHA-256
`9f19c1a43220798038bd89702b2d4ce8a64a8fe4acbcc6f8e5be13d98c5046bd`
e nove descritores de camadas idênticos em digest/tamanho/mediaType aos aprovados.
Manifesto de 2.269 bytes. Metadata independente via Artifact Registry confirma
o mesmo digest; não confundir essa verificação com assinatura/atestação externa.

Readback final: **uma imagem/version**, tag esperada, scanner
`DISABLED/SCANNING_DISABLED`, zero bindings diretos/públicos no registry,
oito bindings e zero públicos no projeto. Hashes dos corpos IAM antes/depois
coincidem nesta rodada; nenhum grant executado pelo tooling. Campo `sizeBytes`
continua ausente no describe do repositório; não apresentar bytes faturados
ou ausência de cobrança como observação. Armazenamento remoto agora existe e
pode cobrar até retirada autorizada; exemplo de 24 h continua apenas estimativa.

### Autenticação temporária e descarte local

Fluxo conforme [autenticação oficial](https://docs.cloud.google.com/artifact-registry/docs/docker/authentication):
access token obtido da identidade existente somente em memória do processo,
enviado a `docker login --password-stdin`. Sem chave de service account,
`gcloud auth login`, troca da ADC ou `gcloud auth configure-docker` global.
Config Docker exclusiva em diretório temporário `0700`, `config.json` `0600`;
essa config teve token codificado em base64 durante o push, não um segredo
criptografado. Nenhum token/config de autenticação copiado para recibos/Git.

**Config e diretório temporários removidos**, ausência conferida novamente
depois da conclusão. Não alegar revogação remota do token ou limpeza do cache
normal da credencial pessoal; não executar `gcloud auth revoke` nessa sessão.
Alias local criado para o push também removido, sem `--force`; tag original e
imagem por digest preservadas. Essa retirada local não excluiu imagem/tag
remotas. Manifests dos componentes CLI idênticos antes/depois.

Recibo privado exclusivo `push.json`, SHA-256
`6676f0dd1873913d220d19cf74eeb251e4af57113516d6f049239ff9ee662814`,
com comando/UTC, intenção create-only, resultados sanitizados, digest remoto,
checks e flags de Job/compute/grants false. Sem resposta bruta de credenciais.
Scripts/recibos ocupam cerca de 48 KB; nenhuma cópia de imagem/cache grande.
Arquivo de performance, fontes técnicos, migrations, Terraform e gates intactos.

Próxima ação proposta, **não autorizada por esse push**: conferir disponibilidade
e criar uma conta dedicada `toonlira-diag-20261012` no projeto, sem chave ou
papéis/grants, verificando acesso herdado antes de associá-la a qualquer Job.
IAM API ausente ou identidade preexistente/desconhecida interrompe a ação;
não habilitar API nem reaproveitar conta silenciosamente. Job/criação/execução
e retirada cloud continuam passos separados. 020 `in-progress/open`, 021
bloqueada; esta publicação não admite o renderer em Cloud Run.

Checks da parcela: sintaxe JS e recibo/escopo aprovados; ausência do diretório
de autenticação conferida independentemente. 419 arquivos técnicos continuam
byte-idênticos à fotografia auditada; oito links locais válidos. Prettier e
diff-check direcionados aprovados. Diff-check global ainda aponta somente o
blank EOF alheio em `web/landing-page/src/shared/component/PlatformBadge.tsx:44`,
sem correção fora do escopo. Maven/mobile/web não reexecutados nesta operação
sem mudança de runtime; resultados antigos não redatados.

## Criação da conta: bloqueio de pré-requisito — 2026-10-12

Ruan respondeu **«Autorizo.»** à criação da conta dedicada sem chave/papéis e
às consultas necessárias, sem Job. Pré-flight 19:24:18–19:24:21 UTC, três
comandos somente leitura, exit 0: CLI 583.0.0, identidade original sem overrides
e lista de APIs habilitadas. **`iam.googleapis.com` não está habilitada**.
Não confundir IAM com `iamcredentials.googleapis.com`, API de credenciais
consultada no inventário anterior.

Interrupção antes de consultar disponibilidade ou executar criação: **zero
tentativas de criação**, nenhuma chave, grant, habilitação de API, uso de
credencial da conta nova ou Job. O registro status é `blocked-before-creation`.
Seu campo sanitizado `failure=validation-unavailable` é genérico porque a
asserção não foi convertida em código específico; o resultado estruturado
`iam-api.iamEnabled=false` identifica o bloqueio. Não alterar o recibo/script
executados para fabricar uma mensagem melhor ou um resultado de criação.

A [instrução primária de criação](https://docs.cloud.google.com/iam/docs/service-accounts-create)
exige IAM API habilitada. Habilitação não está no escopo dessa autorização;
próximo pedido é **somente `iam.googleapis.com` em `toonlira-rm`**, com a
credencial existente e readback, sem grants/manutenção de billing/provider/Job.
Depois da autorização específica e confirmação do pré-requisito, retomar a
criação já autorizada em diretório/recibo novos, sem sobrescrever esta rodada.
Não usar Console como bypass da API desligada ou habilitar por prompt implícito.

Recibo privado `identity.json`, SHA-256
`49a7111911da9885ef44a913c54f9e700407d17bfc022795ec4197ffe1b3f184`.
Manifests dos componentes CLI antes/depois idênticos; nenhuma instalação/login
ou mudança da ADC. Conta continua **não criada por esta operação**; nome,
IAM aplicável, chaves e permissões ainda não verificados. Registry e imagem
publicados anteriormente permanecem existentes, sujeitos a armazenamento e
retirada autorizada. Nenhuma consulta nova de fatura/bytes ou exclusão cloud.
Performance, fontes, runtime, Terraform e gates intactos.

A [tarifa oficial IAM](https://cloud.google.com/iam/pricing) informa uso da API
sem cobrança. Isso não elimina cobrança dos artefatos já armazenados ou autoriza
outros serviços. Checks locais: recibo confirma zero tentativas e ausência de
intent de criação; 419 arquivos técnicos intactos, oito links locais válidos,
sintaxe JS/Prettier/diff-check do módulo aprovados. Diff-check global ainda tem
blank EOF alheio em `web/landing-page/src/shared/component/PlatformBadge.tsx:44`,
preservado. Maven/mobile/web não reexecutados nesta parcela sem runtime alterado.

## IAM habilitada e conta dedicada criada — 2026-10-12

Ruan respondeu **«Sim»** à habilitação exclusiva de `iam.googleapis.com` e
retomada da criação já autorizada, sem chave/papéis/Job. Não confundir essa
autorização com execução paga ou novas políticas.

Primeira preparação de habilitação às 19:27:47 UTC: `gcloud services describe`
retornou exit 2; comando não existe na superfície GA da CLI 583.0.0 instalada.
Identidade conferida, **zero tentativas de habilitação**. Recibo e script
preservados; erro não foi apagado/reclassificado como alteração cloud. Ajuste
restrito da consulta para `services list --enabled` em diretório novo, sem
instalação ou repetição de mutação. Ausência nessa listagem é `NOT_LISTED_ENABLED`,
não resposta bruta de um endpoint describe.

Habilitação válida 19:28:54–19:29:04 UTC: quatro ações exit 0, incluindo uma
invocação `services enable iam.googleapis.com --project=toonlira-rm`. Readback
da listagem estável confirma **ENABLED**. Nenhum outro serviço foi solicitado
ao comando; diff global de possíveis dependências automáticas não auditado.
Nenhum grant, chave, conta ou Job criado pelo script de habilitação.

Criação retomada em rodada exclusiva, 19:29:26–19:29:42 UTC, treze ações exit 0:
CLI/identidade/API, disponibilidade do nome, ancestralidade/IAM, uma criação,
readback, política da conta, chaves e políticas pós-criação. Resultado:

| Item                                    | Observação comprovada                                                  |
| --------------------------------------- | ---------------------------------------------------------------------- |
| Conta dedicada                          | `toonlira-diag-20261012@toonlira-rm.iam.gserviceaccount.com`           |
| Estado                                  | Ativa, `disabled=false`, ID único registrado somente no recibo privado |
| Nome antes de criar                     | Ausente; nenhuma identidade preexistente reutilizada                   |
| Chaves de usuário                       | Zero, listagem `--managed-by=user`                                     |
| Política direta do recurso conta        | Zero bindings                                                          |
| Grants à conta no projeto/registry      | Zero, inclusive antes/depois; sem grants públicos/grupos/principalSet  |
| Herança consultada                      | Só projeto, sem pasta/organização                                      |
| Políticas projeto/registry antes/depois | Corpos com hashes iguais                                               |
| Componentes CLI                         | Manifests idênticos antes/depois nas três rodadas                      |
| Job / execução / token da conta / grant | Nenhum                                                                 |

Sem geração/download de chave privada ou token da conta; a verificação de
chaves de usuário não afirma ausência de chaves de sistema gerenciadas pelo
Google. Conta como **principal** sem grants nos escopos consultados não é o
mesmo que ninguém poder administrar/anexar a conta como **recurso**: operadores
herdam permissões do projeto. Recursos isolados de outros produtos/projetos e
membership global não foram inventariados integralmente. Não apresentar essa
checagem limitada como prova universal de ausência de acesso a dados.

| Recibo                      | SHA-256                                                            |
| --------------------------- | ------------------------------------------------------------------ |
| Preparação CLI interrompida | `099080bbd799f597261d4bec6f561e9d8a795c1bde734e55d668f92d5b9c665a` |
| IAM habilitada/readback     | `4610bf90f2afe4ba5c687fc731c809ecf90db8448151529759ada81bfc04a16d` |
| Conta criada/readback       | `e1c5badb3002e53d77eb11d6cfa8a7e811473406ef4739d4fff6af5cf8a388c2` |

Registros pequenos e exclusivos, políticas/tokens integrais não publicados.
Sem SDK novo, troca de ADC, impersonação, chave, provider ou modificação de
performance. API, conta, registry e imagem **permanecem existentes**; não
desabilitar IAM nem excluir agente Google/recursos automaticamente na retirada.
020 `in-progress/open`, 021 bloqueada; nenhum guard ou default alterado.

### Próxima proposta: criar somente o Job, sem execução

Nome exclusivo proposto `toonlira-isolation-diag-20261012`, `southamerica-east1`,
imagem remota por digest e conta recém-criada. Antes de qualquer criação:
confirmar disponibilidade, Run API, configuração/IAM da conta/registry, caller
e permissões aplicáveis. Falta de `actAs`/pull/permissão, nome existente ou
IAM público interrompe, sem grants ou reaproveitamento silencioso.

Comando proposto, **não autorizado/executado** por esta parcela:

```bash
gcloud run jobs create toonlira-isolation-diag-20261012 \
  --project=toonlira-rm \
  --region=southamerica-east1 \
  --image=southamerica-east1-docker.pkg.dev/toonlira-rm/toonlira-diag-20261012/isolation-probe@sha256:cf73e5c4241a96a095dcec030296dfea3269a3c50d6152466a09802fe17b0c02 \
  --service-account=toonlira-diag-20261012@toonlira-rm.iam.gserviceaccount.com \
  --tasks=1 --parallelism=1 --max-retries=0 --task-timeout=60s \
  --cpu=2 --memory=8Gi \
  --add-volume=name=scratch,type=in-memory,size-limit=512Mi \
  --add-volume-mount=volume=scratch,mount-path=/work \
  --labels=purpose=isolation-diagnostic,temporary=true \
  --quiet --verbosity=error --format=json
```

Não usar `--execute-now`, `--wait`, schedule, Cloud Tasks, source deploy,
Cloud Build, secrets, banco, bucket, provider ou grants públicos. Entrypoint
Java permanece o da imagem, sem substituição por worker. Jobs gen2 por contrato;
não acrescentar flag de Service inexistente. Flags de criação/volume conferidas
na [referência GA](https://docs.cloud.google.com/sdk/gcloud/reference/run/jobs/create)
e [guia de volume de Jobs](https://docs.cloud.google.com/run/docs/configuring/jobs/in-memory-volume-mounts).
Limite de 512 MiB consome a RAM da task, não reserva RAM adicional.

Após aprovação específica: criar uma vez, conferir configuração/IAM, identidade,
imagem pinada, retries/timeouts/volume e **zero execuções**, sem executar.
Só depois apresentar custo e pedir uma execução separada. Recursos declarados
não comprovam PIDs, AS ou flags de mount no kernel; não flexibilizar guards
para fazer a prova passar. Criação de configuração não é autorização de custo
da execução nem admissão operacional do renderer. Registro de retirada dos
alvos exclusivos será separado, preservando evidências e recursos compartilhados.

Verificação da parcela: recibos/escopo/sintaxe JS aprovados; uma habilitação e
uma criação confirmadas, zero chaves de usuário/grants/Jobs. 419 arquivos
técnicos byte-idênticos à fotografia auditada, oito links locais válidos;
Prettier/diff-check do módulo aprovados. Diff-check global mantém o blank EOF
alheio em `web/landing-page/src/shared/component/PlatformBadge.tsx:44`, sem
alteração. Maven/mobile/web não reexecutados nesta operação sem runtime mudado.
Rodadas privadas desta continuação somam cerca de 80 KB, sem modelos/caches
grandes ou arquivos de performance modificados.

## Job criado/configurado, sem execução — 2026-10-12

Ruan respondeu **«Sim»** à criação exclusiva do Job e readback, **sem execução**.
Rodada 19:36:58–19:37:25 UTC: quinze ações exit 0, uma invocação de criação.
Nome antes ausente, Run API habilitada, identidade original, ancestralidade
somente projeto, imagem remota pinada e conta ativa com ID único correspondente
ao recibo. Conta sem chaves de usuário/bindings diretos; zero grants à runtime
nos escopos projeto/registry consultados. Nenhuma mudança de papéis ou API.

Recurso existente: `toonlira-isolation-diag-20261012`, `southamerica-east1`.
CreationTimestamp do serviço: `2026-10-12T19:37:12.694454Z`; geração 1.
Configuração obtida na criação e no describe independente:

| Campo                          | Observação                                                     |
| ------------------------------ | -------------------------------------------------------------- |
| Imagem                         | Digest remoto aprovado `sha256:cf73e5c4…17b0c02`               |
| Service account                | `toonlira-diag-20261012@toonlira-rm.iam.gserviceaccount.com`   |
| Tasks / paralelismo / retries  | `1` / `1` / `0`                                                |
| CPU / memória / timeout        | `2` / `8Gi` / `60` segundos                                    |
| Volume / mount                 | `scratch`, Memory, `512Mi`, `/work`                            |
| Ambiente de execução declarado | Annotation `run.googleapis.com/execution-environment=gen2`     |
| Overrides command/args/env     | Nenhum; entrypoint permanece o da imagem                       |
| Portas / outros volumes        | Nenhum                                                         |
| IAM direto do Job              | Zero bindings, sem grants públicos                             |
| IAM do projeto                 | Oito bindings, sem públicos; corpo antes/depois com mesmo hash |
| Listagem de execuções          | **Zero**                                                       |

`status.executionCount` ausente e `latestCreatedExecution` ausente no describe
não foram tratados isoladamente como zero; listagem específica confirmou
nenhuma execução. `Ready=True` significa definição do Job aceita, **não** probe
rodado, segurança do kernel, disponibilidade do renderer ou sucesso operacional.
UID/AS/PIDs/flags de mount/OOM seguem sem prova cloud. Não houve `execute-now`,
`wait`, source deploy, Build, secrets, provider, banco ou bucket.

Create/readback sem falha comprova aceite da criação/anexação da conta pela API
nesse momento; não prova permissões futuras ou permite grants amplos. Fonte
da CLI GA lido para confirmar que `--wait` implica execução; flag não usado.
Recursos concretos/memória declarada não relaxam guards autoritativos.

Hash do corpo da resposta de configuração (somente hash/seleção sanitizada
preservados nos recibos):
`d2be31168a9f07be71ec0bf77b1c147ee9ba55d5101e248839d291831623ef6c`.
Recibo privado exclusivo `job.json`, SHA-256
`2eb9fa636ec6eced1683ee899a2dde4921b0cd5c54d57d93db0acbd4906b0dc3`.
Manifests CLI antes/depois iguais; sem instalação, login, troca ADC ou geração
de chave/token da conta. Imagem/registry/conta/Job permanecem existentes;
nenhuma retirada ou execução autorizada por essa criação. 020/021 inalteradas.

### Próximo pedido financeiro: uma execução do diagnóstico

Executar **uma única vez** esse Job, sem overrides e sem repetir diante de
timeout/confirmação perdida. Criar intent exclusivo antes da chamada, capturar
execution/operation e coletar somente seus estados/logs de probe. Consultar a
mesma execução para confirmação, não invocar outra. Registrar os 18 checks e
manter `operationalApproval=false`, `nativeOperationsTested=false`; FAIL/UNKNOWN
não vira PASS por exit 0. Incompatibilidade exige decisão antes de ampliar a stack.

Estimativa regional já registrada para 2 CPU/8 GiB: USD 0,0000624/s,
**USD 0,003744 para 60 s faturados**. A
[tarifa pública](https://cloud.google.com/run/pricing) reafirma mínimo de um
minuto por instância de Jobs e cobrança da vida da instância, não só tempo do
programa. Startup/encerramento podem aumentar o faturamento; timeout de 60 s
e retries zero não são teto financeiro. Sem free tier presumido; registry,
logs, rede, impostos/moeda continuam fora desse cálculo. Nenhuma execução
iniciada nesta parcela; exige confirmação específica do usuário.

Não iniciar OCR/tradução/layout/renderização, enviar mídia ou escalar recursos
nessa prova. Coletar evidência antes de propor retirada dos alvos exclusivos;
não remover API IAM/agentes Google ou recursos compartilhados automaticamente.

Checks locais: recibo e sintaxe JS validados; uma criação/zero execuções,
419 arquivos técnicos byte-idênticos à fotografia auditada e oito links locais
válidos. Prettier/diff-check do módulo aprovados. Diff-check global mantém
blank EOF alheio em `web/landing-page/src/shared/component/PlatformBadge.tsx:44`,
preservado. Maven/mobile/web não reexecutados para configuração cloud sem
runtime mudado. Registro privado cerca de 52 KB, sem cache grande recriado;
arquivos de performance intactos.

## Execução real concluída, admissão não aprovada — 2026-10-12

Ruan respondeu «Vamos.» à execução única paga e coleta. Um POST oficial com
ETag, sem overrides/repetição; operação retornada acompanhada somente por GET.
Uma execução/task concluída com sucesso de plataforma às 20:04:22 UTC; probe
real **9 PASS / 3 FAIL / 6 UNKNOWN**, `requirements-not-met`. Não há admissão
do worker/renderer ou autorização de stack completa. Código/guards intactos.

Os resultados e limites, hashes/recibo, custo não medido e alvos de retirada
propostos estão no [diagnóstico cloud real](diagnostic-cloud-result-2026-10-12.md).
Recursos ainda existentes; nenhuma exclusão/repetição/fallback ocorreu.

## Retirada aprovada e encerrada — 2026-10-12

Ruan respondeu «Sim» à retirada somente dos três alvos exclusivos. Revalidação
de evidências/export, conta/configuração/etiquetas, execução concluída, registry
com único pacote/imagem e ausência de outros consumidores nas listagens globais
Cloud Run precedeu qualquer exclusão. Primeira tentativa encerrou sem mutação
por nome curto de pacote no formato GA; consulta confirmou o formato e nova
rodada exclusiva revalidou o conjunto. Não ocultar esse bloqueio ou interpretá-lo
como falha da API cloud.

Três comandos de exclusão, uma invocação de cada, seguidos de confirmação por
listagem: Job às 20:17:54 UTC, registry/imagem às 20:17:59 e conta às 20:18:01.
Rodada final terminou às 20:18:06 UTC, 25 ações, status
`three-targets-retired-evidence-preserved`. Recibo privado SHA-256
`3fa3f7be4d1099ebd40eaaec62f52b6f1e54c406d79e282498593cc7cd86c854`;
tentativa sem exclusões SHA-256
`850988626ffcf87439db9d4186c250765a77e6e250e68176d45e19e26387008d`.

Hash do IAM do projeto e conjunto das APIs habilitadas iguais antes/depois;
três outras contas com identidade/estado inalterados, incluindo OCR. Nenhuma
exclusão de API/agente gerenciado, bucket OCR, site, logs/auditoria/performance,
nem nova execução, provider, instalação ou limpeza abrangente. Manifests SDK
iguais; cache/logs usuais de autenticação podem ser atualizados pelo CLI.

Oito evidências/export conferidos antes/depois; imagem original também observada
no Docker. 419 fontes/testes/configurações permanecem idênticos à fotografia
técnica registrada. Oito testes leves passaram novamente; links/Prettier/diff
do módulo conferidos. Diff global mantém blank EOF externo já documentado;
Maven/mobile/web não redatados por esta operação/documentação sem código alterado.

O [resultado corrente](diagnostic-cloud-result-2026-10-12.md) registra ausência,
preservação, recuperação possível e limites de custo. Os parágrafos anteriores
registram estados históricos, não recursos que ainda devam ser excluídos.
020 continua `in-progress/open`, 021 bloqueada; nenhum fallback ou próxima stack
implantados. A decisão arquitetural será etapa separada, sem waiver dos guards.
