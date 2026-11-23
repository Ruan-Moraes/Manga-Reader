# Supervisor local da prova mínima

Data: 2026-10-17. Continuação da
[limpeza de fonte verificada](worker-isolation-verified-source-cleanup-2026-10-17.md).
020 permanece `in-progress/open`; 021 bloqueada. Sem instalação, credencial,
requisição cloud, upload real, provider, deploy ou reserva financeira nova.

## Composição implementada

Tooling privado em `.local/worker-isolation/mount-supervisor.RHYUXW/`.
`createMountSupervisor` compõe implementações existentes de produtor, handoff v3,
cleanup-only v2 e recovery parcial revisionado. Não injeta factories que finjam
sucesso de etapas. HTTP, clock, admissões, arquivo e abertura dos journals são
portas explícitas; não há SDK, ADC ou fetch globais/implícitos.

O plano `design.md`, anterior ao código, segue `database-design`: formatos dos
journals e chaves existentes preservados, exceção explícita de arquivos locais,
sem novo banco, tabela, migration, índice, cache ou contador persistido.

| Checkpoint efetivamente lido                             | Ação permitida                                           |
| -------------------------------------------------------- | -------------------------------------------------------- |
| Snapshot inicial não vazio                               | Recusar adoção/retomada; não criar ou limpar             |
| Parcial, produtor próprio quiescente                     | Recovery parcial com admissão própria                    |
| Verificado, sem handoff, processamento ativo             | Uma tentativa de handoff v3                              |
| Verificado, sem handoff após falha/cancelamento          | Cleanup-only v2 com claim exclusivo                      |
| Handoff confirmado e ciclo retirado                      | Registrar prova/falha conforme o resultado real do ciclo |
| Handoff existente ou ACK ambíguo sem retirada comprovada | Recuperação explícita; não repetir criação ou reupload   |

Uma retirada após recusa não é sucesso de montagem. O supervisor mantém
`operationalApproved=false` mesmo no caminho positivo da fixture; não aprova o
worker completo, kernel, codec, qualidade ou ambiente cloud.

## Posse não é somente quiescência

Dois testes reproduziram uma limitação da revisão anterior do owner: um cliente
perdedor encerrado, ou um claim com ACK perdido, passavam pela prova apenas de
quiescência. O vermelho normalizado está em `before-owner-claim.tap`.

`owner-v2.mjs` agora exige ACK **positivo** de `claim(bucket)` recebido pela
instância gerenciada real, além de referência de journal, plano e quiescência.
O registro é privado em WeakMap; facade copiada, PID ou booleano do chamador
não conferem posse. `recovery-v2.mjs` troca somente o assert de owner e preserva
o formato durável e demais proteções. A implementação anterior permanece como
histórico, não como autoridade operacional desta composição.

O teste concorrente força dois snapshots iniciais e dois snapshots de produtor
realmente vazios antes do claim. Somente o vencedor cria o bucket; o perdedor
não limpa o escopo ativo. Há journals CAS/locks reais nos testes de integração.

## Autoridade e vida útil

A admissão raiz é negada por padrão, vinculada ao plano/janela, e não substitui
os gates dos componentes. Antes da criação, o supervisor valida a configuração
das duas saídas de cleanup, a janela de recuperação e o contrato puro da prova.
Um teste reproduziu criação indevida com cleanup incompleto; a configuração
agora falha antes de qualquer porta HTTP.

A expiração raiz é revalidada em cada POST, mesmo quando um componente tenha
prazo maior. Um timer também encerra processamento no prazo admitido. GETs e
DELETEs de cleanup continuam sujeitos à autoridade própria; expiração não
autoriza nova criação. Os testes incluem expiração entre pré-flight e POST.

Processamento e cleanup têm sinais separados. Toda observação é limitada; timeout
não prova que a operação privada acabou. O supervisor retém `busy/settled` nas
promessas dos helpers, portas, request iterators e vida útil dos response bodies.
O fechamento impede nova aquisição/leitura de request iterator. Dois vermelhos
correspondentes foram preservados em `before-scope-close.tap`.

Se não houver quiescência, o resultado pede recuperação e a capacidade continua
retida até settlement real. Nenhuma etapa nova de limpeza é iniciada depois do
retorno; um helper já iniciado pode finalizar seu próprio cleanup autorizado.
Fechar o processamento não amplia a autorização de cleanup nem repete provider.

## Verificação e uso

```bash
node .local/worker-isolation/mount-supervisor.RHYUXW/verify.mjs
```

O verificador grava TAP/recibo exclusivos dos testes do supervisor, owner e portas,
mais regressões de recovery executadas contra a revisão nova. Confere os fontes
e recibos anteriores, fotografia técnica de 419 paths, ledger, sintaxe, links,
formatação dirigida e diff do escopo. Não redata as execuções históricas de 845
ou 26 casos, nem as soma como se fossem uma execução única.

O caminho completo dos testes lê o archive de runtime aprovado, usa journals
locais reais e respostas HTTP/serial sintéticas. Cobre sucesso, recusa com retirada,
upload perdido, preparação falha, fonte preexistente, concorrência, cancelamento,
ACK de handoff perdido, expiração e configuração incompleta. Não é OCR, tradução
ou renderização real, nem boot COS.

Não há comando real liberado: a função requer composição/admissões explícitas
do operador. O próximo incremento deve preparar o entrypoint operacional e seu
manifesto, preservando o orçamento de US$ 5 **total**, retirada e bloqueios de
segurança/custo. O supervisor não transforma a cotação provisória em autorização.

Maven, web, mobile e SDD não são reexecutados por esta mudança no harness privado.
O diff global alheio continua separado. Runtime, defaults desabilitados e arquivos
de performance permanecem intactos.
