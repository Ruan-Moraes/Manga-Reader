# Runtime dedicado do pré-pull preparado localmente — 2026-10-13

**JRE copiado/inventariado/testado; não instalado ou enviado à cloud.**
Continua o [verificador Java](worker-isolation-prepull-guard-2026-10-13.md).
Ruan respondeu «Vamos continuar» ao pedido delimitado de reutilizar o runtime
local, sem downloads/instalação macOS/cloud e com teto adicional de 512 MiB.
A autorização foi aplicada somente a esse preparo. 020 `in-progress/open`;
021 bloqueada; defaults e arquivos de performance preservados.

## 1. Origem, limites e extração

Parcela ignorada `prepull-runtime.2rDkeE`. Imagem local por digest:
`sha256:cf73e5c4241a96a095dcec030296dfea3269a3c50d6152466a09802fe17b0c02`.
Inventário de hashes regular obtido dentro da imagem e comparado com a cópia.
Nenhum pull, rebuild, pacote extra, credencial Google/registry ou provider.

Somente `/opt/java/openjdk` foi exportado por tar USTAR, normalizando owner/group
e timestamps do **arquivo de transporte**, sem alterar conteúdo ou recortar JRE.
Archive SHA-256:
`0c00b31c38fef780762193997753dce6e83ec559051409dfea49c81be50a13fe`.
Não é o checksum do archive oficial Adoptium: esta é uma cópia da árvore
instalada na imagem já registrada.

Validação JS ocorreu antes de extrair: checksum/header/trailer, hash completo,
limites, paths canônicos, duplicates, tipos, parents e links. Recusa escape,
link externo/ausente/cíclico, arquivo sob parent symlink, hardlink/device/PAX
inesperado e permissões especiais. Destino é exclusivo; falha não reusa ou
sobrescreve uma árvore existente. Licenças e seus links internos foram mantidos.

| Medida observada                                  | Quantidade                                               |
| ------------------------------------------------- | -------------------------------------------------------- |
| Archive de origem                                 | 200.048.640 bytes                                        |
| Conteúdo regular do JRE                           | 199.841.004 bytes                                        |
| Archive + conteúdo                                | 399.889.644 bytes, aproximadamente 381 MiB               |
| Entradas                                          | 326: 122 arquivos regulares, 142 symlinks, 62 diretórios |
| Teto autorizado, incluindo preparo/intermediários | 536.870.912 bytes                                        |

Todos os 122 hashes regulares coincidem com a origem. Links permanecem dentro
do runtime; os 142 são tratados como topologia, não seguidos cegamente durante
extração. A cópia é local/ignorada, não registro de um serviço instalado no Mac.

## 2. Bindings reais, ainda sem bootstrap de entrega

`prepare-bindings.mjs` releu bytes/topologia extraídos, vinculou as quatro classes
de produção já verificadas e gerou uma nova unidade/cloud-config local.
Classes de teste não foram copiadas para o conjunto de produção.
Manifesto de 264 linhas cobre arquivos e conteúdo alcançado pelos links.
Inventário separado conserva tipos, targets e hashes; o futuro instalador deve
validar topologia/permissões, não somente executar sha256sum sobre links.

| Artefato preparado     | SHA-256                                                            |
| ---------------------- | ------------------------------------------------------------------ |
| `runtime-files.sha256` | `a03495fe8b1eee74dfa94044fc5445e218703bf093f00f47492f1e934e14515c` |
| `guard-root.sha256`    | `c656c6e788f5369648f14f34b530b3add381d4aa9af62f438238b9e950afb856` |
| `cloud-config.yaml`    | `f7c6f0843131423d3611aece91b31b518dd6073b53a01b899d0baab9e735b99f` |
| Unidade systemd        | `668a3f9a1b432cea890b2418c841e4380ffe23125c34279fde8f5e9d372c66b1` |

Rodada/nome `20261013-jre` e zona a são **exemplos não reservados**. Aprovações
de segurança, instalação e execução continuam falsas. Pacote anterior intacto.
O novo hash de metadata poderá ser vinculado ao leitor somente no uso autorizado.

**Bootstrap ainda não resolvido:** o JRE deve chegar à VM por um canal privado
independente do Docker pull que ele protege. Não tentar baixar sua imagem pelo
mesmo pull antes do guard, publicar JRE em bucket público, expor signed URL em
metadata/argv/log ou reutilizar bucket/credencial OCR para destravar a cadeia.
Não existe instalador remoto ou novo recurso de entrega nesta parcela.

## 3. Testes e dependências

Testes Linux utilizaram a imagem existente, rede `none`, rootfs/mounts read-only,
usuário 1000, capacidades removidas e memória/PIDs limitados. Runtime original
em `/opt/java/openjdk` foi ocultado por tmpfs; execução veio do JRE copiado.
Isso evita testar acidentalmente a árvore original em vez da cópia.

- Java executado: `25.0.4.1+1-LTS`, vendor Eclipse Adoptium.
- Truststore público abriu com 118 entradas; factory JSSE carregou, sem socket.
- As mesmas 50 fixtures sintéticas do guard passaram sob prazo nativo.
- Cinco casos do pacote passaram: bindings raiz, 264 checksums, runtime/truststore, fixtures e CLI de produção sem modo live (exit 2).
- Cinco testes do archive e regressões locais: 44 testes Node aprovados, zero failures/skips.

Containers temporários foram removidos ao terminar, sem apagar imagens/caches
ou evidências. O teste usou Ubuntu do carrier, **não COS**; DNS/TLS reais,
autenticação/redirects e operação do worker não foram executados.

Metadados ELF de 39 objetos lidos com `readelf` já disponível em outra imagem
local. Identificam dependências declaradas e símbolos GLIBC até 2.17 nos objetos
consultados, não disponibilidade desses símbolos no COS ou auditoria de CVEs.
Componentes gráficos/áudio têm dependências externas próprias; não instalar
essas bibliotecas por impulso para um guard que não usa renderização.

Primeira consulta `ldd` ainda enxergava libjvm da árvore base, limitação registrada.
Conferência seguinte ocultou essa árvore e apontou ao runtime copiado; nenhuma
biblioteca extra foi copiada. `readelf` é inspeção estática, e chamadas via
`dlopen`, dependências do host e comportamento no COS continuam com prova própria.
O sucesso das fixtures não equivale a ABI ou isolamento operacional aprovado.

## 4. Evidências e próximo trabalho

| Recibo privado              | SHA-256                                                            |
| --------------------------- | ------------------------------------------------------------------ |
| Cópia/origem                | `bb5f7dffbb4589ce8ab1e958643a26373e329cfecb75f001a9a7c784f8ed169a` |
| Inventário de topologia     | `d03aeebd10fd799cdc2cbc03d0790f8d2a8a32b4d5cb902dd8f9235a18a5c3b6` |
| Metadados ELF               | `5d0f0b38899ee8fce4675308464662cc2a0eb5888fa87beb5ec9f022d60369fc` |
| Bindings                    | `93b9408f4fc78addb80c3a0446fbaedaf981731ae3a95d13b7baa7c2de65d4b3` |
| Testes do runtime vinculado | `88fdea3f07f89d568107f5d7fd6274e54d3a6c0ae69ba64814a0f53100163c60` |

Próximo trabalho seguro: definir/revisar entrega privada de bootstrap e sua
retirada, sem instalação/acesso cloud implícitos; fechar gates de segurança,
preflight de políticas e preparar a prova COS. Nova aquisição/instalação,
credencial, upload/recurso/custo ou execução exigem a confirmação delimitada
correspondente. Não atualizar banco de scan descartado nem redatar o scan antigo
como cobertura nova do JRE. 020/021 e todos os defaults permanecem inalterados.

Fechamento local às **13:56 de Brasília**: 419 caminhos/bytes técnicos iguais
à fotografia `1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`;
pacotes anteriores conferidos e intactos. 36 links locais nos três documentos,
sintaxe dos scripts e Prettier direcionado aprovados. Preparo total observado
antes do recibo: 400.088.070 bytes; ainda abaixo do teto com metadata restante.
Disco continuava reportando 27 GiB livres. Nenhuma remoção de arquivos de
performance ou cache de imagem; archive e árvore permanecem necessários para
teste/entrega e não foram descartados para obter verde.

Recibo `verification.json` SHA-256:
`e4bf9b93a38ddfa039df1952f1cfdeb1a3cb4f7bd7596c8a1f9e9afc30530d24`.
Diff-check do gateway aprovado; global mantém o EOF externo em
`web/landing-page/src/shared/component/PlatformBadge.tsx:44`. Maven/web/mobile/SDD
não reexecutados para redatar gates por essa preparação local. Não é conclusão
do isolamento operacional ou da feature de renderização.
