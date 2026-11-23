# Entrega privada anterior ao pull — 2026-10-13

**Desenho e prova sintética local; nenhum bootstrap cloud implantado.**
Continua o [runtime dedicado preparado](worker-isolation-prepull-runtime-2026-10-13.md).
Ruan pediu continuar e autorizou adiantar a próxima etapa durante esta parcela.
Aplicado à análise, tooling JS e teste local com ferramentas existentes. Nenhuma
instalação, pacote baixado, credencial, upload ou recurso cloud. 020 continua
`in-progress/open`; 021 bloqueada. Defaults e performance preservados.

## 1. Candidato recomendado, não aprovado operacionalmente

Entregar o JRE pelo pull Docker é circular: o canal ainda não verificado baixaria
o próprio guard. `--network=none` do container não protege o pull no host.
Metadata não é o canal proposto para esse payload grande. Download host com
token traz outro bootstrap autenticado; URL assinada em metadata/argv/log
permanece proibida. Bucket e identidade OCR não serão reutilizados.

**Proposta: disco auxiliar privado pré-carregado, anexo somente leitura antes
do boot.** O JRE chegaria pelo disco, sem download no host antes do guard.
Isso reduz a circularidade, mas não corrige Docker, elimina a credencial futura
do registry ou aprova a mitigação DNS/TLS.

A [anexação de discos não bootáveis](https://docs.cloud.google.com/compute/docs/disks/attach-disks)
admite `READ_ONLY` e device name explícito; escrita é o default. Candidato:
`pd-standard` zonal, mesma zona da VM, `boot=false`, sem compartilhamento.
Não substituir por Hyperdisk automaticamente: suporte read-only varia por tipo.

O [COS documenta cloud-init e montagem de Persistent Disk](https://docs.cloud.google.com/container-optimized-os/docs/how-to/create-configure-instance).
Seus módulos podem repetir a cada boot; conservar intenção persistente e recusa
de repetição. Não copiar o exemplo de fsck com reparo para este pacote read-only.

[Images create](https://docs.cloud.google.com/sdk/gcloud/reference/compute/images/create)
e [images.insert](https://docs.cloud.google.com/compute/docs/reference/rest/v1/images/insert)
documentam criação a partir de archive RAW comprimido no Storage. É fundamento
para um canal candidato pelo control plane, **não prova que nossa imagem ext4
de dados será aceita nem identifica a identidade de importação no projeto**.

A [importação manual de boot disks](https://docs.cloud.google.com/compute/docs/import/import-existing-image)
descreve `disk.raw`, incremento de 1 GB e tar gzip. É orientação de boot, não
certificação deste disco de dados. O `runtime.tar` atual não é imagem de bloco.
[Images import](https://docs.cloud.google.com/sdk/gcloud/reference/compute/images/import)
está marcado deprecated e descreve Cloud Build, VMs temporárias e papéis
adicionais. Não usar esse comando ou substituto como fallback automático.

## 2. Desenho local e pendências de integração

Parcela ignorada `prepull-delivery.y8W1ma`. `delivery-plan.mjs` produz descrição
imutável, sem SDK/comandos cloud/função de deploy. `operationalReady=false`,
aprovações falsas, `diskImageSha256=null`; não é preflight operacional.

Ordem proposta: identificar disco → montar → conferir topologia/permissões/hashes
→ guard Java com prazo nativo → pull único por digest → diagnóstico sem rede.
Falha anterior ao pull deve impedir a sequência, sem retomada automática.

- Dispositivo candidato `/dev/disk/by-id/google-toonlira-prepull`; não reservado.
- Montagem ext4 proposta `ro,noload,nosuid,nodev`, filesystem limpo. Não reparar
  nem formatar no boot; dispositivo/tipo inesperado bloqueia o pull.
- O runtime precisa executar; não aplicar `noexec` a ele. Scratch `/work` do
  container permanece separado e `noexec`.
- Conferir topologia/permissões **antes de Java**; checksum que segue links não
  certifica owner/topologia. Esse checker nativo ainda não está implementado.
- Payload previsto: JRE/licenças, quatro classes de produção e manifests; sem
  fixtures, repositório, mídia, tokens, ADC ou resposta OCR.
- Paths `/mnt/disks/...` ainda não vinculados ao launcher histórico em
  `/var/lib/toonlira-prepull/...`. Pacotes anteriores intactos. A integração
  futura exige novos hashes de unit/config/manifests e revisão do leitor.
- Não montar o disco no container diagnosticado nem expor Docker socket.

## 3. Resultados observados, separados da proposta

Às **20:21 de Brasília**, `prepare-design.mjs` conferiu os 419 arquivos existentes
na fotografia técnica, bindings anteriores e archive sem extrair novamente.
Aggregate preservado:
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`.
Não é inventário de arquivos novos nem checksum mobile/SDD.

Cinco testes novos: shape estrito, hashes/nomes/zona, recusa de escrita/campos
extras de credencial ou aprovação, sequência e imutabilidade. Red inicial:
module-not-found antes da implementação. Green: **53 testes Node aprovados**,
zero falhas/skips, com regressões de probe, imagem, perfil, launcher, leitor,
política, guard e archive. Fixtures não são observações cloud.

Ferramentas inspecionadas na imagem local já existente por digest:
`sha256:33dc2ce37f31493434e0d194a925cfab1a12cb019acffd2e0df49614a12cd5a8`.
Disponíveis mke2fs/e2fsck/debugfs/dumpe2fs, tar/gzip/truncate/mount; fdisk/sfdisk
não encontrados nessa consulta delimitada. Não atesta disponibilidade no COS.
Primeira consulta tinha digest transcrito incorretamente e saiu 125; `--pull=never`
impediu aquisição. Correção usou o digest do recibo anterior, sem trocar imagem.

Às **20:22**, `check-filesystem.mjs` orquestrou utilitários existentes, sem helper
shell/Python/C próprio. Criou filesystem **sintético de 8 MiB**, sem JRE/mídia,
com mke2fs 1.47.0; e2fsck `-f -n` exit 0; readback debugfs corresponde ao texto
sintético. Container rede none, rootfs readonly, cap-drop ALL, UID 1000,
memória/swap 128 MiB e PIDs 32, removido ao terminar. Sem mount/loop device no
host ou container privilegiado. Observados 112 KiB alocados no Mac; 8 MiB é
tamanho lógico. Não prova montagem read-only, ABI, importação ou COS.

| Artefato privado         | SHA-256                                                            |
| ------------------------ | ------------------------------------------------------------------ |
| `delivery-plan.mjs`      | `a92fcc06687e5430211fe15539c7fb5e7da95e86fd6c63339e1567038cb83e15` |
| `delivery-plan.test.mjs` | `2b9d59f51c53e1099b2067e545d026ef2536a8998edfad456efb9b994d1d5cce` |
| `prepare-design.mjs`     | `c906c63eefe230965349ae77c7af2842a343bc72f4236f9aa8442d00a948870e` |
| `design.json`            | `db929f705d95022ee0106acb64963899123ebead1e915e9298e0f5a596cae107` |
| `receipt.json`           | `f0c86a38c8281d5579fcd556cbe23a46f336551ebfa8bbd89b18a468a14660f4` |
| Filesystem sintético     | `adc4b9ca8ef51dda4cc8526a9e5ca45dfdcd0ff3fa6e6bf7cc5140861dbccb3a` |

Comandos locais: `node --test .../delivery-plan.test.mjs` mais os oito arquivos
de regressão; `node .../prepare-design.mjs`; `node .../check-filesystem.mjs`.
Preparadores têm saída/diretório exclusivo; não repetir sobre rodada existente.
Reler os recibos não executa provider ou cria disco cloud.

## 4. Próximo trabalho e retirada

Preparar filesystem real com hashes/topologia, ferramentas já disponíveis e
orçamento explícito de bytes físicos/intermediários. Não gerar vários GiB,
duplicar payload em metadata ou reduzir exigências Compute para caber no teto
da autorização anterior de cópia do JRE. A fixture pequena não é disco real.

Antes da cloud: provar caminho de importação, cotar Storage/objeto, imagem custom
e disco zonal **adicionais** à VM/DNS/registry, resolver IAM mínimo/identidade
de importação e obter aprovação delimitada para upload/criação/execução/retirada.
Não há teto de cobrança aceito. A VM não precisa de acesso ao bucket para ler
o JRE pelo disco; identidade de importação é assunto separado.

Retirada futura somente dos alvos exclusivos confirmados: disco, imagem de dados,
objeto/bucket de staging, após coleta. STOP da VM não retira esses custos. Delete
falho exige recuperação pontual, nunca limpeza global. Preservar evidências,
imagem diagnóstica, JRE, OCR, site e performance.

Importação de dados, checker pré-Java, montagem/bindings, CVEs/ABI JRE/COS, DNS
privado/pull, IAM, orçamento e observação do isolamento continuam abertos.
Nenhum renderer, Vision, tradução ou provisionamento executado.

Maven/web/mobile/SDD não reexecutados para redatar gates: fontes, contratos,
migrations, Terraform/status não alterados. Conferir Prettier, links locais e
diff-check desta documentação. Global EOF externo em
`web/landing-page/src/shared/component/PlatformBadge.tsx` preservado. Nenhum
cache pesado recriado ou arquivo de performance removido; Mac reportava 27 GiB
disponíveis antes da fixture.

## 5. Continuação autorizada: pacote real preparado localmente

A autorização de Ruan foi aplicada também à montagem local após explicitar
limite adicional de 512 MiB físicos para esta parcela. Nada enviado ao Google.
Às **20:28**, `build-data-disk.mjs` montou uma imagem ext4 esparsa contendo o
JRE original, licenças/links, quatro classes e manifests. Ferramentas existentes
em containers sem rede/privilégio; nenhum pacote instalado. Não tem tabela de
partições ou bootloader: é candidato de **dados**, não boot image aprovada.

A entrada usa 126 hardlinks locais para arquivos JRE/classes já preservados;
não altera bytes/modes da origem nem duplica seus blocos. Link count/ctime local
podem mudar; isso não deve ser apresentado como identidade integral de metadata.
Dirs/symlinks e dois manifests novos são próprios. Bindings internos apontam
ao mount point candidato `/mnt/disks/toonlira-prepull/vm-diag-20261013-jre`.
O launcher anterior não foi alterado e ainda não consome esse disco.

e2fsck `-f -n` terminou exit 0. Readback completo por debugfs conferiu todos os
arquivos/hashes e symlinks contra a origem; somente `lost+found` vazio adicional
era permitido. Disco não mudou durante a conferência. Isso não prova owner/mode
de cada inode na VM ou montagem: o checker pré-Java continua necessário.

Após a conferência, removida **somente a árvore temporária gerada de readback**,
aproximadamente 191 MiB de conteúdo. Pode ser recuperada do disco preservado;
originais, staging, recibos e evidências intactos. Nenhuma limpeza global,
cache Docker ou performance alterados.

| Medida desta parcela                        | Observado                             |
| ------------------------------------------- | ------------------------------------- |
| Disco lógico esparso                        | 1.073.741.824 bytes (1 GiB)           |
| Disco alocado no Mac                        | 201.064.448 bytes                     |
| Archive tar gzip                            | 62.359.506 bytes, cerca de 59,5 MiB   |
| Novos blocos físicos no fechamento do build | 263.659.520 bytes, cerca de 251,4 MiB |
| Pico observado com intermediários           | 401.428.480 bytes, cerca de 382,8 MiB |
| Teto adicional explícito                    | 536.870.912 bytes (512 MiB)           |

O accounting usa inode para não contar blocos de hardlinks duas vezes e exclui
arquivos originais emprestados. Pequenos recibos posteriores são adicionais;
Mac continuou reportando 27 GiB livres. Tamanho lógico não é bytes físicos
consumidos nem valor faturável presumido em Compute.

Archive contém somente `disk.raw`, formato oldgnu sparse/gzip. Às **20:29**,
`verify-package.mjs` releu por streaming os **1.073.741.824 bytes descomprimidos**
e conferiu o hash do disco original, sem gravar outra cópia. Não apenas listou
o nome do membro. Os dois arquivos ficaram read-only localmente.

| Artefato                     | SHA-256                                                            |
| ---------------------------- | ------------------------------------------------------------------ |
| `build-data-disk.mjs`        | `29136a21cfda99ec7750b2967bd9d5b7886090416fe6e73e9adb97d2aa93ab21` |
| `data-disk.json`             | `8ee526aa5d21cd2698eec1f9d5d113aa3bf60b4363b509815d256490f73cbe9a` |
| `disk.raw`                   | `ecb049d34c8a331dc5d2e220e236ba19a64ffda2f7281cbd7c0405892c559b27` |
| `data-disk.tar.gz`           | `f8b8009f1684e29050a5472c2dc3077e6177ef322c667000e532c8bc2dd6135c` |
| Manifest runtime neste disco | `d390baf8aee007658480af6a07e3d91c3d678d8adad8efae4e82bacfbf95d3c7` |
| Manifest raiz neste disco    | `065bcd0a4ad6fda69a1cc8ca7cbf6aabd7c119e9f2bae8589a1f1a17a59da26f` |

Comandos adicionais: `node .../build-data-disk.mjs` e
`node .../verify-package.mjs`, exclusivos da rodada. O primeiro reserva destino,
confere hashes de origem, limita prazo/output dos utilitários, monitora orçamento
e só remove os paths de readback que acabou de conferir. Erro conserva staging
para investigação; não reaproveitar diretório parcial nem refazer upload.

`design.json`/recibo inicial continuam fotografias da fase anterior, com hash de
disco nulo. O novo `data-disk.json` registra o disco preparado, mantendo flags
Google import/COS/credenciais/upload/instalação/recursos/aprovação **falsas**.
Não sobrescrever o desenho histórico para fabricar aprovação operacional.

**Próximo trabalho corrente:** preparar validação de topologia/owner/modes antes
de Java e novos bindings de montagem/launcher, confirmar compatibilidade do
caminho de importação e levantar IAM/custo. Cópia local não autoriza upload,
grant, recurso cloud, instalação no COS ou uso de credenciais. A mitigação do
pull e gates CVE/ABI permanecem abertos, assim como 020/021.

Fechamento às **20:30 de Brasília**: inventário técnico atual de caminhos e
bytes ainda coincide com os 419 arquivos da fotografia; disk/archive hashes
reconferidos. Sintaxe dos sete scripts, 23 links locais nos dois documentos,
Prettier direcionado e diff-check do gateway aprovados. Global continua somente
com a ocorrência EOF alheia já citada. Recibo final `verification.json`:
`cca37a3446c618251d0262e27f0e91d5193586b8fa1499abcd8977c4024750f6`.
Recibo do streaming integral:
`cd88703747d829aa4446ee6cf821696eb3306e05f4f68d80c3e3b878bd0fe7d0`.
Esses recibos não atestam Google/COS ou nova aprovação CVE.
