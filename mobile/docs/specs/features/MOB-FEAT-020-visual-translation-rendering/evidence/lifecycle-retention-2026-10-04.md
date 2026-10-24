# Evidência parcial — fila de ciclo de vida, 2026-10-04

Parcela da 020/TASK-006 (AC-001/005/006) e 017/TASK-017 (AC-010).
020 in-progress/open e 021 approved/blocked. Nenhuma chamada Google,
credencial, instalação de dependências, deploy ou habilitação de uploads.

## Modelagem e implementação

[Plano anterior](../../../../../../api/apps/translation-gateway/docs/lifecycle-retention.md)
conforme database-design: V7 aditiva BCNF, job_id PK/FK cascade, escopo
ORIGINAL/ALL com CHECK, timestamps e índice parcial pending. Sem texto, URLs,
chaves duplicadas, índice redundante ou contador. V1–V6 preservadas.

Transições individuais de OCR/tradução/render/cancelamento/dispatch esgotado
enfileiram a intenção na mesma transação, mediante elegibilidade sob lock.
READY/RESULT_EXPIRED com render SUCCEEDED removem somente o original;
FAILED/CANCELLED removem os objetos conhecidos. Estados ativos, inclusive
CANCEL_PENDING/RUNNING, não enfileiram exclusão. Original removido não é ACK.

Reconciliação limitada cobre históricos/crash e stale RUNNING após terminal.
Cleanup primeiro encerra stales e expira resultados, depois reconcilia/claim;
retries de delete são duráveis, SKIP LOCKED, lease cinco minutos e CAS.
Delete fora de TX, mesmo com chamador transacional, sem causa/conteúdo nos
resultados sanitizados. Commit de limpeza perdido deixa lease recuperável.
Varredura privada absoluta de uma hora e metadados de sete dias preservados.

Não fecha remoção imediata integral dos workers, upload tardio não registrado,
empacotamento do codec, caps/deadline global, profiling ou qualidade. Fila não
garante duração de delete do storage nem revogação instantânea de URL.
TASK-006/TASK-017 permanecem abertas. Nenhum runtime mobile alterado: análise
de performance mobile não aplicável, sem alegar ganho nativo por testes Java.

## Testes e inspeção

Red inicial: tipos/porta ausentes. Testes novos precederam implementação.
Aplicação: ordem de reconciliar/claim/delete/confirmar, falha de delete,
confirmação/reschedule perdidos, conclusão CAS rejeitada e representações
redigidas. Cleanup não silencia stale delete; reporta deferred sem bloquear
varredura de uma hora/retention metadata.

PostgreSQL 17: cadeia V1–V7 limpa e upgrade aditivo, CHECKs, cascade, PK/índice
parcial, preservação de ativos/RUNNING/CANCEL_PENDING, READY só original,
ACK posterior independente, falhas OCR/tradução/render/dispatch e cancelamento,
rollback conjunto, reconciliação histórica, stale cancelado, lease após crash,
CAS antigo rejeitado e claims SKIP LOCKED em conexões concorrentes.
EXPLAIN limitado mostrou Limit/LockRows e caminhos de índice existentes;
fixture pequena também foi inspecionada com seqscan desativado localmente para
confirmar disponibilidade desses caminhos, não performance de produção.

Storage local real: delete injetado falha; novo intento em um minuto remove
original sem apagar imagem/manifesto READY nem amostra reutilizável. Teste
transacional com proxy Spring confirma ausência de TX durante delete.
Fixtures sintéticas; não são evidência de operação cloud ou qualidade.

Primeira rodada falhou por contagem de índices também no schema de upgrade;
corrigido filtro public. Outra rodada encontrou OrbStack indisponível; runtime
local foi iniciado, sem mudança cloud. A validação de parâmetros do repository
usa a tradução de exceções do Spring (InvalidDataAccessApiUsageException com
causa IllegalArgumentException); asserções ajustadas, sem remover casos.

## Fotografia técnica e gates

269 arquivos técnicos do gateway, SHA-256
`ca8ca7bf4c055642c673ef394a02a8d6e2a1ec1d0d8ba5675dff7c9765463df2`.
Algoritmo preservado: paths relativos ordenados em src/scripts/openapi,
pom.xml e Terraform tf/tfvars.example, path+NUL+bytes+NUL. Docs/build/dados
privados excluídos. Checksum mobile é governança, não cobertura Java.
Hash anterior da consulta permanece fotografia histórica separada.

Maven global offline/Docker com codec nativo opt-in: exit 0; gateway 829 testes
em 69 classes, zero falhas/erros/ignorados. Contagem dos XMLs frescos após o
início 2026-10-04T15:00:16.581Z, antes de nova suíte leve. Inclui os 17 casos
PostgreSQL novos e quatro testes novos da aplicação. Native worker 10 casos
executados; não misturar quatro XMLs históricos de harness manual.

```bash
cd api
./mvnw -o -q test -Drenderer.native.enabled=true \
  -Drenderer.cwebp.path=/opt/homebrew/Cellar/webp/1.6.0/bin/cwebp \
  -Drenderer.cwebp.sha256=b31070342821b6316c756e22a336a72bbde4a6e4f2a9cabb22ffd49a73cc89cf \
  -Drenderer.dwebp.path=/opt/homebrew/Cellar/webp/1.6.0/bin/dwebp \
  -Drenderer.dwebp.sha256=0fea0ca571920dac090ca32f4e4559b5125b92e33963b314f27c6757c1c1201c
```

Caminhos são ambiente medido, não distribuição portátil de produção. Suíte
leve do gateway exit 0. Node tooling 85 pass/um opt-in de fonte não executado;
web tsc -b exit 0. pnpm check integral exit 0: 116 suítes/892 testes, 30 de
performance, 24 SDD e seis FSD; typecheck/lint/formato/links aprovados. Warnings
de act dos ícones Expo existentes não foram ocultados nem tratados como falha.
Formatação direcionada e diff-check exit 0. Rebase dos headers é mecânico,
sem renovar conclusões de outras features; SDD/links finais reexecutados após
estabilizar evidência. Nenhum gate/validador ou dependência alterado para aprovar.

Tentativa de executar Prettier via pnpm no módulo Java falhou antes do script
por ausência de package.json; nenhuma instalação foi concluída. A ferramenta
instalada do workspace mobile formatou somente os documentos listados.

Próximo trabalho funcional: remoção imediata pelos workers com retry durável,
upload tardio órfão e preservar varredura de uma hora mesmo se uma operação SQL
do cleanup falhar. Esta parcela não declara essas provas integrais concluídas.
