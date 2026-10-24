# Requests da rodada mínima e barreira de rotas — 2026-10-15

## Resultado

Continuação da [recuperação após interrupção](worker-isolation-crash-recovery-2026-10-15.md).
Entregues composição e validação semântica dos oito requests Compute, vinculados
ao plano progressivo e ao staging. A revisão identificou uma operação adicional
necessária: retirar a rota padrão gerada pela criação da VPC **antes da VM**.
Seu plano de ownership está testado; nenhum DELETE foi executado.

Tooling privado: `.local/worker-isolation/mount-requests.498LRD/`. Somente testes,
leitura local e consulta de documentação pública. Sem credenciais, consultas de
projeto, novos recursos, uploads, instalação, Vision, tradução ou reserva nova.
Runtime, performance, mobile, migrations e defaults intactos. A 020 permanece
`in-progress/open`; a 021 continua bloqueada.

## Requests canônicos, ainda não executáveis

O gerador reconstrói o cloud-config pelo gerador v2 e seus manifests fixados;
não aceita um script arbitrário acompanhado de hash. Nomes, endpoints e
referências derivam de projeto/zona/runId validados. Cada body é limitado a
128 KiB e tem seu hash ligado ao journal progressivo. Alterar body **e recalcular
seu hash** não basta: a reconstrução semântica continua rejeitando a divergência.

| Request             | Conteúdo restrito da proposta                                                         |
| ------------------- | ------------------------------------------------------------------------------------- |
| network             | VPC dedicada, sem sub-redes automáticas ou IPv6 interno                               |
| subnetwork          | CIDR `10.254.0.0/28`, IPv4, Private Google Access e flow logs desabilitados           |
| ingress / egress    | Dois denies de todos os protocolos, prioridade zero, tag exclusiva da rodada          |
| dataImage           | Archive próprio por bucket/nome derivados do hash, RAW/TAR, x86-64 e storage regional |
| dataDisk / bootDisk | Dois discos `pd-standard` de 10 GiB; imagem própria e COS de versão fixa              |
| instance            | e2-micro, sem conta de serviço/IP externo; disco de dados READ_ONLY e sem auto-delete |

A VM proposta preserva hardening Shielded, metadados fechados, sem startup-script
extra, sem reinício automático e com duração máxima de 600 segundos/ação DELETE.
São **campos planejados**, não propriedades observadas de uma VM. O limite de
duração não elimina custos de imagens, discos ou Storage, nem substitui retirada
explícita ou um teto de cobrança. Fontes:
[instances.insert](https://docs.cloud.google.com/compute/docs/reference/rest/v1/instances/insert)
e [limite de duração](https://docs.cloud.google.com/compute/docs/instances/limit-vm-runtime).

A imagem COS continua pinada pelo nome e ID esperado da fotografia anterior;
o ID real e READY precisam de nova conferência antes do uso. O request de disco
usa a propriedade `sourceImage` documentada, não uma família móvel:
[disks.insert](https://docs.cloud.google.com/compute/docs/reference/rest/v1/disks/insert).
Criar o body não prova que o serviço o aceitará ou que seus defaults observados
coincidirão com a política. APIs não foram acionadas para validar a proposta.

`rawDisk.source` usa o formato HTTPS documentado, derivado exclusivamente do
bucket/nome próprio, sem URL fornecida pelo chamador ou query de geração não
comprovada. As gerações permanecem no plano de staging para revalidação e
exclusão condicionada; **não** são apresentadas como seleção comprovada pelo
importador. `sourceGenerationSelectionVerified=false`. O vínculo de conteúdo
montado continua obrigatório. Fonte:
[images.insert](https://docs.cloud.google.com/compute/docs/reference/rest/v1/images/insert).

## Finding: rota padrão automática

O Google adiciona uma rota IPv4 `0.0.0.0/0` para o default internet gateway ao
criar uma VPC. Portanto, `autoCreateSubnetworks=false` **não** satisfaz sozinho
o snapshot de isolamento já existente. A documentação também ressalta que
ausência de default route não é isolamento completo. Fonte:
[rotas geradas pelo sistema](https://docs.cloud.google.com/vpc/docs/routes#system-generated-default-routes).

Não foi acrescentado um campo fictício `deleteDefaultRoutesOnCreate` ao body
REST. A opção `delete_default_routes_on_create` do provider Terraform descreve
a exclusão **após** criar a rede; não é tratada como campo de `networks.insert`.
Fontes: [networks.insert](https://docs.cloud.google.com/compute/docs/reference/rest/v1/networks/insert)
e [provider oficial](https://registry.terraform.io/providers/hashicorp/google/7.28.0/docs/resources/compute_network.html).

A nova barreira de leitura recusa rota default/internet, rede divergente, routers,
listagem incompleta, duplicatas ou qualquer next hop adicional. Só admite, no
snapshot fornecido, até uma rota da própria sub-rede. Isso **não substitui** GETs
reais completos, firewall efetivo, ausência de IP público/NAT e conferência de
identidade; `operationalApproved` continua falso.

O plano separado de retirada da default route exige network ID associado à
rodada e rede observada com nome, selfLink e descrição exatos. Só aceita uma
rota padrão da própria rede, ID/nome/selfLink recebidos, next hop esperado,
prioridade 1000 e ausência de tags ou outro next hop. Não seleciona rotas de
outras redes ou por prefixo global. Zero rotas não inventa ID nem DELETE;
múltiplas candidatas ou divergência geram bloqueio.

**Limite desta entrega:** os IDs de testes são sintéticos e a entrada é uma
fotografia fornecida, não uma atestação cloud. A operação de retirada ainda deve
ganhar journal durável, GET fresco de ownership, confirmação terminal e vínculo
ao ciclo parcial antes de ser executável. Nenhum recurso de outra rede será
adotado, e a exigência de isolamento não foi enfraquecida para aceitar a rota.

## Evidência local e reprodução

```bash
node --test .local/worker-isolation/mount-requests.498LRD/requests.test.mjs
```

Testes escritos primeiro, com falha inicial antes da implementação. Cobrem os
oito bodies, imutabilidade, hashes, tentativa de rehash de body inseguro, IP/SA,
RW indevido, imagens móveis, script extra, janela, archive e rotas conflitantes.
As versões de Storage e IDs de rede/rota das fixtures são **sintéticos**;
nunca representam recursos atuais ou uma nova autorização operacional.

`prepare-offline.mjs --offline` foi executado uma vez e guardou
`request-review.json` exclusivo 0600. Releu o archive existente de 62.359.506
bytes e confirmou seu hash, sem copiar archive/RAW/JRE. O recibo contém somente
hashes/tamanhos dos requests e flags, sem o cloud-config integral ou credenciais.
O executor não sobrescreve o recibo; não reexecutar sobre a evidência existente.

| Artefato privado      | SHA-256                                                            |
| --------------------- | ------------------------------------------------------------------ |
| `requests.mjs`        | `9854007debaef586fb7a36626437f2d0c6359e244b3d55ac84d17d21e474c5ae` |
| `request-review.json` | `1046843f411e9b072cfc2f57508026b37f8cc75658bf137c5de4b574a173f751` |

O fechamento em `verification.json` revalida recibos históricos, os fontes
auditados do gateway, ledger, suíte conjunta, links, sintaxe, formatação e diff
direcionados. Não renova Maven/web/mobile/SDD sem mudança nessas superfícies.

## Próximo trabalho e bloqueios

Próximo trabalho local: ligar a retirada da rota própria e os mutadores Compute
ao journal, com revalidação de identidade/readiness antes dos efeitos. Depois,
fechar a revisão COS limitada à montagem e a cotação/admissão financeira completa.
Só então considerar uma nova rodada real; o bundle mantém `executable=false` e
`operationalApproved=false`. Não instala pacotes ou cria recursos ao importar.

Ledger permanece com duas reservas históricas, sem consumir o último slot normal.
O limite autorizado total continua US$ 5. O envelope anterior de US$ 0,66 não foi
renovado como cotação completa, teto do provedor ou fatura conferida.

## Fechamento observado

Suíte conjunta: **458 testes aprovados**, zero falhas, cancelamentos ou skips;
36 casos novos. Conferidos 139 links relativos, sintaxe, Prettier direcionado,
diff-check dos documentos afetados e correspondência do recibo com os oito bodies.
O diff-check global conserva somente o finding alheio em
`web/landing-page/src/shared/component/PlatformBadge.tsx:44`, linha vazia no EOF.

Os 419 paths/bytes auditados do gateway continuam com SHA-256
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`.
Fotografia não cobre Dockerfile, mobile, documentação, tooling privado ou
aprovação de segurança. Recibos anteriores e ledger de duas reservas íntegros;
nenhum slot novo. Mantidos aproximadamente 23 GiB livres no Mac, sem cópia de
archive/JRE/RAW ou alteração de arquivos de performance.

`verification.json`:
`b41834b7e24115e388f53bd07d402f06d8245b9c5720b91cfb6d6e7624d4e0a1`.
Este fechamento foi acrescentado após o recibo, com nova conferência direcionada
de formatação/diff; a evidência anterior não foi sobrescrita.
