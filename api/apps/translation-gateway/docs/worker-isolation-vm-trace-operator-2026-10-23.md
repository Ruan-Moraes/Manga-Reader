# Operador VM com trace e recusa de capacidade — 2026-10-23 UTC

Continuação do [diagnóstico passivo da fronteira VM](worker-isolation-vm-boundary-trace-2026-10-23.md).
**A criação foi enviada uma vez; a operação terminou com
`ZONE_RESOURCE_POOL_EXHAUSTED`. Não houve prova de boot ou montagem. Todos os
recursos ativos da rodada foram retirados e a ausência foi auditada.**
A 020 permanece `in-progress/open`; a 021 permanece `approved/blocked`.

## Preparação e seleção

Operador separado: `.local/worker-isolation/mount-vm-trace-operator.0OrDtk/`.
Seleciona explicitamente o runtime de 53 módulos do diagnóstico passivo; nenhum
operador encerrado foi reativado ou modificado. O modo de produção permanece
desabilitado. Não houve instalação, download, OCR, tradução ou envio de amostra.

A captura sanitizada é um sidecar escrito após a quiescência, antes do relatório
principal. Sua ausência ou falha de gravação é explícita e não concede autoridade
de envio, `NOT_SENT`, posse ou retirada. O recibo nativo vincula o hash dos bytes
efetivamente salvos; a integridade do trace não transforma a rodada em sucesso.

O guard da oitava retirada confere captura, locks preservados, sete operações
terminais de exclusão e auditoria histórica. Aos 64 alvos anteriores acrescenta
11 alvos exatos. As leituras da oitava rodada sobrepõem o ramo anterior, no máximo
dois ramos somente GET, sem retry, cache ou ampliação de validade. Erro aguarda
os irmãos já iniciados. Antes da reserva foram observadas 75 ausências frescas,
além dos cinco metadados e duas consultas de quota.

| Gate offline separado                | Resultado | Alcance e limite                                             |
| ------------------------------------ | --------: | ------------------------------------------------------------ |
| Coordenador e guards do operador     |   142/142 | CAS/admissão reais, transportes/identidade/preços sintéticos |
| Launcher e retirada inicial          |       3/3 | Seleção e integridade, sem cloud                             |
| Leitor do erro da operação encerrada |     17/17 | Identidade, limites, sanitização e ausência de retry         |
| Pré-flight candidato na zona B       |     63/63 | Predicados preservados; recusa explícita do eco da zona A    |

Os relógios das fixtures copiadas foram atualizados **somente como dados
sintéticos** para suceder a oitava retirada. Capturas reais, preços e conclusões
anteriores não foram redatados. Não somar os gates como casos independentes de
produto: há regressões reaproveitadas em mais de um pacote.

## Faturamento e autorização

Dentro da autorização existente de até USD 100, consultou-se o vínculo de billing
e a moeda (dois GETs), depois os sete SKUs em BRL/USD (14 GETs). Nenhum vínculo,
API, IAM, credencial ou recurso foi alterado nessa preparação financeira.
Identidade existente e SDK foram conferidos; tokens ficaram somente em memória.

Cotação observada em **18:43:08.116–18:43:26.516 UTC**, válida até
**19:43:08.116 UTC**. Estimativa conservadora: **USD 2,11**, com hipóteses e
conversão registradas; não é fatura, valor garantido ou teto do provedor.
A preparação local e a auditoria anterior à execução conferiram preços, fontes,
gates, retirada anterior e ausência de lock no contexto novo.

A nona reserva de **USD 5** foi registrada em **18:48:20.810 UTC**. O ledger ficou
com **nove reservas / USD 45 reservados**, não gastos comprovados. Mantém USD 5
de provisão anterior e USD 10 de contingência; restam USD 40 em slots normais.
Não houve estorno por falha de alocação. `billVerified=false` e
`providerHardCap=false` continuam explícitos.

## Resultado real e retirada

Rodada: `mount-check-20261023-5c2d0240`. Executada uma vez pelo launcher selecionado;
o processo terminou com exit 2. Observação do transporte entre **18:48:21.737 e
18:54:12.881 UTC**:

| Método/status | Quantidade | Interpretação                                   |
| ------------- | ---------: | ----------------------------------------------- |
| GET 200       |        322 | Leituras/observações; não aprovação de boot     |
| GET 404       |        156 | Inclui ausências repetidas do escopo            |
| POST 200      |         10 | Staging, sete recursos Compute e uma criação VM |
| DELETE 200    |          8 | Sete recursos Compute e rota temporária         |
| DELETE 204    |          2 | Objeto e bucket temporários                     |

São **498 requisições do transporte do runtime**, sem falha de transporte nessa
captura. Não incluem as consultas preparatórias de finanças/metadados/quota/
ausência nem as leituras diagnósticas posteriores. HTTP 200 da criação representa
uma operação aceita, não uma VM pronta: seu terminal foi `DONE` com erro.

O trace contém 20 eventos, sem overflow. Escopo final, journal, janela, política
e admissão concluíram; o delegado bruto da VM foi invocado uma vez e respondeu.
A verificação final de escopo consumiu aproximadamente 1.463 ms; a invocação
do delegado veio depois dela. Isso demonstra o novo caminho, não reconstrói
retroativamente a causa exclusiva da oitava rodada.

O supervisor concluiu `supervisor-failed-and-retired`, com quiescência,
`activeAbsenceConfirmed=true` e `requiresRecovery=false`. A auditoria posterior:

- vinculou sete exclusões `DONE`, sem erro, às identidades das respectivas criações;
- comprovou uma criação VM por request ID, terminal com erro e última leitura 404;
- conferiu 11 ausências finais por alvo exato: VM, sete recursos Compute, rota,
  objeto e bucket;
- conferiu exclusão GCS por geração/metageração e ausência do lock desta rodada;
- recalculou 817 linhas de fontes, 321 fontes distintos dos gates, os 419 fontes
  técnicos do gateway e o SDK; todos corresponderam;
- preservou contextos, grants, locks históricos e arquivos de performance.

Ausência ativa não é destruição física: o soft delete de sete dias pode reter
bytes recuperáveis/faturáveis. A reserva não foi retirada do ledger. Não houve
nova criação, credencial ou mutação durante a auditoria local.

## Diagnóstico confirmado e alternativa preparada

Depois da retirada, um GET exclusivo consultou **a mesma operação**, conferindo
ID, request ID, alvo e terminal. Registrou apenas código de allowlist e hashes;
mensagem, corpo bruto, URL e token não foram salvos. Código confirmado:
**`ZONE_RESOURCE_POOL_EXHAUSTED`**, sem código desconhecido.

Segundo a [documentação oficial sobre disponibilidade](https://docs.cloud.google.com/compute/docs/troubleshooting/troubleshooting-resource-availability),
esse erro indica indisponibilidade de recursos e é distinto da quota. É possível
considerar outra zona, configuração ou momento; quota disponível não reserva
capacidade. A evidência desta rodada não indica qual componente físico faltou
nem autoriza reduzir os controles de segurança.

Foi preparado separadamente o leitor de `southamerica-east1-b`, mantendo a região
de São Paulo, COS7608 exato, máquina `custom-1-1024`, CPU não compartilhada e
plataforma mínima. Os cinco GETs entre **19:01:09.691 e 19:01:12.543 UTC** passaram:
projeto ativo, metadata herdada vazia, imagem não depreciada, tipo de máquina e
zona `UP` com a plataforma mínima declarada. **Isso não garante capacidade.**
O leitor é candidato: `selectedForCloud=false`, sem criação, reserva ou upload.
Nenhum operador foi apontado para a zona B nesta entrega.

## Gates globais e rastreabilidade

Gates globais executados antes da prova, em 23/10 UTC, sem instalar dependências:

- Maven global offline, com Docker e toolchain existente: exit 0; todos os sete
  módulos passaram. Gateway: 1.297 testes, zero falhas/erros, 104 skips opt-in.
  Os skips não aprovam execução nativa ou cloud.
- Web `tsc -b`: exit 0.
- Mobile `pnpm check` integral: exit 0, incluindo SDD, tipos, FSD e formatação;
  116 suítes / 892 testes Jest passaram.

Estes resultados não aprovam montagem, orçamento de memória, isolamento,
qualidade ou retenção do worker completo. Após a prova, os logs foram revalidados
por hash, sem alegar uma segunda execução global. Nenhum fonte Java ou mobile,
migration, contrato público ou default foi alterado neste incremento.

| Artefato privado               | SHA-256                                                            |
| ------------------------------ | ------------------------------------------------------------------ |
| Gate do operador               | `d01bb2412f45bee1b2578c68d47b82d5fc84b2f56e455e65318fba7c8ab18128` |
| Gate do launcher               | `e11f4c130d129685322a3bec6ad9982b4016831a791674b1ba58ca3419dc5789` |
| Resultado da rodada            | `082b3cae883c35a1c3a78a0f3db1dde1128079b25cc8134449fbf9e1b49b4723` |
| Trace sanitizado               | `e87c304d591b5d2fe363bffd511207f650bcfd22a11e5261e08313384ece9252` |
| Captura do transporte          | `8f9a6491269689d281964bfca6fec226889ca8c8fb0c13a657ffd0c07ba2d44c` |
| Auditoria pós-retirada         | `a0a53fc75091bbdbf8a5b3452d526a3b3344aeb4c0c4dfbfb04befc3544be2b1` |
| Consulta do erro terminal      | `7e2738909ca075cd2789d3c7c076d9de6a7b1f9748956e908b391f2ad69c33dc` |
| Gate global                    | `7f6efebff138f31ad4e1737b49a7e45cfed98136d86fbf4dead0b726a1fb87ec` |
| Gate do leitor candidato B     | `74a79a9584e8a2b2a39e1d84be744c829cd9246391782f7a949cd5867360191b` |
| Metadados reais da candidata B | `f46a85c35ddba0eed9534bc068781fd79e139ebb970c650ce54a30f13729ea7a` |

Leitor/auditoria privados: `.local/worker-isolation/mount-vm-operation-audit.dOdOHw/`.
Candidata de pré-flight: `.local/worker-isolation/mount-zoneb-read.brbc68/`.
Recibos e capturas têm escrita exclusiva; não repetir executores nos contextos
encerrados ou sobrescrever relatórios. O checksum técnico do gateway segue
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`.
O checksum mobile não é evidência de cobertura dos fontes Java.

## Próximo trabalho

Preparar grafo e operador próprios com zona B consistente em plano, requests,
journals, scope, finanças e cleanup. Revalidar a ausência dos nove contextos,
preços/admissões frescos e gates completos antes de outra criação delimitada.
Não substituir zona apenas no comando, reutilizar esta rodada ou afrouxar pins,
grants, prazos e recibos. Nenhuma repetição automática por falta de capacidade.

Continuam pendentes: montagem íntegra; boot/segurança; orçamento total de memória;
fault injection e recuperação; integração privada do worker, qualidade final e
retenção operacional. Não habilitar uploads, providers ou a 021 por estes gates.

## Continuação posterior

O [grafo separado da zona B](worker-isolation-zoneb-graph-2026-10-23.md) foi
posteriormente implementado e testado offline. Seus contratos de plano/journal,
requests e coordenador preservam a segurança; integração em operador com a nona
retirada e execução real continuam separadas. A fotografia desta rodada A não
foi promovida a prova de boot nem reexecutada.
