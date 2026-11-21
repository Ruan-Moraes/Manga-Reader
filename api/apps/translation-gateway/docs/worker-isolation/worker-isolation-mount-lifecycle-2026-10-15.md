# Retirada integrada de Compute e staging — 2026-10-15

## Resultado desta continuação

Integrada a [retirada Compute anterior](worker-isolation-mount-transport-2026-10-15.md)
à retirada de objeto/bucket privados, para **escopo completo previamente conhecido**.
Nova barreira exige operações de criação encerradas antes de remover o arquivo
usado na importação. Testes executam os adapters HTTP com **API falsa**, não uma
rodada real do Google Cloud.

Tooling JavaScript em `.local/worker-isolation/mount-lifecycle.neCsd6/`, ignorado
pelo Git. Nenhuma instalação, credencial, imagem enviada, recurso criado/excluído
na cloud ou reserva financeira nova. Defaults continuam desligados, 020
`in-progress/open` e 021 bloqueada. Runtime, schema, APIs, mobile e arquivos da
auditoria de performance não foram alterados.

## Barreira de criação

GET 404 do recurso não comprova que sua criação terminou: uma operação pendente
pode produzir o recurso posteriormente. Portanto `fence.mjs` exige os oito handles
de insert vinculados ao plano Compute: operação, ID decimal, escopo, targetLink,
targetId e clientOperationId. Coleções são copiadas e congeladas, com ordem
canônica. Não aceita trocar operação, descobrir um handle por nome parecido ou
substituir falta de confirmação por lista vazia.

O leitor HTTP novo faz somente GET em endpoints fixos de operações Compute.
Credencial/fetch são dependências explícitas; não inicializa ADC, SDK ou rede
ao importar/criar o adapter. HTTP 403/404, timeout, resposta inválida ou operação
`PENDING/RUNNING` preservam a pendência. Sem retry e sem executar insert.
Cada chamada tem deadline de dez segundos e corpo de até 256 KiB.

Somente `DONE` com todos os vínculos iguais satisfaz a barreira. `DONE` com erro
terminal permite **retirar o escopo próprio conhecido**, não aprova criação,
montagem ou worker. Apenas a contagem dos erros sai da função; mensagem bruta
não entra no resultado. Referência: [recurso de operação Compute](https://docs.cloud.google.com/compute/docs/reference/rest/v1/globalOperations/get).

## Objeto, bucket e recuperação

`storage.mjs` cria plano canônico de retirada, ligado pelo SHA-256 ao plano
Compute, contendo apenas metadados operacionais. Nome do bucket é exclusivo da
rodada; objeto é derivado do hash do archive. Gerações/metagerações permanecem
strings, sem perda de precisão. Reaproveita os validadores anteriores de
ownership, sem alterar seu código ou recibos históricos.

Antes de excluir, confere projeto pelo hash esperado, labels, generation,
metageneration e data exata do bucket; objeto deve manter nome, metadados de
ownership e versões pinadas. Consulta tanto a geração esperada quanto o objeto
atual. Se houver substituição, não remove a versão nova nem finge bucket vazio.
Ownership de retirada é separado da validação do conteúdo do archive; esta
continua obrigatória na admissão futura, com hash e readback.

DELETE do objeto envia `generation`, `ifGenerationMatch` e
`ifMetagenerationMatch`. Depois exige ausência da geração ativa e do objeto
atual. Lista o bucket com `versions=true`, sem prefixo, e recusa qualquer item,
prefixo, continuação de página ou envelope desconhecido. Não enumera/deleta
outros arquivos para forçar a limpeza. Só então revalida o bucket e envia DELETE
condicional à metageneration. Resposta 204 isolada não é suficiente: consulta
subsequente deve confirmar 404.

O journal local privado usa `O_EXCL/O_NOFOLLOW`, ownership/mode, fsync do arquivo
e diretório; vincula o contexto pelo hash do plano. Tentativas não são
sobrescritas. Nova instância pode confirmar ausência após resposta perdida,
mas não reenviar uma exclusão ambígua cujo alvo continue presente. Symlink,
arquivo legível por terceiros, binding divergente ou disputa incompleta falham
conservadoramente. Nenhum erro de leitura vira autorização de exclusão.

Referências: [exclusão de objeto e soft delete](https://docs.cloud.google.com/storage/docs/json_api/v1/objects/delete),
[preconditions](https://docs.cloud.google.com/storage/docs/request-preconditions),
[listagem de versões e paginação](https://docs.cloud.google.com/storage/docs/json_api/v1/objects/list)
e [exclusão condicional de bucket](https://docs.cloud.google.com/storage/docs/json_api/v1/buckets/delete).

**Limites preservados:** bucket DELETE não oferece precondition por generation;
GET anterior e condição por metageneration não eliminam uma corrida com outro
operador recriando o mesmo nome. Não operar concorrentemente nesses nomes.
Ausência ativa não é expurgo físico: soft delete e custo residual continuam
possíveis. Resultado mantém `physicalDeletionVerified=false`; não altera retenção,
desliga proteções ou tenta apagar versões soft-deleted.

## Orquestração conhecida e fronteira ainda aberta

`round.mjs` conecta os adapters existentes e novos:

1. Confere vínculo entre planos e oito handles; consulta criações e exige que
   já estejam terminais, sem polling/retry automático.
2. Executa retirada Compute por IDs e confirma ausência dos oito alvos.
3. Antes da retirada de staging e de cada DELETE Storage, reconsulta operações
   de criação e ausência Compute. Divergência retira a confirmação corrente de
   ausência, em vez de reutilizar uma observação anterior como se fosse atual.
4. Confirma ausência ativa do objeto/bucket e retorna eventos sanitizados.

Falha de gravação do recorder é sinalizada em `recordingComplete=false`; não
interrompe a retirada dos recursos próprios nem fabrica evidência durável.
Os journals continuam sendo a proteção de envio único. Exceptions brutas,
metadados Google e tokens não entram nos eventos. Callbacks injetados são
capacidades de transporte, não concessão de autoridade ou prova de identidade.
O futuro executor deve reaplicar os pins de identidade/projeto/TLS/SDK.

**Não é o lifecycle completo de criação.** O módulo recebe IDs/gerações e handles
já conhecidos. Ainda não cria bucket, faz upload ou insere VM/rede/discos; não
resolve criação parcial sem todos os recibos nem insert cuja confirmação foi
perdida antes de conhecer o handle. Nesse caso preserva pendência, sem inferir
sucesso ou liberar a fonte. O caminho real de criação só poderá ser admitido
quando journal progressivo e recuperação desses estados parciais estiverem
integrados. Não usar o happy path sintético para contornar essa pendência.

Permanecem necessários a revisão COS, integração/admissão da criação parcial e
cotação/envelope completos antes de usar o último slot normal do ledger.
Envelope anterior de US$ 0,66 continua provisório, não foi redatado e não é teto
do provedor. Limite autorizado de US$ 5 não foi ampliado; fatura não foi apurada
nesta parcela. Nenhuma permissão adicional é solicitada por esses testes locais.

## Reprodução e rastreabilidade

```bash
node --test .local/worker-isolation/mount-lifecycle.neCsd6/storage.test.mjs .local/worker-isolation/mount-lifecycle.neCsd6/fence.test.mjs .local/worker-isolation/mount-lifecycle.neCsd6/round.test.mjs
```

Testes escritos antes dos módulos, inicialmente vermelhos por import inexistente.
Durante a integração, foi corrigida a construção do plano para produzir ordem
canônica dos campos, com regressão específica; não foram removidas validações
de ownership, versões ou operações para obter resultado verde.

Cobertura inclui retirada integrada de oito recursos Compute + objeto/bucket,
reexecução sem segundo DELETE, criação pendente mesmo com recursos 404, resposta
perdida, recurso reaparecendo, objeto substituído, listagem incompleta, HTTP 412,
cancelamento e journal adulterado. IDs, conteúdos e tokens são fictícios.
Não é coleta real, revisão do host, teste de billing ou validação operacional.

| Fonte privada | SHA-256                                                            |
| ------------- | ------------------------------------------------------------------ |
| `storage.mjs` | `bf74cb17c2f1766f5004d4fbf09c70dc11cad60a27108aa95490fdbbea196575` |
| `fence.mjs`   | `4726aa48dfe255a21a06acf3a67b783b9d303ab9cc7188838ac8d6dfd6bd13de` |
| `round.mjs`   | `7b1b83aa45a2ce912df37450abc21abf42eea7f5a7d9f7e72e798728d6ab7489` |

Recibo final em `verification.json`, no diretório privado, com suíte conjunta,
fotografia técnica e ledger anteriores, links, sintaxe, formatação e diff-check.
Maven/web/mobile/SDD não serão redatados nesta parcela privada e documental sem
mudança de runtime, schema, estado de spec, contrato ou defaults.

## Fechamento observado

Suíte conjunta: **356 testes aprovados**, zero falhas/cancelamentos/skips;
47 casos novos nesta parcela, todos locais e sintéticos. Conferidos 133 links
relativos, sintaxe JavaScript, scan limitado do recibo, Prettier direcionado e
diff-check dos documentos afetados. Finding global alheio preservado:
`web/landing-page/src/shared/component/PlatformBadge.tsx:44`, linha vazia no EOF.

Os mesmos 419 paths/bytes do gateway mantêm o SHA-256
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`.
Ledger de duas reservas e evidências anteriores íntegros. Essa fotografia não
cobre Dockerfile, mobile, documentação ou tooling privado, nem aprova o host.
Não houve nova instalação, cópia de archive/JRE/RAW, uso de credencial ou alteração
da auditoria de performance.

`verification.json`:
`c50c4e9653aabf816af01e4a5905af8e5caef8daf6026c69a063cfba6e4884a3`.
Este fechamento foi acrescentado após o recibo, com nova conferência direcionada
de formatação/diff; a fotografia anterior não foi regenerada ou sobrescrita.
