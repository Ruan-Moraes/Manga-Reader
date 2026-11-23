# Importação direta de imagem de dados — 2026-10-14

## Escopo autorizado e classificação

Após a [preparação offline do transporte e journal](worker-isolation-import-execution-offline-2026-10-14.md),
Ruan respondeu «Autorizo» ao escopo de uma nova origem privada em São Paulo,
upload/readback do runtime, uma tentativa de importação direta de custom image,
observação e retirada dos recursos próprios. Essa aprovação resolve a pendência
de autorização dos registros anteriores, sem alterar seu histórico.

Uso da credencial existente, sem login, chave privada, impersonação ou mudança
de ADC. Nenhuma instalação, grant, habilitação de API, disco, VM, deploy ou
chamada OCR/tradução. O arquivo enviado contém runtime de dados, não as imagens
do catálogo. Performance e capturas privadas permanecem intocadas.

Não é aprovação operacional: 020 continua `in-progress/open`, 021 bloqueada.
Defaults de gateway, worker cloud, providers e layout permanecem desabilitados.
O orçamento hipotético apresentado anteriormente não é teto de cobrança nem
valor efetivamente faturado; retenção temporária pode continuar após a retirada
ativa. Não há alegação de exclusão física.

## Identidades e integridade

Pacote local exclusivo, ignorado: `authorized-import.Afp0k9` em
`.local/worker-isolation/`. O runner histórico de staging não foi reutilizado
nem alterado. Novo runner usa o parser corrigido para respostas 204 sem corpo.

- Bucket: `toonlira-prepull-20261014-31812f61`.
- Imagem candidata: `toonlira-prepull-image-20261014-31812f61`.
- Request ID de insert: `5ecd076a-515a-4eb2-8153-2447c483ff53`.
- Journal: `import-run.IH2Me8`, claims duráveis exclusivos, sem token/principal.
- Archive: 62.359.506 bytes, SHA-256
  `f8b8009f1684e29050a5472c2dc3077e6177ef322c667000e532c8bc2dd6135c`.
- Objeto content-addressed: `runtime/<SHA-256 acima>.tar.gz`;
  geração `1792018525003069`.

Conferidos localmente: identidade existente pelo hash esperado, projeto ativo,
TLS validado e manifests do SDK fixados. Bucket criado Standard em
`southamerica-east1`, acesso uniforme, bloqueio público obrigatório, sem
versionamento e com soft delete de sete dias. Política sem principals públicos;
sete permissões necessárias conferidas no próprio bucket, sem grants.

Upload create-only, MD5 validado pelo Storage; leitura de volta da geração
específica por streaming com tamanho e SHA-256 correspondentes. Nenhuma cópia
grande nova no Mac. O RAW original e o archive reutilizável não são alterados.

## Execução e resultado

**Entrega parcial: operação terminada, admissão da imagem não confirmada;
recursos ativos próprios retirados.** Execução em 14/10, 19:55:00–19:57:46
de Brasília (22:55:00–22:57:46 UTC).

| Verificação          | Resultado observado                                                                                                                           |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Insert               | Um POST, HTTP 200; operação `RUNNING → DONE`, sem erro informado pela API; 21 consultas do mesmo handle.                                      |
| Operação de insert   | `operation-1792018532914-65dd4d415d4e2-2942a1d7-5613c23c`, ID `4074158104013289098`.                                                          |
| Identidade da imagem | Target ID `887441418631362187`; GET 200 após DONE e identidade própria terminal revalidada antes do delete.                                   |
| Admissão estrita     | `observation-unconfirmed`; não se atingiu `ready-observed`; não há confirmação dos campos exigidos, inclusive READY, tamanho e eco da origem. |
| Retirada da imagem   | Um DELETE, operação `operation-1792018658255-65dd4db8e62df-34317cbb-288450de`, `RUNNING → DONE`, sem erro; GET posterior 404.                 |
| Origem               | DELETE da geração/metageneration própria com 204 e GET 404; bucket vazio, identidade conferida, DELETE 204 e GET 404.                         |
| SDK e arquivo local  | Manifests do SDK e tamanho/mtime da fonte preservados; archive com SHA-256 original.                                                          |

A lacuna de diagnóstico é local: o observer converteu a divergência de
metadados em código genérico, mas o runner não preservou os predicados que
divergiram antes da retirada. Não é possível reconstruir esses campos após
excluir a imagem. Não chamar isso de rejeição do archive, falha de IAM,
READY comprovado ou incompatibilidade da query. São hipóteses não demonstradas.
A [referência oficial de images.get](https://docs.cloud.google.com/compute/docs/reference/rest/v1/images/get)
define os campos, mas não substitui sua captura nesta execução.

O resultado conservador foi preservado: `importValidated=false` e
`partial-or-unconfirmed`. Apesar da admissão não confirmada, a identidade e
terminalidade necessárias para remover a imagem própria foram verificadas
separadamente. Delete terminal e GET 404 liberaram a retirada da origem.
Sem novo create, fallback, grant ou alteração silenciosa do validador.

Foram registrados três comandos gcloud (configuração, projeto, token em memória),
17 requests Storage e 28 Compute. Seis mutações no total: criação/upload e
retirada de bucket/objeto; um insert e um delete de imagem. Nenhuma repetição
de mutação. Logs contêm códigos/IDs/metadados sanitizados, nunca token ou
principal. `intent.json`, `plan.json`, `receipt.json`, dois ledgers e claims
ficam no pacote local exclusivo; nenhum registro anterior foi sobrescrito.

O soft delete do objeto observado antes de retirar o bucket informa
`2026-10-14T22:57:45.089Z` e hard delete previsto
`2026-10-21T22:57:45.089Z`. Isso é uma fotografia de retenção, não comprovação
de eliminação futura; a retirada do bucket pode afetar a retenção. Não houve
restauração, alteração do prazo nem tentativa de consultar o bucket já
soft-deleted com permissão extra. A remoção ativa é comprovada; eliminação
física e cobrança efetiva continuam não verificadas.

O `rawDisk.source` contém a query experimental de geração; nenhum fallback
para URI sem geração ou Cloud Build foi autorizado. Mesmo READY/eco da URI
não prova qual geração foi lida nem os bytes do filesystem: esses dois campos
de verificação e `operationalApproved` permanecem false.

## Testes e rastreabilidade

Nove testes novos de lifecycle, escritos antes da implementação, cobrem
limpeza anterior à fronteira de importação, retenção após resultado ambíguo,
exceção e falha de cleanup sem repetição. HTTP e credenciais desses testes
são falsos; não confundir com a execução Google descrita separadamente.

Após essa execução, seis testes adicionais cobrem um diagnóstico somente
local: predicados fixos por campo, limites e identidade, ausência de conteúdo
arbitrário/URI/principal, registro antes do retorno e falha explícita se o
registro não puder ser salvo. O wrapper não adiciona consultas nem enfraquece
`summarizeImage`. **Não foi usado na tentativa acima**, não recupera seus
metadados perdidos e não inicializa cliente/rede/credencial. Deve ser ligado
antes de qualquer futura prova, com autorização própria para os recursos.

151 testes Node locais aprovados, zero failures/skips, incluindo os pacotes
anteriores de transporte/journal/políticas e preparação. `verification.json`
preserva a fotografia inicial de 145; `completion-verification.json` registra
a conferência final e os hashes adicionais, sem substituir o receipt. O runner
exige argumento explícito e `intent.json` exclusivo; não deve ser reexecutado
como mecanismo de recuperação. Claims/operações existentes devem ser lidos.

```bash
node --test .local/worker-isolation/authorized-import.Afp0k9/lifecycle.test.mjs
```

Fotografia técnica do gateway byte-verificada: mesmos 419 arquivos e hash
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`.
Não cobre Dockerfile, mobile, tooling ignorado ou aprovação de segurança.
Maven/web/mobile/SDD não são redatados por esta execução de bootstrap sem
mudança de código, schema, defaults ou status das specs.

Fechamento local: 33 links relativos conferidos nos três documentos, Prettier
direcionado dos seis arquivos JS e três documentos, whitespace/EOF e
`git diff --check -- api/apps/translation-gateway` aprovados. O diff-check
global conserva o EOF alheio em
`web/landing-page/src/shared/component/PlatformBadge.tsx:44`, não alterado.
O scanner inicial confundiu templates Authorization com credenciais e exigiu
permissões privadas também dos fontes; o verificador final separa fontes dos
registros privados, nos quais até o prefixo Bearer é proibido. Nenhum segredo
foi impresso. As correções locais não reexecutaram cloud nem modificaram o
validador de admissão.

| Artefato                                  | SHA-256                                                            |
| ----------------------------------------- | ------------------------------------------------------------------ |
| Runner efetivamente executado             | `2c93069b345d622a0f5ae242667e08dcab9456065414add35cfadda9f3f2b3e6` |
| `receipt.json` original                   | `e4944d2bec0b5f57bbf15f67b8b42b9d972b85d069d075cb5e178e975bb77dd3` |
| `completion-verification.json`            | `8b46d2945b45c107a8f317733d5fbfadb4284e69ec266a6d1f8269455bd9335e` |
| Diagnóstico preparado depois da tentativa | `b3c3912366c132523d7dbcc9b872113442aaf4f4f5daffb4fb93b639acc85b62` |

O pacote novo ocupa cerca de 124 KiB; não houve cópia de JRE, RAW ou archive,
download de dependência ou limpeza de arquivos de performance. O disco
permaneceu com cerca de 23 GiB livres.

## Próximos limites

O próximo trabalho é fechar a captura de diagnóstico antes de propor nova
tentativa financeira. Esta autorização foi consumida pela tentativa única;
não permite recriar imagem/bucket nem restaurar os anteriores automaticamente.

Importação não admite o host/kernel/JRE/codec nem comprova DNS/TLS do pull,
montagem read-only, limites/OOM ou pipeline completo. Criar disco/VM e executar
o bootstrap requer outra etapa operacional aprovada. Nenhuma aprovação desta
parcela libera uploads públicos, tradução, novas imagens ou providers.
