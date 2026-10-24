# Registro progressivo e recuperação parcial — 2026-10-15

## Resultado

Continuação da [retirada integrada de escopo conhecido](worker-isolation-mount-lifecycle-2026-10-15.md).
Implementados journal progressivo, fechamento para novas criações, recuperação
parcial Compute com transporte injetado e adapter HTTP **somente leitura** para
recuperar operações. Mutadores dos testes são falsos; não existe novo executor
de criação cloud aprovado.

Houve conferência **real somente leitura** de identidade/projeto e das listas de
operações. Não houve criação/exclusão cloud, envio de arquivos, instalação,
Vision, tradução, deploy ou reserva nova. A 020 continua `in-progress/open`,
021 bloqueada e defaults desabilitados. Performance, runtime e mobile intactos.
Tooling privado: `.local/worker-isolation/mount-progressive.xqQYzV/`.

## Journal antes do envio e fechamento

O plano contém oito nomes/URLs exatos e hashes dos bodies previstos; **não
inventa IDs** para recursos que ainda não existem. `createOnce` copia o payload
antes de qualquer await, verifica SHA-256 e limite de 128 KiB, confere colisão
por GET e exige predecessores criados. Alteração posterior pelo chamador não
troca o conteúdo associado ao hash. O body não entra no journal.

Cada tentativa recebe UUID v4 e intenção durável antes de chamar o transporte.
Reexecução não repete insert ou delete; uma confirmação perdida continua sendo
uma tentativa potencialmente executada. Arquivos exclusivos `O_EXCL/O_NOFOLLOW`,
modo 0600, proprietário atual, diretório canônico e fsync de arquivo/diretório.
Operação guarda apenas identificadores/vínculos, status e indicador de erro;
mensagens brutas, identidade Google e payload não são persistidos.

`seal` e concessão de novas tentativas compartilham mutex local exclusivo, sem
rede sob o lock. Depois do fechamento não há novos inserts. Uma tentativa
registrada antes dele pode terminar posteriormente: fica explicitamente pendente
até ser observada, nunca é descartada por um GET 404. Estágios sem tentativa,
após o fechamento, são distinguíveis de respostas perdidas.

Lock abandonado, journal incompleto/adulterado ou symlink falham conservadoramente.
Não há quebra automática de lock nem exclusão recursiva para forçar recuperação.
Uma falha do processo durante a transição ainda exige investigação local;
**essa limitação impede tratar o fluxo como operação desassistida aprovada**.

## Recuperação sem repetir mutação

Para tentativa com handle conhecido, consulta a operação pinada. Sem handle,
busca no escopo global/regional/zonal correto por `clientOperationId`; percorre
até oito páginas/4.096 operações e associa também tipo e targetLink localmente.
O filtro do servidor não substitui a conferência dos vínculos.

- Zero resultados: permanece desconhecida; não autoriza repetir nem remover fonte.
- Múltiplos resultados ou IDs/target divergentes: ambiguidade, sem adoção arbitrária.
- `PENDING/RUNNING`: impede toda retirada, mesmo com recurso ausente.
- `DONE` sem erro: exige targetId recebido do serviço.
- `DONE` com erro e sem targetId: só permite considerar o nome ausente por GET;
  nunca usa um ID inventado para excluir um recurso visível.

Depois de encerrar as criações registradas, a recuperação retira somente os
recursos com identidade comprovada, na ordem de dependências. Nomes não tentados
devem estar ausentes; colisão não vira ownership. Reconsulta predecessores e faz
varredura final. Disco em uso, drift e delete incerto preservam pendência.
Resposta perdida com ausência posterior não gera segundo DELETE.

Fonte do contrato de operações e requestId/clientOperationId:
[globalOperations.list](https://docs.cloud.google.com/compute/docs/reference/rest/v1/globalOperations/list),
[regionOperations.list](https://docs.cloud.google.com/compute/docs/reference/rest/v1/regionOperations/list)
e [zoneOperations.list](https://docs.cloud.google.com/compute/docs/reference/rest/v1/zoneOperations/list).
Timeout por I/O de dez segundos; erros sanitizados, sem retry de mutação.
As garantias dependem do transporte aprovado: callbacks injetados não conferem
autoridade, semântica segura do body ou proteção contra outro operador correndo
entre GET e DELETE.

## Conferência real somente leitura

Duas rodadas GET, preservadas separadamente, com UUIDs de diagnóstico novos,
sem reutilizar IDs de fixtures. Cada rodada: Resource Manager, projeto Compute
e três listas de operações. **Dez GETs** ao todo; nenhum insert/delete, grant,
enable ou provider. Identidade existente conferida por hash, token só em memória,
proxies/overrides/credenciais customizadas recusados e SDK com manifests iguais
antes/depois. Nenhum login ou update implícito.

Primeira observação às 16:34:00–05 UTC; confirmação canônica às 16:35:30–33 UTC.
Projeto `toonlira-rm` ativo e mesmo project number; metadados comuns vazios.
As listas global, `southamerica-east1` e `southamerica-east1-a` responderam 200,
aceitando o filtro por clientOperationId. **Não foi encontrada/adotada uma
operação real da avaliação**, nem provado que um insert perdido foi recuperado.

Finding: lista sem resultados veio com `kind`, `id`, `selfLink`, **sem `items`
e sem warning**. A primeira versão local do parser recusaria esse formato.
Foi escrito teste vermelho e corrigido o parser novo: omissão só é aceita com
identidade canônica da lista ou warning documentado; id/selfLink divergente,
envelope genérico, `items=null`, paginação incompleta e erros continuam recusados.
A segunda consulta validou explicitamente os três id/selfLink esperados, sem
persistir seus valores/respostas brutas. Recibo inicial não foi sobrescrito.

Esse ajuste não muda o desfecho de uma tentativa: lista vazia continua deixando
a criação sem confirmação, nunca terminal. Parsers históricos não foram
reescritos para renovar evidência; outras listas ainda exigem validação própria.

## Fronteira restante

O núcleo já trata estados parciais **em testes**, inclusive restart e resposta
perdida. Não implementa o POST/DELETE HTTP novo: esses efeitos são callbacks
falsos nos testes. Hash de body garante consistência, não revisão de segurança
dos campos. Ainda faltam composição dos requests aprovados, mutadores HTTP
vinculados ao journal, tratamento de crash do mutex e conexão do escopo parcial
ao contrato de staging, sem fabricar um plano completo de oito IDs.

`recoverPartial` mantém `stagingDeleted=false` e `operationalApproved=false`.
Não remove bucket/objeto nem autoriza consumo do worker. O caminho completo
conhecido anterior permanece intacto; não foi relaxado para aceitar IDs ausentes.
Revisão COS e cotação/envelope completos seguem obrigatórios antes da VM real.

Ledger mantém duas reservas históricas; nenhum slot novo e limite de US$ 5
inalterado. Envelope US$ 0,66 anterior permanece provisório e não foi redatado
como cotação, fatura ou teto do provedor. Custos residuais anteriores não foram
apurados. Nenhuma ausência ativa nesta evidência equivale a expurgo físico.

## Reprodução e rastreabilidade

```bash
node --test .local/worker-isolation/mount-progressive.xqQYzV/progressive.test.mjs .local/worker-isolation/mount-progressive.xqQYzV/recovery-reader.test.mjs
```

Testes sintéticos escritos antes dos módulos. Incluem envio único, intents
duráveis, respostas perdidas, tentativa em voo após seal, concorrência, lock
abandonado, colisão, target drift e mutação de payload. O teste integrado usa
adapter HTTP GET/search real contra API falsa; os mutadores continuam falsos.
Não são evidência de provisionamento ou montagem no COS.

| Artefato privado          | SHA-256                                                            |
| ------------------------- | ------------------------------------------------------------------ |
| `progressive.mjs`         | `950bb13343625da4953ee06e88430f1f2788b389c6c1bcaf0120ef5b3a4af976` |
| `recovery-reader.mjs`     | `c2bfb8e5dd6f3d71775c23c6ea275254927261fbc817cca754587a67c727eb4f` |
| `operation-probe.json`    | `4fe3b4d8c570bc3b749932b6e7835aab3ea171111be9fae0e295b78621cf6910` |
| `operation-probe-v2.json` | `cc209c5ec2c80880e92fa61e863569a64cfb6716bab26e7025e05e6884cdf162` |

Executores/recibos de consulta são de rodada única; não reproduzir por cima da
evidência. O fechamento local em `verification.json` distinguirá testes
sintéticos de GETs reais, fontes do gateway, ledger e evidência histórica.
Maven/web/mobile/SDD anteriores não são redatados sem alteração do aplicativo.

## Fechamento observado

Suíte conjunta: **393 testes aprovados**, zero falhas/cancelamentos/skips;
37 casos novos desta parcela. Testes de mutação/recuperação são sintéticos;
os dez GETs reais estão separados nos dois recibos de consulta. Conferidos
135 links relativos, sintaxe, scan limitado dos recibos, Prettier direcionado e
diff-check dos documentos afetados. Finding global alheio preservado em
`web/landing-page/src/shared/component/PlatformBadge.tsx:44`, linha vazia no EOF.

Os 419 paths/bytes da fotografia técnica do gateway continuam com SHA-256
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`.
Esse checksum não cobre Dockerfile, mobile, documentação, tooling privado ou
aprovação de segurança. Ledger de duas reservas e evidências anteriores íntegros;
sem cópia de archive/JRE/RAW, nova instalação ou mudança de performance.

`verification.json`:
`8b713f0ff1aef91e9a8d29cdc13508fd3c7ad0f70d61330df9da6898e899baf0`.
Fechamento acrescentado após o recibo, com nova conferência direcionada de
formatação/diff; a fotografia anterior não foi regenerada nem sobrescrita.
