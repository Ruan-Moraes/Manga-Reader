# Retirada integrada de rota, Compute e origem — 2026-10-15

## Resultado e escopo

Continuação do [transporte de criação](worker-isolation-create-http-2026-10-15.md).
Implementada entrada privada de encerramento que sela a criação, reconcilia
operações, retira recursos em ordem de dependência e inclui a rota antes da rede.
Somente depois permite retirar o objeto e o bucket próprios da rodada.

Tooling ignorado: `.local/worker-isolation/mount-teardown.R0TYIr/`. Toda a
validação desta parcela usa API falsa, IDs sintéticos e journals reais locais.
Não consulta projeto Google, usa credencial real, cria/remove recurso cloud,
instala dependência, reserva orçamento ou executa COS/worker. Performance mobile,
runtime, migrations e defaults não são alterados. 020 segue `in-progress/open`;
021 permanece bloqueada.

## Entrada e fronteira operacional

`retireHttpMountRound(bundle, routePlan, dependencies)` reconstrói o bundle e
vincula os journals Compute, rota e storage aos hashes canônicos. Exige sinal de
cancelamento, autorização explícita da rodada e portas de credencial/fetch sem
fallback. Valida a configuração antes de selar o journal ou consultar a API.

O plano de rota deve usar identidade observada da rede, nunca um ID inventado.
`routePlan=null` é admitido somente quando a criação da rede nunca foi tentada;
mesmo assim, exige nomes Compute ausentes e escopo de rotas/routers vazio. Uma
criação parcial da rede requer seu plano e journal reais para continuar.

Esta entrada substitui o encadeamento antigo de recuperação para o futuro
executor da rodada. Os helpers históricos continuam preservados por hash, mas
não são entradas operacionais aprovadas. A cadeia completa de provisionamento,
observação e encerramento ainda precisa ser ligada ao executor/admissão real.
Não existe CLI que adquira credenciais ou execute esta preparação sozinha.

O teste com oito recursos e rota ainda presente é uma injeção de falha para
teardown, não evidência de uma criação permitida: a barreira de criação anterior
continua proibindo VM antes da confirmação da rota. O encerramento só retira a
rota depois de confirmar ausência de todos os outros recursos Compute.

## Sequência e confirmações

1. Sela o journal Compute antes de qualquer consulta autenticada, impedindo
   novos inserts. Resolve todas as tentativas de criação por handle ou UUID;
   criação ambígua/pending impede qualquer DELETE.
2. Retira VM, data disk, boot disk, imagem, sub-rede e firewalls. Confere ID,
   ownership e ausência dos recursos dependentes; disco com users não é removido.
3. Reconcilia o journal da rota, operação e ausência. Quando necessário, retira
   somente a default route previamente vinculada ao ID da rede; routers, rotas
   desconhecidas, identidade alterada e listagem incompleta interrompem.
4. Somente após rota ausente e escopo vazio retira a rede. Repete as verificações
   depois do claim e antes de encaminhar o DELETE.
5. Confere novamente os oito nomes, operações assentadas e rota/routers ausentes.
   Reutiliza a retirada Storage condicional já testada: geração/metageração
   próprias, ausência de versões/objetos alheios e bucket correspondente.
6. Repete a conferência final. O resultado não representa ausência física de
   conteúdo soft-deleted, nem aprovação operacional.

Ao contrário da criação, o encerramento não expira junto com sua janela de
quinze minutos: uma rodada interrompida deve poder ser investigada e retirada
depois, sem liberar novas criações. Os pins de identidade e journals continuam
obrigatórios; ausência de operação pode exigir recuperação manual.

## Operação perdida não é recurso ausente

Reproduzido um atalho no `recoverPartial` histórico: quando o recurso já retornava
404, uma intenção DELETE podia ficar sem operação resolvida e ainda assim gerar
confirmação de ausência Compute. O novo teste mantém esse controle histórico
explícito e demonstra que a entrada integrada recusa a mesma liberação.

A nova sequência resolve uma intenção DELETE **antes de aceitar o 404**. Exige
uma única operação compatível, DONE e sem erro, além da ausência do recurso.
Operação faltante, duplicada, RUNNING, com targetId incorreto ou terminal com erro
não libera rede/origem. Também não reinicia DELETE quando falta confirmação.

Cada recurso Compute recebe no máximo o envio concedido pelo claim durável;
outra instância/reabertura encontra a intenção existente e apenas reconcilia.
Falha entre claim e envio preserva a intenção, não autoriza nova tentativa.
Resposta HTTP perdida ou ACK local perdido é recuperado pelo UUID/handle,
inclusive quando o recurso já desapareceu.

Na rota, claim e marcação durável de envio continuam separados. Claim ainda não
enviado pode ser concluído com seu mesmo UUID se a identidade continuar válida;
`spend` atômico permite somente um DELETE. Uma vez enviado, só há reconciliação.
Recibo confirmado cuja rota reaparece não autoriza apagar novamente.

O protocolo REST de [routes.delete](https://docs.cloud.google.com/compute/docs/reference/rest/v1/routes/delete)
usa nome e requestId, sem compare-and-delete por targetId. Releituras reduzem a
janela, mas não criam transação distribuída: controle exclusivo da rodada ainda
é necessário. Uma regressão vermelha encontrou troca da rede durante a consulta
final de escopo; corrigida a ordem para reler rede/rota depois dessa consulta e
antes do envio. Isso não elimina mudanças por outros operadores após o último GET.

## Retenção e limites

A origem não é removida enquanto Compute/rota estiverem incertos. Reaparecimento
de um recurso antes do DELETE Storage, geração alterada ou objeto alheio no bucket
interrompem a retirada; não existe purge abrangente. O encerramento nunca remove
imagens do catálogo OCR, arquivos de performance ou evidências locais.

`physicalDeletionVerified=false` é intencional. Na execução real futura, a política
de sete dias preserva objetos/buckets soft-deleted, com implicação de custo; um
404 comum não prova expurgo. Ver [soft delete do Cloud Storage](https://docs.cloud.google.com/storage/docs/soft-delete).

O transporte Compute aceita somente GET/DELETE em paths internos do projeto
fixado, sem body ou redirect. Respostas de até 256 KiB; listagens limitadas a oito
páginas/4.096 itens, sem aceitar omissão ambígua de items. Prazo de dez segundos
por método de transporte, abrangendo credencial e resposta. Não faz retry HTTP
ou polling ilimitado. Falha deixa estado para reconciliação por chamada posterior.

Cancelamento é propagado; callbacks tardios não podem encaminhar DELETE. Um
commit local já iniciado pode terminar depois do cancelamento, portanto retorno
negativo não prova journal vazio. Credencial fica apenas em memória, sem SDK/ADC
implícito. Erros brutos, user e mensagens do provider não entram nos recibos.

## Testes e rastreabilidade

```bash
node --test .local/worker-isolation/mount-teardown.R0TYIr/teardown.test.mjs
```

Testes escritos antes da implementação, com execução vermelha registrada. O
helper Java anterior é compilado com o JDK já instalado em diretório temporário
próprio, removido ao final. Sem cópia de archive, RAW, modelo ou JRE.

Cobertura: oito recursos e rodada parcial/vazia, rota já retirada, ordem,
concorrência, selagem, criação pendente, resposta/ACK perdidos, DELETE pendente
oculto por 404, erros/identidade/duplicatas, nomes substituídos, disco em uso,
escopo incompleto/cíclico, fonte alterada ou com itens alheios e cancelamento sem
envio tardio. Simulação não é evidência de remoção real no Google.

| Artefato privado | SHA-256                                                            |
| ---------------- | ------------------------------------------------------------------ |
| `teardown.mjs`   | `11a65bca00b06959e27ed609b63a52a1b7e383407e8bd6ac227d0dd223f6e8c4` |

O fechamento revalida a suíte conjunta, recibos/fontes anteriores, ledger, links,
sintaxe, formatação e diff direcionados. Gates Maven/web/mobile/SDD não são
redatados por esta parcela de tooling e documentação, sem mudança do aplicativo.

## Pendências para a rodada real

Ligar criação/observação/retirada à admissão operacional; concluir revisão COS
limitada à montagem, cotação completa e reserva do slot. O teto autorizado total
de US$ 5 permanece inalterado, sem nova reserva ou conferência de fatura; não é
um limite de cobrança imposto ao provedor. A validação de isolamento do worker
completo permanece aberta mesmo depois de uma futura prova de montagem.

## Fechamento observado — 2026-10-16

Duas execuções integrais consecutivas aprovadas: **570 testes em cada**, zero
falhas, cancelamentos ou skips; 25 cenários novos nesta parcela. Não se somam as
execuções como se fossem casos distintos. As chamadas HTTP foram todas falsas,
com journals reais de arquivo e helper Java anterior.

A primeira tentativa agregada terminou com erro, antes de gerar recibo. Seu
stdout foi abreviado pelo tratamento de exceção anterior, sem permitir localizar
o caso. O verificador passou a preservar TAP completo e diagnóstico em falhas;
a tentativa seguinte e a repetição passaram sem mudar limites, concorrência
default do Node ou conjunto de testes. A falha inicial **não foi diagnosticada**:
as duas aprovações não provam ausência de intermitência. Não atribuir causa a
CPU, Docker, código ou auditoria de performance sem evidência adicional.

Conferidos 147 links relativos, sintaxe, Prettier e diff direcionados. A repetição
também revalidou os 419 fontes anteriores e o ledger. A fotografia técnica do
gateway continua
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`;
não cobre Dockerfile, mobile, documentação, tooling privado ou aprovação do host.
Recibos históricos preservados; nenhuma nova reserva, credencial real,
instalação ou mutação cloud. Maven/web/mobile/SDD não foram reexecutados.

O diff global mantém o finding alheio em
`web/landing-page/src/shared/component/PlatformBadge.tsx:44`, linha vazia no EOF.
Esse arquivo e os arquivos de performance não foram alterados. Uma inspeção local
de processos após a primeira execução verde não encontrou testes remanescentes;
não houve necessidade de reiniciar ou encerrar processos de teste.

Recibos privados preservados sem sobrescrita:

- `verification.json`:
  `ce0b25ab27f570afc1c3097eb0e19f47e189711fa0bde79d2cc5b5e07131d06d`.
- `repeat-verification.json`:
  `da50d8ed5ac5486f56a49acd6511f30dafe0d29d81eeb9e524d8d656bdbdd66a`.
- `repeat.mjs`:
  `f2ba6d67b8278efa3bae773a79f81eda054164c2393a5284777e665a74069862`.

A parcela ocupa aproximadamente 296 KiB. O volume apresenta cerca de 20 GiB
livres no fechamento; não foi investigada nem atribuída a terceiros a variação
desde a medição anterior. Sem downloads ou cópias grandes nesta execução.
Este fechamento foi acrescentado após os recibos, com nova conferência de links,
formatação e diff; não promove 020 nem autoriza a rodada cloud.

Na conferência posterior, `git diff --check` direcionado terminou com código 0,
mas o ambiente emitiu avisos `xcodebuild` sobre FSEvents e diretório de cache.
Nenhuma instalação ou correção de Xcode/cache foi tentada por esta parcela.
