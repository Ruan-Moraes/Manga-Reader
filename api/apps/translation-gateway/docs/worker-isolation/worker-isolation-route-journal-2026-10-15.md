# Retirada da rota própria com journal durável — 2026-10-15

## Resultado e limite

Continuação da [revisão dos requests](worker-isolation-request-review-2026-10-15.md).
Implementados journal exclusivo de rota, transporte HTTP GET/DELETE restrito e
orquestração de retirada, testados **somente com API falsa**. A integração usa
também o journal Compute durável já existente, sem modificar sua implementação.

Tooling privado: `.local/worker-isolation/mount-route.nUzHfL/`. Nenhuma consulta
ou mutação de projeto Google, credencial real, instalação, envio de arquivos,
Vision, tradução, VM, disco ou nova reserva financeira. Documentação pública da
API consultada separadamente. A 020 continua `in-progress/open`, 021 bloqueada,
defaults desabilitados e arquivos de performance preservados.

## Vínculo e envio único

O plano permanece vinculado ao bundle canônico, progressivePlanSha256, network ID
e route ID observados pelo chamador. O journal Compute deve conter a criação da
rede em DONE sem erro, com o mesmo targetId; não pode haver retirada da rede ou
tentativa de criação da VM. Nome, selfLink e descrição da rede são conferidos por
GET, não somente por nome da rota. Fixtures usam IDs explicitamente sintéticos.

Journal próprio em diretório canônico 0700, com arquivos 0600 e contrato distinto
dos journals anteriores. Reutiliza **sem alteração** o helper Java de publicação
atômica/lock do sistema operacional. Não há migração nem quebra de lock legado.
O protocolo guarda hashes de vínculo, UUID, IDs/URLs, indicador `sent`, handle
e status sanitizado; não guarda token ou resposta bruta.

A intenção reserva um requestId durável. O envio exige uma segunda transação CAS,
que muda `sent=false → true` **antes** do DELETE. Dois clientes ou reabertura
compartilham a mesma permissão; só um consegue gastá-la. Interrupção após gastar
mas antes do envio é conservadoramente ambígua: nunca repete DELETE para tentar
adivinhar se houve efeito. Uma intenção ainda não gasta pode ser usada após nova
validação; isso não é repetição de chamada enviada.

Registros de tipo incorreto, inclusive string vazia no lugar de null, corrupção,
binding diferente ou alteração da identidade da operação falham sem reset.
Helpers recebem ambiente vazio; compilação usa somente o Corretto 23 já instalado,
com classes temporárias próprias removidas ao final. Não instala ou baixa SDK.

## Transporte e confirmação

Factory preguiçosa, sem credencial ou rede na importação/construção. Exige
autorização interna específica e portas de journal vinculadas. Hosts, paths e
escopos são derivados dos planos; nenhuma URL arbitrária é aceita. DELETE tem
body ausente e somente requestId na query. Fonte:
[routes.delete](https://docs.cloud.google.com/compute/docs/reference/rest/v1/routes/delete).

GETs completos de rotas e routers são limitados a oito páginas/4.096 itens,
256 KiB por resposta e deadline de dez segundos por método completo. Filtro do
servidor é revalidado localmente. Token de paginação repetido, envelope genérico
sem items, JSON inválido/excessivo, warning incompatível ou leitura incompleta
impedem mutação. Omissão de items só é aceita com identidade canônica da lista ou
warning NO_RESULTS_ON_PAGE. Isso foi testado com API falsa, **não observado como
formato real dessas listas nesta parcela**. Fonte:
[routes.list](https://docs.cloud.google.com/compute/docs/reference/rest/v1/routes/list).

Antes do DELETE: revalida journal Compute, rede, rota e escopo. Após percorrer as
listas, faz novos GETs de rede e rota próximos ao gasto da permissão durável.
Dois testes vermelhos demonstraram troca de ID durante a listagem; essas consultas
adicionais corrigiram a janela observável e os testes passaram.

**Limitação da API mantida:** routes.delete não oferece precondição de ID na
requisição documentada. GET e DELETE não são atômicos entre si. As consultas
adicionais reduzem a janela, mas não protegem contra outro operador substituindo
o recurso entre o último GET e DELETE. Operação real exige controle exclusivo
desses recursos; não se declara um compare-and-delete que o serviço não fornece.

Resposta HTTP aceita não equivale a retirada. Exige operação global vinculada
por requestId/clientOperationId, targetLink, targetId, tipo delete e handle;
DONE sem erro, GET 404 da rota e nova listagem sem default/next hop indevido.
Depois revalida rede e estado Compute antes de registrar ausência. Fontes:
[operações globais](https://docs.cloud.google.com/compute/docs/reference/rest/v1/globalOperations/list).

Handle conhecido é consultado diretamente. Resposta perdida busca UUID no escopo
global, percorre todas as páginas e exige exatamente uma candidata válida.
Zero/múltiplas candidatas, PENDING/RUNNING, erro ou identidade divergente mantêm
bloqueio, **mesmo com GET 404**. Nenhum retry de DELETE, inclusive após 503/timeout.
Página sem rota desde o início não inventa operação ou ID; ainda precisa do
escopo e da rede válidos.

O transporte encerra seu uso ao final, descarta o token em memória e impede
novas ações após close. Falhas de dependências são sanitizadas. Um recibo local
de ausência não dispensa nova conferência no futuro: rota criada posteriormente
volta a bloquear a admissão.

## Testes e reprodução

```bash
node --test .local/worker-isolation/mount-route.nUzHfL/route.test.mjs
```

Testes escritos antes do código. Cobrem envio único sob concorrência, restart,
confirmação perdida, pendência e erro, 404 ambíguo, scope drift, rede/rota
substituída, paginação, JSON/tamanho, timeout real local de dez segundos, ausência
inicial, nullability, close e ausência de uso implícito de credenciais.

A integração exerce journals Compute e rota duráveis com o mesmo helper Java,
cliente HTTP e API falsa. Demais casos usam estado Compute sintético, identificado
nos testes. Não cria Testcontainers, monta filesystem ou executa o worker/COS.
A suíte não usa imagens de mangá, banco compartilhado ou conexão Google.

| Artefato privado | SHA-256                                                            |
| ---------------- | ------------------------------------------------------------------ |
| `policy.mjs`     | `7b269438bd2c77e3cb8d3bca22da473684249eef396e63cd7711957c55f0e3f3` |
| `journal.mjs`    | `0600167cb8e0e97b6da77ccee220e2e0e9b326da1e38f8170dbe8c67b25bacb2` |
| `route.mjs`      | `701a8201d754be2feffe856c165c7f076d5d5710db66e9965154f88b56e05ae7` |

O fechamento em `verification.json` confere suíte conjunta, recibos e fontes
históricos, ledger, links, sintaxe, formatação e diff direcionados. Sem mudanças
no aplicativo, não redata gates Maven/web/mobile/SDD. Finding global alheio de EOF
no landing page permanece separado, sem correção automática.

## Próxima barreira

A retirada de rota tem implementação local e transporte HTTP testado, não uma
execução ou aprovação operacional. Falta ligá-la ao driver de criação e retirada
completa, impedindo que um insert de VM contorne a barreira. O `createOnce`
histórico não foi apresentado como se já conhecesse essa nova condição.

Também seguem pendentes os mutadores de criação dos oito recursos, a revisão COS
restrita à montagem e cotação/admissão financeira completas. Nenhum desses gates
é substituído pelos testes novos. Ledger conserva duas reservas; nenhuma nova
reserva e limite total de US$ 5 preservado. Envelope anterior permanece provisório,
não fatura ou teto do provedor.

## Fechamento observado

Suíte conjunta: **492 testes aprovados**, zero falhas, cancelamentos ou skips;
34 casos novos. Inclui o teste de timeout local de dez segundos, integração com
journals duráveis e regressões que falharam antes da correção das consultas
pré-envio. Todos os efeitos HTTP desta parcela usaram API falsa.

Conferidos 141 links relativos, sintaxe, compilação com Java existente, Prettier
direcionado e diff-check dos documentos afetados. O diff-check global conserva
somente o finding alheio em
`web/landing-page/src/shared/component/PlatformBadge.tsx:44`, linha vazia no EOF.
Maven/web/mobile/SDD não foram reexecutados nem tiveram evidências redatadas.

Fotografia do gateway intacta: 419 paths/bytes, SHA-256
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`.
Esse checksum não cobre Dockerfile, mobile, documentação, tooling privado ou
aprovação de segurança. Recibos anteriores e ledger de duas reservas íntegros;
sem novo slot, cópia de archive/JRE/RAW ou mudança de arquivos de performance.
O Mac mantém aproximadamente 23 GiB livres.

`verification.json`:
`18874b6b9ad7ecb6c19271d0ca27347d64fb6f420622bfc71704c56b78d7bdaa`.
Fechamento acrescentado após o recibo, com nova conferência direcionada de
formatação/diff; evidências anteriores preservadas sem sobrescrita.
