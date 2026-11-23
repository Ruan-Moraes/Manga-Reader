# Suplemento de custo e revisão da prova mínima — 2026-10-17

Continuação do [pré-flight de leitura](worker-isolation-read-preflight-2026-10-17.md).
Pesquisa pública, sem credenciais, instalação, upload, provider, alteração cloud
ou nova reserva no limite total de US$ 5. Não executa/admite montagem, renderer
ou worker. 020 permanece `in-progress/open`; 021 bloqueada.

## Preços renovados e escopo

Recibos privados exclusivos em
`.local/worker-isolation/mount-cost-supplement.JaRMOV/`. Dois GETs públicos com
limite de 5.000.000 bytes, sem eval, conferiram as tabelas regionais de Storage
e discos/imagens. O navegador confirmou separadamente E2 shared-core com
**São Paulo**, Hourly e coluna Default USD selecionados; a aba temporária foi
fechada. Não usar os valores de Iowa apresentados inicialmente.

| Item              | Preço público observado em 17/10 | Fonte/condição                                                                                      |
| ----------------- | -------------------------------: | --------------------------------------------------------------------------------------------------- |
| `e2-micro`, 1 GiB |                  US$ 0,0132963/h | [E2](https://cloud.google.com/products/compute/pricing/general-purpose?hl=en), São Paulo, on-demand |
| PD Standard zonal |            US$ 0,000082192/GiB-h | [Discos](https://cloud.google.com/compute/disks-image-pricing?hl=en), São Paulo                     |
| Custom image      |             US$ 0,00010274/GiB-h | Mesma tabela regional de imagens, não machine image/snapshot                                        |
| Storage Standard  |            US$ 0,000047945/GiB-h | [Storage](https://cloud.google.com/storage/pricing), São Paulo                                      |
| Operação Class A  |                  US$ 0,005/1.000 | Standard, single-region, namespace flat                                                             |
| Operação Class B  |                 US$ 0,0004/1.000 | Mesma classe/localidade/namespace                                                                   |

O parser encontrou as duas tabelas de operações, mas não deduziu sua localidade
pela posição. A associação single-region foi conferida no contexto da página
oficial e registrada num recibo separado; a extração original conserva
`context-unconfirmed`. O bucket candidato recusa hierarchical namespace no
validador existente, sem mudar essa política para caber no preço escolhido.

Exemplo de planejamento: 1.000 operações A e 10.000 B somariam US$ 0,009. Não é
uso observado nem contador/cap global implantado; não converter essa quantidade
ilustrativa em garantia de gasto. Deletes estão na coluna de operações gratuitas,
mas retenção/soft delete ainda cobram armazenamento.

## Importação e tráfego: lacunas reduzidas

A documentação de [importação manual](https://docs.cloud.google.com/compute/docs/import/import-existing-image#image_import_costs)
declara ausência de tarifa da importação em si e do ingresso Google para upload;
permanecem Storage, imagens, discos e VM. O fluxo proposto usa RAW/`images.insert`,
não Image Builder, Cloud Build ou um serviço de migração adicional.

A seção de [custom image storage](https://cloud.google.com/compute/disks-image-pricing?hl=en#custom_image_storage)
declara ausência de tarifa de transferência para criar imagens e discos a partir
delas. Não confundir custom images com machine images ou snapshots. A regra de
[Storage na mesma localidade](https://cloud.google.com/storage/pricing#network-pricing)
também foi consultada, mas não se inferiu daí a região interna de cada leitura
do serviço de importação nem sucesso de readback.

O calculador anterior, inalterado e com novos horários/preços, continua retornando
**US$ 0,66 como envelope provisório**, não cotação completa/aprovada. Mantém as
premissas de uma hora de VM, 24 horas para discos/imagem e sete dias adicionais
de soft delete do archive. O cenário de operações acima discrimina uma parcela
antes genérica; não foi somado de novo à folga nem usado para retirar margens.

Impostos/moeda da conta, quantidades efetivas/acessos internos, retirada dentro
das 24 horas presumidas e recuperação explícita ainda exigem decisão. Nenhuma
fatura foi consultada. `quoteComplete=false`, `providerHardCap=false`,
`permitsMutation=false`; não reserva o último slot normal nem redefine o teto
total como US$ 5 por rodada.

## Revisão de segurança: escopos diferentes

Conferidos o gerador revisado da cloud-config, bundle de requests e guards atuais.
Não foi identificado novo código que habilite pull ou execute o payload na prova
mínima: ela para/mascara Docker/socket/containerd antes de verificar o disco,
usa attachment RO e mount `ro,noload,noexec,nosuid,nodev`, depois confere topologia
e hashes externos. O coordenador somente usa comandos fixos do SO; nenhuma
credencial, service account ou IP público é previsto no guest.

Isso é revisão estática do caminho proposto, não observação no COS. A
[revisão de 13/10](worker-isolation-vm-security-2026-10-13.md) continua válida:
o [finding de registry do Docker](https://github.com/moby/moby/security/advisories/GHSA-7cfq-22r6-qp73)
não foi corrigido pelo fato de a prova mínima não usar pull. Não transferir
essa redução de superfície para o worker completo, Docker load/run ou um JRE.
As [release notes atuais do pin](https://docs.cloud.google.com/container-optimized-os/docs/release-notes/m125)
não demonstraram uma correção nova desse finding.

Continuam abertas a presença/comportamento dos utilitários e init no COS,
análise do kernel/filesystem efetivo, exceção de metadata/DNS da plataforma e
configuração observada antes/depois. A verificação Ubuntu/systemd 255 não vira
prova COS 254; respostas sintéticas não viram boot. A revisão específica precisa
delimitar quais verificações serão feitas no ensaio confinado, sem dispensar
os guards ou alegar ausência de vulnerabilidades. Nenhuma aprovação operacional
foi concedida por esta inspeção.

## Integridade e reprodução

| Artefato privado           | SHA-256                                                            |
| -------------------------- | ------------------------------------------------------------------ |
| `observations.json`        | `303b90dab930c9d756d0270717cd038ac9581780d9bc5a029ba94be9e93e4436` |
| `review.json`              | `847d605ff3ea4e48e8eb2bc5992dd7384614df55a2cd18fa2afb6d91e1821b44` |
| Parser `public-tables.mjs` | `acf2a2478bcbb507c422f72bb783bc40807c0dee99b1953b819b7998c2768b6c` |

Testes puros, sem consultas públicas ou credenciais:

```bash
node --test .local/worker-isolation/mount-cost-supplement.JaRMOV/public-tables.test.mjs .local/worker-isolation/mount-binding.NIN2si/cost.test.mjs
```

Coletores e registros de revisão são exclusivos e já preenchidos: não reexecutar
por cima das evidências. Nova observação exige outro destino, não retry de uma
mutação. Runtime, migrations, defaults e arquivos de performance preservados.

Fechamento local: oito testes dirigidos passaram (cinco novos do parser e três
do calculador anterior), sem falhas/cancelamentos/skips. A suíte conjunta de 625
continua com sua evidência/data própria; não foi reexecutada por esta inspeção
de preços. Os 419 paths/bytes do gateway, fontes/recibos anteriores pinados e as
duas reservas do ledger foram reconferidos e permanecem intactos. Sintaxe,
156 links relativos, formatação e diff dos documentos do escopo aprovados.
Maven/web/mobile/SDD não foram reexecutados nem redatados por este suplemento.

Recibo privado `verification.json`:
`e8619572615e4b03c894aff8de8212ccbbc0e58588aeb34e0e05046fba2af6a2`.
O diff global continua com o EOF alheio de
`web/landing-page/src/shared/component/PlatformBadge.tsx:44`, preservado.
Fechamento acrescentado após o recibo e conferido novamente por formatação/diff.
