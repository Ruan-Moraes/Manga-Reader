# Drift audit — MOB-FEAT-018

Data: 2026-09-27

- Implementação auditada: working-tree sha256:0197e775ac2875fd2619dc4a8a1a68162b97aa1591d460593588c2932c2d51b2
- Status: `verification-pending`; dependência 017 em `verification-pending`.
- Referência técnica gateway: checksum e algoritmo em [evidência](evidence/ocr-consolidation.md).

## Divergências e resolução

| Achado                                                              | Classificação              | Resolução                                                                                                    |
| ------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------ |
| Resumos ainda diziam seis idiomas ou nenhuma chamada real           | evidência obsoleta         | atualizados com inventário/replay; relatos datados mantidos como histórico                                   |
| Spec exigia desempate direcional inexistente no mapper              | spec divergente            | Ruan escolheu preservar Vision e aprovou a reconciliação antes desta edição; nenhuma heurística implementada |
| Faltava evidência 018 classificada e auditoria persistida           | rastreabilidade incompleta | registro sanitizado vinculado aos seis ACs no coverage e este audit                                          |
| Revisão linguística, página vazia real e operação completa ausentes | verificação externa aberta | TASK-004/005 mantidas abertas; não declarar implemented                                                      |

Não encontrada divergência funcional remanescente nos seis critérios após a
reconciliação aprovada. Layout/colunas são extensões experimentais separadas;
nenhuma aprovação exploratória delas encerra OCR ou integra tradução.

## Contadores do escopo

- `mismatch` normativo remanescente: 0.
- comportamento normativo OCR sem documentação: 0.
- arquivos runtime mobile descobertos/caminhos obsoletos: 0, conforme validador.
- violações de boundary: 0, conforme `pnpm check`.
- tasks externas abertas: 2 (`TASK-004`, `TASK-005`), com subpendências na evidência.
- alterações de runtime, schema ou configuração: 0 neste marco.
- bloqueios de processo para a transição conjunta: 0 após autorização e criação
  das tasks da 019; o bloqueio da consolidação anterior permanece no histórico.

## Decisão

A implementação executada é tecnicamente candidata a `verification-pending`
conforme MOB-DEC-003. Porém a árvore candidata falhou: `approved` com gate aberto
na 019 exige tasks, que o plano proíbe criar. O validador não foi alterado e
nenhuma task foi criada. Aplicado o fallback do plano: 018 `in-progress`, 019
`approved`/`blocked`, verdict `changes-requested` por requisito de processo.
Não é uma lacuna funcional de OCR nem aprovação linguística/operacional.
Esse foi o resultado da consolidação anterior. Na mesma data, Ruan aprovou o
plano de transição documental com as tasks. Hashes técnicos e artefatos
reconferidos, sem mudança de implementação: 018 passa a `verification-pending`,
verdict homônimo, e 019 fica `approved/open`, com sete tasks abertas e sem código.
O requisito de processo foi atendido, não removido; TASK-004/005 permanecem abertas.

Gates da transição aprovados conforme a [review](review.md): Maven offline com
Docker, type-check web, `pnpm check` integral, SDD/links, formatação direcionada
e whitespace. Hash técnico gateway preservado; tasks 019 classificadas como
governança, sem evidência fictícia ou mudança de critérios normativos.

Skills SDD aplicadas como métodos de auditoria. Os guardrails atuais e
MOB-DEC-003 prevalecem sobre trechos antigos das skills que só citam `implemented`.
Qualquer novo finding funcional exige revisão do verdict, não reclassificação
automática como benchmark pendente.
