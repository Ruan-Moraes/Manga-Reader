# Verificação local systemd da prova mínima — 2026-10-15

## Resultado e escopo

Após aprovação da instalação local, as cinco unidades da prova mínima revisada
passaram por `systemd-analyze verify --man=no --recursive-errors=yes`, sem saída
ou avisos. `systemd-escape` confirmou o nome da unidade de montagem. Isso é
verificação estática no Ubuntu com systemd 255, **não execução no COS 254**, boot,
montagem real ou aprovação do worker. A 020 continua aberta e a 021 bloqueada;
defaults, runtime e contratos do aplicativo permanecem inalterados.

Continua a [preparação anterior](worker-isolation-mount-only-preparation-2026-10-14.md).
Receipts e propostas históricos foram preservados. Não houve Google Cloud,
credenciais Google, upload, provider, reserva financeira nova ou alteração de
arquivos de performance.

## Instalação autorizada e espaço

JavaScript exclusivo da preparação local, em
`.local/worker-isolation/systemd-verify.y4XEpr/`, fora do Git. APT usou os
repositórios oficiais e keyring Ubuntu da base, sem liberar pacotes não
autenticados. Plano fixado em 19 versões: dez pacotes novos e nove atualizações,
sem remoções ou alterações em outros pacotes. Metadados, tamanho, headers e
SHA-256 de cada arquivo foram conferidos antes da instalação com
`--no-download --no-install-recommends --no-remove`.

A primeira tentativa parou antes de instalar: `dpkg-deb --show` com vários
arquivos retornou apenas o primeiro header. `install-v2.mjs` consulta cada
arquivo individualmente e preserva os recibos anteriores; não relaxa a
conferência nem adiciona pacotes. A instalação usa scripts dos pacotes oficiais,
não scripts próprios em shell/Python/C.

Imagem de verificação local:
`sha256:28152203e7adce5d113b4fa19588799979b6d22be92ccac5309239c0fa9d5718`,
systemd `255.4-1ubuntu8.18`, camadas da base original preservadas. Acréscimo de
21.911.400 bytes no tamanho informado pelo Docker, não medição de espaço físico
recuperável no Mac. Cache de archives limpo; container próprio de instalação
removido e ausência confirmada. A imagem é mantida para os próximos checks;
nenhum pacote instalado no macOS. O Mac permanece com cerca de 23 GiB livres.

## Findings e revisão da proposta

1. O path `/usr/bin/blockdev` não existe na imagem Ubuntu; o binário está em
   `/usr/sbin/blockdev`. A nova proposta fixa esse path, sem fallback ou busca
   em PATH. A presença e versão no COS pinado continuam pendentes.
2. O check nativo anterior aceitava qualquer retorno positivo, inclusive
   comando ausente. Portanto, dos 11 checks anteriormente reportados, o caso
   de recusa de arquivo comum **não constitui evidência válida de blockdev**.
   O histórico não foi sobrescrito. O novo caso exige exit 1, stdout vazio e
   diagnóstico `BLKROGET: Inappropriate ioctl for device`; passou com o binário
   presente. Caso positivo sobre dispositivo real continua pendente.
3. O primeiro harness de sintaxe precisava de `/run` temporário para o socket
   privado do verificador. Recebeu tmpfs próprio, sem liberar rootfs, rede,
   capabilities ou socket do host no container de verificação.
4. A umask privada tornou as cópias de unidades inacessíveis globalmente e
   gerou avisos. As cópias não sensíveis usam 0444; a proposta nova escreve
   unidades em 0644 e preserva arquivos de confiança em 0600. Nenhum segredo
   foi movido para arquivos públicos.
5. Uma preparação intermediária colidiu com o nome do recibo de instalação e
   recusou sobrescrevê-lo (`EEXIST`). A preparação concluída usa nomes próprios
   `prepared-v2/` e `mount-preparation-v2.json`; não reutilizar o diretório
   intermediário `prepared/` sem recibo de preparação concluída.

Gerador novo `mount-proof-v2.mjs` reutiliza o gerador histórico imutável e muda
somente o path do utilitário e permissões de unidades. A proposta concluída é
`mount-check-20261015-35faf21e`, sem comando de criação cloud. Preserva mountpoint,
conteúdo/topologia, hashes de confiança, dispositivo RO e flags noexec/noload.
Não executa Java, Docker, codec ou imagem de mangá.

## Verificações reproduzíveis

Na raiz do repositório, para testes puros desta parcela:

```bash
node --test .local/worker-isolation/systemd-verify.y4XEpr/package-policy.test.mjs .local/worker-isolation/systemd-verify.y4XEpr/verify-policy.test.mjs .local/worker-isolation/systemd-verify.y4XEpr/mount-proof-v2.test.mjs
```

`check-units-v2.mjs --local-native-only` é um executor de evidência de rodada
única, já executado. Recusa reutilizar diretório/recibo; não rerodar por cima da
evidência. Nova rodada exige novo destino exclusivo e a mesma imagem imutável,
sem instalar ou fazer pull. Regenerar documentação não executa esse comando.

Verificações nativas executadas: identidade da imagem, versão, escaping,
blockdev sobre arquivo comum, cinco unidades juntas e três controles negativos
(diretiva desconhecida, executável ausente e mount com nome incompatível).
Todos tiveram o resultado esperado. Zero exit com aviso também é recusado
pelo classificador. Não se trata de teste de inicialização dos serviços.

Containers de verificação: `--network=none --pull=never --read-only`, UID 1000,
cap-drop ALL, no-new-privileges, PIDs 32, CPU 0,5 e memória/swap 128 MiB;
fixtures readonly e tmpfs privados de 8 MiB em `/tmp` e `/run`. Docker client
com configuração vazia própria e socket local explícito; não usa credenciais
de registry pessoais. A rede foi usada somente na instalação autorizada.

| Artefato local                              | SHA-256                                                            |
| ------------------------------------------- | ------------------------------------------------------------------ |
| Instalação concluída `installation-v2.json` | `11a72d4f01dbd26ea5ee8647fcd64b405d68961083a6f9336c999a0aa8a18539` |
| Gerador `mount-proof-v2.mjs`                | `60278e6c16f7f567ff186d15c54b264f32f25b4c8a308ca573114980e3892595` |
| `mount-preparation-v2.json`                 | `d609bfe64e298fb4577c050033f5cb2bb424d18fb7d47ab2ff6ebcba23d0c640` |
| `unit-verification-v2.json`                 | `c58f00b0324dcb32a39e92063402f6c31015c3e006211c841d8e2df66be3db3c` |

## Próximo gate

Ainda é necessário revisar a segurança do host para a prova mínima, confirmar
os utilitários no COS, preparar o binding de VM/disco/imagem/serial por IDs e
derivar criação/retirada com prazo e envelope financeiro completo. O resultado
Ubuntu não substitui esses gates nem resolve o eco vazio da origem.

O ledger compartilhado de US$ 5 continua com duas reservas, não gastos apurados.
Não reservar outro slot ou reutilizar recursos removidos apenas para repetir o
diagnóstico anterior. Segurança, filesystem real e admissão operacional continuam
abertos. Maven, web, mobile e SDD não são redatados por esta parcela de tooling
local e documentação sem mudança de código/configuração do aplicativo.

## Fechamento desta parcela

199 testes Node locais aprovados, zero falhas, cancelamentos ou skips. 130 links
relativos conferidos, formatação direcionada e diff-check dos documentos
alterados aprovados. O diff-check global conserva somente o finding externo
`web/landing-page/src/shared/component/PlatformBadge.tsx:44` (linha vazia no EOF),
sem correção automática. Consulta Docker final não encontrou containers com o
label desta rodada; não houve prune ou remoção de recursos alheios.

Os 419 paths/bytes da fotografia técnica permanecem com SHA-256
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`.
Esse checksum não cobre Dockerfile, documentação, mobile, tooling ignorado ou
aprovação de segurança. Ledger e artefatos históricos permanecem inalterados.
Recibo local `final-verification.json`:
`43973f8538ef7538cde42d03c00c12eaf4c1e238bf7d43845d66097abf8e1688`.
Documentação de fechamento foi acrescida após esse recibo e conferida novamente
por Prettier/diff; não muda os resultados de testes ou o snapshot técnico.

Continuação: [binding e pré-flight da prova mínima](worker-isolation-mount-binding-2026-10-15.md)
implementam coleta local com transporte falso e registram consultas reais somente
leitura, separadamente. Montagem, segurança COS e admissão operacional não foram
promovidas por esse avanço.
