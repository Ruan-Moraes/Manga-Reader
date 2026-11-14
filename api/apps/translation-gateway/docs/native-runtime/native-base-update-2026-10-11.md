# Atualização local da base Ubuntu — 2026-10-11

Parcela de segurança da MOB-FEAT-020 após autorização específica para instalar
somente `libfreetype6` e `libpng16-16t64` em **novas imagens locais**. Não houve
instalação no macOS, mudança nas imagens antigas, push, deploy, ADC, alteração
cloud ou chamada real de provider. Defaults operacionais permanecem desabilitados.

## Preparação executada

O preparador JavaScript [ubuntu-base-update.mjs](../scripts/ubuntu-base-update.mjs)
usa bases Temurin já presentes, identificadas por digest, e configuração Docker
isolada sem credenciais/helpers/proxy/context remoto. A instalação é opt-in;
destino existente não é retomado ou sobrescrito.

1. Inventário completo `dpkg-query`, fontes APT e SHA-256 do keyring embarcado.
2. `apt-get update` com repositórios fracos/inseguros e pacotes não autenticados
   explicitamente proibidos, sem retries de aquisição. Falhas de update são erro.
3. Verificação adicional de todos os `InRelease` com `gpgv`: assinatura válida
   pela chave Ubuntu `F6ECB3762474EDA9D21B7022871920D1991BC93C` nas duas arquiteturas.
4. Simulação da instalação: exatamente os dois upgrades aprovados, nenhuma
   instalação adicional ou remoção. O preparador rejeita qualquer terceiro pacote.
5. Download dos dois `.deb`; identidade, versão, arquitetura, filename e SHA-256
   comparados aos metadados autenticados do APT. Nenhuma dependência foi instalada.
6. Desconexão da rede do container; instalação `--no-download --no-remove`.
7. Inventário completo depois: somente os dois upgrades; todos os arquivos do
   JRE com hashes idênticos antes/depois. Entrypoint, ambiente, usuário e diretório
   de trabalho da base preservados. Os containers temporários exatos foram removidos;
   imagens originais, imagens novas e evidências locais permanecem recuperáveis.

O aviso de `apt-utils` ausente não levou à instalação desse pacote. Triggers do
`libc-bin` já instalado não alteraram sua versão. Não houve upgrade abrangente,
substituição de bibliotecas do JRE ou instalação de Buildx.

| Pacote           | Versão original          | Versão instalada         | SHA-256 `.deb` ARM64                                               | SHA-256 `.deb` x86_64                                              |
| ---------------- | ------------------------ | ------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| `libfreetype6`   | `2.13.2+dfsg-1ubuntu0.1` | `2.13.2+dfsg-1ubuntu0.2` | `d334b74c57a7c7b7847c1851161ead832a66e4160cf8393bbd142bd3864ee75e` | `8c6d3bac5a6197fa2f48b2d56f04f3ffecaa7082eeab91b0939f97a40adc88a6` |
| `libpng16-16t64` | `1.6.43-5ubuntu0.6`      | `1.6.43-5ubuntu0.7`      | `6e724abe81e94ff73d9b28b545a13329c0b7e4ea6fd8022ecbcd2b3492d0117d` | `863d6abb089b2820ceba98e6b18f06eaacc55f9b05827001e7b4021a9a7b246c` |

Versões de correção indicadas pelo fornecedor:
[FreeType](https://ubuntu.com/security/CVE-2026-95512) e
[libpng](https://ubuntu.com/security/CVE-2026-46675).

## Proveniência das novas imagens

| Alvo           | Nova base local                                                           | Worker derivado local                                                     | SHA-256 da prova de preparação                                     |
| -------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| ARM64          | `sha256:b28e3ece85f8cf9aea505c878ee1cbb89789abb28a7bbb29e3675462f853af55` | `sha256:6ecf0d7f9d142fb0b3db4b7aabefbd266f9cf5c203490e6485365c03bed976af` | `d9b1c45aa147ec4ac90444396735d63a425011b948194cb9add193543bb92fd1` |
| x86_64 emulado | `sha256:6ea68fc01f01400ee64252f9e316f92496e996881f240392d4f9392c427c2380` | `sha256:e23646a1439a339002dcbd64363d92fe41f9e1c0ece86d41e56111821d04aeed` | `cf69f8c5ca00551bf04b910e76824083886422eaef6627bec7b041615ca8ec9d` |

O empacotamento aceita a base derivada somente com `--base-proof` e
`--base-proof-sha256` explícitos: prova readonly, pin externo, parent e arquitetura
corretos, versões exatas e dois upgrades. Não aceita tag mutável, prova divergente,
aprovação de segurança fictícia ou pacote extra. Sem essas opções, os alvos
oficiais anteriores continuam sendo o default. `image-inputs.json` identifica a
base local, parent, hash da prova e `baseSecurityApproved=false`; não contém paths
pessoais. A prova é rastreabilidade local, não assinatura de distribuição.

Contextos exclusivos: ARM64
`1b1d42f3c993f62c185853fa783950c20d94b825c2dda07a9a4a6755170cedd9`;
x86_64 `7a5a7585ec45a6944b8a75c6ca8c009b210ad889579d09455b81fddddbddb8d1`.
JAR, fontes e codec são os mesmos da [migração Boot 4](boot4-execution-2026-10-10.md).
O build usou `--pull=false --network=none`; ambos os preflights passaram como
`admitted-not-operational`, com zero imagens/provider calls. Os avisos do builder
legado e da emulação foram preservados.

## Scan e limites de segurança

Trivy 0.75.0 já instalado, offline, ignorefile vazio e mesmas DBs da fotografia
Boot 4: DB v2 atualizada `2026-10-10T12:33:35Z`; Java DB v1 atualizada
`2026-10-10T00:59Z`. Scan concluído às 07:34 local, antes do próximo vencimento
registrado da DB. Não foi baixada outra base de vulnerabilidades.

| Superfície reconhecida | Antes                            | Depois                           |
| ---------------------- | -------------------------------- | -------------------------------- |
| Ubuntu: 108 pacotes    | 18 ocorrências: 14 MEDIUM, 4 LOW | 16 ocorrências: 12 MEDIUM, 4 LOW |
| Java: 195 pacotes      | Zero ocorrências na DB utilizada | Zero ocorrências na mesma DB     |

Saíram as ocorrências `CVE-2026-95512`/FreeType e `CVE-2026-46675`/libpng nos
**pacotes Ubuntu**. Continuam findings em libc/locales, expat, pcre2, systemd/udev,
login/passwd, tar e zlib. A DB não apresenta `FixedVersion` para esses registros;
isso não prova ausência de correção futura nem autoriza waiver. Cada superfície
residual requer triagem própria. Não há supressão ou aprovação de produção.

Export da imagem x86_64: SHA-256
`5432c50883a10d7536dfb1fe6a365e2dabe8b152f9b39c3f2ba59fe14eaa89bd`.
Relatório JSON: `51ae45d998df8f60dd7a0f9b5f79d9365062a0a0c81b444e48134468eb036b39`.
Scan ARM64 posterior, às 07:43 local, identificou os mesmos 108 pacotes Ubuntu,
195 Java, 16 ocorrências OS e zero Java nessa DB; JSON SHA-256
`43134fdace27033ce270868798afd201fab81ac34d077a2793ce75fb8edf955a`.
Comparação sanitizada dos scans x86_64, com exatamente dois findings removidos
e nenhum acrescentado: `76f47de4080707cddae8e9c54ccd0543fb90842bfb5bdcf2b2c07312ebbe04a6`.
Os artefatos ficam na preparação privada ignorada pelo Git, preservando os scans
anteriores. Não confundir inventário de pacotes com cobertura das cópias nativas
embarcadas no JRE ou do codec manual.

## Inspeção estática separada do JRE

O `release` do JRE informa `SOURCE=git:520406d87195` em `adoptium/jdk25u`.
Cinco fontes públicas dessa revisão foram guardadas privadamente, sem compilar
C próprio ou trocar bibliotecas. Recibo de URLs/bytes/hashes:
`a76e6374b663a97316e68616780f11b7c66d09e3a14936e29d9d3fcace4c764b`.

- **Fato:** o inventário declara libpng 1.6.58. O
  [advisory do autor](https://github.com/pnggroup/libpng/security/advisories/GHSA-qvg3-h654-xq3j)
  inclui essa versão na faixa afetada; patch upstream em 1.6.59.
  No `pngshim.c` exato, `png_read_end` ocorre depois de `png_read_update_info`
  e `png_read_image`; erros anteriores vão para destruição, não `png_read_end`.
  Isso é evidência limitada sobre esse call site, não sobre o JRE inteiro.
- **Fato:** `cidload.c` dessa revisão não contém o limite cumulativo de overlaps
  do [patch FreeType do autor](https://github.com/freetype/freetype/commit/f3ca71c9900fe860849b3163a6e2c1e765b291d9).
  Atualizar o FreeType Ubuntu não adiciona esse patch à cópia do JRE.
  Na nova imagem x86_64, a inspeção local de dependências de `libfontmanager.so`
  resolveu FreeType em `/opt/java/openjdk/lib/libfreetype.so`, não no pacote
  Ubuntu corrigido. Foi inspecionado somente binário confiável do fornecedor,
  em container readonly sem rede; não é teste dinâmico de exploração.
- **Fato:** `PNGImageReader.java` usa `Inflater`; os JNI `Inflater.c`/`Deflater.c`
  inspecionados não chamam as APIs `gz*` do finding zlib. Esses cinco arquivos
  não constituem uma busca exaustiva nem prova de alcance binário.
- **Limitação/inferência:** o renderer seleciona o decoder JDK exato e fontes
  físicas pinadas do JAR, sem upload de fonte ou fallback de fonte do sistema.
  Isso restringe entrada, mas não demonstra inexistência de outros caminhos,
  equivalência fonte/binário ou um VEX aprovado.

`securityApproved` permanece falso no inventário histórico e nas novas provas.
Não será aplicada substituição de `.so` do JRE por arquivo Ubuntu. Eventual
aquisição/instalação de outro runtime exige aprovação específica.

As [releases oficiais Temurin](https://adoptium.net/temurin/releases/?package=jdk_)
e o [calendário do fornecedor](https://adoptium.net/support/?jvmVariant=hotspot)
consultados ainda apresentam `25.0.4.1+1` como release 25 atual e `25.0.5` como
próxima prevista em outubro. Não foi presumida existência de binário corrigido,
instalado nightly ou prometido que a próxima release incluirá estes patches.

## Validação e próximos gates

Testes Node: 115 casos, 114 aprovados, um skip opt-in e zero falhas. Cobrem
resolução adicional/remoção, versões/arquitetura, inventário completo, hashes,
configuração Docker sem credenciais e prova explícita da base derivada.

Uma captura adicional com ambiente reduzido (`PATH`/`LANG`, omitindo `TMPDIR`)
falhou em 12 testes de reserva/arquivos: no macOS, o default `/tmp` é um symlink
e os guards recusaram o diretório pai. Não foi regressão da atualização APT nem
pretexto para enfraquecer os guards. Repetição com `TMPDIR` do ambiente normal
preservado e sem variáveis de credenciais passou integralmente: 114 pass/1 skip.
Ambas as capturas TAP foram preservadas separadamente; a primeira continua
evidência de falha, não é gate aprovado. Nenhum código de aquisição/colunas foi
alterado para contornar o problema de ambiente.
TAP da falha: `3b26254fe9687f312ba247fc0d465891dd7e93afc22be1049fa560e4ef07da5d`;
TAP da repetição aprovada: `7b32d199f03a10bb64e043b97795298676284aa27e49a4842a3b55146c64502d`.

Type-check web e `pnpm check` mobile completos passaram, sem reinstalar
dependências. Mobile: 116 suítes/892 testes; avisos `act(...)` existentes
preservados. SDD, links relativos dos quatro documentos alterados e formatação
direcionada passaram. O `git diff --check` do gateway passou; o global mantém a
linha em branco adicional externa em `PlatformBadge.tsx:44`, sem correção automática.

Matriz nativa completa das novas imagens: **40 testes, zero failures/errors/skips**,
concluída às **07:56:08 local em 2026-10-11**, em 22:29 minutos. Cobre SDKs contra
loopback, layout real local, formatos/dimensões máximos, sete destinos, falhas de
memória/disco/timeout/cancelamento, recuperação e bootstrap HTTP pelo ENTRYPOINT.
Sem chamadas pagas ou imagens reais. A matriz anterior foi preservada separadamente;
seus resultados não foram atribuídos automaticamente às bases novas.

XML preservado antes da execução Maven padrão: SHA-256
`e39b0d9fb9290064ffb7e49f2639e7a1154de4a1126529e4ee447b67daca7bfc`.
Resumo sanitizado dos 38 diagnósticos presentes no XML:
`4cdfeb4b0597b3c64de97bfd62ddb84ac66e283cc0815f963805f3bbdea72a91`.
Os outros dois testes são controles HTTP; o resumo não copia texto, imagem,
credencial ou path privado. Não foi feita busca abrangente em diretórios do macOS.

| Controle SDK falso                | ARM64: pico cgroup em bytes | x86_64 emulado: pico cgroup em bytes |
| --------------------------------- | --------------------------: | -----------------------------------: |
| Worker máximo                     |               1.580.802.048 |                        2.129.006.592 |
| Worker com layout local residente |               2.812.768.256 |                        2.840.174.592 |

Máximo observado nos 38 diagnósticos: **2.840.174.592 bytes**. Cgroup diagnóstico
de 8 GiB, sem OOM kill nesses controles. Não admite cloud 1 GiB, hardware x86_64
nativo, qualidade real ou SLA; variação entre rodadas não prova ganho de memória
causado pelo patch. Falhas induzidas continuam distintas de processamento real.

Gate Maven global offline com Docker concluído às **07:59:45 local**, em 02:37
minutos: sete módulos SUCCESS, **2.738 testes em 845 classes**, zero failures/errors,
103 skips opt-in. Gateway: 1.267 testes/129 classes. Os XMLs foram contados somente
se renovados após o início dessa execução, sem compilações concorrentes.
Resumo sanitizado: `8fb4c83e213676d8b87f4bf999db20d193c1b977c29143dcb7c5f291de56a2c1`.
Os skips padrão não substituem os 40 testes opt-in aprovados acima, cujo XML foi
preservado antes da reexecução. Warnings existentes não foram suprimidos.

Checksum técnico dos fontes/testes/configuração entregues: **400 arquivos**,
`40c140568670d3ac826a40e485bf533d1f95a10da32c528cc4e76f44aea149b6`.
Mesmo escopo/algoritmo da [fotografia Boot 4](boot4-execution-2026-10-10.md):
paths relativos ordenados, NUL, bytes, NUL; `src`, `scripts`, `openapi`, `pom.xml`
e `.tf`/`.tfvars.example` diretos. Exclui docs, Dockerfiles, build, capturas e caches.
Não substitui o hash histórico nem representa cobertura do checksum SDD mobile,
que não foi renovado porque nenhuma superfície mobile mudou.

Memória/admissão cloud, hardware x86_64 nativo, segurança residual e avaliação
humana permanecem abertos. MOB-FEAT-020 continua `in-progress`; a 021 permanece
bloqueada. Esta preparação não autoriza publicação ou ativação.

## Repetição explícita

Com Docker local, config isolada sem credenciais, bases já presentes e autorização
dos dois pacotes, no módulo gateway:

```text
node scripts/ubuntu-base-update.mjs
  --architecture arm64
  --destination <diretorio-absoluto-canonico-inexistente>
  --docker-config <config-isolada>
  --docker-host unix://<socket-local-absoluto>
  --approve-two-package-install yes
```

O bloco representa um comando; para x86_64 usar `amd64`. Não aceita socket remoto,
instalação implícita de dependências ou reutilização de destino. Falha após reserva preserva
os logs/planos e gera `failure.json`; limpar/repetir exige novo destino e não
transforma uma preparação parcial em base admitida. Apenas o container criado
por essa execução é removido automaticamente. Ver também o
[empacotamento nativo](rendering-native-image.md).
