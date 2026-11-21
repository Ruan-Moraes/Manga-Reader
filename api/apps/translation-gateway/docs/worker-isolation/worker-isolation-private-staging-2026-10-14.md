# Prova de staging privado do runtime — 2026-10-14

**Upload e integridade comprovados; remoção dos recursos ativos confirmada.**
Continua a [receita de entrega privada](worker-isolation-import-recipe-2026-10-14.md),
parcela A. Ruan respondeu «Sim» à credencial existente, criação de um bucket
temporário privado em São Paulo, envio/conferência do runtime e retirada.
Isso não autoriza parcelas B–D, imagem/disco/VM, grant ou provider.
020 `in-progress/open`, 021 bloqueada; runtime/defaults/performance preservados.

## 1. Fatos observados

Execução inicial **06:52:48–06:53:05 de Brasília**; conclusão da retirada
**06:55:14–06:55:16**. Tooling JavaScript local, sem instalação. Pacote privado
ignorado `private-staging.FQTrmP`, com intenção create-only e ledger antes das
ações. A credencial já conferida foi usada sem impersonação; token somente
em memória. Nenhuma ADC/política persistente do SDK modificada pelo tooling.

| Verificação      | Resultado observado                                                                                                    |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Projeto          | `toonlira-rm`, ACTIVE; número corresponde ao hash anterior.                                                            |
| Bucket exclusivo | `toonlira-prepull-20261014-291b60d9`, previamente inexistente (404).                                                   |
| Local/classe     | `SOUTHAMERICA-EAST1`, Standard; sem versionamento.                                                                     |
| Proteções        | Acesso uniforme, prevenção pública enforced, soft delete de 604800 s.                                                  |
| IAM do bucket    | Zero bindings públicos; política/identidades não persistidas, nenhum grant.                                            |
| Permissões       | As sete solicitadas retornaram no bucket exato: get/getIamPolicy/delete do bucket; create/get/delete/list dos objetos. |
| Upload           | Um objeto `runtime/data-disk.tar.gz`, create-only com geração esperada zero.                                           |
| Tamanho          | 62.359.506 bytes, sem manga, OCR, credencial ou arquivo de performance.                                                |
| Integridade      | MD5 retornado confere; SHA-256 da leitura integral streaming coincide com o local.                                     |
| Retirada ativa   | Objeto não vivo (404); bucket excluído uma vez (204), depois não vivo (404).                                           |
| SDK              | Manifests iguais antes/depois nas duas execuções.                                                                      |

SHA-256 local/remoto:
`f8b8009f1684e29050a5472c2dc3077e6177ef322c667000e532c8bc2dd6135c`.
Objeto geração `1791971579782242`; bucket geração `1791971573378006093`.
O arquivo remoto foi lido em streaming, não armazenado como nova cópia no Mac.
Fonte local foi preservada e revalidada por tamanho/hash após a retirada.

As seis permissões Storage não retornadas no teste anterior de **projeto**
não impediam esta prova no recurso. Não houve concessão de Storage Admin ou
outro papel. Isso não demonstra a identidade efetiva do futuro importador.

## 2. Erro local e confirmação sem repetir a exclusão

A primeira exclusão do objeto terminou no cliente com erro sanitizado:
o helper tentou iterar `response.body` mesmo quando uma resposta 204 tem corpo
nulo. Esse TypeError foi reproduzido **localmente**, e os testes de regressão
foram escritos antes do helper corrigido. A resposta perdida por esse parsing
não foi tratada como motivo para reenviar delete, upload ou criar nova rodada.

`run.mjs`, recibo e ledger originais permanecem intactos. `finish.mjs` foi
vinculado aos hashes da tentativa; consultou apenas o alvo exato, confirmou
objeto já não vivo e leu seus metadados soft-deleted. Depois conferiu bucket
próprio/geração/metageneration, lista vazia e executou **a primeira** exclusão
do bucket com precondição de metageneration. Nenhuma exclusão do objeto repetida.

A consulta adicional aos metadados do **bucket soft-deleted** recebeu `403`.
Nenhum grant, restauração, nova exclusão ou consulta ampla foi feito para
contornar essa recusa. Causa específica de autorização não investigada;
não confundir esse endpoint recusado com falha da exclusão ativa confirmada.

Os recibos conservam seus estados de erro/incompletude. A verificação separada
classifica somente fatos provados: integridade e retirada ativa confirmadas,
detalhes de retenção do bucket parcialmente indisponíveis. O classificador
exige consultas 404 e o ACK da exclusão do bucket, não somente flags ou HTTP
204 isolado. Não reescreve histórico nem promove gate de isolamento.

## 3. Retenção, recuperação e cobrança

**Retirada ativa não é eliminação física imediata.** Antes da exclusão do bucket,
o metadado do objeto informava `softDeleteTime=2026-10-14T09:53:05.823Z` e
`hardDeleteTime=2026-10-21T09:53:05.823Z` (06:53:05 de Brasília). Essa é uma
fotografia anterior ao delete do bucket, não confirmação futura de eliminação.
O `hardDeleteTime` do bucket não foi obtido por causa do 403; não publicar uma
data física precisa para ele ou assumir que a segunda operação não afeta retenção.

A proteção de sete dias foi mantida. Recuperação dentro da retenção exigiria
autorização explícita; nenhuma restauração foi tentada. Não existe recurso ativo
desta prova confirmado pelas consultas finais, mas cópia retida pode continuar
faturável até expirar. Fonte: [soft delete](https://docs.cloud.google.com/storage/docs/soft-delete)
e [delete de bucket](https://docs.cloud.google.com/storage/docs/json_api/v1/buckets/delete).

A estimativa pública anterior de USD 0,008 não é gasto observado ou teto.
Faturamento/BRL/impostos/serviços preexistentes não foram consultados. Foram
registradas 23 ações: cinco do CLI e 18 solicitações Storage, incluindo consultas
404/403 e a exclusão cujo corpo vazio não foi interpretado na primeira execução.
Houve um create de bucket, um upload, um delete do objeto e um delete do bucket.
Não deduzir a fatura exata só dessa contagem.

## 4. Rastreabilidade e testes

| Artefato privado      | SHA-256                                                            |
| --------------------- | ------------------------------------------------------------------ |
| Runner original       | `79a1a81b5dd6bae754bfc8f2d552069cb848de1961ff5e6a3416c4949129e0fa` |
| Recibo original       | `43b46c3cb370eaf25f837b238d723dd9e25c29d8322d73335bb829e411be3d25` |
| Ledger original       | `d9454901c6654f1e4f11eb3d1766398d191b3814da492b6b4e046b1e243e4e9c` |
| Conclusão da retirada | `d92f1c92168b5b90686c61e942db42920be7b56a1467987e4af48e7fd2934656` |
| Ledger da conclusão   | `4f2a8f48eb614f51aaf8c93511792ba9d83ec7904b8d11f36f64949f4154a0dc` |
| Helper de corpo vazio | `bd6e426227839e73d0b8f854f5295c687c63fe8ff13c06af73e071fb4b20e9aa` |

`verification.json` contém classificação local e hashes dos fontes/recibos.
Onze testes novos: propriedade/privacidade, drift, geração exata, hash/limites
da leitura, corpo 204, payload inválido e distinção entre ACK/retirada/retenção.
Red antes de cada parcela; **83 testes Node locais aprovados**, zero failures/
skips, incluindo regressões anteriores. Fixtures sintéticas não usam credenciais.

```bash
node --test .local/worker-isolation/private-staging.FQTrmP/policy.test.mjs .local/worker-isolation/private-staging.FQTrmP/response.test.mjs .local/worker-isolation/private-staging.FQTrmP/outcome.test.mjs
```

Scan de recibos/ledgers não encontrou padrões de token/Bearer/chave/e-mail,
sem alegar auditoria exaustiva. Manifests SDK mantêm
`b41ae1c25a4626cfed1e0a50877af1e831e6988ccea0d4d666174fd9187109d3`.
Os mesmos 419 arquivos da fotografia técnica mantêm
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`.
Não copiar essa prova de Storage para evidência de importação, boot ou segurança.

## 5. Próxima parcela e limites

Preparar a parcela B: nova origem privada para uma tentativa direta de custom
image, incluindo alvos, custos, identidade, aceitação RAW e retirada. Envio/
criação exigem **nova autorização**; não reutilizar automaticamente a cópia
soft-deleted ou restaurar este bucket. Não iniciar imagem/disco/VM nesta entrega.

Nenhuma imagem de manga enviada, chamada Vision/Translation/rendering, recurso
Compute/DNS/registry criado, instalação, grant, API enable ou deploy. Arquivos de
performance intocados; sem cache grande ou nova cópia do runtime. Maven/web/mobile/
SDD não reexecutados/redatados para esta prova sem mudança de código/status.
Segurança COS/JRE/DNS, systemd/montagem e isolamento operacional continuam abertos.

Fechamento local: 31 links relativos nos três documentos conferidos,
Prettier dos oito fontes/testes e três documentos, whitespace/EOF e diff-check
direcionado do gateway aprovados. Global mantém o EOF externo em
`web/landing-page/src/shared/component/PlatformBadge.tsx:44`, não corrigido.
Mac reportava 27 GiB disponíveis; nenhuma limpeza ampla ou performance alterada.
