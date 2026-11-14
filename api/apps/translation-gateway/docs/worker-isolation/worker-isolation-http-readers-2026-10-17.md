# Leitores HTTP ligados ao ciclo mínimo — 2026-10-17

## Resultado e escopo

Continuação do [ensaio integrado](worker-isolation-cycle-2026-10-16.md).
Ligadas as portas de aquisição do contexto de rota e captura ao transporte HTTP,
reaproveitando o reader de configuração/serial anterior. Os testes usam servidor
falso, metadados sintéticos e journals reais de arquivo; não buscaram ADC nem
consultaram recursos Google. A pesquisa pública de contratos REST não foi uma
consulta autenticada ao projeto.

Tooling ignorado: `.local/worker-isolation/mount-http-readers.zqZtUf/`.
Não instala dependências, cria/remove recursos cloud, envia mídia, executa
providers, COS, montagem ou renderer. Runtime, migrations, defaults e arquivos
de performance não mudaram. 020 segue `in-progress/open`; 021 bloqueada.

## Ligação entregue

`createCycleReadPorts` é lazy, sem SDK/ADC/fetch implícitos. Expõe preparação da
rota, leitura de captura, verificação de escopo e close; não aceita URL livre nem
oferece mutador público. A configuração é copiada antes de awaits.

Na preparação, exige bundle/hash/run e network ID terminal correspondentes ao
journal. Faz GET da rede própria, lista rotas, routers agregados e packet
mirroring; rejeita escopo parcial ou desconhecido. Reconsulta a rede e o journal
antes/depois de abrir o journal de rota pela porta explícita. Nenhum ID futuro
é inventado para construir o plano.

Na captura, deriva as identidades pelo `bindingFromJournal` anterior, instancia
`createReader` com esse binding e mantém o mesmo vínculo nas leituras seguintes.
Snapshots e serial vêm por GET, não pela entrega direta de objetos por callbacks
da fixture. O reader anterior continua validando recursos, firewall efetivo da
instância, canal/cursor serial e snapshots; seus fontes e recibos não mudaram.

`runHttpMountCycle` conecta essas portas ao coordenador anterior e fecha os
clientes que cria, inclusive no erro/cancelamento. Não liga o gateway ou worker
cloud. A fonte Storage já existe na fixture; uploader real e admissão operacional
não foram entregues aqui. Sem `admit`, nenhuma credencial/query é iniciada.

## Escopo global antes da VM e dos deletes

Uma regressão vermelha mostrou que a consulta regional anterior não detectava
router de outra região introduzido depois do bootstrap. A checagem agregada foi
ligada à admissão da VM; outro teste mostrou a necessidade de repeti-la na
fronteira HTTP, depois das consultas anteriores ao envio.

A nova entrada exige escopo completo imediatamente antes do POST da VM e dos
DELETEs de rota/rede. Não fabrica respostas REST para os adapters antigos: faz
consultas adicionais pelo transporte original e só então permite encaminhar o
request já vinculado ao journal. Se houver incerteza, não envia a mutação.

- Routers são consultados por aggregatedList, com `includeAllScopes=true` e
  `returnPartialSuccess=false`; `unreachables`, páginas incompletas ou cíclicas
  impedem confirmação. Ver [contrato oficial](https://docs.cloud.google.com/compute/docs/reference/rest/v1/routers/aggregatedList).
- Packet mirroring associado à rede própria impede avanço. Referências de rede
  relativas, com userinfo ou ambíguas são rejeitadas antes de filtrar elementos
  como estrangeiros. Não interpreta referência desconhecida como ausência.
- Antes da VM, consulta também
  [networks.getEffectiveFirewalls](https://docs.cloud.google.com/compute/docs/reference/rest/v1/networks/getEffectiveFirewalls):
  exige as duas regras próprias, IDs/configuração canônicos e nenhuma policy
  adicional. Leitura negada ou resposta não reconhecida impede criar a VM;
  não habilita API nem amplia IAM para contornar o erro.
- Antes de remover a rede, exige ausência de rotas/routers próprios e recusa
  peering, subnetworks remanescentes ou associação de firewall desconhecida.
  Não remove essas dependências alheias para conseguir concluir a limpeza.

Captura mantém as verificações de
[instances.getEffectiveFirewalls](https://docs.cloud.google.com/compute/docs/reference/rest/v1/instances/getEffectiveFirewalls),
além das verificações agregadas ao redor das leituras. O fato de esses contratos
existirem não prova permissões, forma de resposta ou isolamento no ambiente real.

Os helpers históricos continuam preservados, mas o futuro executor não deve
usar a composição anterior para contornar as novas barreiras. Para esta etapa,
a entrada integrada é `runHttpMountCycle`; ela continua exigindo admissão externa.

## Expiração, cancelamento e limites

A admissão da VM é revalidada depois das consultas e imediatamente antes de
encaminhar o POST. Teste vermelho reproduziu decisão que expirava durante o
último guard; corrigidos o pin da expiração e a conferência final de relógio,
sinal e intenção/handle do journal. Cleanup continua permitido depois da janela
de criação, com seu sinal independente e identidades fixadas.

Resposta perdida ou guard que falha depois do claim não autoriza outro envio.
A intenção fica preservada, e `requiresRecovery` não equivale a ausência de
recursos. O mesmo vale se uma mutação for bloqueada na fronteira HTTP depois
de registrar sua intenção: recuperação explícita pode continuar necessária.

Preparação/guards têm prazo de dez segundos e resposta de até 256 KiB. O reader
anterior mantém seu limite de 1 MiB e demais verificações próprias. Listagens
limitadas a oito páginas e 4.096 itens; sem retry HTTP ou fila ilimitada.
Na preparação/guards, cancelamento não libera capacidade enquanto a operação
injetada ainda estiver pendente. Close impede GET tardio após resolver a credencial.
Isso não é atestação de cancelamento físico de socket, nem isolamento nativo.

Erros continuam sanitizados. Credenciais e texto serial não entram no relatório
do ciclo, somente hash/contagem de captura. Leituras e efeitos Google não são
atomicamente transacionados com o journal; controle exclusivo da rodada e
validação operacional permanecem obrigatórios.

## Ensaio e testes

```bash
node --test .local/worker-isolation/mount-http-readers.zqZtUf/readers.test.mjs
node .local/worker-isolation/mount-http-readers.zqZtUf/rehearse.mjs
```

O segundo comando é exclusivamente simulado e recusa sobrescrever
`http-rehearsal.json`. Observado: oito POSTs e onze DELETEs falsos, rota retirada
e policy consultada antes da VM, uma leitura serial, duas leituras de firewall
da instância, onze da rede e dezesseis listagens agregadas de routers. Zero
recursos/origem ativos ao final da simulação. Não são chamadas/custos Google.

Os testes foram escritos antes do módulo. Regressões red/green cobrem escopo
cross-region, mudança após admissão, referências/páginas ambíguas, capacidade
após abort, expiração no envio, policy antes do boot e dependências estrangeiras.
O helper Java anterior é compilado no temporário próprio, removido ao final,
sem instalação ou cópia de archive, RAW ou JRE. O `1..0` do comando de ensaio não
é contado como suíte; o verificador executa os testes separadamente.

| Artefato privado      | SHA-256                                                            |
| --------------------- | ------------------------------------------------------------------ |
| `readers.mjs`         | `fdc4e2468592006874e4d2f58529a7512200394fd866d1da0406b18cdc76349c` |
| `http-rehearsal.json` | `b74b923c0aebcae8166920e99c8fc711bb07693bac1f397f1cdedabfc9e23439` |

## Ressalvas de execução local

Uma rodada focalizada teve 23/24 casos aprovados. No caso de leitura de policy
negada, a limpeza ficou `creation-unsettled`; a reprodução também retornou
`creation-blocked/creation-unsettled`. Não se apagou a origem para forçar sucesso.
A mensagem do teste passou a preservar códigos e estados locais sanitizados,
além de exigir que o cenário tenha realmente alcançado a leitura pretendida.

Os registros de energia do macOS mostram períodos de suspensão de 900 segundos.
O caso isolado passou na reexecução com `caffeinate` limitado ao comando; o ensaio
completo também passou. Não há prova suficiente para atribuir toda falha à
suspensão ou considerar resolvida a intermitência anterior. Foram usados somente
flags temporários de manutenção do comando ativo, sem instalar ferramentas ou
alterar configurações permanentes de energia/display.

O fechamento em 17/10 passou nos 614 testes conjuntos, sem falhas, cancelamentos
ou casos ignorados. Preservado TAP integral; nenhum limite, caso ou verificador
foi removido para obter verde. A fotografia dos 419 fontes do gateway, os
recibos anteriores e as duas reservas financeiras permaneceram inalterados.
Foram conferidos 151 links relativos, sintaxe, formatação dirigida e diff dos
documentos desta parcela. Maven/web/mobile/SDD não foram reexecutados nem
redatados por esta mudança de tooling privado. O diff global continua com um
finding alheio em `web/landing-page/src/shared/component/PlatformBadge.tsx:44`
(linha vazia no fim); o arquivo não foi modificado.

Recibo privado `verification.json`:
`8549b513b3c2bb51fc0a0c0b8c85a4334049072d204a91a902d5a08e7d664af0`.
TAP `tests.tap`:
`e76b113c1a395d0fe78b625b3edf4ab277b7d4c0e2d8c9e140aba1793b7d3627`.
Esse resultado posterior não elimina os diagnósticos/intermitências anteriores.

## Próximo gate

O [pré-flight posterior de leitura](worker-isolation-read-preflight-2026-10-17.md)
renovou identidade/projeto/SO/APIs e consultou o subconjunto IAM de observação.
Ainda faltam as respostas dos recursos futuros e IAM de criação/retirada;
concluir revisão COS, cotação completa, reserva e autorização final antes de
qualquer criação cloud. `operationalApproved=false` e `sourceGenerationSelectionVerified=false`
continuam explícitos. Não há nova reserva no teto total autorizado de US$ 5,
nem confirmação de fatura ou teto imposto ao provedor. Worker completo, qualidade
e revisão humana não são substituídos por este ensaio mínimo.
