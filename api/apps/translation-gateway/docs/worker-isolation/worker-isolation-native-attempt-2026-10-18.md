# Primeira execução nativa e recuperação — 2026-10-18

Continuação do [orçamento total de USD 100](worker-isolation-budget100-2026-10-18.md).
A 020 permanece **in-progress/open**, a 021 bloqueada. A tentativa não produziu
prova de montagem e não executou VM, JRE, renderer, OCR ou tradução.

## Admissão e implementação

Tooling privado em `.local/worker-isolation/mount-execute.gFflam/`
liga o ledger, preflight nativo, supervisor, journals CAS e transporte existentes
a um comando real, sem aceitar ticket JSON externo ou diretório/valor alternativo.
Fonte e revisão restrita são conferidas antes de recursos; o perfil limita-se
ao archive confiável de runtime, sem páginas de mangá ou credencial na VM.

Criação tem prazo de 12 minutos; plano e limpeza permanecem com 15 minutos.
Há limites de tentativas de I/O e recusa de segundo POST do mesmo hash.
Cancelamento do processamento não cancela automaticamente a limpeza. Uma
tentativa ambígua mantém lock e impede nova rodada.

O cenário financeiro novo usa a tabela BRL observada em 17/10 às 23:35 UTC,
ainda dentro de 24h na admissão, sem redatar referências públicas antigas.
Contempla uma hipótese de sete dias para disco/imagem, dois cores integrais por
uma hora, 1 GiB, mês assumido de 672h, margem tributária hipotética e fator 2.
**USD 2,14 é estimativa, não gasto medido nem teto aplicado pelo provider.**
Foi reservada uma única parcela local de USD 5 no ledger de USD 100; sem refund.

Antes da ativação passaram **155 testes offline**, em 11 arquivos, incluindo
quatro integrações com supervisor/CAS/nativas reais e SDK/HTTP sintéticos.
A primeira integração de cleanup usava um flag antigo da fixture após handoff;
a assertion foi corrigida para o estado do transporte efetivamente responsável,
mantendo a exigência de ausência ativa. Não se alterou produção para passar.

## O que aconteceu na nuvem

Rodada privada identificada no recibo de execução, entre **17:53 e 17:54 UTC
(14:53–14:54 de Brasília)**. Quatro GETs novos confirmaram conta/SDK/TLS, projeto,
metadados herdados vazios, imagem COS e tipo de máquina antes da reserva.

| Ação observada                      | Resultado                                                             |
| ----------------------------------- | --------------------------------------------------------------------- |
| Criar bucket privado de staging     | HTTP 200; políticas/posse conferidas pelo produtor.                   |
| Enviar archive de runtime existente | Um upload HTTP 200; readback/hash verificados.                        |
| Criar VPC exclusiva                 | HTTP 200 e operação de inserção terminal registrada.                  |
| Retirar rota padrão                 | DELETE HTTP 200; recibo confirmado durante a retirada.                |
| Avançar a subnet/discos/imagem/VM   | Não ocorreu; ciclo interrompido antes dessas criações.                |
| Limpeza inicial                     | VPC recebeu DELETE HTTP 200, mas a conclusão integral ficou pendente. |

A sessão terminou com `supervisor-recovery-required`, zero operações/helpers
locais pendentes e lock retido. Foram três tentativas POST (duas Storage/uma
Compute), 108 GETs no transporte da rodada e dois DELETEs Compute. Nenhuma
segunda tentativa de upload/criação foi disparada.

## Recuperação concluída, separada da prova

Um comando de recuperação exclusivamente GET/DELETE, com a **mesma reserva**,
reabriu os journals da rodada parada. Bundle veio do source verificado; plano
de rota foi reconstruído a partir do receipt e aceito somente porque seu hash
coincidiu com o original. Não houve adoção por nome nem alteração manual de
estado para fabricar conclusão.

O resultado foi `active-scope-retired`:

- ausência ativa de todos os recursos Compute previstos confirmada;
- rota e escopo de rede confirmados sem recurso ativo;
- objeto e bucket de staging removidos e ausência ativa confirmada;
- lock original removido somente depois dessas três confirmações.

A recuperação fez 131 requests: 129 GETs e dois DELETEs Storage com HTTP 204.
Não repetiu DELETE Compute, upload ou criação, nem consumiu reserva nova.
**Ausência ativa não significa exclusão física comprovada**: soft delete do
Storage por sete dias permanece distinto e contemplado nas hipóteses de custo.

Saldo interno após a tentativa: uma reserva de 500 centavos, carry-forward
conservador de 500 e contingência de 1.000; limite total 10.000 centavos.
Isso não é conciliação de fatura nem consumo real de USD 20.

## Finding funcional confirmado

Os caminhos selados de retirada da rota e dos recursos exigem `DONE`
imediatamente na resposta DELETE. A API do Compute é assíncrona: o retorno pode
ser `PENDING`/`RUNNING` e deve ser acompanhado por GET/wait até conclusão,
checando erros depois. Ver a
[documentação oficial de operações](https://docs.cloud.google.com/compute/docs/api/how-tos/api-requests-responses#handling_api_responses).

Dois testes novos reproduziram a lacuna sem cloud: DELETE retorna PENDING,
mas o GET posterior da mesma operação já retornaria DONE. O ciclo atual falha
nos casos de rota e recurso; **dois testes vermelhos são evidência de trabalho
pendente**, não um gate aprovado. As versões históricas e seus recibos foram
preservados; não enfraquecer a assertion ou repetir o DELETE para obter verde.

`.local/worker-isolation/mount-recover.RvimB8/pending-baseline-red.tap`
registra a reprodução. A recuperação real observou as operações como DONE sem
repetir sua mutação; isso não corrige automaticamente o executor original.

## Rastreabilidade

| Artefato privado                       | SHA-256                                                            |
| -------------------------------------- | ------------------------------------------------------------------ |
| Verificação offline anterior à criação | `7c0eee87e133e5e58293142c6866553695cecb89f0c73d668e190f5ebe0b8b15` |
| Resultado da tentativa real            | `01982727861e373f0075feb6d0ce63c4a59b0a3058a9716d05fde7d26f8894f8` |
| Resultado da recuperação real          | `36024e275149ae8e4587bb06058aeadd0ecd5272773c2c2e43478661e371fc9f` |

Planos, classes CAS, reserva, snapshots, eventos e relatórios permanecem locais
ignorados, sem tokens, corpo bruto de erro ou conteúdo OCR. A checagem limitada
de padrões de token/chave nos recibos não encontrou ocorrências; não é garantia
universal de detecção de segredos.

Não houve instalação, novo modelo, alteração de IAM/API/Termos, processamento
de imagem real, deploy, implementação mobile ou mudança dos defaults.
Fonte técnica do gateway (419 caminhos) e ledger antigo permanecem íntegros.
Maven/web/mobile/SDD não foram reexecutados nesta parcela de tooling: resultados
históricos não são reanunciados como aprovação nova.

## Próximo trabalho

Corrigir o acompanhamento de operações pendentes, com espera limitada,
cancelamento, validação de identidade/erro e **sem reenviar DELETE/POST**.
Fazer os dois regressivos passarem e revalidar o conjunto antes de outra
tentativa, com novo ID/reserva e fontes revisadas. Só depois avançar à prova de
montagem e ao worker completo; a admissão restrita não conclui nenhum deles.
