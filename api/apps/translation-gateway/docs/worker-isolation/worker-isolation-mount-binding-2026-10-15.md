# Binding e pré-flight da prova mínima — 2026-10-15

## Resultado desta continuação

Implementados e testados localmente o contrato de binding, coleta limitada de
serial e plano parcial de retirada por identidade. Pré-flight **real somente
leitura** confirmou projeto, imagem COS e definição da máquina candidata.
Não houve VM/disco/rede criada, upload, provider, instalação ou reserva nova.
A 020 continua `in-progress/open`, 021 bloqueada e defaults desabilitados.

Continua a [verificação systemd](worker-isolation-systemd-verification-2026-10-15.md).
Tooling JavaScript privado em `.local/worker-isolation/mount-binding.NIN2si/`,
ignorado pelo Git. IDs, textos de cloud-config e serial usados nos testes são
**sintéticos**: não representam recursos existentes ou execução no COS.

## Binding implementado, ainda sem adapter cloud de coleta

`binding.mjs` exige observações antes/depois da serial, com nomes e IDs decimais
exatos de VM, boot disk, data disk, imagem, VPC e subnet. IDs não passam por
`Number`; substituição por recurso de mesmo nome é recusada. Confere:

- Fonte imutável do boot COS e da imagem de dados, região/zona, labels de
  propriedade, dois discos exclusivos, dados `READ_ONLY` e não boot; boot de
  10 GiB com auto-delete, dados de 10 GiB sem auto-delete.
- Uma NIC IPv4 privada, sem IP público, alias, network attachment ou service
  account; sem roteador/NAT, peering ou rota de internet na visão fornecida.
- Rede dedicada, PGA desligado, dois denies IPv4 em prioridade zero e nenhuma
  política de firewall adicional na resposta efetiva. Logging de firewall e
  subnet não é habilitado. Não é aprovação de rede existente.
- Cloud-config pelo hash, sem metadados extras/duplicados ou scripts herdados;
  SSH herdado/OS Login/serial interativa desligados, endpoints legados desligados.
- Secure Boot/vTPM/integridade, restart desligado e proposta de término por
  `DELETE` após 600 segundos, nunca apenas `STOP`.

O coletor não inicializa SDK, processo ou credencial. Recebe transporte injetado,
que nos testes é falso; **adapter real agregado não foi implementado**. O adapter
futuro precisa conferir endpoints/TLS/identidade, paginação e visão completa de
redes/políticas/rotas, sem substituir resposta parcial por lista vazia. O contrato
é estrito; divergência real deve gerar finding, não remoção de predicados.

Serial: porta 2, cursor iniciado em zero e sequência contígua por bytes UTF-8,
no máximo 1 MiB, oito polls e 120 segundos; cada leitura/delay tem timeout e
AbortSignal, sem retry automático. Truncamento do buffer, cursor divergente,
NUL, rodada errada ou terminal sem newline impedem sucesso. Snapshots e páginas
são copiados defensivamente: mutação posterior do transporte não reescreve a
fotografia anterior. Exceções sanitizadas, sem resposta/identificador/conteúdo.

O resultado registra hash/tamanho, não copia serial. Mesmo no happy path retorna
`classification=injected-transport-only`, `operationalApproved=false` e
`sourceGenerationSelectionVerified=false`. Não reclassifica o eco vazio da
importação nem transforma fixtures em filesystem observado.

O plano de retirada é **não executável e parcial**. Separa propriedade de
segurança: drift não autoriza remover terceiros, mas também não exige configuração
segura para planejar a retirada do próprio recurso. Ordem: VM → discos sem uso →
imagem; exige nova consulta de identidade e ausência confirmada. Journal de
operações/UUIDs, recuperação e retirada de rede/subnet/firewall/staging ainda
precisam ser integrados. Nenhuma API de delete foi chamada.

Referências dos contratos: [serial e cursores](https://docs.cloud.google.com/compute/docs/reference/rest/v1/instances/getSerialPortOutput),
[firewalls efetivos](https://docs.cloud.google.com/compute/docs/reference/rest/v1/instances/getEffectiveFirewalls)
e [término automático](https://docs.cloud.google.com/compute/docs/instances/limit-vm-runtime).
O término automático pode começar com atraso e não elimina discos sem
auto-delete, imagem ou soft-deleted storage: **não é teto financeiro**.

## Pré-flight real sanitizado

Na rodada concluída de pré-flight, executadas quatro consultas GET autorizadas,
com projeção de campos. A tentativa inicial interrompida e a consulta de catálogo
são registradas separadamente abaixo. Identidade conferida por SHA-256; token
somente em memória, sem impressão/persistência. Configurações de proxy,
credenciais customizadas ou TLS inseguro impedem a consulta. CLI sem update
implícito; manifests do SDK iguais antes/depois. ADC pessoal não foi alterada.

| Verificação       | Resultado observado                                                                                                    |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Resource Manager  | `toonlira-rm` ativo e mesmo project number pinado anteriormente                                                        |
| Compute project   | Nome correto; zero itens em metadados comuns, sem startup herdado                                                      |
| COS pinado        | `cos-125-19216-739-5`, ID `3332869554998116417`, `READY`, x86_64, boot de 10 GiB e sem estado de depreciação retornado |
| Máquina candidata | Definição `e2-micro` em `southamerica-east1-a`, 1.024 MiB, dois guest CPUs compartilhados                              |

Isso não comprova quota livre, capacidade de alocação, preço efetivo, subnet,
firewall, ausência de organização/política superior, boot ou segurança do kernel.
Valores de metadados e identidade pessoal não constam do recibo sanitizado.

A primeira consulta Compute foi interrompida por uma comparação incorreta do
tooling: `projects.id` do Compute não é o `projectNumber` do Resource Manager.
O recibo inicial fica preservado; seu campo chamado `projectNumberSha256` era
hash do **ID Compute** e não deve ser usado como identidade Resource Manager.
A revisão usa endpoints e campos separados e exige o hash Resource Manager
original, sem aceitar um número novo para fazer o teste passar.
Referências: [Compute projects](https://docs.cloud.google.com/compute/docs/reference/rest/v1/projects)
e [Resource Manager projects](https://docs.cloud.google.com/resource-manager/reference/rest/v1/projects).

## Revisão de fontes e segurança: limitações encontradas

Metadados públicos do build conferem com o hash histórico. Identificados
util-linux 2.38.1, coreutils 9.4-r2, findutils 4.10.0, systemd 254.26-r11,
cloud-init 24.4.1-r5 e respectivas receitas de init/config. Não são atestação dos
binários em execução. A verificação local anterior permanece no Ubuntu/systemd 255.

Quatro paths de árvore COS consultados retornaram HTTP 401. Isso não demonstra
conteúdo nem ausência de pacote; não se pediu login nem usou credencial para
contornar a resposta. A primeira consulta pública parou antes do recibo final;
nova consulta guardou os status em `public-review-v2.json`. Não reinterpretar
essa revisão parcial como conferência integral dos ebuilds/init selecionados.

Fontes [findmnt 2.38.1](https://github.com/util-linux/util-linux/blob/v2.38.1/misc-utils/findmnt.c)
e [match de opções](https://github.com/util-linux/util-linux/blob/v2.38.1/libmount/src/optstr.c)
mostram que `+` exige a opção literal, evitando interpretar `noexec` como mera
ausência de `exec`. O [Makefile upstream](https://github.com/util-linux/util-linux/blob/v2.38.1/disk-utils/Makemodule.am)
classifica blockdev em sbin. São fontes upstream da mesma versão, não prova de
paths, flags de build, backports ou comportamento efetivo no COS.

**Deny-all VPC não significa rede totalmente desligada:** o acesso ao metadata
server, incluindo DNS, é sempre permitido pela plataforma. Nenhuma service
account ou segredo deverá entrar no guest; essa exceção precisa constar da
revisão de ameaça da prova mínima. Não transferir a aprovação da montagem para
pull, OCR, Java, codec ou worker. [Exceções documentadas do firewall](https://docs.cloud.google.com/firewall/docs/firewalls#alwaysallowed).
O finding Docker da [revisão anterior](worker-isolation-vm-security-2026-10-13.md)
não foi resolvido nem dispensado para o worker.

## Orçamento e próximos passos executáveis de preparação

Ledger compartilhado continua com duas reservas de US$ 1, mais margens históricas
e de contingência: não foi aberto terceiro slot. Não há apuração nova da fatura
ou teto configurado no provedor. US$ 5 permanece o limite autorizado.

A página pública E2 excedeu o limite de leitura de 5.000.000 bytes. Não se elevou
o limite nem se usou o preço da região visual padrão como se fosse São Paulo.
Assim, **cotação completa de VM/boot/data/image/storage/rede/operações permanece
pendente**; a cotação antiga de armazenamento não foi redatada nem ampliada.

Na continuação, o catálogo oficial de preços retornou `403` no primeiro GET.
Não se habilitou API, criou key ou concedeu acesso; o status sozinho não
determina a causa. Recibo `catalog.json` preserva a tentativa sem resposta bruta
ou conta de faturamento. Não há retry da consulta nem passagem para mutação.

A alternativa pública pelo navegador resolveu a parcela de VM: após selecionar
explicitamente São Paulo, a seção E2 mostrou `e2-micro`, 1 GiB, Default/On Demand
USD 0,0132963/h. Disco zonal Standard: USD 0,000082192/GiB-h; imagem:
USD 0,00010274/GiB-h. Navegação teve timeout inicial, mas a aba existente carregou;
foi reutilizada, sem novas abas em loop. Nenhum login ou tela de compra.
Observação às 09:55:51 UTC em `browser-pricing.json`; a aba temporária foi fechada.
Fonte: [tabela pública General Purpose](https://cloud.google.com/products/compute/pricing/general-purpose?hl=en).

O leitor público de armazenamento foi executado em destino novo, com o mesmo
limite original. Conferiu esses dois preços e Storage Standard de
USD 0,000047945/GiB-h; recibo `pricing.json` contém os novos horários/hashes.
Não se alterou o recibo de 14/10. O cálculo em nanodólares arredonda para cima:

| Premissa de planejamento                                          |         USD |
| ----------------------------------------------------------------- | ----------: |
| Uma hora de VM, embora a proposta limite a execução a dez minutos |   0,0132963 |
| Boot + dados, total 20 GiB por 24 horas                           |  0,03945216 |
| Imagem de 10 GiB por 24 horas, estimativa conservadora            |   0,0246576 |
| Archive de 62.359.506 bytes: 24 horas + sete dias soft delete     | 0,000534623 |
| Subtotal de itens cotados e quantidades presumidas                | 0,077940683 |
| Folga não cotada para operações/rede/impostos                     |        0,25 |
| Envelope provisório com fator 2 e arredondamento ao centavo       |    **0,66** |

A folga de USD 0,25 **não é preço observado** nem comprovação de todos os custos.
Retirada em 24 horas é premissa, não proteção já implantada. O modelo retorna
`quoteComplete=false`, `providerHardCap=false` e `permitsMutation=false`; não
reserva o slot remanescente nem libera criação. Sem free tier/CUD presumidos;
fatura efetiva e recursos preexistentes não foram auditados nesta parcela.

| Parcela                                              | Estado ao final deste trabalho                                                                              |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Contrato/coleta/binding local                        | Implementado com transporte falso; sem prova cloud                                                          |
| Identidade/projeto/COS/máquina por GET               | Observados, com recibo sanitizado                                                                           |
| Utilitários/init/segurança da prova mínima no COS    | Parcial, não aprovado                                                                                       |
| Preço regional e envelope completo no ledger         | VM/armazenamento observados; envelope provisório US$ 0,66, cotação completa pendente e nenhuma reserva nova |
| Adapter real da coleta e journal de criação/retirada | Pendente                                                                                                    |
| Rede/VM/discos/montagem real                         | Não criados/não executados                                                                                  |
| Worker completo e admissão da 020                    | Permanecem abertos                                                                                          |

Continuar sem usar imagens de mangá: completar revisão COS e cotação; integrar
adapter somente leitura e lifecycle com retirada idempotente; testar perda de
confirmação/timeout antes de reservar o último slot normal. Só então admitir
uma rodada mínima por IDs e com retirada imediata dentro do envelope existente.
O usuário estar offline não substitui evidência técnica nem permite deixar
recursos faturáveis sem retirada comprovável.

## Rastreabilidade local

| Artefato privado         | SHA-256                                                            |
| ------------------------ | ------------------------------------------------------------------ |
| `binding.mjs`            | `70fefe721848a4ed90d68d07243e67b86fa22e1a4a472a85537ba9688c31cd11` |
| `binding.test.mjs`       | `96a57b9d34ed402c3e67a041adc0becd2bee34698a40cae2654e94f559722718` |
| `read-preflight-v2.json` | `877f087670ff43b7da3eab86363d32c7ac90a593d720d946c19661f8977caae8` |
| `public-review-v2.json`  | `c84809b968a96c3553b2503639690db09bfc483a6c1319cacfdb5bfdd5c769a0` |
| `public-followup.json`   | `864d68e1543e2d612792749c7fea3842818adfe796cf0e6bf0be4c56f7c97379` |

Reprodução de testes sem rede/credenciais:

```bash
node --test .local/worker-isolation/mount-binding.NIN2si/binding.test.mjs .local/worker-isolation/mount-binding.NIN2si/preflight-policy.test.mjs
```

Executores de consulta e seus recibos são de rodada única; não reexecutar por
cima da evidência. Não há instrução de instalar, fazer deploy, habilitar APIs,
alterar IAM ou consumir providers nesta reprodução. Nenhum arquivo de performance,
runtime, migration, `/v1`, task `{jobRef}` ou manifesto do aplicativo foi alterado.

## Fechamento local

252 testes Node aprovados, zero falhas/cancelamentos/skips: 53 casos novos desta
parcela e 199 existentes. Não confundem consultas reais de pré-flight com testes
da VM. 132 links relativos, sintaxe JavaScript, scan limitado dos recibos,
Prettier direcionado e diff-check dos documentos alterados aprovados.
O único finding global preservado é a linha vazia no EOF de
`web/landing-page/src/shared/component/PlatformBadge.tsx:44`, fora deste trabalho.

Os 419 paths/bytes da fotografia técnica continuam com SHA-256
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`.
Ledger de duas reservas e evidência systemd anterior intactos. Esse checksum
não cobre Dockerfile, mobile, documentação, tooling privado ou aprovação de
segurança. Maven, web, mobile e SDD não foram redatados nesta parcela sem
mudança de runtime, schema, status ou defaults do aplicativo.

Parcela privada de cerca de 308 KiB; Mac segue com cerca de 23 GiB livres.
Nenhuma cópia de JRE/RAW, cache grande, instalação ou alteração de performance.
O fechamento documental foi acrescido após `verification.json` e conferido
novamente por formatação/diff, sem renovar os resultados históricos.
SHA-256 de `verification.json`:
`69ba8318669f9971de6a591c53f5d9b8e24b0f08ac0faba4a2ffd5f6de350bdf`.
