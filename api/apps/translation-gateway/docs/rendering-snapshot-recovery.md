# Snapshots de inspeção, deadline e recuperação — 2026-10-30

Correção de divergências reproduzidas da MOB-FEAT-020/TASK-006. Não altera a
spec, schema, migrations, prazos, qualidade, defaults, IAM ou recursos cloud.
O plano anterior ao código está preservado na rodada local
`.local/mob020-completion-20261030/restart-plan.md`.

## Reprodução e correção

Três streams sintéticos ignoravam interrupção e respondiam ao fechamento:
original, manifesto OCR e manifesto traduzido. Os três testes falharam antes
do fix. `OriginalReadDeadline` agora registra o stream ativo, interrompe o dono
e tenta fechá-lo fora do monitor do deadline. O fechamento é serializado:
o executor não retorna enquanto o timer ainda fecha o mesmo stream. Outro
teste reproduziu esse retorno prematuro antes de corrigir a sincronização.

O timer anteriormente terminava depois da aquisição dos inputs. Uma regressão
reproduziu render bloqueado além do prazo; a fase de render/uploads agora
possui timer até o mesmo deadline original, sem renovar a retenção. O renderer
supervisionado conserva seus limites próprios e a responsabilidade pela filha.

Uma primeira JVM abandonava um snapshot e encerrava; a segunda admitia uma
nova inspeção com o resíduo ainda presente. A regressão executa duas JVMs
reais e reproduziu essa falha. `MediaSnapshotDirectory` mantém um diretório
privado `translation-media-snapshots-v1` sob `java.io.tmpdir`, permissões POSIX
0700/0600 e lock exclusivo de processo. Após adquirir o lock, recupera até 64
snapshots reconhecidos por passagem antes de admitir novas inspeções. O lock
não contém conteúdo e é liberado pelo kernel ao encerrar a JVM.

Lock ocupado não autoriza excluir arquivo ativo de outra JVM. Entrada
inesperada, identidade não verificável, symlink, exclusão recusada ou temporário
legado no diretório pai mantém a admissão fechada. Legados não possuem prova
de posse e são preservados; a instância deve reciclar seu scratch privado.
Não se apaga tmp global, arquivo vizinho ou destino de symlink. O retry limitado
já existente na mesma JVM permanece responsável por falhas de exclusão ativas.

O harness Linux verifica a ausência de snapshots e demais temporários de
tradução, permitindo apenas o diretório proprietário e um `.owner.lock`
regular, não symlink, de zero bytes. O teste antigo tratava esse diretório
vazio como resíduo; sua falha foi preservada antes de ajustar o inventário.

## Limites do que foi corrigido

Fechar um stream é uma tentativa adicional de cancelamento, não prova de
terminação de um I/O arbitrário. Stream que ignora interrupção e fechamento
continua retendo sua posse até retornar; a regressão anterior permanece.
Nenhum snapshot é liberado enquanto um leitor ainda puder usá-lo.

O lock é cooperação entre processos em filesystem POSIX privado; não é uma
barreira contra um administrador ou processo hostil com a mesma identidade
privilegiada. A comparação de identidade não é uma primitiva atômica contra
esse atacante. Exclusão recusada pelo filesystem impede retenção pontual e
mantém a instância fechada; não é convertida em cleanup bem-sucedido.

Essas correções não garantem exclusão GCS até um instante absoluto. A
[consistência documentada](https://docs.cloud.google.com/storage/docs/consistency)
permite provar ausência após um delete bem-sucedido. A
[política de retries](https://docs.cloud.google.com/storage/docs/retry-strategy)
prevê falhas transitórias e timeout; o
[lifecycle](https://docs.cloud.google.com/storage/docs/lifecycle) é assíncrono.
A prova real de uma hora e os 966 ms posteriores ao deadline permanecem
registrados na evidência anterior, sem serem promovidos a aceite.

## Verificação

Regressões de aplicação, timer e reinício: 70 testes focados passaram com zero
falhas, erros ou skips, incluindo concorrência de fechamento e seis cenários
entre JVMs. Os gates globais, pacote Linux atual, hashes e profiling Android
são consolidados na
[evidência da continuação](../../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/deadline-restart-android-2026-10-30.md).
