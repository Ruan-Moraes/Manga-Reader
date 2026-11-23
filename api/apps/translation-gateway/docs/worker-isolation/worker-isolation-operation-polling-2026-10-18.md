# Correção do acompanhamento Compute — 2026-10-18

Fotografia da verificação local encerrada às 18:31 UTC. A
[segunda tentativa nativa e sua retirada](worker-isolation-second-native-attempt-2026-10-18.md)
registram a execução posterior e os novos findings, sem substituir este recibo.

Continuação da [primeira tentativa nativa e recuperação](worker-isolation-native-attempt-2026-10-18.md).
A 020 permanece `in-progress/open`, a 021 bloqueada. Esta parcela corrige o
executor privado da prova restrita de montagem; não altera o worker de produção.

## Correção implementada

O grafo revisado está em `.local/worker-isolation/mount-poll.6ENFmK/`.
As versões anteriores, os recibos cloud e a reprodução vermelha permanecem
intactos. O novo operador usa a revisão até os caminhos reais de rota e retirada,
não apenas uma implementação falsa do mecanismo de espera.

Depois do DELETE único, a resposta `PENDING/RUNNING` é observada no journal
existente e acompanhada somente por GET. A operação deve conservar id, nome,
selfLink, targetLink, clientOperationId e operationType. Um targetId conhecido
não pode mudar ou desaparecer. `RUNNING` não pode regredir para `PENDING`.
Retorno terminal com erro não aprova retirada; ausência do recurso não
substitui a confirmação da operação.

Cada espera tem limite de 120 segundos e 120 GETs, com intervalo de um segundo,
subordinada aos prazos e contadores da admissão e do transporte. Cancelamento,
relógio regressivo, vínculo alterado, erro HTTP ou prazo esgotado falham fechados.
Não há repetição de transporte após erro nem novo POST/DELETE nessa espera.
Os awaits iniciados são acompanhados; não se declara capacidade livre
simplesmente porque um timeout local venceu uma operação ainda pendente.

Não foi criado banco, formato de journal, status, índice ou migration.
As revisões intermediárias preservam os contratos e apenas religam imports e
propagam clock/pause; os estados e claims CAS existentes continuam sendo usados.
Uma rodada futura exige novo ID/reserva e a recuperação anterior íntegra,
sem reaproveitar a tentativa interrompida.

## Verificação local

Passaram os 20 testes unitários de sequência, identidade, prazo, cancelamento,
imutabilidade e erro sanitizado. As duas mesmas regressões que falham na versão
congelada anterior passaram na nova revisão. O histórico vermelho não foi
apagado ou reinterpretado como aprovação.

A primeira consolidação terminou em **182/183**, com confirmação inconclusiva
no cenário de rota `PENDING`. O mesmo arquivo completo passou **10/10** em outra
execução. O TAP de falha foi preservado; carga paralela é hipótese, não causa
comprovada. A repetição está em execução com arquivos serializados, mantendo
cenários concorrentes internos, assertions e todos os prazos do runtime.
Somente o prazo do processo de teste local passa de dez para quinze minutos.
Às **18:31:32 UTC**, a repetição serial passou **183/183**, zero falhas,
cancelamentos ou skips, em 13 arquivos e aproximadamente 293 segundos.
Essa aprovação não determina a causa da falha paralela anterior; ambos os
registros continuam preservados. O recibo confere 18 fontes/documentos locais,
sete recibos prévios e o snapshot técnico inalterado de 419 caminhos.

Comando executado na raiz: `node .local/worker-isolation/mount-poll.6ENFmK/check.mjs`.
O recibo é exclusivo; não sobrescrever ou reexecutar esse comando para renovar
evidência congelada. Uma nova revisão exige outro registro.

| Evidência privada           | SHA-256                                                            |
| --------------------------- | ------------------------------------------------------------------ |
| `offline-verification.json` | `6c7423d3c589cacd2a8a35e72a0d3c0bde32f613cf3560297f27c90b09eb3f74` |
| TAP serial aprovado         | `39224c6e2b05c427614793c9bfa345709d1de892722f7e58524a11e94220680a` |
| TAP paralelo com uma falha  | `2bdb9bf163bbe4d91d665212dcecf0798dfc1cf95ee3f79dea2bfc09f01d461a` |

As integrações usam identidade/HTTP Google sintéticos e journals CAS reais
locais. Não representam observação nova no Google Cloud.

## Limites e próximos gates

Nenhuma credencial real, reserva nova, chamada paga, criação cloud, instalação
ou download foi feito nesta parcela. A reserva anterior de USD 5 permanece
registrada, sem refund automático e sem conciliação de fatura. A autorização
financeira continua [USD 100 totais](worker-isolation-budget100-2026-10-18.md),
não um hard cap aplicado pelo provider.

O fix não comprova montagem nativa, segurança do COS/Docker ou aptidão do
worker completo. Permanecem pendentes nova prova restrita e, separadamente,
isolamento/recursos/qualidade e operação integral do renderer. Não houve mídia,
OCR, tradução, deploy, mudança mobile, legal ou dos defaults desabilitados.

Maven, web, mobile e SDD não foram reexecutados nesta parcela exclusivamente
de tooling. `git diff --check` global ainda aponta o branco final alheio em
`web/landing-page/src/shared/component/PlatformBadge.tsx:44`; não foi corrigido
automaticamente. Diff dos arquivos rastreados desta parcela e Prettier direcionado
passaram. Foram conferidos 194 links relativos sem destino ausente, sem verificar
anchors nem acessar URLs externas. O novo tooling ocupa aproximadamente 204 KiB;
nenhum arquivo de auditoria de performance foi alterado.
