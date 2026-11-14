# Integração de recusa HTTP e retirada delimitada

Data: 2026-10-17. Continuação da
[fundação do journal v3](worker-isolation-rejected-create-2026-10-17.md).
020 continua `in-progress/open`; 021 bloqueada. Sem nova instalação, credencial,
consulta autenticada, upload, provider, reserva financeira ou recurso cloud.

## Mudança implementada

Tooling privado versionado em
`.local/worker-isolation/mount-rejected-cycle.r4MCRI/`. Adapter, ciclo, read ports,
retirada e handoff v3 usam o journal da fundação sem alterar seus fontes. Não há
migração de rodadas existentes, alteração no PostgreSQL, runtime Java do produto,
defaults, APIs públicas ou arquivos de performance.

O adapter exige contexto v3, hash do bundle e porta `rejectInsert`. Somente o
POST canônico que efetivamente recebe HTTP 403 pode oferecer a observação ao
journal, ligada ao requestId, URL, hash do corpo e janela UTC. Não persiste body,
credencial ou erro bruto. Não chama uma recusa de operação `DONE` nem presume
que todo 403 signifique falta de permissão; também pode representar quota.

GET 403, 429/5xx, timeout, cancelamento, resposta perdida e erro de persistência
não são promovidos a recusa confirmada. Nenhum desses caminhos reenvia POST.
Quando o commit da recusa ocorreu mas sua confirmação se perdeu, o ciclo pode
reler o registro durável: não repete a chamada nem fabrica um recibo remoto.

## Condições de retirada

Antes de excluir qualquer recurso anterior, a retirada valida a recusa contra
a intenção original, exige duas leituras 404 do recurso e consulta paginada
completa sem operação para aquele requestId. Recurso ou operação inesperados,
paginação incompleta e identidade divergente mantêm recuperação pendente.

Recusa não atribui posse. As condições anteriores de ID real, selo, resolução
de inserts, dependências ausentes, rota, escopo de rede e gerações GCS continuam
obrigatórias. Um recurso encontrado no lugar do recusado não é adotado ou
apagado por nome. Nenhum delete amplo ou nova tentativa cobrada foi adicionado.

Recusa do primeiro network admite retirada sem routePlan somente após ausência
de todos os recursos nomeados e escopo vazio. Não cria uma identidade de rede
ou rota para preencher essa ausência. Sinais de processamento e cleanup continuam
independentes; cleanup já cancelado não envia requisição destrutiva.

O handoff exige as capacidades v3 **antes** do claim durável da fonte. Ele
distingue `staging-cycle-failed-and-retired` de
`staging-cycle-observed-and-retired`. O primeiro comprova apenas retirada ativa
na fixture, não montagem ou isolamento. Mesmo após retirada, o claim continua
impedindo nova execução da rodada.

## Testes e evidência reproduzível

```bash
node .local/worker-isolation/mount-rejected-cycle.r4MCRI/verify.mjs
```

O verificador grava TAP e recibo exclusivos, sem sobrescrever os anteriores.
Os testes novos cobrem recusa nas oito posições de criação, confirmação perdida,
falha de persistência, recurso/operação conflitante, segunda leitura divergente,
paginação repetida, deadline real do transporte, cancelamento e ausência de retry.
Há caminho positivo e regressões de read ports, retirada e handoff executadas
contra os módulos **v3**, além dos testes anteriores contra suas próprias versões.

Na execução dirigida, uma asserção nova esperava `handoff=null`, mas o contrato
do staging omite esse atributo até o claim. A asserção foi corrigida para exigir
ausência da propriedade **e** igualdade integral do snapshot anterior/posterior;
o contrato de persistência não foi alterado para acomodar o teste.

`before-integration.tap` preserva o vermelho anterior: dois aceites falharam e o
controle positivo passou. O teste histórico
`mount-rejected-create.gTpvsO/reproduction.test.mjs` continua sendo uma reprodução
intencionalmente vermelha do **v2**, preservada e validada como baseline, não
incluída como teste de implementação v3. Os mesmos dois cenários são obrigatórios
em `integration.test.mjs`, agora acrescidos da verificação do registro separado.
Não excluir outro gate nem enfraquecer as condições de retirada para obter verde.

O recibo confere fontes/recibos pinados, fotografia dos 419 paths técnicos,
ledger, sintaxe, links relativos, formatação dirigida e diff do escopo. Explicita
a seleção e o hash da reprodução histórica, os arquivos da suíte e seus resultados.
Não redatar os recibos antigos de 741 ou 64 testes. A instabilidade anterior com
paralelismo padrão não é declarada resolvida por uma execução limitada a quatro
arquivos concorrentes.

## Limites e próxima etapa

As respostas Compute/GCS, credenciais e serial desta execução são falsas. Os
journals usam store/helper Java reais; os testes de handoff leem o arquivo de
runtime já pinado, sem baixá-lo ou copiá-lo para outro archive. Não há boot COS,
exclusão de recursos reais ou validação de seleção de geração pelo importador.

Casos ambíguos continuam pedindo recuperação explícita. Não alegar que esta
correção resolve toda falha antes do envio, falha de operação com recurso parcial,
crash do processo ou confirmação cloud perdida. Não liberar uma nova tentativa
baseando-se apenas em 404 ou no término do prazo da VM.

O próximo trabalho é revisar o caminho de admissão real usando a versão nova,
o envelope financeiro e a retirada efetiva. O término automático de 600 s já
existia, mas não expira custom image, data disk e staging. Permanecem abertas a
[revisão de segurança COS](worker-isolation-vm-security-2026-10-13.md), a
[revisão de admissão](worker-isolation-admission-review-2026-10-17.md) e a
[validação cloud do renderer](rendering-cloud-validation.md). O teto autorizado
é US$ 5 **total**, sem nova reserva nesta etapa.

Maven, web, mobile e SDD não são reexecutados/redatados por esta mudança somente
no harness privado. O diff global alheio é reportado separadamente. Aprovação
operacional, worker completo e conclusão da 020 continuam fora desta evidência.
