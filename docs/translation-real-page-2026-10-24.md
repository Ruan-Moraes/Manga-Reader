# Primeira página com providers reais — 2026-10-24

## Alcance e autorização

Ruan autorizou uma página sintética própria de inglês para português, Cloud
Vision no endpoint US e Cloud Translation LLM no endpoint global, sem repetição
automática ou ativação pública. Reserva máxima dos providers: US$ 1, dentro dos
US$ 5 desta rodada e US$ 100 do piloto. Nenhuma nova VM foi criada nesta etapa.

Essa autorização amplia somente o teste controlado; não altera consentimento
ou disclosures de produção, não libera mídia pessoal e não aprova operação
pública. A autorização da segunda VM e sua execução anterior estão na
[validação simples](translation-validation-2026-10-24.md).

## Execução observada

Uma PNG própria de 900 × 600, 15.283 bytes, contém duas frases em inglês.
Identidade autenticada temporária do operador foi passada somente em memória
por stdin, sem chaves de service account, ADC no app, tokens em argumentos ou
credenciais no worker. O original foi enviado a um objeto único no bucket
privado já existente; os outros objetos e a configuração do bucket foram
preservados. A limpeza conferiu owner, hash e geração. Uma consulta independente
retornou 404 para a geração e zero versões ativas/não correntes do nome exato.
O bucket preexistente, sem versionamento, possui **soft delete de 604.800 segundos
(sete dias)**. Essa política não foi alterada: exclusão da geração ativa não
significa apagamento físico imediato nem custo de armazenamento zero. A mídia
é sintética própria e sua retenção residual deve continuar visível no relato.
A geração foi observada em soft delete, com `hardDeleteTime` informado pelo
Google de `2026-11-01T01:25:40.876Z`. Esse prazo futuro não é uma confirmação
de expurgo já ocorrido.
A [API de exclusão](https://docs.cloud.google.com/storage/docs/json_api/v1/objects/delete)
não elimina antecipadamente objetos em soft delete.

A Cloud Translation API foi habilitada apenas para o piloto e depois
desabilitada novamente. Consulta independente confirmou o retorno ao estado
anterior. Vision, bucket e demais serviços preexistentes foram preservados.

Houve **uma chamada Vision e uma chamada Translation**, ambas com status gRPC
OK e resposta protobuf capturada antes da validação do adapter. Retries do RPC
estavam desabilitados. O OCR reconheceu uma região e preservou as duas frases,
a ordem e o quadrilátero. A tradução real foi:

> Olá! Consigo ler esta página. Vamos começar nossa aventura.

A primeira validação falhou fechada: o provider normaliza o modelo para o
**número** do projeto e o adapter comparava com seu ID textual. Esse comportamento
é documentado no [contrato oficial de TranslateTextResponse](https://docs.cloud.google.com/translate/docs/reference/rest/v3/TranslateTextResponse).
O resultado inicial continua registrado como falha; não foi sobrescrito nem
reinterpretado como sucesso da primeira execução.

A regressão reproduziu a rejeição e a correção permite configurar o número
canônico na propriedade existente, mantendo a comparação do caminho completo.
Projeto diferente, região diferente e fallback NMT continuam rejeitados. Não
há descoberta de alias ou retry no caminho do provider. Na operação real,
`GATEWAY_TRANSLATION_PROJECT_ID` precisa receber o número canônico verificado
previamente; o nome histórico da variável foi preservado. O preflight do modo
Google agora recusa o ID textual antes de criar o client ou descobrir
credenciais. A regressão correspondente falhou antes da correção e passou
depois; os testes também preservam o modo disabled sem inicialização de client.
Essa proteção de configuração posterior não é nova medição da imagem nativa
usada no replay e não dispara providers.

A resposta já capturada foi então reproduzida somente em loopback, sem
credenciais, para validar o adapter corrigido e o manifesto. Nenhuma nova
chamada paga foi feita. O replay exige os hashes capturados, a identidade
configurada do projeto e o vínculo OCR/IDs/idiomas. O manifesto resultante é
validado novamente pelo parser estrito.

## Renderização do conteúdo real capturado

Um pacote ARM64 local foi reconstruído com os builders versionados, fonte
libwebp 1.6.0 verificada e base Temurin fixada por digest. O primeiro preparo não
iniciou o worker porque o PostgreSQL local só possuía a variante x86_64. Essa
recusa foi preservada; a variante ARM64 foi resolvida por digest, sem substituir
a tag usada por outros testes.

O worker completo executou com PostgreSQL temporário em rede Docker interna,
sem credenciais nem acesso externo. Usou exatamente a geometria/IDs/textos dos
manifestos reais capturados, vinculados ao hash do original. Não inventou caixas
ou traduções para essa rodada. Os ports de replay são exclusivos dos testes;
os providers de produção continuam disabled.

Resultado: **um job READY, três etapas SUCCEEDED, uma região e zero overflow**.
A reentrega não repetiu os ports. O processo terminou com exit 0, sem OOM; banco,
worker e rede foram retirados, com inventário vazio dos nomes exclusivos.

| Medição | Valor observado |
| --- | --- |
| Ambiente desta renderização | Linux ARM64 nativo local; não é a VM x86_64 anterior |
| WebP | 900 × 600, 18.460 bytes |
| Duração do probe com bootstrap | 16,352 s |
| Cenário da página | 3,115 s |
| Pico agregado observado do cgroup | 782.385.152 bytes, aproximadamente 746 MiB |
| Limite do container / swap adicional | 8 GiB / zero |
| AS de pai e filha | 3 GiB; helper encerrado no bootstrap |
| Scratch | tmpfs 512 MiB, noexec |
| Usuário/capabilities/PIDs | UID 1000, capabilities removidas, 64 PIDs |
| HTTP público/listeners | rota recusada, zero listeners |
| Pixels modificados | 13.335; zero fora do polígono OCR |

Conferência visual efetuada abrindo o WebP: português legível, sem resto das
frases inglesas no balão e texto igual ao manifesto. A imagem foi decodificada
independentemente para conferir formato/dimensões; bytes e hashes foram
confrontados com o manifesto e os recibos anteriores.

| Artefato | SHA-256 |
| --- | --- |
| Original | `990a50793875fde8d57cb9896ddfb27ac151cfed8a5e320d2d206fd0c2c36ea7` |
| OCR | `e7c76ea11826db5f6967b1750ca4293869921d9ad1b788b705b2b8b60e1743d1` |
| Tradução | `d42329d8623047d3e349702d59e0c1cb6208df76b2d9b8f8339953e83d348a3f` |
| WebP | `f1105ab88129704acfc3d8168a2120f30cd254f09c4ccee36d658108445a10b3` |
| Manifesto final | `909ad504695001d1d6ee35bee8837e79bd4afb8fa8702eb98c898f9331813586` |

## O que a rodada de 24/10 comprovou e o que faltava

Comprova uma resposta real Vision/Translation e sua composição real pelo worker
por replay sem nova cobrança. **Não é uma única execução cloud integrada com
providers reais**, nem aquisição remota pelo app. A prova cloud anterior usa
providers simulados; as duas evidências não são fundidas numa execução fictícia.

Não aprova qualidade geral de mangás, scripts verticais, sete destinos,
performance de páginas máximas, segurança/distribuição, retenção operacional
integral ou publicação do serviço. A 020 continua `in-progress`; a 021 continua
bloqueada enquanto sua revisão não for aprovada. Não houve mudança de API,
schema, migration ou código runtime do mobile.

A [proposta de revisão da 021](translation-reader-revision-2026-10-24.md)
reconcilia leitor unificado/SQLite v9 e separa a aquisição mobile da admissão
operacional completa da 020. Aguarda decisão humana; não é aprovação derivada
do piloto pago.

O teto autorizado não é medição de gasto nem hard cap do Google. Não se afirma
custo faturado inferior a US$ 1 ou US$ 5 por estimativa, créditos ou ausência de
recursos. Logs, respostas, recibos financeiros e identificadores permanecem na
área privada ignorada; a reserva conservadora histórica continua preservada.

## Verificação de código

Regressões novas cobrem configuração numérica com pin exato de modelo,
permissão/identidade/hash da fixture, invocação única, captura anterior à
validação, preservação da primeira resposta, tamanho de resposta, geometria e
texto dos manifestos capturados. Testes de loopback não acessam o Google.

Gate de 2026-10-24 anterior ao reforço do preflight, Java 25.0.5 e Docker:

```sh
cd api
JAVA_HOME=/Users/ruanmoraes/.jenv/versions/25 \
DOCKER_HOST=unix:///Users/ruanmoraes/.orbstack/run/docker.sock \
TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=/var/run/docker.sock ./mvnw -o test
```

Sete módulos SUCCESS; zero falhas e erros. Os XMLs finais registram 2.725 testes
somados nos consumidores: Core 1.375, rating 10, orphan 11, trending 15 e gateway
1.314. Os 104 skips do gateway são opt-ins já existentes, não testes removidos
para aprovar o piloto:

| Propriedade opt-in ausente | Skips |
| --- | ---: |
| `renderer.amd64.enabled` | 16 |
| `renderer.worker.resources.enabled` | 17 |
| `renderer.native.enabled` | 28 |
| `renderer.glibc.enabled` | 3 |
| `renderer.distribution.enabled` | 7 |
| `renderer.shared.enabled` | 1 |
| `renderer.archive.enabled` | 2 |
| `renderer.visual.enabled` | 1 |
| `renderer.native.image.enabled` | 4 |
| `renderer.shared.resources.enabled` | 17 |
| `renderer.linux.resources.enabled` | 5 |
| `renderer.linux.enabled` | 3 |

Esses skips não equivalem à execução das respectivas matrizes. A prova nativa
limitada desta página é o processo separado descrito acima.

`pnpm specs:check` passou: 66 artefatos normativos e 918 arquivos classificados,
sem alteração nos gates. Links novos e `git diff --check` também passaram.
Os gates mobile completo, web e landing recuperados anteriormente permanecem
registrados na evidência da rodada simples; não foram atribuídos novamente a
uma execução física ou integração mobile que ainda não ocorreu.


### Revalidação após preflight canônico

A execução global da árvore com o preflight numérico reforçado terminou às
22:46:50 de 2026-10-24: sete módulos SUCCESS, **zero falhas/erros**, 2.726 testes
nos consumidores e 104 skips opt-in identificados acima. Gateway: 1.315 testes,
104 skips. A regressão nova prova que ID textual é recusado sem criar o client;
número canônico continua aceito e disabled não descobre credenciais.

Não houve nova chamada paga, nova VM, alteração do gate mobile ou atribuição
da medição nativa anterior a um pacote novo. A aquisição e a leitura offline
da página real no app continuam sem evidência e dependentes da revisão humana
da 021.

## Continuidade aprovada e executada — 2026-10-25

A revisão da 021 foi aprovada explicitamente. A aquisição mobile agora executa
downloads limitados, valida SHA/manifesto/dimensões, move privado, transação v9,
ACK e claim persistente antes da navegação. Sem API pública/schema/migration.
A [evidência nativa](../mobile/docs/specs/features/MOB-FEAT-021-local-translation-result-reader/evidence/native-acquisition-2026-10-25.md)
registra os dois downloads reais e o leitor em iOS simulado, seguido de leitura
local e alternância para original após retirada dos objetos. Consulta/ACK foram
controlados no harness: não é execução única integrada cloud→providers→app.

As afirmações de bloqueio/ausência de implementação nas seções anteriores são
o registro histórico anterior à aprovação. Status corrente: 020 `in-progress`,
021 `verification-pending`; Android físico adiado pelo usuário, produção pública
desabilitada. Não houve chamada paga adicional nem criação de VM nesta etapa.

Gates finais mobile em 2026-10-25: `pnpm check` completo aprovado, 121 suítes/943
testes, specs/tipos/lint/FSD/formatação verdes; 66 artefatos normativos, 935
arquivos classificados (370 de comportamento e 251 de evidência). Revisões
receberam somente nova referência da árvore; status, pendências e evidências
físicas anteriores foram preservados. Maven global permanece comprovado na
árvore backend final por 2.726 testes, zero falhas/erros, 104 skips opt-in;
nenhuma alteração backend ocorreu depois dessa execução.

## Auditoria final da meta delimitada

| Requisito | Evidência e conclusão |
| --- | --- |
| Gates locais recuperados e arquivos preservados | `pnpm check` final integral, 121/943; 26 regressões de governança; comandos nativos do proprietário preservados; Podfile local existente |
| Web e landing | Gate `tsc -b`/boundary lint e 28 suítes/97 testes registrados na rodada simples; nenhuma alteração posterior nesse código |
| Backend com Java/Docker corretos | Maven global final: sete módulos SUCCESS, 2.726 testes, 0 failures/errors, 104 skips opt-in separados |
| Worker cloud isolado | Rodada sintética documentada com READY/WebP/manifesto, N2 privado e limites preservados; VM, disco e imagem retirados |
| OCR/tradução/renderização reais | Uma chamada paga de cada provider, capturas preservadas; replay nativo completo READY sem nova cobrança |
| Aquisição íntegra no app | HTTPS real para dois artefatos; parser/SHA/bytes/MIME/decoder, arquivos privados e commit SQLite v9, sem migration |
| Leitura local | Reinícios sem gateway/download, mesmo hash, claim false, tradução e original legíveis no iOS simulado |
| Privacidade e retirada | Inventário independente final: zero VMs/discos/imagens próprios; imagens públicas do catálogo excluídas da contagem; zero objetos vivos temporários próprios; soft delete preexistente preservado |
| Financeiro | Preflight e reservas dentro dos tetos; não se afirma gasto faturado medido abaixo de US$ 5 |
| Gates SDD e publicação | 021 `verification-pending`, 020 `in-progress`; Android físico adiado pelo usuário; gateway/download/providers/dispatch continuam disabled por padrão |

A meta de primeira página funcional tem evidência técnica delimitada. Permanecem
fora dessa conclusão a execução única com providers e gateway ao vivo, Android
físico, qualidade geral/multilíngue e admissão em produção. A aprovação da revisão
e a decisão de continuar sem Android não são promoção de status dessas features.


## Atualização Android físico — 2026-10-26

A matriz nativa foi executada no Galaxy S21+/Android 15: READY remoto persistido
em SQLite v9, hashes conferidos, leitura e original, reinícios com zero download
e claim false, estados/overflow/aviso sem texto nos três idiomas. Streams no
Android são controlados e reutilizam a página capturada; o HTTPS GCS comprovado
anteriormente pertence ao iOS. Nenhuma chamada paga ou VM adicional foi usada.

Foram corrigidos o aviso sem texto escondido, mensagens antigas de READY e a
reabertura manual. TalkBack esteve vinculado e apresentou foco visível, mas
fala/gestos e retorno do foco exigem interação humana; configuração anterior
restaurada exatamente. A 021 continua verification-pending por essa pendência
específica; a 020 continua in-progress. As referências anteriores a Android
indisponível descrevem a fotografia de 25/10, substituída por esta atualização.

Ver [evidência Android sanitizada](../mobile/docs/specs/features/MOB-FEAT-021-local-translation-result-reader/evidence/android-physical-2026-10-26.md).


### Fechamento da 021 — confirmação humana em 2026-10-26

Ruan confirmou nomes falados e Ver original funcionando após o roteiro solicitado
de exploração com TalkBack; desativação conferida por ADB. A 021 passa para
implemented, com todas as tasks concluídas e review aprovado. Essa atualização
resolve a pendência humana descrita acima, sem afirmar retorno específico de foco
ao controle de origem ou execução integrada única ao vivo. A 020 segue in-progress;
publicação desabilitada. Check mobile completo: 121 suítes, 953 testes.
