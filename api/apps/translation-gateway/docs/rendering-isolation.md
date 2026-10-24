# Isolamento do renderer — plano incremental, 2026-10-04

Parcela técnica de TASK-002/007/008 da MOB-FEAT-020, especialmente AC-006.
Gate aberto; 020 permanece in-progress e 021 bloqueada. Não altera qualidade,
polígonos, fontes, estados, contratos HTTP ou defaults operacionais.

## Diagnóstico e direção

O adapter local atual limita simultaneidade e processos libwebp, mas executa
ImageIO, pintura e fontes na JVM do worker. Interrupção cooperativa não é
isolamento de OutOfMemoryError nem prazo global. Implementar uma JVM filha
descartável para o ciclo completo, sem Spring, providers ou credenciais.

Este incremento prepara a fronteira isolada e a exercita com processos Java
reais e codec local já disponível. Não substitui ainda o bean local do worker:
admissão Linux/artefato Boot, contenção nativa e disco exigem provas adicionais.
Não apresentar esse adapter explícito como proteção operacional já ativada.

## Contratos e propriedade

- IPC binário interno versionado/limitado, sem Java Serialization, JSON público
  ou argumentos contendo texto/job. Reconstituir pelos validadores existentes.
- Diretório exclusivo com acesso do proprietário; request e todos os temporários
  da filha permanecem nele (java.io.tmpdir). Resultado informa somente metadados
  e placements; o pai reconstrói o manifesto usando a requisição original.
- Heap da filha limitado por -Xmx; não herdar opções Java, ADC, tokens, secrets
  ou ambiente Google. Stdout/stderr descartados; nenhuma exceção bruta exposta.
- Capacidade única sem fila. Deadline monotônico cobre inicialização da filha,
  codec/fontes, decode, pintura e encode. Encerrar processos observados e esperar
  confirmação antes de liberar capacidade/limpar os arquivos.
- Transferir somente WebP verificado para o chamador; remover o diretório exato
  criado pela rodada sem seguir symlinks ou apagar diretórios compartilhados.
- Não confundir -Xmx com limite de memória nativa/RSS. Descendants é snapshot,
  não contenção atômica de uma árvore: processo/grupo/cgroup Linux e orçamento
  de disco efetivo permanecem obrigatórios antes de ativar a integração.

## Persistência

Nenhuma mudança PostgreSQL/SQLite, migration, índice ou metadado persistido.
São staging local efêmero e IPC privado, não novo banco/cache/manifesto público.
Reutilizar RenderRequest/RenderManifest/RenderPort sem mudar suas interfaces.

## Testes antes da implementação

Round-trip de todos os campos, Unicode/HTML intactos, truncamento, contagens e
tamanho/EOF; respostas inválidas; processos reais bloqueados, timeout, saída
anormal/OOME, concorrência/cancelamento, ambiente sem segredos, limpeza sem
seguir symlink e original preservado. Native opt-in comprova arquivo→JVM filha
→WebP e equivalência com o adapter existente. Nenhuma imagem ou chamada nova.

Após implementar: Maven offline/Docker, Node, web typecheck, pnpm check, SDD,
links/formato direcionado e diff. Registrar somente provas executadas;
empacotamento, profiling em volume e revisão visual continuam abertos.

## Implementação e revisão desta parcela

RenderChildSettings, RenderSubprocessProtocol, RenderJvmLauncher, RenderChildMain
e IsolatedRenderAdapter implementam a fronteira explícita. Não há bean, propriedade
nova, migration ou alteração de RenderPort. O worker continua usando o adapter
local atual quando habilitado explicitamente; seus defaults continuam disabled.

Request limitado a 8 MiB, resultado a 64 KiB e contagens validadas antes da
alocação; todos os contratos passam novamente pelos validadores existentes.
O protocolo usa UTF modificado de DataInput/DataOutput para preservar unidades
UTF-16, não um formato JSON novo. Resultado não repete texto. O pai usa o seu
RenderRequest original, verifica bytes/MIME/dimensões/hash e transfere WebP por
move atômico no mesmo filesystem. IPC é 0600 e staging 0700. O WebP recebe 0600
antes da transferência; rename não herda a permissão do arquivo placeholder.

O launcher só admite classpath plano/explodido e rejeita Boot com BOOT-INF:
não há fallback de launcher silencioso. Classe principal da filha não inicia
Spring, DB, SDK Google ou OCR/tradução. Variáveis de ambiente são removidas e
stdout/stderr descartados. java.io.tmpdir aponta para o staging individual.
Isso não é sandbox de filesystem/rede: a filha conserva as permissões do usuário
do processo, embora não inicialize providers nem receba seu ambiente sensível.
Heap configurado entre 64 e 2.048 MiB, com ExitOnOutOfMemoryError. Esses valores
são limites de preparação do processo, não política de qualidade/capabilities
nem dimensionamento aprovado para produção.

O supervisor mede nanoTime desde a admissão e encerra a filha quando o prazo
vence. Observa descendants enquanto a filha está ativa e espera a morte dos
processos observados. Fases de I/O do pai não são preemptíveis por isso; uma
varredura de descendants também não cobre atomicamente a janela fork/exit.
Kernel/grupo/cgroup e quotas de filesystem permanecem trabalho funcional aberto.
Uma terminação conhecida não confirmada mantém a capacidade indisponível, em
vez de admitir outra execução. Não prometer recuperação sem restart nesse caso.

Testes iniciais ficaram red por tipos ausentes. A primeira execução funcional
no sandbox macOS revelou sysctl negado em descendants: o finally escapava com
exceção bruta antes de encerrar a filha. Corrigido para sempre tentar encerrar
a JVM possuída, sem expor diagnóstico nativo; regressão com enumeração negada
incluída. Validação de processos reais exige execução local autorizada fora do
sandbox. Não desabilitar supervisão para fazer o teste passar.

Testes nativos usam apenas libwebp local previamente preparado e páginas/textos
sintéticos. Comparam os sete destinos pixel a pixel com a composição existente,
preservando fontes, original, regiões/ordem/texto e manifesto estrito; PNG/WebP
vazios permanecem equivalentes. Não são revisão linguística ou benchmark nos
80 milhões de pixels. Evidência e gates datados estão na
[parcela da 020](../../../../mobile/docs/specs/features/MOB-FEAT-020-visual-translation-rendering/evidence/rendering-isolation-2026-10-04.md).

## Parcela posterior — prazo do chamador, 2026-10-04

A fotografia acima é histórica. O [supervisor da chamada](rendering-call-deadline.md)
agora move launcher/IPC/validação/transferência para uma thread possuída e limita
a espera do chamador ao prazo original. Interrupção também é sinalizada fora do
chamador; capacidade só é devolvida após operação, limpeza e sinalização
confirmadas. Saída tardia é descartada, sem novo render automático. Isso não
torna I/O preemptível, não confirma morte instantânea nem contém atomicamente
processos nativos; uma execução presa continua ocupando capacidade. Nenhum
bean ou default de produção foi ativado.
