# Grafo offline de escopo VM pareado — 2026-10-23 UTC

Continuação do [diagnóstico do envio da VM](worker-isolation-vm-send-diagnosis-2026-10-23.md).
A 020 permanece `in-progress/open`; a 021 permanece `approved/blocked`.
Não houve nova chamada cloud, reserva, instalação ou download.

## Seleção e integridade

O candidato foi propagado a um grafo separado de 52 módulos: seis cópias de
ancestrais reversos (`readers`, `handoff`, `supervisor`, `cleanup`, `composition`
e `runtime`) e 46 módulos compartilhados, revalidados por hash. O leitor é o
mesmo candidato do gate anterior, com imports remapeados. Os demais corpos
permanecem equivalentes aos fontes originais. O grafo não alcança o leitor
anterior nem o pin COS depreciado.

Só a seleção local deste pacote mudou. O operador COS7608 encerrado continua
inalterado, sem apontar para este runtime. Importar o módulo novo não obtém
credencial, envia requisição ou concede admissão operacional.

Permanecem as fronteiras antes/depois, todos os predicados, fan-out máximo de
quatro leituras independentes, tickets, timers e ausência de retry. Não houve
mudança no runtime Java, migrations, manifesto, APIs ou defaults.

## Testes integrais locais

O gate consolidado passou **8/8**, sem falhas, skips ou cancelamentos. Exercita
o coordenador completo, CAS Java, admissão e verificação serial/fresca reais
sobre cópia privada do ledger; HTTP, identidade, preços e observações de
escopos históricos são sintéticos, não nova validação dos recursos cloud.

- Sucesso: uma criação da VM, operação vinculada e retirada simulada completa.
- HTTP 400: rejeição persistida; nenhuma repetição da criação; retirada segura.
- Confirmação do upload perdida: reconciliação/retirada, sem criação da VM.
- Verificador financeiro não serializado: continua recusado antes da VM.
- Cancelamento na verificação final, após grant: cancelamento comprovado no
  sinal real da requisição privada, nenhum POST da VM, quiescência e recuperação
  explícita exigidas. Grant selado não vira `NOT_SENT`, rejeição ou terminal.
- Resposta da criação da VM perdida: mesma operação recuperada por GET,
  sem segunda criação; vínculo e retirada simulada completos.
- Seleção exata dos módulos e import inerte são verificados separadamente.

Os testes iniciais de cancelamento foram reforçados para conferir o sinal que
chega à requisição privada. Uma exceção de assertion engolida pelo transporte
não pode se passar por evidência de cancelamento.

Conforme `database-design`, o plano financeiro precedeu o código. A fixture
copia as oito reservas atuais e altera somente a última cópia com run/plan
sintéticos. Não cria reserva no ledger original; mantém inteiros em centavos
e moeda USD. Schema, constraints, índices e derivados da aplicação não mudam.
Os hashes das reservas e os USD 40 reservados originais permaneceram iguais;
reserva não comprova consumo faturado.

## Rastreabilidade

Pacote privado: `.local/worker-isolation/mount-vm-scope-graph.hT3F7C/`.
O recibo contém fontes, TAP, grafo selecionado e integridade antes/depois.
Preserva o gate diagnóstico 13/13 e os recibos/locks/journals da rodada real.
Não reexecutar o verificador no mesmo diretório de escrita exclusiva.

| Artefato                  | SHA-256                                                            |
| ------------------------- | ------------------------------------------------------------------ |
| Gate integral local       | `bc88aa647f50ea14c97e16dfe35d7a7a16ee41df5f1e7dae5a410d2cdc770043` |
| Grafo selecionado         | `961c182b6cdc0364b3f49bf4329fe5b9b402ffc54bac87bea67d859aacc300d6` |
| Gate diagnóstico anterior | `9c1a18d8125e5e0c9436db6712c7c61e31c59fcb046a8f346d59d03f66d501d9` |

Os 419 fontes técnicos do gateway e a captura original foram novamente
reconferidos. A barreira de rede/credenciais esteve ativa nos testes. Não foi
reexecutado Maven/web/mobile neste gate local: os resultados globais anteriores
continuam [registrados como aquela fotografia](worker-isolation-cos7608-operator-2026-10-23.md#auditoria-posterior-e-gates-globais),
sem alegar nova cobertura operacional ou aprovação dos caminhos opt-in.
Arquivos de performance e demais alterações externas foram preservados.

## Restante antes de outra prova

Continuação local entregue: [diagnóstico passivo da fronteira VM](worker-isolation-vm-boundary-trace-2026-10-23.md)
distingue as fases sem alterar autoridade ou relaxar gates.
Preparar então outro operador/contexto
com seleção/pins testados, ausência dos escopos anteriores e admissão financeira
frescas. Não reutilizar a cotação vencida nem o contexto encerrado.

Este gate não comprova a causa exclusiva da falha histórica nem aprova montagem,
boot/segurança, isolamento ou worker completo na cloud. A execução seguinte
continua sujeita a esses gates; uploads e produção permanecem desabilitados.
