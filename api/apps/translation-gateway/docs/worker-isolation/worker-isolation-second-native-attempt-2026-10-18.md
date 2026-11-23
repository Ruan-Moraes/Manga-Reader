# Segunda execução nativa e retirada explícita — 2026-10-18

Continuação da [correção da espera Compute](worker-isolation-operation-polling-2026-10-18.md),
sob a autorização de [USD 100 totais](worker-isolation-budget100-2026-10-18.md).
A 020 permanece `in-progress/open`, a 021 bloqueada. Não houve VM, execução
de JRE/renderer, página de mangá, OCR ou tradução nesta rodada.

## Execução real, não simulada

Rodada `mount-check-20261018-782b7c45`, entre **18:32 e 18:35 UTC**
(15:32–15:35 de Brasília). O preflight autenticado novo passou antes de uma
reserva exclusiva de 500 centavos USD. Fontes e recibo offline foram conferidos;
a tabela observada ainda estava dentro da validade de 24 horas.

O cenário de USD 2,14 continuou sendo estimativa conservadora, não gasto medido
nem teto garantido pelo Google. A chamada criou somente recursos temporários
da prova restrita, sem alterar IAM, APIs, defaults ou publicação do gateway.

| Item                             | Observação                                                                                                        |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Staging privado                  | Bucket e archive de runtime criados uma vez; readback verificado.                                                 |
| VPC e rota padrão                | VPC criada; operação de retirada da rota acompanhada até confirmação. O ponto da falha anterior foi ultrapassado. |
| Subrede e firewalls              | Inserções `DONE`, sem erro, registradas.                                                                          |
| Imagem de disco e disco de dados | Inserções `DONE`, sem erro, registradas.                                                                          |
| Disco de boot                    | Intenção local persistida, mas nenhum POST correspondente ou handle.                                              |
| VM                               | Nenhuma intenção ou POST; montagem e isolamento nativos ainda não comprovados.                                    |

O transporte contou **8 criações, 177 leituras e 1 DELETE**. Os oito POSTs
retornaram HTTP 200; não houve retry de criação. A tentativa terminou com
`supervisor-recovery-required`, sem operações/helpers nativos pendentes,
preservando seu lock. O snapshot técnico de 419 caminhos permaneceu íntegro.

## Findings novos

1. O GET real do disco omitiu `users`. ID, nome, URL e labels de posse foram
   conferidos, mas o validador de predecessor exige explicitamente `users: []`.
   A [API documenta `users` como vínculos às instâncias anexadas](https://docs.cloud.google.com/compute/docs/reference/rest/v1/disks).
   O guard falha para essa resposta sem campo; isso precisa ser corrigido no
   executor principal, não apenas no utilitário de recuperação.
2. Há uma intenção de boot sem envio. O journal conservador não permite
   exclusões enquanto qualquer inserção não tiver desfecho; não é correto
   inventar HTTP 403 ou operação `DONE` para satisfazê-lo. Falta tratamento
   normativo de criação comprovadamente não enviada, distinto de envio ambíguo.

## Retirada dos recursos

A primeira recuperação fez **14 GETs e nenhuma mutação**, parando na validação
do disco. Foi preservada integralmente. A revisão seguinte exigiu o hash desse
resultado e um novo lock exclusivo; não retomou nem sobrescreveu o primeiro.

A recuperação independente usou somente GET/DELETE, com o mesmo plano/reserva.
Conferiu todos os POSTs Compute registrados contra seus handles e comprovou
ausência do envio de boot. Duas leituras 404 e duas listas vazias pelo requestId
confirmaram ausência atual, **sem alegar um recibo terminal cloud inexistente**.
Os registros Compute originais não foram adulterados.

Cada exclusão teve intenção exclusiva/fsync, vínculo ao bundle, ID e posse
conferidos, dependências ausentes, operação acompanhada por GET e ausência
posterior verificada. `users` omitido foi aceito nessa revisão; `null`, tipo
inválido e lista não vazia continuam rejeitados. O diagnóstico real sanitizado
confirma a omissão, e um teste reproduziu a falha antes da correção restrita.

Às **18:43:24 UTC (15:43 de Brasília)**, a retirada terminou com
`active-scope-retired-with-unsent-intent-preserved`:

- disco de dados, imagem de disco, subrede, dois firewalls e VPC ausentes;
- rota e escopo confirmados ausentes;
- objeto e bucket de staging com ausência ativa confirmada;
- **198 requests: 190 GETs, 6 DELETEs Compute HTTP 200 e 2 DELETEs Storage HTTP 204**;
- nenhum POST, reserva nova ou exclusão repetida na recuperação.

O arquivo local reutilizável de runtime foi preservado. Os recursos Compute
temporários foram removidos; Storage mantém sua política de soft delete por
sete dias. **Exclusão física não foi comprovada.** O lock original permanece,
deliberadamente, impedindo outra execução até revisar o tratamento da intenção
não enviada. Isso não significa que recursos ativos dessa rodada permanecem.

## Evidências e limites

| Artefato privado                           | SHA-256                                                            |
| ------------------------------------------ | ------------------------------------------------------------------ |
| Pré-validação offline, 183/183             | `6c7423d3c589cacd2a8a35e72a0d3c0bde32f613cf3560297f27c90b09eb3f74` |
| Resultado nativo desta rodada              | `8e2e2273a39d7b6dd456538dc71b35efb0b604e6f8432cccc7a2ea5c1d6dda8c` |
| Primeira recuperação, somente leitura      | `b753196c8f1a0e78e86d6dfdf9f498b56ddb99aa8b6427ba8cb6f30ccba7285d` |
| Retirada confirmada                        | `86c7864c8f90c6657a6d352be2349ea6544998b65bcdbbf95190c281f1480d2d` |
| Verificação final, 68 artefatos e 6 testes | `3a770df52bfab8239fae63aaec6ba646bd9ab8f3d09e1bad0e794e940742b0cc` |

Tooling privado: `.local/worker-isolation/mount-poll.6ENFmK/`,
`.local/worker-isolation/mount-poll-recover.AW5Lij/` e
`.local/worker-isolation/mount-empty-users.4qkdMt/`. A verificação final revalidou
fontes, recibos, ausência registrada, preservação de intenção/lock e ledger,
sem nova chamada cloud. O scan limitado dos JSONs de captura não encontrou
padrões de token/chave; não é garantia universal contra segredos.

Existem agora **duas reservas de USD 5**; a faixa normal ainda não reservada é
USD 75, além das provisões separadas do ledger. **USD 10 reservado não é USD 10
faturado**; não houve conciliação da fatura nem refund automático.

O teste serial aprovado não explica a falha paralela anterior, que permanece
registrada. Os seis testes finais cobrem guardrails puros da recuperação, não
substituem testes completos da próxima revisão do executor. Maven, web,
mobile e SDD não foram reexecutados nesta parcela. Nenhuma instalação,
download local, alteração legal, deploy ou arquivo de performance foi realizado.

## Próximo trabalho

Fotografia posterior: o [protocolo v4](worker-isolation-unsent-journal-2026-10-18.md)
já foi integrado e consolidado offline. Ele não altera este resultado nativo,
seus journals v3 ou seus locks; a ligação ao novo operador ainda está pendente.

### Parcela posterior: normalização testada offline

A revisão em `.local/worker-isolation/mount-disk-policy.vJOwcE/` aplica a
normalização ao predecessor e à retirada no novo grafo de execução. A
reprodução inicial marcou 17/18, falhando exatamente para o campo omitido;
depois da correção passaram **19/19**, incluindo o ciclo completo com HTTP
sintético, journals CAS reais, criação, prova simulada e ausência de recursos
confirmada sem duplicar mutações. IDs, labels, origem da imagem, tamanho, tipo,
status e políticas de disco continuam sendo verificados; não se alterou o corpo.

O recibo `verification.json` tem SHA-256
`3642ace17bffe94ea8d9fbc17adab7036c6efe48d164193b07e1198c9c3b4e39`,
conferindo 17 artefatos, sintaxe, formatação, fontes anteriores e ledger
inalterado. Essa parcela não usou credenciais, não criou reserva e não chamou
cloud. A versão com essa correção **ainda não foi admitida para execução
nativa**: tratamento de inserção não enviada e gates integrais continuam abertos.

### Trabalho restante

Concluir o tratamento normativo da criação não enviada no executor, incluindo
cancelamento, crash antes/depois do envio e confirmação perdida, sem repetir
POST nem forjar rejeição. Consolidar a normalização já testada nessa revisão,
revalidar o conjunto e preservar os snapshots históricos. Revisar os locks
somente após comprovação. Só então admitir nova prova de montagem com novo
ID/reserva; não iniciar outra rodada automaticamente para contornar o bloqueio.
Montagem restrita, worker completo, segurança COS/Docker e qualidade do renderer
continuam sendo gates distintos e abertos.
