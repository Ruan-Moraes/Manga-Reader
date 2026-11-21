# Prova mínima de montagem/conteúdo — preparação em 2026-10-14

**Preparação offline; nenhum disco/VM criado e nenhuma montagem real.**
Continua o [diagnóstico da origem vazia](worker-isolation-source-echo-budget-2026-10-14.md).
O pedido «Vamos» dá continuidade ao trabalho sob o limite de US$ 5; não elimina
gates de segurança nem a necessidade de aprovação para instalações.
020 `in-progress/open`, 021 bloqueada; defaults e performance preservados.

## Escopo separado do worker

Nova parcela privada ignorada `mount-only.y8LXTA`, em
`.local/worker-isolation/`. Gerador JavaScript sem SDK, credencial ou cliente
Google; não fornece request de criação/deploy. Unidade nativa futura verifica
somente filesystem conhecido: sem executar Java, classe do guard, Docker pull,
container, OCR, tradução, renderer ou binário do disco de dados.

Essa separação não resolve os CVEs/risco de pull da
[revisão COS](worker-isolation-vm-security-2026-10-13.md) nem admite o worker.
A proposta exige host dedicado, nenhuma service account/IP externo e egress
deny-all, mas não cria rede, firewall, VM ou IAM. Os controles efetivos e a
revisão de segurança específica para a prova mínima permanecem pendentes.
Não reutilizar a configuração antiga com credencial de registry ou acrescentar
autoridade ao host só para conseguir ler o disco.

## Integridade e caminho fixo

O archive pinado continua com 62.359.506 bytes e SHA-256
`f8b8009f1684e29050a5472c2dc3077e6177ef322c667000e532c8bc2dd6135c`.
Leitura local streaming conferiu novamente seus bytes, sem cópia grande.

Descoberta preparatória: manifests dentro desse archive contêm caminhos
absolutos em `/mnt/disks/toonlira-prepull/vm-diag-20261013-jre`. Não criar outro
mount point com a data nova e reescrever manifests/imagem para fazê-los passar.
O gerador preserva esse mount point numa VM futura nova; o ID da prova, estado
e âncoras externas têm nome próprio. Não executar em host compartilhado que já
tenha esse mount point ou reaproveitar diretório de prova existente.

Âncoras independentes do disco, incorporadas à cloud-config:

| Conteúdo               | SHA-256                                                            |
| ---------------------- | ------------------------------------------------------------------ |
| Inventário esperado    | `6411d5946d1235c65ef5410dbf120723eada850145a217b96bace89fe957d236` |
| Manifest raiz do guard | `065bcd0a4ad6fda69a1cc8ca7cbf6aabd7c119e9f2bae8589a1f1a17a59da26f` |
| Manifest do runtime    | `d390baf8aee007658480af6a07e3d91c3d678d8adad8efae4e82bacfbf95d3c7` |

335 entradas: 128 arquivos regulares, 142 symlinks e diretórios. A cobertura
dos manifests inclui todos os 270 paths de arquivo/link, sem repetição ou
entrada desconhecida; links são validados topologicamente antes da conferência
dos hashes dos seus conteúdos. A tentativa inicial de comparar somente arquivos
regulares foi corrigida, mantendo hashes e inventário pinados, sem excluir links.

## Unidades propostas, não executadas

Sequência coordenada única, com intenção exclusiva persistida antes de verificar:

1. Criar estado novo, sincronizá-lo e emitir marcador BEGIN.
2. Parar/mascarar Docker/socket/containerd. Falha interrompe, não ignora unidade
   ausente nem autoriza instalação ou uso de outro serviço silenciosamente.
3. Exigir dispositivo de bloco por nome fixo; `blockdev --getro` deve produzir
   exatamente `1\n`, comparado com referência externa ao disco.
4. Iniciar unidade `.mount` com ext4 `ro,noload,noexec,nosuid,nodev`.
5. Conferir source/target/tipo/opções pelo findmnt, incluindo `norecovery`;
   comparar saída a um único mount point esperado em arquivo próprio.
6. Em unidade separada, conferir âncoras, listar e ordenar inventário, comparar
   byte a byte e conferir manifests raiz/runtime. Nenhum payload executado.
7. Só depois emitir CONTENT-PASS e o resultado terminal do systemd na serial.

A conferência de mount usa arquivo diferente do TSV: compartilhar stdout de
findmnt com o inventário poluiria o resultado. O gerador novo evita essa mistura;
geradores/recibos antigos não foram alterados ou retrospectivamente aprovados.
O `.mount` ocorre no host; verificadores clonam namespaces apenas depois,
sem presumir que um mount feito em ExecStartPre sobreviveria em namespace privado.

Unidades verificadoras têm rede privada, famílias de socket restritas,
capabilities removidas, NoNewPrivileges, rootfs protegido e escrita limitada ao
estado da prova. Isso é intenção de configuração, **não controle observado no COS**.
O coordenador usa systemctl/printf, sem shell próprio; cloud-init recebe arrays
de comandos, não um script de download/instalação.

Nome `.mount` e argumentos systemd exigem escaping dos hífens do path;
YAML já foi conferido com o parser existente, preservando backslashes, tabs e
newline. Sintaxe real/paths/binários da versão COS ainda exigem verificação.
Referências: [COS e discos](https://docs.cloud.google.com/container-optimized-os/docs/concepts/disks-and-filesystem),
[mount](https://man7.org/linux/man-pages/man8/mount.8.html),
[findmnt](https://man7.org/linux/man-pages/man8/findmnt.8.html) e
[configuração COS](https://docs.cloud.google.com/container-optimized-os/docs/how-to/create-configure-instance).

## Coleta e limites de evidência

Parser de serial puro: no máximo 1 MiB, linhas limitadas, ID exato e sequência
BEGIN → CONTENT-PASS → TERMINAL:success. Repetição, ordem incorreta, truncamento,
marcador de outra rodada, falha ou byte NUL não passam. Ignora somente tail
incompleto; terminal sem newline não é aceito.

Mesmo uma fixture perfeita retorna `controlPlaneBound=false`,
`filesystemVerified=false`, `sourceGenerationSelectionVerified=false` e
`operationalApproved=false`. A coleta real futura precisa vincular serial à
VM/ID/configuração e verificar sourceImageId, disco/ID/zona, attachment não boot
READ_ONLY e ausência de drift antes/depois. Um marcador isolado não é atestação.

Não comparar o SHA integral de um disco provisionado de 10 GiB com o RAW local
de 1 GiB; esta proposta confere conteúdo/topologia do filesystem, sem formatação,
fsck, crescimento, remount rw ou execução de ferramentas importadas.
O eco vazio do GET de imagem não prova falha nem conteúdo: permanece pendência
separada, sem relaxar o validador histórico para obter um resultado verde.

## Testes locais e pendência de instalação

13 testes Node novos: paths/âncoras/cobertura, ordem de verificações, isolamento
de stdout, invariantes de configuração, alterações/injeção, imutabilidade,
roundtrip YAML e parser de serial. Testes escritos antes da implementação.
O teste inicial de shell por substring confundiu `sha256sum` com `/bin/sh`;
agora confere limites do nome do executável, sem desabilitar a proibição.

Em **14/10 às 21:38 de Brasília** (15/10 00:38 UTC), 11 checks nativos locais
passaram em containers pequenos da imagem já existente
`sha256:33dc2ce37f31493434e0d194a925cfab1a12cb019acffd2e0df49614a12cd5a8`:
oito tabelas mountinfo sintéticas (inclusive recusa de exec/recovery), dois cmp
para flags RO/RW sintéticas e recusa de blockdev sobre arquivo que não é bloco.
Não houve caso positivo sobre dispositivo real, mount ou serviço systemd.
Containers com rede none, pull never, UID 1000, cap-drop ALL, rootfs/fixtures
readonly, 128 MiB de memória/swap e PIDs 32. Client Docker usa socket local e
configuração vazia própria, não credenciais de registry do usuário.

`systemd-escape` está ausente nessa imagem; não foi instalado. A validação
systemd nativa continua aberta, incluindo `systemd-analyze verify` e a execução
no COS pinado. Resolver o módulo YAML pelo package raiz inicialmente falhou;
foi usado o caminho já existente da versão 2.9.0, sem reinstalar dependências.
Acesso inicial ao socket Docker foi bloqueado pelo sandbox; a chamada local
foi executada após revisão do escopo, não por mudança de permissões do socket.

## Orçamento, retirada e próximo gate

Ledger compartilhado `budgeted-import.t0Af3K/budget.VNEDyk` foi apenas lido:
as duas reservas anteriores permanecem byte a byte iguais, sem terceira reserva
ou nova despesa cloud nesta parcela. US$ 5 continua limite autorizado; reservas
não representam fatura apurada. O envelope anterior só cobre importação; não
reutilizar sua estimativa como cotação completa de VM/discos/rede.

Antes de qualquer execução real: fechar verificação nativa/systemd e revisão
de segurança da prova mínima; preparar binding e coletor bounded por IDs;
cotar o envelope completo dentro do ledger existente; construir a sequência
de criação/observação/retirada própria, sem reimportar apenas para repetir o
eco vazio. Não reutilizar recursos retirados ou introduzir IAM/credencial no
guest. Remoção deverá confirmar VM/discos/imagem/objeto/bucket ativos ausentes,
sem tratar STOP, timeout ou soft delete como eliminação física.

Se o verificador Linux exigir pacotes novos, pedir aprovação específica para
uma imagem de teste descartável; não instalar no Mac ou redatar verificação
COS com resultado Ubuntu. Nenhuma instalação, credencial Google, chamada paga,
deploy, nova imagem de mangá, alteração legal ou arquivo de performance.

## Fechamento local

176 testes Node aprovados, zero failures/skips; 11 checks nativos separados,
sem confundi-los com montagem ou boot real. 37 links relativos, Prettier dos
cinco fontes/testes e três documentos, arquivos preparados por hash e
diff-check direcionado do gateway aprovados. Global preserva o EOF externo em
`web/landing-page/src/shared/component/PlatformBadge.tsx:44`, não corrigido.

Os 419 paths/bytes do snapshot técnico continuam com
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`.
Não cobre Dockerfile, mobile, este tooling ignorado ou aprovação de segurança.
Não reexecutados/redatados Maven, web, mobile ou SDD por esta preparação sem
mudança de runtime, schema, status ou defaults.

| Artefato local              | SHA-256                                                            |
| --------------------------- | ------------------------------------------------------------------ |
| Gerador `mount-proof.mjs`   | `1a9501d9bcc72ad35e4a007a70dd4ed02b79267b0f5d6248fad998429258d135` |
| Preparação exclusiva        | `f1d702587da5a80714d1b0929be2909346cb4085191c1f0cffb981a2abb255c1` |
| Checks nativos com fixtures | `0e3e05cf87d865eeadc58c079ab63ccc4ce42d820bbf9cf96484e725df315db2` |
| Verificação final           | `b486153fba8133f337051fda155132dbdbf6c819d0f8a0fb316e22bcf63e85b1` |

Parcela nova de cerca de 192 KiB; Mac segue com cerca de 23 GiB livres. Nenhum
JRE/RAW/archive copiado, cache grande instalado ou arquivo de performance
alterado/removido. A próxima autorização solicitada é somente para instalar o
verificador Linux em imagem local descartável, não para usar outro slot cloud.

Continuação de 15/10: a [verificação systemd local autorizada](worker-isolation-systemd-verification-2026-10-15.md)
concluiu a instalação e verificou uma proposta revisada. Identificou também
que o caso blockdev dentre os 11 checks antigos não comprovava recusa válida:
o comando podia estar ausente. A correção e o novo check estão no registro
seguinte, sem sobrescrever esta fotografia histórica ou aprovar execução COS.
