# Revisão independente da ponte mobile 017 — 2026-11-01

## Escopo e verdict

Inspeção da implementação atual de envio v2, consentimento, ambiguidade,
interrupção, restauração e posse transitória da resposta no aparelho.
Foram examinados controller/hook, cancelamento local, entrega em memória,
transporte binário, widget, locale e transações SQLite relacionadas.

**Verdict: revisão final pendente dos gates gerais.** Os findings concretos
abaixo foram corrigidos durante a rodada e possuem regressões focadas
executadas. Nenhum AC ou task foi marcado completo; status, gates, coverage e
checksums não foram alterados por este reviewer. Isso não aprova pipeline
inteiro, publicação, operação cloud ou aquisição/leitura da 021.

## Findings, correções e evidência

| ID  | Risco encontrado                                                                                                     | Tratamento observado                                                                                                                                     | Evidência e limite                                                                                                      |
| --- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| M01 | Resposta entregue ao slot, mas ainda não tomada, sobrevivia a background/unmount depois de a requisição terminar     | Hook mantém o attempt dono da entrega; interrompe o dono e descarta a entrega não tomada nas saídas; geração impede publicação por dono anterior         | Regressões do hook para background/unmount/manual após handoff passaram na rodada focada                                |
| M02 | handedOff era verdadeiro antes do snapshot final; erro SQLite pós-accept deixava bytes retidos sem dono informado    | Handoff só ocorre após snapshot válido de projeto/página/tentativa; erro pós-depósito não conserva entrega não tomada                                    | Regressão de snapshot rejeitado depois da aceitação passou; a posse do buffer tomado continua com o consumidor          |
| M03 | CREATED restaurado ou tentativa legada ativa podia ficar sem ação e bloquear nova tentativa                          | Widget oferece interrupção explicitamente local para estados ativos restaurados, sem envio automático; histórico e original são preservados              | Testes do widget e quatro testes de SQLite real passaram; incluem CREATED/ACCEPTED/CANCEL_PENDING 1.0 em projeto QUEUED |
| M04 | Projeto QUEUED legado com primeira página FAILED não era aceito na execução direta nova                              | Nova execução confirmada pode transicionar QUEUED preexistente para PROCESSING, somente na aceitação direta; não cria fila nova                          | SQLite real confirmou histórico com duas tentativas, original preservado e somente a nova aceita                        |
| M05 | Um listener síncrono de abort podia dar dispose na entrega e fazer interrupt acessar slot nulo ou tocar um slot novo | Slot é capturado como owned antes do abort; sinal é exposto ao consumidor e a identidade do slot protege a troca                                         | Regressão com dispose/reserva dentro do listener passou; interrupção não zera buffer já tomado                          |
| M06 | Disclosure afirmava que diálogo não era enviado, apesar de a imagem conter texto e o OCR alimentar tradução          | Cópia nos três idiomas inclui texto visível/reconhecido e possibilidade de dados pessoais dentro da imagem; distingue chave de sete dias, cleanup e logs | Código/i18n e testes do widget inspecionados; publicação das políticas e verificação física continuam próprias          |
| M07 | Handoff 2.0 acionava automaticamente o consumidor antigo de polling/URL/ACK v1                                       | Widget só encaminha contrato 1.0 ao hook legado enquanto a 021 estiver bloqueada                                                                         | Widget foi reexecutado após essa proteção: 13 testes passaram; isso não implementa a aquisição v2                       |

A correção de falha localizada/terminais foi reconferida: a interrupção atualiza
página/tentativa sem tornar o projeto automaticamente FAILED, e preserva
READY/CANCELLED no projeto e na página. O reprocessamento da primeira página
FAILED é explícito, com nova tentativa/chave; em legado QUEUED a transição
posterior usa o estado já permitido pela 016.

## Aderência por critério — sem aceite antecipado

| Critério | Conferência nesta rodada                                                                                                            | Verificação ainda necessária para o critério completo                                                         |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| AC-001   | Disclosure/i18n expressa imagem/texto, memória, aparelho, subprocessadores, recibos e logs separados                                | Políticas vigentes/publicadas e validação operacional do disclosure                                           |
| AC-002   | Widget exige ação afirmativa; nova execução mostra aviso de novo consumo; consentimento é escopado por projeto/versão/locale        | Gates agregados e conferência final de transação/locale/versão                                                |
| AC-003   | Original físico e metadados são revalidados antes de credencial/envio; versão da política vem da constante shared                   | Conferir a regressão mais recente de metadados invalidados no gate geral e validar integração nativa          |
| AC-004   | Framing limitado, origem HTTPS, no-store e entrega tipada como não verificada; header associa original/par/operação                 | Contratos integrados com backend e gate completo; validação semântica integral da saída é da 021              |
| AC-005   | Token anônimo passa só à origem do gateway; não foi introduzida credencial privada de provider no cliente                           | Scans/build final e autorização integrada server-side; esta rodada não substitui essas provas                 |
| AC-006   | Single-flight e replay não reenviam bytes; chave/attempt existem antes da rede                                                      | Resultados atuais de reserva/concorrência/commit incerto/expiração e purge no PostgreSQL do backend           |
| AC-007   | Aceitação direta associa tentativa e mantém página PROCESSING; nenhuma READY local nasce do header/recibo                           | Commit de resultado/regiões pertence à 021; gates atuais da transação de aceitação continuam obrigatórios     |
| AC-008   | UNKNOWN reconcilia metadados sem upload; restauração CREATED/legado tem saída local explícita preservando histórico                 | Prova completa de restart/dispositivo e backend/UUIDv7; não inferir cancelamento externo de interrupção local |
| AC-009   | Abort por operação/background/unmount, geração do hook, entrega não tomada descartada e tomada sinalizada sem zerar empréstimo      | Integração com consumidor real da 021 e falhas nativas/HTTP completas                                         |
| AC-010   | Conteúdo transitório permanece em memória do cliente até consumo/dispose; erros são códigos estáveis e recibo não recupera conteúdo | Ausência de persistência de conteúdo no backend/proxy e política de logs exigem provas próprias               |
| AC-011   | Widget e cópia trilíngue foram exercitados, inclusive confirmação e interrupção explícitas                                          | Matriz física de acessibilidade, layout/foco e políticas públicas vigentes                                    |
| AC-012   | Envio limitado à primeira página; consumidor legado isolado de tentativas 2.0                                                       | A aquisição final continua separada e bloqueada até execução real da 021                                      |

A matriz registra observações e pendências; nenhuma linha equivale a AC
concluído. A última alteração de revalidação por política shared foi inspecionada
na fonte, mas não foi promovida a prova integral a partir das rodadas anteriores.

## Posse da resposta e fronteira com a 021

A 017 recebe e enquadra bytes, confere o vínculo mínimo e mantém uma única
entrega transitória. Antes de take, a ponte é responsável pelo descarte ao
abandonar o dono. Depois de take, o consumidor é responsável pela vida útil do
buffer e por dispose; interrupção sinaliza o consumidor, sem zerar memória
emprestada enquanto ele ainda a usa. Um dispose tardio não pode liberar outro
slot ou cancelar uma nova entrega.

A 021 ainda deve tomar a entrega, observar o sinal, validar SHA-256/MIME real/
dimensões/manifesto completo/vínculos, gravar e promover o arquivo privado,
efetivar resultado/regiões em SQLite e abrir o leitor uma vez. READY local e
leitura offline não foram comprovados por este handoff. O fechamento do caminho
legado evita fingir que polling v1 implementa essa aquisição.

A matriz nativa isolada de oito casos citada pelo integrador em
[volatile-native-matrix-2026-11-01.md](../../MOB-FEAT-020-visual-translation-rendering/evidence/volatile-native-matrix-2026-11-01.md)
é evidência do renderer isolado, não de providers→HTTP→mobile→commit→reader.

## Testes executados independentemente

Rodada focada de seis suites:

```text
pnpm exec jest \
  src/features/start-remote-processing/model/__tests__/startRemoteProcessing.test.ts \
  src/features/start-remote-processing/model/__tests__/useStartRemoteProcessing.test.ts \
  src/features/cancel-remote-processing/model/__tests__/cancelRemoteProcessing.test.ts \
  src/entities/remote-processing-attempt/model/__tests__/volatileDelivery.test.ts \
  src/shared/remote-gateway/__tests__/volatileTranslationTransport.test.ts \
  src/widgets/remote-processing/ui/__tests__/RemoteProcessingPanel.test.tsx \
  --runInBand --watch=false --no-cache
6 suites passed; 59 tests passed; 0 snapshots; 10.866 s
```

SQLite real (`node:sqlite`, banco em memória com schema/transações reais):

```text
pnpm exec jest src/entities/remote-processing-attempt/api/__tests__/volatileAttemptSqlite.test.ts --runInBand --watch=false --no-cache
1 suite passed; 4 tests passed; 0 snapshots; 6.591 s
```

O widget foi executado novamente depois de isolar o consumidor legado:

```text
pnpm exec jest src/widgets/remote-processing/ui/__tests__/RemoteProcessingPanel.test.tsx --runInBand --watch=false --no-cache
1 suite passed; 13 tests passed; 0 snapshots; 9.683 s
```

A última rodada repete parte da primeira; seus números não são somados como se
fossem casos distintos. Logs completos temporários desta execução:

- `/private/tmp/toonlira-volatile-mobile-017-independent-tests.log`
- `/private/tmp/toonlira-volatile-mobile-017-independent-sqlite.log`
- `/private/tmp/toonlira-volatile-mobile-017-independent-widget-final.log`

A árvore recebeu correções durante a revisão, e a fonte atual ainda passará
pelos gates gerais do integrador. Não houve deploy, chamada paga de provider,
prova física nova, alteração de runtime ou rebase de checksums por este reviewer.

## Pendências que impedem aprovação final

- Executar gates gerais e classificar os novos arquivos/evidências antes de
  renovar a referência reproduzível da árvore final.
- Rever os resultados finais de backend/UUIDv7/retirada de gravadores e ingress,
  cuja implementação continuou em paralelo.
- Encerrar a revisão por AC com o nível de evidência de cada um; não confundir
  testes focados da ponte com prova integral operacional.
- Manter 018–021 bloqueadas até a cadeia corrente satisfazer seus gates. A
  política de publicação/privacidade e a integração física continuam explícitas.
