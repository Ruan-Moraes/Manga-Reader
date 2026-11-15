# Verificação local da candidata volátil 3 — 2026-11-02

## Resultado e limites

A candidata 3 descrita neste relatório passou pela suíte completa do backend, matriz nativa e duas
execuções integradas HTTP com PostgreSQL, SDKs reais apontados para serviços
gRPC sintéticos privados e filha nativa real. Nenhum provider pago foi chamado.
A rede da prova integrada era interna, sem portas publicadas. Isso não aprova
produção, políticas publicadas, qualidade linguística de respostas reais ou
integração física do novo transporte no aparelho.

- Imagem: `sha256:cdfa2af6bd243ef707414c8f54931053d051e1bc4541dc3f553a99f1e16ccaab`.
- JAR: `521b0ab5e087b67023a8772bd9a43d0303832fb4898c950ccd97d57e6e56f9bb`.
- Manifesto ARM64/glibc: `bfe9572c3113f805c15634c8e3106b74a2b925735767424269b5e81fc46a3a58`.
- Memória total limitada a 8 GiB; swap zero, 64 PIDs e scratch de 512 MiB.
- Filha com heap de 256 MiB, fontes e codecs fixados, sem perda de qualidade
  para fazer caber os cenários aceitos.

## Prova integrada

| Rodada | Pico agregado (bytes) | pids.events | OOM/oom_kill | Arquivos regulares no scratch ao fim | Conteúdo detectado |
| --- | --- | --- | --- | --- | --- |
| 4 | 1625698304 | max 0 | 0 / 0 | 0 | 0 |
| 5 | 1800007680 | max 0 | 0 / 0 | 0 | 0 |

Cada rodada verificou: POST sem autenticação recusado antes de provider;
identidades proprietárias distintas; uma página de 80 MP até a filha consumir
pelo menos 384 MiB RSS; concorrente recusada antes de OCR; morte da filha;
recibo FAILED e página válida seguinte; resposta válida máxima com hash/MIME/
dimensões/framing; replay sem nova chamada; consulta de outro owner sem acesso;
falha OCR seguida de página válida; ausência de jobs legados. Ao fim houve
5 chamadas OCR, 4 de tradução e 5 recibos de metadados por rodada, sem URI de
conteúdo no request Vision. Logs não continham texto sintético nem bearer.

A entrada ficava somente no container cliente, sem mount de imagens no servidor.
A resposta era validada pelo cliente separado. O código de diagnóstico, o
servidor gRPC sintético e o cliente de teste não integram o JAR de produção.

As rodadas 2 e 3 da candidata anterior permanecem como contraevidência: uma
concluiu funcionalmente com EAGAIN de threads e outra falhou na página seguinte.
A correção limita executores dos SDKs a 2 threads cada e Tomcat a 8 threads,
2 ociosas, 32 conexões e backlog 16. A admissão recusa overrides maiores.
As duas rodadas novas exigem `pids.events=max 0` e ausência dos erros de threads.

## Posse e arquivos técnicos

O SIGKILL anterior deixava arquivos técnicos de fontes públicas. Cada filha
agora recebe diretório privado 0700, removido sem seguir symlinks após morte
confirmada da filha e encerramento do writer. Nenhum byte de imagem, OCR,
tradução ou manifesto é gravado pelo pipeline. Falha de cleanup conserva a
capacidade indisponível. Os testes incluem symlink externo e assets técnicos
criados antes de timeout/OOM/interrupção.

A regressão de admissão tardia falhou antes da correção (1 lançamento depois
do timeout) e passou depois (0 lançamentos). Cercas de deadline/cancelamento
são verificadas após admissão e criação do diretório, antes de clonar/iniciar
e antes de escrever o pipe. A prova não afirma apagamento físico universal da RAM.

## Matriz nativa da mesma imagem

Oito cenários / 22 renders passaram: sete destinos pequenos, PNG/JPEG/WebP de
80 MP, 12000×6666, 6666×12000, 12000×1 e 1×12000. Pico máximo agregado:
1435537408 bytes; zero OOM e arquivos de conteúdo ao fim. Comparação em JVM
separada verifica pixels fora das regiões e imagem inteira quando não há texto.
Esses fixtures sintéticos não provam a qualidade do Vision real acima de 75 MP
nem a naturalidade da tradução real.

## Gates e evidência reproduzível

`./mvnw -o -q test`, na raiz `api/`: exit 0, 2839 testes, zero falhas/erros,
114 skips opt-in/ambientais. Todos os 465 XMLs agregados foram reescritos nesta
execução; não são soma de relatórios antigos. Os opt-ins nativos acima foram
executados separadamente, sem skips, com imagem fixada.

Recibos locais na raiz do checkout, sem mídia de usuário:

- `.local/mob020-volatile-20261101/resource-fixes-candidate-3-package-20261102/`:
  pacote, teste red/green, build, hashes das fontes e identidade dos artefatos.
- `.local/mob020-volatile-20261101/http-native-integration-20261102-4/` e `-5/`:
  logs operacionais, log Maven e métricas das duas rodadas privadas.
- `.local/mob020-volatile-20261101/native-candidate-3-matrix-20261102/`:
  métricas dos oito cenários, Maven e XML/texto Surefire.
- `.local/mob020-volatile-20261101/root-tests-20261102-3/`:
  gate completo e resumo individual dos relatórios.

A inspeção combina guard de ausência dos gravadores de conteúdo no artefato,
revisão de chamadas de escrita e verificação de scratch na execução real. Não
é apresentada como rastreamento universal de syscalls, prova de infraestrutura
pública ou remoção de qualquer conteúdo eventualmente criado por versões antigas.

A evolução posterior está na [verificação da candidata 4](volatile-runtime-candidate-4-verification-2026-11-02.md).
As medições acima continuam identificadas como da candidata 3.
