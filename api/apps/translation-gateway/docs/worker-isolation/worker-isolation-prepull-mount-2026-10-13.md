# Montagem e inventário anteriores ao Java — 2026-10-13

**Launcher integrado localmente; montagem/serviços não executados no COS.**
Continua a [entrega privada do disco](worker-isolation-prepull-delivery-2026-10-13.md).
Ruan pediu «Vamos indo». Esta parcela prepara/verifica o pacote local sem
credenciais, instalação, download, upload, recurso cloud ou chamada cobrada.
020 `in-progress/open`; 021 bloqueada; defaults e performance preservados.

## 1. O que foi integrado

Parcela ignorada `prepull-mount.8Hie6y`. `mounted-launcher.mjs` gera novo pacote
sem alterar disco, launcher ou recibos anteriores. Não é ferramenta de deploy.

Sequência proposta na unidade principal:

1. Reservar intenção persistente exclusiva e sincronizá-la; repetição falha.
2. Exigir dispositivo de bloco, criar mount point exclusivo e montar ext4
   `ro,noload,nosuid,nodev`, sem fsck, formatação ou alteração do dispositivo.
3. Conferir source/mount point/tipo/opções pelo findmnt do kernel.
4. Iniciar inventário **nativo**, sem Java: find → sort em locale C.
5. Conferir âncoras independentes da metadata e comparar inventário byte a byte.
6. Conferir manifests de classes/runtime; executar guard Java sob prazo nativo.
7. Só então fazer um pull por digest e o diagnóstico com container sem rede.

O filtro findmnt exige `+ro,+nosuid,+nodev,+norecovery`; `norecovery` é a
representação esperada do flag ext4 após solicitar `noload`, **ainda sujeita a
prova no COS**. Não trocar filtros por `--target` permissivo, ignorar exit code
ou relaxar opções se a versão pinada não aceitar a consulta.
Referência: [findmnt](https://man7.org/linux/man-pages/man8/findmnt.8.html).

## 2. Integridade fora do disco

Inventário TSV registra paths relativos, tipos, UID/GID, modos e targets de
symlinks. Âncoras/expectativa ficam em `/etc/toonlira-prepull/<rodada>`, escritos
pela cloud-config revisável root:root/0600, **não são declarações autônomas de
integridade feitas pelo disco**. A configuração inteira recebe hash próprio.

Inventário obtido pelo helper em `/var/lib/toonlira-diag/<rodada>` é comparado
com a expectativa. Mudanças de owner/mode/link, tipos especiais, falta ou sobra
de entrada impedem chegar ao Java. Links externos/cíclicos/ausentes, parent
incompatível, nomes inseguros e escrita group/other em arquivo/diretório também
são recusados pelo gerador. Symlinks não são seguidos pelo find.

A unidade auxiliar tem timeout de 15 s, `LimitFSIZE=131072`, `UMask=0077`,
locale C e stdout somente em arquivo privado, stderr null. Sem fila, retry,
shell próprio, Python ou C próprio. Usados find/sort/cmp/sha256sum já existentes.
`StandardOutput=file:` não trunca; a exclusividade da intenção garante arquivo
novo. Sort usa `--output` e não imprime conteúdo. Não usar `truncate:` em todos
os comandos, pois a abertura do ExecStartPost apagaria o inventário.
Semântica: [systemd.exec](https://man7.org/linux/man-pages/man5/systemd.exec.5.html).

O hash do manifest raiz guard é ancorado antes de ele poder determinar os demais
hashes. Runtime Java não é carregado para validar sua própria topologia.
O pacote não faz atestação do kernel, root comprometido, CVEs ou API Compute;
montar filesystem pressupõe disco próprio/control plane confiáveis, não input
de mídia arbitrária. Leitor/API futuros terão de validar a identidade do disco.

## 3. Evidência real local versus fixtures

Às **20:56 de Brasília**, debugfs existente leu o disco local read-only, sem
mount/loop device ou container privilegiado. Hash do disco confirmado:
`ecb049d34c8a331dc5d2e220e236ba19a64ffda2f7281cbd7c0405892c559b27`.
Foram vinculadas **335 entradas**, incluindo root/lost+found, quatro classes,
manifests e os **142 symlinks** do JRE. UID/GID/mode vêm dos inodes ext4;
targets vêm da origem/readback anterior e do inventário pinado, não da imagem OCR.

O parser inicialmente recusou slots de diretório livres em lost+found. Foi
ajustado para ignorar somente o registro exato `/0/000000/0/0//0/` nessa pasta;
registros desconhecidos continuam recusados. Apenas a leitura metadata foi
repetida após corrigir o parser; nenhum boot/pull/provider foi retomado.

O teste YAML encontrou perda do tab final pelo `trimEnd()` usado para embutir
TSV. Correção remove somente o newline final, preservando campos vazios/tabs.
Parser YAML 2.9.0 **já presente** confirmou roundtrip exato de TSV, âncoras e
duas unidades; sem instalação. Import de teste foi corrigido para o caminho
local existente, sem atualizar dependências. Red module-not-found antecedeu
implementação; depois oito testes novos passaram.

**61 testes Node aprovados, zero falhas/skips**: contratos novos e regressões
de probe, imagem, perfil, launcher, leitor, política, guard, archive e entrega.
Sem reexecutar Maven/web/mobile/SDD para redatar gates, pois nenhum fonte ou
contrato do gateway/mobile foi modificado neste incremento.

Às **20:58**, nove checks nativos V2 passaram usando a imagem local existente
`sha256:33dc2ce37f31493434e0d194a925cfab1a12cb019acffd2e0df49614a12cd5a8`.
Sete tabelas mountinfo **sintéticas**: caso válido e recusa de rw, suid, dev,
recovery, filesystem ou source errado. Find/sort/cmp foram conferidos contra
referência independente e detectaram alteração de permissão em árvore pequena.
V2 fixa `LC_ALL=C` explicitamente; V1 tinha conferência positiva menos forte e
locale implícito. Recibos V1 preservados como histórico, não cobertura nova.

Containers rede none, rootfs/mounts de entrada readonly, UID 1000, cap-drop ALL,
PIDs 32 e memória/swap 128 MiB. Não foi executado mount, serviço systemd, Java
guard live, DNS/TLS real, Docker pull ou worker. `systemd-analyze` não encontrado
na consulta local; não instalado. A validação systemd/boot permanece aberta.

## 4. Bindings preparados

| Artefato               | SHA-256                                                            |
| ---------------------- | ------------------------------------------------------------------ |
| `mounted-launcher.mjs` | `2760db447de2b417352937ea4272df81332f5ed403f04c069bd9224c1484bfcf` |
| Testes do gerador      | `c02a51b6f5ad0e9cf6daf604312060e5cd18ac33b147207bfa26ffc56e2cb903` |
| cloud-config           | `d9e4ce3e672d885ea2d3b206ce823b515dcef65c3bf8d178392ddb9644507ac1` |
| Unidade principal      | `a1fdb815be05ea5c35582cffdf60caf333f6adceec73a4e0acf2323541b39d7e` |
| Unidade de inventário  | `d9e4304f5e2222e166a92bb12e3b3e368c2f6ec62b0b3b89910a9d041fcb637d` |
| TSV esperado           | `6411d5946d1235c65ef5410dbf120723eada850145a217b96bace89fe957d236` |
| Âncoras                | `13224613f351473e30d92e209e96d8e7a6846b6d583663f5981b736cf204ccd8` |
| Recibo de preparo      | `297503e77202ee6b6063cb3ee70d519e8f70097dc23a35b536b9a52105f37d9a` |
| Recibo nativo V2       | `0faa7a3e114dfd120fd78620932cd904d765b28da7ca65a879e7822c92a702d6` |

cloud-config: 28.362 bytes. Nomes/zona continuam exemplos não reservados.
Proposta inclui disco não bootável `READ_ONLY`, mas **source ainda ausente**:
não é insert request pronto. Preservada ausência de aprovação de segurança,
provisionamento/custo e prova COS. Pacotes anteriores intactos, sem novo disco
grande ou cópia do JRE. Metadados/fixtures pequenos preservados para auditoria.

Comandos locais: `node --test .../mounted-launcher.test.mjs`, as nove suites
de regressão anteriores, `node .../prepare-mounted.mjs` e
`node .../check-native.mjs`. Preparo final e fixtures têm destinos exclusivos;
não refazer a execução sobre uma rodada preparada. Inventário/disco não são
sobrescritos para alterar resultados. Helper de execução próprio é JS.

## 5. Próximo gate operacional

O launcher local agora contém a sequência de conferência, mas importação de
imagem de dados, device identity, attachment read-only, paths/ferramentas/flags
no COS e serviço systemd ainda exigem validação real. Disco importado pode
ter tamanho diferente; não apresentar hash integral do RAW local como hash
automaticamente igual do block device provisionado. Não usar crescimento,
formatação, montagem rw ou reparo para destravar boot.

Próximo passo: resolver compatibilidade/importação e IAM/cotação do canal
privado, depois os gates de segurança JRE/COS/DNS e aprovação delimitada de
upload/criação/execução/retirada. Não acrescentar API/helper VM/Cloud Build,
papel amplo ou credencial à VM silenciosamente. Disco ainda não publicado.

Nenhuma promoção da 020/021, renderer, provider ou nova imagem de mangá.
Auditoria de performance, runtime/disco originais e conclusões históricas
preservados. Falhas globais alheias permanecem separadas da validação local.

Fechamento às **21:01 de Brasília**: caminhos/bytes dos 419 arquivos técnicos
ainda coincidem com a fotografia
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`;
bindings atuais e quatro artefatos-chave das parcelas anteriores conferidos,
sem drift. 24 links locais nos dois documentos, Prettier direcionado e
diff-check do gateway aprovados. Global preserva o EOF externo em
`web/landing-page/src/shared/component/PlatformBadge.tsx:44`. Disco do Mac
continuava com 27 GiB livres. Não redatar scan CVE, gates globais ou aprovação
operacional com essas conferências locais.
