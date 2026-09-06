# Correções de performance — primeira rodada, 2026-09-06

## Mudanças e contratos

Implementadas C01/MOB-PERF-002, C03/MOB-PERF-003 e C04/MOB-PERF-004.
Sem nova dependência, schema, migration, endpoint, texto visível ou intenção de
produto. Os gates das features 005, 015 e 017 já estão abertos. Não houve commit,
reset ou descarte de alterações anteriores do usuário.

- Leitor: mapa ID→número lógico por array de páginas, removendo busca linear por
  imagem. DOUBLE/RTL e página ímpar mantêm labels; troca do array reconstrói mapa.
- Validação: duas consultas pontuais por resultado substituem duas reidratações
  do draft. Commit por página, ordem dos erros e versão otimista preservados.
  Controller possui cópia privada inicial e aplica resultado após commit, sem
  mutar entrada congelada. API interna `updateMediaValidation` agora retorna void;
  único caller funcional atualizado. Releitura continua disponível no erro/reload.
- Gateway: `expo/fetch` já instalado fornece body em stream. Acumulação JS limitada
  ao teto configurado, interrupção no primeiro chunk excedente, cancelamento e
  liberação do reader; sem leitura via text nem buffer TextEncoder do corpo inteiro.
  O teto não promete limitar buffers internos nativos nem o tamanho de um chunk
  já entregue pelo transporte. Essa parte ainda exige profiling nativo.

## Evidência antes/depois

Tests novos falharam antes da implementação: leitor, contagem de reidratações,
retorno do comando, snapshot independente e cancelamento do stream. Após correção,
as suítes focadas passaram. São testes de mecanismo e comportamento, não FPS.

Ensaio SQL local histórico (`measure.js`, não versionado por solicitação humana).
O script usado reconstrói a versão anterior do repository pelos trechos históricos e exige SHA-256
idêntico ao inventário inicial. Executa as duas versões reais do repository em
SQLite `node:sqlite`, memória apenas. Não simula consulta com regex; migrações/SQL
são executadas pelo engine. Shim de migração serial serve apenas à instância isolada.

| Itens | Linhas materializadas antes | Depois | Chamadas de leitura antes/depois |
| ----- | --------------------------- | ------ | -------------------------------- |
| 10    | 220                         | 20     | 40 / 20                          |
| 67    | 9.112                       | 134    | 268 / 134                        |
| 200   | 80.400                      | 400    | 800 / 400                        |

Cada tamanho teve aquecimento e cinco repetições: todas iguais nas contagens,
logo mediana igual à célula e amplitude zero. Excluídos setup e reload final.
[Resultados brutos](sql-results.json) incluem hashes, query plan e validação de
rollback após falha injetada entre UPDATE do item e UPDATE do header. Consultas
pontuais usam o índice de PK existente. Sem afirmação de ganho de latência RN.

Leitor: teste com 10/67/200 páginas conta acessos indexados ao array e exige limite
linear de 8×N; baseline falhou em 67/200. Testes funcionais cobrem RTL/LTR, último
par ímpar e troca de capítulo. Viewport vertical ainda monta todos os itens.

Gateway: excedente sem header/com header menor interrompe após dois chunks de
4 bytes com teto de 6; terceiro chunk não é consumido. Testes cobrem teto exato,
UTF-8 dividido por byte, header excedente, corpo vazio, erro JSON, redirect,
timeout e abort durante leitura e escolha do transporte Expo por padrão.
O reprodutor histórico local (`reproduce.js`, não versionado) foi executado sobre
o baseline reconstruído e validado por hash; seus resultados não descrevem o código atual.

## Riscos, reversão e pendências

MOB-FEAT-015 retorna a verification-pending para repetir a validação física do
caminho de persistência alterado. A evidência Android histórica permanece histórica.
MOB-FEAT-005/017 já mantêm verificação nativa aberta. A tarefa não afirma ausência
de regressão nativa sem medições.

C02/virtualização permanece aberta: requer baseline de frames/memória e experiência
com alturas/retry/rotação antes da mudança de maior risco. C05/export permanece
aberta: ainda não há medição de payload nem estratégia validada que preserve o
cliente autenticado e o compartilhamento sem materialização integral. Hipóteses
006–011 não foram promovidas a correções sem evidência.

Reversão: C01 é independente. Em C03, reverter juntos interface, repository e
controller, sem alterar schema. C04 reverte transporte e parser juntos. Os testes
novos precisam ser mantidos como evidência ou ter a reversão explicitamente
justificada; não reverter outras mudanças locais pelo estado do Git.

## Verificação final

`pnpm check` passou (exit 0): specs, links, typecheck, lint, boundaries FSD,
format e Jest. Suíte: 95 suítes, 572 testes, zero snapshots; 19 testes novos em
relação ao baseline de 553. O tempo de runner foi 20,852 s, sem significado como
latência do app. Logs temporários: `/private/tmp/perf-fix-final-check.log`,
`/private/tmp/perf-reader-red.log`, `/private/tmp/perf-validation-red.log` e
`/private/tmp/perf-transport-red.log`; resultados essenciais registrados aqui.

[Hashes antes/depois](source-hashes.json) delimitam oito arquivos alterados nesta
rodada: quatro runtime e quatro testes. Demais fontes e dependências preservadas.
Reproduções SQL e transporte histórico foram repetidas com resultados idênticos
aos JSONs versionados. Checksums globais SDD atualizados com notas que distinguem
revisão de código de evidência física. Após fechar a documentação, repetir somente
specs/format/links, pois runtime não muda. Estado nativo: verification-pending.

Preparação dos commits: scripts avulsos de ensaio excluídos por solicitação humana. Resultados brutos e metodologia permanecem documentados; reproduzir esses ensaios exige recuperar ou reconstruir os scripts locais. Os testes de regressão do projeto continuam versionados.
