# Fonte verificada: saída de limpeza sem iniciar Compute

Data: 2026-10-17. Continuação da
[integração v3](worker-isolation-rejection-integration-2026-10-17.md).
020 continua `in-progress/open`; 021 bloqueada. Nenhuma instalação, credencial,
requisição cloud, upload, provider ou nova reserva financeira neste incremento.

## Fechamento da suíte anterior

A execução iniciada no incremento anterior terminou às **17:54:13 UTC**: 845
testes em 71 arquivos, sem falhas, cancelamentos, skips ou TODOs; 1.034.179 ms,
quatro arquivos concorrentes. O handle de observação já não estava disponível;
o TAP terminal e o recibo salvo após o término do processo foram conferidos,
sem reiniciar a execução. Fontes do recibo e pré-flight somente leitura também
foram reconferidos.

Recibo privado `mount-rejected-cycle.r4MCRI/verification.json`, SHA-256
`06ada8babb7570cafecb53b544a92433103495c8115b6af635e6604e51f3f29c`.
Confere 20 recibos, 148 fontes pinados, fotografia de 419 paths do gateway,
ledger existente, 173 links relativos, sintaxe, formatação e diff dirigido.
O EOF alheio de `PlatformBadge.tsx:44` continua registrado, sem correção externa.
Isso não é evidência de boot COS nem admissão operacional do renderer.

## Caso adicional e implementação

Uma fonte pode estar verificada no staging, mas ainda não ter sido entregue ao
ciclo Compute. A recuperação **parcial** anterior recusa snapshots verificados;
não enfraquecer essa condição nem representar a fonte como upload incompleto.

Novo adapter privado em `.local/worker-isolation/mount-verified-cleanup.CGPzAy/`.
O plano `design.md`, escrito antes do código com `database-design`, reutiliza os
formatos existentes; não adiciona schema PostgreSQL, migration, índice ou cache.

`createVerifiedStagingCleanup` usa o handoff v3 para validar a fonte e obter ACK
positivo do claim durável exclusivo. O assignee é **cleanup-only**, registrado
como `handoffPurpose` no resultado local; não é uma nova operação Compute ou
campo no journal histórico. Outro handoff legítimo não pode iniciar uma rodada
depois que o claim foi consumido.

O ciclo interno tem admissão de criação sempre negada. O transporte do handler
também rejeita **todo POST e todo DELETE Compute**. Somente após observar
`creation-blocked`, sem posse de ciclo, com os mesmos journals reais vazios e
fonte entregue ao hash esperado, ele chama a retirada v3. Não oferece snapshot
vazio fabricado para substituir intenções existentes.

A admissão de cleanup é separada e negada por padrão. Antes de cada DELETE
Storage, o handler reconfere a janela e o hash do snapshot exclusivo da fonte.
A retirada mantém a exigência de ausência dos oito recursos, rede/rotas vazias,
identidade e versão dos objetos, bucket sem objetos alheios e deletes condicionais.
Recurso encontrado não é adotado/apagado. Handoff prévio ou ACK perdido não
autoriza exclusão ou repetição; o caso fica para recuperação explícita.

## Cancelamento e capacidade

O teste de preparação que ignora cancelamento reproduziu uma espera indevida:
`run()` aguardava a preparação privada terminar. A observação foi separada da
quiescência, mantendo `busy` e `settled()` presos às operações reais pendentes.

O handler rastreia promessas de preparação, credencial, journals, fetch e leituras/
cancelamento do body HTTP. Cancelar pode retornar falha antes de uma porta que
ignora abort se resolver, mas não libera a capacidade ou envia requisição tardia.
Isso é verificação de portas locais; não é prova de recuperação após crash do
processo, kernel ou rede Google real.

O primeiro candidato passou em 25 testes dirigidos, mas a revisão seguinte
reproduziu uma liberação entre a entrega de um chunk e um cancelamento de body
ainda pendente. A revisão **`cleanup-v2.mjs`** mantém uma lease por toda a vida
do body, além das promessas individuais. `before-body-lease.tap` conserva o
vermelho normalizado observado pela ferramenta; o teste correspondente executa
contra v2. O código/recibo inicial (`e1628a470d4a84b4faaaeb56f9aa30aab3c1a074b880da31b1d8eca6bd47eb55`)
é histórico e não comprova essa condição adicional.

## Verificação reproduzível

```bash
node .local/worker-isolation/mount-verified-cleanup.CGPzAy/verify-v2.mjs
```

O verificador salva TAP e recibo exclusivos dos testes novos e regressões
dirigidas. Cobre sucesso, negação, concorrência, handoff anterior, ACK perdido,
recurso estranho, preparação/fetch/body tardios, expiração e drift da fonte.
Na revisão v2, cobre também o intervalo entre chunk e cancelamento; a execução
dirigida inclui 12 casos do handler e 14 regressões, sem redatar os 25 anteriores.
Usa produtor/arquivo/journals locais reais e HTTP falso; não envia mídia ou
inicializa ADC. Os 845 testes anteriores conservam sua data e escopo: não incluem
este handler e não serão somados como se fossem uma execução única.

Fontes/recibo da integração anterior, fotografia técnica e ledger são conferidos
antes/depois; os fontes novos têm hashes próprios. Links, formatação dirigida e
diff do escopo são gates locais. Maven, web, mobile e SDD não são reexecutados ou
redatados por esta alteração somente no harness privado.

## Limites e próximo trabalho

Retirada ativa não significa exclusão permanente: soft delete e faturamento
continuam separados. Fonte já entregue, resultado ambíguo e crash não são
adotados automaticamente. Não há comando real liberado por estes testes.

A composição final do supervisor ainda precisa escolher a saída apropriada por
checkpoint real (parcial, verificada sem handoff ou ciclo já entregue), sem
reupload ou segunda criação. Revisão de custo/admissão e validação nativa
continuam abertas. O limite permanece US$ 5 **total**; nenhum slot novo foi usado.
Runtime, defaults desabilitados e arquivos de performance permanecem intactos.
