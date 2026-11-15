# Sessão de página em processo — 2026-10-30

Incremento de MOB-FEAT-020/TASK-006 e revalidação de TASK-008. É código candidato,
sem nova admissão operacional, deploy, upload habilitado ou garantia de retenção.
O usuário escolheu conter I/O local, uma filha por página, sem nova rodada cloud.

## Desenho e invariantes

Com `supervised-native` e `gateway.rendering.storage-process-enabled=true`, `ProcessRenderingTaskUseCase` encaminha o job à
porta `RenderingTaskProcessPort`. O mesmo supervisor/capacidade do renderer
possui toda a sessão. A filha aplica os guards Linux e executa a orquestração
existente, com validação de original/manifestos, renderer nativo, uploads e
cleanup. Não inicia Spring, SQL, OCR ou tradução. O pai não carrega raster/FFM.
O novo opt-in é false por padrão: o caminho anterior continua disponível para
seus diagnósticos/aceites históricos. O modo `local` conserva a limitação
cooperativa anterior e rejeita a combinação com o novo opt-in habilitado.
Os cenários `session-*` do harness identificam a nova fronteira; os anteriores
não comprovam suas falhas/recursos. Essa separação preserva asserções antigas.

A fachada de persistência da filha envia somente comandos tipados ao pai.
O pai delimita job, timestamps, claim, artifacts e lease e chama os wrappers
transacionais existentes. O protocolo TSN1 contém comprimento e JSON tipado
limitado a 64 KiB por mensagem; não usa serialização Java ou tipos polimórficos.
Há limite de 128 mensagens por sessão. Stdout é exclusivo do protocolo, stderr
descartado. Arquivos e conteúdo OCR não são transferidos por esse canal.

O pai registra até duas chaves finais antes dos uploads, valida seu vencimento
e só permite complete com referências registradas após claim STARTED. Datas
originais/resultantes e recuperação de confirmação perdida continuam sob as
regras existentes. Um upload interrompido pode terminar remotamente: o locator
imutável continua necessário à varredura e não significa exclusão pontual.

O prazo monotônico integral é o menor entre o restante da retenção original e
`processDeadline`. A espera do chamador termina nesse prazo; a sinalização mata
a filha possuída e o proprietário recolhe processos e arquivos antes de liberar
capacidade. Um launcher tardio ainda é recolhido. Falha não confirmada de cleanup
mantém capacidade retida. SQL bloqueado e falha kernel/filesystem não recebem
uma promessa de término arbitrário; uma transação em andamento não é cancelada
por matar a filha. Não há storage síncrono de fallback no pai após abandono.

Staging reside em `render-sessions-v1`, 0700, com locks 0600. Lock do pai dura
pela JVM. A filha mantém lock próprio durante sua vida; reinício só recupera
sessões reconhecidas sem dono ativo. Entrada desconhecida, symlink ou identidade
incerta bloqueia nova admissão. Não se sinaliza um processo por PID persistido.

O launcher não herda ambiente/ADC/Java options. No Compute, o SDK de storage
usa a mesma identidade restrita via metadata, sem roles novas, chaves ou cópia
de credenciais. A filha antiga do codec continua sem cliente de storage.

## Persistência antes do código

- Banco: PostgreSQL continua dono dos estados e intenções; storage, dos bytes.
- BCNF: determinantes existentes de jobs e filas continuam suas PKs/chaves
  candidatas. Nenhum atributo persistido ou cópia de conteúdo é acrescentado.
- Integridade: FKs/cascade, CHECKs, unicidades, claims e CAS das leases preservados.
- Índices: somente os existentes; não há consulta global ou índice novo.
- Derivados: sem contador, cache ou fila durável alternativa. IPC é transitório.
- Migration: nenhuma. Os wrappers no pai conservam transações curtas; a filha
  não recebe conexão, repository, configuração SQL ou contexto transacional.

## Matriz de viabilidade de retenção

| Cenário | Mecanismo/dependência | Garantia e contraexemplo |
| --- | --- | --- |
| Normal | Fila, varredura e delete por geração | Ausência após sucesso, sem limite documentado de latência de sucesso |
| Delete recusado até o deadline | Retry durável, GCS disponível para delete | Gerações podem permanecer; bloqueio mantido |
| Rede perdida | Locator imutável e recuperação | Nenhuma confirmação até restabelecimento |
| Processo encerrado | Intenção SQL e varredura independente | Recuperação posterior não prova o instante absoluto |
| SQL indisponível | Locator no storage e sweep | Depende de executor/storage disponíveis; bootstrap pode impedir execução |
| Scheduler atrasado | Manutenção periódica | Execução posterior ao deadline já contradiz pontualidade |
| Reinício | Leases/locks e recuperação | Não renova deadlines; filho órfão ativo fecha admissão |
| Gerações antigas | Enumeração exata versionada e delete | Confirmação depende de list/delete bem-sucedidos para todas as gerações |

[Consistência](https://docs.cloud.google.com/storage/docs/consistency) garante
read-after-delete após sucesso. [Retries](https://docs.cloud.google.com/storage/docs/retry-strategy)
admitem erros/timeouts; [lifecycle](https://docs.cloud.google.com/storage/docs/lifecycle)
é assíncrono. Portanto, sob recusa de delete que atravesse o deadline, a garantia
exigida continua sem mecanismo viável demonstrado. Processo encerrável melhora
contenção local, não resolve essa falha remota. Não repetir a prova de uma hora.

## Verificação e limites

A evidência corrente registra comandos, hashes, gates, ambiente e pendências.
O orçamento permanece 2 CPUs/8 GiB agregado, swap zero, PIDs 64, AS pai/filha
3 GiB e scratch 512 MiB. A nova composição precisa de provas próprias; não
aumentar limites/heap nem reduzir qualidade para obter sucesso. Aprovações de
fixtures/Android continuam restritas ao que seus registros demonstram.
