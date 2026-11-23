# Terceira prova nativa e retirada automática — 2026-10-19

Continuação da [ligação do executor v4](worker-isolation-v4-executor-2026-10-18.md),
sob os USD 100 totais já autorizados. A 020 continua `in-progress/open`,
a 021 bloqueada. **Não houve VM, JRE, renderer, OCR, tradução ou página real.**

## Resultado observado

Rodada `mount-check-20261019-6fdd5e88`, entre **16:15:52 e 16:21:56 UTC**
(13:15–13:21 de Brasília). O executor conferiu o recibo de 122 testes,
fontes financeiras vigentes, projeto/COS/máquina e ausência atual das 11
referências da rodada anterior antes de reservar 500 centavos USD.

| Etapa                          | Evidência                                                                        |
| ------------------------------ | -------------------------------------------------------------------------------- |
| Staging privado                | Upload único e readback do archive existente; nenhuma imagem de mangá.           |
| Rede, subrede e dois firewalls | Criações `DONE`, sem erro; rota padrão retirada.                                 |
| Imagem e disco de dados        | Criações `DONE`, sem erro. O bloqueio anterior de `Disk.users` foi ultrapassado. |
| Disco de boot                  | Criado, com operação `DONE`, sem erro.                                           |
| VM                             | Intenção local persistida, sem `insert.dispatch`, POST, handle ou terminal.      |
| Retirada                       | Concluída pelo próprio supervisor, sem recuperação externa ou mutação repetida.  |

O resultado terminal foi **`supervisor-failed-and-retired`**, exit 2,
com `mountProofObserved=false`, `activeAbsenceConfirmed=true` e
`requiresRecovery=false`. O resultado não é aprovação da prova de montagem.

O transporte principal registrou **9 POSTs, 454 GETs e 10 DELETEs**, sem
repetição de hashes de mutação. Todos os POSTs retornaram 200; foram oito
DELETEs Compute 200 (sete recursos e rota) e dois Storage 204. As 11 leituras
do escopo antigo e quatro de preflight são separadas desses contadores.

## Protocolo v4 exercitado em cloud

A fotografia final está selada em `mount-progressive-journal-cas-4`.
A intenção de VM não possui grant de envio, operação, resultado ou rejeição.
O cleanup conferiu ausência e lista de operações antes de retirar dependências;
não fabricou HTTP 403, operação `DONE` ou targetId para a VM.

As sete criações Compute possuem terminal sem erro, e suas sete exclusões
possuem terminal sem erro vinculado ao mesmo targetId. A rota possui seu
próprio recibo terminal. As últimas leituras das oito referências Compute,
rota, objeto e bucket confirmaram 404. Helpers/operações/IO pendentes chegaram
a zero; o lock **desta** rodada foi removido após essa confirmação. Locks e
intenções históricos anteriores permanecem preservados.

Os recursos Compute temporários e o staging **ativo** foram retirados.
Storage conserva a política de soft delete de sete dias: **exclusão física
não foi verificada**. O archive local reutilizável foi mantido.

## Finding ainda aberto

O bloqueio ocorreu na admissão final anterior ao envio da VM. A sequência
registra leituras bem-sucedidas de projeto, predecessores, COS e barreiras;
não há erro HTTP/transportFailure no log principal. Isso não identifica
sozinho qual validação ou deadline encerrou o fluxo.

Há gates aninhados de dez segundos e consultas sequenciais na implementação,
mas a hipótese de orçamento temporal/latência **ainda exige reprodução offline
instrumentada**. Não se deve aumentar timeout, pular validação de segurança ou
iniciar outra rodada paga apenas para tentar novamente. Os fontes e registros
desta execução permanecem selados para investigação.

Um observador separado, somente GET, tentou registrar a forma dos metadados
da VM. Sua primeira revisão foi recusada localmente por janela incompatível,
antes de qualquer GET. A revisão corrigida fez 40 GETs, todos 404, sem observar
VM. Nenhuma resposta bruta ou credencial foi salva. Essa ausência **não é**
evidência sobre campos `serviceAccounts` de uma VM existente e não autoriza
relaxar seus validadores. As leituras desse observador não integram o contador
do transporte principal.

## Verificação e orçamento

Uma auditoria local posterior conferiu 37 artefatos, recibos, terminais,
intenção não enviada, leituras finais, quiescência, locks e ledger. O scan
limitado dos JSONs de captura encontrou zero padrões de token/chave; não é
garantia universal de ausência de segredos. O snapshot técnico dos 419 caminhos
permaneceu inalterado; nenhuma credencial/rede adicional foi usada na auditoria.

| Artefato privado              | SHA-256                                                            |
| ----------------------------- | ------------------------------------------------------------------ |
| Resultado da rodada           | `44ab862eeae3f00f405d5101a0cb94cf8a64cea74affa26d04715b9d1741c427` |
| Auditoria `native-audit.json` | `1a4e8e2a78940b6c336d281e9b33264317dab9a84480ebd39ba7cc1ef1f0513b` |
| Observação inicial recusada   | `b11f6ddfcfb2bee374f956aadfe005e6ea4d4c74db6c0630f90c8a234ea408ac` |
| Observação GET sem VM         | `d842200f7741adcf2b21ccb8dbe61c3c3ddfb6da823d793f3244ebe3e5ef7056` |

Diretório privado: `.local/worker-isolation/mount-v4-execute.LbHOzG/`.
O recibo de testes cobre seus seis fontes/documentos declarados; os observadores
e a auditoria posterior têm hashes próprios e não são retroativamente cobertos
pelos 122 testes. Nenhum relatório anterior foi sobrescrito.

Existem agora **três reservas de USD 5**; a faixa normal ainda não reservada
é USD 70, além das provisões separadas. USD 15 reservado **não é** USD 15
faturado. A estimativa da rodada era USD 2,14, não fatura, refund ou hard cap
do Google. Não houve conciliação de cobrança nesta parcela.

Próximo: reproduzir e identificar o bloqueio pré-VM offline, com diagnósticos
sanitizados e sem nova chamada de provider. Montagem real, segurança/recursos do
worker completo e qualidade visual continuam abertos. Não houve instalação,
IAM, deploy, ativação de uploads, mudança legal ou alteração em performance.
Maven, web, mobile e SDD não foram reexecutados nesta revisão de tooling privado.

Formatação dos dois documentos novos e `git diff --check` direcionado passaram.
Foram conferidos 204 links relativos nos documentos correntes, sem destino
ausente; âncoras e URLs externas não foram verificadas. O diff global ainda
aponta uma linha vazia ao fim de `web/landing-page/src/shared/component/PlatformBadge.tsx:44`,
fora desta parcela e não corrigida automaticamente.

Parcela posterior: o [diagnóstico offline](worker-isolation-prevm-preflight-2026-10-19.md)
reproduziu a falha de orçamento pré-VM com latência sintética e preparou uma
revisão, sem alterar os fontes/recibos desta rodada ou iniciar outra tentativa.
