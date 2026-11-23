# Driver de criação com barreira da rota — 2026-10-15

## Resultado e escopo

Continuação do [journal de retirada da rota](worker-isolation-route-journal-2026-10-15.md).
Implementado driver local que compõe os requests canônicos, o journal Compute e
a confirmação durável da rota. A VM passa por duas verificações: **antes do claim**
e **antes de encaminhar o insert**. Testes usam journals reais de arquivo e
transporte de criação **inteiramente falso**.

Tooling privado: `.local/worker-isolation/mount-driver.BEQtOf/`. Sem consulta
Google, credencial, instalação, upload, reserva nova, Vision, tradução ou recurso
cloud. Não executa COS/worker e não altera aplicativo, migrations, mobile,
defaults ou arquivos de performance. 020 segue `in-progress/open`; 021 bloqueada.

## Entrada fechada e transições

Factory sem I/O, cujo resultado expõe somente `create(key, signal)` e `close()`.
Não expõe claim, body arbitrário ou insert. Cada key resolve um dos oito requests
reconstruídos e imutáveis do bundle; o body enviado é validado novamente. Mantém
o `createOnce` e journal históricos, sem sobrescrever seus fontes/recibos.

Antes de criar, exige plano/journals vinculados, janela válida, journal não
fechado e predecessores em DONE sem erro/targetId válido. Inserts já registrados
não são reenviados, inclusive depois de reconstruir o driver. Essa resposta
local não requer nova autorização de criação.

O bootstrap admite `routePlan=null` somente sem portas de rota e bloqueia a VM
antes de qualquer callback externo. Assim, não exige inventar um network ID antes
de criar a rede. Depois da criação e leitura reais, o chamador deverá reconstruir
o driver com o plano/recibo de rota vinculados ao ID observado; não existe troca
silenciosa de identidade no driver anterior. Essa sequência também tem regressão.

Para instance, antes do claim:

- Exige network ID igual ao da criação terminal no journal.
- Exige recibo da rota confirmado e vinculado ao bundle/plano; se houve DELETE,
  exige sent e operação DONE sem erro, com identidade consistente.
- Reconsulta rede própria, ausência da rota conhecida e listagem completa sem
  default route/routers; depois reconsulta rede/rota e estabilidade do recibo.
- Somente então delega o claim atômico ao journal existente.

Antes de chamar o transporte de insert, repete essa barreira, agora associada ao
requestId da tentativa concedida. Rota que reaparece, ID substituído, recibo
alterado, cancelamento ou admissão expirada impedem encaminhar o insert. Falha
depois do claim deixa a intenção durável: não é apagada para permitir replay,
mesmo se o callback falso não chegou a executar.

Os demais sete recursos preservam a sequência e idempotência do journal. Não
há avanço automático baseado somente em HTTP aceito: `operation-bound` significa
handle registrado; o predecessor só libera a próxima criação com terminal DONE
sem erro. O driver não transforma essa condição em aprovação de isolamento.

## Admissão não implementada em produção

A porta interna `admit` é consultada antes das ações de criação. Retorno exige
`allowed=true`, hash do bundle exato e expiração canônica ainda válida, nunca
além da janela do bundle. Sem a porta, a criação fica negada; não há fallback
para aprovação automática. Relógio é explícito, sem converter a data das fixtures
em tempo real.

Dois testes vermelhos mostraram que uma admissão curta poderia vencer durante
as consultas. Corrigido: a validade daquela decisão é conferida novamente
imediatamente antes do claim e do encaminhamento, não só ao recebê-la.

**Nos testes essa porta é falsa.** O formato não prova billing, reserva, preço,
COS ou autoridade por si mesmo. Não existe adapter operacional que una os gates
reais a essa decisão; logo, não há nova autorização cloud. O bundle preserva
`executable=false` e todos os resultados `operationalApproved=false`.

Cada chamada tem prazo máximo de 30 segundos, sinais propagados e checks após
awaits. Close interrompe chamadas ativas; uma decisão tardia não gera claim ou
envio. Retorno de dependência/erro bruto não entra no resultado. A vida útil de
clientes externos continua pertencendo ao chamador; o driver não fecha clientes
compartilhados arbitrariamente.

## Concorrência e limites de segurança

Dois drivers concorrentes compartilham a concessão única do journal. A barreira
não gera um segundo insert por timeout, resposta perdida ou reabertura. O envio
por callback usa o mesmo requestId concedido e o body canônico.

Isso não é prova de compare-and-create no Google: consultas, transação local e
efeito cloud não são uma transação distribuída. Mudanças por outros operadores
após o último GET continuam exigindo controle exclusivo da rodada. A rota e o
firewall não foram reclassificados como isolamento aprovado.

O helper histórico `createOnce` ainda existe como artefato anterior, **não como
entrada cloud aprovada**. Esta entrega testa a barreira no novo driver; não alega
impedir que código arbitrário fora dele invoque APIs. Um futuro executor deverá
usar exclusivamente o driver e mutadores HTTP vinculados aos journals/admissão.
Esses mutadores de criação ainda não foram entregues aqui.

A retirada completa também permanece no módulo anterior. Este driver não
modifica a ordem de cleanup nem apresenta a integração de retirada da rota com
todo o ciclo de teardown como concluída.

## Testes e rastreabilidade

```bash
node --test .local/worker-isolation/mount-driver.BEQtOf/driver.test.mjs
```

Testes escritos antes do módulo; fixtures contêm versões/IDs sintéticos e
relógio lógico. Exercitam journals Compute e rota duráveis com o Java existente,
sem banco, Docker ou SDK Google. Compilação em diretório temporário próprio,
removido ao terminar, sem instalar ou copiar JRE/RAW/archive.

Cobertura: confirmação/fresh reads, rota reaparecendo após claim, target conhecido
que deixa de estar ausente, troca de rede, concorrência/restart, ordem, seal,
bodies canônicos, ausência/expiração/hash de admissão, mudança do recibo, operação
pendente mascarada por flag, erro bruto, cancelamento e conclusão tardia.

| Artefato privado | SHA-256                                                            |
| ---------------- | ------------------------------------------------------------------ |
| `driver.mjs`     | `462cae0554bbfbd2e5830d8ca7a9db3ae5ba956f56e73e7d6c386d88ee47d0fe` |

O fechamento em `verification.json` revalida fontes/recibos anteriores, ledger,
suíte conjunta, links, sintaxe, formatação e diff direcionados. Gates globais do
aplicativo não são redatados sem mudanças nessas superfícies.

## Próximo trabalho

Preparar os mutadores HTTP de criação vinculados ao journal, a integração de
retirada completa e o adapter de admissão real. Revisão COS limitada à montagem e
cotação/reserva completas continuam obrigatórias antes da rodada cloud.

Nenhum novo slot foi consumido; limite autorizado total de US$ 5 inalterado.
Não há teto de cobrança configurado pelo provedor ou nova conferência de fatura.

## Fechamento observado

Suíte conjunta: **513 testes aprovados**, zero falhas, cancelamentos ou skips;
21 casos novos. Os inserts desta parcela são callbacks falsos; journals e
compilação Java são locais. A janela de admissão que venceu durante a consulta
e o bootstrap sem ID conhecido tiveram testes vermelhos antes das correções.

Conferidos 143 links relativos, sintaxe, Prettier direcionado e diff-check dos
documentos afetados. O diff-check global mantém somente o finding alheio em
`web/landing-page/src/shared/component/PlatformBadge.tsx:44`, linha vazia no EOF.
Maven/web/mobile/SDD não foram reexecutados ou tiveram evidências redatadas.

Fotografia técnica preservada: 419 paths/bytes do gateway, SHA-256
`1925cc08e68adbe5a5768f1077f1f25995d8da438f02b7dcdcc45ea233acf82a`.
Não cobre Dockerfile, mobile, documentação, tooling privado ou aprovação do host.
Recibos anteriores e ledger de duas reservas íntegros; sem novo slot, instalação
ou cópia de archive/JRE/RAW. O Mac mantém aproximadamente 23 GiB livres.

Cancelamento não remove uma intenção que já esteja em gravação: respostas de
bloqueio nunca devem ser usadas como prova de que o journal está vazio. A próxima
execução consulta o registro e não repete tentativa existente.

`verification.json`:
`dda244e1271b473be44eb40765bdf3ccfcae6544698e55b640328ea457fc6994`.
Fechamento acrescentado após o recibo, com nova conferência direcionada de
formatação/diff; evidências anteriores preservadas sem sobrescrita.
