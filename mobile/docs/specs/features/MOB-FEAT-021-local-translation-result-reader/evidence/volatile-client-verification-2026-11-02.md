# Aquisição volátil no aparelho — verificação técnica em 2026-11-02

## Contrato implementado

O consumidor toma uma única entrega da memória da 017 e conserva a posse dos
buffers até terminar validação/arquivo/SQL. Confere tentativa/operação, hash do
original antes/depois, par, tamanho, MIME/dimensões reais, SHA do WebP e manifesto
estrito. Não existe request de URL, polling de conteúdo ou ACK no consumidor,
inclusive na retomada de resultado já salvo. APIs de URL/envelope1.0 sem
consumidor foram retiradas do runtime e preservadas em `test-support/pre-volatile`
para manter os testes históricos sem exportar esse transporte ao aplicativo.

Arquivo/manifesto são escritos no cache privado e staging local, promovidos,
reverificados por hash e decode e somente depois publicados em transação
exclusiva. O writer exige contrato2.0, tentativa ACCEPTED, recibo FINISHED,
operação/página/projeto/par/dimensões corretos e fence de interrupção. Regiões,
vértices e READY são atômicos; original e demos não são sobrescritos.
Nenhuma tabela, coluna, enum ou migration foi adicionada nesta integração.

A lease do slice local serializa aquisição e reconciliação de arquivos; a
reconciliação consulta referências duráveis somente após promoção/commit/limpeza.
COMMIT ambíguo consulta o resultado durável antes de apagar. DB/I/O indisponível
preserva a cópia e permite nova resolução exclusivamente local. Rollback/ausência
confirmados removem somente os dois arquivos próprios; perda irrecuperável exige
nova execução explicitamente confirmada, sem provider automático.

## Revisão independente e regressões

O reviewer `/root/volatile_specs` encontrou duas lacunas adicionais, reproduzidas
por três testes vermelhos e corrigidas:

1. Um dono foreground retomado antes de o dono abandonado resolver COMMIT
   recebia cancelled por empréstimo. Agora aguarda a limpeza anterior e resolve
   novamente a verdade local; COMMIT confirmado abre caminho ready sem segundo
   take, commit ou chamada remota.
2. Arquivo durável comprovadamente corrompido deixava READY sem caminho seguro.
   Somente o resultado remoto da própria tentativa é invalidado; a falha local
   permite nova execução explícita. Falha indeterminada de inspeção preserva
   READY e retorna waiting para resolução local, sem invalidar dados seguros.

Outras regressões red/green cobrem writer sem recibo completo, transporte
retirado, interrupção durante vértices, marcos de progresso antes de assumir a
entrega e leitura local indisponível após COMMIT confirmado. O primeiro harness
red tinha um loop sem limite após asserções e foi encerrado pelo PID próprio;
o harness foi limitado e todas as rodadas posteriores terminaram normalmente.
Não foi encerrado nenhum aplicativo/processo de usuário.

## Matriz dos ACs

| Critério | Evidência técnica atual                                                                                                                                                          | Limite restante                                       |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| AC-001   | callback só informa recebido após take/vínculo; estado inicial -1 sem marco falso; UI somente recebido/salvo, sem fases OCR/Translate inventadas; retomada não consulta conteúdo | ciclo nativo real/restart TASK-007                    |
| AC-002   | testes controller, helper real de inspeção de WebP, hashes/decode, SQL SQLite real, rollback de vértices/interrupção, lease de reconciliação                                     | comportamento nativo dos arquivos/commit TASK-007     |
| AC-003   | claim SQL durável exatamente uma vez; hook claim antes de navigate, back/rerender; retomada de COMMIT abandonado                                                                 | navegação/ciclo físico TASK-007                       |
| AC-004   | leitor local existente revalidado, sem overlay demo em REMOTE, original/fallback sem conta/Core/gateway                                                                          | inspeção física TASK-007                              |
| AC-005   | stored result validado sem transporte, take ou identidade; reader original/fallback local                                                                                        | leitura física offline após sessão terminada TASK-007 |
| AC-006   | hash/operação/original/manifesto inválidos, bytes/tamanho/animação/dimensões reais, disco cheio/move parcial/decode, cancel, COMMIT ambíguo, corrupção e inspeção indeterminada  | falhas/disco/ciclo nativos TASK-007                   |
| AC-007   | arte-only abre sem fallback vazio, aviso localizado em três idiomas                                                                                                              | inspeção física TASK-007                              |
| AC-008   | widget/reader trilíngues, tokens e controles acessíveis existentes, erro/refresh local e nova confirmação de custo                                                               | matriz física de acessibilidade TASK-007              |

Rodada focada5: nove suites/123 testes, zero falhas; inclui testes históricos
preservados. A aceitação atual deriva dos testes do transporte2.0, não dos casos
de URL retirados. Logs red/green e checks são preservados sob `/private/tmp/`
e foram copiados com hashes para
`.local/mob020-volatile-20261101/mobile-021-verification-20261102-1/`. O gate completo e a conferência independente finais estão registrados
abaixo, sem promover a verificação física.

Não houve provider pago, mídia de usuário, habilitação pública ou deploy. Provas
Jest/SQLite/Node não comprovam Expo/fetch/arquivos/reader em aparelho; a tarefa
real continua aberta e não pode ser substituída por esses resultados.

## Gate completo e conclusão limitada

`pnpm check` rodada6 terminou exit0:128 suites/1016 testes, zero falhas, com
specs/typecheck/lint/FSD/format verdes. O reviewer independente reconferiu as
correções e não encontrou outro bloqueador concreto. TASK-001..006 executadas;
TASK-007 física permanece aberta. Status `verification-pending`, sem inferir
execução nativa de Jest ou aprovação pública.
