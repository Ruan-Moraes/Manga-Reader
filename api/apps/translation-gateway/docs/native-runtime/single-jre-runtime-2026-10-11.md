# Distribuição local com um JRE — 2026-10-11

**Auditoria posterior:** a [conferência física dos archives](rootfs-archive-audit-2026-10-11.md)
detectou mudança de dois nomes Unicode que listas/mtree não mostravam.
Os recibos abaixo não são mais aceitos pelo empacotador experimental; a
fotografia e suas provas funcionais são preservadas, sem admissão operacional.

Continuação da [validação das fontes Ubuntu](ubuntu-java25-fonts-2026-10-11.md).
Experimento local de empacotamento da 020; sem instalação adicional, aquisição
de binários/modelos, credenciais, provider real, publicação, deploy ou troca de defaults.
020 `in-progress/open`; 021 `approved/blocked`.

## Plano executado e integridade

Reempacotar os arquivos já verificados, mantendo somente o JRE Ubuntu, sem
remover pacotes APT ou substituir bibliotecas. Os recibos de instalação das
bases anteriores e seus 25 artefatos foram conferidos antes de criar containers.
Nenhuma imagem anterior foi alterada.

1. Export de container próprio, sem execução, rede ou volumes configurados.
2. Filtro de arquivo no `bsdtar` já instalado, **sem extração no host**.
   Exclui `/opt/java/openjdk`, seu hook `/__cacert_entrypoint.sh` e somente
   conteúdos dos caches `/tmp`, `/var/lib/apt/lists` e `/var/cache/apt/archives`.
   Diretórios-raiz, `/var/tmp` e caminhos semelhantes fora desses prefixes ficam.
3. Comparação integral das entradas mantidas: tipo, UID/GID, modo, timestamps,
   symlinks e SHA-256 de arquivos regulares via mtree, sem `/set` implícito.
   Hardlinks são conferidos pelos headers e devem resolver para conteúdo hashed;
   ciclos, destinos ausentes/alterados ou digest ausente sem prova falham.
4. Import somente do arquivo filtrado numa nova base, uma camada cujo diff ID
   corresponde ao SHA-256 do tar. ENV/entrypoint selecionam Ubuntu explicitamente.
5. Conferência readonly como UID 1000: mesmo inventário de 121 pacotes, mesmos
   arquivos JRE Ubuntu, certificados Java/OS presentes, árvore Temurin e hook
   ausentes. Nenhum APT update/install/remove.
6. Novos workers usam cópia exata do `Dockerfile.native`, JAR/pacote existentes e
   metadata diagnóstica `local-single-jre-worker-1`. O empacotador público não foi
   alterado para aceitar uma prova incompatível com seus dois patches.

O filtro inicial sem âncora também excluiu quatro diretórios mantidos pela
política; o guard interrompeu **antes do import** nos dois alvos. Um teste de
regressão com o `bsdtar` real reproduziu isso. A correção usa início ancorado e
padrão não vazio para conteúdos, conforme a
[implementação do libarchive](https://raw.githubusercontent.com/libarchive/libarchive/v3.7.4/libarchive/archive_pathmatch.c).

A segunda tentativa detectou dois hardlinks legítimos sem digest mtree:
`perl5.38.2→perl` e `uncompress→gunzip`. Também interrompeu antes do import.
Acrescentou-se prova específica de hardlinks, não uma dispensa de hashes para
arquivos comuns. Cinco testes JavaScript passaram, incluindo fraude de target,
ciclo, mudança de owner/mode/hash, entradas extras e exclusões indevidas.
Todos os exports/falhas ficaram preservados em destinos separados; containers
de coleta próprios foram removidos. Não houve automação destrutiva no host.

Mtree não é prova exaustiva de xattrs/ACLs/capabilities de arquivos. A imagem
continua experimental; admissão de distribuição exige auditoria adicional.
Os archives selados permitem repetir o filtro; novos exports/imports têm
timestamps Docker novos. **Não se afirma build bit-reproducível nem assinatura.**

## Artefatos e tamanho medido

| Alvo           | Base de uma camada                                                        | Worker diagnóstico                                                        |
| -------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| ARM64          | `sha256:1e42b10fca5b2343e499fd0a3ae0024b37c65901bad9652e2dc4c382834c3d91` | `sha256:8d3dd32fac88da20750925486843cf6ef7d34478b427bac50ded7dc40403fabf` |
| x86_64 emulado | `sha256:3df626edf810651bb877b9010b8d81f8624dd86541d42603d809cd6b7b70d953` | `sha256:b073b36b09ef30a872328c6c91bb08ec07e94adb392c6af0d4df91e9883f5dd4` |

| Medição em bytes                         | ARM64 antes → depois      | x86_64 antes → depois     |
| ---------------------------------------- | ------------------------- | ------------------------- |
| Rootfs tar, mesma medição sem compressão | 715.773.440 → 395.836.928 | 689.846.272 → 371.041.792 |
| Base, `docker image inspect Size`        | 300.165.977 → 127.595.872 | 302.000.288 → 129.207.603 |
| Worker novo, `Size`                      | 351.216.411               | 352.824.563               |

Redução do rootfs exportado: 44,70%/46,21%. São 5.823/5.832 entradas mantidas,
375/376 excluídas. A redução de disco **não é redução de memória** nem admissão
do orçamento cloud de 1 GiB. Não se misturam bytes do tar com bytes comprimidos
ou espaço total do daemon incluindo imagens históricas.

Recibos de base SHA-256: ARM64
`b6875732d9729b7ce702cd8987e3e1f1356b964aee858cdfeb57256a0d872e41`;
x86_64 `d188437c2031fdea34b2f33259cae71155bc5540d67443fea291b187f8466453`.
Rootfs filtrado ARM64:
`69414a57422d951c985fd488d52f3cbee8561c0db706a7d8cdc45bc72dbf479e`;
x86_64 `b16c622995d11fd1328bd6ba04ed7716697e2d2d489a891fafb7f0e44954a930`.

JAR preservado `6c6a8703aad2f52839790b7a95852544cc75a3328e2709bc4032dfcd63eee29e`.
Os manifestos nativos são os mesmos da preparação anterior. Build clássico
local, `--pull=false --network=none`, CPU 1/memória 1 GiB; preflight dos dois
workers retornou `admitted-not-operational`, sem imagens ou providers.
Todos os defaults permanecem disabled; worker UID 1000:1000.

## Segurança e alcance

Scan offline dos exports com Trivy 0.75.0 existente e os DBs correntes da
[execução anterior](ubuntu-java25-fonts-2026-10-11.md#repetição-com-dados-correntes):
OS válido até 2026-10-12T13:06Z, índice Java até 2026-10-13T00:59Z.
Sem atualização de dados, telemetry, filtros ou ignore de findings nesta análise.

**Conjunto idêntico ao anterior:** 18 ocorrências OS, 13 MEDIUM/cinco LOW, 121
pacotes; zero nas 195 dependências JAR identificadas. Remover a cópia Temurin
não corrige os CVEs restantes. O scan não cobre integralmente o JRE/codec manual.
Nenhum VEX/waiver/supressão ou aceite operacional foi produzido.

Export: oito camadas em cada worker, todas verificadas por hashes dos blobs
comprimidos e dos diff IDs descomprimidos. A camada-base corresponde ao tar
filtrado; **nenhuma das oito camadas do antigo runtime está referenciada**.
Configuração, arquitetura e vínculo do scan ao config hash foram conferidos,
sem presumir que ID Docker e ID do config exportado sejam iguais.

| Alvo   | SHA-256 do export                                                  | SHA-256 do scan                                                    |
| ------ | ------------------------------------------------------------------ | ------------------------------------------------------------------ |
| ARM64  | `0bd9328320037ec4555c15ce260210464e092ec9c20828b452eaab050ea7b6ca` | `43ad83d9c9c4f07c772c18df29a16d07f50be39b3e79d32f56e101e4541896c2` |
| x86_64 | `b6a4f45fcecfa4dc7e7d7208953c807ee365580f051e88147c5f40caf6516b3c` | `866b87ae451bcddd07898de8cba038bbfdf2f35ea30e0bdb0930764a872eef38` |

Revalidação nas duas novas imagens readonly/sem rede: executáveis específicos
`nscd`, `systemd-journald`, `newuidmap` e `newgidmap` ausentes. Isso restringe
precondições dos alertas associados, sem remover o finding do pacote nem
certificar ausência de caminhos equivalentes. Condições dos dez CVEs anteriores
estão na [triagem histórica](native-residual-security-2026-10-11.md); GLib e
HarfBuzz na [continuação](ubuntu-java25-fonts-2026-10-11.md#segurança-comparação-offline-não-aprovação).

Continuam abertos: glibc (6 ocorrências), expat (1), GLib (1), HarfBuzz (1),
PCRE2 (2), systemd/udev (2), login/passwd (2), tar (2) e zlib (1). Não houve
novo teste de exploração ou auditoria completa dos SDKs/binários. Pinned fonts,
paths controlados, child supervisionado, root readonly e ausência dos daemons
são controles relevantes; não demonstram por si só não explorabilidade.

## Pipeline e gates

Matriz opt-in aprovada nas novas imagens: **40 testes, zero falhas/erros/skips**,
1.577,953 segundos. Mesma configuração `renderer.native.image.runtime=ubuntu`,
pins/socket/decoders/modelo existentes e PG17 privado. São 19 probes e um teste
HTTP por alvo: SDKs loopback, layout real local, JPEG/WebP, dimensões limites,
pintura nos sete idiomas e falhas/timeout/cancelamento com recuperação.
Os resultados anteriores não são atribuídos a esta distribuição.

Java Ubuntu, UID 1000, defaults disabled e zero OOM kills nos 38 probes. Picos
cgroup observados: ARM64 2.577.530.880 bytes (~2,40 GiB); x86_64 emulado
2.849.484.800 bytes (~2,65 GiB). São controles sintéticos com orçamento de
8 GiB, não OCR/tradução reais ou benchmark de qualidade/memória operacional.
Uma rodada não permite concluir ganho/regressão de RAM contra a distribuição
anterior. HTTP privado: health 200, `/v1` 403, OCR disabled 503.

XML SHA-256 `47a9e23b1db5b8fd98045a0cbb4f1675c65834bd07bbcbe27d42443ba4725cca`;
log `89a8fbba6993ebcc30b61071dae98276b546d97a10630a57afda6a9419f8788f`.
O XML foi preservado antes da suíte Maven comum, que não ativa a matriz opt-in.

Gates já aprovados: cinco testes do filtro/provas, tooling gateway Node
(114 pass/um skip), web `tsc -b`, `pnpm check` mobile integral
(116 suítes/892 testes, SDD/lint/FSD/type-check/formatação/links), sem reinstalação.
Maven global offline com Docker aprovado: sete módulos `SUCCESS`, 2.741 testes
contabilizados, zero falhas/erros, 103 skips opt-in; 3min37s. A matriz nativa foi
executada separadamente, não omitida com os skips do comando comum.
Prettier direcionado e 259 links relativos em 77 documentos passaram.
Diff do gateway aprovado; diff global segue bloqueado pela linha vazia externa
em `PlatformBadge.tsx:44`, preservada. Não se afirma gate global de diff verde.
Não houve modificação de fonte Java, testes, schema, manifesto ou Terraform;
checksum técnico de 402 arquivos revalidado, sem mudança:
`25f52c11e40f137e7b924038c1d6a7888a10debdd9e20acfeb8b6c37f7a16f7a`.
Ferramentas/provas privadas e documentos não entram nesse escopo. O checksum
mobile não foi renovado porque seus arquivos também não foram alterados.

Admissão operacional, qualidade humana, assinatura/proveniência de distribuição,
memória no ambiente alvo e eventuais correções dos pacotes continuam abertas.
Novo pacote/upgrade ou publicação exigirá aprovação específica; não será feito
como efeito colateral de um teste. Este marco não fecha a 020 nem abre a 021.
