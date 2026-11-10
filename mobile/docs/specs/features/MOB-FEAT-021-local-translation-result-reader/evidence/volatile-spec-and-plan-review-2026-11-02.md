# Revisão independente de specs e plano 019–021 — 2026-11-02

## Escopo e fotografia

Releitura das specs correntes 019, 020 e 021, DEC-008, tasks021 e do runtime
021 em implementação pelo integrador. Não é aceite final do código, abertura
de gate ou declaração de qualidade/produção. Não houve edição de runtime,
tasks, status, coverage ou checksum pelo reviewer.

Estado conferido nesta rodada: 019 verification-pending/open; 020 approved/open;
021 in-progress/open. 026, 027 e 051 constam verification-pending. A abertura
sequencial foi registrada pelo integrador após specs:check, conforme DEC-008.
O gate da 021 não exige 020 implemented: essa dependência não consta da spec,
e esta revisão não acrescenta bloqueio implícito ou aprovação da 020.

A [proposta anterior](volatile-acquisition-proposal-2026-11-02.md) é fotografia
prévia à abertura do gate, mantida como referência. Seus estados e lacunas do
consumidor 1.0 não descrevem automaticamente o runtime depois das alterações.
O plano ativo é [tasks.md](../tasks.md); o requisito é [spec.md](../spec.md).

## Coerência das especificações

| Contrato | Intenção corrente conferida                                                                                                                                   | Limite preservado                                                                                               |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| 019      | Tradução contextual síncrona em memória, modelo global explícito, pares habilitados, IDs íntegros e orçamento completo de 30000 codepoints antes do provider. | Naturalidade, nomes, referências humanas e práticas/admissão efetivas continuam abertas.                        |
| 020      | Renderer isolado em memória, alteração limitada, fontes/codec fixados, overflow integral, resultado verificável e posse/limites até cleanup confirmado.       | ARM64 local não substitui AMD64/Compute no ambiente admitido; provas c4 não são automaticamente provas c5.      |
| 021      | Consumo direto autenticado, validação não confiável, arquivo/SQLite privados no aparelho antes de READY, auto-open persistente, original/fallback/offline.    | Jest/Node e cliente HTTP sintético não comprovam integração física Expo/aparelho, acessibilidade ou publicação. |

Não foi encontrada contradição de intenção entre os três contratos e DEC-008.
Conteúdo do servidor continua somente em memória; recibos e logs operacionais
sanitizados permanecem separados. Armazenamento local no aparelho é parte
explícita do requisito, não exceção à minimização do servidor. Nenhum contrato
corrente exige URL assinada, fila de mídia, ACK de remoção ou recuperação remota.

## Aderência do plano ativo 021

As sete tasks são derivadas dos oito ACs e registram a fronteira correta:
tasks001–005 são trabalho técnico e integração; task006 exige gates/review/
drift/coverage/checksum; task007 mantém provas físicas explícitas. Há linha
própria por AC na rastreabilidade. O plano não usa TASK007 para esconder
consumidor, validação, commit ou reader ainda ausentes.

O plano de dados reusa SQLite/tabelas/FKs/índices existentes, sem migration
presumida. A tentativa2.0 e FINISHED são pré-condições de vínculo; não significam
READY local. O commit recebe fence de interrupção, e o lease de arquivos fica
na entity, acessível por API pública. Não foram propostas importações
horizontais entre features, banco novo ou journal de conteúdo no servidor.

O tratamento previsto de COMMIT ambíguo é compatível com a spec: consultar a
verdade durável, conservar arquivo promovido enquanto o banco não permitir
resolver a publicação e remover apenas artefatos próprios após ausência/
rollback seguros. Nova execução explícita após perda irrecuperável não é retry
oculto. O texto da spec permite concluir commit a partir de arquivo local
verificado; não obriga criar journal/schema novo para recuperar todo préCOMMIT.

Na 020, TASK005 registra integração cruzada com aquisição/leitor da 021. Ela
não deve ser apresentada como prova de renderer ou de aparelho a partir de
testes isolados. TASK006 conserva explicitamente a reprodução AMD64 no envelope
admitido. Nenhuma dessas tasks foi aprovada ou eliminada por esta revisão.

## Observações do runtime 021 nesta rodada

- Controller atual consome `takeVolatileDelivery`, verifica tentativa2.0/
  FINISHED/operação, hash do original, limites, hash da imagem, manifesto,
  dimensões e par, e revalida o original antes da publicação.
- A aquisição observada não depende de identidade/transporte remoto para
  recuperar resultado já salvo e não chama URL/poll/ACK. O integrador está
  retirando também APIs antigas sem consumidor; conclusão dessa retirada e
  seus gates precisam ser conferidos na árvore final.
- Sinal do dono e sinal da entrega impedem publicação quando observados;
  buffers são liberados pelo consumidor em finally depois dos awaits de
  staging/commit/cleanup. A entrega segue take único.
- Writer exige contrato2.0/FINISHED, ACCEPTED, operação/par/dimensões e
  predicados locais compatíveis; atualiza resultado/regiões/READY na transação
  exclusiva com FKs e checks de interrupção. Não inventa modelo ausente no
  manifesto final nem converte DEMO em REMOTE.
- `withLocalTranslationResultFiles` envolve aquisição e reconcileFiles.
  A recuperação espera o dono, depois lê referências duráveis atuais; fecha
  a corrida em que LocalTranslationRecoveryGate já renderiza children antes
  de sua recuperação assíncrona terminar. Não é journal/schema novo.
- O widget usa marcos recebida/salva; stage inicial -1 não apresenta progresso
  recebido antes de possuir a entrega. READY só aparece depois do commit local.

Essas observações são inspeção da fonte em evolução, não aprovação por teste
independente da árvore final. O integrador relatou rodadas focadas anteriores;
elas não são contadas aqui como executadas pelo reviewer e não cobrem
automaticamente os findings abaixo.

## Findings concretos comunicados ao integrador

### F021-01 — P2: foreground novo pode receber término cancelado do dono anterior

Na versão observada, `run` compartilha pending por tentativa, enquanto execute
captura o AbortSignal do primeiro dono. Se background cancela A durante COMMIT
e foreground inicia B antes de A terminar, B recebe a promise antiga. Um
resultado cancelled de A também é entregue ao B ativo. O hook considera esse
estado terminal e para.

Se o COMMIT já tiver ocorrido, existe resultado local READY, mas o novo dono
não faz nova resolução local/claim. O widget depende de acquired.ready para
mostrar abertura; refresh da 017 não reinicia o hook com o mesmo attemptId.
Assim a retomada pode ficar sem abrir nem oferecer o resultado até outro
remount/evento de foreground. Isso afeta AC-001/003/006.

Correção comunicada pelo integrador: depois de esperar a execução abandonada
terminar, um waiter ainda ativo faz nova resolução local, sem roubar o dono
em voo, repetir provider ou tomar novamente uma entrega já consumida. Deve
haver regressão de COMMIT durável com foreground antes da resolução antiga,
aborto do próprio waiter e claim/navegação uma vez. A correção e os gates finais
ainda devem ser conferidos; não foi marcada resolvida por anúncio.

**Conferência posterior nesta mesma rodada:** a fonte passou a diferenciar o
waiter do dono original. O waiter ativo espera o dono terminar e, somente
quando recebe cancelled, chama nova resolução local; o dono original continua
cancelled. A regressão confirma COMMIT durável, B ready, um único take, um commit
e um dispose, sem falha artificial da tentativa. Finding fechado tecnicamente
na fonte/regressão conferidas; gate geral permanece separado.

### F021-02 — P2: arquivo salvo corrompido pode conservar READY sem ação de reparo

Na versão observada, falha de hash/ausência do arquivo de um resultado já salvo
retorna failed, mas não invalida a linha READY. failVolatileAttempt preserva
READY por desenho, logo essa chamada não libera uma nova execução. A página
pode continuar READY enquanto o widget recusa sua abertura, sem caminho coerente
de recuperação. Isso afeta AC-002/005/006.

Correção comunicada pelo integrador: usar a invalidação local existente somente
para resultado REMOTE pertencente à mesma tentativa e com corrupção/ausência
comprovadas, depois normalizar a tentativa para permitir nova execução explícita.
Não invalidar DEMO ou resultado de outra tentativa; indisponibilidade de I/O/DB
não comprova corrupção e deve manter verdade durável para resolução local.
Provar corrupção versus erro indeterminado, original preservado, ausência de
replay e caminho visível de nova execução. Ainda não foi marcado resolvido.

**Conferência posterior nesta mesma rodada:** o caminho stored passou a
reconhecer a publicação durável antes da inspeção. False de validação para seu
próprio REMOTE invalida a linha usando a API existente e permite normalizar a
tentativa; exceção de I/O preserva o resultado e retorna waiting. As regressões
verificam os dois casos e resolução posterior ready sem segundo take. Finding
fechado tecnicamente na fonte/regressões conferidas.

## Provas e retirada do transporte antigo conferidas depois das correções

O log `/private/tmp/toonlira-volatile-021-focused-20261102-5.log` termina com
9 suites/123 testes aprovados, zero snapshots. O reviewer leu o log e os casos
novos; não executou essa rodada nem a apresentou como prova física. As três
regressões novas incluem F021-01, corrupção comprovada e I/O indeterminado;
o integrador preservou a execução red antes da correção.

As APIs antigas de download limitado e envelope1.0 foram retiradas dos exports
runtime e preservadas em `test-support/pre-volatile`, com testes históricos.
A busca nas ações atuais de aquisição não encontrou `/v1/page-jobs`, ACK,
download de URL ou transporte de conteúdo remoto recuperável. URLs de origem
de resposta nos transportes shared continuam sendo verificações de redirect,
não URLs para aquisição posterior de mídia.

## Matriz AC021 e verificação restante

| AC  | Tasks coerentes | Observação técnica atual                                                              | Prova ainda necessária                                                    |
| --- | --------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 001 | 001,004         | Marcos reais e recuperação local; F021-01 fechado na fonte/regressão.                 | Gates finais e restart/perda em aparelho sem consulta de conteúdo.        |
| 002 | 001,002,003     | Bytes/manifesto, staging e transação possuem fronteiras adequadas; F021-02 fechado.   | Consolidar SQLite/arquivos/fences/COMMIT incerto e gates da árvore final. |
| 003 | 003,004         | Claim durável, verificação de sinal e retomada B depois de A abandonado.              | Gates finais e prova física de navegação/back/restart.                    |
| 004 | 004,005         | Reader remoto sem DEMO overlay, original e overflow conferidos nos testes existentes. | Gate geral e revalidação física do leitor.                                |
| 005 | 003,005,007     | Stored sem rede/recibo ativo; corrupção e I/O são distintos.                          | Leitura física offline após encerrar sessão/gateway/reiniciar.            |
| 006 | 001–004         | Posse/lease/compensação e correções dos dois findings conferidas.                     | Gates finais e falhas nativas de disco/DB/lifecycle sem sucesso falso.    |
| 007 | 005             | Testes atuais cobrem arte-only REMOTE e mensagem nos três locales.                    | Fixture vazia e ausência de fallback vazio no aparelho.                   |
| 008 | 004,005,007     | RNTL cobre ações/reader/vazio e tokens/i18n sem estágios fictícios.                   | Gate geral e matriz física de foco/leitor de tela/layout/touch targets.   |

## Arquivo mencionado pelo integrador

`remoteTranslationRegionsStorage.ts` não foi editado pelo reviewer. Foi lido
nesta revisão complementar: é helper existente de inserção de regiões dentro
da transação do chamador; não promove READY nem envia ACK. Seu contrato antigo
de manifesto traduzido é separado do writer final da resposta renderizada.
Não presumir que esse helper valida ou persiste automaticamente o handoff2.0.
O writer novo deve conservar as próprias provas de vínculo/atomicidade.

## Conclusão documental e técnica

Specs019–021 e tasks021 estão coerentes com a direção aprovada. Não é necessário
mudar intenção, adicionar schema ou eliminar gate para implementar a aquisição.
Os dois findings foram lacunas de código/teste, corrigidas com regressões, sem
necessidade de relaxar spec ou criar schema. Na continuação desta revisão não
foi encontrado outro bloqueador concreto de código na resolução examinada.

Nenhum AC ou checkbox foi concluído por este reviewer. A 021 não deve ser
promovida para verification-pending antes da consolidação por AC e dos gates
técnicos da árvore final. Com esses gates verdes, verification-pending pode
representar honestamente código pronto com provas físicas abertas. Provas
físicas podem permanecer como
tasks específicas abertas depois de código realmente pronto; implementação
ausente não pode ser reclassificada dessa forma.

Qualidade humana de OCR/tradução, reprodução AMD64/Compute e admissão/políticas
mantêm seus próprios limites e não receberam aceite nesta revisão. A revisão
também não habilita uploads/providers públicos, mídia de usuário ou deploy.
