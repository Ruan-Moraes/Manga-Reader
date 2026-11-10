# Revisão independente mobile 017 — 2026-11-02

## Escopo e conclusão

Revisão da implementação mobile de consentimento, pré-condições, submissão
binária, recibos, interrupção e posse transitória da resposta contra a spec
volátil corrente. Foram relidos spec, tasks, review e a
[revisão anterior](volatile-mobile-017-review-2026-11-01.md), além dos contratos
correntes 018–021 e da DEC-008.

**Conclusão nesta fotografia: há três lacunas técnicas que precisam de correção
e regressão antes de considerar a ponte 017 tecnicamente pronta.** Elas não são
verificações físicas ou de publicação. Os testes existentes passaram, mas não
cobrem corretamente esses requisitos. O integrador foi informado e está
trabalhando nas correções; esta evidência não presume sua conclusão posterior.

A referência recebida para a árvore mobile revisada foi
`sha256:2d1a17a5111b2ffe46f7387d70b6ba290b24a1654e7698611551a1aeffbc3cf4`.
O integrador apresentou o gate completo de 126 suites/971 testes no log
`/private/tmp/toonlira-volatile-mobile-check-20261102-1.log`; o término e os
totais foram conferidos. Não foi recalculado ou renovado checksum nesta revisão.
Correções posteriores exigem novos gates/referência do integrador.

Nenhum runtime, coverage, task/AC, status ou gate foi alterado pelo reviewer.
Este documento não é aprovação de operação do backend ou do pipeline inteiro.

## Findings técnicos

### R01 — P2: cache de bearer não respeita o gateway solicitado

Em `remoteProcessingIdentity.ts`, o primeiro retorno de `getSession` reutiliza
qualquer sessão não vencida antes de verificar `gatewayKey`. A instalação
persistida já é escopada pelo gateway, mas o cache de bearer não é. A sequência
`getSession('gateway-alpha', transportA)` seguida de
`getSession('gateway-beta', transportB)` retorna a credencial de alpha para o
chamador de beta, sem consultar B. Isso viola a porta substituível e o isolamento
de autorização exigidos por AC-004/005. A origem fixa da configuração atual
limita a exposição cotidiana, mas não corrige o contrato dessa porta.

Reprodução executada sem modificar o repositório: transpile da fonte atual com
TypeScript e execução em VM, com SecureStore/transportes em memória e respostas
válidas diferentes para A/B. Resultado:

```json
{ "sameSession": true, "callsA": 2, "callsB": 0, "betaUsedAlphaCredential": true }
```

Correção necessária: guardar/verificar o gateway associado à sessão e impedir
que respostas tardias de uma geração anterior republiquem identidade depois de
limpar os dados. Testes devem cobrir troca A→B, reutilização A→A e limpeza
concorrente com registro/obtenção de sessão. Não é necessária mudança de schema
para escopar o cache: o SecureStore já contém `gatewayKey`.

### R02 — P2: reconciliação elimina o estado remoto já confirmado

Em `startRemoteProcessing.ts`, a reconciliação de recibo `STARTED` chama
`markUnknown`. Tanto `FINISHED` quanto `FAILED` chamam
`failVolatileAttempt(..., 'submission-unknown')`. Esta rotina grava
`remote_status=NULL`; o widget apresenta somente a falha de entrega local.
Assim, o usuário não distingue recibo confirmando produção do resultado de
recibo confirmando falha remota. `STARTED` também continua apresentado como
envio de estado desconhecido, sem comunicar que o recibo confirma operação
iniciada. A spec exige distinguir estado remoto conhecido, desconhecido e
interrupção local (AC-007/008/009/011).

Os testes de reconciliação existentes verificam justamente os mesmos efeitos
para `FINISHED` e `FAILED`; passarem não prova essa distinção. O vínculo do
recibo à tentativa conhecida é verificado, mas seu significado é descartado.

Correção necessária: conservar/apresentar a informação operacional sanitizada
dos três estados sem inventar etapa OCR/tradução, conteúdo recuperável ou
`READY` local. Resultado produzido e falha remota continuam deixando a entrega
local incompleta e exigindo confirmação para nova execução; `404`/falha de
consulta continuam sem confirmar o destino remoto. Cobrir controller,
persistência SQLite e cópia/widget, preservando terminais, original e histórico.
Isso é responsabilidade da 017 e não aquisição de conteúdo da 021.

### R03 — P2: bootstrap concorrente cria duas identidades da mesma instalação

Após o integrador acrescentar o escopo de gateway e a geração de R01, foi
verificada também a concorrência solicitada. Duas chamadas simultâneas a
`getSession('alpha', transport)` com SecureStore vazio leem ausência antes da
primeira escrita. Cada uma registra uma instalação diferente, grava sua
credencial e devolve um bearer distinto; somente a última instalação fica
persistida. A serialização das mutações SecureStore protege clear, mas não
compartilha a criação da identidade.

Reprodução independente por transpile/VM da fonte corrigida naquele instante,
com respostas válidas e IDs diferentes por registro:

```json
{
    "registrations": 2,
    "distinctSessions": 2,
    "sessionInstallations": ["550e8400-e29b-41d4-a716-446655440001", "550e8400-e29b-41d4-a716-446655440002"],
    "persistedInstallation": "550e8400-e29b-41d4-a716-446655440002"
}
```

Reconcile e submit usam a mesma porta de identidade e podem sobrepor chamadas
de credencial; a porta não deve depender de o hook particular serializar toda
utilização. Se uma submissão reservar recibo com a primeira instalação e a
reconciliação posterior usar a segunda, a consulta owner-scoped retorna ausência
mesmo existindo recibo válido. Não causa replay automático no controller atual,
mas perde o proprietário durável necessário à reconciliação e pode exigir nova
execução cobrada desnecessária (AC-005/006/008).

Correção limitada: compartilhar bootstrap/obtenção de sessão em voo por
gateway/geração, sem fazer clear esperar resposta de rede; preservar os fences
de geração e a serialização de mutações. Cada chamador precisa respeitar seu
próprio abort, sem um waiter abortado publicar bearer para si ou invalidar
outro waiter ainda válido. Testar duas chamadas concorrentes com banco vazio,
reuso da identidade após a primeira sessão, abort de um waiter e clear durante
o voo. Sem alteração de schema ou aquisição da 021.

## Aderência observada por AC, sem aceite

| AC     | Implementação observada e limite desta revisão                                                                                                                                                                   |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-001 | Disclosure nos três idiomas informa imagem/texto, memória, aparelho, regiões dos subprocessadores, sete dias do recibo e logs separados. Publicação/validade contratual permanecem verificações próprias.        |
| AC-002 | Ação afirmativa grava consentimento por projeto/versão/locale; nova execução abre confirmação com aviso de consumo. Não foi encontrado envio na recusa ou durante aceite interrompido.                           |
| AC-003 | Primeira página, estado, política de validação, arquivo real, MIME, dimensões, tamanho, par, capability e consentimento são revalidados antes do envio. A regressão de política inválida está na árvore testada. |
| AC-004 | Execução HTTPS binária, limites de framing, EOF obrigatório, no-store, redirect recusado e porta independente estão presentes. R01 afeta a troca segura de gateway; integração física continua separada.         |
| AC-005 | Credencial longa no SecureStore e bearer transitório, sem provider no cliente. R01 impede considerar o isolamento integralmente demonstrado. Revogação/owner no servidor exigem prova server-side.               |
| AC-006 | Attempt/chave precedem bytes; submissão single-flight e replay não reenviam. UUIDv7 deriva do timestamp da capability. Reserva/quotas/expiração/purge concorrentes são provas backend, não inferidas do Jest.    |
| AC-007 | Aceitação direta transaciona attempt e PROCESSING; não cria QUEUED nem READY. Falha é localizada, preserva terminais e aceita nova execução explícita conforme 016. R02 perde significado do recibo.             |
| AC-008 | Restart/UNKNOWN usam consulta sem upload; CREATED/contrato retirado têm saída local segura, inclusive legado QUEUED. R02 ainda impede comunicar corretamente o estado conhecido.                                 |
| AC-009 | Abort por operação/background/unmount; dono/generation do hook e sinal da entrega protegem resultados tardios. Entrega tomada só é zerada pelo consumidor. R02 afeta a distinção na interface.                   |
| AC-010 | Mobile não introduz persistência de conteúdo no servidor, e recibo não permite recuperá-lo. Ausência de disco/swap/dumps/captura no backend/proxy exige admissão operacional própria.                            |
| AC-011 | Cópia trilíngue, confirmação, interrupção e acessibilidade básica têm RNTL. R02 exige regressão de mensagens por recibo. Foco/layout/leitor de tela físicos não foram comprovados.                               |
| AC-012 | Só a primeira página é submetida; 2.0 não chega ao consumidor v1. Não há scheduler, lote, provider direto ou login Core. A aquisição 021 permanece ausente e bloqueada.                                          |

## Posse, corridas e fronteira da 021

Foram reconferidas as correções M01–M07 da revisão anterior. O hook interrompe
entrega não tomada após handoff em background/unmount; o controller só transfere
posse depois de snapshot válido e descarta no erro posterior ao depósito. O
slot capturado protege reentrância síncrona do listener de abort. Depois de
take, o consumidor conserva os buffers até dispose e recebe sinal de interrupção;
a ponte não zera memória ainda emprestada nem libera capacidade de outro dono.

O transporte exige EOF após os frames e não espera cancel/read não cooperativo
para resolver um abort local. Não foi encontrado replay automático de mídia
por timeout, reconciliação ou restauração nas rotas atuais da 017.

Não consumir a entrega v2, validar integralmente manifesto/imagem, mover arquivo
privado, efetivar resultado/regiões e abrir o leitor são código futuro da 021.
Sua ausência não deve ser mascarada com polling/URL/ACK v1 nem com progresso
simulado. A proteção atual do widget separa esses caminhos. Ativar o fluxo
público completo antes da aquisição real continuaria indevido; a revisão da
ponte, isoladamente, não autoriza isso.

## Testes executados nesta rodada

```text
pnpm exec jest \
  src/features/start-remote-processing/model/__tests__/startRemoteProcessing.test.ts \
  src/features/start-remote-processing/model/__tests__/useStartRemoteProcessing.test.ts \
  src/features/cancel-remote-processing/model/__tests__/cancelRemoteProcessing.test.ts \
  src/entities/remote-processing-attempt/model/__tests__/volatileDelivery.test.ts \
  src/shared/remote-gateway/__tests__/volatileTranslationTransport.test.ts \
  src/widgets/remote-processing/ui/__tests__/RemoteProcessingPanel.test.tsx \
  src/entities/remote-processing-attempt/api/__tests__/volatileAttemptSqlite.test.ts \
  src/entities/remote-processing-identity/model/__tests__/remoteProcessingIdentity.test.ts \
  --runInBand --watch=false --no-cache
8 suites passed; 64 tests passed; 0 snapshots; 13.383 s
```

Log: `/private/tmp/toonlira-volatile-mobile-017-independent-20261102.log`.
SQLite usa `node:sqlite` com schema e transações reais em memória, sem substituir
Expo SQLite em aparelho. A prova por VM de R01 é independente desses testes e
mostra um caso que a suíte existente não cobre. A rodada antecede as correções
anunciadas pelo integrador para R01/R02/R03.

## Specs 017–021 e DEC-008 contra a direção do usuário

Os contratos correntes permanecem coerentes com o requisito aprovado:

- 017 define consentimento novo, execução autenticada volátil, recibos sem
  conteúdo, UUIDv7 de validade absoluta e nova execução explícita;
- 018 exige OCR online inline e regiões somente na memória da sessão;
- 019 exige tradução síncrona contextual, sem persistir textos/prompts e sem
  repetir chamada paga por replay;
- 020 exige decode/render/encode/IPC em memória e entrega direta, limites,
  posse/cleanup confirmados e ausência de conteúdo em arquivos;
- 021 atribui validação e persistência privada ao aparelho antes de READY,
  leitura offline e ausência de recuperação remota;
- DEC-008 preserva logs operacionais sanitizados e recibos separados da mídia,
  esclarece expiração versus remoção física eventual e não promete que deveres
  do usuário eliminem obrigações do operador.

Não foi encontrado requisito corrente restaurando bucket, staging de mídia,
URL assinada, outbox de conteúdo ou ACK de remoção. Arquivos temporários da 021
são exclusivamente locais, e assets técnicos de JVM/fontes não são conteúdo do
usuário. As evidências do desenho anterior permanecem históricas; seus aceites
não comprovam a integração nova. Os nove links históricos corrigidos continuam
apontando para suporte de teste, sem reintroduzir o desenho produtivo anterior.

Specs/registry continuam com 017 in-progress/open e 018–021 approved/blocked.
Não foi necessário editar a intenção para acomodar os findings: a divergência
é de implementação/teste, não do requisito de privacidade.

## Pendências reais após as correções técnicas

- Conferir regressões e código final de R01/R02/R03; executar gates/referência da
  árvore corrigida antes de decidir sobre verification-pending.
- Validar transporte e lifecycle em aparelho/Expo real, inclusive rede,
  background, restart e acessibilidade/foco nos três idiomas.
- Publicar/conferir políticas, operador/contato e práticas atuais dos
  subprocessadores antes da admissão pública.
- Conferir autorização/revogação, reserva/quotas/recibos e falhas no backend
  integrado, além de ingress sem captura/spool, swap/dumps e limites efetivos.
  O backend está em correção/prova técnica de teto de PIDs e cleanup; os relatos
  de matrizes nativas isoladas não são aprovação operacional do pipeline.
- Executar a integração futura 018–021 pela cadeia de gates. Não classificar
  aquisição/validação/commit/reader ainda ausentes como mera prova física aberta.

O reviewer não abriu gates nem declarou AC completo. Esta evidência deve ser
classificada pelo integrador sem herdar aprovação da revisão anterior.
